import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_activities_page.dart';
import 'package:salintinig/pages/teacher/teacher_class_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_class_progress_page.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/pages/teacher/teacher_phil_iri_records_page.dart';
import 'package:salintinig/pages/teacher/teacher_profile_page.dart';
import 'package:salintinig/pages/teacher/teacher_settings_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class TeacherSidebarDrawer extends StatelessWidget {
  final String activeRoute;

  const TeacherSidebarDrawer({
    super.key,
    this.activeRoute = 'Overview',
  });

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFFD34426);
    final user = AuthService.currentUser;
    final String teacherName = user?.displayName ?? 'Teacher';
    final String? teacherImageUrl = (user?.rawUser?['profileImage'] ?? user?.rawUser?['profile_image'])?.toString();

    final rawSection = user?.sectionName ?? '';
    final grade = user?.gradeLevel ?? '';
    String displaySectionTitle = 'Grade 4 - Fyang';
    if (rawSection.toLowerCase().startsWith('grade')) {
      displaySectionTitle = rawSection;
    } else if (rawSection.isNotEmpty && grade.isNotEmpty) {
      displaySectionTitle = 'Grade $grade - $rawSection';
    } else if (rawSection.isNotEmpty) {
      displaySectionTitle = rawSection;
    } else if (grade.isNotEmpty) {
      displaySectionTitle = 'Grade $grade';
    }

    return Drawer(
      backgroundColor: primaryColor,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              Row(
                children: [
                  Image.asset(
                    'assets/logo/logo_v2.webp',
                    height: 32,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 10),
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
              const SizedBox(height: 28),

              // Nav Item 1: Overview / Home
              _buildNavItem(
                context,
                icon: Ph.house,
                label: 'Home',
                isSelected: activeRoute == 'Overview' || activeRoute == 'Home',
                onTap: () {
                  Navigator.pop(context);
                  if (activeRoute != 'Overview' && activeRoute != 'Home') {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherOverviewPage(),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 4),

              // Nav Item 2: Student Dashboard
              _buildNavItem(
                context,
                icon: Ph.presentation_chart,
                label: 'Student Dashboard',
                isSelected: activeRoute == 'Student Dashboard',
                onTap: () {
                  Navigator.pop(context);
                  if (activeRoute != 'Student Dashboard') {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherClassProgressPage(),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 4),

              // Nav Item 3: Phil-IRI Records
              _buildNavItem(
                context,
                icon: Ph.exam,
                label: 'Phil-IRI Records',
                isSelected: activeRoute == 'Phil-IRI Records',
                onTap: () {
                  Navigator.pop(context);
                  if (activeRoute != 'Phil-IRI Records') {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherPhilIriRecordsPage(),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 4),

              // Nav Item 4: Class Activities
              _buildNavItem(
                context,
                icon: Ph.puzzle_piece,
                label: 'Class Activities',
                isSelected: activeRoute == 'Class Activities',
                onTap: () {
                  Navigator.pop(context);
                  if (activeRoute != 'Class Activities') {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherActivitiesPage(),
                      ),
                    );
                  }
                },
              ),
              const SizedBox(height: 24),

              // Section: Your classes
              Padding(
                padding: const EdgeInsets.only(left: 16.0, bottom: 8.0),
                child: Text(
                  'Your classes',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
              _buildNavItem(
                context,
                icon: Ph.users_three,
                label: displaySectionTitle,
                isSelected: activeRoute == 'Class Details',
                onTap: () {
                  Navigator.pop(context);
                  if (activeRoute != 'Class Details') {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => TeacherClassDetailsPage(className: displaySectionTitle),
                      ),
                    );
                  }
                },
              ),

              const Spacer(),
              const Divider(color: Colors.white30, height: 24, thickness: 1),

              // Footer Action 1: My Profile
              Material(
                color: Colors.transparent,
                child: ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: InitialsAvatar(
                    name: teacherName,
                    imageUrl: teacherImageUrl,
                    radius: 12,
                    fontSize: 10,
                  ),
                  title: Text(
                    'My Profile',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: activeRoute == 'My Profile' ? FontWeight.w800 : FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    if (activeRoute != 'My Profile') {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const TeacherProfilePage(),
                        ),
                      );
                    }
                  },
                ),
              ),

              // Footer Action 2: Settings
              _buildNavItem(
                context,
                icon: Ph.gear,
                label: 'Settings',
                isSelected: activeRoute == 'Settings',
                onTap: () {
                  Navigator.pop(context);
                  if (activeRoute != 'Settings') {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherSettingsPage(),
                      ),
                    );
                  }
                },
              ),

              // Footer Action 3: Logout
              _buildNavItem(
                context,
                icon: Ph.sign_out,
                label: 'Logout',
                isSelected: false,
                onTap: () {
                  Navigator.pop(context);
                  AuthService.showLogoutDialog(context);
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context, {
    required String icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return Material(
      color: isSelected ? Colors.white : Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: ListTile(
        dense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        leading: Iconify(
          icon,
          color: isSelected ? const Color(0xFFD34426) : Colors.white,
          size: 22,
        ),
        title: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? const Color(0xFFD34426) : Colors.white,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}
