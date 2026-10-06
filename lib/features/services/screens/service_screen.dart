import 'package:flutter/material.dart';

import '../models/service_model.dart';
import 'service_details_screen.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  String _selectedCategory = 'All';
  String _searchQuery = '';

  final List<String> _categories = [
    'All',
    'Civil',
    'Architecture',
    'Survey',
    'Planning',
    'Waterproofing',
  ];

  static const List<_ServiceData> _services = [
    _ServiceData(
      id: 's_civil',
      name: 'Civil Construction',
      shortDescription: 'Building, renovation, structural work',
      category: 'Civil',
      icon: Icons.apartment_rounded,
      iconColor: Color(0xFF1864E8),
      bgColor: Color(0xFFEBF2FE),
      price: 2500,
      imageUrl:
          'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?auto=format&fit=crop&w=800&q=80',
    ),
    _ServiceData(
      id: 's_arch',
      name: 'Architectural Design',
      shortDescription: '2D/3D plans, elevation, interior',
      category: 'Architecture',
      icon: Icons.architecture_rounded,
      iconColor: Color(0xFF0D9488),
      bgColor: Color(0xFFE6FAF5),
      price: 3500,
      imageUrl:
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    ),
    _ServiceData(
      id: 's_survey',
      name: 'Survey & Mapping',
      shortDescription: 'Land survey, site analysis, GIS',
      category: 'Survey',
      icon: Icons.map_rounded,
      iconColor: Color(0xFFF59E0B),
      bgColor: Color(0xFFFEF5E7),
      price: 2000,
      imageUrl:
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    ),
    _ServiceData(
      id: 's_est',
      name: 'Estimation & Planning',
      shortDescription: 'Cost estimation, project planning',
      category: 'Planning',
      icon: Icons.calculate_rounded,
      iconColor: Color(0xFF8B5CF6),
      bgColor: Color(0xFFF8EEFE),
      price: 1800,
      imageUrl:
          'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    ),
    _ServiceData(
      id: 's_waterproof',
      name: 'Waterproofing',
      shortDescription: 'Roof, basement, terrace waterproofing',
      category: 'Waterproofing',
      icon: Icons.water_drop_rounded,
      iconColor: Color(0xFF0284C7),
      bgColor: Color(0xFFE0F2FE),
      price: 2200,
      imageUrl:
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    ),
    _ServiceData(
      id: 's_maint',
      name: 'Maintenance',
      shortDescription: 'Repair, renovation, AMC',
      category: 'Civil',
      icon: Icons.build_circle_rounded,
      iconColor: Color(0xFF10B981),
      bgColor: Color(0xFFECFDF5),
      price: 1500,
      imageUrl:
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filteredServices = _services.where((item) {
      final matchesCat =
          _selectedCategory == 'All' || item.category == _selectedCategory;
      final matchesSearch = _searchQuery.isEmpty ||
          item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          item.shortDescription.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text(
          'Services',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Search & Filters Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
            child: Column(
              children: [
                // Search Input
                Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    decoration: const InputDecoration(
                      prefixIcon: Icon(
                        Icons.search_rounded,
                        color: Color(0xFF94A3B8),
                        size: 20,
                      ),
                      hintText: 'Search services...',
                      hintStyle: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 13.5,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 14),

                // Category Chips
                SizedBox(
                  height: 36,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _categories.length,
                    separatorBuilder: (_, index) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = cat == _selectedCategory;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedCategory = cat),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF1864E8)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            cat,
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFF64748B),
                              fontSize: 13,
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          // Services List
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
              itemCount: filteredServices.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final service = filteredServices[index];
                return GestureDetector(
                  onTap: () {
                    final itemModel = ServiceItem(
                      id: service.id,
                      name: service.name,
                      shortDescription: service.shortDescription,
                      startingPrice: service.price,
                      unit: 'visit',
                      imageUrl: service.imageUrl,
                      includedPoints: const [
                        'Site Inspection & Comprehensive Assessment',
                        'Detailed Measurement & Technical Report',
                        'Material Grade Consultation',
                        'Official Guarantee & Quality Oversight',
                      ],
                    );
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) =>
                            ServiceDetailsScreen(service: itemModel),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color:
                              const Color(0xFF0F172A).withValues(alpha: 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: service.bgColor,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            service.icon,
                            color: service.iconColor,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                service.name,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                service.shortDescription,
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 12.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right_rounded,
                          color: Color(0xFFCBD5E1),
                          size: 20,
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ServiceData {
  final String id;
  final String name;
  final String shortDescription;
  final String category;
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final double price;
  final String imageUrl;

  const _ServiceData({
    required this.id,
    required this.name,
    required this.shortDescription,
    required this.category,
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.price,
    required this.imageUrl,
  });
}
