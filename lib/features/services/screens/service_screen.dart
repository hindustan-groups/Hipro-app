import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';
import '../../../core/widgets/chat_sheet.dart';
import '../../../core/widgets/city_selection_sheet.dart';
import '../../home/data/service_api_service.dart';
import '../data/cart_service.dart';
import '../models/service_model.dart';
import '../widgets/cart_sheet.dart';
import '../widgets/service_subservices_sheet.dart';
import 'create_inspection_screen.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  String _selectedCategory = 'All';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  late Future<List<ServiceItem>> _servicesFuture;
  final ServiceApiService _apiService = ServiceApiService(ApiClient());

  @override
  void initState() {
    super.initState();
    _servicesFuture = _apiService.fetchServices(city: UserSession().selectedCity);
    UserSession().selectedCityNotifier.addListener(_onCityChanged);
  }

  void _onCityChanged() {
    if (mounted) _reloadServices();
  }

  @override
  void dispose() {
    UserSession().selectedCityNotifier.removeListener(_onCityChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _reloadServices() {
    setState(() {
      _servicesFuture = _apiService.fetchServices(city: UserSession().selectedCity);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: GestureDetector(
          onTap: () => CitySelectionSheet.show(context),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Services',
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.2,
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.location_on_rounded, size: 12, color: Color(0xFF1864E8)),
                  const SizedBox(width: 2),
                  ValueListenableBuilder<String>(
                    valueListenable: UserSession().selectedCityNotifier,
                    builder: (context, city, _) => Text(
                      city,
                      style: const TextStyle(
                        color: Color(0xFF1864E8),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: Color(0xFF1864E8)),
                ],
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.chat_outlined,
              color: Color(0xFF7C3AED),
              size: 21,
            ),
            tooltip: 'Chat with Expert',
            onPressed: () {
              ChatSheet.show(
                context,
                title: 'Waterproofing Consultation',
                subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
                contextType: 'SERVICE',
              );
            },
          ),
          ListenableBuilder(
            listenable: CartService.instance,
            builder: (context, _) {
              final count = CartService.instance.count;
              return Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: const Icon(
                      Icons.shopping_bag_outlined,
                      color: Color(0xFF0F172A),
                      size: 21,
                    ),
                    tooltip: 'View Cart',
                    onPressed: () => CartSheet.show(context),
                  ),
                  if (count > 0)
                    Positioned(
                      right: 6,
                      top: 6,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFE11D48),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          '$count',
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
          IconButton(
            icon: const Icon(
              Icons.refresh_rounded,
              color: Color(0xFF64748B),
              size: 21,
            ),
            tooltip: 'Refresh Services',
            onPressed: _reloadServices,
          ),
        ],
        centerTitle: false,
      ),
      floatingActionButton: Material(
        color: const Color(0xFF7C3AED),
        borderRadius: BorderRadius.circular(20),
        elevation: 3,
        shadowColor: const Color(0xFF7C3AED).withValues(alpha: 0.35),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () {
            ChatSheet.show(
              context,
              title: 'Waterproofing Consultation',
              subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
              contextType: 'SERVICE',
            );
          },
          child: const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 7.5),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.chat_bubble_rounded, size: 14, color: Colors.white),
                SizedBox(width: 5),
                Text(
                  'Chat with Expert',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: FutureBuilder<List<ServiceItem>>(
        future: _servicesFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(color: Color.fromARGB(255, 103, 110, 122)),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 64,
                      height: 64,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFEF2F2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.cloud_off_rounded,
                        color: Color(0xFFEF4444),
                        size: 32,
                      ),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'Failed to load services',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${snapshot.error}'.replaceAll('Exception: ', ''),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton.icon(
                      onPressed: _reloadServices,
                      icon: const Icon(Icons.refresh_rounded, size: 18),
                      label: const Text('Try Again'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color.fromARGB(255, 114, 117, 122),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 11,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          final rawServices = snapshot.data ?? [];
          final services = rawServices.where((s) {
            final lower = s.name.toLowerCase();
            return !lower.contains('adventure') &&
                !lower.contains('entertainment') &&
                !lower.contains('district');
          }).toList();
          final dynamicCategories = ['All', ...services.map((s) => s.name)];

          // Filter by category and search query
          final filteredServices = services.where((item) {
            final matchesCategory =
                _selectedCategory == 'All' ||
                item.name == _selectedCategory ||
                item.name.toLowerCase().contains(
                  _selectedCategory.toLowerCase(),
                );

            final matchesSearch =
                _searchQuery.isEmpty ||
                item.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                item.shortDescription.toLowerCase().contains(
                  _searchQuery.toLowerCase(),
                );

            return matchesCategory && matchesSearch;
          }).toList();

          return RefreshIndicator(
            onRefresh: () async {
              _reloadServices();
              await _servicesFuture;
            },
            color: const Color(0xFF1864E8),
            child: Column(
              children: [
                // Clean Search & Category Filter Header
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
                  child: Column(
                    children: [
                      // Clean Minimalist Search Bar
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0F172A)
                                  .withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) =>
                              setState(() => _searchQuery = val.trim()),
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          decoration: InputDecoration(
                            hintText:
                                'Search services, repairs, waterproofing...',
                            hintStyle: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 13.5,
                              fontWeight: FontWeight.w400,
                            ),
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
                                      size: 18,
                                      color: Color(0xFF94A3B8),
                                    ),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _searchQuery = '');
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Category Horizontal Filter Pills (Dynamic from backend)
                      SizedBox(
                        height: 36,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: dynamicCategories.length,
                          separatorBuilder: (_, index) =>
                              const SizedBox(width: 8),
                          itemBuilder: (context, index) {
                            final cat = dynamicCategories[index];
                            final isSelected = cat == _selectedCategory;
                            return InkWell(
                              onTap: () =>
                                  setState(() => _selectedCategory = cat),
                              borderRadius: BorderRadius.circular(20),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF0F172A)
                                      : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFF0F172A)
                                        : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    cat,
                                    style: TextStyle(
                                      color: isSelected
                                          ? Colors.white
                                          : const Color(0xFF475569),
                                      fontSize: 12.5,
                                      fontWeight: isSelected
                                          ? FontWeight.w700
                                          : FontWeight.w500,
                                    ),
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

                // Services List / Empty State
                Expanded(
                  child: filteredServices.isEmpty
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(28, 48, 28, 140),
                          children: [
                            Center(
                              child: Container(
                                width: 72,
                                height: 72,
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEFF6FF),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.search_off_rounded,
                                  color: Color(0xFF1864E8),
                                  size: 34,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'No Services Found',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _searchQuery.isNotEmpty
                                  ? 'No services matching "$_searchQuery". Try searching with different keywords.'
                                  : 'No services found under the "$_selectedCategory" category.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF64748B),
                                height: 1.4,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Center(
                              child: OutlinedButton(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = '';
                                    _selectedCategory = 'All';
                                  });
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF1864E8),
                                  side: const BorderSide(
                                    color: Color(0xFFCBD5E1),
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 11,
                                  ),
                                ),
                                child: const Text('View All Services'),
                              ),
                            ),
                          ],
                        )
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 140),
                          itemCount: filteredServices.length,
                          separatorBuilder: (_, index) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final service = filteredServices[index];
                            return Material(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              child: InkWell(
                                onTap: () {
                                  ServiceSubservicesSheet.show(
                                    context,
                                    service: service,
                                  );
                                },
                                borderRadius: BorderRadius.circular(16),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF0F172A)
                                            .withValues(alpha: 0.02),
                                        blurRadius: 8,
                                        offset: const Offset(0, 3),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Service Image
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(16),
                                        child: Container(
                                          width: 88,
                                          height: 88,
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
                                                       width: 88,
                                                       height: 88,
                                                       color: Colors.white,
                                                     ),
                                                   ),
                                                   errorWidget: (_, _, _) =>
                                                      const Icon(
                                                        Icons
                                                            .construction_rounded,
                                                        color: Color(
                                                          0xFF1864E8,
                                                        ),
                                                        size: 36,
                                                      ),
                                                )
                                              : const Icon(
                                                  Icons.construction_rounded,
                                                  color: Color(0xFF1864E8),
                                                  size: 36,
                                                ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),

                                      // Service Content
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              service.name,
                                              style: const TextStyle(
                                                color: Color(0xFF0F172A),
                                                fontSize: 15,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                            if (service
                                                .shortDescription
                                                .isNotEmpty) ...[
                                              const SizedBox(height: 4),
                                              Text(
                                                service.shortDescription,
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                  color: Color(0xFF64748B),
                                                  fontSize: 12.5,
                                                  height: 1.3,
                                                ),
                                              ),
                                            ],
                                            const SizedBox(height: 10),

                                            // Action Row: Price / Inspection Tag & Book Button
                                            Row(
                                              mainAxisAlignment:
                                                  MainAxisAlignment
                                                      .spaceBetween,
                                              children: [
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 3,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFEFF6FF,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          8,
                                                        ),
                                                  ),
                                                  child: Text(
                                                    service.startingPrice > 0
                                                        ? 'Starts ₹${service.startingPrice.toInt()}'
                                                        : 'Certified Inspection',
                                                    style: const TextStyle(
                                                      color: Color(0xFF1864E8),
                                                      fontSize: 11.5,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                    ),
                                                  ),
                                                ),
                                                Material(
                                                  color: const Color(0xFF1864E8),
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                  child: InkWell(
                                                    onTap: () {
                                                      Navigator.of(
                                                        context,
                                                      ).push(
                                                        MaterialPageRoute(
                                                          builder: (context) =>
                                                              CreateInspectionScreen(
                                                                preselectedService:
                                                                    service,
                                                              ),
                                                        ),
                                                      );
                                                    },
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                    child: const Padding(
                                                      padding:
                                                          EdgeInsets.symmetric(
                                                            horizontal: 12,
                                                            vertical: 6,
                                                          ),
                                                      child: Row(
                                                        mainAxisSize:
                                                            MainAxisSize.min,
                                                        children: [
                                                          Text(
                                                            'Book',
                                                            style: TextStyle(
                                                              color:
                                                                  Colors.white,
                                                              fontSize: 12,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w700,
                                                            ),
                                                          ),
                                                          SizedBox(width: 4),
                                                          Icon(
                                                            Icons
                                                                .arrow_forward_rounded,
                                                            size: 13,
                                                            color: Colors.white,
                                                          ),
                                                        ],
                                                      ),
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
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
