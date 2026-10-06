import 'package:flutter/material.dart';

import '../models/service_model.dart';

final List<ServiceCategory> mockServiceCategories = [
  const ServiceCategory(
    id: 'cat_waterproof',
    title: 'Waterproofing & Seepage',
    shortTitle: 'Waterproofing',
    subtitle: 'Roof, Bathroom, Wall Dampness & Cracks',
    icon: Icons.water_drop_rounded,
    color: Color(0xFF0284C7),
    bg: Color(0xFF0C243B),
    rating: 4.9,
    subcategories: [
      SubService(
        id: 'sub_w1',
        name: 'Stop Roof & Terrace Water Leakage',
        desc: 'Elastomeric polymer chemical coating, ponding test',
        defaultNotes:
            'Water dripping from terrace during rain, cracks visible.',
        checklist: [
          'Surface Grinding',
          'Crack V-Groove filling',
          '2-Coat Polymer Membrane',
        ],
      ),
      SubService(
        id: 'sub_w2',
        name: 'Bathroom & Concealed Pipe Seepage',
        desc: 'Non-destructive epoxy tile grouting & drain joint sealing',
        defaultNotes: 'Damp moisture spreading into adjoining bedroom wall.',
        checklist: ['Moisture Meter Scan', 'Epoxy Re-grouting', 'Trap Seal'],
      ),
      SubService(
        id: 'sub_w3',
        name: 'Wall Dampness & Efflorescence',
        desc:
            'Anti-efflorescence barrier primer + breathable waterproof plaster',
        defaultNotes: 'White salt flaking off wall with paint peeling.',
        checklist: [
          'Flaking Paint Removal',
          'Damp-Proof Shield',
          'Base Plaster',
        ],
      ),
    ],
  ),
  const ServiceCategory(
    id: 'cat_civil',
    title: 'Civil Construction & Repairs',
    shortTitle: 'Civil Work',
    subtitle: 'Cracks, Plaster, Beam & Column Repair',
    icon: Icons.foundation_rounded,
    color: Color(0xFF2563EB),
    bg: Color(0xFF0F1E36),
    rating: 4.8,
    subcategories: [
      SubService(
        id: 'sub_c1',
        name: 'Structural Beam & Slab Crack Repair',
        desc: 'High-strength micro-concrete & polymer modified mortar',
        defaultNotes: 'Crack along ceiling beam approx 10 feet long.',
        checklist: ['Rust Treatment', 'Micro-Concrete Grouting', 'Bond Coat'],
      ),
      SubService(
        id: 'sub_c2',
        name: 'Plaster Repair & Surface Leveling',
        desc: 'Damaged plaster chipping, bonding agent & sand cement re-plastering',
        defaultNotes: 'Hollow sound and falling plaster chunks on outer wall.',
        checklist: ['Loose Chipping', 'SBR Latex Bond', 'Smooth Finish'],
      ),
    ],
  ),
  const ServiceCategory(
    id: 'cat_painting',
    title: 'Painting & Damp Proofing',
    shortTitle: 'Painting',
    subtitle: 'Putty, POP, Exterior Weathercoat',
    icon: Icons.format_paint_rounded,
    color: Color(0xFF9333EA),
    bg: Color(0xFF24143D),
    rating: 4.8,
    subcategories: [
      SubService(
        id: 'sub_p1',
        name: 'Interior Luxury Emulsion + Moisture Base',
        desc: 'Double coat damp-lock primer + luxury washable topcoat',
        defaultNotes: 'Repaint living room and bedrooms with washable finish.',
        checklist: [
          'Sanding & Putty',
          'Anti-fungal Primer',
          'Double Coat Color',
        ],
      ),
      SubService(
        id: 'sub_p2',
        name: 'Exterior Rain-Guard Facade Shield',
        desc: '10-Year anti-algae elastomeric weather shield coating',
        defaultNotes: 'Building exterior wall repainting needed.',
        checklist: ['Pressure Wash', 'Crack Sealant', 'Weather Shield Coat'],
      ),
    ],
  ),
  const ServiceCategory(
    id: 'cat_interior',
    title: 'Interior & Modular Design',
    shortTitle: 'Interiors',
    subtitle: 'Modular Kitchen, False Ceiling, Wardrobes',
    icon: Icons.chair_rounded,
    color: Color(0xFF0D9488),
    bg: Color(0xFF0D2526),
    rating: 4.9,
    subcategories: [
      SubService(
        id: 'sub_i1',
        name: 'Modular Kitchen Renovation',
        desc: 'BWP Marine Ply, Acrylic/Laminate shutter, soft-close hardware',
        defaultNotes: 'L-shape modular kitchen remodel with quartz top.',
        checklist: [
          '3D Design Plan',
          'BWP Marine Ply carcass',
          'Hettich Hardware',
        ],
      ),
      SubService(
        id: 'sub_i2',
        name: 'Gypsum Designer False Ceiling',
        desc: 'Saint-Gobain gypsum channel framework with LED ambient cove lights',
        defaultNotes: 'Living room modern ceiling with indirect lighting.',
        checklist: [
          'Laser Leveling',
          'GI Channel Grid',
          'Cove Lighting Channels',
        ],
      ),
    ],
  ),
];
