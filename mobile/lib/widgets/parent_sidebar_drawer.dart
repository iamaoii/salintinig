import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/parent/parent_overview_page.dart';
import 'package:salintinig/pages/parent/parent_phil_iri_assessment_page.dart';
import 'package:salintinig/pages/parent/parent_progress_reports_page.dart';
import 'package:salintinig/pages/parent/parent_settings_page.dart';
import 'package:salintinig/services/auth_service.dart';

Widget buildParentSidebarDrawer(BuildContext context, {required int activeIndex}) {
  const primaryBlue = Color(0xFF1B64D8);

  void navigateTo(int targetIndex, Widget targetPage) {
    Navigator.pop(context);
    if (activeIndex == targetIndex) return;

    if (targetIndex == 0) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const ParentOverviewPage()),
        (route) => route.isFirst,
      );
    } else if (targetIndex == 5) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => targetPage),
      );
    } else if (activeIndex == 0) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => targetPage),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => targetPage),
      );
    }
  }

  return Drawer(
    width: 290,
    backgroundColor: primaryBlue,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.only(
        topRight: Radius.circular(24),
        bottomRight: Radius.circular(24),
      ),
    ),
    child: Container(
      color: primaryBlue,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
              child: Row(
                children: [
                  Image.asset(
                    'assets/logo/logo_v2.webp',
                    height: 32,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'SalinTinig',
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: [
                  _buildDrawerTile(
                    context,
                    icon: Ph.house_bold,
                    label: 'Home',
                    isSelected: activeIndex == 0,
                    onTap: () => navigateTo(0, const ParentOverviewPage()),
                  ),
                  _buildDrawerTile(
                    context,
                    icon: PhIcons.examBold,
                    label: 'Phil-IRI Assessment',
                    isSelected: activeIndex == 1,
                    onTap: () => navigateTo(1, const ParentPhilIriAssessmentPage()),
                  ),
                  _buildDrawerTile(
                    context,
                    icon: PhIcons.hourglassBold,
                    label: 'Student Progress',
                    isSelected: activeIndex == 2,
                    onTap: () => navigateTo(2, const ParentProgressReportsPage()),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Divider(
                color: Colors.white.withValues(alpha: 0.2),
                thickness: 1.5,
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                children: [
                  _buildDrawerTile(
                    context,
                    icon: Ph.gear_bold,
                    label: 'Settings',
                    isSelected: activeIndex == 5,
                    onTap: () => navigateTo(5, const ParentSettingsPage()),
                  ),
                  const SizedBox(height: 4),
                  _buildDrawerTile(
                    context,
                    icon: Ph.sign_out_bold,
                    label: 'Log Out',
                    isSelected: false,
                    onTap: () {
                      Navigator.pop(context);
                      AuthService.showLogoutDialog(context, portalName: 'parent portal');
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

Widget _buildDrawerTile(
  BuildContext context, {
  required String icon,
  required String label,
  required bool isSelected,
  required VoidCallback onTap,
}) {
  const primaryBlue = Color(0xFF1B64D8);

  return Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Iconify(
                  icon,
                  size: 24,
                  color: isSelected ? primaryBlue : Colors.white,
                ),
              ),
              const SizedBox(width: 16),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  color: isSelected ? primaryBlue : Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
