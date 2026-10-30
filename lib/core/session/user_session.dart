import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../services/push_notification_service.dart';

 class UserSession {
  static final UserSession _instance = UserSession._internal();
  factory UserSession() => _instance;
  UserSession._internal();

  static SharedPreferences? _prefs;

  String? id;
  String? name;
  String? email;
  String? token;
  String? photoUrl;
  String? phone;
  String? city;

  /// Global reactive notifier for selected city (defaults to 'Udaipur')
  final ValueNotifier<String> selectedCityNotifier = ValueNotifier<String>('Udaipur');

  String? get userId => id;
  String get selectedCity => city ?? 'Udaipur';

  static const String _keyId = 'user_id';
  static const String _keyName = 'user_name';
  static const String _keyEmail = 'user_email';
  static const String _keyToken = 'user_token';
  static const String _keyPhoto = 'user_photo';
  static const String _keyPhone = 'user_phone';
  static const String _keyCity = 'user_selected_city';

  /// Initializes SharedPreferences and restores user session from disk
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    final instance = UserSession();

    instance.id = _prefs?.getString(_keyId);
    instance.name = _prefs?.getString(_keyName);
    instance.email = _prefs?.getString(_keyEmail);
    instance.token = _prefs?.getString(_keyToken);
    instance.photoUrl = _prefs?.getString(_keyPhoto);
    instance.phone = _prefs?.getString(_keyPhone);
    instance.city = _prefs?.getString(_keyCity) ?? 'Udaipur';
    instance.selectedCityNotifier.value = instance.city!;

    if (instance.token != null && instance.token!.isNotEmpty) {
      ApiClient().setAuthToken(instance.token!);
    }
  }

  /// Sets and persists the user's selected delivery city
  Future<void> setSelectedCity(String newCity) async {
    final cleanCity = newCity.trim();
    if (cleanCity.isEmpty) return;
    city = cleanCity;
    selectedCityNotifier.value = cleanCity;
    _prefs ??= await SharedPreferences.getInstance();
    await _prefs?.setString(_keyCity, cleanCity);
  }

  /// Whether a valid user session is stored 
  bool get isLoggedIn {
    return token != null && token!.trim().isNotEmpty;
  }

  /// Persists user credentials to disk
  Future<void> setUser({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? photoUrl,
    String? token,
  }) async {
      this.id = id ?? this.id;
      this.name = name ?? this.name;
      this.phone = phone ?? this.phone;
      this.photoUrl = photoUrl ?? this.photoUrl;
      this.token = token ?? this.token;
      this.email = email ?? this.email;
   
    _prefs ??= await SharedPreferences.getInstance();
    if (this.id != null) await _prefs?.setString(_keyId, this.id!);
    if (this.name != null) await _prefs?.setString(_keyName, this.name!);
    if (this.email != null) await _prefs?.setString(_keyEmail, this.email!);
    if (this.photoUrl != null) await _prefs?.setString(_keyPhoto, this.photoUrl!);
    if (this.phone != null) await _prefs?.setString(_keyPhone, this.phone!);

    if (this.token != null) {
      await _prefs?.setString(_keyToken, this.token!);
      ApiClient().setAuthToken(this.token!);
      final fcm = PushNotificationService().fcmToken;
      if (fcm != null) {
        PushNotificationService().syncTokenWithBackend(fcm);
      }
    }
  }

  /// Clears user credentials from memory and disk on logout
  Future<void> clear() async {
    id = null;
    name = null;
    email = null;
    photoUrl = null;
    token = null;
    phone = null;

    _prefs ??= await SharedPreferences.getInstance();
    await _prefs?.remove(_keyId);
    await _prefs?.remove(_keyName);
    await _prefs?.remove(_keyEmail);
    await _prefs?.remove(_keyToken);
    await _prefs?.remove(_keyPhoto);
    await _prefs?.remove(_keyPhone);

    ApiClient().clearAuthToken();
  }
}