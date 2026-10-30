enum RequestStatus {
  submitted,
  estimating,
  quoted,
  paid,
  inProgress,
  completed,
  cancelled,
}

class ServiceRequestModel {
  final String id;
  final String requestNumber;
  final String? serviceId;
  final String? subServiceId;
  final String categoryId;
  final String categoryName;
  final String subServiceName;
  final String issueDescription;
  final List<String> photos;
  final String propertyType; // House, Flat, Office
  final String address;
  final String propertySize;
  final String location;
  final double? latitude;
  final double? longitude;
  final String preferredDate;
  final String preferredTime;
  final String urgency;
  final RequestStatus status;
  final DateTime createdAt;
  final bool requiresSiteAudit;
  final String? technicianName;
  final String? technicianPhone;
  final String? technicianRole;

  ServiceRequestModel({
    required this.id,
    required this.requestNumber,
    this.serviceId,
    this.subServiceId,
    required this.categoryId,
    required this.categoryName,
    required this.subServiceName,
    required this.issueDescription,
    this.photos = const [],
    required this.propertyType,
    required this.address,
    this.propertySize = '',
    this.location = '',
    this.latitude,
    this.longitude,
    this.preferredDate = '',
    this.preferredTime = '',
    this.urgency = 'NORMAL',
    this.status = RequestStatus.submitted,
    required this.createdAt,
    this.requiresSiteAudit = false,
    this.technicianName,
    this.technicianPhone,
    this.technicianRole,
  });

  ServiceRequestModel copyWith({
    String? id,
    String? requestNumber,
    String? serviceId,
    String? subServiceId,
    String? categoryId,
    String? categoryName,
    String? subServiceName,
    String? issueDescription,
    List<String>? photos,
    String? propertyType,
    String? address,
    String? propertySize,
    String? location,
    double? latitude,
    double? longitude,
    String? preferredDate,
    String? preferredTime,
    String? urgency,
    RequestStatus? status,
    DateTime? createdAt,
    bool? requiresSiteAudit,
    String? technicianName,
    String? technicianPhone,
    String? technicianRole,
  }) {
    return ServiceRequestModel(
      id: id ?? this.id,
      requestNumber: requestNumber ?? this.requestNumber,
      serviceId: serviceId ?? this.serviceId,
      subServiceId: subServiceId ?? this.subServiceId,
      categoryId: categoryId ?? this.categoryId,
      categoryName: categoryName ?? this.categoryName,
      subServiceName: subServiceName ?? this.subServiceName,
      issueDescription: issueDescription ?? this.issueDescription,
      photos: photos ?? this.photos,
      propertyType: propertyType ?? this.propertyType,
      address: address ?? this.address,
      propertySize: propertySize ?? this.propertySize,
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      preferredDate: preferredDate ?? this.preferredDate,
      preferredTime: preferredTime ?? this.preferredTime,
      urgency: urgency ?? this.urgency,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      requiresSiteAudit: requiresSiteAudit ?? this.requiresSiteAudit,
      technicianName: technicianName ?? this.technicianName,
      technicianPhone: technicianPhone ?? this.technicianPhone,
      technicianRole: technicianRole ?? this.technicianRole,
    );
  }

  factory ServiceRequestModel.fromJson(Map<String, dynamic> json) {
    final rawPhotos = json['mediaUrl'] ?? json['photos'];
    final statusStr = (json['status'] ?? 'submitted').toString().toLowerCase();

    return ServiceRequestModel(
      id: json['id'] ?? '',
      requestNumber: json['requestNumber'] ?? '',
      serviceId: json['serviceId']?.toString(),
      subServiceId: json['subServiceId']?.toString(),
      categoryId: json['servicecode'] ?? json['categoryId'] ?? '',
      categoryName: json['servicecode'] ?? json['categoryName'] ?? 'General Service',
      subServiceName: json['subServiceCode'] ?? json['subServiceName'] ?? 'Site Inspection',
      issueDescription: json['issueDescription'] ?? '',
      photos: rawPhotos is List ? rawPhotos.map((e) => e.toString()).toList() : [],
      propertyType: json['propertyType'] ?? 'Residential',
      address: json['addressline'] ?? json['address'] ?? json['location'] ?? '',
      propertySize: json['propertySize'] ?? '',
      location: json['location'] ?? json['addressline'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      preferredDate: json['preferredDate'] ?? '',
      preferredTime: json['preferredTime'] ?? '',
      urgency: json['urgency'] ?? 'NORMAL',
      technicianName: json['technicianName']?.toString(),
      technicianPhone: json['technicianPhone']?.toString(),
      technicianRole: json['technicianRole']?.toString(),
      requiresSiteAudit: json['requiresSiteAudit'] == true ||
          json['siteAudit'] == true ||
          (json['auditStatus'] != null && json['auditStatus'] != 'none') ||
          (statusStr.contains('audit')),
      status: () {
        if (statusStr == 'accepted' || statusStr == 'approved' || statusStr == 'paid') {
          return RequestStatus.paid;
        }
        if (statusStr == 'inprogress' || statusStr == 'in_progress' || statusStr == 'active') {
          return RequestStatus.inProgress;
        }
        if (statusStr == 'completed' || statusStr == 'done' || statusStr == 'finished') {
          return RequestStatus.completed;
        }
        if (statusStr == 'cancelled' || statusStr == 'canceled' || statusStr == 'rejected') {
          return RequestStatus.cancelled;
        }
        if (statusStr == 'estimating' || statusStr == 'under_review' || statusStr == 'reviewing' || statusStr.contains('audit')) {
          return RequestStatus.estimating;
        }
        if (statusStr == 'quoted') {
          return RequestStatus.quoted;
        }
        return RequestStatus.values.firstWhere(
          (e) => e.name.toLowerCase() == statusStr,
          orElse: () => RequestStatus.submitted,
        );
      }(),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }
}
