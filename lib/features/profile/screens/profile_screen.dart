import 'package:flutter/material.dart';

import '../../../config/constants/app_constants.dart';
import '../../../config/theme/app_colors.dart';
import '../../../core/widgets/app_ui.dart';
import '../../../main.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 118),
          children: [
            Row(
              children: [
                Text(
                  'Profile',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const Spacer(),
                AppIconButton(
                  icon: Icons.settings_outlined,
                  onPressed: () => _notReady(context),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.18),
                        width: 2,
                      ),
                    ),
                    child: const Icon(
                      Icons.person_rounded,
                      color: Colors.white,
                      size: 34,
                    ),
                  ),
                  const SizedBox(width: 15),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hipro Customer',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        SizedBox(height: 5),
                        Text(
                          'Bhilwara, Rajasthan',
                          style: TextStyle(
                            color: Color(0xFFCCFBF1),
                            fontSize: 11,
                          ),
                        ),
                        SizedBox(height: 9),
                        StatusPill(
                          label: 'VERIFIED ACCOUNT',
                          color: AppColors.accent,
                          icon: Icons.verified_rounded,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => _notReady(context),
                    icon: const Icon(Icons.edit_outlined, color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _MetricCard(
                    value: appState.requests.length.toString(),
                    label: 'Requests',
                    icon: Icons.home_repair_service_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _MetricCard(
                    value: appState.quotations.length.toString(),
                    label: 'Quotes',
                    icon: Icons.receipt_long_outlined,
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: _MetricCard(
                    value: '4.9',
                    label: 'Rating',
                    icon: Icons.star_outline_rounded,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 28),
            const SectionHeader(title: 'Account & support'),
            const SizedBox(height: 12),
            Material(
              color: AppColors.surface,
              clipBehavior: Clip.antiAlias,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: const BorderSide(color: AppColors.borderSubtle),
              ),
              child: Column(
                children: [
                  _MenuTile(
                    icon: Icons.location_on_outlined,
                    title: 'Saved addresses',
                    subtitle: 'Manage inspection locations',
                    onTap: () => _notReady(context),
                  ),
                  const Divider(height: 1, indent: 62),
                  _MenuTile(
                    icon: Icons.support_agent_rounded,
                    title: 'Customer support',
                    subtitle: AppConstants.supportPhone,
                    onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Call ${AppConstants.supportPhone} for support.',
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 1, indent: 62),
                  _MenuTile(
                    icon: Icons.shield_outlined,
                    title: 'Warranty & policies',
                    subtitle: 'Service terms and protection',
                    onTap: () => _notReady(context),
                  ),
                  const Divider(height: 1, indent: 62),
                  const _MenuTile(
                    icon: Icons.info_outline_rounded,
                    title: 'About Hipro',
                    subtitle: 'Version ${AppConstants.appVersion}',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            const Center(
              child: Text(
                'Built for better homes',
                style: TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 10,
                  letterSpacing: 0.6,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _notReady(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('This option will be available soon.')),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.value,
    required this.label,
    required this.icon,
  });

  final String value;
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primaryLight, size: 19),
          const SizedBox(height: 7),
          Text(
            value,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 9),
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 5),
      leading: Container(
        padding: const EdgeInsets.all(9),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(11),
        ),
        child: Icon(icon, color: AppColors.primaryLight, size: 19),
      ),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
      ),
      trailing: const Icon(
        Icons.chevron_right_rounded,
        color: AppColors.textMuted,
      ),
    );
  }
}
