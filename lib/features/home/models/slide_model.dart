class SlideItem {
  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String targetRoute;
  final String badgeText;
  final String section;
  final int order;
  final bool isActive;

  const SlideItem({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.targetRoute,
    this.badgeText = '',
    this.section = 'services',
    this.order = 0,
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

  factory SlideItem.fromJson(Map<String, dynamic> json) {
    return SlideItem(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      subtitle: (json['subtitle'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      targetRoute:
          (json['targetRoute'] ?? json['route'] ?? 'create_inspection')
              .toString(),
      badgeText: (json['badgeText'] ?? json['badge'] ?? '').toString(),
      section: (json['section'] ?? 'services').toString(),
      order: (json['order'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] == null ? true : (json['isActive'] == true),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'imageUrl': imageUrl,
      'targetRoute': targetRoute,
      'badgeText': badgeText,
      'section': section,
      'order': order,
      'isActive': isActive,
    };
  }
}
