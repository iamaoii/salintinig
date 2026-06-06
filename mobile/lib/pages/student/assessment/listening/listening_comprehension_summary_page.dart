import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';

class ListeningComprehensionSummaryPage extends StatelessWidget {
  final int score;
  final int totalQuestions;

  const ListeningComprehensionSummaryPage({
    super.key,
    required this.score,
    required this.totalQuestions,
  });

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);

    // Question data matching the result configuration
    final List<Map<String, dynamic>> questions = [
      {
        'number': 1,
        'question': 'Sino ang pangunahing tauhan sa kuwento?',
        'choices': ['Si Sally', 'Si Billy', 'Si Pedro', 'Si Maria'],
        'isCorrect': score >= 1,
        'studentAnswer': 'Si Sally',
        'correctAnswer': 'Si Sally',
      },
      {
        'number': 2,
        'question': 'Saan naganap ang kuwento?',
        'choices': ['Sa bahay', 'Sa paaralan', 'Sa parke', 'Sa palengke'],
        'isCorrect': score >= 2,
        'studentAnswer': score >= 2 ? 'Sa paaralan' : 'Sa bahay',
        'correctAnswer': 'Sa paaralan',
      },
      {
        'number': 3,
        'question': 'Ano ang naging problema ni Sally?',
        'choices': ['Nawala ang kanyang laruan', 'Nawala ang kanyang lapis', 'Nawala ang kanyang pusa', 'Nawala ang kanyang pera'],
        'isCorrect': score >= 3,
        'studentAnswer': score >= 3 ? 'Nawala ang kanyang lapis' : 'Nawala ang kanyang libro',
        'correctAnswer': 'Nawala ang kanyang lapis',
      },
      {
        'number': 4,
        'question': 'Paano nalutas ang suliranin?',
        'choices': ['Tinulungan siya ng guro', 'Bumili siya ng bago', 'Umiyak na lamang siya', 'Hinamag niya ang klase'],
        'isCorrect': score >= 4,
        'studentAnswer': score >= 4 ? 'Tinulungan siya ng guro' : 'Bumili siya ng bago',
        'correctAnswer': 'Tinulungan siya ng guro',
      },
      {
        'number': 5,
        'question': 'Ano ang aral ng kuwento?',
        'choices': ['Maglaro maghapon', 'Ang pagtutulungan ay mahalaga', 'Huwag magsalita sa klase', 'Laging matulog nang maaga'],
        'isCorrect': score >= 5,
        'studentAnswer': score >= 5 ? 'Ang pagtutulungan ay mahalaga' : 'Maglaro maghapon',
        'correctAnswer': 'Ang pagtutulungan ay mahalaga',
      },
    ];

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
                      child: ListView.builder(
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
