import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppToast {
  /// Displays a smooth iOS-style top floating toast banner under the status bar
  static void show(
    BuildContext context, {
    required String message,
    IconData icon = Icons.check_circle_rounded,
    Color backgroundColor = const Color(0xFF1E293B),
    Color iconColor = const Color(0xFF10B981),
    Duration duration = const Duration(seconds: 3),
  }) {
    final overlay = Overlay.maybeOf(context);
    if (overlay == null) return;
    late OverlayEntry entry;

    entry = OverlayEntry(
      builder: (ctx) => _TopToastWidget(
        message: message,
        icon: icon,
        backgroundColor: backgroundColor,
        iconColor: iconColor,
        duration: duration,
        onDismiss: () {
          try {
            entry.remove();
          } catch (_) {}
        },
      ),
    );

    overlay.insert(entry);
  }

  /// Convenience method for success toasts
  static void success(BuildContext context, String message) {
    show(
      context,
      message: message,
      icon: Icons.check_circle_rounded,
      iconColor: const Color(0xFF10B981),
    );
  }

  /// Convenience method for warning toasts
  static void warning(BuildContext context, String message) {
    show(
      context,
      message: message,
      icon: Icons.warning_amber_rounded,
      iconColor: const Color(0xFFF59E0B),
    );
  }

  /// Convenience method for error toasts
  static void error(BuildContext context, String message) {
    show(
      context,
      message: message,
      icon: Icons.error_outline_rounded,
      iconColor: const Color(0xFFEF4444),
    );
  }

  /// Convenience method for info toasts
  static void info(BuildContext context, String message) {
    show(
      context,
      message: message,
      icon: Icons.info_outline_rounded,
      iconColor: const Color(0xFF3B82F6),
    );
  }
}

class _TopToastWidget extends StatefulWidget {
  final String message;
  final IconData icon;
  final Color backgroundColor;
  final Color iconColor;
  final Duration duration;
  final VoidCallback onDismiss;

  const _TopToastWidget({
    required this.message,
    required this.icon,
    required this.backgroundColor,
    required this.iconColor,
    required this.duration,
    required this.onDismiss,
  });

  @override
  State<_TopToastWidget> createState() => _TopToastWidgetState();
}

class _TopToastWidgetState extends State<_TopToastWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;
  bool _dismissed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0, -1.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutBack,
    ));

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    );

    _controller.forward();

    Future.delayed(widget.duration, () {
      if (mounted && !_dismissed) {
        _dismissToast();
      }
    });
  }

  void _dismissToast() {
    if (_dismissed) return;
    _dismissed = true;
    _controller.reverse().then((_) {
      widget.onDismiss();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top + 10;

    return Positioned(
      top: topPadding,
      left: 16,
      right: 16,
      child: SlideTransition(
        position: _offsetAnimation,
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Material(
            color: Colors.transparent,
            child: GestureDetector(
              onTap: _dismissToast,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: widget.backgroundColor,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.18),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.15),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: widget.iconColor.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(widget.icon, color: widget.iconColor, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        widget.message,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          height: 1.3,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
