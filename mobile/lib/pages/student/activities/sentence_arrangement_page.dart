import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:confetti/confetti.dart';
import 'package:salintinig/constants/ph_icons.dart';

class SentenceArrangementPage extends StatefulWidget {
  const SentenceArrangementPage({super.key});

  @override
  State<SentenceArrangementPage> createState() => _SentenceArrangementPageState();
}

class _SentenceArrangementPageState extends State<SentenceArrangementPage> {
  final List<Map<String, dynamic>> _sentences = [
    {
      'scrambled': ['love', 'I', 'dog', 'my', '.'],
      'correct': ['I', 'love', 'my', 'dog', '.'],
    },
    {
      'scrambled': ['read', 'like', 'books', 'to', 'We'],
      'correct': ['We', 'like', 'to', 'read', 'books'],
    },
    {
      'scrambled': ['sunny', 'a', 'is', 'It', 'day'],
      'correct': ['It', 'is', 'a', 'sunny', 'day'],
    }
  ];

  int _currentIndex = 0;
  List<String> _scrambledWords = [];
  List<String> _arrangedWords = [];
  bool _isChecked = false;
  bool _isCorrect = false;

  // ── Celebration / Completion State ─────────────────────────────────────────
  bool _isFinished = false;
  int _earnedXp = 0;
  int _mistakesCount = 0;
  int _finalAccuracy = 100;
  String _celebrationMessage = 'Awesome job!';
  String _celebrationSubtitle = 'Great sentence building!';
  late ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _loadSentence();
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  void _loadSentence() {
    final current = _sentences[_currentIndex];
    setState(() {
      _scrambledWords = List<String>.from(current['scrambled']);
      _arrangedWords = [];
      _isChecked = false;
      _isCorrect = false;
    });
  }

  void _onWordTap(String word, bool isScrambledList) {
    if (_isChecked) return;
    Feedback.forTap(context);
    setState(() {
      if (isScrambledList) {
        _arrangedWords.add(word);
        _scrambledWords.remove(word);
      } else {
        _scrambledWords.add(word);
        _arrangedWords.remove(word);
      }
      _checkSentenceAuto();
    });
  }

  void _checkSentenceAuto() {
    final correctList = List<String>.from(_sentences[_currentIndex]['correct']);
    if (_arrangedWords.length == correctList.length) {
      bool correct = true;
      for (int i = 0; i < correctList.length; i++) {
        if (_arrangedWords[i] != correctList[i]) {
          correct = false;
          break;
        }
      }
      setState(() {
        _isChecked = true;
        _isCorrect = correct;
        if (!correct) {
          _mistakesCount++;
        }
      });
    }
  }

  void _tryAgain() {
    Feedback.forTap(context);
    _loadSentence();
  }

  void _nextSentence() {
    Feedback.forTap(context);
    _earnedXp += 15; // 15 XP per correctly formed sentence

    if (_currentIndex + 1 < _sentences.length) {
      setState(() {
        _currentIndex++;
      });
      _loadSentence();
    } else {
      // Completed all sentences!
      final totalSentences = _sentences.length;
      final computedAccuracy = (_mistakesCount == 0)
          ? 100
          : ((totalSentences / (totalSentences + _mistakesCount)) * 100).round().clamp(20, 95);
      final feedback = _getCelebrationFeedback(computedAccuracy);

      setState(() {
        _finalAccuracy = computedAccuracy;
        _celebrationMessage = feedback['compliment']!;
        _celebrationSubtitle = feedback['subtitle']!;
        _isFinished = true;
      });
      _confettiController.play();
    }
  }

  void _restartPractice() {
    setState(() {
      _currentIndex = 0;
      _isFinished = false;
      _earnedXp = 0;
      _mistakesCount = 0;
      _finalAccuracy = 100;
    });
    _confettiController.stop();
    _loadSentence();
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    if (_isFinished) {
      return Scaffold(
        backgroundColor: softCreamBg,
        body: _buildCelebrationWidget(primaryBlue),
      );
    }

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top Header Row ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SENTENCE ${_currentIndex + 1}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF94A3B8),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: List.generate(_sentences.length, (index) {
                          final isActive = index == _currentIndex;
                          final isCompleted = index < _currentIndex;
                          return Container(
                            margin: const EdgeInsets.only(right: 6),
                            width: 24,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isActive
                                  ? primaryBlue
                                  : (isCompleted ? const Color(0xFF10B981) : const Color(0xFFE2E8F0)),
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Iconify(
                      Ph.x,
                      size: 24,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),

            // ── Instructions ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
              child: Text(
                'Arrange the scrambled words in the correct order to form a sentence',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ── Game Arena ─────────────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Scrambled Words Pool Row
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      alignment: WrapAlignment.center,
                      children: _scrambledWords.map((word) {
                        return _buildWordTile(
                          word: word,
                          onTap: () => _onWordTap(word, true),
                          bgColor: const Color(0xFFEFF6FF),
                          borderColor: const Color(0xFFBFDBFE),
                          textColor: primaryBlue,
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 36),

                    // Arranged / Selected Words Target Slot (dotted border)
                    Container(
                      constraints: const BoxConstraints(minHeight: 120),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: _isChecked
                              ? (_isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                              : const Color(0xFFCBD5E1),
                          width: 2.5,
                          style: BorderStyle.solid,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16),
                      child: _arrangedWords.isEmpty
                          ? Center(
                              child: Text(
                                'Tap words above to construct sentence',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF94A3B8),
                                ),
                              ),
                            )
                          : Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: _arrangedWords.map((word) {
                                return _buildWordTile(
                                  word: word,
                                  onTap: () => _onWordTap(word, false),
                                  bgColor: _isChecked
                                      ? (_isCorrect ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2))
                                      : const Color(0xFFF1F5F9),
                                  borderColor: _isChecked
                                      ? (_isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                                      : const Color(0xFFE2E8F0),
                                  textColor: _isChecked
                                      ? (_isCorrect ? const Color(0xFF047857) : const Color(0xFFB91C1C))
                                      : const Color(0xFF334155),
                                );
                              }).toList(),
                            ),
                    ),
                    const SizedBox(height: 28),

                    // Mascot illustration / status check banner
                    if (_isChecked) ...[
                      Column(
                        children: [
                          // Encouragement Mascot Image
                          Image.asset(
                            _isCorrect
                                ? 'assets/mascot/sally_celebration.webp'
                                : 'assets/mascot/sally_sitting.webp',
                            height: 140,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) =>
                                const SizedBox(height: 140),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  color: _isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                child: Text(
                                  _isCorrect ? 'Correct!' : 'Incorrect',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              if (_isCorrect) ...[
                                const SizedBox(width: 10),
                                Container(
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFD1FAE5),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                  child: Text(
                                    '+1 Star',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF065F46),
                                    ),
                                  ),
                                ),
                              ]
                            ],
                          ),
                          const SizedBox(height: 28),
                          // Action Buttons Row
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: _tryAgain,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFFEF3C7),
                                    foregroundColor: const Color(0xFFD97706),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    elevation: 0,
                                  ),
                                  child: Text(
                                    'Try Again',
                                    style: GoogleFonts.inter(fontWeight: FontWeight.w800),
                                  ),
                                ),
                              ),
                              if (_isCorrect) ...[
                                const SizedBox(width: 14),
                                Expanded(
                                  child: ElevatedButton(
                                    onPressed: _nextSentence,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: primaryBlue,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      elevation: 0,
                                    ),
                                    child: Text(
                                      'Next',
                                      style: GoogleFonts.inter(fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                ),
                              ]
                            ],
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWordTile({
    required String word,
    required VoidCallback onTap,
    required Color bgColor,
    required Color borderColor,
    required Color textColor,
  }) {
    return Container(
      height: 52,
      margin: const EdgeInsets.only(bottom: 4),
      child: Stack(
        children: [
          // Shadows shadow background
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          Positioned(
            top: 0,
            bottom: 3.5,
            left: 0,
            right: 0,
            child: GestureDetector(
              onTap: onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: borderColor, width: 2),
                ),
                alignment: Alignment.center,
                child: Text(
                  word,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Map<String, String> _getCelebrationFeedback(int accuracy) {
    final rand = Random();

    if (accuracy >= 90) {
      const compliments = [
        'Awesome job!',
        'Sentence master!',
        'Outstanding!',
        'You nailed it!',
        'Super star!',
        'Brilliant work!',
        'Incredible!',
      ];
      const subtitles = [
        'You formed every sentence with incredible precision and grammar mastery!',
        'Flawless construction! Your sentence building skills are top-notch!',
        '100% accuracy! You arranged all sentences perfectly!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else if (accuracy >= 75) {
      const compliments = [
        'Great effort!',
        'Well done!',
        'Way to go!',
        'Fantastic work!',
        'You did it!',
        'Keep shining!',
        'Almost perfect!',
      ];
      const subtitles = [
        'You solved almost every sentence on the first try! Keep it up!',
        'Great sentence structure! You are becoming a confident reader and writer!',
        'Solid performance! You are learning word order and grammar fast!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else if (accuracy >= 55) {
      const compliments = [
        'Good progress!',
        'Nice perseverance!',
        'Keep it up!',
        'Getting stronger!',
        'Step by step!',
        'Proud of your effort!',
      ];
      const subtitles = [
        'Every rearranged word helps build your grammar instincts! Well done!',
        'You pushed through and finished all the sentences! Good job!',
        'Steady progress! Keep practicing to master sentence patterns!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else {
      const compliments = [
        'Keep practicing!',
        'Never give up!',
        'Practice pays off!',
        'You can do this!',
        'Keep learning!',
      ];
      const subtitles = [
        'Mistakes help us understand sentence order! Try once more to master these!',
        'Great perseverance! Practice again and watch your score soar!',
        'You completed the sentences! Try again to achieve an even higher score!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    }
  }

  Widget _buildCelebrationWidget(Color primaryBlue) {
    return Stack(
      alignment: Alignment.topCenter,
      children: [
        ConfettiWidget(
          confettiController: _confettiController,
          blastDirectionality: BlastDirectionality.explosive,
          shouldLoop: false,
          colors: const [
            Color(0xFF1B64D8),
            Color(0xFFF59E0B),
            Color(0xFF10B981),
            Color(0xFFEC4899),
            Color(0xFF8B5CF6),
          ],
          numberOfParticles: 35,
          gravity: 0.25,
        ),
        SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 8),

                // 1. Top Centered Speech Bubble above Sally
                Center(
                  child: CustomPaint(
                    painter: _CelebrationSpeechBubblePainter(
                      color: Colors.white,
                      borderColor: const Color(0xFF0F172A),
                      borderWidth: 2.2,
                      radius: 24.0,
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24.0,
                        vertical: 10.0,
                      ),
                      child: Text(
                        _celebrationMessage,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // 2. Sally Mascot Illustration (Celebration)
                Image.asset(
                  'assets/mascot/sally_celebration.webp',
                  height: 165,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Image.asset(
                    'assets/mascot/sally_sitting.webp',
                    height: 165,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 20),

                // 3. Title and Subtitle
                Text(
                  'Activity Completed!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _celebrationSubtitle,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 24),

                // 4. Tri-Stat Metric Box (XP, Accuracy, Mistakes)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 18.0, horizontal: 12.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: const Color(0xFF0F172A),
                      width: 2.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Stat 1: XP
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.bolt_rounded,
                              color: Color(0xFFF59E0B),
                              size: 26,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'XP',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF94A3B8),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '+$_earnedXp',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Divider 1
                      Container(
                        width: 1,
                        height: 46,
                        color: const Color(0xFFE2E8F0),
                      ),

                      // Stat 2: Accuracy
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.check_circle_rounded,
                              color: Color(0xFF10B981),
                              size: 24,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'ACCURACY',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF94A3B8),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_finalAccuracy%',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Divider 2
                      Container(
                        width: 1,
                        height: 46,
                        color: const Color(0xFFE2E8F0),
                      ),

                      // Stat 3: Mistakes
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.cancel_rounded,
                              color: Color(0xFFEF4444),
                              size: 24,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'MISTAKES',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF94A3B8),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_mistakesCount',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Streak Banner Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFE2E8F0),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Flame Icon Container
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFFFFEDD5),
                            width: 1,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Iconify(
                          PhIcons.fireBold,
                          color: Color(0xFFEA580C),
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Streak Titles
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Practice Streak Active!',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Continue tomorrow for your badge',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // +1 Day pill badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0xFFFED7AA),
                            width: 1.2,
                          ),
                        ),
                        child: Text(
                          '+1 Day',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFFEA580C),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 6. Action Buttons: Stacked Full-Width
                // Primary Continue Button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Continue',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          size: 20,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Secondary Repeat Practice Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton(
                    onPressed: _restartPractice,
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF334155),
                      side: const BorderSide(
                        color: Color(0xFFE2E8F0),
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.refresh_rounded,
                          size: 20,
                          color: Color(0xFF64748B),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Practice Again',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Custom painter for the centered speech bubble above Sally during celebration
class _CelebrationSpeechBubblePainter extends CustomPainter {
  final Color color;
  final Color borderColor;
  final double borderWidth;
  final double radius;

  _CelebrationSpeechBubblePainter({
    this.color = Colors.white,
    this.borderColor = const Color(0xFF0F172A),
    this.borderWidth = 2.2,
    this.radius = 24.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final r = radius;
    final w = size.width;
    final h = size.height;

    // Tail on bottom center pointing straight down towards Sally's head
    final centerX = w / 2;
    const tailHalfWidth = 7.0;
    const tailHeight = 8.0;

    final path = Path();
    path.moveTo(r, 0);
    path.lineTo(w - r, 0);
    path.arcToPoint(Offset(w, r), radius: Radius.circular(r));
    path.lineTo(w, h - r);
    path.arcToPoint(Offset(w - r, h), radius: Radius.circular(r));

    // Bottom edge with center-pointing tail
    path.lineTo(centerX + tailHalfWidth, h);
    path.lineTo(centerX, h + tailHeight);
    path.lineTo(centerX - tailHalfWidth, h);

    path.lineTo(r, h);
    path.arcToPoint(Offset(0, h - r), radius: Radius.circular(r));
    path.lineTo(0, r);
    path.arcToPoint(Offset(r, 0), radius: Radius.circular(r));
    path.close();

    // Subtle drop shadow
    canvas.drawPath(
      path.shift(const Offset(0, 2)),
      Paint()
        ..color = Colors.black.withValues(alpha: 0.04)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
    );

    // White fill
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.fill,
    );

    // Border stroke
    canvas.drawPath(
      path,
      Paint()
        ..color = borderColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = borderWidth
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(covariant _CelebrationSpeechBubblePainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.borderColor != borderColor ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.radius != radius;
  }
}
