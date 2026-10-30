import 'package:flutter/foundation.dart';
import '../models/service_model.dart';
import '../../../core/services/activity_tracker.dart';

class CartItem {
  final ServiceItem service;
  final SubService subService;
  final DateTime addedAt;

  CartItem({
    required this.service,
    required this.subService,
    DateTime? addedAt,
  }) : addedAt = addedAt ?? DateTime.now();

  String get id => subService.id;
  String get name => subService.name;
  String? get titleHi => subService.titleHi;
  String get serviceName => service.name;
  double get visitingCharge => subService.visitingCharge;
  String? get image =>
      (subService.image != null && subService.image!.isNotEmpty)
          ? subService.image
          : (service.imageUrl.isNotEmpty ? service.imageUrl : null);
}

class CartService extends ChangeNotifier {
  CartService._();
  static final CartService instance = CartService._();

  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);
  int get count => _items.length;
  bool get isEmpty => _items.isEmpty;
  bool get isNotEmpty => _items.isNotEmpty;

  double get totalVisitingCharge =>
      _items.fold(0.0, (sum, item) => sum + item.visitingCharge);

  bool isInCart(String subServiceId) {
    return _items.any((item) => item.subService.id == subServiceId);
  }

  bool addItem(SubService subService, ServiceItem service) {
    if (!subService.bookNowEnabled) return false;
    if (isInCart(subService.id)) return false;
    _items.add(CartItem(service: service, subService: subService));
    notifyListeners();
    ActivityTracker.instance.trackCartUpdate(
      eventType: 'ADDED_TO_CART',
      items: _items,
      serviceId: service.id,
      serviceName: service.name,
      subServiceId: subService.id,
      subServiceName: subService.name,
    );
    return true;
  }

  void removeItem(String subServiceId) {
    CartItem? removed;
    for (final item in _items) {
      if (item.subService.id == subServiceId) {
        removed = item;
        break;
      }
    }
    _items.removeWhere((item) => item.subService.id == subServiceId);
    notifyListeners();
    ActivityTracker.instance.trackCartUpdate(
      eventType: 'REMOVED_FROM_CART',
      items: _items,
      serviceId: removed?.service.id,
      serviceName: removed?.service.name,
      subServiceId: subServiceId,
      subServiceName: removed?.subService.name,
    );
  }

  bool toggleItem(SubService subService, ServiceItem service) {
    if (isInCart(subService.id)) {
      removeItem(subService.id);
      return false;
    } else {
      addItem(subService, service);
      return true;
    }
  }

  void clear() {
    _items.clear();
    notifyListeners();
    ActivityTracker.instance.trackCartUpdate(
      eventType: 'CLEARED_CART',
      items: _items,
    );
  }
}
