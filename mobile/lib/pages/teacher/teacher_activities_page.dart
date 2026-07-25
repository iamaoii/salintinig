import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/teacher/teacher_class_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_profile_page.dart';
import 'package:salintinig/pages/teacher/teacher_settings_page.dart';

class TeacherActivitiesPage extends StatefulWidget {
  final String className;

  const TeacherActivitiesPage({
    super.key,
    this.className = 'Grade 4 - FYANG',
  });

  @override
  State<TeacherActivitiesPage> createState() => _TeacherActivitiesPageState();
}

class _TeacherActivitiesPageState extends State<TeacherActivitiesPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedMode = 'All'; // 'All', 'Practice Mode', 'Phil - IRI'

  final List<Map<String, dynamic>> _activities = const [
    {
      'title': 'Pronunciation Challenge',
      'subtitle': 'Speech & Phonetics Game',
      'mode': 'Practice Mode',
      'badge': 'Practice',
      'doneCount': 28,
      'pendingCount': 7,
    },
    {
      'title': 'Vocabulary Matching Game',
      'subtitle': 'Word & Meaning Pair Game',
      'mode': 'Practice Mode',
      'badge': 'Practice',
      'doneCount': 25,
      'pendingCount': 10,
    },
    {
      'title': 'Sentence Reading & Quiz',
      'subtitle': 'Fluency & Comprehension Game',
      'mode': 'Practice Mode',
      'badge': 'Practice',
      'doneCount': 30,
      'pendingCount': 5,
    },
    {
      'title': 'Phil-IRI Group Screening Test (GST)',
      'subtitle': 'Form 1A & 1B Class Screening',
      'mode': 'Phil - IRI',
      'badge': 'Phil - IRI',
      'doneCount': 35,
      'pendingCount': 0,
    },
    {
      'title': 'Phil-IRI Oral Reading Test (ORT)',
      'subtitle': 'Form 3A & 3B Graded Passage Evaluation',
      'mode': 'Phil - IRI',
      'badge': 'Phil - IRI',
      'doneCount': 5,
      'pendingCount': 30,
    },
  ];

  Widget _buildTeacherDrawer(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color(0xFFD34426),
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
                    leading: Iconify(Ph.puzzle_piece, color: const Color(0xFFD34426), size: 22),
                    title: Text(
                      'Class Activities',
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
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showCreateActivityDialog() {
    Feedback.forTap(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Create New Activity feature opened...'),
        duration: Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    final filteredActivities = _activities.where((act) {
      if (_selectedMode == 'Practice Mode') {
        return act['mode'] == 'Practice Mode';
      } else if (_selectedMode == 'Phil - IRI') {
        return act['mode'] == 'Phil - IRI';
      }
      return true;
    }).toList();

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: _buildTeacherDrawer(context),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateActivityDialog,
        backgroundColor: const Color(0xFFD34426),
        foregroundColor: Colors.white,
        elevation: 4,
        shape: const CircleBorder(),
        child: const Icon(Icons.add_rounded, size: 30),
      ),
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
                    'Activities',
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
                    // Section 1: Select Mode
                    Row(
                      children: [
                        const Iconify(
                          Ph.article,
                          color: Color(0xFFD34426),
                          size: 24,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Select Mode',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Mode Selection Cards Row
                    Row(
                      children: [
                        // Practice Mode Card
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              Feedback.forTap(context);
                              setState(() {
                                _selectedMode = _selectedMode == 'Practice Mode' ? 'All' : 'Practice Mode';
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              height: 110,
                              decoration: BoxDecoration(
                                color: _selectedMode == 'Practice Mode'
                                    ? const Color(0xFFD34426)
                                    : const Color(0xFFE25538),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: _selectedMode == 'Practice Mode'
                                      ? const Color(0xFF991B1B)
                                      : const Color(0xFFD34426),
                                  width: _selectedMode == 'Practice Mode' ? 2 : 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFD34426).withValues(alpha: _selectedMode == 'Practice Mode' ? 0.35 : 0.15),
                                    blurRadius: _selectedMode == 'Practice Mode' ? 12 : 6,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Iconify(PhIcons.flagPennantBold, color: Colors.white, size: 36),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Practice Mode',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),

                        // Phil - IRI Card
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              Feedback.forTap(context);
                              setState(() {
                                _selectedMode = _selectedMode == 'Phil - IRI' ? 'All' : 'Phil - IRI';
                              });
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              height: 110,
                              decoration: BoxDecoration(
                                color: const Color(0xFFFDF4F2),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: _selectedMode == 'Phil - IRI'
                                      ? const Color(0xFFD34426)
                                      : const Color(0xFFFBE8E6),
                                  width: _selectedMode == 'Phil - IRI' ? 2 : 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEE2E2),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'A+',
                                      style: GoogleFonts.inter(
                                        fontSize: 22,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFFD34426),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Phil - IRI',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFFD34426),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Section 2: Class Activities Header & Active Filter
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
                            const SizedBox(width: 10),
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
                        if (_selectedMode != 'All')
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedMode = 'All';
                              });
                            },
                            child: Text(
                              'Show All',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFFD34426),
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Activities Cards List
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filteredActivities.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 14),
                      itemBuilder: (context, index) {
                        final act = filteredActivities[index];
                        final String title = act['title'] as String;
                        final String subtitle = act['subtitle'] as String;
                        final String badge = act['badge'] as String;
                        final int doneCount = act['doneCount'] as int;
                        final int pendingCount = act['pendingCount'] as int;

                        return Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Icon Avatar
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDBEAFE),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Center(
                                      child: Iconify(Ph.user_circle, color: const Color(0xFF2563EB), size: 22),
                                    ),
                                  ),
                                  const SizedBox(width: 14),
                                  // Title & Subtitle & Badge
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
                                            fontSize: 13,
                                            fontWeight: FontWeight.w500,
                                            color: Colors.grey[600],
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(100),
                                          ),
                                          child: Text(
                                            badge,
                                            style: GoogleFonts.inter(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.grey[700],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              // Bottom Row: Stats & Open Button
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Wrap(
                                      spacing: 12,
                                      runSpacing: 6,
                                      crossAxisAlignment: WrapCrossAlignment.center,
                                      children: [
                                        // Done stat
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.check_rounded, color: Colors.black87, size: 16),
                                            const SizedBox(width: 4),
                                            Text(
                                              '$doneCount',
                                              style: GoogleFonts.inter(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.black,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Students Done',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.grey[600],
                                              ),
                                            ),
                                          ],
                                        ),
                                        // Pending stat
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.sync_rounded, color: Colors.grey, size: 16),
                                            const SizedBox(width: 4),
                                            Text(
                                              '$pendingCount',
                                              style: GoogleFonts.inter(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.black,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              'Students Pending',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.grey[600],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Open Button
                                  ElevatedButton(
                                    onPressed: () {
                                      Feedback.forTap(context);
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text('Opening $title...'),
                                          duration: const Duration(seconds: 2),
                                          behavior: SnackBarBehavior.floating,
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFD34426),
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
                            ],
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 40),
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
