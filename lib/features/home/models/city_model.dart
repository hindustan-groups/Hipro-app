class CityItem {
  final String id;
  final String name;
  final String state;
  final String tagline;
  final String imageUrl;
  final bool isActive;
  final int partnerCount;
  final int serviceCount;
  final String? badge;

  const CityItem({
    required this.id,
    required this.name,
    required this.state,
    required this.tagline,
    required this.imageUrl,
    this.isActive = true,
    this.partnerCount = 0,
    this.serviceCount = 0,
    this.badge,
  });

  factory CityItem.fromJson(Map<String, dynamic> json) {
    return CityItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      state: json['state']?.toString() ?? 'Rajasthan',
      tagline: json['tagline']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      isActive: json['isActive'] ?? true,
      partnerCount: (json['partnerCount'] as num?)?.toInt() ?? 0,
      serviceCount: (json['serviceCount'] as num?)?.toInt() ?? 0,
      badge: json['badge']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'state': state,
      'tagline': tagline,
      'imageUrl': imageUrl,
      'isActive': isActive,
      'partnerCount': partnerCount,
      'serviceCount': serviceCount,
      if (badge != null) 'badge': badge,
    };
  }
}

class PartnerItem {
  final String id;
  final String name;
  final String phone;
  final String role;
  final String city;
  final int experienceYears;
  final double rating;
  final int completedJobs;
  final String? badge;
  final String photo;
  final List<String> specialties;

  const PartnerItem({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    required this.city,
    this.experienceYears = 5,
    this.rating = 4.9,
    this.completedJobs = 100,
    this.badge,
    required this.photo,
    this.specialties = const [],
  });

  factory PartnerItem.fromJson(Map<String, dynamic> json) {
    return PartnerItem(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: json['role']?.toString() ?? 'Inspection Specialist',
      city: json['city']?.toString() ?? 'Udaipur',
      experienceYears: (json['experienceYears'] as num?)?.toInt() ?? 5,
      rating: (json['rating'] as num?)?.toDouble() ?? 4.9,
      completedJobs: (json['completedJobs'] as num?)?.toInt() ?? 100,
      badge: json['badge']?.toString(),
      photo: json['photo']?.toString() ?? '',
      specialties: (json['specialties'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'role': role,
      'city': city,
      'experienceYears': experienceYears,
      'rating': rating,
      'completedJobs': completedJobs,
      if (badge != null) 'badge': badge,
      'photo': photo,
      'specialties': specialties,
    };
  }
}

