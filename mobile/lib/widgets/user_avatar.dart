import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/auth_service.dart';

class UserAvatar extends StatelessWidget {
  final double size;
  final VoidCallback? onTap;

  const UserAvatar({
    super.key,
    this.size = 56,
    this.onTap,
  });

  Color _getAvatarColor(String name) {
    const colors = [
      Color(0xFF0EA5E9), // Sky Teal
      Color(0xFF165FD5), // Primary Blue
      Color(0xFFD53F24), // Red
      Color(0xFF0F9D58), // Green
      Color(0xFF7C3AED), // Purple
      Color(0xFFC2790A), // Amber
    ];
    int hash = 0;
    for (int i = 0; i < name.length; i++) {
      hash = name.codeUnitAt(i) + ((hash << 5) - hash);
    }
    return colors[hash.abs() % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final initials = user?.initials ?? 'ST';
    final bgColor = _getAvatarColor(user?.displayName ?? 'Student');

    final avatarWidget = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: bgColor,
        border: Border.all(color: Colors.white, width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initials,
          style: GoogleFonts.inter(
            fontSize: size * 0.36,
            fontWeight: FontWeight.w800,
            color: Colors.white,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: () {
          Feedback.forTap(context);
          onTap!();
        },
        child: avatarWidget,
      );
    }

    return avatarWidget;
  }
}
