import 'package:flutter/material.dart';

import 'config/constants/app_constants.dart';
import 'config/theme/app_theme.dart';
import 'core/state/app_state.dart';
import 'features/navigation/main_nav_screen.dart';

final AppState appState = AppState();

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const Hipro());
}

class Hipro extends StatelessWidget {
  const Hipro({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: appState,
      builder: (context, child) {
        return MaterialApp(
          title: AppConstants.appName,
          theme: AppTheme.lightTheme,
          themeMode: ThemeMode.light,
          debugShowCheckedModeBanner: false,
          home: const MainNavScreen(),
        );
      },
    );
  }
}
