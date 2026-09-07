import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';

/// A simple, clean, and standard loading screen for student activities.
///
/// Follows standard app design patterns:
/// - Clean canvas background matching the app theme
/// - Top bar with subtle activity title and close (X) button
/// - Centered native smooth spinner and localized loading message (English / Filipino)
class ActivityLoadingView extends StatelessWidget {
  final String? activityTitle;
  final Color primaryColor;
  final VoidCallback? onClose;
  final String? message;
  final String? language;

  const ActivityLoadingView({
    super.key,
    this.activityTitle,
    this.primaryColor = const Color(0xFF1B64D8),
    this.onClose,
    this.message,
    this.language,
    // Kept optional for caller flexibility
    String? activitySubtitle,
    IconData? icon,
    String? iconifyIcon,
    String? difficulty,
  });

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    final bool isEnglish = (language ?? 'fil').toLowerCase().startsWith('en');
    final String defaultMessage = isEnglish
        ? 'Loading activity...'
        : 'Iniloload ang pagsasanay...';

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar with optional title and close button
            Padding(
              padding: const EdgeInsets.fromLTRB(20.0, 8.0, 20.0, 4.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (activityTitle != null && activityTitle!.isNotEmpty)
                    Text(
                      activityTitle!.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 0.8,
                      ),
                    )
                  else
                    const SizedBox.shrink(),
                  IconButton(
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: onClose ?? () => Navigator.of(context).maybePop(),
                    icon: const Iconify(Ph.x, size: 22, color: Color(0xFF64748B)),
                    tooltip: isEnglish ? 'Go back' : 'Bumalik',
                  ),
                ],
              ),
            ),

            // Center standard clean loader
            Expanded(
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: 36,
                      height: 36,
                      child: CircularProgressIndicator(
                        strokeWidth: 3.2,
                        valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      message ?? defaultMessage,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF64748B),
                        letterSpacing: 0.2,
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
}
