const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// All-India states and cities catalog
router.use('/india', require('./locations'));

// ==========================================
// DYNAMIC CITY HUBS API
// Manage operational cities where services are provided
// ==========================================

// 1. GET /api/v1/cities - Fetch operational cities
router.get('/', async (req, res) => {
  try {
    const { all, state } = req.query;
    const where = {};

    // By default, return only active cities unless ?all=true is explicitly requested
    if (all !== 'true') {
      where.isActive = true;
    }

    if (state && state.trim()) {
      where.state = { equals: state.trim(), mode: 'insensitive' };
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { partners: true } }
      }
    });

    res.json({
      success: true,
      message: 'Operational cities fetched successfully',
      total: cities.length,
      cities
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET /api/v1/cities/:id - Get single city details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const city = await prisma.city.findFirst({
      where: {
        OR: [
          { id },
          { name: { equals: id, mode: 'insensitive' } }
        ]
      },
      include: {
        partners: { where: { isActive: true } }
      }
    });

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    res.json({ success: true, city });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. POST /api/v1/cities - Admin: Add new operational city hub
router.post('/', async (req, res) => {
  try {
    const { name, state, tagline, imageUrl, badge, isActive, partnerCount, serviceCount } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'City name is required' });
    }

    const trimmedName = name.trim();

    // Check if city name already exists (case-insensitive)
    const existing = await prisma.city.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } }
    });

    if (existing) {
      // If inactive, reactivate it with updated details
      const reactivated = await prisma.city.update({
        where: { id: existing.id },
        data: {
          state: state ? state.trim() : existing.state,
          tagline: tagline ? tagline.trim() : existing.tagline,
          badge: badge !== undefined ? (badge ? badge.trim() : null) : existing.badge,
          imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          partnerCount: partnerCount !== undefined ? parseInt(partnerCount, 10) : existing.partnerCount,
          serviceCount: serviceCount !== undefined ? parseInt(serviceCount, 10) : existing.serviceCount,
        }
      });

      return res.status(200).json({
        success: true,
        message: `City hub "${trimmedName}" updated and activated successfully`,
        city: reactivated
      });
    }

    const newCity = await prisma.city.create({
      data: {
        name: trimmedName,
        state: state && state.trim() ? state.trim() : 'Rajasthan',
        tagline: tagline && tagline.trim() ? tagline.trim() : `Verified Services & Civil Engineering in ${trimmedName}`,
        badge: badge && badge.trim() ? badge.trim() : 'NEW HUB',
        imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        partnerCount: partnerCount !== undefined ? parseInt(partnerCount, 10) : 5,
        serviceCount: serviceCount !== undefined ? parseInt(serviceCount, 10) : 25,
      }
    });

    res.status(201).json({
      success: true,
      message: `City hub "${trimmedName}" created and added to active service network`,
      city: newCity
    });
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. PUT /api/v1/cities/:id - Admin: Edit operational city
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, state, tagline, imageUrl, badge, isActive, partnerCount, serviceCount } = req.body;

    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    const updateData = {};
    if (name !== undefined && name.trim()) updateData.name = name.trim();
    if (state !== undefined && state.trim()) updateData.state = state.trim();
    if (tagline !== undefined) updateData.tagline = tagline.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (badge !== undefined) updateData.badge = badge ? badge.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (partnerCount !== undefined) updateData.partnerCount = parseInt(partnerCount, 10);
    if (serviceCount !== undefined) updateData.serviceCount = parseInt(serviceCount, 10);

    const updated = await prisma.city.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: `City hub "${updated.name}" updated successfully`,
      city: updated
    });
  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. PATCH /api/v1/cities/:id/toggle - Admin: Toggle active state
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    const updated = await prisma.city.update({
      where: { id },
      data: { isActive: !existing.isActive }
    });

    res.json({
      success: true,
      message: `City hub "${updated.name}" is now ${updated.isActive ? 'Active' : 'Inactive'}`,
      city: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. DELETE /api/v1/cities/:id - Admin: Remove city hub
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.city.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }

    await prisma.city.delete({ where: { id } });

    res.json({
      success: true,
      message: `City hub "${existing.name}" removed from service directory`
    });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

