  import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/auth/student_login_page.dart';
import 'package:salintinig/pages/auth/teacher_login_page.dart';
import 'package:salintinig/pages/auth/parent_login_page.dart';
import 'dart:ui' as ui;
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';

const String phBooksRegular = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="m231.65 194.55l-33.19-157.8a16 16 0 0 0-19-12.39l-46.81 10.06a16.08 16.08 0 0 0-12.3 19l33.19 157.8A16 16 0 0 0 169.16 224a16.3 16.3 0 0 0 3.38-.36l46.81-10.06a16.09 16.09 0 0 0 12.3-19.03M136 50.15v-.09l46.8-10l3.33 15.87L139.33 66Zm6.62 31.47l46.82-10.05l3.34 15.9L146 97.53Zm6.64 31.57l46.82-10.06l13.3 63.24l-46.82 10.06ZM216 197.94l-46.8 10l-3.33-15.87l46.8-10.07l3.33 15.85zM104 32H56a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h48a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M56 48h48v16H56Zm0 32h48v96H56Zm48 128H56v-16h48z"/></svg>';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            // On tablets (width > 600), center content with a max width so it
            // doesn't stretch across the full iPad canvas.
            final isTablet = constraints.maxWidth > 600;
            final double H = constraints.maxHeight;
            // iPhone SE and similar screens need a compact vertical rhythm,
            // while regular and taller screens retain the original sizing.
            final isCompactHeight = H < 720;
            final mascotHeight = isCompactHeight
                ? (H * 0.38).clamp(160.0, 250.0).toDouble()
                : H * 0.35;
            final headingSize = isCompactHeight ? 26.0 : 32.0;
            final buttonHeight = isCompactHeight ? 48.0 : 56.0;
            final sectionGap = isCompactHeight ? 8.0 : 32.0;
            final buttonGap = isCompactHeight ? 8.0 : 12.0;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 520 : double.infinity,
                ),
                child: Column(
                  children: [
                    // ── Scrollable body ────────────────────────────────────
                    Expanded(
                      child: Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal: isTablet ? 0 : 24.0,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(height: isCompactHeight ? 10 : 20),
                            // Header
                            Row(
                              children: [
                                Image.asset(
                                  'assets/logo/logo_v2.webp',
                                  height: 36,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'SalinTinig',
                                  style: GoogleFonts.inter(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.black,
                                    letterSpacing: -0.8,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: isCompactHeight ? 8 : H * 0.05),
                            // The mascot takes only the remaining vertical
                            // space, preventing it from pushing buttons/footer
                            // into each other on compact devices.
                            Expanded(
                              child: Center(
                                child: ConstrainedBox(
                                  constraints: BoxConstraints(maxHeight: mascotHeight),
                                  child: _buildMascotWithShadow(
                                    'assets/mascot/sally_standing.webp',
                                  ),
                                ),
                              ),
                            ),
                            SizedBox(height: isCompactHeight ? 8 : H * 0.04),
                            // Greetings
                            Text(
                              'Hello!',
                              style: GoogleFonts.inter(
                                fontSize: headingSize,
                                fontWeight: FontWeight.w800,
                                height: 1.1,
                                letterSpacing: -1.2,
                                color: Colors.black,
                              ),
                            ),
                            Text(
                              "Let's get you started.",
                              style: GoogleFonts.inter(
                                fontSize: headingSize,
                                fontWeight: FontWeight.w800,
                                height: 1.1,
                                letterSpacing: -1.2,
                                color: Colors.black,
                              ),
                            ),
                            SizedBox(height: isCompactHeight ? 6 : 12),
                            Text(
                              'Set up your account in few quick steps and explore everything the app has to offer.',
                              style: TextStyle(
                                fontSize: isCompactHeight ? 14 : 16,
                                color: Colors.grey[700],
                              ),
                            ),
                            SizedBox(height: sectionGap),
                            // Buttons
                            SizedBox(
                              height: buttonHeight,
                              child: _buildRoleButton(
                                iconSvg: phBooksRegular,
                                label: 'Student',
                                color: const Color(0xFF1B64D8),
                                isOutlined: false,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => const StudentLoginPage(),
                                    ),
                                  );
                                },
                              ),
                            ),
                            SizedBox(height: buttonGap),
                            SizedBox(
                              height: buttonHeight,
                              child: _buildRoleButton(
                                iconSvg: Ph.user_list,
                                label: 'Teacher',
                                color: const Color(0xFFD34426),
                                isOutlined: false,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => const TeacherLoginPage(),
                                    ),
                                  );
                                },
                              ),
                            ),
                            SizedBox(height: buttonGap),
                            SizedBox(
                              height: buttonHeight,
                              child: _buildRoleButton(
                                iconSvg: Ph.users,
                                label: 'Parent',
                                color: const Color(0xFF1B64D8),
                                isOutlined: true,
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => const ParentLoginPage(),
                                    ),
                                  );
                                },
                              ),
                            ),
                            SizedBox(height: isCompactHeight ? 8 : 32),
                          ],
                        ),
                      ),
                    ),

                    // ── Footer — always pinned at the bottom ───────────────
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        isTablet ? 0 : 24,
                        0,
                        isTablet ? 0 : 24,
                        isCompactHeight ? 8 : 16,
                      ),
                      child: RichText(
                        textAlign: TextAlign.center,
                        text: TextSpan(
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: isCompactHeight ? 11 : 12,
                          ),
                          children: [
                            const TextSpan(
                                text: 'By using this application you accept the '),
                            TextSpan(
                              text: 'Terms of Service',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const TextSpan(text: ' and '),
                            TextSpan(
                              text: 'Privacy Policy',
                              style: TextStyle(
                                color: Colors.grey[600],
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

  Widget _buildRoleButton({
    required String iconSvg,
    required String label,
    required Color color,
    required bool isOutlined,
    required VoidCallback onTap,
  }) {
    final buttonStyle = ElevatedButton.styleFrom(
      backgroundColor: isOutlined ? Colors.white : color,
      foregroundColor: isOutlined ? color : Colors.white,
      minimumSize: Size.zero,
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: isOutlined ? BorderSide(color: color, width: 2) : BorderSide.none,
      ),
      elevation: isOutlined ? 0 : 2,
    );

    return ElevatedButton(
      onPressed: onTap,
      style: buttonStyle,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Iconify(
            iconSvg,
            color: isOutlined ? color : Colors.white,
            size: 24,
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMascotWithShadow(
    String assetPath, {
    double widthFactor = 1.0,
    Offset shadowOffset = const Offset(4, 7), // Exact down-right sticker offset from onboarding
    double blurRadius = 4.0,                  // Crisp, defined outline blur
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
              // Silhouette sticker shadow
              Positioned.fill(
                child: Transform.translate(
                  offset: shadowOffset,
                  child: ImageFiltered(
                    imageFilter: ui.ImageFilter.blur(
                      sigmaX: blurRadius,
                      sigmaY: blurRadius,
                      tileMode: TileMode.decal,
                    ),
                    child: Image.asset(
                      assetPath,
                      color: Colors.black.withValues(alpha: 0.35),
                      colorBlendMode: BlendMode.srcIn,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),
              // High-resolution mascot
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
}
