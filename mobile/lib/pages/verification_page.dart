import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:flutter/services.dart';
import 'package:salintinig/pages/set_new_password_page.dart';

class VerificationPage extends StatefulWidget {
  final String email;

  const VerificationPage({
    super.key,
    required this.email,
  });

  @override
  State<VerificationPage> createState() => _VerificationPageState();
}

class _VerificationPageState extends State<VerificationPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _hasError = false;

  void _onContinue() {
    Feedback.forTap(context);
    
    // Concatenate code
    final code = _controllers.map((c) => c.text).join();

    if (code.length < 6) {
      setState(() {
        _hasError = true;
      });
      return;
    }

    // Reference screenshot verification code: 416444
    if (code == '000000') {
      setState(() {
        _hasError = false;
      });

      // Verification successful flow -> Push to SetNewPasswordPage!
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const SetNewPasswordPage(),
        ),
      );
    } else {
      setState(() {
        _hasError = true;
      });
    }
  }

  void _onResendCode() {
    Feedback.forTap(context);
    setState(() {
      _hasError = false;
      for (var controller in _controllers) {
        controller.clear();
      }
      _focusNodes[0].requestFocus();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'A new verification code has been sent to ${widget.email}!',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.blue,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const borderRed = Color(0xFFEF4444);
    const bgRedTint = Color(0xFFFEF2F2);
    const borderSlate = Color(0xFFE4E4E7);

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

                    // 2. Middle Verification Form
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
                                      'Verification',
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
                                      'Enter the code to continue.',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: const Color(0xFF71717A),
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                    // "We sent code to email" text
                                    RichText(
                                      textAlign: TextAlign.center,
                                      text: TextSpan(
                                        style: GoogleFonts.inter(
                                          fontSize: 16,
                                          color: const Color(0xFF3F3F46),
                                          height: 1.4,
                                        ),
                                        children: [
                                          const TextSpan(text: 'We sent a code to\n'),
                                          TextSpan(
                                            text: widget.email,
                                            style: GoogleFonts.inter(
                                              fontWeight: FontWeight.bold,
                                              color: Colors.black,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 24),

                                    // 6 Digit OTP Row (Centered with uniform spacing)
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: List.generate(6, (index) {
                                        return Container(
                                          margin: const EdgeInsets.symmetric(horizontal: 5),
                                          width: 50,
                                          height: 50,
                                          child: TextField(
                                            controller: _controllers[index],
                                            focusNode: _focusNodes[index],
                                            keyboardType: TextInputType.number,
                                            textAlign: TextAlign.center,
                                            maxLength: 1,
                                            showCursor: false, // matches screenshot
                                            inputFormatters: [
                                              FilteringTextInputFormatter.digitsOnly,
                                            ],
                                            style: GoogleFonts.inter(
                                              fontSize: 22,
                                              fontWeight: FontWeight.bold,
                                              color: Colors.black,
                                            ),
                                            onChanged: (value) {
                                              if (_hasError) {
                                                setState(() {
                                                  _hasError = false;
                                                });
                                              }
                                              if (value.isNotEmpty) {
                                                if (index < 5) {
                                                  _focusNodes[index + 1].requestFocus();
                                                } else {
                                                  _focusNodes[index].unfocus();
                                                }
                                              } else {
                                                if (index > 0) {
                                                  _focusNodes[index - 1].requestFocus();
                                                }
                                              }
                                            },
                                            decoration: InputDecoration(
                                              counterText: "",
                                              filled: true,
                                              fillColor: _hasError ? bgRedTint : Colors.white,
                                              contentPadding: EdgeInsets.zero,
                                              enabledBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: BorderSide(
                                                  color: _hasError ? borderRed : borderSlate,
                                                  width: _hasError ? 1.5 : 1.0,
                                                ),
                                              ),
                                              focusedBorder: OutlineInputBorder(
                                                borderRadius: BorderRadius.circular(8),
                                                borderSide: BorderSide(
                                                  color: _hasError ? borderRed : primaryBlue,
                                                  width: 1.5,
                                                ),
                                              ),
                                            ),
                                          ),
                                        );
                                      }),
                                    ),

                                    const SizedBox(height: 24),
                                    // Continue Button
                                    ElevatedButton(
                                      onPressed: _onContinue,
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
                                        'Continue',
                                        style: GoogleFonts.inter(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 20),
                                    // Resend Code Helper Text
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          "Didn't receive a code? ",
                                          style: GoogleFonts.inter(
                                            fontSize: 15,
                                            color: const Color(0xFF71717A),
                                          ),
                                        ),
                                        GestureDetector(
                                          onTap: _onResendCode,
                                          child: Text(
                                            'Send again',
                                            style: GoogleFonts.inter(
                                              fontSize: 15,
                                              color: primaryBlue,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                      ],
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
                          Navigator.pop(context); // Pops VerificationPage
                          Navigator.pop(context); // Pops ForgotPasswordPage
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
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }
}
