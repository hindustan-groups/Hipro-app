const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// GET /api/v1/admin/stats - Overview metrics & dashboard KPIs
router.get('/stats', async (req, res) => {
  try {
    const [
      totalRequests,
      requestsByStatus,
      totalQuotes,
      quotes,
      servicesCount,
      usersCount,
      recentRequests,
      recentQuotes
    ] = await Promise.all([
      prisma.serviceRequest.count(),
      prisma.serviceRequest.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.quotation.count(),
      prisma.quotation.findMany({
        select: {
          grandtotal: true,
          status: true
        }
      }),
      prisma.service.count(),
      prisma.user.count(),
      prisma.serviceRequest.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { quotations: true, user: true }
      }),
      prisma.quotation.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { request: true }
      })
    ]);

    const statusCounts = {
      SUBMITTED: 0,
      ESTIMATING: 0,
      QUOTED: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      REJECTED: 0
    };

    requestsByStatus.forEach(item => {
      if (item.status) {
        statusCounts[item.status] = item._count.status;
      }
    });

    let totalQuotedValue = 0;
    let acceptedValue = 0;
    let acceptedQuotesCount = 0;

    quotes.forEach(q => {
      const val = parseFloat(q.grandtotal || 0);
      totalQuotedValue += val;
      if (q.status === 'ACCEPTED' || q.status === 'COMPLETED') {
        acceptedValue += val;
        acceptedQuotesCount += 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalRequests,
        statusCounts,
        totalQuotes,
        acceptedQuotesCount,
        totalQuotedValue,
        acceptedValue,
        servicesCount,
        usersCount,
        recentRequests,
        recentQuotes
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch admin stats'
    });
  }
});

// GET /api/v1/admin/users - User Directory
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        address: true,
        requests: {
          include: { quotations: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: users, total: users.length });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/v1/admin/services - Create new service
router.post('/services', async (req, res) => {
  try {
    const { code, name, description, icon, rating, imageUrl, iconImage, image } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Code and Name are required' });
    }
    const finalImage = imageUrl || iconImage || image || icon || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
    const service = await prisma.service.create({
      data: {
        code: code.toUpperCase().trim(),
        name,
        description: description || '',
        icon: finalImage,
        iconImage: finalImage,
        imageUrl: finalImage,
        rating: parseFloat(rating || 4.8)
      }
    });
    res.status(201).json({ success: true, message: 'Service created successfully', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/v1/admin/services/:id - Update service
router.put('/services/:id', async (req, res) => {
  try {
    const { code, name, description, icon, rating, imageUrl, iconImage, image } = req.body;
    const updateData = {};
    if (code) updateData.code = code.toUpperCase().trim();
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    const finalImage = imageUrl || iconImage || image || icon;
    if (finalImage) {
      updateData.icon = finalImage;
      updateData.iconImage = finalImage;
      updateData.imageUrl = finalImage;
    }
    if (rating !== undefined) updateData.rating = parseFloat(rating);

    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, message: 'Service updated successfully', data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/v1/admin/services/:id - Delete service
router.delete('/services/:id', async (req, res) => {
  try {
    await prisma.service.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/v1/admin/sub-services - Create sub-service
router.post('/sub-services', async (req, res) => {
  try {
    const {
      serviceId,
      titleEn,
      titleHi,
      desc,
      image,
      imageUrl,
      checklist,
      visitingCharge,
      bookNowEnabled,
      getQuoteEnabled,
      requiredFields,
      isActive
    } = req.body;

    if (!serviceId || !titleEn) {
      return res.status(400).json({ success: false, message: 'Service ID and Title are required' });
    }

    let parsedRequiredFields = requiredFields;
    if (typeof requiredFields === 'string' && requiredFields.trim()) {
      try { parsedRequiredFields = JSON.parse(requiredFields); } catch (_) {}
    }

    const subService = await prisma.subService.create({
      data: {
        serviceId,
        titleEn,
        titleHi: titleHi || null,
        desc: desc || '',
        image: image || imageUrl || null,
        checklist: Array.isArray(checklist) ? checklist : (checklist ? checklist.split('\n').filter(Boolean) : []),
        visitingCharge: visitingCharge !== undefined ? parseFloat(visitingCharge) : 199.0,
        bookNowEnabled: bookNowEnabled !== undefined ? Boolean(bookNowEnabled) : true,
        getQuoteEnabled: getQuoteEnabled !== undefined ? Boolean(getQuoteEnabled) : true,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        requiredFields: parsedRequiredFields || []
      }
    });
    res.status(201).json({ success: true, message: 'SubService created successfully', data: subService });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/v1/admin/sub-services/:id - Update sub-service
router.put('/sub-services/:id', async (req, res) => {
  try {
    const {
      titleEn,
      titleHi,
      desc,
      image,
      imageUrl,
      checklist,
      visitingCharge,
      bookNowEnabled,
      getQuoteEnabled,
      requiredFields,
      isActive
    } = req.body;

    const updateData = {};
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (titleHi !== undefined) updateData.titleHi = titleHi;
    if (desc !== undefined) updateData.desc = desc;
    if (image !== undefined || imageUrl !== undefined) updateData.image = image !== undefined ? image : imageUrl;
    if (checklist !== undefined) {
      updateData.checklist = Array.isArray(checklist) ? checklist : (checklist ? checklist.split('\n').filter(Boolean) : []);
    }
    if (visitingCharge !== undefined) updateData.visitingCharge = parseFloat(visitingCharge);
    if (bookNowEnabled !== undefined) updateData.bookNowEnabled = Boolean(bookNowEnabled);
    if (getQuoteEnabled !== undefined) updateData.getQuoteEnabled = Boolean(getQuoteEnabled);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (requiredFields !== undefined) {
      let parsedRequiredFields = requiredFields;
      if (typeof requiredFields === 'string' && requiredFields.trim()) {
        try { parsedRequiredFields = JSON.parse(requiredFields); } catch (_) {}
      }
      updateData.requiredFields = parsedRequiredFields;
    }

    const updated = await prisma.subService.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, message: 'SubService updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/v1/admin/sub-services/:id - Delete sub-service
router.delete('/sub-services/:id', async (req, res) => {
  try {
    await prisma.subService.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true, message: 'SubService deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// DYNAMIC CITY MASTER API (Zomato-style)
// ==========================================

// GET /api/v1/admin/cities - List all cities
router.get('/cities', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { partners: true } }
      }
    });
    res.json({ success: true, total: cities.length, cities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/v1/admin/cities - Create new city dynamically
router.post('/cities', async (req, res) => {
  try {
    const { name, state, tagline, imageUrl, badge, isActive } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }

    const city = await prisma.city.create({
      data: {
        name: name.trim(),
        state: state ? state.trim() : 'Rajasthan',
        tagline: tagline ? tagline.trim() : `Quality Services in ${name.trim()}`,
        imageUrl: imageUrl || null,
        badge: badge ? badge.trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json({ success: true, message: 'City created successfully', city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/v1/admin/cities/:id - Update city
router.put('/cities/:id', async (req, res) => {
  try {
    const { name, state, tagline, imageUrl, badge, isActive, partnerCount, serviceCount } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (tagline !== undefined) updateData.tagline = tagline.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (badge !== undefined) updateData.badge = badge;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (partnerCount !== undefined) updateData.partnerCount = parseInt(partnerCount, 10);
    if (serviceCount !== undefined) updateData.serviceCount = parseInt(serviceCount, 10);

    const updated = await prisma.city.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, message: 'City updated successfully', city: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/v1/admin/cities/:id - Delete city
router.delete('/cities/:id', async (req, res) => {
  try {
    await prisma.city.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'City deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// DYNAMIC PARTNER / TECHNICIAN API (City-linked)
// ==========================================

// GET /api/v1/admin/partners - List all partners (with optional city filter)
router.get('/partners', async (req, res) => {
  try {
    const { city } = req.query;
    const where = {};
    if (city && city.toLowerCase() !== 'all') {
      where.cityName = { equals: city.trim(), mode: 'insensitive' };
    }

    const partners = await prisma.partner.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, total: partners.length, partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/v1/admin/partners - Add new partner technician
router.post('/partners', async (req, res) => {
  try {
    const {
      name,
      phone,
      role,
      cityName,
      cityId,
      experienceYears,
      rating,
      completedJobs,
      badge,
      photo,
      specialties,
      isActive
    } = req.body;

    if (!name || !phone || !cityName) {
      return res.status(400).json({ success: false, message: 'Name, phone, and cityName are required' });
    }

    const partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        role: role ? role.trim() : 'Lead Inspection Engineer',
        cityName: cityName.trim(),
        cityId: cityId || null,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 5,
        rating: rating ? parseFloat(rating) : 4.9,
        completedJobs: completedJobs ? parseInt(completedJobs, 10) : 0,
        badge: badge ? badge.trim() : null,
        photo: photo || null,
        specialties: Array.isArray(specialties) ? specialties : (specialties ? [specialties] : []),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    res.status(201).json({ success: true, message: 'Partner added successfully', partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/v1/admin/partners/:id - Update partner
router.put('/partners/:id', async (req, res) => {
  try {
    const {
      name,
      phone,
      role,
      cityName,
      cityId,
      experienceYears,
      rating,
      completedJobs,
      badge,
      photo,
      specialties,
      isActive
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (role !== undefined) updateData.role = role.trim();
    if (cityName !== undefined) updateData.cityName = cityName.trim();
    if (cityId !== undefined) updateData.cityId = cityId;
    if (experienceYears !== undefined) updateData.experienceYears = parseInt(experienceYears, 10);
    if (rating !== undefined) updateData.rating = parseFloat(rating);
    if (completedJobs !== undefined) updateData.completedJobs = parseInt(completedJobs, 10);
    if (badge !== undefined) updateData.badge = badge;
    if (photo !== undefined) updateData.photo = photo;
    if (specialties !== undefined) {
      updateData.specialties = Array.isArray(specialties) ? specialties : (specialties ? [specialties] : []);
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.partner.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ success: true, message: 'Partner updated successfully', partner: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/v1/admin/partners/:id - Remove partner
router.delete('/partners/:id', async (req, res) => {
  try {
    await prisma.partner.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================

// ENVIRONMENT SETTINGS API
const fs = require('fs');
const path = require('path');
const envPath = path.resolve(__dirname, '../../.env');

function parseEnvFile() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        env[key] = value;
      }
    }
  });
  return env;
}

function updateEnvFile(newEnv) {
  const existingEnv = parseEnvFile();
  const merged = { ...existingEnv, ...newEnv };
  const lines = Object.keys(merged).map(key => `${key}=${merged[key]}`);
  fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
  Object.keys(newEnv).forEach(key => {
    process.env[key] = newEnv[key];
  });
}

// GET /api/v1/admin/settings - Get environment configuration
router.get('/settings', (req, res) => {
  try {
    const env = parseEnvFile();
    res.json({
      success: true,
      data: {
        PORT: env.PORT || process.env.PORT || '5000',
        NODE_ENV: env.NODE_ENV || process.env.NODE_ENV || 'development',
        BASE_URL: env.BASE_URL || process.env.BASE_URL || 'http://localhost:5000',
        DATABASE_URL: env.DATABASE_URL || process.env.DATABASE_URL || '',
        IMAGEKIT_PUBLIC_KEY: env.IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '',
        IMAGEKIT_PRIVATE_KEY: env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY || '',
        IMAGEKIT_URL_ENDPOINT: env.IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '',
        COMPANY_NAME: env.COMPANY_NAME || process.env.COMPANY_NAME || 'Hind Building Solutions',
        SUPPORT_PHONE: env.SUPPORT_PHONE || process.env.SUPPORT_PHONE || '+91 94628 77757',
        SUPPORT_EMAIL: env.SUPPORT_EMAIL || process.env.SUPPORT_EMAIL || 'support@hindbuilding.com'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/v1/admin/settings - Update environment configuration
router.post('/settings', (req, res) => {
  try {
    const {
      PORT,
      NODE_ENV,
      BASE_URL,
      DATABASE_URL,
      IMAGEKIT_PUBLIC_KEY,
      IMAGEKIT_PRIVATE_KEY,
      IMAGEKIT_URL_ENDPOINT,
      COMPANY_NAME,
      SUPPORT_PHONE,
      SUPPORT_EMAIL
    } = req.body;

    const updates = {};
    if (PORT !== undefined) updates.PORT = PORT;
    if (NODE_ENV !== undefined) updates.NODE_ENV = NODE_ENV;
    if (BASE_URL !== undefined) updates.BASE_URL = BASE_URL;
    if (DATABASE_URL !== undefined) updates.DATABASE_URL = DATABASE_URL;
    if (IMAGEKIT_PUBLIC_KEY !== undefined) updates.IMAGEKIT_PUBLIC_KEY = IMAGEKIT_PUBLIC_KEY;
    if (IMAGEKIT_PRIVATE_KEY !== undefined) updates.IMAGEKIT_PRIVATE_KEY = IMAGEKIT_PRIVATE_KEY;
    if (IMAGEKIT_URL_ENDPOINT !== undefined) updates.IMAGEKIT_URL_ENDPOINT = IMAGEKIT_URL_ENDPOINT;
    if (COMPANY_NAME !== undefined) updates.COMPANY_NAME = COMPANY_NAME;
    if (SUPPORT_PHONE !== undefined) updates.SUPPORT_PHONE = SUPPORT_PHONE;
    if (SUPPORT_EMAIL !== undefined) updates.SUPPORT_EMAIL = SUPPORT_EMAIL;

    updateEnvFile(updates);

    res.json({
      success: true,
      message: 'Environment credentials updated successfully in .env',
      data: parseEnvFile()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

