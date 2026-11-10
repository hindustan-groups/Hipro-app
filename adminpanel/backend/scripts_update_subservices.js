const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUBSERVICE_IMAGES = {
  // Civil Construction
  "RCC Slab & Beam Casting": "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80",
  "Column Jacketing & Retrofitting": "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80",
  "Boundary Wall & Plinth Work": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
  "Core Cutting & Alterations": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",

  // Water Leakage Solutions
  "Roof & Terrace Waterproofing": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "Bathroom & Wet Area Seepage": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  "Chemical PU Injection & Crack Sealing": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  "Basement & Retaining Wall Defense": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",

  // Structure Repair
  "Sagging Slab & Beam Rehabilitation": "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80",
  "Rebar Rust Removal & Anti-Corrosion": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
  "Foundation Settlement Audit": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",

  // Crack Stitching
  "Helical Rebar Wall Stitching": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
  "Epoxy Injection for Structural Cracks": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "Ceiling & Plaster Hairline Crack Fill": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",

  // Damp Wall Treatment
  "Shora & Salt Efflorescence Treatment": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "Rising Damp Chemical DPC Injection": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "Black Mold & Fungal Disinfection": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",

  // Plumbing & Concealed Pipes
  "Concealed Pipe Hydrostatic Test": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
  "Acoustic & Thermal Pipe Leak Detection": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "Drain & Sewer CCTV Inspection": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",

  // Electrical Audit & Wiring
  "Thermal Imaging of DB & Panels": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
  "Concealed Short Circuit Tracing": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  "Earthing Pit & Surge Protection": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",

  // Painting & Wall Finishing
  "Moisture Barrier Primer & Luxury Paint": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
  "Exterior Weatherproof Silicon Coating": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
  "Texture & Metallic Accent Finish": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",

  // Tile & Marble Works
  "Epoxy Tile Grouting & Re-sealing": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "Hollow & Buckling Tile Replacement": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  "Italian Marble Diamond Polishing": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",

  // False Ceiling & POP
  "Water-Resistant Gypsum Ceiling": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "Sagging & Peeling POP Repair": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "Cove & Acoustic Ceiling Panels": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",

  // Architectural & 3D Planning
  "2D Floor Plans & Vastu Layouts": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
  "3D Elevation & Photoreal Renders": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
  "Structural Working Drawings": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",

  // Anti-Termite Treatment
  "Pre-Construction Soil Anti-Termite": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
  "Post-Construction Drill & Inject": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  "Woodwork Borate Spray Barrier": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",

  // Water Tank Sanitization
  "Underground Sump Deep Clean & Sludge Pump": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
  "Overhead PVC Tank UV Sanitization": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  "Epoxy Food-Grade Tank Coating": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",

  // Glass & UPVC Windows
  "UPVC Double Glazed Noise Isolation": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  "Toughened Glass Railing & Balcony": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
  "Weatherproof Window Silicone Sealing": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",

  // Solar Rooftop Installation
  "On-Grid Residential Solar Setup": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
  "Solar Structure Windload Audit": "https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=800&q=80",
  "Inverter & Net-Metering Liaison": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",

  // Carpentry & Modular Kitchen
  "Modular Kitchen Moisture-Proof Shutters": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  "Termite Damaged Door Frame Fix": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
  "Wardrobe & Soft-Close Hardware Repair": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",

  // Smart Home & Security
  "HD CCTV IP Camera Installation": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
  "Smart Fingerprint Door Lock Fitting": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
  "Smart Lighting & Video Doorbell Setup": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",

  // Civil Snagging & Structural Audit
  "Pre-Possession Snagging Inspection": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  "Concrete Rebound Hammer Test": "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80",
  "Thermal Thermal Heat & Moisture Audit": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

async function run() {
  console.log("Updating subservices with images and schema compliance...");
  const subServices = await prisma.subService.findMany();
  console.log(`Found ${subServices.length} subServices in DB.`);

  let updatedCount = 0;
  for (const sub of subServices) {
    const imageUrl = SUBSERVICE_IMAGES[sub.titleEn] || DEFAULT_IMAGE;
    const visitingCharge = sub.visitingCharge && sub.visitingCharge > 0 ? sub.visitingCharge : 199.0;
    
    await prisma.subService.update({
      where: { id: sub.id },
      data: {
        image: imageUrl,
        visitingCharge: visitingCharge,
        bookNowEnabled: true,
        getQuoteEnabled: true,
        isActive: true,
      }
    });
    updatedCount++;
  }

  console.log(`Successfully updated ${updatedCount} subServices with images and visiting charges!`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
