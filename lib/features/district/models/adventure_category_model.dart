import 'package:flutter/material.dart';

class AdventureCategory {
  final String id;
  final String name;
  final String slug;
  final String tagline;
  final String iconName;
  final Color color;
  final String imageUrl;
  final int count;
  final bool isActive;
  final int displayOrder;

  const AdventureCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.tagline,
    required this.iconName,
    required this.color,
    required this.imageUrl,
    this.count = 0,
    this.isActive = true,
    this.displayOrder = 0,
  });

  factory AdventureCategory.fromJson(Map<String, dynamic> json) {
    Color parseColor(dynamic val) {
      if (val is String && val.startsWith('#')) {
        final hex = val.replaceAll('#', '');
        if (hex.length == 6) {
          return Color(int.parse('FF$hex', radix: 16));
        } else if (hex.length == 8) {
          return Color(int.parse(hex, radix: 16));
        }
      }
      return const Color(0xFFE11D48);
    }

    final rawCount = json['activitiesCount'] ?? json['count'] ?? 0;
    final int count = (rawCount is num) ? rawCount.toInt() : int.tryParse('$rawCount') ?? 0;

    return AdventureCategory(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      slug: json['slug'] ?? '',
      tagline: json['tagline'] ?? '',
      iconName: json['icon'] ?? '',
      color: parseColor(json['color']),
      imageUrl: json['imageUrl'] ?? '',
      count: count,
      isActive: json['isActive'] ?? true,
      displayOrder: json['displayOrder'] ?? 0,
    );
  }

  IconData get iconData {
    switch (iconName.toLowerCase()) {
      case 'paragliding':
      case 'airsports':
      case 'air_sports':
        return Icons.paragliding_rounded;
      case 'wb_sunny':
      case 'desert':
      case 'desertsafari':
      case 'desert_safari':
        return Icons.wb_sunny_rounded;
      case 'water':
      case 'watersports':
      case 'water_sports':
        return Icons.water_rounded;
      case 'terrain':
      case 'adventure':
        return Icons.terrain_rounded;
      case 'explore':
      case 'sightseeing':
        return Icons.explore_rounded;
      default:
        return Icons.local_activity_rounded;
    }
  }
}

