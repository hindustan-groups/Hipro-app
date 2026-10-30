import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationApiService {
  final ApiClient apiClient;

  NotificationApiService(this.apiClient);

  Future<List<NotificationModel>> fetchNotifications() async {
    try {
      final response = await apiClient.dio.get(
        '/notifications',
        options: Options(
          validateStatus: (status) => status != null && status < 500,
        ),
      );
      if (response.statusCode == 200 && response.data != null) {
        final dynamic raw = response.data['data'] ?? response.data;
        if (raw is List) {
          return raw
              .map((e) => NotificationModel.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> markAsRead(String id) async {
    try {
      final response = await apiClient.dio.post('/notifications/$id/read');
      return response.statusCode == 200;
    } catch (_) {
      try {
        final res2 = await apiClient.dio.patch('/notifications/$id/read');
        return res2.statusCode == 200;
      } catch (e) {
        return false;
      }
    }
  }

  Future<bool> markAllAsRead() async {
    try {
      final response = await apiClient.dio.post('/notifications/mark-all-read');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
