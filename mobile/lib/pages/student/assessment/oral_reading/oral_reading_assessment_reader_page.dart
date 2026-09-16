import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:record/record.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_quiz_page.dart';

class OralReadingAssessmentReaderPage extends StatefulWidget {
  final Map<String, dynamic>? item;
  const OralReadingAssessmentReaderPage({super.key, this.item});

  @override
  State<OralReadingAssessmentReaderPage> createState() =>
      _OralReadingAssessmentReaderPageState();
}

class _OralReadingAssessmentReaderPageState
    extends State<OralReadingAssessmentReaderPage> {
  bool _isDarkMode = false;

  double _recordingProgress = 0.0;
  bool _isPaused = false;
  Timer? _progressTimer;

  String _fullStoryText = '';
  String _storyTitle = 'Oral Reading Passage';
  String _assessmentLanguage = 'fil';
  final AudioRecorder _audioRecorder = AudioRecorder();
  String? _recordedAudioPath;
  int _countdown = 3;
  bool _isCountdownActive = true;
  Timer? _countdownTimer;
  int _readingSecondsElapsed = 0;
  Timer? _readingTimer;

  bool get _isEnglish {
    final lang = _assessmentLanguage.toLowerCase();
    final title = _storyTitle.toLowerCase();
    return lang.startsWith('en') ||
        lang.contains('english') ||
        title.contains('english');
  }

  @override
  void initState() {
    super.initState();
    _extractItemData();
    _fetchPassageFromApi();
    _startCountdownSequence();

    _progressTimer = Timer.periodic(const Duration(milliseconds: 50), (
      timer,
    ) async {
      double level = 0.0;
      try {
        if (!_isPaused &&
            await _audioRecorder.isRecording() &&
            !(await _audioRecorder.isPaused())) {
          final amp = await _audioRecorder.getAmplitude();
          final db = amp.current; // dB level (-160 to 0)

          // Noise Gate filter: Ignore ambient background noise below -32 dB
          if (db > -32.0) {
            level = ((db + 32.0) / 28.0).clamp(0.0, 1.0);
          } else {
            level = 0.0;
          }
        } else {
          level = 0.0;
        }
      } catch (_) {
        level = 0.0;
      }
      if (mounted) {
        setState(() {
          _recordingProgress = _isPaused ? 0.0 : level;
        });
      }
    });
  }

  void _startCountdownSequence() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        if (_countdown > 1) {
          setState(() {
            _countdown--;
          });
        } else {
          _countdownTimer?.cancel();
          setState(() {
            _isCountdownActive = false;
          });
          _startVoiceRecording();
          _startReadingTimer();
        }
      }
    });
  }

  void _startReadingTimer() {
    _readingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _readingSecondsElapsed++;
        });
      }
    });
  }

  Future<void> _startVoiceRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final tempDir = Directory.systemTemp;
        final path =
            '${tempDir.path}/oral_reading_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _audioRecorder.start(
          const RecordConfig(
            encoder: AudioEncoder.aacLc,
            noiseSuppress: true,
            echoCancel: true,
            autoGain: true,
          ),
          path: path,
        );
        _recordedAudioPath = path;
      }
    } catch (e) {
      debugPrint('[OralReader] Audio recording start notice: $e');
    }
  }

  Future<void> _pauseVoiceRecording() async {
    _isPaused = true;
    if (mounted) {
      setState(() {
        _recordingProgress = 0.0;
      });
    }
    try {
      if (await _audioRecorder.isRecording()) {
        await _audioRecorder.pause();
      }
    } catch (e) {
      debugPrint('[OralReader] Audio recording pause notice: $e');
    }
    if (mounted) {
      setState(() {
        _recordingProgress = 0.0;
      });
    }
  }

  Future<void> _resumeVoiceRecording() async {
    _isPaused = false;
    try {
      if (await _audioRecorder.isPaused()) {
        await _audioRecorder.resume();
      }
    } catch (e) {
      debugPrint('[OralReader] Audio recording resume notice: $e');
    }
  }

  Future<void> _stopVoiceRecording() async {
    try {
      if (await _audioRecorder.isRecording() ||
          await _audioRecorder.isPaused()) {
        final path = await _audioRecorder.stop();
        if (path != null) _recordedAudioPath = path;
      }
    } catch (e) {
      debugPrint('[OralReader] Audio recording stop notice: $e');
    }
  }

  void _extractItemData() {
    final item = widget.item;
    if (item != null) {
      final passageObj = item['passage'] is Map ? item['passage'] : item;
      final String? title =
          item['passageTitle'] ??
          item['title'] ??
          passageObj?['title'] ??
          passageObj?['passageTitle'];
      final String? text =
          passageObj?['text'] ??
          passageObj?['contentText'] ??
          passageObj?['content_text'] ??
          item['text'] ??
          item['contentText'] ??
          item['content_text'];
      final List<dynamic>? questions =
          item['questions'] ?? passageObj?['questions'];
      final String? lang =
          item['rawLanguage'] ??
          item['language'] ??
          passageObj?['language'] ??
          passageObj?['rawLanguage'];

      if (title != null && title.trim().isNotEmpty) {
        _storyTitle = title.trim();
      }
      if (text != null && text.trim().isNotEmpty) {
        _fullStoryText = text.trim();
      }
      if (lang != null && lang.trim().isNotEmpty) {
        _assessmentLanguage = lang.trim();
      }
      if (questions != null && questions.isNotEmpty) {
        _dynamicQuestions = questions;
      }
      _passageId = QuizProgressService.extractPassageId(item);
      debugPrint(
        '[OralReader] Extracted passed item: title="$_storyTitle", passageId="$_passageId", lang="$_assessmentLanguage", text length=${_fullStoryText.length}',
      );
    }
  }

  void _fetchPassageFromApi() async {
    // If passage item was already passed directly into widget constructor, keep it!
    if (_fullStoryText.trim().isNotEmpty && widget.item != null) {
      debugPrint(
        '[OralReader] Using directly passed passage item: "$_storyTitle"',
      );
      return;
    }

    try {
      // 1. Try fetching student's assigned Phil-IRI activity first
      try {
        final myAssignRes = await ApiService.get(
          '/student/assessment/my-assignment',
        );
        if (myAssignRes.success &&
            myAssignRes.data != null &&
            myAssignRes.data['assignedActivities'] != null) {
          final activities = myAssignRes.data['assignedActivities'] as List;
          if (activities.isNotEmpty) {
            final oralActivity = activities.firstWhere(
              (act) =>
                  act['assessmentType'] == 'oral' ||
                  act['assessmentType'] == 'oral reading',
              orElse: () => activities[0],
            );
            if (oralActivity != null) {
              final passage = oralActivity['passage'] ?? oralActivity;
              final String title =
                  passage['title'] ??
                  oralActivity['passageTitle'] ??
                  'Oral Reading Passage';
              final String text =
                  passage['text'] ??
                  passage['contentText'] ??
                  passage['content_text'] ??
                  '';
              final List<dynamic>? questions = passage['questions'];

              if (mounted && text.trim().isNotEmpty) {
                setState(() {
                  _storyTitle = title;
                  _fullStoryText = text.trim();
                  _dynamicQuestions = questions;
                  _passageId ??= QuizProgressService.extractPassageId(oralActivity);
                });
                debugPrint(
                  '[OralReader] Successfully loaded student assignment passage: $title (passageId=$_passageId)',
                );
                return;
              }
            }
          }
        }
      } catch (assignErr) {
        debugPrint('[OralReader] Assignment fetch notice: $assignErr');
      }

      // 2. Fallback to general Phil-IRI passages API
      var res = await ApiService.get('/student/assessment/passages');
      if (!res.success ||
          res.data == null ||
          res.data['passages'] == null ||
          (res.data['passages'] as List).isEmpty) {
        res = await ApiService.get(
          '/student/assessment/passages?grade=Grade%204',
        );
      }

      if (res.success &&
          res.data != null &&
          res.data['passages'] != null &&
          (res.data['passages'] as List).isNotEmpty) {
        final passage = res.data['passages'][0];
        final String title =
            passage['title'] ??
            passage['passage_title'] ??
            'Oral Reading Passage';
        final String text =
            passage['text'] ??
            passage['contentText'] ??
            passage['content_text'] ??
            '';
        final List<dynamic>? questions = passage['questions'];

        if (mounted) {
          setState(() {
            _storyTitle = title;
            if (text.trim().isNotEmpty) {
              _fullStoryText = text.trim();
            }
            _dynamicQuestions = questions;
            _passageId ??= QuizProgressService.extractPassageId(passage);
          });
          debugPrint(
            '[OralReader] Successfully loaded general passage: $title (passageId=$_passageId)',
          );
        }
        return;
      }
    } catch (e) {
      debugPrint('[OralReader] Passage API fetch notice: $e');
    }
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _readingTimer?.cancel();
    _progressTimer?.cancel();
    _stopVoiceRecording();
    _audioRecorder.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color bgColor = _isDarkMode
        ? const Color(0xFF1A1816)
        : const Color(0xFFFCFAF7);
    final Color textColor = _isDarkMode
        ? const Color(0xFFE5E0DB)
        : const Color(0xFF2D2D2D);
    final Color titleColor = _isDarkMode
        ? const Color(0xFFECE8E4)
        : const Color(0xFF1E293B);
    const primaryBlue = Color(0xFF1B64D8);

    return Scaffold(
      backgroundColor: bgColor,
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {},
        child: Stack(
          children: [
            SafeArea(
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
                          // 1. Header with Title (No exit options)
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16.0,
                              vertical: 12.0,
                            ),
                            child: SizedBox(
                              width: double.infinity,
                              child: Text(
                                _storyTitle,
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.lora(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: titleColor,
                                ),
                              ),
                            ),
                          ),

                          // 2. Reading Text Block (Continuous Vertical Scrollable View)
                          Expanded(
                            child: Column(
                              children: [
                                Expanded(
                                  child: SingleChildScrollView(
                                    physics: const BouncingScrollPhysics(),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 24.0,
                                      vertical: 16.0,
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.stretch,
                                      children: [
                                        ...(_fullStoryText.isEmpty
                                                ? ['Naga-antay ng kwento...']
                                                : _fullStoryText
                                                    .replaceAll('\r\n', '\n')
                                                    .replaceAll('\r', '\n')
                                                    .split(RegExp(r'\n+'))
                                                    .map((p) => p.trim())
                                                    .where((p) => p.isNotEmpty))
                                            .map((paragraph) => Padding(
                                                  padding: const EdgeInsets.only(
                                                    bottom: 24.0,
                                                  ),
                                                  child: Text(
                                                    paragraph,
                                                    style: GoogleFonts.lora(
                                                      fontSize: 22.0,
                                                      height: 1.75,
                                                      fontWeight: FontWeight.w500,
                                                      color: textColor,
                                                    ),
                                                  ),
                                                )),
                                        const SizedBox(height: 32),
                                      ],
                                    ),
                                  ),
                                ),

                                // 3. Footer Container (Voice Mic Indicator + Theme Switcher + Start Quiz Button)
                                Container(
                                  padding: const EdgeInsets.all(20.0),
                                  decoration: BoxDecoration(
                                    color: bgColor,
                                    border: Border(
                                      top: BorderSide(
                                        color: _isDarkMode
                                            ? const Color(0xFF1E2530)
                                            : const Color(0xFFE2E8F0),
                                        width: 1,
                                      ),
                                    ),
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      // Active Voice Recording Indicator Row
                                      Row(
                                        children: [
                                          Icon(
                                            Icons.mic_none_rounded,
                                            color: _isDarkMode
                                                ? Colors.white
                                                : primaryBlue,
                                            size: 26,
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: LayoutBuilder(
                                              builder: (context, barConstraints) {
                                                return ClipRRect(
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                  child: Container(
                                                    height: 6,
                                                    width: double.infinity,
                                                    color: _isDarkMode
                                                        ? Colors.white
                                                        : const Color(
                                                            0xFFE2E8F0,
                                                          ),
                                                    child: Stack(
                                                      children: [
                                                        AnimatedContainer(
                                                          duration:
                                                              const Duration(
                                                            milliseconds: 40,
                                                          ),
                                                          curve: Curves
                                                              .easeOutCubic,
                                                          width:
                                                              barConstraints
                                                                  .maxWidth *
                                                              (_isPaused
                                                                  ? 0.0
                                                                  : _recordingProgress),
                                                          decoration: BoxDecoration(
                                                            color: primaryBlue,
                                                            borderRadius:
                                                                BorderRadius.circular(
                                                                  4,
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
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      // Action Controls Row
                                      Row(
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          _buildThemeSwitcher(),
                                          GestureDetector(
                                            key: const ValueKey(
                                              'finish_reading_btn_scroll',
                                            ),
                                            onTap: () {
                                              Feedback.forTap(context);
                                              _confirmStartQuiz(context);
                                            },
                                            child: _buildStartQuizButton(),
                                          ),
                                        ],
                                      ),
                                    ],
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
            if (_isCountdownActive)
              Positioned.fill(
                child: Container(
                  color: _isDarkMode
                      ? const Color(0xFF0F172A)
                      : const Color(0xFFFCFAF7),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Get Ready to Read',
                          style: GoogleFonts.inter(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: _isDarkMode
                                ? Colors.white
                                : const Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Recording starts in...',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 32),
                        AnimatedSwitcher(
                          duration: const Duration(milliseconds: 200),
                          transitionBuilder: (child, animation) =>
                              ScaleTransition(scale: animation, child: child),
                          child: Container(
                            key: ValueKey(_countdown),
                            width: 110,
                            height: 110,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFF1B64D8),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFF1B64D8,
                                  ).withValues(alpha: 0.22),
                                  blurRadius: 16,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Text(
                                '$_countdown',
                                style: GoogleFonts.inter(
                                  fontSize: 52,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeSwitcher() {
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        setState(() {
          _isDarkMode = !_isDarkMode;
        });
      },
      child: Container(
        width: 90,
        height: 48,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: _isDarkMode
              ? const Color(0xFF141A24)
              : const Color(0xFFE2E8F0),
        ),
        child: Stack(
          children: [
            AnimatedAlign(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOutCubic,
              alignment: _isDarkMode
                  ? Alignment.centerRight
                  : Alignment.centerLeft,
              child: Container(
                width: 44,
                height: 44,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF1B64D8),
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Icon(
                  Icons.wb_sunny_rounded,
                  color: _isDarkMode ? const Color(0xFF4A5568) : Colors.white,
                  size: 20,
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Icon(
                  Icons.nightlight_round,
                  color: _isDarkMode ? Colors.white : const Color(0xFF94A3B8),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStartQuizButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      height: 48,
      decoration: BoxDecoration(
        color: const Color(0xFF1B64D8),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1B64D8).withValues(alpha: 0.18),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Start Quiz',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.arrow_forward_rounded,
            color: Colors.white,
            size: 18,
          ),
        ],
      ),
    );
  }

  void _confirmStartQuiz(BuildContext context) async {
    final titleColor = _isDarkMode
        ? const Color(0xFFECE8E4)
        : const Color(0xFF1E293B);
    final descColor = _isDarkMode
        ? const Color(0xFFC5C0BA)
        : const Color(0xFF475569);
    final dialogBg = _isDarkMode ? const Color(0xFF22201E) : Colors.white;
    final cancelColor = _isDarkMode
        ? const Color(0xFFC5C0BA)
        : const Color(0xFF64748B);

    // 1. Pause audio recording and timer while modal is open
    await _pauseVoiceRecording();
    _readingTimer?.cancel();

    if (!mounted) return;
    bool didStart = false;

    await showDialog(
      context: mounted ? context : context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            _isEnglish ? 'Start Quiz?' : 'Simulan ang Pagsusulit?',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w800,
              color: titleColor,
            ),
          ),
          content: Text(
            _isEnglish
                ? 'You won\'t be able to read the story again once you start the quiz. Are you ready to begin?'
                : 'Hindi mo na mababasa ulit ang kuwento kapag nasimulan mo na ang pagsusulit. Handa ka na bang magsimula?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },
              child: Text(
                _isEnglish ? 'Cancel' : 'Kanselahin',
                style: GoogleFonts.inter(
                  color: cancelColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                didStart = true;
                Navigator.pop(dialogContext);
                _finishReading(); // Stop recording & transition to Quiz Page
              },
              child: Text(
                _isEnglish ? 'Start' : 'Simulan',
                style: GoogleFonts.inter(
                  color: const Color(0xFF1B64D8),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        );
      },
    );

    // 2. If student cancelled or dismissed modal without clicking Start, resume recording & timer
    if (!didStart && mounted) {
      await _resumeVoiceRecording();
      _startReadingTimer();
    }
  }

  List<dynamic>? _dynamicQuestions;
  dynamic _passageId;

  void _finishReading() async {
    await _stopVoiceRecording();
    if (!mounted) return;
    final item = widget.item;
    _passageId ??= QuizProgressService.extractPassageId(item);

    final readingSecs = _readingSecondsElapsed > 0
        ? _readingSecondsElapsed
        : 60;

    final existingDraft = await QuizProgressService.getQuizDraft(
      _passageId,
      'oral',
    );
    if (existingDraft == null) {
      await QuizProgressService.saveQuizDraft(
        _passageId,
        assessmentType: 'oral',
        recordedAudioPath: _recordedAudioPath,
        readingTimeSeconds: readingSecs,
        storyTitle: _storyTitle,
        assessmentLanguage: _assessmentLanguage,
        dynamicQuestions: _dynamicQuestions,
      );
    }

    // Sync status = 'in_progress' to PostgreSQL database for real-time teacher tracking
    final user = AuthService.currentUser;
    final studentId =
        user?.rawUser?['student_id']?.toString() ??
        user?.rawUser?['studentId']?.toString() ??
        user?.userId;

    ApiService.post('/api/students/assessment/start-progress', {
      'studentId': studentId,
      'passageId': _passageId,
    });

    if (!mounted) return;

    List<int?>? initialAnswersList;
    if (existingDraft != null && existingDraft['selectedAnswers'] != null) {
      if (existingDraft['selectedAnswers'] is List) {
        initialAnswersList = (existingDraft['selectedAnswers'] as List)
            .map((e) => e != null ? int.tryParse(e.toString()) : null)
            .toList();
      } else if (existingDraft['selectedAnswers'] is Map) {
        final map = existingDraft['selectedAnswers'] as Map;
        initialAnswersList = [];
        for (var entry in map.entries) {
          final idx = int.tryParse(entry.key.toString());
          final val = entry.value != null ? int.tryParse(entry.value.toString()) : null;
          if (idx != null) {
            while (initialAnswersList.length <= idx) {
              initialAnswersList.add(null);
            }
            initialAnswersList[idx] = val;
          }
        }
      }
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => OralReadingAssessmentQuizPage(
          dynamicQuestions:
              existingDraft?['dynamicQuestions'] as List? ?? _dynamicQuestions,
          recordedAudioPath:
              existingDraft?['recordedAudioPath'] as String? ??
              _recordedAudioPath,
          readingTimeSeconds:
              (existingDraft?['readingTimeSeconds'] as int?) ?? readingSecs,
          storyTitle: existingDraft?['storyTitle'] as String? ?? _storyTitle,
          assessmentLanguage:
              existingDraft?['assessmentLanguage'] as String? ??
              _assessmentLanguage,
          passageId: _passageId,
          currentQuestionIndex:
              (existingDraft?['currentQuestionIndex'] as int?) ?? 0,
          initialSelectedAnswers: initialAnswersList,
        ),
      ),
    );
  }
}
