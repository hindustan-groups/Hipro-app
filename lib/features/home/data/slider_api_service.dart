import 'package:flutter/material.dart';
import '../models/banner_slide.dart';

class SliderApiService {
  // Mock remote endpoint delay (replace with real Dio/Http call if you have a backend)
  Future<List<BannerSlide>> fetchSliders() async {
    await Future.delayed(const Duration(milliseconds: 600));

    return [
      const BannerSlide(
        id: 'slide_1',
        badgeText: 'HOT OFFER 🔥',
        title: 'Quality Construction\nBetter Tomorrow',
        subtitle: 'Get 15% off on complete home structural renovations',
        buttonText: 'Explore Services',
        actionType: SlideActionType.switchTab,
        targetTabIndex: 1, // Services tab
        imageUrl:
            'https://images.unsplash.com/photo-1541888946425-d0fbb18015f6?auto=format&fit=crop&w=500&q=80',
        gradientColors: [Color(0xFF0F172A), Color(0xFF1E3A8A)],
      ),
      const BannerSlide(
        id: 'slide_2',
        badgeText: 'FREE INSPECTION 🔍',
        title: 'Book Structural\nSite Inspection',
        subtitle: 'Certified civil engineers at your doorstep within 24 hours',
        buttonText: 'Book Now',
        actionType: SlideActionType.openInspection,
        imageUrl:
            'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=500&q=80',
        gradientColors: [Color(0xFF1E1B4B), Color(0xFF4338CA)],
      ),
      const BannerSlide(
        id: 'slide_3',
        badgeText: 'NEW TECH 🏗️',
        title: 'Modular Steel &\nPrecast Roofing',
        subtitle: 'Save up to 40% construction time with hi-tech steel structures',
        buttonText: 'Explore Services',
        actionType: SlideActionType.switchTab,
        targetTabIndex: 1, // Services tab
        imageUrl:
            'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=500&q=80',
        gradientColors: [Color(0xFF064E3B), Color(0xFF059669)],
      ),
      const BannerSlide(
        id: 'slide_4',
        badgeText: 'INSTANT QUOTE ⚡',
        title: 'Transparent Pricing\nZero Hidden Cost',
        subtitle: 'Generate customized estimations in under 2 minutes',
        buttonText: 'Get Quote',
        actionType: SlideActionType.switchTab,
        targetTabIndex: 3, // Quotations tab
        imageUrl:
            'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=500&q=80',
        gradientColors: [Color(0xFF4C0519), Color(0xFF9F1239)],
      ),
    ];
  }
}
