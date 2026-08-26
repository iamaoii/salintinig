import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_congratulations_page.dart';
import 'package:salintinig/pages/student/student_overview_page.dart';
import 'package:salintinig/widgets/app_toast.dart';

class OralReadingAssessmentQuizPage extends StatefulWidget {
  final List<dynamic>? dynamicQuestions;
  final String? recordedAudioPath;

  const OralReadingAssessmentQuizPage({
    super.key,
    this.dynamicQuestions,
    this.recordedAudioPath,
  });

  @override
  State<OralReadingAssessmentQuizPage> createState() => _OralReadingAssessmentQuizPageState();
}

class _OralReadingAssessmentQuizPageState extends State<OralReadingAssessmentQuizPage> {
  int _currentQuestionIndex = 0;
  final Map<int, int> _selectedAnswers = {};
  
  late List<Map<String, dynamic>> _questions;

  final List<Map<String, dynamic>> _defaultQuestions = [
    {
      'question': 'Sino ang pangunahing tauhan sa kuwento?',
      'options': ['Si Mang Tomas', 'Si Juan', 'Si Pedro', 'Si Ana'],
      'correctIndex': 0,
    },
    {
      'question': 'Ano ang hanapbuhay ni Mang Tomas?',
      'options': ['Mangingisda', 'Magsasaka', 'Guro', 'Karpintero'],
      'correctIndex': 1,
    },
    {
      'question': 'Saan matatagpuan ang bukirin ni Mang Tomas?',
      'options': ['Sa gitna ng lungsod', 'Sa tabi ng dagat', 'Sa paanan ng bundok', 'Sa ibabaw ng burol'],
      'correctIndex': 2,
    },
    {
      'question': 'Ano ang naramdaman ni Mang Tomas sa kaniyang huling ani?',
      'options': ['Malungkot', 'Galit', 'Masaya at Nagpapasalamat', 'Nababato'],
      'correctIndex': 2,
    },
    {
      'question': 'Ano ang aral ng kuwento?',
      'options': [
        'Huwag magsikap sa buhay',
        'Maging matiyaga at magpasalamat sa biiyaya',
        'Umasa lamang sa tulong ng iba',
        'Mag-aksaya ng pagkain'
      ],
      'correctIndex': 1,
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.dynamicQuestions != null && widget.dynamicQuestions!.isNotEmpty) {
      _questions = widget.dynamicQuestions!.map((q) => {
        'question': q['questionText'] ?? q['question'] ?? '',
        'options': List<String>.from(q['options'] ?? []),
        'correctIndex': q['correctIndex'] ?? 0,
      }).toList();
    } else {
      _questions = _defaultQuestions;
    }
  }

  void _selectAnswer(int index) {
    Feedback.forTap(context);
    setState(() {
      _selectedAnswers[_currentQuestionIndex] = index;
    });
  }

  void _goNext() {
    Feedback.forTap(context);
    if (_selectedAnswers[_currentQuestionIndex] == null) {
      AppToast.warning(
        context,
        'Pumili muna ng isang sagot.',
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
      AppToast.warning(
        context,
        'Pumili muna ng isang sagot.',
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

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => OralReadingAssessmentCongratulationsPage(
          score: correctCount,
          totalQuestions: _questions.length,
        ),
      ),
    );
  }

  void _confirmExit(BuildContext context) {
    final titleColor = const Color(0xFF1E293B);
    final descColor = const Color(0xFF475569);
    final dialogBg = Colors.white;
    final cancelColor = const Color(0xFF64748B);

    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Exit Quiz?',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: titleColor),
          ),
          content: Text(
            'Your quiz progress will be lost and you will return to the Home page. Are you sure you want to exit?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(color: cancelColor, fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext); // Close dialog
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const StudentOverviewPage()),
                  (route) => false,
                );
              },
              child: Text(
                'Exit',
                style: GoogleFonts.inter(color: Colors.redAccent, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        );
      },
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
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;
          _confirmExit(context);
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
                      // 1. Header
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            IconButton(
                              onPressed: () {
                                Feedback.forTap(context);
                                _confirmExit(context);
                              },
                              icon: const Icon(
                                Icons.close_rounded,
                                size: 26,
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
                            const SizedBox(width: 48),
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
                                  onTap: () => _selectAnswer(index),
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
                                        Expanded(
                                          child: Text(
                                            optionText,
                                            style: GoogleFonts.inter(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                              color: isSelected
                                                  ? primaryBlue
                                                  : const Color(0xFF334155),
                                            ),
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
      ),
    );
  }
}
