import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:hipro_app/features/auth/screens/add_phone_screen.dart';
import '../../../config/theme/app_colors.dart';
import '../../../core/session/user_session.dart';
import '../../../core/widgets/hipro_logo.dart';
import '../../../main.dart';
import '../../navigation/main_nav_screen.dart';
import '../services/google_auth_service.dart';
import '../services/auth_api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final GoogleAuthService _googleAuthService = GoogleAuthService();
  final AuthApiService _authApiService = AuthApiService();

  bool _isSignUp = true;
  bool _isLoading = false;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _rememberMe = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
  String _getErrorMessage(dynamic e) {
    if (e is DioException) {
      final data  = e.response?.data;
      if (data is Map) {
        final message = data['message'] ?? data['error'];

         if (message != null && message.toString().trim().isNotEmpty) {
             return message.toString();
         }
         }
         else if(data is String && data.trim().isNotEmpty) {
          return data;
      }
      switch (e.type) {
        case DioException.connectionTimeout:
        case DioException.sendTimeout:
        case DioException.receiveTimeout:
          return 'Connection timed out the server might be waking up ';
        
        case DioException.connectionError:
          return 'unable to reach the server please check the internet connnection';
        
        case DioException.badResponse:
         final code = e.response?.statusCode;
          return 'Request failed with status code $code. Please try again.';
        
        default :
        return e.message ?? 'A network error occurred. Please try again.';
      }
    }
    return 'Something went wrong';
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.white, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Future<void> _handleGoogleSignIn() async {
    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final account = await _googleAuthService.signWithGoogle(context);

      if (account != null && mounted) {
        final syncRes = await _authApiService.syncGoogleUser(
          name: account.displayName ?? 'Google User',
          email: account.email,
          googleId: account.id,
          photoUrl: account.photoUrl,
        );
        final dynamic syncData = syncRes?.data;
        final String? token = syncData is Map ? syncData['token']?.toString(): null;

        final dynamic userData = syncData is Map ? syncData['user'] :null;

        final String? phoneNumber =userData is Map ? userData['phoneNumber']?.toString(): null;
        await UserSession().setUser(
          name: userData is Map ? userData['name']?.toString() ?? account.displayName : account.displayName,
          email: userData is Map ? userData['email']?.toString() ?? account.email : account.email,
          phone: userData is Map ? userData['phoneNumber']?.toString() ?? phoneNumber : phoneNumber,
          photoUrl: userData is Map ? userData['photoUrl']?.toString() ?? account.photoUrl : account.photoUrl,
          token: token,
        );

        appState.refreshAll();

        if (mounted) {

          if (phoneNumber == null || phoneNumber.trim().isEmpty) {
            Navigator.of(context).pushReplacement(
             // ✅ FIXED
MaterialPageRoute(
  builder: (context) => AddPhoneScreen(
    onphoneSaved: () {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const MainNavScreen()),
      );
    },
  ),
)

            );
          }else {
            _showSuccessSnackBar('Welcome, ${account.displayName ?? 'user'} ');
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const MainNavScreen(),)
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        _showErrorSnackBar('Google Sign-in failed: ${_getErrorMessage(e)}');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleAuthSubmit() async {
    FocusScope.of(context).unfocus();

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    // Validation
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');

    if (email.isEmpty) {
      _showErrorSnackBar('Please enter your email address');
      return;
    }

    if (!emailRegex.hasMatch(email)) {
      _showErrorSnackBar('Please enter a valid email address');
      return;
    }

    if (password.isEmpty) {
      _showErrorSnackBar('Please enter your password');
      return;
    }

    if (password.length < 6) {
      _showErrorSnackBar('Password must be at least 6 characters long');
      return;
    }

    if (_isSignUp) {
      final name = _nameController.text.trim();
      final phone = _phoneController.text.trim();
      final confirmPassword = _confirmPasswordController.text.trim();

      if (name.isEmpty) {
        _showErrorSnackBar('Please enter your full name');
        return;
      }

      if (name.length < 2) {
        _showErrorSnackBar('Full name must be at least 2 characters');
        return;
      }

      if (phone.isNotEmpty) {
        final cleanPhone = phone.replaceAll(RegExp(r'[^0-9]'), '');
        if (cleanPhone.length < 10) {
          _showErrorSnackBar('Please enter a valid 10-digit mobile number');
          return;
        }
      }

      if (confirmPassword.isEmpty) {
        _showErrorSnackBar('Please confirm your password');
        return;
      }

      if (password != confirmPassword) {
        _showErrorSnackBar('Passwords do not match');
        return;
      }

      setState(() => _isLoading = true);

      try {
        final res = await _authApiService.registerUser(
          name: name,
          email: email,
          password: password,
          phoneNumber: phone.isNotEmpty ? phone : null,
        );

        if (res != null && res.data != null) {
          final resData = res.data is Map ? res.data as Map : {};
          final userData = resData['user'] as Map<dynamic, dynamic>?;
          final token = resData['token']?.toString();

          await UserSession().setUser(
            name: userData?['name']?.toString() ?? name,
            email: userData?['email']?.toString() ?? email,
            phone: userData?['phoneNumber']?.toString() ?? (phone.isNotEmpty ? phone : null),
            token: token,
          );

          appState.refreshAll();

          if (mounted) {
            _showSuccessSnackBar(resData['message']?.toString() ?? 'Account created successfully!');
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const MainNavScreen()),
            );
          }
        } else {
          throw Exception('Invalid response received from server.');
        }
      } catch (e) {
        if (mounted) {
          _showErrorSnackBar(_getErrorMessage(e));
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    } else {
      // Standard Login
      setState(() => _isLoading = true);

      try {
        final res = await _authApiService.loginUser(email: email, password: password);

        if (res != null && res.data != null) {
          final resData = res.data is Map ? res.data as Map : {};
          final userData = resData['user'] as Map<dynamic, dynamic>?;
          final token = resData['token']?.toString();

          await UserSession().setUser(
            name: userData?['name']?.toString(),
            email: userData?['email']?.toString() ?? email,
            photoUrl: userData?['photoUrl']?.toString(),
            phone: userData?['phoneNumber']?.toString(),
            token: token,
          );

          appState.refreshAll();

          if (mounted) {
            _showSuccessSnackBar('Welcome back!');
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (context) => const MainNavScreen()),
            );
          }
        } else {
          throw Exception('Invalid login response from server.');
        }
      } catch (e) {
        if (mounted) {
          _showErrorSnackBar(_getErrorMessage(e));
        }
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              // Brand Logo & Header
              Center(
                child: Column(
                  children: [
                    const HiproLogo(size: 48, fontSize: 26),
                    const SizedBox(height: 20),
                    Text(
                      _isSignUp ? 'Create Account' : 'Welcome Back',
                      style: const TextStyle(
                        color: Color(0xFF0F172A),
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _isSignUp
                          ? 'Register to book inspections & track quotations'
                          : 'Sign in to access your dashboard & requests',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Segmented Toggle Tab (Sign In vs Register)
              Container(
                height: 46,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          if (_isSignUp) {
                            setState(() => _isSignUp = false);
                          }
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: !_isSignUp ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(9),
                            boxShadow: !_isSignUp
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.06),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    )
                                  ]
                                : null,
                          ),
                          child: Text(
                            'Sign In',
                            style: TextStyle(
                              color: !_isSignUp ? AppColors.primary : const Color(0xFF64748B),
                              fontWeight: !_isSignUp ? FontWeight.w700 : FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          if (!_isSignUp) {
                            setState(() => _isSignUp = true);
                          }
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: _isSignUp ? Colors.white : Colors.transparent,
                            borderRadius: BorderRadius.circular(9),
                            boxShadow: _isSignUp
                                ? [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.06),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    )
                                  ]
                                : null,
                          ),
                          child: Text(
                            'Register',
                            style: TextStyle(
                              color: _isSignUp ? AppColors.primary : const Color(0xFF64748B),
                              fontWeight: _isSignUp ? FontWeight.w700 : FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Full Name Field (Sign Up only)
              if (_isSignUp) ...[
                _buildFieldLabel('Full Name', isRequired: true),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _nameController,
                  hintText: 'Enter your full name',
                  prefixIcon: Icons.person_outline_rounded,
                  keyboardType: TextInputType.name,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 18),

                // Mobile Number (Sign Up only)
                _buildFieldLabel('Mobile Number', isRequired: false),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _phoneController,
                  hintText: 'e.g. 9876543210 (10 digits)',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 18),
              ],

              // Email Input Field
              _buildFieldLabel('Email Address', isRequired: true),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _emailController,
                hintText: 'Enter your email address',
                prefixIcon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
              ),

              const SizedBox(height: 18),

              // Password Input Field
              _buildFieldLabel('Password', isRequired: true),
              const SizedBox(height: 8),
              _buildTextField(
                controller: _passwordController,
                hintText: _isSignUp ? 'Create a password (min. 6 chars)' : 'Enter password',
                prefixIcon: Icons.lock_outline_rounded,
                obscureText: _obscurePassword,
                textInputAction: _isSignUp ? TextInputAction.next : TextInputAction.done,
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    color: const Color(0xFF94A3B8),
                    size: 20,
                  ),
                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                ),
              ),

              // Confirm Password Input Field (Sign Up only)
              if (_isSignUp) ...[
                const SizedBox(height: 18),
                _buildFieldLabel('Confirm Password', isRequired: true),
                const SizedBox(height: 8),
                _buildTextField(
                  controller: _confirmPasswordController,
                  hintText: 'Re-enter your password',
                  prefixIcon: Icons.lock_outline_rounded,
                  obscureText: _obscureConfirmPassword,
                  textInputAction: TextInputAction.done,
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: const Color(0xFF94A3B8),
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                  ),
                ),
              ],

              const SizedBox(height: 14),

              // Remember me & Forgot Password (Sign In only)
              if (!_isSignUp) ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: Checkbox(
                              value: _rememberMe,
                              onChanged: (val) {
                                setState(() => _rememberMe = val ?? true);
                              },
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                              activeColor: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Flexible(
                            child: Text(
                              'Remember me',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            behavior: SnackBarBehavior.floating,
                            content: Text('Password reset instructions will be sent to your email.'),
                          ),
                        );
                      },
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Forgot Password?',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
              ] else ...[
                const SizedBox(height: 10),
              ],

              // Submit Button (Login or Create Account)
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleAuthSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          _isSignUp ? 'Create Account' : 'Sign In',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.2,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 22),

              // OR Divider
              Row(
                children: const [
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 14),
                    child: Text(
                      'OR',
                      style: TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: Color(0xFFE2E8F0))),
                ],
              ),

              const SizedBox(height: 22),

              // Continue with Google Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton(
                  onPressed: _isLoading ? null : _handleGoogleSignIn,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    backgroundColor: Colors.white,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 22,
                        height: 22,
                        alignment: Alignment.center,
                        decoration: const BoxDecoration(shape: BoxShape.circle),
                        child: const Text(
                          'G',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFFEA4335),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Flexible(
                        child: Text(
                          'Continue with Google',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Color(0xFF1E293B),
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 28),

              // Toggle Sign In / Sign Up Link
              Center(
                child: FittedBox(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _isSignUp
                            ? 'Already have an account? '
                            : "Don't have an account? ",
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                      ),
                      GestureDetector(
                        onTap: () {
                          setState(() => _isSignUp = !_isSignUp);
                        },
                        child: Text(
                          _isSignUp ? 'Sign In' : 'Sign Up',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label, {bool isRequired = false}) {
    return Row(
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF334155),
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (isRequired)
          const Text(
            ' *',
            style: TextStyle(
              color: AppColors.error,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required IconData prefixIcon,
    TextInputType keyboardType = TextInputType.text,
    TextInputAction textInputAction = TextInputAction.next,
    bool obscureText = false,
    Widget? suffixIcon,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        obscureText: obscureText,
        enabled: !_isLoading,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: Color(0xFF0F172A),
        ),
        decoration: InputDecoration(
          prefixIcon: Icon(
            prefixIcon,
            color: const Color(0xFF94A3B8),
            size: 20,
          ),
          suffixIcon: suffixIcon,
          hintText: hintText,
          hintStyle: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 14,
            fontWeight: FontWeight.normal,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
      ),
    );
  }
}
