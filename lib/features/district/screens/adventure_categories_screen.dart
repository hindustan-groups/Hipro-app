import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../data/ent_api_service.dart';
import '../models/experience_model.dart';
import '../widgets/experience_booking_sheet.dart';
import 'experience_details_screen.dart';

class AdventureCategoriesScreen extends StatefulWidget {
  final VoidCallback? onOpenDrawer;

  const AdventureCategoriesScreen({super.key, this.onOpenDrawer});

  @override
  State<AdventureCategoriesScreen> createState() => _AdventureCategoriesScreenState();
}

class _AdventureCategoriesScreenState extends State<AdventureCategoriesScreen> {
  String _selectedCategory = 'Air Sports';
  String _selectedCity = 'All';
  List<ExperienceItem> _backendExperiences = [];
  bool _isLoading = false;

  final List<Map<String, dynamic>> _categoryData = [
    {
      'title': 'Air Sports',
      'icon': Icons.paragliding_rounded,
      'color': const Color(0xFF0284C7),
      'count': '6 Activities',
      'tagline': 'Paragliding, Paramotor & Skydiving',
    },
    {
      'title': 'Desert Safari',
      'icon': Icons.wb_sunny_rounded,
      'color': const Color(0xFFD97706),
      'count': '4 Activities',
      'tagline': 'Dune Bashing, Camel Ride & Desert Camps',
    },
    {
      'title': 'Water Sports',
      'icon': Icons.water_rounded,
      'color': const Color(0xFF0D9488),
      'count': '8 Activities',
      'tagline': 'River Rafting, Kayaking & Cliff Jumps',
    },
    {
      'title': 'Adventure',
      'icon': Icons.terrain_rounded,
      'color': const Color(0xFFE11D48),
      'count': '10 Activities',
      'tagline': 'Trekking, Rock Climbing & Ziplining',
    },
    {
      'title': 'Sightseeing',
      'icon': Icons.explore_rounded,
      'color': const Color(0xFF7C3AED),
      'count': '5 Activities',
      'tagline': 'Scenic Mountain & River Excursions',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchExperiences();
  }

  Future<void> _fetchExperiences() async {
    setState(() => _isLoading = true);
    try {
      final list = await EntApiService().fetchExperiences();
      if (mounted && list.isNotEmpty) {
        setState(() {
          _backendExperiences = list;
        });
      }
    } catch (_) {
      // Fallback to mock data
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<ExperienceItem> get _itemsForCategory {
    final all = _backendExperiences.isNotEmpty
        ? _backendExperiences
        : ExperienceItem.mockExperiences;

    return all.where((e) {
      final matchesCategory = _selectedCategory == 'All' ||
          e.category.toLowerCase() == _selectedCategory.toLowerCase() ||
          (_selectedCategory == 'Adventure' &&
              (e.category.toLowerCase().contains('trek') ||
                  e.category.toLowerCase().contains('adventure')));
      final matchesCity =
          _selectedCity == 'All' || e.city.toLowerCase() == _selectedCity.toLowerCase();
      return matchesCategory && matchesCity;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final items = _itemsForCategory;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: widget.onOpenDrawer != null
            ? IconButton(
                icon: const Icon(Icons.menu_rounded, size: 24),
                color: const Color(0xFF0F172A),
                onPressed: widget.onOpenDrawer,
              )
            : null,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Adventure Categories',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 18,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.2,
              ),
            ),
            Text(
              'Choose your thrill & explore verified packages',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Horizontal Category Strip
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: SizedBox(
              height: 48,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categoryData.length,
                separatorBuilder: (context, index) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final cat = _categoryData[i];
                  final isSelected = cat['title'] == _selectedCategory;
                  final Color catColor = cat['color'] as Color;

                  return InkWell(
                    onTap: () {
                      setState(() {
                        _selectedCategory = cat['title'] as String;
                      });
                    },
                    borderRadius: BorderRadius.circular(24),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? catColor
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: catColor.withValues(alpha: 0.35),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                )
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            cat['icon'] as IconData,
                            size: 18,
                            color: isSelected ? Colors.white : const Color(0xFF475569),
                          ),
                          const SizedBox(width: 7),
                          Text(
                            cat['title'] as String,
                            style: TextStyle(
                              color: isSelected ? Colors.white : const Color(0xFF334155),
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // City selector filter chips
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                const Text(
                  'City: ',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF64748B),
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['All', 'Dehradun', 'Jaisalmer', 'Rishikesh'].map((city) {
                        final isSel = _selectedCity == city;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ChoiceChip(
                            label: Text(city),
                            selected: isSel,
                            onSelected: (val) {
                              if (val) setState(() => _selectedCity = city);
                            },
                            labelStyle: TextStyle(
                              fontSize: 11.5,
                              fontWeight: isSel ? FontWeight.w700 : FontWeight.w500,
                              color: isSel ? const Color(0xFFE11D48) : const Color(0xFF64748B),
                            ),
                            selectedColor: const Color(0xFFFFF1F2),
                            backgroundColor: const Color(0xFFF8FAFC),
                            side: BorderSide(
                              color: isSel ? const Color(0xFFFDA4AF) : const Color(0xFFE2E8F0),
                            ),
                            visualDensity: VisualDensity.compact,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Experiences List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: Color(0xFFE11D48)),
                  )
                : items.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(
                                color: Color(0xFFFFF1F2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.paragliding_rounded,
                                size: 36,
                                color: Color(0xFFE11D48),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'No $_selectedCategory in $_selectedCity',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Try selecting "All" cities to view available adventures',
                              style: TextStyle(
                                fontSize: 12.5,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                        itemCount: items.length,
                        itemBuilder: (context, idx) {
                          final exp = items[idx];
                          return _buildAdventureCard(exp);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdventureCard(ExperienceItem exp) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ExperienceDetailsScreen(experience: exp),
            ),
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Stack
            Stack(
              children: [
                CachedNetworkImage(
                  imageUrl: exp.imageUrl,
                  height: 175,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    height: 175,
                    color: const Color(0xFFE2E8F0),
                    child: const Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFFE11D48),
                      ),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    height: 175,
                    color: const Color(0xFFE2E8F0),
                    child: const Icon(Icons.broken_image, color: Color(0xFF94A3B8)),
                  ),
                ),
                Container(
                  height: 175,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withValues(alpha: 0.15),
                        Colors.black.withValues(alpha: 0.65),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFE11D48), Color(0xFFF97316)],
                      ),
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFE11D48).withValues(alpha: 0.4),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                    child: Text(
                      exp.badge.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on_rounded, size: 12, color: Colors.white),
                        const SizedBox(width: 3),
                        Text(
                          exp.city,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 12,
                  left: 14,
                  right: 14,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        exp.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          shadows: [
                            Shadow(blurRadius: 4, color: Colors.black54),
                          ],
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 15, color: Color(0xFFFBBF24)),
                          const SizedBox(width: 3),
                          Text(
                            '${exp.rating}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '(${exp.reviewsCount} reviews)',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.85),
                              fontSize: 11,
                            ),
                          ),
                          const Spacer(),
                          const Icon(Icons.timer_outlined, size: 13, color: Colors.white70),
                          const SizedBox(width: 3),
                          Text(
                            exp.duration,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Bottom Content
            Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Starting from',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 1),
                        Row(
                          children: [
                            Text(
                              '₹${exp.startingPrice.toInt()}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            if (exp.originalPrice != null) ...[
                              const SizedBox(width: 6),
                              Text(
                                '₹${exp.originalPrice!.toInt()}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  decoration: TextDecoration.lineThrough,
                                  color: Color(0xFF94A3B8),
                                ),
                              ),
                            ],
                            const Text(
                              ' / person',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => ExperienceBookingSheet(experience: exp),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE11D48),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Book Pass',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
