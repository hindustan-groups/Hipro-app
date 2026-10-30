import 'package:flutter/material.dart';

import '../session/user_session.dart';
import 'app_ui.dart';

/// A reusable bottom-sheet modal for submitting star ratings and text reviews.
///
/// Used by both Services (sub-service detail) and Adventures (experience detail)
/// screens. The caller provides an [onSubmit] callback that handles the
/// API call specific to that module.
class ReviewModalSheet {
  /// Shows the review bottom sheet.
  ///
  /// [itemName] – the name of the service/experience being reviewed.
  /// [hintText] – placeholder text for the comment field.
  /// [onSubmit] – async function that performs the actual API call.
  ///   Returns `true` if the review was saved successfully.
  /// [onSuccess] – optional callback fired after a successful submission
  ///   (e.g. to refresh the reviews list).
  static Future<void> show(
    BuildContext context, {
    required String itemName,
    String hintText = 'Share your experience...',
    required Future<bool> Function({
      required String reviewerName,
      required int rating,
      required String comment,
    }) onSubmit,
    VoidCallback? onSuccess,
  }) {
    int selectedRating = 5;
    final commentCtrl = TextEditingController();
    final nameCtrl = TextEditingController(text: UserSession().name ?? '');
    bool isSubmitting = false;

    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Container(
            padding: EdgeInsets.fromLTRB(
              20,
              20,
              20,
              MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Drag Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Title
                Text(
                  'Review "$itemName"',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 14),

                // Star rating row
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (idx) {
                    final star = idx + 1;
                    return IconButton(
                      icon: Icon(
                        star <= selectedRating
                            ? Icons.star_rounded
                            : Icons.star_outline_rounded,
                        color: const Color(0xFFF59E0B),
                        size: 32,
                      ),
                      onPressed: () =>
                          setModalState(() => selectedRating = star),
                    );
                  }),
                ),
                const SizedBox(height: 10),

                // Reviewer name
                TextField(
                  controller: nameCtrl,
                  decoration: InputDecoration(
                    labelText: 'Your Name',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Comment
                TextField(
                  controller: commentCtrl,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: hintText,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1864E8),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onPressed: isSubmitting
                        ? null
                        : () async {
                            final name = nameCtrl.text.trim();
                            if (name.isEmpty) {
                              AppToast.show(
                                ctx,
                                message: 'Please enter your name',
                                isError: true,
                              );
                              return;
                            }

                            setModalState(() => isSubmitting = true);

                            final success = await onSubmit(
                              reviewerName: name,
                              rating: selectedRating,
                              comment: commentCtrl.text.trim(),
                            );

                            if (!ctx.mounted) return;

                            if (success) {
                              Navigator.pop(ctx);
                              AppToast.show(
                                context,
                                message: 'Review submitted! Thank you. 🎉',
                              );
                              onSuccess?.call();
                            } else {
                              setModalState(() => isSubmitting = false);
                              AppToast.show(
                                ctx,
                                message:
                                    'Could not submit review. Please try again.',
                                isError: true,
                              );
                            }
                          },
                    child: isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Submit Review',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
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

/// A small reusable widget that displays a row of filled/outlined star icons.
/// Used in review list items across Services and Adventures.
class StarRatingBar extends StatelessWidget {
  final int rating;
  final double size;
  final Color color;

  const StarRatingBar({
    super.key,
    required this.rating,
    this.size = 14,
    this.color = const Color(0xFFF59E0B),
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (idx) {
        return Icon(
          idx < rating ? Icons.star_rounded : Icons.star_outline_rounded,
          size: size,
          color: color,
        );
      }),
    );
  }
}

/// A reusable widget that renders a single review card (name, rating, comment).
/// Used in both Adventure and Services review lists.
class ReviewCard extends StatelessWidget {
  final String reviewerName;
  final int rating;
  final String comment;

  const ReviewCard({
    super.key,
    required this.reviewerName,
    required this.rating,
    this.comment = '',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                reviewerName,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: Color(0xFF0F172A),
                ),
              ),
              StarRatingBar(rating: rating),
            ],
          ),
          if (comment.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              comment,
              style: const TextStyle(
                color: Color(0xFF475569),
                fontSize: 12.5,
                height: 1.35,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
