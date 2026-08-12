import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_quiz_page.dart';

class OralReadingAssessmentReaderPage extends StatefulWidget {
  const OralReadingAssessmentReaderPage({super.key});

  @override
  State<OralReadingAssessmentReaderPage> createState() => _OralReadingAssessmentReaderPageState();
}

class _OralReadingAssessmentReaderPageState extends State<OralReadingAssessmentReaderPage> {
  bool _isDarkMode = false;
  int _currentPage = 0;
  final PageController _pageController = PageController();

  double _recordingProgress = 0.2;
  Timer? _progressTimer;
  final Random _random = Random();

  String _fullStoryText = '';

  @override
  void initState() {
    super.initState();
    _fetchPassageFromApi();
    _progressTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      if (mounted) {
        setState(() {
          _recordingProgress = 0.15 + _random.nextDouble() * 0.70;
        });
      }
    });
  }

  void _fetchPassageFromApi() async {
    try {
      final res = await ApiService.get('/student/assessment/passages?grade=Grade%204&type=oral&period=Pre-Test');
      if (res.success && res.data != null && res.data['passages'] != null && (res.data['passages'] as List).isNotEmpty) {
        final passage = res.data['passages'][0];
        if (mounted) {
          setState(() {
            _fullStoryText = passage['contentText'] ?? '';
            _dynamicQuestions = passage['questions'];
          });
        }
        return;
      }
    } catch (e) {
      debugPrint('Passage API fetch notice: $e');
    }
  }

  @override
  void dispose() {
    _progressTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  // Dynamic pagination algorithm
  // Dynamic pagination algorithm that prevents layout cutoff
  List<List<String>> _paginateStory({
    required String fullText,
    required double maxWidth,
    required double maxHeight,
    required TextStyle textStyle,
    required double paragraphSpacing,
  }) {
    final List<String> paragraphs = fullText.split('\n\n');
    final List<List<String>> pages = [];
    List<String> currentPage = [];
    double currentHeight = 0.0;

    for (final paragraph in paragraphs) {
      final textPainter = TextPainter(
        text: TextSpan(text: paragraph.trim(), style: textStyle),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout(maxWidth: maxWidth);
      final double paraHeight = textPainter.height;

      final double spacing = currentPage.isEmpty ? 0.0 : paragraphSpacing;

      if (currentHeight + spacing + paraHeight <= maxHeight) {
        currentPage.add(paragraph);
        currentHeight += spacing + paraHeight;
      } else {
        // The paragraph doesn't fit as a whole.
        // If the current page already has text, finish it and try this paragraph on a clean next page.
        if (currentPage.isNotEmpty) {
          pages.add(currentPage);
          currentPage = [];
          currentHeight = 0.0;
        }

        // Now on a clean page. Check if the paragraph fits as a whole.
        final textPainterClean = TextPainter(
          text: TextSpan(text: paragraph.trim(), style: textStyle),
          textDirection: TextDirection.ltr,
        );
        textPainterClean.layout(maxWidth: maxWidth);
        final double paraHeightClean = textPainterClean.height;

        if (paraHeightClean <= maxHeight) {
          currentPage.add(paragraph);
          currentHeight = paraHeightClean;
        } else {
          // If it still doesn't fit on a clean page, split by sentences to avoid overflow
          final sentences = _splitIntoSentences(paragraph);
          for (final sentence in sentences) {
            final textPainterSent = TextPainter(
              text: TextSpan(text: sentence.trim(), style: textStyle),
              textDirection: TextDirection.ltr,
            );
            textPainterSent.layout(maxWidth: maxWidth);
            final double sentHeight = textPainterSent.height;
            final double sentSpacing = currentPage.isEmpty ? 0.0 : paragraphSpacing;

            if (currentHeight + sentSpacing + sentHeight <= maxHeight) {
              currentPage.add(sentence);
              currentHeight += sentSpacing + sentHeight;
            } else {
              if (currentPage.isNotEmpty) {
                pages.add(currentPage);
              }
              currentPage = [sentence];
              currentHeight = sentHeight;
            }
          }
        }
      }
    }

    if (currentPage.isNotEmpty) {
      pages.add(currentPage);
    }

    if (pages.isEmpty) {
      pages.add(['']);
    }

    return pages;
  }

  List<String> _splitIntoSentences(String paragraph) {
    final List<String> result = [];
    int start = 0;
    for (int i = 0; i < paragraph.length; i++) {
      if (i < paragraph.length - 1) {
        final char = paragraph[i];
        final nextChar = paragraph[i + 1];
        if ((char == '.' || char == '?' || char == '!') && (nextChar == ' ' || nextChar == '”')) {
          final int end = (nextChar == '”') ? i + 2 : i + 1;
          result.add(paragraph.substring(start, end).trim());
          start = end;
          i = end - 1;
        }
      }
    }
    if (start < paragraph.length) {
      final remainder = paragraph.substring(start).trim();
      if (remainder.isNotEmpty) {
        result.add(remainder);
      }
    }
    return result.isEmpty ? [paragraph] : result;
  }

  @override
  Widget build(BuildContext context) {
    final Color bgColor = _isDarkMode ? const Color(0xFF1A1816) : const Color(0xFFFCFAF7);
    final Color textColor = _isDarkMode ? const Color(0xFFE5E0DB) : const Color(0xFF2D2D2D);
    final Color titleColor = _isDarkMode ? const Color(0xFFECE8E4) : const Color(0xFF1E293B);
    final Color secondaryTextColor = _isDarkMode ? const Color(0xFF8A8580) : const Color(0xFF64748B);
    const primaryBlue = Color(0xFF1B64D8);

    return Scaffold(
      backgroundColor: bgColor,
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) return;
          _confirmExit(context);
        },
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isTablet = constraints.maxWidth > 600;

              return Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: isTablet ? 520 : double.infinity,
                  ),
                  child: Column(
                    children: [
                      // 1. Header with Close Button and Title
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const SizedBox(width: 48),
                            Expanded(
                              child: Text(
                                'Isang Pangarap',
                                textAlign: TextAlign.center,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.lora(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: titleColor,
                                ),
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                Feedback.forTap(context);
                                _confirmExit(context);
                              },
                              icon: Icon(
                                Icons.close_rounded,
                                size: 28,
                                color: titleColor,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // 2. Reading Text Block (PageView with dynamic pagination)
                      Expanded(
                        child: LayoutBuilder(
                          builder: (context, viewConstraints) {
                            final double horizontalPadding = 56.0;
                            final double verticalPadding = 48.0;
                            // Account for page indicator, mic row, and theme switchers
                            final double footerControlsHeight = 176.0;
                            final double maxWidth = viewConstraints.maxWidth - horizontalPadding;
                            final double maxHeight = viewConstraints.maxHeight - verticalPadding - footerControlsHeight - 12.0;

                            final TextStyle textStyle = GoogleFonts.lora(
                              fontSize: 22,
                              height: 1.65,
                              fontWeight: FontWeight.w500,
                              color: textColor,
                            );

                            final dynamicPages = _paginateStory(
                              fullText: _fullStoryText,
                              maxWidth: maxWidth > 0 ? maxWidth : 100,
                              maxHeight: maxHeight > 0 ? maxHeight : 100,
                              textStyle: textStyle,
                              paragraphSpacing: 28.0,
                            );

                            final int totalPages = dynamicPages.length;
                            final int activePage = _currentPage.clamp(0, totalPages - 1);

                            return Column(
                              children: [
                                Expanded(
                                  child: PageView.builder(
                                    controller: _pageController,
                                    physics: const BouncingScrollPhysics(),
                                    itemCount: totalPages,
                                    onPageChanged: (pageIndex) {
                                      setState(() {
                                        _currentPage = pageIndex;
                                      });
                                    },
                                    itemBuilder: (context, pageIndex) {
                                      final pageParagraphs = dynamicPages[pageIndex];

                                      return Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 24.0),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.stretch,
                                          mainAxisAlignment: MainAxisAlignment.start,
                                          children: List.generate(pageParagraphs.length, (pIndex) {
                                            final isLast = pIndex == pageParagraphs.length - 1;
                                            return Padding(
                                              padding: EdgeInsets.only(bottom: isLast ? 0.0 : 28.0),
                                              child: Text(
                                                pageParagraphs[pIndex].trim(),
                                                style: textStyle,
                                              ),
                                            );
                                          }),
                                        ),
                                      );
                                    },
                                  ),
                                ),

                                // 3. Centered page count indicator
                                Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                                  child: Text(
                                    '${activePage + 1}/$totalPages',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: secondaryTextColor,
                                    ),
                                  ),
                                ),

                                // 4. Active Voice Recording Indicator Row
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 12.0),
                                  child: Row(
                                    children: [
                                      Icon(
                                        Icons.mic_none_rounded,
                                        color: _isDarkMode ? Colors.white : primaryBlue,
                                        size: 26,
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: LayoutBuilder(
                                          builder: (context, barConstraints) {
                                            return ClipRRect(
                                              borderRadius: BorderRadius.circular(4),
                                              child: Container(
                                                height: 6,
                                                width: double.infinity,
                                                color: _isDarkMode
                                                    ? Colors.white
                                                    : const Color(0xFFE2E8F0),
                                                child: Stack(
                                                  children: [
                                                    AnimatedContainer(
                                                      duration: const Duration(milliseconds: 100),
                                                      width: barConstraints.maxWidth * _recordingProgress,
                                                      color: primaryBlue,
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // 5. Footer navigation controls
                                Padding(
                                  padding: const EdgeInsets.only(
                                      left: 24.0, right: 24.0, bottom: 20.0, top: 12.0),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildThemeSwitcher(),
                                      _buildActionButton(activePage, totalPages),
                                    ],
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildThemeSwitcher() {
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        setState(() {
          _isDarkMode = !_isDarkMode;
        });
      },
      child: Container(
        width: 90,
        height: 48,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          color: _isDarkMode ? const Color(0xFF141A24) : const Color(0xFFE2E8F0),
        ),
        child: Stack(
          children: [
            AnimatedAlign(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOutCubic,
              alignment: _isDarkMode ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 44,
                height: 44,
                margin: const EdgeInsets.symmetric(horizontal: 2),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF1B64D8),
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.only(left: 12),
                child: Icon(
                  Icons.wb_sunny_rounded,
                  color: _isDarkMode ? const Color(0xFF4A5568) : Colors.white,
                  size: 20,
                ),
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Icon(
                  Icons.nightlight_round,
                  color: _isDarkMode ? Colors.white : const Color(0xFF94A3B8),
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(int activePage, int totalPages) {
    final isFirstPage = activePage == 0;
    final isLastPage = activePage == totalPages - 1;
    final Color buttonBgColor = _isDarkMode ? const Color(0xFF1E2530) : const Color(0xFFE2E8F0);
    final Color iconColor = _isDarkMode ? Colors.white : const Color(0xFF475569);

    if (totalPages <= 1) {
      return GestureDetector(
        onTap: _finishReading,
        child: _buildStartQuizButton(),
      );
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: isLastPage
          ? Row(
              key: const ValueKey('last_page_nav_row'),
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () {
                    Feedback.forTap(context);
                    _pageController.previousPage(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeInOutCubic,
                    );
                  },
                  child: Container(
                    width: 50,
                    height: 48,
                    decoration: BoxDecoration(
                      color: buttonBgColor,
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Icon(
                      Icons.chevron_left_rounded,
                      color: iconColor,
                      size: 26,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () {
                    Feedback.forTap(context);
                    _confirmStartQuiz(context);
                  },
                  child: _buildStartQuizButton(),
                ),
              ],
            )
          : Container(
              key: const ValueKey('capsule_page_nav_btn'),
              width: 100,
              height: 48,
              decoration: BoxDecoration(
                color: buttonBgColor,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  isFirstPage
                      ? const SizedBox(width: 50)
                      : GestureDetector(
                          onTap: () {
                            Feedback.forTap(context);
                            _pageController.previousPage(
                              duration: const Duration(milliseconds: 250),
                              curve: Curves.easeInOutCubic,
                            );
                          },
                          child: Container(
                            width: 50,
                            height: 48,
                            color: Colors.transparent,
                            child: Icon(
                              Icons.chevron_left_rounded,
                              color: iconColor,
                              size: 26,
                            ),
                          ),
                        ),
                  GestureDetector(
                    onTap: () {
                      Feedback.forTap(context);
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 250),
                        curve: Curves.easeInOutCubic,
                      );
                    },
                    child: Container(
                      width: 50,
                      height: 48,
                      color: Colors.transparent,
                      child: Icon(
                        Icons.chevron_right_rounded,
                        color: iconColor,
                        size: 26,
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStartQuizButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      height: 48,
      decoration: BoxDecoration(
        color: const Color(0xFF1B64D8),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1B64D8).withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Start Quiz',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.arrow_forward_rounded,
            color: Colors.white,
            size: 18,
          ),
        ],
      ),
    );
  }

  void _confirmExit(BuildContext context) {
    final titleColor = _isDarkMode ? const Color(0xFFECE8E4) : const Color(0xFF1E293B);
    final descColor = _isDarkMode ? const Color(0xFFC5C0BA) : const Color(0xFF475569);
    final dialogBg = _isDarkMode ? const Color(0xFF22201E) : Colors.white;
    final cancelColor = _isDarkMode ? const Color(0xFFC5C0BA) : const Color(0xFF64748B);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Exit Assessment?',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: titleColor),
          ),
          content: Text(
            'Your current reading progress will be lost. Are you sure you want to exit?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(color: cancelColor, fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Close Reader Page
              },
              child: Text(
                'Exit',
                style: GoogleFonts.inter(color: Colors.redAccent, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        );
      },
    );
  }

  void _confirmStartQuiz(BuildContext context) {
    final titleColor = _isDarkMode ? const Color(0xFFECE8E4) : const Color(0xFF1E293B);
    final descColor = _isDarkMode ? const Color(0xFFC5C0BA) : const Color(0xFF475569);
    final dialogBg = _isDarkMode ? const Color(0xFF22201E) : Colors.white;
    final cancelColor = _isDarkMode ? const Color(0xFFC5C0BA) : const Color(0xFF64748B);

    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Start Quiz?',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: titleColor),
          ),
          content: Text(
            'You won\'t be able to read the story again once you start the quiz. Are you ready to begin?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(color: cancelColor, fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext); // Close dialog
                _finishReading();             // Transition to Quiz Page
              },
              child: Text(
                'Start',
                style: GoogleFonts.inter(color: const Color(0xFF1B64D8), fontWeight: FontWeight.w700),
              ),
            ),
          ],
        );
      },
    );
  }

  List<dynamic>? _dynamicQuestions;

  void _finishReading() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => OralReadingAssessmentQuizPage(
          dynamicQuestions: _dynamicQuestions,
        ),
      ),
    );
  }
}
