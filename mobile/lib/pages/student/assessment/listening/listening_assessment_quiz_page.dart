import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_congratulations_page.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/app_toast.dart';

class ListeningAssessmentQuizPage extends StatefulWidget {
  final List<dynamic>? dynamicQuestions;
  final String? storyTitle;
  final dynamic passageId;
  final String? assessmentLanguage;
  final int? currentQuestionIndex;
  final List<int?>? initialSelectedAnswers;
  final int? readingTimeSeconds;

  const ListeningAssessmentQuizPage({
    super.key,
    this.dynamicQuestions,
    this.storyTitle,
    this.passageId,
    this.assessmentLanguage,
    this.currentQuestionIndex,
    this.initialSelectedAnswers,
    this.readingTimeSeconds,
  });

  @override
  State<ListeningAssessmentQuizPage> createState() => _ListeningAssessmentQuizPageState();
}

class _ListeningAssessmentQuizPageState extends State<ListeningAssessmentQuizPage> {
  int _currentQuestionIndex = 0;
  late List<int?> _selectedAnswers;
  late List<Map<String, dynamic>> _questions;

  bool get _isEnglish {
    final lang = (widget.assessmentLanguage ?? '').toLowerCase();
    if (lang.startsWith('en') || lang.contains('english')) return true;
    if (lang.startsWith('fil') ||
        lang.startsWith('tl') ||
        lang.contains('tagalog') ||
        lang.contains('filipino')) {
      return false;
    }

    final title = (widget.storyTitle ?? '').toLowerCase();
    if (title.contains('english')) return true;
    if (title.contains('filipino') || title.contains('tagalog')) return false;

    // Content-based heuristic fallback from question text
    if (widget.dynamicQuestions != null && widget.dynamicQuestions!.isNotEmpty) {
      final firstQ = widget.dynamicQuestions!.first;
      final qText = (firstQ['questionText'] ?? '').toString().toLowerCase();
      if (qText.startsWith('ano') ||
          qText.startsWith('sino') ||
          qText.startsWith('saan') ||
          qText.startsWith('kailan') ||
          qText.startsWith('bakit') ||
          qText.startsWith('paano') ||
          qText.contains(' ang ') ||
          qText.contains(' ng ') ||
          qText.contains(' mga ')) {
        return false;
      }
      if (qText.startsWith('what') ||
          qText.startsWith('who') ||
          qText.startsWith('where') ||
          qText.startsWith('when') ||
          qText.startsWith('why') ||
          qText.startsWith('how') ||
          qText.startsWith('which') ||
          qText.contains(' the ') ||
          qText.contains(' is ') ||
          qText.contains(' are ')) {
        return true;
      }
    }
    return false;
  }

  final List<Map<String, dynamic>> _defaultQuestions = [
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

  @override
  void initState() {
    super.initState();
    debugPrint('[ListeningQuiz] initState passageId=${widget.passageId} currentQuestionIndex=${widget.currentQuestionIndex} initialAnswers=${widget.initialSelectedAnswers}');
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
    debugPrint('[ListeningQuiz] After initState _currentQuestionIndex=$_currentQuestionIndex _selectedAnswers=$_selectedAnswers');
  }

  int _maxQuestionIndex = 0;

  Future<void> _saveCurrentProgress() async {
    if (_currentQuestionIndex > _maxQuestionIndex) {
      _maxQuestionIndex = _currentQuestionIndex;
    }
    debugPrint('[ListeningQuiz] _saveCurrentProgress passageId=${widget.passageId} qIndex=$_currentQuestionIndex answers=$_selectedAnswers readingTime=${widget.readingTimeSeconds}');
    await QuizProgressService.saveQuizDraft(
      widget.passageId,
      assessmentType: 'listening',
      recordedAudioPath: null,
      readingTimeSeconds: widget.readingTimeSeconds ?? 0,
      storyTitle: widget.storyTitle,
      assessmentLanguage: _isEnglish ? 'en' : 'fil',
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
      AppToast.warning(
        context,
        _isEnglish ? 'Please select an answer first.' : 'Pumili muna ng isang sagot.',
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
      AppToast.warning(
        context,
        _isEnglish ? 'Please select an answer first.' : 'Pumili muna ng isang sagot.',
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

    // Show loading dialog while sending to backend database
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Color(0xFF1B64D8)),
      ),
    );

    // Post submission to database & clear draft
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
        'assessmentType': 'listening',
        'readingTimeSeconds': widget.readingTimeSeconds ?? 0,
        'score': correctCount,
        'maxScore': _questions.length,
        'answers': answersPayload,
      });
      debugPrint('[ListeningQuiz] Submission result: ${res.success}, msg: ${res.message ?? res.error}');

      await QuizProgressService.clearQuizDraft(widget.passageId, 'listening');
    } catch (e) {
      debugPrint('[ListeningQuiz] submission error notice: $e');
    } finally {
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context); // Safely close progress dialog
      }
    }

    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => ListeningAssessmentCongratulationsPage(
          score: correctCount,
          totalQuestions: _questions.length,
          assessmentLanguage: widget.assessmentLanguage,
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
                Navigator.pop(dialogContext); // Close dialog
                await QuizProgressService.saveQuizDraft(
                  widget.passageId,
                  assessmentType: 'listening',
                  recordedAudioPath: null,
                  readingTimeSeconds: widget.readingTimeSeconds ?? 0,
                  storyTitle: widget.storyTitle,
                  assessmentLanguage: _isEnglish ? 'en' : 'fil',
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
                              widget.storyTitle?.toUpperCase() ?? 'LISTENING ASSESSMENT',
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

                    // 2. Progress Indicator and Label
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
                          _isEnglish ? 'SELECT ONLY ONE' : 'PUMILI LAMANG NG ISA',
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
