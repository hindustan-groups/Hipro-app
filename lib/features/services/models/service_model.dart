import 'dart:convert';
import 'package:flutter/material.dart';

class ServiceChargeItem {
  final String title;
  final double amount;
  final bool isFree;
  final String? subtitle;

  const ServiceChargeItem({
    required this.title,
    required this.amount,
    this.isFree = false,
    this.subtitle,
  });

  factory ServiceChargeItem.fromJson(Map<String, dynamic> json) {
    final amt = (json['amount'] is num)
        ? (json['amount'] as num).toDouble()
        : (double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0);
    final isFreeVal = json['isFree'] == true || (amt == 0 && json['isFree'] != false);
    return ServiceChargeItem(
      title: json['title']?.toString() ??
          json['name']?.toString() ??
          json['label']?.toString() ??
          'Additional Fee',
      amount: amt,
      isFree: isFreeVal,
      subtitle: json['subtitle']?.toString() ?? json['desc']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'amount': amount,
      'isFree': isFree,
      if (subtitle != null) 'subtitle': subtitle,
    };
  }
}

class SubService {
  final String id;
  final String name;
  final String? titleHi;
  final String desc;
  final String? image;
  final double visitingCharge;
  final List<ServiceChargeItem> additionalCharges;
  final bool bookNowEnabled;
  final bool getQuoteEnabled; 
  final bool isActive;
  final String defaultNotes;
  final List<String> checklist;
  final List<dynamic> requiredFields;

  const SubService({
    required this.id,
    required this.name,
    this.titleHi,
    required this.desc,
    this.image,
    this.visitingCharge = 199.0,
    this.additionalCharges = const [],
    this.bookNowEnabled = true,
    this.getQuoteEnabled = true,
    this.isActive = true,
    this.defaultNotes = '',
    this.checklist = const [],
    this.requiredFields = const [],
  });

  double get totalAmount {
    double total = visitingCharge;
    for (var c in additionalCharges) {
      if (!c.isFree) total += c.amount;
    }
    return total;
  }

  bool get supportsInstant => isActive && bookNowEnabled;
  bool get supportsQuotable => isActive && getQuoteEnabled;

  factory SubService.fromJson(Map<String, dynamic> json) {
    bool parseBool(dynamic val, {bool defaultValue = true}) {
      if (val == null) return defaultValue;
      if (val is bool) return val;
      if (val is num) return val != 0;
      if (val is String) {
        final s = val.trim().toLowerCase();
        if (s == 'true' || s == '1') return true;
        if (s == 'false' || s == '0') return false;
      }
      return defaultValue;
    }

    List<dynamic> parsedRequiredFields = [];
    final rawRf = json['requiredFields'] ?? json['customFields'] ?? json['questions'];
    if (rawRf is List) {
      parsedRequiredFields = List<dynamic>.from(rawRf);
    } else if (rawRf is String && rawRf.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(rawRf);
        if (decoded is List) {
          parsedRequiredFields = List<dynamic>.from(decoded);
        } else if (decoded is Map) {
          parsedRequiredFields = [decoded];
        }
      } catch (_) {}
    } else if (rawRf is Map) {
      parsedRequiredFields = [rawRf];
    }

    List<ServiceChargeItem> parsedCharges = [];

    final rawCharges = json['additionalCharges'] ?? json['charges'] ?? json['feeBreakdown'];
    if (rawCharges is List) {
      for (var c in rawCharges) {
        if (c is Map) parsedCharges.add(ServiceChargeItem.fromJson(Map<String, dynamic>.from(c)));
      }
    } else if (json['requiredFields'] is Map) {
      final rf = json['requiredFields'] as Map;
      final cList = rf['charges'] ?? rf['additionalCharges'] ?? rf['fees'];
      if (cList is List) {
        for (var c in cList) {
          if (c is Map) parsedCharges.add(ServiceChargeItem.fromJson(Map<String, dynamic>.from(c)));
        }
      }
    }

    // Extract any charge items from requiredFields
    for (var f in parsedRequiredFields) {
      if (f is Map &&
          (f['fieldType'] == 'charge' || f['fieldType'] == 'fee' || f['isCharge'] == true)) {
        parsedCharges.add(ServiceChargeItem.fromJson(Map<String, dynamic>.from(f)));
      }
    }

    // Customer questions (excluding internal charge items)
    final actualQuestions = parsedRequiredFields.where((f) {
      if (f is Map) {
        final type = f['fieldType']?.toString().toLowerCase();
        if (type == 'charge' || type == 'fee' || f['isCharge'] == true) return false;
      }
      return true;
    }).toList();

    return SubService(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? json['titleEn']?.toString() ?? '',
      titleHi: json['titleHi']?.toString(),
      desc: json['desc']?.toString() ?? '',
      image: json['image']?.toString() ?? json['imageUrl']?.toString(),
      visitingCharge: (json['visitingCharge'] as num?)?.toDouble() ?? 199.0,
      additionalCharges: parsedCharges,
      bookNowEnabled: parseBool(
        json['bookNowEnabled'] ?? json['bookNow'] ?? json['isInstant'],
        defaultValue: true,
      ),
      getQuoteEnabled: parseBool(
        json['getQuoteEnabled'] ?? json['getQuote'] ?? json['isQuotable'],
        defaultValue: true,
      ),
      isActive: parseBool(json['isActive'] ?? json['active'], defaultValue: true),
      defaultNotes: json['defaultNotes']?.toString() ?? '',
      checklist: (json['checklist'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      requiredFields: actualQuestions,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'titleHi': titleHi,
      'desc': desc,
      'image': image,
      'visitingCharge': visitingCharge,
      'additionalCharges': additionalCharges.map((e) => e.toJson()).toList(),
      'bookNowEnabled': bookNowEnabled,
      'getQuoteEnabled': getQuoteEnabled,
      'isActive': isActive,
      'checklist': checklist,
      'requiredFields': requiredFields,
    };
  }
}

class ServiceCategory {
  final String id;
  final String? code;
  final String title;
  final String shortTitle;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Color bg;
  final double rating;
  final String? imageUrl;
  final String? iconImage;
  final List<SubService> subcategories;

  const ServiceCategory({
    required this.id,
    this.code,
    required this.title,
    required this.shortTitle,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.bg,
    this.rating = 4.8,
    this.imageUrl,
    this.iconImage,
    required this.subcategories,
  });

  factory ServiceCategory.fromJson(Map<String, dynamic> json) {
    final rawSubs = json['subServices'] ?? json['subcategories'];
    final img = json['imageUrl']?.toString() ?? json['iconImage']?.toString() ?? json['icon']?.toString();
    return ServiceCategory(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString(),
      title: json['name']?.toString() ?? json['title']?.toString() ?? '',
      shortTitle: json['name']?.toString() ?? json['shortTitle']?.toString() ?? '',
      subtitle: json['de']?.toString() ?? json['desc']?.toString() ?? json['description']?.toString() ?? '',
      icon: Icons.grid_view_rounded,
      color: const Color(0xFF1864E8),
      bg: const Color(0xFFEBF2FE),
      rating: (json['rating'] as num?)?.toDouble() ?? 4.8,
      imageUrl: img,
      iconImage: json['iconImage']?.toString() ?? img,
      subcategories: (rawSubs as List<dynamic>?)
              ?.map((e) => SubService.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class ServiceItem {
  final String id;
  final String? code;
  final String name;
  final String shortDescription;
  final double startingPrice;
  final double rating;
  final String unit;
  final String imageUrl;
  final List<String> includedPoints;
  final List<SubService> subServices;

  const ServiceItem({
    required this.id,
    this.code,
    required this.name,
    required this.shortDescription,
    required this.startingPrice,
    this.rating = 4.8,
    this.unit = 'visit',
    required this.imageUrl,
    this.includedPoints = const [],
    this.subServices = const [],
  });

  factory ServiceItem.fromJson(Map<String, dynamic> json) {
    final rawSubs = json['subServices'] as List<dynamic>?;
    final List<SubService> parsedSubs = rawSubs != null
        ? rawSubs.map((e) => SubService.fromJson(e as Map<String, dynamic>)).toList()
        : [];

    return ServiceItem(
      id: json['id']?.toString() ?? '',
      code: json['code']?.toString(),
      name: json['name']?.toString() ?? '',
      shortDescription: json['shortDescription']?.toString() ??
          json['desc']?.toString() ??
          json['description']?.toString() ??
          '',
      startingPrice: (json['startingPrice'] as num?)?.toDouble() ??
          (json['price'] as num?)?.toDouble() ??
          (parsedSubs.isNotEmpty ? parsedSubs.first.visitingCharge : 199.0),
      rating: (json['rating'] as num?)?.toDouble() ?? 4.8,
      unit: json['unit']?.toString() ?? 'visit',
      imageUrl: json['iconImage']?.toString() ??
          json['imageUrl']?.toString() ??
          json['icon']?.toString() ??
          '',
      includedPoints: (json['includedPoints'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      subServices: parsedSubs,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'shortDescription': shortDescription,
      'startingPrice': startingPrice,
      'rating': rating,
      'unit': unit,
      'imageUrl': imageUrl,
      'includedPoints': includedPoints,
      'subServices': subServices.map((e) => e.toJson()).toList(),
    };
  }
}
