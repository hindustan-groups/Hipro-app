const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// GET all services
router.get('/', async (req, res) => {
    try {
        const allServices = await prisma.service.findMany({
            include: {
                subServices: {
                    orderBy: { created_at: 'asc' }
                }
            },
            orderBy: { created_at: 'asc' }
        });
        res.json({
            success: true,
            message: "services fetched successfully",
            services: allServices,
            total: allServices.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "services fetched failed",
            error: error.message
        });
    }
});

// GET single service by id
router.get('/:id', async (req, res) => {
    try {
        const service = await prisma.service.findUnique({
            where: { id: req.params.id },
            include: {
                subServices: true
            }
        });
        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found' });
        }
        res.json({ success: true, data: service });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST create service
router.post('/', async (req, res) => {
    try {
        const { code, name, description, icon, iconImage, imageUrl, rating } = req.body;
        const iconVal = iconImage || imageUrl || icon || 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png';
        const newService = await prisma.service.create({
            data: {
                code,
                name,
                description: description || '',
                icon: iconVal,
                iconImage: iconImage || iconVal,
                imageUrl: imageUrl || iconVal,
                rating: rating ? parseFloat(rating) : 4.8
            }
        });
        res.status(201).json({ success: true, message: 'Service created', service: newService });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT update service (including icon image)
router.put('/:id', async (req, res) => {
    try {
        const { name, description, icon, iconImage, imageUrl, rating } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (icon !== undefined) updateData.icon = icon;
        if (iconImage !== undefined) updateData.iconImage = iconImage;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (rating !== undefined) updateData.rating = parseFloat(rating);

        const updated = await prisma.service.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json({ success: true, message: 'Service updated', service: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;