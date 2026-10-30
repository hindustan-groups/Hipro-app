const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const OFFERS_FILE = path.join(__dirname, '../../uploads/offers.json');

// Default initial offers
const DEFAULT_OFFERS = [
  // --- Service Coupons & Offers ---
  {
    id: 'offer_1',
    title: 'Flat 20% OFF on Waterproofing Audits',
    subtitle: 'Advanced infrared terrace & bathroom leakage scanning',
    category: 'Waterproofing',
    section: 'services',
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
    section: 'services',
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
    section: 'services',
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
    section: 'services',
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
  },
  // --- Adventure / Entertainment Coupons & Offers ---
  {
    id: 'offer_adv_1',
    title: 'Flat 20% OFF on River Rafting & Sky Adventures',
    subtitle: 'Valid on Ganga river rafting, tandem paragliding & paramotor passes',
    category: 'Adventure',
    section: 'adventure',
    discount: '20% OFF',
    code: 'THRILL20',
    badge: 'TOP ADVENTURE',
    imageUrl: 'https://images.unsplash.com/photo-1516298773066-c48f8e9bd92b?auto=format&fit=crop&w=800&q=80',
    minAmount: 1000,
    validTill: '31 Dec 2026',
    targetRoute: 'adventure',
    terms: 'Applicable on adventure passes in Rishikesh & Dehradun.',
    isActive: true,
    order: 5,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offer_adv_2',
    title: 'Flat ₹300 OFF on Jaisalmer Desert Camps',
    subtitle: 'Camp under the stars with sunset camel ride & Rajasthani folk night',
    category: 'Desert Safari',
    section: 'adventure',
    discount: '₹300 OFF',
    code: 'DESERT300',
    badge: 'DESERT SPECIAL',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    minAmount: 1200,
    validTill: '31 Jan 2027',
    targetRoute: 'adventure',
    terms: 'Valid on desert safari & tent stay packages in Sam Dunes.',
    isActive: true,
    order: 6,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offer_adv_3',
    title: 'Save 10% on Group Adventure Passes',
    subtitle: 'Special concession for groups of 3 or more adventurers',
    category: 'Air Sports',
    section: 'adventure',
    discount: '10% OFF',
    code: 'GROUP10',
    badge: 'GROUP PASS',
    imageUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    minAmount: 1500,
    validTill: '28 Feb 2027',
    targetRoute: 'adventure',
    terms: 'Minimum booking of ₹1,500 required.',
    isActive: true,
    order: 7,
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

function calculateDiscount(discountStr, amount) {
  if (!discountStr || typeof discountStr !== 'string') return 0;
  const str = discountStr.toUpperCase().trim();
  
  // Percentage match e.g. "20% OFF", "15%", "FLAT 25%"
  const percentMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1]);
    if (!isNaN(pct) && pct > 0) {
      return Math.round((amount * pct) / 100);
    }
  }

  // Flat rupee match e.g. "₹500 OFF", "RS 500", "500 OFF", "FLAT 200"
  const rupeeMatch = str.match(/(?:₹|RS\.?|FLAT)?\s*(\d+(?:\.\d+)?)/i);
  if (rupeeMatch) {
    const flat = parseFloat(rupeeMatch[1]);
    if (!isNaN(flat) && flat > 0) {
      return Math.min(amount, flat);
    }
  }

  // Free visit match
  if (str.includes('FREE')) {
    return amount;
  }

  return 0;
}

// POST /api/v1/offers/validate - Validate coupon code & compute discount
router.post('/validate', (req, res) => {
  try {
    const { code, amount, section } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const trimmedCode = code.trim().toUpperCase();
    const orderAmount = parseFloat(amount || 0);

    const offers = readOffers();
    const offer = offers.find(o => (o.code || '').trim().toUpperCase() === trimmedCode);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: `Coupon "${trimmedCode}" is invalid.`
      });
    }

    if (offer.isActive === false) {
      return res.status(400).json({
        success: false,
        message: `Coupon "${trimmedCode}" is no longer active.`
      });
    }

    // Section validation (Separation between Services & Entertainment/Adventure)
    if (section && typeof section === 'string') {
      const targetSec = section.toLowerCase().trim();
      const offerSec = (offer.section || 'services').toLowerCase().trim();

      if (targetSec === 'adventure' || targetSec === 'ent' || targetSec === 'entertainment') {
        if (offerSec === 'services' || offerSec === 'service') {
          return res.status(400).json({
            success: false,
            message: `Coupon "${trimmedCode}" is valid only for Home Services bookings, not for Adventure bookings.`
          });
        }
      } else if (targetSec === 'services' || targetSec === 'service') {
        if (offerSec === 'adventure' || offerSec === 'ent' || offerSec === 'entertainment') {
          return res.status(400).json({
            success: false,
            message: `Coupon "${trimmedCode}" is valid only for Adventure & Entertainment bookings, not for Home Services.`
          });
        }
      }
    }

    // Check minimum order amount if specified
    const minAmount = parseFloat(offer.minAmount || 0);
    if (minAmount > 0 && orderAmount > 0 && orderAmount < minAmount) {
      return res.status(400).json({
        success: false,
        message: `Coupon requires a minimum booking amount of ₹${minAmount.toLocaleString('en-IN')}. (Current: ₹${orderAmount.toLocaleString('en-IN')})`
      });
    }

    // Calculate discount amount
    let discountAmount = calculateDiscount(offer.discount, orderAmount);
    if (orderAmount > 0) {
      discountAmount = Math.min(orderAmount, discountAmount);
    }
    const finalAmount = Math.max(0, orderAmount - discountAmount);

    return res.json({
      success: true,
      valid: true,
      coupon: {
        id: offer.id,
        code: offer.code,
        title: offer.title,
        subtitle: offer.subtitle,
        category: offer.category,
        section: offer.section || 'services',
        discount: offer.discount,
        discountAmount,
        originalAmount: orderAmount,
        finalAmount,
        minAmount,
        terms: offer.terms || 'Standard terms apply.'
      },
      message: `Coupon "${trimmedCode}" applied successfully! You save ₹${discountAmount.toLocaleString('en-IN')}.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to validate coupon', error: err.message });
  }
});

// GET /api/v1/offers - Public endpoint for mobile app
router.get('/', (req, res) => {
  try {
    const { section } = req.query;
    const offers = readOffers();
    let active = offers
      .filter(o => o.isActive !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    if (section && typeof section === 'string') {
      const sec = section.toLowerCase().trim();
      if (sec === 'adventure' || sec === 'ent' || sec === 'entertainment') {
        active = active.filter(o => 
          (o.section && (o.section.toLowerCase() === 'adventure' || o.section.toLowerCase() === 'ent' || o.section.toLowerCase() === 'entertainment')) ||
          (o.category && (o.category.toLowerCase().includes('adventure') || o.category.toLowerCase().includes('safari') || o.category.toLowerCase().includes('sports')))
        );
      } else if (sec === 'services' || sec === 'service') {
        active = active.filter(o => 
          !o.section || 
          o.section.toLowerCase() === 'services' || 
          o.section.toLowerCase() === 'service' ||
          (o.section.toLowerCase() !== 'adventure' && o.section.toLowerCase() !== 'ent')
        );
      }
    }

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

router.readOffers = readOffers;
router.calculateDiscount = calculateDiscount;
module.exports = router;
