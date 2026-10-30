import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/widgets/offers_section.dart';
import '../../../core/widgets/promo_slider.dart';
import '../../home/data/service_api_service.dart';
import '../../home/models/slide_model.dart';
import '../../offers/models/offer_model.dart';
import '../data/ent_api_service.dart';
import '../models/experience_model.dart';
import 'ent_my_bookings_screen.dart';
import 'experience_details_screen.dart';

class DistrictHubScreen extends StatefulWidget {
  final String? initialCity;
  final VoidCallback? onOpenDrawer;
  final bool isRootTab;

  const DistrictHubScreen({
    super.key,
    this.initialCity,
    this.onOpenDrawer,
    this.isRootTab = false,
  });

  @override
  State<DistrictHubScreen> createState() => _DistrictHubScreenState();
}

class _DistrictHubScreenState extends State<DistrictHubScreen> {
  late String _selectedCity;
  String _selectedCategory = 'All';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  List<ExperienceItem> _backendExperiences = [];
  List<SlideItem> _slides = [];
  List<OfferItem> _offers = [];
  bool _isLoading = false;

  List<String> _cities = ['All', 'Dehradun', 'Jaisalmer', 'Rishikesh'];
  List<String> _categories = ['All', 'Air Sports', 'Desert Safari', 'Water Sports', 'Adventure'];

  @override
  void initState() {
    super.initState();
    _selectedCity = widget.initialCity ?? 'All';
    _refreshAllData();
  }

  Future<void> _refreshAllData() async {
    setState(() => _isLoading = true);
    await Future.wait([
      _fetchExperiences(),
      _fetchMetadata(),
      _fetchPromos(),
    ]);
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _fetchPromos() async {
    try {
      final api = ServiceApiService(ApiClient());
      final results = await Future.wait([
        api.fetchSlides(section: 'adventure'),
        api.fetchOffers(section: 'adventure'),
      ]);
      if (mounted) {
        setState(() {
          _slides = results[0] as List<SlideItem>;
          _offers = results[1] as List<OfferItem>;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchExperiences() async {
    try {
      final list = await EntApiService().fetchExperiences(
        city: _selectedCity,
        category: _selectedCategory,
      );
      if (mounted && list.isNotEmpty) {
        setState(() {
          _backendExperiences = list;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchMetadata() async {
    try {
      final cities = await EntApiService().fetchCities();
      final categories = await EntApiService().fetchCategories();

      if (mounted) {
        setState(() {
          if (cities.isNotEmpty) _cities = cities;
          if (categories.isNotEmpty) _categories = categories;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ExperienceItem> get _filteredExperiences {
    final all = _backendExperiences.isNotEmpty
        ? _backendExperiences
        : ExperienceItem.mockExperiences;
    return all.where((e) {
      final matchesCity = _selectedCity == 'All' || e.city.toLowerCase() == _selectedCity.toLowerCase();
      final matchesCategory = _selectedCategory == 'All' || e.category.toLowerCase() == _selectedCategory.toLowerCase();
      final matchesQuery = _searchQuery.isEmpty ||
          e.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          e.city.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          e.tagline.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCity && matchesCategory && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final list = _filteredExperiences;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: widget.isRootTab
            ? IconButton(
                icon: const Icon(Icons.menu_rounded, size: 24),
                color: const Color(0xFF0F172A),
                onPressed: widget.onOpenDrawer,
              )
            : (Navigator.of(context).canPop()
                ? IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                    color: const Color(0xFF0F172A),
                    onPressed: () => Navigator.of(context).pop(),
                  )
                : null),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFE11D48), Color(0xFFF97316)]),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'ADVENTURE',
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
              'Adventures & Enjoyment',
              style: TextStyle(color: Color(0xFF0F172A), fontSize: 16, fontWeight: FontWeight.w800),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.confirmation_number_outlined, color: Color(0xFF1864E8)),
            tooltip: 'My Adventure Bookings',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const EntMyBookingsScreen()),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAllData,
        color: const Color(0xFF1864E8),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.only(bottom: 10),
                child: LinearProgressIndicator(
                  color: Color(0xFF1864E8),
                  backgroundColor: Color(0xFFDBEAFE),
                  minHeight: 2.5,
                ),
              ),
            // Search Input
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (v) => setState(() => _searchQuery = v.trim()),
                decoration: InputDecoration(
                  hintText: 'Search paragliding, desert safari, rafting...',
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
                  prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF1864E8), size: 22),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // City Filter Pills (Dehradun, Jaisalmer, Rishikesh, All)
            Row(
              children: [
                const Icon(Icons.location_city_rounded, size: 16, color: Color(0xFF64748B)),
                const SizedBox(width: 6),
                const Text('Destinations:', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: Color(0xFF475569))),
                const SizedBox(width: 8),
                Expanded(
                  child: SizedBox(
                    height: 32,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _cities.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 6),
                      itemBuilder: (context, idx) {
                        final city = _cities[idx];
                        final isSel = city == _selectedCity;
                        return InkWell(
                          onTap: () => setState(() => _selectedCity = city),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: isSel ? const Color(0xFF1864E8) : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: isSel ? const Color(0xFF1864E8) : const Color(0xFFE2E8F0)),
                            ),
                            child: Text(
                              city,
                              style: TextStyle(
                                color: isSel ? Colors.white : const Color(0xFF334155),
                                fontSize: 11.5,
                                fontWeight: isSel ? FontWeight.w700 : FontWeight.w600,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Category Filter Pills
            SizedBox(
              height: 32,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _categories.length,
                separatorBuilder: (_, _) => const SizedBox(width: 6),
                itemBuilder: (context, idx) {
                  final cat = _categories[idx];
                  final isSel = cat == _selectedCategory;
                  return InkWell(
                    onTap: () => setState(() => _selectedCategory = cat),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color: isSel ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        cat,
                        style: TextStyle(
                          color: isSel ? Colors.white : const Color(0xFF64748B),
                          fontSize: 11.5,
                          fontWeight: isSel ? FontWeight.w700 : FontWeight.w600,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Promotional Banner Slider (when not searching)
            if (_searchQuery.isEmpty && _slides.isNotEmpty) ...[
              const SizedBox(height: 18),
              PromoSlider(slides: _slides),
            ],

            // Offers & Deals Section (when not searching)
            if (_searchQuery.isEmpty && _offers.isNotEmpty) ...[
              const SizedBox(height: 10),
              OffersSection(
                title: 'Adventure Deals & Offers',
                offers: _offers,
                section: 'adventure',
              ),
            ],

            const SizedBox(height: 18),

            // Results count
            Text(
              'Showing ${list.length} Experiences',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 12.5, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),

            // Activities Cards
            if (list.isEmpty)
              Container(
                padding: const EdgeInsets.all(32),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.paragliding_rounded, size: 48, color: Color(0xFF94A3B8)),
                    SizedBox(height: 12),
                    Text(
                      'No adventures found for this filter',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF334155)),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Try switching destination to Dehradun or Jaisalmer.',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                    ),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: list.length,
                separatorBuilder: (_, _) => const SizedBox(height: 16),
                itemBuilder: (context, idx) {
                  final exp = list[idx];
                  return _buildExperienceCard(context, exp);
                },
              ),
          ],
        ),
      ),
    ),
  );
}

  Widget _buildExperienceCard(BuildContext context, ExperienceItem exp) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => ExperienceDetailsScreen(experience: exp),
              ),
            );
          },
          borderRadius: BorderRadius.circular(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo with overlays
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                    child: SizedBox(
                      height: 165,
                      width: double.infinity,
                      child: CachedNetworkImage(
                        imageUrl: exp.imageUrl,
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) => Container(
                          color: const Color(0xFF0F172A),
                          child: const Icon(Icons.landscape_rounded, color: Colors.white54, size: 40),
                        ),
                      ),
                    ),
                  ),
                  // City Chip
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.location_on_rounded, color: Colors.white, size: 12),
                          const SizedBox(width: 3),
                          Text(
                            exp.city,
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Badge Chip
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1864E8),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        exp.badge,
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                  // Duration chip at bottom right
                  Positioned(
                    bottom: 10,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        exp.duration,
                        style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),

              // Content Details
              Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            exp.title,
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 16),
                            const SizedBox(width: 2),
                            Text(
                              '${exp.rating}',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      exp.tagline,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, height: 1.3),
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Starts from', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10.5)),
                            Row(
                              children: [
                                Text(
                                  '₹${exp.startingPrice.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                    color: Color(0xFF0F172A),
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                if (exp.originalPrice != null) ...[
                                  const SizedBox(width: 5),
                                  Text(
                                    '₹${exp.originalPrice!.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      color: Color(0xFF94A3B8),
                                      fontSize: 11.5,
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ExperienceDetailsScreen(experience: exp),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1864E8),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            elevation: 0,
                          ),
                          child: const Text('Book Now', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
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
