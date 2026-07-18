import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/library/practice_quiz_page.dart';

class PracticeReaderPage extends StatefulWidget {
  final String bookTitle;
  final String storyText;
  final double initialProgress;
  final List<Map<String, dynamic>> quizQuestions;

  const PracticeReaderPage({
    super.key,
    required this.bookTitle,
    required this.storyText,
    required this.initialProgress,
    required this.quizQuestions,
  });

  @override
  State<PracticeReaderPage> createState() => _PracticeReaderPageState();
}

class _PracticeReaderPageState extends State<PracticeReaderPage> {
  bool _isDarkMode = false;
  int _currentPage = 0;
  final PageController _pageController = PageController();
  bool _isPaginated = false;
  List<List<String>> _pages = [];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  // Dynamic pagination algorithm: measures text height and divides paragraphs into pages
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

      // Space between paragraphs
      final double spacing = currentPage.isEmpty ? 0.0 : paragraphSpacing;

      if (currentHeight + spacing + paraHeight <= maxHeight) {
        currentPage.add(paragraph);
        currentHeight += spacing + paraHeight;
      } else {
        if (currentPage.isEmpty) {
          // If a single paragraph is taller than the max height, add it anyway to avoid lock
          currentPage.add(paragraph);
          pages.add(currentPage);
          currentPage = [];
          currentHeight = 0.0;
        } else {
          // Finish current page and start a new page with this paragraph
          pages.add(currentPage);
          currentPage = [paragraph];
          currentHeight = paraHeight;
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

  @override
  Widget build(BuildContext context) {
    // Theme coloring configuration
    final Color bgColor = _isDarkMode ? const Color(0xFF1A1816) : const Color(0xFFFCFAF7);
    final Color textColor = _isDarkMode ? const Color(0xFFE5E0DB) : const Color(0xFF2D2D2D);
    final Color titleColor = _isDarkMode ? const Color(0xFFECE8E4) : const Color(0xFF1E293B);
    final Color secondaryTextColor = _isDarkMode ? const Color(0xFF8A8580) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
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
                    // 1. Header with Close Button
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const SizedBox(width: 48),
                          Expanded(
                            child: Text(
                              widget.bookTitle,
                              textAlign: TextAlign.center,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.lora(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: titleColor,
                              ),
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
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

                    // 2. Reading Text Block
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, viewConstraints) {
                          // Measure available space inside the scroll container
                          final double horizontalPadding = 56.0; // 28 * 2
                          final double verticalPadding = 48.0; // 24 * 2
                          // Subtract space occupied by the page indicator and bottom control buttons
                          final double footerControlsHeight = 106.0;
                          final double maxWidth = viewConstraints.maxWidth - horizontalPadding;
                          final double maxHeight = viewConstraints.maxHeight - verticalPadding - footerControlsHeight;

                          // Text Style configuration for Painter measurements
                          final TextStyle textStyle = GoogleFonts.lora(
                            fontSize: 22,
                            height: 1.65,
                            fontWeight: FontWeight.w500,
                            color: textColor,
                          );

                          // Only compute pagination once or when constraints change
                          if (!_isPaginated) {
                            _pages = _paginateStory(
                              fullText: widget.storyText,
                              maxWidth: maxWidth > 0 ? maxWidth : 100,
                              maxHeight: maxHeight > 0 ? maxHeight : 100,
                              textStyle: textStyle,
                              paragraphSpacing: 28.0,
                            );
                            _isPaginated = true;

                            // Adjust starting page based on initialProgress
                            if (widget.initialProgress > 0) {
                              final targetPage = (widget.initialProgress * _pages.length).floor();
                              _currentPage = targetPage.clamp(0, _pages.length - 1);
                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                if (_pageController.hasClients) {
                                  _pageController.jumpToPage(_currentPage);
                                }
                              });
                            }
                          }

                          final int totalPages = _pages.length;
                          final int activePage = _currentPage.clamp(0, totalPages - 1);

                          return Column(
                            children: [
                              // Swipable pages
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
                                    final pageParagraphs = _pages[pageIndex];

                                    return Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 24.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.stretch,
                                        mainAxisAlignment: MainAxisAlignment.start,
                                        children: List.generate(pageParagraphs.length, (pIndex) {
                                          final paragraphText = pageParagraphs[pIndex].trim();
                                          final isChapterHeader = paragraphText.startsWith('Chapter');
                                          final isLast = pIndex == pageParagraphs.length - 1;

                                          if (isChapterHeader) {
                                            return Padding(
                                              padding: const EdgeInsets.only(bottom: 20.0, top: 10.0),
                                              child: Text(
                                                paragraphText,
                                                textAlign: TextAlign.center,
                                                style: GoogleFonts.lora(
                                                  fontSize: 26,
                                                  fontWeight: FontWeight.w800,
                                                  color: titleColor,
                                                ),
                                              ),
                                            );
                                          }

                                          return Padding(
                                            padding: EdgeInsets.only(bottom: isLast ? 0.0 : 28.0),
                                            child: Text(
                                              paragraphText,
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

                              // 4. Footer navigation controls
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
    );
  }

  // Custom Animated Theme Switcher (Light / Dark mode toggle)
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

  // Action Button at bottom right (Next Page caret, Intermediate Dual, OR Complete practice)
  Widget _buildActionButton(int activePage, int totalPages) {
    final isFirstPage = activePage == 0;
    final isLastPage = activePage == totalPages - 1;
    final Color buttonBgColor = _isDarkMode ? const Color(0xFF1E2530) : const Color(0xFFE8ECF4);
    final Color iconColor = _isDarkMode ? Colors.white : const Color(0xFF475569);

    if (totalPages <= 1) {
      return GestureDetector(
        onTap: () {
          Feedback.forTap(context);
          _showFinishedDialog();
        },
        child: _buildFinishButton(),
      );
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 200),
      child: isLastPage
          ? Row(
              key: const ValueKey('last_page_nav_row'),
              mainAxisSize: MainAxisSize.min,
              children: [
                // Back button to previous page
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
                // Finish Button
                GestureDetector(
                  onTap: () {
                    Feedback.forTap(context);
                    _showFinishedDialog();
                  },
                  child: _buildFinishButton(),
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
                  // Left button (Back) - visible only if not on the first page
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
                  // Right button (Next)
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

  Widget _buildFinishButton() {
    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: const Color(0xFF1B64D8),
        borderRadius: BorderRadius.circular(24),
      ),
      alignment: Alignment.center,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Finish',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          const SizedBox(width: 8),
          const Icon(
            Icons.check_rounded,
            color: Colors.white,
            size: 18,
          ),
        ],
      ),
    );
  }

  void _showFinishedDialog() {
    final titleColor = _isDarkMode ? const Color(0xFFECE8E4) : const Color(0xFF1E293B);
    final descColor = _isDarkMode ? const Color(0xFFC5C0BA) : const Color(0xFF475569);
    final dialogBg = _isDarkMode ? const Color(0xFF22201E) : Colors.white;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          titlePadding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 28.0),
          contentPadding: const EdgeInsets.only(left: 24.0, right: 24.0, top: 16.0, bottom: 24.0),
          actionsPadding: const EdgeInsets.only(right: 16.0, bottom: 16.0),
          title: Text(
            'Start Quiz?',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w800,
              fontSize: 24,
              color: titleColor,
            ),
          ),
          content: Text(
            'You have finished reading "${widget.bookTitle}". Are you ready to start the quiz and test your understanding?',
            style: GoogleFonts.inter(
              fontSize: 15,
              color: descColor,
              height: 1.5,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext); // Close dialog
              },
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(
                  color: _isDarkMode ? const Color(0xFFC5C0BA) : const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext); // Close dialog
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PracticeQuizPage(
                      bookTitle: widget.bookTitle,
                      questions: widget.quizQuestions,
                    ),
                  ),
                );
              },
              child: Text(
                'Start',
                style: GoogleFonts.inter(
                  color: const Color(0xFF1B64D8),
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
