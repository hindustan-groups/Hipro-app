const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// GET /api/v1/quotations - List all quotations
router.get('/', async (req, res) => {
  try {
    const quotes = await prisma.quotation.findMany({
      include: {
        request: {
          include: {
            user: true
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

// GET /api/v1/quotations/:id
router.get('/:id', async (req, res) => {
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
            user: true
          }
        }
      }
    });
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote Not Found' });
    }
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch quote'
    });
  }
});

// DELETE /api/v1/quotations/:id
router.delete('/:id', async (req, res) => {
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

// POST /api/v1/quotations/:id/decision - User accepts or rejects quotation
router.post('/:id/decision', async (req, res) => {
  try {
    const { decision } = req.body;
    if (!decision) {
      return res.status(400).json({ success: false, message: 'Decision is required' });
    }
    const quote = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        status: decision === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED'
      },
      include: { request: true }
    });

    await prisma.serviceRequest.update({
      where: { id: quote.requestId },
      data: { status: decision === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED' }
    });

    res.json({ success: true, message: `Quotation ${decision}`, data: quote });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update quotation decision'
    });
  }
});

// POST /api/v1/quotations/:id/accept - Alias for accepting quotation
router.post('/:id/accept', async (req, res) => {
  try {
    const quote = await prisma.quotation.update({
      where: { id: req.params.id },
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
router.post('/:id/reject', async (req, res) => {
  try {
    const quote = await prisma.quotation.update({
      where: { id: req.params.id },
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
router.post('/', async (req, res) => {
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
      termsAndConditions,
      estimatedTimeline,
      created_by
    } = req.body;

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const quoteNumber = `QTE-2026-${Math.floor(1000 + Math.random() * 9000)}`;

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
        grandtotal: parseFloat(grandtotal || (parseFloat(subtotal || 0) + parseFloat(taxGST || 0))),
        termsAndConditions: termsAndConditions || 'Standard 1-year service warranty applies. 50% advance, 50% on completion.',
        created_by: created_by || 'Hipro Technical Admin Desk',
        estimatedTimeline: estimatedTimeline || '1-2 Working Days'
      }
    });

    // Update Request status to QUOTED
    await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: 'QUOTED' }
    });

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
