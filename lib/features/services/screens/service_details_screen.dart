import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/network/api_client.dart';
import '../../../core/services/activity_tracker.dart';
import '../../../core/widgets/app_ui.dart';
import '../../../core/widgets/chat_sheet.dart';
import '../../home/data/service_api_service.dart';
import '../data/cart_service.dart';
import '../models/service_model.dart';
import '../widgets/cart_sheet.dart';
import '../widgets/direct_booking_sheet.dart';
import 'create_inspection_screen.dart';
import 'sub_service_detail_screen.dart';

class ServiceDetailsScreen extends StatefulWidget {
  const ServiceDetailsScreen({super.key, required this.service});

  final ServiceItem service;

  @override
  State<ServiceDetailsScreen> createState() => _ServiceDetailsScreenState();
}

class _ServiceDetailsScreenState extends State<ServiceDetailsScreen> {
  late ServiceItem _currentService;
  bool _isLoadingSubs = false;

  @override
  void initState() {
    super.initState();
    _currentService = widget.service;
    ActivityTracker.instance.trackServiceExploration(
      serviceId: widget.service.id,
      serviceName: widget.service.name,
      metadata: {'screen': 'ServiceDetailsScreen'},
    );
    if (_currentService.subServices.isEmpty) {
      _loadFullServiceWithSubs();
    }
  }

  Future<void> _loadFullServiceWithSubs() async {
    setState(() => _isLoadingSubs = true);
    try {
      final full = await ServiceApiService(ApiClient())
          .fetchServiceById(_currentService.id);
      if (full != null && mounted) {
        setState(() {
          _currentService = full;
          _isLoadingSubs = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingSubs = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = _currentService;
    final subServices = service.subServices;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Hero Image
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: MediaQuery.of(context).size.height * 0.38,
            child: Stack(
              children: [
                CachedNetworkImage(
                  imageUrl: service.imageUrl,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                  filterQuality: FilterQuality.high,
                  fadeInDuration: const Duration(milliseconds: 100),
                  fadeOutDuration: const Duration(milliseconds: 100),
                  placeholder: (_, _) => Shimmer.fromColors(
                    baseColor: const Color(0xFFE2E8F0),
                    highlightColor: const Color(0xFFF8FAFC),
                    child: Container(
                      width: double.infinity,
                      height: double.infinity,
                      color: Colors.white,
                    ),
                  ),
                  errorWidget: (context, error, stackTrace) {
                    return Container(
                      color: const Color(0xFF1E3A8A),
                      child: const Center(
                        child: Icon(
                          Icons.apartment_rounded,
                          color: Colors.white,
                          size: 64,
                        ),
                      ),
                    );
                  },
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withValues(alpha: 0.4),
                        Colors.transparent,
                        Colors.black.withValues(alpha: 0.2),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
                // Top App Bar Icons
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        CircleAvatar(
                          backgroundColor: Colors.white.withValues(alpha: 0.9),
                          child: IconButton(
                            icon: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 16,
                              color: Color(0xFF0F172A),
                            ),
                            onPressed: () => Navigator.of(context).pop(),
                          ),
                        ),
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: Colors.white.withValues(
                                alpha: 0.9,
                              ),
                              child: IconButton(
                                icon: const Icon(
                                  Icons.chat_outlined,
                                  size: 19,
                                  color: Color(0xFF1864E8),
                                ),
                                tooltip: 'Chat with Expert',
                                onPressed: () {
                                  ChatSheet.show(
                                    context,
                                    title: 'Consultation: ${service.name}',
                                    subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
                                    contextType: 'SERVICE',
                                    contextTag: service.name,
                                  );
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            ListenableBuilder(
                              listenable: CartService.instance,
                              builder: (context, _) {
                                final count = CartService.instance.count;
                                return Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: Colors.white.withValues(
                                        alpha: 0.9,
                                      ),
                                      child: IconButton(
                                        icon: const Icon(
                                          Icons.shopping_bag_outlined,
                                          size: 19,
                                          color: Color(0xFF0F172A),
                                        ),
                                        tooltip: 'View Cart',
                                        onPressed: () =>
                                            CartSheet.show(context),
                                      ),
                                    ),
                                    if (count > 0)
                                      Positioned(
                                        right: -2,
                                        top: -2,
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: const BoxDecoration(
                                            color: Color(0xFFEF4444),
                                            shape: BoxShape.circle,
                                          ),
                                          constraints: const BoxConstraints(
                                            minWidth: 18,
                                            minHeight: 18,
                                          ),
                                          child: Text(
                                            '$count',
                                            textAlign: TextAlign.center,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 10,
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
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Sliding White Card Container
          Positioned.fill(
            top: MediaQuery.of(context).size.height * 0.32,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x1A000000),
                    blurRadius: 20,
                    offset: Offset(0, -6),
                  ),
                ],
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEBF2FE),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(
                            Icons.apartment_rounded,
                            color: Color(0xFF1864E8),
                            size: 26,
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
                                  fontSize: 19,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
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
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Rating & Quality Trust Banner
                    Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: Color(0xFFF59E0B),
                          size: 19,
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          '4.8',
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Text(
                          '(Verified Service)',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 12,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFDBEAFE)),
                          ),
                          child: const Row(
                            children: [
                              Icon(
                                Icons.shield_outlined,
                                color: Color(0xFF1D4ED8),
                                size: 13,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'Certified Experts',
                                style: TextStyle(
                                  color: Color(0xFF1D4ED8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Visiting Charge Policy Callout
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.monetization_on_outlined,
                            color: Color(0xFFD97706),
                            size: 17,
                          ),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Charges are strictly based on sub-service visiting fee. Additional work or parts are adjusted transparently on-site by your technician.',
                              style: TextStyle(
                                color: Color(0xFF92400E),
                                fontSize: 11.5,
                                fontWeight: FontWeight.w500,
                                height: 1.35,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 22),

                    // Sub-Services Section Title
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Choose Specific Sub-Service',
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        if (_isLoadingSubs)
                          const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Sub-Services List Cards
                    if (subServices.isNotEmpty) ...[
                      ...subServices.map(
                        (sub) => _buildSubServiceCard(sub, service),
                      ),
                    ] else ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Standard Site Inspection & Diagnosis',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'A senior technician will visit your site for complete diagnosis and estimation.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        CreateInspectionScreen(
                                          preselectedService: service,
                                        ),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color.fromARGB(255, 65, 63, 68),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: const Text('Book Standard Inspection →'),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),

                    // Service Quality Guarantees
                    const Text(
                      'Service Guarantees',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildIncludedItem(
                      'Instant online booking with transparent visiting fee',
                    ),
                    _buildIncludedItem(
                      'Background-checked & certified technicians',
                    ),
                    _buildIncludedItem('Digital job sheet & audit trail'),
                    _buildIncludedItem(
                      '100% automated refund if technician is unavailable',
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom Action Bar
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: const Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                bottom: true,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                  child: Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () {
                          ChatSheet.show(
                            context,
                            title: 'Consultation: ${service.name}',
                            subtitle:
                                'Er. Vikram Sharma • Senior Technical Lead',
                            contextType: 'SERVICE',
                            contextTag: service.name,
                          );
                        },
                        icon: const Icon(
                          Icons.chat_bubble_outline_rounded,
                          size: 16,
                        ),
                        label: const Text('Chat'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color.fromARGB(255, 65, 63, 68),
                          side: const BorderSide(color: Color.fromARGB(255, 128, 114, 153)),
                          backgroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            if (subServices.isNotEmpty) {
                              DirectBookingSheet.show(
                                context,
                                service: service,
                                subService: subServices.first,
                              );
                            } else {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => CreateInspectionScreen(
                                    preselectedService: service,
                                  ),
                                ),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color.fromARGB(255, 65, 63, 68),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 0,
                          ),
                          child: Text(
                            subServices.isNotEmpty
                                ? 'Book Now (₹${subServices.first.visitingCharge.toInt()} Visit) →'
                                : 'Book Inspection →',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubServiceCard(SubService sub, ServiceItem service) {
    final subImage = (sub.image != null && sub.image!.isNotEmpty)
        ? sub.image!
        : (service.imageUrl.isNotEmpty
              ? service.imageUrl
              : 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png');

    return Material(
      color: const Color(0xFFF8FAFC),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) =>
                  SubServiceDetailScreen(service: service, subService: sub),
            ),
          );
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 4),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 60,
                      height: 60,
                      color: const Color(0xFFE2E8F0),
                      child: CachedNetworkImage(
                        imageUrl: subImage,
                        fit: BoxFit.cover,
                        filterQuality: FilterQuality.high,
                        fadeInDuration: const Duration(milliseconds: 100),
                        fadeOutDuration: const Duration(milliseconds: 100),
                        placeholder: (_, _) => Shimmer.fromColors(
                          baseColor: const Color(0xFFE2E8F0),
                          highlightColor: const Color(0xFFF8FAFC),
                          child: Container(
                            width: 60,
                            height: 60,
                            color: Colors.white,
                          ),
                        ),
                        errorWidget: (_, _, _) => const Icon(
                          Icons.construction_rounded,
                          color: Color.fromARGB(255, 152, 142, 170),
                          size: 26,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                sub.name,
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 7,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: const Color(0xFFDBEAFE),
                                ),
                              ),
                              child: Text(
                                '₹${sub.visitingCharge.toInt()} Visit',
                                style: const TextStyle(
                                  color: Color(0xFF1D4ED8),
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (sub.titleHi != null && sub.titleHi!.isNotEmpty) ...[
                          const SizedBox(height: 1),
                          Text(
                            sub.titleHi!,
                            style: const TextStyle(
                              color: Color(0xFF475569),
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                        if (sub.desc.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            sub.desc,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF475569),
                              fontSize: 11.5,
                              height: 1.35,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),

              if (sub.requiredFields.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.assignment_outlined,
                      size: 13,
                      color: Color(0xFF6366F1),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${sub.requiredFields.length} custom details required upon checkout',
                      style: const TextStyle(
                        color: Color(0xFF4F46E5),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 12),

              // Action Buttons for this SubService
              Row(
                children: [
                  // Add to Cart / In Cart button
                  ListenableBuilder(
                    listenable: CartService.instance,
                    builder: (context, _) {
                      final inCart = CartService.instance.isInCart(sub.id);
                      return InkWell(
                        borderRadius: BorderRadius.circular(8),
                        onTap: () {
                          final added = CartService.instance.toggleItem(
                            sub,
                            service,
                          );
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
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: inCart
                                ? const Color.fromARGB(255, 83, 81, 87)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: inCart
                                  ? const Color.fromARGB(255, 83, 81, 87)
                                  : const Color.fromARGB(255, 128, 114, 153),
                            ),
                          ),
                          child: Icon(
                            inCart
                                ? Icons.check_rounded
                                : Icons.add_rounded,
                            size: 16,
                            color: inCart
                                ? Colors.white
                                : const Color.fromARGB(255, 124, 113, 143),
                          ),
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                  if (sub.bookNowEnabled)
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          DirectBookingSheet.show(
                            context,
                            service: service,
                            subService: sub,
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color.fromARGB(255, 65, 63, 68),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          'Book (₹${sub.visitingCharge.toInt()})',
                          style: const TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  if (sub.bookNowEnabled && sub.getQuoteEnabled)
                    const SizedBox(width: 8),
                  if (sub.getQuoteEnabled)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => CreateInspectionScreen(
                                preselectedService: service,
                                preselectedSubService: sub,
                              ),
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF334155),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text(
                          'Get Quote',
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIncludedItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(2.5),
            decoration: const BoxDecoration(
              color: Color(0xFFECFDF5),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Color(0xFF059669),
              size: 13,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Color(0xFF334155),
                fontSize: 12.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
