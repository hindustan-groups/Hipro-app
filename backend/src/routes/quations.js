const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⛔ FATAL: JWT_SECRET environment variable is not set. Quotation auth will fail.');
}

function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (token && JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          req.userId = decoded.id;
        }
      } catch (err) {
        // Token was invalid or expired
      }
    }
    next();
  } catch (error) {
    next();
  }
}

// GET /api/v1/quotations - List quotations (Strictly scoped by authenticated user/role)
router.get('/', authenticate, async (req, res) => {
  try {
    const { phone, userId } = req.query;
    const where = {};
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isVendor = req.user.role === 'VENDOR';

    if (isAdmin) {
      if (userId && phone) {
        where.request = {
          OR: [
            { userId },
            { user: { phoneNumber: phone } }
          ]
        };
      } else if (userId) {
        where.request = { userId };
      } else if (phone) {
        where.request = { user: { phoneNumber: phone } };
      }
    } else if (isVendor) {
      where.request = { assignedVendorId: req.user.vendorId || req.user.id };
    } else {
      // Customer: strictly see own quotations only
      where.request = { userId: req.user.id };
    }

    const quotes = await prisma.quotation.findMany({
      where,
      include: {
        request: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                photoUrl: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: quotes, total: quotes.length });
  } catch (error) {
    console.error('Fetch all quotations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quotations'
    });
  }
});

// GET /api/v1/quotations/:id - Single quotation (Protected by ownership/role)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const quote = await prisma.quotation.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { quoteNumber: req.params.id }
        ]
      },
      include: {
        request: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                photoUrl: true
              }
            }
          }
        }
      }
    });
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote Not Found' });
    }

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isOwner = quote.request && quote.request.userId === req.user.id;
    const isAssignedVendor = req.user.role === 'VENDOR' && quote.request && (
      req.user.vendorId === quote.request.assignedVendorId || req.user.id === quote.request.assignedVendorId
    );

    if (!isAdmin && !isOwner && !isAssignedVendor) {
      return res.status(403).json({ success: false, message: 'Forbidden: Access to this quotation is denied' });
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quote'
    });
  }
});

// DELETE /api/v1/quotations/:id (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.quotation.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete quotation'
    });
  }
});

// PATCH /api/v1/quotations/:id - Admin adjusts advance payment amount/percentage or terms (Admin only)
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { advancePercentage, advanceAmount, termsAndConditions, estimatedTimeline, grandtotal } = req.body;
    const existing = await prisma.quotation.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { quoteNumber: req.params.id }
        ]
      },
      include: { request: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const currentTotal = grandtotal !== undefined ? parseFloat(grandtotal) : existing.grandtotal;
    let finalAdvAmount = existing.advanceAmount;
    let finalAdvPct = existing.advancePercentage ?? 50.0;

    if (advanceAmount !== undefined) {
      finalAdvAmount = parseFloat(advanceAmount);
      finalAdvPct = currentTotal > 0 ? parseFloat(((finalAdvAmount / currentTotal) * 100).toFixed(1)) : finalAdvPct;
    } else if (advancePercentage !== undefined) {
      finalAdvPct = parseFloat(advancePercentage);
      finalAdvAmount = Math.round(currentTotal * (finalAdvPct / 100));
    }

    const updated = await prisma.quotation.update({
      where: { id: existing.id },
      data: {
        advancePercentage: finalAdvPct,
        advanceAmount: finalAdvAmount,
        ...(termsAndConditions !== undefined && { termsAndConditions }),
        ...(estimatedTimeline !== undefined && { estimatedTimeline }),
        ...(grandtotal !== undefined && { grandtotal: currentTotal })
      },
      include: {
        request: {
          include: { user: true }
        }
      }
    });

    // Notify connected clients via socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('quotation_updated', {
          id: updated.id,
          quoteNumber: updated.quoteNumber,
          advancePercentage: finalAdvPct,
          advanceAmount: finalAdvAmount,
          grandtotal: updated.grandtotal
        });
        if (updated.request && updated.request.userId) {
          io.to(`user_${updated.request.userId}`).emit('quotation_updated', {
            id: updated.id,
            quoteNumber: updated.quoteNumber,
            advancePercentage: finalAdvPct,
            advanceAmount: finalAdvAmount,
            grandtotal: updated.grandtotal
          });
        }
      }
    } catch (_) {}

    res.json({
      success: true,
      message: `Advance payment adjusted to ₹${Math.round(finalAdvAmount).toLocaleString('en-IN')} (${finalAdvPct}%)`,
      data: updated
    });
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update quotation' });
  }
});

// Helper: Verify quotation decision authorization
async function verifyQuoteDecisionAuth(quoteId, user) {
  const quote = await prisma.quotation.findFirst({
    where: {
      OR: [{ id: quoteId }, { quoteNumber: quoteId }]
    },
    include: { request: true }
  });
  if (!quote) return { error: { status: 404, message: 'Quotation not found' } };

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
  const isOwner = user && quote.request && (user.id === quote.request.userId);

  if (!isAdmin && !isOwner) {
    return { error: { status: 403, message: 'Forbidden: You cannot accept or reject this quotation' } };
  }
  return { quote };
}

// POST /api/v1/quotations/:id/decision - User accepts or rejects quotation
router.post('/:id/decision', authenticate, async (req, res) => {
  try {
    const { decision } = req.body;
    if (!decision || (decision !== 'ACCEPTED' && decision !== 'REJECTED')) {
      return res.status(400).json({ success: false, message: 'Decision must be ACCEPTED or REJECTED' });
    }

    const { quote: existing, error } = await verifyQuoteDecisionAuth(req.params.id, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const quote = await prisma.quotation.update({
      where: { id: existing.id },
      data: { status: decision },
      include: { request: true }
    });

    if (quote.requestId) {
      await prisma.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: decision }
      });
    }

    res.json({ success: true, message: `Quotation ${decision}`, data: quote });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update quotation decision'
    });
  }
});

// POST /api/v1/quotations/:id/accept - Alias for accepting quotation
router.post('/:id/accept', authenticate, async (req, res) => {
  try {
    const { quote: existing, error } = await verifyQuoteDecisionAuth(req.params.id, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const quote = await prisma.quotation.update({
      where: { id: existing.id },
      data: { status: 'ACCEPTED' },
      include: { request: true }
    });
    if (quote && quote.requestId) {
      await prisma.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: 'ACCEPTED' }
      });
    }
    res.json({ success: true, message: 'Quotation ACCEPTED', data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to accept quotation' });
  }
});

// POST /api/v1/quotations/:id/reject - Alias for rejecting quotation
router.post('/:id/reject', authenticate, async (req, res) => {
  try {
    const { quote: existing, error } = await verifyQuoteDecisionAuth(req.params.id, req.user);
    if (error) return res.status(error.status).json({ success: false, message: error.message });

    const quote = await prisma.quotation.update({
      where: { id: existing.id },
      data: { status: 'REJECTED' },
      include: { request: true }
    });
    if (quote && quote.requestId) {
      await prisma.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: 'REJECTED' }
      });
    }
    res.json({ success: true, message: 'Quotation REJECTED', data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to reject quotation' });
  }
});

// POST /api/v1/quotations - Admin creates and sends quotation to customer
// POST /api/v1/quotations - Create official quotation (Admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      requestId,
      lineItem,
      materialCost,
      laborCost,
      subtotal,
      discount,
      taxGST,
      taxRate,
      totalCost,
      grandtotal,
      advancePercentage,
      advanceAmount,
      termsAndConditions,
      estimatedTimeline,
      created_by
    } = req.body;

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const quoteNumber = `QTE-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedGrandTotal = parseFloat(grandtotal || (parseFloat(subtotal || 0) + parseFloat(taxGST || 0)));

    let finalAdvPct = 50.0;
    let finalAdvAmt = Math.round(parsedGrandTotal * 0.5);

    if (advanceAmount !== undefined && advanceAmount !== null && parseFloat(advanceAmount) > 0) {
      finalAdvAmt = parseFloat(advanceAmount);
      finalAdvPct = parsedGrandTotal > 0 ? parseFloat(((finalAdvAmt / parsedGrandTotal) * 100).toFixed(1)) : 50.0;
    } else if (advancePercentage !== undefined && advancePercentage !== null && parseFloat(advancePercentage) > 0) {
      finalAdvPct = parseFloat(advancePercentage);
      finalAdvAmt = Math.round(parsedGrandTotal * (finalAdvPct / 100));
    }

    const quotation = await prisma.quotation.create({
      data: {
        quoteNumber,
        requestId: request.id,
        status: 'PENDING',
        lineItem: lineItem || [],
        materialCost: parseFloat(materialCost || 0),
        laborCost: parseFloat(laborCost || 0),
        subtotal: parseFloat(subtotal || 0),
        discount: parseFloat(discount || 0),
        taxGST: parseFloat(taxGST || 0),
        taxRate: parseFloat(taxRate || 18),
        totalCost: parseFloat(totalCost || (parseFloat(materialCost || 0) + parseFloat(laborCost || 0))),
        grandtotal: parsedGrandTotal,
        advancePercentage: finalAdvPct,
        advanceAmount: finalAdvAmt,
        termsAndConditions: termsAndConditions || `Standard service scope applies. ${finalAdvPct}% advance (₹${finalAdvAmt.toLocaleString('en-IN')}) to start work, remaining on completion.`,
        created_by: created_by || 'Hipro Technical Admin Desk',
        estimatedTimeline: estimatedTimeline || '1-2 Working Days'
      }
    });

    // Update Request status to QUOTED
    await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: 'QUOTED' }
    });

    // Auto-generate Customer Notification with Image & Quotation Redirection Data
    try {
      const { addNotification } = require('./notifications');
      const notificationImageUrl = (request.mediaUrl && Array.isArray(request.mediaUrl) && request.mediaUrl.length > 0)
        ? request.mediaUrl[0]
        : null;

      const formattedTotal = Math.round(quotation.grandtotal || 0).toLocaleString('en-IN');
      const projectName = request.servicecode || request.propertyType || 'Waterproofing & Civil Scope';
      const projectLocation = request.addressline || request.location || 'Site Location';
      const io = req.app.get('io');

      addNotification({
        title: `🎉 Great News! Quotation Ready: ₹${formattedTotal}`,
        description: `Official estimate #${quoteNumber} for ${projectName} is ready! Includes comprehensive scope, materials & pricing breakdown. Tap to review & approve.`,
        imageUrl: notificationImageUrl,
        type: 'QUOTATION',
        referenceId: quotation.id,
        quoteNumber: quotation.quoteNumber,
        grandTotal: quotation.grandtotal,
        requestId: request.id,
        projectName,
        location: projectLocation,
        unread: true,
        timestamp: new Date().toISOString()
      }, io);
    } catch (notifErr) {
      console.error('Failed to dispatch notification for quote:', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Quotation successfully created and sent to customer!',
      data: quotation
    });
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create quotation'
    });
  }
});

module.exports = router;
