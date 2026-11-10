const prisma = require('../prisma');
const { addNotification } = require('../routes/notifications');

// ==========================================
// VENDOR CONTROLLER - Full vendor management
// ==========================================

// Standard Vendor Categories
const VENDOR_CATEGORIES = [
  { id: 'waterproofing', name: 'Waterproofing & Leakage', slug: 'waterproofing', icon: 'Droplets', color: '#0284c7' },
  { id: 'civil', name: 'Civil Construction & Masonry', slug: 'civil', icon: 'HardHat', color: '#6366f1' },
  { id: 'plumbing', name: 'Plumbing & Sanitation', slug: 'plumbing', icon: 'Wrench', color: '#0d9488' },
  { id: 'electrical', name: 'Electrical & Wiring', slug: 'electrical', icon: 'Zap', color: '#eab308' },
  { id: 'painting', name: 'Painting & Finishing', slug: 'painting', icon: 'Sparkles', color: '#ec4899' },
  { id: 'renovation', name: 'Renovation & Carpentry', slug: 'renovation', icon: 'Home', color: '#8b5cf6' },
  { id: 'adventure', name: 'Adventure & Tour Operators', slug: 'adventure', icon: 'Compass', color: '#e11d48' },
  { id: 'general', name: 'General Maintenance & Repair', slug: 'general', icon:'Layers', color: '#64748b' },
];

// GET /api/v1/vendors/categories - List categories with active vendor count
const getVendorCategories = async (req, res) => {
  try {
    const allVendors = await prisma.vendor.findMany({ select: { specialization: true, status: true } });
    const categoriesWithCount = VENDOR_CATEGORIES.map(cat => {
      const count = allVendors.filter(v =>
        v.specialization && v.specialization.toLowerCase().includes(cat.slug.toLowerCase())
      ).length;
      return {
        ...cat,
        vendorCount: count
      };
    });
    res.json({ success: true, categories: categoriesWithCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/vendors - List all vendors (with optional filters)
const getVendors = async (req, res) => {
  try {
    const { city, state, specialization, category, status, search } = req.query;
    const where = {};
    const andConditions = [];

    if (city) where.city = city;
    if (state) where.state = state;
    
    if (category && category.toLowerCase() !== 'all') {
      const catLower = category.toLowerCase();
      if (catLower === 'adventure' || catLower === 'services') {
        where.category = { equals: category, mode: 'insensitive' };
      } else {
        andConditions.push({
          OR: [
            { category: { contains: category, mode: 'insensitive' } },
            { specialization: { contains: category, mode: 'insensitive' } }
          ]
        });
      }
    }
    
    if (specialization && specialization.toLowerCase() !== 'all') {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }
    if (status) where.status = status;
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { businessName: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { state: { contains: search, mode: 'insensitive' } },
          { specialization: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');

    let vendors;
    if (isAdmin) {
      vendors = await prisma.vendor.findMany({
        where,
        include: {
          _count: {
            select: { vendorQuotes: true, assignedJobs: true, ratings: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
    } else {
      // Safe public projection: Never leak KYC, Aadhaar, PAN, Bank docs, or password/passcode hashes
      vendors = await prisma.vendor.findMany({
        where,
        select: {
          id: true,
          name: true,
          businessName: true,
          phone: true,
          email: true,
          state: true,
          city: true,
          category: true,
          specialization: true,
          experience: true,
          status: true,
          capacity: true,
          maxConcurrentJobs: true,
          currentJobCount: true,
          rating: true,
          ratingsCount: true,
          minCharge: true,
          imageUrl: true,
          documentsVerified: true,
          created_at: true,
          _count: {
            select: { vendorQuotes: true, assignedJobs: true, ratings: true }
          }
        },
        orderBy: { created_at: 'desc' }
      });
    }

    res.json({ success: true, vendors, total: vendors.length });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/vendors/:id - Single vendor
const getVendorById = async (req, res) => {
  try {
    const isPrivileged = req.user && (
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.vendorId === req.params.id ||
      req.user.id === req.params.id
    );

    if (isPrivileged) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: req.params.id },
        include: {
          vendorQuotes: {
            include: { request: true },
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          assignedJobs: {
            orderBy: { created_at: 'desc' },
            take: 20
          },
          sharedRequests: {
            include: { request: true },
            orderBy: { sharedAt: 'desc' },
            take: 20
          },
          ratings: {
            orderBy: { created_at: 'desc' },
            take: 50
          }
        }
      });
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
      // Never send passcode/password hashes even to privileged users
      delete vendor.password;
      delete vendor.passcode;
      return res.json({ success: true, vendor });
    }

    // Public / unprivileged vendor profile (sanitized)
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        businessName: true,
        phone: true,
        email: true,
        state: true,
        city: true,
        category: true,
        specialization: true,
        experience: true,
        status: true,
        capacity: true,
        rating: true,
        ratingsCount: true,
        minCharge: true,
        imageUrl: true,
        documentsVerified: true,
        created_at: true,
        ratings: {
          select: {
            id: true,
            customerName: true,
            rating: true,
            review: true,
            serviceType: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 30
        },
        _count: {
          select: { vendorQuotes: true, assignedJobs: true, ratings: true }
        }
      }
    });

    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Default max concurrent jobs by vendor capacity
const DEFAULT_CAPACITY_LIMITS = {
  SMALL: 3,
  MEDIUM: 8,
  LARGE: 20
};

// POST /api/v1/vendors - Create a new vendor
const createVendor = async (req, res) => {
  try {
    const { name, businessName, phone, email, state, city, cityId, category, specialization, experience, status, capacity, rating, minCharge, imageUrl, maxConcurrentJobs } = req.body;

    if (!name || !businessName || !phone || !city || !specialization) {
      return res.status(400).json({ success: false, message: 'Name, business name, phone, city, and specialization are required' });
    }

    const validCapacity = ['SMALL', 'MEDIUM', 'LARGE'].includes((capacity || 'SMALL').toUpperCase())
      ? (capacity || 'SMALL').toUpperCase()
      : 'SMALL';

    const determinedCategory = category || (
      specialization.toLowerCase().includes('adventure') ||
      specialization.toLowerCase().includes('safari') ||
      specialization.toLowerCase().includes('paragliding') ||
      specialization.toLowerCase().includes('rafting')
        ? 'Adventure'
        : 'Services'
    );

    const finalMaxJobs = maxConcurrentJobs !== undefined
      ? parseInt(maxConcurrentJobs, 10)
      : DEFAULT_CAPACITY_LIMITS[validCapacity];

    const vendor = await prisma.vendor.create({
      data: {
        name,
        businessName,
        phone,
        email: email || null,
        state: state || null,
        city,
        cityId: cityId || null,
        category: determinedCategory,
        specialization,
        experience: experience || null,
        status: status || 'active',
        capacity: validCapacity,
        maxConcurrentJobs: finalMaxJobs,
        currentJobCount: 0,
        rating: rating ? parseFloat(rating) : null,
        minCharge: minCharge ? parseFloat(minCharge) : null,
        imageUrl: imageUrl || null
      }
    });

    res.status(201).json({ success: true, vendor });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Vendor with this phone or email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/vendors/:id - Update vendor
const updateVendor = async (req, res) => {
  try {
    const { name, businessName, phone, email, state, city, cityId, category, specialization, experience, status, capacity, rating, minCharge, imageUrl, maxConcurrentJobs } = req.body;

    const updateData = {
      name: name || undefined,
      businessName: businessName || undefined,
      phone: phone || undefined,
      email: email || null,
      state: state !== undefined ? state : undefined,
      city: city || undefined,
      cityId: cityId !== undefined ? cityId : undefined,
      category: category || undefined,
      specialization: specialization || undefined,
      experience: experience || undefined,
      status: status || undefined,
      rating: rating ? parseFloat(rating) : undefined,
      minCharge: minCharge ? parseFloat(minCharge) : undefined,
      imageUrl: imageUrl || undefined
    };

    if (capacity) {
      const upperCap = capacity.toUpperCase();
      if (!['SMALL', 'MEDIUM', 'LARGE'].includes(upperCap)) {
        return res.status(400).json({ success: false, message: 'Invalid capacity. Use SMALL, MEDIUM, or LARGE.' });
      }
      updateData.capacity = upperCap;
      if (maxConcurrentJobs !== undefined) {
        updateData.maxConcurrentJobs = parseInt(maxConcurrentJobs, 10);
      } else {
        updateData.maxConcurrentJobs = DEFAULT_CAPACITY_LIMITS[upperCap];
      }
    }

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, vendor });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/vendors/:id - Delete vendor
const deleteVendor = async (req, res) => {
  try {
    await prisma.vendor.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/v1/vendors/:id/status - Toggle vendor status
const toggleVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// VENDOR QUOTATIONS
// ==========================================

// GET /api/v1/vendor-quotes - Get quotes (filter by request or vendor)
const getVendorQuotes = async (req, res) => {
  try {
    const { requestId, vendorId, status } = req.query;
    const where = {};
    if (requestId) where.requestId = requestId;

    // Enforce role-based scoping: vendors can only see their own quotations
    if (req.user && req.user.role === 'VENDOR') {
      where.vendorId = req.user.vendorId || req.user.id;
    } else if (vendorId) {
      where.vendorId = vendorId;
    }

    if (status) where.status = status;

    const quotes = await prisma.vendorQuote.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            businessName: true,
            phone: true,
            email: true,
            category: true,
            specialization: true,
            rating: true
          }
        },
        request: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, quotes, total: quotes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/v1/vendor-quotes - Submit a vendor quotation
const createVendorQuote = async (req, res) => {
  try {
    const { requestId, vendorId, vendorName, vendorBusiness, quotePrice, notes, estimatedTimeline, submittedBy } = req.body;

    if (!requestId || !vendorId || !vendorName || !quotePrice) {
      return res.status(400).json({ success: false, message: 'Request ID, vendor ID, vendor name, and quote price are required' });
    }

    // Verify request exists
    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // STRICT ANTI-BREACH DATA ISOLATION & OPEN HUB LEADS:
    // Verify in schema that this request was explicitly shared with this vendor OR assigned to them
    const sharedRecord = await prisma.vendorSharedRequest.findUnique({
      where: {
        requestId_vendorId: { requestId, vendorId }
      }
    });

    if (!sharedRecord && request.vendorId !== vendorId) {
      // Check if vendor matches the request city or if the request is an open inspection lead
      const vendorCity = (vendor.city || '').toLowerCase().trim();
      const reqLocation = (request.location || request.addressline || '').toLowerCase().trim();
      const isCityMatch = vendorCity && (reqLocation.includes(vendorCity) || vendorCity === 'all');
      const isOpenRequest = ['SUBMITTED', 'ESTIMATING', 'AUDIT_SCHEDULED'].includes(request.status);

      if (!isCityMatch && !isOpenRequest) {
        return res.status(403).json({
          success: false,
          message: 'Security Block: This inspection request is not available for quoting by your vendor account.'
        });
      }

      // Auto-register the vendor-shared link so admin can track quotes seamlessly
      try {
        await prisma.vendorSharedRequest.upsert({
          where: { requestId_vendorId: { requestId, vendorId } },
          create: {
            requestId,
            vendorId,
            sharedBy: 'Vendor Quotation Desk',
            status: 'QUOTED'
          },
          update: { status: 'QUOTED' }
        });
      } catch (e) {
        // Continue
      }
    }

    // Check if vendor already submitted a quote for this request
    const existingQuote = await prisma.vendorQuote.findFirst({
      where: { requestId, vendorId }
    });
    if (existingQuote) {
      return res.status(409).json({ success: false, message: 'Vendor has already submitted a quotation for this request' });
    }

    const quote = await prisma.vendorQuote.create({
      data: {
        requestId,
        vendorId,
        vendorName,
        vendorBusiness: vendorBusiness || vendor.businessName,
        quotePrice: parseFloat(quotePrice),
        notes: notes || null,
        estimatedTimeline: estimatedTimeline || null,
        status: 'submitted',
        submittedBy: submittedBy || vendor.businessName
      },
      include: { vendor: true, request: true }
    });

    // Update VendorSharedRequest status to QUOTED
    try {
      await prisma.vendorSharedRequest.updateMany({
        where: { requestId, vendorId },
        data: { status: 'QUOTED' }
      });
    } catch (e) {}

    // Notify admin about new quotation
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('new_vendor_quote', {
          quoteId: quote.id,
          requestId,
          requestNumber: request.requestNumber,
          vendorName: vendor.name,
          vendorBusiness: vendor.businessName,
          quotePrice: quote.quotePrice,
          createdAt: quote.createdAt
        });
      }
      await addNotification({
        title: `New Quotation Received`,
        description: `${vendor.name} (${vendor.businessName}) submitted a quotation of ₹${quotePrice} for request #${request.requestNumber}`,
        type: 'QUOTATION',
        referenceId: quote.id,
        requestId,
        projectName: request.servicecode || '',
        location: request.addressline || request.location || '',
        unread: true,
        timestamp: new Date().toISOString()
      }, io);
    } catch (notifErr) {
      console.error('Failed to dispatch quotation notification:', notifErr);
    }

    res.status(201).json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/v1/vendor-quotes/:id - Update a vendor quotation (Protected against IDOR)
const updateVendorQuote = async (req, res) => {
  try {
    const existing = await prisma.vendorQuote.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const isAuthorized = req.user && (
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.vendorId === existing.vendorId ||
      req.user.id === existing.vendorId
    );
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot modify another vendor\'s quotation'
      });
    }

    const { quotePrice, notes, estimatedTimeline, status } = req.body;
    const quote = await prisma.vendorQuote.update({
      where: { id: req.params.id },
      data: {
        quotePrice: quotePrice ? parseFloat(quotePrice) : undefined,
        notes: notes || undefined,
        estimatedTimeline: estimatedTimeline || undefined,
        status: status || undefined
      },
      include: {
        vendor: {
          select: { id: true, name: true, businessName: true }
        },
        request: true
      }
    });
    res.json({ success: true, quote });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/v1/vendor-quotes/:id - Delete vendor quotation (Protected against IDOR)
const deleteVendorQuote = async (req, res) => {
  try {
    const existing = await prisma.vendorQuote.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const isAuthorized = req.user && (
      req.user.role === 'ADMIN' ||
      req.user.role === 'SUPER_ADMIN' ||
      req.user.vendorId === existing.vendorId ||
      req.user.id === existing.vendorId
    );
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot delete another vendor\'s quotation'
      });
    }

    await prisma.vendorQuote.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// VENDOR ASSIGNMENT - Admin assigns vendor to request
// ==========================================

// PATCH /api/v1/vendor-assign/:requestId - Admin manually assigns a vendor
const assignVendorToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const vendorId = req.body.vendorId || req.body.assignedVendorId;
    const vendorName = req.body.vendorName || req.body.assignedVendorName;
    const quotePrice = req.body.quotePrice ?? req.body.assignedQuotePrice;
    const assignedBy = req.body.assignedBy || 'Super Admin';

    if (!vendorId || !vendorName) {
      return res.status(400).json({ success: false, message: 'Vendor ID and vendor name are required' });
    }

    const request = await prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return res.status(404).json({ success: false, message: 'Service request not found' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Update the request with vendor assignment
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        vendorId,
        assignedVendorName: vendorName,
        assignedQuotePrice: quotePrice ? parseFloat(quotePrice) : null,
        assignedBy: assignedBy || 'Super Admin',
        status: 'ASSIGNED'
      },
      include: { user: true, vendor: true, quotations: true }
    });

    // Mark the accepted vendor quote as assigned
    await prisma.vendorQuote.updateMany({
      where: { requestId, vendorId },
      data: { status: 'assigned' }
    });

    // Notify vendor and customer via socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.to('admin').emit('vendor_assigned', {
          requestId,
          requestNumber: request.requestNumber,
          vendorId,
          vendorName: vendor.name,
          businessName: vendor.businessName,
          assignedQuotePrice: quotePrice ? parseFloat(quotePrice) : null,
          assignedBy: assignedBy || 'Super Admin'
        });

        // Notify customer
        io.emit('request_status_updated', {
          requestId,
          requestNumber: request.requestNumber,
          status: 'ASSIGNED',
          vendorName: vendor.name,
          businessName: vendor.businessName
        });

        await addNotification({
          title: 'Vendor Assigned to Your Request',
          description: `${vendor.name} (${vendor.businessName}) has been assigned to handle request #${request.requestNumber}`,
          type: 'ASSIGNMENT',
          referenceId: request.id,
          requestId,
          projectName: request.servicecode || '',
          location: request.addressline || request.location || '',
          unread: true,
          timestamp: new Date().toISOString()
        }, io);
      }
    } catch (notifErr) {
      console.error('Failed to dispatch assignment notification:', notifErr);
    }

    res.json({ success: true, message: 'Vendor assigned successfully', request: updatedRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// VENDOR-FACING ENDPOINTS
// ==========================================

// GET /api/v1/vendor/requests - Get requests shared with vendors (open for quoting)
const getVendorRequests = async (req, res) => {
  try {
    const vendorId = req.query.vendorId || req.user?.vendorId || req.user?.id;

    if (vendorId) {
      // 1. Fetch vendor profile to know city and category
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { id: true, city: true, category: true }
      });

      // 2. Fetch explicitly shared records
      const sharedRecords = await prisma.vendorSharedRequest.findMany({
        where: { vendorId },
        include: {
          request: {
            select: {
              id: true,
              requestNumber: true,
              servicecode: true,
              subServiceCode: true,
              issueDescription: true,
              mediaUrl: true,
              propertyType: true,
              propertySize: true,
              status: true,
              urgency: true,
              location: true,
              addressline: true,
              preferredDate: true,
              preferredTime: true,
              vendorId: true,
              assignedVendorName: true,
              created_at: true,
              vendorQuotes: {
                where: { vendorId }
              }
            }
          }
        },
        orderBy: { sharedAt: 'desc' }
      });

      const sharedRequestIds = new Set();
      const formatted = sharedRecords.map(sr => {
        const r = sr.request;
        if (!r) return null;
        sharedRequestIds.add(r.id);
        const myQuote = r.vendorQuotes?.[0] || null;
        return {
          id: r.id,
          requestNumber: r.requestNumber,
          servicecode: r.servicecode,
          subServiceCode: r.subServiceCode,
          issueDescription: r.issueDescription,
          mediaUrl: r.mediaUrl,
          propertyType: r.propertyType,
          propertySize: r.propertySize,
          status: r.status,
          urgency: r.urgency,
          location: r.location,
          addressline: r.addressline,
          preferredDate: r.preferredDate,
          preferredTime: r.preferredTime,
          vendorId: r.vendorId,
          assignedVendorName: r.assignedVendorName,
          created_at: r.created_at,
          sharedAt: sr.sharedAt,
          shareStatus: sr.status,
          shareNotes: sr.notes,
          isDirectlyShared: true,
          isOpenLead: false,
          hasQuoted: !!myQuote,
          myQuote: myQuote ? {
            id: myQuote.id,
            quotePrice: myQuote.quotePrice,
            estimatedTimeline: myQuote.estimatedTimeline,
            notes: myQuote.notes,
            status: myQuote.status,
            createdAt: myQuote.createdAt
          } : null
        };
      }).filter(Boolean);

      // 3. Also discover open inspection requests available in the vendor's city/hub (privacy-preserving)
      const openRequests = await prisma.serviceRequest.findMany({
        where: {
          status: { in: ['SUBMITTED', 'ESTIMATING', 'AUDIT_SCHEDULED'] },
          vendorId: null,
          ...(sharedRequestIds.size > 0 ? { id: { notIn: Array.from(sharedRequestIds) } } : {})
        },
        select: {
          id: true,
          requestNumber: true,
          servicecode: true,
          subServiceCode: true,
          issueDescription: true,
          mediaUrl: true,
          propertyType: true,
          propertySize: true,
          status: true,
          urgency: true,
          location: true,
          addressline: true,
          preferredDate: true,
          preferredTime: true,
          created_at: true,
          vendorQuotes: {
            where: { vendorId }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 20
      });

      // Filter by city if vendor has a city assigned
      const vendorCity = (vendor?.city || '').toLowerCase().trim();
      const openFormatted = openRequests.filter(r => {
        if (!vendorCity || vendorCity === 'all') return true;
        const loc = (r.location || r.addressline || '').toLowerCase();
        return loc.includes(vendorCity);
      }).map(r => {
        const myQuote = r.vendorQuotes?.[0] || null;
        return {
          id: r.id,
          requestNumber: r.requestNumber,
          servicecode: r.servicecode,
          subServiceCode: r.subServiceCode,
          issueDescription: r.issueDescription,
          mediaUrl: r.mediaUrl,
          propertyType: r.propertyType,
          propertySize: r.propertySize,
          status: r.status,
          urgency: r.urgency,
          location: r.location,
          addressline: r.addressline,
          preferredDate: r.preferredDate,
          preferredTime: r.preferredTime,
          vendorId: null,
          assignedVendorName: null,
          created_at: r.created_at,
          sharedAt: r.created_at,
          shareStatus: 'OPEN_HUB',
          isDirectlyShared: false,
          isOpenLead: true,
          hasQuoted: !!myQuote,
          myQuote: myQuote ? {
            id: myQuote.id,
            quotePrice: myQuote.quotePrice,
            estimatedTimeline: myQuote.estimatedTimeline,
            notes: myQuote.notes,
            status: myQuote.status,
            createdAt: myQuote.createdAt
          } : null
        };
      });

      const allCombined = [...formatted, ...openFormatted];
      return res.json({ success: true, requests: allCombined, total: allCombined.length });
    }

    // Default empty if vendorId missing
    res.json({ success: true, requests: [], total: 0 });
  } catch (error) {
    console.error('getVendorRequests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/vendor/my-quotes - Get quotes submitted by a specific vendor
const getMyVendorQuotes = async (req, res) => {
  try {
    const vendorId = req.query.vendorId || req.user?.vendorId || req.user?.id;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'vendorId is required' });
    }

    const quotes = await prisma.vendorQuote.findMany({
      where: { vendorId },
      include: {
        request: {
          select: {
            id: true,
            requestNumber: true,
            servicecode: true,
            subServiceCode: true,
            issueDescription: true,
            location: true,
            propertySize: true,
            status: true,
            urgency: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, quotes, total: quotes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/vendor/my-jobs - Get jobs assigned to a specific vendor
const getMyVendorJobs = async (req, res) => {
  try {
    const vendorId = req.query.vendorId || req.user?.vendorId || req.user?.id;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'vendorId is required' });
    }

    const jobs = await prisma.serviceRequest.findMany({
      where: { vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true
          }
        },
        vendorQuotes: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, jobs, total: jobs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// PATCH /api/v1/vendors/:id/verify-kyc - Admin verifies or revokes vendor KYC
const toggleVendorKYC = async (req, res) => {
  try {
    const { documentsVerified } = req.body;
    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data: {
        documentsVerified: typeof documentsVerified === 'boolean' ? documentsVerified : true
      }
    });
    res.json({
      success: true,
      message: `Vendor KYC ${vendor.documentsVerified ? 'verified' : 'unverified'} successfully`,
      vendor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/v1/vendors/:id/ratings - List all ratings and reviews for a specific vendor
const getVendorRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { id: true, name: true, businessName: true, rating: true, ratingsCount: true }
    });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const ratings = await prisma.vendorRating.findMany({
      where: { vendorId: id },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      vendor,
      averageRating: vendor.rating,
      totalRatings: ratings.length,
      ratings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  toggleVendorKYC,
  getVendors,
  getVendorCategories,
  VENDOR_CATEGORIES,
  getVendorById,
  getVendorRatings,
  createVendor,
  updateVendor,
  deleteVendor,
  toggleVendorStatus,
  getVendorQuotes,
  createVendorQuote,
  updateVendorQuote,
  deleteVendorQuote,
  assignVendorToRequest,
  getVendorRequests,
  getMyVendorQuotes,
  getMyVendorJobs
};
