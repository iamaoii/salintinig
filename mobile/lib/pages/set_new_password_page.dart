import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/reset_password_loading_page.dart';

class SetNewPasswordPage extends StatefulWidget {
  const SetNewPasswordPage({super.key});

  @override
  State<SetNewPasswordPage> createState() => _SetNewPasswordPageState();
}

class _SetNewPasswordPageState extends State<SetNewPasswordPage> {
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _hasError = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _errorMessage = 'Please create a new password.';

  void _onResetPassword() {
    Feedback.forTap(context);
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (password.isEmpty || confirmPassword.isEmpty) {
      setState(() {
        _errorMessage = 'Please fill out both password fields.';
        _hasError = true;
      });
      return;
    }

    if (password != confirmPassword) {
      setState(() {
        _errorMessage = 'Passwords do not match.';
        _hasError = true;
      });
      return;
    }

    // Success flow: Navigate to the ResetPasswordLoadingPage
    setState(() {
      _hasError = false;
    });

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => const ResetPasswordLoadingPage(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const borderRed = Color(0xFFEF4444);
    const bgRedTint = Color(0xFFFEF2F2);
    const borderSlate = Color(0xFFE4E4E7);
    final activeBorderColor = _hasError ? borderRed : primaryBlue;
    final inactiveBorderColor = _hasError ? borderRed : borderSlate;

    return Scaffold(
      backgroundColor: const Color(0xFFFCFAF7),
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
                    // 1. Header (Fixed at the top)
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
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: Iconify(
                              Ph.arrow_u_up_left,
                              size: 32,
                              color: Colors.black,
                            ),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                          // Logo and App Name
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

                    // 2. Middle Set Password Form (Centered & shifted upward)
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
                                  horizontal: isTablet ? 0 : 24.0,
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const SizedBox(height: 0),
                                    // Title
                                    Text(
                                      'Set New Password',
                                      textAlign: TextAlign.start,
                                      style: GoogleFonts.inter(
                                        fontSize: 32,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black,
                                        letterSpacing: -0.8,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    // Subtitle
                                    Text(
                                      'Create new unique password',
                                      textAlign: TextAlign.start,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: const Color(0xFF71717A),
                                      ),
                                    ),
                                    const SizedBox(height: 40),

                                    // Password field 1 (New Password)
                                    TextField(
                                      controller: _passwordController,
                                      obscureText: _obscurePassword,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: Colors.black,
                                      ),
                                      onChanged: (val) {
                                        if (_hasError) {
                                          setState(() {
                                            _hasError = false;
                                          });
                                        }
                                      },
                                      decoration: InputDecoration(
                                        hintText: 'New Password',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFA1A1AA),
                                        ),
                                        filled: true,
                                        fillColor: _hasError ? bgRedTint : Colors.white,
                                        contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 18,
                                        ),
                                        suffixIcon: IconButton(
                                          onPressed: () {
                                            Feedback.forTap(context);
                                            setState(() {
                                              _obscurePassword = !_obscurePassword;
                                            });
                                          },
                                          icon: Iconify(
                                            _obscurePassword ? Ph.eye_slash : Ph.eye,
                                            color: const Color(0xFFA1A1AA),
                                            size: 22,
                                          ),
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
                                      ),
                                    ),
                                    const SizedBox(height: 16),

                                    // Password field 2 (Confirm New Password)
                                    TextField(
                                      controller: _confirmPasswordController,
                                      obscureText: _obscureConfirmPassword,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: Colors.black,
                                      ),
                                      onChanged: (val) {
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
                                        ),
                                        filled: true,
                                        fillColor: _hasError ? bgRedTint : Colors.white,
                                        contentPadding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 18,
                                        ),
                                        suffixIcon: IconButton(
                                          onPressed: () {
                                            Feedback.forTap(context);
                                            setState(() {
                                              _obscureConfirmPassword = !_obscureConfirmPassword;
                                            });
                                          },
                                          icon: Iconify(
                                            _obscureConfirmPassword ? Ph.eye_slash : Ph.eye,
                                            color: const Color(0xFFA1A1AA),
                                            size: 22,
                                          ),
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
                                      ),
                                    ),

                                    if (_hasError) ...[
                                      const SizedBox(height: 16),
                                      Text(
                                        _errorMessage,
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.inter(
                                          color: const Color(0xFFEF4444),
                                          fontSize: 15,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 24),
                                    // Reset Password Button
                                    ElevatedButton(
                                      onPressed: _onResetPassword,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primaryBlue,
                                        foregroundColor: Colors.white,
                                        minimumSize: const Size(double.infinity, 56),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        elevation: 0,
                                      ),
                                      child: Text(
                                        'Reset Password',
                                        style: GoogleFonts.inter(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 155),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // 3. Bottom Pinned Link (Back to Log In)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 24.0),
                      child: TextButton(
                        onPressed: () {
                          Feedback.forTap(context);
                          Navigator.popUntil(context, (route) => route.isFirst);
                        },
                        style: TextButton.styleFrom(
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Iconify(
                              Ph.arrow_left,
                              color: primaryBlue,
                              size: 18,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Back to Log In',
                              style: GoogleFonts.inter(
                                color: primaryBlue,
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
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

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
