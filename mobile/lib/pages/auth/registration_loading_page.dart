import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'package:salintinig/pages/auth/request_sent_page.dart';

class RegistrationLoadingPage extends StatefulWidget {
  const RegistrationLoadingPage({super.key});

  @override
  State<RegistrationLoadingPage> createState() => _RegistrationLoadingPageState();
}

class _RegistrationLoadingPageState extends State<RegistrationLoadingPage> {
  @override
  void initState() {
    super.initState();
    // Simulate email request transmission for 2 seconds, then transition smoothly
    Timer(const Duration(milliseconds: 2000), _navigateToRequestSent);
  }

  void _navigateToRequestSent() {
    if (!mounted) return;
    
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => const RequestSentPage(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          final fadeAnimation = CurvedAnimation(
            parent: animation,
            curve: Curves.easeInOutCubic,
          );
          return FadeTransition(
            opacity: fadeAnimation,
            child: child,
          );
        },
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const brandBlue = Color(0xFF195ECB); // Matches loading_page base premium blue
    const softWhite = Color(0xFFE4E4E7);

    return Scaffold(
      backgroundColor: brandBlue,
      body: Stack(
        children: [
          // 1. Top Left Highlight Decoration (brand background)
          Positioned(
            top: 0,
            left: 0,
            child: Image.asset(
              'assets/loading/bg_upper_left.webp',
            ),
          ),
          
          // 2. Bottom Right Highlight Decoration (brand background)
          Positioned(
            bottom: 0,
            right: 0,
            child: Image.asset(
              'assets/loading/bg_lower_right.webp',
            ),
          ),

          // 3. Centered Content (Logo, app name, spinner, and status text)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // App Logo (from brand loading page)
                  Image.asset(
                    'assets/logo/logo_v1.webp',
                    width: 140,
                    height: 140,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(height: 8),
                  // App Name
                  Text(
                    'SalinTinig',
                    style: GoogleFonts.inter(
                      fontSize: 34,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(height: 36),
                  // Circular progress loader
                  const SizedBox(
                    width: 48,
                    height: 48,
                    child: CircularProgressIndicator(
                      strokeWidth: 4.0,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Status text
                  Text(
                    'Sending request...',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Subtitle information
                  Text(
                    'Please wait while our system is sending the email to the administrator.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: softWhite.withValues(alpha: 0.8),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
