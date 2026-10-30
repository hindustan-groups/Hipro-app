import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../models/request_model.dart';

import '../../../core/session/user_session.dart';

class InspectionApiService {
  final ApiClient apiClient;

  InspectionApiService(this.apiClient);
  Future<ServiceRequestModel> submitInspectionRequest({
    required String categoryId,
    required String categoryName,
    required String subServiceName,
    required String issueDescription,
    required String propertyType,
    required String address,
    required List<String> localPhotoPaths,
    String? serviceId,
    String? subServiceId,
    double? latitude,
    double? longitude,
    String? propertySize,
    String? preferredDate,
    String? preferredTime,
    String? location,
    String? customerName,
    String? customerPhone,
  }) async {
    try {
      final List<String> cloudUrls = [];
      final List<String> localFiles = [];

      for (final p in localPhotoPaths) {
        if (p.startsWith('http://') || p.startsWith('https://')) {
          cloudUrls.add(p);
        } else if (p.isNotEmpty) {
          localFiles.add(p);
        }
      }

      final dateStr = (preferredDate != null && preferredDate.isNotEmpty)
          ? preferredDate
          : DateTime.now().toIso8601String().split('T')[0];
      final timeStr = (preferredTime != null && preferredTime.isNotEmpty)
          ? preferredTime
          : 'Morning (09:00 AM - 12:00 PM)';
      final sizeStr = (propertySize != null && propertySize.trim().isNotEmpty)
          ? propertySize.trim()
          : '1500 sq ft';
      final locStr = (location != null && location.trim().isNotEmpty)
          ? location.trim()
          : address;

      final session = UserSession();
      final phone = (customerPhone != null && customerPhone.trim().isNotEmpty)
          ? customerPhone.trim()
          : (session.phone ?? '').trim();
      if (phone.isEmpty && !session.isLoggedIn) {
        throw Exception('Please sign in or provide your mobile number to continue.');
      }
      final name = (customerName != null && customerName.trim().isNotEmpty)
          ? customerName.trim()
          : (session.name ?? 'Customer App User');

      Response response;

      if (localFiles.isEmpty) {
        // Send directly as JSON with cloud URLs
        final Map<String, dynamic> payload = {
          'servicecode': categoryName,
          'subServiceCode': subServiceName,
          'issueDescription': issueDescription,
          'propertyType': propertyType,
          'propertySize': sizeStr,
          'location': locStr,
          'preferredDate': dateStr,
          'preferredTime': timeStr,
          'addressline': address,
          'customerName': name,
          'customerPhone': phone,
          'phoneNumber': phone,
          'photos': cloudUrls,
          'mediaUrls': cloudUrls,
        };
        if (serviceId != null) payload['serviceId'] = serviceId;
        if (subServiceId != null) payload['subServiceId'] = subServiceId;
        if (latitude != null) payload['latitude'] = latitude;
        if (longitude != null) payload['longitude'] = longitude;

        response = await apiClient.dio.post('/requests', data: payload);
      } else {
        // Multipart if local files need to be sent
        final Map<String, dynamic> formMap = {
          'servicecode': categoryName,
          'subServiceCode': subServiceName,
          'issueDescription': issueDescription,
          'propertyType': propertyType,
          'propertySize': sizeStr,
          'location': locStr,
          'preferredDate': dateStr,
          'preferredTime': timeStr,
          'addressline': address,
          'customerName': name,
          'customerPhone': phone,
          'phoneNumber': phone,
        };
        if (serviceId != null) formMap['serviceId'] = serviceId;
        if (subServiceId != null) formMap['subServiceId'] = subServiceId;
        if (latitude != null) formMap['latitude'] = latitude;
        if (longitude != null) formMap['longitude'] = longitude;

        final formData = FormData.fromMap(formMap);

        for (final url in cloudUrls) {
          formData.fields.add(MapEntry('mediaUrls', url));
        }

        for (final path in localFiles) {
          formData.files.add(
            MapEntry(
              'damageImages',
              await MultipartFile.fromFile(path),
            ),
          );
        }

        response = await apiClient.dio.post('/requests', data: formData);
      }

      final dynamic body = response.data;

      if (response.statusCode !=201) {
        throw Exception('server did not confirm the request creation' 'Status:${response.statusCode}');
      }

      if (body is! Map || body['success'] !=true) {
         throw Exception(
          body is Map 
          ? body['message']?.toString() ?? 'Request creation failed' :'invalid server response');
      }
     
      final dynamic resData = body['data'];
      if (resData is! Map) {
        throw Exception('Request was not confirmed by the server');
        
      }
      final request = ServiceRequestModel.fromJson(
        Map<String,dynamic>.from(resData),
      );
      if (request.requestNumber.trim().isEmpty || request.requestNumber.trim().isEmpty) {
          throw Exception('server did not return a valid request number');
      }
      return request;
    } on DioException catch (dioErr) {
      String msg = 'Failed to submit inspection request';
      final resData = dioErr.response?.data;
      if (resData is Map && resData['message'] != null) {
        msg = resData['message'].toString();
      } else if (dioErr.response?.statusCode == 401) {
        msg = 'Session expired or unauthorized. Please login again.';
      } else if (dioErr.message != null && dioErr.message!.isNotEmpty) {
        msg = dioErr.message!;
      }
      throw Exception(msg);
    } catch (e) {
      final text = e.toString().replaceFirst('Exception: ', '');
      throw Exception(text);
    }
  }

  Future<List<ServiceRequestModel>> fetchRequests() async {
    try {
      final session = UserSession();
      final Map<String, dynamic> queryParams = {};
      final phone = session.phone?.trim();
      if (phone != null && phone.isNotEmpty) {
        queryParams['phone'] = phone;
      }
      final response = await apiClient.dio.get(
        '/requests',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      if (response.statusCode == 200 && response.data != null) {
        final List list = response.data['data'] ?? response.data;
        return list
            .map((e) => ServiceRequestModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<ServiceRequestModel> updateInspectionRequest({
    required String id,
    String? categoryName,
    String? subServiceName,
    String? issueDescription,
    String? propertyType,
    String? propertySize,
    String? address,
    String? location,
    String? preferredDate,
    String? preferredTime,
    String? urgency,
    String? status,
    List<String>? existingPhotos,
    List<String>? newLocalPhotos,
  }) async {
    try {
      final List<String> currentCloudUrls = List<String>.from(existingPhotos ?? []);
      final List<String> localFilesToUpload = [];

      if (newLocalPhotos != null) {
        for (final p in newLocalPhotos) {
          if (p.startsWith('http://') || p.startsWith('https://')) {
            currentCloudUrls.add(p);
          } else if (p.isNotEmpty) {
            localFilesToUpload.add(p);
          }
        }
      }

      Response response;

      if (localFilesToUpload.isEmpty) {
        final Map<String, dynamic> payload = {};
        if (categoryName != null) payload['servicecode'] = categoryName;
        if (subServiceName != null) payload['subServiceCode'] = subServiceName;
        if (issueDescription != null) payload['issueDescription'] = issueDescription;
        if (propertyType != null) payload['propertyType'] = propertyType;
        if (propertySize != null) payload['propertySize'] = propertySize;
        if (address != null) {
          payload['addressline'] = address;
          payload['location'] = location ?? address;
        } else if (location != null) {
          payload['location'] = location;
        }
        if (preferredDate != null) payload['preferredDate'] = preferredDate;
        if (preferredTime != null) payload['preferredTime'] = preferredTime;
        if (urgency != null) payload['urgency'] = urgency;
        if (status != null) payload['status'] = status;
        if (existingPhotos != null || newLocalPhotos != null) {
          payload['mediaUrls'] = currentCloudUrls;
          payload['photos'] = currentCloudUrls;
        }

        response = await apiClient.dio.put('/requests/$id', data: payload);
      } else {
        final formData = FormData();
        if (categoryName != null) formData.fields.add(MapEntry('servicecode', categoryName));
        if (subServiceName != null) formData.fields.add(MapEntry('subServiceCode', subServiceName));
        if (issueDescription != null) formData.fields.add(MapEntry('issueDescription', issueDescription));
        if (propertyType != null) formData.fields.add(MapEntry('propertyType', propertyType));
        if (propertySize != null) formData.fields.add(MapEntry('propertySize', propertySize));
        if (address != null) {
          formData.fields.add(MapEntry('addressline', address));
          formData.fields.add(MapEntry('location', location ?? address));
        } else if (location != null) {
          formData.fields.add(MapEntry('location', location));
        }
        if (preferredDate != null) formData.fields.add(MapEntry('preferredDate', preferredDate));
        if (preferredTime != null) formData.fields.add(MapEntry('preferredTime', preferredTime));
        if (urgency != null) formData.fields.add(MapEntry('urgency', urgency));
        if (status != null) formData.fields.add(MapEntry('status', status));

        for (final url in currentCloudUrls) {
          formData.fields.add(MapEntry('mediaUrls', url));
        }

        for (final path in localFilesToUpload) {
          formData.files.add(
            MapEntry(
              'damageImages',
              await MultipartFile.fromFile(path),
            ),
          );
        }

        response = await apiClient.dio.put('/requests/$id', data: formData);
      }

      final dynamic body = response.data;
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception('Server did not confirm request update. Status: ${response.statusCode}');
      }

      if (body is! Map || body['success'] != true) {
        throw Exception(body is Map ? body['message']?.toString() ?? 'Update failed' : 'Invalid response');
      }

      final dynamic resData = body['data'];
      if (resData is! Map) {
        throw Exception('Invalid data received from server');
      }

      return ServiceRequestModel.fromJson(Map<String, dynamic>.from(resData));
    } on DioException catch (dioErr) {
      String msg = 'Failed to update request';
      final resData = dioErr.response?.data;
      if (resData is Map && resData['message'] != null) {
        msg = resData['message'].toString();
      } else if (dioErr.response?.statusCode == 404) {
        msg = 'Inspection request not found or endpoint unavailable.';
      } else if (dioErr.response?.statusCode == 401) {
        msg = 'Session expired. Please log in again.';
      } else if (dioErr.message != null && dioErr.message!.isNotEmpty && !dioErr.message!.contains('RequestOptions.validateStatus')) {
        msg = dioErr.message!;
      }
      throw Exception(msg);
    } catch (e) {
      final text = e.toString().replaceFirst('Exception: ', '');
      throw Exception(text);
    }
  }
}
