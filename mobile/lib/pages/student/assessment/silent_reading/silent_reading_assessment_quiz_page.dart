import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_congratulations_page.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';

class SilentReadingAssessmentQuizPage extends StatefulWidget {
  final List<dynamic>? dynamicQuestions;
  final String? storyTitle;
  final String? assessmentLanguage;
  final dynamic passageId;
  final int? currentQuestionIndex;
  final List<int?>? initialSelectedAnswers;
  final int? readingTimeSeconds;

  const SilentReadingAssessmentQuizPage({
    super.key,
    this.dynamicQuestions,
    this.storyTitle,
    this.assessmentLanguage,
    this.passageId,
    this.currentQuestionIndex,
    this.initialSelectedAnswers,
    this.readingTimeSeconds,
  });

  @override
  State<SilentReadingAssessmentQuizPage> createState() => _SilentReadingAssessmentQuizPageState();
}

class _SilentReadingAssessmentQuizPageState extends State<SilentReadingAssessmentQuizPage> {
  int _currentQuestionIndex = 0;
  late List<int?> _selectedAnswers;
  late List<Map<String, dynamic>> _questions;

  bool get _isEnglish {
    final lang = (widget.assessmentLanguage ?? '').toLowerCase();
    final title = (widget.storyTitle ?? '').toLowerCase();
    if (lang.startsWith('en') || lang.contains('english') || title.contains('english')) {
      return true;
    }
    if (_questions.isNotEmpty) {
      final qText = (_questions[0]['questionText'] ?? _questions[0]['question'] ?? '').toString().toLowerCase();
      final opts = (_questions[0]['options'] is List ? _questions[0]['options'] as List : []).join(' ').toLowerCase();
      final combined = '$qText $opts';

      if (combined.contains('who ') ||
          combined.contains('what ') ||
          combined.contains('where ') ||
          combined.contains('why ') ||
          combined.contains('how ') ||
          combined.contains('which ') ||
          combined.contains('the ') ||
          combined.contains(' is ') ||
          combined.contains(' was ') ||
          combined.contains(' are ') ||
          combined.contains(' story')) {
        return true;
      }
    }
    return false;
  }

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
        'questionText': q['questionText'] ?? q['question'] ?? '',
        'options': List<String>.from(q['options'] ?? []),
        'correctAnswerIndex': q['correctAnswerIndex'] ?? q['correctIndex'] ?? 0,
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
      readingTimeSeconds: widget.readingTimeSeconds ?? 0,
      storyTitle: widget.storyTitle,
      assessmentLanguage: widget.assessmentLanguage ?? 'fil',
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
            _isEnglish ? 'Please select an answer.' : 'Pumili muna ng isang sagot.',
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

  void _finishAssessment() async {
    Feedback.forTap(context);
    if (_selectedAnswers[_currentQuestionIndex] == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _isEnglish ? 'Please select an answer.' : 'Pumili muna ng isang sagot.',
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

    _confirmSubmitQuiz();
  }

  void _confirmSubmitQuiz() {
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
            _isEnglish ? 'Submit Quiz?' : 'Ipasa ang Pagsusulit?',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: titleColor),
          ),
          content: Text(
            _isEnglish
                ? 'Are you sure you want to finish and submit your quiz answers?'
                : 'Sigurado ka bang nais mo nang tapusin at ipasa ang iyong mga sagot?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(
                _isEnglish ? 'Cancel' : 'Kanselahin',
                style: GoogleFonts.inter(color: cancelColor, fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext); // Close dialog
                _submitQuiz();                // Perform submission
              },
              child: Text(
                _isEnglish ? 'Submit' : 'Ipasa',
                style: GoogleFonts.inter(color: const Color(0xFF1B64D8), fontWeight: FontWeight.w700),
              ),
            ),
          ],
        );
      },
    );
  }

  void _submitQuiz() async {
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

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Color(0xFF1B64D8)),
      ),
    );

    try {
      final user = AuthService.currentUser;
      final studentId = user?.rawUser?['student_id']?.toString() ??
          user?.rawUser?['studentId']?.toString() ??
          user?.userId;
      final lrn = user?.lrn;

      final res = await ApiService.post('/students/assessment/submit', {
        'studentId': studentId,
        'lrn': lrn,
        'passageId': widget.passageId,
        'assessmentType': 'silent',
        'score': correctCount,
        'maxScore': _questions.length,
        'readingTimeSeconds': widget.readingTimeSeconds ?? 0,
        'answers': answersPayload,
      });
      debugPrint('[SilentQuiz] Submission result: ${res.success}, msg: ${res.message ?? res.error}');

      await QuizProgressService.clearQuizDraft(widget.passageId, 'silent');
    } catch (e) {
      debugPrint('[SilentQuiz] submission error notice: $e');
    } finally {
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context); // Safely close progress dialog
      }
    }

    if (!mounted) return;

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
            _isEnglish ? 'Exit Quiz?' : 'Lumabas sa Pagsusulit?',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: titleColor),
          ),
          content: Text(
            _isEnglish
                ? 'Your progress will be saved so you can continue later. Are you sure you want to exit?'
                : 'Maitatabi ang iyong progreso para maipagpatuloy mo rin ito. Sigurado ka bang gusto mong lumabas?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(
                _isEnglish ? 'Cancel' : 'Kanselahin',
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
                  readingTimeSeconds: widget.readingTimeSeconds ?? 0,
                  storyTitle: widget.storyTitle,
                  assessmentLanguage: widget.assessmentLanguage ?? 'fil',
                  dynamicQuestions: widget.dynamicQuestions,
                  currentQuestionIndex: _currentQuestionIndex,
                  selectedAnswers: _selectedAnswers,
                );
                if (context.mounted) {
                  Navigator.pop(context);
                }
              },
              child: Text(
                _isEnglish ? 'Exit' : 'Lumabas',
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
    final currentQuestion = _questions[_currentQuestionIndex];
    final selectedAnswerIndex = _selectedAnswers[_currentQuestionIndex];

    return Scaffold(
      backgroundColor: const Color(0xFFFCFAF7),
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
                      // 1. Header Bar with Title and Close Button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const SizedBox(width: 40),
                            Expanded(
                              child: Text(
                                (widget.storyTitle ?? 'Silent Reading Quiz').toUpperCase(),
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF475569),
                                  letterSpacing: 1.0,
                                ),
                              ),
                            ),
                            IconButton(
                              onPressed: () => _confirmExit(context),
                              icon: const Icon(
                                Icons.close_rounded,
                                size: 28,
                                color: Color(0xFF475569),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 2. Segmented Progress Bar & Question Counter
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isEnglish
                                  ? 'QUESTION ${_currentQuestionIndex + 1}'
                                  : 'TANONG ${_currentQuestionIndex + 1}',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF64748B),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 8),
                            // Segmented bar
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
                                (currentQuestion['questionText'] ?? currentQuestion['question'] ?? '').toString(),
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
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            _isEnglish ? 'SELECT ONE ANSWER' : 'PUMILI NG ISANG SAGOT',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF94A3B8),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),

                      // 5. Options (Picture 1 style: Radio with checkmark/circle, no letters)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Column(
                          children: List.generate(
                            (currentQuestion['options'] as List<String>).length,
                            (index) {
                              final optionText = currentQuestion['options'][index];
                              final isSelected = selectedAnswerIndex == index;

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12.0),
                                child: GestureDetector(
                                  onTap: () => _onOptionSelected(index),
                                  child: Container(
                                    constraints: const BoxConstraints(minHeight: 56),
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
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16.0,
                                      vertical: 14.0,
                                    ),
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
                                      _isEnglish ? 'Back' : 'Bumalik',
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
                                        ? (_isEnglish ? 'Finish' : 'Tapusin')
                                        : (_isEnglish ? 'Next' : 'Susunod'),
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
