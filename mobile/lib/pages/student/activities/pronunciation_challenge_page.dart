import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';

class PronunciationChallengePage extends StatefulWidget {
  const PronunciationChallengePage({super.key});

  @override
  State<PronunciationChallengePage> createState() => _PronunciationChallengePageState();
}

class _PronunciationChallengePageState extends State<PronunciationChallengePage> {
  int _currentWordIndex = 0;
  bool _isRecording = false;
  bool _showResult = false;
  int _accuracyScore = 0;
  List<double> _waveform = [0.1, 0.1, 0.1, 0.1, 0.1];
  Timer? _waveformTimer;
  String? _selectedSyllable;

  bool _showTextInstructions = true;
  bool _showVisualInstructions = false;
  int _activeSlideIndex = 0;
  late PageController _pageController;

  final List<Map<String, String>> _instructionSlides = [
    {
      'title': 'Listen',
      'description': 'Listen carefully to the word or sentence.',
      'image': 'assets/mascot/sally_listening.webp',
    },
    {
      'title': 'Tap the record',
      'description': 'Tap the Record button and read it aloud clearly.',
      'image': 'assets/mascot/sally_speaking.webp',
    },
    {
      'title': 'Give it time',
      'description': 'The system will analyze your pronunciation and give instant feedback.',
      'image': 'assets/mascot/sally_sitting.webp',
    },
    {
      'title': 'Review',
      'description': 'Review your score and try again to improve your pronunciation.',
      'image': 'assets/mascot/sally_reading.webp',
    },
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  final List<Map<String, dynamic>> _words = [
    {
      'word': 'Bahaghari',
      'syllables': ['Ba', 'hag', 'ha', 'ri'],
      'definition': 'Makulay na guhit sa langit pagkatapos ng ulan.',
      'drawing': 'rainbow',
    },
    {
      'word': 'Kaibigan',
      'syllables': ['Ka', 'i', 'bi', 'gan'],
      'definition': 'Isang tao na maaari mong pagkatiwalaan at makasama.',
      'drawing': 'friends',
    },
    {
      'word': 'Bulaklak',
      'syllables': ['Bu', 'lak', 'lak'],
      'definition': 'Bahagi ng halaman na makulay at mabangong tignan.',
      'drawing': 'flower',
    }
  ];

  void _startRecording() {
    Feedback.forTap(context);
    setState(() {
      _isRecording = true;
      _showResult = false;
      _selectedSyllable = null;
    });

    int ticks = 0;
    final random = Random();
    _waveformTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (ticks > 25) {
        timer.cancel();
        setState(() {
          _isRecording = false;
          _showResult = true;
          _accuracyScore = 85 + random.nextInt(15);
        });
        return;
      }
      ticks++;
      setState(() {
        _waveform = List.generate(8, (_) => 0.1 + random.nextDouble() * 0.85);
      });
    });
  }

  void _nextWord() {
    Feedback.forTap(context);
    setState(() {
      _currentWordIndex = (_currentWordIndex + 1) % _words.length;
      _showResult = false;
      _isRecording = false;
      _selectedSyllable = null;
    });
  }

  void _playSyllableAudio(String syllable) {
    Feedback.forTap(context);
    setState(() {
      _selectedSyllable = syllable;
    });
    // Visual auto-reset after 500ms
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _selectedSyllable = null;
        });
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _waveformTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_showTextInstructions) {
      return _buildTextInstructionsView();
    }
    if (_showVisualInstructions) {
      return _buildInstructionsView();
    }

    final currentWordData = _words[_currentWordIndex];
    final String wordText = currentWordData['word'];
    final List<String> syllables = List<String>.from(currentWordData['syllables']);
    final String definition = currentWordData['definition'];
    final String drawingType = currentWordData['drawing'];

    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFFFDF9);

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top Header Row ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Row(
                children: [
                  // Candy-like progress bar
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(100),
                      child: Container(
                        height: 16,
                        color: const Color(0xFFE2E8F0),
                        child: Stack(
                          children: [
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final double progress = (_currentWordIndex + 1) / _words.length;
                                return AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  width: constraints.maxWidth * progress,
                                  height: double.infinity,
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF4ADE80), Color(0xFF22C55E)],
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                    ),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Word counter bubble
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(color: const Color(0xFFFDE68A), width: 2),
                    ),
                    child: Text(
                      '${_currentWordIndex + 1}/${_words.length}',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFFB45309),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Playful close button
                  GestureDetector(
                    onTap: () {
                      Feedback.forTap(context);
                      Navigator.pop(context);
                    },
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFE2E8F0), width: 2),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0xFFCBD5E1),
                            offset: Offset(0, 2),
                            blurRadius: 0,
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.close_rounded,
                          color: Color(0xFF64748B),
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Main Content Area ──────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 12),

                    // Word Banner
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFFDE68A), width: 3),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0xFFFCD34D),
                            offset: Offset(0, 4),
                            blurRadius: 0,
                          ),
                        ],
                      ),
                      child: Text(
                        wordText,
                        style: GoogleFonts.inter(
                          fontSize: 34,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF78350F), // Rich warm brown text
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    // Definition subtext
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Text(
                        definition,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF64748B),
                          height: 1.4,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Illustration Box (Tactile Border + Gradient + Sally Speaking)
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFE0F2FE), Color(0xFFBAE6FD)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                        borderRadius: BorderRadius.circular(32),
                        border: Border.all(color: const Color(0xFF7DD3FC), width: 4),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0xFF38BDF8),
                            offset: Offset(0, 6),
                            blurRadius: 0,
                          ),
                        ],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Playful background circle decoration
                          Positioned(
                            top: -20,
                            right: -20,
                            child: Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.25),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: -30,
                            left: -10,
                            child: Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.2),
                              ),
                            ),
                          ),
                          // Vector Rainbow / Flowers based on drawing type
                          if (drawingType == 'rainbow')
                            Positioned(
                              top: 20,
                              child: Container(
                                width: 220,
                                height: 110,
                                decoration: BoxDecoration(
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 14),
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(110)),
                                ),
                              ),
                            ),
                          // Sally mascot illustration
                          Positioned(
                            bottom: 12,
                            child: Image.asset(
                              'assets/mascot/sally_speaking.webp',
                              height: 140,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.face_retouching_natural_rounded, size: 80, color: primaryBlue),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Syllables Container
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFFDE68A), width: 3),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0xFFF59E0B),
                            offset: Offset(0, 4),
                            blurRadius: 0,
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: syllables.map((syllable) {
                          final isSelected = _selectedSyllable == syllable;
                          final index = syllables.indexOf(syllable);
                          final List<Color> blockColors = [
                            const Color(0xFFF97316), // Orange
                            const Color(0xFF22C55E), // Green
                            const Color(0xFF3B82F6), // Blue
                            const Color(0xFFA855F7), // Purple
                          ];
                          final blockColor = blockColors[index % blockColors.length];

                          return GestureDetector(
                            onTap: () => _playSyllableAudio(syllable),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 100),
                              margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected ? blockColor : const Color(0xFFE2E8F0),
                                  width: 3,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: isSelected ? blockColor.withValues(alpha: 0.4) : const Color(0xFFCBD5E1),
                                    offset: isSelected ? const Offset(0, 2) : const Offset(0, 5),
                                    blurRadius: 0,
                                  ),
                                ],
                              ),
                              transform: isSelected 
                                  ? Matrix4.translationValues(0.0, 3.0, 0.0) 
                                  : Matrix4.identity(),
                              child: Text(
                                syllable,
                                style: GoogleFonts.inter(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: isSelected ? blockColor : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Recording & Result States
                    if (_showResult) ...[
                      // Result Score display
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(32),
                          border: Border.all(
                            color: _accuracyScore >= 60 ? const Color(0xFF86EFAC) : const Color(0xFFFED7AA),
                            width: 4,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: _accuracyScore >= 60 ? const Color(0xFFDCFCE7) : const Color(0xFFFFEDD5),
                              offset: const Offset(0, 6),
                              blurRadius: 0,
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Text(
                              _accuracyScore >= 85
                                  ? 'Perfect!'
                                  : (_accuracyScore >= 60 ? 'Great Job!' : 'Nice Try!'),
                              style: GoogleFonts.inter(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: _accuracyScore >= 60 ? const Color(0xFF15803D) : const Color(0xFFC2410C),
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Stars Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(3, (index) {
                                final int starsCount = _accuracyScore >= 85
                                    ? 3
                                    : (_accuracyScore >= 60 ? 2 : 1);
                                final isLit = index < starsCount;
                                return Icon(
                                  Icons.star_rounded,
                                  color: isLit ? const Color(0xFFFBBF24) : const Color(0xFFE2E8F0),
                                  size: 40,
                                );
                              }),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              '$_accuracyScore% Match!',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF475569),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 52,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(100),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0xFFCBD5E1),
                                    offset: Offset(0, 4),
                                    blurRadius: 0,
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    _showResult = false;
                                  });
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: const Color(0xFF475569),
                                  elevation: 0,
                                  side: const BorderSide(color: Color(0xFFE2E8F0), width: 2),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                                ),
                                child: Text(
                                  'Try Again',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Container(
                              height: 52,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(100),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0xFF15803D),
                                    offset: Offset(0, 4),
                                    blurRadius: 0,
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: _nextWord,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF22C55E),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                                ),
                                child: Text(
                                  'Next',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      // Guide bubble & wave
                      SizedBox(
                        height: 54,
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 200),
                          child: _isRecording
                              ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: _waveform.map((val) {
                                    return AnimatedContainer(
                                      duration: const Duration(milliseconds: 100),
                                      margin: const EdgeInsets.symmetric(horizontal: 2.5),
                                      width: 6,
                                      height: 10 + (val * 40),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF3B82F6),
                                        borderRadius: BorderRadius.circular(100),
                                      ),
                                    );
                                  }).toList(),
                                )
                              : Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: const Color(0xFFBFDBFE), width: 2),
                                  ),
                                  child: Text(
                                    'Tap the mic and speak!',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF1E40AF),
                                    ),
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Large mic trigger button (Pulsing 3D effect)
                      Center(
                        child: GestureDetector(
                          onTap: _isRecording ? null : _startRecording,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: 96,
                            height: 96,
                            decoration: BoxDecoration(
                              color: _isRecording ? const Color(0xFFEF4444) : const Color(0xFF3B82F6),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: _isRecording ? const Color(0xFFFCA5A5) : const Color(0xFF93C5FD),
                                width: 4,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: _isRecording ? const Color(0xFFB91C1C) : const Color(0xFF1D4ED8),
                                  offset: const Offset(0, 6),
                                  blurRadius: 0,
                                ),
                              ],
                            ),
                            child: Center(
                              child: Icon(
                                _isRecording ? Icons.stop_rounded : Icons.mic_rounded,
                                color: Colors.white,
                                size: 44,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInstructionsView() {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: Column(
          children: [
            // Top Close Button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.only(top: 8.0, right: 8.0),
                child: IconButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  icon: const Icon(
                    Icons.close_rounded,
                    size: 28,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ),
            // PageView Content
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _activeSlideIndex = index;
                  });
                },
                itemCount: _instructionSlides.length,
                itemBuilder: (context, index) {
                  final slide = _instructionSlides[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Mascot Image
                        Image.asset(
                          slide['image']!,
                          height: 220,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(Icons.image_not_supported_rounded, size: 80, color: Colors.grey),
                        ),
                        const SizedBox(height: 40),
                        // Title
                        Text(
                          slide['title']!,
                          style: GoogleFonts.inter(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Description
                        Text(
                          slide['description']!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  );
                },
              ),
            ),
            // Bottom Action Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Skip button on the left
                  SizedBox(
                    width: 60,
                    child: _activeSlideIndex < _instructionSlides.length - 1
                        ? TextButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const PronunciationChallengeMicrophoneTestPage(),
                                ),
                              ).then((value) {
                                if (value == true) {
                                  setState(() {
                                    _showTextInstructions = false;
                                    _showVisualInstructions = false;
                                  });
                                }
                              });
                            },
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF64748B),
                              padding: EdgeInsets.zero,
                            ),
                            child: Text(
                              'Skip',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                  // Dots Indicator in the center
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_instructionSlides.length, (index) {
                      final isActive = index == _activeSlideIndex;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 4.0),
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isActive ? primaryBlue : const Color(0xFFCBD5E1),
                        ),
                      );
                    }),
                  ),
                  // Next / Start Button on the right
                  Container(
                    width: 80,
                    height: 48,
                    alignment: Alignment.centerRight,
                    child: _activeSlideIndex < _instructionSlides.length - 1
                        ? InkWell(
                            onTap: () {
                              _pageController.nextPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            },
                            borderRadius: BorderRadius.circular(100),
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: primaryBlue,
                              ),
                              child: const Icon(
                                Icons.arrow_forward_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          )
                        : ElevatedButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const PronunciationChallengeMicrophoneTestPage(),
                                ),
                              ).then((value) {
                                if (value == true) {
                                  setState(() {
                                    _showTextInstructions = false;
                                    _showVisualInstructions = false;
                                  });
                                }
                              });
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF10B981),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(100),
                              ),
                            ),
                            child: Text(
                              'Start',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextInstructionsView() {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    final instructions = [
      'Listen carefully to the word or sentence.',
      'Tap the **Record button** and read it aloud clearly.',
      'The system will analyze your pronunciation and give instant feedback.',
      'Review your score and try again to improve your pronunciation.',
      'Words may appear with spacing or color-coded syllables to help with pronunciation.',
    ];

    // Alternating bright child-friendly colors for badges
    final List<Map<String, Color>> badgeColors = [
      {'bg': const Color(0xFFFEF3C7), 'text': const Color(0xFFD97706)}, // Amber/Yellow
      {'bg': const Color(0xFFDBEAFE), 'text': const Color(0xFF1D4ED8)}, // Blue
      {'bg': const Color(0xFFD1FAE5), 'text': const Color(0xFF059669)}, // Green
      {'bg': const Color(0xFFFFE4E6), 'text': const Color(0xFFE11D48)}, // Rose/Red
      {'bg': const Color(0xFFF3E8FF), 'text': const Color(0xFF9333EA)}, // Purple
    ];

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: Column(
          children: [
            // Top Close Button (stays at the top right, unchanged position)
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.only(top: 8.0, right: 8.0),
                child: IconButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  icon: const Icon(
                    Icons.close_rounded,
                    size: 28,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ),
            
            // Middle Content: Title, mascot and instructions card list
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Mascot Image & Title grouped together, moved lower to the middle
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'How to Play!',
                                  style: GoogleFonts.inter(
                                    fontSize: 28,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.black,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Follow these simple steps:',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Image.asset(
                            'assets/mascot/sally_standing.webp',
                            height: 80,
                            fit: BoxFit.contain,
                            errorBuilder: (context, error, stackTrace) =>
                                const Icon(Icons.star_rounded, size: 40, color: Colors.amber),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      ...List.generate(instructions.length, (index) {
                        final itemText = instructions[index];
                        final colors = badgeColors[index % badgeColors.length];
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 14.0),
                          padding: const EdgeInsets.all(14.0),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFE2E8F0),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 6,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Styled Colorful Number Badge
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: colors['bg'],
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  '${index + 1}',
                                  style: GoogleFonts.inter(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w900,
                                    color: colors['text'],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              // Styled Text
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 4.0),
                                  child: _buildRichInstructionText(itemText),
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
            ),
            
            // Bottom Action Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(100),
                    boxShadow: [
                      BoxShadow(
                        color: primaryBlue.withValues(alpha: 0.15),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _showTextInstructions = false;
                        _showVisualInstructions = true;
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                    child: Text(
                      'Got It! Let\'s Go',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRichInstructionText(String text) {
    final parts = text.split('**');
    final List<TextSpan> spans = [];

    for (int i = 0; i < parts.length; i++) {
      final isBold = i % 2 == 1;
      spans.add(
        TextSpan(
          text: parts[i],
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: isBold ? Colors.black : const Color(0xFF334155),
            height: 1.4,
          ),
        ),
      );
    }

    return RichText(
      text: TextSpan(children: spans),
    );
  }
}

class PronunciationChallengeMicrophoneTestPage extends StatefulWidget {
  const PronunciationChallengeMicrophoneTestPage({super.key});

  @override
  State<PronunciationChallengeMicrophoneTestPage> createState() => _PronunciationChallengeMicrophoneTestPageState();
}

class _PronunciationChallengeMicrophoneTestPageState extends State<PronunciationChallengeMicrophoneTestPage> with SingleTickerProviderStateMixin {
  String _testState = 'idle';
  int _countdown = 4;
  Timer? _countdownTimer;
  Timer? _audioTimer;
  double _audioLevel = 0.0;
  final Random _random = Random();
  bool _simulateFailure = false;
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

    _audioTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (mounted) {
        setState(() {
          _audioLevel = 0.15 + _random.nextDouble() * 0.70;
        });
      }
    });

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
              _audioLevel = 0.50;
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
                                  Navigator.pop(context, false);
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
                                  Image.asset(
                                    'assets/mascot/sally_speaking.webp',
                                    height: mascotHeight,
                                    fit: BoxFit.contain,
                                    errorBuilder: (context, error, stackTrace) =>
                                        const Icon(Icons.mic_rounded, size: 80, color: Colors.grey),
                                  ),
                                  const SizedBox(height: 24),
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
                            if (_testState == 'success')
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12.0),
                                child: Container(
                                  width: double.infinity,
                                  height: 56,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(100),
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
                                      Navigator.pop(context, true);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF10B981),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(100),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Proceed to Challenge',
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
                                    borderRadius: BorderRadius.circular(100),
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
                                      Navigator.pop(context, false);
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFEF4444),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(100),
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
