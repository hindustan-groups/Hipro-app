const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * POST /api/v1/activity/track
 * Tracks customer browsing/exploration of services and cart modifications.
 * Fire-and-forget safe, non-blocking for mobile client.
 */
router.post('/track', async (req, res) => {
  try {
    const {
      userId,
      guestId,
      customerName,
      customerPhone,
      customerEmail,
      city,
      eventType = 'EXPLORING_SERVICE',
      serviceId,
      serviceName,
      subServiceId,
      subServiceName,
      cartSnapshot,
      metadata = {}
    } = req.body;

    let validUserId = null;
    let finalCustomerName = customerName;
    let finalCustomerPhone = customerPhone;
    let finalCustomerEmail = customerEmail;
    let finalCity = city || null;

    // Try linking with registered user if userId is provided
    if (userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          email: true,
          address: { select: { city: true }, take: 1 }
        }
      });
      if (existingUser) {
        validUserId = existingUser.id;
        finalCustomerName = finalCustomerName || existingUser.name;
        finalCustomerPhone = finalCustomerPhone || existingUser.phoneNumber;
        finalCustomerEmail = finalCustomerEmail || existingUser.email;
        if (!finalCity && existingUser.address && existingUser.address.length > 0) {
          finalCity = existingUser.address[0].city;
        }
      }
    } else if (customerPhone) {
      // Auto-link by phone number if user exists
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
      const userByPhone = await prisma.user.findFirst({
        where: {
          phoneNumber: {
            contains: cleanPhone
          }
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          email: true,
          address: { select: { city: true }, take: 1 }
        }
      });
      if (userByPhone) {
        validUserId = userByPhone.id;
        finalCustomerName = finalCustomerName || userByPhone.name;
        finalCustomerPhone = finalCustomerPhone || userByPhone.phoneNumber;
        finalCustomerEmail = finalCustomerEmail || userByPhone.email;
        if (!finalCity && userByPhone.address && userByPhone.address.length > 0) {
          finalCity = userByPhone.address[0].city;
        }
      }
    }

    const activityRecord = await prisma.customerActivity.create({
      data: {
        userId: validUserId,
        guestId: guestId || null,
        customerName: finalCustomerName || null,
        customerPhone: finalCustomerPhone || null,
        customerEmail: finalCustomerEmail || null,
        city: finalCity,
        eventType,
        serviceId: serviceId || null,
        serviceName: serviceName || null,
        subServiceId: subServiceId || null,
        subServiceName: subServiceName || null,
        cartSnapshot: cartSnapshot || null,
        metadata: metadata || {}
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
            photoUrl: true
          }
        }
      }
    });

    // Real-Time Socket.io broadcast to admin room
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('customer_activity_event', activityRecord);
      io.emit('customer_activity_event', activityRecord);
    }

    return res.status(201).json({
      success: true,
      activityId: activityRecord.id,
      timestamp: activityRecord.created_at
    });
  } catch (error) {
    console.error('Error in /activity/track:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record customer activity',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/activity/admin/stream
 * Returns chronological feed of customer activity logs with optional filtering.
 */
router.get('/admin/stream', async (req, res) => {
  try {
    const { city, eventType, search, limit = 100, offset = 0 } = req.query;

    const where = {};
    if (city && city.toLowerCase() !== 'all') {
      where.city = { equals: city, mode: 'insensitive' };
    }
    if (eventType && eventType.toLowerCase() !== 'all') {
      where.eventType = eventType;
    }
    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
        { serviceName: { contains: q, mode: 'insensitive' } },
        { subServiceName: { contains: q, mode: 'insensitive' } },
        { eventType: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [total, activities] = await Promise.all([
      prisma.customerActivity.count({ where }),
      prisma.customerActivity.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
        include: {
          user: {
            select: { id: true, name: true, phoneNumber: true, email: true, photoUrl: true }
          }
        }
      })
    ]);

    return res.json({
      success: true,
      total,
      activities
    });
  } catch (error) {
    console.error('Error in /activity/admin/stream:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer activities',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/activity/admin/leads
 * Aggregates exploration logs into customer leads with active carts and recently explored services.
 */
router.get('/admin/leads', async (req, res) => {
  try {
    const { city, search } = req.query;

    const where = {};
    if (city && city.toLowerCase() !== 'all') {
      where.city = { equals: city, mode: 'insensitive' };
    }

    // Fetch the most recent 1000 activities to construct rich customer profiles
    const activities = await prisma.customerActivity.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1000,
      include: {
        user: {
          select: { id: true, name: true, phoneNumber: true, email: true, photoUrl: true }
        }
      }
    });

    const customerMap = new Map();
    const serviceExplorationCounts = {};

    for (const act of activities) {
      // Form customer identification key
      const custKey = act.userId
        ? `user_${act.userId}`
        : (act.customerPhone ? `phone_${act.customerPhone}` : (act.guestId ? `guest_${act.guestId}` : `anon_${act.id}`));

      // Track service exploration frequency for insights
      if (act.serviceName) {
        serviceExplorationCounts[act.serviceName] = (serviceExplorationCounts[act.serviceName] || 0) + 1;
      }

      if (!customerMap.has(custKey)) {
        customerMap.set(custKey, {
          id: custKey,
          userId: act.userId,
          guestId: act.guestId,
          isRegistered: !!act.userId || !!act.user,
          customerName: act.user?.name || act.customerName || (act.customerPhone ? `Customer (${act.customerPhone.slice(-4)})` : 'Visitor'),
          customerPhone: act.user?.phoneNumber || act.customerPhone || null,
          customerEmail: act.user?.email || act.customerEmail || null,
          photoUrl: act.user?.photoUrl || null,
          city: act.city || (act.user?.address?.[0]?.city || null),
          lastActive: act.created_at,
          firstSeen: act.created_at,
          totalInteractions: 0,
          latestCart: null,
          hasActiveCart: false,
          cartTotal: 0,
          cartItemCount: 0,
          exploredServices: [],
          recentEvents: []
        });
      }

      const lead = customerMap.get(custKey);
      lead.totalInteractions += 1;

      // Keep timestamps accurate
      if (new Date(act.created_at) > new Date(lead.lastActive)) {
        lead.lastActive = act.created_at;
      }
      if (new Date(act.created_at) < new Date(lead.firstSeen)) {
        lead.firstSeen = act.created_at;
      }

      // Capture latest Cart Snapshot
      if (act.cartSnapshot && (!lead.latestCart || new Date(act.created_at) >= new Date(lead.lastCartUpdate || 0))) {
        lead.latestCart = act.cartSnapshot;
        lead.lastCartUpdate = act.created_at;
        const items = act.cartSnapshot.items || (Array.isArray(act.cartSnapshot) ? act.cartSnapshot : []);
        lead.cartItemCount = items.length;
        lead.cartTotal = act.cartSnapshot.totalAmount != null
          ? act.cartSnapshot.totalAmount
          : items.reduce((sum, item) => sum + (Number(item.visitingCharge) || 0), 0);
        lead.hasActiveCart = lead.cartItemCount > 0;
      }

      // Collect distinct explored services
      if (act.serviceName && !lead.exploredServices.some(s => s.name === act.serviceName)) {
        lead.exploredServices.push({
          id: act.serviceId,
          name: act.serviceName,
          subServiceName: act.subServiceName,
          lastViewedAt: act.created_at
        });
      }

      // Collect last 5 timeline events
      if (lead.recentEvents.length < 5) {
        lead.recentEvents.push({
          id: act.id,
          eventType: act.eventType,
          serviceName: act.serviceName,
          subServiceName: act.subServiceName,
          created_at: act.created_at
        });
      }
    }

    let leadsList = Array.from(customerMap.values());

    // Search filter
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      leadsList = leadsList.filter(l => 
        (l.customerName && l.customerName.toLowerCase().includes(q)) ||
        (l.customerPhone && l.customerPhone.toLowerCase().includes(q)) ||
        (l.customerEmail && l.customerEmail.toLowerCase().includes(q)) ||
        (l.exploredServices && l.exploredServices.some(s => s.name && s.name.toLowerCase().includes(q)))
      );
    }

    // Sort leads: High-value active carts first, then most recently active
    leadsList.sort((a, b) => {
      if (a.hasActiveCart && !b.hasActiveCart) return -1;
      if (!a.hasActiveCart && b.hasActiveCart) return 1;
      return new Date(b.lastActive) - new Date(a.lastActive);
    });

    // Top explored services ranked
    const topExplored = Object.entries(serviceExplorationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const totalCartValue = leadsList.reduce((acc, l) => acc + (l.hasActiveCart ? l.cartTotal : 0), 0);
    const activeCartLeadsCount = leadsList.filter(l => l.hasActiveCart).length;

    return res.json({
      success: true,
      metrics: {
        totalLeads: leadsList.length,
        activeCartLeads: activeCartLeadsCount,
        totalCartValue,
        topExplored
      },
      leads: leadsList
    });
  } catch (error) {
    console.error('Error in /activity/admin/leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to aggregate customer leads',
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/activity/admin/clear
 * Clear all activities or activities older than N days.
 */
router.delete('/admin/clear', async (req, res) => {
  try {
    const { days } = req.query;
    let deleteWhere = {};
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days, 10));
      deleteWhere = {
        created_at: { lt: cutoffDate }
      };
    }

    const result = await prisma.customerActivity.deleteMany({
      where: deleteWhere
    });

    return res.json({
      success: true,
      message: `Cleared ${result.count} activity records.`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Error in /activity/admin/clear:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear activities',
      error: error.message
    });
  }
});

module.exports = router;

