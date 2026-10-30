import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../network/api_client.dart';
import '../session/user_session.dart';
import '../state/app_state.dart';
import '../widgets/chat_sheet.dart';
import '../../features/quotations/models/quotation_model.dart';
import '../../features/quotations/screens/quotation_details_screen.dart';
import '../../features/quotations/screens/quotation_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';

/// Top-level background message handler required by Firebase Messaging
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
    debugPrint('🔔 [FCM Background] Message ID: ${message.messageId}');
    debugPrint('🔔 [FCM Background] Data: ${message.data}');
  } catch (e) {
    debugPrint('Error in background message handler: $e');
  }
}

class PushNotificationService {
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'hipro_notifications_channel',
    'Hipro Notifications',
    description: 'Real-time alerts for quotations, inspection updates, and chat messages',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  GlobalKey<NavigatorState>? _navigatorKey;
  AppState? _appState;
  String? _currentToken;
  bool _initialized = false;

  String? get fcmToken => _currentToken;

  /// Initialize Firebase Messaging and Local Notifications
  Future<void> initialize({
    required GlobalKey<NavigatorState> navigatorKey,
    required AppState appState,
  }) async {
    if (_initialized) return;
    _initialized = true;

    _navigatorKey = navigatorKey;
    _appState = appState;

    try {
      // 1. Register background message handler
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 2. Request notification permissions (Android 13+ and iOS)
      await _requestPermissions();

      // 3. Setup local notifications for heads-up foreground banners
      await _initLocalNotifications();

      // 4. Retrieve & sync FCM token
      await _initToken();

      // 5. Setup foreground & tap listeners
      _setupMessageListeners();

      // 6. Check for app opened from terminated state
      await _checkInitialMessage();

      // 7. Subscribe to general broadcast topics
      await _subscribeToTopics();
    } catch (e) {
      debugPrint('Error initializing PushNotificationService: $e');
    }
  }

  /// Request permissions for alerts, badges, sounds
  Future<void> _requestPermissions() async {
    try {
      final NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
        announcement: false,
        carPlay: false,
        criticalAlert: false,
      );

      debugPrint('🔔 FCM Permission status: ${settings.authorizationStatus}');

      // Enable foreground notification presentation on iOS/Android
      await _fcm.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (e) {
      debugPrint('Error requesting notification permissions: $e');
    }
  }

  /// Setup Flutter Local Notifications
  Future<void> _initLocalNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/launcher_icon');

    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (response.payload != null && response.payload!.isNotEmpty) {
          try {
            final Map<String, dynamic> data = jsonDecode(response.payload!);
            _navigateByPayload(data);
          } catch (e) {
            debugPrint('Error parsing notification payload: $e');
          }
        }
      },
    );

    // Create high-importance notification channel for Android 8.0+
    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);
  }

  /// Retrieve current FCM token and listen for refreshes
  Future<void> _initToken() async {
    try {
      _currentToken = await _fcm.getToken();
      if (_currentToken != null) {
        debugPrint('📲 FCM Device Token: $_currentToken');
        await syncTokenWithBackend(_currentToken!);
      }

      // Listen for token refresh
      _fcm.onTokenRefresh.listen((newToken) async {
        _currentToken = newToken;
        debugPrint('📲 FCM Token Refreshed: $newToken');
        await syncTokenWithBackend(newToken);
      });
    } catch (e) {
      debugPrint('Error getting FCM token: $e');
    }
  }

  /// Sync device FCM token with backend API
  Future<void> syncTokenWithBackend(String token) async {
    try {
      final client = ApiClient();
      final session = UserSession();
      await client.dio.post(
        '/notifications/fcm-token',
        data: {
          'token': token,
          'email': session.email,
          'phone': session.phone,
          'platform': defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android',
        },
      );
      debugPrint('✅ FCM Token synced with backend');
    } catch (e) {
      debugPrint('Failed to sync FCM token with backend: $e');
    }
  }

  /// Listen for incoming messages while app is in foreground or opened from background
  void _setupMessageListeners() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('🔔 [FCM Foreground] Received: ${message.messageId}');
      debugPrint('🔔 [FCM Foreground] Title: ${message.notification?.title}');
      debugPrint('🔔 [FCM Foreground] Body: ${message.notification?.body}');
      debugPrint('🔔 [FCM Foreground] Data: ${message.data}');

      // Refresh all state in AppState so quotations, requests, and alerts update immediately
      _appState?.refreshAll();

    // Show high-priority heads-up notification banner
    final type = (message.data['type'] ?? '').toString().toUpperCase();
    final isChat = type == 'CHAT';
    final title = message.notification?.title ?? message.data['title'] ?? (isChat ? '💬 New Message' : '🎉 Quotation Ready!');
    final body = message.notification?.body ?? message.data['body'] ?? message.data['description'] ?? (isChat ? 'Tap to view chat message' : 'Your quotation is ready for review with itemized scope and pricing. Tap to review & approve.');

    if (title.isNotEmpty || body.isNotEmpty) {
      showLocalNotification(
        id: message.hashCode,
        title: title,
        body: body,
        payload: jsonEncode(message.data),
        summaryText: isChat ? 'Hipro Support Desk • Tap to Reply' : 'Official Estimate • Tap to Review',
      );
    }
  });

  // App opened from background by tapping notification
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    debugPrint('🔔 [FCM Opened] User tapped notification: ${message.data}');
    _appState?.refreshAll();
    _navigateByPayload(message.data);
  });
}

/// Check if the app was launched directly by clicking a notification from terminated state
Future<void> _checkInitialMessage() async {
  try {
    final RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('🔔 [FCM Initial] App opened from terminated by notification');
      // Delay slightly to allow Flutter tree to complete mounting
      Future.delayed(const Duration(milliseconds: 600), () {
        _appState?.refreshAll();
        _navigateByPayload(initialMessage.data);
      });
    }
  } catch (e) {
    debugPrint('Error checking initial FCM message: $e');
  }
}

/// Show heads-up notification banner via Flutter Local Notifications
Future<void> showLocalNotification({
  required int id,
  required String title,
  required String body,
  String? payload,
  String? summaryText,
}) async {
  final BigTextStyleInformation bigTextStyle = BigTextStyleInformation(
    body,
    htmlFormatBigText: false,
    contentTitle: title,
    htmlFormatContentTitle: false,
    summaryText: summaryText ?? 'Official Update • Tap to Open',
    htmlFormatSummaryText: false,
  );

    final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance: Importance.max,
      priority: Priority.high,
      icon: '@mipmap/launcher_icon',
      color: const Color(0xFF1864E8),
      styleInformation: bigTextStyle,
      playSound: true,
      enableVibration: true,
      enableLights: true,
      ledColor: const Color(0xFF1864E8),
      ledOnMs: 1000,
      ledOffMs: 500,
      ticker: title,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: platformDetails,
      payload: payload,
    );
  }

  /// Handle routing according to notification payload
  Future<void> _navigateByPayload(Map<String, dynamic> data) async {
    final navState = _navigatorKey?.currentState;
    if (navState == null) return;

    final type = (data['type'] ?? '').toString().toUpperCase();
    final quoteNumber = (data['quoteNumber'] ?? '').toString().trim();
    final quoteId = (data['quoteId'] ?? data['referenceId'] ?? '').toString().trim();
    final projectName = (data['projectName'] ?? 'Waterproofing & Civil Scope').toString();
    final location = (data['location'] ?? 'Site Location').toString();

    if (type == 'QUOTATION' || quoteNumber.isNotEmpty || quoteId.isNotEmpty) {
      // 1. Fetch latest quotations from server so the new quote is present
      if (_appState != null) {
        await _appState!.fetchQuotations();
      }

      QuotationModel? matchedQuote;
      if (_appState != null && _appState!.quotations.isNotEmpty) {
        try {
          matchedQuote = _appState!.quotations.firstWhere(
            (q) =>
                (quoteId.isNotEmpty && q.id == quoteId) ||
                (quoteNumber.isNotEmpty && q.quoteNumber.toLowerCase() == quoteNumber.toLowerCase()),
          );
        } catch (_) {
          // If no exact match, grab the newest quotation
          matchedQuote = _appState!.quotations.first;
        }
      }

      if (matchedQuote != null) {
        navState.push(
          MaterialPageRoute(
            builder: (_) => QuotationDetailsScreen(
              quotation: matchedQuote!,
              projectName: projectName.isNotEmpty ? projectName : matchedQuote.title,
              location: location.isNotEmpty ? location : matchedQuote.location,
            ),
          ),
        );
      } else {
        // Fallback to Quotations list screen (Section 2 = Quotations)
        navState.push(
          MaterialPageRoute(builder: (_) => const QuotationScreen(initialSection: 2)),
        );
      }
    } else if (type == 'REQUEST' || data.containsKey('requestId') || data.containsKey('requestNumber')) {
      navState.push(
        MaterialPageRoute(builder: (_) => const QuotationScreen(initialSection: 1)),
      );
    } else if (type == 'BOOKING' || data.containsKey('bookingNumber')) {
      navState.push(
        MaterialPageRoute(builder: (_) => const QuotationScreen(initialSection: 0)),
      );
    } else if (type == 'CHAT') {
      final threadId = data['threadId']?.toString() ?? data['referenceId']?.toString();
      final quoteNum = data['quoteNumber']?.toString();
      final reqNum = data['requestNumber']?.toString();
      final targetContext = _navigatorKey?.currentContext ?? navState.context;
      ChatSheet.show(
        targetContext,
        threadId: (threadId != null && threadId.isNotEmpty) ? threadId : null,
        title: data['title']?.toString() ?? '💬 Hipro Support Desk',
        subtitle: 'Er. Vikram Sharma • Senior Technical Lead',
        contextType: (quoteNum != null && quoteNum.isNotEmpty)
            ? 'QUOTATION'
            : ((reqNum != null && reqNum.isNotEmpty) ? 'REQUEST' : 'GENERAL'),
        quoteNumber: (quoteNum != null && quoteNum.isNotEmpty) ? quoteNum : null,
        requestNumber: (reqNum != null && reqNum.isNotEmpty) ? reqNum : null,
      );
    } else {
      navState.push(
        MaterialPageRoute(builder: (_) => const NotificationsScreen()),
      );
    }
  }

  /// Subscribe to broadcast topics
  Future<void> _subscribeToTopics() async {
    try {
      await _fcm.subscribeToTopic('hipro_all');
      await _fcm.subscribeToTopic('hipro_announcements');
      debugPrint('🔔 Subscribed to FCM topics: hipro, hipro_announcements');
    } catch (e) {
      debugPrint('Error subscribing to FCM topics: $e');
    }
  }
}
