import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/auth_service.dart';

const List<Color> _kAvatarColors = [
  Color(0xFF165fd5), // blue
  Color(0xFFd53f24), // red
  Color(0xFF0f9d58), // green
  Color(0xFFc2790a), // amber
  Color(0xFF7c3aed), // violet
  Color(0xFF0891b2), // cyan
];

/// Ports JS Avatar.jsx colorFor function exactly.
Color _colorFor(String name) {
  if (name.isEmpty) return _kAvatarColors[0];
  int hash = 0;
  for (int i = 0; i < name.length; i++) {
    int shift5 = (hash << 5) & 0xFFFFFFFF;
    if (shift5 >= 0x80000000) shift5 -= 0x100000000;
    hash = name.codeUnitAt(i) + (shift5 - hash);
  }
  return _kAvatarColors[hash.abs() % _kAvatarColors.length];
}

String _initialsFor(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  final first = parts.isNotEmpty && parts.first.isNotEmpty ? parts.first[0] : '';
  final last = parts.length > 1 && parts.last.isNotEmpty ? parts.last[0] : '';
  return (first + last).toUpperCase();
}

class InitialsAvatar extends StatelessWidget {
  final String name;
  final double radius;
  final double? fontSize;

  const InitialsAvatar({super.key, required this.name, this.radius = 20, this.fontSize});

  static Color colorFor(String name) => _colorFor(name);
  static String initialsFor(String name) => _initialsFor(name);

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: _colorFor(name),
      child: Text(
        _initialsFor(name),
        style: GoogleFonts.inter(
          fontSize: fontSize ?? radius * 0.85,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}

class UserAvatar extends StatelessWidget {
  final double size;
  final VoidCallback? onTap;

  const UserAvatar({super.key, this.size = 56, this.onTap});

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final name = user?.displayName ?? 'Student';
    final initials = user?.initials ?? _initialsFor(name);
    final bgColor = _colorFor(name);

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
        onTap: () { Feedback.forTap(context); onTap!(); },
        child: avatarWidget,
      );
    }
    return avatarWidget;
  }
}
