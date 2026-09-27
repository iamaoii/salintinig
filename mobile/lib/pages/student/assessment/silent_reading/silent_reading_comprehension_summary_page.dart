import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';

class SilentReadingComprehensionSummaryPage extends StatelessWidget {
  final int score;
  final int totalQuestions;
  final List<Map<String, dynamic>>? questionsList;

  const SilentReadingComprehensionSummaryPage({
    super.key,
    required this.score,
    required this.totalQuestions,
    this.questionsList,
  });

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);

    final List<Map<String, dynamic>> questions = questionsList ?? [];

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
                    // 1. Header Navigation Row
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
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
                          const SizedBox(width: 8),
                          Text(
                            'Comprehension Summary',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 2. Questions List
                    Expanded(
                      child: questions.isEmpty
                          ? Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Iconify(
                                      PhIcons.examRegular,
                                      size: 48,
                                      color: Color(0xFF94A3B8),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      'No comprehension questions found for this assessment.',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          : ListView.builder(
                              physics: const BouncingScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                              itemCount: questions.length,
                              itemBuilder: (context, index) {
                                final item = questions[index];
                                return _buildQuestionCard(item);
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

  Widget _buildQuestionCard(Map<String, dynamic> item) {
    final int number = item['number'] is num ? (item['number'] as num).toInt() : 1;
    final String question = (item['question'] ?? '').toString();
    final List<dynamic> rawChoices = item['choices'] is List ? item['choices'] : [];
    final List<String> choices = rawChoices
        .map((c) => c?.toString().trim() ?? '')
        .where((c) => c.isNotEmpty)
        .toList();
    final bool isCorrect = item['isCorrect'] == true;
    final String studentAnswer = (item['studentAnswer'] ?? '').toString().trim();
    final String correctAnswer = (item['correctAnswer'] ?? '').toString().trim();

    final cleanStudentAnswer = studentAnswer.toLowerCase();
    final cleanCorrectAnswer = correctAnswer.toLowerCase();

    // Check if the student answer was actually correct based on match
    final bool studentIsActuallyCorrect = isCorrect ||
        (cleanStudentAnswer.isNotEmpty && cleanStudentAnswer == cleanCorrectAnswer);

    return Container(
      margin: const EdgeInsets.only(bottom: 20.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: studentIsActuallyCorrect ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(
                  studentIsActuallyCorrect ? Icons.check_rounded : Icons.close_rounded,
                  color: studentIsActuallyCorrect ? const Color(0xFF059669) : const Color(0xFFEF4444),
                  size: 14,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '$number. $question',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1F2937),
                    height: 1.3,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          ...choices.map((choice) {
            final cleanChoice = choice.trim().toLowerCase();
            final isSelectedByStudent = cleanChoice.isNotEmpty && cleanChoice == cleanStudentAnswer;
            final isChoiceCorrect = cleanChoice.isNotEmpty && cleanChoice == cleanCorrectAnswer;

            Color bgColor = Colors.white;
            Color borderColor = const Color(0xFFE2E8F0);
            Widget? leadingIcon;
            Widget? trailingText;

            if (isChoiceCorrect) {
              bgColor = const Color(0xFFECFDF5);
              borderColor = const Color(0xFF10B981);
              leadingIcon = const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18);
              if (isSelectedByStudent) {
                trailingText = Text(
                  'Your Answer',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                );
              } else {
                trailingText = Text(
                  'Correct Answer',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                  ),
                );
              }
            } else if (isSelectedByStudent) {
              bgColor = const Color(0xFFFEF2F2);
              borderColor = const Color(0xFFEF4444);
              leadingIcon = const Icon(Icons.cancel_rounded, color: Color(0xFFEF4444), size: 18);
              trailingText = Text(
                'Your Answer',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFFEF4444),
                ),
              );
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 8.0),
              padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: borderColor,
                  width: 1.5,
                ),
              ),
              child: Row(
                children: [
                  if (leadingIcon != null) ...[
                    leadingIcon,
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    child: Text(
                      choice,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: isSelectedByStudent || isChoiceCorrect
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isSelectedByStudent || isChoiceCorrect
                            ? const Color(0xFF1F2937)
                            : const Color(0xFF4B5563),
                      ),
                    ),
                  ),
                  if (trailingText != null) ...[
                    const SizedBox(width: 10),
                    trailingText,
                  ],
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
