import 'package:flutter/material.dart';
import '../../../core/widgets/chat_sheet.dart';
import '../../../main.dart';
import '../../navigation/main_nav_screen.dart';
import '../models/request_model.dart';
import '../../services/screens/create_inspection_screen.dart';
import 'edit_request_screen.dart';
import 'request_details_screen.dart';

class CustomerRequestsScreen extends StatefulWidget {
  const CustomerRequestsScreen({super.key});

  @override
  State<CustomerRequestsScreen> createState() => _CustomerRequestsScreenState();
}

class _CustomerRequestsScreenState extends State<CustomerRequestsScreen> {
  String _formatDate(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  bool _isVideoUrl(String url) {
    final clean = url.toLowerCase().split('?').first;
    return clean.endsWith('.mp4') ||
        clean.endsWith('.mov') ||
        clean.endsWith('.avi') ||
        clean.endsWith('.mkv') ||
        clean.endsWith('.webm') ||
        clean.contains('/videos/');
  }

  Widget _buildMiniProgressBar(ServiceRequestModel req) {
    int currentStep = 0;
    switch (req.status) {
      case RequestStatus.submitted:
        currentStep = 0;
        break;
      case RequestStatus.estimating:
        currentStep = 1;
        break;
      case RequestStatus.quoted:
        currentStep = 2;
        break;
      case RequestStatus.paid:
      case RequestStatus.inProgress:
        currentStep = 3;
        break;
      case RequestStatus.completed:
        currentStep = 4;
        break;
      case RequestStatus.cancelled:
        return const SizedBox.shrink();
    }

    final steps = ['Logged', 'Audit', 'Quote', 'Scheduled', 'Done'];

    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: List.generate(steps.length * 2 - 1, (i) {
          if (i.isOdd) {
            final stepIndex = i ~/ 2;
            final isCompleted = stepIndex < currentStep;
            return Expanded(
              child: Container(
                height: 2,
                color: isCompleted ? const Color(0xFFD97706) : const Color(0xFFE2E8F0),
              ),
            );
          }
          final stepIndex = i ~/ 2;
          final isCompleted = stepIndex < currentStep;
          final isCurrent = stepIndex == currentStep;

          Color bg;
          Color fg;
          if (isCompleted) {
            bg = const Color(0xFFD97706);
            fg = Colors.white;
          } else if (isCurrent) {
            bg = const Color.fromARGB(255, 131, 169, 226);
            fg = Colors.white;
          } else {
            bg = const Color(0xFFE2E8F0);
            fg = const Color(0xFF94A3B8);
          }

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  color: bg,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, size: 11, color: Colors.white)
                      : Text(
                          '${stepIndex + 1}',
                          style: TextStyle(
                            color: fg,
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 3),
              Text(
                steps[stepIndex],
                style: TextStyle(
                  color: isCurrent
                      ? const Color(0xFF1864E8)
                      : (isCompleted ? const Color(0xFF0F172A) : const Color(0xFF94A3B8)),
                  fontSize: 9,
                  fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final requests = appState.requests;

        return PopScope(
          canPop: Navigator.of(context).canPop(),
          onPopInvokedWithResult: (didPop, result) {
            if (didPop) return;
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (context) => const MainNavScreen()),
              (route) => false,
            );
          },
          child: Scaffold(
            backgroundColor: const Color(0xFFF8FAFC),
            appBar: AppBar(
              backgroundColor: Colors.white,
              elevation: 0,
              scrolledUnderElevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                color: const Color(0xFF0F172A),
                onPressed: () {
                  if (Navigator.of(context).canPop()) {
                    Navigator.of(context).pop();
                  } else {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (context) => const MainNavScreen()),
                      (route) => false,
                    );
                  }
                },
              ),
            title: const Text(
              'My Inspection Requests',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.chat_outlined, color: Color.fromARGB(255, 80, 97, 172)),
                tooltip: 'Chat with Support',
                onPressed: () {
                  ChatSheet.show(
                    context,
                    title: 'Inspection Support Desk',
                    subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
                    contextType: 'REQUEST',
                  );
                },
              ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
                tooltip: 'Refresh Requests',
                onPressed: () => appState.fetchRequests(),
              ),
            ],
            centerTitle: false,
          ),
          body: RefreshIndicator(
            onRefresh: () => appState.fetchRequests(),
            child: requests.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 60),
                    children: [
                      Center(
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: const Color(0xFF4F46E5).withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.assignment_outlined,
                            size: 40,
                            color: Color(0xFF4F46E5),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'No Requests Yet',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 10),
                      const Text(
                        'You have not submitted any inspection requests yet. Once you submit a repair request, you can track estimator status and damage reviews here.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13.5,
                          color: Color(0xFF64748B),
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 28),
                      Center(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => const CreateInspectionScreen(),
                              ),
                            );
                          },
                          icon: const Icon(Icons.add_rounded, size: 18),
                          label: const Text('Book New Inspection'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F172A),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                    itemCount: requests.length,
                    separatorBuilder: (_, index) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final req = requests[index];
                      return Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(18),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => RequestDetailsScreen(request: req),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                            // Header: Request number & Status
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    req.requestNumber.isNotEmpty ? req.requestNumber : 'REQ-${req.id.substring(0, 8)}',
                                    style: const TextStyle(
                                      color: Color(0xFF4F46E5),
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.w800,
                                      fontFamily: 'monospace',
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Row(
                                  children: [
                                    _buildStatusBadge(req.status),
                                    const SizedBox(width: 8),
                                    InkWell(
                                      onTap: () async {
                                        await Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) => EditRequestScreen(request: req),
                                          ),
                                        );
                                      },
                                      borderRadius: BorderRadius.circular(8),
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: const Color(0xFFE2E8F0)),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.edit_outlined, size: 14, color: Color(0xFF475569)),
                                            SizedBox(width: 4),
                                            Text(
                                              'Edit',
                                              style: TextStyle(
                                                color: Color(0xFF475569),
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // Service Title
                            Text(
                              req.categoryName.isNotEmpty ? req.categoryName : 'Service Inspection',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if (req.subServiceName.isNotEmpty && req.subServiceName != req.categoryName) ...[
                              const SizedBox(height: 4),
                              Text(
                                req.subServiceName,
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],

                            const SizedBox(height: 12),

                            // Issue Description
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                              ),
                              child: Text(
                                req.issueDescription,
                                style: const TextStyle(
                                  color: Color(0xFF334155),
                                  fontSize: 13.5,
                                  height: 1.5,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),

                            // Mini Milestone Progress Bar
                            _buildMiniProgressBar(req),

                            // Media preview if photos exist
                            if (req.photos.isNotEmpty) ...[
                              const SizedBox(height: 14),
                              SizedBox(
                                height: 72,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: req.photos.length,
                                  separatorBuilder: (_, _) => const SizedBox(width: 10),
                                  itemBuilder: (context, i) {
                                    final img = req.photos[i];
                                    final isVideo = _isVideoUrl(img);
                                    if (isVideo) {
                                      return ClipRRect(
                                        borderRadius: BorderRadius.circular(10),
                                        child: Container(
                                          width: 72,
                                          height: 72,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF0F172A),
                                            borderRadius: BorderRadius.circular(10),
                                            border: Border.all(color: const Color(0xFF334155)),
                                          ),
                                          child: const Column(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Icon(
                                                Icons.play_arrow_rounded,
                                                size: 26,
                                                color: Colors.white,
                                              ),
                                              SizedBox(height: 2),
                                              Text(
                                                'VIDEO',
                                                style: TextStyle(
                                                  color: Colors.white70,
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w700,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    }
                                    return ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: Container(
                                        width: 72,
                                        height: 72,
                                        color: const Color(0xFFE2E8F0),
                                        child: Image.network(
                                          img,
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) => const Icon(
                                            Icons.photo_rounded,
                                            size: 24,
                                            color: Color(0xFF94A3B8),
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],

                            const SizedBox(height: 16),

                            // Property & Date Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFF94A3B8)),
                                      const SizedBox(width: 5),
                                      Expanded(
                                        child: Text(
                                          req.address.isNotEmpty ? req.address : 'Site Address',
                                          style: const TextStyle(
                                            color: Color(0xFF64748B),
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w500,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  _formatDate(req.createdAt),
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),

                            // Preferred Schedule & Property Tag (if available)
                            if (req.preferredDate.isNotEmpty || req.preferredTime.isNotEmpty || req.propertySize.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.event_available_rounded, size: 14, color: Color(0xFF1864E8)),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        [
                                          if (req.preferredDate.isNotEmpty) req.preferredDate,
                                          if (req.preferredTime.isNotEmpty) req.preferredTime,
                                          if (req.propertySize.isNotEmpty) req.propertySize,
                                        ].join(' • '),
                                        style: const TextStyle(
                                          color: Color(0xFF475569),
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (req.urgency.toUpperCase() == 'URGENT') ...[
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFEE2E2),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: const Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.flash_on_rounded, size: 10, color: Color(0xFFDC2626)),
                                            SizedBox(width: 2),
                                            Text(
                                              'URGENT',
                                              style: TextStyle(
                                                color: Color(0xFFDC2626),
                                                fontSize: 9.5,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],

                            // Bottom Action Bar: View Details, Edit Request & View Quotation
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) => RequestDetailsScreen(request: req),
                                        ),
                                      );
                                    },
                                    icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                                    label: const Text(
                                      'View Details',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0F172A),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  visualDensity: VisualDensity.compact,
                                  tooltip: 'Chat with Engineer',
                                  icon: const Icon(
                                    Icons.chat_bubble_outline_rounded,
                                    size: 18,
                                    color: Color.fromARGB(255, 60, 115, 192),
                                  ),
                                  onPressed: () {
                                    ChatSheet.show(
                                      context,
                                      title: 'Inspection #${req.requestNumber.isNotEmpty ? req.requestNumber : req.id}',
                                      subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
                                      contextType: 'REQUEST',
                                      requestNumber: req.requestNumber,
                                      contextTag: req.categoryName.isNotEmpty ? req.categoryName : 'Site Audit',
                                    );
                                  },
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  visualDensity: VisualDensity.compact,
                                  tooltip: 'Edit Request Details',
                                  icon: const Icon(Icons.edit_outlined, size: 18, color: Color(0xFF64748B)),
                                  onPressed: () async {
                                    await Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) => EditRequestScreen(request: req),
                                      ),
                                    );
                                  },
                                ),
                                if (req.status == RequestStatus.quoted) ...[
                                  const SizedBox(width: 6),
                                  ElevatedButton(
                                    onPressed: () {
                                      MainNavScreen.switchTab(context, 2);
                                      Navigator.of(context).pop();
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color.fromARGB(255, 134, 133, 136),
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                                      minimumSize: Size.zero,
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      elevation: 0,
                                    ),
                                    child: const Text('View Quote', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                                  ),
                                ],
                              ],
                            ),

                            if (req.status != RequestStatus.quoted) ...[
                              const SizedBox(height: 8),
                              const Row(
                                children: [
                                  Icon(Icons.info_outline_rounded, size: 12, color: Color(0xFF94A3B8)),
                                  SizedBox(width: 5),
                                  Expanded(
                                    child: Text(
                                      'You can update damage details, photos or preferred time until quotation is finalized.',
                                      style: TextStyle(
                                        color: Color(0xFF94A3B8),
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                );
                    },
                  ),
          ),
        ),
      );
    },
    );
  }

  Widget _buildStatusBadge(RequestStatus status) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case RequestStatus.quoted:
        bg = const Color(0xFFF3E8FF);
        fg = const Color.fromARGB(255, 138, 182, 231);
        label = 'Quotation Ready';
        break;
      case RequestStatus.paid:
      case RequestStatus.inProgress:
        bg = const Color(0xFFEDE9FE);
        fg = const Color.fromARGB(255, 154, 199, 236);
        label = 'Work Approved';
        break;
      case RequestStatus.completed:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        label = 'Completed';
        break;
      case RequestStatus.cancelled:
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFFEF4444);
        label = 'Cancelled';
        break;
      case RequestStatus.estimating:
        bg = const Color(0xFFFFFBEB);
        fg = const Color(0xFFD97706);
        label = 'Under Review';
        break;
      case RequestStatus.submitted:
        bg = const Color(0xFFEFF6FF);
        fg = const Color.fromARGB(255, 48, 105, 226);
        label = 'Submitted';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
