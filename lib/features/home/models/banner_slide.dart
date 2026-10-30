import 'package:flutter/material.dart';

enum SlideActionType {
  switchTab,
  openInspection,
  openUrl,
}

class BannerSlide {
  final String id;
  final String title;
  final String subtitle;
  final String badgeText;
  final String imageUrl;
  final String buttonText;
  final SlideActionType actionType;
  final int? targetTabIndex;
  final List<Color> gradientColors;

  const BannerSlide({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.badgeText,
    required this.imageUrl,
    required this.buttonText,
    this.actionType = SlideActionType.switchTab,
    this.targetTabIndex,
    this.gradientColors = const [Color(0xFF0F172A), Color(0xFF1E3A8A)],
  });

  factory BannerSlide.fromJson(Map<String, dynamic> json) {
    return BannerSlide(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      badgeText: json['badgeText'] as String? ?? json['badgetext'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      buttonText: json['buttonText'] as String? ?? 'Learn More',
      targetTabIndex: json['targetTabIndex'] as int?,
      actionType: SlideActionType.values.firstWhere(
        (e) => e.name.toLowerCase() == (json['actionType'] as String? ?? '').toLowerCase(),
        orElse: () => SlideActionType.switchTab,
      ),
      gradientColors: (json['gradientHexList'] as List<dynamic>?)
              ?.map((hex) => Color(int.parse(hex.toString())))
              .toList() ??
          const [Color(0xFF0F172A), Color(0xFF1E3A8A)],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'badgeText': badgeText,
      'imageUrl': imageUrl,
      'buttonText': buttonText,
      'actionType': actionType.name,
      'targetTabIndex': targetTabIndex,
      'gradientHexList': gradientColors
          .map((c) => '0x${c.toARGB32().toRadixString(16)}')
          .toList(),
    };
  }
}