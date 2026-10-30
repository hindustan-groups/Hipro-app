import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../session/user_session.dart';
import '../../features/services/data/cart_service.dart';

class ActivityTracker {
  ActivityTracker._internal();
  static final ActivityTracker instance = ActivityTracker._internal();

  static const String _keyGuestId = 'hipro_guest_tracker_id';
  String? _guestId;

  /// Retrieves or generates a persistent device/guest UUID
  Future<String> _getGuestId() async {
    if (_guestId != null && _guestId!.isNotEmpty) {
      return _guestId!;
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      var id = prefs.getString(_keyGuestId);
      if (id == null || id.isEmpty) {
        id = 'guest_${DateTime.now().millisecondsSinceEpoch}_${(1000 + (DateTime.now().microsecond % 9000))}';
        await prefs.setString(_keyGuestId, id);
      }
      _guestId = id;
      return id;
    } catch (_) {
      return 'guest_${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  /// Fire-and-forget payload dispatcher to backend
  Future<void> _postEvent({
    required String eventType,
    String? serviceId,
    String? serviceName,
    String? subServiceId,
    String? subServiceName,
    Map<String, dynamic>? cartSnapshot,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final guestId = await _getGuestId();
      final session = UserSession();

      final payload = {
        'userId': session.id,
        'guestId': guestId,
        'customerName': session.name,
        'customerPhone': session.phone,
        'customerEmail': session.email,
        'city': session.selectedCity,
        'eventType': eventType,
        'serviceId': serviceId,
        'serviceName': serviceName,
        'subServiceId': subServiceId,
        'subServiceName': subServiceName,
        'cartSnapshot': cartSnapshot,
        'metadata': {
          'timestamp': DateTime.now().toIso8601String(),
          ...?metadata,
        },
      };

      // Non-blocking fire-and-forget call
      unawaited(() async {
        try {
          await ApiClient().dio.post('/activity/track', data: payload);
        } catch (err) {
          debugPrint('[ActivityTracker] Track failed silently: $err');
        }
      }());
    } catch (e) {
      debugPrint('[ActivityTracker] Error preparing activity log: $e');
    }
  }

  /// Track when customer is exploring a service or subservice
  void trackServiceExploration({
    required String serviceId,
    required String serviceName,
    String? subServiceId,
    String? subServiceName,
    Map<String, dynamic>? metadata,
  }) {
    // Generate snapshot of current cart as context
    final cartSnapshot = _buildCartSnapshot(CartService.instance.items);

    _postEvent(
      eventType: subServiceName != null ? 'VIEWED_SUBSERVICE' : 'EXPLORING_SERVICE',
      serviceId: serviceId,
      serviceName: serviceName,
      subServiceId: subServiceId,
      subServiceName: subServiceName,
      cartSnapshot: cartSnapshot,
      metadata: metadata,
    );
  }

  /// Track cart modifications (ADD, REMOVE, VIEW)
  void trackCartUpdate({
    required String eventType,
    required List<CartItem> items,
    String? serviceId,
    String? serviceName,
    String? subServiceId,
    String? subServiceName,
    Map<String, dynamic>? metadata,
  }) {
    final cartSnapshot = _buildCartSnapshot(items);

    _postEvent(
      eventType: eventType,
      serviceId: serviceId,
      serviceName: serviceName,
      subServiceId: subServiceId,
      subServiceName: subServiceName,
      cartSnapshot: cartSnapshot,
      metadata: metadata,
    );
  }

  /// Builds a serializable JSON map of cart contents
  Map<String, dynamic> _buildCartSnapshot(List<CartItem> items) {
    final double totalAmount = items.fold(0.0, (sum, i) => sum + i.visitingCharge);
    return {
      'count': items.length,
      'totalAmount': totalAmount,
      'items': items.map((item) => {
        'id': item.id,
        'name': item.name,
        'titleHi': item.titleHi,
        'serviceName': item.serviceName,
        'visitingCharge': item.visitingCharge,
        'image': item.image,
      }).toList(),
    };
  }
}
