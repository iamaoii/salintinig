import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/pages/student/library/practice_congratulations_page.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/widgets/app_toast.dart';

class PracticeQuizPage extends StatefulWidget {
  final String? materialId;
  final String bookTitle;
  final List<Map<String, dynamic>> questions;
  final int? initialQuestionIndex;
  final List<int?>? initialSelectedAnswers;

  const PracticeQuizPage({
    super.key,
    this.materialId,
    required this.bookTitle,
    required this.questions,
    this.initialQuestionIndex,
    this.initialSelectedAnswers,
  });

  @override
  State<PracticeQuizPage> createState() => _PracticeQuizPageState();
}

class _PracticeQuizPageState extends State<PracticeQuizPage> {
  int _currentQuestionIndex = 0;
  late List<int?> _selectedAnswers;
  late DateTime _startTime;

  // Remedial follow-up state
  bool _isLoadingRemedial = false;
  Map<String, dynamic>? _remedialData;
  int? _selectedRemedialAnswer;

  // Track remedial attempts per question index: {questionIndex: {selected, isCorrect, data}}
  final Map<int, Map<String, dynamic>> _remedialLog = {};

  String get _passageKey => widget.materialId ?? widget.bookTitle;

  bool get _isEnglish {
    final title = widget.bookTitle.toLowerCase();
    if (title.contains('english')) return true;
    if (widget.questions.isNotEmpty) {
      final qText = (widget.questions[0]['questionText'] ?? widget.questions[0]['question'] ?? '').toString().toLowerCase();
      final opts = (widget.questions[0]['options'] is List ? widget.questions[0]['options'] as List : []).join(' ').toLowerCase();
      final combined = '$qText $opts';
      if (combined.contains('who ') ||
          combined.contains('what ') ||
          combined.contains('where ') ||
          combined.contains('why ') ||
          combined.contains('how ') ||
          combined.contains('the ') ||
          combined.contains(' is ') ||
          combined.contains(' was ')) {
        return true;
      }
    }
    return false;
  }

  @override
  void initState() {
    super.initState();
    _startTime = DateTime.now();
    _selectedAnswers = List<int?>.filled(widget.questions.length, null);

    if (widget.initialQuestionIndex != null &&
        widget.initialQuestionIndex! >= 0 &&
        widget.initialQuestionIndex! < widget.questions.length) {
      _currentQuestionIndex = widget.initialQuestionIndex!;
    }
    if (widget.initialSelectedAnswers != null) {
      for (int i = 0; i < widget.initialSelectedAnswers!.length && i < _selectedAnswers.length; i++) {
        _selectedAnswers[i] = widget.initialSelectedAnswers![i];
      }
    }

    _loadQuizDraft();
  }

  Future<void> _loadQuizDraft() async {
    try {
      final draft = await QuizProgressService.getQuizDraft(_passageKey, 'practice');
      if (draft != null && mounted) {
        final draftIdx = draft['currentQuestionIndex'] as int?;
        final rawAnswers = draft['selectedAnswers'] as List?;
        setState(() {
          if (draftIdx != null && draftIdx >= 0 && draftIdx < widget.questions.length) {
            _currentQuestionIndex = draftIdx;
          }
          if (rawAnswers != null) {
            for (int i = 0; i < rawAnswers.length && i < _selectedAnswers.length; i++) {
              final val = rawAnswers[i];
              _selectedAnswers[i] = (val != null) ? int.tryParse(val.toString()) : null;
            }
          }
        });
      }
    } catch (e) {
      debugPrint('[PracticeQuiz] Error loading draft: $e');
    }
  }

  Future<void> _saveQuizDraft() async {
    await QuizProgressService.saveQuizDraft(
      _passageKey,
      assessmentType: 'practice',
      recordedAudioPath: null,
      readingTimeSeconds: 0,
      storyTitle: widget.bookTitle,
      assessmentLanguage: _isEnglish ? 'en' : 'fil',
      dynamicQuestions: widget.questions,
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
    _saveQuizDraft();
  }

  // ── Check if current answer is wrong ──────────────────────────────────────
  bool _isCurrentAnswerWrong() {
    final selected = _selectedAnswers[_currentQuestionIndex];
    if (selected == null) return false;
    final correct = widget.questions[_currentQuestionIndex]['correctAnswerIndex'] as int?;
    return selected != correct;
  }

  // ── Fetch remedial question from GROQ AI backend ───────────────────────────
  Future<void> _fetchRemedialQuestion() async {
    final currentQuestion = widget.questions[_currentQuestionIndex];
    final selectedOptionIndex = _selectedAnswers[_currentQuestionIndex]!;
    final correctOptionIndex = (currentQuestion['correctAnswerIndex'] as int?) ?? 0;
    final rawOptions = currentQuestion['options'] as List?;
    final options = rawOptions?.map((e) => e.toString()).toList() ?? [];
    final explanation = (currentQuestion['explanation'] ?? '').toString();

    setState(() {
      _isLoadingRemedial = true;
      _remedialData = null;
      _selectedRemedialAnswer = null;
    });

    try {
      final response = await ApiService.post(
        '/student/practice/remedial-question',
        {
          'materialId': widget.materialId ?? '',
          'questionText': (currentQuestion['questionText'] ?? currentQuestion['question'] ?? '').toString(),
          'options': options,
          'selectedOptionIndex': selectedOptionIndex,
          'correctOptionIndex': correctOptionIndex,
          'explanation': explanation,
          'language': _isEnglish ? 'en' : 'fil',
        },
      );

      if (!mounted) return;

      if (response.success && response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        setState(() {
          _remedialData = data;
          _isLoadingRemedial = false;
        });
        _showRemedialSheet();
        return;
      }
      // If request fails or error returned, throw to trigger fallback
      throw Exception(response.error ?? 'Server error ${response.statusCode}');
    } catch (e) {
      debugPrint('[PracticeQuiz] Remedial fetch error: $e');
      if (!mounted) return;
      setState(() {
        _isLoadingRemedial = false;
        // Use explanation as fallback hint directly
        _remedialData = null;
      });
      // Show fallback hint as a snackbar and allow proceeding
      _showFallbackAndProceed();
    }
  }

  // ── Show fallback explanation in a snackbar then proceed ───────────────────
  void _showFallbackAndProceed() {
    final explanation = (widget.questions[_currentQuestionIndex]['explanation'] ?? '').toString();
    final hint = explanation.isNotEmpty
        ? explanation
        : (_isEnglish ? 'Re-read the story carefully!' : 'Basahin muli ang kuwento nang mabuti!');

    AppToast.info(
      context,
      hint,
    );

    // Proceed to next question after showing hint
    _proceedToNext();
  }

  // ── Show the remedial bottom sheet ────────────────────────────────────────
  void _showRemedialSheet() {
    if (_remedialData == null) return;
    const primaryBlue = Color(0xFF1B64D8);

    final hint = (_remedialData!['hint'] ?? '').toString();
    final explanationText = (_remedialData!['explanation'] ?? '').toString();
    final followUpQuestion = (_remedialData!['followUpQuestion'] ?? '').toString();
    final rawOptions = _remedialData!['options'];
    final options = (rawOptions is List) ? rawOptions.map((e) => e.toString()).toList() : <String>[];
    final correctAnswerIndex = (_remedialData!['correctAnswerIndex'] as int?) ?? 0;

    // Use specific explanation if provided by AI, otherwise fallback to hint
    final finalExplanation = explanationText.trim().isNotEmpty ? explanationText : hint;

    bool showHint = false;
    bool isSubmitting = false;
    String? feedbackStatus; // 'correct' | 'wrong' | null

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: false,
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return PopScope(
              canPop: false,
              onPopInvokedWithResult: (didPop, result) {
                if (didPop || isSubmitting) return;
                _confirmExitFromSheet(sheetContext);
              },
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
                ),
                padding: EdgeInsets.fromLTRB(
                  24, 20, 24, MediaQuery.of(ctx).viewInsets.bottom + 28,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Handle bar
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),

                    // Header: Follow-Up Question
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: primaryBlue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            _isEnglish ? 'Follow-Up Question' : 'Follow-Up na Tanong',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: primaryBlue,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Question Text
                    Text(
                      followUpQuestion,
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Hint Section (Placed directly after Question, Left-aligned, Clear & Visible)
                    InkWell(
                      onTap: isSubmitting
                          ? null
                          : () {
                              setSheetState(() {
                                showHint = !showHint;
                              });
                            },
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              showHint ? Icons.lightbulb_rounded : Icons.lightbulb_outline_rounded,
                              size: 18,
                              color: const Color(0xFFD97706),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              showHint
                                  ? (_isEnglish ? 'Hide hint' : 'Itago ang pahiwatig')
                                  : (_isEnglish ? 'Show hint' : 'Ipakita ang pahiwatig'),
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFFD97706),
                              ),
                            ),
                            const SizedBox(width: 4),
                            Icon(
                              showHint ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                              size: 18,
                              color: const Color(0xFFD97706),
                            ),
                          ],
                        ),
                      ),
                    ),

                    if (showHint) ...[
                      const SizedBox(height: 6),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7).withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFDE68A)),
                        ),
                        child: Text(
                          hint,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF92400E),
                            height: 1.45,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 16),

                    // Instruction Label matching quiz
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10.0),
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

                    // Choices (Exact same look and feel as main quiz + deselectable)
                    ...List.generate(options.length, (i) {
                      final isSelected = _selectedRemedialAnswer == i;
                      final isCorrectChoice = i == correctAnswerIndex;
                      final optionText = options[i];

                      // Dynamic styling based on feedbackStatus
                      Color cardBg = isSelected
                          ? const Color(0xFFD3E2F8)
                          : const Color(0xFFF1F5F9).withValues(alpha: 0.5);
                      Color borderColor = isSelected ? primaryBlue : const Color(0xFFE2E8F0);
                      Color iconColor = isSelected ? primaryBlue : const Color(0xFF94A3B8);
                      Color textColor = isSelected ? primaryBlue : const Color(0xFF334155);
                      IconData iconData = isSelected ? Icons.check_circle_rounded : Icons.circle_outlined;

                      if (feedbackStatus != null) {
                        if (feedbackStatus == 'correct' && isSelected) {
                          cardBg = const Color(0xFFDCFCE7); // Soft Green
                          borderColor = const Color(0xFF16A34A);
                          iconColor = const Color(0xFF16A34A);
                          textColor = const Color(0xFF15803D);
                          iconData = Icons.check_circle_rounded;
                        } else if (feedbackStatus == 'wrong') {
                          if (isSelected) {
                            cardBg = const Color(0xFFFEE2E2); // Soft Red
                            borderColor = const Color(0xFFEF4444);
                            iconColor = const Color(0xFFEF4444);
                            textColor = const Color(0xFFB91C1C);
                            iconData = Icons.cancel_rounded;
                          } else if (isCorrectChoice) {
                            cardBg = const Color(0xFFDCFCE7); // Highlight correct in soft green
                            borderColor = const Color(0xFF22C55E);
                            iconColor = const Color(0xFF16A34A);
                            textColor = const Color(0xFF15803D);
                            iconData = Icons.check_circle_rounded;
                          }
                        }
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: GestureDetector(
                          onTap: isSubmitting
                              ? null
                              : () {
                                  Feedback.forTap(context);
                                  setSheetState(() {
                                    if (_selectedRemedialAnswer == i) {
                                      _selectedRemedialAnswer = null;
                                    } else {
                                      _selectedRemedialAnswer = i;
                                    }
                                  });
                                },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            constraints: const BoxConstraints(minHeight: 56),
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: borderColor,
                                width: isSelected ? 1.5 : 1.0,
                              ),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            child: Row(
                              children: [
                                Icon(
                                  iconData,
                                  color: iconColor,
                                  size: 24,
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Text(
                                    optionText,
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: textColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),

                    // Micro-feedback banner with story context
                    if (feedbackStatus != null) ...[
                      const SizedBox(height: 6),
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: feedbackStatus == 'correct'
                              ? const Color(0xFFF0FDF4)
                              : const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: feedbackStatus == 'correct'
                                ? const Color(0xFF86EFAC)
                                : const Color(0xFFFECACA),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(top: 2.0),
                              child: Icon(
                                feedbackStatus == 'correct'
                                    ? Icons.check_circle_rounded
                                    : Icons.info_rounded,
                                size: 20,
                                color: feedbackStatus == 'correct'
                                    ? const Color(0xFF16A34A)
                                    : const Color(0xFFDC2626),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    feedbackStatus == 'correct'
                                        ? (_isEnglish
                                            ? 'Great! You understood it.'
                                            : 'Magaling! Naunawaan mo na.')
                                        : (_isEnglish
                                            ? 'The correct answer is: ${options.length > correctAnswerIndex ? options[correctAnswerIndex] : ''}.'
                                            : 'Ang tamang sagot ay: ${options.length > correctAnswerIndex ? options[correctAnswerIndex] : ''}.'),
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: feedbackStatus == 'correct'
                                          ? const Color(0xFF15803D)
                                          : const Color(0xFF991B1B),
                                      height: 1.35,
                                    ),
                                  ),
                                  if (finalExplanation.trim().isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      _isEnglish
                                          ? 'Explanation: $finalExplanation'
                                          : 'Paliwanag: $finalExplanation',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: feedbackStatus == 'correct'
                                            ? const Color(0xFF166534)
                                            : const Color(0xFF7F1D1D),
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 12),

                    // Action button (Check Answer -> Continue)
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _selectedRemedialAnswer == null
                            ? null
                            : () {
                                Feedback.forTap(context);

                                // Step 1: If not yet submitted, evaluate & show feedback
                                if (feedbackStatus == null) {
                                  final isRemedialCorrect = _selectedRemedialAnswer == correctAnswerIndex;

                                  // Log remedial attempt
                                  _remedialLog[_currentQuestionIndex] = {
                                    'hint': hint,
                                    'followUpQuestion': followUpQuestion,
                                    'options': options,
                                    'correctAnswerIndex': correctAnswerIndex,
                                    'selectedIndex': _selectedRemedialAnswer,
                                    'isCorrect': isRemedialCorrect,
                                    'fromCache': _remedialData!['fromCache'] ?? false,
                                    'fallback': _remedialData!['fallback'] ?? false,
                                  };

                                  setSheetState(() {
                                    isSubmitting = true; // Lock option changes
                                    feedbackStatus = isRemedialCorrect ? 'correct' : 'wrong';
                                  });
                                } else {
                                  // Step 2: Student has reviewed the answer and taps Continue
                                  Navigator.pop(sheetContext);
                                  _proceedToNext();
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: feedbackStatus != null
                              ? const Color(0xFF00AA5A) // Green when ready to continue
                              : primaryBlue,
                          disabledBackgroundColor: const Color(0xFFCBD5E1),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        child: Text(
                          feedbackStatus != null
                              ? (_isEnglish ? 'Continue' : 'Magpatuloy')
                              : (_isEnglish ? 'Check Answer' : 'Suriin ang Sagot'),
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
              ),
            );
          },
        );
      },
    );
  }

  // ── Proceed to next question (called after remedial or correct answer) ─────
  void _proceedToNext() {
    if (_currentQuestionIndex < widget.questions.length - 1) {
      setState(() {
        _currentQuestionIndex++;
        _remedialData = null;
        _selectedRemedialAnswer = null;
      });
      _saveQuizDraft();
    } else {
      // If we finished the remedial question or answer for the last question, submit quiz
      _submitQuiz();
    }
  }

  void _goNext() async {
    Feedback.forTap(context);
    if (_selectedAnswers[_currentQuestionIndex] == null) {
      AppToast.warning(
        context,
        _isEnglish ? 'Please select an answer.' : 'Pumili muna ng isang sagot.',
      );
      return;
    }

    // If wrong answer: fetch remedial question before proceeding
    if (_isCurrentAnswerWrong()) {
      await _fetchRemedialQuestion();
      return;
    }

    _proceedToNext();
  }

  void _finishQuiz() async {
    Feedback.forTap(context);
    if (_selectedAnswers[_currentQuestionIndex] == null) {
      AppToast.warning(
        context,
        _isEnglish ? 'Please select an answer.' : 'Pumili muna ng isang sagot.',
      );
      return;
    }

    // If last question is wrong: show remedial before finishing
    if (_isCurrentAnswerWrong()) {
      await _fetchRemedialQuestion();
      return;
    }

    _submitQuiz();
  }

  void _submitQuiz() async {
    int correctCount = 0;
    final List<Map<String, dynamic>> detailedAnswers = [];

    for (int i = 0; i < widget.questions.length; i++) {
      final q = widget.questions[i];
      final qText = (q['questionText'] ?? q['question'] ?? '').toString();
      final selectedOpt = _selectedAnswers[i];
      final correctOpt = (q['correctAnswerIndex'] as int?) ?? 0;
      final isCorrect = selectedOpt == correctOpt;

      if (isCorrect) {
        correctCount++;
      }

      // Build remedial attempt object if this question triggered remediation
      Map<String, dynamic>? remedialObj;
      if (_remedialLog.containsKey(i)) {
        final log = _remedialLog[i]!;
        remedialObj = {
          'ai_generated_hint': log['hint'] ?? '',
          'follow_up_question': log['followUpQuestion'] ?? '',
          'remedial_options': log['options'] ?? [],
          'remedial_selected_option': log['selectedIndex'],
          'remedial_correct_option': log['correctAnswerIndex'],
          'remedial_is_correct': log['isCorrect'] ?? false,
          'from_cache': log['fromCache'] ?? false,
        };
      }

      detailedAnswers.add({
        'question_index': i,
        'question_text': qText,
        'selected_option_index': selectedOpt,
        'correct_option_index': correctOpt,
        'is_correct': isCorrect,
        'remedial_attempt': remedialObj,
      });
    }

    final timeSpentSeconds = DateTime.now().difference(_startTime).inSeconds;

    await QuizProgressService.clearQuizDraft(_passageKey, 'practice');

    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => PracticeCongratulationsPage(
          bookTitle: widget.bookTitle,
          materialId: widget.materialId,
          score: correctCount,
          totalQuestions: widget.questions.length,
          selectedAnswers: detailedAnswers,
          timeSpentSeconds: timeSpentSeconds,
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
                final navigator = Navigator.of(context);
                Navigator.pop(dialogContext);
                await _saveQuizDraft();
                if (mounted) {
                  navigator.pop();
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

  void _confirmExitFromSheet(BuildContext sheetContext) {
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
                final navigator = Navigator.of(context);
                Navigator.pop(dialogContext); // Close dialog
                Navigator.pop(sheetContext);  // Dismiss bottom sheet
                await _saveQuizDraft();
                if (mounted) {
                  navigator.pop();            // Exit quiz page
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

    final currentQuestion = widget.questions[_currentQuestionIndex];
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
                      // 1. Header Bar with Title and Close Button
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const SizedBox(width: 40),
                            Expanded(
                              child: Text(
                                widget.bookTitle.toUpperCase(),
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
                            Row(
                              children: List.generate(widget.questions.length, (index) {
                                final isActive = index <= _currentQuestionIndex;
                                return Expanded(
                                  child: Container(
                                    height: 6,
                                    margin: EdgeInsets.only(
                                      right: index == widget.questions.length - 1 ? 0.0 : 6.0,
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

                      // 5. Options
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Builder(
                          builder: (context) {
                            final rawOptions = currentQuestion['options'] as List?;
                            final options = rawOptions?.map((e) => e.toString()).toList() ?? [];

                            return Column(
                              children: List.generate(
                                options.length,
                                (index) {
                                  final optionText = options[index];
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
                            );
                          },
                        ),
                      ),

                      // 6. Navigation Button (Full width Next / Finish - no back button)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                        child: SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton(
                            onPressed: _isLoadingRemedial
                                ? null
                                : (_currentQuestionIndex == widget.questions.length - 1
                                    ? _finishQuiz
                                    : _goNext),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _currentQuestionIndex == widget.questions.length - 1
                                  ? const Color(0xFF00AA5A)
                                  : primaryBlue,
                              disabledBackgroundColor: const Color(0xFFCBD5E1),
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: _isLoadingRemedial
                                ? Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Text(
                                        _isEnglish ? 'Please wait...' : 'Sandali lang...',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  )
                                : Text(
                                    _currentQuestionIndex == widget.questions.length - 1
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
              );
            },
          ),
        ),
      ),
    );
  }
}
