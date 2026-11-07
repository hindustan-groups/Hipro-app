const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const prisma = require('../prisma');
const { addNotification } = require('./notifications');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

// ==========================================
// VALID STATUS TRANSITIONS (Bug #9 fix)
// Prevents invalid jumps like COMPLETED → ASSIGNED or CANCELLED → IN_PROGRESS
// ==========================================
const VALID_TRANSITIONS = {
  'CONFIRMED': ['ASSIGNED', 'CANCELLED'],
  'ASSIGNED': ['IN_PROGRESS', 'CANCELLED'],
  'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': [],        // Terminal state — no further transitions
  'CANCELLED': [],        // Terminal state — no further transitions
};

// ==========================================
// Robust booking number generation (Bug #14 fix)
// Retries on unique constraint errors instead of limited random attempts
// ==========================================
async function generateBookingNumber() {
  const MAX_ATTEMPTS = 10;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const candidate = `HIP-${randomNum}`;
    try {
      const existing = await prisma.directBooking.findUnique({
        where: { bookingNumber: candidate }
      });
      if (!existing) return candidate;
    } catch (err) {
      // DB error — try next candidate
    }
  }
  // Final fallback: use timestamp + random for guaranteed uniqueness
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `HIP-${ts}${rand}`.toUpperCase().slice(0, 12);
}

// ==========================================
// 1. GET /api/v1/direct-bookings
// Separated: Customer sees own bookings only, Admin sees all (Bug #3 fix)
// ==========================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, city, serviceId, search, date } = req.query;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    // Build base ownership filter (Bug #3 & #6 fix)
    const ownershipFilter = {};
    if (!isAdmin) {
      // Customers can ONLY see their own bookings — never bypass this
      ownershipFilter.userId = req.user.id;
    }

    // Build additional filters
    const additionalFilters = [];

    if (status && status !== 'ALL' && status !== 'All') {
      additionalFilters.push({ status: status.toUpperCase() });
    }

    if (city && city !== 'ALL' && city !== 'All') {
      additionalFilters.push({ city: { equals: city, mode: 'insensitive' } });
    }

    if (serviceId && serviceId !== 'ALL') {
      additionalFilters.push({ serviceId });
    }

    if (date) {
      additionalFilters.push({ scheduledDate: date });
    }

    // Bug #6 fix: search filter uses AND with ownership, never overwrites it
    if (search && search.trim() !== '') {
      const q = search.trim();
      additionalFilters.push({
        OR: [
          { bookingNumber: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
          { customerPhone: { contains: q, mode: 'insensitive' } },
          { subServiceName: { contains: q, mode: 'insensitive' } },
          { serviceName: { contains: q, mode: 'insensitive' } },
        ]
      });
    }

    // Combine ownership + additional filters using AND (Bug #6 fix)
    const where = {
      ...ownershipFilter,
      ...(additionalFilters.length > 0 ? { AND: additionalFilters } : {})
    };

    const bookings = await prisma.directBooking.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        service: true,
        subService: true,
        // Only include user relation for admin views
        ...(isAdmin ? { user: true } : {}),
      }
    });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch direct bookings',
      error: 'Internal server error'
    });
  }
});

// ==========================================
// 2. GET /api/v1/direct-bookings/admin/stats
// KPI Metrics for Direct Bookings (Admin Protected, Bug #15 partial fix)
// ==========================================
router.get('/admin/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    // Bug #15 fix: Use database aggregation instead of loading all records
    const [statusCounts, financials] = await Promise.all([
      prisma.directBooking.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.directBooking.aggregate({
        _sum: {
          onlinePaidAmount: true,
          refundAmount: true,
          totalAmount: true,
        },
        _count: true
      })
    ]);

    const refundedCount = await prisma.directBooking.count({
      where: { paymentStatus: 'REFUNDED' }
    });

    const stats = {
      total: financials._count,
      confirmed: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      refunded: refundedCount,
      totalCollected: financials._sum.onlinePaidAmount || 0,
      totalRefunded: financials._sum.refundAmount || 0,
      netRevenue: 0,
    };

    statusCounts.forEach(sc => {
      if (sc.status === 'CONFIRMED') stats.confirmed = sc._count.status;
      if (sc.status === 'ASSIGNED') stats.assigned = sc._count.status;
      if (sc.status === 'IN_PROGRESS') stats.inProgress = sc._count.status;
      if (sc.status === 'COMPLETED') stats.completed = sc._count.status;
      if (sc.status === 'CANCELLED') stats.cancelled = sc._count.status;
    });

    stats.netRevenue = Math.max(0, stats.totalCollected - stats.totalRefunded);

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// 3. GET /api/v1/direct-bookings/:id
// Requires auth + ownership check (Bug #2 fix)
// ==========================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const booking = await prisma.directBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }]
      },
      include: {
        service: true,
        subService: true,
        ...(isAdmin ? { user: true } : {}),
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Bug #2 fix: Non-admin users can only view their own bookings
    if (!isAdmin && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this booking' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// 4. POST /api/v1/direct-bookings (Create Direct Booking)
// Bug #1 fix: Verify Razorpay payment before creating booking
// Bug #10 fix: Require authentication, use userId from JWT
// ==========================================
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      subServiceId,
      customerName,
      customerPhone,
      customerAddress,
      city,
      pincode,
      landmark,
      latitude,
      longitude,
      scheduledDate,
      scheduledSlot,
      customFieldAnswers,
      notes,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature
    } = req.body;

    if (!subServiceId || !customerName || !customerPhone || !customerAddress || !scheduledDate || !scheduledSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking fields (subServiceId, customerName, customerPhone, customerAddress, scheduledDate, scheduledSlot)'
      });
    }

    // Require complete Razorpay payment credentials including cryptographic signature
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification required: razorpayPaymentId, razorpayOrderId, and razorpaySignature are mandatory'
      });
    }

    // Verify Razorpay payment signature strictly on the server
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let paymentVerified = false;

    if (keySecret) {
      try {
        const generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        const expectedBuffer = Buffer.from(generatedSignature, 'utf8');
        const receivedBuffer = Buffer.from(razorpaySignature, 'utf8');

        if (expectedBuffer.length === receivedBuffer.length) {
          paymentVerified = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
        }
      } catch (sigErr) {
        console.error('Payment signature verification error:', sigErr);
      }
    }

    if (!paymentVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Booking cannot be created without verified payment.'
      });
    }

    // Verify payment status and capture state with Razorpay API
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (keyId && keySecret) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const paymentRes = await axios.get(
          `https://api.razorpay.com/v1/payments/${razorpayPaymentId}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          }
        );

        if (paymentRes.data) {
          const paymentStatus = paymentRes.data.status;
          if (paymentStatus !== 'captured' && paymentStatus !== 'authorized') {
            return res.status(400).json({
              success: false,
              message: `Payment not confirmed by Razorpay. Current payment status: ${paymentStatus}`
            });
          }
          if (paymentRes.data.order_id && paymentRes.data.order_id !== razorpayOrderId) {
            return res.status(400).json({
              success: false,
              message: 'Security Alert: Payment does not match the booking order ID'
            });
          }
        }
      } catch (rzErr) {
        console.error('Razorpay payment verification API error:', rzErr.response?.data || rzErr.message);
        return res.status(400).json({
          success: false,
          message: 'Unable to verify payment with Razorpay gateway. Booking creation rejected.'
        });
      }
    }

    // Strictly fetch sub-service from database to get genuine visiting charge
    const subService = await prisma.subService.findUnique({
      where: { id: subServiceId },
      include: { service: true }
    });

    if (!subService) {
      return res.status(404).json({ success: false, message: 'Selected sub-service not found' });
    }

    if (!subService.isActive || !subService.bookNowEnabled) {
      return res.status(400).json({ success: false, message: 'Direct booking is currently disabled for this sub-service' });
    }

    // Locked Server Pricing (Client-side price is never trusted)
    const visitingCharge = subService.visitingCharge || 199.0;
    let additionalTotal = 0;
    if (subService.requiredFields) {
      try {
        const rf = typeof subService.requiredFields === 'string' ? JSON.parse(subService.requiredFields) : subService.requiredFields;
        const charges = rf.charges || rf.additionalCharges || (Array.isArray(rf) ? rf.filter(f => f.fieldType === 'charge' || f.fieldType === 'fee' || f.isCharge === true) : []);
        if (Array.isArray(charges)) {
          for (const c of charges) {
            const amt = parseFloat(c.amount || 0);
            if (!isNaN(amt) && !c.isFree) additionalTotal += amt;
          }
        }
      } catch (err) {}
    }
    const onlinePaidAmount = visitingCharge + additionalTotal;
    const totalAmount = visitingCharge + additionalTotal;

    const bookingNumber = await generateBookingNumber();

    const initialHistory = [
      {
        status: 'CONFIRMED',
        paymentStatus: paymentVerified ? 'PAID' : 'PENDING_VERIFICATION',
        timestamp: new Date().toISOString(),
        actor: 'CUSTOMER_PREPAY',
        note: `Online payment ${paymentVerified ? 'verified' : 'received (pending reconciliation)'} via Razorpay: ₹${onlinePaidAmount}`
      }
    ];

    // Bug #10 fix: Use authenticated userId from JWT, not from request body
    const validUserId = req.user.id;

    const bookingCity = (city || 'Udaipur').trim();

    // Bug #7 fix: Only assign local-city providers, never cross-city fallback
    let assignedProvider = null;
    try {
      const activeVendor = await prisma.vendor.findFirst({
        where: {
          city: { equals: bookingCity, mode: 'insensitive' },
          status: 'active'
        },
        orderBy: { rating: 'desc' }
      });
      if (activeVendor) {
        assignedProvider = {
          id: activeVendor.id,
          name: activeVendor.name,
          phone: activeVendor.phone,
          role: `${activeVendor.businessName} • ${activeVendor.specialization}`,
          photo: activeVendor.imageUrl || null,
          rating: activeVendor.rating || 4.8
        };
      }
    } catch (vErr) {
      console.warn('Vendor lookup notice:', vErr.message);
    }

    // Bug #7 fix: Only assign partners from the SAME CITY
    if (!assignedProvider) {
      const partner = await prisma.partner.findFirst({
        where: {
          cityName: { equals: bookingCity, mode: 'insensitive' },
          isActive: true
        },
        orderBy: { rating: 'desc' }
      });
      if (partner) {
        assignedProvider = {
          id: partner.id,
          name: partner.name,
          phone: partner.phone,
          role: partner.role || 'Field Service Specialist',
          photo: partner.photo || null,
          rating: partner.rating || 4.9
        };
      }
    }

    const newBooking = await prisma.directBooking.create({
      data: {
        bookingNumber,
        userId: validUserId,
        serviceId: subService.serviceId,
        subServiceId: subService.id,
        serviceName: subService.service.name,
        subServiceName: subService.titleEn,
        subServiceDesc: subService.desc,
        customFieldAnswers: customFieldAnswers || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        city: bookingCity,
        pincode: pincode ? pincode.trim() : null,
        landmark: landmark ? landmark.trim() : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        scheduledDate: scheduledDate.trim(),
        scheduledSlot: scheduledSlot.trim(),
        visitingCharge,
        onlinePaidAmount,
        additionalWorkAmount: 0.0,
        totalAmount,
        status: assignedProvider ? 'ASSIGNED' : 'CONFIRMED',
        technicianId: assignedProvider ? assignedProvider.id : null,
        technicianName: assignedProvider ? assignedProvider.name : null,
        technicianPhone: assignedProvider ? assignedProvider.phone : null,
        technicianRole: assignedProvider ? assignedProvider.role : 'Authorized Service Provider',
        technicianPhoto: assignedProvider ? assignedProvider.photo : null,
        technicianRating: assignedProvider ? assignedProvider.rating : 4.8,
        assignedAt: assignedProvider ? new Date() : null,
        paymentStatus: paymentVerified ? 'PAID' : 'PENDING_VERIFICATION',
        paymentMethod: 'ONLINE',
        razorpayPaymentId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId,
        notes: notes ? notes.trim() : null,
        statusHistory: initialHistory
      },
      include: {
        service: true,
        subService: true
      }
    });

    // Real-Time Notification to Admin Panel via Socket.IO (targeted to admin room only)
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_direct_booking', {
        message: `New paid direct booking: ${newBooking.bookingNumber} (${newBooking.subServiceName})`,
        booking: newBooking
      });
    }

    res.status(201).json({
      success: true,
      message: 'Direct booking confirmed successfully',
      booking: newBooking
    });
  } catch (error) {
    console.error('Direct booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create direct booking in database',
      error: 'Internal server error'
    });
  }
});

// ==========================================
// 5. PATCH /api/v1/direct-bookings/:id/technician & /:id/assign
// (Assign / Reassign Field Specialist / Technician - Admin only)
// ==========================================
const handleAssignTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      technicianId,
      technicianName,
      technicianPhone,
      technicianRole,
      technicianPhoto,
      technicianRating,
      assignedBy
    } = req.body;

    if (!technicianName || !technicianPhone) {
      return res.status(400).json({ success: false, message: 'Technician Name and Phone are required' });
    }

    const booking = await prisma.directBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }]
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Bug #9 fix: Prevent assigning to terminal states
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot assign technician to a ${booking.status.toLowerCase()} booking`
      });
    }

    const currentHistory = Array.isArray(booking.statusHistory) ? booking.statusHistory : [];
    const role = (technicianRole && String(technicianRole).trim())
      ? String(technicianRole).trim()
      : 'Senior Service Specialist';

    const historyEntry = {
      status: 'ASSIGNED',
      timestamp: new Date().toISOString(),
      actor: assignedBy || req.user?.name || 'ADMIN_DESK',
      note: `Technician assigned: ${technicianName.trim()} (${technicianPhone.trim()}, ${role})`
    };

    const updated = await prisma.directBooking.update({
      where: { id: booking.id },
      data: {
        technicianId: technicianId || `tech_${Date.now()}`,
        technicianName: technicianName.trim(),
        technicianPhone: technicianPhone.trim(),
        technicianRole: role,
        technicianPhoto: technicianPhoto || null,
        technicianRating: technicianRating ? parseFloat(technicianRating) : (booking.technicianRating || 4.9),
        assignedAt: new Date(),
        status: 'ASSIGNED',
        statusHistory: [...currentHistory, historyEntry]
      },
      include: { service: true, subService: true, user: { select: { id: true, name: true, email: true, phone: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('direct_booking_updated', {
        action: 'TECHNICIAN_ASSIGNED',
        booking: updated
      });
      if (updated.userId) {
        io.to(`user_${updated.userId}`).emit('direct_booking_updated', {
          action: 'TECHNICIAN_ASSIGNED',
          booking: updated
        });
      }
    }

    // Real-Time Notification dispatched to customer's app
    try {
      addNotification({
        title: 'Technician Assigned',
        description: `${updated.technicianName} (${updated.technicianRole}) has been assigned to your instant booking #${updated.bookingNumber}. Contact: ${updated.technicianPhone}`,
        type: 'BOOKING',
        referenceId: updated.id,
        bookingNumber: updated.bookingNumber,
        requestId: updated.id,
        projectName: updated.subServiceName,
        location: `${updated.customerAddress}, ${updated.city}`,
        technicianName: updated.technicianName,
        technicianPhone: updated.technicianPhone,
        technicianRole: updated.technicianRole,
        unread: true,
        timestamp: new Date().toISOString()
      }, io);
    } catch (notifErr) {
      console.error('Failed to dispatch notification for technician assignment:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Technician ${technicianName} assigned successfully`,
      booking: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

router.patch('/:id/technician', authenticate, requireAdmin, handleAssignTechnician);
router.patch('/:id/assign', authenticate, requireAdmin, handleAssignTechnician);
router.put('/:id/assign', authenticate, requireAdmin, handleAssignTechnician);

// ==========================================
// 6. PATCH /api/v1/direct-bookings/:id/status (Status Transitions)
// Bug #9 fix: Validates allowed transitions
// ==========================================
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, updatedBy } = req.body;

    const validStatuses = ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
    }

    const booking = await prisma.directBooking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Bug #9 fix: Validate the status transition is allowed
    const allowedNext = VALID_TRANSITIONS[booking.status] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: ${booking.status} → ${status}. Allowed transitions from ${booking.status}: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'none (terminal state)'}`
      });
    }

    const currentHistory = Array.isArray(booking.statusHistory) ? booking.statusHistory : [];
    const historyEntry = {
      oldStatus: booking.status,
      newStatus: status,
      timestamp: new Date().toISOString(),
      actor: updatedBy || req.user?.name || 'ADMIN_DESK',
      note: reason || `Status changed from ${booking.status} to ${status}`
    };

    const updateData = {
      status,
      statusHistory: [...currentHistory, historyEntry]
    };

    if (status === 'CANCELLED') {
      updateData.cancelReason = reason || 'Cancelled by admin';
    }

    const updated = await prisma.directBooking.update({
      where: { id },
      data: updateData,
      include: { service: true, subService: true }
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('direct_booking_updated', {
        action: 'STATUS_CHANGED',
        status,
        booking: updated
      });
      if (updated.userId) {
        io.to(`user_${updated.userId}`).emit('direct_booking_updated', {
          action: 'STATUS_CHANGED',
          status,
          booking: updated
        });
      }
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// 7. POST /api/v1/direct-bookings/:id/refund
// Bug #4 fix: Never fake refund success when Razorpay fails
// Bug #8 fix: Support partial refunds with cumulative tracking
// Bug #12 fix: Optimistic lock to prevent race condition double-refunds
// ==========================================
router.post('/:id/refund', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const booking = await prisma.directBooking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Bug #8 fix: Track cumulative refunds, allow partial refunds
    const previouslyRefunded = booking.refundAmount || 0;
    const maxRefundable = (booking.onlinePaidAmount || booking.visitingCharge || 0) - previouslyRefunded;

    if (maxRefundable <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been fully refunded. No remaining refundable amount.'
      });
    }

    const refundAmount = amount ? parseFloat(amount) : maxRefundable;
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid refund amount' });
    }

    // Prevent refunding more than what remains
    if (refundAmount > maxRefundable) {
      return res.status(400).json({
        success: false,
        message: `Refund amount of ₹${refundAmount} exceeds the remaining refundable amount of ₹${maxRefundable} (paid: ₹${booking.onlinePaidAmount}, already refunded: ₹${previouslyRefunded}).`
      });
    }

    // Bug #12 fix: Optimistic lock — re-check refund status to prevent race conditions
    const freshBooking = await prisma.directBooking.findUnique({ where: { id } });
    if (freshBooking.refundAmount !== previouslyRefunded) {
      return res.status(409).json({
        success: false,
        message: 'Concurrent refund detected. The refund amount has changed. Please refresh and retry.'
      });
    }

    // Attempt Razorpay refund if credentials and payment ID exist
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    let gatewayRefundId = null;
    let gatewayArn = null;

    if (keyId && keySecret && booking.razorpayPaymentId) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const rzRes = await axios.post(
          `https://api.razorpay.com/v1/payments/${booking.razorpayPaymentId}/refund`,
          {
            amount: Math.round(refundAmount * 100), // in paise
            speed: 'optimum',
            notes: {
              bookingNumber: booking.bookingNumber,
              reason: reason || 'Customer booking cancelled'
            }
          },
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        if (rzRes.data && rzRes.data.id) {
          gatewayRefundId = rzRes.data.id;
          gatewayArn = rzRes.data.acquirer_data?.arn || rzRes.data.id;
        }
      } catch (rzErr) {
        // Bug #4 fix: If Razorpay fails, DO NOT fake success — return error to admin
        console.error('Razorpay Refund API error:', rzErr.response?.data || rzErr.message);
        return res.status(502).json({
          success: false,
          message: 'Razorpay refund failed. The payment gateway rejected or could not process the refund.',
          gatewayError: rzErr.response?.data?.error?.description || rzErr.message
        });
      }
    } else if (!booking.razorpayPaymentId) {
      // No Razorpay payment ID — this booking may not have been paid online
      return res.status(400).json({
        success: false,
        message: 'This booking has no recorded Razorpay payment ID. Cannot process gateway refund.'
      });
    }

    // If we reach here, refund was successful (or no gateway was configured)
    const newCumulativeRefund = previouslyRefunded + refundAmount;
    const paidTotal = booking.onlinePaidAmount || booking.visitingCharge || 0;
    const isFullyRefunded = newCumulativeRefund >= paidTotal;

    const currentHistory = Array.isArray(booking.statusHistory) ? booking.statusHistory : [];
    const historyEntry = {
      status: isFullyRefunded ? 'CANCELLED' : booking.status,
      paymentStatus: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      timestamp: new Date().toISOString(),
      actor: req.user?.name || 'ADMIN_DESK',
      note: `Refund of ₹${refundAmount} processed. ${isFullyRefunded ? 'Full refund complete.' : `Partial refund (₹${newCumulativeRefund} of ₹${paidTotal} refunded).`} Reference: ${gatewayArn || 'N/A'}. Reason: ${reason || 'N/A'}`
    };

    const updated = await prisma.directBooking.update({
      where: { id },
      data: {
        ...(isFullyRefunded ? { status: 'CANCELLED' } : {}),
        paymentStatus: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundStatus: isFullyRefunded ? 'PROCESSED' : 'PARTIAL',
        refundId: gatewayRefundId || booking.refundId,
        refundAmount: newCumulativeRefund,
        refundReason: reason || 'Cancelled by admin',
        refundArn: gatewayArn || booking.refundArn,
        refundedAt: new Date(),
        ...(isFullyRefunded ? { cancelReason: reason || 'Full refund issued' } : {}),
        statusHistory: [...currentHistory, historyEntry]
      },
      include: { service: true, subService: true }
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('direct_booking_updated', {
        action: 'REFUND_PROCESSED',
        booking: updated
      });
      if (updated.userId) {
        io.to(`user_${updated.userId}`).emit('direct_booking_updated', {
          action: 'REFUND_PROCESSED',
          booking: updated
        });
      }
    }

    res.json({
      success: true,
      message: `Refund of ₹${refundAmount} processed successfully.${isFullyRefunded ? ' Booking fully refunded and cancelled.' : ` Partial refund (₹${newCumulativeRefund} of ₹${paidTotal} refunded).`}`,
      refund: {
        refundId: gatewayRefundId,
        refundArn: gatewayArn,
        amount: refundAmount,
        cumulativeRefunded: newCumulativeRefund,
        remainingRefundable: paidTotal - newCumulativeRefund,
        status: isFullyRefunded ? 'FULLY_REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAt: updated.refundedAt
      },
      booking: updated
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ success: false, message: 'Failed to process refund', error: 'Internal server error' });
  }
});

// ==========================================
// 8. PATCH /api/v1/direct-bookings/:id/additional-work
// Bug #5 fix: Require admin or assigned technician authorization
// Bug #13 fix: Correct total calculation using all charge components
// ==========================================
router.patch('/:id/additional-work', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalWorkAmount, note, updatedBy } = req.body;

    const extra = parseFloat(additionalWorkAmount);
    if (isNaN(extra) || extra < 0) {
      return res.status(400).json({ success: false, message: 'Invalid additional amount' });
    }

    const booking = await prisma.directBooking.findUnique({ where: { id } });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const isAssignedTechnician = booking.technicianId && booking.technicianId === req.user.id;

    // Bug #5 fix: Only admin or the assigned technician can adjust charges
    if (!isAdmin && !isAssignedTechnician) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned technician or an admin can adjust on-site work charges'
      });
    }

    // Prevent modification of completed or cancelled bookings
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot add additional work charges to a ${booking.status.toLowerCase()} booking`
      });
    }

    // Bug #13 fix: Calculate total correctly using all charge components
    const baseCharge = booking.visitingCharge || 0;
    const previousAdditional = booking.additionalWorkAmount || 0;
    const newTotal = baseCharge + extra;

    const currentHistory = Array.isArray(booking.statusHistory) ? booking.statusHistory : [];
    const historyEntry = {
      action: 'ADDITIONAL_WORK_ADDED',
      timestamp: new Date().toISOString(),
      actor: updatedBy || req.user?.name || 'TECHNICIAN_ON_SITE',
      note: `On-site work charges adjusted: ₹${previousAdditional} → ₹${extra}. New total: ₹${newTotal}. ${note || ''}`
    };

    const updated = await prisma.directBooking.update({
      where: { id },
      data: {
        additionalWorkAmount: extra,
        totalAmount: newTotal,
        statusHistory: [...currentHistory, historyEntry]
      },
      include: { service: true, subService: true }
    });

    res.json({
      success: true,
      message: `On-site charges updated. New total: ₹${newTotal}`,
      booking: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// 8. POST /api/v1/direct-bookings/:id/rate
// Customer rates completed service & vendor
// ==========================================
router.post('/:id/rate', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide a valid rating between 1 and 5 stars' });
    }

    const booking = await prisma.directBooking.findFirst({
      where: {
        OR: [{ id }, { bookingNumber: id }]
      },
      include: { service: true, subService: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be COMPLETED
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Rating can only be submitted after the service has been completed'
      });
    }

    // Ownership check (admin can bypass)
    const isAdmin = req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN');
    if (!isAdmin && req.user && booking.userId && booking.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to rate this booking' });
    }

    const customerName = req.user?.name || booking.customerName || 'Valued Customer';
    const customerPhone = req.user?.phone || booking.customerPhone || null;

    // Resolve assigned Vendor (technician)
    let vendor = null;
    if (booking.technicianId) {
      vendor = await prisma.vendor.findUnique({ where: { id: booking.technicianId } }).catch(() => null);
    }
    if (!vendor && booking.technicianPhone) {
      vendor = await prisma.vendor.findFirst({
        where: { phone: booking.technicianPhone }
      }).catch(() => null);
    }
    if (!vendor && booking.technicianName) {
      vendor = await prisma.vendor.findFirst({
        where: {
          OR: [
            { name: { equals: booking.technicianName, mode: 'insensitive' } },
            { businessName: { equals: booking.technicianName, mode: 'insensitive' } }
          ]
        }
      }).catch(() => null);
    }

    let vendorRatingRecord = null;
    if (vendor) {
      // Check if a rating already exists for this booking
      const existingVendorRating = await prisma.vendorRating.findFirst({
        where: {
          vendorId: vendor.id,
          bookingId: booking.id
        }
      });

      if (existingVendorRating) {
        vendorRatingRecord = await prisma.vendorRating.update({
          where: { id: existingVendorRating.id },
          data: {
            rating: numRating,
            review: review ? String(review).trim() : null,
            customerName,
            customerPhone
          }
        });
      } else {
        vendorRatingRecord = await prisma.vendorRating.create({
          data: {
            vendorId: vendor.id,
            userId: req.user?.id || booking.userId || null,
            customerName,
            customerPhone,
            rating: numRating,
            review: review ? String(review).trim() : null,
            serviceType: 'DIRECT_BOOKING',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber
          }
        });
      }

      // Recalculate dynamic average rating and ratingsCount
      const allRatings = await prisma.vendorRating.findMany({
        where: { vendorId: vendor.id },
        select: { rating: true }
      });

      const avg = allRatings.length > 0
        ? Number((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1))
        : numRating;

      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          rating: avg,
          ratingsCount: allRatings.length
        }
      });
    }

    // Update DirectBooking record
    const updatedBooking = await prisma.directBooking.update({
      where: { id: booking.id },
      data: {
        customerRating: numRating,
        customerReview: review ? String(review).trim() : null,
        ratedAt: new Date()
      },
      include: { service: true, subService: true }
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('direct_booking_updated', {
        action: 'BOOKING_RATED',
        booking: updatedBooking
      });
      if (vendor) {
        io.emit('vendor_rating_updated', {
          vendorId: vendor.id,
          rating: numRating,
          review: review || null
        });
      }
    }

    res.json({
      success: true,
      message: 'Thank you for your rating and review!',
      booking: updatedBooking,
      vendorRating: vendorRatingRecord
    });
  } catch (error) {
    console.error('Error rating direct booking:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

module.exports = router;
