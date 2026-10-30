import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/widgets/review_modal_sheet.dart';
import '../data/ent_api_service.dart';
import '../models/experience_model.dart';
import '../widgets/experience_booking_sheet.dart';

class ExperienceDetailsScreen extends StatefulWidget {
  final ExperienceItem experience;

  const ExperienceDetailsScreen({
    super.key,
    required this.experience,
  });

  @override
  State<ExperienceDetailsScreen> createState() => _ExperienceDetailsScreenState();
}

class _ExperienceDetailsScreenState extends State<ExperienceDetailsScreen> {
  int _activePhotoIndex = 0;
  late ExperienceItem _currentExperience;
  List<dynamic> _reviews = [];
  bool _loadingReviews = true;

  @override
  void initState() {
    super.initState();
    _currentExperience = widget.experience;
    _fetchLiveDetails();
    _fetchReviews();
  }

  Future<void> _fetchLiveDetails() async {
    try {
      final updated = await EntApiService().fetchExperienceDetails(widget.experience.id);
      if (updated != null && mounted) {
        setState(() {
          _currentExperience = updated;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchReviews() async {
    try {
      final reviews = await EntApiService().fetchReviews(widget.experience.id);
      if (mounted) {
        setState(() {
          _reviews = reviews;
          _loadingReviews = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingReviews = false);
    }
  }

  void _showAddReviewModal() {
    ReviewModalSheet.show(
      context,
      itemName: _currentExperience.title,
      hintText: 'Share your adventure experience...',
      onSubmit: ({
        required String reviewerName,
        required int rating,
        required String comment,
      }) async {
        return await EntApiService().submitReview(
          entId: _currentExperience.id,
          userName: reviewerName,
          rating: rating,
          comment: comment,
        );
      },
      onSuccess: () {
        _fetchReviews();
        _fetchLiveDetails();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final exp = _currentExperience;
    final photos = exp.galleryImages.isNotEmpty ? exp.galleryImages : [exp.imageUrl];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // Collapsible Image Header
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: Colors.white,
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.black.withValues(alpha: 0.5),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    itemCount: photos.length,
                    onPageChanged: (i) => setState(() => _activePhotoIndex = i),
                    itemBuilder: (context, i) {
                      return CachedNetworkImage(
                        imageUrl: photos[i],
                        fit: BoxFit.cover,
                        errorWidget: (_, _, _) => Container(
                          color: const Color(0xFF1E293B),
                          child: const Icon(Icons.broken_image_rounded, color: Colors.white54, size: 48),
                        ),
                      );
                    },
                  ),
                  // Dark Vignette
                  Positioned.fill(
                    child: Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Color(0x66000000),
                            Colors.transparent,
                            Color(0x99000000),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Photo indicator
                  if (photos.length > 1)
                    Positioned(
                      bottom: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${_activePhotoIndex + 1} / ${photos.length}',
                          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  // Badge
                  Positioned(
                    bottom: 16,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1864E8),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        exp.badge,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Details Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // City and Category Tag
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          exp.category.toUpperCase(),
                          style: const TextStyle(color: Color(0xFF1864E8), fontSize: 11, fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFF64748B)),
                      const SizedBox(width: 3),
                      Text(
                        exp.city,
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 12.5, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Title
                  Text(
                    exp.title,
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    exp.tagline,
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 13.5, height: 1.4),
                  ),

                  const SizedBox(height: 16),

                  // Rating and Duration Strip
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 20),
                            const SizedBox(width: 4),
                            Text(
                              '${exp.rating}',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                            ),
                            Text(
                              ' (${exp.reviewsCount} reviews)',
                              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                            ),
                          ],
                        ),
                        Container(height: 20, width: 1, color: const Color(0xFFE2E8F0)),
                        Row(
                          children: [
                            const Icon(Icons.schedule_rounded, color: Color(0xFF1864E8), size: 18),
                            const SizedBox(width: 6),
                            Text(
                              exp.duration,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Exact Location
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1864E8).withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.pin_drop_rounded, color: Color(0xFF1864E8), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Activity Base Location', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                              const SizedBox(height: 2),
                              Text(
                                exp.locationDetails,
                                style: const TextStyle(color: Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 22),

                  // Inclusions
                  const Text(
                    'What is Included in Your Experience',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: exp.inclusions.map((inc) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  inc,
                                  style: const TextStyle(color: Color(0xFF334155), fontSize: 13, height: 1.35),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),

                  const SizedBox(height: 22),

                  // Safety Guidelines
                  const Text(
                    'Safety & Traveler Guidelines',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Column(
                      children: exp.safetyGuidelines.map((g) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.shield_outlined, color: Color(0xFFB45309), size: 17),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  g,
                                  style: const TextStyle(color: Color(0xFF78350F), fontSize: 12.5, height: 1.35),
                                ),
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ),

                  const SizedBox(height: 22),

                  // Customer Reviews Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Customer Reviews',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                      ),
                      TextButton.icon(
                        onPressed: _showAddReviewModal,
                        icon: const Icon(Icons.edit_note_rounded, size: 16, color: Color(0xFF1864E8)),
                        label: const Text('Write Review', style: TextStyle(color: Color(0xFF1864E8), fontWeight: FontWeight.bold, fontSize: 12.5)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (_loadingReviews)
                    const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF1864E8))))
                  else if (_reviews.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: const Text('No reviews yet. Be the first to review!', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                    )
                  else
                    Column(
                      children: _reviews.map((r) {
                        final rRating = (r['rating'] is num) ? (r['rating'] as num).toInt() : 5;
                        final rName = r['userName']?.toString() ?? 'Adventurer';
                        final rComment = r['comment']?.toString() ?? '';

                        return ReviewCard(
                          reviewerName: rName,
                          rating: rRating,
                          comment: rComment,
                        );
                      }).toList(),
                    ),

                  const SizedBox(height: 90), // Bottom padding for sticky button
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom Sticky Booking Action Bar
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Price per person', style: TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                  const SizedBox(height: 1),
                  Row(
                    children: [
                      Text(
                        '₹${exp.startingPrice.toStringAsFixed(0)}',
                        style: const TextStyle(color: Color(0xFF0F172A), fontSize: 20, fontWeight: FontWeight.w900),
                      ),
                      if (exp.originalPrice != null) ...[
                        const SizedBox(width: 6),
                        Text(
                          '₹${exp.originalPrice!.toStringAsFixed(0)}',
                          style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 13,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: () {
                  ExperienceBookingSheet.show(context, experience: exp);
                },
                icon: const Icon(Icons.flash_on_rounded, size: 18),
                label: const Text('Book Activity', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1864E8),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
