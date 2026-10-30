import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import '../../features/home/data/service_api_service.dart';
import '../network/api_client.dart';
import '../services/push_notification_service.dart';
import '../widgets/app_ui.dart';
import '../widgets/chat_sheet.dart';
import '../../features/home/data/slider_api_service.dart';
import '../../features/home/models/banner_slide.dart';
import '../../features/inspections/data/inspection_api_service.dart';
import '../../features/inspections/models/request_model.dart';
import '../../features/notifications/data/notification_api_service.dart';
import '../../features/notifications/models/notification_model.dart';
import '../../features/quotations/data/quotation_api_service.dart';
import '../../features/quotations/models/quotation_model.dart';
import '../../features/services/data/direct_booking_api_service.dart';
import '../../features/services/models/direct_booking_model.dart';
import '../../features/services/models/service_model.dart';

class AppState extends ChangeNotifier {
  final ApiClient apiClient = ApiClient();
  late final ServiceApiService _serviceApi;
  late final QuotationApiService _quotationApi;
  late final SliderApiService _sliderApi;
  late final InspectionApiService _inspectionApi;
  late final NotificationApiService _notificationApi;
  late final DirectBookingApiService _directBookingApi;

  GlobalKey<NavigatorState>? _navKey;
  Timer? _notificationPollTimer;
  final Set<String> _knownNotificationIds = {};
  bool _hasInitialPolled = false;

  void setNavigatorKey(GlobalKey<NavigatorState> key) {
    _navKey = key;
  }

  List<ServiceCategory> _categories = [];
  List<BannerSlide> _sliders = [];
  final List<ServiceRequestModel> _requests = [];
  List<QuotationModel> _quotations = [];
  List<NotificationModel> _notifications = [];
  List<DirectBookingModel> _directBookings = [];

  bool _isLoadingServices = false;
  bool _isLoadingQuotations = false;
  bool _isLoadingSliders = false;
  bool _isLoadingNotifications = false;
  bool _isLoadingDirectBookings = false;
  String? _servicesError;
  String? _quotationsError;
  String? _directBookingsError;

  List<ServiceCategory> get categories => List.unmodifiable(_categories);
  List<BannerSlide> get slides => List.unmodifiable(_sliders);
  List<ServiceRequestModel> get requests => List.unmodifiable(_requests);
  List<QuotationModel> get quotations => List.unmodifiable(_quotations);
  List<NotificationModel> get notifications => List.unmodifiable(_notifications);
  List<DirectBookingModel> get directBookings => List.unmodifiable(_directBookings);
  int get unreadNotificationsCount => _notifications.where((n) => n.unread).length;

  QuotationModel? get latestPendingQuotation {
    if (_quotations.isEmpty) return null;

    final userRequestIds = _requests.map((r) => r.id).toSet();
    final userRequestNumbers = _requests
        .map((r) => r.requestNumber)
        .where((n) => n.isNotEmpty)
        .toSet();

    // 1. Filter quotations matching user's requests
    List<QuotationModel> pending = [];
    if (userRequestIds.isNotEmpty || userRequestNumbers.isNotEmpty) {
      pending = _quotations.where((q) {
        if (q.status != QuoteDecision.pending) return false;
        return userRequestIds.contains(q.requestId) ||
            userRequestNumbers.contains(q.requestId) ||
            userRequestNumbers.contains(q.quoteNumber);
      }).toList();
    }

    // 2. Fallback: if no match via requests, inspect pending quotes fetched for this user
    if (pending.isEmpty) {
      pending = _quotations.where((q) => q.status == QuoteDecision.pending).toList();
    }

    if (pending.isEmpty) return null;
    pending.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return pending.first;
  }

  bool get isLoadingServices => _isLoadingServices;
  bool get isLoadingQuotations => _isLoadingQuotations;
  bool get isLoadingSliders => _isLoadingSliders;
  bool get isLoadingNotifications => _isLoadingNotifications;
  bool get isLoadingDirectBookings => _isLoadingDirectBookings;
  String? get servicesError => _servicesError;
  String? get quotationsError => _quotationsError;
  String? get directBookingsError => _directBookingsError;

  AppState() {
    _serviceApi = ServiceApiService(apiClient);
    _quotationApi = QuotationApiService(apiClient);
    _sliderApi = SliderApiService();
    _inspectionApi = InspectionApiService(apiClient);
    _notificationApi = NotificationApiService(apiClient);
    _directBookingApi = DirectBookingApiService(apiClient);

    refreshAll();
    _startNotificationPolling();
  }

  void _startNotificationPolling() {
    _notificationPollTimer?.cancel();
    _notificationPollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      pollNotificationsSilently();
    });
  }

  @override
  void notifyListeners() {
    final binding = WidgetsBinding.instance;
    final phase = binding.schedulerPhase;
    if (phase == SchedulerPhase.persistentCallbacks ||
        phase == SchedulerPhase.midFrameMicrotasks) {
      binding.addPostFrameCallback((_) {
        super.notifyListeners();
      });
    } else {
      super.notifyListeners();
    }
  }

  @override
  void dispose() {
    _notificationPollTimer?.cancel();
    super.dispose();
  }

  Future<void> refreshAll() async {
    await fetchRequests();
    await Future.wait([
      fetchServices(),
      fetchQuotations(),
      fetchSliders(),
      fetchNotifications(),
      fetchDirectBookings(),
    ]);
  }

  Future<void> fetchServices() async {
    if (_isLoadingServices) return;
    _isLoadingServices = true;
    _servicesError = null;
    notifyListeners();

    try {
      _categories = await _serviceApi.fetchCategories();
    } catch (e) {
      _servicesError = 'unable to load services please check connection';
    } finally {
      _isLoadingServices = false;
      notifyListeners();
    }
  }

  Future<void> fetchSliders() async {
    _isLoadingSliders = true;
    notifyListeners();
    try {
      _sliders = await _sliderApi.fetchSliders();
    } catch (_) {} finally {
      _isLoadingSliders = false;
      notifyListeners();
    }
  }

  Future<void> fetchQuotations() async {
    if (_isLoadingQuotations) return;
    _isLoadingQuotations = true;
    _quotationsError = null;
    notifyListeners();

    try {
      final allQuotes = await _quotationApi.fetchQuotations();
      if (_requests.isNotEmpty) {
        final userRequestIds = _requests.map((r) => r.id).toSet();
        final userRequestNumbers = _requests
            .map((r) => r.requestNumber)
            .where((n) => n.isNotEmpty)
            .toSet();

        final filtered = allQuotes.where((q) {
          return userRequestIds.contains(q.requestId) ||
              userRequestNumbers.contains(q.requestId) ||
              userRequestNumbers.contains(q.quoteNumber);
        }).toList();

        _quotations = filtered.isNotEmpty ? filtered : allQuotes;
      } else {
        _quotations = allQuotes;
      }
    } catch (e) {
      _quotationsError = 'unable to load quotations';
    } finally {
      _isLoadingQuotations = false;
      notifyListeners();
    }
  }

  Future<void> fetchRequests() async {
    try {
      final list = await _inspectionApi.fetchRequests();
      _requests.clear();
      _requests.addAll(list);
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching requests: $e');
    }
  }

  Future<void> fetchNotifications() async {
    _isLoadingNotifications = true;
    notifyListeners();
    try {
      final list = await _notificationApi.fetchNotifications();
      for (final n in list) {
        _knownNotificationIds.add(n.id);
      }
      _notifications = list;
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    } finally {
      _isLoadingNotifications = false;
      notifyListeners();
    }
  }

  Future<void> pollNotificationsSilently() async {
    try {
      final list = await _notificationApi.fetchNotifications();
      if (list.isEmpty) return;

      bool hasNew = false;
      for (final notif in list) {
        if (!_knownNotificationIds.contains(notif.id)) {
          _knownNotificationIds.add(notif.id);

          // If unread and CHAT
          if (notif.unread && notif.isChat) {
            hasNew = true;
            _triggerChatAlert(notif);
          }
        }
      }

      // If initial open and there is an unread CHAT notification
      if (!_hasInitialPolled) {
        _hasInitialPolled = true;
        final unreadChat = list.where((n) => n.unread && n.isChat).firstOrNull;
        if (unreadChat != null) {
          Future.delayed(const Duration(milliseconds: 700), () {
            _triggerChatAlert(unreadChat);
          });
        }
      }

      _notifications = list;
      if (hasNew) {
        notifyListeners();
      }
    } catch (_) {}
  }

  void _triggerChatAlert(NotificationModel notif) {
    try {
      // 1. System heads-up banner with sound & vibration
      PushNotificationService().showLocalNotification(
        id: notif.id.hashCode,
        title: notif.title,
        body: notif.description,
        summaryText: 'Support Desk • Tap to Reply',
        payload: jsonEncode({
          'type': 'CHAT',
          'threadId': notif.threadId,
          'quoteNumber': notif.quoteNumber,
          'requestNumber': notif.requestNumber,
          'title': notif.title,
          'body': notif.description,
        }),
      );
    } catch (_) {}

    // 2. In-app floating toast if context is mounted
    final ctx = _navKey?.currentContext;
    if (ctx != null) {
      try {
        AppToast.showChatNotification(
          ctx,
          title: notif.title,
          message: notif.description,
          onTapChat: () {
            markNotificationAsRead(notif.id);
            ChatSheet.show(
              ctx,
              threadId: notif.threadId.isNotEmpty ? notif.threadId : null,
              title: notif.title,
              subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
              contextType: notif.quoteNumber.isNotEmpty
                  ? 'QUOTATION'
                  : (notif.requestNumber.isNotEmpty ? 'REQUEST' : 'GENERAL'),
              quoteNumber: notif.quoteNumber.isNotEmpty ? notif.quoteNumber : null,
              requestNumber: notif.requestNumber.isNotEmpty ? notif.requestNumber : null,
            );
          },
        );
      } catch (_) {}
    }
  }

  Future<void> markNotificationAsRead(String id) async {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && _notifications[index].unread) {
      _notifications[index] = _notifications[index].copyWith(unread: false);
      notifyListeners();
      try {
        await _notificationApi.markAsRead(id);
      } catch (_) {}
    }
  }

  Future<void> markAllNotificationsAsRead() async {
    _notifications = _notifications.map((n) => n.copyWith(unread: false)).toList();
    notifyListeners();
    try {
      await _notificationApi.markAllAsRead();
    } catch (_) {}
  }

  // Fetch Direct Bookings from Backend
  Future<void> fetchDirectBookings() async {
    if (_isLoadingDirectBookings) return;
    _isLoadingDirectBookings = true;
    _directBookingsError = null;
    notifyListeners();

    try {
      final list = await _directBookingApi.fetchDirectBookings();
      _directBookings = list;
    } catch (e) {
      _directBookingsError = 'Unable to load direct bookings';
      debugPrint('Error fetching direct bookings: $e');
    } finally {
      _isLoadingDirectBookings = false;
      notifyListeners();
    }
  }

  // Cancel a Direct Booking
  Future<bool> cancelDirectBooking({
    required String bookingId,
    required String reason,
  }) async {
    try {
      final success = await _directBookingApi.cancelBooking(
        bookingId: bookingId,
        cancelReason: reason,
      );
      if (success) {
        await fetchDirectBookings();
      }
      return success;
    } catch (e) {
      debugPrint('Cancel direct booking error: $e');
      return false;
    }
  }

  // Reschedule a Direct Booking
  Future<bool> rescheduleDirectBooking({
    required String bookingId,
    required String scheduledDate,
    required String scheduledSlot,
  }) async {
    try {
      final success = await _directBookingApi.rescheduleBooking(
        bookingId: bookingId,
        scheduledDate: scheduledDate,
        scheduledSlot: scheduledSlot,
      );
      if (success) {
        await fetchDirectBookings();
      }
      return success;
    } catch (e) {
      debugPrint('Reschedule direct booking error: $e');
      rethrow;
    }
  }

  // Add new damage inspection request
  Future<ServiceRequestModel> submitRequest({
    required String categoryId,
    required String categoryName,
    required String subServiceName,
    required String issueDescription,
    required List<String> photos,
    required String propertyType,
    required String address,
    String? serviceId,
    String? subServiceId,
    double? latitude,
    double? longitude,
    String? propertySize,
    String? location,
    String? preferredDate,
    String? preferredTime,
    String? customerName,
    String? customerPhone,
  }) async {
    try {
      final newRequest = await _inspectionApi.submitInspectionRequest(
        categoryId: categoryId,
        categoryName: categoryName,
        subServiceName: subServiceName,
        issueDescription: issueDescription,
        propertyType: propertyType,
        address: address,
        localPhotoPaths: photos,
        serviceId: serviceId,
        subServiceId: subServiceId,
        latitude: latitude,
        longitude: longitude,
        propertySize: propertySize,
        location: location,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        customerName: customerName,
        customerPhone: customerPhone,
      );
      _requests.insert(0, newRequest);
      notifyListeners();
      return newRequest;
    } catch (e) {
      debugPrint('Submit request error: $e');
      rethrow;
    }
  }

  // Update existing damage inspection request
  Future<ServiceRequestModel> updateRequest({
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
      final updated = await _inspectionApi.updateInspectionRequest(
        id: id,
        categoryName: categoryName,
        subServiceName: subServiceName,
        issueDescription: issueDescription,
        propertyType: propertyType,
        propertySize: propertySize,
        address: address,
        location: location,
        preferredDate: preferredDate,
        preferredTime: preferredTime,
        urgency: urgency,
        status: status,
        existingPhotos: existingPhotos,
        newLocalPhotos: newLocalPhotos,
      );

      final index = _requests.indexWhere((r) => r.id == id);
      if (index != -1) {
        _requests[index] = updated;
      } else {
        _requests.insert(0, updated);
      }
      notifyListeners();
      return updated;
    } catch (e) {
      debugPrint('Update request error: $e');
      rethrow;
    }
  }

  // Accept Quotation & mark request as PAID
  Future<bool> acceptQuotation(String quoteId) async {
    try {
      final success = await _quotationApi.acceptQuotation(quoteId);
      if (success) {
        await fetchQuotations();
        await fetchRequests();
        notifyListeners();
      }
      return success;
    } catch (e) {
      debugPrint('Accept quotation error: $e');
      return false;
    }
  }

  // Reject Quotation
  Future<bool> rejectQuotation(String quoteId) async {
    try {
      final success = await _quotationApi.rejectQuotation(quoteId);
      if (success) {
        await fetchQuotations();
        await fetchRequests();
        notifyListeners();
      }
      return success;
    } catch (e) {
      debugPrint('Reject quotation error: $e');
      return false;
    }
  }
}
