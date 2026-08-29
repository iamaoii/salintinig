import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';

class OralReadingComprehensionSummaryPage extends StatelessWidget {
  final int score;
  final int totalQuestions;
  final List<Map<String, dynamic>>? questionsList;

  const OralReadingComprehensionSummaryPage({
    super.key,
    this.score = 3,
    this.totalQuestions = 3,
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

                    // Back to Results Button
                    Container(
                      padding: const EdgeInsets.all(16.0),
                      decoration: const BoxDecoration(
                        color: softCreamBg,
                        border: Border(
                          top: BorderSide(
                            color: Color(0xFFE5E7EB),
                            width: 1,
                          ),
                        ),
                      ),
                      child: SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            Feedback.forTap(context);
                            Navigator.pop(context);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1B64D8),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Text(
                            'Back to Assessment Results',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
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
    );
  }

  Widget _buildQuestionCard(Map<String, dynamic> item) {
    final int number = item['number'];
    final String question = item['question'];
    final List<String> choices = List<String>.from(item['choices']);
    final bool isCorrect = item['isCorrect'];
    final String studentAnswer = item['studentAnswer'];
    final String correctAnswer = item['correctAnswer'];

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
          // Question Header
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: isCorrect ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Icon(
                  isCorrect ? Icons.check_rounded : Icons.close_rounded,
                  color: isCorrect ? const Color(0xFF059669) : const Color(0xFFEF4444),
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

          // Choices List
          ...choices.map((choice) {
            final isSelectedByStudent = choice == studentAnswer;
            final isChoiceCorrect = choice == correctAnswer;

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
