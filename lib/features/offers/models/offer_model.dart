class OfferItem {
  final String id;
  final String title;
  final String subtitle;
  final String category;
  final String section;
  final String discount;
  final String code;
  final String badge;
  final String imageUrl;
  final double minAmount;
  final String validTill;
  final String targetRoute;
  final String terms;
  final bool isActive;

  const OfferItem({
    required this.id,
    required this.title,
    required this.subtitle,
    this.category = 'Trending',
    this.section = 'services',
    required this.discount,
    required this.code,
    this.badge = '',
    required this.imageUrl,
    this.minAmount = 0,
    this.validTill = 'Limited Period',
    this.targetRoute = 'create_inspection',
    this.terms = 'Standard terms & conditions apply.',
    this.isActive = true,
  });

  String get resolvedImageUrl {
    if (imageUrl.isEmpty) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    const base = 'https://app.hindustanprojects.in';
    return imageUrl.startsWith('/') ? '$base$imageUrl' : '$base/$imageUrl';
  }

  factory OfferItem.fromJson(Map<String, dynamic> json) {
    return OfferItem(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      subtitle: (json['subtitle'] ?? '').toString(),
      category: (json['category'] ?? 'Trending').toString(),
      section: (json['section'] ?? 'services').toString(),
      discount: (json['discount'] ?? 'SPECIAL OFFER').toString(),
      code: (json['code'] ?? '').toString().toUpperCase(),
      badge: (json['badge'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      minAmount: (json['minAmount'] as num?)?.toDouble() ?? 0.0,
      validTill: (json['validTill'] ?? 'Limited Period').toString(),
      targetRoute:
          (json['targetRoute'] ?? json['route'] ?? 'create_inspection')
              .toString(),
      terms: (json['terms'] ?? 'Standard terms & conditions apply.').toString(),
      isActive: json['isActive'] == null ? true : (json['isActive'] == true),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'category': category,
      'section': section,
      'discount': discount,
      'code': code,
      'badge': badge,
      'imageUrl': imageUrl,
      'minAmount': minAmount,
      'validTill': validTill,
      'targetRoute': targetRoute,
      'terms': terms,
      'isActive': isActive,
    };
  }
}

class AppliedCoupon {
  final String code;
  final String title;
  final String discount;
  final String section;
  final double discountAmount;
  final double originalAmount;
  final double finalAmount;
  final String terms;

  const AppliedCoupon({
    required this.code,
    required this.title,
    required this.discount,
    this.section = 'services',
    required this.discountAmount,
    required this.originalAmount,
    required this.finalAmount,
    this.terms = '',
  });

  factory AppliedCoupon.fromJson(Map<String, dynamic> json) {
    return AppliedCoupon(
      code: (json['code'] ?? '').toString().toUpperCase(),
      title: (json['title'] ?? '').toString(),
      discount: (json['discount'] ?? '').toString(),
      section: (json['section'] ?? 'services').toString(),
      discountAmount: (json['discountAmount'] as num?)?.toDouble() ?? 0.0,
      originalAmount: (json['originalAmount'] as num?)?.toDouble() ?? 0.0,
      finalAmount: (json['finalAmount'] as num?)?.toDouble() ?? 0.0,
      terms: (json['terms'] ?? '').toString(),
    );
  }
}
