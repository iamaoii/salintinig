import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/widgets/user_avatar.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_result_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_result_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_result_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';
import 'package:salintinig/pages/student/library/continue_reading_page.dart';
import 'package:salintinig/pages/student/profile_page.dart';
import 'package:salintinig/pages/student/activities/activities_page.dart';
import 'package:salintinig/pages/student/progress_page.dart';
import 'package:salintinig/services/auth_service.dart';

class StudentOverviewPage extends StatefulWidget {
  const StudentOverviewPage({super.key});

  @override
  State<StudentOverviewPage> createState() => _StudentOverviewPageState();
}

class _StudentOverviewPageState extends State<StudentOverviewPage> {
  // Scaffold key to control drawer programmatically
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Simple state toggles for interactive button feedback
  bool _notificationAlert = true;

  bool _isListeningDone = false;
  bool _isOralReadingDone = false;
  bool _isSilentReadingDone = false;

  dynamic _realtimeSubscription;

  @override
  void initState() {
    super.initState();
    _isListeningDone = PhilIriAssessmentPage.isListeningDone;
    _isOralReadingDone = PhilIriAssessmentPage.isOralReadingDone;
    _isSilentReadingDone = PhilIriAssessmentPage.isSilentReadingDone;

    // Refresh user profile immediately and subscribe to instant Supabase Realtime stream
    _refreshUserProfile();
    _setupRealtimeSubscription();
  }

  void _setupRealtimeSubscription() {
    try {
      final client = Supabase.instance.client;
      _realtimeSubscription = client
          .channel('public:student_grade_history')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'student_grade_history',
            callback: (payload) {
              _refreshUserProfile();
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Realtime stream subscription notice: $e');
    }
  }

  @override
  void dispose() {
    if (_realtimeSubscription != null) {
      try {
        Supabase.instance.client.removeChannel(_realtimeSubscription);
      } catch (_) {}
    }
    super.dispose();
  }

  Future<void> _refreshUserProfile() async {
    final res = await AuthService.fetchMe();
    if (res.success && mounted) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const darkBlueBg = Color(0xFF195ECB);
    const softCreamBg = Color(0xFFFCFAF7);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        // Close drawer if open, otherwise stay on Home (Social Media App standard)
        if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
          _scaffoldKey.currentState?.closeDrawer();
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
      backgroundColor: softCreamBg,
      drawer: StudentSidebarDrawer(
        currentIndex: 0, // Since this is the home/overview page
        onItemSelected: (index) {
          if (index == 1) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const PhilIriAssessmentPage(),
              ),
            ).then((_) {
              setState(() {
                _isListeningDone = PhilIriAssessmentPage.isListeningDone;
                _isOralReadingDone = PhilIriAssessmentPage.isOralReadingDone;
                _isSilentReadingDone = PhilIriAssessmentPage.isSilentReadingDone;
              });
            });
          } else if (index == 2) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const LibraryPage(),
              ),
            );
          } else if (index == 3) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ActivitiesPage(),
              ),
            );
          } else if (index == 4) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ProgressPage(),
              ),
            );
          } else if (index != 0) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Navigation to item $index tapped.', style: GoogleFonts.inter()),
                duration: const Duration(seconds: 1),
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
                    // 1. Fixed Custom Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Menu Drawer Icon
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
                          // Center Brand Identity
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
                            children: [
                              IconButton(
                                onPressed: () {
                                  Feedback.forTap(context);
                                  setState(() {
                                    _notificationAlert = false;
                                  });
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('No new notifications.', style: GoogleFonts.inter()),
                                      duration: const Duration(seconds: 1),
                                    ),
                                  );
                                },
                                icon: Iconify(
                                  Ph.bell,
                                  size: 28,
                                  color: Colors.black,
                                ),
                              ),
                              if (_notificationAlert)
                                Positioned(
                                  right: 8,
                                  top: 8,
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEF4444),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // 2. Scrollable Dashboard Body
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // ── Hero Banner Card ──
                            Container(
                              clipBehavior: Clip.antiAlias,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: const LinearGradient(
                                  colors: [primaryBlue, darkBlueBg],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryBlue.withValues(alpha: 0.25),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Stack(
                                children: [
                                  // Translucent watermark logo background
                                  Positioned(
                                    right: 0,
                                    top: -12,
                                    bottom: -12,
                                    width: 200,
                                    child: Image.asset(
                                      'assets/student page/logo_bg.webp',
                                      fit: BoxFit.contain,
                                      alignment: Alignment.centerRight,
                                    ),
                                  ),
                                  // Foreground content
                                  Padding(
                                    padding: const EdgeInsets.all(20.0),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Hello, ${AuthService.currentUser?.firstName ?? 'Student'}!',
                                                style: GoogleFonts.inter(
                                                  fontSize: 26,
                                                  fontWeight: FontWeight.w800,
                                                  color: Colors.white,
                                                  letterSpacing: -0.5,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                               Text(
                                                 AuthService.currentUser?.sectionName != null && AuthService.currentUser!.sectionName.isNotEmpty
                                                     ? 'Grade ${AuthService.currentUser?.gradeLevel ?? ''} - ${AuthService.currentUser?.sectionName}'
                                                     : (AuthService.currentUser?.gradeLevel != null ? 'Grade ${AuthService.currentUser?.gradeLevel}' : ''),
                                                 style: GoogleFonts.inter(
                                                   fontSize: 15,
                                                   color: Colors.white.withValues(alpha: 0.8),
                                                   fontWeight: FontWeight.w500,
                                                 ),
                                               ),
                                            ],
                                          ),
                                        ),
                                         UserAvatar(
                                           size: 56,
                                           onTap: () {
                                             Navigator.push(
                                               context,
                                               MaterialPageRoute(
                                                 builder: (context) => const ProfilePage(),
                                               ),
                                             );
                                           },
                                         ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // ── Navigation Quick Cards Row ──
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildQuickNavCard('Phil-IRI', PhIcons.examBold, primaryBlue),
                                _buildQuickNavCard('Library', PhIcons.bookBold, primaryBlue),
                                _buildQuickNavCard('Activities', PhIcons.flagPennantBold, primaryBlue),
                                _buildQuickNavCard('Progress', PhIcons.hourglassBold, primaryBlue),
                              ],
                            ),
                            const SizedBox(height: 28),

                            // ── Section 1: Phil-IRI Assessments ──
                            _buildSectionHeader('Phil - IRI Assessments', PhIcons.examBold),
                            const SizedBox(height: 12),
                            _isListeningDone
                                ? _buildAssessmentCard(
                                    title: 'Listening\nComprehension Test',
                                    tag: 'Done',
                                    tagBgColor: const Color(0xFFD1FAE5),
                                    tagTextColor: const Color(0xFF059669),
                                    buttonText: 'View Result',
                                    buttonColor: const Color(0xFF00A859),
                                    icon: PhIcons.earBold,
                                    iconColor: const Color(0xFFF59E0B),
                                    iconBg: const Color(0xFFFEF3C7),
                                    cardBg: const Color(0xFFEAF5EC),
                                    onPressed: () {
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
                                  )
                                : _buildAssessmentCard(
                                    title: 'Listening\nComprehension Test',
                                    tag: 'Required',
                                    tagBgColor: const Color(0xFFFEE2E2),
                                    tagTextColor: const Color(0xFFEF4444),
                                    buttonText: 'Start',
                                    buttonColor: primaryBlue,
                                    icon: PhIcons.earBold,
                                    iconColor: const Color(0xFFF59E0B),
                                    iconBg: const Color(0xFFFEF3C7),
                                    onPressed: () {
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
                                  ),
                             _isSilentReadingDone
                                ? _buildAssessmentCard(
                                    title: 'Silent Reading\nTest',
                                    tag: 'Done',
                                    tagBgColor: const Color(0xFFD1FAE5),
                                    tagTextColor: const Color(0xFF059669),
                                    buttonText: 'View Result',
                                    buttonColor: const Color(0xFF00A859),
                                    icon: PhIcons.bookOpenBold,
                                    iconColor: const Color(0xFF10B981),
                                    iconBg: const Color(0xFFD1FAE5),
                                    cardBg: const Color(0xFFEAF5EC),
                                    onPressed: () {
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
                                  )
                                : _buildAssessmentCard(
                                    title: 'Silent Reading\nTest',
                                    tag: 'Optional',
                                    tagBgColor: const Color(0xFFF3F4F6),
                                    tagTextColor: const Color(0xFF71717A),
                                    buttonText: 'Start',
                                    buttonColor: primaryBlue,
                                    icon: PhIcons.bookOpenBold,
                                    iconColor: const Color(0xFF10B981),
                                    iconBg: const Color(0xFFD1FAE5),
                                    onPressed: () {
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
                                  ),
                            _isOralReadingDone
                                ? _buildAssessmentCard(
                                    title: 'Oral Reading Test',
                                    tag: 'Done',
                                    tagBgColor: const Color(0xFFD1FAE5),
                                    tagTextColor: const Color(0xFF059669),
                                    buttonText: 'View Result',
                                    buttonColor: const Color(0xFF00A859),
                                    icon: PhIcons.userSoundBold,
                                    iconColor: primaryBlue,
                                    iconBg: const Color(0xFFD0E1F9),
                                    cardBg: const Color(0xFFEAF5EC),
                                    onPressed: () {
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
                                  )
                                : _buildAssessmentCard(
                                    title: 'Oral Reading Test',
                                    tag: 'Required',
                                    tagBgColor: const Color(0xFFFEE2E2),
                                    tagTextColor: const Color(0xFFEF4444),
                                    buttonText: 'Start',
                                    buttonColor: primaryBlue,
                                    icon: PhIcons.userSoundBold,
                                    iconColor: primaryBlue,
                                    iconBg: const Color(0xFFD0E1F9),
                                    onPressed: () {
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
                                  ),
                            const SizedBox(height: 28),

                            // ── Section 2: Continue Reading ──
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildSectionHeader('Continue Reading', PhIcons.bookOpenBold),
                                GestureDetector(
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
                                      color: primaryBlue,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            _buildContinueReadingCard(context),
                            const SizedBox(height: 28),

                            // ── Section 3: Activities (from Picture 2) ──
                            _buildSectionHeader('Activities', PhIcons.puzzlePieceBold),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildActivityCard('Pronunciation\nChallenge', PhIcons.userSoundBold, const Color(0xFFD0E1F9), primaryBlue),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildActivityCard('Vocabulary\nMatching', PhIcons.equalsBold, const Color(0xFFFFF0C2), const Color(0xFFF59E0B)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildActivityCard('Sentence\nArrangement', PhIcons.hammerBold, const Color(0xFFC7ECDA), const Color(0xFF10B981)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 28),

                            // ── Section 4: Progress (from Picture 2) ──
                            _buildSectionHeader('Progress', PhIcons.hourglassBold),
                            const SizedBox(height: 12),
                            // Stat Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                _buildStatItem('5', 'Stories', PhIcons.booksRegular, primaryBlue),
                                _buildStatItem('5', 'Badges', PhIcons.shieldBold, primaryBlue),
                                _buildStatItem('5', 'Streak', PhIcons.fireBold, primaryBlue),
                              ],
                            ),
                            const SizedBox(height: 20),
                            // Accuracy Chart Card
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    'model accuracy',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  // Live custom accuracy graph
                                  SizedBox(
                                    height: 200,
                                    child: CustomPaint(
                                      painter: AccuracyChartPainter(),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Accuracy Trend',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF71717A),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 32),
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
  ),
);
}

  // ── Helper Widgets ──

  Widget _buildSectionHeader(String title, String iconSvg) {
    return Row(
      children: [
        Iconify(
          iconSvg,
          color: const Color(0xFF1B64D8),
          size: 22,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickNavCard(String label, String iconSvg, Color activeColor) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: const Color(0xFFE8EEF9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Feedback.forTap(context);
            if (label == 'Phil-IRI') {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const PhilIriAssessmentPage(),
                ),
              );
            } else if (label == 'Library') {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const LibraryPage(),
                ),
              );
            } else if (label == 'Activities') {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ActivitiesPage(),
                ),
              );
            } else if (label == 'Progress') {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ProgressPage(),
                ),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('$label navigation tapped.', style: GoogleFonts.inter()),
                  duration: const Duration(milliseconds: 500),
                ),
              );
            }
          },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Iconify(
                iconSvg,
                color: activeColor,
                size: 34,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF27272A),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAssessmentCard({
    required String title,
    required String tag,
    required Color tagBgColor,
    required Color tagTextColor,
    required String buttonText,
    required Color buttonColor,
    Color buttonTextColor = Colors.white,
    required String icon,
    required Color iconColor,
    required Color iconBg,
    Color cardBg = Colors.white,
    VoidCallback? onPressed,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Circular Icon backing
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: iconBg,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Iconify(
              icon,
              color: iconColor,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          // Assessment Title & Capsule tag
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF18181B),
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  decoration: BoxDecoration(
                    color: tagBgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  child: Text(
                    tag,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: tagTextColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Action Button
          ElevatedButton(
            onPressed: buttonColor == const Color(0xFFE4E4E7)
                ? null
                : () {
                    Feedback.forTap(context);
                    if (onPressed != null) {
                      onPressed();
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Starting $title...')),
                      );
                    }
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: buttonColor,
              foregroundColor: buttonTextColor,
              disabledBackgroundColor: buttonColor,
              disabledForegroundColor: buttonTextColor,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: Text(
              buttonText,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildContinueReadingCard(BuildContext context) {
    const cardBg = Color(0xFFFEF8EC); // Warm cream/beige tint matching reference
    const tagBg = Color(0xFFE6F4EA); // Soft green background
    const tagTextColor = Color(0xFF137333); // Dark green text
    const continueBtnColor = Color(0xFFFBBF24); // Vibrant golden yellow button

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDEEBE), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Actual book cover image asset
          Container(
            width: 90,
            height: 120,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 4,
                  offset: const Offset(1, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/stories/sari_sari_summers.jpg',
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Book details & controls
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SARI - SARI SUMMERS',
                  style: GoogleFonts.merriweather(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF18181B),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Nora helps her Lola save their sari-sari store by making mango ice candy during a hot summer in the Philippines.',
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF71717A),
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 12),
                // Progress Bar (stretching full width of column)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: const LinearProgressIndicator(
                    value: 0.25, // Fill level matches reference indicator approx
                    backgroundColor: Color(0xFFE4E2DC),
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1B64D8)),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Tag capsule
                    Container(
                      decoration: BoxDecoration(
                        color: tagBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: Text(
                        'Filipino',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: tagTextColor,
                        ),
                      ),
                    ),
                    // Action button
                    ElevatedButton(
                      onPressed: () {
                        Feedback.forTap(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const LibraryPage(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: continueBtnColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        'Continue',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildActivityCard(String label, String iconSvg, Color iconBg, Color iconColor) {
    return Container(
      height: 156,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Feedback.forTap(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Launching ${label.replaceAll('\n', ' ')}...')),
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 4),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: iconBg,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Iconify(
                    iconSvg,
                    color: iconColor,
                    size: 38,
                  ),
                ),
                const Spacer(),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF18181B),
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String count, String label, String iconSvg, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Iconify(
          iconSvg,
          color: color,
          size: 32,
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              count,
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: Colors.black,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF71717A),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
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
