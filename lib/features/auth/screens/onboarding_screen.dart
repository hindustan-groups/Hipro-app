import 'package:flutter/material.dart';

import '../../../core/widgets/hero_city_skyline.dart';
import '../../../core/widgets/hipro_logo.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  void _goToLogin(BuildContext context) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const SizedBox(height: 24),

            // 1. Top Brand Logo
            const Center(
              child: HiproLogo(
                size: 48,
                fontSize: 28,
              ),
            ),

            const SizedBox(height: 18),

            // 2. Headline & Subtitle
            const Text(
              'Professional Services',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.4,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'for a Better Tomorrow',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF334155),
                fontSize: 16,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.2,
              ),
            ),

            const SizedBox(height: 28),

            // 3. 4 Value Pillars in a Single Horizontal Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPillarItem(
                    icon: Icons.groups_outlined,
                    line1: 'Expert',
                    line2: 'Team',
                  ),
                  _buildPillarItem(
                    icon: Icons.verified_user_outlined,
                    line1: 'Quality',
                    line2: 'Work',
                  ),
                  _buildPillarItem(
                    icon: Icons.timer_outlined,
                    line1: 'On-Time',
                    line2: 'Delivery',
                  ),
                  _buildPillarItem(
                    icon: Icons.shield_outlined,
                    line1: 'Trusted',
                    line2: 'Partner',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 4. Hero City Skyline Landscape with Tower Crane & Polygonal Mountains
            Expanded(
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  const Positioned.fill(
                    child: HeroCitySkyline(),
                  ),

                  // Bottom Action Button
                  Positioned(
                    bottom: 24,
                    left: 24,
                    right: 24,
                    child: SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: () => _goToLogin(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1864E8),
                          foregroundColor: Colors.white,
                          elevation: 8,
                          shadowColor: const Color(0xFF1864E8).withValues(alpha: 0.4),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Get Started',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.3,
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(Icons.arrow_forward_rounded, size: 20),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPillarItem({
    required IconData icon,
    required String line1,
    required String line2,
  }) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFF1864E8),
                width: 1.6,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1864E8).withValues(alpha: 0.08),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Center(
              child: Icon(
                icon,
                color: const Color(0xFF1864E8),
                size: 22,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            line1,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 12,
              fontWeight: FontWeight.w700,
              height: 1.15,
            ),
          ),
          Text(
            line2,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }
}
