import 'package:flutter/material.dart';

class ParentPortalSkeletons {
  static Widget overview() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Hero Blue Header Card Skeleton
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(
              colors: [Color(0xFF1B64D8), Color(0xFF2563EB)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1B64D8).withValues(alpha: 0.25),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _SkeletonBox(
                    height: 28,
                    width: 140,
                    radius: 20,
                    baseColor: Colors.white.withValues(alpha: 0.25),
                    highlightColor: Colors.white.withValues(alpha: 0.5),
                  ),
                  _SkeletonBox(
                    height: 22,
                    width: 80,
                    radius: 12,
                    baseColor: Colors.white.withValues(alpha: 0.35),
                    highlightColor: Colors.white.withValues(alpha: 0.6),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _SkeletonBox(
                height: 24,
                width: 200,
                radius: 6,
                baseColor: Colors.white.withValues(alpha: 0.35),
                highlightColor: Colors.white.withValues(alpha: 0.6),
              ),
              const SizedBox(height: 8),
              _SkeletonBox(
                height: 14,
                width: 260,
                radius: 4,
                baseColor: Colors.white.withValues(alpha: 0.25),
                highlightColor: Colors.white.withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 2. Quick Action Cards Row Skeleton
        const Row(
          children: [
            Expanded(
              child: _SkeletonCard(
                radius: 16,
                padding: EdgeInsets.all(14.0),
                child: Row(
                  children: [
                    _SkeletonBox(height: 42, width: 42, radius: 12, baseColor: Color(0xFFDBEAFE)),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SkeletonBox(height: 14, width: 85, radius: 4),
                          SizedBox(height: 6),
                          _SkeletonBox(height: 10, width: 55, radius: 4),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(width: 14),
            Expanded(
              child: _SkeletonCard(
                radius: 16,
                padding: EdgeInsets.all(14.0),
                child: Row(
                  children: [
                    _SkeletonBox(height: 42, width: 42, radius: 12, baseColor: Color(0xFFFFEDD5)),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SkeletonBox(height: 14, width: 85, radius: 4),
                          SizedBox(height: 6),
                          _SkeletonBox(height: 10, width: 55, radius: 4),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // 3. Phil-IRI Assessments Section Header & Cards
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                _SkeletonBox(height: 22, width: 22, radius: 6),
                SizedBox(width: 8),
                _SkeletonBox(height: 18, width: 160, radius: 4),
              ],
            ),
            _SkeletonBox(height: 14, width: 50, radius: 4),
          ],
        ),
        const SizedBox(height: 12),
        _buildPhilIriSkeletonCard(),
        const SizedBox(height: 10),
        _buildPhilIriSkeletonCard(),
        const SizedBox(height: 28),

        // 4. Analytics Breakdown Section
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                _SkeletonBox(height: 22, width: 22, radius: 6),
                SizedBox(width: 8),
                _SkeletonBox(height: 18, width: 180, radius: 4),
              ],
            ),
            _SkeletonBox(height: 14, width: 50, radius: 4),
          ],
        ),
        const SizedBox(height: 12),
        _SkeletonCard(
          radius: 18,
          padding: const EdgeInsets.all(18.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  _SkeletonBox(height: 52, width: 52, radius: 16),
                  SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _SkeletonBox(height: 16, width: 140, radius: 4),
                        SizedBox(height: 6),
                        _SkeletonBox(height: 12, width: 90, radius: 4),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(color: Color(0xFFF1F5F9), height: 1),
              const SizedBox(height: 16),
              _buildSkillProgressBarSkeleton(width: 90, pctWidth: 40),
              const SizedBox(height: 12),
              _buildSkillProgressBarSkeleton(width: 120, pctWidth: 40),
              const SizedBox(height: 12),
              _buildSkillProgressBarSkeleton(width: 100, pctWidth: 40),
            ],
          ),
        ),
        const SizedBox(height: 28),

        // 5. Recent Reading Practice Section
        const Row(
          children: [
            _SkeletonBox(height: 20, width: 20, radius: 6),
            SizedBox(width: 8),
            _SkeletonBox(height: 16, width: 170, radius: 4),
          ],
        ),
        const SizedBox(height: 12),
        const _SkeletonCard(
          radius: 16,
          padding: EdgeInsets.all(14.0),
          child: Row(
            children: [
              _SkeletonBox(height: 42, width: 42, radius: 21),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 14, width: 140, radius: 4),
                    SizedBox(height: 6),
                    _SkeletonBox(height: 10, width: 90, radius: 4),
                  ],
                ),
              ),
              _SkeletonBox(height: 24, width: 55, radius: 12),
            ],
          ),
        ),
        const SizedBox(height: 10),
        const _SkeletonCard(
          radius: 16,
          padding: EdgeInsets.all(14.0),
          child: Row(
            children: [
              _SkeletonBox(height: 42, width: 42, radius: 21),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 14, width: 120, radius: 4),
                    SizedBox(height: 6),
                    _SkeletonBox(height: 10, width: 80, radius: 4),
                  ],
                ),
              ),
              _SkeletonBox(height: 24, width: 55, radius: 12),
            ],
          ),
        ),
      ],
    );
  }

  static Widget _buildPhilIriSkeletonCard() {
    return const _SkeletonCard(
      radius: 16,
      padding: EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  _SkeletonBox(height: 24, width: 75, radius: 12, baseColor: Color(0xFFDBEAFE)),
                  SizedBox(width: 8),
                  _SkeletonBox(height: 24, width: 95, radius: 12),
                ],
              ),
              _SkeletonBox(height: 24, width: 70, radius: 12),
            ],
          ),
          SizedBox(height: 14),
          Divider(color: Color(0xFFF1F5F9), height: 1),
          SizedBox(height: 12),
          Row(
            children: [
              _SkeletonBox(height: 36, width: 36, radius: 18),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 13, width: 100, radius: 4),
                    SizedBox(height: 4),
                    _SkeletonBox(height: 10, width: 70, radius: 4),
                  ],
                ),
              ),
              _SkeletonBox(height: 22, width: 60, radius: 10),
            ],
          ),
          SizedBox(height: 10),
          Row(
            children: [
              _SkeletonBox(height: 36, width: 36, radius: 18),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 13, width: 100, radius: 4),
                    SizedBox(height: 4),
                    _SkeletonBox(height: 10, width: 70, radius: 4),
                  ],
                ),
              ),
              _SkeletonBox(height: 22, width: 60, radius: 10),
            ],
          ),
        ],
      ),
    );
  }

  static Widget _buildSkillProgressBarSkeleton({required double width, required double pctWidth}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _SkeletonBox(height: 12, width: width, radius: 4),
            _SkeletonBox(height: 12, width: pctWidth, radius: 4),
          ],
        ),
        const SizedBox(height: 6),
        const _SkeletonBox(height: 8, width: double.infinity, radius: 4),
      ],
    );
  }

  static Widget assessmentList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SkeletonCard(
          radius: 18,
          padding: EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SkeletonBox(height: 18, width: 140, radius: 4),
              SizedBox(height: 8),
              _SkeletonBox(height: 12, width: 220, radius: 4),
              SizedBox(height: 14),
              Row(
                children: [
                  _SkeletonBox(height: 36, width: 36, radius: 18),
                  SizedBox(width: 10),
                  Expanded(child: _SkeletonBox(height: 14, width: 120, radius: 4)),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        const Row(
          children: [
            _SkeletonPill(width: 76),
            SizedBox(width: 8),
            _SkeletonPill(width: 78),
            SizedBox(width: 8),
            _SkeletonPill(width: 92),
          ],
        ),
        const SizedBox(height: 18),
        _buildPhilIriSkeletonCard(),
        const SizedBox(height: 10),
        _buildPhilIriSkeletonCard(),
      ],
    );
  }

  static Widget progress() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SkeletonCard(
          radius: 16,
          padding: EdgeInsets.all(16.0),
          child: Row(
            children: [
              _SkeletonBox(height: 48, width: 48, radius: 24),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 16, width: 140, radius: 4),
                    SizedBox(height: 6),
                    _SkeletonBox(height: 12, width: 180, radius: 4),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: _SkeletonCard(
                radius: 16,
                padding: EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 28, width: 28, radius: 14),
                    SizedBox(height: 10),
                    _SkeletonBox(height: 20, width: 50, radius: 4),
                    SizedBox(height: 4),
                    _SkeletonBox(height: 10, width: 70, radius: 4),
                  ],
                ),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: _SkeletonCard(
                radius: 16,
                padding: EdgeInsets.all(14.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 28, width: 28, radius: 14),
                    SizedBox(height: 10),
                    _SkeletonBox(height: 20, width: 50, radius: 4),
                    SizedBox(height: 4),
                    _SkeletonBox(height: 10, width: 70, radius: 4),
                  ],
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: 24),
        _SkeletonLine(width: 210),
        SizedBox(height: 12),
        _SkeletonCard(
          radius: 18,
          padding: EdgeInsets.all(16.0),
          child: Column(
            children: [
              _SkeletonBox(height: 14, width: 120, radius: 4),
              SizedBox(height: 12),
              _SkeletonBox(height: 80, width: double.infinity, radius: 8),
            ],
          ),
        ),
      ],
    );
  }

  static Widget announcements() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SkeletonCard(
          radius: 20,
          padding: EdgeInsets.all(16.0),
          child: Row(
            children: [
              _SkeletonBox(height: 40, width: 40, radius: 12),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _SkeletonBox(height: 16, width: 150, radius: 4),
                    SizedBox(height: 6),
                    _SkeletonBox(height: 12, width: 100, radius: 4),
                  ],
                ),
              ),
            ],
          ),
        ),
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
        _SkeletonCard(
          radius: 20,
          padding: EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SkeletonBox(height: 16, width: 180, radius: 4),
              SizedBox(height: 8),
              _SkeletonBox(height: 12, width: 240, radius: 4),
              SizedBox(height: 6),
              _SkeletonBox(height: 12, width: 160, radius: 4),
            ],
          ),
        ),
      ],
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  final double radius;
  final EdgeInsetsGeometry padding;
  final Widget child;

  const _SkeletonCard({
    required this.radius,
    required this.padding,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _ShimmerContainer extends StatefulWidget {
  final Widget child;
  final Color baseColor;
  final Color highlightColor;

  const _ShimmerContainer({
    required this.child,
    this.baseColor = const Color(0xFFE2E8F0),
    this.highlightColor = const Color(0xFFF8FAFC),
  });

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
              colors: [
                widget.baseColor,
                widget.highlightColor,
                widget.baseColor,
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
  final double? width;
  final double radius;
  final Color? baseColor;
  final Color? highlightColor;

  const _SkeletonBox({
    required this.height,
    this.width,
    required this.radius,
    this.baseColor,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    return _ShimmerContainer(
      baseColor: baseColor ?? const Color(0xFFE2E8F0),
      highlightColor: highlightColor ?? const Color(0xFFF8FAFC),
      child: Container(
        height: height,
        width: width,
        decoration: BoxDecoration(
          color: baseColor ?? const Color(0xFFE2E8F0),
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
    return _SkeletonBox(
      height: 16,
      width: width,
      radius: 8,
    );
  }
}

class _SkeletonPill extends StatelessWidget {
  final double width;

  const _SkeletonPill({required this.width});

  @override
  Widget build(BuildContext context) {
    return _SkeletonBox(
      height: 34,
      width: width,
      radius: 999,
    );
  }
}

