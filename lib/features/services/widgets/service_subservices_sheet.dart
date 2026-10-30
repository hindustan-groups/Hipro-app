import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';
import '../../../core/services/activity_tracker.dart';
import '../../../core/widgets/app_ui.dart';
import '../../home/data/service_api_service.dart';
import '../data/cart_service.dart';
import '../models/service_model.dart';
import '../screens/create_inspection_screen.dart';
import '../screens/sub_service_detail_screen.dart';
import 'cart_sheet.dart';

enum BookingMode { instant, quotable }

class ServiceSubservicesSheet extends StatefulWidget {
  final ServiceItem service;
  final BookingMode initialMode;

  const ServiceSubservicesSheet({
    super.key,
    required this.service,
    this.initialMode = BookingMode.instant,
  });

  static Future<void> show(
    BuildContext context, {
    required ServiceItem service,
    BookingMode initialMode = BookingMode.instant,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ServiceSubservicesSheet(
        service: service,
        initialMode: initialMode,
      ),
    );
  }

  @override
  State<ServiceSubservicesSheet> createState() => _ServiceSubservicesSheetState();
}

class _ServiceSubservicesSheetState extends State<ServiceSubservicesSheet> {
  late BookingMode _mode;
  late ServiceItem _currentService;
  bool _isLoadingSubs = false;

  void _autoSelectSupportedMode() {
    final subs = _currentService.subServices.where((s) => s.isActive).toList();
    if (subs.isEmpty) return;

    final hasInstant = subs.any((s) => s.bookNowEnabled);
    final hasQuote = subs.any((s) => s.getQuoteEnabled);

    if (_mode == BookingMode.instant && !hasInstant && hasQuote) {
      _mode = BookingMode.quotable;
    } else if (_mode == BookingMode.quotable && !hasQuote && hasInstant) {
      _mode = BookingMode.instant;
    }
  }

  @override
  void initState() {
    super.initState();
    _mode = widget.initialMode;
    _currentService = widget.service;
    ActivityTracker.instance.trackServiceExploration(
      serviceId: widget.service.id,
      serviceName: widget.service.name,
      metadata: {'sheet': 'ServiceSubservicesSheet', 'mode': widget.initialMode.toString()},
    );
    _autoSelectSupportedMode();

    if (_currentService.subServices.isEmpty) {
      _loadFullService();
    }
  }

  Future<void> _loadFullService() async {
    setState(() => _isLoadingSubs = true);
    try {
      final full = await ServiceApiService(ApiClient()).fetchServiceById(_currentService.id);
      if (full != null && mounted) {
        setState(() {
          _currentService = full;
          _isLoadingSubs = false;
          _autoSelectSupportedMode();
        });
      } else {
        if (mounted) setState(() => _isLoadingSubs = false);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingSubs = false);
    }
  }

  String _getSubServiceImage(SubService sub) {
    if (sub.image != null && sub.image!.isNotEmpty) {
      return sub.image!;
    }
    if (_currentService.imageUrl.isNotEmpty) {
      return _currentService.imageUrl;
    }
    return 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png';
  }

  @override
  Widget build(BuildContext context) {
    final allSubs = _currentService.subServices;
    final subServices = allSubs.where((s) {
      if (!s.isActive) return false;
      if (_mode == BookingMode.instant) {
        return s.bookNowEnabled;
      } else {
        return s.getQuoteEnabled;
      }
    }).toList();
    final cart = CartService.instance;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 16, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    width: 68,
                    height: 68,
                    color: const Color(0xFFEFF6FF),
                    padding: (_currentService.imageUrl.isNotEmpty && !_currentService.imageUrl.contains('cdn-icons-png'))
                        ? EdgeInsets.zero
                        : const EdgeInsets.all(7),
                    child: _currentService.imageUrl.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: _currentService.imageUrl,
                            fit: _currentService.imageUrl.contains('cdn-icons-png')
                                ? BoxFit.contain
                                : BoxFit.cover,
                            filterQuality: FilterQuality.high,
                            fadeInDuration: const Duration(milliseconds: 100),
                            fadeOutDuration: const Duration(milliseconds: 100),
                            placeholder: (_, _) => Shimmer.fromColors(
                              baseColor: const Color(0xFFE2E8F0),
                              highlightColor: const Color(0xFFF8FAFC),
                              child: Container(
                                width: 68,
                                height: 68,
                                color: Colors.white,
                              ),
                            ),
                            errorWidget: (_, _, _) => const Icon(
                              Icons.construction_rounded,
                              color: Color.fromARGB(255, 31, 33, 36),
                              size: 32,
                            ),
                          )
                        : const Icon(
                            Icons.construction_rounded,
                            color: Color.fromARGB(255, 42, 43, 46),
                            size: 32,
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _currentService.name,
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _currentService.shortDescription.isNotEmpty
                            ? _currentService.shortDescription
                            : 'Select sub-service for instant visit or quotation',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.location_on_rounded, size: 12, color: Color(0xFF1864E8)),
                          const SizedBox(width: 3),
                          Text(
                            UserSession().selectedCity,
                            style: const TextStyle(
                              color: Color(0xFF1864E8),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ListenableBuilder(
                      listenable: cart,
                      builder: (context, _) {
                        if (cart.isEmpty) return const SizedBox.shrink();
                        return IconButton(
                          tooltip: 'View Cart',
                          icon: Badge(
                            label: Text('${cart.count}'),
                            backgroundColor: const Color.fromARGB(255, 83, 81, 87),
                            child: const Icon(
                              Icons.shopping_bag_outlined,
                              color: Color.fromARGB(255, 65, 63, 68),
                              size: 22,
                            ),
                          ),
                          onPressed: () => CartSheet.show(context),
                        );
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Segmented Switcher: Instant Booking vs Quotable Booking
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _mode = BookingMode.instant),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _mode == BookingMode.instant
                              ? Colors.white
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: _mode == BookingMode.instant
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : [],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.bolt_rounded,
                              size: 17,
                              color: _mode == BookingMode.instant
                                  ? const Color.fromARGB(255, 45, 48, 53)
                                  : const Color.fromARGB(255, 47, 49, 53),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'Instant Booking',
                              style: TextStyle(
                                color: _mode == BookingMode.instant
                                    ? const Color(0xFF0F172A)
                                    : const Color.fromARGB(255, 46, 51, 58),
                                fontSize: 13,
                                fontWeight: _mode == BookingMode.instant
                                    ? FontWeight.w700
                                    : FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _mode = BookingMode.quotable),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _mode == BookingMode.quotable
                              ? Colors.white
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: _mode == BookingMode.quotable
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                              : [],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.request_quote_outlined,
                              size: 16,
                              color: _mode == BookingMode.quotable
                                  ? const Color.fromARGB(255, 41, 45, 51)
                                  : const Color.fromARGB(255, 49, 53, 58),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              'Quotable Booking',
                              style: TextStyle(
                                color: _mode == BookingMode.quotable
                                    ? const Color(0xFF0F172A)
                                    : const Color.fromARGB(255, 44, 49, 56),
                                fontSize: 13,
                                fontWeight: _mode == BookingMode.quotable
                                    ? FontWeight.w700
                                    : FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Subservices List with Images
          Expanded(
            child: _isLoadingSubs
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(strokeWidth: 2.5),
                        SizedBox(height: 12),
                        Text(
                          'Loading sub-services...',
                          style: TextStyle(color: Color.fromARGB(255, 66, 72, 82), fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : allSubs.isEmpty
                    ? _buildFallbackEmptyState()
                    : subServices.isEmpty
                        ? _buildNoSubServicesForModeState()
                        : ListenableBuilder(
                        listenable: cart,
                        builder: (context, _) => ListView.separated(
                          padding: EdgeInsets.fromLTRB(
                            20,
                            4,
                            20,
                            cart.isEmpty ? (20 + MediaQuery.of(context).padding.bottom) : 16,
                          ),
                          itemCount: subServices.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final sub = subServices[index];
                            return _buildSubServiceBox(sub, cart);
                          },
                        ),
                      ),
          ),

          // Bottom Floating Cart Bar
          ListenableBuilder(
            listenable: cart,
            builder: (context, _) {
              if (cart.isEmpty) {
                final bottomPadding = MediaQuery.of(context).padding.bottom;
                if (bottomPadding > 0) {
                  return SizedBox(height: bottomPadding);
                }
                return const SizedBox.shrink();
              }
              final bottomInset = MediaQuery.of(context).padding.bottom;
              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: const Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, -3),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  bottom: true,
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      20,
                      12,
                      20,
                      bottomInset > 0 ? 8 : 16,
                    ),
                    child: Row(
                      children: [
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${cart.count} ${cart.count == 1 ? 'Service' : 'Services'} in Cart',
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '₹${cart.totalVisitingCharge.toInt()} Total Fee',
                              style: const TextStyle(
                                color: Color(0xFF1864E8),
                                fontSize: 17,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        ElevatedButton.icon(
                          onPressed: () => CartSheet.show(context),
                          icon: const Icon(Icons.shopping_bag_outlined, size: 16),
                          label: const Text(
                            'View Cart →',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1864E8),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
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

  // Minimalist SubService Box
  Widget _buildSubServiceBox(SubService sub, CartService cart) {
    return ListenableBuilder(
      listenable: cart,
      builder: (context, _) {
        final imageUrl = _getSubServiceImage(sub);
        final inCart = cart.isInCart(sub.id);

        return Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
        onTap: () {
          if (_mode == BookingMode.instant) {
            if (!sub.bookNowEnabled) {
              AppToast.show(
                context,
                message: '${sub.name} is only available for Quotable Booking.',
              );
              return;
            }
            // Instant Booking Mode -> Open SubService Detail Page
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => SubServiceDetailScreen(
                  service: _currentService,
                  subService: sub,
                ),
              ),
            );
          } else {
            if (!sub.getQuoteEnabled) {
              AppToast.show(
                context,
                message: '${sub.name} is only available for Instant Booking.',
              );
              return;
            }
            // Quotable Booking Mode -> Open CreateInspectionScreen
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => CreateInspectionScreen(
                  preselectedService: _currentService,
                  preselectedSubService: sub,
                ),
              ),
            );
          }
        },
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: inCart ? const Color.fromARGB(255, 231, 229, 235) : const Color(0xFFE2E8F0),
              width: inCart ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              // Clean Prominent Subservice Image (Enlarged to 94x94 with zero inner padding)
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Container(
                  width: 104,
                  height: 104,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: imageUrl,
                    fit: BoxFit.cover,
                    filterQuality: FilterQuality.high,
                    fadeInDuration: const Duration(milliseconds: 100),
                    fadeOutDuration: const Duration(milliseconds: 100),
                    placeholder: (_, _) => Shimmer.fromColors(
                      baseColor: const Color(0xFFE2E8F0),
                      highlightColor: const Color(0xFFF8FAFC),
                      child: Container(
                        width: 104,
                        height: 104,
                        color: Colors.white,
                      ),
                    ),
                    errorWidget: (_, _, _) => Container(
                      color: const Color(0xFFEFF6FF),
                      child: const Center(
                        child: Icon(
                          Icons.construction_rounded,
                          color: Color.fromARGB(255, 152, 142, 170),
                          size: 40,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Title + Bottom Row (Visiting Charge + Action Button)
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Subservice Title (Full width available, never hidden by button!)
                    Text(
                      sub.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Bottom Row: Visit Fee on Left, Add / Quote on Right
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Visit Fee Tag
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3.5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFDBEAFE)),
                          ),
                          child: Text(
                            '₹${sub.visitingCharge.toInt()} Visit Fee',
                            style: const TextStyle(
                              color: Color(0xFF1D4ED8),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),

                        // Action Button (Add / Added / Quote)
                        if (_mode == BookingMode.instant)
                          GestureDetector(
                            behavior: HitTestBehavior.opaque,
                            onTap: () {
                              if (!sub.bookNowEnabled) {
                                AppToast.show(
                                  context,
                                  message: '${sub.name} is not available for instant booking.',
                                );
                                return;
                              }
                              final added =
                                  cart.toggleItem(sub, _currentService);
                              setState(() {});
                              AppToast.show(
                                context,
                                message: added
                                    ? 'Added ${sub.name} to Cart!'
                                    : 'Removed from Cart.',
                                actionLabel: added ? 'View Cart' : null,
                                onAction: added
                                    ? () => CartSheet.show(context)
                                    : null,
                              );
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: inCart
                                    ? const Color.fromARGB(255, 83, 81, 87)
                                    : Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color.fromARGB(255, 128, 114, 153),
                                  width: 1.2,
                                ),
                                boxShadow: inCart
                                    ? [
                                        BoxShadow(
                                          color: const Color.fromARGB(255, 93, 78, 119)
                                              .withValues(alpha: 0.25),
                                          blurRadius: 6,
                                          offset: const Offset(0, 2),
                                        ),
                                      ]
                                    : [],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    inCart
                                        ? Icons.check_rounded
                                        : Icons.add_rounded,
                                    size: 14,
                                    color: inCart
                                        ? Colors.white
                                        : const Color.fromARGB(255, 124, 113, 143),
                                  ),
                                  const SizedBox(width: 3),
                                  Text(
                                    inCart ? 'Added' : 'Add',
                                    style: TextStyle(
                                      color: inCart
                                          ? Colors.white
                                          : const Color.fromARGB(255, 142, 127, 167),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: const Color.fromARGB(255, 69, 67, 75),
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color.fromARGB(255, 149, 134, 173)
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
                                  'Quote',
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
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
      },
    );
  }

  Widget _buildNoSubServicesForModeState() {
    final isInstant = _mode == BookingMode.instant;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isInstant ? Icons.bolt_outlined : Icons.request_quote_outlined,
                size: 36,
                color: const Color(0xFF64748B),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              isInstant
                  ? 'No Instant Booking Available'
                  : 'No Quotable Booking Available',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              isInstant
                  ? 'Sub-services in this category require on-site engineer inspection. Switch to Quotable Booking above.'
                  : 'Sub-services in this category are available for instant on-demand visits. Switch to Instant Booking above.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFallbackEmptyState() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.build_circle_outlined, size: 48, color: Color.fromARGB(255, 152, 142, 170)),
            const SizedBox(height: 12),
            const Text(
              'Standard Site Inspection',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'A senior engineer will visit your property for complete on-site inspection.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => CreateInspectionScreen(
                      preselectedService: _currentService,
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color.fromARGB(255, 65, 63, 68),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Book Standard Inspection →'),
            ),
          ],
        ),
      ),
    );
  }
}
