import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:salintinig/widgets/styled_book_cover.dart';
import 'package:salintinig/pages/student/library/practice_reader_page.dart';
import 'package:salintinig/pages/student/library/practice_quiz_page.dart';

class StoryPreviewPage extends StatefulWidget {
  final String bookTitle;
  final double? initialProgress;

  /// Optional live book data from API/calling parent widget.
  final Map<String, dynamic>? book;

  const StoryPreviewPage({
    super.key,
    required this.bookTitle,
    this.initialProgress,
    this.book,
  });

  @override
  State<StoryPreviewPage> createState() => _StoryPreviewPageState();
}

class _StoryPreviewPageState extends State<StoryPreviewPage> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _allBooks = [];
  List<Map<String, dynamic>> _userProgressList = [];
  List<Map<String, dynamic>> _moreLikeThisBooks = [];
  bool _hasSelectedMoreLikeThis = false;

  @override
  void initState() {
    super.initState();
    if (LibraryService.cachedBooks != null && LibraryService.cachedBooks!.isNotEmpty) {
      _allBooks = LibraryService.cachedBooks!;
    }
    if (LibraryService.cachedProgress != null && LibraryService.cachedProgress!.isNotEmpty) {
      _userProgressList = LibraryService.cachedProgress!;
      _isLoading = false;
    }
    LibraryService.progressNotifier.addListener(_onProgressChanged);
    _loadData();
  }

  void _onProgressChanged() {
    if (!mounted) return;
    setState(() {
      _userProgressList = LibraryService.progressNotifier.value;
      _isLoading = false;
    });
  }

  @override
  void dispose() {
    LibraryService.progressNotifier.removeListener(_onProgressChanged);
    super.dispose();
  }

  void _initMoreLikeThis(String currentTitle, String category, String rawLang) {
    if (_hasSelectedMoreLikeThis && _moreLikeThisBooks.isNotEmpty) return;
    if (_allBooks.isEmpty) return;

    final otherBooks = _allBooks
        .where(
          (b) => (b['title'] as String?)?.toLowerCase() != currentTitle.toLowerCase(),
        )
        .toList();

    final List<Map<String, dynamic>> selected = [];

    final relevantMatches = otherBooks.where((b) {
      final cat = b['category'] as String?;
      final lang = b['language'] as String?;
      return cat == category || lang == rawLang;
    }).toList()..shuffle();

    for (final b in relevantMatches) {
      if (selected.length < 3 && !selected.contains(b)) {
        selected.add(b);
      }
    }

    final remainingOther = List<Map<String, dynamic>>.from(otherBooks)..shuffle();
    for (final b in remainingOther) {
      if (selected.length < 3 && !selected.contains(b)) {
        selected.add(b);
      }
    }

    _moreLikeThisBooks = selected;
    if (selected.isNotEmpty) {
      _hasSelectedMoreLikeThis = true;
    }
  }

  Future<void> _loadData() async {
    // Immediately render from local cache (zero lag)
    if (LibraryService.cachedProgress != null && LibraryService.cachedProgress!.isNotEmpty) {
      if (mounted) {
        setState(() {
          _userProgressList = List<Map<String, dynamic>>.from(LibraryService.cachedProgress!);
          _isLoading = false;
        });
      }
    }

    try {
      final results = await Future.wait([
        LibraryService.fetchBooks(),
        LibraryService.fetchReadingProgress(forceRefresh: true),
      ]);
      if (mounted) {
        setState(() {
          _allBooks = results[0];
          _userProgressList = results[1];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  /// Called after returning from PracticeReaderPage.
  /// Only refreshes books list — does NOT overwrite local progress
  /// since the local cache was already updated synchronously on pop.
  Future<void> _refreshAfterReading() async {
    try {
      final books = await LibraryService.fetchBooks();
      if (mounted) {
        setState(() {
          _allBooks = books;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    // ── Resolve book metadata: prefer widget.book, then find in _allBooks ──
    final currentTitle = widget.bookTitle;

    Map<String, dynamic> apiBook = {};
    if (widget.book != null && widget.book!.isNotEmpty) {
      apiBook = widget.book!;
    } else {
      apiBook = _allBooks.firstWhere(
        (b) =>
            (b['title'] as String?)?.toLowerCase() ==
            currentTitle.toLowerCase(),
        orElse: () => <String, dynamic>{},
      );
    }

    final String title = (apiBook['title'] as String?) ?? currentTitle;
    final String? rawAuthor = (apiBook['author'] as String?);
    final String author = (rawAuthor != null && rawAuthor.trim().isNotEmpty)
        ? rawAuthor.trim()
        : 'Chelo Aestrid';
    final String desc =
        (apiBook['description'] as String?) ??
        (apiBook['desc'] as String?) ??
        'No description available for this story.';
    final String rawLang = (apiBook['language'] as String?) ?? 'en';
    final String langLabel = LibraryService.languageLabel(rawLang);
    final String category = (apiBook['category'] as String?) ?? 'Short Story';
    final String gradeLevel =
        (apiBook['gradeLevel'] as String?) ??
        (apiBook['grade_level_target'] as String?) ??
        'Grade 4';

    final List<String> tags = [gradeLevel, langLabel, category];

    // Check if the student has an existing progress record for this story
    Map<String, dynamic>? progressRecord;
    final bookId = apiBook['id'] ?? apiBook['material_id'];
    for (final p in _userProgressList) {
      final pId = p['id'] ?? p['material_id'] ?? p['materialId'];
      final pTitle = (p['title'] as String?)?.toLowerCase();
      if ((bookId != null && pId?.toString() == bookId.toString()) ||
          (pTitle != null && pTitle == title.toLowerCase())) {
        progressRecord = p;
        break;
      }
    }

    final double progress = (progressRecord != null)
        ? LibraryService.parseDouble(progressRecord['progress'])
        : (widget.initialProgress ?? LibraryService.parseDouble(apiBook['progress']));

    final bool isCompleted = (progressRecord != null && (progressRecord['status'] == 'completed')) ||
        (apiBook['status'] == 'completed');

    // A story has been started if a progress record exists (even if progress is 0.0), or if progress > 0, or status is in_progress
    final bool hasStarted = progressRecord != null ||
        widget.initialProgress != null ||
        progress > 0 ||
        (apiBook['status'] != null && apiBook['status'] != 'not_started') ||
        (apiBook['progress'] != null && apiBook['progress'] != '');

    final dynamic quizScore = progressRecord?['quizScore'] ?? progressRecord?['quiz_score'] ?? apiBook['quizScore'] ?? apiBook['quiz_score'];
    final dynamic totalQuestions = progressRecord?['totalQuestions'] ?? progressRecord?['total_questions'] ?? apiBook['totalQuestions'] ?? apiBook['total_questions'] ?? (apiBook['quizQuestions'] is List ? (apiBook['quizQuestions'] as List).length : 5);

    final bool isProgressLoading = _isLoading &&
        widget.initialProgress == null &&
        progressRecord == null &&
        (_userProgressList.isEmpty);

    final String storyText =
        (apiBook['contentText'] as String?) ??
        (apiBook['content_text'] as String?) ??
        (apiBook['storyText'] as String?) ??
        'No text available for this story.';

    final List<Map<String, dynamic>> quizQuestions =
        apiBook['quizQuestions'] != null
        ? List<Map<String, dynamic>>.from(apiBook['quizQuestions'])
        : apiBook['quiz_questions'] != null
        ? List<Map<String, dynamic>>.from(apiBook['quiz_questions'])
        : [
            {
              'questionText': 'Did you enjoy reading this story?',
              'options': [
                'Yes, very much!',
                'It was okay',
                'Not really',
                'I want to read another one',
              ],
              'correctAnswerIndex': 0,
            },
          ];

    _initMoreLikeThis(title, category, rawLang);
    final moreLikeThisBooks = _moreLikeThisBooks;

    return Scaffold(
      backgroundColor: softCreamBg,
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
                    // 1. Navigation Row (App Bar)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 12.0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Back Caret Icon
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 22,
                              color: Colors.black,
                            ),
                          ),
                          // Center Title
                          Text(
                            'Read',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          // Right Close (X) Icon
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Icon(
                              Icons.close_rounded,
                              size: 26,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 2. Main Scrollable Content
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.only(
                          left: 20.0,
                          right: 20.0,
                          bottom: 24.0,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const SizedBox(height: 12),
                            // Large Book Cover Image
                            SizedBox(
                              width: isTablet ? 300 : 200,
                              height: isTablet ? 400 : 280,
                              child: StyledBookCover(
                                book: {'title': title, 'author': author},
                                index: 0,
                                enableTap: false,
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Category & Grade Tags
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              alignment: WrapAlignment.center,
                              children: tags
                                  .map(
                                    (tag) => Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 7,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        tag,
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF475569),
                                        ),
                                      ),
                                    ),
                                  )
                                  .toList(),
                            ),
                            const SizedBox(height: 16),

                            // Book Title
                            Text(
                              title,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.lora(
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 4),

                            // Book Author
                            Text(
                              'by $author',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF8E8E93),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Progress indicator (if story has started or progress > 0)
                            if (hasStarted || progress > 0) ...[
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        isCompleted
                                            ? '100% Completed'
                                            : '${(progress * 100).toInt()}% completed',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: isCompleted
                                              ? const Color(0xFF00AA5A)
                                              : const Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: LinearProgressIndicator(
                                      value: isCompleted ? 1.0 : progress,
                                      backgroundColor: const Color(0xFFE4E2DC),
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        isCompleted
                                            ? const Color(0xFF00AA5A)
                                            : primaryBlue,
                                      ),
                                      minHeight: 8,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                            ],

                            // Action button (Read vs Continue vs Read Again vs Loading Skeleton)
                            if (isProgressLoading) ...[
                              SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: const Center(
                                    child: SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: primaryBlue,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ] else if (isCompleted) ...[
                              // ── Story is Completed: Provide "Read Again" + Retake Quiz ──
                              Container(
                                margin: const EdgeInsets.only(bottom: 14),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFE6F4EA),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFF34A853).withValues(alpha: 0.3)),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.check_circle_rounded, color: Color(0xFF00AA5A), size: 18),
                                    const SizedBox(width: 8),
                                    Text(
                                      quizScore != null
                                          ? 'Completed • Quiz Score: $quizScore/$totalQuestions'
                                          : 'Completed • Tapos Na!',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF008744),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () async {
                                    Feedback.forTap(context);
                                    final passageKey = (apiBook['id'] ?? apiBook['material_id'])?.toString() ?? title;
                                    await QuizProgressService.clearQuizDraft(passageKey, 'practice');
                                    if (!context.mounted) return;
                                    final res = await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => PracticeReaderPage(
                                          materialId: (apiBook['id'] ?? apiBook['material_id'])?.toString(),
                                          bookTitle: title,
                                          storyText: storyText,
                                          initialProgress: 0.0,
                                          quizQuestions: quizQuestions,
                                        ),
                                      ),
                                    );
                                    if (res is double && mounted) {
                                      setState(() {
                                        if (progressRecord != null) {
                                          progressRecord['progress'] = res;
                                        }
                                        apiBook['progress'] = res;
                                      });
                                    }
                                    if (mounted) {
                                      _refreshAfterReading();
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF00AA5A),
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  icon: const Icon(
                                    Icons.replay_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  label: Text(
                                    'Read Again',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Center(
                                child: TextButton(
                                  onPressed: () async {
                                    Feedback.forTap(context);
                                    await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => PracticeQuizPage(
                                          materialId: (apiBook['id'] ?? apiBook['material_id'])?.toString(),
                                          bookTitle: title,
                                          questions: quizQuestions,
                                        ),
                                      ),
                                    );
                                    if (mounted) {
                                      _loadData();
                                    }
                                  },
                                  child: Text(
                                    'Retake Quiz',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            ] else if (hasStarted || progress > 0) ...[
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () async {
                                    Feedback.forTap(context);
                                    if (progress >= 0.99) {
                                      // Progress is 100%: Redirect directly to the Quiz Page
                                      await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => PracticeQuizPage(
                                            materialId: (apiBook['id'] ?? apiBook['material_id'])?.toString(),
                                            bookTitle: title,
                                            questions: quizQuestions,
                                          ),
                                        ),
                                      );
                                      if (mounted) {
                                        _loadData();
                                      }
                                    } else {
                                      // Progress < 100%: Continue reading from last position
                                      final res = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              PracticeReaderPage(
                                                materialId: (apiBook['id'] ?? apiBook['material_id'])?.toString(),
                                                bookTitle: title,
                                                storyText: storyText,
                                                initialProgress: progress,
                                                quizQuestions: quizQuestions,
                                              ),
                                        ),
                                      );
                                      if (res is double && mounted) {
                                        setState(() {
                                          if (progressRecord != null) {
                                            progressRecord['progress'] = res;
                                          } else {
                                            _userProgressList.add({
                                              'material_id': apiBook['id'] ?? apiBook['material_id'],
                                              'title': title,
                                              'progress': res,
                                              'status': 'in_progress',
                                            });
                                          }
                                          apiBook['progress'] = res;
                                        });
                                      }
                                      if (mounted) {
                                        _refreshAfterReading();
                                      }
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: primaryBlue,
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  icon: Icon(
                                    progress >= 0.99 ? Icons.check_circle_rounded : Icons.menu_book_rounded,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  label: Text(
                                    progress >= 0.99 ? 'Start Quiz' : 'Continue',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Center(
                                child: TextButton(
                                  onPressed: () async {
                                    Feedback.forTap(context);
                                    final passageKey = (apiBook['id'] ?? apiBook['material_id'])?.toString() ?? title;
                                    await QuizProgressService.clearQuizDraft(passageKey, 'practice');
                                    if (!context.mounted) return;
                                    final res = await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            PracticeReaderPage(
                                              materialId: (apiBook['id'] ?? apiBook['material_id'])?.toString(),
                                              bookTitle: title,
                                              storyText: storyText,
                                              initialProgress: 0.0,
                                              quizQuestions: quizQuestions,
                                            ),
                                      ),
                                    );
                                    if (res is double && mounted) {
                                      setState(() {
                                        if (progressRecord != null) {
                                          progressRecord['progress'] = res;
                                        }
                                        apiBook['progress'] = res;
                                      });
                                    }
                                    if (mounted) {
                                      _refreshAfterReading();
                                    }
                                  },
                                  child: Text(
                                    progress >= 0.99 ? 'Review story' : 'Start from beginning',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ),
                            ] else ...[
                              // Read Button (Full width for new story)
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: () async {
                                    Feedback.forTap(context);
                                    final res = await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) =>
                                            PracticeReaderPage(
                                              materialId: (apiBook['id'] ?? apiBook['material_id'])?.toString(),
                                              bookTitle: title,
                                              storyText: storyText,
                                              initialProgress: 0.0,
                                              quizQuestions: quizQuestions,
                                            ),
                                      ),
                                    );
                                    if (res is double && mounted) {
                                      setState(() {
                                        if (progressRecord != null) {
                                          progressRecord['progress'] = res;
                                        }
                                        apiBook['progress'] = res;
                                      });
                                    }
                                    if (mounted) {
                                      _refreshAfterReading();
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: primaryBlue,
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                  icon: const Iconify(
                                    PhIcons.bookRegular,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  label: Text(
                                    'Read',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 24),

                            // Description Text
                            Text(
                              desc,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: const Color(0xFF64748B),
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 32),

                            // More Like This Header
                            Row(
                              children: [
                                const Iconify(
                                  PhIcons.booksRegular,
                                  color: primaryBlue,
                                  size: 24,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'More Like This',
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.black,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Grid of recommended books
                            if (_isLoading)
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 24.0),
                                child: Center(
                                  child: CircularProgressIndicator(
                                    color: primaryBlue,
                                  ),
                                ),
                              )
                            else if (moreLikeThisBooks.isEmpty)
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 20.0,
                                ),
                                child: Text(
                                  'No other stories available right now.',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                  ),
                                ),
                              )
                            else
                              GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                clipBehavior: Clip.none,
                                gridDelegate:
                                    SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: isTablet ? 5 : 3,
                                      crossAxisSpacing: 12,
                                      mainAxisSpacing: 20,
                                      childAspectRatio: () {
                                        final count = isTablet ? 5 : 3;
                                        final spacing = 12.0;
                                        final cellWidth =
                                            (constraints.maxWidth -
                                                40 -
                                                (count - 1) * spacing) /
                                            count;
                                        final coverH = cellWidth * 1.45;
                                        const belowH = 68.0;
                                        return cellWidth / (coverH + belowH);
                                      }(),
                                    ),
                                itemCount: moreLikeThisBooks.length,
                                itemBuilder: (context, index) {
                                  final recBook = moreLikeThisBooks[index];
                                  return _buildRecommendationCard(
                                    recBook,
                                    index,
                                  );
                                },
                              ),
                          ],
                        ),
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

  Widget _buildRecommendationCard(Map<String, dynamic> book, int index) {
    final bookTitle = (book['title'] as String?) ?? '';
    final language = LibraryService.languageLabel(book['language'] as String?);

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) =>
                StoryPreviewPage(bookTitle: bookTitle, book: book),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          StyledBookCover(book: book, index: index),
          const SizedBox(height: 6),
          Text(
            language,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 3),
          Text(
            bookTitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }
}
