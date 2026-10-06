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
  final String categoryId;
  final String categoryName;
  final String subServiceName;
  final String issueDescription;
  final List<String> photos;
  final String propertyType; // House, Flat, Office
  final String address;
  final RequestStatus status;
  final DateTime createdAt;

  ServiceRequestModel({
    required this.id,
    required this.requestNumber,
    required this.categoryId,
    required this.categoryName,
    required this.subServiceName,
    required this.issueDescription,
    this.photos = const [],
    required this.propertyType,
    required this.address,
    this.status = RequestStatus.submitted,
    required this.createdAt,
  });
}
