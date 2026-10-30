import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../features/home/models/slide_model.dart';
import '../../features/navigation/main_nav_screen.dart';
import '../../features/offers/screens/offers_screen.dart';
import '../../features/services/models/service_model.dart';
import '../../features/services/screens/create_inspection_screen.dart';

/// A reusable auto-scrolling promotional banner slider.
///
/// Used in both Services (HomeScreen) and Adventures (DistrictHubScreen).
class PromoSlider extends StatefulWidget {
  final List<SlideItem> slides;
  final ValueChanged<int>? onSwitchTab;
  final void Function(SlideItem)? onSlideTap;
  final double height;

  const PromoSlider({
    super.key,
    required this.slides,
    this.onSwitchTab,
    this.onSlideTap,
    this.height = 180,
  });

  @override
  State<PromoSlider> createState() => _PromoSliderState();
}

class _PromoSliderState extends State<PromoSlider> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    if (widget.slides.length > 1) {
      _timer = Timer.periodic(const Duration(seconds: 4), (_) {
        if (!mounted || widget.slides.isEmpty) return;
        final next = (_currentPage + 1) % widget.slides.length;
        _pageController.animateToPage(
          next,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOutCubic,
        );
      });
    }
  }

  @override
  void didUpdateWidget(covariant PromoSlider oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.slides.length != widget.slides.length) {
      _startTimer();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _handleSlideTap(SlideItem slide) {
    if (widget.onSlideTap != null) {
      widget.onSlideTap!(slide);
      return;
    }

    final route = slide.targetRoute.trim();
    final lower = route.toLowerCase();

    if (lower == 'services' || lower == '/services') {
      widget.onSwitchTab?.call(1);
      return;
    }

    if (lower == 'requests' ||
        lower == '/requests' ||
        lower == 'quotations' ||
        lower == '/quotations') {
      widget.onSwitchTab?.call(2);
      return;
    }

    if (lower == 'adventure' ||
        lower == '/adventure' ||
        lower == 'ent' ||
        lower == '/ent' ||
        lower == 'activities') {
      MainNavScreen.switchToAdventure(context);
      return;
    }

    if (lower == 'profile' || lower == '/profile') {
      widget.onSwitchTab?.call(3);
      return;
    }

    if (lower == 'offers' || lower == '/offers') {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (context) => const OffersScreen()),
      );
      return;
    }

    if (lower.startsWith('service:')) {
      final sName = route.substring('service:'.length).trim();
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => CreateInspectionScreen(
            preselectedService: ServiceItem(
              id: '',
              name: sName,
              shortDescription: '',
              startingPrice: 0,
              imageUrl: slide.resolvedImageUrl,
            ),
          ),
        ),
      );
      return;
    }

    // Default: Book Inspection
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const CreateInspectionScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.slides.isEmpty) return const SizedBox.shrink();

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          height: widget.height,
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.slides.length,
            onPageChanged: (idx) {
              setState(() {
                _currentPage = idx;
              });
            },
            itemBuilder: (context, index) {
              final slide = widget.slides[index];
              return _buildSlideCard(slide);
            },
          ),
        ),
        if (widget.slides.length > 1) ...[
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(widget.slides.length, (idx) {
              final isSelected = idx == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutCubic,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: isSelected ? 22 : 6,
                height: 5,
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF1864E8)
                      : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              );
            }),
          ),
          const SizedBox(height: 16),
        ] else ...[
          const SizedBox(height: 16),
        ],
      ],
    );
  }

  Widget _buildSlideCard(SlideItem slide) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1864E8).withValues(alpha: 0.10),
            blurRadius: 16,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (slide.resolvedImageUrl.isNotEmpty)
              CachedNetworkImage(
                imageUrl: slide.resolvedImageUrl,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: const Color(0xFFF1F5F9),
                  child: const Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF1864E8),
                      ),
                    ),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                    ),
                  ),
                  child: const Icon(
                    Icons.home_repair_service_rounded,
                    color: Colors.white70,
                    size: 64,
                  ),
                ),
              )
            else
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                  ),
                ),
              ),

            // Clickable surface
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _handleSlideTap(slide),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

