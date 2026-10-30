import 'dart:math';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../core/services/hipro_payment_service.dart';
import '../../../core/session/user_session.dart';
import '../../../core/widgets/app_ui.dart';
import '../../offers/models/offer_model.dart';
import '../../offers/widgets/coupon_input_card.dart';
import '../data/ent_api_service.dart';
import '../models/experience_model.dart';

class ExperienceBookingSheet extends StatefulWidget {
  final ExperienceItem experience;

  const ExperienceBookingSheet({
    super.key,
    required this.experience,
  });

  static Future<ExperienceBookingModel?> show(
    BuildContext context, {
    required ExperienceItem experience,
  }) {
    return showModalBottomSheet<ExperienceBookingModel>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ExperienceBookingSheet(experience: experience),
    );
  }

  @override
  State<ExperienceBookingSheet> createState() => _ExperienceBookingSheetState();
}

class _ExperienceBookingSheetState extends State<ExperienceBookingSheet> {
  late DateTime _selectedDate;
  late String _selectedSlot;
  int _guestCount = 1;
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  bool _isBooking = false;
  AppliedCoupon? _appliedCoupon;
  final HiproPaymentService _paymentService = HiproPaymentService();

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().add(const Duration(days: 1));
    _selectedSlot = widget.experience.availableTimeSlots.isNotEmpty
        ? widget.experience.availableTimeSlots.first
        : 'Morning Slot (09:00 AM)';

    final user = UserSession();
    _nameController = TextEditingController(text: user.name ?? '');
    _phoneController = TextEditingController(text: user.phone ?? '');
  }

  @override
  void dispose() {
    _paymentService.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  double get _baseTotalAmount => widget.experience.startingPrice * _guestCount;
  double get _totalAmount {
    if (_appliedCoupon != null) {
      return (_baseTotalAmount - _appliedCoupon!.discountAmount)
          .clamp(0.0, double.infinity);
    }
    return _baseTotalAmount;
  }

  void _confirmBooking() async {
    final name = _nameController.text.trim();
    String phone = _phoneController.text.trim().replaceAll(RegExp(r'\D'), '');

    if (name.isEmpty) {
      AppToast.show(context, message: 'Please enter customer full name', isError: true);
      return;
    }

    if (phone.length < 10) {
      AppToast.show(context, message: 'Please enter a valid 10-digit mobile number', isError: true);
      return;
    }

    if (phone.length > 10 && phone.startsWith('91')) {
      phone = phone.substring(2);
    }

    final payable = _totalAmount;
    if (payable <= 0) {
      _finalizeBooking(name, phone, null);
      return;
    }

    setState(() => _isBooking = true);

    final session = UserSession();
    final email = (session.email != null && session.email!.contains('@'))
        ? session.email!
        : 'booking@hipro.in';

    _paymentService.openCheckout(
      context: context,
      amountInPaise: (payable * 100).round(),
      merchantName: 'Hipro Adventure Club',
      description: '${widget.experience.title} ($_guestCount guests)',
      prefillName: name,
      prefillPhone: phone,
      prefillEmail: email,
      onSuccess: (paymentResponse) {
        _finalizeBooking(name, phone, paymentResponse.paymentId);
      },
      onError: (failureResponse) {
        if (!mounted) return;
        setState(() => _isBooking = false);
        String err = failureResponse.message ?? 'Payment cancelled or failed.';
        if (failureResponse.code == Razorpay.PAYMENT_CANCELLED) {
          err = 'Payment was cancelled.';
        }
        AppToast.show(context, message: err, isError: true);
      },
    );
  }

  void _finalizeBooking(String name, String phone, String? paymentId) async {
    setState(() => _isBooking = true);
    String bookingId = 'ENT-${Random().nextInt(900000) + 100000}';

    // Persist to backend
    try {
      final serverBooking = await EntApiService().createBooking(
        entId: widget.experience.id,
        travelerName: name,
        travelerPhone: phone,
        date: DateFormat('EEE, dd MMM yyyy').format(_selectedDate),
        timeSlot: _selectedSlot,
        guestsCount: _guestCount,
        paymentId: paymentId,
        couponCode: _appliedCoupon?.code,
        totalAmount: _totalAmount,
      );
      if (serverBooking != null) {
        final serverCode = serverBooking['bookingCode'];
        if (serverCode != null && serverCode.toString().isNotEmpty) {
          bookingId = serverCode.toString();
        }
      }
    } catch (_) {
      // Local fallback ID will be used
    }

    final booking = ExperienceBookingModel(
      bookingId: bookingId,
      experienceId: widget.experience.id,
      experienceTitle: widget.experience.title,
      city: widget.experience.city,
      location: widget.experience.locationDetails,
      selectedDate: DateFormat('EEE, dd MMM yyyy').format(_selectedDate),
      selectedTimeSlot: _selectedSlot,
      guestCount: _guestCount,
      perPersonPrice: widget.experience.startingPrice,
      totalPrice: _totalAmount,
      customerName: name,
      customerPhone: phone,
      bookedAt: DateTime.now(),
    );

    if (mounted) {
      setState(() => _isBooking = false);
      Navigator.of(context).pop(booking);
      _showBookingSuccessDialog(context, booking);
    }
  }

  void _showBookingSuccessDialog(BuildContext context, ExperienceBookingModel booking) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        insetPadding: const EdgeInsets.all(20),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  color: Color(0xFFECFDF5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 44),
              ),
              const SizedBox(height: 18),
              const Text(
                'Adventure Pass Confirmed! 🎉',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Booking ID: ${booking.bookingId}',
                style: const TextStyle(
                  color: Color(0xFF1864E8),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  fontFamily: 'monospace',
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      booking.experienceTitle,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 14.5,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '📍 ${booking.location}',
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                    ),
                    const Divider(height: 18, color: Color(0xFFE2E8F0)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Date & Slot', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10.5)),
                            const SizedBox(height: 2),
                            Text(booking.selectedDate, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                            Text(booking.selectedTimeSlot, style: const TextStyle(color: Color(0xFF1864E8), fontSize: 11, fontWeight: FontWeight.w600)),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('Guests', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10.5)),
                            const SizedBox(height: 2),
                            Text('${booking.guestCount} Adult(s)', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                            Text('₹${booking.totalPrice.toStringAsFixed(0)} Paid/Confirmed', style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1864E8),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Done - Save Digital Pass', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1864E8).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'ENT • ${widget.experience.city.toUpperCase()}',
                            style: const TextStyle(
                              color: Color(0xFF1864E8),
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          widget.experience.title,
                          style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                  ),
                ],
              ),

              const SizedBox(height: 16),
              const Divider(color: Color(0xFFF1F5F9), height: 1),
              const SizedBox(height: 16),

              // 1. Date Selector
              const Text(
                'Select Date of Adventure',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 64,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: 7,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final date = DateTime.now().add(Duration(days: index + 1));
                    final isSelected = DateUtils.isSameDay(date, _selectedDate);

                    return InkWell(
                      onTap: () => setState(() => _selectedDate = date),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: 58,
                        decoration: BoxDecoration(
                          color: isSelected ? const Color(0xFF1864E8) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF1864E8) : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              DateFormat('EEE').format(date).toUpperCase(),
                              style: TextStyle(
                                color: isSelected ? Colors.white70 : const Color(0xFF64748B),
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              DateFormat('dd').format(date),
                              style: TextStyle(
                                color: isSelected ? Colors.white : const Color(0xFF0F172A),
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 18),

              // 2. Time Slot Selector
              const Text(
                'Choose Preferred Time Slot',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.experience.availableTimeSlots.map((slot) {
                  final isSelected = slot == _selectedSlot;
                  return ChoiceChip(
                    label: Text(slot),
                    selected: isSelected,
                    onSelected: (val) {
                      if (val) setState(() => _selectedSlot = slot);
                    },
                    selectedColor: const Color(0xFFEFF6FF),
                    backgroundColor: Colors.white,
                    labelStyle: TextStyle(
                      color: isSelected ? const Color(0xFF1864E8) : const Color(0xFF334155),
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      fontSize: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                      side: BorderSide(
                        color: isSelected ? const Color(0xFF1864E8) : const Color(0xFFE2E8F0),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 18),

              // 3. Guest Count Stepper
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Number of Adventurers',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: Color(0xFF0F172A)),
                      ),
                      Text(
                        '₹${widget.experience.startingPrice.toStringAsFixed(0)} / person',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 11.5),
                      ),
                    ],
                  ),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove_rounded, size: 18),
                          onPressed: _guestCount > 1 ? () => setState(() => _guestCount--) : null,
                        ),
                        Text(
                          '$_guestCount',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                        ),
                        IconButton(
                          icon: const Icon(Icons.add_rounded, size: 18),
                          onPressed: _guestCount < 10 ? () => setState(() => _guestCount++) : null,
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 18),

              // 4. Contact Details
              const Text(
                'Lead Traveler Information',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _nameController,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Mobile Number',
                  prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),

              const SizedBox(height: 18),

              // 5. Coupon Code Section
              CouponInputCard(
                section: 'adventure',
                orderAmount: _baseTotalAmount,
                appliedCoupon: _appliedCoupon,
                onCouponApplied: (coupon) {
                  setState(() => _appliedCoupon = coupon);
                },
                onCouponRemoved: () {
                  setState(() => _appliedCoupon = null);
                },
              ),

              const SizedBox(height: 20),

              // Bottom Price & Booking Button
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Amount', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        const SizedBox(height: 1),
                        Text(
                          '₹${_totalAmount.toStringAsFixed(0)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: _isBooking ? null : _confirmBooking,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1864E8),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _isBooking
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Row(
                              children: [
                                Text('Reserve Slot', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                                SizedBox(width: 6),
                                Icon(Icons.arrow_forward_rounded, size: 16),
                              ],
                            ),
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
