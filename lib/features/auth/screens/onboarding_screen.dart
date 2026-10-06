import 'package:flutter/material.dart';

import '../../../core/widgets/construction_illustration.dart';
import '../../../core/widgets/hipro_logo.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goToLogin() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _currentPage == 0 ? const Color(0xFF1358D8) : Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                children: [
                  _buildFirstSlide(),
                  _buildSecondSlide(),
                ],
              ),
            ),
            _buildBottomBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildFirstSlide() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1565D8), Color(0xFF0E439B)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 16),
          // Top Architectural Construction Illustration
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: ConstructionIllustration(height: 220, isDark: true),
          ),

          const Spacer(flex: 1),

          // Center Brand Logo & Taglines
          const HiproLogo(size: 46, isLight: true, fontSize: 26),
          const SizedBox(height: 18),
          const Text(
            'Your Construction &\nService Partner',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
              height: 1.25,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Inspect  •  Plan  •  Build  •  Grow',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF93C5FD),
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),

          const Spacer(flex: 2),

          // Bottom City Skyline Silhouette
          const CitySkylineIllustration(height: 90, isDark: true),
        ],
      ),
    );
  }

  Widget _buildSecondSlide() {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          const SizedBox(height: 16),
          // Top Hipro Brand Logo
          const HiproLogo(size: 46, isLight: false, fontSize: 26),
          const SizedBox(height: 16),
          const Text(
            'Professional Services\nfor a Better Tomorrow',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 22,
              fontWeight: FontWeight.w800,
              height: 1.3,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 24),

          // 4 Key Value Pillars (2x2 Grid)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildFeatureCard(
                        icon: Icons.groups_rounded,
                        title: 'Expert\nTeam',
                        bgColor: const Color(0xFFEBF2FE),
                        iconColor: const Color(0xFF1864E8),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _buildFeatureCard(
                        icon: Icons.verified_rounded,
                        title: 'Quality\nWork',
                        bgColor: const Color(0xFFE6FAF5),
                        iconColor: const Color(0xFF0D9488),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _buildFeatureCard(
                        icon: Icons.schedule_rounded,
                        title: 'On-Time\nDelivery',
                        bgColor: const Color(0xFFFEF5E7),
                        iconColor: const Color(0xFFF59E0B),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: _buildFeatureCard(
                        icon: Icons.handshake_rounded,
                        title: 'Trusted\nPartner',
                        bgColor: const Color(0xFFF8EEFE),
                        iconColor: const Color(0xFF8B5CF6),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const Spacer(),

          // Bottom Vector City Skyline with Crane
          const CitySkylineIllustration(height: 110, isDark: false),
        ],
      ),
    );
  }

  Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required Color bgColor,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: bgColor.withValues(alpha: 0.8)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 13,
              fontWeight: FontWeight.w700,
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    final isDark = _currentPage == 0;
    return Container(
      padding: const EdgeInsets.fromLTRB(28, 8, 28, 28),
      color: isDark ? const Color(0xFF0E439B) : Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Dot Indicators
          Row(
            children: List.generate(2, (index) {
              final isSelected = index == _currentPage;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: const EdgeInsets.only(right: 6),
                height: 7,
                width: isSelected ? 24 : 7,
                decoration: BoxDecoration(
                  color: isSelected
                      ? (isDark ? Colors.white : const Color(0xFF1864E8))
                      : (isDark
                          ? Colors.white.withValues(alpha: 0.35)
                          : const Color(0xFFCBD5E1)),
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }),
          ),
          // Action Button
          if (_currentPage == 0)
            TextButton(
              onPressed: () => _pageController.nextPage(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOut,
              ),
              style: TextButton.styleFrom(
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Row(
                children: [
                  Text(
                    'Next',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            )
          else
            ElevatedButton(
              onPressed: _goToLogin,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1864E8),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 13),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                elevation: 0,
              ),
              child: const Row(
                children: [
                  Text(
                    'Get Started',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                  SizedBox(width: 6),
                  Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
