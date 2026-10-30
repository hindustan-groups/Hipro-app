const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// 1. GET /api/v1/services/cities - Get supported operational cities dynamically from database
router.get('/cities', async (req, res) => {
    try {
        const dbCities = await prisma.city.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });

        res.json({
            success: true,
            message: "Supported cities fetched successfully from database",
            total: dbCities.length,
            cities: dbCities
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

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
                subServices: filteredSubs
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
                subServices: filteredSubs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. POST /api/v1/services - Create new service (with cities support)
router.post('/', async (req, res) => {
    try {
        const { code, name, description, icon, iconImage, imageUrl, rating, cities } = req.body;
        const iconVal = iconImage || imageUrl || icon || 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png';
        const parsedCities = Array.isArray(cities) ? cities : (cities ? [cities] : ['Udaipur', 'Bhilwara']);

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
router.put('/:id', async (req, res) => {
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
router.put('/:id/cities', async (req, res) => {
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
