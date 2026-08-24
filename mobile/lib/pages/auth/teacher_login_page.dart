import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:flutter/gestures.dart';
import 'package:salintinig/pages/auth/registration_page.dart';
import 'package:salintinig/pages/auth/forgot_password_page.dart';
import 'package:salintinig/pages/auth/force_change_password_page.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/services/auth_service.dart';

class TeacherLoginPage extends StatefulWidget {
  const TeacherLoginPage({super.key});

  @override
  State<TeacherLoginPage> createState() => _TeacherLoginPageState();
}

class _TeacherLoginPageState extends State<TeacherLoginPage> {
  final TextEditingController _teacherIdController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _hasError = false;
  bool _isLoading = false;
  String _errorMessage = '';

  void _resetState() {
    setState(() {
      _teacherIdController.clear();
      _passwordController.clear();
      _obscurePassword = true;
      _hasError = false;
    });
  }

  void _showContactAdminDialog() {
    Feedback.forTap(context);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const RegistrationPage(),
      ),
    ).then((_) {
      _resetState();
    });
  }

  void _showForgotPasswordDialog() {
    Feedback.forTap(context);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ForgotPasswordPage(),
      ),
    ).then((_) {
      _resetState();
    });
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const borderRed = Color(0xFFEF4444);
    const borderSlate = Color(0xFFE4E4E7);
    final activeBorderColor = _hasError ? borderRed : primaryBlue;
    final inactiveBorderColor = _hasError ? borderRed : borderSlate;

    return Scaffold(
      backgroundColor: const Color(0xFFFCFAF7),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            // On tablets (width > 600), center content with a max width so it
            // doesn't stretch across the full iPad canvas.
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
                            onPressed: () => Navigator.pop(context),
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

                    // 2. Middle Section (Expanded & Centered Scrollable content)
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
                                    const SizedBox(height: 24), // Top margin safety buffer
                                    // Role distinction badge
                                    Center(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFD34426).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          'TEACHER LOGIN',
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFFD34426),
                                            letterSpacing: 0.8,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    // Title
                                    Text(
                                      'Welcome Back!',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 32,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black,
                                        letterSpacing: -0.8,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    // Subtitle
                                    Text(
                                      'Login to your account to continue',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: const Color(0xFF71717A),
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                    // Teacher ID Field
                                    TextField(
                                      controller: _teacherIdController,
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
                                        hintText: 'Email/Teacher ID',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFA1A1AA),
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
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    // Password Field
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
                                        hintText: 'Password',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFA1A1AA),
                                        ),
                                        filled: true,
                                        fillColor: Colors.white,
                                        suffixIcon: IconButton(
                                          icon: Iconify(
                                            _obscurePassword ? Ph.eye_slash : Ph.eye,
                                            color: const Color(0xFFA1A1AA),
                                            size: 22,
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _obscurePassword = !_obscurePassword;
                                            });
                                          },
                                        ),
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
                                     const SizedBox(height: 12),
                                     // Forgot Password Link
                                     Align(
                                       alignment: Alignment.centerRight,
                                       child: TextButton(
                                         onPressed: _showForgotPasswordDialog,
                                         style: TextButton.styleFrom(
                                           padding: EdgeInsets.zero,
                                           minimumSize: Size.zero,
                                           tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                         ),
                                         child: Text(
                                           'Forgot your password?',
                                           style: GoogleFonts.inter(
                                             color: primaryBlue,
                                             fontWeight: FontWeight.w600,
                                             fontSize: 15,
                                           ),
                                         ),
                                       ),
                                     ),
                                     const SizedBox(height: 24),
                                     // Log in Button
                                     ElevatedButton(
                                       onPressed: _isLoading
                                           ? null
                                           : () async {
                                               final teacherId = _teacherIdController.text.trim();
                                               final password = _passwordController.text;

                                               if (teacherId.isEmpty || password.isEmpty) {
                                                 setState(() {
                                                   _hasError = true;
                                                   _errorMessage = 'Please enter both ID/Email and password.';
                                                 });
                                                 return;
                                               }

                                               setState(() {
                                                 _isLoading = true;
                                                 _hasError = false;
                                                 _errorMessage = '';
                                               });

                                               final navigator = Navigator.of(context);

                                               final response = await AuthService.login(
                                                 teacherId, 
                                                 password,
                                                 expectedRole: 'teacher',
                                               );

                                               if (!mounted) return;

                                               setState(() {
                                                 _isLoading = false;
                                               });

                                               if (response.success) {
                                                 final mustChange = response.data != null && 
                                                     (response.data['mustChangePassword'] == true || response.data['user']?['mustChangePassword'] == true || AuthService.currentUser?.mustChangePassword == true);

                                                 if (mustChange) {
                                                   navigator.pushAndRemoveUntil(
                                                     MaterialPageRoute(
                                                       builder: (context) => ForceChangePasswordPage(
                                                         email: teacherId,
                                                       ),
                                                     ),
                                                     (route) => false,
                                                   );
                                                 } else {
                                                   navigator.pushAndRemoveUntil(
                                                     MaterialPageRoute(
                                                       builder: (context) => const TeacherOverviewPage(),
                                                     ),
                                                     (route) => false,
                                                   );
                                                 }
                                               } else {
                                                 setState(() {
                                                   _hasError = true;
                                                   _errorMessage = response.error ?? 'Incorrect credentials, please try again.';
                                                 });
                                               }
                                             },
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
                                               'Log in',
                                               style: GoogleFonts.inter(
                                                 fontSize: 18,
                                                 fontWeight: FontWeight.bold,
                                               ),
                                             ),
                                     ),
                                     const SizedBox(height: 20),
                                     // Not registered yet? Contact admin
                                     Center(
                                       child: RichText(
                                         text: TextSpan(
                                           style: GoogleFonts.inter(
                                             fontSize: 15,
                                             color: const Color(0xFF71717A),
                                           ),
                                           children: [
                                             const TextSpan(text: 'Not registered yet? '),
                                             TextSpan(
                                               text: 'Contact admin',
                                               style: GoogleFonts.inter(
                                                 color: primaryBlue,
                                                 fontWeight: FontWeight.w600,
                                               ),
                                               recognizer: TapGestureRecognizer()
                                                 ..onTap = _showContactAdminDialog,
                                             ),
                                           ],
                                         ),
                                       ),
                                     ),
                                     const SizedBox(height: 24), // Bottom margin safety buffer
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // ── Footer — always pinned at the bottom ───────────────
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
                                color: const Color(0xFF3F3F46),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const TextSpan(text: '\nand '),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF3F3F46),
                                fontWeight: FontWeight.w600,
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
    _teacherIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
