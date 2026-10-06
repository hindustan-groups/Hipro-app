import 'package:flutter/material.dart';

class SubService {
  final String id;
  final String name;
  final String desc;
  final String defaultNotes;
  final List<String> checklist;

  const SubService({
    required this.id,
    required this.name,
    required this.desc,
    required this.defaultNotes,
    this.checklist = const [],
  });

  factory SubService.fromJson(Map<String, dynamic> json) {
    return SubService(
      id: json['id'] ?? '',
      name: json['name'] ?? json['titleEn'] ?? '',
      desc: json['desc'] ?? '',
      defaultNotes: json['defaultNotes'] ?? '',
      checklist: List<String>.from(json['checklist'] ?? []),
    );
  }
}

class ServiceCategory {
  final String id;
  final String title;
  final String shortTitle;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Color bg;
  final double rating;
  final List<SubService> subcategories;

  const ServiceCategory({
    required this.id,
    required this.title,
    required this.shortTitle,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.bg,
    this.rating = 4.8,
    required this.subcategories,
  });
}

class ServiceItem {
  final String id;
  final String name;
  final String shortDescription;
  final double startingPrice;
  final String unit;
  final String imageUrl;
  final List<String> includedPoints;

  const ServiceItem({
    required this.id,
    required this.name,
    required this.shortDescription,
    required this.startingPrice,
    this.unit = 'visit',
    required this.imageUrl,
    this.includedPoints = const [],
  });
}
