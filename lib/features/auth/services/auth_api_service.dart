import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class AuthApiService {
  final ApiClient apiClient = ApiClient();

  // Handle standard Email & Password Registration
  Future<Response?> registerUser({
    required String name,
    required String email,
    required String password,
    String? phoneNumber,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'phoneNumber': phoneNumber,
          'authProvider': 'email',
        },
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Handle standard Email & Password Login
  Future<Response?> loginUser({
    required String email,
    required String password,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/login', // Replace with your backend's actual login route
        data: {
          'email': email,
          'password': password,
        },
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // Handle Google Auth syncing with your backend
  Future<Response?> syncGoogleUser({
    required String name,
    required String email,
    required String googleId,
    String? photoUrl,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/auth/google', // Replace with your backend's actual Google auth route
        data: {
          'name': name,
          'email': email,
          'googleId': googleId,
          'photoUrl': photoUrl,
          'authProvider': 'google',
        },
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }
}
