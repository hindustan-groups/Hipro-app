import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../core/network/api_client.dart';
import '../../../core/services/hipro_payment_service.dart';
import '../../../core/session/user_session.dart';
import '../../../core/widgets/app_ui.dart';
import '../../../main.dart';
import '../../offers/models/offer_model.dart';
import '../../offers/widgets/coupon_input_card.dart';
import 'payment_success_screen.dart';

class PaymentScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final double amount;
  final double? advanceAmount;
  final num? advancePercentage;
  final String? quotationId;
  final bool isAdvanceOnly;

  const PaymentScreen({
    super.key,
    required this.title,
    required this.subtitle,
    required this.amount,
    this.advanceAmount,
    this.advancePercentage,
    this.quotationId,
    this.isAdvanceOnly = false,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final HiproPaymentService _paymentService = HiproPaymentService();
  bool _isProcessing = false;
  late String _selectedOption; // 'advance' or 'full'
  double _lastPaidAmount = 0.0;

  double? _backendGrandTotal;
  double? _backendAdvanceAmount;
  int? _backendAdvancePercentage;

  double get _effectiveGrandTotal => _backendGrandTotal ?? widget.amount;

  double get _effectiveAdvanceAmount {
    if (_backendAdvanceAmount != null && _backendAdvanceAmount! > 0) {
      return _backendAdvanceAmount!;
    }
    if (widget.advanceAmount != null && widget.advanceAmount! > 0) {
      return widget.advanceAmount!;
    }
    if (widget.advancePercentage != null && widget.advancePercentage! > 0) {
      return (widget.amount * (widget.advancePercentage! / 100));
    }
    return (widget.amount * 0.5);
  }

  int get _effectiveAdvancePercentage {
    if (_backendAdvancePercentage != null && _backendAdvancePercentage! > 0) {
      return _backendAdvancePercentage!;
    }
    if (widget.advancePercentage != null && widget.advancePercentage! > 0) {
      return widget.advancePercentage!.round();
    }
    if (_effectiveGrandTotal > 0) {
      return ((_effectiveAdvanceAmount / _effectiveGrandTotal) * 100).round();
    }
    return 50;
  }

  AppliedCoupon? _appliedCoupon;

  double get _basePayableAmount => _selectedOption == 'advance'
      ? _effectiveAdvanceAmount
      : _effectiveGrandTotal;

  double get _payableAmount {
    if (_appliedCoupon != null) {
      return (_basePayableAmount - _appliedCoupon!.discountAmount)
          .clamp(0.0, double.infinity);
    }
    return _basePayableAmount;
  }

  @override
  void initState() {
    super.initState();
    _selectedOption = widget.isAdvanceOnly ? 'advance' : 'full';

    if (widget.quotationId != null) {
      _fetchBackendQuotationSummary();
    }
  }

  Future<void> _fetchBackendQuotationSummary() async {
    try {
      final res = await ApiClient().dio.get('/payments/quotation-summary/${widget.quotationId}');
      if (res.statusCode == 200 && res.data != null && res.data['success'] == true) {
        if (!mounted) return;
        setState(() {
          _backendGrandTotal = (res.data['grandTotal'] as num?)?.toDouble();
          _backendAdvanceAmount = (res.data['advanceAmount'] as num?)?.toDouble();
          _backendAdvancePercentage = (res.data['advancePercentage'] as num?)?.toInt();
        });
      }
    } catch (e) {
      debugPrint('Backend quotation summary fetch notice: $e');
    }
  }

  @override
  void dispose() {
    _paymentService.dispose();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (!mounted) return;
    setState(() => _isProcessing = true);

    // 1. Verify payment cryptographically on backend
    bool verified = false;
    String errorMessage = 'Payment verification could not be confirmed by the server.';

    try {
      final verifyRes = await ApiClient().dio.post(
        '/payments/verify',
        data: {
          'razorpay_order_id': response.orderId,
          'razorpay_payment_id': response.paymentId,
          'razorpay_signature': response.signature,
          'quotationId': widget.quotationId,
          'paymentOption': _selectedOption,
        },
      );

      if (verifyRes.statusCode == 200 &&
          verifyRes.data != null &&
          verifyRes.data['success'] == true) {
        verified = true;
      } else if (verifyRes.data != null && verifyRes.data['message'] != null) {
        errorMessage = verifyRes.data['message'].toString();
      }
    } catch (e) {
      debugPrint('Backend payment verification error: $e');
      errorMessage = 'Network or server error during verification: $e';
    }

    if (!verified) {
      if (!mounted) return;
      setState(() => _isProcessing = false);

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 28),
              SizedBox(width: 8),
              Expanded(
                child: Text('Verification Notice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Your payment was processed by the payment gateway, but server verification did not complete successfully.',
                style: TextStyle(fontSize: 14, height: 1.4),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Payment ID: ${response.paymentId ?? "N/A"}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                    if (response.orderId != null)
                      Text('Order ID: ${response.orderId}',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
                    const SizedBox(height: 4),
                    Text('Notice: $errorMessage',
                        style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Please share this payment reference with Hipro support to verify and activate your work order.',
                style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                Navigator.of(context).pop();
              },
              child: const Text('Back to Quotation', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      return;
    }

    // 2. Mark quotation as accepted in local app state
    if (widget.quotationId != null) {
      await appState.acceptQuotation(widget.quotationId!);
    }

    final double payableAmount = _lastPaidAmount > 0
        ? _lastPaidAmount
        : _payableAmount;

    final String txnId = response.paymentId ??
        'TXN${DateTime.now().millisecondsSinceEpoch.toString().substring(4)}';

    if (!mounted) return;
    setState(() => _isProcessing = false);

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => PaymentSuccessScreen(
          title: widget.title,
          amount: payableAmount,
          transactionId: txnId,
          paymentMethod: 'Razorpay (UPI / Card / NetBanking)',
        ),
      ),
    );
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() => _isProcessing = false);

    debugPrint('Razorpay Error: code=${response.code}, message=${response.message}');
    String errorMsg = (response.message != null && response.message!.isNotEmpty)
        ? response.message!
        : 'Payment cancelled or could not be completed.';

    if (response.code == Razorpay.PAYMENT_CANCELLED) {
      errorMsg = 'Payment cancelled.';
    } else if (response.code == Razorpay.NETWORK_ERROR) {
      errorMsg = 'Network connection error during payment. Please check your internet connection.';
    } else if (response.code == Razorpay.INVALID_OPTIONS) {
      errorMsg = 'Invalid payment options: ${response.message ?? 'Please check merchant credentials.'}';
    }

    AppToast.show(context, message: errorMsg, isError: true);
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    AppToast.show(
      context,
      message: 'External Wallet Selected: ${response.walletName}',
    );
  }

  Future<String?> _promptForPhoneNumber(BuildContext context, String currentPhone) async {
    final phoneController = TextEditingController(text: currentPhone);
    String? errorText;

    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              title: const Row(
                children: [
                  Icon(Icons.phone_android_rounded, color: Color(0xFF1864E8)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Mobile Number Required',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Please provide your 10-digit mobile number for Razorpay payment receipt and account verification.',
                    style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: phoneController,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    decoration: InputDecoration(
                      prefixText: '+91 ',
                      hintText: '9876543210',
                      errorText: errorText,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(null),
                  child: const Text('Cancel', style: TextStyle(color: Color(0xFF6B7280))),
                ),
                ElevatedButton(
                  onPressed: () {
                    final clean = phoneController.text.replaceAll(RegExp(r'\D'), '');
                    if (clean.length != 10) {
                      setDialogState(() {
                        errorText = 'Enter a valid 10-digit phone number';
                      });
                      return;
                    }
                    Navigator.of(ctx).pop(clean);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1864E8),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('Confirm'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _launchRazorpayCheckout() async {
    final session = UserSession();
    String phone = (session.phone ?? '').replaceAll(RegExp(r'\D'), '');
    if (phone.length > 10 && phone.startsWith('91')) {
      phone = phone.substring(2);
    }

    // Require valid 10-digit phone instead of falling back to fake dummy number
    if (phone.length != 10) {
      final enteredPhone = await _promptForPhoneNumber(context, phone);
      if (enteredPhone == null || enteredPhone.length != 10) {
        if (!mounted) return;
        AppToast.show(
          context,
          message: 'A valid 10-digit mobile number is required to proceed with payment.',
          isError: true,
        );
        return;
      }
      phone = enteredPhone;
      session.phone = phone;
    }

    final email = (session.email != null && session.email!.contains('@'))
        ? session.email!
        : 'customer@hipro.in';
    final name = (session.name != null && session.name!.trim().isNotEmpty)
        ? session.name!.trim()
        : 'Customer';

    double backendPayableAmount = _payableAmount;

    // Validate payable amount before initializing gateway
    if (backendPayableAmount <= 0) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Invalid payable amount. Please contact support.',
        isError: true,
      );
      return;
    }

    setState(() => _isProcessing = true);

    String? serverOrderId;
    int amountInPaise = (backendPayableAmount * 100).round();

    try {
      // Backend calculates amount from database records & applies coupon
      final res = await ApiClient().dio.post(
        '/payments/create-order',
        data: {
          'quotationId': widget.quotationId,
          'paymentOption': _selectedOption, // 'advance' or 'full'
          'customerName': name,
          'customerPhone': phone,
          'customerEmail': email,
          'couponCode': _appliedCoupon?.code,
        },
      );
      if (res.data != null && res.data['success'] == true) {
        serverOrderId = res.data['orderId']?.toString();
        if (res.data['amount'] != null) {
          backendPayableAmount = (res.data['amount'] as num).toDouble();
        }
        if (res.data['amountInPaise'] != null) {
          amountInPaise = (res.data['amountInPaise'] as num).toInt();
        } else {
          amountInPaise = (backendPayableAmount * 100).round();
        }
        _lastPaidAmount = backendPayableAmount;
      }
    } catch (e) {
      debugPrint('Backend order creation notice: $e');
    }

    // Defensive check to avoid invalid options in Razorpay SDK
    if (amountInPaise <= 0) {
      setState(() => _isProcessing = false);
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Unable to initialize checkout with zero amount.',
        isError: true,
      );
      return;
    }

    if (!mounted) return;

    _paymentService.openCheckout(
      context: context,
      amountInPaise: amountInPaise,
      orderId: serverOrderId,
      merchantName: 'Hipro Building Solutions',
      description: '${widget.title} - ${widget.subtitle}',
      prefillName: name,
      prefillPhone: phone,
      prefillEmail: email,
      onSuccess: _handlePaymentSuccess,
      onError: _handlePaymentError,
      onWallet: _handleExternalWallet,
    );
  }

  @override
  Widget build(BuildContext context) {
    final double payableAmount = _payableAmount;

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
          'Checkout & Payment',
          style: TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Project Summary Card
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
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.title,
                              style: const TextStyle(
                                color: Color(0xFF0F172A),
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              widget.subtitle,
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEBF2FE),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'Verified',
                          style: TextStyle(
                            color: Color(0xFF1864E8),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Divider(color: Color(0xFFF1F5F9)),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Quotation Value',
                        style: TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        '₹ ${_effectiveGrandTotal.toInt()}',
                        style: const TextStyle(
                          color: Color(0xFF0F172A),
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 22),

            // Payment Amount Options
            const Text(
              'Select Payment Option',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),

            // Option 1: Advance Token Deposit
            _buildOptionCard(
              id: 'advance',
              title: '$_effectiveAdvancePercentage% Advance Deposit to Start Work',
              subtitle: 'Pay ₹ ${_effectiveAdvanceAmount.toInt()} now to initiate material mobilization & start work. Remaining balance of ₹ ${(_effectiveGrandTotal - _effectiveAdvanceAmount).clamp(0, double.infinity).toInt()} upon completion.',
              amount: '₹ ${_effectiveAdvanceAmount.toInt()}',
              isRecommended: true,
            ),

            const SizedBox(height: 10),

            // Option 2: Full 100% Payment
            _buildOptionCard(
              id: 'full',
              title: 'Full 100% Project Payment',
              subtitle: 'Pay full ₹ ${_effectiveGrandTotal.toInt()} upfront with priority engineer slot dispatch.',
              amount: '₹ ${_effectiveGrandTotal.toInt()}',
              isRecommended: false,
            ),

            const SizedBox(height: 20),

            // Payment Summary Breakdown
            _buildPaymentSummaryCard(),

            const SizedBox(height: 18),

            // Coupon Code Card
            CouponInputCard(
              orderAmount: _basePayableAmount,
              appliedCoupon: _appliedCoupon,
              onCouponApplied: (coupon) {
                setState(() => _appliedCoupon = coupon);
              },
              onCouponRemoved: () {
                setState(() => _appliedCoupon = null);
              },
            ),

            const SizedBox(height: 22),

            // Supported Payment Modes via Razorpay
            const Text(
              'Supported Payment Modes',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  _buildPaymentMethodRow(
                    icon: Icons.qr_code_2_rounded,
                    color: const Color(0xFF10B981),
                    title: 'UPI Instant Payment',
                    subtitle: 'Google Pay, PhonePe, Paytm, BHIM & any UPI ID',
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 10),
                    child: Divider(color: Color(0xFFF1F5F9)),
                  ),
                  _buildPaymentMethodRow(
                    icon: Icons.credit_card_rounded,
                    color: const Color(0xFF1864E8),
                    title: 'Credit & Debit Cards',
                    subtitle: 'Visa, MasterCard, RuPay, Maestro & Diners Club',
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 10),
                    child: Divider(color: Color(0xFFF1F5F9)),
                  ),
                  _buildPaymentMethodRow(
                    icon: Icons.account_balance_rounded,
                    color: const Color(0xFF8B5CF6),
                    title: 'Net Banking & Wallets',
                    subtitle: '50+ Major Indian Banks & digital wallets',
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Razorpay Security Trust Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: const Row(
                children: [
                  Icon(
                    Icons.verified_user_rounded,
                    color: Color(0xFF059669),
                    size: 20,
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Secured by Razorpay Payment Gateway. PCI-DSS Level 1 certified bank-grade 256-bit encryption.',
                      style: TextStyle(
                        color: Color(0xFF065F46),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            border: const Border(
              top: BorderSide(color: Color(0xFFF1F5F9)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isProcessing ? null : _launchRazorpayCheckout,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF1864E8),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.lock_outline_rounded, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Pay ₹ ${payableAmount.toInt()} with Razorpay',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentSummaryCard() {
    return Container(
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
          const Row(
            children: [
              Icon(Icons.receipt_long_rounded,
                  size: 18, color: Color(0xFF1864E8)),
              SizedBox(width: 8),
              Text(
                'Payment Summary',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _selectedOption == 'advance'
                    ? 'Advance Token ($_effectiveAdvancePercentage%)'
                    : 'Quotation Total',
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              Text(
                '₹ ${_basePayableAmount.toInt()}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          if (_appliedCoupon != null) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle_rounded,
                        size: 15, color: Color(0xFF16A34A)),
                    const SizedBox(width: 6),
                    Text(
                      'Coupon (${_appliedCoupon!.code})',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                  ],
                ),
                Text(
                  '- ₹ ${_appliedCoupon!.discountAmount.toInt()}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF16A34A),
                  ),
                ),
              ],
            ),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: Color(0xFFF1F5F9)),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Payable Now',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF0F172A),
                ),
              ),
              Row(
                children: [
                  if (_appliedCoupon != null) ...[
                    Text(
                      '₹ ${_basePayableAmount.toInt()}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF94A3B8),
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    '₹ ${_payableAmount.toInt()}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1864E8),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOptionCard({
    required String id,
    required String title,
    required String subtitle,
    required String amount,
    required bool isRecommended,
  }) {
    final isSelected = _selectedOption == id;

    return GestureDetector(
      onTap: () => setState(() => _selectedOption = id),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF1864E8) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.8 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 2),
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? const Color(0xFF1864E8) : const Color(0xFFCBD5E1),
                  width: 2,
                ),
                color: isSelected ? const Color(0xFF1864E8) : Colors.transparent,
              ),
              child: isSelected
                  ? const Center(
                      child: Icon(Icons.circle, size: 8, color: Colors.white),
                    )
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          title,
                          style: TextStyle(
                            color: const Color(0xFF0F172A),
                            fontSize: 14,
                            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                          ),
                        ),
                      ),
                      if (isRecommended) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'POPULAR',
                            style: TextStyle(
                              color: Color(0xFF10B981),
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 12,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              amount,
              style: TextStyle(
                color: isSelected ? const Color(0xFF1864E8) : const Color(0xFF0F172A),
                fontSize: 15,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodRow({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Color(0xFF64748B),
                  fontSize: 11.5,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
