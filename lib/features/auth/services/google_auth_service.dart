import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/material.dart';

class GoogleAuthService {
  bool _isInitialized = false;

  Future<void> _initIfNeeded() async {
    if (!_isInitialized) {
      await GoogleSignIn.instance.initialize();
      _isInitialized = true;
    }
  }

  Future<GoogleSignInAccount?> signWithGoogle(BuildContext context) async {
    try {
      await _initIfNeeded();
      final GoogleSignInAccount account = await GoogleSignIn.instance.authenticate();
      return account;
    } catch (error) {
      final errStr = error.toString().toLowerCase();
      // User cancelled sign-in prompt - silently dismiss without error
      if (errStr.contains('cancel') ||
          errStr.contains('[16]') ||
          (error is GoogleSignInException && error.code == GoogleSignInExceptionCode.canceled)) {
        debugPrint('Google Sign-In was cancelled by user.');
        return null;
      }

      if (context.mounted) {
        String friendlyMessage = 'Google Sign-In was unsuccessful. Please try again.';
        if (errStr.contains('network') || errStr.contains('socket') || errStr.contains('host lookup')) {
          friendlyMessage = 'Network error. Please check your internet connection.';
        }

        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(friendlyMessage),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
    return null;
  }

  Future<void> signOut() async {
    await _initIfNeeded();
    await GoogleSignIn.instance.signOut();
  }
}