import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';
import '../../../core/widgets/app_ui.dart';
import '../../auth/screens/login_screen.dart';
import '../../navigation/main_nav_screen.dart';
import '../data/service_api_service.dart';
import '../models/city_model.dart';

/// Screen displayed when user opens the app for the first time or wishes to pick an operational hub.
/// Fetches all available operational cities dynamically from the backend API (not hardcoded).
class SelectLocationScreen extends StatefulWidget {
  final bool isChangeLocation;

  const SelectLocationScreen({
    super.key,
    this.isChangeLocation = false,
  });

  @override
  State<SelectLocationScreen> createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ServiceApiService _apiService = ServiceApiService(ApiClient());

  late Future<List<CityItem>> _citiesFuture;
  String _searchQuery = '';
  bool _isSelecting = false;

  @override
  void initState() {
    super.initState();
    _citiesFuture = _apiService.fetchSupportedCities();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onCityPicked(CityItem city) async {
    if (_isSelecting) return;
    setState(() => _isSelecting = true);

    await UserSession().setSelectedCity(city.name);

    if (!mounted) return;

    AppToast.show(
      context,
      message: '📍 Location set to ${city.name}',
    );

    if (widget.isChangeLocation) {
      Navigator.of(context).pop(city.name);
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainNavScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentSelected = UserSession().selectedCity.toLowerCase().trim();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        automaticallyImplyLeading: widget.isChangeLocation,
        leading: widget.isChangeLocation
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 18),
                onPressed: () => Navigator.of(context).pop(),
              )
            : null,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.location_on_rounded, size: 13, color: Color(0xFF1864E8)),
                  SizedBox(width: 4),
                  Text(
                    'OPERATIONAL HUBS',
                    style: TextStyle(
                      color: Color(0xFF1864E8),
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (!widget.isChangeLocation && !UserSession().isLoggedIn)
            TextButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              child: const Text(
                'Sign In',
                style: TextStyle(
                  color: Color(0xFF1864E8),
                  fontWeight: FontWeight.w700,
                  fontSize: 13.5,
                ),
              ),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Welcome / Context Header
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select Your City',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Choose your operational city to discover certified structural, waterproofing & civil engineering services available in your area.',
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF64748B),
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Search Box
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
                      decoration: InputDecoration(
                        hintText: 'Search city or state (e.g. Udaipur, Bhilwara)...',
                        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
                        prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF94A3B8)),
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
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Cities List
            Expanded(
              child: FutureBuilder<List<CityItem>>(
                future: _citiesFuture,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return _buildLoadingState();
                  }

                  if (snapshot.hasError) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.cloud_off_rounded, size: 48, color: Color(0xFF94A3B8)),
                            const SizedBox(height: 12),
                            const Text(
                              'Unable to load operational cities',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Please check your internet connection and try again.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: () {
                                setState(() {
                                  _citiesFuture = _apiService.fetchSupportedCities();
                                });
                              },
                              icon: const Icon(Icons.refresh_rounded, size: 18),
                              label: const Text('Retry'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1864E8),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  final cities = snapshot.data ?? [];
                  if (cities.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.location_city_rounded, size: 48, color: Color(0xFF94A3B8)),
                            const SizedBox(height: 12),
                            const Text(
                              'No operational cities available',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Hipro services will be expanding to your location soon.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: () {
                                setState(() {
                                  _citiesFuture = _apiService.fetchSupportedCities();
                                });
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1864E8),
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Refresh'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  final filtered = cities.where((c) {
                    if (_searchQuery.isEmpty) return true;
                    return c.name.toLowerCase().contains(_searchQuery) ||
                        c.tagline.toLowerCase().contains(_searchQuery) ||
                        c.state.toLowerCase().contains(_searchQuery);
                  }).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text(
                          'No cities found matching "$_searchQuery"',
                          style: const TextStyle(color: Color(0xFF64748B), fontSize: 13.5),
                        ),
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final city = filtered[index];
                      final isSelected = currentSelected == city.name.toLowerCase().trim();

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF1864E8) : const Color(0xFFE2E8F0),
                            width: isSelected ? 2 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: InkWell(
                          onTap: _isSelecting ? null : () => _onCityPicked(city),
                          borderRadius: BorderRadius.circular(16),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // City Photo / Illustration
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: city.imageUrl.isNotEmpty
                                      ? CachedNetworkImage(
                                          imageUrl: city.imageUrl,
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                          fadeInDuration: const Duration(milliseconds: 150),
                                          placeholder: (_, _) => Shimmer.fromColors(
                                            baseColor: const Color(0xFFE2E8F0),
                                            highlightColor: const Color(0xFFF8FAFC),
                                            child: Container(
                                              width: 80,
                                              height: 80,
                                              color: Colors.white,
                                            ),
                                          ),
                                          errorWidget: (_, _, _) => _buildFallbackCityIcon(),
                                        )
                                      : _buildFallbackCityIcon(),
                                ),
                                const SizedBox(width: 14),

                                // City Details
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              city.name,
                                              style: const TextStyle(
                                                fontSize: 17,
                                                fontWeight: FontWeight.w800,
                                                color: Color(0xFF0F172A),
                                              ),
                                            ),
                                          ),
                                          if (city.badge != null && city.badge!.isNotEmpty)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFFEF3C7),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: Text(
                                                city.badge!,
                                                style: const TextStyle(
                                                  color: Color(0xFF92400E),
                                                  fontSize: 9.5,
                                                  fontWeight: FontWeight.w800,
                                                  letterSpacing: 0.2,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        city.state,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF1864E8),
                                        ),
                                      ),
                                      if (city.tagline.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          city.tagline,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF64748B),
                                            height: 1.3,
                                          ),
                                        ),
                                      ],
                                      const SizedBox(height: 8),

                                      // Partner & Service Badges
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF1F5F9),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(Icons.verified_rounded, size: 12, color: Color(0xFF10B981)),
                                                const SizedBox(width: 4),
                                                Text(
                                                  '${city.partnerCount}+ Experts',
                                                  style: const TextStyle(
                                                    color: Color(0xFF334155),
                                                    fontSize: 11,
                                                    fontWeight: FontWeight.w700,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF1F5F9),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              '${city.serviceCount} Services',
                                              style: const TextStyle(
                                                color: Color(0xFF334155),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                const SizedBox(width: 8),

                                // Select Radio / Arrow Indicator
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: isSelected ? const Color(0xFF1864E8) : Colors.transparent,
                                    border: Border.all(
                                      color: isSelected ? const Color(0xFF1864E8) : const Color(0xFFCBD5E1),
                                      width: 1.8,
                                    ),
                                  ),
                                  child: isSelected
                                      ? const Icon(Icons.check_rounded, color: Colors.white, size: 17)
                                      : const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF94A3B8), size: 12),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackCityIcon() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Center(
        child: Icon(Icons.location_city_rounded, color: Color(0xFF1864E8), size: 36),
      ),
    );
  }

  Widget _buildLoadingState() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: 4,
      itemBuilder: (_, _) => Shimmer.fromColors(
        baseColor: const Color(0xFFE2E8F0),
        highlightColor: const Color(0xFFF8FAFC),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          height: 104,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

