import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/library/practice_quiz_page.dart';
import 'package:salintinig/services/library_service.dart';

class PracticeReaderPage extends StatefulWidget {
  final String? materialId;
  final String bookTitle;
  final String storyText;
  final double initialProgress;
  final List<Map<String, dynamic>> quizQuestions;

  const PracticeReaderPage({
    super.key,
    this.materialId,
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
  final ScrollController _scrollController = ScrollController();
  double _scrollProgress = 0.0;
  bool _hasRestoredPosition = false;
  bool _isShortStory = false;

  bool get _isEnglish {
    final title = widget.bookTitle.toLowerCase();
    final text = widget.storyText.toLowerCase();
    if (title.contains('english') || text.contains(' the ') || text.contains(' was ') || text.contains(' were ') || text.contains(' which ')) {
      return true;
    }
    if (widget.quizQuestions.isNotEmpty) {
      final qText = (widget.quizQuestions[0]['questionText'] ?? widget.quizQuestions[0]['question'] ?? '').toString().toLowerCase();
      if (qText.contains('who ') || qText.contains('what ') || qText.contains('where ') || qText.contains('why ') || qText.contains('how ')) {
        return true;
      }
    }
    return false;
  }

  @override
  void initState() {
    super.initState();
    _scrollProgress = widget.initialProgress;
    _scrollController.addListener(_handleScroll);

    // Record initial reading progress immediately so it registers as in-progress even before scrolling
    final initialRatio = widget.initialProgress > 0.05 ? widget.initialProgress : 0.05;
    _recordCurrentProgress(initialRatio);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkShortStoryAndRestoreScroll();
    });
  }

  void _checkShortStoryAndRestoreScroll() {
    if (!mounted || !_scrollController.hasClients) return;

    final maxExtent = _scrollController.position.maxScrollExtent;
    // If maxScrollExtent is 0 or negligible, the entire story fits in 1 page/screen!
    if (maxExtent <= 10.0) {
      setState(() {
        _isShortStory = true;
        _scrollProgress = 1.0;
        _hasRestoredPosition = true;
      });
      _recordCurrentProgress(1.0);
      return;
    }

    if (!_hasRestoredPosition && widget.initialProgress > 0) {
      _hasRestoredPosition = true;
      final targetOffset = (widget.initialProgress * maxExtent).clamp(0.0, maxExtent);
      _scrollController.jumpTo(targetOffset);
    } else {
      _hasRestoredPosition = true;
    }
  }

  void _handleScroll() {
    if (!_scrollController.hasClients || !_hasRestoredPosition) return;
    final maxExtent = _scrollController.position.maxScrollExtent;
    if (maxExtent <= 10.0) {
      if (_scrollProgress < 1.0) {
        setState(() {
          _isShortStory = true;
          _scrollProgress = 1.0;
        });
        _recordCurrentProgress(1.0);
      }
      return;
    }

    final currentOffset = _scrollController.offset.clamp(0.0, maxExtent);
    final ratio = (currentOffset / maxExtent).clamp(0.0, 1.0);

    if ((ratio - _scrollProgress).abs() >= 0.01 || ratio >= 0.99) {
      setState(() {
        _scrollProgress = ratio;
      });
      _recordCurrentProgress(ratio);
    }
  }

  void _recordCurrentProgress(double progressRatio) {
    LibraryService.recordStoryProgress(
      materialId: widget.materialId,
      bookTitle: widget.bookTitle,
      progress: progressRatio,
      lastPageRead: ((progressRatio * 10).ceil()).clamp(1, 999),
    );
  }

  @override
  void dispose() {
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    super.dispose();
  }

  List<String> _parseParagraphs(String fullText) {
    final raw = fullText.split(RegExp(r'\n\s*\n'));
    return raw.map((p) => p.trim()).where((p) => p.isNotEmpty).toList();
  }

  @override
  Widget build(BuildContext context) {
    final Color bgColor = _isDarkMode ? const Color(0xFF1A1816) : const Color(0xFFFCFAF7);
    final Color textColor = _isDarkMode ? const Color(0xFFE5E0DB) : const Color(0xFF2D2D2D);
    final Color titleColor = _isDarkMode ? const Color(0xFFECE8E4) : const Color(0xFF1E293B);
    final Color secondaryTextColor = _isDarkMode ? const Color(0xFF8A8580) : const Color(0xFF64748B);
    const Color primaryBlue = Color(0xFF1B64D8);

    final paragraphs = _parseParagraphs(widget.storyText);

    final TextStyle textStyle = GoogleFonts.lora(
      fontSize: 22.0,
      height: 1.75,
      fontWeight: FontWeight.w500,
      color: textColor,
    );

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 540 : double.infinity,
                ),
                child: Column(
                  children: [
                    // 1. Header with Title & Close Button
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
                              _recordCurrentProgress(_scrollProgress);
                              Navigator.pop(context, _scrollProgress);
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

                    // 3. Scrollable Story Content (Continuous Vertical Scroll)
                    Expanded(
                      child: NotificationListener<ScrollNotification>(
                        onNotification: (notification) {
                          if (!_hasRestoredPosition) {
                            _checkShortStoryAndRestoreScroll();
                          }
                          return false;
                        },
                        child: SingleChildScrollView(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24.0,
                            vertical: 24.0,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              ...List.generate(paragraphs.length, (pIndex) {
                                final paragraphText = paragraphs[pIndex];
                                final lower = paragraphText.toLowerCase();
                                final isChapterHeader = lower.startsWith('chapter') ||
                                    lower.startsWith('kabanata') ||
                                    paragraphText.startsWith('#');
                                final isLast = pIndex == paragraphs.length - 1;

                                if (isChapterHeader) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 24.0, top: 16.0),
                                    child: Text(
                                      paragraphText.replaceAll(RegExp(r'^#+\s*'), ''),
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.lora(
                                        fontSize: 24,
                                        fontWeight: FontWeight.w800,
                                        color: titleColor,
                                        height: 1.3,
                                      ),
                                    ),
                                  );
                                }

                                return Padding(
                                  padding: EdgeInsets.only(bottom: isLast ? 24.0 : 30.0),
                                  child: Text(
                                    paragraphText,
                                    style: textStyle,
                                  ),
                                );
                              }),

                              const SizedBox(height: 40),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // 2. Reading Progress Indicator Bar (at the bottom, above footer)
                    ClipRRect(
                      child: LinearProgressIndicator(
                        value: _scrollProgress.clamp(0.02, 1.0),
                        backgroundColor: _isDarkMode
                            ? const Color(0xFF2D2B28)
                            : const Color(0xFFE2E8F0),
                        valueColor: const AlwaysStoppedAnimation<Color>(primaryBlue),
                        minHeight: 3.5,
                      ),
                    ),

                    // 4. Footer controls (Theme Switcher & Live Percentage / Finish Quiz Button)
                    Container(
                      height: 72,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24.0,
                        vertical: 12.0,
                      ),
                      decoration: BoxDecoration(
                        color: bgColor,
                        border: Border(
                          top: BorderSide(
                            color: _isDarkMode
                                ? Colors.white.withValues(alpha: 0.05)
                                : Colors.black.withValues(alpha: 0.05),
                          ),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          _buildThemeSwitcher(),
                          SizedBox(
                            height: 48,
                            child: Align(
                              alignment: Alignment.centerRight,
                              child: (_scrollProgress >= 0.99 || _isShortStory)
                                  ? GestureDetector(
                                      onTap: () {
                                        Feedback.forTap(context);
                                        _showFinishedDialog();
                                      },
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20,
                                          vertical: 12,
                                        ),
                                        height: 48,
                                        decoration: BoxDecoration(
                                          color: primaryBlue,
                                          borderRadius: BorderRadius.circular(24),
                                          boxShadow: [
                                            BoxShadow(
                                              color: primaryBlue.withValues(alpha: 0.25),
                                              blurRadius: 8,
                                              offset: const Offset(0, 3),
                                            ),
                                          ],
                                        ),
                                        alignment: Alignment.center,
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(
                                              Icons.check_circle_rounded,
                                              color: Colors.white,
                                              size: 18,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Finish & Start Quiz',
                                              style: GoogleFonts.inter(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w700,
                                                fontSize: 15,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    )
                                  : Text(
                                      _isEnglish
                                          ? '${(_scrollProgress * 100).toInt()}% completed'
                                          : '${(_scrollProgress * 100).toInt()}% kumpleto',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        color: secondaryTextColor,
                                      ),
                                    ),
                            ),
                          ),
                        ],
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

  // Custom Animated Theme Switcher (Matching Phil-IRI Assessment height 48, width 96)
  Widget _buildThemeSwitcher() {
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        setState(() {
          _isDarkMode = !_isDarkMode;
        });
      },
      child: Container(
        width: 96,
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
            _isEnglish ? 'Start Quiz?' : 'Simulan ang Pagsusulit?',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w800,
              fontSize: 24,
              color: titleColor,
            ),
          ),
          content: Text(
            _isEnglish
                ? 'You have finished reading "${widget.bookTitle}". Are you ready to start the quiz and test your understanding?'
                : 'Natapos mo nang basahin ang "${widget.bookTitle}". Handa ka na bang simulan ang pagsusulit upang subukin ang iyong pag-unawa?',
            style: GoogleFonts.inter(
              fontSize: 15,
              color: descColor,
              height: 1.5,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },
              child: Text(
                _isEnglish ? 'Cancel' : 'Kanselahin',
                style: GoogleFonts.inter(
                  color: _isDarkMode ? const Color(0xFFC5C0BA) : const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PracticeQuizPage(
                      materialId: widget.materialId,
                      bookTitle: widget.bookTitle,
                      questions: widget.quizQuestions,
                    ),
                  ),
                );
              },
              child: Text(
                _isEnglish ? 'Start' : 'Simulan',
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
