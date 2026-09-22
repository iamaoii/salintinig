import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/student/library/practice_quiz_page.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/services/reading_preferences_service.dart';

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
  late final ValueNotifier<double> _scrollProgressNotifier;
  Timer? _debounceRecordTimer;
  late final List<String> _paragraphs;
  bool _hasRestoredPosition = false;
  bool _isShortStory = false;
  double _readingFontSize = 22.0;
  bool _dyslexiaFont = false;
  bool _textHighlighting = true;
  Color _highlightColor = const Color(0xFFFEF08A);
  List<String> _savedHighlights = [];
  String? _selectedText;

  String get _storyKey => widget.materialId ?? widget.bookTitle;

  double get _scrollProgress => _scrollProgressNotifier.value;

  bool get _isEnglish {
    final title = widget.bookTitle.toLowerCase();
    final text = widget.storyText.toLowerCase();
    if (title.contains('english') ||
        text.contains(' the ') ||
        text.contains(' was ') ||
        text.contains(' were ') ||
        text.contains(' which ')) {
      return true;
    }
    if (widget.quizQuestions.isNotEmpty) {
      final qText =
          (widget.quizQuestions[0]['questionText'] ??
                  widget.quizQuestions[0]['question'] ??
                  '')
              .toString()
              .toLowerCase();
      if (qText.contains('who ') ||
          qText.contains('what ') ||
          qText.contains('where ') ||
          qText.contains('why ') ||
          qText.contains('how ')) {
        return true;
      }
    }
    return false;
  }

  @override
  void initState() {
    super.initState();
    _scrollProgressNotifier = ValueNotifier<double>(widget.initialProgress);
    _paragraphs = _parseParagraphs(widget.storyText);
    _loadReadingPreferences();
    _scrollController.addListener(_handleScroll);

    // Record initial reading progress immediately so it registers as in-progress even before scrolling
    final initialRatio = widget.initialProgress > 0.05
        ? widget.initialProgress
        : 0.05;
    _recordCurrentProgress(initialRatio);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkShortStoryAndRestoreScroll();
    });
  }

  Future<void> _loadReadingPreferences() async {
    final fontSize = await ReadingPreferencesService.getFontSize();
    final dyslexia = await ReadingPreferencesService.getDyslexiaFont();
    final highlighting = await ReadingPreferencesService.getTextHighlighting();
    final color = await ReadingPreferencesService.getHighlightColor();
    final savedHighlights = await ReadingPreferencesService.getStoryHighlights(
      _storyKey,
    );
    if (mounted) {
      setState(() {
        _readingFontSize = fontSize;
        _dyslexiaFont = dyslexia;
        _textHighlighting = highlighting;
        _highlightColor = color;
        _savedHighlights = savedHighlights;
        _updateSortedHighlights();
      });
    }
  }

  List<String> _sortedHighlights = [];

  void _updateSortedHighlights() {
    _sortedHighlights = List<String>.from(_savedHighlights)
      ..sort((a, b) => b.length.compareTo(a.length));
  }

  void _addHighlight(String text) {
    final trimmed = text.trim();
    _selectedText = null;
    if (trimmed.isEmpty) return;
    if (!_savedHighlights.contains(trimmed)) {
      setState(() {
        _savedHighlights.add(trimmed);
        _updateSortedHighlights();
      });
      ReadingPreferencesService.saveStoryHighlights(
        _storyKey,
        _savedHighlights,
      );
    }
  }

  void _removeHighlight(String text) {
    final trimmed = text.trim();
    _selectedText = null;
    if (_savedHighlights.contains(trimmed)) {
      setState(() {
        _savedHighlights.remove(trimmed);
        _updateSortedHighlights();
      });
      ReadingPreferencesService.saveStoryHighlights(
        _storyKey,
        _savedHighlights,
      );
    }
  }

  void _clearAllHighlights() {
    setState(() {
      _savedHighlights.clear();
      _updateSortedHighlights();
    });
    ReadingPreferencesService.saveStoryHighlights(_storyKey, []);
  }

  Widget _buildHighlightedText(String text, TextStyle baseStyle) {
    if (!_textHighlighting || _savedHighlights.isEmpty) {
      return Text(text, style: baseStyle);
    }

    final List<InlineSpan> spans = [];
    int currentPos = 0;

    while (currentPos < text.length) {
      int nextMatchStart = -1;
      String? matchedHighlight;

      for (final hl in _sortedHighlights) {
        final index = text.indexOf(hl, currentPos);
        if (index != -1 && (nextMatchStart == -1 || index < nextMatchStart)) {
          nextMatchStart = index;
          matchedHighlight = hl;
        }
      }

      if (nextMatchStart != -1 && matchedHighlight != null) {
        if (nextMatchStart > currentPos) {
          spans.add(
            TextSpan(
              text: text.substring(currentPos, nextMatchStart),
              style: baseStyle,
            ),
          );
        }

        final matchEnd = nextMatchStart + matchedHighlight.length;
        spans.add(
          TextSpan(
            text: text.substring(nextMatchStart, matchEnd),
            style: baseStyle.copyWith(
              backgroundColor: _highlightColor.withValues(
                alpha: _isDarkMode ? 0.8 : 0.7,
              ),
            ),
          ),
        );
        currentPos = matchEnd;
      } else {
        spans.add(TextSpan(text: text.substring(currentPos), style: baseStyle));
        break;
      }
    }

    return Text.rich(
      TextSpan(style: baseStyle, children: spans),
      style: baseStyle,
    );
  }

  void _checkShortStoryAndRestoreScroll() {
    if (!mounted || !_scrollController.hasClients) return;

    final maxExtent = _scrollController.position.maxScrollExtent;
    // If maxScrollExtent is 0 or negligible, the entire story fits in 1 page/screen!
    if (maxExtent <= 10.0) {
      _isShortStory = true;
      _scrollProgressNotifier.value = 1.0;
      _hasRestoredPosition = true;
      if (mounted) setState(() {});
      _recordCurrentProgress(1.0);
      return;
    }

    if (!_hasRestoredPosition && widget.initialProgress > 0) {
      _hasRestoredPosition = true;
      final targetOffset = (widget.initialProgress * maxExtent).clamp(
        0.0,
        maxExtent,
      );
      _scrollController.jumpTo(targetOffset);
    } else {
      _hasRestoredPosition = true;
    }
  }

  void _handleScroll() {
    if (!_scrollController.hasClients || !_hasRestoredPosition) return;
    final maxExtent = _scrollController.position.maxScrollExtent;
    if (maxExtent <= 10.0) {
      if (_scrollProgressNotifier.value < 1.0) {
        _isShortStory = true;
        _scrollProgressNotifier.value = 1.0;
        if (mounted) setState(() {});
        _recordCurrentProgress(1.0);
      }
      return;
    }

    final currentOffset = _scrollController.offset.clamp(0.0, maxExtent);
    final ratio = (currentOffset / maxExtent).clamp(0.0, 1.0);

    if ((ratio - _scrollProgressNotifier.value).abs() >= 0.005 ||
        ratio >= 0.99) {
      final wasAtEnd = _scrollProgressNotifier.value >= 0.99;
      _scrollProgressNotifier.value = ratio;

      if (!wasAtEnd && ratio >= 0.99 && mounted) {
        setState(() {}); // Trigger rebuild to show "Finish & Start Quiz" button
      }

      // Debounce HTTP API calls during scroll
      _debounceRecordTimer?.cancel();
      _debounceRecordTimer = Timer(const Duration(milliseconds: 1200), () {
        _recordCurrentProgress(ratio);
      });
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
    _debounceRecordTimer?.cancel();
    _scrollController.removeListener(_handleScroll);
    _scrollController.dispose();
    _scrollProgressNotifier.dispose();
    super.dispose();
  }

  List<String> _parseParagraphs(String fullText) {
    final raw = fullText.split(RegExp(r'\n\s*\n'));
    return raw.map((p) => p.trim()).where((p) => p.isNotEmpty).toList();
  }

  @override
  Widget build(BuildContext context) {
    final Color bgColor = _isDarkMode
        ? const Color(0xFF1A1816)
        : const Color(0xFFFCFAF7);
    final Color textColor = _isDarkMode
        ? const Color(0xFFE5E0DB)
        : const Color(0xFF2D2D2D);
    final Color titleColor = _isDarkMode
        ? const Color(0xFFECE8E4)
        : const Color(0xFF1E293B);
    final Color secondaryTextColor = _isDarkMode
        ? const Color(0xFF8A8580)
        : const Color(0xFF64748B);
    const Color primaryBlue = Color(0xFF1B64D8);

    final TextStyle textStyle = _dyslexiaFont
        ? GoogleFonts.lexend(
            fontSize: _readingFontSize,
            height: 1.75,
            fontWeight: FontWeight.w500,
            color: textColor,
          )
        : GoogleFonts.lora(
            fontSize: _readingFontSize,
            height: 1.75,
            fontWeight: FontWeight.w500,
            color: textColor,
          );

    return Scaffold(
      backgroundColor: bgColor,
      body: PopScope(
        canPop: true,
        onPopInvokedWithResult: (didPop, result) {
          if (didPop) {
            _recordCurrentProgress(_scrollProgress);
          }
        },
        child: SafeArea(
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 12.0,
                      ),
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

                    // 3. Scrollable Story Content (Continuous Vertical Scroll with Floating Pen)
                    Expanded(
                      child: TextSelectionTheme(
                        data: TextSelectionThemeData(
                          selectionColor: _highlightColor.withValues(
                            alpha: 0.65,
                          ), // Soft translucent highlight color
                          selectionHandleColor: primaryBlue,
                        ),
                        child: Stack(
                          children: [
                            Builder(
                              builder: (context) {
                                Widget content = NotificationListener<ScrollNotification>(
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
                                        ...List.generate(
                                          _paragraphs.length,
                                          (pIndex) {
                                            final paragraphText = _paragraphs[pIndex];
                                            final lower = paragraphText.toLowerCase();
                                            final isChapterHeader =
                                                lower.startsWith('chapter') ||
                                                lower.startsWith('kabanata') ||
                                                paragraphText.startsWith('#');
                                            final isLast =
                                                pIndex == _paragraphs.length - 1;

                                            if (isChapterHeader) {
                                              final headerTextWidget = Padding(
                                                padding: const EdgeInsets.only(
                                                  bottom: 24.0,
                                                  top: 16.0,
                                                ),
                                                child: Text(
                                                  paragraphText.replaceAll(
                                                    RegExp(r'^#+\s*'),
                                                    '',
                                                  ),
                                                  textAlign: TextAlign.center,
                                                  style: GoogleFonts.lora(
                                                    fontSize: 24,
                                                    fontWeight: FontWeight.w800,
                                                    color: titleColor,
                                                    height: 1.3,
                                                  ),
                                                ),
                                              );
                                              return _textHighlighting
                                                  ? SelectionContainer.disabled(
                                                      child: headerTextWidget,
                                                    )
                                                  : headerTextWidget;
                                            }

                                            return Padding(
                                              padding: EdgeInsets.only(
                                                bottom: isLast ? 24.0 : 30.0,
                                              ),
                                              child: _buildHighlightedText(
                                                paragraphText,
                                                textStyle,
                                              ),
                                            );
                                          },
                                        ),
                                        const SizedBox(height: 60),
                                      ],
                                    ),
                                  ),
                                );

                                if (_textHighlighting) {
                                  return SelectionArea(
                                    onSelectionChanged: (content) {
                                      _selectedText = content?.plainText;
                                    },
                                    contextMenuBuilder: (
                                      context,
                                      selectableRegionState,
                                    ) {
                                      final selectedText = _selectedText;
                                      if (selectedText == null ||
                                          selectedText.trim().isEmpty) {
                                        return const SizedBox.shrink();
                                      }

                                      final isAlreadyHighlighted =
                                          _savedHighlights.contains(
                                            selectedText.trim(),
                                          );

                                      final customButtonItems = [
                                        ContextMenuButtonItem(
                                          label: isAlreadyHighlighted
                                              ? 'Remove Highlight'
                                              : 'Highlight',
                                          onPressed: () {
                                            if (isAlreadyHighlighted) {
                                              _removeHighlight(selectedText);
                                            } else {
                                              _addHighlight(selectedText);
                                            }
                                            selectableRegionState.hideToolbar();
                                          },
                                        ),
                                      ];

                                      return AdaptiveTextSelectionToolbar.buttonItems(
                                        anchors: selectableRegionState
                                            .contextMenuAnchors,
                                        buttonItems: customButtonItems,
                                      );
                                    },
                                    child: content,
                                  );
                                }
                                return content;
                              },
                            ),

                            // Floating Pen Button (Compact Pen Icon)
                            if (_textHighlighting)
                              Positioned(
                                bottom: 16,
                                right: 16,
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    SizedBox(
                                      width: 44,
                                      height: 44,
                                      child: FloatingActionButton(
                                        heroTag: 'highlighter_pen_fab',
                                        onPressed: () {
                                          Feedback.forTap(context);
                                          _showHighlighterSheet();
                                        },
                                        backgroundColor: _highlightColor,
                                        elevation: 3,
                                        shape: const CircleBorder(),
                                        child: const Icon(
                                          Icons.draw_rounded,
                                          color: Colors.black87,
                                          size: 20,
                                        ),
                                      ),
                                    ),
                                    if (_savedHighlights.isNotEmpty)
                                      Positioned(
                                        right: -2,
                                        top: -2,
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF1B64D8),
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: Colors.white,
                                              width: 1.5,
                                            ),
                                          ),
                                          constraints: const BoxConstraints(
                                            minWidth: 18,
                                            minHeight: 18,
                                          ),
                                          alignment: Alignment.center,
                                          child: Text(
                                            '${_savedHighlights.length}',
                                            style: GoogleFonts.inter(
                                              color: Colors.white,
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
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
                    ),

                    // 2. Reading Progress Indicator Bar (at the bottom, above footer)
                    ValueListenableBuilder<double>(
                      valueListenable: _scrollProgressNotifier,
                      builder: (context, progress, _) {
                        return ClipRRect(
                          child: LinearProgressIndicator(
                            value: progress.clamp(0.02, 1.0),
                            backgroundColor: _isDarkMode
                                ? const Color(0xFF2D2B28)
                                : const Color(0xFFE2E8F0),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              primaryBlue,
                            ),
                            minHeight: 3.5,
                          ),
                        );
                      },
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
                              child: ValueListenableBuilder<double>(
                                valueListenable: _scrollProgressNotifier,
                                builder: (context, progress, _) {
                                  return (progress >= 0.99 || _isShortStory)
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
                                              borderRadius:
                                                  BorderRadius.circular(24),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: primaryBlue.withValues(
                                                    alpha: 0.25,
                                                  ),
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
                                              ? '${(progress * 100).toInt()}% completed'
                                              : '${(progress * 100).toInt()}% kumpleto',
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: secondaryTextColor,
                                          ),
                                        );
                                },
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
          color: _isDarkMode
              ? const Color(0xFF141A24)
              : const Color(0xFFE2E8F0),
        ),
        child: Stack(
          children: [
            AnimatedAlign(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOutCubic,
              alignment: _isDarkMode
                  ? Alignment.centerRight
                  : Alignment.centerLeft,
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
    final titleColor = _isDarkMode
        ? const Color(0xFFECE8E4)
        : const Color(0xFF1E293B);
    final descColor = _isDarkMode
        ? const Color(0xFFC5C0BA)
        : const Color(0xFF475569);
    final dialogBg = _isDarkMode ? const Color(0xFF22201E) : Colors.white;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          titlePadding: const EdgeInsets.only(
            left: 24.0,
            right: 24.0,
            top: 28.0,
          ),
          contentPadding: const EdgeInsets.only(
            left: 24.0,
            right: 24.0,
            top: 16.0,
            bottom: 24.0,
          ),
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
                  color: _isDarkMode
                      ? const Color(0xFFC5C0BA)
                      : const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                ReadingPreferencesService.saveStoryHighlights(_storyKey, []);
                Navigator.pop(dialogContext);
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PracticeQuizPage(
                      materialId: widget.materialId,
                      bookTitle: widget.bookTitle,
                      questions: widget.quizQuestions,
                      isDarkMode: _isDarkMode,
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

  void _showHighlighterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        final modalBg = _isDarkMode ? const Color(0xFF22201E) : Colors.white;
        final textColor = _isDarkMode ? Colors.white : Colors.black;
        final subTextColor = _isDarkMode
            ? const Color(0xFFA1A1AA)
            : const Color(0xFF71717A);

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.55,
              decoration: BoxDecoration(
                color: modalBg,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              color: _highlightColor,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.black26),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Saved Highlights',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: textColor,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: Icon(Icons.close, color: textColor),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(height: 20),
                  Text(
                    'Select any word or sentence in the story to highlight it. Highlights automatically stay saved for your account.',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: subTextColor,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: _savedHighlights.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.draw_rounded,
                                  size: 36,
                                  color: subTextColor.withValues(alpha: 0.5),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'No highlights saved yet.',
                                  style: GoogleFonts.inter(
                                    color: subTextColor,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.separated(
                            itemCount: _savedHighlights.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final text = _savedHighlights[index];
                              return Container(
                                decoration: BoxDecoration(
                                  color: _highlightColor.withValues(
                                    alpha: _isDarkMode ? 0.25 : 0.4,
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: _highlightColor.withValues(
                                      alpha: 0.8,
                                    ),
                                  ),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '"$text"',
                                        style: GoogleFonts.inter(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                          color: textColor,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    GestureDetector(
                                      onTap: () {
                                        Feedback.forTap(context);
                                        _removeHighlight(text);
                                        setModalState(() {});
                                      },
                                      child: Container(
                                        width: 26,
                                        height: 26,
                                        decoration: BoxDecoration(
                                          color: _isDarkMode
                                              ? Colors.white.withValues(
                                                alpha: 0.15,
                                              )
                                              : Colors.black.withValues(
                                                alpha: 0.08,
                                              ),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          Icons.close_rounded,
                                          size: 15,
                                          color: textColor.withValues(
                                            alpha: 0.7,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                  ),
                  if (_savedHighlights.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _clearAllHighlights();
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFEF4444),
                        side: const BorderSide(color: Color(0xFFEF4444)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.delete_sweep_rounded, size: 20),
                      label: Text(
                        'Clear All Highlights',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }
}
