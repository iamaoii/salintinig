import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';
import 'package:salintinig/pages/student/library/side_quests_page.dart';

class ActivitiesPage extends StatefulWidget {
  const ActivitiesPage({super.key});

  @override
  State<ActivitiesPage> createState() => _ActivitiesPageState();
}

class _ActivitiesPageState extends State<ActivitiesPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Interactive state for games
  final List<String> _practiceWords = [
    "Adventure",
    "Brilliant",
    "Excited",
    "Wonderful",
    "Curious",
    "Delicious",
    "Generous",
    "Celebrate"
  ];
  int _currentWordIndex = 0;
  bool _isRecording = false;
  bool _showResult = false;
  int _simulatedScore = 0;
  List<double> _gameWaveform = [0.1, 0.1, 0.1, 0.1, 0.1];
  Timer? _gameMicTimer;

  void _nextWord() {
    setState(() {
      _currentWordIndex = (_currentWordIndex + 1) % _practiceWords.length;
      _showResult = false;
      _isRecording = false;
    });
  }

  void _startListeningSim(StateSetter setModalState) {
    setModalState(() {
      _isRecording = true;
      _showResult = false;
    });

    int count = 0;
    final random = Random();
    _gameMicTimer = Timer.periodic(const Duration(milliseconds: 120), (timer) {
      if (!mounted || count > 20) {
        timer.cancel();
        setModalState(() {
          _isRecording = false;
          _showResult = true;
          _simulatedScore = 85 + random.nextInt(15);
        });
        return;
      }
      count++;
      setModalState(() {
        _gameWaveform = List.generate(5, (_) => 0.15 + random.nextDouble() * 0.75);
      });
    });
  }

  // Word Arena / Pronunciation Game Bottom Sheet
  void _openPronunciationGame() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final word = _practiceWords[_currentWordIndex];
            const primaryBlue = Color(0xFF1B64D8);
            const textGray = Color(0xFF71717A);

            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Iconify(
                            PhIcons.userSoundBold,
                            color: primaryBlue,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Pronunciation Challenge',
                            style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _gameMicTimer?.cancel();
                          Navigator.pop(context);
                        },
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  const SizedBox(height: 12),
                  Center(
                    child: Text(
                      'SAY THIS WORD ALOUD:',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: textGray,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: Text(
                      word,
                      style: GoogleFonts.inter(
                        fontSize: 36,
                        fontWeight: FontWeight.w900,
                        color: primaryBlue,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Mic / Recording states
                  if (!_showResult && !_isRecording) ...[
                    Center(
                      child: GestureDetector(
                        onTap: () => _startListeningSim(setModalState),
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: primaryBlue,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: primaryBlue.withValues(alpha: 0.3),
                                blurRadius: 16,
                                spreadRadius: 2,
                              )
                            ],
                          ),
                          child: const Icon(Icons.mic, color: Colors.white, size: 36),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: Text(
                        'Tap to start speaking',
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: textGray),
                      ),
                    ),
                  ] else if (_isRecording) ...[
                    Center(
                      child: Container(
                        height: 80,
                        alignment: Alignment.center,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: _gameWaveform.map((heightVal) {
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 100),
                              width: 6,
                              height: 12 + (48 * heightVal),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              decoration: BoxDecoration(
                                color: primaryBlue,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Center(
                      child: Text(
                        'Listening... Speak now!',
                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: primaryBlue),
                      ),
                    ),
                  ] else if (_showResult) ...[
                    Center(
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Color(0xFFE8F5E9),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.stars_rounded, color: Color(0xFF00A859), size: 48),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Great Job! 🎉',
                            style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w800, color: const Color(0xFF00A859)),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Accuracy Score: $_simulatedScore%',
                            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.black),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'You earned +10 Stars!',
                            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: textGray),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              setModalState(() {
                                _showResult = false;
                              });
                            },
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text('Retry', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => setModalState(() => _nextWord()),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryBlue,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: Text('Next Word', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softCreamBg,
      drawer: StudentSidebarDrawer(
        currentIndex: 3, // Activities index
        onItemSelected: (index) {
          if (index == 0) {
            Navigator.pop(context);
          } else if (index == 1) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const PhilIriAssessmentPage()),
            );
          } else if (index == 2) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const LibraryPage()),
            );
          } else if (index != 3) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Navigation to item $index tapped.', style: GoogleFonts.inter()),
                duration: const Duration(seconds: 1),
              ),
            );
          }
        },
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity != null && details.primaryVelocity! > 200) {
            _scaffoldKey.currentState?.openDrawer();
          }
        },
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isTablet = constraints.maxWidth > 600;

              return Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: isTablet ? 520 : double.infinity,
                  ),
                  child: Column(
                    children: [
                      // ── Header Row ──────────────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Hamburger Menu Icon (triggers Drawer)
                            IconButton(
                              onPressed: () {
                                _scaffoldKey.currentState?.openDrawer();
                              },
                              icon: const Iconify(
                                Ph.list,
                                size: 28,
                                color: Colors.black,
                              ),
                            ),
                            // Center Title
                            Text(
                              'Activities',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            // Symmetrical spacer to center the title
                            const SizedBox(width: 48),
                          ],
                        ),
                      ),

                      // ── Scrollable Body ─────────────────────────────────────
                      Expanded(
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const SizedBox(height: 8),

                              // ── Section 1: Class Activities ─────────────────────
                              _buildSectionHeader('Class Activities', PhIcons.flagPennantBold),
                              const SizedBox(height: 12),

                              // Card 1: Pronunciation Challenge
                              _buildClassActivityCard(
                                title: '[ACTIVITY 1] Pronunciation Challenge',
                                isOptional: true,
                                isDone: false,
                                iconSvg: PhIcons.userSoundBold,
                                circleColor: const Color(0xFFDBEAFE),
                                iconColor: const Color(0xFF1B64D8),
                                onTap: _openPronunciationGame,
                              ),

                              // Card 2: Sentence Building
                              _buildClassActivityCard(
                                title: '[ACTIVITY 3] Sentence Building',
                                isOptional: true,
                                isDone: false,
                                iconSvg: PhIcons.hammerBold,
                                circleColor: const Color(0xFFD1FAE5),
                                iconColor: const Color(0xFF10B981),
                                onTap: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Sentence Building game coming soon!')),
                                  );
                                },
                              ),

                              // Card 3: Vocabulary Challenge (Done / Active style)
                              _buildClassActivityCard(
                                title: '[ACTIVITY 2] Vocabulary Challenge',
                                isOptional: false,
                                isDone: true,
                                iconSvg: PhIcons.equalsBold,
                                circleColor: const Color(0xFFFEF3C7),
                                iconColor: const Color(0xFFF59E0B),
                                onTap: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: Text('Vocabulary Challenge result: 92% Correct!')),
                                  );
                                },
                              ),

                              const SizedBox(height: 28),

                              // ── Section 2: Try me! ──────────────────────────────
                              _buildSectionHeader('Try me!', PhIcons.puzzlePieceRegular),
                              const SizedBox(height: 12),

                              Row(
                                children: [
                                  Expanded(
                                    child: _buildTryMeCard(
                                      title: 'Pronounciation\nChallenge',
                                      iconSvg: PhIcons.userSoundBold,
                                      circleColor: const Color(0xFFDBEAFE),
                                      iconColor: const Color(0xFF1B64D8),
                                      onTap: _openPronunciationGame,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _buildTryMeCard(
                                      title: 'Vocabulary\nMatching',
                                      iconSvg: PhIcons.equalsBold,
                                      circleColor: const Color(0xFFFEF3C7),
                                      iconColor: const Color(0xFFF59E0B),
                                      onTap: () {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Starting Vocabulary Matching practice!')),
                                        );
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _buildTryMeCard(
                                      title: 'Sentence\nArrangement',
                                      iconSvg: PhIcons.hammerBold,
                                      circleColor: const Color(0xFFD1FAE5),
                                      iconColor: const Color(0xFF10B981),
                                      onTap: () {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Starting Sentence Arrangement practice!')),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 28),

                              // ── Section 3: Side quests ──────────────────────────
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _buildSectionHeader('Side quests', PhIcons.hourglassBold),
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (context) => const SideQuestsPage()),
                                      );
                                    },
                                    child: Text(
                                      'See all',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF1B64D8),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Side quest items (Yellow layout)
                              _buildQuestCard(
                                title: 'Ganda at Talino Badge',
                                desc: 'Read 3 books written by Female authors\nin 2 Days',
                                badgePath: 'assets/badges/ganda_talino_badge.webp',
                              ),
                              _buildQuestCard(
                                title: 'Early Badge',
                                desc: 'Read 3 books written by Young authors\nin 2 Days',
                                badgePath: 'assets/badges/early_bird_badge.webp',
                              ),
                              _buildQuestCard(
                                title: '10x day Streak',
                                desc: 'Read 3 books written by Female authors\nin 2 Days',
                                badgePath: 'assets/badges/10_day_streak_badge.webp',
                              ),

                              const SizedBox(height: 32),
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
      ),
    );
  }

  // ── Helper Widgets ────────────────────────────────────────────────────────

  Widget _buildSectionHeader(String title, String iconSvg) {
    return Row(
      children: [
        Iconify(
          iconSvg,
          color: const Color(0xFF1B64D8),
          size: 22,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildClassActivityCard({
    required String title,
    required bool isOptional,
    required bool isDone,
    required String iconSvg,
    required Color circleColor,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    final cardBg = isDone ? const Color(0xFFECFDF5) : Colors.white;
    final borderColor = isDone ? const Color(0xFFA7F3D0) : const Color(0xFFE5E7EB);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Row(
        children: [
          // Circular Icon backing
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: circleColor,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Iconify(
              iconSvg,
              color: iconColor,
              size: 34,
            ),
          ),
          const SizedBox(width: 14),

          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  decoration: BoxDecoration(
                    color: isDone ? const Color(0xFFD1FAE5) : const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  child: Text(
                    isDone ? 'Done' : (isOptional ? 'Optional' : 'Required'),
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isDone ? const Color(0xFF065F46) : const Color(0xFF4B5563),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),

          // Status / Action Button
          ElevatedButton(
            onPressed: isDone ? onTap : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: isDone ? const Color(0xFF00A859) : const Color(0xFFE5E7EB),
              disabledBackgroundColor: const Color(0xFFE5E7EB),
              foregroundColor: Colors.white,
              disabledForegroundColor: const Color(0xFF9CA3AF),
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              minimumSize: const Size(90, 36),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            child: Text(
              isDone ? 'View Result' : 'Not Started',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTryMeCard({
    required String title,
    required String iconSvg,
    required Color circleColor,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return Container(
      height: 128,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1.5),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon Circle
                Container(
                  width: 68,
                  height: 68,
                  decoration: BoxDecoration(
                    color: circleColor,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Iconify(
                    iconSvg,
                    color: iconColor,
                    size: 34,
                  ),
                ),
                const Spacer(),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Colors.black,
                    height: 1.25,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuestCard({
    required String title,
    required String desc,
    required String badgePath,
  }) {
    const cardColor = Color(0xFFFFD13E);

    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          // Badge Image
          SizedBox(
            width: 52,
            height: 52,
            child: Image.asset(
              badgePath,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(width: 14),

          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF856404),
                    height: 1.25,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Finish Button
          ElevatedButton(
            onPressed: () {
              Feedback.forTap(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Quest "$title" finished!'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B64D8),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: const Size(64, 34),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            child: Text(
              'Finish',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
