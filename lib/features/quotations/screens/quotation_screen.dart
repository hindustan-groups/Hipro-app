import 'package:flutter/material.dart';

import '../../../core/widgets/chat_sheet.dart';
import '../../../main.dart';
import '../../inspections/models/request_model.dart';
import '../../inspections/screens/edit_request_screen.dart';
import '../../inspections/screens/request_details_screen.dart';
import '../../services/screens/create_inspection_screen.dart';
import '../../services/screens/my_direct_bookings_screen.dart';
import '../models/quotation_model.dart';
import 'quotation_details_screen.dart';

class QuotationDisplayItem {
  final String id;
  final String quoteNumber;
  final String title;
  final String location;
  final double amount;
  final String date;
  final String timeline;
  final QuoteDecision status;
  final QuotationModel original;

  const QuotationDisplayItem({
    required this.id,
    required this.quoteNumber,
    required this.title,
    required this.location,
    required this.amount,
    required this.date,
    required this.timeline,
    required this.status,
    required this.original,
  });
}

class QuotationScreen extends StatefulWidget {
  final int initialSection; // 0 = Requests, 1 = Quotations, 2 = Visits

  const QuotationScreen({super.key, this.initialSection = 0});

  @override
  State<QuotationScreen> createState() => _QuotationScreenState();
}

class _QuotationScreenState extends State<QuotationScreen> {
  late int _selectedMainSection; // 0 = Instant Bookings, 1 = Inspections, 2 = Quotations
  String _selectedQuoteFilter = 'All';
  late final PageController _pageController;

  @override
  void didUpdateWidget(QuotationScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialSection != oldWidget.initialSection) {
      final target = widget.initialSection.clamp(0, 2);
      setState(() {
        _selectedMainSection = target;
      });
      if (_pageController.hasClients) {
        _pageController.animateToPage(
          target,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOutCubic,
        );
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _selectedMainSection = widget.initialSection.clamp(0, 2);
    _pageController = PageController(initialPage: _selectedMainSection);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      appState.fetchQuotations();
      appState.fetchRequests();
      appState.fetchDirectBookings();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime dt) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
  }

  Widget _buildRequestStatusBadge(RequestStatus status) {
    Color bg;
    Color fg;
    String label;
    switch (status) {
      case RequestStatus.quoted:
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1864E8);
        label = 'Quotation Ready';
        break;
      case RequestStatus.paid:
      case RequestStatus.inProgress:
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF059669);
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
        fg = const Color(0xFF2563EB);
        label = 'Submitted';
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _buildQuoteStatusBadge(QuoteDecision status) {
    Color bg;
    Color fg;
    String label;
    switch (status) {
      case QuoteDecision.accepted:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        label = 'Accepted';
        break;
      case QuoteDecision.rejected:
        bg = const Color(0xFFFEF2F2);
        fg = const Color(0xFFEF4444);
        label = 'Rejected';
        break;
      case QuoteDecision.pending:
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFD97706);
        label = 'Pending Review';
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _buildSegmentTab({
    required int index,
    required String label,
    required IconData icon,
    required Color activeColor,
    required int count,
  }) {
    final isSelected = _selectedMainSection == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (_selectedMainSection != index) {
            setState(() => _selectedMainSection = index);
            if (_pageController.hasClients) {
              _pageController.animateToPage(
                index,
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeInOutCubic,
              );
            }
          }
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 2),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.08),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 15,
                color: isSelected ? activeColor : const Color(0xFF64748B),
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: isSelected
                        ? const Color(0xFF0F172A)
                        : const Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  ),
                ),
              ),
              if (count > 0) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 5,
                    vertical: 1.5,
                  ),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? activeColor
                        : const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final requests = appState.requests;
        final quotations = appState.quotations;

        final List<QuotationDisplayItem> combinedQuotes = quotations.map((q) {
          return QuotationDisplayItem(
            id: q.id,
            quoteNumber: q.quoteNumber.isNotEmpty
                ? q.quoteNumber
                : '#Q-${q.id.substring(0, 6)}',
            title: q.title.isNotEmpty ? q.title : 'Service Quotation',
            location: q.location.isNotEmpty ? q.location : 'Project Site',
            amount: q.grandTotal.toDouble(),
            date: _formatDate(q.createdAt),
            timeline: q.timeline.isNotEmpty ? q.timeline : '1-2 Days',
            status: q.status,
            original: q,
          );
        }).toList();

        final filteredQuotes = combinedQuotes.where((item) {
          if (_selectedQuoteFilter == 'All') return true;
          if (_selectedQuoteFilter == 'Pending') {
            return item.status == QuoteDecision.pending;
          }
          if (_selectedQuoteFilter == 'Accepted') {
            return item.status == QuoteDecision.accepted;
          }
          if (_selectedQuoteFilter == 'Rejected') {
            return item.status == QuoteDecision.rejected;
          }
          return true;
        }).toList();

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            scrolledUnderElevation: 0,
            title: const Text(
              'My Bookings & Activity',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 19,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            actions: [
              // Chat with Support Desk in Header
              IconButton(
                icon: const Icon(
                  Icons.chat_outlined,
                  color: Color(0xFF1864E8),
                  size: 21,
                ),
                tooltip: 'Chat with Support Desk',
                onPressed: () {
                  ChatSheet.show(
                    context,
                    title: 'Hipro Support Desk',
                    subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
                    contextType: _selectedMainSection == 0
                        ? 'REQUEST'
                        : _selectedMainSection == 1
                            ? 'QUOTATION'
                            : 'BOOKING',
                  );
                },
              ),
              IconButton(
                icon: const Icon(
                  Icons.refresh_rounded,
                  color: Color(0xFF64748B),
                  size: 21,
                ),
                tooltip: 'Refresh',
                onPressed: () {
                  appState.fetchQuotations();
                  appState.fetchRequests();
                  appState.fetchDirectBookings();
                },
              ),
            ],
            centerTitle: false,
          ),
          floatingActionButton: _selectedMainSection == 0
              ? Material(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(20),
                  elevation: 3,
                  shadowColor: const Color(0xFF0F172A).withValues(alpha: 0.25),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const CreateInspectionScreen(),
                        ),
                      );
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 7.5),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.add_rounded, size: 16, color: Colors.white),
                          SizedBox(width: 4),
                          Text(
                            'Book Inspection',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              : Material(
                  color: const Color(0xFF1864E8),
                  borderRadius: BorderRadius.circular(20),
                  elevation: 3,
                  shadowColor: const Color(0xFF1864E8).withValues(alpha: 0.35),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {
                      ChatSheet.show(
                        context,
                        title: 'Hipro Support Desk',
                        subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
                        contextType: _selectedMainSection == 2
                            ? 'QUOTATION'
                            : (_selectedMainSection == 1 ? 'REQUEST' : 'BOOKING'),
                      );
                    },
                    child: const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 7.5),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.chat_bubble_rounded, size: 14, color: Colors.white),
                          SizedBox(width: 5),
                          Text(
                            'Chat Support',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.1,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
          body: Column(
            children: [
              // TOP 3 SECTION SWITCHER: [ Instant Bookings ] [ Inspections ] [ Quotations ]
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(14, 6, 14, 12),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      _buildSegmentTab(
                        index: 0,
                        label: 'Instant',
                        icon: Icons.bolt_rounded,
                        activeColor: const Color(0xFF1864E8),
                        count: appState.directBookings.length,
                      ),
                      _buildSegmentTab(
                        index: 1,
                        label: 'Inspections',
                        icon: Icons.assignment_outlined,
                        activeColor: const Color(0xFF0F172A),
                        count: requests.length,
                      ),
                      _buildSegmentTab(
                        index: 2,
                        label: 'Quotations',
                        icon: Icons.receipt_long_outlined,
                        activeColor: const Color(0xFF1864E8),
                        count: quotations.length,
                      ),
                    ],
                  ),
                ),
              ),

              // CONTENT BODY: HORIZONTAL SWIPEABLE PAGES [ Instant Bookings | Inspections | Quotations ]
              Expanded(
                child: PageView(
                  controller: _pageController,
                  onPageChanged: (pageIndex) {
                    setState(() {
                      _selectedMainSection = pageIndex;
                    });
                  },
                  children: [
                    const MyDirectBookingsScreen(isEmbedded: true),
                    _buildRequestsTab(requests),
                    _buildQuotationsTab(filteredQuotes, combinedQuotes),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // -------------------------------------------------------------
  // TAB 1: REQUESTS LIST
  // -------------------------------------------------------------
  Widget _buildRequestsTab(List<ServiceRequestModel> requests) {
    return RefreshIndicator(
      onRefresh: () => appState.fetchRequests(),
      color: const Color(0xFF1864E8),
      child: requests.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(28, 48, 28, 120),
              children: [
                Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withValues(alpha: 0.06),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.assignment_outlined,
                      size: 38,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'No Inspection Requests Found',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Book a leakage or civil audit and track engineer visits in real-time.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 24),
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 22,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            )
          : ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
              itemCount: requests.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final req = requests[index];
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) =>
                                RequestDetailsScreen(request: req),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  req.requestNumber.isNotEmpty
                                      ? req.requestNumber
                                      : 'REQ-${req.id.substring(0, 8)}',
                                  style: const TextStyle(
                                    color: Color(0xFF1864E8),
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                _buildRequestStatusBadge(req.status),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Service Title & Subservice
                            Text(
                              req.categoryName.isNotEmpty
                                  ? req.categoryName
                                  : 'Inspection Request',
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 15.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (req.subServiceName.isNotEmpty &&
                                req.subServiceName != req.categoryName) ...[
                              const SizedBox(height: 2),
                              Text(
                                req.subServiceName,
                                style: const TextStyle(
                                  color: Color(0xFF64748B),
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],

                            const SizedBox(height: 8),

                            // Issue Description Snippet
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                req.issueDescription,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Color(0xFF334155),
                                  fontSize: 12,
                                  height: 1.4,
                                ),
                              ),
                            ),

                            // Photos thumbnails
                            if (req.photos.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              SizedBox(
                                height: 48,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: req.photos.length,
                                  separatorBuilder: (_, _) =>
                                      const SizedBox(width: 6),
                                  itemBuilder: (context, i) {
                                    final url = req.photos[i];
                                    final clean = url
                                        .toLowerCase()
                                        .split('?')
                                        .first;
                                    final isVideo =
                                        clean.endsWith('.mp4') ||
                                        clean.endsWith('.mov') ||
                                        clean.endsWith('.avi') ||
                                        clean.endsWith('.webm') ||
                                        clean.contains('/videos/');
                                    if (isVideo) {
                                      return ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Container(
                                          width: 48,
                                          height: 48,
                                          color: const Color(0xFF0F172A),
                                          child: const Center(
                                            child: Icon(
                                              Icons.play_circle_fill_rounded,
                                              size: 24,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      );
                                    }
                                    return ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.network(
                                        url,
                                        width: 48,
                                        height: 48,
                                        fit: BoxFit.cover,
                                        errorBuilder:
                                            (context, error, stackTrace) =>
                                                Container(
                                                  width: 48,
                                                  height: 48,
                                                  color: const Color(
                                                    0xFFE2E8F0,
                                                  ),
                                                  child: const Icon(
                                                    Icons.photo_rounded,
                                                    size: 18,
                                                    color: Color(0xFF94A3B8),
                                                  ),
                                                ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],

                            const SizedBox(height: 10),

                            // Address & Date
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.location_on_outlined,
                                        size: 13,
                                        color: Color(0xFF94A3B8),
                                      ),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          req.address.isNotEmpty
                                              ? req.address
                                              : 'Site Location',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: Color(0xFF64748B),
                                            fontSize: 11.5,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  _formatDate(req.createdAt),
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 12),

                            // ACTION BUTTONS: [ View Details ] & [ Edit / View Quote ]
                            Row(
                              children: [
                                // Details Button
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              RequestDetailsScreen(
                                                request: req,
                                              ),
                                        ),
                                      );
                                    },
                                    
                                    label: const Text(
                                      'View Details',
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF0F172A),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 9.5,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),

                                // Chat with Engineer Button
                                IconButton(
                                  visualDensity: VisualDensity.compact,
                                  tooltip: 'Chat with Engineer',
                                  icon: const Icon(
                                    Icons.chat_bubble_outline_rounded,
                                    size: 18,
                                    color: Color(0xFF64748B),
                                  ),
                                  onPressed: () {
                                    ChatSheet.show(
                                      context,
                                      title:
                                          'Inspection #${req.requestNumber.isNotEmpty ? req.requestNumber : req.id}',
                                      subtitle:
                                          'Er. Vikram Sharma • Senior Technical Lead',
                                      contextType: 'REQUEST',
                                      requestNumber: req.requestNumber,
                                      contextTag: req.categoryName.isNotEmpty
                                          ? req.categoryName
                                          : 'Site Audit',
                                    );
                                  },
                                ),
                                const SizedBox(width: 8),

                                // Edit Button
                                IconButton(
                                  visualDensity: VisualDensity.compact,
                                  tooltip: 'Edit Request Details',
                                  icon: const Icon(
                                    Icons.edit_outlined,
                                    size: 18,
                                    color: Color(0xFF64748B),
                                  ),
                                  onPressed: () async {
                                    await Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            EditRequestScreen(request: req),
                                      ),
                                    );
                                  },
                                ),

                                // If Quoted -> View Quotation Button
                                if (req.status == RequestStatus.quoted) ...[
                                  const SizedBox(width: 4),
                                  ElevatedButton(
                                    onPressed: () {
                                      setState(() => _selectedMainSection = 1);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1864E8),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 9,
                                        vertical: 5,
                                      ),
                                      minimumSize: Size.zero,
                                      tapTargetSize:
                                          MaterialTapTargetSize.shrinkWrap,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                    child: const Text(
                                      'View Quote',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  // -------------------------------------------------------------
  // TAB 2: QUOTATIONS LIST
  // -------------------------------------------------------------
  Widget _buildQuotationsTab(
    List<QuotationDisplayItem> filteredQuotes,
    List<QuotationDisplayItem> combinedQuotes,
  ) {
    return Column(
      children: [
        // Filter sub-bar inside Quotations section
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Row(
            children: ['All', 'Pending', 'Accepted', 'Rejected'].map((filter) {
              final isSelected = filter == _selectedQuoteFilter;
              final count = filter == 'All'
                  ? combinedQuotes.length
                  : combinedQuotes.where((i) {
                      if (filter == 'Pending') {
                        return i.status == QuoteDecision.pending;
                      }
                      if (filter == 'Accepted') {
                        return i.status == QuoteDecision.accepted;
                      }
                      if (filter == 'Rejected') {
                        return i.status == QuoteDecision.rejected;
                      }
                      return false;
                    }).length;

              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedQuoteFilter = filter),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF0F172A)
                          : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      count > 0 ? '$filter ($count)' : filter,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: isSelected
                            ? Colors.white
                            : const Color(0xFF64748B),
                        fontSize: 11.5,
                        fontWeight: isSelected
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),

        // Quotations list
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => appState.fetchQuotations(),
            color: const Color(0xFF1864E8),
            child: filteredQuotes.isEmpty
          ? ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(28, 48, 28, 120),
              children: [
                Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1864E8).withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.receipt_long_rounded,
                      size: 38,
                      color: Color(0xFF1864E8),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                const Text(
                  'No Quotations Available',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Once our engineers inspect your property, detailed digital estimates will appear here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
              ],
            )
          : ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
              itemCount: filteredQuotes.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = filteredQuotes[index];
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => QuotationDetailsScreen(
                              quotation: item.original,
                              projectName: item.title,
                              location: item.location,
                            ),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  item.quoteNumber,
                                  style: const TextStyle(
                                    color: Color(0xFF1864E8),
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                _buildQuoteStatusBadge(item.status),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Title & Location
                            Text(
                              item.title,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 15.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on_outlined,
                                  size: 13,
                                  color: Color(0xFF94A3B8),
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    item.location,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Color(0xFF64748B),
                                      fontSize: 11.5,
                                    ),
                                  ),
                                ),
                                Text(
                                  item.date,
                                  style: const TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 10),

                            // Amount & Timeline Strip
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: const Color(0xFFF1F5F9),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Estimated Total',
                                        style: TextStyle(
                                          color: Color(0xFF64748B),
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      Text(
                                        '₹ ${item.amount.toStringAsFixed(0)}',
                                        style: const TextStyle(
                                          color: Color(0xFF0F172A),
                                          fontSize: 17,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.schedule_rounded,
                                        size: 14,
                                        color: Color(0xFFD97706),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        item.timeline,
                                        style: const TextStyle(
                                          color: Color(0xFFD97706),
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            const SizedBox(height: 12),

                            // Action: Review Scope & Chat
                            Row(
                              children: [
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              QuotationDetailsScreen(
                                                quotation: item.original,
                                                projectName: item.title,
                                                location: item.location,
                                              ),
                                        ),
                                      );
                                    },
                                    icon: const Icon(
                                      Icons.arrow_forward_rounded,
                                      size: 15,
                                    ),
                                    label: const Text(
                                      'Review Scope',
                                      style: TextStyle(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1864E8),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 10,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                IconButton(
                                  visualDensity: VisualDensity.compact,
                                  tooltip: 'Chat with Estimator',
                                  icon: const Icon(
                                    Icons.chat_bubble_outline_rounded,
                                    size: 18,
                                    color: Color(0xFF64748B),
                                  ),
                                  onPressed: () {
                                    ChatSheet.show(
                                      context,
                                      title: 'Quotation #${item.quoteNumber}',
                                      subtitle:
                                          'Er. Vikram Sharma • Senior Technical Lead',
                                      contextType: 'QUOTATION',
                                      quoteNumber: item.quoteNumber,
                                      amount: item.amount,
                                      contextTag: item.title,
                                    );
                                  },
                                ),
                              ],
                            ),
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
      ],
    );
  }
}
