
import 'dart:async';
import 'dart:io';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:record/record.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_reader_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/widgets/app_toast.dart';

class OralReadingMicrophoneTestPage extends StatefulWidget {
  const OralReadingMicrophoneTestPage({super.key});

  @override
  State<OralReadingMicrophoneTestPage> createState() => _OralReadingMicrophoneTestPageState();
}

class _OralReadingMicrophoneTestPageState extends State<OralReadingMicrophoneTestPage> with SingleTickerProviderStateMixin {
  // States: 'idle', 'recording', 'success', 'failure'
  String _testState = 'idle';
  int _countdown = 4;
  Timer? _countdownTimer;
  Timer? _audioTimer;
  double _audioLevel = 0.0;

  final AudioRecorder _audioRecorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();
  String? _lastRecordedPath;
  bool _isPlayingReplay = false;

  // Animation controller for pulsing microphone button
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _isPlayingReplay = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _audioTimer?.cancel();
    _pulseController.dispose();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  Future<void> _toggleAudioReplay() async {
    Feedback.forTap(context);
    if (_isPlayingReplay) {
      try {
        await _audioPlayer.stop();
      } catch (_) {}
      if (mounted) {
        setState(() {
          _isPlayingReplay = false;
        });
      }
      return;
    }

    try {
      if (_lastRecordedPath != null) {
        final file = File(_lastRecordedPath!);
        if (file.existsSync() && file.lengthSync() > 0) {
          final bytes = await file.readAsBytes();
          setState(() {
            _isPlayingReplay = true;
          });
          await _audioPlayer.stop();
          await _audioPlayer.play(BytesSource(bytes));
        } else {
          if (mounted) AppToast.warning(context, 'No audio recording file found.');
        }
      } else {
        if (mounted) AppToast.warning(context, 'No test recording captured.');
      }
    } catch (e) {
      debugPrint('[MicTest] Audio replay notice: $e');
      if (mounted) {
        setState(() {
          _isPlayingReplay = false;
        });
        AppToast.error(context, 'Could not play audio recording: $e');
      }
    }
  }

  bool _voiceDetected = false;
  double _maxDecibelsRecorded = -160.0;

  Future<void> _startMicTest() async {
    // 1. Check microphone permission
    final hasPermission = await _audioRecorder.hasPermission();
    if (!hasPermission) {
      if (mounted) {
        AppToast.error(
          context,
          'Microphone permission is required for oral reading assessment.',
        );
      }
      setState(() {
        _testState = 'failure';
        _audioLevel = 0.0;
      });
      return;
    }

    // Stop any active replay
    if (_isPlayingReplay) {
      await _audioPlayer.stop();
      _isPlayingReplay = false;
    }

    setState(() {
      _testState = 'recording';
      _countdown = 4;
      _audioLevel = 0.0;
      _voiceDetected = false;
      _maxDecibelsRecorded = -160.0;
    });

    _pulseController.repeat(reverse: true);

    // Try starting real audio recording with hardware Noise Suppression & Auto Gain Control
    try {
      if (await _audioRecorder.isRecording() == false) {
        final tempDir = Directory.systemTemp;
        final tempPath = '${tempDir.path}/mic_test_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _audioRecorder.start(
          const RecordConfig(
            encoder: AudioEncoder.aacLc,
            noiseSuppress: true,
            echoCancel: true,
            autoGain: true,
          ),
          path: tempPath,
        );
        _lastRecordedPath = tempPath;
      }
    } catch (e) {
      debugPrint('[MicTest] Recording start notice: $e');
    }

    // Dynamic audio level sampling with Noise Gate filter (every 40ms)
    _audioTimer = Timer.periodic(const Duration(milliseconds: 40), (timer) async {
      double level = 0.0;
      try {
        if (await _audioRecorder.isRecording()) {
          final amp = await _audioRecorder.getAmplitude();
          final db = amp.current; // dB level (-160 to 0)

          if (db > _maxDecibelsRecorded) {
            _maxDecibelsRecorded = db;
          }

          // Speech threshold: sound above -30 dB is registered as direct voice input
          if (db > -30.0) {
            _voiceDetected = true;
          }

          // Noise Gate filter: Ignore ambient background noise below -32 dB
          if (db > -32.0) {
            level = ((db + 32.0) / 28.0).clamp(0.0, 1.0);
          } else {
            level = 0.0; // Bar stays completely still on background noise
          }
        }
      } catch (e) {
        debugPrint('[MicTest] Amplitude sample error: $e');
        level = 0.0;
      }

      if (mounted) {
        setState(() {
          _audioLevel = level;
        });
      }
    });

    // Countdown Timer to transition
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) async {
      if (mounted) {
        if (_countdown > 1) {
          setState(() {
            _countdown--;
          });
        } else {
          _countdownTimer?.cancel();
          _audioTimer?.cancel();
          _pulseController.stop();

          // Transition smoothly to 'processing' state while backend AI denoises audio
          setState(() {
            _testState = 'processing';
            _audioLevel = 0.0;
          });

          try {
            if (await _audioRecorder.isRecording()) {
              final path = await _audioRecorder.stop();
              if (path != null) {
                _lastRecordedPath = path;

                // Process test audio with DeepFilterNet AI Model on backend
                try {
                  final cleanBytes = await ApiService.uploadAudioForDenoising(path);
                  if (cleanBytes != null && cleanBytes.isNotEmpty) {
                    final cleanPath = '${path}_clean.m4a';
                    File(cleanPath).writeAsBytesSync(cleanBytes);
                    _lastRecordedPath = cleanPath;
                    debugPrint('[MicTest] Audio replay successfully updated with DeepFilterNet clean file');
                  }
                } catch (e) {
                  debugPrint('[MicTest] Denoise notice: $e');
                }
              }
            }
          } catch (_) {}

          if (mounted) {
            setState(() {
              // ONLY pass if real vocal sound was detected (above -38 dB)
              if (_voiceDetected || _maxDecibelsRecorded > -38.0) {
                _testState = 'success';
                _audioLevel = 0.0;
              } else {
                _testState = 'failure';
                _audioLevel = 0.0;
              }
            });
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;
            final screenHeight = constraints.maxHeight;

            // Compute sizes proportionally to the screen height to prevent overflows
            final double mascotHeight = (screenHeight * 0.36).clamp(160.0, 240.0);
            final double micButtonSize = (screenHeight * 0.16).clamp(100.0, 130.0);
            final double iconSize = micButtonSize * 0.48;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 520 : double.infinity,
                ),
                child: Column(
                  children: [
                    // 1. Clean Header Navigation Row
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: Row(
                        children: [
                          IconButton(
                            onPressed: () async {
                              Feedback.forTap(context);
                              if (_isPlayingReplay) await _audioPlayer.stop();
                              if (context.mounted) Navigator.pop(context);
                            },
                            icon: const Iconify(
                              PhIcons.caretLeftRegular,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Microphone Test',
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

                    // 2. Main Content
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Expanded(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  // High-Resolution Mascot Image (Bigger and scaled)
                                  Image.asset(
                                    'assets/mascot/sally_speaking.webp',
                                    height: mascotHeight,
                                    fit: BoxFit.contain,
                                  ),
                                  const SizedBox(height: 24),

                                  // Dynamic Heading Title
                                  AnimatedSwitcher(
                                    duration: const Duration(milliseconds: 300),
                                    child: Text(
                                      (_testState == 'recording' || _testState == 'processing')
                                          ? 'Say "Hello, Salintinig!"'
                                          : 'Tap and Speak',
                                      key: ValueKey('${(_testState == 'recording' || _testState == 'processing') ? 'recording' : 'idle'}_title'),
                                      style: GoogleFonts.inter(
                                        fontSize: 22,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),

                                  // Dynamic Subtext Instructions
                                  SizedBox(
                                    height: 48,
                                    child: AnimatedSwitcher(
                                      duration: const Duration(milliseconds: 300),
                                      child: Text(
                                        (_testState == 'recording' || _testState == 'processing')
                                            ? 'Testing input levels...'
                                            : "Let's check if your mic is working.",
                                        key: ValueKey('${(_testState == 'recording' || _testState == 'processing') ? 'recording' : 'idle'}_subtext'),
                                        textAlign: TextAlign.center,
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          color: const Color(0xFF64748B),
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 24),

                                  // Big Blue Microphone Button with Pulse Animation when recording
                                  ScaleTransition(
                                    scale: _testState == 'recording'
                                        ? Tween<double>(begin: 1.0, end: 1.08).animate(
                                            CurvedAnimation(
                                              parent: _pulseController,
                                              curve: Curves.easeInOut,
                                            ),
                                          )
                                        : const AlwaysStoppedAnimation(1.0),
                                    child: GestureDetector(
                                      onTap: (_testState == 'recording' || _testState == 'processing') ? null : _startMicTest,
                                      child: Container(
                                        width: micButtonSize,
                                        height: micButtonSize,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: primaryBlue,
                                          boxShadow: [
                                            BoxShadow(
                                              color: primaryBlue.withValues(alpha: 0.3),
                                              blurRadius: 20,
                                              offset: const Offset(0, 8),
                                            ),
                                          ],
                                        ),
                                        child: Center(
                                          child: _testState == 'processing'
                                              ? const SizedBox(
                                                  width: 32,
                                                  height: 32,
                                                  child: CircularProgressIndicator(
                                                    color: Colors.white,
                                                    strokeWidth: 3,
                                                  ),
                                                )
                                              : Icon(
                                                  Icons.mic_none_rounded,
                                                  color: Colors.white,
                                                  size: iconSize,
                                                ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 32),

                                  // Responsive Audio Level Progress Line
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                    child: LayoutBuilder(
                                      builder: (context, barConstraints) {
                                        return ClipRRect(
                                          borderRadius: BorderRadius.circular(6),
                                          child: Container(
                                            height: 8,
                                            width: double.infinity,
                                            color: const Color(0xFFE2E8F0),
                                            child: Stack(
                                              children: [
                                                AnimatedContainer(
                                                  duration: const Duration(milliseconds: 40),
                                                  curve: Curves.easeOutCubic,
                                                  width: barConstraints.maxWidth * _audioLevel,
                                                  decoration: BoxDecoration(
                                                    color: _testState == 'failure' ? const Color(0xFFEF4444) : primaryBlue,
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  const SizedBox(height: 12),

                                  // Status Message Below Audio Progress Line
                                  SizedBox(
                                    height: 24,
                                    child: Text(
                                      _testState == 'success'
                                          ? 'Your mic is working perfectly!'
                                          : _testState == 'failure'
                                              ? 'Your mic is not working, try again.'
                                              : _testState == 'recording'
                                                  ? 'Listening... 0:0$_countdown'
                                                  : _testState == 'processing'
                                                      ? 'Processing audio...'
                                                      : '',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: _testState == 'success'
                                            ? const Color(0xFF10B981)
                                            : _testState == 'failure'
                                                ? const Color(0xFFEF4444)
                                                : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // Bottom Navigation Action Buttons (Success vs Failure)
                            if (_testState == 'success')
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12.0),
                                child: Column(
                                  children: [
                                    // Audio Replay Button
                                    Container(
                                      width: double.infinity,
                                      height: 52,
                                      margin: const EdgeInsets.only(bottom: 12.0),
                                      child: OutlinedButton.icon(
                                        onPressed: _toggleAudioReplay,
                                        icon: Icon(
                                          _isPlayingReplay ? Icons.pause_circle_filled_rounded : Icons.play_circle_fill_rounded,
                                          color: primaryBlue,
                                          size: 24,
                                        ),
                                        label: Text(
                                          _isPlayingReplay ? 'Playing Test Recording...' : 'Listen to Test Recording',
                                          style: GoogleFonts.inter(
                                            fontSize: 15,
                                            fontWeight: FontWeight.w700,
                                            color: primaryBlue,
                                          ),
                                        ),
                                        style: OutlinedButton.styleFrom(
                                          backgroundColor: const Color(0xFFEFF6FF),
                                          side: const BorderSide(color: Color(0xFFBFDBFE), width: 1.5),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                        ),
                                      ),
                                    ),
                                    // Primary Proceed Button
                                    Container(
                                      width: double.infinity,
                                      height: 56,
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(16),
                                        boxShadow: [
                                          BoxShadow(
                                            color: primaryBlue.withValues(alpha: 0.2),
                                            blurRadius: 12,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: ElevatedButton(
                                        onPressed: () {
                                          Feedback.forTap(context);
                                          _showConfirmationDialog(context);
                                        },
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
                                              'Proceed to Reading',
                                              style: GoogleFonts.inter(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w700,
                                                color: Colors.white,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            else if (_testState == 'failure')
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12.0),
                                child: Container(
                                  width: double.infinity,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                                        blurRadius: 12,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Feedback.forTap(context);
                                      _startMicTest();
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFEF4444),
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                    ),
                                    child: Text(
                                      'Try Mic Check Again',
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
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

  void _showConfirmationDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          backgroundColor: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: Color(0xFFEFF6FF),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.menu_book_rounded,
                    color: Color(0xFF1B64D8),
                    size: 36,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Ready to Begin Reading?',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please review these reminders before starting your assessment:',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 20),
                _buildReminderRow(
                  icon: Icons.volume_up_outlined,
                  title: 'Speak Clearly',
                  description: 'Read out loud in a clear, natural voice.',
                ),
                const SizedBox(height: 12),
                _buildReminderRow(
                  icon: Icons.phonelink_lock_outlined,
                  title: 'Stay in the App',
                  description: 'Do not close or minimize the app while reading.',
                ),
                const SizedBox(height: 12),
                _buildReminderRow(
                  icon: Icons.timer_outlined,
                  title: 'Instant Start',
                  description: 'The recording and timer will start immediately.',
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(dialogContext),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          'Not Yet',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.pop(dialogContext);
                          if (_isPlayingReplay) await _audioPlayer.stop();
                          if (context.mounted) {
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const OralReadingAssessmentReaderPage(),
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: const Color(0xFF1B64D8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: Text(
                          'Start Reading',
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
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildReminderRow({required IconData icon, required String title, required String description}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF1B64D8), size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
