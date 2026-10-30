import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';
import '../models/direct_booking_model.dart';

class DirectBookingApiService {
  final ApiClient apiClient;

  DirectBookingApiService(this.apiClient);

  Future<List<DirectBookingModel>> fetchDirectBookings({
    String? phone,
    String? userId,
  }) async {
    try {
      final session = UserSession();
      final targetPhone = phone ?? session.phone;
      final targetUser = userId ?? session.userId;

      final Map<String, dynamic> queryParams = {};
      if (targetPhone != null && targetPhone.trim().isNotEmpty) {
        queryParams['customerPhone'] = targetPhone.trim();
      }
      if (targetUser != null && targetUser.trim().isNotEmpty) {
        queryParams['userId'] = targetUser.trim();
      }

      final response = await apiClient.dio.get(
        '/direct-bookings',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawList = response.data['bookings'] ?? response.data['data'] ?? response.data;
        if (rawList is List) {
          return rawList
              .map((e) => DirectBookingModel.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<DirectBookingModel?> getBookingDetails(String id) async {
    try {
      final response = await apiClient.dio.get('/direct-bookings/$id');
      if (response.statusCode == 200 && response.data != null) {
        final dynamic data = response.data['booking'] ?? response.data['data'] ?? response.data;
        if (data is Map) {
          return DirectBookingModel.fromJson(Map<String, dynamic>.from(data));
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<bool> cancelBooking({
    required String bookingId,
    required String cancelReason,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/direct-bookings/$bookingId/cancel',
        data: {'cancelReason': cancelReason},
      );
      return response.statusCode == 200 && (response.data['success'] == true);
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> rescheduleBooking({
    required String bookingId,
    required String scheduledDate,
    required String scheduledSlot,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/direct-bookings/$bookingId/reschedule',
        data: {
          'scheduledDate': scheduledDate,
          'scheduledSlot': scheduledSlot,
        },
      );
      return response.statusCode == 200 && (response.data['success'] == true);
    } catch (e) {
      rethrow;
    }
  }
}
