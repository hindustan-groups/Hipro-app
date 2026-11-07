const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⛔ FATAL: JWT_SECRET environment variable is not set. Request auth will fail.');
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
        // Token was invalid or expired, continue to phone lookup fallback
      }
    }
    next();
  } catch (error) {
    next();
  }
}

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token || !JWT_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Please login to continue'
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Session expired. Please login again'
    });
  }
}

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Strict whitelist for uploaded inspection media
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'video/mp4',
  'video/quicktime'
]);

const ALLOWED_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.pdf',
  '.mp4',
  '.mov'
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  if (ALLOWED_EXTS.has(ext) && ALLOWED_MIME_TYPES.has(mime)) {
    cb(null, true);
  } else {
    cb(new Error(`File upload rejected: Unsupported file type ${ext} (${mime}). Only images, videos, and PDFs are permitted.`));
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `damage_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }
});

// POST /api/v1/requests - Create a service request
router.post('/', authenticateUser,
  upload.array('damageImages', 10), async (req, res) => {
  try {
    const {
      servicecode,
      subServiceCode,
      issueDescription,
      propertyType,
      propertySize,
      location,
      preferredDate,
      preferredTime,
      addressline,
      status,
      customerName,
      customerPhone,
      phoneNumber
    } = req.body;

    const phone = String(customerPhone || phoneNumber || '').trim();
    const name = String(customerName || 'Customer App User').trim();

    let user = null;
    if (req.userId) {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        }
      });
    }

    // Resilient fallback: look up or create user by phone number if not found by token
    if (!user && phone) {
      user = await prisma.user.findFirst({
        where: { phoneNumber: phone },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        }
      });

      if (!user) {
        const randomSecret = crypto.randomBytes(32).toString('hex');
        const securePasswordHash = await bcrypt.hash(randomSecret, 10);
        user = await prisma.user.create({
          data: {
            name: name || "Customer App User",
            phoneNumber: phone,
            password: securePasswordHash,
            authProvider: 'phone'
          },
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          }
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please login or enter your mobile number to continue'
      });
    }

    // If user exists without phone number in database, save it if available and not in use
    if (!user.phoneNumber && phone) {
      try {
        const existingPhoneUser = await prisma.user.findFirst({
          where: { phoneNumber: phone }
        });
        if (!existingPhoneUser) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { phoneNumber: phone },
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            }
          });
        }
      } catch (err) {
        console.warn('Could not update user phone number:', err.message);
      }
    }

    if (!user.phoneNumber && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number'
      });
    }

    const baseURL = process.env.BASE_URL || 'http://localhost:5000';
    let mediaList = [];
    const rawMedia = req.body.mediaUrls || req.body.photos || req.body.mediaUrl;
    if (rawMedia) {
      if (Array.isArray(rawMedia)) {
        mediaList = rawMedia;
      } else if (typeof rawMedia === 'string') {
        try {
          const parsed = JSON.parse(rawMedia);
          mediaList = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          if (rawMedia.includes(',')) {
            mediaList = rawMedia.split(',').map(s => s.trim()).filter(Boolean);
          } else if (rawMedia.trim().length > 0) {
            mediaList = [rawMedia.trim()];
          }
        }
      }
    }
    if (mediaList.length === 0 && req.files && req.files.length > 0) {
      mediaList = req.files.map(file => `${baseURL}/uploads/${file.filename}`);
    }

    const requestNumber = `REQ-${(Date.now())+ Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = await prisma.serviceRequest.create({
      data: {
        requestNumber,
        userId: user.id,
        serviceId: req.body.serviceId || null,
        subServiceId: req.body.subServiceId || null,
        servicecode: servicecode || req.body.categoryName || req.body.categoryId || 'General Service',
        subServiceCode: subServiceCode || req.body.subServiceName || 'Site Inspection',
        issueDescription: issueDescription || 'General site inspection requested.',
        urgency: req.body.urgency || 'NORMAL',
        status: status || 'SUBMITTED',
        mediaUrl: mediaList,
        propertyType: propertyType || 'Residential',
        propertySize: propertySize || 'Standard Area',
        location: location || addressline || req.body.address || 'Bhilwara, Rajasthan',
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : null,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : null,
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        preferredTime: preferredTime || 'Morning (09:00 AM - 12:00 PM)',
        addressline: addressline || req.body.address || 'Site Address'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            photoUrl: true
          }
        },
        quotations: true
      }
    });

    // Real-Time Socket Broadcast: Notify Admin Panel safely without broadcasting customer credentials
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('new_request', {
          id: newRequest.id,
          requestNumber: newRequest.requestNumber,
          servicecode: newRequest.servicecode,
          city: newRequest.city,
          created_at: newRequest.created_at
        });
        io.emit('stats_updated');
      }
    } catch (sockErr) {
      console.warn('Socket broadcast warning:', sockErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Request Created Successfully',
      data: newRequest
    });
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Request Creation Failed'
    });
  }
});
 

router.patch('/phone', requireAuth, async (req, res) => {
  try {
    const phoneNumber = String(
      req.body.phoneNumber || ''
    ).trim();
    
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid 10-digit Indian mobile number'
      });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { phoneNumber },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Mobile number saved successfully',
      user
    });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'This mobile number is already registered'
      });
    }

    console.error('Save phone error:', error);
           
    res.status(500).json({
      success: false,
      message: 'Failed to save mobile number',
      error: error.message
    });
  }
})
// GET /api/v1/requests - Get service requests (Strictly scoped by authenticated role)
router.get('/', authenticate, async (req, res) => {
  try {
    const { phone, userId } = req.query;
    const where = {};
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isVendor = req.user.role === 'VENDOR';

    if (isAdmin) {
      if (userId) where.userId = userId;
      else if (phone) where.user = { phoneNumber: phone };
    } else if (isVendor) {
      // Vendors only see requests assigned to them
      where.assignedVendorId = req.user.vendorId || req.user.id;
    } else {
      // Customers strictly see their own requests
      where.userId = req.user.id;
    }

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        quotations: true,
        vendor: true,
        vendorQuotes: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                businessName: true,
                phone: true,
                rating: true,
                capacity: true,
                currentJobCount: true
              }
            }
          },
          orderBy: { quotePrice: 'asc' }
        },
        sharedVendors: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                businessName: true,
                phone: true,
                rating: true,
                specialization: true,
                city: true,
                capacity: true,
                currentJobCount: true,
                maxConcurrentJobs: true
              }
            }
          },
          orderBy: { sharedAt: 'desc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            photoUrl: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: requests, total: requests.length });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/v1/requests/:id - Single request (Protected by ownership/role)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id: req.params.id }, { requestNumber: req.params.id }]
      },
      include: {
        quotations: true,
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
    });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isOwner = req.user.id === request.userId;
    const isAssignedVendor = req.user.role === 'VENDOR' && (
      req.user.vendorId === request.assignedVendorId || req.user.id === request.assignedVendorId
    );

    if (!isAdmin && !isOwner && !isAssignedVendor) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this request' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/v1/requests/:id/status - Update request status (Authorized)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const request = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id: req.params.id }, { requestNumber: req.params.id }]
      }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isOwner = req.user.id === request.userId;
    const isAssignedVendor = req.user.role === 'VENDOR' && (
      req.user.vendorId === request.assignedVendorId || req.user.id === request.assignedVendorId
    );

    if (!isAdmin && !isOwner && !isAssignedVendor) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot modify this request' });
    }

    // Customers can only cancel their own request
    if (isOwner && !isAdmin && !isAssignedVendor && status !== 'CANCELLED') {
      return res.status(403).json({ success: false, message: 'Customers are only permitted to cancel requests' });
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status },
      include: {
        quotations: true,
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
    });

    // Auto-generate notification for the user based on stage advancement
    try {
      const { addNotification } = require('./notifications');
      const io = req.app.get('io');
      const reqNum = updated.requestNumber || updated.id.slice(0, 8);
      const serviceName = updated.servicecode || 'Service Request';
      const notificationImageUrl = (updated.mediaUrl && Array.isArray(updated.mediaUrl) && updated.mediaUrl.length > 0)
        ? updated.mediaUrl[0]
        : null;

      let title = `Update on Request #${reqNum}`;
      let description = `Your request status has been updated to ${status}.`;

      switch (status) {
        case 'AUDIT_SCHEDULED':
        case 'SITE_AUDIT':
          title = `📍 Physical Site Audit Scheduled (#${reqNum})`;
          description = `A senior structural engineer has been assigned for an on-site physical inspection for ${serviceName}.`;
          break;
        case 'ESTIMATING':
          title = `📋 Technical Review in Progress (#${reqNum})`;
          description = `Our engineering team is analyzing damage severity & calculating custom itemized BOQ for ${serviceName}.`;
          break;
        case 'QUOTED':
          title = `💰 Quotation Ready for Review (#${reqNum})`;
          description = `Official estimation for ${serviceName} is published! Tap to view itemized pricing & scope details.`;
          break;
        case 'ACCEPTED':
          title = `🤝 Order Confirmed & Scheduled (#${reqNum})`;
          description = `Quotation confirmed! Technical crew & specialized materials are being mobilized.`;
          break;
        case 'IN_PROGRESS':
          title = `🚀 Work in Progress on Site (#${reqNum})`;
          description = `Our certified team has commenced repairs and execution on site.`;
          break;
        case 'COMPLETED':
          title = `✅ Service Completed & Handed Over (#${reqNum})`;
          description = `Site execution and quality testing are completed. Your project has been successfully completed and handed over!`;
          break;
        case 'REJECTED':
        case 'CANCELLED':
          title = `Request Closed (#${reqNum})`;
          description = `Your service request #${reqNum} has been closed or cancelled.`;
          break;
      }

      addNotification({
        title,
        description,
        imageUrl: notificationImageUrl,
        type: 'STATUS_UPDATE',
        referenceId: updated.id,
        requestId: updated.id,
        projectName: serviceName,
        location: updated.addressline || updated.location || 'Site Location',
        unread: true,
        timestamp: new Date().toISOString()
      }, io);

      if (io) {
        io.emit('request_status_updated', {
          requestId: updated.id,
          requestNumber: updated.requestNumber,
          status: updated.status
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch status notification:', notifErr);
    }

    res.json({ success: true, message: 'Status updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/v1/requests/:id/assign - Assign Lead Engineer to Service Request (Admin only)
router.patch('/:id/assign', authenticate, requireAdmin, async (req, res) => {
  try {
    const { technicianName, technicianPhone, technicianRole } = req.body;
    if (!technicianName) {
      return res.status(400).json({ success: false, message: 'Technician/Engineer name is required' });
    }

    const reqItem = await prisma.serviceRequest.findFirst({
      where: {
        OR: [{ id: req.params.id }, { requestNumber: req.params.id }]
      }
    });

    if (!reqItem) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: reqItem.id },
      data: {
        technicianName: technicianName.trim(),
        technicianPhone: technicianPhone ? technicianPhone.trim() : null,
        technicianRole: technicianRole ? technicianRole.trim() : 'Lead Inspection Engineer'
      },
      include: {
        quotations: true,
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
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('request_updated', {
        id: updated.id,
        requestNumber: updated.requestNumber,
        technicianName: updated.technicianName,
        technicianRole: updated.technicianRole
      });
    }

    try {
      const { addNotification } = require('./notifications');
      addNotification({
        title: 'Lead Engineer Assigned',
        description: `${updated.technicianName} (${updated.technicianRole}) has been assigned for your inspection #${updated.requestNumber}.`,
        type: 'REQUEST',
        referenceId: updated.id,
        requestId: updated.id,
        requestNumber: updated.requestNumber,
        projectName: updated.servicecode || 'Site Inspection',
        location: updated.addressline || updated.location || 'Site Location',
        unread: true,
        timestamp: new Date().toISOString()
      }, io);
    } catch (notifErr) {
      console.error('Failed to dispatch engineer assignment notification:', notifErr);
    }

    res.json({ success: true, message: 'Engineer assigned successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// POST /api/v1/requests/:id/share-vendors - Multi-Vendor Request Sharing with Schema-Level Isolation
router.post('/:id/share-vendors', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorIds, notes, sharedBy } = req.body;

    if (!Array.isArray(vendorIds) || vendorIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one vendor to share this request.' });
    }

    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Inspection request not found.' });
    }

    // Upsert share record for each selected vendor
    const shareResults = [];
    for (const vId of vendorIds) {
      const record = await prisma.vendorSharedRequest.upsert({
        where: {
          requestId_vendorId: {
            requestId: id,
            vendorId: vId
          }
        },
        update: {
          notes: notes || undefined,
          sharedBy: sharedBy || 'Super Admin'
        },
        create: {
          requestId: id,
          vendorId: vId,
          notes: notes || null,
          sharedBy: sharedBy || 'Super Admin',
          status: 'PENDING'
        },
        include: { vendor: true }
      });
      shareResults.push(record);
    }

    // Advance status to QUOTE_REQUESTED if currently SUBMITTED or ESTIMATING
    let newStatus = request.status;
    if (['SUBMITTED', 'ESTIMATING'].includes((request.status || '').toUpperCase())) {
      newStatus = 'QUOTE_REQUESTED';
      await prisma.serviceRequest.update({
        where: { id },
        data: { status: 'QUOTE_REQUESTED' }
      });
    }

    // Socket real-time dispatch
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('request_shared_with_vendors', {
          requestId: id,
          requestNumber: request.requestNumber,
          sharedVendors: shareResults,
          status: newStatus
        });
        io.emit('request_status_updated', {
          requestId: id,
          requestNumber: request.requestNumber,
          status: newStatus
        });
        vendorIds.forEach(vId => {
          io.to(`vendor_${vId}`).emit('new_shared_request', {
            requestId: id,
            requestNumber: request.requestNumber,
            servicecode: request.servicecode
          });
        });
      }
    } catch (sockErr) {
      console.error('Socket share dispatch error:', sockErr);
    }

    res.json({
      success: true,
      message: `Inspection request #${request.requestNumber} shared with ${shareResults.length} vendor(s) successfully.`,
      sharedVendors: shareResults
    });
  } catch (error) {
    console.error('Share vendors error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to share request with vendors' });
  }
});

// GET /api/v1/requests/:id/shared-vendors - Fetch all vendors this request was shared with
router.get('/:id/shared-vendors', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const sharedRecords = await prisma.vendorSharedRequest.findMany({
      where: { requestId: id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            phone: true,
            city: true,
            specialization: true,
            rating: true,
            capacity: true,
            currentJobCount: true,
            maxConcurrentJobs: true
          }
        }
      },
      orderBy: { sharedAt: 'desc' }
    });

    // Check quotes submitted by these vendors
    const quotes = await prisma.vendorQuote.findMany({
      where: { requestId: id }
    });

    const quoteMap = {};
    quotes.forEach(q => { quoteMap[q.vendorId] = q; });

    const results = sharedRecords.map(s => ({
      ...s,
      quote: quoteMap[s.vendorId] || null
    }));

    res.json({ success: true, sharedVendors: results });
  } catch (error) {
    console.error('Fetch shared vendors error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/v1/requests/:id/vendor-quotes - Fetch and compare all quotations for a request
router.get('/:id/vendor-quotes', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const quotes = await prisma.vendorQuote.findMany({
      where: { requestId: id },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            phone: true,
            city: true,
            rating: true,
            capacity: true,
            experience: true
          }
        }
      },
      orderBy: { quotePrice: 'asc' }
    });

    // Highlight minimum quote
    const minPrice = quotes.length > 0 ? Math.min(...quotes.map(q => q.quotePrice)) : null;
    const annotatedQuotes = quotes.map(q => ({
      ...q,
      isLowestPrice: q.quotePrice === minPrice
    }));

    res.json({ success: true, quotes: annotatedQuotes, minPrice });
  } catch (error) {
    console.error('Fetch vendor quotes error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/v1/requests/:id/assign-vendor - Admin assigns a vendor to a request (Admin only)
router.patch('/:id/assign-vendor', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.body.vendorId || req.body.assignedVendorId;
    const vendorName = req.body.vendorName || req.body.assignedVendorName;
    const quotePrice = req.body.quotePrice ?? req.body.assignedQuotePrice;
    const assignedBy = req.body.assignedBy || 'Super Admin';

    if (!vendorId || !vendorName) {
      return res.status(400).json({ success: false, message: 'Vendor ID and vendor name are required' });
    }

    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const quoteId = req.body.quoteId;

    // Update the request with vendor assignment
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        vendorId,
        assignedVendorName: vendorName,
        assignedQuotePrice: quotePrice ? parseFloat(quotePrice) : null,
        assignedBy: assignedBy || 'Super Admin',
        status: 'ASSIGNED'
      },
      include: {
        user: true,
        vendor: true,
        quotations: true,
        vendorQuotes: true,
        sharedVendors: true
      }
    });

    // Accept chosen vendor's quote and reject competing quotes
    if (quoteId) {
      await prisma.vendorQuote.update({
        where: { id: quoteId },
        data: { status: 'accepted' }
      });
      await prisma.vendorQuote.updateMany({
        where: { requestId: id, id: { not: quoteId } },
        data: { status: 'rejected' }
      });
    } else {
      await prisma.vendorQuote.updateMany({
        where: { requestId: id, vendorId },
        data: { status: 'accepted' }
      });
      await prisma.vendorQuote.updateMany({
        where: { requestId: id, vendorId: { not: vendorId } },
        data: { status: 'rejected' }
      });
    }

    // Update VendorSharedRequest statuses
    await prisma.vendorSharedRequest.updateMany({
      where: { requestId: id, vendorId },
      data: { status: 'ASSIGNED' }
    });
    await prisma.vendorSharedRequest.updateMany({
      where: { requestId: id, vendorId: { not: vendorId } },
      data: { status: 'CLOSED' }
    });

    // Increment vendor active job count
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { currentJobCount: { increment: 1 } }
    });

    // Notify via socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('vendor_assigned', {
          requestId: id,
          requestNumber: request.requestNumber,
          vendorId,
          vendorName: vendor.name,
          businessName: vendor.businessName,
          assignedQuotePrice: quotePrice ? parseFloat(quotePrice) : null,
          assignedBy: assignedBy || 'Super Admin'
        });

        io.emit('request_status_updated', {
          requestId: id,
          requestNumber: request.requestNumber,
          status: 'ASSIGNED',
          vendorName: vendor.name,
          businessName: vendor.businessName
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch assignment notification:', notifErr);
    }

    res.json({ success: true, message: 'Vendor assigned successfully', request: updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/v1/requests/:id/share-vendor - Admin shares an inspection request with a vendor
// The vendor receives only limited, non-sensitive details: images/video, square feet and problem description.
router.patch('/:id/share-vendor', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { vendorId, vendorName, quotePrice, assignedBy, notes } = req.body;

    if (!vendorId || !vendorName) {
      return res.status(400).json({ success: false, message: 'Vendor ID and vendor name are required' });
    }

    const request = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Inspection request not found' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Multi-city guard: vendor must belong to the same city as the request
    if (request.cityId && vendor.cityId && request.cityId !== vendor.cityId) {
      return res.status(403).json({
        success: false,
        message: `Vendor is registered in ${vendor.city}, but this request belongs to ${request.city || 'another city'}. Cross-city assignment is not allowed.`
      });
    }

    // Capacity guard: vendor must not be at full concurrent job limit
    const isAtCapacity = vendor.currentJobCount >= (vendor.maxConcurrentJobs || 5);
    if (isAtCapacity) {
      return res.status(409).json({
        success: false,
        message: `Vendor ${vendor.name} is at full capacity (${vendor.currentJobCount}/${vendor.maxConcurrentJobs} jobs). Choose another vendor.`
      });
    }

    // Share the request with the vendor for bidding (Upsert VendorSharedRequest)
    // IMPORTANT: Customer contact/address and technician details are intentionally NOT shared.
    // Do NOT set vendorId or assignedVendorName on the serviceRequest, because sharing
    // an inquiry is strictly an invitation to quote, NOT awarding the job!
    await prisma.vendorSharedRequest.upsert({
      where: {
        requestId_vendorId: {
          requestId: id,
          vendorId
        }
      },
      update: {
        notes: notes || undefined,
        sharedBy: assignedBy || 'Super Admin'
      },
      create: {
        requestId: id,
        vendorId,
        notes: notes || null,
        sharedBy: assignedBy || 'Super Admin',
        status: 'PENDING'
      }
    });

    // Advance status to QUOTE_REQUESTED if currently SUBMITTED or ESTIMATING
    let nextStatus = request.status;
    if (['SUBMITTED', 'ESTIMATING'].includes((request.status || '').toUpperCase())) {
      nextStatus = 'QUOTE_REQUESTED';
    }

    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: nextStatus
      },
      include: {
        vendor: true,
        vendorQuotes: true,
        sharedVendors: true
      }
    });

    // Notify admin room and broadcast status update
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('request_shared_with_vendor', {
          requestId: id,
          requestNumber: request.requestNumber,
          vendorId,
          vendorName: vendor.name,
          businessName: vendor.businessName,
          capacity: vendor.capacity,
          assignedBy: assignedBy || 'Super Admin',
          status: 'QUOTE_REQUESTED',
        });
        io.emit('request_status_updated', {
          requestId: id,
          requestNumber: request.requestNumber,
          status: 'QUOTE_REQUESTED',
          vendorName: vendor.name,
          businessName: vendor.businessName,
        });
      }
      const { addNotification } = require('./notifications');
      await addNotification({
        title: 'Request Shared with Vendor',
        description: `Inspection request #${request.requestNumber} shared with ${vendor.name} (${vendor.businessName}) - Capacity: ${vendor.capacity}.`,
        type: 'ASSIGNMENT',
        referenceId: request.id,
        requestId: request.id,
        projectName: request.servicecode || 'Service Request',
        location: request.addressline || request.location || 'Site Location',
        unread: true,
        timestamp: new Date().toISOString()
      }, io);
    } catch (notifErr) {
      console.error('Failed to dispatch share notification:', notifErr);
    }

    res.json({
      success: true,
      message: 'Inspection request shared with vendor successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Share vendor error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to share request with vendor' });
  }
});

// DELETE /api/v1/requests/:id - Delete a request (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.serviceRequest.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT or PATCH /api/v1/requests/:id - Update an inspection request
const updateRequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Support lookup by UUID or requestNumber
    const existing = await prisma.serviceRequest.findFirst({
      where: {
        OR: [
          { id },
          { requestNumber: id }
        ]
      }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Inspection request not found'
      });
    }

    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
    const isOwner = req.user && (req.user.id === existing.userId);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify this inspection request'
      });
    }

    const {
      servicecode,
      subServiceCode,
      issueDescription,
      propertyType,
      propertySize,
      location,
      preferredDate,
      preferredTime,
      addressline,
      urgency,
      status,
      mediaUrls,
      photos
    } = req.body;

    let mediaList = [];
    if (existing.mediaUrl && Array.isArray(existing.mediaUrl)) {
      mediaList = [...existing.mediaUrl];
    }

    if (mediaUrls !== undefined) {
      if (Array.isArray(mediaUrls)) {
        mediaList = mediaUrls;
      } else if (typeof mediaUrls === 'string') {
        try {
          const parsed = JSON.parse(mediaUrls);
          if (Array.isArray(parsed)) mediaList = parsed;
          else mediaList = [mediaUrls];
        } catch (_) {
          mediaList = [mediaUrls];
        }
      }
    } else if (photos !== undefined) {
      if (Array.isArray(photos)) {
        mediaList = photos;
      } else if (typeof photos === 'string') {
        try {
          const parsed = JSON.parse(photos);
          if (Array.isArray(parsed)) mediaList = parsed;
          else mediaList = [photos];
        } catch (_) {
          mediaList = [photos];
        }
      }
    }

    // Add newly uploaded files from multer
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      for (const file of req.files) {
        mediaList.push(`${protocol}://${host}/uploads/${file.filename}`);
      }
    }

    const updateData = {};
    if (servicecode !== undefined) updateData.servicecode = servicecode;
    if (subServiceCode !== undefined) updateData.subServiceCode = subServiceCode;
    if (req.body.serviceId !== undefined) updateData.serviceId = req.body.serviceId;
    if (req.body.subServiceId !== undefined) updateData.subServiceId = req.body.subServiceId;
    if (issueDescription !== undefined) updateData.issueDescription = issueDescription;
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (propertySize !== undefined) updateData.propertySize = propertySize;
    if (location !== undefined) updateData.location = location;
    if (req.body.latitude !== undefined) updateData.latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
    if (req.body.longitude !== undefined) updateData.longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;
    if (preferredDate !== undefined) updateData.preferredDate = preferredDate;
    if (preferredTime !== undefined) updateData.preferredTime = preferredTime;
    if (addressline !== undefined) updateData.addressline = addressline;
    if (urgency !== undefined) updateData.urgency = urgency;
    if (status !== undefined) updateData.status = status;
    updateData.mediaUrl = mediaList;

    const updated = await prisma.serviceRequest.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            photoUrl: true
          }
        },
        quotations: true
      }
    });

    res.json({
      success: true,
      message: 'Inspection request updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update request'
    });
  }
};

router.put('/:id', authenticate, upload.array('damageImages', 10), updateRequestHandler);
router.patch('/:id', authenticate, upload.array('damageImages', 10), updateRequestHandler);

// ==========================================
// POST /api/v1/requests/:id/rate
// Customer rates completed service request & vendor
// ==========================================
router.post('/:id/rate', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars' });
    }

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        user: true,
        vendor: true,
        vendorQuotes: true
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Must be COMPLETED or WORK_DONE
    if (request.status !== 'COMPLETED' && request.status !== 'WORK_DONE') {
      return res.status(400).json({
        success: false,
        message: 'Rating can only be submitted after the service has been completed'
      });
    }

    // Ownership check (admin can bypass)
    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
    if (!isAdmin && req.user && request.userId && request.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to rate this request' });
    }

    const customerName = req.user?.name || request.user?.name || request.userName || 'Valued Customer';
    const customerPhone = req.user?.phone || req.user?.phoneNumber || request.user?.phone || request.user?.phoneNumber || request.userPhone || null;

    // Resolve assigned Vendor
    let vendor = null;
    if (request.vendorId) {
      vendor = await prisma.vendor.findUnique({ where: { id: request.vendorId } }).catch(() => null);
    }
    if (!vendor && request.assignedVendorName) {
      vendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { name: { equals: request.assignedVendorName, mode: 'insensitive' } },
            { businessName: { equals: request.assignedVendorName, mode: 'insensitive' } }
          ]
        }
      }).catch(() => null);
    }
    if (!vendor && request.vendorQuotes && request.vendorQuotes.length > 0) {
      const awardedQuote = request.vendorQuotes.find(q => q.status === 'ACCEPTED' || q.status === 'AWARDED');
      if (awardedQuote?.vendorId) {
        vendor = await prisma.vendor.findUnique({ where: { id: awardedQuote.vendorId } }).catch(() => null);
      }
    }

    let vendorRatingRecord = null;
    if (vendor) {
      // Check if rating already exists
      const existingVendorRating = await prisma.vendorRating.findFirst({
        where: {
          vendorId: vendor.id,
          bookingId: request.id
        }
      });

      if (existingVendorRating) {
        vendorRatingRecord = await prisma.vendorRating.update({
          where: { id: existingVendorRating.id },
          data: {
            rating: numRating,
            review: review ? String(review).trim() : null,
            customerName,
            customerPhone
          }
        });
      } else {
        vendorRatingRecord = await prisma.vendorRating.create({
          data: {
            vendorId: vendor.id,
            userId: req.user?.id || request.userId || null,
            customerName,
            customerPhone,
            rating: numRating,
            review: review ? String(review).trim() : null,
            serviceType: 'SERVICE_REQUEST',
            bookingId: request.id,
            bookingNumber: request.id
          }
        });
      }

      // Recalculate dynamic average rating and ratingsCount
      const allRatings = await prisma.vendorRating.findMany({
        where: { vendorId: vendor.id },
        select: { rating: true }
      });

      const avg = allRatings.length > 0
        ? Number((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1))
        : numRating;

      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          rating: avg,
          ratingsCount: allRatings.length
        }
      });
    }

    // Update ServiceRequest record
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        customerRating: numRating,
        customerReview: review ? String(review).trim() : null,
        ratedAt: new Date()
      },
      include: {
        user: true,
        vendor: true,
        quotations: true
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('request_updated', updatedRequest);
      if (vendor) {
        io.emit('vendor_rating_updated', {
          vendorId: vendor.id,
          rating: numRating,
          review: review || null
        });
      }
    }

    res.json({
      success: true,
      message: 'Thank you for your rating and review!',
      request: updatedRequest,
      vendorRating: vendorRatingRecord
    });
  } catch (error) {
    console.error('Error rating service request:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

module.exports = router;