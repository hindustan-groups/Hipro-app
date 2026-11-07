enum ActivityCategory { adventure, waterSports, desertSafari, airSports, sightSeeing }

class ExperienceItem {
  final String id;
  final String title;
  final String tagline;
  final String city;
  final String locationDetails;
  final String categoryId;
  final String category;
  final double rating;
  final int reviewsCount;
  final double startingPrice;
  final double? originalPrice;
  final String duration;
  final String imageUrl;
  final List<String> galleryImages;
  final List<String> inclusions;
  final List<String> safetyGuidelines;
  final List<String> availableTimeSlots;
  final String badge;
  final bool isFeatured;

  const ExperienceItem({
    required this.id,
    required this.title,
    required this.tagline,
    required this.city,
    required this.locationDetails,
    this.categoryId = '',
    required this.category,
    required this.rating,
    required this.reviewsCount,
    required this.startingPrice,
    this.originalPrice,
    required this.duration,
    required this.imageUrl,
    this.galleryImages = const [],
    this.inclusions = const [],
    this.safetyGuidelines = const [],
    this.availableTimeSlots = const [],
    this.badge = '',
    this.isFeatured = false,
  });

  factory ExperienceItem.fromJson(Map<String, dynamic> json) {
    return ExperienceItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      tagline: json['tagline'] ?? '',
      city: json['city'] ?? '',
      locationDetails: json['locationDetails'] ?? '',
      categoryId: json['categoryId'] ?? json['category_id'] ?? '',
      category: json['category'] ?? '',
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : 0.0,
      reviewsCount: (json['reviewsCount'] is num) ? (json['reviewsCount'] as num).toInt() : 0,
      startingPrice: (json['startingPrice'] is num) ? (json['startingPrice'] as num).toDouble() : 0.0,
      originalPrice: (json['originalPrice'] is num) ? (json['originalPrice'] as num).toDouble() : null,
      duration: json['duration'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      galleryImages: (json['gallery'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          (json['galleryImages'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          const [],
      inclusions: (json['inclusions'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      safetyGuidelines: (json['safetyGuidelines'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      availableTimeSlots: (json['slots'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          (json['availableTimeSlots'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          const [],
      badge: json['discountBadge'] ?? json['badge'] ?? '',
      isFeatured: json['isFeatured'] ?? false,
    );
  }
}

class ExperienceBookingModel {
  final String bookingId;
  final String experienceId;
  final String experienceTitle;
  final String city;
  final String locationDetails;
  String get location => locationDetails;
  final String selectedDate;
  final String selectedTimeSlot;
  final int guestCount;
  final double perPersonPrice;
  final double totalPrice;
  final String customerName;
  final String customerPhone;
  final DateTime bookedAt;
  final String status;

  ExperienceBookingModel({
    required this.bookingId,
    required this.experienceId,
    required this.experienceTitle,
    required this.city,
    String? locationDetails,
    String? location,
    required this.selectedDate,
    required this.selectedTimeSlot,
    required this.guestCount,
    required this.perPersonPrice,
    required this.totalPrice,
    required this.customerName,
    required this.customerPhone,
    DateTime? bookedAt,
    this.status = 'CONFIRMED',
  })  : locationDetails = locationDetails ?? location ?? '',
        bookedAt = bookedAt ?? DateTime.now();
}
