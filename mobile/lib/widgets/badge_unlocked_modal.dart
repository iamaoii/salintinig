import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/badge_service.dart';

class BadgeUnlockedModal extends StatefulWidget {
  final String badgeTitle;
  final String? badgeDescription;
  final String? iconPath;

  const BadgeUnlockedModal({
    super.key,
    required this.badgeTitle,
    this.badgeDescription,
    this.iconPath,
  });

  static Future<void> show(
    BuildContext context, {
    required String badgeTitle,
    String? badgeDescription,
    String? iconPath,
  }) async {
    // Refresh live badge service state
    BadgeService.fetchBadges();

    if (!context.mounted) return;

    return showGeneralDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'BadgeUnlocked',
      barrierColor: Colors.black.withValues(alpha: 0.85),
      transitionDuration: const Duration(milliseconds: 400),
      pageBuilder: (context, anim1, anim2) {
        return BadgeUnlockedModal(
          badgeTitle: badgeTitle,
          badgeDescription: badgeDescription,
          iconPath: iconPath,
        );
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

  /// Helper to show multiple newly unlocked badges sequentially if list is returned
  static Future<void> showMultiple(
    BuildContext context,
    List<dynamic> newlyUnlockedBadges,
  ) async {
    if (newlyUnlockedBadges.isEmpty) return;
    for (final badge in newlyUnlockedBadges) {
      if (!context.mounted) break;
      final title = (badge['badgeName'] ?? badge['title'] ?? 'New Badge').toString();
      final desc = (badge['description'] ?? '').toString();
      final icon = (badge['iconPath'] ?? badge['badgeAsset'] ?? '').toString();
      await show(
        context,
        badgeTitle: title,
        badgeDescription: desc.isNotEmpty ? desc : null,
        iconPath: icon.isNotEmpty ? icon : null,
      );
    }
  }

  @override
  State<BadgeUnlockedModal> createState() => _BadgeUnlockedModalState();
}

class _BadgeUnlockedModalState extends State<BadgeUnlockedModal>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  String _getAssetForTitle(String title) {
    if (widget.iconPath != null && widget.iconPath!.startsWith('assets/')) {
      return widget.iconPath!;
    }
    final lower = title.toLowerCase();
    if (lower.contains('first step')) return 'assets/badges/first_step_badge.webp';
    if (lower.contains("star")) return 'assets/badges/im_a_star_badge.webp';
    if (lower.contains('sounds right')) return 'assets/badges/sounds_right_badge.webp';
    if (lower.contains('sentence builder')) return 'assets/badges/sentence_builder_badge.webp';
    if (lower.contains('night owl')) return 'assets/badges/night_owl_badge.webp';
    if (lower.contains('6?') || lower.contains('7!')) return 'assets/badges/streak_7_badge.webp';
    if (lower.contains('both worlds')) return 'assets/badges/both_worlds_badge.webp';
    if (lower.contains('10 streak')) return 'assets/badges/streak_10_badge.webp';
    if (lower.contains('20 streak')) return 'assets/badges/streak_20_badge.webp';
    if (lower.contains('triple crown')) return 'assets/badges/triple_crowned_badge.webp';
    return 'assets/badges/first_step_badge.webp';
  }

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.3, end: 1.2)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 60,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.2, end: 1.0)
            .chain(CurveTween(curve: Curves.easeInOut)),
        weight: 40,
      ),
    ]).animate(_animController);

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final assetPath = _getAssetForTitle(widget.badgeTitle);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Header tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.star_rounded, color: Color(0xFFD97706), size: 20),
                      const SizedBox(width: 6),
                      Text(
                        'NEW BADGE UNLOCKED!',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF92400E),
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Animated Badge Icon with Glow
                ScaleTransition(
                  scale: _scaleAnimation,
                  child: Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.5),
                          blurRadius: 36,
                          spreadRadius: 8,
                        ),
                      ],
                    ),
                    child: Image.asset(
                      assetPath,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.military_tech_rounded,
                        size: 100,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Badge Title
                Text(
                  widget.badgeTitle,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.outfit(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.2,
                  ),
                ),
                if (widget.badgeDescription != null && widget.badgeDescription!.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    widget.badgeDescription!,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      color: const Color(0xFFCBD5E1),
                      height: 1.4,
                    ),
                  ),
                ],
                const SizedBox(height: 40),

                // Continue Button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF59E0B),
                      foregroundColor: Colors.white,
                      elevation: 4,
                      shadowColor: const Color(0xFFD97706).withValues(alpha: 0.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Text(
                      'Awesome!',
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
