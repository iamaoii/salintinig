import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_result_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_result_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_result_page.dart';
import 'package:salintinig/pages/student/library/continue_reading_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';

class ProgressPage extends StatefulWidget {
  const ProgressPage({super.key});

  @override
  State<ProgressPage> createState() => _ProgressPageState();
}

class _ProgressPageState extends State<ProgressPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isListeningDone = false;
  bool _isOralReadingDone = false;
  bool _isSilentReadingDone = false;

  @override
  void initState() {
    super.initState();
    _isListeningDone = PhilIriAssessmentPage.isListeningDone;
    _isOralReadingDone = PhilIriAssessmentPage.isOralReadingDone;
    _isSilentReadingDone = PhilIriAssessmentPage.isSilentReadingDone;
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softCreamBg,
      drawer: StudentSidebarDrawer(
        currentIndex: 4, // Progress index
        onItemSelected: (index) {
          if (index == 0) {
            // Navigate back to Home
            Navigator.pop(context);
          } else if (index == 1) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const PhilIriAssessmentPage(),
              ),
            );
          } else if (index == 2) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const LibraryPage(),
              ),
            );
          } else if (index == 3) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const LibraryPage(), // Fallback or Activities page
              ),
            );
          }
        },
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity != null && details.primaryVelocity! > 200) {
            _scaffoldKey.currentState?.openDrawer();
          }
        },
        child: SafeArea(
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
                            // Left Back Caret Icon
                            IconButton(
                              onPressed: () {
                                Navigator.pop(context);
                              },
                              icon: const Iconify(
                                Ph.caret_left,
                                size: 28,
                                color: Colors.black,
                              ),
                            ),
                            // Center Title
                            Text(
                              'Progress',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            // Right Menu Drawer Icon (Hamburger)
                            IconButton(
                              onPressed: () {
                                _scaffoldKey.currentState?.openDrawer();
                              },
                              icon: const Iconify(
                                Ph.list,
                                size: 28,
                                color: Colors.black,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 2. Scrollable Content
                      Expanded(
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 24.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const SizedBox(height: 12),

                              // ── Section: Streak & Badges ──
                              _buildSectionHeader(
                                icon: PhIcons.hourglassBold,
                                title: 'Streak & Badges',
                                rightWidget: Text(
                                  'See all',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: primaryBlue,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildStreakAndBadgesCard(),
                              const SizedBox(height: 28),

                              // ── Section: Phil-IRI Assessments History ──
                              _buildSectionHeader(
                                icon: PhIcons.examBold,
                                title: 'Phil - IRI Assessments History',
                              ),
                              const SizedBox(height: 12),
                              _buildAssessmentHistoryList(primaryBlue),
                              const SizedBox(height: 28),

                              // ── Section: Continue Reading ──
                              _buildSectionHeader(
                                icon: PhIcons.bookOpenBold,
                                title: 'Continue Reading',
                                rightWidget: GestureDetector(
                                  onTap: () {
                                    Feedback.forTap(context);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const ContinueReadingPage(),
                                      ),
                                    );
                                  },
                                  child: Text(
                                    'See all',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: primaryBlue,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildContinueReadingRow(),
                              const SizedBox(height: 28),

                              // ── Section: Analytics ──
                              _buildSectionHeader(
                                icon: PhIcons.chartBarBold,
                                title: 'Analytics',
                              ),
                              const SizedBox(height: 16),
                              _buildAnalyticsStats(primaryBlue),
                              const SizedBox(height: 28),
                              _buildAccuracyTrendCard(),
                              const SizedBox(height: 24),

                              // ── Section: Diagnostic Metric Cards ──
                              _buildDiagnosticMetrics(),
                              const SizedBox(height: 16),
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
      ),
    );
  }

  // ── Section Header Builder ──
  Widget _buildSectionHeader({
    required String icon,
    required String title,
    Widget? rightWidget,
  }) {
    return Row(
      children: [
        Iconify(
          icon,
          color: const Color(0xFF1B64D8),
          size: 22,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Colors.black,
              letterSpacing: -0.4,
            ),
          ),
        ),
        ?rightWidget,
      ],
    );
  }

  // ── Streak & Badges Widget ──
  Widget _buildStreakAndBadgesCard() {
    const shadowColor = Color(0xFFD0E1F9);
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF4FF),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: shadowColor,
          width: 1.0,
        ),
      ),
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '67',
            style: GoogleFonts.inter(
              fontSize: 48,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF1B64D8),
              height: 1.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Streak Days',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF1B64D8),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "This is the longest Streak you've ever had!",
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 12),
          _buildWeeklyTracker(),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildBadgeCard('Sipag at Talino', 'assets/badges/sipag_talino_badge.webp')),
              const SizedBox(width: 8),
              Expanded(child: _buildBadgeCard('Early Badge', 'assets/badges/early_bird_badge.webp')),
              const SizedBox(width: 8),
              Expanded(child: _buildBadgeCard('10th Day Streak', 'assets/badges/10_day_streak_badge.webp')),
              const SizedBox(width: 8),
              Expanded(child: _buildBadgeCard('Ganda at Talino', 'assets/badges/ganda_talino_badge.webp')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyTracker() {
    final days = [
      {'label': 'M', 'state': 'done'},
      {'label': 'T', 'state': 'done'},
      {'label': 'W', 'state': 'done'},
      {'label': 'T', 'state': 'missed'},
      {'label': 'F', 'state': 'done'},
      {'label': 'S', 'state': 'future'},
      {'label': 'S', 'state': 'future'},
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: days.map((day) => _buildDayTrackerItem(day['label'] as String, day['state'] as String)).toList(),
    );
  }

  Widget _buildDayTrackerItem(String label, String state) {
    Widget circleChild = const SizedBox();
    Color circleBgColor = Colors.transparent;
    Border? circleBorder;

    if (state == 'done') {
      circleBgColor = const Color(0xFF22C55E); // Green
      circleChild = const Icon(
        Icons.check,
        color: Colors.white,
        size: 14,
      );
    } else if (state == 'missed') {
      circleBgColor = const Color(0xFFE2E8F0); // Solid light gray
    } else {
      // future
      circleBorder = Border.all(
        color: const Color(0xFFE2E8F0), // Thin border
        width: 1.5,
      );
      circleBgColor = Colors.white;
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: circleBgColor,
            shape: BoxShape.circle,
            border: circleBorder,
          ),
          alignment: Alignment.center,
          child: circleChild,
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF94A3B8), // slate-400
          ),
        ),
      ],
    );
  }

  Widget _buildBadgeCard(String label, String imageAsset) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFFD1D5DB), // gray-300
          width: 1.0,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(11),
        child: AspectRatio(
          aspectRatio: 80 / 108,
          child: Image.asset(
            imageAsset,
            fit: BoxFit.fill,
          ),
        ),
      ),
    );
  }

  // ── Phil-IRI Assessment History ──
  Widget _buildAssessmentHistoryList(Color primaryBlue) {
    return Column(
      children: [
        _buildAssessmentRowCard(
          title: 'Listening Comprehension Test',
          isDone: _isListeningDone,
          tagText: 'Required',
          tagBg: const Color(0xFFFEE2E2),
          tagTextCol: const Color(0xFFEF4444),
          iconSvg: PhIcons.earBold,
          iconBg: const Color(0xFFFEF3C7),
          iconCol: const Color(0xFFF59E0B),
          primaryBlue: primaryBlue,
          onStart: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ListeningAssessmentInstructionsPage(),
              ),
            ).then((completed) {
              if (completed == true) {
                setState(() {
                  _isListeningDone = true;
                  PhilIriAssessmentPage.isListeningDone = true;
                });
              }
            });
          },
          onViewResult: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ListeningResultPage(
                  score: PhilIriAssessmentPage.listeningScore,
                  totalQuestions: 5,
                ),
              ),
            );
          },
        ),
        _buildAssessmentRowCard(
          title: 'Silent Reading Test',
          isDone: _isSilentReadingDone,
          tagText: 'Optional',
          tagBg: const Color(0xFFF3F4F6),
          tagTextCol: const Color(0xFF71717A),
          iconSvg: PhIcons.bookOpenBold,
          iconBg: const Color(0xFFD1FAE5),
          iconCol: const Color(0xFF10B981),
          primaryBlue: primaryBlue,
          isNotAvailable: !_isSilentReadingDone && !_isListeningDone, // Available only if listening done (as mockup concept)
          onStart: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const SilentReadingAssessmentInstructionsPage(),
              ),
            ).then((_) {
              setState(() {
                _isSilentReadingDone = PhilIriAssessmentPage.isSilentReadingDone;
              });
            });
          },
          onViewResult: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => SilentReadingResultPage(
                  score: PhilIriAssessmentPage.silentReadingScore,
                  totalQuestions: 3,
                ),
              ),
            );
          },
        ),
        _buildAssessmentRowCard(
          title: 'Oral Reading Test',
          isDone: _isOralReadingDone,
          tagText: 'Required',
          tagBg: const Color(0xFFFEE2E2),
          tagTextCol: const Color(0xFFEF4444),
          iconSvg: PhIcons.userSoundBold,
          iconBg: const Color(0xFFD0E1F9),
          iconCol: primaryBlue,
          primaryBlue: primaryBlue,
          onStart: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const OralReadingAssessmentInstructionsPage(),
              ),
            ).then((_) {
              setState(() {
                _isOralReadingDone = PhilIriAssessmentPage.isOralReadingDone;
              });
            });
          },
          onViewResult: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => OralReadingResultPage(
                  score: PhilIriAssessmentPage.oralReadingScore,
                  totalQuestions: 3,
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildAssessmentRowCard({
    required String title,
    required bool isDone,
    required String tagText,
    required Color tagBg,
    required Color tagTextCol,
    required String iconSvg,
    required Color iconBg,
    required Color iconCol,
    required Color primaryBlue,
    required VoidCallback onStart,
    required VoidCallback onViewResult,
    bool isNotAvailable = false,
  }) {
    Color cardBg = isDone ? const Color(0xFFEAF5EC) : Colors.white;
    Color borderCol = isDone ? const Color(0xFFBCE4CD) : const Color(0xFFE2E8F0);

    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: borderCol,
          width: 1.0,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: iconBg,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Iconify(
              iconSvg,
              color: iconCol,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  decoration: BoxDecoration(
                    color: isDone ? const Color(0xFFD1FAE5) : tagBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  child: Text(
                    isDone ? 'Done' : tagText,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: isDone ? const Color(0xFF059669) : tagTextCol,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (isDone)
            ElevatedButton(
              onPressed: () {
                Feedback.forTap(context);
                onViewResult();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00A859),
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
              child: Text(
                'View Result',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800),
              ),
            )
          else if (isNotAvailable)
            ElevatedButton(
              onPressed: null,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE4E4E7),
                foregroundColor: const Color(0xFFA1A1AA),
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(100),
                ),
              ),
              child: Text(
                'Not Available',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: const Color(0xFF9F9F9F)),
              ),
            )
          else
            ElevatedButton(
              onPressed: () {
                Feedback.forTap(context);
                onStart();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryBlue,
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
                'Start',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800),
              ),
            ),
        ],
      ),
    );
  }

  // ── Continue Reading Row ──
  Widget _buildContinueReadingRow() {
    return Row(
      children: [
        Expanded(
          child: _buildContinueReadingItem(
            'SARI-SARI SUMMERS',
            'assets/stories/sari_sari_summers.jpg',
            0.35,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildContinueReadingItem(
            'A Song of Frutas',
            'assets/stories/a_song_of_frutas.png',
            0.70,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildContinueReadingItem(
            'OLD CLOTHES FOR DINNER',
            'assets/stories/old_clothes_for_dinner.png',
            0.45,
          ),
        ),
      ],
    );
  }

  Widget _buildContinueReadingItem(String title, String imageAsset, double progress) {
    const shadowColor = Color(0xFFE2E8F0);
    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: shadowColor,
          width: 1.0,
        ),
      ),
      padding: const EdgeInsets.all(10.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 0.75,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                imageAsset,
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(100),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: const Color(0xFFE2E8F0),
              color: const Color(0xFF1B64D8),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }

  // ── Analytics Stats Row ──
  Widget _buildAnalyticsStats(Color primaryBlue) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildStatItem('5', 'Stories', PhIcons.booksRegular, primaryBlue),
        _buildStatItem('5', 'Badges', PhIcons.shieldBold, primaryBlue),
        _buildStatItem('5', 'Streak', PhIcons.fireBold, primaryBlue),
      ],
    );
  }

  Widget _buildStatItem(String val, String label, String iconSvg, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Iconify(
          iconSvg,
          color: color,
          size: 32,
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              val,
              style: GoogleFonts.inter(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: Colors.black,
                height: 1.0,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF71717A),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Accuracy Trend Card ──
  Widget _buildAccuracyTrendCard() {
    const shadowColor = Color(0xFFE2E8F0);
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: shadowColor,
          width: 1.0,
        ),
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'model accuracy',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: CustomPaint(
              painter: AccuracyChartPainter(),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Accuracy Trend',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF71717A),
            ),
          ),
        ],
      ),
    );
  }

  // ── Diagnostic Metrics ──
  Widget _buildDiagnosticMetrics() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                value: '67',
                unit: 'wps',
                label: 'Reading Speed',
                icon: PhIcons.lightningFill,
                iconBg: const Color(0xFFFEF3C7),
                iconCol: const Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                value: '87%',
                label: 'Accuracy',
                icon: PhIcons.targetRegular,
                iconBg: const Color(0xFFDBEAFE),
                iconCol: const Color(0xFF1B64D8),
              ),
            ),
          ],
        ),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                value: '37%',
                label: 'Comprehension',
                icon: PhIcons.lightbulbRegular,
                iconBg: const Color(0xFFD1FAE5),
                iconCol: const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(child: SizedBox()), // spacer to keep grids aligned
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String value,
    String? unit,
    required String label,
    required String icon,
    required Color iconBg,
    required Color iconCol,
  }) {
    const shadowColor = Color(0xFFE2E8F0);
    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: shadowColor,
          width: 1.0,
        ),
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                      height: 1.0,
                    ),
                  ),
                  if (unit != null) ...[
                    const SizedBox(width: 2),
                    Text(
                      unit,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF71717A),
                      ),
                    ),
                  ],
                ],
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Iconify(
                  icon,
                  color: iconCol,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF52525B),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Live accuracy curve vector custom painter ──
class AccuracyChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paintLineTrain = Paint()
      ..color = const Color(0xFF1B64D8)
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final paintLineTest = Paint()
      ..color = const Color(0xFFF97316)
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final paintGrid = Paint()
      ..color = const Color(0xFFF1F1F4)
      ..strokeWidth = 1.0;

    final paintAxis = Paint()
      ..color = const Color(0xFFD4D4D8)
      ..strokeWidth = 1.5;

    // Dimensions
    const paddingLeft = 32.0;
    const paddingBottom = 24.0;
    const paddingTop = 12.0;
    const paddingRight = 12.0;

    final width = size.width - paddingLeft - paddingRight;
    final height = size.height - paddingTop - paddingBottom;

    // Draw grid intersections
    final yGridLines = 5;
    for (int i = 0; i <= yGridLines; i++) {
      final y = paddingTop + height * (1 - i / yGridLines);
      canvas.drawLine(Offset(paddingLeft, y), Offset(size.width - paddingRight, y), paintGrid);
    }

    final xGridLines = 8;
    for (int i = 0; i <= xGridLines; i++) {
      final x = paddingLeft + width * (i / xGridLines);
      canvas.drawLine(Offset(x, paddingTop), Offset(x, size.height - paddingBottom), paintGrid);
    }

    // Outer Axis Lines
    canvas.drawLine(Offset(paddingLeft, paddingTop), Offset(paddingLeft, size.height - paddingBottom), paintAxis);
    canvas.drawLine(Offset(paddingLeft, size.height - paddingBottom), Offset(size.width - paddingRight, size.height - paddingBottom), paintAxis);

    // Labels & Legends text paints
    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
    );

    // X Axis ticks numbers (0, 2, 4, 6, 8)
    final tickLabels = ['0', '2', '4', '6', '8'];
    for (int i = 0; i < tickLabels.length; i++) {
      final label = tickLabels[i];
      final x = paddingLeft + width * (i * 2 / xGridLines);
      
      textPainter.text = TextSpan(
        text: label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: const Color(0xFF71717A),
        ),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(x - textPainter.width / 2, size.height - paddingBottom + 4));
    }

    // Centered "epoch" label
    textPainter.text = TextSpan(
      text: 'epoch',
      style: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.bold,
        color: const Color(0xFF27272A),
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(paddingLeft + width / 2 - textPainter.width / 2, size.height - 12));

    // Live Vector curves calculation matching mockup
    final trainPoints = [
      Offset(paddingLeft, size.height - paddingBottom - height * 0.10),
      Offset(paddingLeft + width * 0.125, size.height - paddingBottom - height * 0.40),
      Offset(paddingLeft + width * 0.25, size.height - paddingBottom - height * 0.65),
      Offset(paddingLeft + width * 0.375, size.height - paddingBottom - height * 0.78),
      Offset(paddingLeft + width * 0.50, size.height - paddingBottom - height * 0.82),
      Offset(paddingLeft + width * 0.625, size.height - paddingBottom - height * 0.83),
      Offset(paddingLeft + width * 0.75, size.height - paddingBottom - height * 0.84),
      Offset(paddingLeft + width * 0.875, size.height - paddingBottom - height * 0.85),
      Offset(paddingLeft + width, size.height - paddingBottom - height * 0.87),
    ];

    final testPoints = [
      Offset(paddingLeft, size.height - paddingBottom - height * 0.46),
      Offset(paddingLeft + width * 0.125, size.height - paddingBottom - height * 0.58),
      Offset(paddingLeft + width * 0.25, size.height - paddingBottom - height * 0.71),
      Offset(paddingLeft + width * 0.375, size.height - paddingBottom - height * 0.81),
      Offset(paddingLeft + width * 0.50, size.height - paddingBottom - height * 0.79),
      Offset(paddingLeft + width * 0.625, size.height - paddingBottom - height * 0.68),
      Offset(paddingLeft + width * 0.75, size.height - paddingBottom - height * 0.79),
      Offset(paddingLeft + width * 0.875, size.height - paddingBottom - height * 0.79),
      Offset(paddingLeft + width, size.height - paddingBottom - height * 0.83),
    ];

    // Smooth spline draw for Train
    final pathTrain = Path()..moveTo(trainPoints[0].dx, trainPoints[0].dy);
    for (int i = 0; i < trainPoints.length - 1; i++) {
      final p1 = trainPoints[i];
      final p2 = trainPoints[i + 1];
      final controlX = p1.dx + (p2.dx - p1.dx) / 2;
      pathTrain.cubicTo(controlX, p1.dy, controlX, p2.dy, p2.dx, p2.dy);
    }
    canvas.drawPath(pathTrain, paintLineTrain);

    // Smooth spline draw for Test
    final pathTest = Path()..moveTo(testPoints[0].dx, testPoints[0].dy);
    for (int i = 0; i < testPoints.length - 1; i++) {
      final p1 = testPoints[i];
      final p2 = testPoints[i + 1];
      final controlX = p1.dx + (p2.dx - p1.dx) / 2;
      pathTest.cubicTo(controlX, p1.dy, controlX, p2.dy, p2.dx, p2.dy);
    }
    canvas.drawPath(pathTest, paintLineTest);

    // Draw Legend frame in the top left
    final legendX = paddingLeft + 12;
    final legendY = paddingTop + 10;

    // Train legend dot/line indicator
    canvas.drawLine(Offset(legendX, legendY + 5), Offset(legendX + 15, legendY + 5), paintLineTrain);
    textPainter.text = TextSpan(
      text: 'train',
      style: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: const Color(0xFF27272A),
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(legendX + 20, legendY));

    // Test legend dot/line indicator
    canvas.drawLine(Offset(legendX, legendY + 17), Offset(legendX + 15, legendY + 17), paintLineTest);
    textPainter.text = TextSpan(
      text: 'test',
      style: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: const Color(0xFF27272A),
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(legendX + 20, legendY + 12));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
