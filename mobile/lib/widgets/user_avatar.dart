import 'dart:convert';
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

/// Ports JS Avatar.jsx colorFor function (returns Cyan Teal #0891b2 for student accounts).
Color _colorFor(String name) {
  final user = AuthService.currentUser;
  if (user?.role.toLowerCase() == 'student' || name.toLowerCase().contains('student')) {
    return const Color(0xFF0891B2); // Cyan Teal (#0891b2) matching web student avatar
  }

  if (name.isEmpty) return _kAvatarColors[5];
  int hash = 0;
  for (int i = 0; i < name.length; i++) {
    hash = name.codeUnitAt(i) + ((hash << 5) - hash);
  }
  return _kAvatarColors[hash.abs() % _kAvatarColors.length];
}

String _initialsFor(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  final first = parts.isNotEmpty && parts.first.isNotEmpty ? parts.first[0] : '';
  final last = parts.length > 1 && parts.last.isNotEmpty ? parts.last[0] : '';
  return (first + last).toUpperCase();
}

ImageProvider? _getImageProvider(String? urlStr) {
  if (urlStr == null) return null;
  final clean = urlStr.trim();
  if (clean.isEmpty) return null;
  if (clean.startsWith('data:image/')) {
    try {
      final commaIdx = clean.indexOf(',');
      final b64 = commaIdx != -1 ? clean.substring(commaIdx + 1) : clean;
      return MemoryImage(base64Decode(b64.replaceAll(RegExp(r'\s+'), '')));
    } catch (_) {
      return null;
    }
  } else if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return NetworkImage(clean);
  } else if (clean.startsWith('assets/') || clean.startsWith('/assets/')) {
    final assetPath = clean.startsWith('/') ? clean.substring(1) : clean;
    return AssetImage(assetPath);
  }
  return null;
}

class InitialsAvatar extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final double radius;
  final double? fontSize;
  final bool showBorder;

  const InitialsAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.radius = 20,
    this.fontSize,
    this.showBorder = false,
  });

  static Color colorFor(String name) => _colorFor(name);
  static String initialsFor(String name) => _initialsFor(name);

  @override
  Widget build(BuildContext context) {
    final imageProvider = _getImageProvider(imageUrl);
    final size = radius * 2;
    final initials = _initialsFor(name);
    final bgColor = _colorFor(name);

    if (imageProvider != null) {
      return Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: showBorder ? Border.all(color: Colors.white, width: 2) : null,
          image: DecorationImage(
            image: imageProvider,
            fit: BoxFit.cover,
          ),
        ),
      );
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: bgColor,
        border: showBorder ? Border.all(color: Colors.white, width: 2) : null,
      ),
      child: Center(
        child: Text(
          initials,
          style: GoogleFonts.inter(
            fontSize: fontSize ?? size * 0.4,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class UserAvatar extends StatelessWidget {
  final double size;
  final String? imageUrl;
  final String? frame;
  final VoidCallback? onTap;

  const UserAvatar({
    super.key,
    this.size = 56,
    this.imageUrl,
    this.frame,
    this.onTap,
  });

  static const Map<String, dynamic> _frameStyles = {
    'Bronze': {'color': Color(0xFFCD7F32), 'width': 3.5, 'glow': false},
    'Silver': {'color': Color(0xFFC0C0C0), 'width': 3.5, 'glow': false},
    'Gold Star': {'color': Color(0xFFF59E0B), 'width': 3.5, 'glow': true},
    'Cosmic Neon': {'color': Color(0xFF8B5CF6), 'width': 3.5, 'glow': true},
  };

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final name = user?.displayName ?? 'User';
    final initials = user?.initials ?? _initialsFor(name);
    final bgColor = _colorFor(name);
    final url = imageUrl ?? user?.rawUser?['profileImage'] ?? user?.rawUser?['profile_image'];
    final imageProvider = _getImageProvider(url?.toString());

    final activeFrameKey = frame ?? user?.avatarFrame ?? 'None';
    final frameData = _frameStyles[activeFrameKey];
    final frameColor = (frameData?['color'] as Color?) ?? Colors.transparent;
    final frameWidth = (frameData?['width'] as num?)?.toDouble() ?? 0.0;
    final hasGlow = (frameData?['glow'] as bool?) ?? false;

    final hasBorder = frameWidth > 0 && frameColor != Colors.transparent;

    Widget avatarInner;
    if (imageProvider != null) {
      avatarInner = Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          image: DecorationImage(
            image: imageProvider,
            fit: BoxFit.cover,
          ),
        ),
      );
    } else {
      avatarInner = Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: bgColor,
        ),
        child: Center(
          child: Text(
            initials,
            style: GoogleFonts.inter(
              fontSize: size * 0.4,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
      );
    }

    // 1. Base Avatar: Avatar photo icon with crisp white ring border
    // This is the EXACT fixed layout widget. Layout dimensions never change, so header components never move!
    final Widget baseAvatarWithWhiteRing = Container(
      width: size,
      height: size,
      padding: const EdgeInsets.all(2.5),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: avatarInner,
    );

    Widget finalWidget;

    if (hasBorder) {
      // Outer colored ring border & outward glow are placed BEHIND baseAvatarWithWhiteRing in the Stack
      finalWidget = SizedBox(
        width: size,
        height: size,
        child: Stack(
          alignment: Alignment.center,
          clipBehavior: Clip.none,
          children: [
            // 1. Glow & Colored Ring Layer (behind avatar photo)
            Positioned(
              top: -3.5,
              left: -3.5,
              right: -3.5,
              bottom: -3.5,
              child: IgnorePointer(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: frameColor, width: 3.5),
                    boxShadow: hasGlow
                        ? [
                            BoxShadow(
                              color: frameColor.withValues(alpha: 0.50),
                              blurRadius: 10,
                              spreadRadius: 1.5,
                              offset: Offset.zero,
                            ),
                            BoxShadow(
                              color: frameColor.withValues(alpha: 0.20),
                              blurRadius: 14,
                              spreadRadius: 2.5,
                              offset: Offset.zero,
                            ),
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 4,
                              spreadRadius: 0,
                              offset: const Offset(0, 1),
                            ),
                          ],
                  ),
                ),
              ),
            ),
            // 2. Base Avatar Photo with White Ring Layer (placed in front so icon remains 100% crisp and un-tinted)
            baseAvatarWithWhiteRing,
          ],
        ),
      );
    } else {
      // 'None': Render base avatar with white ring only. Zero layout change!
      finalWidget = baseAvatarWithWhiteRing;
    }

    if (onTap != null) {
      return GestureDetector(
        onTap: () {
          Feedback.forTap(context);
          onTap!();
        },
        child: finalWidget,
      );
    }
    return finalWidget;
  }
}
