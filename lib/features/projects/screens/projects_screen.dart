import 'package:flutter/material.dart';

import '../../../config/theme/app_colors.dart';
import '../../../core/widgets/app_ui.dart';
import '../../../main.dart';
import '../../inspections/models/request_model.dart';

class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final requests = appState.requests;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'My projects',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 3),
                        const Text(
                          'Every request, clearly tracked',
                          style: TextStyle(
                            color: AppColors.textMuted,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const StatusPill(
                    label: 'LIVE UPDATES',
                    color: AppColors.success,
                    icon: Icons.bolt_rounded,
                  ),
                ],
              ),
            ),
            Expanded(
              child: requests.isEmpty
                  ? const EmptyState(
                      icon: Icons.construction_rounded,
                      title: 'No projects yet',
                      message: 'Your inspection requests will appear here.',
                    )
                  : ListView.separated(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(18, 4, 18, 118),
                      itemCount: requests.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 14),
                      itemBuilder: (_, index) =>
                          _ProjectCard(request: requests[index]),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({required this.request});

  final ServiceRequestModel request;

  @override
  Widget build(BuildContext context) {
    final (label, color, progress) = _status(request.status);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(11),
                decoration: BoxDecoration(
                  gradient: AppColors.brandGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.construction_rounded,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.requestNumber,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      request.categoryName,
                      style: const TextStyle(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              StatusPill(label: label, color: color),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            request.subServiceName,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 7),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.location_on_outlined,
                color: AppColors.textMuted,
                size: 16,
              ),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  request.address,
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Project progress',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 11),
              ),
              Text(
                '${(progress * 100).round()}%',
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 7,
              backgroundColor: AppColors.surfaceElevated,
              color: color,
            ),
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
      RequestStatus.inProgress => ('In progress', AppColors.primaryLight, 0.82),
      RequestStatus.completed => ('Completed', AppColors.success, 1),
      RequestStatus.cancelled => ('Cancelled', AppColors.error, 0),
    };
  }
}
