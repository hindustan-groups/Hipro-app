const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OFFERS_FILE = path.join(__dirname, '../../uploads/offers.json');

// Default initial offers
const DEFAULT_OFFERS = [
  {
    id: 'offer_1',
    title: 'Flat 20% OFF on Waterproofing Audits',
    subtitle: 'Advanced infrared terrace & bathroom leakage scanning',
    category: 'Waterproofing',
    discount: '20% OFF',
    code: 'HIPRO20',
    badge: 'POPULAR',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    minAmount: 1500,
    validTill: '30 Nov 2026',
    targetRoute: 'service:Waterproofing',
    terms: 'Applicable on residential and commercial inspections.',
    isActive: true,
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offer_2',
    title: 'Flat ₹500 OFF on Structural Repairs',
    subtitle: 'Certified engineers for crack stitching & foundation care',
    category: 'Civil',
    discount: '₹500 OFF',
    code: 'CIVIL500',
    badge: 'EXCLUSIVE',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?auto=format&fit=crop&w=800&q=80',
    minAmount: 2500,
    validTill: '15 Dec 2026',
    targetRoute: 'service:Civil',
    terms: 'Valid once per user for inspection bookings above ₹2,500.',
    isActive: true,
    order: 2,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offer_3',
    title: 'Free Initial Site Consultation',
    subtitle: 'Expert site evaluation for new home constructions & renovations',
    category: 'Trending',
    discount: 'FREE VISIT',
    code: 'FIRSTFREE',
    badge: 'NEW USER',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    minAmount: 0,
    validTill: '31 Dec 2026',
    targetRoute: 'create_inspection',
    terms: 'Valid for first-time customers in Bhilwara & surrounding areas.',
    isActive: true,
    order: 3,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offer_4',
    title: 'Save 15% on Full Home Renovation',
    subtitle: 'Comprehensive architectural planning and modern elevation',
    category: 'Renovation',
    discount: '15% OFF',
    code: 'RENO15',
    badge: 'LIMITED TIME',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    minAmount: 5000,
    validTill: '10 Jan 2027',
    targetRoute: 'service:Renovation',
    terms: 'Applies to full renovation and structural remodelling packages.',
    isActive: true,
    order: 4,
    createdAt: new Date().toISOString()
  }
];

function readOffers() {
  try {
    if (!fs.existsSync(OFFERS_FILE)) {
      fs.mkdirSync(path.dirname(OFFERS_FILE), { recursive: true });
      fs.writeFileSync(OFFERS_FILE, JSON.stringify(DEFAULT_OFFERS, null, 2), 'utf-8');
      return DEFAULT_OFFERS;
    }
    const data = fs.readFileSync(OFFERS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading offers file:', err);
    return [];
  }
}

function writeOffers(offers) {
  try {
    fs.mkdirSync(path.dirname(OFFERS_FILE), { recursive: true });
    fs.writeFileSync(OFFERS_FILE, JSON.stringify(offers, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing offers file:', err);
    return false;
  }
}

// GET /api/v1/offers - Public endpoint for mobile app
router.get('/', (req, res) => {
  try {
    const offers = readOffers();
    const active = offers
      .filter(o => o.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return res.json({
      success: true,
      count: active.length,
      offers: active
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve offers', error: err.message });
  }
});

// GET /api/v1/offers/admin - Admin endpoint for all offers
router.get('/admin', (req, res) => {
  try {
    const offers = readOffers();
    return res.json({
      success: true,
      count: offers.length,
      offers: offers.sort((a, b) => (a.order || 0) - (b.order || 0))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve offers', error: err.message });
  }
});

// POST /api/v1/offers - Create new offer
router.post(['/', '/admin'], (req, res) => {
  try {
    const {
      title,
      subtitle,
      category,
      discount,
      code,
      badge,
      imageUrl,
      minAmount,
      validTill,
      targetRoute,
      terms,
      order,
      isActive
    } = req.body;

    if (!title || !code) {
      return res.status(400).json({ success: false, message: 'Title and Coupon Code are required' });
    }

    const offers = readOffers();
    const newOffer = {
      id: `offer_${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      category: category ? category.trim() : 'Trending',
      discount: discount ? discount.trim() : 'SPECIAL OFFER',
      code: code.trim().toUpperCase(),
      badge: badge ? badge.trim() : '',
      imageUrl: imageUrl ? imageUrl.trim() : '',
      minAmount: Number(minAmount) || 0,
      validTill: validTill ? validTill.trim() : 'Limited Period',
      targetRoute: targetRoute ? targetRoute.trim() : 'create_inspection',
      terms: terms ? terms.trim() : 'Standard terms & conditions apply.',
      order: Number(order) || (offers.length + 1),
      isActive: isActive !== false,
      createdAt: new Date().toISOString()
    };

    offers.push(newOffer);
    writeOffers(offers);

    return res.status(201).json({
      success: true,
      message: 'Offer created successfully',
      offer: newOffer
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create offer', error: err.message });
  }
});

// PUT /api/v1/offers/:id - Update offer
router.put(['/:id', '/admin/:id'], (req, res) => {
  try {
    const { id } = req.params;
    const offers = readOffers();
    const index = offers.findIndex(o => o.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    const updated = {
      ...offers[index],
      ...req.body,
      id: offers[index].id,
      updatedAt: new Date().toISOString()
    };

    if (req.body.code) {
      updated.code = req.body.code.trim().toUpperCase();
    }

    offers[index] = updated;
    writeOffers(offers);

    return res.json({
      success: true,
      message: 'Offer updated successfully',
      offer: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update offer', error: err.message });
  }
});

// DELETE /api/v1/offers/:id - Delete offer
router.delete(['/:id', '/admin/:id'], (req, res) => {
  try {
    const { id } = req.params;
    let offers = readOffers();
    const initialLength = offers.length;
    offers = offers.filter(o => o.id !== id);

    if (offers.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }

    writeOffers(offers);
    return res.json({
      success: true,
      message: 'Offer deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete offer', error: err.message });
  }
});

module.exports = router;
