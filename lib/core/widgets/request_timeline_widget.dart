import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../features/inspections/models/request_model.dart';
import '../../features/quotations/models/quotation_model.dart';
import '../../features/quotations/screens/quotation_details_screen.dart';
import '../../features/quotations/screens/quotation_screen.dart';
import '../../main.dart';

enum _StepState { completed, current, upcoming }

class _TimelineStep {
  final String title;
  final String subtitle;
  final IconData icon;
  final String? timeText;
  final Widget? actionWidget;

  const _TimelineStep({
    required this.title,
    required this.subtitle,
    required this.icon,
    this.timeText,
    this.actionWidget,
  });
}

class RequestTimelineWidget extends StatelessWidget {
  final ServiceRequestModel request;
  final bool isCompact;
  final bool? requiresSiteAudit;

  const RequestTimelineWidget({
    super.key,
    required this.request,
    this.isCompact = false,
    this.requiresSiteAudit,
  });

  int _getCurrentStepIndex(RequestStatus status) {
    switch (status) {
      case RequestStatus.submitted:
        return 0;
      case RequestStatus.estimating:
        return 1;
      case RequestStatus.quoted:
        return 2;
      case RequestStatus.paid:
        return 3;
      case RequestStatus.inProgress:
        return 3;
      case RequestStatus.completed:
        return 4;
      case RequestStatus.cancelled:
        return 0;
    }
  }

  double _getProgress(RequestStatus status) {
    switch (status) {
      case RequestStatus.submitted:
        return 0.20;
      case RequestStatus.estimating:
        return 0.40;
      case RequestStatus.quoted:
        return 0.60;
      case RequestStatus.paid:
        return 0.80;
      case RequestStatus.inProgress:
        return 0.90;
      case RequestStatus.completed:
        return 1.0;
      case RequestStatus.cancelled:
        return 1.0;
    }
  }

  String _formatDate(DateTime dt) {
    return DateFormat('dd MMM, hh:mm a').format(dt);
  }

  QuotationModel? _findMatchingQuotation() {
    for (final q in appState.quotations) {
      if (request.id.isNotEmpty &&
          (q.requestId == request.id || q.requestNumber == request.id)) {
        return q;
      }
      if (request.requestNumber.isNotEmpty &&
          (q.requestId == request.requestNumber ||
              q.requestNumber == request.requestNumber ||
              q.quoteNumber == request.requestNumber)) {
        return q;
      }
    }
    final pendingQuotes = appState.quotations
        .where((q) => q.status == QuoteDecision.pending)
        .toList();
    if (pendingQuotes.isNotEmpty) {
      return pendingQuotes.first;
    }
    if (appState.quotations.isNotEmpty) {
      return appState.quotations.first;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final status = request.status;
    final isCancelled = status == RequestStatus.cancelled;
    final currentIndex = _getCurrentStepIndex(status);
    final progress = _getProgress(status);
    final matchedQuote = _findMatchingQuotation();
    final isAuditCase = requiresSiteAudit ?? request.requiresSiteAudit;

    final List<_TimelineStep> steps = [
      _TimelineStep(
        title: 'Request Logged & Evidence Saved',
        subtitle: 'Site details, property measurements & evidence photos registered.',
        icon: Icons.assignment_turned_in_rounded,
        timeText: _formatDate(request.createdAt),
      ),
      if (isAuditCase)
        _TimelineStep(
          title: 'Specialist Site Audit Visit',
          subtitle: request.preferredDate.isNotEmpty
              ? 'On-site technical inspection booked for ${request.preferredDate} (${request.preferredTime.isNotEmpty ? request.preferredTime : "Standard Slot"}).'
              : 'Senior engineer dispatched for physical core assessment and moisture reading.',
          icon: Icons.person_pin_circle_rounded,
          timeText: currentIndex >= 1 ? 'Site Auditor Assigned' : 'Audit Pending',
        )
      else
        _TimelineStep(
          title: 'Technical Review & Estimation',
          subtitle: 'Engineering desk analyzing damage photos & specs to prepare itemized BOQ (Digital review - no physical audit needed).',
          icon: Icons.analytics_outlined,
          timeText: currentIndex >= 1 ? 'Technical Desk Reviewing' : null,
        ),
      _TimelineStep(
        title: 'Itemized Quotation Ready',
        subtitle: 'Comprehensive bill of quantities (BOQ) with materials, labor & pricing breakdown.',
        icon: Icons.receipt_long_rounded,
        timeText: currentIndex >= 2 ? 'BOQ Pricing Calculated' : null,
        actionWidget: (currentIndex >= 2 || matchedQuote != null)
            ? InkWell(
                onTap: () async {
                  QuotationModel? quote = _findMatchingQuotation();
                  if (quote == null && appState.quotations.isEmpty) {
                    await appState.fetchQuotations();
                    quote = _findMatchingQuotation();
                  }

                  if (!context.mounted) return;

                  final resolvedQuote = quote;
                  if (resolvedQuote != null) {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => QuotationDetailsScreen(
                          quotation: resolvedQuote,
                          projectName: request.categoryName,
                          location: request.address,
                        ),
                      ),
                    );
                  } else {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) =>
                            const QuotationScreen(initialSection: 2),
                      ),
                    );
                  }
                },
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color.fromARGB(255, 65, 53, 85),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: const Color.fromARGB(255, 38, 37, 41).withValues(alpha: 0.25),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.visibility_rounded, color: Colors.white, size: 14),
                      SizedBox(width: 6),
                      Text(
                        'View Itemized Quote',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 14),
                    ],
                  ),
                ),
              )
            : null,
      ),
      _TimelineStep(
        title: 'Approval & Crew Mobilization',
        subtitle: request.preferredDate.isNotEmpty
            ? 'Scheduled for ${request.preferredDate} (${request.preferredTime.isNotEmpty ? request.preferredTime : "Standard Slot"}).'
            : 'Advance secured. Specialized application team and chemicals dispatched.',
        icon: Icons.local_shipping_rounded,
        timeText: currentIndex >= 3 ? 'Crew Scheduled' : null,
      ),
      _TimelineStep(
        title: 'Site Execution & Work Completion',
        subtitle: 'Surface prep, application, quality testing & final site handover.',
        icon: Icons.task_alt_rounded,
        timeText: currentIndex == 4 ? 'Work Completed' : null,
      ),
    ];

    if (isCancelled) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFFCA5A5)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Color(0xFFEF4444),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.cancel_rounded, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Request Cancelled / Closed',
                    style: TextStyle(
                      color: Color(0xFF991B1B),
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'This request was marked cancelled. Feel free to submit a new service request anytime.',
                    style: TextStyle(color: Color(0xFFB91C1C), fontSize: 12, height: 1.35),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 42, 38, 48).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.timeline_rounded,
                  size: 18,
                  color: Color.fromARGB(255, 52, 48, 59),
                ),
              ),
              const SizedBox(width: 10),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Service Progress Timeline',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    Text(
                      'Live milestones for complete clarity',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color.fromARGB(255, 44, 42, 48).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Stage ${currentIndex + 1} of ${steps.length}',
                  style: const TextStyle(
                    color: Color.fromARGB(255, 40, 32, 54),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Progress Bar Strip
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 5,
              backgroundColor: const Color(0xFFF1F5F9),
              valueColor: const AlwaysStoppedAnimation<Color>(Color.fromARGB(255, 48, 43, 56)),
            ),
          ),

          const SizedBox(height: 18),

          // Vertical Milestones List
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: steps.length,
            itemBuilder: (context, idx) {
              final step = steps[idx];
              final isLast = idx == steps.length - 1;

              _StepState state;
              if (idx < currentIndex) {
                state = _StepState.completed;
              } else if (idx == currentIndex) {
                state = _StepState.current;
              } else {
                state = _StepState.upcoming;
              }

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Node + Vertical Line
                    Column(
                      children: [
                        _buildNodeIcon(state, step.icon),
                        if (!isLast)
                          Expanded(
                            child: Container(
                              width: 2,
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              color: state == _StepState.completed
                                  ? const Color(0xFFD97706)
                                  : (state == _StepState.current
                                      ? const Color(0xFF1864E8).withValues(alpha: 0.4)
                                      : const Color(0xFFE2E8F0)),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(width: 14),

                    // Milestone Details
                    Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    step.title,
                                    style: TextStyle(
                                      color: state == _StepState.upcoming
                                          ? const Color(0xFF94A3B8)
                                          : const Color(0xFF0F172A),
                                      fontSize: 13.8,
                                      fontWeight: state == _StepState.current
                                          ? FontWeight.w800
                                          : (state == _StepState.completed
                                              ? FontWeight.w700
                                              : FontWeight.w600),
                                    ),
                                  ),
                                ),
                                _buildStatusBadge(state),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              step.subtitle,
                              style: TextStyle(
                                color: state == _StepState.upcoming
                                    ? const Color(0xFFCBD5E1)
                                    : const Color(0xFF64748B),
                                fontSize: 12,
                                height: 1.35,
                              ),
                            ),
                            if (step.timeText != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                step.timeText!,
                                style: TextStyle(
                                  color: state == _StepState.current
                                      ? const Color(0xFF1864E8)
                                      : const Color(0xFF94A3B8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                            if (step.actionWidget != null) step.actionWidget!,
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildNodeIcon(_StepState state, IconData icon) {
    switch (state) {
      case _StepState.completed:
        return Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            color: Color(0xFFD97706),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_rounded,
            color: Colors.white,
            size: 16,
          ),
        );
      case _StepState.current:
        return Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFF1864E8),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1864E8).withValues(alpha: 0.35),
                blurRadius: 8,
                spreadRadius: 1,
              ),
            ],
          ),
          child: Icon(
            icon,
            color: Colors.white,
            size: 14,
          ),
        );
      case _StepState.upcoming:
        return Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Icon(
            icon,
            color: const Color(0xFF94A3B8),
            size: 13,
          ),
        );
    }
  }

  Widget _buildStatusBadge(_StepState state) {
    switch (state) {
      case _StepState.completed:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0xFFFEF3C7),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Text(
            'DONE',
            style: TextStyle(
              color: Color(0xFF92400E),
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.4,
            ),
          ),
        );
      case _StepState.current:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.circle, color: Color(0xFF1864E8), size: 6),
              SizedBox(width: 4),
              Text(
                'IN PROGRESS',
                style: TextStyle(
                  color: Color(0xFF1864E8),
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
        );
      case _StepState.upcoming:
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Text(
            'UPCOMING',
            style: TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 9.5,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        );
    }
  }
}
