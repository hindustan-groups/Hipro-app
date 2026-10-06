import 'package:flutter/material.dart';

import '../../../config/theme/app_colors.dart';
import '../../../core/widgets/app_ui.dart';
import '../../../main.dart';
import '../../inspections/models/request_model.dart';
import '../../services/models/service_model.dart';
import '../../services/screens/create_inspection_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final requests = appState.requests;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 0),
              sliver: SliverToBoxAdapter(child: _topBar(context)),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 0),
              sliver: SliverToBoxAdapter(child: _searchHero(context)),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
              sliver: const SliverToBoxAdapter(child: _TrustStrip()),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 0),
              sliver: const SliverToBoxAdapter(child: _PromoBanner()),
            ),
            if (requests.isNotEmpty) ...[
              const SliverPadding(
                padding: EdgeInsets.fromLTRB(18, 28, 18, 12),
                sliver: SliverToBoxAdapter(
                  child: SectionHeader(
                    title: 'Your bookings',
                    subtitle: 'Track inspections and active work',
                    actionLabel: 'See all',
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 174,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    scrollDirection: Axis.horizontal,
                    itemCount: requests.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 12),
                    itemBuilder: (_, index) =>
                        _RequestCard(request: requests[index]),
                  ),
                ),
              ),
            ],
            const SliverPadding(
              padding: EdgeInsets.fromLTRB(18, 28, 18, 12),
              sliver: SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'Popular services',
                  subtitle: 'Great value from verified professionals',
                  actionLabel: 'View all',
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 118),
              sliver: SliverGrid.builder(
                itemCount: appState.categories.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.88,
                ),
                itemBuilder: (_, index) => _ServiceCard(
                  category: appState.categories[index],
                  discount: index.isEven ? '20% OFF' : 'BEST VALUE',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _topBar(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: HiproMark()),
        InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {},
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: const Row(
              children: [
                Icon(
                  Icons.location_on_rounded,
                  size: 15,
                  color: AppColors.accent,
                ),
                SizedBox(width: 4),
                Text(
                  'Bhilwara',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                ),
                SizedBox(width: 2),
                Icon(Icons.keyboard_arrow_down_rounded, size: 16),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        AppIconButton(
          icon: Icons.notifications_none_rounded,
          badge: true,
          onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You have no new notifications.')),
          ),
        ),
      ],
    );
  }

  Widget _searchHero(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.brandGradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.2),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(
                Icons.local_offer_rounded,
                color: Color(0xFFFFD5E7),
                size: 17,
              ),
              SizedBox(width: 7),
              Text(
                'FREE DIGITAL ESTIMATE',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.7,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Repair smarter.\nLive better.',
            style: Theme.of(context).textTheme.headlineMedium
                ?.copyWith(color: Colors.white, height: 1.08),
          ),
          const SizedBox(height: 8),
          const Text(
            'Compare expert solutions and get clear pricing before work begins.',
            style: TextStyle(
              color: Color(0xFFE8E9FF),
              fontSize: 12,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 14,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              children: [
                const _SearchField(
                  icon: Icons.home_repair_service_outlined,
                  label: 'SERVICE OR PROBLEM',
                  value: 'What needs fixing?',
                ),
                const Divider(height: 18),
                const Row(
                  children: [
                    Expanded(
                      child: _SearchField(
                        icon: Icons.location_on_outlined,
                        label: 'LOCATION',
                        value: 'Bhilwara',
                      ),
                    ),
                    SizedBox(height: 40, child: VerticalDivider(width: 20)),
                    Expanded(
                      child: _SearchField(
                        icon: Icons.calendar_month_outlined,
                        label: 'VISIT',
                        value: 'Any day',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _openInspection(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(0, 48),
                    ),
                    icon: const Icon(Icons.search_rounded, size: 19),
                    label: const Text('Search services'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openInspection(BuildContext context, [ServiceCategory? category]) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => CreateInspectionScreen(preselectedCategory: category),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 19),
        ),
        const SizedBox(width: 9),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TrustStrip extends StatelessWidget {
  const _TrustStrip();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(
          child: _TrustItem(
            icon: Icons.verified_user_outlined,
            value: 'Verified',
            label: 'professionals',
          ),
        ),
        SizedBox(width: 10),
        Expanded(
          child: _TrustItem(
            icon: Icons.schedule_rounded,
            value: '< 24 hrs',
            label: 'quote response',
          ),
        ),
        SizedBox(width: 10),
        Expanded(
          child: _TrustItem(
            icon: Icons.currency_rupee_rounded,
            value: '₹0',
            label: 'inspection fee',
          ),
        ),
      ],
    );
  }
}

class _TrustItem extends StatelessWidget {
  const _TrustItem({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primary, size: 19),
          const SizedBox(height: 6),
          Text(
            value,
            maxLines: 1,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 8),
          ),
        ],
      ),
    );
  }
}

class _PromoBanner extends StatelessWidget {
  const _PromoBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
      decoration: BoxDecoration(
        color: AppColors.accentLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.16)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(9),
            decoration: const BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.percent_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          const SizedBox(width: 11),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome offer: save up to 20%',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                ),
                SizedBox(height: 2),
                Text(
                  'On selected services for your first booking',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.accent),
        ],
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({required this.request});

  final ServiceRequestModel request;

  @override
  Widget build(BuildContext context) {
    final (label, color, progress) = _status(request.status);
    return Container(
      width: 292,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF24324A).withValues(alpha: 0.06),
            blurRadius: 14,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                request.requestNumber,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                ),
              ),
              const Spacer(),
              StatusPill(label: label, color: color),
            ],
          ),
          const SizedBox(height: 13),
          Text(
            request.subServiceName,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 5),
          Text(
            request.issueDescription,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 10,
              height: 1.35,
            ),
          ),
          const Spacer(),
          LinearProgressIndicator(
            value: progress,
            minHeight: 5,
            borderRadius: BorderRadius.circular(10),
            backgroundColor: AppColors.surfaceElevated,
            color: color,
          ),
        ],
      ),
    );
  }

  (String, Color, double) _status(RequestStatus status) {
    return switch (status) {
      RequestStatus.submitted => ('Submitted', AppColors.info, 0.12),
      RequestStatus.estimating => ('Estimating', AppColors.warning, 0.3),
      RequestStatus.quoted => ('Quote ready', AppColors.accent, 0.5),
      RequestStatus.paid => ('Approved', AppColors.success, 0.65),
      RequestStatus.inProgress => ('In progress', AppColors.primary, 0.82),
      RequestStatus.completed => ('Completed', AppColors.success, 1),
      RequestStatus.cancelled => ('Cancelled', AppColors.error, 0),
    };
  }
}

class _ServiceCard extends StatelessWidget {
  const _ServiceCard({required this.category, required this.discount});

  final ServiceCategory category;
  final String discount;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(18),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) =>
                CreateInspectionScreen(preselectedCategory: category),
          ),
        ),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: category.color.withValues(alpha: 0.1),
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(18),
                    ),
                  ),
                  child: Stack(
                    children: [
                      Center(
                        child: Icon(
                          category.icon,
                          color: category.color,
                          size: 45,
                        ),
                      ),
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.accent,
                            borderRadius: BorderRadius.circular(7),
                          ),
                          child: Text(
                            discount,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category.shortTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          color: AppColors.warning,
                          size: 14,
                        ),
                        const SizedBox(width: 3),
                        Text(
                          '${category.rating}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Expanded(
                          child: Text(
                            '${category.subcategories.length} services',
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 9,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
