import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/parent/parent_announcements_page.dart';

class ParentProgressReportsPage extends StatefulWidget {
  const ParentProgressReportsPage({super.key});

  @override
  State<ParentProgressReportsPage> createState() => _ParentProgressReportsPageState();
}

class _ParentProgressReportsPageState extends State<ParentProgressReportsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final String _selectedChild = 'Doechii Carganilla';
  final String _childGradeSection = 'Grade 4 - FYANG';

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: buildParentSidebarDrawer(context, activeIndex: 2),
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
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ParentAnnouncementsPage()),
              );
            },
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
              // Hero Banner
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            children: [
                              Iconify(Ph.student, color: Colors.white, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                _selectedChild,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            _childGradeSection,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: primaryBlue,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Student Progress & Reports',
                      style: GoogleFonts.inter(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Detailed Phil-IRI assessment metrics, reading speed, and oral accuracy analysis.',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Colors.white.withValues(alpha: 0.95),
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Summary Stats Row
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Current Level',
                      value: 'Instructional',
                      badgeText: 'Grade 4',
                      badgeColor: const Color(0xFF059669),
                      icon: Ph.book_open,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Reading Speed',
                      value: '82 WPM',
                      badgeText: '+5 WPM vs GST',
                      badgeColor: primaryBlue,
                      icon: Ph.timer,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Oral Accuracy',
                      value: '88.5%',
                      badgeText: 'GST Post-Test',
                      badgeColor: primaryBlue,
                      icon: Ph.check_circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildMetricCard(
                      title: 'Comprehension',
                      value: '85.0%',
                      badgeText: '8 / 10 Correct',
                      badgeColor: const Color(0xFF7C3AED),
                      icon: Ph.brain,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Assessment Breakdown Section
              Text(
                'Phil-IRI Assessment Breakdown',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 12),

              // Detailed Progress Bars
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    _buildProgressBarItem(
                      label: 'Oral Reading Fluency',
                      valueText: '88.5%',
                      progress: 0.885,
                      color: primaryBlue,
                    ),
                    const SizedBox(height: 16),
                    _buildProgressBarItem(
                      label: 'Reading Comprehension',
                      valueText: '85.0%',
                      progress: 0.85,
                      color: const Color(0xFF7C3AED),
                    ),
                    const SizedBox(height: 16),
                    _buildProgressBarItem(
                      label: 'Vocabulary & Word Recognition',
                      valueText: '91.0%',
                      progress: 0.91,
                      color: const Color(0xFF059669),
                    ),
                    const SizedBox(height: 16),
                    _buildProgressBarItem(
                      label: 'Listening & Pronunciation',
                      valueText: '84.0%',
                      progress: 0.84,
                      color: const Color(0xFFD97706),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Recent Test History List
              Text(
                'Phil-IRI Test History',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 12),

              _buildTestHistoryTile(
                testName: 'GST Post-Test (Form 1A)',
                date: 'July 24, 2026',
                level: 'Instructional Level',
                wpm: '82 WPM',
                accuracy: '88.5%',
                statusColor: const Color(0xFF059669),
              ),
              const SizedBox(height: 10),
              _buildTestHistoryTile(
                testName: 'GST Pre-Test (Form 1A)',
                date: 'June 10, 2026',
                level: 'Frustration Level',
                wpm: '77 WPM',
                accuracy: '81.0%',
                statusColor: const Color(0xFFD97706),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String badgeText,
    required Color badgeColor,
    required String icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Iconify(icon, color: badgeColor, size: 16),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badgeText,
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBarItem({
    required String label,
    required String valueText,
    required double progress,
    required Color color,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: Colors.black,
              ),
            ),
            Text(
              valueText,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: color.withValues(alpha: 0.15),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildTestHistoryTile({
    required String testName,
    required String date,
    required String level,
    required String wpm,
    required String accuracy,
    required Color statusColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                testName,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '$date • $wpm • $accuracy',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              level,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
