import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/student_overview_page.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:confetti/confetti.dart';
import 'dart:math' as math;

class ListeningAssessmentCongratulationsPage extends StatefulWidget {
  final int score;
  final int totalQuestions;
  final String? assessmentLanguage;

  const ListeningAssessmentCongratulationsPage({
    super.key,
    required this.score,
    required this.totalQuestions,
    this.assessmentLanguage,
  });

  @override
  State<ListeningAssessmentCongratulationsPage> createState() =>
      _ListeningAssessmentCongratulationsPageState();
}

class _ListeningAssessmentCongratulationsPageState
    extends State<ListeningAssessmentCongratulationsPage> {
  late ConfettiController _confettiController;

  bool get _isEnglish {
    final lang = (widget.assessmentLanguage ?? '').toLowerCase();
    return lang.startsWith('en') || lang.contains('english');
  }

  @override
  void initState() {
    super.initState();
    _confettiController =
        ConfettiController(duration: const Duration(seconds: 4));
    _confettiController.play();
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  void _goToHome() {
    Feedback.forTap(context);
    PhilIriAssessmentPage.isListeningDone = true;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const StudentOverviewPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    const goldBg = Color(0xFFFBBF24);
    const primaryBlue = Color(0xFF1B64D8);
    const greenStars = Color(0xFF00AA5A);

    return Scaffold(
      backgroundColor: goldBg,
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;
          _goToHome();
        },
        child: Stack(
          children: [
          // 1. Mascot Display (drawn first, in the back background)
          Positioned(
            bottom: -110, // offset slightly to align with the cropped bottom look
            left: -100,
            right: -100,
            child: Image.asset(
              'assets/mascot/sally_celebration.webp',
              height: 680,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return const SizedBox();
              },
            ),
          ),

          // 2. Confetti overlays (drawn second, rendering in front of the mascot but behind the text/buttons)
          // Confetti Left Side (shooting slightly downwards and right)
          Align(
            alignment: const Alignment(-1.0, -0.6), // upper-left edge
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirection: math.pi / 8, // slightly downwards and right
              blastDirectionality: BlastDirectionality.directional,
              shouldLoop: false,
              emissionFrequency: 0.03,
              numberOfParticles: 3,
              maxBlastForce: 15,
              minBlastForce: 5,
              gravity: 0.1,
              colors: const [
                Colors.green, Colors.blue, Colors.pink, Colors.orange, Colors.purple, Colors.yellow, Colors.cyan
              ],
            ),
          ),
          // Confetti Right Side (shooting slightly downwards and left)
          Align(
            alignment: const Alignment(1.0, -0.6), // upper-right edge
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirection: 7 * math.pi / 8, // slightly downwards and left
              blastDirectionality: BlastDirectionality.directional,
              shouldLoop: false,
              emissionFrequency: 0.03,
              numberOfParticles: 3,
              maxBlastForce: 15,
              minBlastForce: 5,
              gravity: 0.1,
              colors: const [
                Colors.green, Colors.blue, Colors.pink, Colors.orange, Colors.purple, Colors.yellow, Colors.cyan
              ],
            ),
          ),

          // 3. Main Content Layout (drawn last, rendering ON TOP of the mascot and confetti)
          SafeArea(
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
                        const SizedBox(height: 56),

                        // Score & Title content
                        Expanded(
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: Column(
                              children: [
                                const SizedBox(height: 16),
                                Text(
                                  'Congratulations!',
                                  style: GoogleFonts.inter(
                                    fontSize: 36,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _isEnglish
                                      ? 'You completed the Listening Assessment.'
                                      : 'Natapos mo ang Listening Assessment.',
                                  style: GoogleFonts.inter(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                
                                // Huge Score Text
                                Text(
                                  '${widget.score}/${widget.totalQuestions}',
                                  style: GoogleFonts.inter(
                                    fontSize: 100,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    height: 1.0,
                                    shadows: [
                                      Shadow(
                                        color: Colors.black.withValues(alpha: 0.15),
                                        offset: const Offset(0, 8),
                                        blurRadius: 16,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Stars Reward badge
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: greenStars,
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                  child: Text(
                                    '+ 3 Stars!',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),
                              ],
                            ),
                          ),
                        ),

                        // Bottom Button
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                          child: SizedBox(
                            width: double.infinity,
                            height: 54,
                            child: ElevatedButton(
                              onPressed: _goToHome,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryBlue,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: Text(
                                'Home',
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
                );
              },
            ),
          ),
        ],
      ),
    ),
    );
  }
}
