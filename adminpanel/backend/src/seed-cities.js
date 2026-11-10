const prisma = require('./prisma');

// Cities are managed through the admin API/DB. This script only reports the
// current count and never inserts demo city data.
async function listCities() {
  const all = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  console.log('Total cities in DB:', all.length);
}

listCities()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
