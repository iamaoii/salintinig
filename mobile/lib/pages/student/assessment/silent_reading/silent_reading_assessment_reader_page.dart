import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_quiz_page.dart';

import 'package:salintinig/services/quiz_progress_service.dart';

class SilentReadingAssessmentReaderPage extends StatefulWidget {
  final Map<String, dynamic>? item;
  const SilentReadingAssessmentReaderPage({super.key, this.item});

  @override
  State<SilentReadingAssessmentReaderPage> createState() =>
      _SilentReadingAssessmentReaderPageState();
}

class _SilentReadingAssessmentReaderPageState
    extends State<SilentReadingAssessmentReaderPage> {
  bool _isDarkMode = false;
  int _currentPage = 0;
  final PageController _pageController = PageController();

  String _fullStoryText = '';
  String _storyTitle = 'Silent Reading Passage';
  String _assessmentLanguage = 'fil';
  dynamic _passageId;
  List<dynamic>? _dynamicQuestions;

  int _readingSecondsElapsed = 0;
  Timer? _readingTimer;

  bool get _isEnglish {
    final lang = _assessmentLanguage.toLowerCase();
    final title = _storyTitle.toLowerCase();
    return lang.startsWith('en') ||
        lang.contains('english') ||
        title.contains('english');
  }

  @override
  void initState() {
    super.initState();
    _extractItemData();
    _fetchPassageFromApi();
    _startReadingTimer();
  }

  void _startReadingTimer() {
    _readingTimer?.cancel();
    _readingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _readingSecondsElapsed++;
        });
      }
    });
  }

  void _pauseReadingTimer() {
    _readingTimer?.cancel();
  }

  @override
  void dispose() {
    _readingTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _extractItemData() {
    final item = widget.item;
    if (item != null) {
      final passageObj = item['passage'] is Map ? item['passage'] : item;
      final String? title =
          item['passageTitle'] ??
          item['title'] ??
          passageObj?['title'] ??
          passageObj?['passageTitle'];
      final String? text =
          passageObj?['text'] ??
          passageObj?['contentText'] ??
          passageObj?['content_text'] ??
          item['text'] ??
          item['contentText'] ??
          item['content_text'];
      final List<dynamic>? questions =
          item['questions'] ?? passageObj?['questions'];
      final String? lang =
          item['rawLanguage'] ??
          item['language'] ??
          passageObj?['language'] ??
          passageObj?['rawLanguage'];

      if (title != null && title.trim().isNotEmpty) {
        _storyTitle = title.trim();
      }
      if (text != null && text.trim().isNotEmpty) {
        _fullStoryText = text.trim();
      }
      if (lang != null && lang.trim().isNotEmpty) {
        _assessmentLanguage = lang.trim();
      }
      if (questions != null && questions.isNotEmpty) {
        _dynamicQuestions = questions;
      }
      _passageId = QuizProgressService.extractPassageId(item);
      debugPrint(
        '[SilentReader] Extracted passed item: title="$_storyTitle", passageId="$_passageId", lang="$_assessmentLanguage", text length=${_fullStoryText.length}',
      );
    }
  }

  void _fetchPassageFromApi() async {
    // If passage item was already passed directly into widget constructor with text, keep it!
    if (_fullStoryText.trim().isNotEmpty && widget.item != null) {
      debugPrint(
        '[SilentReader] Using directly passed passage item: "$_storyTitle"',
      );
      return;
    }

    try {
      // 1. Try fetching student's assigned Phil-IRI activity first
      try {
        final myAssignRes = await ApiService.get(
          '/student/assessment/my-assignment',
        );
        if (myAssignRes.success &&
            myAssignRes.data != null &&
            myAssignRes.data['assignedActivities'] != null) {
          final activities = myAssignRes.data['assignedActivities'] as List;
          if (activities.isNotEmpty) {
            final silentActivity = activities.firstWhere(
              (act) =>
                  act['assessmentType'] == 'silent' ||
                  act['assessmentType'] == 'silent reading',
              orElse: () => activities[0],
            );
            if (silentActivity != null) {
              final passage = silentActivity['passage'] ?? silentActivity;
              final String title =
                  passage['title'] ??
                  silentActivity['passageTitle'] ??
                  'Silent Reading Passage';
              final String text =
                  passage['text'] ??
                  passage['contentText'] ??
                  passage['content_text'] ??
                  '';
              final List<dynamic>? questions = passage['questions'];

              if (mounted && text.trim().isNotEmpty) {
                setState(() {
                  _storyTitle = title;
                  _fullStoryText = text.trim();
                  _dynamicQuestions = questions;
                  _passageId ??= QuizProgressService.extractPassageId(
                    silentActivity,
                  );
                });
                debugPrint(
                  '[SilentReader] Successfully loaded student assignment passage: $title',
                );
                return;
              }
            }
          }
        }
      } catch (assignErr) {
        debugPrint('[SilentReader] Assignment fetch notice: $assignErr');
      }

      // 2. Fallback to general Phil-IRI passages API
      var res = await ApiService.get(
        '/student/assessment/passages?type=silent',
      );
      if (!res.success ||
          res.data == null ||
          res.data['passages'] == null ||
          (res.data['passages'] as List).isEmpty) {
        res = await ApiService.get(
          '/student/assessment/passages?grade=Grade%204&type=silent',
        );
      }
      if (!res.success ||
          res.data == null ||
          res.data['passages'] == null ||
          (res.data['passages'] as List).isEmpty) {
        res = await ApiService.get('/student/assessment/passages');
      }

      if (res.success &&
          res.data != null &&
          res.data['passages'] != null &&
          (res.data['passages'] as List).isNotEmpty) {
        final passage = res.data['passages'][0];
        final String title =
            passage['title'] ??
            passage['passage_title'] ??
            'Silent Reading Passage';
        final String text =
            passage['text'] ??
            passage['contentText'] ??
            passage['content_text'] ??
            '';
        final List<dynamic>? questions = passage['questions'];

        if (mounted) {
          setState(() {
            _storyTitle = title;
            if (text.trim().isNotEmpty) {
              _fullStoryText = text.trim();
            }
            _dynamicQuestions = questions;
            _passageId ??= passage['passage_id'] ?? passage['id'];
          });
          debugPrint(
            '[SilentReader] Successfully loaded general passage: $title',
          );
        }
        return;
      }
    } catch (e) {
      debugPrint('[SilentReader] Passage API fetch notice: $e');
    }
  }

  // Dynamic pagination algorithm that maximizes screen utilization while preserving paragraph breaks
  List<List<String>> _paginateStory({
    required String fullText,
    required double maxWidth,
    required double maxHeight,
    required TextStyle textStyle,
    required double paragraphSpacing,
  }) {
    final String normalizedText = fullText
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');

    // Check if the passage has explicit paragraph breaks
    List<String> rawParagraphs;
    if (normalizedText.contains('\n\n')) {
      rawParagraphs = normalizedText
          .split('\n\n')
          .map((p) => p.trim())
          .where((p) => p.isNotEmpty)
          .toList();
    } else if (normalizedText.contains('\n')) {
      rawParagraphs = normalizedText
          .split('\n')
          .map((p) => p.trim())
          .where((p) => p.isNotEmpty)
          .toList();
    } else {
      // If it's a single continuous block, split it into natural 2-sentence thought groups
      final allSentences = _splitIntoSentences(normalizedText);
      if (allSentences.length > 3) {
        rawParagraphs = [];
        for (int i = 0; i < allSentences.length; i += 2) {
          final end = (i + 2 < allSentences.length)
              ? i + 2
              : allSentences.length;
          rawParagraphs.add(allSentences.sublist(i, end).join(' '));
        }
      } else {
        rawParagraphs = [normalizedText.trim()];
      }
    }

    final List<List<String>> pages = [];
    List<String> currentPage = [];
    double currentHeight = 0.0;

    for (final paragraph in rawParagraphs) {
      final textPainter = TextPainter(
        text: TextSpan(text: paragraph.trim(), style: textStyle),
        textDirection: TextDirection.ltr,
      );
      textPainter.layout(maxWidth: maxWidth);
      final double paraHeight = textPainter.height;

      final double spacing = currentPage.isEmpty ? 0.0 : paragraphSpacing;

      // 1. If entire paragraph fits comfortably on current page, add it
      if (currentHeight + spacing + paraHeight <= maxHeight) {
        currentPage.add(paragraph);
        currentHeight += spacing + paraHeight;
      } else {
        // 2. If it doesn't fit completely, try fitting sentences of this paragraph into the remaining space
        // so that the page is fully filled instead of leaving a huge empty gap!
        final sentences = _splitIntoSentences(paragraph);
        List<String> fittingSentences = [];
        List<String> overflowSentences = [];

        for (final sentence in sentences) {
          final candidateSentences = [...fittingSentences, sentence].join(' ');
          final sentPainter = TextPainter(
            text: TextSpan(text: candidateSentences, style: textStyle),
            textDirection: TextDirection.ltr,
          );
          sentPainter.layout(maxWidth: maxWidth);
          final double candidateHeight = sentPainter.height;
          final double testSpacing = currentPage.isEmpty
              ? 0.0
              : paragraphSpacing;

          if (overflowSentences.isEmpty &&
              (currentHeight + testSpacing + candidateHeight <= maxHeight)) {
            fittingSentences.add(sentence);
          } else {
            overflowSentences.add(sentence);
          }
        }

        if (fittingSentences.isNotEmpty) {
          currentPage.add(fittingSentences.join(' '));
          pages.add(currentPage);
          currentPage = [];
          currentHeight = 0.0;
        } else if (currentPage.isNotEmpty) {
          pages.add(currentPage);
          currentPage = [];
          currentHeight = 0.0;
        }

        // Process any remaining sentences of this paragraph on subsequent page(s)
        if (overflowSentences.isNotEmpty) {
          final remainderPara = overflowSentences.join(' ');
          final remPainter = TextPainter(
            text: TextSpan(text: remainderPara, style: textStyle),
            textDirection: TextDirection.ltr,
          );
          remPainter.layout(maxWidth: maxWidth);
          final double remHeight = remPainter.height;

          if (remHeight <= maxHeight) {
            currentPage.add(remainderPara);
            currentHeight = remHeight;
          } else {
            // If remainder is still larger than a whole page, add sentence by sentence
            for (final s in overflowSentences) {
              final sPainter = TextPainter(
                text: TextSpan(text: s, style: textStyle),
                textDirection: TextDirection.ltr,
              );
              sPainter.layout(maxWidth: maxWidth);
              final double sHeight = sPainter.height;
              final double sSpacing = currentPage.isEmpty
                  ? 0.0
                  : paragraphSpacing;

              if (currentHeight + sSpacing + sHeight <= maxHeight) {
                currentPage.add(s);
                currentHeight += sSpacing + sHeight;
              } else {
                if (currentPage.isNotEmpty) {
                  pages.add(currentPage);
                }
                currentPage = [s];
                currentHeight = sHeight;
              }
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
        if ((char == '.' || char == '?' || char == '!') &&
            (nextChar == ' ' || nextChar == '”' || nextChar == '"')) {
          final int end = (nextChar == '”' || nextChar == '"') ? i + 2 : i + 1;
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
    // Theme coloring configuration
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

    return Scaffold(
      backgroundColor: bgColor,
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) {},
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
                      // 1. Header with Title (Locked - No exit/back options)
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16.0,
                          vertical: 12.0,
                        ),
                        child: SizedBox(
                          width: double.infinity,
                          child: Text(
                            _storyTitle,
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.lora(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: titleColor,
                            ),
                          ),
                        ),
                      ),

                      // 2. Reading Text Block (PageView with dynamic pagination)
                      Expanded(
                        child: LayoutBuilder(
                          builder: (context, viewConstraints) {
                            final double horizontalPadding = 40.0;
                            final double verticalPadding = 24.0;
                            final double footerControlsHeight = 90.0;
                            final double maxWidth =
                                viewConstraints.maxWidth - horizontalPadding;
                            final double maxHeight =
                                viewConstraints.maxHeight -
                                verticalPadding -
                                footerControlsHeight;

                            final TextStyle textStyle = GoogleFonts.lora(
                              fontSize: 22.0,
                              height: 1.75,
                              fontWeight: FontWeight.w500,
                              color: textColor,
                            );

                            final dynamicPages = _paginateStory(
                              fullText: _fullStoryText,
                              maxWidth: maxWidth > 0 ? maxWidth : 100,
                              maxHeight: maxHeight > 0 ? maxHeight : 100,
                              textStyle: textStyle,
                              paragraphSpacing: 30.0,
                            );

                            final int totalPages = dynamicPages.length;
                            final int activePage = _currentPage.clamp(
                              0,
                              totalPages - 1,
                            );

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
                                      final pageParagraphs =
                                          dynamicPages[pageIndex];

                                      return Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 20.0,
                                          vertical: 12.0,
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.stretch,
                                          mainAxisAlignment:
                                              MainAxisAlignment.start,
                                          children: List.generate(
                                            pageParagraphs.length,
                                            (pIndex) {
                                              final isLast =
                                                  pIndex ==
                                                  pageParagraphs.length - 1;
                                              return Padding(
                                                padding: EdgeInsets.only(
                                                  bottom: isLast ? 0.0 : 30.0,
                                                ),
                                                child: Text(
                                                  pageParagraphs[pIndex].trim(),
                                                  style: textStyle,
                                                ),
                                              );
                                            },
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ),

                                // 3. Centered page count indicator
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 8.0,
                                  ),
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
                                    left: 24.0,
                                    right: 24.0,
                                    bottom: 20.0,
                                    top: 12.0,
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildThemeSwitcher(),
                                      _buildActionButton(
                                        activePage,
                                        totalPages,
                                      ),
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

  // Action Button at bottom right (Next Page caret, Intermediate Dual, OR Start Quiz)
  Widget _buildActionButton(int activePage, int totalPages) {
    final isFirstPage = activePage == 0;
    final isLastPage = activePage == totalPages - 1;
    final Color buttonBgColor = _isDarkMode
        ? const Color(0xFF1E2530)
        : const Color(0xFFE2E8F0);
    final Color iconColor = _isDarkMode
        ? Colors.white
        : const Color(0xFF475569);

    if (totalPages <= 1) {
      return GestureDetector(
        key: const ValueKey('finish_reading_btn_single'),
        onTap: () {
          Feedback.forTap(context);
          _finishReading();
        },
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
                // Start Quiz Button
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

  void _confirmStartQuiz(BuildContext context) async {
    final titleColor = _isDarkMode
        ? const Color(0xFFECE8E4)
        : const Color(0xFF1E293B);
    final descColor = _isDarkMode
        ? const Color(0xFFC5C0BA)
        : const Color(0xFF475569);
    final dialogBg = _isDarkMode ? const Color(0xFF22201E) : Colors.white;
    final cancelColor = _isDarkMode
        ? const Color(0xFFC5C0BA)
        : const Color(0xFF64748B);

    // 1. Pause reading timer while modal is open
    _pauseReadingTimer();

    if (!mounted) return;
    bool didStart = false;

    await showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: dialogBg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Text(
            _isEnglish ? 'Start Quiz?' : 'Simulan ang Pagsusulit?',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w800,
              color: titleColor,
            ),
          ),
          content: Text(
            _isEnglish
                ? 'You won\'t be able to read the story again once you start the quiz. Are you ready to begin?'
                : 'Hindi mo na mababasa ulit ang kuwento kapag nasimulan mo na ang pagsusulit. Handa ka na bang magsimula?',
            style: GoogleFonts.inter(fontSize: 14, color: descColor),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },
              child: Text(
                _isEnglish ? 'Cancel' : 'Kanselahin',
                style: GoogleFonts.inter(
                  color: cancelColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            TextButton(
              onPressed: () {
                didStart = true;
                Navigator.pop(dialogContext);
                _finishReading(); // Permanently stop timer & transition to Quiz Page
              },
              child: Text(
                _isEnglish ? 'Start' : 'Simulan',
                style: GoogleFonts.inter(
                  color: const Color(0xFF1B64D8),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        );
      },
    );

    // 2. If student cancelled or dismissed modal without clicking Start, resume timer
    if (!didStart && mounted) {
      _startReadingTimer();
    }
  }

  void _finishReading() async {
    _pauseReadingTimer();
    if (!mounted) return;

    final item = widget.item;
    _passageId ??= QuizProgressService.extractPassageId(item);

    final readingSecs = _readingSecondsElapsed > 0 ? _readingSecondsElapsed : 60;

    final existingDraft = await QuizProgressService.getQuizDraft(
      _passageId,
      'silent',
    );
    if (existingDraft == null) {
      await QuizProgressService.saveQuizDraft(
        _passageId,
        assessmentType: 'silent',
        recordedAudioPath: null,
        readingTimeSeconds: readingSecs,
        storyTitle: _storyTitle,
        assessmentLanguage: _assessmentLanguage,
        dynamicQuestions: _dynamicQuestions,
      );
    }

    // Sync status = 'in_progress' to database for real-time teacher tracking
    final user = AuthService.currentUser;
    final studentId = user?.rawUser?['student_id']?.toString() ??
        user?.rawUser?['studentId']?.toString() ??
        user?.userId;

    ApiService.post('/api/students/assessment/start-progress', {
      'studentId': studentId,
      'passageId': _passageId,
    });

    if (!mounted) return;

    List<int?>? initialAnswersList;
    if (existingDraft != null && existingDraft['selectedAnswers'] != null) {
      if (existingDraft['selectedAnswers'] is List) {
        initialAnswersList = (existingDraft['selectedAnswers'] as List)
            .map((e) => e != null ? int.tryParse(e.toString()) : null)
            .toList();
      }
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => SilentReadingAssessmentQuizPage(
          dynamicQuestions:
              existingDraft?['dynamicQuestions'] as List? ?? _dynamicQuestions,
          storyTitle: existingDraft?['storyTitle'] as String? ?? _storyTitle,
          assessmentLanguage:
              existingDraft?['assessmentLanguage'] as String? ??
              _assessmentLanguage,
          passageId: _passageId,
          readingTimeSeconds: (existingDraft?['readingTimeSeconds'] as int?) ?? readingSecs,
          currentQuestionIndex:
              (existingDraft?['currentQuestionIndex'] as int?) ?? 0,
          initialSelectedAnswers: initialAnswersList,
        ),
      ),
    );
  }
}
