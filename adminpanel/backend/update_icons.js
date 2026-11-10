const prisma = require('./src/prisma');

const iconMap = {
  CIVIL_CONSTRUCTION: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
  CRACK_REPAIR: 'https://cdn-icons-png.flaticon.com/512/1037/1037855.png',
  DAMP_TREATMENT: 'https://cdn-icons-png.flaticon.com/512/4230/4230752.png',
  PLUMBING_PIPES: 'https://cdn-icons-png.flaticon.com/512/2867/2867290.png',
  PAINTING_WALL: 'https://cdn-icons-png.flaticon.com/512/3749/3749880.png',
  POP_PLASTER: 'https://cdn-icons-png.flaticon.com/512/2413/2413004.png',
  STRUCTURE_REPAIR: 'https://cdn-icons-png.flaticon.com/512/3256/3256191.png',
  WATER_LEAKAGE: 'https://cdn-icons-png.flaticon.com/512/3105/3105807.png',
  PLUMBING_ELECTRICAL: 'https://cdn-icons-png.flaticon.com/512/3074/3074005.png',
  PAINTING_WALL_REPAIR: 'https://cdn-icons-png.flaticon.com/512/2972/2972138.png',
  TILE_WORK: 'https://cdn-icons-png.flaticon.com/512/2867/2867308.png'
};

async function updateServiceIcons() {
  console.log('🔄 Updating service icons with image URLs...');
  const services = await prisma.service.findMany();
  
  for (const s of services) {
    const imgUrl = iconMap[s.code] || 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png';
    await prisma.service.update({
      where: { id: s.id },
      data: {
        icon: imgUrl,
        iconImage: imgUrl,
        imageUrl: imgUrl
      }
    });
    console.log(`✅ Updated ${s.name} (${s.code}) -> ${imgUrl}`);
  }

  console.log('🎉 All service icons updated successfully in DB!');
}

updateServiceIcons()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
