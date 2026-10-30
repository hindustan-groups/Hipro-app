const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const SLIDES_FILE = path.join(__dirname, '../../uploads/slides.json');

// Default initial slides
const DEFAULT_SLIDES = [
  // --- Service Slides ---
  {
    id: 'slide_1',
    title: 'Waterproofing & Leakage Audit',
    subtitle: 'Get flat 20% off on advanced terrace & bathroom scanning',
    badgeText: 'LIMITED OFFER',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    targetRoute: 'create_inspection',
    section: 'services',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'slide_2',
    title: 'Complete Civil & Structural Repairs',
    subtitle: 'Certified engineers for crack stitching & foundation care',
    badgeText: 'CERTIFIED PROS',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?auto=format&fit=crop&w=800&q=80',
    targetRoute: 'services',
    section: 'services',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'slide_3',
    title: 'Instant Transparent Quotations',
    subtitle: 'Track inspection progress & line-item estimates in real time',
    badgeText: 'QUICK ESTIMATE',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    targetRoute: 'requests',
    section: 'services',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString()
  },
  // --- Adventure / Entertainment Slides ---
  {
    id: 'slide_adv_1',
    title: 'Tandem Paragliding in Rishikesh',
    subtitle: 'Soar with DGCA certified pilots across Himalayan views',
    badgeText: 'TOP ADVENTURE',
    imageUrl: 'https://images.unsplash.com/photo-1516298773066-c48f8e9bd92b?auto=format&fit=crop&w=800&q=80',
    targetRoute: 'adventure',
    section: 'adventure',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString()
  },
  {
    id: 'slide_adv_2',
    title: 'Desert Safari & Starry Dunes',
    subtitle: 'Camp under the stars with sunset camel rides in Jaisalmer',
    badgeText: 'DESERT CLUB',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    targetRoute: 'adventure',
    section: 'adventure',
    isActive: true,
    order: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'slide_adv_3',
    title: 'White Water River Rafting',
    subtitle: 'Conquer Grade III & IV rapids on the Holy Ganges River',
    badgeText: 'HIGH THRILL',
    imageUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    targetRoute: 'adventure',
    section: 'adventure',
    isActive: true,
    order: 6,
    createdAt: new Date().toISOString()
  }
];

function readSlides() {
  try {
    if (!fs.existsSync(SLIDES_FILE)) {
      fs.mkdirSync(path.dirname(SLIDES_FILE), { recursive: true });
      fs.writeFileSync(SLIDES_FILE, JSON.stringify(DEFAULT_SLIDES, null, 2), 'utf-8');
      return DEFAULT_SLIDES;
    }
    const data = fs.readFileSync(SLIDES_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading slides file:', err);
    return [];
  }
}

function writeSlides(slides) {
  try {
    fs.mkdirSync(path.dirname(SLIDES_FILE), { recursive: true });
    fs.writeFileSync(SLIDES_FILE, JSON.stringify(slides, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving slides to file:', err);
    return false;
  }
}

// GET /api/v1/slides - Public endpoint for mobile app (Active slides only)
router.get('/', (req, res) => {
  try {
    const { section } = req.query;
    const slides = readSlides();
    let activeSlides = slides
      .filter(s => s.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (section) {
      const sec = section.toLowerCase().trim();
      if (sec === 'adventure' || sec === 'ent' || sec === 'entertainment') {
        activeSlides = activeSlides.filter(s => 
          (s.section && (s.section.toLowerCase() === 'adventure' || s.section.toLowerCase() === 'ent' || s.section.toLowerCase() === 'entertainment')) ||
          (s.targetRoute && (s.targetRoute.toLowerCase() === 'adventure' || s.targetRoute.toLowerCase() === 'ent'))
        );
      } else if (sec === 'services' || sec === 'service') {
        activeSlides = activeSlides.filter(s => 
          !s.section || 
          s.section.toLowerCase() === 'services' || 
          s.section.toLowerCase() === 'service' ||
          (s.targetRoute && s.targetRoute.toLowerCase() !== 'adventure' && s.targetRoute.toLowerCase() !== 'ent')
        );
      }
    }

    res.json({
      success: true,
      data: activeSlides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch slides'
    });
  }
});

// GET /api/v1/slides/admin - List all slides for admin panel
router.get('/admin', (req, res) => {
  try {
    const slides = readSlides();
    const sorted = [...slides].sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({
      success: true,
      data: sorted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin slides'
    });
  }
});

// POST /api/v1/slides/admin - Create a new slide
router.post('/admin', (req, res) => {
  try {
    const { title, subtitle, imageUrl, targetRoute, badgeText, order, isActive } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and Image URL are required'
      });
    }

    const slides = readSlides();
    const newSlide = {
      id: `slide_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      subtitle: (subtitle || '').trim(),
      imageUrl: imageUrl.trim(),
      targetRoute: (targetRoute || 'create_inspection').trim(),
      badgeText: (badgeText || '').trim().toUpperCase(),
      isActive: isActive !== false,
      order: typeof order === 'number' ? order : slides.length + 1,
      createdAt: new Date().toISOString()
    };

    slides.push(newSlide);
    writeSlides(slides);

    res.status(201).json({
      success: true,
      message: 'Slide created successfully',
      data: newSlide
    });
  } catch (error) {
    console.error('Error creating slide:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create slide'
    });
  }
});

// PUT /api/v1/slides/admin/:id - Update an existing slide
router.put('/admin/:id', (req, res) => {
  try {
    const { id } = req.params;
    const slides = readSlides();
    const index = slides.findIndex(s => s.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }

    const existing = slides[index];
    const updated = {
      ...existing,
      title: req.body.title !== undefined ? req.body.title.trim() : existing.title,
      subtitle: req.body.subtitle !== undefined ? req.body.subtitle.trim() : existing.subtitle,
      imageUrl: req.body.imageUrl !== undefined ? req.body.imageUrl.trim() : existing.imageUrl,
      targetRoute: req.body.targetRoute !== undefined ? req.body.targetRoute.trim() : existing.targetRoute,
      badgeText: req.body.badgeText !== undefined ? req.body.badgeText.trim().toUpperCase() : existing.badgeText,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : existing.isActive,
      order: req.body.order !== undefined ? Number(req.body.order) : existing.order,
      updatedAt: new Date().toISOString()
    };

    slides[index] = updated;
    writeSlides(slides);

    res.json({
      success: true,
      message: 'Slide updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update slide'
    });
  }
});

// DELETE /api/v1/slides/admin/:id - Delete a slide
router.delete('/admin/:id', (req, res) => {
  try {
    const { id } = req.params;
    const slides = readSlides();
    const filtered = slides.filter(s => s.id !== id);

    if (filtered.length === slides.length) {
      return res.status(404).json({
        success: false,
        message: 'Slide not found'
      });
    }

    writeSlides(filtered);

    res.json({
      success: true,
      message: 'Slide deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting slide:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete slide'
    });
  }
});

// Root aliases for convenience (e.g. POST /api/v1/slides)
router.post('/', (req, res, next) => {
  req.url = '/admin';
  router.handle(req, res, next);
});

router.put('/:id', (req, res, next) => {
  req.url = `/admin/${req.params.id}`;
  router.handle(req, res, next);
});

router.delete('/:id', (req, res, next) => {
  req.url = `/admin/${req.params.id}`;
  router.handle(req, res, next);
});

module.exports = router;
