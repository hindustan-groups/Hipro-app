import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../config/constants/app_constants.dart';
import '../widgets/app_ui.dart';

/// Shared Razorpay payment helper used by both Services (DirectBookingSheet)
/// and Payment screens (quotation payments). Eliminates duplicate Razorpay
/// init/open/error boilerplate.
class HiproPaymentService {
  Razorpay? _razorpay;

  /// Opens Razorpay checkout with the given parameters.
  ///
  /// [amountInPaise] – total amount in Indian paise (₹1 = 100 paise).
  /// [orderId] – optional server-created Razorpay order ID.
  /// [merchantName] – display name on payment sheet (e.g. "Hipro Home Services").
  /// [description] – line item description shown to user.
  /// [prefillName], [prefillPhone], [prefillEmail] – pre-filled customer details.
  /// [onSuccess] – callback on successful payment.
  /// [onError] – callback on payment error/cancellation.
  /// [onWallet] – optional callback when external wallet (Paytm etc.) is chosen.
  /// [context] – used for default error toast if [onError] is null.
  void openCheckout({
    required BuildContext context,
    required int amountInPaise,
    String? orderId,
    String merchantName = 'Hipro',
    String description = '',
    String prefillName = 'Customer',
    String prefillPhone = '9876543210',
    String prefillEmail = 'customer@hipro.in',
    required void Function(PaymentSuccessResponse) onSuccess,
    void Function(PaymentFailureResponse)? onError,
    void Function(ExternalWalletResponse)? onWallet,
  }) {
    // Clean up any previous instance
    dispose();

    _razorpay = Razorpay();

    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, onSuccess);

    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, onError ?? (PaymentFailureResponse res) {
      _defaultErrorHandler(context, res);
    });

    _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, onWallet ?? (ExternalWalletResponse res) {
      AppToast.show(context, message: 'Wallet chosen: ${res.walletName}');
    });

    final options = {
      'key': AppConstants.razorpayKeyId,
      'amount': amountInPaise,
      if (orderId != null && orderId.isNotEmpty) 'order_id': orderId,
      'name': merchantName,
      'description': description,
      'prefill': {
        'contact': prefillPhone,
        'email': prefillEmail,
        'name': prefillName,
      },
      'theme': {
        'color': '#1864E8',
      },
      'external': {
        'wallets': ['paytm'],
      },
    };

    try {
      _razorpay!.open(options);
    } catch (e) {
      AppToast.show(context, message: 'Failed to open payment gateway: $e', isError: true);
    }
  }

  /// Default error handler that shows a user-friendly top toast.
  void _defaultErrorHandler(BuildContext context, PaymentFailureResponse response) {
    String err = response.message ?? 'Payment failed or cancelled.';
    if (response.code == Razorpay.PAYMENT_CANCELLED) {
      err = 'Payment cancelled.';
    } else if (response.code == Razorpay.NETWORK_ERROR) {
      err = 'Network error during payment. Please check internet and retry.';
    } else if (response.code == Razorpay.INVALID_OPTIONS) {
      err = 'Invalid payment options: ${response.message ?? 'Check merchant credentials.'}';
    }
    AppToast.show(context, message: err, isError: true);
  }

  /// Cleans up the Razorpay instance. Call from [State.dispose].
  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
  }
}
