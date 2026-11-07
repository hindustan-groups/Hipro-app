import 'package:flutter/foundation.dart';
import '../../../core/network/api_client.dart';
import '../../../core/session/user_session.dart';
import '../models/adventure_category_model.dart';
import '../models/experience_model.dart';

class EntApiService {
  static final EntApiService _instance = EntApiService._internal();
  factory EntApiService() => _instance;
  EntApiService._internal();

  final ApiClient _client = ApiClient();

  /// Fetches experience items with optional filters
  Future<List<ExperienceItem>> fetchExperiences({
    String? city,
    String? category,
    String? categoryId,
    String? search,
    String? sortBy,
    bool? featured,
  }) async {
    try {
      final Map<String, dynamic> queryParams = {};
      if (city != null && city.isNotEmpty && city.toLowerCase() != 'all') {
        queryParams['city'] = city;
      }
      if (categoryId != null && categoryId.isNotEmpty && categoryId.toLowerCase() != 'all') {
        queryParams['categoryId'] = categoryId;
      }
      if (category != null && category.isNotEmpty && category.toLowerCase() != 'all') {
        queryParams['category'] = category;
      }
      if (search != null && search.trim().isNotEmpty) {
        queryParams['search'] = search.trim();
      }
      if (sortBy != null && sortBy.isNotEmpty) {
        queryParams['sortBy'] = sortBy;
      }
      if (featured == true) {
        queryParams['featured'] = 'true';
      }

      final res = await _client.dio.get(
        '/ent',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      if (res.data != null && res.data['data'] is List) {
        final list = (res.data['data'] as List)
            .map((e) => ExperienceItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        return list;
      }
      return [];
    } catch (e) {
      debugPrint('[EntApiService] fetchExperiences error: $e');
      return [];
    }
  }

  /// Fetches single experience item with full details & reviews
  Future<ExperienceItem?> fetchExperienceDetails(String id) async {
    try {
      final res = await _client.dio.get('/ent/$id');
      if (res.data != null && res.data['data'] != null) {
        return ExperienceItem.fromJson(Map<String, dynamic>.from(res.data['data'] as Map));
      }
      return null;
    } catch (e) {
      debugPrint('[EntApiService] fetchExperienceDetails error: $e');
      return null;
    }
  }

  /// Fetches distinct cities list
  Future<List<String>> fetchCities() async {
    try {
      final res = await _client.dio.get('/ent/cities');
      if (res.data != null && res.data['cities'] is List) {
        return (res.data['cities'] as List).map((e) => e.toString()).toList();
      }
    } catch (e) {
      debugPrint('[EntApiService] fetchCities error: $e');
    }
    return [];
  }

  /// Fetches distinct categories list
  Future<List<String>> fetchCategories() async {
    try {
      final res = await _client.dio.get('/ent/categories');
      if (res.data != null && res.data['categories'] is List) {
        return (res.data['categories'] as List).map((e) => e.toString()).toList();
      }
    } catch (e) {
      debugPrint('[EntApiService] fetchCategories error: $e');
    }
    return [];
  }

  /// Fetches rich dynamic categories with icons, colors, taglines and sports counts
  Future<List<AdventureCategory>> fetchDynamicCategories() async {
    try {
      final res = await _client.dio.get('/ent/categories');
      if (res.data != null) {
        final list = res.data['data'] ?? res.data['items'];
        if (list is List && list.isNotEmpty) {
          return list
              .map((e) => AdventureCategory.fromJson(Map<String, dynamic>.from(e as Map)))
              .toList();
        }
      }
    } catch (e) {
      debugPrint('[EntApiService] fetchDynamicCategories error: $e');
    }
    return [];
  }

  /// Creates a booking for an experience
  Future<Map<String, dynamic>?> createBooking({
    required String entId,
    required String travelerName,
    required String travelerPhone,
    required String date,
    required String timeSlot,
    int guestsCount = 1,
    String? notes,
    String? paymentId,
    String? couponCode,
    double? totalAmount,
  }) async {
    try {
      final user = UserSession();
      final effectiveUserId = (user.phone != null && user.phone!.isNotEmpty)
          ? user.phone!
          : (user.userId ?? user.email ?? '');

      final payload = {
        'entId': entId,
        'experienceId': entId,
        'userId': effectiveUserId,
        'travelerName': travelerName,
        'travelerPhone': travelerPhone,
        'date': date,
        'timeSlot': timeSlot,
        'guestsCount': guestsCount,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (paymentId != null && paymentId.isNotEmpty) 'razorpayPaymentId': paymentId,
        if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
        if (totalAmount != null && totalAmount > 0) 'totalAmount': totalAmount,
      };

      final res = await _client.dio.post('/ent/bookings', data: payload);
      if (res.data != null && res.data['booking'] != null) {
        return Map<String, dynamic>.from(res.data['booking'] as Map);
      }
    } catch (e) {
      debugPrint('[EntApiService] createBooking error: $e');
    }
    return null;
  }

  /// Fetches user bookings
  Future<List<dynamic>> fetchUserBookings({String? userId, String? phone}) async {
    try {
      final user = UserSession();
      final targetUserId = userId ??
          ((user.phone != null && user.phone!.isNotEmpty)
              ? user.phone!
              : (user.userId ?? user.email ?? ''));
      final targetPhone = phone ?? user.phone;

      final res = await _client.dio.get(
        '/ent/my-bookings/$targetUserId',
        queryParameters: (targetPhone != null && targetPhone.isNotEmpty)
            ? {'phone': targetPhone}
            : null,
      );

      if (res.data != null && res.data['bookings'] is List) {
        return res.data['bookings'] as List;
      }
      return [];
    } catch (e) {
      debugPrint('[EntApiService] fetchUserBookings error: $e');
      return [];
    }
  }

  /// Cancels an existing booking
  Future<bool> cancelBooking({
    required String bookingId,
    String? reason,
  }) async {
    try {
      final res = await _client.dio.patch(
        '/ent/bookings/$bookingId/cancel',
        data: {'reason': reason ?? ''},
      );
      return res.statusCode == 200 && (res.data['success'] == true);
    } catch (e) {
      debugPrint('[EntApiService] cancelBooking error: $e');
      return false;
    }
  }

  /// Fetches reviews for an experience
  Future<List<dynamic>> fetchReviews(String entId) async {
    try {
      final res = await _client.dio.get('/ent/$entId/reviews');
      if (res.data != null && res.data['reviews'] is List) {
        return res.data['reviews'] as List;
      }
    } catch (e) {
      debugPrint('[EntApiService] fetchReviews error: $e');
    }
    return [];
  }

  /// Submits a review for an experience
  Future<bool> submitReview({
    required String entId,
    required String userName,
    required int rating,
    String? comment,
  }) async {
    try {
      final res = await _client.dio.post(
        '/ent/$entId/reviews',
        data: {
          'userName': userName,
          'rating': rating,
          if (comment != null && comment.isNotEmpty) 'comment': comment,
        },
      );
      return res.statusCode == 201 || res.statusCode == 200;
    } catch (e) {
      debugPrint('[EntApiService] submitReview error: $e');
      return false;
    }
  }

  /// Fetches club statistics & total bookings
  Future<Map<String, dynamic>?> fetchClubStats() async {
    try {
      final res = await _client.dio.get('/ent/admin/stats');
      if (res.data != null && res.data['success'] == true) {
        return Map<String, dynamic>.from(res.data as Map);
      }
    } catch (e) {
      debugPrint('[EntApiService] fetchClubStats error: $e');
    }
    return null;
  }
}
