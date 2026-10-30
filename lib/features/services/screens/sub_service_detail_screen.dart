import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/widgets/app_ui.dart';
import '../../../core/widgets/chat_sheet.dart';
import '../../../core/services/activity_tracker.dart';
import '../data/cart_service.dart';
import '../models/service_model.dart';
import '../widgets/cart_sheet.dart';
import '../widgets/direct_booking_sheet.dart';
import 'create_inspection_screen.dart';

class SubServiceDetailScreen extends StatefulWidget {
  final ServiceItem service;
  final SubService subService;

  const SubServiceDetailScreen({
    super.key,
    required this.service,
    required this.subService,
  });

  @override
  State<SubServiceDetailScreen> createState() => _SubServiceDetailScreenState();
}

class _SubServiceDetailScreenState extends State<SubServiceDetailScreen> {
  @override
  void initState() {
    super.initState();
    ActivityTracker.instance.trackServiceExploration(
      serviceId: widget.service.id,
      serviceName: widget.service.name,
      subServiceId: widget.subService.id,
      subServiceName: widget.subService.name,
      metadata: {'screen': 'SubServiceDetailScreen'},
    );
  }

  String get _heroImageUrl {
    if (widget.subService.image != null && widget.subService.image!.isNotEmpty) {
      return widget.subService.image!;
    }
    if (widget.service.imageUrl.isNotEmpty) {
      return widget.service.imageUrl;
    }
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80';
  }

  @override
  Widget build(BuildContext context) {
    final service = widget.service;
    final subService = widget.subService;
    final cart = CartService.instance;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Scrollable Content
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero Image with Gradient
                Stack(
                  children: [
                    CachedNetworkImage(
                      imageUrl: _heroImageUrl,
                      width: double.infinity,
                      height: 280,
                      fit: BoxFit.cover,
                      filterQuality: FilterQuality.high,
                      fadeInDuration: const Duration(milliseconds: 100),
                      fadeOutDuration: const Duration(milliseconds: 100),
                      placeholder: (_, _) => Shimmer.fromColors(
                        baseColor: const Color(0xFF1E293B),
                        highlightColor: const Color(0xFF334155),
                        child: Container(
                          width: double.infinity,
                          height: 280,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      errorWidget: (_, _, _) => Container(
                        height: 280,
                        color: const Color(0xFF1E3A8A),
                        child: const Center(
                          child: Icon(
                            Icons.construction_rounded,
                            color: Colors.white,
                            size: 64,
                          ),
                        ),
                      ),
                    ),
                    Container(
                      height: 280,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.5),
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.6),
                          ],
                        ),
                      ),
                    ),

                    // Top Navigation Controls
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                                  backgroundColor: Colors.white.withValues(alpha: 0.9),
                                  child: IconButton(
                                    icon: const Icon(
                                      Icons.chat_outlined,
                                      size: 18,
                                      color: Color.fromARGB(255, 65, 63, 68),
                                    ),
                                    tooltip: 'Chat with Lead Engineer',
                                    onPressed: () {
                                      ChatSheet.show(
                                        context,
                                        title: 'Consultation: ${subService.name}',
                                        subtitle: '${service.name} Technical Consultation',
                                        contextType: 'SERVICE',
                                        contextTag: subService.name,
                                      );
                                    },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ListenableBuilder(
                                  listenable: cart,
                                  builder: (context, _) {
                                    return Stack(
                                      clipBehavior: Clip.none,
                                      children: [
                                        CircleAvatar(
                                          backgroundColor: Colors.white.withValues(alpha: 0.9),
                                          child: IconButton(
                                            icon: const Icon(
                                              Icons.shopping_bag_outlined,
                                              size: 18,
                                              color: Color(0xFF0F172A),
                                            ),
                                            tooltip: 'View Cart',
                                            onPressed: () => CartSheet.show(context),
                                          ),
                                        ),
                                        if (cart.count > 0)
                                          Positioned(
                                            right: -2,
                                            top: -2,
                                            child: Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: const BoxDecoration(
                                                color: Color.fromARGB(255, 83, 81, 87),
                                                shape: BoxShape.circle,
                                              ),
                                              constraints: const BoxConstraints(
                                                minWidth: 18,
                                                minHeight: 18,
                                              ),
                                              child: Text(
                                                '${cart.count}',
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

                    // Service Category Badge on Image Bottom
                    Positioned(
                      left: 20,
                      bottom: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color.fromARGB(255, 65, 63, 68),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          service.name.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.6,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                // SubService Details Body
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title
                      Text(
                        subService.name,
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.4,
                        ),
                      ),
                      if (subService.titleHi != null && subService.titleHi!.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(
                          subService.titleHi!,
                          style: const TextStyle(
                            color: Color(0xFF475569),
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),

                      // Rating
                      if (service.rating > 0) ...[
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star_rounded, color: Color(0xFFD97706), size: 15),
                                  const SizedBox(width: 3),
                                  Text(
                                    service.rating.toStringAsFixed(1),
                                    style: const TextStyle(
                                      color: Color(0xFF92400E),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Description
                      if (subService.desc.isNotEmpty) ...[
                        Text(
                          subService.desc,
                          style: const TextStyle(
                            color: Color(0xFF334155),
                            fontSize: 13.5,
                            height: 1.45,
                          ),
                        ),
                        const SizedBox(height: 18),
                      ],

                      // Visiting Charge Box
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFDBEAFE)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.monetization_on_outlined, color: Color(0xFF1D4ED8), size: 20),
                                    SizedBox(width: 8),
                                    Text(
                                      'Visiting Charge',
                                      style: TextStyle(
                                        color: Color(0xFF1E40AF),
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                                Text(
                                  '₹${subService.visitingCharge.toInt()}',
                                  style: const TextStyle(
                                    color: Color(0xFF1864E8),
                                    fontSize: 19,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            const Row(
                              children: [
                                Icon(Icons.info_outline_rounded, color: Color(0xFFDC2626), size: 14),
                                SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'visiting charge is not refundale',
                                    style: TextStyle(
                                      color: Color(0xFFDC2626),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Additional Charges (if any from server)
                      if (subService.additionalCharges.isNotEmpty) ...[
                        const SizedBox(height: 22),
                        const Text(
                          'Additional Charges',
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        ...subService.additionalCharges.map(
                          (charge) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  charge.title,
                                  style: const TextStyle(
                                    color: Color(0xFF334155),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  charge.isFree ? 'FREE' : '₹${charge.amount.toInt()}',
                                  style: TextStyle(
                                    color: charge.isFree ? const Color(0xFF16A34A) : const Color(0xFF0F172A),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],

                      // What's Included / Checklist (if provided by server)
                      if (subService.checklist.isNotEmpty) ...[
                        const SizedBox(height: 22),
                        const Text(
                          "What's Included in Inspection",
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        ...subService.checklist.map((item) => _buildChecklistItem(item)),
                      ],

                      // Required Booking Details / Questions (if configured on server)
                      if (subService.requiredFields.isNotEmpty) ...[
                        const SizedBox(height: 22),
                        Row(
                          children: [
                            const Icon(Icons.help_outline_rounded, color: Color(0xFF1864E8), size: 18),
                            const SizedBox(width: 8),
                            const Text(
                              'Required Booking Details',
                              style: TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFDBEAFE)),
                              ),
                              child: Text(
                                '${subService.requiredFields.length} Qs',
                                style: const TextStyle(
                                  color: Color(0xFF1D4ED8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              for (int i = 0; i < subService.requiredFields.length; i++) ...[
                                if (i > 0) const Divider(height: 16, color: Color(0xFFE2E8F0)),
                                _buildRequiredFieldPreview(subService.requiredFields[i]),
                              ],
                            ],
                          ),
                        ),
                      ],

                      // Default Notes (if provided by server)
                      if (subService.defaultNotes.trim().isNotEmpty) ...[
                        const SizedBox(height: 22),
                        const Text(
                          'Important Notes',
                          style: TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          subService.defaultNotes,
                          style: const TextStyle(
                            color: Color(0xFF475569),
                            fontSize: 13,
                            height: 1.45,
                          ),
                        ),
                      ],

                      // Quotable Booking Option Card
                      if (subService.getQuoteEnabled) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFC7D2FE)),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF4F46E5),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.request_quote_outlined, color: Colors.white, size: 20),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text(
                                      'Prefer a custom quotation?',
                                      style: TextStyle(
                                        color: Color(0xFF1E1B4B),
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    const Text(
                                      'Upload damage photos/videos to get an advance quotation from engineers.',
                                      style: TextStyle(color: Color(0xFF4338CA), fontSize: 11.5),
                                    ),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) => CreateInspectionScreen(
                                        preselectedService: service,
                                        preselectedSubService: subService,
                                      ),
                                    ),
                                  );
                                },
                                style: TextButton.styleFrom(
                                  foregroundColor: const Color(0xFF4F46E5),
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                ),
                                child: const Text('Get Quote →', style: TextStyle(fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Sticky Bottom Bar
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
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                bottom: true,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                  child: Row(
                    children: [
                      // Visiting Fee Display
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Visiting Fee',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            '₹${subService.visitingCharge.toInt()}',
                            style: const TextStyle(
                              color: Color(0xFF1864E8),
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 12),

                      // Add to Cart Button
                      ListenableBuilder(
                        listenable: cart,
                        builder: (context, _) {
                          final inCart = cart.isInCart(subService.id);
                          if (!subService.bookNowEnabled) {
                            return const SizedBox.shrink();
                          }
                          return OutlinedButton.icon(
                            onPressed: () {
                              final added = cart.toggleItem(subService, service);
                              AppToast.show(
                                context,
                                message: added
                                    ? 'Added ${subService.name} to Cart!'
                                    : 'Removed from Cart.',
                                actionLabel: added ? 'View Cart' : null,
                                onAction: added ? () => CartSheet.show(context) : null,
                              );
                            },
                            icon: Icon(
                              inCart ? Icons.check_rounded : Icons.add_rounded,
                              size: 15,
                              color: inCart ? Colors.white : const Color(0xFF1864E8),
                            ),
                            label: Text(
                              inCart ? 'In Cart' : 'Add to Cart',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: inCart ? Colors.white : const Color(0xFF1864E8),
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: inCart ? Colors.white : const Color(0xFF1864E8),
                              side: const BorderSide(
                                color: Color(0xFF1864E8),
                                width: 1.2,
                              ),
                              backgroundColor: inCart
                                  ? const Color(0xFF1864E8)
                                  : Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          );
                        },
                      ),

                      if (subService.bookNowEnabled) const SizedBox(width: 8),

                      // Book / Quote Service Button
                      Expanded(
                        child: ElevatedButton(
                          onPressed: subService.bookNowEnabled
                              ? () {
                                  DirectBookingSheet.show(
                                    context,
                                    service: service,
                                    subService: subService,
                                  );
                                }
                              : subService.getQuoteEnabled
                                  ? () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) => CreateInspectionScreen(
                                            preselectedService: service,
                                            preselectedSubService: subService,
                                          ),
                                        ),
                                      );
                                    }
                                  : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1864E8),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            elevation: 1,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                subService.bookNowEnabled
                                    ? 'Book Service'
                                    : subService.getQuoteEnabled
                                        ? 'Get Quote'
                                        : 'Unavailable',
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.2,
                                ),
                              ),
                              if (subService.bookNowEnabled || subService.getQuoteEnabled) ...[
                                const SizedBox(width: 4),
                                const Icon(Icons.arrow_forward_rounded, size: 15),
                              ],
                            ],
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

  Widget _buildChecklistItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(2.5),
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              color: Color(0xFF1D4ED8),
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

  Widget _buildRequiredFieldPreview(dynamic field) {
    if (field is! Map) return const SizedBox.shrink();
    final label = field['label']?.toString() ?? field['title']?.toString() ?? 'Required Detail';
    final fieldType = field['fieldType']?.toString().toLowerCase() ?? 'text';
    final isRequired = field['required'] == true;
    final options = (field['options'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [];

    String typeLabel = 'Text Input';
    IconData typeIcon = Icons.edit_note_rounded;
    if (fieldType == 'number' || fieldType == 'numeric') {
      typeLabel = 'Numeric Value';
      typeIcon = Icons.numbers_rounded;
    } else if (fieldType == 'select') {
      typeLabel = 'Dropdown Choice';
      typeIcon = Icons.arrow_drop_down_circle_outlined;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(typeIcon, size: 16, color: const Color(0xFF64748B)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isRequired ? const Color(0xFFFEF2F2) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                isRequired ? 'Required' : 'Optional',
                style: TextStyle(
                  color: isRequired ? const Color(0xFFDC2626) : const Color(0xFF64748B),
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            const SizedBox(width: 24),
            Text(
              typeLabel,
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 11.5),
            ),
            if (options.isNotEmpty) ...[
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '(${options.join(", ")})',
                  style: const TextStyle(color: Color(0xFF475569), fontSize: 11, fontStyle: FontStyle.italic),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
