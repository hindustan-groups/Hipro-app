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
      iconName: json['icon'] ?? 'terrain',
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

  static List<AdventureCategory> get defaultCategories => const [
        AdventureCategory(
          id: 'cat_air_sports',
          name: 'Air Sports',
          slug: 'air-sports',
          tagline: 'Paragliding, Paramotor & Skydiving',
          iconName: 'paragliding',
          color: Color(0xFF0284C7),
          imageUrl:
              'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=800&q=80',
          count: 3,
        ),
        AdventureCategory(
          id: 'cat_desert_safari',
          name: 'Desert Safari',
          slug: 'desert-safari',
          tagline: 'Dune Bashing, Camel Ride & Desert Camps',
          iconName: 'wb_sunny',
          color: Color(0xFFD97706),
          imageUrl:
              'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
          count: 2,
        ),
        AdventureCategory(
          id: 'cat_water_sports',
          name: 'Water Sports',
          slug: 'water-sports',
          tagline: 'River Rafting, Kayaking & Cliff Jumps',
          iconName: 'water',
          color: Color(0xFF0D9488),
          imageUrl:
              'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=800&q=80',
          count: 2,
        ),
        AdventureCategory(
          id: 'cat_adventure',
          name: 'Adventure',
          slug: 'adventure',
          tagline: 'Bungee Jumping, Trekking & Ziplining',
          iconName: 'terrain',
          color: Color(0xFFE11D48),
          imageUrl:
              'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
          count: 2,
        ),
        AdventureCategory(
          id: 'cat_sightseeing',
          name: 'Sightseeing',
          slug: 'sightseeing',
          tagline: 'Scenic Mountain & Heritage Excursions',
          iconName: 'explore',
          color: Color(0xFF7C3AED),
          imageUrl:
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          count: 1,
        ),
      ];
}

