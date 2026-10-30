import 'package:flutter/material.dart';
import '../../../core/network/api_client.dart';
import '../../../core/widgets/app_ui.dart';
import '../../home/data/service_api_service.dart';
import '../models/offer_model.dart';
import 'available_coupons_sheet.dart';

class CouponInputCard extends StatefulWidget {
  final double orderAmount;
  final AppliedCoupon? appliedCoupon;
  final ValueChanged<AppliedCoupon> onCouponApplied;
  final VoidCallback onCouponRemoved;
  final String section;

  const CouponInputCard({
    super.key,
    required this.orderAmount,
    this.appliedCoupon,
    required this.onCouponApplied,
    required this.onCouponRemoved,
    this.section = 'services',
  });

  @override
  State<CouponInputCard> createState() => _CouponInputCardState();
}

class _CouponInputCardState extends State<CouponInputCard> {
  final TextEditingController _controller = TextEditingController();
  final ServiceApiService _apiService = ServiceApiService(ApiClient());
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _applyCoupon(String code) async {
    final cleanCode = code.trim().toUpperCase();
    if (cleanCode.isEmpty) {
      setState(() => _errorMessage = 'Please enter a coupon code.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final coupon = await _apiService.validateCoupon(
        code: cleanCode,
        amount: widget.orderAmount,
        section: widget.section,
      );

      if (!mounted) return;

      if (coupon != null) {
        _controller.clear();
        setState(() {
          _isLoading = false;
          _errorMessage = null;
        });
        widget.onCouponApplied(coupon);

        AppToast.show(
          context,
          message: 'Coupon "${coupon.code}" applied! Saved ₹ ${coupon.discountAmount.toInt()}',
        );
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Invalid or expired coupon code.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  void _openAvailableCouponsSheet() async {
    final selectedOffer = await AvailableCouponsSheet.show(
      context,
      orderAmount: widget.orderAmount,
      currentCouponCode: widget.appliedCoupon?.code,
      section: widget.section,
    );

    if (selectedOffer != null && mounted) {
      _applyCoupon(selectedOffer.code);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.appliedCoupon != null) {
      return _buildAppliedCouponView(widget.appliedCoupon!);
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              const Icon(
                Icons.confirmation_number_outlined,
                color: Color(0xFF1864E8),
                size: 20,
              ),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Have a Coupon Code?',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0F172A),
                  ),
                ),
              ),
              GestureDetector(
                onTap: _openAvailableCouponsSheet,
                child: const Text(
                  'View Coupons',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1864E8),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Input + Apply row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'Enter promo or coupon code',
                    hintStyle: const TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 13,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: const BorderSide(
                        color: Color(0xFF1864E8),
                        width: 1.5,
                      ),
                    ),
                  ),
                  style: const TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.0,
                    color: Color(0xFF0F172A),
                  ),
                  onSubmitted: _applyCoupon,
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _isLoading ? null : () => _applyCoupon(_controller.text),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1864E8),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFFE2E8F0),
                  minimumSize: const Size(88, 48),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'APPLY',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
              ),
            ],
          ),

          // Error Message
          if (_errorMessage != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: Color(0xFFEF4444),
                  size: 15,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      color: Color(0xFFEF4444),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAppliedCouponView(AppliedCoupon coupon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF86EFAC)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.check_circle_rounded,
              color: Color(0xFF16A34A),
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      coupon.code,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF15803D),
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16A34A),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'APPLIED',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  '₹ ${coupon.discountAmount.toInt()} discount saved with ${coupon.discount}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF166534),
                  ),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: widget.onCouponRemoved,
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFFEF4444),
              minimumSize: const Size(50, 32),
              padding: const EdgeInsets.symmetric(horizontal: 10),
            ),
            child: const Text(
              'Remove',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

