import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_class_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_form_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_profile_page.dart';
import 'package:salintinig/pages/teacher/teacher_settings_page.dart';
import 'package:salintinig/services/auth_service.dart';

class TeacherPhilIriRecordsPage extends StatefulWidget {
  final String className;
  const TeacherPhilIriRecordsPage({
    super.key,
    this.className = 'Grade 4 - FYANG',
  });

  @override
  State<TeacherPhilIriRecordsPage> createState() => _TeacherPhilIriRecordsPageState();
}

class _TeacherPhilIriRecordsPageState extends State<TeacherPhilIriRecordsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Map<String, dynamic>> _forms = [
    {
      'title': 'FORM 1A',
      'subtitle': 'Filipino GST',
      'bgColor': const Color(0xFFECFDF5),
      'borderColor': const Color(0xFFA7F3D0),
      'iconBg': const Color(0xFFFEF08A),
      'iconColor': const Color(0xFFCA8A04),
      'icon': Ph.users_three,
      'buttonColor': const Color(0xFF059669),
    },
    {
      'title': 'FORM 1B',
      'subtitle': 'English GST',
      'bgColor': const Color(0xFFFFFBEB),
      'borderColor': const Color(0xFFFDE68A),
      'iconBg': const Color(0xFFDBEAFE),
      'iconColor': const Color(0xFF2563EB),
      'icon': Ph.users_three,
      'buttonColor': const Color(0xFFEAB308),
    },
    {
      'title': 'FORM 2',
      'subtitle': 'School Reading Profile',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFD1FAE5),
      'iconColor': const Color(0xFF059669),
      'icon': Ph.article,
      'buttonColor': const Color(0xFF1D4ED8),
    },
    {
      'title': 'FORM 3A',
      'subtitle': 'Filipino ORT Assessment',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFFEF08A),
      'iconColor': const Color(0xFFCA8A04),
      'icon': Ph.user_circle,
      'buttonColor': const Color(0xFF1D4ED8),
    },
    {
      'title': 'FORM 3B',
      'subtitle': 'English ORT Assessment',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFDBEAFE),
      'iconColor': const Color(0xFF2563EB),
      'icon': Ph.user_circle,
      'buttonColor': const Color(0xFF1D4ED8),
    },
    {
      'title': 'FORM 4',
      'subtitle': 'Individual Summary Record',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFD1FAE5),
      'iconColor': const Color(0xFF059669),
      'icon': Ph.user,
      'buttonColor': const Color(0xFF1D4ED8),
    },
  ];

  Widget _buildTeacherDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFFD34426),
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
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.house, color: Colors.white, size: 22),
                  title: Text(
                    'Home',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 4),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.presentation_chart, color: Colors.white, size: 22),
                  title: Text(
                    'Student Dashboard',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 4),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    dense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                    leading: Iconify(Ph.exam, color: const Color(0xFFD34426), size: 22),
                    title: Text(
                      'Phil-IRI Records',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFD34426),
                      ),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                    },
                  ),
                ),
                const SizedBox(height: 4),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.puzzle_piece, color: Colors.white, size: 22),
                  title: Text(
                    'Class Activities',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 24),
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
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.users_three, color: Colors.white, size: 22),
                  title: Text(
                    'Grade 4 - Fyang',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherClassDetailsPage(className: 'Grade 4 - FYANG'),
                      ),
                    );
                  },
                ),
                const Spacer(),
                const Divider(color: Colors.white30, height: 24, thickness: 1),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Container(
                    width: 22,
                    height: 22,
                    decoration: const BoxDecoration(
                      color: Colors.white70,
                      shape: BoxShape.circle,
                    ),
                  ),
                  title: Text(
                    'My Profile',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherProfilePage(),
                      ),
                    );
                  },
                ),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.gear, color: Colors.white, size: 22),
                  title: Text(
                    'Settings',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherSettingsPage(),
                      ),
                    );
                  },
                ),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.sign_out, color: Colors.white, size: 22),
                  title: Text(
                    'Logout',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
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

  void _onFormOpen(String formTitle, String subtitle) {
    Feedback.forTap(context);

    int doneCount = 0;
    int notDoneCount = 35;
    Color progressColor = const Color(0xFFF87171);
    Color secondaryColor = const Color(0xFFFEE2E2);
    bool hasGSTCards = false;
    int underGSTCount = 0;
    int aboveGSTCount = 0;

    if (formTitle == 'FORM 1A') {
      doneCount = 35;
      notDoneCount = 0;
      progressColor = const Color(0xFF059669); // Green 100%
      secondaryColor = const Color(0xFFE2E8F0);
      hasGSTCards = true;
      underGSTCount = 30;
      aboveGSTCount = 5;
    } else if (formTitle == 'FORM 1B') {
      doneCount = 25;
      notDoneCount = 10;
      progressColor = const Color(0xFFEAB308); // Yellow 75%
      secondaryColor = const Color(0xFFFEF3C7);
      hasGSTCards = true;
      underGSTCount = 20;
      aboveGSTCount = 5;
    } else {
      // FORM 2, FORM 3A, FORM 3B, FORM 4
      doneCount = 0;
      notDoneCount = 35;
      progressColor = const Color(0xFFF87171);
      secondaryColor = const Color(0xFFFEE2E2);
      hasGSTCards = false;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TeacherFormDetailsPage(
          formTitle: formTitle,
          formSubtitle: subtitle,
          doneCount: doneCount,
          notDoneCount: notDoneCount,
          progressColor: progressColor,
          secondaryColor: secondaryColor,
          hasGSTCards: hasGSTCards,
          underGSTCount: underGSTCount,
          aboveGSTCount: aboveGSTCount,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: _buildTeacherDrawer(context),
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with Hamburger on left
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      _scaffoldKey.currentState?.openDrawer();
                    },
                    icon: Iconify(Ph.list, size: 28, color: Colors.black),
                  ),
                  Text(
                    'Phil - IRI Records',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section Title
                    Row(
                      children: [
                        const Iconify(
                          Ph.files_bold,
                          color: Color(0xFFD34426),
                          size: 24,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Phil - IRI Records',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // List of Forms
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _forms.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final form = _forms[index];
                        final String title = form['title'] as String;
                        final String subtitle = form['subtitle'] as String;
                        final Color bgColor = form['bgColor'] as Color;
                        final Color borderColor = form['borderColor'] as Color;
                        final Color iconBg = form['iconBg'] as Color;
                        final Color iconColor = form['iconColor'] as Color;
                        final String icon = form['icon'] as String;
                        final Color buttonColor = form['buttonColor'] as Color;

                        return InkWell(
                          onTap: () => _onFormOpen(title, subtitle),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: borderColor),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              // Icon container
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: iconBg,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Center(
                                  child: Iconify(icon, color: iconColor, size: 22),
                                ),
                              ),
                              const SizedBox(width: 14),
                              // Title & Subtitle
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      title,
                                      style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      subtitle,
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Open Button
                              ElevatedButton(
                                onPressed: () => _onFormOpen(title, subtitle),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: buttonColor,
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                ),
                                child: Text(
                                  'Open',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
