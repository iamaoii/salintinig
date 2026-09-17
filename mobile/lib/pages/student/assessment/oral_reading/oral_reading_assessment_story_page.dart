import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_microphone_test_page.dart';

class OralReadingAssessmentStoryPage extends StatefulWidget {
  final Map<String, dynamic>? item;
  const OralReadingAssessmentStoryPage({super.key, this.item});

  @override
  State<OralReadingAssessmentStoryPage> createState() =>
      _OralReadingAssessmentStoryPageState();
}

class _OralReadingAssessmentStoryPageState
    extends State<OralReadingAssessmentStoryPage> {
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
    const pageBg = Color(0xFFFCFAF7);

    final item = widget.item;
    final passageTitle =
        item?['passageTitle'] ?? item?['title'] ?? item?['passage']?['title'] ?? 'Oral Reading Assessment';
    final rawSet =
        (item?['passageSet'] ??
                item?['set'] ??
                item?['passage']?['set'] ??
                'Set A')
            .toString()
            .trim();
    final setLabel = rawSet.toLowerCase().startsWith('set')
        ? rawSet
        : 'Set $rawSet';
    final rawGrade = item?['gradeLevel'] ?? item?['passage']?['gradeLevel'];
    final rawGradeStr = rawGrade?.toString().trim() ?? '';
    final gradeText = rawGradeStr.isEmpty
        ? 'Grade 4+'
        : (rawGradeStr.toLowerCase().startsWith('grade')
            ? rawGradeStr
            : 'Grade $rawGradeStr');
    final rawLang = (item?['language'] ?? item?['rawLanguage'] ?? 'fil')
        .toString()
        .toLowerCase();
    final langText = rawLang.startsWith('en') ? 'English' : 'Filipino';
    final questionsCount = _extractQuestionsCount(item);

    return Scaffold(
      backgroundColor: pageBg,
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
                    // Top App Bar Header
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 12.0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
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
                          Text(
                            'Oral Reading Assessment',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 48),
                        ],
                      ),
                    ),

                    // Main Cover Content (Vertically Centered)
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, scrollConstraints) {
                          return SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24.0,
                              vertical: 16.0,
                            ),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                minHeight: scrollConstraints.maxHeight - 32.0,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // Clean & Simple Icon Circle (No glowing AI effects)
                                  Container(
                                    width: 90,
                                    height: 90,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEBF3FE),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Center(
                                      child: Iconify(
                                        PhIcons.userSoundBold,
                                        color: primaryBlue,
                                        size: 40,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Simple Meta Badges Row
                                  Wrap(
                                    alignment: WrapAlignment.center,
                                    spacing: 8,
                                    runSpacing: 8,
                                    children: [
                                      _buildBadge(gradeText),
                                      _buildBadge(langText),
                                      _buildBadge('Easy to Read'),
                                    ],
                                  ),
                                  const SizedBox(height: 16),

                                  // Passage Title
                                  Text(
                                    passageTitle,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.lora(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF1E293B),
                                      height: 1.3,
                                    ),
                                  ),
                                  const SizedBox(height: 4),

                                  // Subtitle
                                  Text(
                                    '$setLabel - Phil - IRI Passage',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                  const SizedBox(height: 24),

                                  // Clean Button (Start Reading Button)
                                  SizedBox(
                                    height: 50,
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: () {
                                        Feedback.forTap(context);
                                        _startReading(context);
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primaryBlue,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            14,
                                          ),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          const Iconify(
                                            PhIcons.userSoundRegular,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Start Reading',
                                            style: GoogleFonts.inter(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w600,
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
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => OralReadingMicrophoneTestPage(item: widget.item),
      ),
    );
  }
}
