import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/verification_page.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final TextEditingController _emailController = TextEditingController();
  bool _hasError = false;
  bool _isLoading = false;
  String _errorMessage = 'Please enter your email address.';

  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  void _onSendCode() {
    if (_isLoading) return;
    Feedback.forTap(context);
    final email = _emailController.text.trim();

    if (email.isEmpty) {
      setState(() {
        _errorMessage = 'Please enter your email address.';
        _hasError = true;
      });
      return;
    }

    if (!_isValidEmail(email)) {
      setState(() {
        _errorMessage = 'Please enter a valid email address.';
        _hasError = true;
      });
      return;
    }

    // Simulated existing accounts list for demonstration
    final List<String> existingEmails = [
      'student@edu.org.ph',
      'teacher@edu.org.ph',
    ];

    if (!existingEmails.contains(email.toLowerCase())) {
      setState(() {
        _errorMessage = "Account doesn't exist.";
        _hasError = true;
      });
      return;
    }

    // Success flow
    setState(() {
      _hasError = false;
      _isLoading = true;
    });

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => VerificationPage(email: email),
      ),
    ).then((_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
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

                    // 2. Middle Form Section (Scrollable & centered)
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
                                    const SizedBox(height: 24),
                                    // Title
                                    Text(
                                      'Forgot Password?',
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
                                      'No worries, We got you.',
                                      textAlign: TextAlign.start,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: const Color(0xFF71717A),
                                      ),
                                    ),
                                    const SizedBox(height: 40),
                                    // Email input
                                    TextField(
                                      controller: _emailController,
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
                                        hintText: 'Email',
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
                                     // Send Code Button
                                     ElevatedButton(
                                       onPressed: _isLoading ? null : _onSendCode,
                                       style: ElevatedButton.styleFrom(
                                         backgroundColor: primaryBlue,
                                         foregroundColor: Colors.white,
                                         disabledBackgroundColor: primaryBlue.withValues(alpha: 0.6),
                                         minimumSize: const Size(double.infinity, 56),
                                         shape: RoundedRectangleBorder(
                                           borderRadius: BorderRadius.circular(12),
                                         ),
                                         elevation: 0,
                                       ),
                                       child: _isLoading
                                           ? const SizedBox(
                                               width: 24,
                                               height: 24,
                                               child: CircularProgressIndicator(
                                                 strokeWidth: 2.5,
                                                 valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                               ),
                                             )
                                           : Text(
                                               'Send Code',
                                               style: GoogleFonts.inter(
                                                 fontSize: 18,
                                                 fontWeight: FontWeight.bold,
                                               ),
                                             ),
                                     ),
                                    const SizedBox(height: 24),
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
                          Navigator.pop(context);
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
    _emailController.dispose();
    super.dispose();
  }
}
