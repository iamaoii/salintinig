import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_congratulations_page.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';

class SilentReadingAssessmentQuizPage extends StatefulWidget {
  final List<dynamic>? dynamicQuestions;
  final String? storyTitle;
  final dynamic passageId;
  final int? currentQuestionIndex;
  final List<int?>? initialSelectedAnswers;

  const SilentReadingAssessmentQuizPage({
    super.key,
    this.dynamicQuestions,
    this.storyTitle,
    this.passageId,
    this.currentQuestionIndex,
    this.initialSelectedAnswers,
  });

  @override
  State<SilentReadingAssessmentQuizPage> createState() => _SilentReadingAssessmentQuizPageState();
}

class _SilentReadingAssessmentQuizPageState extends State<SilentReadingAssessmentQuizPage> {
  int _currentQuestionIndex = 0;
  late List<int?> _selectedAnswers;
  late List<Map<String, dynamic>> _questions;

  final List<Map<String, dynamic>> _defaultQuestions = [
    {
      'questionText': 'Sino ang batang Muslim sa kwento na sumalubong sa kanyang tiyuhin?',
      'options': [
        'Jamil',
        'Abdul',
        'Mohammed',
        'Allah',
      ],
      'correctAnswerIndex': 0,
    },
    {
      'questionText': 'Ano ang banal na aklat ng mga Muslim na binanggit ni Tito Abdul?',
      'options': [
        'Bibliya',
        'Koran',
        'Karnak',
        'Talmud',
      ],
      'correctAnswerIndex': 1,
    },
    {
      'questionText': 'Ano ang pinakabanal na gawain ng mga Muslim kung saan sila ay nag-aayuno?',
      'options': [
        'Ramadan',
        'Pasko',
        'Semana Santa',
        'Fiesta',
      ],
      'correctAnswerIndex': 0,
    },
  ];

  @override
  void initState() {
    super.initState();
    debugPrint('[SilentReadingQuiz] initState passageId=${widget.passageId} currentQuestionIndex=${widget.currentQuestionIndex} initialAnswers=${widget.initialSelectedAnswers}');
    if (widget.dynamicQuestions != null && widget.dynamicQuestions!.isNotEmpty) {
      _questions = widget.dynamicQuestions!.map((q) => {
        'questionText': q['questionText'] ?? '',
        'options': List<String>.from(q['options'] ?? []),
        'correctAnswerIndex': q['correctAnswerIndex'] ?? 0,
      }).toList();
    } else {
      _questions = _defaultQuestions;
    }
    _selectedAnswers = List<int?>.filled(_questions.length, null);
    if (widget.currentQuestionIndex != null &&
        widget.currentQuestionIndex! >= 0 &&
        widget.currentQuestionIndex! < _questions.length) {
      _currentQuestionIndex = widget.currentQuestionIndex!;
      _maxQuestionIndex = widget.currentQuestionIndex!;
    }
    if (widget.initialSelectedAnswers != null) {
      for (int i = 0; i < widget.initialSelectedAnswers!.length && i < _selectedAnswers.length; i++) {
        _selectedAnswers[i] = widget.initialSelectedAnswers![i];
      }
    }
    _saveCurrentProgress();
    debugPrint('[SilentReadingQuiz] After initState _currentQuestionIndex=$_currentQuestionIndex _selectedAnswers=$_selectedAnswers');
  }

  int _maxQuestionIndex = 0;

  Future<void> _saveCurrentProgress() async {
    if (_currentQuestionIndex > _maxQuestionIndex) {
      _maxQuestionIndex = _currentQuestionIndex;
    }
    debugPrint('[SilentReadingQuiz] _saveCurrentProgress passageId=${widget.passageId} qIndex=$_currentQuestionIndex answers=$_selectedAnswers');
    await QuizProgressService.saveQuizDraft(
      widget.passageId,
      assessmentType: 'silent',
      recordedAudioPath: null,
      readingTimeSeconds: 0,
      storyTitle: widget.storyTitle,
      assessmentLanguage: 'fil',
      dynamicQuestions: widget.dynamicQuestions,
      currentQuestionIndex: _currentQuestionIndex,
      selectedAnswers: _selectedAnswers,
    );
  }

  void _onOptionSelected(int index) {
    Feedback.forTap(context);
    setState(() {
      if (_selectedAnswers[_currentQuestionIndex] == index) {
        _selectedAnswers[_currentQuestionIndex] = null;
      } else {
        _selectedAnswers[_currentQuestionIndex] = index;
      }
    });
    _saveCurrentProgress();
  }

  void _goNext() {
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

    if (_currentQuestionIndex < _questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
      });
      _saveCurrentProgress();
    }
  }

  void _goBack() {
    Feedback.forTap(context);
    if (_currentQuestionIndex > 0) {
      setState(() {
        _currentQuestionIndex--;
      });
      _saveCurrentProgress();
    } else {
      _confirmExit(context);
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

    // Calculate score & prepare answers payload
    int correctCount = 0;
    final List<Map<String, dynamic>> answersPayload = [];
    for (int i = 0; i < _questions.length; i++) {
      final q = _questions[i];
      final selIdx = _selectedAnswers[i];
      final options = (q['options'] as List?) ?? [];
      final selText = (selIdx != null && selIdx >= 0 && selIdx < options.length)
          ? options[selIdx].toString()
          : '';
      final targetCorrect = q['correctAnswerIndex'] ?? q['correctIndex'] ?? 0;
      if (selIdx == targetCorrect) {
        correctCount++;
      }
      answersPayload.add({
        'questionId': q['id'],
        'questionIndex': i,
        'selectedChoiceIndex': selIdx,
        'selectedAnswerText': selText,
        'isCorrect': selIdx == targetCorrect,
      });
    }

    // Post submission to database & clear draft
    try {
      final user = AuthService.currentUser;
      final studentId = user?.rawUser?['student_id']?.toString() ??
          user?.rawUser?['studentId']?.toString() ??
          user?.userId;
      final lrn = user?.lrn;

      ApiService.post('/students/assessment/submit', {
        'studentId': studentId,
        'lrn': lrn,
        'passageId': widget.passageId,
        'assessmentType': 'silent',
        'score': correctCount,
        'maxScore': _questions.length,
        'answers': answersPayload,
      });

      QuizProgressService.clearQuizDraft(widget.passageId, 'silent');
    } catch (e) {
      debugPrint('[SilentQuiz] submission error notice: $e');
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => SilentReadingAssessmentCongratulationsPage(
          score: correctCount,
          totalQuestions: _questions.length,
        ),
      ),
    );
  }

  void _confirmExit(BuildContext context) {
    const titleColor = Color(0xFF1E293B);
    const descColor = Color(0xFF475569);
    const dialogBg = Colors.white;
    const cancelColor = Color(0xFF64748B);

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
            'Maitatabi ang iyong progreso para maipagpatuloy mo rin ito. Sigurado ka bang gusto mong lumabas?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(
                'Kanselahin',
                style: GoogleFonts.inter(color: cancelColor, fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () async {
                Navigator.pop(dialogContext);
                await QuizProgressService.saveQuizDraft(
                  widget.passageId,
                  assessmentType: 'silent',
                  recordedAudioPath: null,
                  readingTimeSeconds: 0,
                  storyTitle: widget.storyTitle,
                  assessmentLanguage: 'fil',
                  dynamicQuestions: widget.dynamicQuestions,
                  currentQuestionIndex: _currentQuestionIndex,
                  selectedAnswers: _selectedAnswers,
                );
                if (context.mounted) {
                  Navigator.pop(context);
                }
              },
              child: Text(
                'Lumabas',
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
                      // 1. Header with X Exit Button on Right Side
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const SizedBox(width: 48),
                            Expanded(
                              child: Text(
                                widget.storyTitle?.toUpperCase() ?? 'SILENT READING ASSESSMENT',
                                textAlign: TextAlign.center,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFF475569),
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ),
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
                              tooltip: 'Exit Quiz',
                            ),
                          ],
                        ),
                      ),

                      // 2. Progress Indicator
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

                      // 4. Select instruction text
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: Text(
                          'Select one answer:',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF94A3B8),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),

                      // 5. Options
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0),
                        child: Column(
                          children: List.generate(
                            (currentQuestion['options'] as List<String>).length,
                            (index) {
                              final optionText = currentQuestion['options'][index];
                              final isSelected = selectedAnswerIndex == index;
                              final optionLetter = String.fromCharCode(65 + index);

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12.0),
                                child: Container(
                                  width: double.infinity,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: isSelected ? primaryBlue : const Color(0xFFE2E8F0),
                                      width: isSelected ? 2 : 1.5,
                                    ),
                                  ),
                                  child: ElevatedButton(
                                    onPressed: () => _onOptionSelected(index),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      elevation: 0,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      padding: const EdgeInsets.symmetric(horizontal: 20),
                                    ),
                                    child: Row(
                                      children: [
                                        Container(
                                          width: 32,
                                          height: 32,
                                          decoration: BoxDecoration(
                                            color: isSelected ? primaryBlue : const Color(0xFFF1F5F9),
                                            shape: BoxShape.circle,
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            optionLetter,
                                            style: GoogleFonts.inter(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: isSelected ? Colors.white : const Color(0xFF64748B),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Text(
                                            optionText,
                                            style: GoogleFonts.inter(
                                              fontSize: 16,
                                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                              color: isSelected ? primaryBlue : const Color(0xFF1E293B),
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

                      // 6. Navigation Buttons
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                        child: Row(
                          children: [
                            if (_currentQuestionIndex > 0) ...[
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
                            ],
                            Expanded(
                              child: SizedBox(
                                height: 52,
                                child: ElevatedButton(
                                  onPressed: _currentQuestionIndex == _questions.length - 1
                                      ? _finishAssessment
                                      : _goNext,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _currentQuestionIndex == _questions.length - 1
                                        ? const Color(0xFF00AA5A)
                                        : primaryBlue,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  child: Text(
                                    _currentQuestionIndex == _questions.length - 1
                                        ? 'Finish'
                                        : 'Next',
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
