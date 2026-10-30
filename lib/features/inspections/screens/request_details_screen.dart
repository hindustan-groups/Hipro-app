import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/widgets/chat_sheet.dart';
import '../../../core/widgets/request_timeline_widget.dart';
import '../../../main.dart';
import '../../quotations/models/quotation_model.dart';
import '../../quotations/screens/quotation_details_screen.dart';
import '../../quotations/screens/quotation_screen.dart';
import '../models/request_model.dart';
import 'edit_request_screen.dart';

class RequestDetailsScreen extends StatefulWidget {
  final ServiceRequestModel request;

  const RequestDetailsScreen({super.key, required this.request});

  @override
  State<RequestDetailsScreen> createState() => _RequestDetailsScreenState();
}

class _RequestDetailsScreenState extends State<RequestDetailsScreen> {
  late ServiceRequestModel _request;

  @override
  void initState() {
    super.initState();
    _request = widget.request;
  }

  QuotationModel? _findMatchingQuotation() {
    for (final q in appState.quotations) {
      if (_request.id.isNotEmpty &&
          (q.requestId == _request.id || q.requestNumber == _request.id)) {
        return q;
      }
      if (_request.requestNumber.isNotEmpty &&
          (q.requestId == _request.requestNumber ||
              q.requestNumber == _request.requestNumber ||
              q.quoteNumber == _request.requestNumber)) {
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

  void _openQuotation() async {
    QuotationModel? quote = _findMatchingQuotation();
    if (quote == null && appState.quotations.isEmpty) {
      await appState.fetchQuotations();
      quote = _findMatchingQuotation();
    }
    if (!mounted) return;
    final resolvedQuote = quote;
    if (resolvedQuote != null) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => QuotationDetailsScreen(
            quotation: resolvedQuote,
            projectName: _request.categoryName,
            location: _request.address,
          ),
        ),
      );
    } else {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => const QuotationScreen(initialSection: 2),
        ),
      );
    }
  }

  void _openChat() {
    final techTitle = (_request.technicianName != null && _request.technicianName!.trim().isNotEmpty)
        ? '${_request.technicianName} • ${_request.technicianRole ?? "Assigned Engineer"}'
        : 'Inspection Support Desk • Technical Team';

    ChatSheet.show(
      context,
      title: 'Inspection Support Desk',
      subtitle: techTitle,
      contextType: 'REQUEST',
      requestNumber: _request.requestNumber,
      contextTag: _request.categoryName,
    );
  }

  void _openEdit() async {
    final updated = await Navigator.of(context).push<ServiceRequestModel>(
      MaterialPageRoute(
        builder: (context) => EditRequestScreen(request: _request),
      ),
    );
    if (updated != null && mounted) {
      setState(() => _request = updated);
    }
  }

  String _formatDate(DateTime dt) {
    return DateFormat('dd MMM yyyy, hh:mm a').format(dt);
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

  Widget _buildStatusBadge(RequestStatus status) {
    Color bg;
    Color fg;
    String text;

    switch (status) {
      case RequestStatus.submitted:
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1D4ED8);
        text = 'Submitted';
        break;
      case RequestStatus.estimating:
        bg = const Color(0xFFFFFBEB);
        fg = const Color(0xFFB45309);
        text = 'Under Review';
        break;
      case RequestStatus.quoted:
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1864E8);
        text = 'Quotation Ready';
        break;
      case RequestStatus.paid:
      case RequestStatus.inProgress:
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF059669);
        text = 'In Progress';
        break;
      case RequestStatus.completed:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        text = 'Completed';
        break;
      case RequestStatus.cancelled:
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFFB91C1C);
        text = 'Cancelled';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: fg,
          fontSize: 11.5,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isUrgent = _request.urgency.toUpperCase() == 'URGENT';
    final hasPhotos = _request.photos.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          color: const Color(0xFF0F172A),
          onPressed: () => Navigator.of(context).pop(_request),
        ),
        title: Text(
          _request.requestNumber.isNotEmpty
              ? _request.requestNumber
              : 'Request Details',
          style: const TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 17,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          // Chat with Engineer in Header
          IconButton(
            icon: const Icon(Icons.chat_outlined, color: Color(0xFF1864E8)),
            tooltip: 'Chat with Engineer',
            onPressed: _openChat,
          ),
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: Color(0xFF64748B)),
            tooltip: 'Edit Request',
            onPressed: _openEdit,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 110),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Request Header Card
            Container(
              padding: const EdgeInsets.all(18),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Flexible(
                              child: Text(
                                _request.requestNumber.isNotEmpty
                                    ? _request.requestNumber
                                    : 'REQ-LIVE',
                                style: const TextStyle(
                                  color: Color(0xFF4F46E5),
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w800,
                                  fontFamily: 'monospace',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isUrgent) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEE2E2),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: const Color(0xFFFCA5A5),
                                  ),
                                ),
                                child: const Text(
                                  'URGENT',
                                  style: TextStyle(
                                    color: Color(0xFFDC2626),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      _buildStatusBadge(_request.status),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _request.categoryName.isNotEmpty
                        ? _request.categoryName
                        : 'Service Inspection',
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  if (_request.subServiceName.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      _request.subServiceName,
                      style: const TextStyle(
                        color: Color(0xFF1864E8),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(
                        Icons.access_time_rounded,
                        size: 14,
                        color: Color(0xFF94A3B8),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          'Submitted on ${_formatDate(_request.createdAt)}',
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Live Service Milestone Timeline
            RequestTimelineWidget(request: _request),

            const SizedBox(height: 14),

            // Quotation Ready Banner (if applicable)
            if (_request.status == RequestStatus.quoted) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1864E8), Color(0xFF0F172A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF1864E8).withValues(alpha: 0.25),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.receipt_long_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Quotation Is Ready!',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(height: 1),
                          Text(
                            'Estimator has calculated dynamic BOQ pricing.',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _openQuotation,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF1864E8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'View Quote',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Damage & Issue Description Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(
                        Icons.report_problem_outlined,
                        size: 18,
                        color: Color(0xFFEA580C),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Reported Issue & Scope',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFF1F5F9)),
                    ),
                    child: Text(
                      _request.issueDescription.isNotEmpty
                          ? _request.issueDescription
                          : 'No issue description provided.',
                      style: const TextStyle(
                        color: Color(0xFF334155),
                        fontSize: 14,
                        height: 1.55,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),

            // Site Evidence (Photos / Video) Card
            if (hasPhotos) ...[
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(
                              Icons.photo_library_outlined,
                              size: 18,
                              color: Color(0xFF8B5CF6),
                            ),
                            SizedBox(width: 8),
                            Text(
                              'Site Evidence & Photos',
                              style: TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '${_request.photos.length} Uploaded',
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _request.photos.length,
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            crossAxisSpacing: 10,
                            mainAxisSpacing: 10,
                            childAspectRatio: 1.0,
                          ),
                      itemBuilder: (context, idx) {
                        final mediaUrl = _request.photos[idx];
                        final isVideo = _isVideoUrl(mediaUrl);

                        return GestureDetector(
                          onTap: () {
                            if (isVideo) {
                              showDialog(
                                context: context,
                                builder: (_) => Dialog(
                                  backgroundColor: const Color(0xFF0F172A),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(22),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          width: 64,
                                          height: 64,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF1864E8)
                                                .withValues(alpha: 0.15),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.videocam_rounded,
                                            color: Color(0xFF1864E8),
                                            size: 32,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        const Text(
                                          'Inspection Video',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 17,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        Text(
                                          'This video was uploaded as site inspection media.',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                            color: Colors.white.withValues(
                                              alpha: 0.7,
                                            ),
                                            fontSize: 13,
                                            height: 1.4,
                                          ),
                                        ),
                                        const SizedBox(height: 22),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: OutlinedButton(
                                                onPressed: () =>
                                                    Navigator.of(context).pop(),
                                                style: OutlinedButton.styleFrom(
                                                  foregroundColor:
                                                      Colors.white70,
                                                  side: const BorderSide(
                                                    color: Color(0xFF334155),
                                                  ),
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        vertical: 12,
                                                      ),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          12,
                                                        ),
                                                  ),
                                                ),
                                                child: const Text('Close'),
                                              ),
                                            ),
                                            const SizedBox(width: 10),
                                            Expanded(
                                              child: ElevatedButton.icon(
                                                onPressed: () async {
                                                  final uri = Uri.parse(
                                                    mediaUrl,
                                                  );
                                                  try {
                                                    await launchUrl(
                                                      uri,
                                                      mode: LaunchMode
                                                          .externalApplication,
                                                    );
                                                  } catch (e) {
                                                    debugPrint(
                                                      'Error launching video: $e',
                                                    );
                                                  }
                                                },
                                                icon: const Icon(
                                                  Icons.play_arrow_rounded,
                                                  size: 20,
                                                ),
                                                label: const Text('Play Video'),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: const Color(
                                                    0xFF1864E8,
                                                  ),
                                                  foregroundColor: Colors.white,
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        vertical: 12,
                                                      ),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          12,
                                                        ),
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            } else {
                              showDialog(
                                context: context,
                                builder: (_) => Dialog(
                                  backgroundColor: Colors.black,
                                  insetPadding: EdgeInsets.zero,
                                  child: Stack(
                                    children: [
                                      Center(
                                        child: InteractiveViewer(
                                          child: Image.network(
                                            mediaUrl,
                                            fit: BoxFit.contain,
                                            loadingBuilder:
                                                (
                                                  context,
                                                  child,
                                                  loadingProgress,
                                                ) {
                                                  if (loadingProgress == null) {
                                                    return child;
                                                  }
                                                  return const Center(
                                                    child:
                                                        CircularProgressIndicator(
                                                          color: Colors.white,
                                                        ),
                                                  );
                                                },
                                            errorBuilder:
                                                (
                                                  context,
                                                  error,
                                                  stackTrace,
                                                ) => Column(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: const [
                                                    Icon(
                                                      Icons
                                                          .broken_image_rounded,
                                                      color: Colors.white70,
                                                      size: 48,
                                                    ),
                                                    SizedBox(height: 12),
                                                    Text(
                                                      'Unable to display image',
                                                      style: TextStyle(
                                                        color: Colors.white70,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                          ),
                                        ),
                                      ),
                                      Positioned(
                                        top: 40,
                                        right: 20,
                                        child: IconButton(
                                          icon: const Icon(
                                            Icons.close,
                                            color: Colors.white,
                                            size: 28,
                                          ),
                                          onPressed: () =>
                                              Navigator.of(context).pop(),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }
                          },
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: isVideo
                                ? Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0F172A),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: const Color(0xFF334155),
                                      ),
                                    ),
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(8),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF1864E8)
                                                    .withValues(alpha: 0.25),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(
                                                Icons.play_arrow_rounded,
                                                color: Colors.white,
                                                size: 24,
                                              ),
                                            ),
                                            const SizedBox(height: 5),
                                            const Text(
                                              'VIDEO',
                                              style: TextStyle(
                                                color: Colors.white70,
                                                fontSize: 9.5,
                                                fontWeight: FontWeight.w700,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                        Positioned(
                                          top: 6,
                                          right: 6,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 4,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.black54,
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                            ),
                                            child: const Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(
                                                  Icons.videocam_rounded,
                                                  color: Colors.white,
                                                  size: 10,
                                                ),
                                                SizedBox(width: 2),
                                                Text(
                                                  'MP4',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 8,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                : Image.network(
                                    mediaUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            Container(
                                              color: const Color(0xFFE2E8F0),
                                              child: const Icon(
                                                Icons.broken_image,
                                                color: Color(0xFF94A3B8),
                                              ),
                                            ),
                                  ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Property, Schedule & Address Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(
                        Icons.home_work_outlined,
                        size: 18,
                        color: Color(0xFF6366F1),
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Site & Schedule Details',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  _buildDetailRow(
                    icon: Icons.apartment_rounded,
                    label: 'Property Type',
                    value: _request.propertyType.isNotEmpty
                        ? _request.propertyType
                        : 'Residential Villa',
                  ),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildDetailRow(
                    icon: Icons.square_foot_rounded,
                    label: 'Estimated Area',
                    value: _request.propertySize.isNotEmpty
                        ? _request.propertySize
                        : '1500 sq ft',
                  ),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildDetailRow(
                    icon: Icons.calendar_today_rounded,
                    label: 'Preferred Inspection Date',
                    value: _request.preferredDate.isNotEmpty
                        ? _request.preferredDate
                        : 'Flexible Schedule',
                  ),
                  if (_request.preferredTime.isNotEmpty) ...[
                    const Divider(height: 20, color: Color(0xFFF1F5F9)),
                    _buildDetailRow(
                      icon: Icons.access_time_rounded,
                      label: 'Preferred Time Slot',
                      value: _request.preferredTime,
                    ),
                  ],
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildDetailRow(
                    icon: Icons.location_on_rounded,
                    label: 'Site Address',
                    value: _request.address.isNotEmpty
                        ? _request.address
                        : 'Main Residence, Bhilwara',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),

      // Bottom Bar with Chat Button (The primary place to chat about this request)
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Row(
            children: [
              // Prominent Chat with Engineer button
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _openChat,
                  icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                  label: const Text(
                    'Chat with Engineer',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1864E8),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // Edit button
              OutlinedButton.icon(
                onPressed: _openEdit,
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text(
                  'Edit',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF0F172A),
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: const Color(0xFF64748B)),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 13.5,
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
