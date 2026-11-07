const prisma = require('./prisma');

async function seedCities() {
  const defaultCities = [
    { name: 'Bhilwara', state: 'Rajasthan', tagline: 'Textile City • Industrial, Villa & Home Care', badge: 'HEADQUARTERS', isActive: true, partnerCount: 15, serviceCount: 32 },
    { name: 'Udaipur', state: 'Rajasthan', tagline: 'City of Lakes • Heritage, Villa & Home Care', badge: 'POPULAR', isActive: true, partnerCount: 24, serviceCount: 38 },
    { name: 'Dehradun', state: 'Uttarakhand', tagline: 'Valley Capital • Foothills, Estate & Civil Care', badge: 'HILL HUB', isActive: true, partnerCount: 12, serviceCount: 26 },
    { name: 'Rishikesh', state: 'Uttarakhand', tagline: 'Yoga & Adventure Capital • Riverfront & Eco Stays', badge: 'ADVENTURE', isActive: true, partnerCount: 18, serviceCount: 29 },
    { name: 'Jaipur', state: 'Rajasthan', tagline: 'Pink City • Royal Architecture & Renovation', badge: 'METRO HUB', isActive: true, partnerCount: 35, serviceCount: 45 },
    { name: 'Jaisalmer', state: 'Rajasthan', tagline: 'Golden City • Desert Stays & Stone Construction', badge: 'DESERT HUB', isActive: true, partnerCount: 8, serviceCount: 20 },
    { name: 'Jodhpur', state: 'Rajasthan', tagline: 'Blue City • Sun City & Heritage Projects', badge: 'EXPANDING', isActive: true, partnerCount: 14, serviceCount: 28 },
  ];

  for (const c of defaultCities) {
    const existing = await prisma.city.findFirst({
      where: { name: { equals: c.name, mode: 'insensitive' } }
    });

    if (!existing) {
      const created = await prisma.city.create({ data: c });
      console.log(`Created city: ${created.name}`);
    } else {
      const updated = await prisma.city.update({
        where: { id: existing.id },
        data: {
          state: c.state,
          tagline: c.tagline,
          badge: c.badge || existing.badge,
          isActive: true
        }
      });
      console.log(`Updated city: ${updated.name}`);
    }
  }

  const all = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  console.log('Total cities in DB now:', all.length);
}

seedCities()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
