import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';
import '../../../main.dart';
import '../../inspections/models/request_model.dart';
import '../../notifications/screens/notifications_screen.dart';
import '../../offers/models/offer_model.dart';
import '../../quotations/models/quotation_model.dart';
import '../../quotations/screens/quotation_details_screen.dart';
import '../../quotations/screens/quotation_screen.dart';
import '../../services/data/cart_service.dart';
import '../../services/models/service_model.dart';
import '../../services/widgets/cart_sheet.dart';
import '../../services/widgets/service_subservices_sheet.dart';
import '../data/service_api_service.dart';
import '../models/city_model.dart';
import '../models/slide_model.dart';
import '../../../core/widgets/city_selection_sheet.dart';
import '../../../core/widgets/offers_section.dart';
import '../../../core/widgets/promo_slider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.onOpenDrawer, this.onSwitchTab});

  final VoidCallback? onOpenDrawer;
  final ValueChanged<int>? onSwitchTab;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _searchQuery = '';
  late final TextEditingController _searchController;
  late Future<List<ServiceItem>> _servicesFuture;
  late Future<List<SlideItem>> _slidesFuture;
  late Future<List<OfferItem>> _offersFuture;
  final ServiceApiService _apiService = ServiceApiService(ApiClient());
  bool _isServicesExpanded = true;
  String? _dismissedQuotationId;
  List<ServiceItem> _loadedServices = [];

  Future<List<ServiceItem>> _fetchServicesWithPrecache() {
    final currentCity = UserSession().selectedCity;
    return _apiService.fetchServices(city: currentCity).then((services) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        for (final s in services) {
          if (s.imageUrl.isNotEmpty && s.imageUrl.startsWith('http')) {
            precacheImage(CachedNetworkImageProvider(s.imageUrl), context);
          }
          for (final sub in s.subServices) {
            if (sub.image != null && sub.image!.isNotEmpty && sub.image!.startsWith('http')) {
              precacheImage(CachedNetworkImageProvider(sub.image!), context);
            }
          }
        }
      });
      return services;
    });
  }

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();
    _servicesFuture = _fetchServicesWithPrecache();
    _slidesFuture = _apiService.fetchSlides(section: 'services');
    _offersFuture = _apiService.fetchOffers(section: 'services');
    UserSession().selectedCityNotifier.addListener(_onCityChanged);
    appState.fetchRequests();
    appState.fetchQuotations();
    appState.fetchNotifications();
    appState.fetchDirectBookings();
  }

  void _onCityChanged() {
    if (mounted) {
      _reloadServices();
    }
  }

  @override
  void dispose() {
    UserSession().selectedCityNotifier.removeListener(_onCityChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _reloadServices() {
    setState(() {
      _servicesFuture = _fetchServicesWithPrecache();
      _slidesFuture = _apiService.fetchSlides(section: 'services');
      _offersFuture = _apiService.fetchOffers(section: 'services');
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = UserSession();
    final photo = user.photoUrl;
    final String displayName = (user.name != null && user.name!.isNotEmpty)
        ? user.name!
        : 'User';
    final firstName = displayName.trim().split(' ').first;
    final initials = displayName
        .trim()
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .take(2)
        .join()
        .toUpperCase();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Container(
        decoration: const BoxDecoration(
          color: Color(0xFFF8FAFC),
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFFE8F1FD), // Soft airy ambient blue at the top
              Color(0xFFF1F6FD), // Gentle transitional tint
              Color(0xFFF8FAFC), // Crisp ultra-light slate base
              Color(0xFFF1F6FD), // Gentle transitional tint rising from bottom
              Color(0xFFE8F1FD), // Soft luminous ambient blue glow at bottom
            ],
            stops: [0.0, 0.18, 0.50, 0.82, 1.0],
          ),
        ),
        child: Stack(
          children: [
            // Top ambient glowing luminous orbs
            Positioned(
              top: -60,
              left: -40,
              child: Container(
                width: 240,
                height: 240,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF1864E8).withValues(alpha: 0.12),
                      const Color(0xFF1864E8).withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              top: 40,
              right: -50,
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF38BDF8).withValues(alpha: 0.14),
                      const Color(0xFF38BDF8).withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
            // Bottom ambient glowing luminous orbs
            Positioned(
              bottom: -60,
              right: -40,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF1864E8).withValues(alpha: 0.13),
                      const Color(0xFF1864E8).withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              bottom: 30,
              left: -50,
              child: Container(
                width: 210,
                height: 210,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF38BDF8).withValues(alpha: 0.12),
                      const Color(0xFF38BDF8).withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ),
            // Main Content
            SafeArea(
              child: RefreshIndicator(
                onRefresh: () async {
                  _reloadServices();
                  await Future.wait([
                    _servicesFuture,
                    _slidesFuture,
                    _offersFuture,
                    appState.fetchRequests(),
                    appState.fetchQuotations(),
                    appState.fetchNotifications(),
                  ]);
                },
                color: const Color(0xFF1864E8),
                backgroundColor: Colors.white,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Header Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: widget.onOpenDrawer,
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 20,
                                    backgroundColor: const Color(0xFF1864E8),
                                    foregroundImage:
                                        (photo != null && photo.isNotEmpty)
                                            ? NetworkImage(photo)
                                            : null,
                                    onForegroundImageError:
                                        (photo != null && photo.isNotEmpty)
                                            ? (exception, stackTrace) {}
                                            : null,
                                    child: Text(
                                      initials.isEmpty ? 'U' : initials,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Hello, $firstName 👋',
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: Color(0xFF0F172A),
                                            fontSize: 17,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: -0.3,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        const Text(
                                          "Let's make your project better",
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            color: Color(0xFF64748B),
                                            fontSize: 12.5,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          // Cart Icon with Badge
                          ListenableBuilder(
                            listenable: CartService.instance,
                            builder: (context, _) {
                              final cartCount = CartService.instance.count;
                              return Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: const Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    child: IconButton(
                                      padding: EdgeInsets.zero,
                                      icon: const Icon(
                                        Icons.shopping_bag_outlined,
                                        color: Color(0xFF0F172A),
                                        size: 21,
                                      ),
                                      tooltip: 'View Cart',
                                      onPressed: () => CartSheet.show(context),
                                    ),
                                  ),
                                  if (cartCount > 0)
                                    Positioned(
                                      right: 2,
                                      top: 2,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 5,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF1864E8),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 1.5,
                                          ),
                                        ),
                                        constraints: const BoxConstraints(
                                          minWidth: 18,
                                          minHeight: 18,
                                        ),
                                        child: Text(
                                          '$cartCount',
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w700,
                                            height: 1,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              );
                            },
                          ),
                          const SizedBox(width: 8),

                          // Notification Bell with Badge
                          ListenableBuilder(
                            listenable: appState,
                            builder: (context, _) {
                              final unreadCount =
                                  appState.unreadNotificationsCount;
                              return Stack(
                                clipBehavior: Clip.none,
                                children: [
                                  Container(
                                    width: 42,
                                    height: 42,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: const Color(0xFFE2E8F0),
                                      ),
                                    ),
                                    child: IconButton(
                                      padding: EdgeInsets.zero,
                                      icon: const Icon(
                                        Icons.notifications_none_rounded,
                                        color: Color(0xFF0F172A),
                                        size: 22,
                                      ),
                                      onPressed: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const NotificationsScreen(),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  if (unreadCount > 0)
                                    Positioned(
                                      right: 2,
                                      top: 2,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 5,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFEF4444),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                          border: Border.all(
                                            color: Colors.white,
                                            width: 1.5,
                                          ),
                                        ),
                                        constraints: const BoxConstraints(
                                          minWidth: 18,
                                          minHeight: 18,
                                        ),
                                        child: Text(
                                          unreadCount > 9
                                              ? '9+'
                                              : '$unreadCount',
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w700,
                                            height: 1,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              );
                            },
                          ),
                        ],
                      ),

                      const SizedBox(height: 14),

                      // Zomato/Swiggy-styled City Location Bar
                      InkWell(
                        onTap: () => CitySelectionSheet.show(context),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.location_on_rounded, color: Color(0xFF1864E8), size: 16),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: ValueListenableBuilder<String>(
                                  valueListenable: UserSession().selectedCityNotifier,
                                  builder: (context, city, _) => RichText(
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    text: TextSpan(
                                      style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13),
                                      children: [
                                        const TextSpan(text: 'Services in '),
                                        TextSpan(
                                          text: city,
                                          style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF1864E8)),
                                        ),
                                        const TextSpan(
                                          text: ' • Tap to change location',
                                          style: TextStyle(color: Color(0xFF64748B), fontSize: 11.5),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Change',
                                      style: TextStyle(
                                        color: Color(0xFF1864E8),
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    SizedBox(width: 2),
                                    Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF1864E8), size: 15),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 14),

                      // Enhanced Dynamic Search Bar
                      _buildEnhancedSearchBar(),

                      const SizedBox(height: 16),

                      // Quotation Received Alert Card on Home Page
                      ListenableBuilder(
                        listenable: appState,
                        builder: (context, _) {
                          final latestQuote = appState.latestPendingQuotation;
                          if (latestQuote == null ||
                              latestQuote.id == _dismissedQuotationId) {
                            return const SizedBox.shrink();
                          }
                          final hasMatchingRequest = appState.requests.any(
                            (r) =>
                                r.id == latestQuote.requestId ||
                                r.requestNumber == latestQuote.requestId ||
                                r.requestNumber == latestQuote.quoteNumber,
                          );
                          if (!hasMatchingRequest) {
                            return const SizedBox.shrink();
                          }
                          return _buildQuotationReceivedAlertCard(latestQuote);
                        },
                      ),

                      // 1. Dynamic Slide Carousel (Configured via Admin Panel - hidden when search is active)
                      // 1. Dynamic Slide Carousel (completely hidden if no slides exist)
                      if (_searchQuery.isEmpty)
                        FutureBuilder<List<SlideItem>>(
                          future: _slidesFuture,
                          builder: (context, slideSnap) {
                            final slides = slideSnap.data ?? [];
                            if (slides.isEmpty) {
                              return const SizedBox.shrink();
                            }
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 18),
                              child: PromoSlider(
                                slides: slides,
                                onSwitchTab: widget.onSwitchTab,
                              ),
                            );
                          },
                        ),

                      // 2. Popular Services & Dynamic Directory
                      FutureBuilder<List<ServiceItem>>(
                        future: _servicesFuture,
                        builder: (context, snapshot) {
                          if (snapshot.connectionState ==
                              ConnectionState.waiting) {
                            return _buildServicesShimmer();
                          }

                          if (snapshot.hasError) {
                            return Container(
                              padding: const EdgeInsets.all(16),
                              margin: const EdgeInsets.only(bottom: 20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: const Color(0xFFE2E8F0),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.info_outline,
                                    color: Colors.orange,
                                  ),
                                  const SizedBox(width: 10),
                                  const Expanded(
                                    child: Text(
                                      'Could not load services from backend',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Color(0xFF334155),
                                      ),
                                    ),
                                  ),
                                  TextButton(
                                    onPressed: _reloadServices,
                                    child: const Text('Retry'),
                                  ),
                                ],
                              ),
                            );
                          }

                          final rawAll = snapshot.data ?? [];
                          _loadedServices = rawAll;
                          final allServices = rawAll.where((s) {
                            final lower = s.name.toLowerCase();
                            return !lower.contains('adventure') &&
                                !lower.contains('entertainment') &&
                                !lower.contains('district');
                          }).toList();
                          final filtered = _searchQuery.isEmpty
                              ? allServices
                              : allServices
                                    .where(
                                      (s) =>
                                          s.name.toLowerCase().contains(
                                            _searchQuery.toLowerCase(),
                                          ) ||
                                          s.shortDescription
                                              .toLowerCase()
                                              .contains(
                                                _searchQuery.toLowerCase(),
                                              ),
                                    )
                                    .toList();

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Popular Services 2x2 Grid (Matches provided UI)
                              if (_searchQuery.isEmpty)
                                _buildPopularServicesSection(allServices),

                              // If searching, show search results
                              if (_searchQuery.isNotEmpty) ...[
                                if (filtered.isEmpty)
                                  _buildSearchEmptyState()
                                else
                                  _buildSearchResultsGrid(filtered),
                              ] else ...[
                                // Expandable All-Services Directory
                                _buildCategoryDirectory(filtered),
                              ],

                              const SizedBox(height: 22),
                            ],
                          );
                        },
                      ),

                      // 3. Offers & Deals Section (Matching MakeMyTrip style)
                      if (_searchQuery.isEmpty) _buildHomeOffersSection(),

                      // Recent Activity Section (Dynamic from appState - collapses to 0 height if empty)
                      if (_searchQuery.isEmpty) _buildRecentActivitySection(),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // 2. Popular Services Section (2-Column Grid matching provided UI)
  Widget _buildPopularServicesSection(List<ServiceItem> allServices) {
    final List<Map<String, dynamic>> popularItems = [
      {
        'title': 'Water Leakage',
        'fullName': 'Water Leakage Repair',
        'icon': Icons.water_drop_rounded,
        'keyword': 'water',
        'bgColor': const Color(0xFFE0F2FE),
        'iconColor': const Color(0xFF0284C7),
      },
      {
        'title': 'Crack Stitching',
        'fullName': 'Crack Stitching',
        'icon': Icons.healing_rounded,
        'keyword': 'crack',
        'bgColor': const Color(0xFFFEF3C7),
        'iconColor': const Color(0xFFD97706),
      },
      {
        'title': 'Tile & Flooring',
        'fullName': 'Tile & Flooring',
        'icon': Icons.grid_view_rounded,
        'keyword': 'tile',
        'bgColor': const Color(0xFFF3E8FF),
        'iconColor': const Color(0xFF7C3AED),
      },
      {
        'title': 'Damp Wall',
        'fullName': 'Damp Wall Treatment',
        'icon': Icons.format_paint_rounded,
        'keyword': 'damp',
        'bgColor': const Color(0xFFEEF2FF),
        'iconColor': const Color(0xFF4F46E5),
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Popular Services',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 18,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            GestureDetector(
              onTap: () => widget.onSwitchTab?.call(1),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View All',
                    style: TextStyle(
                      color: Color(0xFF475569),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward_rounded,
                    color: Color(0xFF475569),
                    size: 14,
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: popularItems.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.46,
          ),
          itemBuilder: (context, index) {
            final item = popularItems[index];
            final String title = item['title'] as String;
            final String fullName = item['fullName'] as String;
            final IconData icon = item['icon'] as IconData;
            final String keyword = item['keyword'] as String;
            final Color bgColor = item['bgColor'] as Color;
            final Color iconColor = item['iconColor'] as Color;

            final matchingService = allServices.firstWhere(
              (s) =>
                  s.name.toLowerCase().contains(keyword) ||
                  s.shortDescription.toLowerCase().contains(keyword),
              orElse: () => ServiceItem(
                id: 'pop_$index',
                name: fullName,
                shortDescription: 'Professional $fullName service',
                startingPrice: 0.0,
                imageUrl: '',
              ),
            );

            return _buildPopularServiceCard(
              title: title,
              icon: icon,
              imageUrl: matchingService.imageUrl,
              bgColor: bgColor,
              iconColor: iconColor,
              onTap: () {
                ServiceSubservicesSheet.show(context, service: matchingService);
              },
            );
          },
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildPopularServiceCard({
    required String title,
    required IconData icon,
    String? imageUrl,
    required Color bgColor,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
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
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Container(
                  width: 74,
                  height: 74,
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  padding: (imageUrl != null && imageUrl.isNotEmpty && !imageUrl.contains('cdn-icons-png'))
                      ? EdgeInsets.zero
                      : const EdgeInsets.all(8),
                  child: (imageUrl != null && imageUrl.isNotEmpty)
                      ? CachedNetworkImage(
                          imageUrl: imageUrl,
                          fit: imageUrl.contains('cdn-icons-png')
                              ? BoxFit.contain
                              : BoxFit.cover,
                          filterQuality: FilterQuality.high,
                          fadeInDuration: const Duration(milliseconds: 100),
                          fadeOutDuration: const Duration(milliseconds: 100),
                          placeholder: (_, _) => Shimmer.fromColors(
                            baseColor: const Color(0xFFE2E8F0),
                            highlightColor: const Color(0xFFF8FAFC),
                            child: Container(
                              color: Colors.white,
                            ),
                          ),
                          errorWidget: (_, _, _) => Icon(
                            icon,
                            color: iconColor,
                            size: 36,
                          ),
                        )
                      : Icon(icon, color: iconColor, size: 38),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    height: 1.25,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showImagePreviewDialog(
    BuildContext context,
    String imageUrl,
    String title,
  ) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.85),
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Colors.white),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                color: Colors.white,
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(ctx).size.height * 0.65,
                ),
                child: InteractiveViewer(
                  maxScale: 4.0,
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.high,
                    fadeInDuration: const Duration(milliseconds: 100),
                    placeholder: (_, _) => SizedBox(
                      height: 220,
                      child: Shimmer.fromColors(
                        baseColor: const Color(0xFFE2E8F0),
                        highlightColor: const Color(0xFFF8FAFC),
                        child: Container(
                          width: double.infinity,
                          height: 220,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    errorWidget: (_, _, _) => const SizedBox(
                      height: 220,
                      child: Center(
                        child: Icon(
                          Icons.broken_image_rounded,
                          size: 48,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Quotation Received Alert Card on Home Page
  Widget _buildQuotationReceivedAlertCard(QuotationModel quote) {
    String? matchedImageUrl;
    ServiceRequestModel? matchedReq;

    // 1. Check matching inspection request photos
    try {
      matchedReq = appState.requests.firstWhere(
        (r) =>
            r.id == quote.requestId ||
            r.requestNumber == quote.requestNumber ||
            r.requestNumber == quote.requestId,
      );
      if (matchedReq.photos.isNotEmpty) {
        matchedImageUrl = matchedReq.photos.first;
      }
    } catch (_) {}

    // 2. Check notification imageUrl
    if (matchedImageUrl == null || matchedImageUrl.isEmpty) {
      try {
        final notif = appState.notifications.firstWhere(
          (n) =>
              n.referenceId == quote.id || n.quoteNumber == quote.quoteNumber,
        );
        if (notif.imageUrl != null && notif.imageUrl!.isNotEmpty) {
          matchedImageUrl = notif.imageUrl;
        }
      } catch (_) {}
    }

    // 3. Fallback to matching Service image from catalog
    if (matchedImageUrl == null || matchedImageUrl.isEmpty) {
      try {
        final serviceMatch = _loadedServices.firstWhere(
          (s) =>
              (matchedReq != null &&
                  (s.id == matchedReq.serviceId ||
                      s.name.toLowerCase() ==
                          matchedReq.subServiceName.toLowerCase() ||
                      s.name.toLowerCase() ==
                          matchedReq.categoryName.toLowerCase())) ||
              s.name.toLowerCase() == quote.title.toLowerCase() ||
              quote.title.toLowerCase().contains(s.name.toLowerCase()) ||
              s.name.toLowerCase().contains(quote.title.toLowerCase()),
        );
        if (serviceMatch.imageUrl.isNotEmpty) {
          matchedImageUrl = serviceMatch.imageUrl;
        }
      } catch (_) {}
    }

    final projectName = quote.title.isNotEmpty
        ? quote.title
        : (matchedReq != null && matchedReq.subServiceName.isNotEmpty
            ? matchedReq.subServiceName
            : 'Waterproofing & Inspection Scope');
    final locationName = quote.location.isNotEmpty
        ? quote.location
        : (matchedReq != null && matchedReq.address.isNotEmpty
            ? matchedReq.address
            : 'Project Site');
    final formattedAmount = quote.grandTotal.toStringAsFixed(0);

    final bool hasValidImage = matchedImageUrl != null &&
        matchedImageUrl.isNotEmpty &&
        (matchedImageUrl.startsWith('http://') ||
            matchedImageUrl.startsWith('https://'));

    // Check if the image is a service illustration/PNG vs a camera photo
    final bool isServiceIllustration = hasValidImage &&
        (matchedImageUrl.contains('icon') ||
            matchedImageUrl.contains('service') ||
            matchedImageUrl.endsWith('.png') ||
            _loadedServices.any((s) => s.imageUrl == matchedImageUrl));

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF1864E8).withValues(alpha: 0.2),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1864E8).withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Alert Header Strip
          Container(
            padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(19),
              ),
              border: Border(
                bottom: BorderSide(
                  color: const Color(0xFF1864E8).withValues(alpha: 0.15),
                  width: 0.8,
                ),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1864E8),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bolt_rounded, color: Colors.white, size: 13),
                      SizedBox(width: 3),
                      Text(
                        'NEW QUOTATION',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'You have received a quotation',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Color(0xFF1E293B),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                InkWell(
                  onTap: () {
                    setState(() {
                      _dismissedQuotationId = quote.id;
                    });
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: const Padding(
                    padding: EdgeInsets.all(4),
                    child: Icon(
                      Icons.close_rounded,
                      size: 18,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Main Card Body
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Prominent Service / Site Image (Enlarged to 94x94 with tap-to-enlarge)
                GestureDetector(
                  onTap: hasValidImage
                      ? () => _showImagePreviewDialog(
                          context,
                          matchedImageUrl!,
                          projectName,
                        )
                      : null,
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          width: 94,
                          height: 94,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          padding: isServiceIllustration
                              ? const EdgeInsets.all(8)
                              : EdgeInsets.zero,
                          child: hasValidImage
                              ? CachedNetworkImage(
                                  imageUrl: matchedImageUrl,
                                  width: 94,
                                  height: 94,
                                  fit: isServiceIllustration
                                      ? BoxFit.contain
                                      : BoxFit.cover,
                                  filterQuality: FilterQuality.high,
                                  fadeInDuration: const Duration(milliseconds: 100),
                                  fadeOutDuration: const Duration(milliseconds: 100),
                                  placeholder: (context, url) => Shimmer.fromColors(
                                    baseColor: const Color(0xFFE2E8F0),
                                    highlightColor: const Color(0xFFF8FAFC),
                                    child: Container(
                                      width: 94,
                                      height: 94,
                                      color: Colors.white,
                                    ),
                                  ),
                                  errorWidget: (context, url, error) =>
                                      Container(
                                    color: const Color(0xFFEEF2FF),
                                    child: const Icon(
                                      Icons.receipt_long_rounded,
                                      color: Color(0xFF1864E8),
                                      size: 36,
                                    ),
                                  ),
                                )
                              : Container(
                                  color: const Color(0xFFEEF2FF),
                                  child: const Center(
                                    child: Icon(
                                      Icons.receipt_long_rounded,
                                      color: Color(0xFF1864E8),
                                      size: 38,
                                    ),
                                  ),
                                ),
                        ),
                      ),
                      if (hasValidImage)
                        Positioned(
                          right: 4,
                          bottom: 4,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F172A)
                                  .withValues(alpha: 0.65),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(
                              Icons.zoom_in_rounded,
                              size: 13,
                              color: Colors.white,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),

                // Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        projectName,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 14.5,
                          fontWeight: FontWeight.w700,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Estimate #${quote.quoteNumber}',
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text(
                            '₹ $formattedAmount',
                            style: const TextStyle(
                              color: Color(0xFF1864E8),
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'GST Included',
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w600,
                              ),
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

          // Action Buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => QuotationDetailsScreen(
                            quotation: quote,
                            projectName: projectName,
                            location: locationName,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                    label: const Text(
                      'View Quotation & Scope',
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1864E8),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 11),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) =>
                            const QuotationScreen(initialSection: 2),
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF0F172A),
                    side: const BorderSide(
                      color: Color(0xFFCBD5E1),
                      width: 0.8,
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 11,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'All Quotes',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Clean, minimalist search bar
  Widget _buildEnhancedSearchBar() {
    return Container(
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
        onChanged: (val) => setState(() => _searchQuery = val.trim()),
        style: const TextStyle(
          color: Color(0xFF0F172A),
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          prefixIcon: const Icon(
            Icons.search_rounded,
            color: Color(0xFF1864E8),
            size: 22,
          ),
          suffixIcon: _searchQuery.isNotEmpty
              ? IconButton(
                  splashRadius: 18,
                  icon: const Icon(
                    Icons.close_rounded,
                    color: Color(0xFF94A3B8),
                    size: 18,
                  ),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _searchQuery = '');
                  },
                )
              : null,
          hintText: 'Search for services, repairs, waterproofing...',
          hintStyle: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 13.5,
            fontWeight: FontWeight.w400,
          ),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
      ),
    );
  }

  // Helpful Empty State when no results match query
  Widget _buildSearchEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.search_off_rounded,
              color: Color(0xFF94A3B8),
              size: 28,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'No services found for "$_searchQuery"',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Try searching with general keywords like "Waterproofing", "Leakage", or "Civil"',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              OutlinedButton(
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchQuery = '');
                },
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                ),
                child: const Text('View All Services'),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  _searchController.text = 'Waterproofing';
                  setState(() => _searchQuery = 'Waterproofing');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1864E8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text(
                  'Try Waterproofing',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 3. Informative, High-Clarity Search Results Card List
  Widget _buildSearchResultsGrid(List<ServiceItem> services) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with count & clear button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.manage_search_rounded,
                    color: Color(0xFF1864E8),
                    size: 20,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Search Results (${services.length})',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  _searchController.clear();
                  setState(() => _searchQuery = '');
                },
                child: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  child: Text(
                    'Clear Search',
                    style: TextStyle(
                      color: Color(0xFF1864E8),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Informative Vertical Service Cards
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: services.length,
            separatorBuilder: (context, index) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final service = services[index];
              return Material(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  onTap: () {
                    ServiceSubservicesSheet.show(context, service: service);
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        // Service Image Thumbnail
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            width: 80,
                            height: 80,
                            color: const Color(0xFFEFF6FF),
                            padding: (service.imageUrl.isNotEmpty && !service.imageUrl.contains('cdn-icons-png'))
                                ? EdgeInsets.zero
                                : const EdgeInsets.all(8),
                            child: service.imageUrl.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: service.imageUrl,
                                    fit: service.imageUrl.contains('cdn-icons-png')
                                        ? BoxFit.contain
                                        : BoxFit.cover,
                                    filterQuality: FilterQuality.high,
                                    fadeInDuration: const Duration(milliseconds: 100),
                                    fadeOutDuration: const Duration(milliseconds: 100),
                                    placeholder: (_, _) => Shimmer.fromColors(
                                      baseColor: const Color(0xFFE2E8F0),
                                      highlightColor: const Color(0xFFF8FAFC),
                                      child: Container(
                                        width: 80,
                                        height: 80,
                                        color: Colors.white,
                                      ),
                                    ),
                                    errorWidget: (context, url, error) =>
                                        const Icon(
                                          Icons.construction_rounded,
                                          color: Color(0xFF1864E8),
                                          size: 30,
                                        ),
                                  )
                                : const Icon(
                                    Icons.construction_rounded,
                                    color: Color(0xFF1864E8),
                                    size: 30,
                                  ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Service Details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                service.name,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (service.shortDescription.isNotEmpty) ...[
                                const SizedBox(height: 3),
                                Text(
                                  service.shortDescription,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Color(0xFF64748B),
                                    fontSize: 11.5,
                                    height: 1.25,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Book Action Button
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 7,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF7C3AED),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF7C3AED)
                                    .withValues(alpha: 0.25),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Book',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              SizedBox(width: 3),
                              Icon(
                                Icons.arrow_forward_rounded,
                                size: 13,
                                color: Colors.white,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // 4. All Categories Directory (MakeMyTrip style browser)
  Widget _buildCategoryDirectory(List<ServiceItem> services) {
    if (services.isEmpty) return const SizedBox.shrink();

    final topServices = services.take(3).toList();
    final gridServices = services.length > 3
        ? services.skip(3).toList()
        : services;
    final displayedGrid = _isServicesExpanded
        ? gridServices
        : gridServices.take(6).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Top 3 High-Priority Services
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: topServices.map((service) {
              return Expanded(child: _buildTopServiceCard(service));
            }).toList(),
          ),
        ),

        const SizedBox(height: 14),

        // Full Services Expandable Card
        AnimatedSize(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(14, 18, 14, 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: displayedGrid.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 8,
                    childAspectRatio: 0.67,
                  ),
                  itemBuilder: (context, index) {
                    final s = displayedGrid[index];
                    return _buildGridServiceItem(s);
                  },
                ),

                if (gridServices.length > 6) ...[
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _isServicesExpanded = !_isServicesExpanded;
                      });
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _isServicesExpanded
                                ? 'Show Less'
                                : 'View All (${gridServices.length} Services)',
                            style: const TextStyle(
                              color: Color(0xFF1864E8),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            _isServicesExpanded
                                ? Icons.keyboard_arrow_up_rounded
                                : Icons.keyboard_arrow_down_rounded,
                            color: const Color(0xFF1864E8),
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  // Skeleton Shimmer for Dynamic Services Loading State
  Widget _buildServicesShimmer() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 140,
              height: 18,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            Container(
              width: 60,
              height: 14,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Shimmer.fromColors(
          baseColor: const Color(0xFFE2E8F0),
          highlightColor: const Color(0xFFF8FAFC),
          child: GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 4,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.5,
            ),
            itemBuilder: (context, index) {
              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 22),
      ],
    );
  }

  // 1. Top Prominent Service Card (Clean, borderless with tactile ripple)
  Widget _buildTopServiceCard(ServiceItem service) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          ServiceSubservicesSheet.show(context, service: service);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  padding: (service.imageUrl.isNotEmpty && !service.imageUrl.contains('cdn-icons-png'))
                      ? EdgeInsets.zero
                      : const EdgeInsets.all(8),
                  child: service.imageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: service.imageUrl,
                          fit: service.imageUrl.contains('cdn-icons-png')
                              ? BoxFit.contain
                              : BoxFit.cover,
                          filterQuality: FilterQuality.high,
                          fadeInDuration: const Duration(milliseconds: 100),
                          fadeOutDuration: const Duration(milliseconds: 100),
                          placeholder: (_, _) => Shimmer.fromColors(
                            baseColor: const Color(0xFFE2E8F0),
                            highlightColor: const Color(0xFFF8FAFC),
                            child: Container(
                              width: 88,
                              height: 88,
                              color: Colors.white,
                            ),
                          ),
                          errorWidget: (_, _, _) => const Icon(
                            Icons.construction_rounded,
                            color: Color(0xFF1864E8),
                            size: 38,
                          ),
                        )
                      : const Icon(
                          Icons.construction_rounded,
                          color: Color(0xFF1864E8),
                          size: 38,
                        ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                service.name,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 2. MakeMyTrip Style 3-Column Grid Service Item (With touch ripple)
  Widget _buildGridServiceItem(ServiceItem service) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          ServiceSubservicesSheet.show(context, service: service);
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF1F5F9)),
                  ),
                  padding: (service.imageUrl.isNotEmpty && !service.imageUrl.contains('cdn-icons-png'))
                      ? EdgeInsets.zero
                      : const EdgeInsets.all(8),
                  child: service.imageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: service.imageUrl,
                          fit: service.imageUrl.contains('cdn-icons-png')
                              ? BoxFit.contain
                              : BoxFit.cover,
                          filterQuality: FilterQuality.high,
                          fadeInDuration: const Duration(milliseconds: 100),
                          fadeOutDuration: const Duration(milliseconds: 100),
                          placeholder: (_, _) => Shimmer.fromColors(
                            baseColor: const Color(0xFFE2E8F0),
                            highlightColor: const Color(0xFFF8FAFC),
                            child: Container(
                              width: 88,
                              height: 88,
                              color: Colors.white,
                            ),
                          ),
                          errorWidget: (_, _, _) => const Icon(
                            Icons.build_circle_outlined,
                            color: Color(0xFF1864E8),
                            size: 38,
                          ),
                        )
                      : const Icon(
                          Icons.build_circle_outlined,
                          color: Color(0xFF1864E8),
                          size: 38,
                        ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                service.name,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF334155),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatRelativeTime(DateTime dt) {
    final now = DateTime.now();
    final difference = now.difference(dt);
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1 && now.day == dt.day) {
      final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
      final period = dt.hour >= 12 ? 'PM' : 'AM';
      final minute = dt.minute.toString().padLeft(2, '0');
      return 'Today, $hour:$minute $period';
    } else if (difference.inDays <= 2 && now.day - dt.day == 1) {
      final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
      final period = dt.hour >= 12 ? 'PM' : 'AM';
      final minute = dt.minute.toString().padLeft(2, '0');
      return 'Yesterday, $hour:$minute $period';
    } else {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    }
  }

  Widget _buildRecentActivitySection() {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final List<_RecentActivityItem> activities = [];

        // Map live customer inspection requests
        for (final req in appState.requests) {
          final cat = req.categoryName.toLowerCase();
          IconData icon = Icons.assignment_outlined;
          Color iconBg = const Color(0xFFEBF2FE);
          Color iconColor = const Color(0xFF1864E8);

          if (cat.contains('water') || cat.contains('leak')) {
            icon = Icons.water_drop_rounded;
            iconBg = const Color(0xFFE0F2FE);
            iconColor = const Color(0xFF0284C7);
          } else if (cat.contains('plumb')) {
            icon = Icons.plumbing_rounded;
            iconBg = const Color(0xFFE6FAF5);
            iconColor = const Color(0xFF0D9488);
          } else if (cat.contains('civil') ||
              cat.contains('crack') ||
              cat.contains('struct')) {
            icon = Icons.foundation_rounded;
            iconBg = const Color(0xFFFEF3C7);
            iconColor = const Color(0xFFD97706);
          } else if (cat.contains('paint') || cat.contains('damp')) {
            icon = Icons.format_paint_rounded;
            iconBg = const Color(0xFFFCE7F3);
            iconColor = const Color(0xFFDB2777);
          }

          final title = req.categoryName.isNotEmpty
              ? req.categoryName
              : 'Inspection Request';
          final sub = req.requestNumber.isNotEmpty
              ? '${req.requestNumber} • ${req.subServiceName.isNotEmpty ? req.subServiceName : req.propertyType}'
              : (req.subServiceName.isNotEmpty
                    ? req.subServiceName
                    : req.issueDescription);

          activities.add(
            _RecentActivityItem(
              icon: icon,
              iconBg: iconBg,
              iconColor: iconColor,
              title: title,
              subtitle: sub,
              createdAt: req.createdAt,
              onTap: () {
                if (widget.onSwitchTab != null) {
                  widget.onSwitchTab!(2);
                } else {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const QuotationScreen(initialSection: 1),
                    ),
                  );
                }
              },
            ),
          );
        }

        // Map live customer quotations
        for (final quote in appState.quotations) {
          activities.add(
            _RecentActivityItem(
              icon: Icons.receipt_long_rounded,
              iconBg: const Color(0xFFEBF2FE),
              iconColor: const Color(0xFF1864E8),
              title: quote.title.isNotEmpty ? quote.title : 'New Quotation',
              subtitle:
                  '₹ ${quote.grandTotal.toStringAsFixed(0)} • ${quote.timeline.isNotEmpty ? quote.timeline : quote.quoteNumber}',
              createdAt: quote.createdAt,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => QuotationDetailsScreen(
                      quotation: quote,
                      projectName: quote.title.isNotEmpty
                          ? quote.title
                          : 'Project Inspection',
                      location: quote.location.isNotEmpty
                          ? quote.location
                          : 'Project Site',
                    ),
                  ),
                );
              },
            ),
          );
        }

        // Map live customer direct bookings
        for (final booking in appState.directBookings) {
          activities.add(
            _RecentActivityItem(
              icon: Icons.bolt_rounded,
              iconBg: const Color(0xFFEFF6FF),
              iconColor: const Color(0xFF1864E8),
              title: booking.subServiceName.isNotEmpty
                  ? booking.subServiceName
                  : 'On-Demand Visit',
              subtitle:
                  '#${booking.bookingNumber} • ${booking.scheduledSlot}',
              createdAt: booking.createdAt,
              onTap: () {
                if (widget.onSwitchTab != null) {
                  widget.onSwitchTab!(2);
                } else {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const QuotationScreen(initialSection: 0),
                    ),
                  );
                }
              },
            ),
          );
        }

        // Completely hide the section if no requests or quotations exist
        if (activities.isEmpty) {
          return const SizedBox.shrink();
        }

        // Sort descending by most recent
        activities.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        final recentDisplay = activities.take(3).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Flexible(
                  child: Text(
                    'Recent Activity',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                ),
                GestureDetector(
                  onTap: () {
                    if (widget.onSwitchTab != null) {
                      widget.onSwitchTab!(2);
                    } else {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const QuotationScreen(),
                        ),
                      );
                    }
                  },
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    child: Text(
                      'View All',
                      style: TextStyle(
                        color: Color(0xFF1864E8),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: recentDisplay.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = recentDisplay[index];
                return _buildActivityCard(
                  icon: item.icon,
                  iconBg: item.iconBg,
                  iconColor: item.iconColor,
                  title: item.title,
                  subtitle: item.subtitle,
                  timestamp: _formatRelativeTime(item.createdAt),
                  onTap: item.onTap,
                );
              },
            ),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }

  Widget _buildActivityCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String subtitle,
    required String timestamp,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      timestamp,
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
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
      ),
    );
  }

  // Offers Section (Matching MakeMyTrip style with View All, Tabs & Horizontal Cards)
  Widget _buildHomeOffersSection() {
    return FutureBuilder<List<OfferItem>>(
      future: _offersFuture,
      builder: (context, snapshot) {
        final allOffers = snapshot.data ?? [];
        if (allOffers.isEmpty) {
          return const SizedBox.shrink();
        }
        return OffersSection(
          offers: allOffers,
          section: 'services',
        );
      },
    );
  }
}

class _RecentActivityItem {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final DateTime createdAt;
  final VoidCallback onTap;

  _RecentActivityItem({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.createdAt,
    required this.onTap,
  });
}
