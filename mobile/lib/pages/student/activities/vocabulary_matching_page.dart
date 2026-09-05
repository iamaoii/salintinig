import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/activity_progress_service.dart';
import 'package:salintinig/services/api_service.dart';

class VocabularyMatchingPage extends StatefulWidget {
  /// Difficulty tier: 'easy', 'medium', 'hard'.
  final String difficulty;

  const VocabularyMatchingPage({
    super.key,
    this.difficulty = 'medium',
  });

  @override
  State<VocabularyMatchingPage> createState() => _VocabularyMatchingPageState();
}

class _VocabularyMatchingPageState extends State<VocabularyMatchingPage> {
  // ── Session State ──────────────────────────────────────────────────────────
  late String _sessionDifficulty;
  String _sessionId = '';
  int _earnedXp = 0;
  bool _isFinished = false;

  // Words & Pairings (Left: English, Right: Filipino)
  List<String> _leftWords = [];
  List<String> _rightWords = [];
  Map<String, String> _pairings = {}; // leftWord (English) -> rightWord (Filipino)

  // Selection & Match States
  String? _selectedLeft;
  String? _selectedRight;
  final Set<String> _matchedLeft = {};
  final Set<String> _matchedRight = {};

  // Error Feedback States
  String? _errorLeft;
  String? _errorRight;

  // Mascot & Speech Bubble State
  String _sallyMessage = 'Match the words!';
  Timer? _sallyResetTimer;
  bool _isMascotPulsing = false;

  // ── Curated Word Banks (Left: English, Right: Filipino) ───────────────────

  static const List<Map<String, String>> _easyPool = [
    {'left': 'Dog', 'right': 'Aso'},
    {'left': 'Cat', 'right': 'Pusa'},
    {'left': 'House', 'right': 'Bahay'},
    {'left': 'Sun', 'right': 'Araw'},
    {'left': 'Bird', 'right': 'Ibon'},
    {'left': 'Milk', 'right': 'Gatas'},
    {'left': 'Water', 'right': 'Tubig'},
    {'left': 'Fish', 'right': 'Isda'},
  ];

  static const List<Map<String, String>> _mediumPool = [
    {'left': 'Flower', 'right': 'Bulaklak'},
    {'left': 'Plant', 'right': 'Halaman'},
    {'left': 'Boat', 'right': 'Bangka'},
    {'left': 'Sky', 'right': 'Langit'},
    {'left': 'Tree', 'right': 'Puno'},
    {'left': 'Friend', 'right': 'Kaibigan'},
    {'left': 'School', 'right': 'Paaralan'},
    {'left': 'Mountain', 'right': 'Bundok'},
  ];

  static const List<Map<String, String>> _hardPool = [
    {'left': 'Rainbow', 'right': 'Bahaghari'},
    {'left': 'Freedom', 'right': 'Kalayaan'},
    {'left': 'Love', 'right': 'Pagmamahal'},
    {'left': 'Nature', 'right': 'Kalikasan'},
    {'left': 'Knowledge', 'right': 'Kaalaman'},
    {'left': 'Community', 'right': 'Pamayanan'},
    {'left': 'Loyalty', 'right': 'Katapatan'},
    {'left': 'Silence', 'right': 'Katahimikan'},
  ];

  // ── Word Count & XP Helpers ───────────────────────────────────────────────

  int get _targetPairCount {
    switch (_sessionDifficulty.toLowerCase()) {
      case 'easy':
        return 4;
      case 'hard':
        return 6;
      case 'medium':
      default:
        return 5;
    }
  }

  int get _xpPerPair {
    switch (_sessionDifficulty.toLowerCase()) {
      case 'easy':
        return 10;
      case 'hard':
        return 25;
      case 'medium':
      default:
        return 15;
    }
  }

  @override
  void initState() {
    super.initState();
    _sessionDifficulty = widget.difficulty;
    _initOrResumeSession();
  }

  @override
  void dispose() {
    _sallyResetTimer?.cancel();
    super.dispose();
  }

  void _setSallyMessage(String message, {bool temporary = false}) {
    _sallyResetTimer?.cancel();
    if (!mounted) return;
    setState(() {
      _sallyMessage = message;
    });
    if (temporary) {
      _sallyResetTimer = Timer(const Duration(milliseconds: 1800), () {
        if (mounted && !_isFinished) {
          setState(() {
            final remaining = _leftWords.length - _matchedLeft.length;
            if (remaining == 1) {
              _sallyMessage = 'One last pair!';
            } else {
              _sallyMessage = 'Match the words!';
            }
          });
        }
      });
    }
  }

  void _triggerMascotPulse() {
    if (!mounted) return;
    setState(() => _isMascotPulsing = true);
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        setState(() => _isMascotPulsing = false);
      }
    });
  }

  /// Initialize session from saved progress or create a fresh randomized set.
  Future<void> _initOrResumeSession() async {
    final saved = await ActivityProgressService.getProgress('vocabulary');

    if (saved != null &&
        saved['words'] is List &&
        (saved['words'] as List).isNotEmpty) {
      try {
        final wordsList = (saved['words'] as List).map<Map<String, dynamic>>((
          e,
        ) {
          return Map<String, dynamic>.from(e as Map);
        }).toList();

        final restoredPairings = <String, String>{};
        final leftList = <String>[];
        final rightList = <String>[];

        for (final item in wordsList) {
          final l = item['left']?.toString() ?? '';
          final r = item['right']?.toString() ?? '';
          if (l.isNotEmpty && r.isNotEmpty) {
            restoredPairings[l] = r;
            leftList.add(l);
            rightList.add(r);
          }
        }

        if (restoredPairings.isNotEmpty) {
          final savedMatchedLeft =
              (saved['matchedLeft'] as List?)
                  ?.map((e) => e.toString())
                  .toSet() ??
              {};
          final savedMatchedRight =
              (saved['matchedRight'] as List?)
                  ?.map((e) => e.toString())
                  .toSet() ??
              {};

          final savedRightOrder = (saved['rightOrder'] as List?)
              ?.map((e) => e.toString())
              .toList();

          setState(() {
            _sessionId =
                saved['sessionId']?.toString() ??
                'vocab_${DateTime.now().millisecondsSinceEpoch}';
            _sessionDifficulty =
                saved['difficulty']?.toString() ?? _sessionDifficulty;
            _pairings = restoredPairings;
            _leftWords = leftList;
            _rightWords =
                savedRightOrder ??
                (List<String>.from(rightList)..shuffle(Random()));
            _matchedLeft.addAll(savedMatchedLeft);
            _matchedRight.addAll(savedMatchedRight);
            _earnedXp =
                (saved['earnedXp'] as int?) ??
                (_matchedLeft.length * _xpPerPair);
          });

          if (_matchedLeft.length >= _leftWords.length &&
              _leftWords.isNotEmpty) {
            setState(() => _isFinished = true);
          }
          return;
        }
      } catch (e) {
        debugPrint('Error restoring vocabulary session: $e');
      }
    }

    _setupFreshSession();
  }

  void _setupFreshSession() {
    _sessionId = 'vocab_${DateTime.now().millisecondsSinceEpoch}';

    List<Map<String, String>> pool;
    if (_sessionDifficulty == 'easy') {
      pool = List.from(_easyPool);
    } else if (_sessionDifficulty == 'hard') {
      pool = List.from(_hardPool);
    } else {
      pool = List.from(_mediumPool);
    }

    // Shuffle and pick exact pair count
    pool.shuffle(Random());
    final selectedPairs = pool.take(_targetPairCount).toList();

    final leftList = <String>[];
    final rightList = <String>[];
    final newPairings = <String, String>{};

    for (final pair in selectedPairs) {
      final l = pair['left']!;
      final r = pair['right']!;
      leftList.add(l);
      rightList.add(r);
      newPairings[l] = r;
    }

    // Shuffle both columns independently so answers aren't aligned
    leftList.shuffle(Random());
    rightList.shuffle(Random());

    setState(() {
      _pairings = newPairings;
      _leftWords = leftList;
      _rightWords = rightList;
      _matchedLeft.clear();
      _matchedRight.clear();
      _selectedLeft = null;
      _selectedRight = null;
      _errorLeft = null;
      _errorRight = null;
      _earnedXp = 0;
      _isFinished = false;
      _sallyMessage = 'Match the words!';
    });

    _sallyResetTimer?.cancel();
    _persistCurrentProgress();
  }

  Future<void> _persistCurrentProgress() async {
    final wordsData = _pairings.entries
        .map((e) => {'left': e.key, 'right': e.value})
        .toList();

    await ActivityProgressService.saveProgress(
      activityType: 'vocabulary',
      currentIndex: _matchedLeft.length,
      totalItems: _leftWords.length,
      words: wordsData,
      earnedXp: _earnedXp,
      sessionId: _sessionId,
      difficulty: _sessionDifficulty,
      extraMetadata: {
        'matchedLeft': _matchedLeft.toList(),
        'matchedRight': _matchedRight.toList(),
        'rightOrder': _rightWords,
      },
    );
  }

  Future<void> _syncActivityCompletion() async {
    try {
      await ApiService.post('/students/activity/complete', {
        'activityTitle': 'Vocabulary Matching Challenge',
        'activityType': 'Vocabulary',
        'score': 100,
      });
    } catch (e) {
      debugPrint('Activity completion sync notice: $e');
    }
  }

  // ── Matching Logic ─────────────────────────────────────────────────────────

  void _onLeftTap(String word) {
    if (_matchedLeft.contains(word) || _isFinished) return;
    Feedback.forTap(context);
    setState(() {
      _selectedLeft = word;
      _errorLeft = null;
      _errorRight = null;
    });

    if (_selectedRight == null) {
      _setSallyMessage('Find its match!');
    }
    _checkMatch();
  }

  void _onRightTap(String word) {
    if (_matchedRight.contains(word) || _isFinished) return;
    Feedback.forTap(context);
    setState(() {
      _selectedRight = word;
      _errorLeft = null;
      _errorRight = null;
    });

    if (_selectedLeft == null) {
      _setSallyMessage('Find its match!');
    }
    _checkMatch();
  }

  void _checkMatch() {
    if (_selectedLeft != null && _selectedRight != null) {
      final expectedRight = _pairings[_selectedLeft!];

      if (expectedRight == _selectedRight) {
        // Success match!
        final matchedL = _selectedLeft!;
        final matchedR = _selectedRight!;

        setState(() {
          _matchedLeft.add(matchedL);
          _matchedRight.add(matchedR);
          _selectedLeft = null;
          _selectedRight = null;
          _earnedXp += _xpPerPair;
        });

        _triggerMascotPulse();

        if (_matchedLeft.length == _leftWords.length) {
          _setSallyMessage('Great Job!');
          setState(() {
            _isFinished = true;
          });
          // Clear active session upon full completion
          ActivityProgressService.clearProgress('vocabulary');
          _syncActivityCompletion();
        } else {
          const compliments = [
            'Great Job!',
            'Nice match!',
            'Awesome!',
            'Spot on!',
            'You got it!',
          ];
          final praise = compliments[Random().nextInt(compliments.length)];
          _setSallyMessage(praise, temporary: true);
          _persistCurrentProgress();
        }
      } else {
        // Mismatch - trigger error feedback
        final errL = _selectedLeft;
        final errR = _selectedRight;
        setState(() {
          _errorLeft = errL;
          _errorRight = errR;
          _selectedLeft = null;
          _selectedRight = null;
        });

        const tryAgainMsgs = ['Try again!', 'Almost!', 'Not quite!'];
        final retry = tryAgainMsgs[Random().nextInt(tryAgainMsgs.length)];
        _setSallyMessage(retry, temporary: true);

        // Reset error state after 750ms
        Future.delayed(const Duration(milliseconds: 750), () {
          if (mounted) {
            setState(() {
              if (_errorLeft == errL) _errorLeft = null;
              if (_errorRight == errR) _errorRight = null;
            });
          }
        });
      }
    }
  }

  // ── Help Modal ─────────────────────────────────────────────────────────────

  void _showHelpModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
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
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Iconify(
                      PhIcons.equalsBold,
                      color: Color(0xFFD97706),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'How to Play',
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
                'Tap an English word from the left column to select it.',
              ),
              _buildHelpStep(
                '2',
                'Find and tap its Filipino translation in the right column.',
              ),
              _buildHelpStep(
                '3',
                'Correct pairs will lock in green, while incorrect pairs will reset.',
              ),
              _buildHelpStep(
                '4',
                'Match all the pairs to complete the challenge and earn XP!',
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

  // ── Build UI ───────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    // Progress calculation mirrored from Pronunciation Practice:
    // When on item 1 (0 matches so far), shows 1 / total progress shaded in
    final double progress = _leftWords.isEmpty
        ? 0.0
        : ((_matchedLeft.length + 1) / _leftWords.length).clamp(0.0, 1.0);

    const leftHeader = 'ENGLISH';
    const rightHeader = 'FILIPINO';

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final double screenHeight = constraints.maxHeight;
            final double screenWidth = constraints.maxWidth;
            final bool isTablet = screenWidth > 600;

            // Responsiveness factor:
            // Exactly 1.0 on standard phones (screenHeight >= 780, e.g. Galaxy S21 Ultra, iPhones).
            // Smoothly scales down on compact devices (< 780) so nothing clips.
            final double scale = (screenHeight / 780.0).clamp(0.72, 1.0);
            final bool isCompact = screenHeight < 680;

            final double sectionHeight = 240.0 * scale;
            final double mascotHeight = 210.0 * scale;
            final double bottomPad = 50.0 * scale;
            final double cardHeight = isCompact ? 50.0 : 58.0;
            final double cardMargin = isCompact ? 8.0 : 12.0;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 540.0 : double.infinity,
                ),
                child: Column(
                  children: [
                    // ── Top Header Navigation Bar (Mirrored from Pronunciation) ────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20.0, 8.0, 20.0, 0.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Row 1: Activity Title + Actions (Help, Close)
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'VOCABULARY MATCHING',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w900,
                                    color: const Color(0xFF64748B),
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
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
                              const SizedBox(width: 14),
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
                          const SizedBox(height: 8),

                          // Row 2: Progress Indicator across the full width
                          ClipRRect(
                            borderRadius: BorderRadius.circular(100),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 6,
                              backgroundColor: const Color(0xFFE2E8F0),
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                Color(0xFF1B64D8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ── Game Instructions ────────────────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24.0, 14.0, 24.0, 4.0),
                      child: Text(
                        'Tap an English word on the left and match it with its Filipino translation',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // ── Columns Content ──────────────────────────────────────────────
                    Expanded(
                      child: _isFinished
                          ? _buildCelebrationWidget(primaryBlue)
                          : Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20.0),
                              child: Column(
                                children: [
                                  // Column Sub-headers
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8.0,
                                      vertical: 4.0,
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            leftHeader,
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                              color: const Color(0xFF3B82F6),
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Text(
                                            rightHeader,
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                              color: const Color(0xFFF59E0B),
                                              letterSpacing: 0.5,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 8),

                                  // Cards Grid / Columns (Original ListView.builder)
                                  Expanded(
                                    child: Row(
                                      children: [
                                        // Left Column
                                        Expanded(
                                          child: ListView.builder(
                                            physics: const BouncingScrollPhysics(),
                                            itemCount: _leftWords.length,
                                            itemBuilder: (context, index) {
                                              final word = _leftWords[index];
                                              final isSelected = _selectedLeft == word;
                                              final isMatched = _matchedLeft.contains(
                                                word,
                                              );
                                              final isError = _errorLeft == word;

                                              return _buildMatchCard(
                                                word: word,
                                                isSelected: isSelected,
                                                isMatched: isMatched,
                                                isError: isError,
                                                onTap: () => _onLeftTap(word),
                                                sideColor: const Color(0xFF3B82F6),
                                                height: cardHeight,
                                                marginBottom: cardMargin,
                                              );
                                            },
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        // Right Column
                                        Expanded(
                                          child: ListView.builder(
                                            physics: const BouncingScrollPhysics(),
                                            itemCount: _rightWords.length,
                                            itemBuilder: (context, index) {
                                              final word = _rightWords[index];
                                              final isSelected = _selectedRight == word;
                                              final isMatched = _matchedRight.contains(
                                                word,
                                              );
                                              final isError = _errorRight == word;

                                              return _buildMatchCard(
                                                word: word,
                                                isSelected: isSelected,
                                                isMatched: isMatched,
                                                isError: isError,
                                                onTap: () => _onRightTap(word),
                                                sideColor: const Color(0xFFF59E0B),
                                                height: cardHeight,
                                                marginBottom: cardMargin,
                                              );
                                            },
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  // Mascot & Speech Bubble Section at Bottom
                                  _buildMascotSection(
                                    sectionHeight: sectionHeight,
                                    mascotHeight: mascotHeight,
                                    bottomPadding: bottomPad,
                                    scale: scale,
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

  Widget _buildMascotSection({
    required double sectionHeight,
    required double mascotHeight,
    required double bottomPadding,
    required double scale,
  }) {
    final double bubbleWidth = (156.0 * scale).clamp(128.0, 156.0);
    final double bubbleHeight = (56.0 * scale).clamp(46.0, 56.0);
    final double bubbleLeft = (10.0 * scale).clamp(4.0, 10.0);
    final double bubbleTop = (4.0 * scale).clamp(0.0, 4.0);
    final double mascotRight = (4.0 * scale).clamp(0.0, 4.0);
    final double textFontSize = (15.5 * scale).clamp(13.5, 15.5);

    return Padding(
      padding: EdgeInsets.only(bottom: bottomPadding),
      child: SizedBox(
        height: sectionHeight,
        width: double.infinity,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // 1. Very Big Sally Sitting Mascot on bottom-right (subtle nudge left)
            Positioned(
              right: mascotRight,
              bottom: 0,
              child: AnimatedScale(
                scale: _isMascotPulsing ? 1.06 : 1.0,
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutBack,
                child: Image.asset(
                  'assets/mascot/sally_sitting.webp',
                  height: mascotHeight,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => SizedBox(
                    height: mascotHeight,
                    width: mascotHeight * 1.05,
                  ),
                ),
              ),
            ),

            // 2. Speech Bubble floating diagonally high above-left of Sally (Fixed size, subtle nudge left)
            Positioned(
              left: bubbleLeft,
              top: bubbleTop,
              child: SizedBox(
                width: bubbleWidth,
                height: bubbleHeight,
                child: _buildSpeechBubble(
                  width: bubbleWidth,
                  height: bubbleHeight,
                  fontSize: textFontSize,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpeechBubble({
    required double width,
    required double height,
    required double fontSize,
  }) {
    return CustomPaint(
      painter: _SpeechBubblePainter(
        color: Colors.white,
        borderColor: const Color(0xFF0F172A),
        borderWidth: 2.5,
        radius: 18.0,
      ),
      child: Container(
        width: width,
        height: height,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: 12.0),
        child: Text(
          _sallyMessage,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF0F172A),
            letterSpacing: -0.2,
          ),
        ),
      ),
    );
  }

  Widget _buildMatchCard({
    required String word,
    required bool isSelected,
    required bool isMatched,
    required bool isError,
    required VoidCallback onTap,
    required Color sideColor,
    double height = 58.0,
    double marginBottom = 12.0,
  }) {
    Color cardBg = Colors.white;
    Color borderColor = const Color(0xFFE2E8F0);
    Color textColor = const Color(0xFF1E293B);
    double bottomOffset = 4.0;

    if (isMatched) {
      cardBg = const Color(0xFFECFDF5);
      borderColor = const Color(0xFF10B981);
      textColor = const Color(0xFF047857);
      bottomOffset = 0.0;
    } else if (isError) {
      cardBg = const Color(0xFFFEE2E2);
      borderColor = const Color(0xFFEF4444);
      textColor = const Color(0xFFB91C1C);
      bottomOffset = 0.0;
    } else if (isSelected) {
      cardBg = sideColor.withValues(alpha: 0.08);
      borderColor = sideColor;
      textColor = sideColor;
      bottomOffset = 1.0;
    }

    return Container(
      margin: EdgeInsets.only(bottom: marginBottom),
      height: height,
      child: Stack(
        children: [
          // Tactile drop shadow
          if (!isMatched && !isError)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected
                      ? sideColor.withValues(alpha: 0.2)
                      : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 80),
            top: 0,
            bottom: bottomOffset,
            left: 0,
            right: 0,
            child: GestureDetector(
              onTap: onTap,
              child: Container(
                decoration: BoxDecoration(
                  color: cardBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: borderColor,
                    width: isSelected || isMatched || isError ? 2.0 : 1.5,
                  ),
                ),
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        word,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: textColor,
                        ),
                      ),
                    ),
                    if (isMatched) ...[
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.check_circle_rounded,
                        color: Color(0xFF10B981),
                        size: 18,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCelebrationWidget(Color primaryBlue) {
    return Center(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Sally Mascot Celebration
              Image.asset(
                'assets/mascot/sally_celebration.webp',
                height: 170,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) => const Icon(
                  Icons.workspace_premium_rounded,
                  size: 90,
                  color: Color(0xFFF59E0B),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Amazing Matcher! 🏆',
                style: GoogleFonts.inter(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You perfectly matched all the vocabulary pairs!',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 16),

              // XP Reward Badge
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBFDBFE)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.stars_rounded,
                      color: Color(0xFF1B64D8),
                      size: 24,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '+$_earnedXp XP Earned',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1B64D8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Action Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Finish Button
                  SizedBox(
                    height: 50,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFF64748B),
                        side: const BorderSide(
                          color: Color(0xFFCBD5E1),
                          width: 1.5,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                      ),
                      child: Text(
                        'Finish',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Practice Again Button
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _setupFreshSession,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryBlue,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                      ),
                      child: Text(
                        'Play Again',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SpeechBubblePainter extends CustomPainter {
  final Color color;
  final Color borderColor;
  final double borderWidth;
  final double radius;

  _SpeechBubblePainter({
    this.color = Colors.white,
    this.borderColor = const Color(0xFF0F172A),
    this.borderWidth = 2.5,
    this.radius = 18.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final r = radius;
    final w = size.width;
    final h = size.height;

    // Tail on bottom edge pointing down-right towards Sally's face
    final tailRight = (w - 20.0).clamp(r + 26.0, w - r);
    final tailTipX = (tailRight + 12.0).clamp(r + 30.0, w + 6.0);
    final tailTipY = h + 14.0;
    final tailLeft = (tailRight - 22.0).clamp(r, tailRight - 10.0);

    final path = Path();
    path.moveTo(r, 0);
    path.lineTo(w - r, 0);
    path.arcToPoint(Offset(w, r), radius: Radius.circular(r));
    path.lineTo(w, h - r);
    path.arcToPoint(Offset(w - r, h), radius: Radius.circular(r));
    path.lineTo(tailRight, h);
    path.lineTo(tailTipX, tailTipY);
    path.lineTo(tailLeft, h);
    path.lineTo(r, h);
    path.arcToPoint(Offset(0, h - r), radius: Radius.circular(r));
    path.lineTo(0, r);
    path.arcToPoint(Offset(r, 0), radius: Radius.circular(r));
    path.close();

    // Subtle drop shadow
    canvas.drawPath(
      path.shift(const Offset(0, 2)),
      Paint()
        ..color = Colors.black.withValues(alpha: 0.05)
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
  bool shouldRepaint(covariant _SpeechBubblePainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.borderColor != borderColor ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.radius != radius;
  }
}
