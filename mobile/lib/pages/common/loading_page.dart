import 'package:flutter/material.dart';
import 'package:salintinig/pages/common/onboarding_page.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';

class LoadingPage extends StatefulWidget {
  const LoadingPage({super.key});

  @override
  State<LoadingPage> createState() => _LoadingPageState();
}

class _LoadingPageState extends State<LoadingPage> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  bool _isPrecached = false;

  @override
  void initState() {
    super.initState();
    
    // Animation controller for a smooth 1-second entrance animation
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );

    _scaleAnimation = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack, // Gives a slight, premium bounce to the logo
      ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Start precaching once dependencies (like context) are available
    if (!_isPrecached) {
      _precacheAssets();
    }
  }

  Future<void> _precacheAssets() async {
    try {
      // Precache all assets simultaneously to ensure zero frame drops or pop-ins
      await Future.wait([
        precacheImage(const AssetImage('assets/loading/bg_upper_left.webp'), context),
        precacheImage(const AssetImage('assets/loading/bg_lower_right.webp'), context),
        precacheImage(const AssetImage('assets/logo/logo_v1.webp'), context),
      ]);
    } catch (e) {
      // Fallback in case of asset loading issues (e.g. during rapid hot reloads)
      debugPrint("Asset pre-caching error: $e");
    }

    if (mounted) {
      setState(() {
        _isPrecached = true;
      });
      
      // Smoothly play the entrance animations
      _controller.forward();

      // Navigate to OnboardingPage after 2.8 seconds of clean, un-lagged visibility
      Timer(const Duration(milliseconds: 2800), _navigateToOnboarding);
    }
  }

  void _navigateToOnboarding() {
    if (!mounted) return;
    
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) => const OnboardingPage(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          // A premium fade-and-scale transition typical of professional apps:
          // The onboarding page will fade in while gently scaling from 96% to 100%
          final scaleAnimation = Tween<double>(begin: 0.96, end: 1.0).animate(
            CurvedAnimation(
              parent: animation,
              curve: Curves.easeInOutCubic,
            ),
          );

          return FadeTransition(
            opacity: animation,
            child: ScaleTransition(
              scale: scaleAnimation,
              child: child,
            ),
          );
        },
        transitionDuration: const Duration(milliseconds: 700), // Elegant, relaxed duration
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF195ECB), // Matches your base premium blue
      body: Stack(
        children: [
          // Top Left Highlight Decoration (fades in smoothly)
          if (_isPrecached)
            Positioned(
              top: 0,
              left: 0,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Image.asset(
                  'assets/loading/bg_upper_left.webp',
                ),
              ),
            ),
            
          // Bottom Right Highlight Decoration (fades in smoothly)
          if (_isPrecached)
            Positioned(
              bottom: 0,
              right: 0,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Image.asset(
                  'assets/loading/bg_lower_right.webp',
                ),
              ),
            ),
            
          // Center content (fades in and scales up with a premium spring curve)
          Center(
            child: _isPrecached
                ? FadeTransition(
                    opacity: _fadeAnimation,
                    child: ScaleTransition(
                      scale: _scaleAnimation,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // App Logo
                          Image.asset(
                            'assets/logo/logo_v1.webp',
                            width: 200,
                            height: 200,
                            fit: BoxFit.contain,
                          ),
                          const SizedBox(height: 8),
                          // App Name
                          Text(
                            'SalinTinig',
                            style: GoogleFonts.inter(
                              fontSize: 38,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: -1.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : const SizedBox.shrink(), // Keeps screen clean until fully precached
          ),
        ],
      ),
    );
  }
}
