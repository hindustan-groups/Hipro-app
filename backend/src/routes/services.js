const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 1. Dynamic Operational Cities Router (GET, POST, PUT, DELETE, TOGGLE)
router.use('/cities', require('./cities'));

// Map of legacy/broken 404 Unsplash image URLs to valid, active 200 OK images
const BROKEN_IMAGE_MAP = {
  'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80': 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=800&q=80': 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?auto=format&fit=crop&w=800&q=80',
};

const sanitizeImageUrl = (url) => {
  if (!url) return '';
  return BROKEN_IMAGE_MAP[url] || url;
};

// Self-healing database update for legacy broken image links
(async () => {
  try {
    for (const [broken, fixed] of Object.entries(BROKEN_IMAGE_MAP)) {
      await prisma.subService.updateMany({
        where: { image: broken },
        data: { image: fixed }
      });
    }
  } catch (err) {
    console.warn('Subservice image self-healing deferred:', err.message);
  }
})();

// 2. GET /api/v1/services/partners - Get verified partners/technicians dynamically from database
router.get('/partners', async (req, res) => {
    try {
        const { city } = req.query;
        const where = { isActive: true };

        if (city && city.toLowerCase() !== 'all') {
            where.cityName = {
                equals: city.trim(),
                mode: 'insensitive'
            };
        }

        const partners = await prisma.partner.findMany({
            where,
            orderBy: { rating: 'desc' }
        });

        res.json({
            success: true,
            city: city || 'All',
            count: partners.length,
            partners
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. GET /api/v1/services - Get all services filtered by city dynamically from PostgreSQL
router.get('/', async (req, res) => {
    try {
        const { city } = req.query;
        const where = { isActive: true };

        // If a specific city is requested (e.g. Udaipur or Bhilwara), filter by array containment
        if (city && city.toLowerCase() !== 'all') {
            const normalizedCity = city.trim();
            where.OR = [
                { cities: { has: normalizedCity } },
                { cities: { isEmpty: true } }
            ];
        }

        const services = await prisma.service.findMany({
            where,
            include: {
                subServices: {
                    where: { isActive: true },
                    orderBy: { created_at: 'asc' }
                }
            },
            orderBy: { created_at: 'asc' }
        });

        // If city specified, ensure subservices are also filtered if subservice-specific cities exist
        const formattedServices = services.map(s => {
            let filteredSubs = s.subServices;
            if (city && city.toLowerCase() !== 'all') {
                const normalizedCity = city.trim();
                filteredSubs = filteredSubs.filter(sub => 
                    !sub.cities || sub.cities.length === 0 || sub.cities.includes(normalizedCity)
                );
            }
            return {
                ...s,
                subServices: filteredSubs.map(sub => ({
                    ...sub,
                    image: sanitizeImageUrl(sub.image)
                }))
            };
        });

        res.json({
            success: true,
            message: "Services fetched successfully",
            city: city || 'All',
            total: formattedServices.length,
            services: formattedServices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Services fetched failed",
            error: error.message
        });
    }
});

// 4. GET /api/v1/services/:id - Get single service by id (with city subservice filtering)
router.get('/:id', async (req, res) => {
    try {
        const { city } = req.query;
        const service = await prisma.service.findUnique({
            where: { id: req.params.id },
            include: {
                subServices: {
                    where: { isActive: true },
                    orderBy: { created_at: 'asc' }
                }
            }
        });

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }

        let filteredSubs = service.subServices;
        if (city && city.toLowerCase() !== 'all') {
            const normalizedCity = city.trim();
            filteredSubs = filteredSubs.filter(sub => 
                !sub.cities || sub.cities.length === 0 || sub.cities.includes(normalizedCity)
            );
        }

        res.json({
            success: true,
            data: {
                ...service,
                subServices: filteredSubs.map(sub => ({
                    ...sub,
                    image: sanitizeImageUrl(sub.image)
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. POST /api/v1/services - Create new service (with cities support)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { code, name, description, icon, iconImage, imageUrl, rating, cities } = req.body;
        const iconVal = iconImage || imageUrl || icon || '';
        const parsedCities = Array.isArray(cities) ? cities : (cities ? [cities] : []);

        const newService = await prisma.service.create({
            data: {
                code,
                name,
                description: description || '',
                icon: iconVal,
                iconImage: iconImage || iconVal,
                imageUrl: imageUrl || iconVal,
                rating: rating ? parseFloat(rating) : 4.8,
                cities: parsedCities
            }
        });
        res.status(201).json({ success: true, message: 'Service created', service: newService });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. PUT /api/v1/services/:id - Update service (including cities)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, description, icon, iconImage, imageUrl, rating, cities, isActive } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (iconImage !== undefined) updateData.iconImage = iconImage;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (rating !== undefined) updateData.rating = parseFloat(rating);
        if (isActive !== undefined) updateData.isActive = Boolean(isActive);
        if (cities !== undefined) {
            updateData.cities = Array.isArray(cities) ? cities : (cities ? [cities] : []);
        }

        const updated = await prisma.service.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json({ success: true, message: 'Service updated', service: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 7. PUT /api/v1/services/:id/cities - Specific endpoint to dynamically update allowed cities for a service
router.put('/:id/cities', authenticate, requireAdmin, async (req, res) => {
    try {
        const { cities } = req.body;
        if (!Array.isArray(cities)) {
            return res.status(400).json({ success: false, message: 'cities must be an array of city names' });
        }

        const updated = await prisma.service.update({
            where: { id: req.params.id },
            data: { cities }
        });

        res.json({
            success: true,
            message: `Service "${updated.name}" cities updated to [${cities.join(', ')}]`,
            service: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
