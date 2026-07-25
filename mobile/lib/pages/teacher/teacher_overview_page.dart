import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/common/home_page.dart';
import 'package:salintinig/pages/teacher/teacher_activities_page.dart';
import 'package:salintinig/pages/teacher/teacher_class_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_class_progress_page.dart';
import 'package:salintinig/pages/teacher/teacher_form_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_phil_iri_records_page.dart';
import 'package:salintinig/pages/teacher/teacher_profile_page.dart';
import 'package:salintinig/pages/teacher/teacher_reading_levels_page.dart';
import 'package:salintinig/pages/teacher/teacher_settings_page.dart';
import 'dart:math' as math;

class TeacherOverviewPage extends StatefulWidget {
  const TeacherOverviewPage({super.key});

  @override
  State<TeacherOverviewPage> createState() => _TeacherOverviewPageState();
}

class _TeacherOverviewPageState extends State<TeacherOverviewPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final ScrollController _scrollController = ScrollController();

  // Scroll keys
  final GlobalKey _activitiesKey = GlobalKey();
  final GlobalKey _dashboardKey = GlobalKey();
  final GlobalKey _recordsKey = GlobalKey();

  int _notificationsCount = 3;
  String _selectedActivityFilter = 'All'; // 'All', 'Practice Mode', 'Phil-IRI'

  // Activities managed by teacher for students
  final List<Map<String, dynamic>> _activities = [
    {
      'id': 'act_1',
      'title': 'Pronunciation Challenge',
      'category': 'Practice Mode',
      'description': 'Speech and pronunciation practice',
      'done': 28,
      'pending': 7,
      'isAvailable': true,
    },
    {
      'id': 'act_2',
      'title': 'Oral Reading Assessment',
      'category': 'Phil-IRI',
      'description': 'Grade 4 Filipino passage evaluation',
      'done': 15,
      'pending': 20,
      'isAvailable': true,
    },
    {
      'id': 'act_3',
      'title': 'Vocabulary Matching',
      'category': 'Practice Mode',
      'description': 'Filipino word-meaning matching game',
      'done': 32,
      'pending': 3,
      'isAvailable': false,
    },
    {
      'id': 'act_4',
      'title': 'Silent Reading Assessment',
      'category': 'Phil-IRI',
      'description': 'Comprehension quiz and reading speed test',
      'done': 10,
      'pending': 25,
      'isAvailable': false,
    },
  ];

  // Notifications
  final List<Map<String, String>> _notifications = [
    {'title': 'Activity 1 completed', 'time': '5 mins ago', 'desc': 'Juan Dela Cruz just completed Pronunciation Challenge.'},
    {'title': 'Pending evaluation', 'time': '1 hour ago', 'desc': '3 students are waiting for oral reading grading.'},
    {'title': 'Low score alert', 'time': '2 hours ago', 'desc': 'Maria Clara scored Frustration level on Form 1A.'},
  ];



  void _showNotificationCenter() {
    Feedback.forTap(context);
    setState(() {
      _notificationsCount = 0;
    });
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Notifications',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, color: Colors.black),
                  ),
                ],
              ),
              const Divider(height: 24, thickness: 1, color: Color(0xFFE4E4E7)),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _notifications.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = _notifications[index];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFCFAF7),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                item['title']!,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                              Text(
                                item['time']!,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item['desc']!,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }





  void _showLogoutDialog() {
    Feedback.forTap(context);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Log out', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          content: Text('Are you sure you want to log out of the teacher portal?', style: GoogleFonts.inter()),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.inter(color: Colors.grey[600], fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const HomePage()),
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD34426),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                elevation: 0,
              ),
              child: Text('Log out', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softCreamBg,
      drawer: Drawer(
        child: Container(
          color: const Color(0xFFD34426),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 12),
                  // App Brand Header
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
                  // Nav Item 1: Home (Selected white pill)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      dense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                      leading: Iconify(Ph.house, color: const Color(0xFFD34426), size: 22),
                      title: Text(
                        'Home',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFD34426),
                        ),
                      ),
                      onTap: () {
                        Navigator.pop(context);
                        _scrollController.animateTo(
                          0,
                          duration: const Duration(milliseconds: 500),
                          curve: Curves.easeInOut,
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Nav Item 2: Student Dashboard
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
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const TeacherClassProgressPage(className: 'Grade 4 - FYANG'),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 4),
                  // Nav Item 3: Phil-IRI Records
                  ListTile(
                    dense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                    leading: Iconify(Ph.exam, color: Colors.white, size: 22),
                    title: Text(
                      'Phil-IRI Records',
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
                          builder: (context) => const TeacherPhilIriRecordsPage(className: 'Grade 4 - FYANG'),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: 4),
                  // Nav Item 4: Class Activities
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
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const TeacherActivitiesPage(className: 'Grade 4 - FYANG'),
                        ),
                      );
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
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const TeacherClassDetailsPage(className: 'Grade 4 - FYANG'),
                        ),
                      );
                    },
                  ),
                  const Spacer(),
                  const Divider(color: Colors.white30, height: 24, thickness: 1),
                  // Footer Actions
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
                      _showLogoutDialog();
                    },
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ),
      ),
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
                    // 1. Navigation Row (App Bar)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Menu hamburger Button
                          IconButton(
                            onPressed: () {
                              _scaffoldKey.currentState?.openDrawer();
                            },
                            icon: Iconify(
                              Ph.list,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          // Center Logo & Title
                          Row(
                            children: [
                              Image.asset(
                                'assets/logo/logo_v2.webp',
                                height: 32,
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
                          // Right Notification Bell
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              IconButton(
                                onPressed: _showNotificationCenter,
                                icon: Iconify(
                                  Ph.bell,
                                  size: 28,
                                  color: Colors.black,
                                ),
                              ),
                              if (_notificationsCount > 0)
                                Positioned(
                                  right: 6,
                                  top: 6,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 16,
                                      minHeight: 16,
                                    ),
                                    child: Text(
                                      '$_notificationsCount',
                                      style: GoogleFonts.inter(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // 2. Scrollable Body
                    Expanded(
                      child: SingleChildScrollView(
                        controller: _scrollController,
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // ── Hero Header Card (Grade 4 - Fyang) ──
                            _buildHeroHeaderCard(),
                            const SizedBox(height: 20),

                            // ── Quick Access Row ──
                            _buildQuickAccessRow(),
                            const SizedBox(height: 28),

                            // ── Section: Class Activities ──
                            _buildClassActivitiesSection(),
                            const SizedBox(height: 28),

                            // ── Section: Student Dashboard ──
                            Row(
                              key: _dashboardKey,
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Iconify(
                                      Ph.presentation_chart,
                                      color: Colors.grey[700],
                                      size: 24,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Student Dashboard',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black,
                                      ),
                                    ),
                                  ],
                                ),
                                GestureDetector(
                                  onTap: () {
                                    Feedback.forTap(context);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const TeacherClassProgressPage(className: 'Grade 4 - FYANG'),
                                      ),
                                    );
                                  },
                                  child: Text(
                                    'View Details',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: primaryBlue,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            _buildReadingClassificationCard(),
                            const SizedBox(height: 28),

                            // ── Section: Phil - IRI Records ──
                            Row(
                              key: _recordsKey,
                              children: [
                                const Icon(
                                  Icons.assignment_outlined,
                                  color: Color(0xFFD34426),
                                  size: 24,
                                ),
                                const SizedBox(width: 8),
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
                            _buildRecordsGrid(),
                            const SizedBox(height: 24),
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

  Widget _buildHeroHeaderCard() {
    return Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Color(0xFFE05234), Color(0xFFDC4D2F)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFDC4D2F).withValues(alpha: 0.25),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Translucent watermark logo background (identical to student overview page)
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              child: Image.asset(
                'assets/teacher page/logo_bg.webp',
                fit: BoxFit.fitHeight,
                alignment: Alignment.centerRight,
              ),
            ),
            // Foreground content
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Grade 4 - Fyang',
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'FRIDAY',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '7:30AM - 9:30AM',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      letterSpacing: 0.2,
                    ),
                  ),
                ],
              ),
            ),
            // 3-dots popup menu at top right corner
            Positioned(
              top: 12,
              right: 12,
              child: PopupMenuButton<String>(
                icon: const Icon(Icons.more_horiz_rounded, color: Colors.white, size: 28),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                onSelected: (val) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const TeacherClassDetailsPage(className: 'Grade 4 - FYANG'),
                    ),
                  );
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'Edit Info', child: Text('Edit Class Info')),
                  const PopupMenuItem(value: 'Manage Students', child: Text('Manage Students')),
                  const PopupMenuItem(value: 'Archive', child: Text('Archive Class')),
                ],
              ),
            ),
          ],
        ),
      );
    }

  Widget _buildQuickAccessRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: _buildQuickAccessCard(
            label: 'Student\nDashboard',
            icon: Ph.presentation_chart,
            onTap: () {
              Feedback.forTap(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const TeacherClassProgressPage(className: 'Grade 4 - FYANG'),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickAccessCard(
            label: 'Phil - IRI\nRecords',
            icon: Ph.files_bold,
            onTap: () {
              Feedback.forTap(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const TeacherPhilIriRecordsPage(className: 'Grade 4 - FYANG'),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickAccessCard(
            label: 'Activities',
            icon: PhIcons.flagPennantBold,
            onTap: () {
              Feedback.forTap(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const TeacherActivitiesPage(className: 'Grade 4 - FYANG'),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildClassActivitiesSection() {
    final filteredList = _selectedActivityFilter == 'All'
        ? _activities
        : _activities.where((a) => a['category'] == _selectedActivityFilter).toList();

    return Column(
      key: _activitiesKey,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Iconify(
                  PhIcons.flagPennantBold,
                  color: Color(0xFFD34426),
                  size: 24,
                ),
                const SizedBox(width: 8),
                Text(
                  'Class Activities',
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFFDF4F2),
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: const Color(0xFFFBE8E6)),
              ),
              child: Text(
                'Set Student Access',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFFD34426),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Filter tabs: All, Practice Mode, Phil-IRI
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip('All'),
              const SizedBox(width: 8),
              _buildFilterChip('Practice Mode'),
              const SizedBox(width: 8),
              _buildFilterChip('Phil-IRI'),
            ],
          ),
        ),
        const SizedBox(height: 14),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: filteredList.length,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final activity = filteredList[index];
            final bool isAvailable = activity['isAvailable'] as bool;
            final bool isPractice = activity['category'] == 'Practice Mode';

            return Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isAvailable ? const Color(0xFFE2E8F0) : const Color(0xFFF1F5F9),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  // Icon indicator
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isPractice ? const Color(0xFFEFF6FF) : const Color(0xFFFDF4F2),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Iconify(
                      isPractice ? Ph.microphone_stage : Ph.book_open,
                      color: isPractice ? const Color(0xFF1B64D8) : const Color(0xFFD34426),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          activity['title'],
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: isPractice ? const Color(0xFFDBEAFE) : const Color(0xFFFEE2E2),
                                borderRadius: BorderRadius.circular(100),
                              ),
                              child: Text(
                                activity['category'],
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isPractice ? const Color(0xFF1D4ED8) : const Color(0xFFB91C1C),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 12,
                          runSpacing: 4,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.check_circle_outline_rounded, size: 14, color: Colors.green),
                                const SizedBox(width: 4),
                                Text(
                                  '${activity['done']} Completed',
                                  style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[700], fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.hourglass_empty_rounded, size: 14, color: Colors.orange),
                                const SizedBox(width: 4),
                                Text(
                                  '${activity['pending']} Pending',
                                  style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[700], fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Availability Switch Toggle
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Transform.scale(
                        scale: 0.85,
                        child: Switch(
                          value: isAvailable,
                          activeThumbColor: const Color(0xFFD34426),
                          onChanged: (val) {
                            setState(() {
                              activity['isAvailable'] = val;
                            });
                            Feedback.forTap(context);
                            ScaffoldMessenger.of(context).hideCurrentSnackBar();
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  val
                                      ? '${activity['title']} is now AVAILABLE to students'
                                      : '${activity['title']} is now HIDDEN from students',
                                ),
                                backgroundColor: val ? const Color(0xFF10B981) : Colors.grey[700],
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                      ),
                      Text(
                        isAvailable ? 'Available' : 'Hidden',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isAvailable ? const Color(0xFF10B981) : Colors.grey[400],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label) {
    final bool isSelected = _selectedActivityFilter == label;
    return ChoiceChip(
      label: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          color: isSelected ? Colors.white : Colors.black87,
        ),
      ),
      selected: isSelected,
      selectedColor: const Color(0xFFD34426),
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? const Color(0xFFD34426) : const Color(0xFFE2E8F0),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedActivityFilter = label;
          });
        }
      },
    );
  }

  Widget _buildQuickAccessCard({
    required String label,
    required String icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        onTap();
      },
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          color: const Color(0xFFFDF4F2), // Light peach/pinkish matching first screenshot
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFFFBE8E6),
            width: 1.5,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Iconify(
              icon,
              size: 32,
              color: const Color(0xFFD34426),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReadingClassificationCard() {
    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const TeacherReadingLevelsPage(initialLevel: 'All'),
          ),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Iconify(Ph.chart_pie_slice, color: Colors.grey[600], size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Reading Level Classification',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.black,
                      ),
                    ),
                  ],
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: Colors.grey,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                // Left content
                Expanded(
                  flex: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '35',
                            style: GoogleFonts.inter(
                              fontSize: 48,
                              fontWeight: FontWeight.w900,
                              color: Colors.black,
                              height: 1,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Total\nStudents',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w600,
                              height: 1.1,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Divider(color: Color(0xFFE2E8F0), thickness: 1),
                      const SizedBox(height: 12),
                      // Legend
                      _buildLegendItem('20', 'Frustration Level', Colors.red, 'Frustration'),
                      const SizedBox(height: 8),
                      _buildLegendItem('10', 'Instructional Level', Colors.amber, 'Instructional'),
                      const SizedBox(height: 8),
                      _buildLegendItem('5', 'Independent Level', Colors.green, 'Independent'),
                    ],
                  ),
                ),
                // Right content: Custom donut chart
                Expanded(
                  flex: 4,
                  child: Center(
                    child: SizedBox(
                      width: 120,
                      height: 120,
                      child: CustomPaint(
                        painter: DonutChartPainter(),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Last Update: 05/06/2026',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: Colors.grey[400],
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendItem(String count, String label, Color color, [String? levelFilter]) {
    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TeacherReadingLevelsPage(
              initialLevel: levelFilter ?? 'All',
            ),
          ),
        );
      },
      borderRadius: BorderRadius.circular(6),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2.0),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 18,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              count,
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[700], fontWeight: FontWeight.w500),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.45,
      children: [
        _buildRecordCard(
          title: 'FORM 1A',
          subtitle: 'Filipino GST',
          bgColor: const Color(0xFFECFDF5),
          arrowColor: const Color(0xFF10B981),
        ),
        _buildRecordCard(
          title: 'FORM 1B',
          subtitle: 'English GST',
          bgColor: const Color(0xFFFFFBEB),
          arrowColor: const Color(0xFFF59E0B),
        ),
        _buildRecordCard(
          title: 'FORM 2',
          subtitle: 'School Reading Profile',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 3A',
          subtitle: 'Filipino ORT\nAssessment',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 3B',
          subtitle: 'English ORT\nAssessment',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 4',
          subtitle: 'Individual Summary\nRecord',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
      ],
    );
  }

  Widget _buildRecordCard({
    required String title,
    required String subtitle,
    required Color bgColor,
    required Color arrowColor,
    bool hasBorder = false,
  }) {
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);

        int doneCount = 0;
        int notDoneCount = 35;
        Color progressColor = const Color(0xFFF87171);
        Color secondaryColor = const Color(0xFFFEE2E2);
        bool hasGSTCards = false;
        int underGSTCount = 0;
        int aboveGSTCount = 0;

        final cleanSubtitle = subtitle.replaceAll('\n', ' ');

        if (title == 'FORM 1A') {
          doneCount = 35;
          notDoneCount = 0;
          progressColor = const Color(0xFF059669);
          secondaryColor = const Color(0xFFE2E8F0);
          hasGSTCards = true;
          underGSTCount = 30;
          aboveGSTCount = 5;
        } else if (title == 'FORM 1B') {
          doneCount = 25;
          notDoneCount = 10;
          progressColor = const Color(0xFFEAB308);
          secondaryColor = const Color(0xFFFEF3C7);
          hasGSTCards = true;
          underGSTCount = 20;
          aboveGSTCount = 5;
        } else {
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
              formTitle: title,
              formSubtitle: cleanSubtitle,
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
      },
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: hasBorder ? Border.all(color: const Color(0xFFE2E8F0)) : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[500],
                    height: 1.1,
                  ),
                ),
              ],
            ),
            Align(
              alignment: Alignment.bottomRight,
              child: Icon(
                Icons.arrow_circle_right_rounded,
                color: arrowColor,
                size: 26,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DonutChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2.3;
    const strokeWidth = 28.0;

    final paintGreen = Paint()
      ..color = const Color(0xFF00A859)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    final paintYellow = Paint()
      ..color = const Color(0xFFFFD13E)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    final paintRed = Paint()
      ..color = const Color(0xFFD34426)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    // Arcs alignment matching screenshot:
    // Red (50%) is on the right side: starts at -pi/2 (top) and sweeps clockwise 180 degrees (to bottom)
    // Yellow (30%) is at the bottom-left: starts at pi/2 (bottom) and sweeps clockwise 108 degrees
    // Green (20%) is at the top-left: starts at bottom-left and sweeps 72 degrees back to -pi/2
    
    double startAngle = -math.pi / 2;
    
    // 1. Red Arc (50%)
    final double sweepRed = math.pi; 
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), startAngle, sweepRed, false, paintRed);
    
    // 2. Yellow Arc (30%)
    startAngle += sweepRed;
    final double sweepYellow = 0.6 * math.pi; // 108 degrees
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), startAngle, sweepYellow, false, paintYellow);
    
    // 3. Green Arc (20%)
    startAngle += sweepYellow;
    final double sweepGreen = 0.4 * math.pi; // 72 degrees
    canvas.drawArc(Rect.fromCircle(center: center, radius: radius), startAngle, sweepGreen, false, paintGreen);

    // Render percentages inside segments
    _drawPercentageText(canvas, center, radius, -math.pi / 2 + sweepRed / 2, "50%");
    _drawPercentageText(canvas, center, radius, -math.pi / 2 + sweepRed + sweepYellow / 2, "30%");
    _drawPercentageText(canvas, center, radius, -math.pi / 2 + sweepRed + sweepYellow + sweepGreen / 2, "20%");
  }

  void _drawPercentageText(Canvas canvas, Offset center, double radius, double angle, String text) {
    final x = center.dx + radius * math.cos(angle);
    final y = center.dy + radius * math.sin(angle);
    
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: GoogleFonts.inter(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w900,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(x - textPainter.width / 2, y - textPainter.height / 2));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
