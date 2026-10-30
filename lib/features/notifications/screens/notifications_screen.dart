import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../main.dart';
import '../../../core/widgets/chat_sheet.dart';
import '../../quotations/models/quotation_model.dart';
import '../../quotations/screens/quotation_details_screen.dart';
import '../../quotations/screens/quotation_screen.dart';
import '../models/notification_model.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      appState.fetchNotifications();
    });
  }

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${dt.day} ${months[dt.month - 1]}';
    }
  }

  void _handleNotificationTap(NotificationModel item) async {
    // Mark as read
    appState.markNotificationAsRead(item.id);

    if (item.isQuotation) {
      // Find matching quote in appState
      QuotationModel? matchedQuote;
      try {
        matchedQuote = appState.quotations.firstWhere(
          (q) =>
              (item.referenceId.isNotEmpty && q.id == item.referenceId) ||
              (item.quoteNumber.isNotEmpty && q.quoteNumber == item.quoteNumber),
        );
      } catch (_) {
        if (appState.quotations.isNotEmpty) {
          matchedQuote = appState.quotations.first;
        }
      }

      if (matchedQuote != null) {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => QuotationDetailsScreen(
              quotation: matchedQuote!,
              projectName: item.projectName.isNotEmpty
                  ? item.projectName
                  : matchedQuote.title,
              location: item.location.isNotEmpty
                  ? item.location
                  : matchedQuote.location,
            ),
          ),
        );
      } else {
        // Fallback: Open Quotations list page (Section 2 = Quotations)
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const QuotationScreen(initialSection: 2),
          ),
        );
      }
    } else if (item.isRequest) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => const QuotationScreen(initialSection: 1),
        ),
      );
    } else if (item.isBooking) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => const QuotationScreen(initialSection: 0),
        ),
      );
    } else if (item.isChat) {
      ChatSheet.show(
        context,
        threadId: item.referenceId.isNotEmpty ? item.referenceId : null,
        title: item.title,
        subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
        contextType: item.quoteNumber.isNotEmpty
            ? 'QUOTATION'
            : (item.requestNumber.isNotEmpty ? 'REQUEST' : 'GENERAL'),
        quoteNumber: item.quoteNumber.isNotEmpty ? item.quoteNumber : null,
        requestNumber: item.requestNumber.isNotEmpty ? item.requestNumber : null,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, _) {
        final notifications = appState.notifications;
        final unreadCount = appState.unreadNotificationsCount;

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            scrolledUnderElevation: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
              color: const Color(0xFF0F172A),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Row(
              children: [
                const Text(
                  'Notifications',
                  style: TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (unreadCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1864E8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$unreadCount new',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ],
            ),
            actions: [
              if (unreadCount > 0)
                TextButton(
                  onPressed: () => appState.markAllNotificationsAsRead(),
                  child: const Text(
                    'Mark all read',
                    style: TextStyle(
                      color: Color(0xFF1864E8),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              IconButton(
                icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B), size: 20),
                tooltip: 'Refresh Notifications',
                onPressed: () => appState.fetchNotifications(),
              ),
            ],
            centerTitle: false,
          ),
          body: RefreshIndicator(
            onRefresh: () => appState.fetchNotifications(),
            color: const Color(0xFF1864E8),
            child: notifications.isEmpty
                ? ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 80),
                    children: [
                      Center(
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: const Color(0xFF1864E8).withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.notifications_none_rounded,
                            size: 40,
                            color: Color(0xFF1864E8),
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'No Notifications Yet',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'When admin issues your quotations or engineers update site visits, they will appear here.',
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
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    itemCount: notifications.length,
                    separatorBuilder: (_, index) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = notifications[index];
                      final hasImage = item.imageUrl != null &&
                          item.imageUrl!.isNotEmpty &&
                          item.imageUrl!.startsWith('http');

                      return Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => _handleNotificationTap(item),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: item.unread
                                  ? const Color(0xFFF0F6FF)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: item.unread
                                    ? const Color(0xFF1864E8).withValues(alpha: 0.35)
                                    : const Color(0xFFE2E8F0),
                                width: item.unread ? 1.2 : 0.8,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF0F172A).withValues(
                                    alpha: item.unread ? 0.06 : 0.02,
                                  ),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Leading Image or Icon with Badge
                                Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: hasImage
                                          ? CachedNetworkImage(
                                              imageUrl: item.imageUrl!,
                                              width: 52,
                                              height: 52,
                                              fit: BoxFit.cover,
                                              placeholder: (context, url) => Container(
                                                width: 52,
                                                height: 52,
                                                color: const Color(0xFFEBF2FE),
                                                child: const Icon(
                                                  Icons.receipt_long_rounded,
                                                  color: Color(0xFF1864E8),
                                                  size: 24,
                                                ),
                                              ),
                                              errorWidget: (context, url, error) => Container(
                                                width: 52,
                                                height: 52,
                                                color: const Color(0xFFEBF2FE),
                                                child: const Icon(
                                                  Icons.receipt_long_rounded,
                                                  color: Color(0xFF1864E8),
                                                  size: 24,
                                                ),
                                              ),
                                            )
                                          : Container(
                                              width: 52,
                                              height: 52,
                                              decoration: BoxDecoration(
                                                color: item.isQuotation
                                                    ? const Color(0xFFEBF2FE)
                                                    : const Color(0xFFFEF5E7),
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              child: Icon(
                                                item.isQuotation
                                                    ? Icons.receipt_long_rounded
                                                    : Icons.assignment_ind_rounded,
                                                color: item.isQuotation
                                                    ? const Color(0xFF1864E8)
                                                    : const Color(0xFFF59E0B),
                                                size: 26,
                                              ),
                                            ),
                                    ),
                                    if (item.unread)
                                      Positioned(
                                        top: -3,
                                        right: -3,
                                        child: Container(
                                          width: 11,
                                          height: 11,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF1864E8),
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: Colors.white,
                                              width: 2,
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(width: 14),

                                // Notification Content
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              item.title,
                                              style: TextStyle(
                                                color: const Color(0xFF0F172A),
                                                fontSize: 14.5,
                                                fontWeight: item.unread
                                                    ? FontWeight.w700
                                                    : FontWeight.w600,
                                                letterSpacing: -0.2,
                                              ),
                                            ),
                                          ),
                                          if (item.isQuotation)
                                            Container(
                                              margin: const EdgeInsets.only(left: 6),
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 7,
                                                vertical: 2,
                                              ),
                                              decoration: BoxDecoration(
                                                color: const Color(0xFF1864E8).withValues(alpha: 0.1),
                                                borderRadius: BorderRadius.circular(6),
                                              ),
                                              child: const Text(
                                                'QUOTE',
                                                style: TextStyle(
                                                  color: Color(0xFF1864E8),
                                                  fontSize: 9.5,
                                                  fontWeight: FontWeight.w700,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        item.description,
                                        style: TextStyle(
                                          color: item.unread
                                              ? const Color(0xFF334155)
                                              : const Color(0xFF64748B),
                                          fontSize: 12.8,
                                          height: 1.35,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Row(
                                        children: [
                                          Text(
                                            _formatTimestamp(item.createdAt),
                                            style: const TextStyle(
                                              color: Color(0xFF94A3B8),
                                              fontSize: 11.5,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          const Spacer(),
                                          if (item.isQuotation)
                                            const Row(
                                              children: [
                                                Text(
                                                  'View Quotation',
                                                  style: TextStyle(
                                                    color: Color(0xFF1864E8),
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                                SizedBox(width: 2),
                                                Icon(
                                                  Icons.arrow_forward_rounded,
                                                  color: Color(0xFF1864E8),
                                                  size: 14,
                                                ),
                                              ],
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
                    },
                  ),
          ),
        );
      },
    );
  }
}
