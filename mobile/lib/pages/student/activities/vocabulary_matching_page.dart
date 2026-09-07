import 'dart:async';
import 'dart:math';
import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/activity_progress_service.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/widgets/activity_loading_view.dart';

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
  late ConfettiController _confettiController;
  String _sessionId = '';
  int _earnedXp = 0;
  bool _isFinished = false;
  bool _isLoading = false;
  int _mistakesCount = 0;
  int _finalAccuracy = 100;
  String _celebrationMessage = 'Awesome job!';
  String _celebrationSubtitle = 'You completed the vocabulary matching practice.';

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
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _sessionDifficulty = widget.difficulty;
    _initOrResumeSession();
  }

  @override
  void dispose() {
    _sallyResetTimer?.cancel();
    _confettiController.dispose();
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



  /// Returns an encouraging, motivating compliment and subtitle tailored to how well the student performed
  Map<String, String> _getCelebrationFeedback(int accuracy) {
    final rand = Random();

    if (accuracy == 100) {
      // Flawless performance: Top-tier mastery & praise
      const compliments = [
        'Awesome job!',
        'Perfect match!',
        'Outstanding!',
        'You nailed it!',
        'Super star!',
        'Brilliant work!',
        'Incredible!',
      ];
      const subtitles = [
        'You made zero mistakes! Incredible vocabulary mastery!',
        'A flawless run! You matched all words perfectly!',
        '100% accuracy! Your vocabulary skills are top-notch!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else if (accuracy >= 80) {
      // Great performance (1-2 minor slips): Enthusiastic & encouraging
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
        'You mastered almost every pair! Keep up the great work!',
        'Great accuracy! You are building an impressive vocabulary!',
        'Solid performance! You are learning and improving fast!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else if (accuracy >= 60) {
      // Good progress (some mistakes): Uplifting progress & learning praise
      const compliments = [
        'Good progress!',
        'Nice perseverance!',
        'Keep it up!',
        'Getting stronger!',
        'Step by step!',
        'Proud of your effort!',
      ];
      const subtitles = [
        'Every mistake is a lesson learned. You are getting better!',
        'You pushed through and finished all the matches! Good job!',
        'Steady progress! Keep practicing to boost your accuracy!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else {
      // Struggled / needs practice: High empathy, growth-mindset, motivating
      const compliments = [
        'Keep practicing!',
        'Never give up!',
        'Practice pays off!',
        'You can do this!',
        'Keep learning!',
      ];
      const subtitles = [
        'Mistakes help us grow! Try once more to master these words!',
        'Great perseverance! Practice again and watch your score soar!',
        'You finished the activity! Try again to get an even higher score!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    }
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
            _mistakesCount = (saved['mistakesCount'] as int?) ?? 0;
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

  Future<void> _setupFreshSession() async {
    _sessionId = 'vocab_${DateTime.now().millisecondsSinceEpoch}';
    _mistakesCount = 0;

    setState(() => _isLoading = true);

    List<Map<String, String>> pairs = [];

    // 1. Fetch live curated pairs from the unified vocabulary_bank backend
    try {
      final res = await ApiService.get(
        '/students/vocabulary/items?difficulty=$_sessionDifficulty&limit=$_targetPairCount',
      );

      if (res.success && res.data != null && res.data['pairs'] is List) {
        final list = res.data['pairs'] as List;
        if (list.isNotEmpty) {
          pairs = list
              .map<Map<String, String>>((item) {
                final left = item['englishWord']?.toString().trim() ?? '';
                final right = item['filipinoWord']?.toString().trim() ?? '';
                return {'left': left, 'right': right};
              })
              .where((p) => p['left']!.isNotEmpty && p['right']!.isNotEmpty)
              .toList();
        }
      }
    } catch (e) {
      debugPrint('[VocabularyMatchingPage] Backend fetch notice: $e');
    }

    // 2. Offline fallback to local curated word pool if API failed or returned insufficient pairs
    if (pairs.length < _targetPairCount) {
      List<Map<String, String>> pool;
      if (_sessionDifficulty == 'easy') {
        pool = List.from(_easyPool);
      } else if (_sessionDifficulty == 'hard') {
        pool = List.from(_hardPool);
      } else {
        pool = List.from(_mediumPool);
      }
      pool.shuffle(Random());
      pairs = pool.take(_targetPairCount).toList();
    }

    final leftList = <String>[];
    final rightList = <String>[];
    final newPairings = <String, String>{};

    for (final pair in pairs) {
      final l = pair['left']!;
      final r = pair['right']!;
      leftList.add(l);
      rightList.add(r);
      newPairings[l] = r;
    }

    // Shuffle both columns independently so answers aren't aligned
    leftList.shuffle(Random());
    rightList.shuffle(Random());

    // Anti-alignment check: ensure rightList[i] != newPairings[leftList[i]]
    if (leftList.length > 1) {
      for (int i = 0; i < leftList.length; i++) {
        if (rightList[i] == newPairings[leftList[i]]) {
          final swapIdx = (i + 1) % leftList.length;
          final temp = rightList[i];
          rightList[i] = rightList[swapIdx];
          rightList[swapIdx] = temp;
        }
      }
    }

    _confettiController.stop();

    if (!mounted) return;
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
      _isLoading = false;
      _sallyMessage = 'Match the words!';
      _finalAccuracy = 100;
      _celebrationMessage = 'Awesome job!';
      _celebrationSubtitle = 'You completed the vocabulary matching practice.';
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
        'mistakesCount': _mistakesCount,
      },
    );
  }

  Future<void> _syncActivityCompletion() async {
    final totalPairs = _leftWords.length;
    final int score = _mistakesCount == 0
        ? 100
        : ((totalPairs / (totalPairs + _mistakesCount)) * 100).round().clamp(50, 99);

    final itemsDetail = _pairings.entries.map((entry) {
      return {
        'englishWord': entry.key,
        'filipinoWord': entry.value,
        'isMatched': true,
      };
    }).toList();

    try {
      debugPrint('[VocabularyMatching] Submitting attempt: session=$_sessionId, diff=$_sessionDifficulty, pairs=$totalPairs, score=$score, xp=$_earnedXp');
      final res = await ApiService.post('/students/vocabulary/attempt', {
        'sessionId': _sessionId,
        'difficulty': _sessionDifficulty,
        'totalPairs': totalPairs,
        'mistakesCount': _mistakesCount,
        'score': score,
        'xpEarned': _earnedXp,
        'itemsDetail': itemsDetail,
      });

      debugPrint('[VocabularyMatching] Attempt response: success=${res.success}, statusCode=${res.statusCode}, error=${res.error}, data=${res.data}');

      if (res.success && res.data != null && res.data['newBadgeUnlocked'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.stars_rounded, color: Color(0xFFFBBF24)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Badge Unlocked: I\'m a star! ⭐',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF0F172A),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('[VocabularyMatching] Attempt submission error: $e');
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

        if (_matchedLeft.length == _leftWords.length) {
          final totalPairs = _leftWords.length;
          final int score = _mistakesCount == 0
              ? 100
              : ((totalPairs / (totalPairs + _mistakesCount)) * 100).round().clamp(50, 99);
          final feedback = _getCelebrationFeedback(score);

          _setSallyMessage('Great Job!');
          setState(() {
            _finalAccuracy = score;
            _celebrationMessage = feedback['compliment'] ?? 'Awesome job!';
            _celebrationSubtitle = feedback['subtitle'] ?? 'You completed the vocabulary matching practice.';
            _isFinished = true;
          });
          _confettiController.play();
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
        _mistakesCount++;
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

    // ── Unified Loading state ──────────────────────────────────────────────
    if (_isLoading) {
      return ActivityLoadingView(
        activityTitle: 'Vocabulary Matching',
        primaryColor: primaryBlue,
        language: 'en',
        onClose: () => Navigator.pop(context),
      );
    }

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
            final int pairCount = _leftWords.length;
            final bool isSixPairs = pairCount >= 6;

            // Responsiveness factor:
            // Exactly 1.0 on standard phones (screenHeight >= 780, e.g. Galaxy S21 Ultra, iPhones).
            // Smoothly scales down on compact devices (< 780) so nothing clips.
            final double scale = (screenHeight / 780.0).clamp(0.72, 1.0);
            final bool isCompact = screenHeight < 680;

            // Mascot & speech bubble remain in their exact desired original scale and position
            final double sectionHeight = 240.0 * scale;
            final double mascotHeight = 210.0 * scale;
            final double bottomPad = 50.0 * scale;

            // Adjusted to ~0.5 size smaller (52px vs 58px) with 9px margin
            final double targetCardMargin = isSixPairs ? 9.0 : (isCompact ? 8.0 : 12.0);
            final double cardHeight = isSixPairs ? 52.0 : (isCompact ? 50.0 : 58.0);
            final double cardMargin = targetCardMargin;
            final double cardFontSize = isSixPairs ? 15.0 : 16.0;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 540.0 : double.infinity,
                ),
                child: _isFinished
                    ? _buildCelebrationWidget(primaryBlue)
                    : Column(
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
                            child: _isLoading
                                ? const Center(
                                    child: CircularProgressIndicator(
                                      color: primaryBlue,
                                    ),
                                  )
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

                                  // Cards Grid / Columns (Non-scrollable when fitting)
                                  Expanded(
                                    child: Row(
                                      children: [
                                        // Left Column
                                        Expanded(
                                          child: ListView.builder(
                                            padding: EdgeInsets.zero,
                                            physics: isSixPairs
                                                ? const NeverScrollableScrollPhysics()
                                                : const BouncingScrollPhysics(),
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
                                                fontSize: cardFontSize,
                                              );
                                            },
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        // Right Column
                                        Expanded(
                                          child: ListView.builder(
                                            padding: EdgeInsets.zero,
                                            physics: isSixPairs
                                                ? const NeverScrollableScrollPhysics()
                                                : const BouncingScrollPhysics(),
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
                                                fontSize: cardFontSize,
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
    double fontSize = 16.0,
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
                        maxLines: 2,
                        softWrap: true,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: word.length > 13 ? (fontSize - 2.0).clamp(11.0, 16.0) : fontSize,
                          fontWeight: FontWeight.w800,
                          color: textColor,
                          height: 1.15,
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
                    onPressed: _setupFreshSession,
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
