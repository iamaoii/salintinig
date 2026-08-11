import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/parent/parent_overview_page.dart';
import 'package:salintinig/services/api_service.dart';

class ParentLoginPage extends StatefulWidget {
  const ParentLoginPage({super.key});

  @override
  State<ParentLoginPage> createState() => _ParentLoginPageState();
}

class _ParentLoginPageState extends State<ParentLoginPage> {
  final TextEditingController _lrnController = TextEditingController();
  final TextEditingController _parentCodeController = TextEditingController();
  bool _obscureParentCode = true;
  bool _hasError = false;
  bool _isLoading = false;
  String _errorMessage = '';

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
                    // 1. Top Header (Back button & App Brand Logo)
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

                    // 2. Middle Body (Scrollable Form Content)
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
                                     // Role distinction badge
                                     Center(
                                       child: Container(
                                         padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                         decoration: BoxDecoration(
                                           color: const Color(0xFF1B64D8).withValues(alpha: 0.1),
                                           borderRadius: BorderRadius.circular(20),
                                         ),
                                         child: Text(
                                           'PARENT LOGIN',
                                           style: GoogleFonts.inter(
                                             fontSize: 12,
                                             fontWeight: FontWeight.w800,
                                             color: const Color(0xFF1B64D8),
                                             letterSpacing: 0.8,
                                           ),
                                         ),
                                       ),
                                     ),
                                     const SizedBox(height: 12),
                                      // Welcome Back! Title
                                      Center(
                                        child: Text(
                                          'Welcome Back!',
                                          style: GoogleFonts.inter(
                                            fontSize: 32,
                                            fontWeight: FontWeight.w800,
                                            color: Colors.black,
                                            letterSpacing: -0.8,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      // Subtitle
                                      Center(
                                        child: Text(
                                          'Login to your account to continue',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.inter(
                                            fontSize: 16,
                                            color: const Color(0xFF71717A),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 24),

                                    // LRN Field
                                    TextField(
                                      controller: _lrnController,
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
                                        hintText: 'LRN',
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFA1A1AA),
                                          fontSize: 16,
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

                                    // Parent Code Field
                                    TextField(
                                      controller: _parentCodeController,
                                      obscureText: _obscureParentCode,
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
                                        hintText: 'Parent Code',
                                        suffixIcon: IconButton(
                                          icon: Iconify(
                                            _obscureParentCode ? Ph.eye_slash : Ph.eye,
                                            color: const Color(0xFFA1A1AA),
                                            size: 22,
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _obscureParentCode = !_obscureParentCode;
                                            });
                                          },
                                        ),
                                        hintStyle: GoogleFonts.inter(
                                          color: const Color(0xFFA1A1AA),
                                          fontSize: 16,
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

                                    if (_hasError && _errorMessage.isNotEmpty) ...[
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

                                    // Log in Button
                                    ElevatedButton(
                                      onPressed: _isLoading
                                          ? null
                                          : () async {
                                              final lrn = _lrnController.text.trim();
                                              final parentCode = _parentCodeController.text.trim();

                                              if (lrn.isEmpty || parentCode.isEmpty) {
                                                setState(() {
                                                  _hasError = true;
                                                  _errorMessage = 'Please enter both LRN and Parent Code.';
                                                });
                                                return;
                                              }

                                              setState(() {
                                                _isLoading = true;
                                                _hasError = false;
                                                _errorMessage = '';
                                              });

                                              final navigator = Navigator.of(context);

                                              // Verify LRN and Parent Access Code via Public Auth API
                                              final response = await ApiService.post('/auth/verify-parent-code', {
                                                'lrn': lrn,
                                                'parentAccessCode': parentCode,
                                              });

                                              if (!mounted) return;

                                              setState(() {
                                                _isLoading = false;
                                              });

                                              if (response.success) {
                                                final childData = response.data?['student'];
                                                navigator.pushReplacement(
                                                  MaterialPageRoute(
                                                    builder: (context) => ParentOverviewPage(
                                                      linkedChild: childData,
                                                    ),
                                                  ),
                                                );
                                              } else {
                                                setState(() {
                                                  _hasError = true;
                                                  _errorMessage = response.error ?? 'Invalid LRN or Parent Code. Please try again.';
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
                                    const SizedBox(height: 24),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // 3. Footer — always pinned at the bottom
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
