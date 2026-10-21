const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `damage_${Date.now()}_${Math.floor(Math.random() * 10000)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
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
        user = await prisma.user.create({
          data: {
            name: name || "Customer App User",
            phoneNumber: phone,
            password: "demopassword"
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
        servicecode: servicecode || req.body.categoryName || req.body.categoryId || 'General Service',
        subServiceCode: subServiceCode || req.body.subServiceName || 'Site Inspection',
        issueDescription: issueDescription || 'General site inspection requested.',
        urgency: 'NORMAL',
        status: status || 'SUBMITTED',
        mediaUrl: mediaList,
        propertyType: propertyType || 'Residential',
        propertySize: propertySize || 'Standard Area',
        location: location || addressline || req.body.address || 'Bhilwara, Rajasthan',
        preferredDate: preferredDate || new Date().toISOString().split('T')[0],
        preferredTime: preferredTime || 'Morning (09:00 AM - 12:00 PM)',
        addressline: addressline || req.body.address || 'Site Address'
      },
      include: {
        user: true,
        quotations: true
      }
    });

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
// GET /api/v1/requests - Get all requests with quotations and user info
router.get('/', async (req, res) => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      include: {
        quotations: true,
        user: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: requests, total: requests.length });
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/v1/requests/:id - Single request
router.get('/:id', async (req, res) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id },
      include: {
        quotations: true,
        user: true
      }
    });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/v1/requests/:id/status - Update request status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }
    const updated = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status },
      include: { quotations: true, user: true }
    });
    res.json({ success: true, message: 'Status updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/v1/requests/:id - Delete a request
router.delete('/:id', async (req, res) => {
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
    if (issueDescription !== undefined) updateData.issueDescription = issueDescription;
    if (propertyType !== undefined) updateData.propertyType = propertyType;
    if (propertySize !== undefined) updateData.propertySize = propertySize;
    if (location !== undefined) updateData.location = location;
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
        user: true,
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

router.put('/:id', upload.array('damageImages', 10), updateRequestHandler);
router.patch('/:id', upload.array('damageImages', 10), updateRequestHandler);

module.exports = router;