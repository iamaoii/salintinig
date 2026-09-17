import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/streak_service.dart';

/// Modal dialog celebrating a newly earned daily streak (Duolingo style).
class StreakCelebrationModal extends StatefulWidget {
  final int streakCount;

  const StreakCelebrationModal({
    super.key,
    required this.streakCount,
  });

  /// Helper to show this modal full-screen over any active context.
  static Future<void> show(BuildContext context, {required int streakCount}) {
    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'StreakCelebration',
      barrierColor: Colors.black.withValues(alpha: 0.85),
      transitionDuration: const Duration(milliseconds: 400),
      pageBuilder: (context, anim1, anim2) {
        return StreakCelebrationModal(streakCount: streakCount);
      },
      transitionBuilder: (context, anim1, anim2, child) {
        return ScaleTransition(
          scale: CurvedAnimation(
            parent: anim1,
            curve: Curves.easeOutBack,
          ),
          child: FadeTransition(
            opacity: anim1,
            child: child,
          ),
        );
      },
    );
  }

  @override
  State<StreakCelebrationModal> createState() => _StreakCelebrationModalState();
}

class _StreakCelebrationModalState extends State<StreakCelebrationModal>
    with TickerProviderStateMixin {
  late AnimationController _flameAnimController;
  late Animation<double> _flameScale;
  late Animation<double> _flameGlow;

  late AnimationController _trackerAnimController;
  late Animation<double> _trackerScale;
  late Animation<double> _trackerColorProgress;

  List<Map<String, String>> _weeklyTracker = [];
  int _todayDayIndex = 0;

  @override
  void initState() {
    super.initState();

    _todayDayIndex = StreakService.getTodayDayIndex();
    _weeklyTracker = StreakService.getCachedWeeklyTracker();
    _loadTrackerData();

    // 1. Ignition flame animation (Pop & Pulse)
    _flameAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    _flameScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.2, end: 1.25)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.25, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 40,
      ),
    ]).animate(_flameAnimController);

    _flameGlow = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _flameAnimController,
        curve: const Interval(0.4, 1.0, curve: Curves.easeOut),
      ),
    );

    // 2. Duolingo-style: Today's circle starts normal (1.0), then pops (1.0 -> 1.35 -> 1.0) and turns orange!
    _trackerAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _trackerScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 1.35)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.35, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 50,
      ),
    ]).animate(_trackerAnimController);

    _trackerColorProgress = CurvedAnimation(
      parent: _trackerAnimController,
      curve: const Interval(0.1, 0.7, curve: Curves.easeInOut),
    );

    _flameAnimController.forward();
    Future.delayed(const Duration(milliseconds: 450), () {
      if (mounted) {
        _trackerAnimController.forward();
      }
    });
  }

  Future<void> _loadTrackerData() async {
    try {
      final tracker = await StreakService.getWeeklyTracker();
      if (mounted && tracker.isNotEmpty) {
        setState(() {
          _weeklyTracker = tracker;
          _todayDayIndex = StreakService.getTodayDayIndex();
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _flameAnimController.dispose();
    _trackerAnimController.dispose();
    super.dispose();
  }

  List<String> get _dayLabels => ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  @override
  Widget build(BuildContext context) {
    const lightBg = Color(0xFFFCFAF6);
    const primaryBlue = Color(0xFF1B64D8);
    final isStreakActive = widget.streakCount > 0;
    final flameColor = isStreakActive ? const Color(0xFFF97316) : const Color(0xFFCBD5E1);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        color: lightBg,
        child: SafeArea(
          child: Column(
            children: [
              // Top Right Close / Header Count Badge
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.local_fire_department_rounded,
                          color: flameColor,
                          size: 28,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          '${widget.streakCount}',
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: flameColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Animated Ignition Flame
                    AnimatedBuilder(
                      animation: _flameAnimController,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _flameScale.value,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              // Outer Radial Glowing Flame Aura
                              if (isStreakActive)
                                Container(
                                  width: 220,
                                  height: 220,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    gradient: RadialGradient(
                                      colors: [
                                        const Color(0xFFF97316).withValues(alpha: 0.20 * _flameGlow.value),
                                        const Color(0xFFF97316).withValues(alpha: 0.0),
                                      ],
                                    ),
                                  ),
                                ),
                              // Giant Animated Flame Icon
                              Icon(
                                Icons.local_fire_department_rounded,
                                size: 180,
                                color: flameColor,
                              ),
                            ],
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 32),

                    // Weekly Day Circles (Duolingo Style)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: List.generate(7, (index) {
                          final isToday = index == _todayDayIndex;
                          
                          // Determine if day was already done prior to today
                          bool wasPreviouslyDone = false;
                          if (_weeklyTracker.length > index) {
                            wasPreviouslyDone = _weeklyTracker[index]['state'] == 'done';
                          } else if (widget.streakCount > 0) {
                            final int streakStartDayIndex = _todayDayIndex - (widget.streakCount - 1);
                            wasPreviouslyDone = index >= streakStartDayIndex && index < _todayDayIndex;
                          }

                          // Today is the active target to turn orange with animation if streak > 0
                          final bool isTodayTarget = isToday && widget.streakCount > 0;

                          return AnimatedBuilder(
                            animation: _trackerAnimController,
                            builder: (context, child) {
                              Color circleBgColor;
                              Color checkColor;
                              Color textColor;
                              double scale = 1.0;

                              if (isTodayTarget) {
                                // Animate Today specifically: smooth transition from Grey -> Orange + bounce scale
                                scale = _trackerScale.value;
                                final t = _trackerColorProgress.value;

                                circleBgColor = Color.lerp(
                                  const Color(0xFFF1F5F9),
                                  const Color(0xFFF97316),
                                  t,
                                )!;
                                checkColor = Color.lerp(
                                  const Color(0xFFCBD5E1),
                                  Colors.white,
                                  t,
                                )!;
                                textColor = Color.lerp(
                                  const Color(0xFF94A3B8),
                                  const Color(0xFFF97316),
                                  t,
                                )!;
                              } else if (wasPreviouslyDone) {
                                // Completed earlier this week: solid orange
                                circleBgColor = const Color(0xFFF97316);
                                checkColor = Colors.white;
                                textColor = const Color(0xFFF97316);
                              } else {
                                // Missed past days or future days: grey
                                circleBgColor = const Color(0xFFF1F5F9);
                                checkColor = const Color(0xFFCBD5E1);
                                textColor = const Color(0xFF94A3B8);
                              }

                              return Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _dayLabels[index],
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: textColor,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Transform.scale(
                                    scale: scale,
                                    child: Container(
                                      width: 38,
                                      height: 38,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: circleBgColor,
                                        boxShadow: (isTodayTarget && _trackerAnimController.value > 0.4)
                                            ? [
                                                BoxShadow(
                                                  color: const Color(0xFFF97316).withValues(alpha: 0.35 * _trackerAnimController.value),
                                                  blurRadius: 10,
                                                  spreadRadius: 2,
                                                )
                                              ]
                                            : null,
                                      ),
                                      child: Icon(
                                        Icons.check_rounded,
                                        size: 22,
                                        color: checkColor,
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            },
                          );
                        }),
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Main Headline & Subtitle
                    Text(
                      widget.streakCount == 1
                          ? '1 day streak!'
                          : '${widget.streakCount} day streak!',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 36.0),
                      child: Text(
                        isStreakActive
                            ? "You're crushing your learning goals.\nKeep it up!"
                            : "Complete an activity today to start your streak!",
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF64748B),
                          height: 1.35,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom CONTINUE Action Button
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: SizedBox(
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
                    child: Text(
                      'CONTINUE',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
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
