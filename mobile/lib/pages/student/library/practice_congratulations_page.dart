import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:confetti/confetti.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/services/streak_service.dart';
import 'package:salintinig/widgets/badge_unlocked_modal.dart';
import 'package:salintinig/widgets/streak_celebration_modal.dart';
import 'package:salintinig/services/analytics_service.dart';
import 'package:salintinig/services/student_prefetch_service.dart';

import 'package:salintinig/pages/student/student_overview_page.dart';

class PracticeCongratulationsPage extends StatefulWidget {
  final String bookTitle;
  final String? materialId;
  final int score;
  final int totalQuestions;
  final List<dynamic>? selectedAnswers;
  final int? timeSpentSeconds;
  final bool isDarkMode;

  const PracticeCongratulationsPage({
    super.key,
    required this.bookTitle,
    this.materialId,
    required this.score,
    required this.totalQuestions,
    this.selectedAnswers,
    this.timeSpentSeconds,
    this.isDarkMode = false,
  });

  @override
  State<PracticeCongratulationsPage> createState() => _PracticeCongratulationsPageState();
}

class _PracticeCongratulationsPageState extends State<PracticeCongratulationsPage>
    with SingleTickerProviderStateMixin {
  late ConfettiController _confettiController;
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  int get _score => widget.score;
  int get _total => widget.totalQuestions > 0 ? widget.totalQuestions : 1;
  double get _ratio => (_score / _total).clamp(0.0, 1.0);
  int get _percentage => (_ratio * 100).round();

  int get _earnedStars {
    if (_percentage >= 80) return 3;
    if (_percentage >= 50) return 2;
    return 1;
  }

  String get _celebrationTitle {
    if (_percentage == 100) return 'Perfect Score!';
    if (_percentage >= 80) return 'Magaling! Great Job!';
    if (_percentage >= 50) return 'Nice Effort!';
    return 'Keep Practicing!';
  }

  String get _celebrationMessage {
    if (_percentage == 100) return 'Awesome job!';
    if (_percentage >= 80) return 'Great job!';
    if (_percentage >= 50) return 'Good effort!';
    return 'Keep practicing!';
  }

  String get _celebrationSubtitle {
    if (_percentage == 100) return 'Nasagot mo ang lahat ng tanong nang tama sa kuwentong ito!';
    if (_percentage >= 80) return 'Magaling ang iyong pagsagot sa comprehension quiz!';
    if (_percentage >= 50) return 'Mabuting pagsisikap sa pagbabasa at pagsagot sa kuwento!';
    return 'Ipagpatuloy ang pagsasanay sa pagbabasa upang lalo pang gumaling!';
  }

  String get _formattedTime {
    final sec = widget.timeSpentSeconds ?? 0;
    final mins = sec ~/ 60;
    final remainingSec = sec % 60;
    if (mins == 0) return '${remainingSec}s';
    return '${mins}m ${remainingSec}s';
  }

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 4));
    _confettiController.play();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _scaleAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.elasticOut,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
    );

    _animController.forward();
    _syncStoryCompletion();
  }

  Future<void> _syncStoryCompletion() async {
    final wasCompletedBefore = await StreakService.hasCompletedToday();

    try {
      final user = AuthService.currentUser;
      final response = await ApiService.post('/students/story/complete', {
        'bookTitle': widget.bookTitle,
        if (widget.materialId != null && widget.materialId!.isNotEmpty) 'materialId': widget.materialId,
        'score': widget.score,
        'totalQuestions': widget.totalQuestions,
        'selectedAnswers': widget.selectedAnswers ?? [],
        'timeSpentSeconds': widget.timeSpentSeconds ?? 0,
        'isDarkMode': widget.isDarkMode,
        if (user?.lrn != null && user!.lrn.isNotEmpty) 'lrn': user.lrn,
        if (user?.userId != null && user!.userId.isNotEmpty) 'studentId': user.userId,
      });
      LibraryService.invalidateAll();
      await AnalyticsService.fetchAnalytics(forceRefresh: true);
      StudentPrefetchService.prefetchAll();

      // Now sync streak with backend to get authoritative updated streak
      await StreakService.recordActivityCompletion();
      final newStreakCount = await StreakService.getStreakCount();

      // If this was the student's first activity completion today, show ignition celebration pop-up!
      if (!wasCompletedBefore && mounted) {
        await StreakCelebrationModal.show(context, streakCount: newStreakCount);
      }

      // Check if badges were newly unlocked
      if (mounted && response.data != null && response.data['newlyUnlockedBadges'] is List) {
        final badges = response.data['newlyUnlockedBadges'] as List;
        if (badges.isNotEmpty) {
          await BadgeUnlockedModal.showMultiple(context, badges);
        }
      }
    } catch (e) {
      debugPrint('Story completion sync notice: $e');
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _goToHome() {
    Feedback.forTap(context);
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => const StudentOverviewPage()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF6);
    const cardBorderColor = Color(0xFF0F172A);

    return Scaffold(
      backgroundColor: softCreamBg,
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;
          _goToHome();
        },
        child: Stack(
          alignment: Alignment.topCenter,
          children: [
            // 1. Confetti Cannons
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

            // 2. Main Scrollable Content Layout
            SafeArea(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isTablet = constraints.maxWidth > 600;

                  return Center(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: isTablet ? 500 : double.infinity,
                      ),
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                        child: Column(
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

                            // 2. Sally Mascot Illustration (Celebration) with bounce animation
                            ScaleTransition(
                              scale: _scaleAnimation,
                              child: FadeTransition(
                                opacity: _fadeAnimation,
                                child: Image.asset(
                                  'assets/mascot/sally_celebration.webp',
                                  height: 165,
                                  fit: BoxFit.contain,
                                  errorBuilder: (context, error, stackTrace) => Image.asset(
                                    'assets/mascot/sally_sitting.webp',
                                    height: 165,
                                    fit: BoxFit.contain,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // 3. Title, Book Title & Subtitle
                            Text(
                              _celebrationTitle,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              widget.bookTitle,
                              textAlign: TextAlign.center,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: primaryBlue,
                              ),
                            ),
                            const SizedBox(height: 6),
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

                            // 4. Tri-Stat Metric Box (Score, Accuracy, Time)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 18.0, horizontal: 12.0),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(22),
                                border: Border.all(
                                  color: cardBorderColor,
                                  width: 2.2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: cardBorderColor.withValues(alpha: 0.05),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  // Stat 1: Final Score
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
                                          'SCORE',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF94A3B8),
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          '$_score/$_total',
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
                                          Icons.track_changes_rounded,
                                          color: Color(0xFF3B82F6),
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
                                          '$_percentage%',
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

                                  // Stat 3: Time Spent
                                  Expanded(
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(
                                          Icons.timer_outlined,
                                          color: Color(0xFFF59E0B),
                                          size: 24,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'TIME',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF94A3B8),
                                            letterSpacing: 0.5,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _formattedTime,
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

                            // 5. Story Progress & Stars Banner Card
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
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
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF3C7),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: const Color(0xFFFDE68A),
                                        width: 1,
                                      ),
                                    ),
                                    alignment: Alignment.center,
                                    child: const Icon(
                                      Icons.military_tech_rounded,
                                      color: Color(0xFFD97706),
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          'Story Finished & Recorded',
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Progress and quiz saved to your profile',
                                          style: GoogleFonts.inter(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w500,
                                            color: const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDCFCE7),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFFBBF7D0),
                                        width: 1.2,
                                      ),
                                    ),
                                    child: Text(
                                      '+$_earnedStars Stars',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF15803D),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // 6. Action Button: Full-Width Primary
                            SizedBox(
                              width: double.infinity,
                              height: 54,
                              child: ElevatedButton(
                                onPressed: _goToHome,
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
                                      'Bumalik sa Library',
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
                            const SizedBox(height: 16),
                          ],
                        ),
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

    // Fill
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
