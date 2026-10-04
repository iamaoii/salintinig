import 'package:flutter/material.dart';

class ParentPortalSkeletons {
  static Widget overview() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SkeletonBox(height: 138, radius: 16),
        SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: _SkeletonBox(height: 100, radius: 16)),
            SizedBox(width: 12),
            Expanded(child: _SkeletonBox(height: 100, radius: 16)),
          ],
        ),
        SizedBox(height: 22),
        _SkeletonLine(width: 190),
        SizedBox(height: 12),
        _SkeletonBox(height: 150, radius: 18),
        SizedBox(height: 28),
        _SkeletonLine(width: 180),
        SizedBox(height: 12),
        _SkeletonBox(height: 76, radius: 16),
        SizedBox(height: 10),
        _SkeletonBox(height: 76, radius: 16),
        SizedBox(height: 10),
        _SkeletonBox(height: 76, radius: 16),
      ],
    );
  }

  static Widget assessmentList() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SkeletonBox(height: 150, radius: 18),
        SizedBox(height: 18),
        Row(
          children: [
            _SkeletonPill(width: 76),
            SizedBox(width: 8),
            _SkeletonPill(width: 78),
            SizedBox(width: 8),
            _SkeletonPill(width: 92),
          ],
        ),
        SizedBox(height: 18),
        _SkeletonBox(height: 110, radius: 16),
        SizedBox(height: 10),
        _SkeletonBox(height: 110, radius: 16),
        SizedBox(height: 10),
        _SkeletonBox(height: 110, radius: 16),
      ],
    );
  }

  static Widget progress() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SkeletonBox(height: 116, radius: 16),
        SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _SkeletonBox(height: 98, radius: 16)),
            SizedBox(width: 12),
            Expanded(child: _SkeletonBox(height: 98, radius: 16)),
          ],
        ),
        SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _SkeletonBox(height: 98, radius: 16)),
            SizedBox(width: 12),
            Expanded(child: _SkeletonBox(height: 98, radius: 16)),
          ],
        ),
        SizedBox(height: 24),
        _SkeletonLine(width: 210),
        SizedBox(height: 12),
        _SkeletonBox(height: 154, radius: 18),
        SizedBox(height: 28),
        _SkeletonLine(width: 150),
        SizedBox(height: 12),
        _SkeletonBox(height: 96, radius: 20),
      ],
    );
  }

  static Widget announcements() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SkeletonBox(height: 90, radius: 20),
        SizedBox(height: 18),
        Row(
          children: [
            _SkeletonPill(width: 60),
            SizedBox(width: 8),
            _SkeletonPill(width: 100),
            SizedBox(width: 8),
            _SkeletonPill(width: 80),
          ],
        ),
        SizedBox(height: 18),
        _SkeletonBox(height: 120, radius: 20),
        SizedBox(height: 12),
        _SkeletonBox(height: 100, radius: 20),
        SizedBox(height: 12),
        _SkeletonBox(height: 100, radius: 20),
      ],
    );
  }
}

class _ShimmerContainer extends StatefulWidget {
  final Widget child;

  const _ShimmerContainer({required this.child});

  @override
  State<_ShimmerContainer> createState() => _ShimmerContainerState();
}

class _ShimmerContainerState extends State<_ShimmerContainer> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              colors: const [
                Color(0xFFE2E8F0),
                Color(0xFFF8FAFC),
                Color(0xFFE2E8F0),
              ],
              stops: const [0.0, 0.5, 1.0],
              begin: Alignment(-1.0 + (_controller.value * 3.0), -0.3),
              end: Alignment(1.0 + (_controller.value * 3.0), 0.3),
              tileMode: TileMode.clamp,
            ).createShader(bounds);
          },
          child: widget.child,
        );
      },
    );
  }
}

class _SkeletonBox extends StatelessWidget {
  final double height;
  final double radius;

  const _SkeletonBox({required this.height, required this.radius});

  @override
  Widget build(BuildContext context) {
    return _ShimmerContainer(
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

class _SkeletonLine extends StatelessWidget {
  final double width;

  const _SkeletonLine({required this.width});

  @override
  Widget build(BuildContext context) {
    return _ShimmerContainer(
      child: Container(
        width: width,
        height: 16,
        decoration: BoxDecoration(
          color: const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}

class _SkeletonPill extends StatelessWidget {
  final double width;

  const _SkeletonPill({required this.width});

  @override
  Widget build(BuildContext context) {
    return _ShimmerContainer(
      child: Container(
        width: width,
        height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(999),
        ),
      ),
    );
  }
}
