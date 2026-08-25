import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_result_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_result_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_result_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';
import 'package:salintinig/pages/student/activities/activities_page.dart';
import 'package:salintinig/pages/student/progress_page.dart';

import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';

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
  bool _isLoading = true;

  List<Map<String, dynamic>> _assignedList = [];

  @override
  void initState() {
    super.initState();
    _isOralReadingDone = PhilIriAssessmentPage.isOralReadingDone;
    _isListeningDone = PhilIriAssessmentPage.isListeningDone;
    _isSilentReadingDone = PhilIriAssessmentPage.isSilentReadingDone;
    _fetchTeacherAssignment();
  }

  int _getTypePriority(String type) {
    switch (type.toLowerCase()) {
      case 'oral':
        return 1;
      case 'listening':
        return 2;
      case 'silent':
        return 3;
      default:
        return 4;
    }
  }

  Future<void> _fetchTeacherAssignment() async {
    try {
      final res = await ApiService.get('/students/assessment/my-assignment');
      debugPrint('[PhilIRI] API success=${res.success} statusCode=${res.statusCode}');
      debugPrint('[PhilIRI] raw data=${res.data}');
      if (res.data is Map) {
        debugPrint('[PhilIRI] debug=${(res.data as Map)['debug']}');
      }
      if (res.success && res.data != null) {
        final attempts = res.data['attemptsStatus'];
        final activitiesList = res.data['assignedActivities'];
        debugPrint('[PhilIRI] assignedActivities=$activitiesList');
        if (mounted) {
          setState(() {
            _isLoading = false;
            if (activitiesList != null && activitiesList is List) {
              _assignedList = List<Map<String, dynamic>>.from(activitiesList);
              _assignedList.sort((a, b) {
                final typeA = (a['assessmentType'] ?? 'oral').toString().toLowerCase();
                final typeB = (b['assessmentType'] ?? 'oral').toString().toLowerCase();
                final priorityA = _getTypePriority(typeA);
                final priorityB = _getTypePriority(typeB);
                if (priorityA != priorityB) {
                  return priorityA.compareTo(priorityB);
                }
                final titleA = (a['title'] ?? '').toString();
                final titleB = (b['title'] ?? '').toString();
                return titleA.compareTo(titleB);
              });
            }
            if (attempts != null) {
              if (attempts['listening'] == true) _isListeningDone = true;
              if (attempts['oral'] == true) _isOralReadingDone = true;
              if (attempts['silent'] == true) _isSilentReadingDone = true;
            }
          });
        }
        return;
      }
    } catch (e) {
      debugPrint('[PhilIRI] Assignment fetch error: $e');
    } finally {
      if (mounted && _isLoading) {
        setState(() {
          _isLoading = false;
        });
      }
    }
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
              MaterialPageRoute(builder: (context) => const LibraryPage()),
            );
          } else if (index == 3) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const ActivitiesPage()),
            );
          } else if (index == 4) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const ProgressPage()),
            );
          } else if (index != 1) {
            // For other placeholder pages, show a feedback snackbar
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Navigation to item $index tapped.',
                  style: GoogleFonts.inter(),
                ),
                duration: const Duration(seconds: 1),
              ),
            );
          }
        },
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity != null &&
              details.primaryVelocity! > 200) {
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
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16.0,
                          vertical: 12.0,
                        ),
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
                            // Right Notification Bell
                            const NotificationBellIconButton(),
                          ],
                        ),
                      ),

                      // 2. Scrollable Body
                      Expanded(
                        child: RefreshIndicator(
                          color: primaryBlue,
                          backgroundColor: Colors.white,
                          onRefresh: () async {
                            await AuthService.fetchMe();
                            await _fetchTeacherAssignment();
                          },
                          child: SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(
                              parent: BouncingScrollPhysics(),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20.0,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const SizedBox(height: 20),
                                // Section Header
                                _buildSectionHeader(
                                  'Phil - IRI Assessments',
                                  PhIcons.examRegular,
                                ),
                                const SizedBox(height: 16),

                                if (_isLoading)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 48,
                                      horizontal: 20,
                                    ),
                                    alignment: Alignment.center,
                                    child: const CircularProgressIndicator(
                                      color: primaryBlue,
                                    ),
                                  )
                                else if (_assignedList.isNotEmpty)
                                  ..._assignedList.map((item) {
                                    final title =
                                        item['title'] ?? 'Phil-IRI Assessment';
                                    final type =
                                        (item['assessmentType'] ?? 'oral')
                                            .toString()
                                            .toLowerCase();
                                    final isDone =
                                        item['isCompleted'] == true ||
                                        (type == 'listening' &&
                                            _isListeningDone) ||
                                        (type == 'silent' &&
                                            _isSilentReadingDone) ||
                                        (type == 'oral' && _isOralReadingDone);

                                    final rawLang =
                                        (item['rawLanguage'] ?? 'fil')
                                            .toString()
                                            .toLowerCase();
                                    final langBadge = rawLang.startsWith('en')
                                        ? 'ENG'
                                        : 'FIL';
                                    final rawSet =
                                        (item['passageSet'] ?? 'Set A')
                                            .toString();
                                    final setBadge =
                                        rawSet.toLowerCase().startsWith('set')
                                        ? rawSet
                                        : 'Set $rawSet';

                                    String icon = PhIcons.userSoundBold;
                                    Color iconColor = const Color(0xFF1B64D8);
                                    Color iconBg = const Color(0xFFD0E1F9);
                                    Color btnColor = const Color(0xFF1B64D8);
                                    Color btnTextColor = Colors.white;

                                    if (type == 'listening') {
                                      icon = PhIcons.earBold;
                                      iconColor = const Color(0xFFD97706);
                                      iconBg = const Color(0xFFFEF3C7);
                                      btnColor = const Color(0xFFFFC000); // Bright Golden Yellow like Teacher portal
                                      btnTextColor = const Color(0xFF451A03); // High-contrast dark text
                                    } else if (type == 'silent') {
                                      icon = PhIcons.bookOpenBold;
                                      iconColor = const Color(0xFF10B981);
                                      iconBg = const Color(0xFFD1FAE5);
                                      btnColor = const Color(0xFF10B981);
                                    }

                                    final isClosed = !isDone &&
                                        (item['status'] ?? 'open')
                                                .toString()
                                                .toLowerCase() ==
                                            'closed';

                                    return _buildAssessmentCard(
                                      title: title,
                                      tag: isDone ? 'Done' : 'Required',
                                      tagBgColor: isDone
                                          ? const Color(0xFFD1FAE5)
                                          : const Color(0xFFFEE2E2),
                                      tagTextColor: isDone
                                          ? const Color(0xFF059669)
                                          : const Color(0xFFEF4444),
                                      buttonText: isDone
                                          ? 'View Result'
                                          : (isClosed ? 'Closed' : 'Start'),
                                      buttonColor: isDone
                                          ? const Color(0xFF00A859)
                                          : (isClosed
                                              ? const Color(0xFFE4E4E7)
                                              : btnColor),
                                      buttonTextColor: isDone
                                          ? Colors.white
                                          : (isClosed
                                              ? const Color(0xFF9CA3AF)
                                              : btnTextColor),
                                      icon: icon,
                                      iconColor: iconColor,
                                      iconBg: iconBg,
                                      cardBg: isDone
                                          ? const Color(0xFFEAF5EC)
                                          : Colors.white,
                                      languageBadge: langBadge,
                                      passageSetBadge: setBadge,
                                      onPressed: () {
                                        if (isClosed) return;
                                        if (type == 'listening') {
                                          if (isDone) {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    ListeningResultPage(
                                                      score:
                                                          PhilIriAssessmentPage
                                                              .listeningScore,
                                                      totalQuestions: 5,
                                                    ),
                                              ),
                                            );
                                          } else {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    ListeningAssessmentInstructionsPage(
                                                  item: item,
                                                  customInstructions:
                                                      item['instructions'],
                                                ),
                                              ),
                                            ).then((completed) {
                                              if (completed == true) {
                                                setState(() {
                                                  _isListeningDone = true;
                                                  PhilIriAssessmentPage
                                                          .isListeningDone =
                                                      true;
                                                });
                                              }
                                            });
                                          }
                                        } else if (type == 'silent') {
                                          if (isDone) {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    SilentReadingResultPage(
                                                      score: PhilIriAssessmentPage
                                                          .silentReadingScore,
                                                      totalQuestions: 3,
                                                    ),
                                              ),
                                            );
                                          } else {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    SilentReadingAssessmentInstructionsPage(
                                                  item: item,
                                                  customInstructions:
                                                      item['instructions'],
                                                ),
                                              ),
                                            ).then((_) {
                                              setState(() {
                                                _isSilentReadingDone =
                                                    PhilIriAssessmentPage
                                                        .isSilentReadingDone;
                                              });
                                            });
                                          }
                                        } else {
                                          if (isDone) {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    OralReadingResultPage(
                                                      score:
                                                          PhilIriAssessmentPage
                                                              .oralReadingScore,
                                                      totalQuestions: 3,
                                                    ),
                                              ),
                                            );
                                          } else {
                                            Navigator.push(
                                              context,
                                              MaterialPageRoute(
                                                builder: (context) =>
                                                    OralReadingAssessmentInstructionsPage(
                                                  item: item,
                                                  customInstructions:
                                                      item['instructions'],
                                                ),
                                              ),
                                            ).then((_) {
                                              setState(() {
                                                _isOralReadingDone =
                                                    PhilIriAssessmentPage
                                                        .isOralReadingDone;
                                              });
                                            });
                                          }
                                        }
                                      },
                                    );
                                  })
                                else
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 36,
                                      horizontal: 20,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withValues(
                                            alpha: 0.03,
                                          ),
                                          blurRadius: 8,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Column(
                                      children: [
                                        const Icon(
                                          Icons.assignment_turned_in_outlined,
                                          size: 48,
                                          color: Color(0xFF9CA3AF),
                                        ),
                                        const SizedBox(height: 12),
                                        Text(
                                          'No Active Assessments',
                                          style: GoogleFonts.inter(
                                            fontSize: 16,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF374151),
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          'Your teacher has not assigned any Phil-IRI assessment yet. Pull down to refresh.',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            color: const Color(0xFF6B7280),
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
        Iconify(iconSvg, color: const Color(0xFF1B64D8), size: 24),
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
    String? languageBadge,
    String? passageSetBadge,
    VoidCallback? onPressed,
  }) {
    final bool isFil = (languageBadge ?? 'FIL').toUpperCase() == 'FIL';
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
            decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Iconify(icon, color: iconColor, size: 26),
          ),
          const SizedBox(width: 14),
          // Assessment Title & Capsule badges
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF18181B),
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    // Language badge (FIL / ENG)
                    if (languageBadge != null)
                      Container(
                        decoration: BoxDecoration(
                          color: isFil
                              ? const Color(0xFFCCFBF1)
                              : const Color(0xFFDBEAFE),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        child: Text(
                          languageBadge,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: isFil
                                ? const Color(0xFF0F766E)
                                : const Color(0xFF1E40AF),
                          ),
                        ),
                      ),
                    // Set badge (e.g. Set A)
                    if (passageSetBadge != null)
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF4F4F5),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        child: Text(
                          passageSetBadge,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF52525B),
                          ),
                        ),
                      ),
                    // Status Tag (Done / Required / Optional)
                    Container(
                      decoration: BoxDecoration(
                        color: tagBgColor,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      child: Text(
                        tag,
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: tagTextColor,
                        ),
                      ),
                    ),
                  ],
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
