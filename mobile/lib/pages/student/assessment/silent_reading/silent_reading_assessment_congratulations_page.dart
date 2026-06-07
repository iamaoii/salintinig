import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/student_overview_page.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:confetti/confetti.dart';
import 'dart:math' as math;

class SilentReadingAssessmentCongratulationsPage extends StatefulWidget {
  final int score;
  final int totalQuestions;

  const SilentReadingAssessmentCongratulationsPage({
    super.key,
    required this.score,
    required this.totalQuestions,
  });

  @override
  State<SilentReadingAssessmentCongratulationsPage> createState() =>
      _SilentReadingAssessmentCongratulationsPageState();
}

class _SilentReadingAssessmentCongratulationsPageState
    extends State<SilentReadingAssessmentCongratulationsPage> {
  late ConfettiController _confettiController;

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
    PhilIriAssessmentPage.isSilentReadingDone = true;
    PhilIriAssessmentPage.silentReadingScore = widget.score;
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
            Positioned(
              bottom: -110,
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

            // Confetti
            Align(
              alignment: const Alignment(-1.0, -0.6),
              child: ConfettiWidget(
                confettiController: _confettiController,
                blastDirection: math.pi / 8,
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
            Align(
              alignment: const Alignment(1.0, -0.6),
              child: ConfettiWidget(
                confettiController: _confettiController,
                blastDirection: 7 * math.pi / 8,
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
                                    'Natapos mo ang Silent Reading Test.',
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                  
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
