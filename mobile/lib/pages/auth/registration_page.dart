import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/auth/registration_loading_page.dart';
import 'package:salintinig/services/auth_service.dart';

class RegistrationPage extends StatefulWidget {
  const RegistrationPage({super.key});

  @override
  State<RegistrationPage> createState() => _RegistrationPageState();
}

class _RegistrationPageState extends State<RegistrationPage> {
  final TextEditingController _emailController = TextEditingController();
  bool _hasError = false;
  String _errorMessage = 'Please enter your email address.';

  bool _isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email);
  }

  void _onSubmit() async {
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

    setState(() {
      _hasError = false;
    });

    final response = await AuthService.contactAdmin(
      role: 'Student',
      firstName: 'Student',
      lastName: 'Request',
      email: email,
      sex: 'Male',
    );

    if (!mounted) return;

    if (response.success) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const RegistrationLoadingPage(),
        ),
      );
    } else {
      setState(() {
        _hasError = true;
        _errorMessage = response.error ?? 'Failed to submit registration request.';
      });
    }
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

                    // 2. Middle Section (Centered scrollable content)
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
                                      'Not yet registered?',
                                      textAlign: TextAlign.center,
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
                                      'Enter your email.',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: const Color(0xFF71717A),
                                      ),
                                    ),
                                    const SizedBox(height: 40),
                                    // Email Input Field
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
                                    // Contact Admin Button
                                    ElevatedButton(
                                      onPressed: _onSubmit,
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
                                        'Contact admin',
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

                    // 3. Footer (Fixed at the bottom)
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
    _emailController.dispose();
    super.dispose();
  }
}
