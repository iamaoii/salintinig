import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';

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

  @override
  void initState() {
    super.initState();
    _loadSentence();
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
      });
    }
  }

  void _tryAgain() {
    Feedback.forTap(context);
    _loadSentence();
  }

  void _nextSentence() {
    Feedback.forTap(context);
    setState(() {
      _currentIndex = (_currentIndex + 1) % _sentences.length;
    });
    _loadSentence();
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

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
}
