import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/home_page.dart';

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
      description: 'Set up your account in few quick steps and explore everything the app has to offer.',
      color: const Color(0xFF1B64D8),
      imagePath: 'assets/landing/onboard/onboard_1.webp',
    ),
    OnboardingData(
      title: 'Read, listen, and speak.',
      description: 'Support reading development through guided and interactive activities.',
      color: const Color(0xFFD34426),
      imagePath: 'assets/landing/onboard/onboard_2.webp',
    ),
    OnboardingData(
      title: 'Track meaningful progress',
      description: 'Monitor performance and gain insights to support continuous improvement.',
      color: const Color(0xFF1B64D8),
      imagePath: 'assets/landing/onboard/onboard_3.webp',
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
        pageBuilder: (context, animation, secondaryAnimation) => const HomePage(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(1.0, 0.0);
          const end = Offset.zero;
          const curve = Curves.easeInOutCubic;
          var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
          return FadeTransition(
            opacity: animation,
            child: SlideTransition(position: animation.drive(tween), child: child),
          );
        },
        transitionDuration: const Duration(milliseconds: 600),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
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
                    return _buildPage(_onboardingSteps[index]);
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
      ),
    );
  }

  Widget _buildPage(OnboardingData data) {
    return Stack(
      children: [
        // Background Decorative Element (Diagonal Strip) moves with the page
        Positioned(
          top: 60,
          left: 0,
          right: 0,
          child: Image.asset(
            data.imagePath,
            fit: BoxFit.fitWidth,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              // Illustration Placeholder
              Center(
                child: Container(
                  width: 300,
                  height: 450,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text(
                      'ILLUSTRATION',
                      style: TextStyle(
                        color: Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
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
                  color: Colors.grey[700],
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ],
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final Color color;
  final String imagePath;

  OnboardingData({
    required this.title,
    required this.description,
    required this.color,
    required this.imagePath,
  });
}
