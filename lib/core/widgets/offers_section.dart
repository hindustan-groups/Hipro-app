import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../features/offers/models/offer_model.dart';
import '../../features/offers/screens/offers_screen.dart';

/// A reusable Offers & Deals section styled like MakeMyTrip/UrbanCompany.
/// Displays category tabs ('Trending', 'Adventure', etc.) and a horizontal card list.
///
/// Used in both Services (HomeScreen) and Adventures (DistrictHubScreen).
class OffersSection extends StatefulWidget {
  final List<OfferItem> offers;
  final String title;
  final String viewAllLabel;
  final VoidCallback? onViewAll;
  final ValueChanged<OfferItem>? onOfferTap;
  final String initialTab;
  final String? section;

  const OffersSection({
    super.key,
    required this.offers,
    this.title = 'Offers',
    this.viewAllLabel = 'View All',
    this.onViewAll,
    this.onOfferTap,
    this.initialTab = 'Trending',
    this.section,
  });

  @override
  State<OffersSection> createState() => _OffersSectionState();
}

class _OffersSectionState extends State<OffersSection> {
  late String _selectedTab;

  @override
  void initState() {
    super.initState();
    _selectedTab = widget.initialTab;
  }

  void _handleOfferTap(OfferItem offer) {
    if (widget.onOfferTap != null) {
      widget.onOfferTap!(offer);
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => OffersScreen(section: widget.section)),
    );
  }

  void _handleViewAll() {
    if (widget.onViewAll != null) {
      widget.onViewAll!();
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => OffersScreen(section: widget.section)),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.offers.isEmpty) return const SizedBox.shrink();

    final Set<String> dynamicCategories = {'Trending'};
    for (final o in widget.offers) {
      if (o.category.trim().isNotEmpty) {
        dynamicCategories.add(o.category.trim());
      }
    }
    final offerTabs = dynamicCategories.toList();

    final filteredOffers = widget.offers.where((o) {
      if (_selectedTab == 'Trending') return true;
      return o.category.toLowerCase() == _selectedTab.toLowerCase();
    }).toList();

    final displayList =
        filteredOffers.isNotEmpty ? filteredOffers : widget.offers;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Header Row: Offers & View All >
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.title,
              style: const TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 18,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            InkWell(
              onTap: _handleViewAll,
              borderRadius: BorderRadius.circular(14),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      widget.viewAllLabel,
                      style: const TextStyle(
                        color: Color(0xFFEA580C),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 11,
                      color: Color(0xFFEA580C),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Horizontal Category Tabs
        if (offerTabs.length > 1) ...[
          SizedBox(
            height: 34,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: offerTabs.length,
              separatorBuilder: (context, index) => const SizedBox(width: 8),
              itemBuilder: (context, idx) {
                final tab = offerTabs[idx];
                final isSelected = tab == _selectedTab;
                return InkWell(
                  onTap: () => setState(() => _selectedTab = tab),
                  borderRadius: BorderRadius.circular(10),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color:
                          isSelected ? const Color(0xFFFFF7ED) : Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFFEA580C)
                            : const Color(0xFFE2E8F0),
                        width: isSelected ? 1.4 : 1.0,
                      ),
                    ),
                    child: Center(
                      child: Text(
                        tab,
                        style: TextStyle(
                          color: isSelected
                              ? const Color(0xFFEA580C)
                              : const Color(0xFF64748B),
                          fontSize: 12.5,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 14),
        ],

        // Horizontal Cards Carousel
        SizedBox(
          height: 175,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: displayList.length,
            separatorBuilder: (context, index) => const SizedBox(width: 14),
            itemBuilder: (context, idx) {
              final offer = displayList[idx];
              return _buildOfferCard(offer);
            },
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildOfferCard(OfferItem offer) {
    final cardWidth = MediaQuery.of(context).size.width * 0.78;

    return InkWell(
      onTap: () => _handleOfferTap(offer),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: cardWidth.clamp(260.0, 320.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withValues(alpha: 0.05),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background Image
              if (offer.resolvedImageUrl.isNotEmpty)
                CachedNetworkImage(
                  imageUrl: offer.resolvedImageUrl,
                  fit: BoxFit.cover,
                  placeholder: (context, url) =>
                      Container(color: const Color(0xFFF1F5F9)),
                  errorWidget: (context, url, error) => Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)],
                      ),
                    ),
                  ),
                )
              else
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1E40AF), Color(0xFF1E3A8A)],
                    ),
                  ),
                ),

              // Gradient Overlay at the bottom for text contrast
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.25),
                      Colors.black.withValues(alpha: 0.84),
                    ],
                    stops: const [0.35, 0.65, 1.0],
                  ),
                ),
              ),

              // Top Badge Pill
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.92),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    offer.badge.isNotEmpty
                        ? offer.badge.toUpperCase()
                        : offer.category.toUpperCase(),
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ),

              // Bottom Content
              Positioned(
                left: 14,
                right: 14,
                bottom: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      offer.discount,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16.5,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.2,
                        shadows: [
                          Shadow(
                            blurRadius: 6,
                            color: Colors.black,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      offer.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        shadows: const [
                          Shadow(
                            blurRadius: 4,
                            color: Colors.black,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1864E8),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'USE CODE: ${offer.code}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.4,
                        ),
                      ),
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

