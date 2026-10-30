import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../../core/network/api_client.dart';
import '../../../core/services/hipro_payment_service.dart';
import '../../../core/session/user_session.dart';
import '../../../core/widgets/app_ui.dart';
import '../../offers/models/offer_model.dart';
import '../../offers/widgets/coupon_input_card.dart';
import '../../payment/screens/payment_success_screen.dart';
import '../models/service_model.dart';
import '../screens/create_inspection_screen.dart';

class DirectBookingSheet extends StatefulWidget {
  final ServiceItem service;
  final SubService subService;

  const DirectBookingSheet({
    super.key,
    required this.service,
    required this.subService,
  });

  static Future<void> show(
    BuildContext context, {
    required ServiceItem service,
    required SubService subService,
  }) {
    if (!subService.bookNowEnabled) {
      AppToast.show(
        context,
        title: 'Instant Booking Unavailable',
        message: '${subService.name} is not available for Instant Booking. Please request a quote.',
        actionLabel: 'Get Quote',
        onAction: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (ctx) => CreateInspectionScreen(
                preselectedService: service,
                preselectedSubService: subService,
              ),
            ),
          );
        },
      );
      return Future.value();
    }
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (ctx) => DirectBookingSheet(
          service: service,
          subService: subService,
        ),
      ),
    );
  }

  @override
  State<DirectBookingSheet> createState() => _DirectBookingSheetState();
}

class _DirectBookingSheetState extends State<DirectBookingSheet> {
  final HiproPaymentService _paymentService = HiproPaymentService();
  bool _isProcessing = false;

  // Step index: 0 = Date & Time, 1 = Service Address, 2 = Review & Confirm
  int _currentStep = 0;

  late DateTime _selectedDate;
  late String _selectedSlot;

  final List<String> _timeSlots = [
    '09:00 AM - 12:00 PM (Morning)',
    '12:00 PM - 03:00 PM (Afternoon)',
    '03:00 PM - 06:00 PM (Evening)',
    '06:00 PM - 08:00 PM (Late Evening)',
  ];

  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  late final TextEditingController _cityController;
  late final TextEditingController _landmarkController;
  late final TextEditingController _latController;
  late final TextEditingController _lngController;

  double? _latitude;
  double? _longitude;
  bool _isFetchingLocation = false;

  // Answers for dynamic requiredFields configured in Admin Panel
  final Map<String, dynamic> _customAnswers = {};
  final Map<String, TextEditingController> _dynamicControllers = {};

  AppliedCoupon? _appliedCoupon;

  double get _visitingCharge => widget.subService.visitingCharge;
  List<ServiceChargeItem> get _additionalCharges => widget.subService.additionalCharges;
  double get _basePayableAmount => widget.subService.totalAmount;
  double get _totalPayableAmount {
    if (_appliedCoupon != null) {
      return (_basePayableAmount - _appliedCoupon!.discountAmount)
          .clamp(0.0, double.infinity);
    }
    return _basePayableAmount;
  }

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now().add(const Duration(days: 1));
    _selectedSlot = _timeSlots.first;

    final user = UserSession();
    _nameController = TextEditingController(text: user.name ?? '');
    _phoneController = TextEditingController(text: user.phone ?? '');
    _addressController = TextEditingController();
    _cityController = TextEditingController(text: UserSession().selectedCity);
    _landmarkController = TextEditingController();
    _latController = TextEditingController();
    _lngController = TextEditingController();

    // Initialize controllers/defaults for dynamic requiredFields
    for (int i = 0; i < widget.subService.requiredFields.length; i++) {
      final f = widget.subService.requiredFields[i];
      if (f is Map) {
        final id = (f['id'] != null && f['id'].toString().trim().isNotEmpty)
            ? f['id'].toString().trim()
            : (f['label']?.toString().trim() ?? 'field_$i');
        final fieldType = f['fieldType']?.toString().toLowerCase().trim() ?? 'text';
        if (fieldType == 'select') {
          final options = (f['options'] as List<dynamic>?)?.map((e) => e.toString().trim()).toList();
          if (options != null && options.isNotEmpty) {
            _customAnswers[id] = options.first;
          }
        } else {
          _dynamicControllers[id] = TextEditingController();
        }
      }
    }
  }

  @override
  void dispose() {
    _paymentService.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _landmarkController.dispose();
    _latController.dispose();
    _lngController.dispose();
    for (var c in _dynamicControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _fetchCurrentLocation() async {
    setState(() => _isFetchingLocation = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showToast('Please turn on location service on your phone', isError: true);
        setState(() => _isFetchingLocation = false);
        await Geolocator.openLocationSettings();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showToast('Location permission was denied.', isError: true);
          setState(() => _isFetchingLocation = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _showToast('Location permission is permanently denied in settings.', isError: true);
        setState(() => _isFetchingLocation = false);
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );

      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _latController.text = position.latitude.toStringAsFixed(6);
        _lngController.text = position.longitude.toStringAsFixed(6);
        _isFetchingLocation = false;
      });

      _showToast('Live location tagged successfully!');
    } catch (e) {
      debugPrint('Location detection error: $e');
      setState(() => _isFetchingLocation = false);
      _showToast('Could not detect location automatically.', isError: true);
    }
  }

  // --- Step 1 -> Step 2 Validation ---
  void _validateStep1AndProceed() {
    for (int i = 0; i < widget.subService.requiredFields.length; i++) {
      final f = widget.subService.requiredFields[i];
      if (f is Map) {
        final id = (f['id'] != null && f['id'].toString().trim().isNotEmpty)
            ? f['id'].toString().trim()
            : (f['label']?.toString().trim() ?? 'field_$i');
        final label = f['label']?.toString() ?? f['title']?.toString() ?? 'Required field';
        final isRequired = f['required'] == true;
        final fieldType = f['fieldType']?.toString().toLowerCase().trim() ?? 'text';

        if (fieldType == 'select') {
          if (isRequired && (_customAnswers[id] == null || _customAnswers[id].toString().isEmpty)) {
            _showToast('Please select: $label');
            return;
          }
        } else {
          final text = _dynamicControllers[id]?.text.trim() ?? '';
          if (isRequired && text.isEmpty) {
            _showToast('Please fill: $label');
            return;
          }
          _customAnswers[id] = text;
        }
      }
    }

    setState(() => _currentStep = 1);
  }

  // --- Step 2 -> Step 3 Validation ---
  void _validateStep2AndProceed() {
    if (_nameController.text.trim().isEmpty) {
      _showToast('Please enter your full name');
      return;
    }

    String phone = _phoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (phone.length < 10) {
      _showToast('Please enter a valid 10-digit mobile number');
      return;
    }

    if (_addressController.text.trim().isEmpty) {
      _showToast('Please enter your service address');
      return;
    }

    if (_cityController.text.trim().isEmpty) {
      _showToast('Please enter your city');
      return;
    }

    if (_latController.text.trim().isNotEmpty) {
      final parsedLat = double.tryParse(_latController.text.trim());
      if (parsedLat == null || parsedLat < -90.0 || parsedLat > 90.0) {
        _showToast('Please enter a valid GPS Latitude (-90 to 90)');
        return;
      }
      _latitude = parsedLat;
    }
    if (_lngController.text.trim().isNotEmpty) {
      final parsedLng = double.tryParse(_lngController.text.trim());
      if (parsedLng == null || parsedLng < -180.0 || parsedLng > 180.0) {
        _showToast('Please enter a valid GPS Longitude (-180 to 180)');
        return;
      }
      _longitude = parsedLng;
    }

    setState(() => _currentStep = 2);
  }

  void _startOnlinePayment() async {
    final session = UserSession();
    String phone = _phoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (phone.length > 10 && phone.startsWith('91')) {
      phone = phone.substring(2);
    }
    if (phone.length < 10) {
      phone = '9876543210';
    }
    final name = _nameController.text.trim().isNotEmpty ? _nameController.text.trim() : 'Customer';
    final email = (session.email != null && session.email!.contains('@')) ? session.email! : 'booking@hipro.in';

    setState(() => _isProcessing = true);

    String? serverOrderId;
    try {
      final res = await ApiClient().dio.post(
        '/payments/create-order',
        data: {
          'amount': _totalPayableAmount,
          'customerName': name,
          'customerPhone': phone,
          'customerEmail': email,
          'subServiceId': widget.subService.id,
          'couponCode': _appliedCoupon?.code,
        },
      );
      if (res.data != null && res.data['success'] == true) {
        serverOrderId = res.data['orderId']?.toString();
      }
    } catch (e) {
      debugPrint('Order creation warning: $e');
    }

    if (!mounted) return;

    _paymentService.openCheckout(
      context: context,
      amountInPaise: (_totalPayableAmount * 100).round(),
      orderId: serverOrderId,
      merchantName: 'Hipro',
      description: '${widget.subService.name} - Visiting Charge',
      prefillName: name,
      prefillPhone: phone,
      prefillEmail: email,
      onSuccess: _handlePaymentSuccess,
      onError: _handlePaymentError,
      onWallet: _handleExternalWallet,
    );
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    final paymentId = response.paymentId ?? 'PAY_${DateTime.now().millisecondsSinceEpoch}';
    final orderId = response.orderId;

    try {
      final session = UserSession();
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

      final res = await ApiClient().dio.post(
        '/direct-bookings',
        data: {
          'subServiceId': widget.subService.id,
          'couponCode': _appliedCoupon?.code,
          'userId': session.id ?? session.phone ?? session.email,
          'customerName': _nameController.text.trim(),
          'customerPhone': _phoneController.text.trim(),
          'customerAddress': _addressController.text.trim(),
          'city': _cityController.text.trim(),
          'pincode': '311001',
          'landmark': _landmarkController.text.trim(),
          'latitude': _latitude,
          'longitude': _longitude,
          'scheduledDate': dateStr,
          'scheduledSlot': _selectedSlot,
          'customFieldAnswers': _customAnswers,
          'notes': 'Booked via Hipro Mobile App',
          'razorpayPaymentId': paymentId,
          'razorpayOrderId': orderId,
        },
      );

      if (!mounted) return;
      setState(() => _isProcessing = false);

      String bookingNum = 'HIP-BOOKING';
      if (res.data != null && res.data['booking'] != null) {
        bookingNum = res.data['booking']['bookingNumber'] ?? bookingNum;
      }

      Navigator.of(context).pop(); // Dismiss direct booking screen

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => PaymentSuccessScreen(
            title: widget.subService.name,
            amount: _visitingCharge,
            transactionId: paymentId,
            paymentMethod: 'Razorpay Pre-paid (UPI/Card)',
            isDirectBooking: true,
            bookingNumber: bookingNum,
            scheduledDate: DateFormat('EEE, dd MMM yyyy').format(_selectedDate),
            scheduledSlot: _selectedSlot,
            address: '${_addressController.text.trim()}, ${_cityController.text.trim()}',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      debugPrint('Direct booking creation failed: $e');
      _showToast(AppToast.cleanErrorMessage(e), isError: true);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() => _isProcessing = false);
    String err = response.message ?? 'Payment failed or cancelled.';
    if (response.code == Razorpay.PAYMENT_CANCELLED) {
      err = 'Payment cancelled.';
    } else if (response.code == Razorpay.NETWORK_ERROR) {
      err = 'Network connection error during payment. Please check internet and retry.';
    }
    _showToast(err, isError: true);
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    _showToast('Wallet chosen: ${response.walletName}');
  }

  void _showToast(String msg, {bool isError = false}) {
    if (!mounted) return;
    AppToast.show(context, message: msg, isError: isError);
  }

  void _handleBackPress() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _currentStep == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBackPress();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF0F172A)),
            onPressed: _handleBackPress,
          ),
          title: Text(
            _getStepTitle(),
            style: const TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 16.5,
              fontWeight: FontWeight.w800,
            ),
          ),
          centerTitle: true,
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(48),
            child: _buildStepProgressBar(),
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                transitionBuilder: (child, animation) {
                  return FadeTransition(opacity: animation, child: child);
                },
                child: _buildCurrentStepView(),
              ),
            ),
            _buildBottomActionBar(),
          ],
        ),
      ),
    );
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0:
        return 'Date & Time Slot';
      case 1:
        return 'Service Address';
      case 2:
        return 'Review & Confirm';
      default:
        return 'Instant Booking';
    }
  }

  // --- Visual Step Progress Bar ---
  Widget _buildStepProgressBar() {
    final steps = ['Schedule', 'Address', 'Confirm'];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: List.generate(steps.length, (index) {
          final isCompleted = _currentStep > index;
          final isCurrent = _currentStep == index;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () {
                      if (index < _currentStep) {
                        setState(() => _currentStep = index);
                      }
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? const Color.fromARGB(255, 65, 63, 68)
                            : isCompleted
                                ? const Color(0xFFEFF6FF)
                                : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isCurrent
                              ? const Color.fromARGB(255, 65, 63, 68)
                              : isCompleted
                                  ? const Color(0xFFDBEAFE)
                                  : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (isCompleted)
                            const Icon(
                              Icons.check_rounded,
                              size: 13,
                              color: Color(0xFF1D4ED8),
                            )
                          else
                            Text(
                              '${index + 1}',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isCurrent ? Colors.white : const Color(0xFF64748B),
                              ),
                            ),
                          const SizedBox(width: 5),
                          Text(
                            steps[index],
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w600,
                              color: isCurrent
                                  ? Colors.white
                                  : isCompleted
                                      ? const Color(0xFF1D4ED8)
                                      : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (index < steps.length - 1)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      Icons.chevron_right_rounded,
                      size: 14,
                      color: isCompleted ? const Color.fromARGB(255, 80, 76, 73) : const Color(0xFFCBD5E1),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCurrentStepView() {
    switch (_currentStep) {
      case 0:
        return _buildStep1DateTime();
      case 1:
        return _buildStep2Address();
      case 2:
        return _buildStep3ReviewAndBook();
      default:
        return const SizedBox.shrink();
    }
  }

  // ==========================================
  // SCREEN 1: DATE & TIME SELECTION
  // ==========================================
  Widget _buildStep1DateTime() {
    final sub = widget.subService;

    return ListView(
      key: const ValueKey('step_1_date_time'),
      padding: const EdgeInsets.all(20),
      children: [
        // Subservice Card Header
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sub.name,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      widget.service.name,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFDBEAFE)),
                ),
                child: Text(
                  '₹${_visitingCharge.toInt()} Visit Fee',
                  style: const TextStyle(
                    color: Color(0xFF1D4ED8),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Policy Notice Pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFDBEAFE)),
          ),
          child: const Row(
            children: [
              Icon(Icons.verified_outlined, size: 16, color: Color(0xFF1D4ED8)),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Pre-paid visit fee covers technician inspection & diagnosis.',
                  style: TextStyle(
                    color: Color(0xFF1D4ED8),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 22),

        // Date Selection
        _buildSectionHeader('Select Inspection Date', 'Choose preferred date for technician visit'),
        const SizedBox(height: 10),
        _buildDatePicker(),

        const SizedBox(height: 22),

        // Time Slot Selection
        _buildSectionHeader('Select Time Slot', 'Choose your preferred 3-hour arrival window'),
        const SizedBox(height: 10),
        _buildTimeSlotCards(),

        // Dynamic Questions (if any configured for this subservice)
        if (sub.requiredFields.isNotEmpty) ...[
          const SizedBox(height: 24),
          _buildSectionHeader('Service Details', 'Please answer these questions for accurate diagnosis'),
          const SizedBox(height: 10),
          ..._buildDynamicFields(),
        ],
      ],
    );
  }

  Widget _buildDatePicker() {
    final now = DateTime.now();
    final days = List.generate(7, (i) => now.add(Duration(days: i + 1)));

    return SizedBox(
      height: 68,
      child: Row(
        children: [
          Expanded(
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: days.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final date = days[index];
                final isSelected = _selectedDate.year == date.year &&
                    _selectedDate.month == date.month &&
                    _selectedDate.day == date.day;

                final dayName = index == 0
                    ? 'Tomorrow'
                    : DateFormat('EEE').format(date);
                final dayNum = DateFormat('dd MMM').format(date);

                return InkWell(
                  onTap: () => setState(() => _selectedDate = date),
                  borderRadius: BorderRadius.circular(12),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 82,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color.fromARGB(255, 65, 63, 68) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? const Color.fromARGB(255, 65, 63, 68)
                            : const Color(0xFFE2E8F0),
                        width: isSelected ? 1.5 : 1,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: const Color.fromARGB(255, 65, 63, 68).withValues(alpha: 0.2),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : [],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          dayName,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isSelected ? Colors.white70 : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          dayNum,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: isSelected ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: 'Pick custom date',
            onPressed: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _selectedDate,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 30)),
              );
              if (picked != null) {
                setState(() => _selectedDate = picked);
              }
            },
            icon: const Icon(Icons.calendar_month_rounded, color: Color(0xFF1864E8), size: 22),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFFEFF6FF),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.all(12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeSlotCards() {
    return Column(
      children: _timeSlots.map((slot) {
        final isSelected = _selectedSlot == slot;

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            onTap: () => setState(() => _selectedSlot = slot),
            borderRadius: BorderRadius.circular(12),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isSelected ? const Color.fromARGB(255, 65, 63, 68) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isSelected ? const Color.fromARGB(255, 65, 63, 68) : const Color(0xFFE2E8F0),
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.schedule_rounded,
                        size: 16,
                        color: isSelected ? Colors.white : const Color.fromARGB(255, 124, 113, 143),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        slot,
                        style: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF0F172A),
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Icon(
                    isSelected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                    size: 18,
                    color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  List<Widget> _buildDynamicFields() {
    final sub = widget.subService;
    return sub.requiredFields.asMap().entries.map((entry) {
      final i = entry.key;
      final f = entry.value;
      if (f is! Map) return const SizedBox.shrink();
      final id = (f['id'] != null && f['id'].toString().trim().isNotEmpty)
          ? f['id'].toString().trim()
          : (f['label']?.toString().trim() ?? 'field_$i');
      final label = f['label']?.toString() ?? f['title']?.toString() ?? 'Field';
      final fieldType = f['fieldType']?.toString().toLowerCase().trim() ?? 'text';
      final isReq = f['required'] == true;
      final options = (f['options'] as List<dynamic>?)?.map((e) => e.toString().trim()).toList() ?? [];

      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Color(0xFF334155),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (isReq)
                  const Text(' *', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 5),
            if (fieldType == 'select' && options.isNotEmpty)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _customAnswers[id] ?? options.first,
                    isExpanded: true,
                    items: options.map((opt) {
                      return DropdownMenuItem(
                        value: opt,
                        child: Text(opt, style: const TextStyle(fontSize: 13)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _customAnswers[id] = val);
                    },
                  ),
                ),
              )
            else
              TextField(
                controller: _dynamicControllers[id],
                keyboardType: fieldType == 'number' ? TextInputType.number : TextInputType.text,
                decoration: _inputDecoration('Enter $label'),
                style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              ),
          ],
        ),
      );
    }).toList();
  }

  // ==========================================
  // SCREEN 2: SERVICE ADDRESS & GPS PIN
  // ==========================================
  Widget _buildStep2Address() {
    return ListView(
      key: const ValueKey('step_2_address'),
      padding: const EdgeInsets.all(20),
      children: [
        // Selected Date & Time summary pill
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFDBEAFE)),
          ),
          child: Row(
            children: [
              const Icon(Icons.event_available_rounded, size: 18, color: Color(0xFF1D4ED8)),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${DateFormat('EEE, dd MMM yyyy').format(_selectedDate)} • ${_selectedSlot.replaceAll(' (Morning)', '').replaceAll(' (Afternoon)', '').replaceAll(' (Evening)', '').replaceAll(' (Late Evening)', '')}',
                      style: const TextStyle(
                        color: Color(0xFF1D4ED8),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Text(
                      'Tap to modify schedule',
                      style: TextStyle(color: Color(0xFF2563EB), fontSize: 11),
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => setState(() => _currentStep = 0),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF1864E8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('Change', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            ],
          ),
        ),

        const SizedBox(height: 22),

        // Contact Information
        _buildSectionHeader('Contact Information', 'Technician will call this number before arrival'),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _nameController,
                decoration: _inputDecoration('Full Name *', prefixIcon: Icons.person_outline_rounded),
                style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: _inputDecoration('Mobile Number *', prefixIcon: Icons.phone_outlined),
                style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              ),
            ),
          ],
        ),

        const SizedBox(height: 22),

        // Service Address Details
        _buildSectionHeader('Inspection Location Address', 'Where does the technician need to visit?'),
        const SizedBox(height: 10),
        TextField(
          controller: _addressController,
          maxLines: 2,
          decoration: _inputDecoration(
            'House / Flat / Plot / Street Address *',
            prefixIcon: Icons.home_outlined,
            suffixIcon: IconButton(
              tooltip: 'Tag Live Location',
              icon: _isFetchingLocation
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF1864E8)),
                    )
                  : Icon(
                      _latitude != null ? Icons.my_location_rounded : Icons.location_searching_rounded,
                      color: const Color(0xFF1864E8),
                      size: 20,
                    ),
              onPressed: _isFetchingLocation ? null : _fetchCurrentLocation,
            ),
          ),
          style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _cityController,
                decoration: _inputDecoration('City *', prefixIcon: Icons.location_city_outlined),
                style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: _landmarkController,
                decoration: _inputDecoration('Landmark (Optional)', prefixIcon: Icons.near_me_outlined),
                style: const TextStyle(fontSize: 13, color: Color(0xFF0F172A)),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        _buildLocationPinCard(),
      ],
    );
  }

  Widget _buildLocationPinCard() {
    final hasLocation = _latitude != null && _longitude != null;

    return InkWell(
      onTap: _isFetchingLocation ? null : _fetchCurrentLocation,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: hasLocation ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasLocation ? const Color(0xFFDBEAFE) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: hasLocation ? const Color(0xFFDBEAFE) : const Color(0xFFEEF2FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                hasLocation ? Icons.check_circle_rounded : Icons.my_location_rounded,
                size: 20,
                color: const Color(0xFF1864E8),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hasLocation ? 'Live Location Tagged' : 'Use Current Live Location',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: hasLocation ? const Color(0xFF1D4ED8) : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hasLocation
                        ? 'Accurate location tagged for doorstep arrival'
                        : 'Tap to automatically pin your live location',
                    style: TextStyle(
                      fontSize: 11,
                      color: hasLocation ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            if (_isFetchingLocation)
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFF1864E8),
                ),
              )
            else
              IconButton(
                onPressed: _fetchCurrentLocation,
                tooltip: hasLocation ? 'Update Live Location' : 'Tag Live Location',
                icon: Icon(
                  hasLocation ? Icons.refresh_rounded : Icons.my_location_rounded,
                  color: const Color(0xFF1864E8),
                  size: 20,
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ==========================================
  // SCREEN 3: REVIEW & BOOK SUMMARY
  // ==========================================
  Widget _buildStep3ReviewAndBook() {
    final sub = widget.subService;

    return ListView(
      key: const ValueKey('step_3_review'),
      padding: const EdgeInsets.all(20),
      children: [
        // 1. Service & Schedule Summary Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Selected Service & Schedule',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  InkWell(
                    onTap: () => setState(() => _currentStep = 0),
                    child: const Text(
                      'Edit',
                      style: TextStyle(
                        color: Color.fromARGB(255, 124, 113, 143),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20, color: Color(0xFFF1F5F9)),
              Text(
                sub.name,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                widget.service.name,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.calendar_today_rounded, size: 14, color: Color.fromARGB(255, 80, 76, 73)),
                  const SizedBox(width: 6),
                  Text(
                    DateFormat('EEEE, dd MMMM yyyy').format(_selectedDate),
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF1864E8)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      _selectedSlot,
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 2. Service Address Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Service Address & Contact',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  InkWell(
                    onTap: () => setState(() => _currentStep = 1),
                    child: const Text(
                      'Edit',
                      style: TextStyle(
                        color: Color.fromARGB(255, 124, 113, 143),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20, color: Color(0xFFF1F5F9)),
              Text(
                '${_nameController.text.trim()} • ${_phoneController.text.trim()}',
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${_addressController.text.trim()}, ${_cityController.text.trim()}${_landmarkController.text.trim().isNotEmpty ? ' (Near ${_landmarkController.text.trim()})' : ''}',
                style: const TextStyle(color: Color(0xFF475569), fontSize: 12.5, height: 1.35),
              ),
              if (_latitude != null && _longitude != null) ...[
                const SizedBox(height: 6),
                const Row(
                  children: [
                    Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF1864E8)),
                    SizedBox(width: 5),
                    Text(
                      'Live location tagged for doorstep navigation',
                      style: TextStyle(color: Color(0xFF1864E8), fontSize: 11.5, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 3. Bill & Payment Breakdown
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFDBEAFE)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Payment Summary',
                style: TextStyle(
                  color: Color(0xFF1E40AF),
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const Divider(height: 20, color: Color(0xFFDBEAFE)),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      '${widget.subService.name} Visiting Fee',
                      style: const TextStyle(color: Color(0xFF475569), fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    '₹${_visitingCharge.toInt()}',
                    style: const TextStyle(color: Color(0xFF1864E8), fontSize: 14, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              for (final charge in _additionalCharges) ...[
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        charge.title,
                        style: const TextStyle(color: Color(0xFF475569), fontSize: 13),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      charge.isFree || charge.amount <= 0 ? 'FREE' : '₹${charge.amount.toInt()}',
                      style: TextStyle(
                        color: charge.isFree || charge.amount <= 0 ? const Color(0xFF10B981) : const Color(0xFF1864E8),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ],
              if (_appliedCoupon != null) ...[
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_rounded,
                              size: 14, color: Color(0xFF16A34A)),
                          const SizedBox(width: 5),
                          Text(
                            'Coupon Discount (${_appliedCoupon!.code})',
                            style: const TextStyle(
                              color: Color(0xFF16A34A),
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      '- ₹${_appliedCoupon!.discountAmount.toInt()}',
                      style: const TextStyle(
                        color: Color(0xFF16A34A),
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
              const Divider(height: 20, color: Color(0xFFDBEAFE)),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Total Amount Payable',
                      style: TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  if (_appliedCoupon != null) ...[
                    Text(
                      '₹${_basePayableAmount.toInt()}',
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 14,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    '₹${_totalPayableAmount.toInt()}',
                    style: const TextStyle(
                      color: Color(0xFF1864E8),
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Coupon Code Input (placed below Payment Summary)
        CouponInputCard(
          section: 'services',
          orderAmount: _basePayableAmount,
          appliedCoupon: _appliedCoupon,
          onCouponApplied: (coupon) {
            setState(() => _appliedCoupon = coupon);
          },
          onCouponRemoved: () {
            setState(() => _appliedCoupon = null);
          },
        ),
      ],
    );
  }

  // --- Bottom Sticky Action Bar ---
  Widget _buildBottomActionBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: Color(0xFFF1F5F9))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: Row(
            children: [
              if (_currentStep > 0) ...[
                OutlinedButton(
                  onPressed: _isProcessing ? null : _handleBackPress,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF0F172A),
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Back'),
                ),
                const SizedBox(width: 10),
              ],
              Expanded(
                child: ElevatedButton(
                  onPressed: _isProcessing
                      ? null
                      : () {
                          if (_currentStep == 0) {
                            _validateStep1AndProceed();
                          } else if (_currentStep == 1) {
                            _validateStep2AndProceed();
                          } else {
                            _startOnlinePayment();
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1864E8),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          _getBottomButtonLabel(),
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getBottomButtonLabel() {
    switch (_currentStep) {
      case 0:
        return 'Continue to Address →';
      case 1:
        return 'Review Booking Summary →';
      case 2:
        return 'Pay & Book Now (₹${_totalPayableAmount.toInt()}) →';
      default:
        return 'Continue →';
    }
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFF0F172A),
            fontSize: 14,
            fontWeight: FontWeight.w800,
            letterSpacing: -0.2,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          style: const TextStyle(color: Color(0xFF64748B), fontSize: 11.5),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String label, {IconData? prefixIcon, Widget? suffixIcon}) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
      prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 18, color: const Color(0xFF1864E8)) : null,
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
        borderSide: const BorderSide(color: Color(0xFF1864E8), width: 1.5),
      ),
    );
  }
}
