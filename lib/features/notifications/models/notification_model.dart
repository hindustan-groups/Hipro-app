class NotificationModel {
  final String id;
  final String title;
  final String description;
  final String? imageUrl;
  final String type;
  final String referenceId;
  final String quoteNumber;
  final String requestNumber;
  final String bookingNumber;
  final String technicianName;
  final String technicianPhone;
  final String technicianRole;
  final num grandTotal;
  final String projectName;
  final String location;
  final bool unread;
  final String timestamp;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.description,
    this.imageUrl,
    this.type = 'GENERAL',
    this.referenceId = '',
    this.quoteNumber = '',
    this.requestNumber = '',
    this.bookingNumber = '',
    this.technicianName = '',
    this.technicianPhone = '',
    this.technicianRole = '',
    this.grandTotal = 0,
    this.projectName = '',
    this.location = '',
    this.unread = false,
    this.timestamp = '',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  bool get isQuotation =>
      type.toUpperCase() == 'QUOTATION' || quoteNumber.isNotEmpty;

  bool get isRequest => type.toUpperCase() == 'REQUEST';

  bool get isBooking =>
      type.toUpperCase() == 'BOOKING' || bookingNumber.isNotEmpty;

  bool get isChat => type.toUpperCase() == 'CHAT';

  String get threadId => referenceId;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate = DateTime.now();
    if (json['timestamp'] != null) {
      try {
        parsedDate = DateTime.parse(json['timestamp']);
      } catch (_) {}
    } else if (json['created_at'] != null) {
      try {
        parsedDate = DateTime.parse(json['created_at']);
      } catch (_) {}
    }

    num total = 0;
    if (json['grandTotal'] != null) {
      total = json['grandTotal'] is num
          ? json['grandTotal']
          : (num.tryParse(json['grandTotal'].toString()) ?? 0);
    }

    return NotificationModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Notification',
      description: json['description']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString(),
      type: json['type']?.toString() ?? 'GENERAL',
      referenceId: json['referenceId']?.toString() ??
          json['threadId']?.toString() ??
          '',
      quoteNumber: json['quoteNumber']?.toString() ?? '',
      requestNumber: json['requestNumber']?.toString() ??
          json['requestId']?.toString() ??
          '',
      bookingNumber: json['bookingNumber']?.toString() ?? '',
      technicianName: json['technicianName']?.toString() ?? '',
      technicianPhone: json['technicianPhone']?.toString() ?? '',
      technicianRole: json['technicianRole']?.toString() ?? '',
      grandTotal: total,
      projectName: json['projectName']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      unread: json['unread'] == true,
      timestamp: json['timestamp']?.toString() ?? '',
      createdAt: parsedDate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'imageUrl': imageUrl,
      'type': type,
      'referenceId': referenceId,
      'quoteNumber': quoteNumber,
      'requestNumber': requestNumber,
      'bookingNumber': bookingNumber,
      'technicianName': technicianName,
      'technicianPhone': technicianPhone,
      'technicianRole': technicianRole,
      'grandTotal': grandTotal,
      'projectName': projectName,
      'location': location,
      'unread': unread,
      'timestamp': timestamp,
    };
  }

  NotificationModel copyWith({bool? unread}) {
    return NotificationModel(
      id: id,
      title: title,
      description: description,
      imageUrl: imageUrl,
      type: type,
      referenceId: referenceId,
      quoteNumber: quoteNumber,
      requestNumber: requestNumber,
      bookingNumber: bookingNumber,
      technicianName: technicianName,
      technicianPhone: technicianPhone,
      technicianRole: technicianRole,
      grandTotal: grandTotal,
      projectName: projectName,
      location: location,
      unread: unread ?? this.unread,
      timestamp: timestamp,
      createdAt: createdAt,
    );
  }
}
