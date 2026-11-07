const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { authenticate, requireAdmin } = require('../middleware/auth');

// File paths for persistence
const uploadsDir = path.join(__dirname, '../data/ent');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
['ent_experiences.json', 'ent_categories.json', 'ent_bookings.json', 'ent_reviews.json'].forEach(f => {
  const oldP = path.join(__dirname, '../../uploads', f);
  const newP = path.join(uploadsDir, f);
  if (fs.existsSync(oldP) && !fs.existsSync(newP)) { try { fs.copyFileSync(oldP, newP); fs.unlinkSync(oldP); } catch(e){} }
});
const ENT_DATA_FILE = path.join(uploadsDir, 'ent_experiences.json');
const ENT_CATEGORIES_FILE = path.join(uploadsDir, 'ent_categories.json');
const ENT_BOOKINGS_FILE = path.join(uploadsDir, 'ent_bookings.json');
const ENT_REVIEWS_FILE = path.join(uploadsDir, 'ent_reviews.json');

// Ensure parent folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Helpers for Persistence ---
function loadCategories() {
  try {
    if (fs.existsSync(ENT_CATEGORIES_FILE)) {
      const raw = fs.readFileSync(ENT_CATEGORIES_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading ent_categories.json:', err.message);
  }
  return [];
}

function saveCategories(categories) {
  try {
    fs.writeFileSync(ENT_CATEGORIES_FILE, JSON.stringify(categories, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing ent_categories.json:', err.message);
  }
}

function loadEntItems() {
  try {
    if (fs.existsSync(ENT_DATA_FILE)) {
      const raw = fs.readFileSync(ENT_DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];

      // Ensure every sport/experience is formally linked to categoryId and category
      const categories = loadCategories();
      let updated = false;
      data.forEach((item) => {
        if (!item.categoryId && item.category) {
          const found = categories.find(
            (c) => c.name.toLowerCase() === item.category.toLowerCase()
          );
          if (found) {
            item.categoryId = found.id;
            updated = true;
          }
        } else if (item.categoryId && !item.category) {
          const found = categories.find(
            (c) => c.id === item.categoryId || c.slug === item.categoryId
          );
          if (found) {
            item.category = found.name;
            updated = true;
          }
        }
      });
      if (updated) {
        saveEntItems(data);
      }
      return data;
    }
  } catch (err) {
    console.error('Error reading ent_experiences.json:', err.message);
  }
  return [];
}

function saveEntItems(data) {
  try {
    fs.writeFileSync(ENT_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing ent_experiences.json:', err.message);
  }
}

function loadBookings() {
  try {
    if (fs.existsSync(ENT_BOOKINGS_FILE)) {
      const raw = fs.readFileSync(ENT_BOOKINGS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.error('Error reading ent_bookings.json:', err.message);
  }
  return [];
}

function saveBookings(bookings) {
  try {
    fs.writeFileSync(ENT_BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing ent_bookings.json:', err.message);
  }
}

function loadReviews() {
  try {
    if (fs.existsSync(ENT_REVIEWS_FILE)) {
      const raw = fs.readFileSync(ENT_REVIEWS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.error('Error reading ent_reviews.json:', err.message);
  }
  return [];
}

function saveReviews(reviews) {
  try {
    fs.writeFileSync(ENT_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing ent_reviews.json:', err.message);
  }
}

// -------------------------------------------------------------
// 1. GET ENT Items: / , /items , /list , /experiences
// Query params: city, category, search, featured, minPrice, maxPrice, sortBy
// -------------------------------------------------------------
const getEntListHandler = (req, res) => {
  try {
    const { city, category, categoryId, search, featured, minPrice, maxPrice, sortBy } = req.query;
    let list = loadEntItems().filter((item) => item.isActive !== false);

    if (city && city.toLowerCase() !== 'all') {
      list = list.filter((item) => item.city.toLowerCase() === city.toLowerCase());
    }

    if (categoryId && categoryId.toLowerCase() !== 'all') {
      list = list.filter((item) => item.categoryId && item.categoryId.toLowerCase() === categoryId.toLowerCase());
    }

    if (category && category.toLowerCase() !== 'all') {
      list = list.filter(
        (item) =>
          (item.category && item.category.toLowerCase() === category.toLowerCase()) ||
          (item.categoryId && item.categoryId.toLowerCase() === category.toLowerCase())
      );
    }

    if (featured === 'true') {
      list = list.filter((item) => item.isFeatured === true);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      list = list.filter((item) => item.startingPrice >= Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      list = list.filter((item) => item.startingPrice <= Number(maxPrice));
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.tagline.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.startingPrice - b.startingPrice);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.startingPrice - a.startingPrice);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      list.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.reviewsCount || 0) - (a.reviewsCount || 0);
      });
    }

    res.json({
      success: true,
      category: 'ENT',
      categoryTitle: 'Entertainment & Adventures',
      count: list.length,
      data: list,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ENT items',
      error: error.message,
    });
  }
};

router.get('/', getEntListHandler);
router.get('/items', getEntListHandler);
router.get('/list', getEntListHandler);
router.get('/experiences', getEntListHandler);

// -------------------------------------------------------------
// 2. Metadata: /cities & /categories
// -------------------------------------------------------------
router.get('/cities', (req, res) => {
  try {
    const list = loadEntItems();
    const citiesSet = new Set(list.filter((e) => e.isActive !== false).map((e) => e.city));
    const cities = ['All', ...Array.from(citiesSet)];

    res.json({ success: true, cities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = loadCategories().filter((c) => c.isActive !== false);
    const items = loadEntItems().filter((e) => e.isActive !== false);

    // Dynamic count per category
    const categoriesWithCount = categories.map((cat) => {
      const count = items.filter(
        (item) =>
          (item.categoryId && item.categoryId.toLowerCase() === cat.id.toLowerCase()) ||
          (item.category && item.category.toLowerCase() === cat.name.toLowerCase())
      ).length;
      return {
        ...cat,
        activitiesCount: count,
        count: count,
      };
    });

    // Backwards-compatible simple string list
    const categoryNames = ['All', ...categories.map((c) => c.name)];

    res.json({
      success: true,
      categories: categoryNames,
      data: categoriesWithCount,
      items: categoriesWithCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dynamic Category: Create
router.post('/categories', authenticate, requireAdmin, (req, res) => {
  try {
    const { name, tagline, icon, color, imageUrl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const categories = loadCategories();
    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = `cat_${slug || Date.now().toString(36)}`;

    // Check if category already exists
    const existing = categories.find(
      (c) => c.id === id || c.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists' });
    }

    const newCategory = {
      id,
      name: cleanName,
      slug,
      tagline: tagline ? tagline.trim() : '',
      icon: icon || '',
      color: color || '',
      imageUrl: imageUrl || '',
      displayOrder: categories.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    saveCategories(categories);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { ...newCategory, activitiesCount: 0, count: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dynamic Category: Update
router.put('/categories/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, tagline, icon, color, imageUrl, isActive, displayOrder } = req.body;
    const categories = loadCategories();
    const idx = categories.findIndex((c) => c.id === id || c.slug === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const oldName = categories[idx].name;
    const updated = {
      ...categories[idx],
      ...(name && { name: name.trim() }),
      ...(tagline !== undefined && { tagline: tagline.trim() }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isActive !== undefined && { isActive }),
      ...(displayOrder !== undefined && { displayOrder: Number(displayOrder) }),
      updatedAt: new Date().toISOString(),
    };

    categories[idx] = updated;
    saveCategories(categories);

    // If category name was renamed, update all linked experiences
    if (name && name.trim() !== oldName) {
      const items = loadEntItems();
      let changed = false;
      items.forEach((item) => {
        if (item.categoryId === id || (item.category && item.category.toLowerCase() === oldName.toLowerCase())) {
          item.category = name.trim();
          item.categoryId = id;
          changed = true;
        }
      });
      if (changed) saveEntItems(items);
    }

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dynamic Category: Delete
router.delete('/categories/:id', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let categories = loadCategories();
    const category = categories.find((c) => c.id === id || c.slug === id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    categories = categories.filter((c) => c.id !== category.id);
    saveCategories(categories);

    res.json({
      success: true,
      message: 'Category removed successfully',
      id: category.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dynamic Category: Get linked experiences
router.get('/categories/:id/experiences', (req, res) => {
  try {
    const { id } = req.params;
    const categories = loadCategories();
    const cat = categories.find(
      (c) => c.id === id || c.slug === id || c.name.toLowerCase() === id.toLowerCase()
    );

    const items = loadEntItems().filter((item) => {
      if (item.isActive === false) return false;
      if (cat) {
        return (
          item.categoryId === cat.id ||
          (item.category && item.category.toLowerCase() === cat.name.toLowerCase())
        );
      }
      return (
        item.categoryId === id ||
        (item.category && item.category.toLowerCase() === id.toLowerCase())
      );
    });

    res.json({
      success: true,
      category: cat || { id, name: id },
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 3. Bookings: /bookings , /my-bookings/:userId , /bookings/:bookingCode
// -------------------------------------------------------------
router.post('/bookings', authenticate, async (req, res) => {
  try {
    const {
      experienceId,
      entId,
      travelerName,
      travelerPhone,
      date,
      timeSlot,
      guestsCount = 1,
      notes,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;
    const userId = req.user.id;

    const targetId = entId || experienceId;

    if (!targetId || !travelerName || !travelerPhone || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields (entId / experienceId, travelerName, travelerPhone, date, timeSlot)',
      });
    }

    const items = loadEntItems();
    const ent = items.find((e) => e.id === targetId);
    if (!ent) {
      return res.status(404).json({
        success: false,
        message: 'ENT item not found',
      });
    }

    const guests = Math.max(1, parseInt(guestsCount, 10) || 1);
    const baseAmount = ent.startingPrice * guests;
    const taxes = Math.round(baseAmount * 0.05); // 5% GST
    const totalAmount = baseAmount + taxes;

    // Mandatory payment verification for ENT bookings
    const rzKey = process.env.RAZORPAY_KEY_ID;
    const rzSecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification required: razorpayPaymentId, razorpayOrderId, and razorpaySignature are mandatory for ENT bookings',
      });
    }

    if (rzSecret) {
      const hmac = crypto.createHmac('sha256', rzSecret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const digest = hmac.digest('hex');
      if (digest !== razorpaySignature) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed. ENT booking cannot be confirmed.',
        });
      }
    }

    if (rzKey && rzSecret) {
      try {
        const auth = Buffer.from(`${rzKey}:${rzSecret}`).toString('base64');
        const paymentRes = await axios.get(
          `https://api.razorpay.com/v1/payments/${razorpayPaymentId}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        const paymentData = paymentRes.data;
        if (paymentData.status !== 'captured') {
          return res.status(400).json({
            success: false,
            message: `Payment is not captured (status: ${paymentData.status}). Booking rejected.`,
          });
        }
        if (paymentData.order_id && paymentData.order_id !== razorpayOrderId) {
          return res.status(400).json({
            success: false,
            message: 'Payment order_id mismatch.',
          });
        }
        const paidAmount = paymentData.amount / 100;
        if (Math.abs(paidAmount - totalAmount) > 1) {
          return res.status(400).json({
            success: false,
            message: `Payment amount mismatch: expected ₹${totalAmount}, got ₹${paidAmount}`,
          });
        }
      } catch (rzErr) {
        console.error('ENT payment verification API error:', rzErr.response?.data || rzErr.message);
        return res.status(400).json({
          success: false,
          message: 'Unable to verify payment with payment gateway. Booking creation rejected.',
        });
      }
    }

    // Generate unique ENT booking reference
    const bookingCode = `ENT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking = {
      id: `booking_${Date.now()}`,
      bookingCode,
      entId: ent.id,
      experienceId: ent.id,
      experienceTitle: ent.title,
      title: ent.title,
      city: ent.city,
      category: ent.category,
      imageUrl: ent.imageUrl,
      reportingPoint: ent.reportingPoint,
      vendorId: ent.vendorId || '',
      vendorName: ent.vendorName || '',
      vendorBusiness: ent.vendorBusiness || '',
      vendorPhone: ent.vendorPhone || '',
      userId,
      travelerName,
      travelerPhone,
      travelDate: date,
      timeSlot,
      guestsCount: guests,
      unitPrice: ent.startingPrice,
      baseAmount,
      taxGST: taxes,
      totalAmount,
      currency: 'INR',
      notes: notes || '',
      razorpayPaymentId,
      razorpayOrderId,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      createdAt: new Date().toISOString(),
    };

    const bookings = loadBookings();
    bookings.unshift(newBooking);
    saveBookings(bookings);

    // If socket.io is active, notify admin, user, and vendor in real-time
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_ent_booking', {
        message: `New ENT adventure booked: ${ent.title} in ${ent.city}`,
        booking: newBooking,
      });
      if (newBooking.userId) {
        io.to(`user_${newBooking.userId}`).emit('new_ent_booking', {
          booking: newBooking,
        });
      }
      if (newBooking.vendorId) {
        io.to(`vendor_${newBooking.vendorId}`).emit('vendor_adventure_booking', newBooking);
      }
    }

    res.status(201).json({
      success: true,
      message: 'ENT booking confirmed successfully!',
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create ENT booking',
      error: error.message,
    });
  }
});

router.get('/my-bookings/:userId', authenticate, (req, res) => {
  try {
    const { userId } = req.params;
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = req.user.id === userId || (req.user.phone && req.user.phone === userId);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access bookings of another user',
      });
    }

    const bookings = loadBookings();
    const cleanId = String(userId || '').trim().toLowerCase();

    const userBookings = bookings.filter((b) => {
      const bUser = String(b.userId || '').trim().toLowerCase();
      const bPhone = String(b.travelerPhone || '').trim();

      if (isAdmin) {
        return bUser === cleanId || bPhone === cleanId;
      }
      return bUser === req.user.id || (req.user.phone && bPhone === req.user.phone);
    });

    res.json({
      success: true,
      count: userBookings.length,
      bookings: userBookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user ENT bookings',
      error: error.message,
    });
  }
});

router.get('/bookings/:bookingCode', authenticate, (req, res) => {
  try {
    const { bookingCode } = req.params;
    const bookings = loadBookings();
    const booking = bookings.find(
      (b) => b.bookingCode === bookingCode || b.id === bookingCode
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ENT booking not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = booking.userId === req.user.id || (req.user.phone && booking.travelerPhone === req.user.phone);
    const isVendor = req.user.role === 'VENDOR' && booking.vendorId === req.user.vendorId;

    if (!isAdmin && !isOwner && !isVendor) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot view this booking' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/bookings/:id/cancel', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const bookings = loadBookings();
    const idx = bookings.findIndex((b) => b.id === id || b.bookingCode === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[idx];
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = booking.userId === req.user.id || (req.user.phone && booking.travelerPhone === req.user.phone);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot cancel this booking' });
    }

    bookings[idx].status = 'CANCELLED';
    bookings[idx].cancelReason = reason || '';
    bookings[idx].refundStatus = 'INITIATED';
    bookings[idx].cancelledAt = new Date().toISOString();
    saveBookings(bookings);

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('ent_booking_updated', {
        action: 'CANCELLED',
        booking: bookings[idx],
      });
      if (booking.userId) {
        io.to(`user_${booking.userId}`).emit('ent_booking_updated', {
          action: 'CANCELLED',
          booking: bookings[idx],
        });
      }
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully. Refund initiated.',
      booking: bookings[idx],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/bookings/:id/reschedule', authenticate, (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlot } = req.body;

    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Date and timeSlot are required' });
    }

    const bookings = loadBookings();
    const idx = bookings.findIndex((b) => b.id === id || b.bookingCode === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[idx];
    const isAdmin = req.user.role === 'ADMIN';
    const isOwner = booking.userId === req.user.id || (req.user.phone && booking.travelerPhone === req.user.phone);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot reschedule this booking' });
    }

    bookings[idx].travelDate = date;
    bookings[idx].timeSlot = timeSlot;
    bookings[idx].updatedAt = new Date().toISOString();
    saveBookings(bookings);

    res.json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking: bookings[idx],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// 4. Admin Management & Stats: /admin/bookings , /admin/stats
// -------------------------------------------------------------
router.get('/admin/bookings', authenticate, requireAdmin, (req, res) => {
  try {
    const { status, city } = req.query;
    let bookings = loadBookings();

    if (status && status !== 'All') {
      bookings = bookings.filter((b) => b.status.toUpperCase() === status.toUpperCase());
    }

    if (city && city !== 'All') {
      bookings = bookings.filter((b) => b.city.toLowerCase() === city.toLowerCase());
    }

    res.json({ success: true, total: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/ent/vendor/bookings - Specific to an adventure vendor
router.get('/vendor/bookings', authenticate, (req, res) => {
  try {
    const { status, search } = req.query;
    let targetVendorId = req.query.vendorId;
    if (req.user.role === 'VENDOR') {
      targetVendorId = req.user.vendorId || req.user.id;
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to vendors and admins' });
    }
    let bookings = loadBookings();
    if (targetVendorId && targetVendorId !== 'ALL') {
      bookings = bookings.filter((b) => b.vendorId === targetVendorId);
    }
    if (status && status !== 'All') {
      bookings = bookings.filter((b) => (b.status || '').toUpperCase() === status.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          (b.travelerName || '').toLowerCase().includes(q) ||
          (b.travelerPhone || '').includes(q) ||
          (b.experienceTitle || '').toLowerCase().includes(q) ||
          (b.bookingCode || '').toLowerCase().includes(q)
      );
    }
    res.json({ success: true, total: bookings.length, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/admin/bookings/:id/status', authenticate, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const bookings = loadBookings();
    const idx = bookings.findIndex((b) => b.id === id || b.bookingCode === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    bookings[idx].status = status;
    bookings[idx].updatedAt = new Date().toISOString();
    saveBookings(bookings);

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('ent_booking_updated', {
        action: 'STATUS_UPDATED',
        status,
        booking: bookings[idx],
      });
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: bookings[idx],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/admin/stats', authenticate, requireAdmin, (req, res) => {
  try {
    const items = loadEntItems();
    const bookings = loadBookings();

    const totalEntItems = items.length;
    const activeEntItems = items.filter((e) => e.isActive !== false).length;
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;

    const totalRevenue = bookings
      .filter((b) => b.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    const cityBreakdown = {};
    items.forEach((e) => {
      cityBreakdown[e.city] = (cityBreakdown[e.city] || 0) + 1;
    });

    const categoryBreakdown = {};
    items.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        totalEntItems,
        totalExperiences: totalEntItems,
        activeEntItems,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        currency: 'INR',
        cityBreakdown,
        categoryBreakdown,
        recentBookings: bookings.slice(0, 5),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 5. Create new ENT item: POST / , /items , /experiences
// -------------------------------------------------------------
const createEntHandler = (req, res) => {
  try {
    const {
      title,
      tagline,
      city,
      locationDetails,
      categoryId,
      category,
      startingPrice,
      originalPrice,
      duration,
      imageUrl,
      gallery,
      inclusions,
      safetyGuidelines,
      slots,
      reportingPoint,
      groupSize,
      minAge,
      difficulty,
      discountBadge,
      isFeatured,
    } = req.body;

    if (!title || !city || !startingPrice) {
      return res.status(400).json({
        success: false,
        message: 'Title, city, and startingPrice are required fields',
      });
    }

    const categories = loadCategories();
    let finalCategoryId = categoryId;
    let finalCategoryName = category;

    if (finalCategoryId) {
      const match = categories.find((c) => c.id === finalCategoryId || c.slug === finalCategoryId);
      if (match) {
        finalCategoryName = match.name;
        finalCategoryId = match.id;
      }
    } else if (finalCategoryName) {
      const match = categories.find((c) => c.name.toLowerCase() === finalCategoryName.toLowerCase());
      if (match) {
        finalCategoryId = match.id;
        finalCategoryName = match.name;
      } else {
        finalCategoryId = `cat_${finalCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      }
    } else {
      finalCategoryId = '';
      finalCategoryName = '';
    }

    const items = loadEntItems();
    const prefix = city.substring(0, 3).toLowerCase();
    const newId = `ent_${prefix}_${Date.now().toString(36)}`;

    const newEnt = {
      id: newId,
      title: title.trim(),
      tagline: tagline || '',
      city: city.trim(),
      locationDetails: locationDetails || '',
      categoryId: finalCategoryId,
      category: finalCategoryName,
      rating: 0,
      reviewsCount: 0,
      startingPrice: Number(startingPrice),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      discountBadge: discountBadge || '',
      duration: duration || '',
      groupSize: groupSize || '',
      minAge: minAge ? Number(minAge) : null,
      difficulty: difficulty || '',
      imageUrl: imageUrl || '',
      gallery: Array.isArray(gallery) ? gallery : [],
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      safetyGuidelines: Array.isArray(safetyGuidelines) ? safetyGuidelines : [],
      slots: Array.isArray(slots) ? slots : [],
      reportingPoint: reportingPoint || '',
      vendorId: req.body.vendorId || '',
      vendorName: req.body.vendorName || '',
      vendorBusiness: req.body.vendorBusiness || '',
      vendorPhone: req.body.vendorPhone || '',
      isFeatured: !!isFeatured,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    items.unshift(newEnt);
    saveEntItems(items);

    res.status(201).json({
      success: true,
      message: 'New ENT item created successfully',
      data: newEnt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create ENT item',
      error: error.message,
    });
  }
};

router.post('/', authenticate, requireAdmin, createEntHandler);
router.post('/items', authenticate, requireAdmin, createEntHandler);
router.post('/experiences', authenticate, requireAdmin, createEntHandler);

// -------------------------------------------------------------
// 6. Single ENT Item Details: GET /:id or /experiences/:id
// -------------------------------------------------------------
const getSingleEntHandler = (req, res) => {
  try {
    const list = loadEntItems();
    const item = list.find((e) => e.id === req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'ENT item not found',
      });
    }

    const allReviews = loadReviews();
    const itemReviews = allReviews.filter((r) => r.entId === item.id || r.experienceId === item.id);

    res.json({
      success: true,
      data: {
        ...item,
        reviews: itemReviews,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ENT item details',
      error: error.message,
    });
  }
};

router.get('/experiences/:id', getSingleEntHandler);
router.get('/items/:id', getSingleEntHandler);
router.get('/:id', getSingleEntHandler);

// -------------------------------------------------------------
// 7. Update ENT Item: PUT /:id or /experiences/:id
// -------------------------------------------------------------
const updateEntHandler = (req, res) => {
  try {
    const { id } = req.params;
    const items = loadEntItems();
    const idx = items.findIndex((e) => e.id === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'ENT item not found' });
    }

    const categories = loadCategories();
    let finalCategoryId = req.body.categoryId || items[idx].categoryId;
    let finalCategoryName = req.body.category || items[idx].category;

    if (req.body.categoryId && req.body.categoryId !== items[idx].categoryId) {
      const match = categories.find((c) => c.id === req.body.categoryId || c.slug === req.body.categoryId);
      if (match) {
        finalCategoryName = match.name;
        finalCategoryId = match.id;
      }
    } else if (req.body.category && req.body.category !== items[idx].category) {
      const match = categories.find((c) => c.name.toLowerCase() === req.body.category.toLowerCase());
      if (match) {
        finalCategoryId = match.id;
        finalCategoryName = match.name;
      }
    }

    const updated = {
      ...items[idx],
      ...req.body,
      id: items[idx].id,
      categoryId: finalCategoryId,
      category: finalCategoryName,
      updatedAt: new Date().toISOString(),
    };

    items[idx] = updated;
    saveEntItems(items);

    res.json({
      success: true,
      message: 'ENT item updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.put('/experiences/:id', authenticate, requireAdmin, updateEntHandler);
router.put('/:id', authenticate, requireAdmin, updateEntHandler);

// -------------------------------------------------------------
// 8. Delete / Deactivate ENT Item: DELETE /:id or /experiences/:id
// -------------------------------------------------------------
const deleteEntHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;
    let items = loadEntItems();
    const idx = items.findIndex((e) => e.id === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'ENT item not found' });
    }

    if (permanent === 'true') {
      items = items.filter((e) => e.id !== id);
      saveEntItems(items);
      return res.json({ success: true, message: 'ENT item permanently removed' });
    }

    items[idx].isActive = false;
    items[idx].updatedAt = new Date().toISOString();
    saveEntItems(items);

    res.json({
      success: true,
      message: 'ENT item deactivated successfully',
      data: items[idx],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.delete('/experiences/:id', authenticate, requireAdmin, deleteEntHandler);
router.delete('/:id', authenticate, requireAdmin, deleteEntHandler);

// -------------------------------------------------------------
// 9. Toggle Active/Featured: PATCH /:id/toggle
// -------------------------------------------------------------
const toggleEntHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { field } = req.body;
    const items = loadEntItems();
    const ent = items.find((e) => e.id === id);

    if (!ent) {
      return res.status(404).json({ success: false, message: 'ENT item not found' });
    }

    const targetField = field === 'isActive' ? 'isActive' : 'isFeatured';
    ent[targetField] = !ent[targetField];
    ent.updatedAt = new Date().toISOString();
    saveEntItems(items);

    res.json({
      success: true,
      message: `${targetField} toggled to ${ent[targetField]}`,
      data: ent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.patch('/experiences/:id/toggle', authenticate, requireAdmin, toggleEntHandler);
router.patch('/:id/toggle', authenticate, requireAdmin, toggleEntHandler);

// -------------------------------------------------------------
// 10. Reviews & Ratings: GET & POST /:id/reviews
// -------------------------------------------------------------
const getEntReviewsHandler = (req, res) => {
  try {
    const { id } = req.params;
    const reviews = loadReviews().filter((r) => r.entId === id || r.experienceId === id);

    res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addEntReviewHandler = (req, res) => {
  try {
    const { id } = req.params;
    const { userName, rating, comment } = req.body;

    if (!userName || !rating) {
      return res.status(400).json({ success: false, message: 'User name and rating (1-5) are required' });
    }

    const parsedRating = Math.max(1, Math.min(5, Number(rating)));
    const items = loadEntItems();
    const ent = items.find((e) => e.id === id);

    if (!ent) {
      return res.status(404).json({ success: false, message: 'ENT item not found' });
    }

    const newReview = {
      id: `rev_${Date.now()}`,
      entId: id,
      experienceId: id,
      userName: userName.trim(),
      rating: parsedRating,
      comment: comment ? comment.trim() : '',
      createdAt: new Date().toISOString(),
    };

    const reviews = loadReviews();
    reviews.unshift(newReview);
    saveReviews(reviews);

    const itemReviews = reviews.filter((r) => r.entId === id || r.experienceId === id);
    const avgRating = (
      itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length
    ).toFixed(1);

    ent.rating = parseFloat(avgRating);
    ent.reviewsCount = itemReviews.length;
    saveEntItems(items);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: newReview,
      rating: ent.rating,
      reviewsCount: ent.reviewsCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

router.get('/experiences/:id/reviews', getEntReviewsHandler);
router.get('/:id/reviews', getEntReviewsHandler);

router.post('/experiences/:id/reviews', authenticate, addEntReviewHandler);
router.post('/:id/reviews', authenticate, addEntReviewHandler);

module.exports = router;
