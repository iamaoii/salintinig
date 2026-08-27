import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_congratulations_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/widgets/app_toast.dart';

class OralReadingAssessmentQuizPage extends StatefulWidget {
  final List<dynamic>? dynamicQuestions;
  final String? recordedAudioPath;
  final int? readingTimeSeconds;
  final String? storyTitle;
  final String? assessmentLanguage;
  final dynamic passageId;
  final int? currentQuestionIndex;
  final Map<int, int>? initialSelectedAnswers;

  const OralReadingAssessmentQuizPage({
    super.key,
    this.dynamicQuestions,
    this.recordedAudioPath,
    this.readingTimeSeconds,
    this.storyTitle,
    this.assessmentLanguage,
    this.passageId,
    this.currentQuestionIndex,
    this.initialSelectedAnswers,
  });

  @override
  State<OralReadingAssessmentQuizPage> createState() => _OralReadingAssessmentQuizPageState();
}

class _OralReadingAssessmentQuizPageState extends State<OralReadingAssessmentQuizPage> {
  int _currentQuestionIndex = 0;
  int _maxQuestionIndex = 0;
  final Map<int, int> _selectedAnswers = {};
  
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
      'questionText': 'Sino ang pangunahing tauhan sa kwento?',
      'options': ['Bata', 'Guro', 'Nanay', 'Ama'],
      'correctIndex': 0,
    },
    {
      'questionText': 'Ano ang ginagawa ng pangunahing tauhan?',
      'options': ['Nababasa', 'Nagtuturo', 'Naglalaro', 'Nagtatrabaho'],
      'correctIndex': 0,
    },
    {
      'questionText': 'Ano ang aral na makukuha sa kwento?',
      'options': ['Maging mabait', 'Maging masipag', 'Maging matulungin', 'Lahat ng nabanggit'],
      'correctIndex': 3,
    },
  ];

  @override
  void initState() {
    super.initState();
    debugPrint('[OralReadingQuiz] initState passageId=${widget.passageId} currentQuestionIndex=${widget.currentQuestionIndex} initialAnswers=${widget.initialSelectedAnswers}');
    final List<Map<String, dynamic>> parsedList = [];

    if (widget.dynamicQuestions != null && widget.dynamicQuestions!.isNotEmpty) {
      for (final q in widget.dynamicQuestions!) {
        if (q == null) continue;
        final cIndex = q['correctAnswerIndex'] ?? q['correctIndex'] ?? 0;
        final rawOpts = q['options'];
        List<String> parsedOptions = [];
        if (rawOpts is List) {
          parsedOptions = rawOpts
              .map((e) => e?.toString() ?? '')
              .where((s) => s.isNotEmpty)
              .toList();
        }
        parsedList.add({
          'questionText': (q['questionText'] ?? q['question'] ?? '').toString(),
          'options': parsedOptions,
          'correctIndex': cIndex is int ? cIndex : 0,
        });
      }
    }

    _questions = parsedList.isNotEmpty ? parsedList : _defaultQuestions;

    if (widget.currentQuestionIndex != null &&
        widget.currentQuestionIndex! >= 0 &&
        widget.currentQuestionIndex! < _questions.length) {
      _currentQuestionIndex = widget.currentQuestionIndex!;
      _maxQuestionIndex = widget.currentQuestionIndex!;
    }
    if (widget.initialSelectedAnswers != null) {
      _selectedAnswers.addAll(widget.initialSelectedAnswers!);
    }
    _saveCurrentProgress();
    debugPrint('[OralReadingQuiz] After initState _currentQuestionIndex=$_currentQuestionIndex _selectedAnswers=$_selectedAnswers _questions.length=${_questions.length}');
  }

  Future<void> _saveCurrentProgress() async {
    if (_currentQuestionIndex > _maxQuestionIndex) {
      _maxQuestionIndex = _currentQuestionIndex;
    }
    debugPrint('[OralReadingQuiz] _saveCurrentProgress passageId=${widget.passageId} qIndex=$_currentQuestionIndex answers=$_selectedAnswers');
    await QuizProgressService.saveQuizDraft(
      widget.passageId,
      assessmentType: 'oral',
      recordedAudioPath: widget.recordedAudioPath,
      readingTimeSeconds: widget.readingTimeSeconds ?? 0,
      storyTitle: widget.storyTitle,
      assessmentLanguage: widget.assessmentLanguage,
      dynamicQuestions: widget.dynamicQuestions,
      currentQuestionIndex: _currentQuestionIndex,
      selectedAnswers: _selectedAnswers,
    );
  }

  void _selectAnswer(int index) {
    Feedback.forTap(context);
    setState(() {
      if (_selectedAnswers[_currentQuestionIndex] == index) {
        _selectedAnswers.remove(_currentQuestionIndex);
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

    // Calculate score
    int correctCount = 0;
    for (int i = 0; i < _questions.length; i++) {
      final targetCorrect = _questions[i]['correctIndex'] ?? 0;
      if (_selectedAnswers[i] == targetCorrect) {
        correctCount++;
      }
    }

    // Prepare answers payload
    final List<Map<String, dynamic>> answersPayload = [];
    for (int i = 0; i < _questions.length; i++) {
      final q = _questions[i];
      final selIdx = _selectedAnswers[i];
      final options = (q['options'] as List?) ?? [];
      final selText = (selIdx != null && selIdx >= 0 && selIdx < options.length)
          ? options[selIdx].toString()
          : '';
      final targetCorrect = q['correctIndex'] ?? 0;
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

    try {
      final user = AuthService.currentUser;
      final studentId = user?.rawUser?['student_id']?.toString() ??
          user?.rawUser?['studentId']?.toString() ??
          user?.userId;
      final lrn = user?.lrn;

      // 1. Post quiz score & calculate Phil-IRI profile in PostgreSQL DB
      await ApiService.post('/api/students/assessment/submit', {
        'studentId': studentId,
        'lrn': lrn,
        'assessmentType': 'oral',
        'passageId': widget.passageId,
        'score': correctCount,
        'maxScore': _questions.length,
        'readingTimeSeconds': widget.readingTimeSeconds ?? 60,
        'answers': answersPayload,
      });

      // 2. Upload recorded audio file to Cloudinary & save attempt to DB
      final audioPath = widget.recordedAudioPath ?? '';
      if (audioPath.isNotEmpty) {
        await ApiService.uploadMultipartFile(
          '/api/students/assessment/submit-oral-audio',
          audioPath,
          'audio',
          fields: {
            'studentId': studentId ?? '',
            'passageId': (widget.passageId ?? 1).toString(),
            'transcriptText': widget.storyTitle ?? 'Oral Reading Assessment',
            'readingTimeSeconds': (widget.readingTimeSeconds ?? 60).toString(),
          },
        );
      } else {
        await ApiService.post('/api/students/assessment/submit-oral-audio', {
          'studentId': studentId,
          'passageId': widget.passageId ?? 1,
          'transcriptText': widget.storyTitle ?? 'Oral Reading Assessment',
          'readingTimeSeconds': widget.readingTimeSeconds ?? 60,
        });
      }
      // Clear active quiz draft on successful completion
      await QuizProgressService.clearQuizDraft(widget.passageId, 'oral');
    } catch (e) {
      debugPrint('[QuizPage] Submission to database notice: $e');
    } finally {
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context); // Safely close progress dialog
      }
    }

    if (!mounted) return;

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
                  assessmentType: 'oral',
                  recordedAudioPath: widget.recordedAudioPath,
                  readingTimeSeconds: widget.readingTimeSeconds ?? 0,
                  storyTitle: widget.storyTitle,
                  assessmentLanguage: widget.assessmentLanguage,
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

    if (_questions.isEmpty) {
      return Scaffold(
        backgroundColor: softCreamBg,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.assignment_turned_in_outlined, size: 56, color: Color(0xFF94A3B8)),
                  const SizedBox(height: 16),
                  Text(
                    _isEnglish ? 'No Quiz Questions' : 'Walang Tanong sa Pagsusulit',
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isEnglish
                        ? 'Great job completing the reading! Click finish to proceed.'
                        : 'Magaling! Natapos mo ang pagbabasa. Pindutin ang tapusin para magpatuloy.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const OralReadingAssessmentCongratulationsPage(
                              score: 0,
                              totalQuestions: 0,
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00AA5A),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        _isEnglish ? 'Finish' : 'Tapusin',
                        style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

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
                                widget.storyTitle?.toUpperCase() ?? 'ORAL READING ASSESSMENT',
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
                              tooltip: _isEnglish ? 'Exit Quiz' : 'Lumabas sa Pagsusulit',
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

                      // 4. Select instructions
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            _isEnglish ? 'SELECT ONLY ONE' : 'PUMILI NG ISANG SAGOT',
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
                                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
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
