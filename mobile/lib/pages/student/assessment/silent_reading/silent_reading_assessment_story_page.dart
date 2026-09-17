import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_reader_page.dart';

class SilentReadingAssessmentStoryPage extends StatefulWidget {
  final Map<String, dynamic>? item;
  const SilentReadingAssessmentStoryPage({super.key, this.item});

  @override
  State<SilentReadingAssessmentStoryPage> createState() => _SilentReadingAssessmentStoryPageState();
}

class _SilentReadingAssessmentStoryPageState extends State<SilentReadingAssessmentStoryPage> {
  static int _extractQuestionsCount(Map<String, dynamic>? item) {
    if (item != null) {
      final qList = item['questions'] ??
          item['passage']?['questions'] ??
          item['activity']?['questions'] ??
          item['items'];
      if (qList is List && qList.isNotEmpty) {
        return qList.length;
      }

      final rawCount = item['questionsCount'] ??
          item['questionCount'] ??
          item['totalQuestions'] ??
          item['passage']?['questionsCount'] ??
          item['passage']?['questionCount'] ??
          item['passage']?['totalQuestions'] ??
          item['activity']?['questionsCount'] ??
          item['numQuestions'] ??
          item['itemCount'];
      if (rawCount != null) {
        final parsed = int.tryParse(rawCount.toString());
        if (parsed != null && parsed > 0) return parsed;
      }
    }
    return 1;
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    final item = widget.item;
    final passageTitle = item?['passageTitle'] ?? item?['passage']?['title'] ?? 'ISANG PANGARAP';
    final rawSet = (item?['passageSet'] ?? item?['set'] ?? item?['passage']?['set'] ?? 'Set A').toString().trim();
    final setLabel = rawSet.toLowerCase().startsWith('set') ? rawSet : 'Set $rawSet';
    final rawGrade = item?['gradeLevel'] ?? item?['passage']?['gradeLevel'];
    final rawGradeStr = rawGrade?.toString().trim() ?? '';
    final gradeText = rawGradeStr.isEmpty
        ? 'Grade 4+'
        : (rawGradeStr.toLowerCase().startsWith('grade')
            ? rawGradeStr
            : 'Grade $rawGradeStr');
    final rawLang = (item?['language'] ?? item?['rawLanguage'] ?? 'fil').toString().toLowerCase();
    final langText = rawLang.startsWith('en') ? 'English' : 'Filipino';
    final questionsCount = _extractQuestionsCount(item);

    return Scaffold(
      backgroundColor: softCreamBg,
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
                    // 1. Custom Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Back Button
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Iconify(
                              PhIcons.caretLeftRegular,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          // Center Title
                          Text(
                            'Silent Reading Assessment',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          // Right Spacer to keep title centered
                          const SizedBox(width: 48),
                        ],
                      ),
                    ),

                    // 2. Scrollable content (Vertically Centered)
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, scrollConstraints) {
                          return SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                minHeight: scrollConstraints.maxHeight - 32.0,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Clean Passage Icon Header (No cover pictures required)
                                  Center(
                                    child: Container(
                                      width: 96,
                                      height: 96,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFD1FAE5),
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: const Color(0xFFA7F3D0),
                                          width: 1.5,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF10B981).withValues(alpha: 0.1),
                                            blurRadius: 16,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: const Center(
                                        child: Iconify(
                                          PhIcons.bookOpenBold,
                                          color: Color(0xFF10B981),
                                          size: 44,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Meta Tags Row
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      _buildBadge(gradeText),
                                      const SizedBox(width: 8),
                                      _buildBadge(langText),
                                      const SizedBox(width: 8),
                                      _buildBadge('Easy to Read'),
                                    ],
                                  ),
                                  const SizedBox(height: 16),

                                  // Story Title
                                  Text(
                                    passageTitle,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.lora(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF1E293B),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 4),

                                  // Subtitle
                                  Text(
                                    '$setLabel - Phil - IRI Passage',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                  const SizedBox(height: 24),

                                  // Action Button (Start Reading Button)
                                  Container(
                                    height: 50,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: primaryBlue.withValues(alpha: 0.2),
                                          blurRadius: 10,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: ElevatedButton(
                                      onPressed: () {
                                        Feedback.forTap(context);
                                        _startReading(context);
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primaryBlue,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Iconify(
                                            PhIcons.bookOpenBold,
                                            color: Colors.white,
                                            size: 22,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Start Reading',
                                            style: GoogleFonts.inter(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // What to Expect Quick Stats Card
                                  _buildQuickStatsCard(questionsCount),
                                  const SizedBox(height: 14),

                                  // Student Target Goal Banner
                                  _buildTargetGoalBanner(),
                                  const SizedBox(height: 100),
                                ],
                              ),
                            ),
                          );
                        },
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

  Widget _buildQuickStatsCard(int questionsCount) {
    final questionsValue = questionsCount == 1 ? '1 Item' : '$questionsCount Items';

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildStatItem(
              icon: PhIcons.hourglassBold,
              iconColor: const Color(0xFF2563EB),
              label: 'Duration',
              value: '3 - 5 Mins',
            ),
          ),
          Container(width: 1, height: 38, color: const Color(0xFFE2E8F0)),
          Expanded(
            child: _buildStatItem(
              icon: PhIcons.examBold,
              iconColor: const Color(0xFFD97706),
              label: 'Questions',
              value: questionsValue,
            ),
          ),
          Container(width: 1, height: 38, color: const Color(0xFFE2E8F0)),
          Expanded(
            child: _buildStatItem(
              icon: PhIcons.targetRegular,
              iconColor: const Color(0xFF059669),
              label: 'Assessment',
              value: 'Phil-IRI',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem({
    required String icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Iconify(icon, color: iconColor, size: 22),
        const SizedBox(height: 6),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildTargetGoalBanner() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Center(
              child: Iconify(
                PhIcons.targetRegular,
                color: Color(0xFF475569),
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Passing Benchmark',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '80% score required for Independent Level',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBadge(String text) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      child: Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF475569),
        ),
      ),
    );
  }

  void _startReading(BuildContext context) {
    _showStartAssessmentDialog(context);
  }

  void _showStartAssessmentDialog(BuildContext parentContext) {
    showDialog(
      context: parentContext,
      barrierDismissible: false,
      builder: (dialogContext) {
        return Dialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Icon Header
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1B64D8).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.menu_book_rounded,
                      color: Color(0xFF1B64D8),
                      size: 32,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Ready to Begin?',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please review these reminders before starting your assessment:',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 20),
                _buildReminderRow(
                  icon: Icons.lock_outline_rounded,
                  title: 'Locked Progress',
                  description: 'You cannot go back or exit once you start reading.',
                ),
                const SizedBox(height: 12),
                _buildReminderRow(
                  icon: Icons.phonelink_lock_outlined,
                  title: 'Stay in the App',
                  description: 'Do not close or minimize the app while reading.',
                ),
                const SizedBox(height: 12),
                _buildReminderRow(
                  icon: Icons.quiz_outlined,
                  title: 'Comprehension Quiz',
                  description: 'A quiz will follow immediately after reading.',
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(dialogContext),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          'Not Yet',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(dialogContext);
                          if (parentContext.mounted) {
                            Navigator.pushReplacement(
                              parentContext,
                              MaterialPageRoute(
                                builder: (context) => SilentReadingAssessmentReaderPage(item: widget.item),
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: const Color(0xFF1B64D8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          'Start Reading',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildReminderRow({required IconData icon, required String title, required String description}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF1B64D8), size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
