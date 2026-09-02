import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/api_service.dart';

enum PracticeState {
  initial, // Ready to Listen / Tap to speak
  listening, // Sally reference audio playing
  readyToRecord, // "Your turn!"
  recording, // Recording student audio
  analyzing, // Evaluating audio
  success, // Pronunciation Good (>=80%)
  needsPractice, // Pronunciation Needs Practice (<80%)
}

class PronunciationChallengePage extends StatefulWidget {
  const PronunciationChallengePage({super.key});

  @override
  State<PronunciationChallengePage> createState() =>
      _PronunciationChallengePageState();
}

class _PronunciationChallengePageState extends State<PronunciationChallengePage>
    with TickerProviderStateMixin {
  int _currentWordIndex = 0;
  PracticeState _state = PracticeState.initial;
  int _accuracyScore = 0;
  int _attemptsCount = 0;
  int _earnedXp = 0;

  int _activeGuidedSyllableIndex = -1;
  String? _selectedSyllable;

  List<double> _waveform = [0.15, 0.2, 0.15, 0.3, 0.2, 0.15, 0.25, 0.15];
  Timer? _waveformTimer;
  Timer? _systemAudioTimer;

  final List<Map<String, dynamic>> _words = [
    {
      'word': 'Bahaghari',
      'highlightIndex': 1, // e.g. 'hag'
      'syllables': ['Ba', 'hag', 'ha', 'ri'],
      'definition': 'Makulay na guhit sa langit pagkatapos ng ulan.',
      'translation': 'Rainbow',
      'partOfSpeech': 'Pangngalan',
    },
    {
      'word': 'Beautiful',
      'highlightIndex': 0, // 'beau'
      'syllables': ['beau', 'ti', 'ful'],
      'definition': 'Pleasing the senses or mind aesthetically.',
      'translation': 'Maganda',
      'partOfSpeech': 'Adjective',
    },
    {
      'word': 'Kaibigan',
      'highlightIndex': 2, // 'bi'
      'syllables': ['Ka', 'i', 'bi', 'gan'],
      'definition': 'Isang tao na maaari mong pagkatiwalaan at makasama.',
      'translation': 'Friend',
      'partOfSpeech': 'Pangngalan',
    },
    {
      'word': 'Bulaklak',
      'highlightIndex': 1, // 'lak'
      'syllables': ['Bu', 'lak', 'lak'],
      'definition': 'Bahagi ng halaman na makulay at mabangong tignan.',
      'translation': 'Flower',
      'partOfSpeech': 'Pangngalan',
    },
  ];

  @override
  void dispose() {
    _waveformTimer?.cancel();
    _systemAudioTimer?.cancel();
    super.dispose();
  }

  String _getMascotAsset() {
    if (_state == PracticeState.success) {
      return 'assets/mascot/sally_happy.webp';
    }
    return 'assets/mascot/sally_speaking.webp';
  }

  void _playReferenceAudio() {
    Feedback.forTap(context);
    setState(() {
      _state = PracticeState.listening;
    });

    _systemAudioTimer?.cancel();
    _systemAudioTimer = Timer(const Duration(milliseconds: 1400), () {
      if (mounted) {
        setState(() {
          _state = PracticeState.readyToRecord;
        });
      }
    });
  }

  void _startRecording() {
    Feedback.forTap(context);
    setState(() {
      _state = PracticeState.recording;
      _attemptsCount++;
    });

    int ticks = 0;
    final random = Random();
    _waveformTimer?.cancel();
    _waveformTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (ticks > 22) {
        timer.cancel();
        _analyzeAudio();
        return;
      }
      ticks++;
      if (mounted) {
        setState(() {
          _waveform = List.generate(
            10,
            (_) => 0.15 + random.nextDouble() * 0.85,
          );
        });
      }
    });
  }

  void _analyzeAudio() {
    setState(() {
      _state = PracticeState.analyzing;
    });

    Future.delayed(const Duration(milliseconds: 900), () {
      if (!mounted) return;
      final random = Random();

      final bool wasGuided =
          _activeGuidedSyllableIndex >= 0 ||
          _state == PracticeState.needsPractice;
      final int score = wasGuided
          ? (88 + random.nextInt(12))
          : (_attemptsCount == 1 && _currentWordIndex == 0
                ? 68
                : (85 + random.nextInt(15)));

      setState(() {
        _accuracyScore = score;
        if (score >= 80) {
          _state = PracticeState.success;
          _earnedXp += 10;
          _syncScore(score);
        } else {
          _state = PracticeState.needsPractice;
          _activeGuidedSyllableIndex = 0;
        }
      });
    });
  }

  void _syncScore(int score) async {
    try {
      await ApiService.post('/students/activity/complete', {
        'activityTitle': 'Pronunciation Challenge',
        'activityType': 'Pronunciation',
        'score': score,
      });
    } catch (_) {}
  }

  void _playSyllableAudio(int index, String syllable) {
    Feedback.forTap(context);
    setState(() {
      _selectedSyllable = syllable;
      _activeGuidedSyllableIndex = index;
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) {
        setState(() {
          _selectedSyllable = null;
        });
      }
    });
  }

  void _nextWord() {
    Feedback.forTap(context);
    if (_currentWordIndex + 1 < _words.length) {
      setState(() {
        _currentWordIndex++;
        _state = PracticeState.initial;
        _activeGuidedSyllableIndex = -1;
        _selectedSyllable = null;
        _attemptsCount = 0;
      });
    } else {
      _showCompletionDialog();
    }
  }

  void _showCompletionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          contentPadding: const EdgeInsets.all(24),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: const BoxDecoration(
                  color: Color(0xFFD1FAE5),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF10B981),
                    size: 40,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Challenge Complete!',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Awesome job on your pronunciation practice!',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.stars_rounded,
                      color: Color(0xFF1B64D8),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '+$_earnedXp XP Earned',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1B64D8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B64D8),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Finish Activity',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showHelpModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDBEAFE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Iconify(
                      PhIcons.userSoundBold,
                      color: Color(0xFF1B64D8),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'How to Practice',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildHelpStep(
                '1',
                'Tap the word card to hear Sally pronounce the word.',
              ),
              _buildHelpStep(
                '2',
                'Tap the syllable buttons below to hear individual sounds.',
              ),
              _buildHelpStep(
                '3',
                'Press the green microphone button and speak clearly.',
              ),
              _buildHelpStep(
                '4',
                'Receive instant clarity feedback and earn XP!',
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B64D8),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Got It',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHelpStep(String number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              number,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF475569),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF475569),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getSpeechBubbleText() {
    switch (_state) {
      case PracticeState.listening:
        return 'Listening to Sally...';
      case PracticeState.readyToRecord:
        return 'Your turn!';
      case PracticeState.recording:
        return 'Speaking...';
      case PracticeState.analyzing:
        return 'Checking...';
      case PracticeState.success:
        return 'Great job!';
      case PracticeState.needsPractice:
        return 'Try the syllables!';
      case PracticeState.initial:
        return 'Listen first!';
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const primaryGreen = Color(0xFF10B981);
    const softCanvasBg = Color(0xFFFCFAF7);

    final currentWordData = _words[_currentWordIndex];
    final String wordText = currentWordData['word'];
    final List<String> syllables = List<String>.from(
      currentWordData['syllables'],
    );
    final String definition = currentWordData['definition'];
    final String translation = currentWordData['translation'];

    final double progress = (_currentWordIndex + 1) / _words.length;

    return Scaffold(
      backgroundColor: softCanvasBg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top Header Navigation Bar ──────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20.0, 4.0, 20.0, 2.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'PRONUNCIATION PRACTICE',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF94A3B8),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(100),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 8,
                            backgroundColor: const Color(0xFFE2E8F0),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              Color(0xFF1B64D8),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Row(
                    children: [
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: _showHelpModal,
                        icon: const Icon(
                          Icons.help_outline_rounded,
                          size: 22,
                          color: Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(width: 12),
                      IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => Navigator.pop(context),
                        icon: const Iconify(
                          Ph.x,
                          size: 22,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ── Main Content Area ──────────────────────────────────────────────
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24.0, 2.0, 24.0, 8.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // 1. Top Card: Word syllables breakdown + definition
                    GestureDetector(
                      onTap: _state == PracticeState.listening
                          ? null
                          : _playReferenceAudio,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20.0,
                          vertical: 20.0,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: const Color(0xFF0F172A),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFF0F172A,
                              ).withValues(alpha: 0.04),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Whole Word Text with Volume Icon
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  wordText,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.inter(
                                    fontSize: 26,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                    letterSpacing: -0.3,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Icon(
                                  Icons.volume_up_rounded,
                                  color: _state == PracticeState.listening
                                      ? const Color(0xFF1B64D8)
                                      : const Color(0xFF64748B),
                                  size: 24,
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            // Definition text
                            Text(
                              '$definition ($translation)',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF334155),
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // 2. Middle: Sally Mascot in Circular Avatar + Speech Bubble
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Speech Bubble Callout
                        Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: const Color(0xFF0F172A),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            _getSpeechBubbleText(),
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ),

                        // Standalone Large Sally Mascot (Switches to happy on success, centered)
                        Transform.translate(
                          offset: Offset(_state == PracticeState.success ? 0 : 18.5, 0),
                          child: SizedBox(
                            height: 220,
                            child: Image.asset(
                              _getMascotAsset(),
                              key: ValueKey<String>(_getMascotAsset()),
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(
                                    Icons.face_retouching_natural_rounded,
                                    size: 80,
                                    color: Color(0xFFD97706),
                                  ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // 3. Syllables Buttons Row (Uniform, Crisp & Symmetrical)
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      alignment: WrapAlignment.center,
                      children: syllables.asMap().entries.map((entry) {
                        final int idx = entry.key;
                        final String syl = entry.value;
                        final bool isSelected = _selectedSyllable == syl;

                        return GestureDetector(
                          onTap: () => _playSyllableAudio(idx, syl),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: 64,
                            height: 52,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? const Color(0xFFEFF6FF)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isSelected
                                    ? const Color(0xFF1B64D8)
                                    : const Color(0xFF0F172A),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFF0F172A,
                                  ).withValues(alpha: 0.04),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              syl,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isSelected
                                    ? const Color(0xFF1B64D8)
                                    : const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    // 4. Bottom Section: Microphone Button + Prompt Label or Result Controls (Fixed Height to prevent layout shift)
                    SizedBox(
                      height: 110,
                      child: Center(
                        child: _state == PracticeState.success
                            ? Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 20,
                                      vertical: 10,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFD1FAE5),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: const Color(0xFF10B981),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.check_circle_rounded,
                                          color: Color(0xFF10B981),
                                          size: 20,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          '$_accuracyScore% Match • +10 XP',
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF047857),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: 200,
                                    height: 46,
                                    child: ElevatedButton(
                                      onPressed: _nextWord,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: primaryGreen,
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius:
                                              BorderRadius.circular(100),
                                        ),
                                      ),
                                      child: Text(
                                        _currentWordIndex + 1 == _words.length
                                            ? 'Complete'
                                            : 'Next Word',
                                        style: GoogleFonts.inter(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (_state == PracticeState.recording) ...[
                                    // Live Interactive Soundwave in place of Mic Button
                                    SizedBox(
                                      height: 76,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: _waveform.map((val) {
                                          return AnimatedContainer(
                                            duration: const Duration(
                                                milliseconds: 100),
                                            margin: const EdgeInsets.symmetric(
                                              horizontal: 3.5,
                                            ),
                                            width: 6,
                                            height: 14 + (val * 44),
                                            decoration: BoxDecoration(
                                              color: primaryBlue,
                                              borderRadius:
                                                  BorderRadius.circular(100),
                                            ),
                                          );
                                        }).toList(),
                                      ),
                                    ),
                                  ] else ...[
                                    // Blue Microphone Button (Visible when idle or analyzing)
                                    GestureDetector(
                                      onTap: (_state ==
                                                  PracticeState.analyzing ||
                                              _state == PracticeState.listening)
                                          ? null
                                          : _startRecording,
                                      child: Container(
                                        width: 76,
                                        height: 76,
                                        decoration: BoxDecoration(
                                          color: primaryBlue,
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: primaryBlue.withValues(
                                                alpha: 0.35,
                                              ),
                                              blurRadius: 16,
                                              offset: const Offset(0, 6),
                                            ),
                                          ],
                                        ),
                                        child: Center(
                                          child: _state == PracticeState.analyzing
                                              ? const SizedBox(
                                                  width: 28,
                                                  height: 28,
                                                  child:
                                                      CircularProgressIndicator(
                                                    strokeWidth: 3,
                                                    color: Colors.white,
                                                  ),
                                                )
                                              : const Icon(
                                                  Icons.mic_rounded,
                                                  color: Colors.white,
                                                  size: 36,
                                                ),
                                        ),
                                      ),
                                    ),
                                  ],
                                  const SizedBox(height: 12),
                                  Text(
                                    _state == PracticeState.recording
                                        ? 'Listening to your voice...'
                                        : (_state == PracticeState.analyzing
                                            ? 'Evaluating pronunciation...'
                                            : 'Tap to speak'),
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: _state == PracticeState.recording
                                          ? primaryBlue
                                          : const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
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
  }
}
