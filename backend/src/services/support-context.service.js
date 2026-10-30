const prisma = require('../prisma');

/**
 * Support Context Service (STRICTLY READ-ONLY)
 * Gathers relevant knowledge documents and read-only customer context for the AI.
 * No insert, update, or delete operations are ever performed here.
 */

/**
 * Retrieves the compiled system knowledge base including services, pricing, and FAQs
 */
async function getSystemKnowledge(cityName = 'Udaipur') {
  try {
    const [services, cities, knowledgeDocs] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        select: {
          name: true,
          description: true,
          cities: true,
          subServices: {
            where: { isActive: true },
            select: {
              titleEn: true,
              titleHi: true,
              desc: true,
              visitingCharge: true,
              bookNowEnabled: true,
              getQuoteEnabled: true
            }
          }
        },
        take: 15
      }),
      prisma.city.findMany({
        where: { isActive: true },
        select: { name: true, state: true, tagline: true }
      }),
      prisma.supportKnowledge.findMany({
        where: { isActive: true },
        select: { title: true, content: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    const serviceSummary = services.map(s => {
      const subs = s.subServices.map(sub => 
        `  - ${sub.titleEn} (₹${sub.visitingCharge} visiting charge): ${sub.desc}`
      ).join('\n');
      return `* Service: ${s.name} (${s.description})\nAvailable in: ${s.cities.join(', ')}\nSubservices:\n${subs}`;
    }).join('\n\n');

    const citySummary = `Supported Operating Cities: ${cities.map(c => `${c.name} (${c.state})`).join(', ')}`;

    const customDocs = knowledgeDocs.map(k => `[${k.category || 'FAQ'}] ${k.title}: ${k.content}`).join('\n\n');

    return `${citySummary}\n\n=== VERIFIED SERVICES & PRICING ===\n${serviceSummary}\n\n=== POLICIES & KNOWLEDGE ===\n${customDocs}`;
  } catch (err) {
    console.error('Error fetching system knowledge for AI:', err);
    return 'Hipro provides certified home inspection, waterproofing, plumbing, painting, and construction care in Udaipur and Bhilwara.';
  }
}

/**
 * Retrieves a customer's recent orders/bookings for read-only status inquiry
 */
async function getCustomerReadOnlyContext(customerId) {
  if (!customerId) return null;

  try {
    const [customer, requests, directBookings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: customerId },
        select: {
          name: true,
          phoneNumber: true,
          email: true,
          address: { select: { city: true, address: true, type: true }, take: 2 }
        }
      }),
      prisma.serviceRequest.findMany({
        where: { userId: customerId },
        select: {
          requestNumber: true,
          servicecode: true,
          subServiceCode: true,
          issueDescription: true,
          status: true,
          technicianName: true,
          preferredDate: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 3
      }),
      prisma.directBooking.findMany({
        where: { userId: customerId },
        select: {
          bookingNumber: true,
          serviceName: true,
          subServiceName: true,
          visitingCharge: true,
          status: true,
          paymentStatus: true,
          scheduledDate: true,
          scheduledSlot: true,
          technicianName: true,
          city: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 3
      })
    ]);

    if (!customer) return null;

    return {
      customerName: customer.name,
      recentRequests: requests,
      recentDirectBookings: directBookings
    };
  } catch (err) {
    console.error('Error fetching customer context for AI:', err);
    return null;
  }
}

module.exports = {
  getSystemKnowledge,
  getCustomerReadOnlyContext
};

