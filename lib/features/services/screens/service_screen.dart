import 'package:flutter/material.dart';

import '../../../config/theme/app_colors.dart';
import '../../../core/widgets/app_ui.dart';
import '../../../main.dart';
import '../models/service_model.dart';
import 'create_inspection_screen.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final categories = appState.categories.where((category) {
      final searchable = [
        category.title,
        category.subtitle,
        ...category.subcategories.map((service) => service.name),
      ].join(' ').toLowerCase();
      return searchable.contains(_query.toLowerCase());
    }).toList();

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
              sliver: SliverToBoxAdapter(
                child: Row(
                  children: [
                    const HiproMark(compact: true),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Explore services',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Specialist solutions for your property',
                            style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 10),
              sliver: SliverToBoxAdapter(
                child: TextField(
                  onChanged: (value) => setState(() => _query = value.trim()),
                  decoration: const InputDecoration(
                    prefixIcon: Icon(
                      Icons.search_rounded,
                      color: AppColors.textMuted,
                    ),
                    hintText: 'Search waterproofing, painting, repairs...',
                    suffixIcon: Icon(
                      Icons.tune_rounded,
                      color: AppColors.primaryLight,
                    ),
                  ),
                ),
              ),
            ),
            if (categories.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyState(
                  icon: Icons.search_off_rounded,
                  title: 'No service found',
                  message: 'Try a different service or issue name.',
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 8, 18, 118),
                sliver: SliverList.separated(
                  itemCount: categories.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 14),
                  itemBuilder: (context, index) =>
                      _CategoryPanel(category: categories[index]),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _CategoryPanel extends StatelessWidget {
  const _CategoryPanel({required this.category});

  final ServiceCategory category;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: const BorderSide(color: AppColors.borderSubtle),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.fromLTRB(16, 10, 14, 10),
        childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        collapsedIconColor: AppColors.textMuted,
        iconColor: AppColors.primaryLight,
        leading: Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: category.color.withValues(alpha: 0.14),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(category.icon, color: category.color, size: 23),
        ),
        title: Text(
          category.shortTitle,
          style: const TextStyle(fontWeight: FontWeight.w800),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            '${category.subcategories.length} services · ${category.rating} ★',
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
        ),
        children: category.subcategories
            .map((service) => _ServiceRow(category: category, service: service))
            .toList(),
      ),
    );
  }
}

class _ServiceRow extends StatelessWidget {
  const _ServiceRow({required this.category, required this.service});

  final ServiceCategory category;
  final SubService service;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.backgroundSoft,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  service.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    height: 1.3,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              IconButton.filled(
                visualDensity: VisualDensity.compact,
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.14),
                  foregroundColor: AppColors.primaryLight,
                ),
                onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => CreateInspectionScreen(
                      preselectedCategory: category,
                      preselectedSubService: service,
                    ),
                  ),
                ),
                icon: const Icon(Icons.arrow_forward_rounded, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            service.desc,
            style: const TextStyle(
              color: AppColors.textMuted,
              fontSize: 11,
              height: 1.4,
            ),
          ),
          if (service.checklist.isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: service.checklist
                  .take(3)
                  .map(
                    (item) => Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        item,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 9,
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}
