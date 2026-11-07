class DirectBookingModel {
  final String id;
  final String bookingNumber;
  final String? userId;
  final String serviceId;
  final String subServiceId;
  final String serviceName;
  final String subServiceName;
  final String? subServiceDesc;
  final Map<String, dynamic>? customFieldAnswers;

  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final String city;
  final String? pincode;
  final String? landmark;
  final double? latitude;
  final double? longitude;
  final String scheduledDate;
  final String scheduledSlot;

  // Assigned Person / Technician Details
  final String? technicianId;
  final String? technicianName;
  final String? technicianPhone;
  final String? technicianRole;
  final String? technicianPhoto;
  final double technicianRating;
  final DateTime? assignedAt;

  final double visitingCharge;
  final double onlinePaidAmount;
  final double additionalWorkAmount;
  final double totalAmount;

  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final String? razorpayPaymentId;

  final String? notes;
  final String? cancelReason;
  final List<dynamic>? statusHistory;

  final String refundStatus;
  final double refundAmount;
  final String? refundReason;

  // Customer Service Rating & Review
  final double? customerRating;
  final String? customerReview;
  final DateTime? ratedAt;

  final DateTime createdAt;

  const DirectBookingModel({
    required this.id,
    required this.bookingNumber,
    this.userId,
    required this.serviceId,
    required this.subServiceId,
    required this.serviceName,
    required this.subServiceName,
    this.subServiceDesc,
    this.customFieldAnswers,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    required this.city,
    this.pincode,
    this.landmark,
    this.latitude,
    this.longitude,
    required this.scheduledDate,
    required this.scheduledSlot,
    this.technicianId,
    this.technicianName,
    this.technicianPhone,
    this.technicianRole,
    this.technicianPhoto,
    this.technicianRating = 4.9,
    this.assignedAt,
    required this.visitingCharge,
    required this.onlinePaidAmount,
    required this.additionalWorkAmount,
    required this.totalAmount,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    this.razorpayPaymentId,
    this.notes,
    this.cancelReason,
    this.statusHistory,
    required this.refundStatus,
    required this.refundAmount,
    this.refundReason,
    this.customerRating,
    this.customerReview,
    this.ratedAt,
    required this.createdAt,
  });

  bool get isAssigned =>
      technicianName != null && technicianName!.trim().isNotEmpty;

  factory DirectBookingModel.fromJson(Map<String, dynamic> json) {
    return DirectBookingModel(
      id: json['id']?.toString() ?? '',
      bookingNumber: json['bookingNumber']?.toString() ?? '',
      userId: json['userId']?.toString(),
      serviceId: json['serviceId']?.toString() ?? '',
      subServiceId: json['subServiceId']?.toString() ?? '',
      serviceName: json['serviceName']?.toString() ?? 'Home Service',
      subServiceName: json['subServiceName']?.toString() ?? 'On-Demand Visit',
      subServiceDesc: json['subServiceDesc']?.toString(),
      customFieldAnswers: json['customFieldAnswers'] is Map<String, dynamic>
          ? json['customFieldAnswers'] as Map<String, dynamic>
          : null,
      customerName: json['customerName']?.toString() ?? 'Customer',
      customerPhone: json['customerPhone']?.toString() ?? '',
      customerAddress: json['customerAddress']?.toString() ?? '',
      city: json['city']?.toString() ?? 'Bhilwara',
      pincode: json['pincode']?.toString(),
      landmark: json['landmark']?.toString(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      scheduledDate: json['scheduledDate']?.toString() ?? '',
      scheduledSlot: json['scheduledSlot']?.toString() ?? '',
      technicianId: json['technicianId']?.toString(),
      technicianName: json['technicianName']?.toString(),
      technicianPhone: json['technicianPhone']?.toString(),
      technicianRole: json['technicianRole']?.toString() ??
          (json['technicianName'] != null
              ? 'Certified Service Specialist'
              : null),
      technicianPhoto: json['technicianPhoto']?.toString(),
      technicianRating:
          (json['technicianRating'] as num?)?.toDouble() ?? 4.9,
      assignedAt: json['assignedAt'] != null
          ? DateTime.tryParse(json['assignedAt'].toString())
          : null,
      visitingCharge: (json['visitingCharge'] as num?)?.toDouble() ?? 199.0,
      onlinePaidAmount: (json['onlinePaidAmount'] as num?)?.toDouble() ?? 199.0,
      additionalWorkAmount:
          (json['additionalWorkAmount'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['totalAmount'] as num?)?.toDouble() ?? 199.0,
      status: json['status']?.toString().toUpperCase() ?? 'CONFIRMED',
      paymentStatus:
          json['paymentStatus']?.toString().toUpperCase() ?? 'PAID',
      paymentMethod:
          json['paymentMethod']?.toString().toUpperCase() ?? 'ONLINE',
      razorpayPaymentId: json['razorpayPaymentId']?.toString(),
      notes: json['notes']?.toString(),
      cancelReason: json['cancelReason']?.toString(),
      statusHistory: json['statusHistory'] as List<dynamic>?,
      refundStatus:
          json['refundStatus']?.toString().toUpperCase() ?? 'NONE',
      refundAmount: (json['refundAmount'] as num?)?.toDouble() ?? 0.0,
      refundReason: json['refundReason']?.toString(),
      customerRating: (json['customerRating'] as num?)?.toDouble(),
      customerReview: json['customerReview']?.toString(),
      ratedAt: json['ratedAt'] != null
          ? DateTime.tryParse(json['ratedAt'].toString())
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  DirectBookingModel copyWith({
    String? id,
    String? bookingNumber,
    String? userId,
    String? serviceId,
    String? subServiceId,
    String? serviceName,
    String? subServiceName,
    String? subServiceDesc,
    Map<String, dynamic>? customFieldAnswers,
    String? customerName,
    String? customerPhone,
    String? customerAddress,
    String? city,
    String? pincode,
    String? landmark,
    double? latitude,
    double? longitude,
    String? scheduledDate,
    String? scheduledSlot,
    String? technicianId,
    String? technicianName,
    String? technicianPhone,
    String? technicianRole,
    String? technicianPhoto,
    double? technicianRating,
    DateTime? assignedAt,
    double? visitingCharge,
    double? onlinePaidAmount,
    double? additionalWorkAmount,
    double? totalAmount,
    String? status,
    String? paymentStatus,
    String? paymentMethod,
    String? razorpayPaymentId,
    String? notes,
    String? cancelReason,
    List<dynamic>? statusHistory,
    String? refundStatus,
    double? refundAmount,
    String? refundReason,
    double? customerRating,
    String? customerReview,
    DateTime? ratedAt,
    DateTime? createdAt,
  }) {
    return DirectBookingModel(
      id: id ?? this.id,
      bookingNumber: bookingNumber ?? this.bookingNumber,
      userId: userId ?? this.userId,
      serviceId: serviceId ?? this.serviceId,
      subServiceId: subServiceId ?? this.subServiceId,
      serviceName: serviceName ?? this.serviceName,
      subServiceName: subServiceName ?? this.subServiceName,
      subServiceDesc: subServiceDesc ?? this.subServiceDesc,
      customFieldAnswers: customFieldAnswers ?? this.customFieldAnswers,
      customerName: customerName ?? this.customerName,
      customerPhone: customerPhone ?? this.customerPhone,
      customerAddress: customerAddress ?? this.customerAddress,
      city: city ?? this.city,
      pincode: pincode ?? this.pincode,
      landmark: landmark ?? this.landmark,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      scheduledSlot: scheduledSlot ?? this.scheduledSlot,
      technicianId: technicianId ?? this.technicianId,
      technicianName: technicianName ?? this.technicianName,
      technicianPhone: technicianPhone ?? this.technicianPhone,
      technicianRole: technicianRole ?? this.technicianRole,
      technicianPhoto: technicianPhoto ?? this.technicianPhoto,
      technicianRating: technicianRating ?? this.technicianRating,
      assignedAt: assignedAt ?? this.assignedAt,
      visitingCharge: visitingCharge ?? this.visitingCharge,
      onlinePaidAmount: onlinePaidAmount ?? this.onlinePaidAmount,
      additionalWorkAmount: additionalWorkAmount ?? this.additionalWorkAmount,
      totalAmount: totalAmount ?? this.totalAmount,
      status: status ?? this.status,
      paymentStatus: paymentStatus ?? this.paymentStatus,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      razorpayPaymentId: razorpayPaymentId ?? this.razorpayPaymentId,
      notes: notes ?? this.notes,
      cancelReason: cancelReason ?? this.cancelReason,
      statusHistory: statusHistory ?? this.statusHistory,
      refundStatus: refundStatus ?? this.refundStatus,
      refundAmount: refundAmount ?? this.refundAmount,
      refundReason: refundReason ?? this.refundReason,
      customerRating: customerRating ?? this.customerRating,
      customerReview: customerReview ?? this.customerReview,
      ratedAt: ratedAt ?? this.ratedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
