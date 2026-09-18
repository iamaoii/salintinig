import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'dart:ui' as ui;

import 'package:salintinig/pages/common/loading_page.dart';
import 'package:salintinig/pages/parent/parent_overview_page.dart';
import 'package:salintinig/pages/student/student_overview_page.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';

class PasswordChangedSuccessPage extends StatelessWidget {
  const PasswordChangedSuccessPage({super.key});

  void _handleContinue(BuildContext context) {
    Feedback.forTap(context);

    final user = AuthService.currentUser;
    final hasToken = ApiService.authToken != null && ApiService.authToken!.isNotEmpty;

    if (user != null && hasToken) {
      Widget targetWidget;
      final role = user.role.toLowerCase();
      if (role == 'student') {
        targetWidget = const StudentOverviewPage();
      } else if (role == 'parent') {
        targetWidget = const ParentOverviewPage();
      } else {
        targetWidget = const TeacherOverviewPage();
      }

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => targetWidget),
        (route) => false,
      );
    } else {
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      } else {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoadingPage()),
          (route) => false,
        );
      }
    }
  }

  Widget _buildMascotWithShadow(
    String assetPath, {
    double widthFactor = 0.85,
    Offset shadowOffset = const Offset(4, 7),
    double blurRadius = 4.0,
  }) {
    return Center(
      child: FractionallySizedBox(
        widthFactor: widthFactor,
        child: AspectRatio(
          aspectRatio: 1.0,
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              // 1. Silhouette Shadow
              Positioned.fill(
                child: Transform.translate(
                  offset: shadowOffset,
                  child: ImageFiltered(
                    imageFilter: ui.ImageFilter.blur(
                      sigmaX: blurRadius,
                      sigmaY: blurRadius,
                    ),
                    child: Image.asset(
                      assetPath,
                      color: Colors.black.withValues(alpha: 0.3),
                      colorBlendMode: BlendMode.srcIn,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),
              // 2. Original Mascot
              Positioned.fill(
                child: Image.asset(
                  assetPath,
                  fit: BoxFit.contain,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softWhite = Color(0xFFE4E4E7);

    return Scaffold(
      backgroundColor: primaryBlue,
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
                    // 1. Header
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
                          // Back Arrow Button (pop all back to LoginPage)
                          IconButton(
                            onPressed: () => _handleContinue(context),
                            icon: Iconify(
                              Ph.arrow_u_up_left,
                              size: 32,
                              color: Colors.white,
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
                                color: Colors.white,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SalinTinig',
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // 2. Middle Mascot & Text
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
                                    // Mascot
                                    _buildMascotWithShadow(
                                      'assets/mascot/sally_celebration.webp',
                                      widthFactor: 0.70,
                                    ),
                                    const SizedBox(height: 32),
                                    // Title
                                    Text(
                                      'Changed Successfully.',
                                      textAlign: TextAlign.start,
                                      style: GoogleFonts.inter(
                                        fontSize: 32,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                        letterSpacing: -0.8,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    // Subtitle
                                    Text(
                                      'Protect and remember your new password.',
                                      textAlign: TextAlign.start,
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        color: softWhite.withValues(alpha: 0.85),
                                        height: 1.5,
                                      ),
                                    ),
                                    const SizedBox(height: 40),
                                    // Continue Button
                                    ElevatedButton(
                                      onPressed: () => _handleContinue(context),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.white,
                                        foregroundColor: primaryBlue,
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
                                    const SizedBox(height: 24),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
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
