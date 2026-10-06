import 'package:flutter/material.dart';

class NotificationItem {
  final String id;
  final String title;
  final String description;
  final String timestamp;
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final bool unread;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.description,
    required this.timestamp,
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    this.unread = false,
  });
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  static const List<NotificationItem> notifications = [
    NotificationItem(
      id: 'n1',
      title: 'New Quotation Received',
      description: '₹ 45,000 for Residential Villa',
      timestamp: '12 Apr, 10:30 AM',
      icon: Icons.receipt_long_rounded,
      iconColor: Color(0xFF1864E8),
      bgColor: Color(0xFFEBF2FE),
      unread: true,
    ),
    NotificationItem(
      id: 'n2',
      title: 'Inspection Assigned',
      description: 'Plumbing Inspection - Site Visit',
      timestamp: '11 Apr, 04:20 PM',
      icon: Icons.assignment_ind_rounded,
      iconColor: Color(0xFFF59E0B),
      bgColor: Color(0xFFFEF5E7),
      unread: true,
    ),
    NotificationItem(
      id: 'n3',
      title: 'Project Update',
      description: 'Site photos added for Commercial Building',
      timestamp: '10 Apr, 11:15 AM',
      icon: Icons.photo_library_rounded,
      iconColor: Color(0xFF0D9488),
      bgColor: Color(0xFFE6FAF5),
    ),
    NotificationItem(
      id: 'n4',
      title: 'Payment Received',
      description: '₹ 22,000 for Quotation #Q-003',
      timestamp: '08 Apr, 02:40 PM',
      icon: Icons.check_circle_rounded,
      iconColor: Color(0xFF10B981),
      bgColor: Color(0xFFECFDF5),
    ),
  ];

  @override
  Widget build(BuildContext context) {
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
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: false,
      ),
      body: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        itemCount: notifications.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = notifications[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: item.unread
                    ? const Color(0xFF1864E8).withValues(alpha: 0.3)
                    : const Color(0xFFE2E8F0),
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: item.bgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(item.icon, color: item.iconColor, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 14.5,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          if (item.unread)
                            Container(
                              width: 7,
                              height: 7,
                              decoration: const BoxDecoration(
                                color: Color(0xFF1864E8),
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.description,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item.timestamp,
                        style: const TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 11.5,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFFCBD5E1),
                  size: 20,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
