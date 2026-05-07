import 'package:flutter/material.dart';
import 'package:salintinig/pages/home_page.dart';
import 'dart:async';

class LandingPage extends StatefulWidget {
  const LandingPage({super.key});

  @override
  State<LandingPage> createState() => _LandingPageState();
}

class _LandingPageState extends State<LandingPage> {
  @override
  void initState() {
    super.initState();
    // Navigate to HomePage after 3 seconds with a slide-left animation
    Timer(const Duration(seconds: 3), () {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const HomePage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const begin = Offset(1.0, 0.0);
            const end = Offset.zero;
            const curve = Curves.easeInOutCubic;

            var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
            var offsetAnimation = animation.drive(tween);

            return SlideTransition(
              position: offsetAnimation,
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 600),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF195ECB), // Base blue color
      body: Stack(
        children: [
          // Top Left Highlight
          Positioned(
            top: 0,
            left: 0,
            child: Image.asset(
              'assets/landing/bg_upper_left.webp',
            ),
          ),
          // Bottom Right Highlight
          Positioned(
            bottom: 0,
            right: 0,
            child: Image.asset(
              'assets/landing/bg_lower_right.webp',
            ),
          ),
          // Center Content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo
                Image.asset(
                  'assets/logo/logo_v1.webp',
                  width: 200,
                  height: 200,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 8),
                // App Name
                const Text(
                  'SalinTinig',
                  style: TextStyle(
                    fontSize: 38,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -1.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
