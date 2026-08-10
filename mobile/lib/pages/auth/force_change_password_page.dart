import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/auth/password_changed_success_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';

class ForceChangePasswordPage extends StatefulWidget {
  final String? email;

  const ForceChangePasswordPage({
    super.key,
    this.email,
  });

  @override
  State<ForceChangePasswordPage> createState() => _ForceChangePasswordPageState();
}

class _ForceChangePasswordPageState extends State<ForceChangePasswordPage> {
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  bool _hasError = false;
  bool _isLoading = false;
  String _errorMessage = '';

  void _onSavePassword() async {
    FocusScope.of(context).unfocus();
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (newPassword.isEmpty || confirmPassword.isEmpty) {
      setState(() {
        _hasError = true;
        _errorMessage = 'Please enter and confirm your new password.';
      });
      return;
    }

    if (newPassword.length < 6) {
      setState(() {
        _hasError = true;
        _errorMessage = 'Password must be at least 6 characters long.';
      });
      return;
    }

    if (newPassword != confirmPassword) {
      setState(() {
        _hasError = true;
        _errorMessage = 'Passwords do not match.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _hasError = false;
      _errorMessage = '';
    });

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);

    final response = await ApiService.post('/auth/change-password', {
      'newPassword': newPassword,
    });

    if (!mounted) return;

    setState(() {
      _isLoading = false;
    });

    if (response.success) {
      // Re-fetch me to update user session state (mustChangePassword -> false)
      await AuthService.fetchMe();

      navigator.pushReplacement(
        MaterialPageRoute(
          builder: (context) => const PasswordChangedSuccessPage(),
        ),
      );
    } else {
      setState(() {
        _hasError = true;
        _errorMessage = response.error ?? 'Failed to update password. Please try again.';
      });
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            _errorMessage,
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: const Color(0xFFEF4444),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const borderRed = Color(0xFFEF4444);
    const borderSlate = Color(0xFFE4E4E7);
    const bgSoftLight = Color(0xFFFCFAF7);

    final activeBorderColor = _hasError ? borderRed : primaryBlue;
    final inactiveBorderColor = _hasError ? borderRed : borderSlate;

    return Scaffold(
      backgroundColor: bgSoftLight,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 520 : double.infinity,
                ),
                child: Column(
                  children: [
                    // ── 1. Top Header Bar (Back Arrow & SalinTinig Logo) ──────
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        isTablet ? 0 : 24.0,
                        16.0,
                        isTablet ? 0 : 24.0,
                        0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Back Arrow Button
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: Iconify(
                              Ph.arrow_u_up_left,
                              size: 32,
                              color: Colors.black,
                            ),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                          // SalinTinig App Brand Logo
                          Row(
                            children: [
                              Image.asset(
                                'assets/logo/logo_v2.webp',
                                height: 36,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SalinTinig',
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ── 2. Middle Body (Scrollable Form Content) ─────────────
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, middleConstraints) {
                          return SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                minHeight: middleConstraints.maxHeight,
                              ),
                              child: Padding(
                                padding: EdgeInsets.symmetric(
                                  horizontal: isTablet ? 0 : 28.0,
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.center,
                                  children: [
                                    // Slight top lift nudge
                                    const SizedBox(height: 12),

                                    // Lock Icon Badge
                                    Container(
                                      width: 64,
                                      height: 64,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFFFFBEB), // Soft warm yellow tint
                                        shape: BoxShape.circle,
                                      ),
                                      child: Center(
                                        child: Iconify(
                                          Ph.lock_key,
                                          size: 32,
                                          color: const Color(0xFFD97706), // Amber / Golden Orange lock
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 20),

                                    // Title
                                    Text(
                                      'Set Your New Password',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 24,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black,
                                        letterSpacing: -0.5,
                                      ),
                                    ),
                                    const SizedBox(height: 12),

                                    // Subtitle
                                    RichText(
                                      textAlign: TextAlign.center,
                                      text: TextSpan(
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          color: const Color(0xFF71717A),
                                          height: 1.45,
                                        ),
                                        children: const [
                                          TextSpan(text: 'You logged in using a '),
                                          TextSpan(
                                            text: 'temporary password',
                                            style: TextStyle(
                                              fontWeight: FontWeight.w700,
                                              color: Color(0xFF3F3F46),
                                            ),
                                          ),
                                          TextSpan(
                                            text: '. Please set a new permanent password to secure your account.',
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 32),

                                    // New Password Input
                                    TextField(
                                      controller: _newPasswordController,
                                      obscureText: _obscureNewPassword,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: Colors.black,
                                      ),
                                      onChanged: (_) {
                                        if (_hasError) {
                                          setState(() {
                                            _hasError = false;
                                          });
                                        }
                                      },
                                      decoration: InputDecoration(
                                        hintText: 'New Password (min 6 characters)',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFA1A1AA),
                                          fontSize: 15,
                                        ),
                                        filled: true,
                                        fillColor: Colors.white,
                                        contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 18,
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                            color: inactiveBorderColor,
                                            width: _hasError ? 1.5 : 1.0,
                                          ),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                            color: activeBorderColor,
                                            width: 1.5,
                                          ),
                                        ),
                                        suffixIcon: IconButton(
                                          icon: Iconify(
                                            _obscureNewPassword ? Ph.eye_slash : Ph.eye,
                                            color: const Color(0xFFA1A1AA),
                                            size: 22,
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _obscureNewPassword = !_obscureNewPassword;
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),

                                    // Confirm Password Input
                                    TextField(
                                      controller: _confirmPasswordController,
                                      obscureText: _obscureConfirmPassword,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: Colors.black,
                                      ),
                                      onChanged: (_) {
                                        if (_hasError) {
                                          setState(() {
                                            _hasError = false;
                                          });
                                        }
                                      },
                                      decoration: InputDecoration(
                                        hintText: 'Confirm New Password',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFA1A1AA),
                                          fontSize: 15,
                                        ),
                                        filled: true,
                                        fillColor: Colors.white,
                                        contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 18,
                                        ),
                                        enabledBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                            color: inactiveBorderColor,
                                            width: _hasError ? 1.5 : 1.0,
                                          ),
                                        ),
                                        focusedBorder: OutlineInputBorder(
                                          borderRadius: BorderRadius.circular(12),
                                          borderSide: BorderSide(
                                            color: activeBorderColor,
                                            width: 1.5,
                                          ),
                                        ),
                                        suffixIcon: IconButton(
                                          icon: Iconify(
                                            _obscureConfirmPassword ? Ph.eye_slash : Ph.eye,
                                            color: const Color(0xFFA1A1AA),
                                            size: 22,
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _obscureConfirmPassword = !_obscureConfirmPassword;
                                            });
                                          },
                                        ),
                                      ),
                                    ),

                                    if (_hasError && _errorMessage.isNotEmpty) ...[
                                      const SizedBox(height: 16),
                                      Text(
                                        _errorMessage,
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.inter(
                                          color: const Color(0xFFEF4444),
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],

                                    const SizedBox(height: 28),

                                    // Action Button
                                    ElevatedButton(
                                      onPressed: _isLoading ? null : _onSavePassword,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primaryBlue,
                                        foregroundColor: Colors.white,
                                        minimumSize: const Size(double.infinity, 56),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        elevation: 0,
                                      ),
                                      child: _isLoading
                                          ? const SizedBox(
                                              height: 24,
                                              width: 24,
                                              child: CircularProgressIndicator(
                                                color: Colors.white,
                                                strokeWidth: 2.5,
                                              ),
                                            )
                                          : Text(
                                              'Save Password & Continue',
                                              style: GoogleFonts.inter(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                    ),
                                     const SizedBox(height: 110), // Increased top lift nudge
                                   ],
                                 ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // ── 3. Bottom Footer (Terms of Service & Privacy Policy) ─
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        isTablet ? 0 : 24,
                        0,
                        isTablet ? 0 : 24,
                        24,
                      ),
                      child: RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: GoogleFonts.inter(
                            color: const Color(0xFF71717A),
                            fontSize: 13,
                            height: 1.5,
                          ),
                          children: [
                            const TextSpan(text: 'By signing in you accept the '),
                            TextSpan(
                              text: 'Terms of Service',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF3F3F46),
                              ),
                            ),
                            const TextSpan(text: '\nand '),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF3F3F46),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
