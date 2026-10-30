import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/app_ui.dart';
import '../../../main.dart';
import '../../navigation/main_nav_screen.dart';
import '../../services/screens/my_direct_bookings_screen.dart';

class PaymentSuccessScreen extends StatelessWidget {
  const PaymentSuccessScreen({
    super.key,
    required this.title,
    required this.amount,
    required this.transactionId,
    required this.paymentMethod,
    this.isDirectBooking = false,
    this.bookingNumber,
    this.scheduledDate,
    this.scheduledSlot,
    this.address,
    this.primaryButtonLabel,
    this.onPrimaryPressed,
  });

  final String title;
  final double amount;
  final String transactionId;
  final String paymentMethod;
  final bool isDirectBooking;
  final String? bookingNumber;
  final String? scheduledDate;
  final String? scheduledSlot;
  final String? address;
  final String? primaryButtonLabel;
  final VoidCallback? onPrimaryPressed;

  void _navigateToDestination(BuildContext context) {
    if (onPrimaryPressed != null) {
      onPrimaryPressed!();
      return;
    }

    if (isDirectBooking) {
      appState.fetchDirectBookings();
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const MyDirectBookingsScreen()),
        (route) => route.isFirst,
      );
    } else {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const MainNavScreen(initialTab: 2)),
        (route) => false,
      );
    }
  }

  void _navigateToHome(BuildContext context) {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const MainNavScreen(initialTab: 0)),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _navigateToHome(context);
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          automaticallyImplyLeading: false,
          actions: [
            IconButton(
              icon: const Icon(Icons.close_rounded, color: Color(0xFF94A3B8)),
              onPressed: () => _navigateToHome(context),
              tooltip: 'Close',
            ),
          ],
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Spacer(flex: 1),

                // Theme-aligned Brand Check Badge
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1864E8).withValues(alpha: 0.10),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: Color(0xFF1864E8),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x331864E8),
                            blurRadius: 16,
                            offset: Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.check_rounded,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 18),

                // Main Title
                Text(
                  isDirectBooking ? 'Booking Confirmed' : 'Payment Successful',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),

                const SizedBox(height: 8),

                // Status Chip (Brand-aligned Blue/Slate Pill)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: Color(0xFF1864E8),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Text(
                        'STATUS: CONFIRMED',
                        style: TextStyle(
                          color: Color(0xFF1D4ED8),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 28),

                // Clean Minimalist Summary Card (Essential data only)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      // 1. Service Name
                      _buildRow(
                        label: 'Service',
                        valueWidget: Text(
                          title,
                          textAlign: TextAlign.end,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),

                      // 2. Booking ID (if available)
                      if (bookingNumber != null && bookingNumber!.isNotEmpty) ...[
                        const Divider(height: 22, color: Color(0xFFE2E8F0)),
                        _buildRow(
                          label: 'Booking ID',
                          valueWidget: InkWell(
                            onTap: () {
                              Clipboard.setData(ClipboardData(text: bookingNumber!));
                              AppToast.show(context, message: 'Booking ID copied');
                            },
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  '#$bookingNumber',
                                  style: const TextStyle(
                                    color: Color(0xFF1864E8),
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Icon(Icons.copy_rounded,
                                    size: 13, color: Color(0xFF94A3B8)),
                              ],
                            ),
                          ),
                        ),
                      ],

                      // 3. Date & Slot
                      if (scheduledDate != null && scheduledDate!.isNotEmpty) ...[
                        const Divider(height: 22, color: Color(0xFFE2E8F0)),
                        _buildRow(
                          label: 'Scheduled',
                          valueWidget: Text(
                            scheduledSlot != null && scheduledSlot!.isNotEmpty
                                ? '$scheduledDate\n$scheduledSlot'
                                : scheduledDate!,
                            textAlign: TextAlign.end,
                            style: const TextStyle(
                              color: Color(0xFF0F172A),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w600,
                              height: 1.3,
                            ),
                          ),
                        ),
                      ],

                      // 4. Advance Fee Paid
                      const Divider(height: 22, color: Color(0xFFE2E8F0)),
                      _buildRow(
                        label: isDirectBooking ? 'Advance Paid' : 'Amount Paid',
                        valueWidget: Text(
                          '₹${amount.toInt()}',
                          textAlign: TextAlign.end,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const Spacer(flex: 2),

                // Primary CTA (View My Bookings / View Quotations) in Hipro Primary Blue
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () => _navigateToDestination(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1864E8),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      primaryButtonLabel ??
                          (isDirectBooking ? 'View My Bookings →' : 'View Quotations'),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                // Secondary CTA (Back to Home)
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: TextButton(
                    onPressed: () => _navigateToHome(context),
                    child: const Text(
                      'Back to Home',
                      style: TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRow({required String label, required Widget valueWidget}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF64748B),
            fontSize: 12.5,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 16),
        Flexible(child: valueWidget),
      ],
    );
  }
}
