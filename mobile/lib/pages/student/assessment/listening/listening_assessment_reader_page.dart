import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/api_config.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_quiz_page.dart';

class ListeningAssessmentReaderPage extends StatefulWidget {
  final Map<String, dynamic>? item;
  const ListeningAssessmentReaderPage({super.key, this.item});

  @override
  State<ListeningAssessmentReaderPage> createState() =>
      _ListeningAssessmentReaderPageState();
}

class _ListeningAssessmentReaderPageState
    extends State<ListeningAssessmentReaderPage>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  bool _isDarkMode = false;
  AudioPlayer? _audioPlayer;

  String _fullStoryText = '';
  String _storyTitle = 'Listening Assessment Passage';
  String _assessmentLanguage = 'fil';
  dynamic _passageId;
  String? _audioUrl;
  List<dynamic>? _dynamicQuestions;

  bool _isPlaying = false;
  bool _isPaused = false;
  bool _isFinished = false;
  bool _isSynthesizingAudio = false;
  double _progress = 0.0;
  int _listeningSeconds = 0;
  Timer? _listeningTimer;

  Duration _totalAudioDuration = Duration.zero;
  double _voiceEnergy = 0.0;
  List<double> _realWaveformData = [];

  late AnimationController _waveformAnimController;

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
    WidgetsBinding.instance.addObserver(this);
    _waveformAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _initAudioPlayer();
    _extractItemData();
    _fetchPassageFromApi();
    _startTimer();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive ||
        state == AppLifecycleState.detached ||
        state == AppLifecycleState.hidden) {
      if (_isPlaying) {
        _audioPlayer?.pause();
      }
    }
  }

  void _initAudioPlayer() {
    _audioPlayer?.stop();
    _audioPlayer?.dispose();
    _audioPlayer = AudioPlayer();
    _audioPlayer!.setReleaseMode(ReleaseMode.stop);

    _audioPlayer!.onPlayerStateChanged.listen((state) {
      debugPrint('[ListeningReader] AudioPlayer state: $state');
      if (mounted) {
        setState(() {
          _isPlaying = (state == PlayerState.playing);
          _isPaused = (state == PlayerState.paused);
        });
        if (_isPlaying) {
          _waveformAnimController.repeat();
        } else {
          _waveformAnimController.stop();
          _voiceEnergy = 0.0;
        }
      }
    });

    _audioPlayer!.onDurationChanged.listen((d) {
      if (mounted) {
        setState(() {
          _totalAudioDuration = d;
        });
      }
    });

    _audioPlayer!.onPositionChanged.listen((p) {
      if (mounted && _totalAudioDuration.inMilliseconds > 0) {
        final prog =
            (p.inMilliseconds / _totalAudioDuration.inMilliseconds).clamp(0.0, 1.0);

        final ms = p.inMilliseconds;
        // Real acoustic frame lookup (50ms per frame from PCM audio analysis):
        final int frameIndex = (ms / 50).floor();
        double realEnergy = 0.0;
        if (_realWaveformData.isNotEmpty && frameIndex >= 0) {
          if (frameIndex < _realWaveformData.length) {
            realEnergy = _realWaveformData[frameIndex];
          }
        }

        setState(() {
          _progress = prog;
          // Exact responsive audio energy directly from actual audio file
          _voiceEnergy = realEnergy;
        });
      }
    });

    _audioPlayer!.onPlayerComplete.listen((event) {
      if (mounted) {
        setState(() {
          _isPlaying = false;
          _isPaused = false;
          _isFinished = true;
          _progress = 1.0;
          _voiceEnergy = 0.0;
        });
        _waveformAnimController.stop();
      }
    });
  }

  void _startTimer() {
    _listeningTimer?.cancel();
    _listeningTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _listeningSeconds++;
        });
      }
    });
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
      final String? audio =
          item['audioUrl'] ??
          item['audio_url'] ??
          passageObj?['audioUrl'] ??
          passageObj?['audio_url'];

      if (title != null && title.trim().isNotEmpty) {
        _storyTitle = title.trim();
      }
      if (text != null && text.trim().isNotEmpty) {
        _fullStoryText = text.trim();
      }
      if (lang != null && lang.trim().isNotEmpty) {
        _assessmentLanguage = lang.trim();
      }
      if (audio != null && audio.trim().isNotEmpty && audio.trim().startsWith('http')) {
        _audioUrl = audio.trim();
      }
      if (questions != null && questions.isNotEmpty) {
        _dynamicQuestions = questions;
      }
      _passageId = QuizProgressService.extractPassageId(item);
      _prepareNeuralAudio();
    }
  }

  Future<void> _prepareNeuralAudio() async {
    if (_fullStoryText.trim().isEmpty) return;
    if (_isSynthesizingAudio) return;
    if (_audioUrl != null && _audioUrl!.startsWith('https://res.cloudinary.com')) return;

    if (mounted) {
      setState(() {
        _isSynthesizingAudio = true;
      });
    }

    try {
      final res = await ApiService.post('/tts/synthesize', {
        'text': _fullStoryText,
        'language': _isEnglish ? 'en' : 'fil',
        'passageId': _passageId,
      });

      if (res.success && res.data != null && res.data['audioUrl'] != null) {
        final rawPath = res.data['audioUrl'].toString();
        final fullUrl = rawPath.startsWith('http')
            ? rawPath
            : '${ApiConfig.rootUrl}$rawPath';
        List<double> peaks = [];
        if (res.data['waveform'] is List) {
          peaks = (res.data['waveform'] as List)
              .map((v) => double.tryParse(v.toString()) ?? 0.0)
              .toList();
        }
        debugPrint('[ListeningReader] Neural TTS ready URL: $fullUrl (RMS frames: ${peaks.length})');
        if (mounted) {
          setState(() {
            _audioUrl = fullUrl;
            _realWaveformData = peaks;
            _isSynthesizingAudio = false;
          });
        }
        return;
      } else {
        debugPrint(
            '[ListeningReader] TTS Synthesize response notice: ${res.message ?? res.error}');
      }
    } catch (e) {
      debugPrint('[ListeningReader] Neural audio synthesize error: $e');
    }

    if (mounted) {
      setState(() {
        _isSynthesizingAudio = false;
      });
    }
  }

  void _fetchPassageFromApi() async {
    if (_fullStoryText.trim().isNotEmpty && widget.item != null) {
      _prepareNeuralAudio();
      return;
    }

    try {
      final myAssignRes = await ApiService.get(
        '/student/assessment/my-assignment',
      );
      if (myAssignRes.success &&
          myAssignRes.data != null &&
          myAssignRes.data['assignedActivities'] != null) {
        final activities = myAssignRes.data['assignedActivities'] as List;
        if (activities.isNotEmpty) {
          final listeningActivity = activities.firstWhere(
            (act) =>
                act['assessmentType'] == 'listening' ||
                act['assessmentType'] == 'listening comprehension',
            orElse: () => activities[0],
          );
          if (listeningActivity != null) {
            final passage =
                listeningActivity['passage'] ?? listeningActivity;
            final String title =
                passage['title'] ??
                listeningActivity['passageTitle'] ??
                'Listening Assessment Passage';
            final String text =
                passage['text'] ??
                passage['contentText'] ??
                passage['content_text'] ??
                '';
            final List<dynamic>? questions = passage['questions'];
            final String? audio =
                passage['audioUrl'] ?? passage['audio_url'];

            if (mounted) {
              setState(() {
                _storyTitle = title;
                if (text.trim().isNotEmpty) {
                  _fullStoryText = text.trim();
                }
                if (audio != null && audio.trim().isNotEmpty) {
                  _audioUrl = audio.trim();
                }
                _dynamicQuestions = questions;
                _passageId ??=
                    QuizProgressService.extractPassageId(listeningActivity);
              });
              _prepareNeuralAudio();
            }
            return;
          }
        }
      }
    } catch (e) {
      debugPrint('[ListeningReader] Passage API fetch notice: $e');
    }
    _prepareNeuralAudio();
  }

  Future<void> _toggleAudioPlay() async {
    Feedback.forTap(context);
    // Phil-IRI Rule: Passage is listened to strictly once
    if (_isFinished) return;

    if (_isPlaying) {
      await _audioPlayer?.pause();
      return;
    }

    if (_isPaused) {
      await _audioPlayer?.resume();
      return;
    }

    if (_audioUrl == null || _audioUrl!.isEmpty) {
      await _prepareNeuralAudio();
    }

    if (_audioUrl != null && _audioUrl!.isNotEmpty) {
      try {
        debugPrint('[ListeningReader] Playing audio URL: $_audioUrl');
        await _audioPlayer?.play(UrlSource(_audioUrl!));
      } catch (e) {
        debugPrint('[ListeningReader] Audio playback error: $e');
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _audioPlayer?.stop();
    _audioPlayer?.release();
    _audioPlayer?.dispose();
    _listeningTimer?.cancel();
    _waveformAnimController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Color bgColor =
        _isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFFCFAF7);
    final Color cardBg =
        _isDarkMode ? const Color(0xFF1E293B) : Colors.white;
    final Color titleColor =
        _isDarkMode ? Colors.white : const Color(0xFF1E293B);
    final Color textColor =
        _isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    const Color primaryBlue = Color(0xFF1B64D8);

    return Scaffold(
      backgroundColor: bgColor,
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {},
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isTablet = constraints.maxWidth > 600;

              return Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: isTablet ? 540 : double.infinity,
                  ),
                  child: Column(
                    children: [
                      // 1. Header with Theme Switcher (Locked - No exit/back options)
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20.0,
                          vertical: 12.0,
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            _buildThemeSwitcher(),
                          ],
                        ),
                      ),

                      // 2. Main Studio Content Area (Hero Audio Card)
                      Expanded(
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24.0,
                            vertical: 16.0,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const SizedBox(height: 40),

                              // Central Animated Listening Artwork / Avatar
                              _buildListeningHeroArt(primaryBlue),

                              const SizedBox(height: 28),

                              // Story Title
                              Text(
                                _storyTitle,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.lora(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: titleColor,
                                  letterSpacing: -0.5,
                                ),
                              ),

                              const SizedBox(height: 8),

                              // Language Badge
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: _isDarkMode
                                      ? const Color(0xFF334155)
                                      : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  _isEnglish ? 'English' : 'Filipino',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: textColor,
                                  ),
                                ),
                              ),

                              const SizedBox(height: 32),

                              // Audio Player Box
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(24.0),
                                decoration: BoxDecoration(
                                  color: cardBg,
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                    color: _isDarkMode
                                        ? const Color(0xFF334155)
                                        : const Color(0xFFE2E8F0),
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: _isDarkMode ? 0.2 : 0.04,
                                      ),
                                      blurRadius: 18,
                                      offset: const Offset(0, 6),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  children: [
                                    // Audio Progress Bar
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: LinearProgressIndicator(
                                        value: _progress,
                                        minHeight: 8,
                                        backgroundColor: _isDarkMode
                                            ? const Color(0xFF334155)
                                            : const Color(0xFFE2E8F0),
                                        valueColor:
                                            const AlwaysStoppedAnimation<Color>(
                                          primaryBlue,
                                        ),
                                      ),
                                    ),

                                    const SizedBox(height: 14),

                                    // Status subtitle
                                    Text(
                                      _isFinished
                                          ? (_isEnglish
                                              ? 'Story Completed'
                                              : 'Tapos na ang Kuwento')
                                          : _isPlaying
                                          ? (_isEnglish
                                              ? 'Playing story audio...'
                                              : 'Binabasa ang kuwento...')
                                          : _isPaused
                                          ? (_isEnglish
                                              ? 'Audio Paused (Tap to resume)'
                                              : 'Naka-pause (Pindutin upang ituloy)')
                                          : (_isEnglish
                                              ? 'Tap play to listen to the story'
                                              : 'Pindutin ang play upang makinig'),
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: _isFinished
                                            ? const Color(0xFF059669)
                                            : _isPlaying
                                            ? primaryBlue
                                            : textColor,
                                      ),
                                    ),

                                    const SizedBox(height: 20),

                                     // Main Playback Controls (Single Centered Button)
                                     if (_isFinished)
                                       Container(
                                         padding: const EdgeInsets.symmetric(
                                           horizontal: 20,
                                           vertical: 12,
                                         ),
                                         decoration: BoxDecoration(
                                           color: const Color(0xFFD1FAE5),
                                           borderRadius:
                                               BorderRadius.circular(24),
                                           border: Border.all(
                                             color: const Color(0xFFA7F3D0),
                                           ),
                                         ),
                                         child: Row(
                                           mainAxisSize: MainAxisSize.min,
                                           children: [
                                             const Icon(
                                               Icons.check_circle_rounded,
                                               color: Color(0xFF059669),
                                               size: 20,
                                             ),
                                             const SizedBox(width: 8),
                                             Text(
                                               _isEnglish
                                                   ? 'Finished Listening'
                                                   : 'Tapos nang Pakinggan',
                                               style: GoogleFonts.inter(
                                                 fontSize: 14,
                                                 fontWeight: FontWeight.w700,
                                                 color: const Color(0xFF065F46),
                                               ),
                                             ),
                                           ],
                                         ),
                                       )
                                     else
                                       GestureDetector(
                                         onTap: _toggleAudioPlay,
                                         child: Container(
                                           width: 68,
                                           height: 68,
                                           decoration: BoxDecoration(
                                             shape: BoxShape.circle,
                                             color: primaryBlue,
                                             boxShadow: [
                                               BoxShadow(
                                                 color: primaryBlue
                                                     .withValues(alpha: 0.35),
                                                 blurRadius: 18,
                                                 offset: const Offset(0, 6),
                                               ),
                                             ],
                                           ),
                                           child: Center(
                                             child: _isSynthesizingAudio && _audioUrl == null
                                                 ? const SizedBox(
                                                     width: 28,
                                                     height: 28,
                                                     child: CircularProgressIndicator(
                                                       color: Colors.white,
                                                       strokeWidth: 3,
                                                     ),
                                                   )
                                                 : Icon(
                                                     _isPlaying
                                                         ? Icons.pause_rounded
                                                         : Icons.play_arrow_rounded,
                                                     color: Colors.white,
                                                     size: 38,
                                                   ),
                                           ),
                                         ),
                                       ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 24),

                              // Reminder Notice Card
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: _isDarkMode
                                      ? const Color(0xFF1E293B)
                                      : const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                    color: _isDarkMode
                                        ? const Color(0xFF334155)
                                        : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      _isFinished
                                          ? Icons.check_circle_outline_rounded
                                          : Icons.info_outline_rounded,
                                      color: _isFinished
                                          ? const Color(0xFF059669)
                                          : primaryBlue,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        _isFinished
                                            ? (_isEnglish
                                                ? 'You have finished listening to the story. Tap the button below to start your comprehension quiz.'
                                                : 'Napakinggan mo na ang buong kuwento. Pindutin ang button sa ibaba upang simulan ang pagsusulit sa pag-unawa.')
                                            : (_isEnglish
                                                ? 'Listen carefully to the audio narration. In Phil-IRI, you will hear the story only once before answering the quiz.'
                                                : 'Makinig nang mabuti sa binabasang kuwento. Sa Phil-IRI, isang beses mo lamang maririnig ang kuwento bago sagutan ang pagsusulit.'),
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          height: 1.4,
                                          fontWeight: FontWeight.w500,
                                          color: textColor,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // 3. Footer Action Button (Only visible once story listening is complete)
                      if (_isFinished)
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 350),
                          curve: Curves.easeOutCubic,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24.0,
                            vertical: 16.0,
                          ),
                          decoration: BoxDecoration(
                            color: cardBg,
                            border: Border(
                              top: BorderSide(
                                color: _isDarkMode
                                    ? const Color(0xFF334155)
                                    : const Color(0xFFE2E8F0),
                              ),
                            ),
                          ),
                          child: SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: ElevatedButton(
                              onPressed: _finishReading,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryBlue,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    _isEnglish
                                        ? 'Start Comprehension Quiz'
                                        : 'Simulan ang Pagsusulit',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(
                                    Icons.arrow_forward_rounded,
                                    color: Colors.white,
                                    size: 20,
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
            },
          ),
        ),
      ),
    );
  }

  Widget _buildListeningHeroArt(Color primaryBlue) {
    final List<double> barRatios = [
      0.50, 0.38, 0.22, 0.58, 0.72, 0.96, 0.82, 0.48, 0.88, 0.78,
      0.32, 1.00, 0.70, 0.86, 0.62, 0.40, 0.78, 0.66, 0.42, 0.30, 0.48
    ];

    final Color activeColor = _isDarkMode ? const Color(0xFF60A5FA) : primaryBlue;
    final Color inactiveColor = _isDarkMode
        ? const Color(0xFF334155)
        : const Color(0xFFCBD5E1);

    return Container(
      height: 120,
      width: double.infinity,
      alignment: Alignment.center,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: AnimatedBuilder(
        animation: _waveformAnimController,
        builder: (context, child) {
          return Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: List.generate(barRatios.length, (index) {
              final double base = barRatios[index];
              double height;

              final bool isActivelySpeaking = _isPlaying && _voiceEnergy > 0.03;

              if (_isPlaying) {
                if (!isActivelySpeaking) {
                  // Actual silence in the audio: flat quiet resting bars (6px) with zero movement
                  height = 6.0;
                } else {
                  // Amplified acoustic dynamic range for large, expressive visual movement:
                  final double amplifiedEnergy = (_voiceEnergy * 1.55).clamp(0.0, 1.0);
                  final double phase =
                      (_waveformAnimController.value * 2 * pi) + (index * 0.44);
                  final double flutter =
                      (sin(phase) * 0.55 + cos(phase * 1.6 + index * 0.25) * 0.45).abs();

                  // Big dynamic wave heights reaching up to 100px on spoken syllables
                  final double dynamicHeight =
                      6.0 + (94.0 * base * amplifiedEnergy * (0.25 + 0.75 * flutter));
                  height = dynamicHeight;
                }
              } else if (_isFinished) {
                height = 6.0;
              } else {
                height = (base * 28.0).clamp(6.0, 32.0);
              }

              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 3.0),
                width: 6.5,
                height: height.clamp(6.0, 100.0),
                decoration: BoxDecoration(
                  color: isActivelySpeaking ? activeColor : inactiveColor,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: isActivelySpeaking
                      ? [
                          BoxShadow(
                            color: activeColor.withValues(
                              alpha: (0.45 * _voiceEnergy).clamp(0.0, 0.50),
                            ),
                            blurRadius: 12 * _voiceEnergy,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
              );
            }),
          );
        },
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
        width: 80,
        height: 40,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: _isDarkMode
              ? const Color(0xFF1E293B)
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
                width: 36,
                height: 36,
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
                padding: const EdgeInsets.only(left: 10),
                child: Icon(
                  Icons.wb_sunny_rounded,
                  color: _isDarkMode ? const Color(0xFF64748B) : Colors.white,
                  size: 18,
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 10),
                child: Icon(
                  Icons.nightlight_round,
                  color: _isDarkMode ? Colors.white : const Color(0xFF94A3B8),
                  size: 18,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _finishReading() async {
    _audioPlayer?.stop();
    final existingDraft = await QuizProgressService.getQuizDraft(
      _passageId,
      'listening',
    );
    if (existingDraft == null) {
      await QuizProgressService.saveQuizDraft(
        _passageId,
        assessmentType: 'listening',
        recordedAudioPath: null,
        readingTimeSeconds: _listeningSeconds,
        storyTitle: _storyTitle,
        assessmentLanguage: _assessmentLanguage,
        dynamicQuestions: _dynamicQuestions,
      );
    }
    if (!mounted) return;

    // Sync status = 'in_progress' to database for real-time teacher tracking
    final user = AuthService.currentUser;
    final studentId = user?.rawUser?['student_id']?.toString() ??
        user?.rawUser?['studentId']?.toString() ??
        user?.userId;

    ApiService.post('/api/students/assessment/start-progress', {
      'studentId': studentId,
      'passageId': _passageId,
    });

    List<int?>? initialAnswersList;
    if (existingDraft != null && existingDraft['selectedAnswers'] != null) {
      if (existingDraft['selectedAnswers'] is List) {
        initialAnswersList = (existingDraft['selectedAnswers'] as List)
            .map((e) => e != null ? int.tryParse(e.toString()) : null)
            .toList();
      }
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => ListeningAssessmentQuizPage(
          dynamicQuestions:
              existingDraft?['dynamicQuestions'] as List? ?? _dynamicQuestions,
          storyTitle: existingDraft?['storyTitle'] as String? ?? _storyTitle,
          passageId: _passageId,
          assessmentLanguage: _assessmentLanguage,
          currentQuestionIndex:
              (existingDraft?['currentQuestionIndex'] as int?) ?? 0,
          initialSelectedAnswers: initialAnswersList,
        ),
      ),
    );
  }
}
