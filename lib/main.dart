import 'package:flutter/material.dart';

import 'config/constants/app_constants.dart';
import 'config/theme/app_theme.dart';
import 'core/services/push_notification_service.dart';
import 'core/session/user_session.dart';
import 'core/state/app_state.dart';
import 'package:firebase_core/firebase_core.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/navigation/main_nav_screen.dart';

final AppState appState = AppState();
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  appState.setNavigatorKey(navigatorKey);

  // High-priority image cache for instant rendering of services & subservices
  PaintingBinding.instance.imageCache.maximumSize = 1000;
  PaintingBinding.instance.imageCache.maximumSizeBytes = 100 * 1024 * 1024;

  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }

  try {
    await UserSession.init();
  } catch (e) {
    debugPrint('UserSession init error: $e');
  }

  // Launch the app immediately so the splash screen renders with zero delay
  runApp(const Hipro());

  // Initialize notifications asynchronously in background without blocking startup
  PushNotificationService().initialize(
    navigatorKey: navigatorKey,
    appState: appState,
  ).catchError((e) {
    debugPrint('PushNotificationService init error: $e');
  });
}

class Hipro extends StatelessWidget {
  const Hipro({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: AppConstants.appName,
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.light,
      debugShowCheckedModeBanner: false,
      home: UserSession().isLoggedIn
          ? const MainNavScreen()
          : const LoginScreen(),
    );
  }
}
