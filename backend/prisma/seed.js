const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Neon Database with 18 Services, 2D Vector Icons & SubServices...');

  const servicesData = [
    {
      code: "CIVIL_CONSTRUCTION",
      name: "Civil Construction",
      description: "RCC Slab, Beam Casting, Column Jacketing, Foundation & Masonry.",
      icon: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048953.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "RCC Slab & Beam Casting",
          titleHi: "आरसीसी स्लैब और बीम ढलाई",
          desc: "Heavy duty shuttering, steel reinforcement binding and machine vibrator concrete casting.",
          checklist: ["Rebar gauge verification", "Cover block spacing", "Compressive cube test"]
        },
        {
          titleEn: "Column Jacketing & Retrofitting",
          titleHi: "खंभों का सुदृढ़ीकरण और जैकेटिंग",
          desc: "Micro-concrete pouring with polymer bonding to restore corroded load-bearing columns.",
          checklist: ["Rust converter application", "Shear key anchoring", "High-early strength mortar"]
        },
        {
          titleEn: "Boundary Wall & Plinth Work",
          titleHi: "चारदीवारी और नींव निर्माण",
          desc: "Strong brickwork with DPC damp barrier and reinforced concrete tie beams.",
          checklist: ["Soil compaction", "Mortar ratio 1:4 audit", "Plinth water curing"]
        },
        {
          titleEn: "Core Cutting & Alterations",
          titleHi: "कंक्रीट कोर कटिंग और संरचनात्मक बदलाव",
          desc: "Vibration-free diamond core drilling for plumbing shafts, HVAC and renovations.",
          checklist: ["Non-destructive detection", "Precision diamond bit", "Structural integrity signoff"]
        }
      ]
    },
    {
      code: "WATER_LEAKAGE",
      name: "Water Leakage Solutions",
      description: "Stop Roof, Bathroom, Basement & Wall Seepage with nano-seal chemical barriers.",
      icon: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2913/2913520.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "Roof & Terrace Waterproofing",
          titleHi: "छत और छत की दरारों की वाटरप्रूफिंग",
          desc: "Multi-layer elastomeric polymer waterproofing and joint sealing with ponding test.",
          checklist: ["Thermal imaging leak detection", "Primer + 3 waterproof coats", "Detailed work completion report"]
        },
        {
          titleEn: "Bathroom & Wet Area Seepage",
          titleHi: "बाथरूम सीलन और लीकेज का इलाज",
          desc: "Concealed pipe inspection, non-invasive tile grouting, and chemical waterproofing.",
          checklist: ["Tile grout replacement", "Trap seal inspection", "Concealed leak scan"]
        },
        {
          titleEn: "Chemical PU Injection & Crack Sealing",
          titleHi: "केमिकल ग्राउटिंग और दरार सीलिंग",
          desc: "High-pressure polyurethane injection into concrete voids to permanently stop running leaks.",
          checklist: ["PU resin injection", "Hydrophobic barrier creation", "Zero-breakage repair"]
        },
        {
          titleEn: "Basement & Retaining Wall Defense",
          titleHi: "बेसमेंट और रिटेनिंग वॉल वाटरप्रूफिंग",
          desc: "Negative side crystalline waterproofing barrier withstands high hydrostatic water pressure.",
          checklist: ["Hydrostatic pressure audit", "Deep crystalline slurry coat", "Expansion joint elastomeric seal"]
        }
      ]
    },
    {
      code: "STRUCTURE_REPAIR",
      name: "Structure Repair",
      description: "Repair Sagging Slabs, Corrosion, Foundation Cracks with carbon-fiber and polymer mortar.",
      icon: "https://cdn-icons-png.flaticon.com/512/2910/2910795.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2910/2910795.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2910/2910795.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "Sagging Slab & Beam Rehabilitation",
          titleHi: "झुकी हुई छत और बीम की मरम्मत",
          desc: "Steel channel propping and carbon-fiber laminate strengthening for overloaded slabs.",
          checklist: ["Deflection measurement", "Epoxy carbon laminate bonding", "Load testing certification"]
        },
        {
          titleEn: "Rebar Rust Removal & Anti-Corrosion",
          titleHi: "सरिए का जंग हटाना और सुरक्षा लेप",
          desc: "Full spalled concrete chipping, rust chemical passivation, and zinc-rich coating.",
          checklist: ["Complete rebar exposure", "Zinc primer application", "Polymer mortar troweling"]
        },
        {
          titleEn: "Foundation Settlement Audit",
          titleHi: "नींव की मजबूती और सुरक्षा जांच",
          desc: "Comprehensive civil engineering structural audit and soil settlement analysis.",
          checklist: ["Settlement level audit", "Plinth beam deflection scan", "Safety certification report"]
        }
      ]
    },
    {
      code: "CRACK_REPAIR",
      name: "Crack Stitching",
      description: "Epoxy injection, helical rebar stitching, and fiber mesh for active and dead cracks.",
      icon: "https://cdn-icons-png.flaticon.com/512/1546/1546115.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/1546/1546115.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/1546/1546115.png",
      rating: 4.8,
      subServices: [
        {
          titleEn: "Helical Rebar Wall Stitching",
          titleHi: "दीवार की दरारों की आरसीसी स्टिचिंग",
          desc: "Stainless steel helical ties grouted across fractures to mechanically lock separated masonry.",
          checklist: ["Crack route channeling", "Helical bar anchoring", "Non-shrink grout fill"]
        },
        {
          titleEn: "Epoxy Injection for Structural Cracks",
          titleHi: "एपॉक्सी इंजेक्शन द्वारा दरार भरना",
          desc: "Low-viscosity high-strength epoxy resin pumped under controlled pressure into micro-cracks.",
          checklist: ["Port installation", "Surface seal containment", "Core sample integrity check"]
        },
        {
          titleEn: "Ceiling & Plaster Hairline Crack Fill",
          titleHi: "छत और प्लास्टर की महीन दरारें ठीक करना",
          desc: "Flexible elastomeric sealant reinforced with alkali-resistant fiberglass mesh tape.",
          checklist: ["V-groove chase", "Glass fiber mesh embedding", "Smooth sanding finish"]
        }
      ]
    },
    {
      code: "DAMP_TREATMENT",
      name: "Damp Wall Treatment",
      description: "Efflorescence (Shora) removal, chemical DPC barrier, and anti-mold sanitization.",
      icon: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      iconImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      subServices: [
        {
          titleEn: "Shora & Salt Efflorescence Treatment",
          titleHi: "दीवार का शोरा और सफेद पपड़ी हटाना",
          desc: "Chemical neutralization of alkaline salts flaking off brickwork with deep penetrating barrier.",
          checklist: ["Acid wash salt stripping", "Shora neutralizer application", "Breathable barrier prime"]
        },
        {
          titleEn: "Rising Damp Chemical DPC Injection",
          titleHi: "जमीन से चढ़ने वाली सीलन का इलाज (DPC)",
          desc: "Silicone micro-emulsion cream injected into drill holes at skirting level to block capillary rise.",
          checklist: ["Drill hole spacing 120mm", "Deep cream saturation", "Waterproof mortar capping"]
        },
        {
          titleEn: "Black Mold & Fungal Disinfection",
          titleHi: "फंगस, काई और काले धब्बों का सैनिटाइजेशन",
          desc: "Hospital-grade biocide treatment kills spores inside wet walls and prevents recurring growth.",
          checklist: ["Spore eradication spray", "Moisture dry-out cycle", "Anti-microbial sealant"]
        }
      ]
    },
    {
      code: "PLUMBING_PIPES",
      name: "Plumbing & Drains",
      description: "Thermal leak detection, pipe replacement without breaking, and high-pressure jetting.",
      icon: "https://cdn-icons-png.flaticon.com/512/814/814210.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/814/814210.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/814/814210.png",
      rating: 4.8,
      subServices: [
        {
          titleEn: "Acoustic & Thermal Leak Detection",
          titleHi: "थर्मल कैमरे से बिना तोड़फोड़ लीकेज जांच",
          desc: "Pinpoint hidden leaks behind tiles and under marble floors with zero guesswork damage.",
          checklist: ["Acoustic ground sensor scan", "Thermal infrared heat imaging", "Pinpoint location report"]
        },
        {
          titleEn: "Concealed CPVC / UPVC Pipe Repair",
          titleHi: "दीवार के अंदर पाइप और जॉइंट मरम्मत",
          desc: "Precision wall opening, solvent weld replacement, and 10-bar hydraulic pressure test.",
          checklist: ["Hydraulic pump pressure test", "Brass fitting reinforcement", "Tile restoration match"]
        },
        {
          titleEn: "Hydro-Jet Drain Unclogging",
          titleHi: "हाई-प्रेशर ड्रेन और सीवर सफाई",
          desc: "200-bar rotary water jets clear grease, roots, and cement debris from choked underground lines.",
          checklist: ["Endoscope camera inspection", "High pressure flushing", "Full gravity flow verified"]
        },
        {
          titleEn: "Booster Pump & Water Automation",
          titleHi: "प्रेशर पंप व ऑटोमैटिक वाटर कंट्रोलर",
          desc: "Smart automatic pump controller and variable speed booster installation for constant pressure.",
          checklist: ["Non-return valve fitting", "Dry run protection test", "Optimal bar pressure calibration"]
        }
      ]
    },
    {
      code: "PLUMBING_ELECTRICAL",
      name: "Electrical & Wiring",
      description: "Short circuits, DB reorganizing, concealed wire renewal, earthing and MCB trips.",
      icon: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2910/2910768.png",
      rating: 4.8,
      subServices: [
        {
          titleEn: "Short Circuit & MCB Trip Diagnosis",
          titleHi: "शॉर्ट सर्किट और एमसीबी ट्रिपिंग सुधार",
          desc: "Megger insulation resistance testing to find hidden insulation burns and current leaks.",
          checklist: ["Phase balance test", "RCCB leakage sensitivity check", "Spark-free modular busbar"]
        },
        {
          titleEn: "Concealed Fire-Resistant Rewiring",
          titleHi: "आग-रोधी नई सुरक्षित वायरिंग",
          desc: "FR-LSH copper wires pulled through existing conduits with balanced circuit allocation.",
          checklist: ["FR-LSH certified wire pull", "Neutral integrity verification", "Load distribution blueprint"]
        },
        {
          titleEn: "Chemical Earthing Pit Installation",
          titleHi: "केमिकल अर्थिंग पिट निर्माण व जांच",
          desc: "Copper bonded rod with bentonite chemical compound ensures under 2-ohm ground safety.",
          checklist: ["Earth pit resistance test", "Bentonite backfill compaction", "Lightning surge arrestor link"]
        }
      ]
    },
    {
      code: "PAINTING_WALL_REPAIR",
      name: "Painting & Wall Finish",
      description: "Interior luxury emulsions, exterior weather-coat, damp-proof putty, and designer walls.",
      icon: "https://cdn-icons-png.flaticon.com/512/1048/1048949.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/1048/1048949.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/1048/1048949.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "Exterior Waterproof Weathercoat",
          titleHi: "बाहरी दीवार वाटरप्रूफ वेदरकोट पेंट",
          desc: "Elastomeric exterior silicon paint repels heavy monsoon rains and UV solar degradation.",
          checklist: ["High-pressure wall jet wash", "Anti-algae primer application", "2-coat weathercoat coverage"]
        },
        {
          titleEn: "Interior Luxury Washable Emulsion",
          titleHi: "लग्जरी इंटीरियर वॉशेबल पेंटिंग",
          desc: "Ultra-smooth velvet finish with scrub-resistant stain-clean technology and low VOC odorless paint.",
          checklist: ["Moisture meter reading under 10%", "2-pass mechanized sanding", "Double topcoat brush & roller"]
        },
        {
          titleEn: "Waterproof Acrylic Putty & Leveling",
          titleHi: "वाटरप्रूफ ऐक्रेलिक पुट्टी और दीवार लेवलिंग",
          desc: "High polymer white cement putty leveled with halogen light inspection for flawless smooth walls.",
          checklist: ["Base crack mesh filling", "Dual layer acrylic coat", "Halogen shadow level inspection"]
        },
        {
          titleEn: "Designer Texture & Accent Walls",
          titleHi: "डिजाइनर टेक्सचर और एक्सेंट वॉल",
          desc: "Rustic metallic finishes, spatula patterns, and Italian stucco textures for living and bedrooms.",
          checklist: ["Pattern sample mockup signoff", "Base tinted primer", "Top glaze protective coat"]
        }
      ]
    },
    {
      code: "TILE_WORK",
      name: "Tile & Flooring",
      description: "Laser-aligned floor & wall vitrified tiles, marble diamond polish, and epoxy grouting.",
      icon: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      iconImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      rating: 4.9,
      subServices: [
        {
          titleEn: "Vitrified Floor & Wall Tiling",
          titleHi: "विट्रिफाइड टाइल्स फिटिंग (फर्श और दीवार)",
          desc: "Laser leveled installation using polymer modified tile adhesive with zero hollow sounds.",
          checklist: ["Subfloor levelling compound", "Notched trowel polymer adhesive", "Laser horizontal alignment"]
        },
        {
          titleEn: "Waterproof Epoxy Grouting",
          titleHi: "एपॉक्सी ग्राउटिंग और वॉटरप्रूफिंग",
          desc: "Resin epoxy grout that never stains, chips, or absorbs dirty water in bathrooms and kitchens.",
          checklist: ["Old grout channel extraction", "Chemical joint drying", "Dual-component epoxy fill"]
        },
        {
          titleEn: "Italian Marble Diamond Polishing",
          titleHi: "मार्बल डायमंड पॉलिशिंग और क्रिस्टलाइजेशन",
          desc: "7-step planetary machine grinding with diamond pads delivers a flawless mirror-like glass shine.",
          checklist: ["Lippage joint leveling", "7-stage resin diamond buffing", "Nano crystallization sealer"]
        },
        {
          titleEn: "Surgical Broken Tile Replacement",
          titleHi: "बिना नुकसान टूटी टाइल बदलना",
          desc: "Careful perimeter slicing to remove cracked or popping tiles without breaking surrounding floor.",
          checklist: ["Joint perimeter diamond scoring", "Careful tile lifting", "Exact tone grout color match"]
        }
      ]
    },
    {
      code: "POP_PLASTER",
      name: "POP Ceiling & Plaster",
      description: "Gypsum false ceiling, LED cove lighting channels, soundproof drywalls, and POP cornices.",
      icon: "https://cdn-icons-png.flaticon.com/512/2413/2413004.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2413/2413004.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2413/2413004.png",
      rating: 4.8,
      subServices: [
        {
          titleEn: "Gypsum Designer False Ceiling",
          titleHi: "जिप्सम फॉल्स सीलिंग और कोव लाइट",
          desc: "GI metal framing with heavy gauge perimeter channels and moisture-resistant gypsum boards.",
          checklist: ["Galvanized frame level check", "12.5mm gypsum board fastening", "Joint tape seamless finish"]
        },
        {
          titleEn: "POP Wall Punning & Plaster Leveling",
          titleHi: "पीओपी दीवार पुन्निंग और लेवलिंग",
          desc: "Real gypsum plaster coat over raw masonry to deliver razor-straight 90-degree plumb corners.",
          checklist: ["Right angle plumb verification", "Straight-edge ruler leveling", "Crack resistance mesh"]
        },
        {
          titleEn: "Soundproof Drywall Partitions",
          titleHi: "साउंडप्रूफ ड्राईवॉल और केबिन पार्टीशन",
          desc: "Acoustic rockwool insulated stud partitions for home offices, bedrooms, and commercial suites.",
          checklist: ["Steel stud spacing 400mm", "Acoustic mineral wool infill", "Dual board sound dampening"]
        }
      ]
    },
    {
      code: "ARCHITECTURAL_DESIGN",
      name: "Architectural & 3D Plan",
      description: "2D Vastu Floor Plans, 3D Elevation, Structural Drawings and Complete Virtual Walkthroughs.",
      icon: "https://cdn-icons-png.flaticon.com/512/1055/1055666.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/1055/1055666.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/1055/1055666.png",
      rating: 5.0,
      subServices: [
        {
          titleEn: "2D Floor Plan & Vastu Layout",
          titleHi: "2D फ्लोर प्लान और वास्तु अनुकूल नक्शा",
          desc: "Optimized space planning with dimensional room layouts, ventilation shafts and Vastu compliance.",
          checklist: ["Plot boundary survey", "Vastu cardinal compass alignment", "Detailed CAD drawing delivery"]
        },
        {
          titleEn: "3D Front Elevation & Facade",
          titleHi: "3D फ्रंट एलिवेशन और मॉडर्न डिजाइन",
          desc: "Photorealistic daytime and night lighting 3D renders with modern louvers, stone cladding and glass.",
          checklist: ["Multiple color palette concepts", "Material specifications list", "4K high-res render renders"]
        },
        {
          titleEn: "Structural Engineering Drawings",
          titleHi: "संरचनात्मक ड्राइंग (कॉलम, बीम, सरिया)",
          desc: "Earthquake-resistant RCC structural detailing approved by licensed civil & structural engineers.",
          checklist: ["Soil bearing capacity analysis", "Rebar bar-bending schedule", "Licensed engineer stamp"]
        }
      ]
    },
    {
      code: "TERMITE_CONTROL",
      name: "Termite & Pest Control",
      description: "Pre & post construction anti-termite soil barrier, wood borer defense, and odorless gel.",
      icon: "https://cdn-icons-png.flaticon.com/512/2873/2873836.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2873/2873836.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2873/2873836.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "Post-Construction Drill & Inject Defense",
          titleHi: "ड्रिल और केमिकल इंजेक्शन द्वारा दीमक रोकथाम",
          desc: "Precision skirting holes drilled at 1-foot intervals and pressurized termiticide injected to create chemical barrier.",
          checklist: ["Non-repellent chemical injection", "Wall skirting hole sealing", "Certified chemical treatment certificate"]
        },
        {
          titleEn: "Pre-Construction Soil Trenching",
          titleHi: "नींव खुदाई के समय दीमक रोधक उपचार",
          desc: "Treating foundation trenches, backfilled earth, and plinth area with heavy duty anti-termite chemicals.",
          checklist: ["Trench bottom soil spraying", "Backfill earth chemical emulsion", "Plinth floor continuous barrier"]
        },
        {
          titleEn: "Wood Borer & Timber Protection",
          titleHi: "लकड़ी के फर्नीचर व दरवाजों का उपचार",
          desc: "Targeted syringe injection into wood borer flight holes with petroleum-based penetrating insecticide.",
          checklist: ["Pinhole syringe penetration", "Deep wood fiber soaking", "Surface protective oil coating"]
        }
      ]
    },
    {
      code: "WATER_TANK_CLEANING",
      name: "Water Tank Cleaning",
      description: "Underground sump & overhead Sintex tank deep de-sludging, UV sterilization and pressure cleaning.",
      icon: "https://cdn-icons-png.flaticon.com/512/3100/3100570.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/3100/3100570.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/3100/3100570.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "Underground Sump High-Pressure Clean",
          titleHi: "अंडरग्राउंड वाटर टैंक सफाई व कीटाणुशोधन",
          desc: "Submersible de-watering, rotary rotary wall scrubbing and anti-bacterial potassium sludge flush.",
          checklist: ["Sediment pump drainage", "High pressure rotary jetting", "Bio-safe disinfection"]
        },
        {
          titleEn: "Overhead Sintex / PVC Tank UV Clean",
          titleHi: "छत की पानी की टंकी की यूवी सफाई",
          desc: "UV radiator lamp sterilization kills algae, bacteria and viruses with safe non-toxic sanitizing.",
          checklist: ["Vacuum sludge extraction", "UV chamber radiation sweep", "TDS water test post-clean"]
        },
        {
          titleEn: "Tank Seepage & Crack Chemical Patch",
          titleHi: "पानी की टंकी की लीकेज व दरार रिपेयर",
          desc: "Food-grade non-toxic epoxy mortar lining seals pinhole leaks and expansion joints inside tanks.",
          checklist: ["Pinhole leak detection", "Food-grade epoxy paste", "24-Hour water cure test"]
        }
      ]
    },
    {
      code: "GLASS_ALUMINUM",
      name: "Glass & Windows",
      description: "Soundproof UPVC sliding windows, toughened glass shower cubicles, and balcony railings.",
      icon: "https://cdn-icons-png.flaticon.com/512/1533/1533907.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/1533/1533907.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/1533/1533907.png",
      rating: 4.8,
      subServices: [
        {
          titleEn: "Soundproof UPVC Sliding Windows",
          titleHi: "साउंडप्रूफ यूपीवीसी व एल्युमिनियम खिड़कियां",
          desc: "Multi-chambered German UPVC profiles with double glazed acoustic glass cutting street noise by 80%.",
          checklist: ["Acoustic double glazing", "Multi-point security lock", "Silicon perimeter seal"]
        },
        {
          titleEn: "Toughened Glass Shower Partitions",
          titleHi: "टफन्ड ग्लास शावर पार्टीशन व केबिन",
          desc: "10mm frameless architectural toughened safety glass with SS 304 anti-rust hardware hinges.",
          checklist: ["10mm safety glass certification", "SS 304 hinge leveling", "Anti-water leakage sweep"]
        },
        {
          titleEn: "Balcony Glass Railings & Spiders",
          titleHi: "बालकनी टफन्ड ग्लास रेलिंग",
          desc: "Heavy duty aluminum base channel or stainless steel spigots for panoramic unhindered views.",
          checklist: ["Base channel anchoring", "Wind load impact test", "Smooth chamfered edges"]
        }
      ]
    },
    {
      code: "SOLAR_INSTALLATION",
      name: "Solar & Inverter Setup",
      description: "Rooftop on-grid solar power systems, solar water heaters, net metering and battery backup.",
      icon: "https://cdn-icons-png.flaticon.com/512/2910/2910777.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2910/2910777.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2910/2910777.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "Rooftop On-Grid Solar Plant",
          titleHi: "रूफटॉप सोलर पैनल इंस्टॉलेशन (ऑन-ग्रिड)",
          desc: "High-efficiency monocrystalline PERC panels, solar inverter, structure anchoring and net metering.",
          checklist: ["Solar shadow analysis", "Galvanized roof structure anchor", "Government subsidy filing"]
        },
        {
          titleEn: "Solar Water Heater Setup & Repair",
          titleHi: "सोलर वाटर हीटर इंस्टॉलेशन व मरम्मत",
          desc: "Evacuated tube collector (ETC) system installation with pressurized plumbing loop.",
          checklist: ["Vacuum tube inspection", "Sacrificial anode rod check", "Thermostatic backup link"]
        },
        {
          titleEn: "Hybrid Inverter & Lithium Battery Sync",
          titleHi: "सोलर इनवर्टर व लिथियम बैटरी कनेक्शन",
          desc: "Pure sine wave solar PCU with fast charging and seamless emergency load transfer.",
          checklist: ["Battery state-of-charge test", "DC surge protection SPD", "Phase balance wiring"]
        }
      ]
    },
    {
      code: "CARPENTRY_FURNITURE",
      name: "Carpentry & Doors",
      description: "Flush doors, digital locks, modular kitchen maintenance, wardrobes, and wood polishing.",
      icon: "https://cdn-icons-png.flaticon.com/512/2910/2910786.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2910/2910786.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2910/2910786.png",
      rating: 4.8,
      subServices: [
        {
          titleEn: "Main Door & Digital Smart Lock",
          titleHi: "दरवाजा फिटिंग व स्मार्ट डिजिटल लॉक",
          desc: "Heavy teak/flush door alignment with biometric fingerprint, keypad and RFID mortise lock installation.",
          checklist: ["Laser frame alignment", "Mortise lock mortising", "Weatherproof rubber beading"]
        },
        {
          titleEn: "Modular Kitchen Drawer & Hinge Tuneup",
          titleHi: "मॉड्यूलर किचन हिंज व ड्रॉवर रिपेयर",
          desc: "Tandem box realigning, soft-close hydraulic hinge replacement, and waterproof base sheet lining.",
          checklist: ["Hydraulic pump tension set", "Tandem runner lubrication", "Corrosion-proof screws"]
        },
        {
          titleEn: "Wood PU Polish & Scratch Removal",
          titleHi: "लकड़ी का फर्नीचर व वुडन फ्लोर पॉलिश",
          desc: "Melamine or polyurethane spray coat revitalizes dull wooden surfaces to an immaculate high-gloss finish.",
          checklist: ["Grit 320 surface leveling", "Wood filler color matching", "Spray booth polyurethane seal"]
        }
      ]
    },
    {
      code: "SMART_HOME_SECURITY",
      name: "CCTV & Home Security",
      description: "HD CCTV cameras, smartphone live stream, video door phone, and smart motion alarms.",
      icon: "https://cdn-icons-png.flaticon.com/512/2910/2910761.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2910/2910761.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2910/2910761.png",
      rating: 4.9,
      subServices: [
        {
          titleEn: "HD IP CCTV Camera Installation",
          titleHi: "एचडी सीसीटीवी कैमरा और मोबाइल व्यूइंग",
          desc: "Night vision infrared and color at night IP dome/bullet cameras connected to central NVR with mobile app.",
          checklist: ["Cat6 cable conduit pull", "Optimal focal blindspot check", "Remote cloud mobile view setup"]
        },
        {
          titleEn: "Video Door Phone & Intercom",
          titleHi: "वीडियो डोर फोन और स्मार्ट कॉलबेल",
          desc: "7-inch color touch screen indoor monitor with wide angle outdoor camera and two-way talk.",
          checklist: ["Concealed cabling", "Electronic strike latch link", "Tamper alarm test"]
        },
        {
          titleEn: "Smart Sensor Alarm & Motion Defense",
          titleHi: "स्मार्ट मोशन सेंसर और सायरन सिस्टम",
          desc: "Wireless magnetic door/window contacts and PIR sensors with instant mobile push alerts.",
          checklist: ["Sensor RF signal test", "Siren decibel verification", "Battery backup test"]
        }
      ]
    },
    {
      code: "CIVIL_AUDIT",
      name: "Home Quality Inspection",
      description: "Pre-possession technical inspection, concrete strength test, electrical & plumbing snag audit.",
      icon: "https://cdn-icons-png.flaticon.com/512/2910/2910763.png",
      iconImage: "https://cdn-icons-png.flaticon.com/512/2910/2910763.png",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2910/2910763.png",
      rating: 5.0,
      subServices: [
        {
          titleEn: "Pre-Possession Snagging Inspection",
          titleHi: "गृह प्रवेश से पूर्व 150+ प्वाइंट्स जांच",
          desc: "Comprehensive 150+ point audit of wall plaster, tile hollow sounds, plumbing slopes and electric circuits.",
          checklist: ["Hollow tile sonic hammer test", "Spirit level floor slope scan", "Comprehensive snag PDF report"]
        },
        {
          titleEn: "Concrete Rebound Hammer Test",
          titleHi: "कंक्रीट मजबूती व लोड बेयरिंग टेस्ट",
          desc: "Non-destructive Schmidt rebound hammer test measures compressive strength of slabs and columns.",
          checklist: ["10-point test grid on beam", "Compressive MPa calculation", "Structural health certificate"]
        },
        {
          titleEn: "Thermal Thermal Heat & Moisture Audit",
          titleHi: "थर्मल इन्फ्रारेड सीलन व हीट लीकेज जांच",
          desc: "FLIR thermal camera reveals hidden damp pockets behind fresh paint and thermal air leaks.",
          checklist: ["Thermal imaging baseline scan", "Damp moisture % mapping", "Evidence annotated photo audit"]
        }
      ]
    }
  ];

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

    // Plumbing & Drains
    "Acoustic & Thermal Leak Detection": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "Concealed CPVC / UPVC Pipe Repair": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
    "Hydro-Jet Drain Unclogging": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
    "Booster Pump & Water Automation": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",

    // Electrical & Wiring
    "Short Circuit & MCB Trip Diagnosis": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    "Concealed Fire-Resistant Rewiring": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
    "Chemical Earthing Pit Installation": "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",

    // Painting & Wall Finish
    "Exterior Waterproof Weathercoat": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    "Interior Luxury Washable Emulsion": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    "Waterproof Acrylic Putty & Leveling": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "Designer Texture & Accent Walls": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",

    // Tile & Flooring
    "Vitrified Floor & Wall Tiling": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "Waterproof Epoxy Grouting": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "Italian Marble Diamond Polishing": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "Surgical Broken Tile Replacement": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",

    // POP Ceiling & Plaster
    "Gypsum Designer False Ceiling": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    "POP Wall Punning & Plaster Leveling": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    "Soundproof Drywall Partitions": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",

    // Architectural & 3D Plan
    "2D Floor Plan & Vastu Layout": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",
    "3D Front Elevation & Facade": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "Structural Engineering Drawings": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",

    // Termite & Pest Control
    "Post-Construction Drill & Inject Defense": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "Pre-Construction Soil Trenching": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    "Wood Borer & Timber Protection": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",

    // Water Tank Cleaning
    "Underground Sump High-Pressure Clean": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80",
    "Overhead Sintex / PVC Tank UV Clean": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "Tank Seepage & Crack Chemical Patch": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",

    // Glass & Windows
    "Soundproof UPVC Sliding Windows": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
    "Toughened Glass Shower Partitions": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "Balcony Glass Railings & Spiders": "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80",

    // Solar & Inverter Setup
    "Rooftop On-Grid Solar Plant": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
    "Solar Water Heater Setup & Repair": "https://images.unsplash.com/photo-1508873696983-2df570464756?auto=format&fit=crop&w=800&q=80",
    "Hybrid Inverter & Lithium Battery Sync": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",

    // Carpentry & Doors
    "Main Door & Digital Smart Lock": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    "Modular Kitchen Drawer & Hinge Tuneup": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    "Wood PU Polish & Scratch Removal": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",

    // CCTV & Home Security
    "HD IP CCTV Camera Installation": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
    "Video Door Phone & Intercom": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    "Smart Sensor Alarm & Motion Defense": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",

    // Home Quality Inspection
    "Pre-Possession Snagging Inspection": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
    "Concrete Rebound Hammer Test": "https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80",
    "Thermal Thermal Heat & Moisture Audit": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"
  };

  const DEFAULT_SUB_IMAGE = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80";

  for (const s of servicesData) {
    const { subServices, ...serviceFields } = s;

    // 1. Upsert Service
    const service = await prisma.service.upsert({
      where: { code: s.code },
      update: serviceFields,
      create: serviceFields
    });

    // 2. Safely Upsert SubServices (preserves foreign keys on existing bookings/requests)
    for (const sub of subServices) {
      const imgUrl = sub.image || SUBSERVICE_IMAGES[sub.titleEn] || DEFAULT_SUB_IMAGE;
      const charge = sub.visitingCharge !== undefined ? sub.visitingCharge : 199.0;

      const existingSub = await prisma.subService.findFirst({
        where: { serviceId: service.id, titleEn: sub.titleEn }
      });

      const subData = {
        serviceId: service.id,
        titleEn: sub.titleEn,
        titleHi: sub.titleHi,
        desc: sub.desc,
        image: imgUrl,
        visitingCharge: charge,
        bookNowEnabled: sub.bookNowEnabled !== undefined ? sub.bookNowEnabled : true,
        getQuoteEnabled: sub.getQuoteEnabled !== undefined ? sub.getQuoteEnabled : true,
        isActive: true,
        checklist: sub.checklist
      };

      if (existingSub) {
        await prisma.subService.update({
          where: { id: existingSub.id },
          data: subData
        });
      } else {
        await prisma.subService.create({
          data: subData
        });
      }
    }
    console.log(`✅ Upserted ${service.name} with ${subServices.length} subservices with high-res imagery`);
  }

  // 3. Seed Demo User
  let demoUser = await prisma.user.findFirst();
  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        name: "Piyush Sharma",
        phoneNumber: "+91 94628 77757",
        email: "piyush@example.com",
        authProvider: "local",
      }
    });
    console.log(`✅ Created demo user: ${demoUser.name}`);
  }

  // 4. Direct Bookings (Only real user bookings are kept; no demo bookings)

  // 5. Seed Demo Service Request & Quotation
  const civilService = await prisma.service.findUnique({
    where: { code: "CIVIL_CONSTRUCTION" },
    include: { subServices: true }
  });

  if (civilService && civilService.subServices.length > 0) {
    const civilSub = civilService.subServices[0];
    let req1 = await prisma.serviceRequest.findUnique({
      where: { requestNumber: "REQ-2026-101" }
    });

    if (!req1) {
      req1 = await prisma.serviceRequest.create({
        data: {
          requestNumber: "REQ-2026-101",
          userId: demoUser.id,
          serviceId: civilService.id,
          subServiceId: civilSub.id,
          servicecode: civilService.code,
          subServiceCode: civilSub.titleEn,
          issueDescription: "Cracks observed on beam and slab during monsoon season.",
          urgency: "HIGH",
          status: "QUOTED",
          mediaUrl: ["https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?auto=format&fit=crop&w=800&q=80"],
          propertyType: "Residential Villa",
          propertySize: "1800 sq ft",
          location: "Bhilwara, Rajasthan",
          latitude: 25.3463,
          longitude: 74.6364,
          preferredDate: "2026-10-25",
          preferredTime: "11:00 AM",
          addressline: "Plot 88, Near Lake View Colony"
        }
      });
      console.log('✅ Seeded demo ServiceRequest REQ-2026-101');

      const existingQ1 = await prisma.quotation.findUnique({
        where: { quoteNumber: "QTE-2026-501" }
      });

      if (!existingQ1) {
        await prisma.quotation.create({
          data: {
            quoteNumber: "QTE-2026-501",
            requestId: req1.id,
            status: "PENDING_APPROVAL",
            lineItem: [
              { item: "Polymer modified micro-concrete", quantity: "4 bags", rate: 850, amount: 3400 },
              { item: "Rust converter & rebar coating", quantity: "2 liters", rate: 1200, amount: 2400 },
              { item: "Skilled structural masonry labor", quantity: "3 days", rate: 1500, amount: 4500 }
            ],
            materialCost: 5800.0,
            laborCost: 4500.0,
            totalCost: 10300.0,
            discount: 500.0,
            subtotal: 9800.0,
            taxGST: 1764.0,
            grandtotal: 11564.0,
            taxRate: 18.0,
            termsAndConditions: "1. 50% advance on material mobilization.\n2. Work executed according to standard engineering specifications.",
            created_by: "Er. Vikram Sharma",
            estimatedTimeline: "4 Working Days"
          }
        });
        console.log('✅ Seeded demo Quotation QTE-2026-501');
      }
    }
  }

  console.log('🎉 All 18 Services, SubServices with high-res images, and demo Data seeded into Neon / Aiven DB!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());

