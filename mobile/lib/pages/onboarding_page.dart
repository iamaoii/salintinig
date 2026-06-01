import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/home_page.dart';
import 'dart:ui' as ui;

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _onboardingSteps = [
    OnboardingData(
      title: 'Explore fun stories and activities made just for you.',
      description:
          'Set up your account in few quick steps and explore everything the app has to offer.',
      color: const Color(0xFF1B64D8),
      imagePath: 'assets/onboarding/onboarding_1.webp',
      panelType: PanelType.single,
      primaryMascot: 'assets/mascot/sally_reading.webp',
    ),
    OnboardingData(
      title: 'Read, listen, and speak.',
      description:
          'Support reading development through guided and interactive activities.',
      color: const Color(0xFFD34426),
      imagePath: 'assets/onboarding/onboarding_2.webp',
      panelType: PanelType.multi,
      primaryMascot: 'assets/mascot/sally_listening.webp',
      secondaryMascot: 'assets/mascot/sally_speaking.webp',
      tertiaryMascot: 'assets/mascot/sally_sitting.webp',
    ),
    OnboardingData(
      title: 'Track meaningful progress',
      description:
          'Monitor performance and gain insights to support continuous improvement.',
      color: const Color(0xFF1B64D8),
      imagePath: 'assets/onboarding/onboarding_3.webp',
      panelType: PanelType.single,
      primaryMascot: 'assets/mascot/sally_celebration.webp',
    ),
  ];

  void _onNext() {
    if (_currentPage < _onboardingSteps.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _navigateToHome();
    }
  }

  void _navigateToHome() {
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const HomePage(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(1.0, 0.0);
          const end = Offset.zero;
          const curve = Curves.easeInOutCubic;
          var tween =
              Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
          return FadeTransition(
            opacity: animation,
            child:
                SlideTransition(position: animation.drive(tween), child: child),
          );
        },
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F4EF),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final double W = constraints.maxWidth;
          final double H = constraints.maxHeight;
          final double scale = (H / 720.0).clamp(0.75, 1.35);
          final double topPadding = MediaQuery.of(context).padding.top;

          return Stack(
            clipBehavior: Clip.hardEdge,
            children: [
              // 1. Continuous Background Stripe (behind PageView)
              AnimatedBuilder(
                animation: _pageController,
                builder: (context, child) {
                  final double pageValue = (_pageController.hasClients &&
                          _pageController.position.hasContentDimensions)
                      ? (_pageController.page ?? 0.0)
                      : 0.0;

                  // Adjust to a middle ground to hit the sweet spot.
                  return Positioned(
                    top: H * 0.06,
                    left: -pageValue * W,
                    width: 3 * W,
                    child: Image.asset(
                      'assets/onboarding/onboarding_bg.webp',
                      width: 3 * W,
                      fit: BoxFit.fitWidth,
                    ),
                  );
                },
              ),

              // 2. PageView and Controls on top
              Column(
                children: [
                  Expanded(
                    child: PageView.builder(
                      controller: _pageController,
                      onPageChanged: (index) {
                        setState(() {
                          _currentPage = index;
                        });
                      },
                      itemCount: _onboardingSteps.length,
                      itemBuilder: (context, index) {
                        return _buildPage(
                          _onboardingSteps[index],
                          scale,
                          topPadding,
                        );
                      },
                    ),
                  ),

                  // Bottom Controls
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 48),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Skip Button
                        TextButton(
                          onPressed: _navigateToHome,
                          child: Text(
                            'Skip',
                            style: GoogleFonts.inter(
                              color: Colors.grey[500],
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),

                        // Page Indicators
                        Row(
                          children: List.generate(
                            _onboardingSteps.length,
                            (index) => AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              width: index == _currentPage ? 24 : 12,
                              height: 12,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(6),
                                color: index == _currentPage
                                    ? const Color(0xFF1B64D8)
                                    : Colors.grey[300],
                              ),
                            ),
                          ),
                        ),

                        // Next Button
                        GestureDetector(
                          onTap: _onNext,
                          child: Container(
                            width: 56,
                            height: 56,
                            decoration: const BoxDecoration(
                              color: Color(0xFF1B64D8),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.chevron_right,
                              color: Colors.white,
                              size: 32,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPage(OnboardingData data, double scale, double topPadding) {
    if (data.panelType == PanelType.multi) {
      return _buildMultiMascotPage(data, scale, topPadding);
    }
    return _buildSingleMascotPage(data, scale, topPadding);
  }

  // ─── Panel 1 & 3: Single mascot ──────────────────────────────────────────
  Widget _buildSingleMascotPage(
    OnboardingData data,
    double scale,
    double topPadding,
  ) {
    return Stack(
      clipBehavior: Clip.hardEdge,
      children: [
        // Mascot — full width container so visible character ≈ 80% of screen
        Positioned(
          top: 115 * scale,
          left: 0,
          right: 0,
          child: _buildMascotWithShadow(
            data.primaryMascot!,
            widthFactor: 0.85,
          ),
        ),

        // Text content anchored to the bottom
        Positioned.fill(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                Text(
                  data.title,
                  style: GoogleFonts.inter(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
                    letterSpacing: -1.2,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  data.description,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    color: Colors.grey[600],
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ─── Panel 2: Multi-mascot layout ─────────────────────────────────────────
  Widget _buildMultiMascotPage(
    OnboardingData data,
    double scale,
    double topPadding,
  ) {
    // Account for the device status bar (topPadding) plus 32px of scale-adjusted breathing room.
    final double baseTop = topPadding + (32.0 * scale);

    return Stack(
      clipBehavior: Clip.hardEdge,
      children: [
        // 1. Listening mascot — placed safely below the status bar
        Positioned(
          top: baseTop,
          left: 0,
          right: 0,
          child: _buildMascotWithShadow(
            data.primaryMascot!,
            widthFactor: 0.54,
          ),
        ),

        // 2. Text content — flows naturally below the primary mascot
        Positioned(
          top: baseTop + (215 * scale),
          left: 24,
          right: 24,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                data.title,
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  height: 1.1,
                  letterSpacing: -1.0,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                data.description,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  color: Colors.grey[600],
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),

        // 3. Speaking mascot — positioned precisely relative to the wave
        Positioned(
          top: baseTop + (280 * scale),
          right: 24 * scale,
          child: SizedBox(
            width: 110 * scale,
            height: 110 * scale,
            child: _buildMascotWithShadow(
              data.secondaryMascot!,
              widthFactor: 1.0,
            ),
          ),
        ),

        // 4. Sitting mascot — positioned elegantly at the bottom left
        Positioned(
          top: baseTop + (350 * scale),
          left: 20 * scale,
          child: SizedBox(
            width: 200 * scale,
            height: 200 * scale,
            child: _buildMascotWithShadow(
              data.tertiaryMascot!,
              widthFactor: 1.0,
            ),
          ),
        ),
      ],
    );
  }


  Widget _buildMascotWithShadow(
    String assetPath, {
    double widthFactor = 1.0,
    Offset shadowOffset = const Offset(4, 7), // Exact down-right sticker offset from example
    double blurRadius = 4.0,                  // Crisp, defined outline blur from example
  }) {
    return Center(
      child: FractionallySizedBox(
        widthFactor: widthFactor,
        child: AspectRatio(
          aspectRatio: 1.0,
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              // 1. Crisp Silhouette Shadow (100% Web and HTML Renderer compatible!)
              Positioned.fill(
                child: Transform.translate(
                  offset: shadowOffset,
                  child: ImageFiltered(
                    imageFilter: ui.ImageFilter.blur(
                      sigmaX: blurRadius,
                      sigmaY: blurRadius,
                    ),
                    child: Image.asset(
                      assetPath,
                      color: Colors.black.withOpacity(0.35), // Matches the dark, crisp depth of example
                      colorBlendMode: BlendMode.srcIn,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),
              // 2. High-Resolution Original Mascot
              Positioned.fill(
                child: Image.asset(
                  assetPath,
                  fit: BoxFit.contain,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

enum PanelType { single, multi }

class OnboardingData {
  final String title;
  final String description;
  final Color color;
  final String imagePath;
  final PanelType panelType;
  final String? primaryMascot;
  final String? secondaryMascot;
  final String? tertiaryMascot;

  // Keep mascotPath as alias for backwards compatibility
  String? get mascotPath => primaryMascot;

  OnboardingData({
    required this.title,
    required this.description,
    required this.color,
    required this.imagePath,
    required this.panelType,
    this.primaryMascot,
    this.secondaryMascot,
    this.tertiaryMascot,
  });
}
