const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// File paths for persistence
const uploadsDir = path.join(__dirname, '../../uploads');
const ENT_DATA_FILE = path.join(uploadsDir, 'ent_experiences.json');
const ENT_BOOKINGS_FILE = path.join(uploadsDir, 'ent_bookings.json');
const ENT_REVIEWS_FILE = path.join(uploadsDir, 'ent_reviews.json');

// Ensure parent folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initial Curated ENT Items (Entertainment / Adventure Outings)
const DEFAULT_ENT_ITEMS = [
  {
    id: 'ent_ddn_01',
    title: 'Maldevta Tandem Paragliding Flight',
    tagline: 'Soar high over the Doon Valley with certified gliders',
    city: 'Dehradun',
    locationDetails: 'Maldevta Foothills, 18km from Dehradun Clock Tower',
    category: 'Air Sports',
    rating: 4.9,
    reviewsCount: 382,
    startingPrice: 3200,
    originalPrice: 4200,
    discountBadge: '24% OFF',
    duration: '20-25 Mins',
    groupSize: '1-6 Travelers',
    minAge: 12,
    difficulty: 'Moderate',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    ],
    inclusions: [
      '15-20 mins tandem flight with certified pilot',
      'High-definition GoPro video & aerial photos',
      'Complete safety harness & helmet',
      'Pickup from Maldevta Base Camp to take-off point',
      'First aid & safety briefing',
    ],
    safetyGuidelines: [
      'Weight limit: 35 kg to 95 kg',
      'Wear sturdy sneakers and comfortable windbreaker jacket',
      'Not recommended for people with severe heart conditions or vertigo',
      'Flights are subject to wind and weather clearance',
    ],
    slots: [
      '06:30 AM (Sunrise Thermal)',
      '09:00 AM (Morning Breeze)',
      '11:30 AM (Midday Flight)',
      '03:30 PM (Sunset Soar)',
    ],
    reportingPoint: 'Maldevta Adventure Base Camp, Raipur Road, Dehradun, Uttarakhand - 248008',
    isFeatured: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent_jsm_01',
    title: 'Sam Sand Dunes Safari & Dune Bashing',
    tagline: 'High-octane 4x4 Thar ride with sunset camel trek & cultural night',
    city: 'Jaisalmer',
    locationDetails: 'Sam Sand Dunes, Thar Desert, Jaisalmer',
    category: 'Desert Safari',
    rating: 4.9,
    reviewsCount: 641,
    startingPrice: 2499,
    originalPrice: 3500,
    discountBadge: '28% OFF',
    duration: '4-5 Hours',
    groupSize: '1-12 Travelers',
    minAge: 5,
    difficulty: 'Easy',
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    ],
    inclusions: [
      '30 Mins high adrenaline 4x4 dune bashing',
      'Sunset camel safari across golden dunes',
      'Traditional Rajasthani folk dance & fire show',
      'Evening tea, snacks, and royal buffet dinner at luxury desert camp',
    ],
    safetyGuidelines: [
      'Fasten seatbelts during 4x4 dune bashing',
      'Carry sunglasses and a scarf for dust protection',
      'Keep hydrated during the desert excursion',
    ],
    slots: [
      '03:30 PM (Sunset Dune Bashing)',
      '04:30 PM (Safari & Camp Evening Combo)',
    ],
    reportingPoint: 'Hipro Desert Camp Milestone, Sam Sand Dunes Road, Jaisalmer, Rajasthan - 345001',
    isFeatured: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent_rsk_bungee',
    title: 'Mohan Chatti 83m Bungee Jump',
    tagline: 'India’s highest fixed cantilever bungee jump over the Hall river valley',
    city: 'Rishikesh',
    locationDetails: 'Mohan Chatti, Jump Zone, Rishikesh, Uttarakhand',
    category: 'Adventure',
    rating: 4.9,
    reviewsCount: 885,
    startingPrice: 3700,
    originalPrice: 4500,
    discountBadge: '18% OFF',
    duration: '1.5 Hours Experience',
    groupSize: 'Individual Jumpers',
    minAge: 12,
    difficulty: 'Extreme Adrenaline',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    ],
    inclusions: [
      '83m Cantilever Bungee Jump designed by SANZ (New Zealand)',
      'Jump badge and Dare to Jump certificate',
      'Experienced jump masters with safety tether inspection',
      'Safety harness & recovery team at river bed',
    ],
    safetyGuidelines: [
      'Weight range: 40 kg to 110 kg strictly enforced',
      'Not allowed for people with high BP, heart conditions, or back injuries',
      'Wear comfortable clothing and closed trainers/shoes',
    ],
    slots: [
      '09:30 AM (Morning Dare)',
      '11:30 AM (Valley Jump)',
      '01:30 PM (Afternoon Leap)',
      '03:30 PM (Sunset Thrill)',
    ],
    reportingPoint: 'Mohan Chatti Jump Base, Rishikesh, Uttarakhand - 249304',
    isFeatured: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent_jsm_02',
    title: 'Desert Paramotoring & Parashoot Sky Ride',
    tagline: 'Fly 500-1000 ft above the Thar golden desert with powered trike parashoot',
    city: 'Jaisalmer',
    locationDetails: 'Kanoi Air Strip, Sam Road, Jaisalmer',
    category: 'Air Sports',
    rating: 4.8,
    reviewsCount: 224,
    startingPrice: 2999,
    originalPrice: 3999,
    discountBadge: '25% OFF',
    duration: '15 Mins',
    groupSize: '1 Traveler (Tandem)',
    minAge: 10,
    difficulty: 'Easy',
    imageUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4ea16e604?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519074069444-1ba4ea16e604?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    ],
    inclusions: [
      '10-12 Mins powered paramotor flight',
      'Tandem flight with commercial rated pilot',
      'GoPro video recording & aerial snapshot',
      'Flight certificate and safety goggles',
    ],
    safetyGuidelines: [
      'Maximum body weight 90 kg',
      'Comfortable clothing and closed shoes required',
      'Weather-dependent activity',
    ],
    slots: [
      '06:45 AM (Golden Hour Sunrise)',
      '08:30 AM (Morning Desert Flight)',
      '04:45 PM (Sunset Horizon Flight)',
    ],
    reportingPoint: 'Kanoi Aero Ground, Near Sam Village, Jaisalmer, Rajasthan',
    isFeatured: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent_rsk_01',
    title: 'Shivpuri to Marine Drive Ganga Rafting',
    tagline: 'Conquer Grade III & IV rapids (Roller Coaster, Golf Course, Clubhouse)',
    city: 'Rishikesh',
    locationDetails: 'Shivpuri Base, Badrinath National Highway, Rishikesh',
    category: 'Water Sports',
    rating: 4.9,
    reviewsCount: 712,
    startingPrice: 1199,
    originalPrice: 1699,
    discountBadge: '29% OFF',
    duration: '3.5 Hours',
    groupSize: '6-8 per raft',
    minAge: 14,
    difficulty: 'Challenging',
    imageUrl: 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    ],
    inclusions: [
      '16 KM river rafting stretch',
      'Certified river guides & rescue kayaker',
      'Grade 5 PFD life jacket, helmet, paddle',
      'Cliff jumping & body surfing stop with lifejackets',
    ],
    safetyGuidelines: [
      'Basic swimming is helpful but life jackets make you fully float',
      'No loose footwear (wear strap sandals or water shoes)',
      'Dry bag provided on raft for basic essentials',
    ],
    slots: [
      '08:00 AM (Early River Slot)',
      '11:00 AM (Midday Adventure)',
      '02:00 PM (Afternoon Rapid Rush)',
    ],
    reportingPoint: 'Tapovan Adventure Center, Laxman Jhula Road, Rishikesh, Uttarakhand - 249192',
    isFeatured: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent_ddn_02',
    title: 'Dehradun Valley Hot Air Balloon Flight',
    tagline: 'Float serenely over Doon tea gardens, Shivalik ridges, and pine hills',
    city: 'Dehradun',
    locationDetails: 'Sahastradhara Helipad Grounds, Dehradun',
    category: 'Air Sports',
    rating: 4.8,
    reviewsCount: 147,
    startingPrice: 8500,
    originalPrice: 11000,
    discountBadge: '22% OFF',
    duration: '60 Mins',
    groupSize: '2-8 Travelers',
    minAge: 8,
    difficulty: 'Easy',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    ],
    inclusions: [
      '45 to 60 minutes sunrise flight',
      'Pilot safety briefing & orientation',
      'Post-flight toast & breakfast box',
      'Flight completion certificate',
    ],
    safetyGuidelines: [
      'Pregnant women and children under 8 are not permitted',
      'Flights operate strictly subject to wind speeds below 12 km/h',
    ],
    slots: [
      '05:45 AM (Sunrise Calm Wind Slot)',
    ],
    reportingPoint: 'Sahastradhara Airfield Grounds, Dehradun, Uttarakhand',
    isFeatured: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ent_jsm_03',
    title: 'Thar Sunset Quad Biking (ATV)',
    tagline: 'Take control of 500cc Polaris ATVs on untamed desert dunes',
    city: 'Jaisalmer',
    locationDetails: 'Sam Sand Dunes Track 4, Jaisalmer',
    category: 'Adventure',
    rating: 4.7,
    reviewsCount: 310,
    startingPrice: 1799,
    originalPrice: 2400,
    discountBadge: '25% OFF',
    duration: '30 Mins',
    groupSize: '1 Rider per ATV',
    minAge: 16,
    difficulty: 'Moderate',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    ],
    inclusions: [
      '30 Mins ATV ride on exclusive sand track',
      'Polaris 500cc automatic Quad Bike',
      'Motocross helmet, goggles, and chest guard',
      'Lead marshal guidance',
    ],
    safetyGuidelines: [
      'Follow instructor signals strictly',
      'Do not attempt high-speed jumps on unapproved dunes',
    ],
    slots: [
      '07:30 AM',
      '09:00 AM',
      '04:00 PM',
      '05:30 PM (Sunset Run)',
    ],
    reportingPoint: 'Sam ATV Track Station, Near Desert National Park Boundary, Jaisalmer',
    isFeatured: false,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// Initial Seed Reviews
const DEFAULT_REVIEWS = [
  {
    id: 'rev_001',
    entId: 'ent_ddn_01',
    userName: 'Vikram Rawat',
    rating: 5,
    comment: 'Unbelievable flight over Maldevta! Pilot was very experienced and video quality was crisp.',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'rev_002',
    entId: 'ent_jsm_01',
    userName: 'Sneha Agarwal',
    rating: 5,
    comment: 'Dune bashing was exhilarating and the Rajasthani cultural dinner at night was top-tier!',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'rev_003',
    entId: 'ent_rsk_01',
    userName: 'Aman Sharma',
    rating: 5,
    comment: 'Roller Coaster rapid was insane! Safety standards and guides were world class.',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

// --- Helpers for Persistence ---
function loadEntItems() {
  try {
    if (fs.existsSync(ENT_DATA_FILE)) {
      const raw = fs.readFileSync(ENT_DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.error('Error reading ent_experiences.json:', err.message);
  }
  saveEntItems(DEFAULT_ENT_ITEMS);
  return DEFAULT_ENT_ITEMS;
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
      if (Array.isArray(data)) return data;
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
  saveReviews(DEFAULT_REVIEWS);
  return DEFAULT_REVIEWS;
}

function saveReviews(reviews) {
  try {
    fs.writeFileSync(ENT_REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing ent_reviews.json:', err.message);
  }
}

// Auto-initialize on module load
loadEntItems();
loadReviews();

// -------------------------------------------------------------
// 1. GET ENT Items: / , /items , /list , /experiences
// Query params: city, category, search, featured, minPrice, maxPrice, sortBy
// -------------------------------------------------------------
const getEntListHandler = (req, res) => {
  try {
    const { city, category, search, featured, minPrice, maxPrice, sortBy } = req.query;
    let list = loadEntItems().filter((item) => item.isActive !== false);

    if (city && city.toLowerCase() !== 'all') {
      list = list.filter((item) => item.city.toLowerCase() === city.toLowerCase());
    }

    if (category && category.toLowerCase() !== 'all') {
      list = list.filter(
        (item) => item.category.toLowerCase() === category.toLowerCase()
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
    const list = loadEntItems();
    const catSet = new Set(list.filter((e) => e.isActive !== false).map((e) => e.category));
    const categories = ['All', ...Array.from(catSet)];

    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -------------------------------------------------------------
// 3. Bookings: /bookings , /my-bookings/:userId , /bookings/:bookingCode
// -------------------------------------------------------------
router.post('/bookings', (req, res) => {
  try {
    const {
      experienceId,
      entId,
      userId,
      travelerName,
      travelerPhone,
      date,
      timeSlot,
      guestsCount = 1,
      notes,
    } = req.body;

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
      userId: userId || 'guest_user',
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
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      createdAt: new Date().toISOString(),
    };

    const bookings = loadBookings();
    bookings.unshift(newBooking);
    saveBookings(bookings);

    // If socket.io is active, notify admin in real-time (targeted to admin room only)
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('new_ent_booking', {
        message: `New ENT adventure booked: ${ent.title} in ${ent.city}`,
        booking: newBooking,
      });
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

router.get('/my-bookings/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { phone } = req.query;
    const bookings = loadBookings();
    const cleanId = String(userId || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();

    const userBookings = bookings.filter((b) => {
      const bUser = String(b.userId || '').trim().toLowerCase();
      const bPhone = String(b.travelerPhone || '').trim();

      if (cleanPhone && bPhone === cleanPhone) return true;
      if (cleanId === 'guest_user') {
        return !b.userId || b.userId === 'guest_user' || (cleanPhone && bPhone === cleanPhone);
      }
      return bUser === cleanId || (cleanId.length >= 10 && bPhone === cleanId) || (cleanPhone && bPhone === cleanPhone);
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

router.get('/bookings/:bookingCode', (req, res) => {
  try {
    const { bookingCode } = req.params;
    const bookings = loadBookings();
    const booking = bookings.find(
      (b) => b.bookingCode === bookingCode || b.id === bookingCode
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'ENT booking not found' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/bookings/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const bookings = loadBookings();
    const idx = bookings.findIndex((b) => b.id === id || b.bookingCode === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    bookings[idx].status = 'CANCELLED';
    bookings[idx].cancelReason = reason || 'Cancelled by user';
    bookings[idx].refundStatus = 'INITIATED';
    bookings[idx].cancelledAt = new Date().toISOString();
    saveBookings(bookings);

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('ent_booking_updated', {
        action: 'CANCELLED',
        booking: bookings[idx],
      });
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

router.patch('/bookings/:id/reschedule', (req, res) => {
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
router.get('/admin/bookings', (req, res) => {
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

router.patch('/admin/bookings/:id/status', (req, res) => {
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
      io.to('admin').emit('ent_booking_updated', {
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

router.get('/admin/stats', (req, res) => {
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

    const items = loadEntItems();
    const prefix = city.substring(0, 3).toLowerCase();
    const newId = `ent_${prefix}_${Date.now().toString(36)}`;

    const newEnt = {
      id: newId,
      title: title.trim(),
      tagline: tagline || '',
      city: city.trim(),
      locationDetails: locationDetails || `${city}, India`,
      category: category || 'Adventure',
      rating: 5.0,
      reviewsCount: 1,
      startingPrice: Number(startingPrice),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      discountBadge: discountBadge || 'NEW',
      duration: duration || '1-2 Hours',
      groupSize: groupSize || '1-6 Travelers',
      minAge: minAge ? Number(minAge) : 10,
      difficulty: difficulty || 'Moderate',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
      gallery: Array.isArray(gallery) && gallery.length > 0 ? gallery : [imageUrl || ''],
      inclusions: Array.isArray(inclusions) ? inclusions : ['Certified guide', 'Safety gear'],
      safetyGuidelines: Array.isArray(safetyGuidelines) ? safetyGuidelines : ['Follow safety instructions'],
      slots: Array.isArray(slots) && slots.length > 0 ? slots : ['09:00 AM', '02:00 PM', '04:30 PM'],
      reportingPoint: reportingPoint || `${city} Adventure Base`,
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

router.post('/', createEntHandler);
router.post('/items', createEntHandler);
router.post('/experiences', createEntHandler);

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

    const updated = {
      ...items[idx],
      ...req.body,
      id: items[idx].id,
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

router.put('/experiences/:id', updateEntHandler);
router.put('/:id', updateEntHandler);

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

router.delete('/experiences/:id', deleteEntHandler);
router.delete('/:id', deleteEntHandler);

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

router.patch('/experiences/:id/toggle', toggleEntHandler);
router.patch('/:id/toggle', toggleEntHandler);

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

router.post('/experiences/:id/reviews', addEntReviewHandler);
router.post('/:id/reviews', addEntReviewHandler);

module.exports = router;
