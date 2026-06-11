import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_result_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_result_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_result_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';
import 'package:salintinig/pages/student/activities/activities_page.dart';

class PhilIriAssessmentPage extends StatefulWidget {
  const PhilIriAssessmentPage({super.key});

  static bool isListeningDone = false;
  static bool isOralReadingDone = false;
  static bool isSilentReadingDone = false;
  static int listeningScore = 4;
  static int oralReadingScore = 3;
  static int silentReadingScore = 3;
  static bool isPhilIriPeriod = true;

  @override
  State<PhilIriAssessmentPage> createState() => _PhilIriAssessmentPageState();
}

class _PhilIriAssessmentPageState extends State<PhilIriAssessmentPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isOralReadingDone = false;
  bool _isListeningDone = false;
  bool _isSilentReadingDone = false;

  @override
  void initState() {
    super.initState();
    _isOralReadingDone = PhilIriAssessmentPage.isOralReadingDone;
    _isListeningDone = PhilIriAssessmentPage.isListeningDone;
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
        currentIndex: 1, // Phil-IRI Assessment page index
        onItemSelected: (index) {
          if (index == 0) {
            // Navigate back to Home
            Navigator.pop(context);
          } else if (index == 2) {
            // Navigate to Library page replacing this one
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
                builder: (context) => const ActivitiesPage(),
              ),
            );
          } else if (index != 1) {
            // For other placeholder pages, show a feedback snackbar
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
                      // 1. Custom Header
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Left Menu Button
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
                            // Center Title
                            Text(
                              'Phil-IRI Assessments',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            // Right Spacer to keep title centered
                            const SizedBox(width: 48),
                          ],
                        ),
                      ),

                      // 2. Scrollable Body
                      Expanded(
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const SizedBox(height: 20),
                              // Section Header
                              _buildSectionHeader('Phil - IRI Assessments', PhIcons.examRegular),
                              const SizedBox(height: 16),
                              // 1. Listening Comprehension Test
                              _isListeningDone
                                  ? _buildAssessmentCard(
                                      title: 'Listening\nComprehension Test',
                                      tag: 'Done',
                                      tagBgColor: const Color(0xFFD1FAE5),
                                      tagTextColor: const Color(0xFF059669),
                                      buttonText: 'View Result',
                                      buttonColor: const Color(0xFF00A859),
                                      icon: PhIcons.earRegular,
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
                                      icon: PhIcons.earRegular,
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
                              // 2. Silent Reading Test
                              _isSilentReadingDone
                                  ? _buildAssessmentCard(
                                      title: 'Silent Reading\nTest',
                                      tag: 'Done',
                                      tagBgColor: const Color(0xFFD1FAE5),
                                      tagTextColor: const Color(0xFF059669),
                                      buttonText: 'View Result',
                                      buttonColor: const Color(0xFF00A859),
                                      icon: PhIcons.bookOpenRegular,
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
                                      icon: PhIcons.bookOpenRegular,
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
                              // 3. Oral Reading Test
                              _isOralReadingDone
                                  ? _buildAssessmentCard(
                                      title: 'Oral Reading Test',
                                      tag: 'Done',
                                      tagBgColor: const Color(0xFFD1FAE5),
                                      tagTextColor: const Color(0xFF059669),
                                      buttonText: 'View Result',
                                      buttonColor: const Color(0xFF00A859),
                                      icon: PhIcons.userSoundRegular,
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
                                      icon: PhIcons.userSoundRegular,
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
    );
  }

  Widget _buildSectionHeader(String title, String iconSvg) {
    return Row(
      children: [
        Iconify(
          iconSvg,
          color: const Color(0xFF1B64D8),
          size: 24,
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
}
