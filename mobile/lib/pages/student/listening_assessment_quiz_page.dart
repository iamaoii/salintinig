import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/listening_assessment_congratulations_page.dart';

class ListeningAssessmentQuizPage extends StatefulWidget {
  const ListeningAssessmentQuizPage({super.key});

  @override
  State<ListeningAssessmentQuizPage> createState() => _ListeningAssessmentQuizPageState();
}

class _ListeningAssessmentQuizPageState extends State<ListeningAssessmentQuizPage> {
  int _currentQuestionIndex = 0;
  
  // List to store student answers
  final List<int?> _selectedAnswers = [null, null];

  final List<Map<String, dynamic>> _questions = [
    {
      'questionText': 'Saang banal na sambahan nanggaling si Tito Abdul?',
      'options': [
        'sa Mecca',
        'sa Israel',
        'sa Jerusalem',
        'sa Bethlehem',
      ],
      'correctAnswerIndex': 0,
    },
    {
      'questionText': 'Ano ang tawag sa banal na aklat ng mga Muslim?',
      'options': [
        'Bibliya',
        'Koran',
        'Misal',
        'Vedas',
      ],
      'correctAnswerIndex': 1,
    },
  ];

  void _onOptionSelected(int index) {
    Feedback.forTap(context);
    setState(() {
      _selectedAnswers[_currentQuestionIndex] = index;
    });
  }

  void _goNext() {
    Feedback.forTap(context);
    if (_selectedAnswers[_currentQuestionIndex] == null) {
      // Show warning if nothing selected
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Pumili muna ng isang sagot.',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: Colors.orangeAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 1),
        ),
      );
      return;
    }

    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
      });
    }
  }

  void _goBack() {
    Feedback.forTap(context);
    if (_currentQuestionIndex > 0) {
      setState(() {
        _currentQuestionIndex--;
      });
    }
  }

  void _finishAssessment() {
    Feedback.forTap(context);
    if (_selectedAnswers[_currentQuestionIndex] == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Pumili muna ng isang sagot.',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600),
          ),
          backgroundColor: Colors.orangeAccent,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 1),
        ),
      );
      return;
    }

    // Calculate score
    int correctCount = 0;
    for (int i = 0; i < _questions.length; i++) {
      if (_selectedAnswers[i] == _questions[i]['correctAnswerIndex']) {
        correctCount++;
      }
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ListeningAssessmentCongratulationsPage(
          score: correctCount,
          totalQuestions: _questions.length,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    final currentQuestion = _questions[_currentQuestionIndex];
    final selectedAnswerIndex = _selectedAnswers[_currentQuestionIndex];

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
                    // 1. Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Icon(
                              Icons.chevron_left_rounded,
                              size: 28,
                              color: Color(0xFF475569),
                            ),
                          ),
                          Text(
                            'ISANG PANGARAP',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF475569),
                              letterSpacing: 1.0,
                            ),
                          ),
                          IconButton(
                            onPressed: () {},
                            icon: const Icon(
                              Icons.more_horiz_rounded,
                              size: 28,
                              color: Color(0xFF475569),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 2. Progress Indicator and Label
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'QUESTION ${_currentQuestionIndex + 1}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF64748B),
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 8),
                          // Custom segmented progress bar
                          Row(
                            children: List.generate(_questions.length, (index) {
                              final isActive = index <= _currentQuestionIndex;
                              return Expanded(
                                child: Container(
                                  height: 6,
                                  margin: EdgeInsets.only(
                                    right: index == _questions.length - 1 ? 0.0 : 6.0,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isActive
                                        ? const Color(0xFF00AA5A)
                                        : const Color(0xFFE2E8F0),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              );
                            }),
                          ),
                        ],
                      ),
                    ),

                    // 3. Question text
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              currentQuestion['questionText'],
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 24,
                                fontWeight: FontWeight.w900,
                                color: Colors.black,
                                height: 1.35,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // 4. Select instructions
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'SELECT ONLY ONE',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF94A3B8),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),

                    // 5. Options List
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0),
                      child: Column(
                        children: List.generate(
                          currentQuestion['options'].length,
                          (index) {
                            final isSelected = selectedAnswerIndex == index;
                            final optionText = currentQuestion['options'][index];

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12.0),
                              child: GestureDetector(
                                onTap: () => _onOptionSelected(index),
                                child: Container(
                                  height: 64,
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? const Color(0xFFD3E2F8)
                                        : const Color(0xFFF1F5F9).withValues(alpha: 0.5),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isSelected
                                          ? primaryBlue
                                          : const Color(0xFFE2E8F0),
                                      width: isSelected ? 1.5 : 1.0,
                                    ),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                  child: Row(
                                    children: [
                                      Icon(
                                        isSelected
                                            ? Icons.check_circle_rounded
                                            : Icons.circle_outlined,
                                        color: isSelected
                                            ? primaryBlue
                                            : const Color(0xFF94A3B8),
                                        size: 24,
                                      ),
                                      const SizedBox(width: 14),
                                      Text(
                                        optionText,
                                        style: GoogleFonts.inter(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: isSelected
                                              ? primaryBlue
                                              : const Color(0xFF334155),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),

                    // 6. Footer Button Navigation
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                      child: _currentQuestionIndex == _questions.length - 1
                          ? Row(
                              children: [
                                // Back Button
                                Expanded(
                                  child: SizedBox(
                                    height: 52,
                                    child: OutlinedButton(
                                      onPressed: _goBack,
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                      ),
                                      child: Text(
                                        'Back',
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF64748B),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                // Finish Button
                                Expanded(
                                  child: SizedBox(
                                    height: 52,
                                    child: ElevatedButton(
                                      onPressed: _finishAssessment,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF00AA5A),
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                      ),
                                      child: Text(
                                        'Finish',
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
                            )
                          : SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: ElevatedButton(
                                onPressed: _goNext,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryBlue,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: Text(
                                  'Next',
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
}
