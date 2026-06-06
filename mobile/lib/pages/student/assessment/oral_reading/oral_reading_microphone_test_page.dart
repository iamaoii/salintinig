import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_reader_page.dart';

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
  final Random _random = Random();

  // Mode toggle for testing both success and failure flows
  bool _simulateFailure = false;

  // Animation controller for pulsing microphone button
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _audioTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startMicTest() {
    setState(() {
      _testState = 'recording';
      _countdown = 4;
      _audioLevel = 0.1;
    });

    _pulseController.repeat(reverse: true);

    // Dynamic audio level fluctuation animation
    _audioTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (mounted) {
        setState(() {
          _audioLevel = 0.15 + _random.nextDouble() * 0.70;
        });
      }
    });

    // Countdown Timer to transition
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          if (_countdown > 1) {
            _countdown--;
          } else {
            _countdownTimer?.cancel();
            _audioTimer?.cancel();
            _pulseController.stop();

            if (_simulateFailure) {
              _testState = 'failure';
              _audioLevel = 0.0;
            } else {
              _testState = 'success';
              _audioLevel = 0.50; // Reference screenshot shows exactly 50% fill
            }
          }
        });
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
                    // 1. Header Navigation Row with Simulation Toggle
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              IconButton(
                                onPressed: () {
                                  Feedback.forTap(context);
                                  Navigator.pop(context);
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
                          // Hidden/Simulation Toggle Button for presentation and testing
                          TextButton.icon(
                            onPressed: () {
                              setState(() {
                                _simulateFailure = !_simulateFailure;
                              });
                            },
                            icon: Icon(
                              _simulateFailure ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
                              size: 16,
                              color: _simulateFailure ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                            ),
                            label: Text(
                              _simulateFailure ? 'Fail Mode' : 'Pass Mode',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: _simulateFailure ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                              ),
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
                                      _testState == 'recording'
                                          ? 'Say "Hello, Salintinig!"'
                                          : 'Tap and Speak',
                                      key: ValueKey('${_testState == 'recording' ? 'recording' : 'idle_success'}_title'),
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
                                        _testState == 'recording'
                                            ? 'Testing input levels...'
                                            : "Let's check if your mic is working.",
                                        key: ValueKey('${_testState == 'recording' ? 'recording' : 'idle_success'}_subtext'),
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
                                      onTap: _testState == 'recording' ? null : _startMicTest,
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
                                          child: Icon(
                                            Icons.mic_none_rounded,
                                            color: Colors.white,
                                            size: iconSize,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 32),

                                  // Dynamic Audio Level Progress Line
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                    child: LayoutBuilder(
                                      builder: (context, barConstraints) {
                                        return ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: Container(
                                            height: 6,
                                            width: double.infinity,
                                            color: const Color(0xFFE2E8F0),
                                            child: Stack(
                                              children: [
                                                AnimatedContainer(
                                                  duration: const Duration(milliseconds: 100),
                                                  width: barConstraints.maxWidth * _audioLevel,
                                                  color: _testState == 'failure' ? const Color(0xFFEF4444) : primaryBlue,
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
                                child: Container(
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
                                      Navigator.pushReplacement(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => const OralReadingAssessmentReaderPage(),
                                        ),
                                      );
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
                                      Navigator.pop(context); // Exit back to intro page
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFEF4444),
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                    ),
                                    child: Text(
                                      'Exit',
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
}
