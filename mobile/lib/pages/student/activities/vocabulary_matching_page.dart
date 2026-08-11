import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/services/api_service.dart';

class VocabularyMatchingPage extends StatefulWidget {
  const VocabularyMatchingPage({super.key});

  @override
  State<VocabularyMatchingPage> createState() => _VocabularyMatchingPageState();
}

class _VocabularyMatchingPageState extends State<VocabularyMatchingPage> {
  Future<void> _syncActivityCompletion(String title) async {
    try {
      await ApiService.post('/api/admin/students/activity/complete', {
        'activityTitle': title,
        'activityType': 'Vocabulary',
        'score': 100,
      });
    } catch (e) {
      debugPrint('Activity completion notice: $e');
    }
  }
  final List<String> _englishWords = ['Dog', 'Cat', 'House', 'Water', 'Sun'];
  final List<String> _filipinoWords = ['Bahay', 'Tubig', 'Araw', 'Aso', 'Pusa'];

  // Correct pairings mapping
  final Map<String, String> _pairings = {
    'Dog': 'Aso',
    'Cat': 'Pusa',
    'House': 'Bahay',
    'Water': 'Tubig',
    'Sun': 'Araw',
  };

  // Game States
  String? _selectedEnglish;
  String? _selectedFilipino;
  final Set<String> _matchedEnglish = {};
  final Set<String> _matchedFilipino = {};
  
  // Temporary error states for visual animations
  String? _errorEnglish;
  String? _errorFilipino;

  bool _isFinished = false;

  void _onEnglishTap(String word) {
    if (_matchedEnglish.contains(word) || _isFinished) return;
    Feedback.forTap(context);
    setState(() {
      _selectedEnglish = word;
      _errorEnglish = null;
      _errorFilipino = null;
      _checkMatch();
    });
  }

  void _onFilipinoTap(String word) {
    if (_matchedFilipino.contains(word) || _isFinished) return;
    Feedback.forTap(context);
    setState(() {
      _selectedFilipino = word;
      _errorEnglish = null;
      _errorFilipino = null;
      _checkMatch();
    });
  }

  void _checkMatch() {
    if (_selectedEnglish != null && _selectedFilipino != null) {
      final expectedFilipino = _pairings[_selectedEnglish!];
      if (expectedFilipino == _selectedFilipino) {
        // Success match!
        setState(() {
          _matchedEnglish.add(_selectedEnglish!);
          _matchedFilipino.add(_selectedFilipino!);
          _selectedEnglish = null;
          _selectedFilipino = null;
        });

        if (_matchedEnglish.length == _englishWords.length) {
          setState(() {
            _isFinished = true;
          });
          _syncActivityCompletion('Vocabulary Matching Challenge');
        }
      } else {
        // Mismatch - trigger temporary error states
        final errEng = _selectedEnglish;
        final errFil = _selectedFilipino;
        setState(() {
          _errorEnglish = errEng;
          _errorFilipino = errFil;
          _selectedEnglish = null;
          _selectedFilipino = null;
        });

        // Clear error colors after 800ms
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            setState(() {
              if (_errorEnglish == errEng) _errorEnglish = null;
              if (_errorFilipino == errFil) _errorFilipino = null;
            });
          }
        });
      }
    }
  }

  void _resetGame() {
    Feedback.forTap(context);
    setState(() {
      _matchedEnglish.clear();
      _matchedFilipino.clear();
      _selectedEnglish = null;
      _selectedFilipino = null;
      _errorEnglish = null;
      _errorFilipino = null;
      _isFinished = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    // Calculate progress fraction
    final double progress = _matchedEnglish.length / _englishWords.length;

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
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'MATCH THE TRANSLATION',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(100),
                          child: LinearProgressIndicator(
                            value: progress,
                            minHeight: 8,
                            backgroundColor: const Color(0xFFE2E8F0),
                            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  // Close Button Right
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

            // ── Game Instructions ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
              child: Text(
                'Match each English word with its correct Filipino translation',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // ── Columns Content ────────────────────────────────────────────────
            Expanded(
              child: _isFinished
                  ? _buildCelebrationWidget(primaryBlue)
                  : Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Row(
                        children: [
                          // English Column
                          Expanded(
                            child: ListView.builder(
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _englishWords.length,
                              itemBuilder: (context, index) {
                                final word = _englishWords[index];
                                final isSelected = _selectedEnglish == word;
                                final isMatched = _matchedEnglish.contains(word);
                                final isError = _errorEnglish == word;

                                return _buildMatchCard(
                                  word: word,
                                  isSelected: isSelected,
                                  isMatched: isMatched,
                                  isError: isError,
                                  onTap: () => _onEnglishTap(word),
                                  sideColor: const Color(0xFF3B82F6),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 16),
                          // Filipino Column
                          Expanded(
                            child: ListView.builder(
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _filipinoWords.length,
                              itemBuilder: (context, index) {
                                final word = _filipinoWords[index];
                                final isSelected = _selectedFilipino == word;
                                final isMatched = _matchedFilipino.contains(word);
                                final isError = _errorFilipino == word;

                                return _buildMatchCard(
                                  word: word,
                                  isSelected: isSelected,
                                  isMatched: isMatched,
                                  isError: isError,
                                  onTap: () => _onFilipinoTap(word),
                                  sideColor: const Color(0xFFF59E0B),
                                );
                              },
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

  Widget _buildMatchCard({
    required String word,
    required bool isSelected,
    required bool isMatched,
    required bool isError,
    required VoidCallback onTap,
    required Color sideColor,
  }) {
    Color cardBg = Colors.white;
    Color borderColor = const Color(0xFFE2E8F0);
    Color textColor = Colors.black;
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
      cardBg = sideColor.withValues(alpha: 0.1);
      borderColor = sideColor;
      textColor = sideColor;
      bottomOffset = 1.0;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      height: 62,
      child: Stack(
        children: [
          // Dynamic shadow base to create a Duolingo tactile feel
          if (!isMatched && !isError)
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected ? sideColor.withValues(alpha: 0.2) : const Color(0xFFE2E8F0),
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
                  border: Border.all(color: borderColor, width: 2),
                ),
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      word,
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: textColor,
                      ),
                    ),
                    if (isMatched) ...[
                      const SizedBox(width: 8),
                      const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
                    ]
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
                height: 180,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) =>
                    const Icon(Icons.workspace_premium_rounded, size: 100, color: Color(0xFFF59E0B)),
              ),
              const SizedBox(height: 24),
              Text(
                'Amazing Matcher! 🏆',
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'You perfectly matched all the vocabulary words and earned +5 Stars!',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: 200,
                height: 52,
                child: ElevatedButton(
                  onPressed: _resetGame,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Text(
                    'Practice Again',
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
