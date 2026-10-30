import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../district/data/ent_api_service.dart';
import '../../district/models/experience_model.dart';
import '../../district/screens/district_hub_screen.dart';
import '../../district/screens/experience_details_screen.dart';

class DistrictExperiencesSection extends StatefulWidget {
  const DistrictExperiencesSection({super.key});

  @override
  State<DistrictExperiencesSection> createState() => _DistrictExperiencesSectionState();
}

class _DistrictExperiencesSectionState extends State<DistrictExperiencesSection> {
  String _selectedCity = 'All';
  List<String> _quickCities = ['All', 'Dehradun', 'Jaisalmer', 'Rishikesh'];
  List<ExperienceItem> _backendExperiences = [];

  @override
  void initState() {
    super.initState();
    _fetchEntExperiences();
    _fetchCities();
  }

  Future<void> _fetchEntExperiences() async {
    try {
      final list = await EntApiService().fetchExperiences();
      if (mounted && list.isNotEmpty) {
        setState(() {
          _backendExperiences = list;
        });
      }
    } catch (_) {
      // Graceful fallback to built-in curated catalog
    }
  }

  Future<void> _fetchCities() async {
    try {
      final list = await EntApiService().fetchCities();
      if (mounted && list.isNotEmpty) {
        setState(() {
          _quickCities = list;
        });
      }
    } catch (_) {}
  }

  List<ExperienceItem> get _filteredList {
    final all = _backendExperiences.isNotEmpty
        ? _backendExperiences
        : ExperienceItem.mockExperiences;
    if (_selectedCity == 'All') return all;
    return all.where((e) => e.city.toLowerCase() == _selectedCity.toLowerCase()).toList();
  }

  @override
  Widget build(BuildContext context) {
    final experiences = _filteredList;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header Row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF7C3AED), Color(0xFFE11D48)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(6),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.25),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Text(
                    'ENT',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Adventures & Outings',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
            InkWell(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => DistrictHubScreen(initialCity: _selectedCity)),
                );
              },
              borderRadius: BorderRadius.circular(12),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All',
                      style: TextStyle(
                        color: Color(0xFF1864E8),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(width: 3),
                    Icon(Icons.arrow_forward_ios_rounded, size: 11, color: Color(0xFF1864E8)),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 3),
        const Text(
          'Book paragliding in Dehradun, desert safari in Jaisalmer & top outdoor fun',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 12),
        ),

        const SizedBox(height: 12),

        // Destination Filter Chips
        SizedBox(
          height: 32,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _quickCities.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, idx) {
              final city = _quickCities[idx];
              final isSelected = city == _selectedCity;

              return InkWell(
                onTap: () => setState(() => _selectedCity = city),
                borderRadius: BorderRadius.circular(10),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF0F172A) : Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? const Color(0xFF0F172A) : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (city != 'All') ...[
                        Icon(
                          Icons.location_on_rounded,
                          size: 13,
                          color: isSelected ? const Color(0xFFF43F5E) : const Color(0xFF94A3B8),
                        ),
                        const SizedBox(width: 4),
                      ],
                      Text(
                        city,
                        style: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF334155),
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 14),

        // Horizontal Cards Carousel
        SizedBox(
          height: 228,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: experiences.length,
            separatorBuilder: (_, _) => const SizedBox(width: 14),
            itemBuilder: (context, idx) {
              final exp = experiences[idx];
              return _buildExperienceHomeCard(context, exp);
            },
          ),
        ),

        const SizedBox(height: 22),
      ],
    );
  }

  Widget _buildExperienceHomeCard(BuildContext context, ExperienceItem exp) {
    return Container(
      width: 250,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ExperienceDetailsScreen(experience: exp)),
            );
          },
          borderRadius: BorderRadius.circular(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo Header with Badges
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                    child: SizedBox(
                      height: 115,
                      width: double.infinity,
                      child: CachedNetworkImage(
                        imageUrl: exp.imageUrl,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) => Container(
                          color: const Color(0xFF1E293B),
                          child: const Icon(Icons.paragliding_rounded, color: Colors.white70, size: 36),
                        ),
                      ),
                    ),
                  ),
                  // City Chip
                  Positioned(
                    top: 8,
                    left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.location_on_rounded, color: Colors.white, size: 10),
                          const SizedBox(width: 3),
                          Text(
                            exp.city,
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Rating Badge
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        boxShadow: const [
                          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1)),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 13),
                          const SizedBox(width: 2),
                          Text(
                            '${exp.rating}',
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              // Content Details
              Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      exp.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      exp.tagline,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                    ),
                    const SizedBox(height: 8),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('From', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 9.5)),
                            Text(
                              '₹${exp.startingPrice.toStringAsFixed(0)}',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 14.5,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1864E8),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Book',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              SizedBox(width: 2),
                              Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 12),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
