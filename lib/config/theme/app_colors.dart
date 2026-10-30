import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF315BE8);
  static const Color primaryLight = Color(0xFF5C7CFA);
  static const Color primaryDark = Color(0xFF203FAF);
  static const Color accent = Color(0xFFE51D74);
  static const Color accentLight = Color(0xFFFFE5F0);

  static const Color background = Color(0xFFF5F7FB);
  static const Color backgroundSoft = Color(0xFFEEF2F8);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF5F7FB);
  static const Color surfaceElevated = Color(0xFFE8EDF6);
  static const Color cardBg = Color(0xFFFFFFFF);

  static const Color textPrimary = Color(0xFF17223B);
  static const Color textSecondary = Color(0xFF4F5D75);
  static const Color textMuted = Color(0xFF7B879D);

  static const Color success = Color(0xFF169B62);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFE53955);
  static const Color info = Color(0xFF2F80ED);

  static const Color border = Color(0xFFDCE2EC);
  static const Color borderSubtle = Color(0xFFE9EDF4);

  static const LinearGradient brandGradient = LinearGradient(
    colors: [Color(0xFF315BE8), Color(0xFF5537C8), Color(0xFF7027B8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient goldGradient = LinearGradient(
    colors: [Color(0xFFE51D74), Color(0xFFFF6B5A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
