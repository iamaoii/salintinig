import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/common/home_page.dart';
import 'package:salintinig/pages/parent/parent_overview_page.dart';
import 'package:salintinig/pages/parent/parent_progress_reports_page.dart';
import 'package:salintinig/pages/parent/parent_settings_page.dart';

class ParentAnnouncementsPage extends StatefulWidget {
  const ParentAnnouncementsPage({super.key});

  @override
  State<ParentAnnouncementsPage> createState() => _ParentAnnouncementsPageState();
}

class _ParentAnnouncementsPageState extends State<ParentAnnouncementsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedFilter = 'All';

  final List<Map<String, dynamic>> _announcements = [
    {
      'title': 'Phil-IRI Post-Test Assessment Window',
      'teacher': 'Ms. Maria Santos',
      'role': 'Section Adviser',
      'date': 'Today, 8:30 AM',
      'category': 'Assessment',
      'isPinned': true,
      'content':
          'Doechii is demonstrating excellent reading fluency in Filipino stories. Please continue encouraging 15 minutes of daily practice at home before the upcoming GST Post-Test assessment window starting next Monday.',
    },
    {
      'title': 'Parent-Teacher Reading Conference',
      'teacher': 'Ms. Maria Santos',
      'role': 'Section Adviser',
      'date': 'July 22, 2026',
      'category': 'Meeting',
      'isPinned': false,
      'content':
          'Grade 4 - FYANG quarterly reading assessment progress review is scheduled for next Friday. Please coordinate with the adviser for your preferred time slot.',
    },
    {
      'title': 'New Story Passages Added',
      'teacher': 'SalinTinig Academic Team',
      'role': 'System Update',
      'date': 'July 18, 2026',
      'category': 'Updates',
      'isPinned': false,
      'content':
          '5 new Level 4 reading passages focusing on Filipino cultural folklore have been added to Doechii\'s library for oral reading and comprehension exercises.',
    },
    {
      'title': 'Home Practice Guidelines for Phil-IRI',
      'teacher': 'Ms. Maria Santos',
      'role': 'Section Adviser',
      'date': 'July 10, 2026',
      'category': 'Guidelines',
      'isPinned': false,
      'content':
          'When practicing oral reading at home, please ensure your child reads out loud slowly and clearly. Use the audio recording feature in SalinTinig to review pronunciation.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    final filteredAnnouncements = _selectedFilter == 'All'
        ? _announcements
        : _announcements.where((a) => a['category'] == _selectedFilter).toList();

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: buildParentSidebarDrawer(context, activeIndex: 3),
      appBar: AppBar(
        backgroundColor: softBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          icon: Iconify(Ph.list, color: Colors.black, size: 28),
        ),
        centerTitle: true,
        title: Row(
          mainAxisSize: MainAxisSize.min,
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
        actions: [
          IconButton(
            onPressed: () {},
            icon: Iconify(Ph.bell, color: Colors.black, size: 28),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16.0, 12.0, 16.0, 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Page Title Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1B64D8), Color(0xFF2563EB)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Iconify(Ph.megaphone, color: Colors.white, size: 26),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Class Announcements',
                            style: GoogleFonts.inter(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Teacher notes, Phil-IRI updates, and section news',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.9),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Filter Chips Row
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: ['All', 'Assessment', 'Meeting', 'Updates', 'Guidelines'].map((filter) {
                    final isSelected = _selectedFilter == filter;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(filter),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedFilter = filter);
                        },
                        selectedColor: primaryBlue,
                        backgroundColor: Colors.white,
                        labelStyle: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? Colors.white : Colors.black87,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                          side: BorderSide(
                            color: isSelected ? primaryBlue : const Color(0xFFE2E8F0),
                          ),
                        ),
                        showCheckmark: false,
                      ),
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 20),

              // Announcements List
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filteredAnnouncements.length,
                separatorBuilder: (context, index) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  final item = filteredAnnouncements[index];
                  final isPinned = item['isPinned'] == true;

                  return Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isPinned ? const Color(0xFFEFF6FF) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isPinned ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
                        width: isPinned ? 1.5 : 1.0,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor: primaryBlue.withValues(alpha: 0.1),
                                  child: Iconify(Ph.user, color: primaryBlue, size: 14),
                                ),
                                const SizedBox(width: 8),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['teacher'],
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black,
                                      ),
                                    ),
                                    Text(
                                      item['role'],
                                      style: GoogleFonts.inter(
                                        fontSize: 10,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: isPinned ? primaryBlue.withValues(alpha: 0.1) : Colors.grey[100],
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                item['date'],
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isPinned ? primaryBlue : Colors.grey[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Text(
                          item['title'],
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          item['content'],
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: Colors.grey[700],
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

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
      // Opening Settings: Always PUSH so pressing back returns to the exact previous page
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
                    icon: Ph.house,
                    label: 'Home',
                    isSelected: activeIndex == 0,
                    onTap: () => navigateTo(0, const ParentOverviewPage()),
                  ),
                  _buildDrawerTile(
                    context,
                    icon: PhIcons.examRegular,
                    label: 'Phil-IRI Assessment',
                    isSelected: activeIndex == 1,
                    onTap: () {
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Opening Phil-IRI Assessment...'), behavior: SnackBarBehavior.floating),
                      );
                    },
                  ),
                  _buildDrawerTile(
                    context,
                    icon: PhIcons.hourglassRegular,
                    label: 'Student Progress',
                    isSelected: activeIndex == 2,
                    onTap: () => navigateTo(2, const ParentProgressReportsPage()),
                  ),
                  _buildDrawerTile(
                    context,
                    icon: Ph.bell,
                    label: 'Announcements',
                    isSelected: activeIndex == 3,
                    onTap: () => navigateTo(3, const ParentAnnouncementsPage()),
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
                    icon: Ph.gear,
                    label: 'Settings',
                    isSelected: activeIndex == 5,
                    onTap: () => navigateTo(5, const ParentSettingsPage()),
                  ),
                  const SizedBox(height: 4),
                  _buildDrawerTile(
                    context,
                    icon: Ph.sign_out,
                    label: 'Log Out',
                    isSelected: false,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(builder: (context) => const HomePage()),
                        (route) => false,
                      );
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
