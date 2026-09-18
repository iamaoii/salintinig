import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/styled_book_cover.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/library/continue_reading_page.dart';
import 'package:salintinig/pages/student/library/bookshelf_page.dart';
import 'package:salintinig/pages/student/badges_page.dart';
import 'package:salintinig/pages/student/library/story_preview_page.dart';
import 'package:salintinig/pages/student/activities/activities_page.dart';
import 'package:salintinig/pages/student/progress_page.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/services/badge_service.dart';
import 'package:salintinig/models/quest_item.dart';
import 'package:salintinig/widgets/app_toast.dart';

class LibraryPage extends StatefulWidget {
  const LibraryPage({super.key});

  @override
  State<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends State<LibraryPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // ── State ──────────────────────────────────────────────────────────────
  bool _isLoading = true;
  List<Map<String, dynamic>> _books = [];
  List<Map<String, dynamic>> _inProgressBooks = [];

  @override
  void initState() {
    super.initState();
    // Populate initial state from memory/disk cache immediately if available
    final cachedBooks = LibraryService.cachedBooks;
    if (cachedBooks != null && cachedBooks.isNotEmpty) {
      _books = List<Map<String, dynamic>>.from(cachedBooks);
      _isLoading = false;
    }
    final cached = LibraryService.cachedProgressSnapshot;
    if (cached != null && cached.isNotEmpty) {
      _inProgressBooks = LibraryService.filterInProgress(cached);
    }
    LibraryService.progressNotifier.addListener(_onProgressNotifierChanged);
    BadgeService.badgeNotifier.addListener(_onBadgesUpdated);
    BadgeService.fetchBadges();
    _loadData();
  }

  void _onProgressNotifierChanged() {
    if (!mounted) return;
    setState(() {
      _inProgressBooks = LibraryService.filterInProgress(LibraryService.progressNotifier.value);
    });
  }

  void _onBadgesUpdated() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    LibraryService.progressNotifier.removeListener(_onProgressNotifierChanged);
    BadgeService.badgeNotifier.removeListener(_onBadgesUpdated);
    super.dispose();
  }

  Future<void> _loadData({bool forceRefresh = false}) async {
    if (!mounted) return;
    // Only show full shimmer on first load when we have no books yet
    if (_books.isEmpty) {
      setState(() => _isLoading = true);
    }
    try {
      final results = await Future.wait([
        LibraryService.fetchBooks(forceRefresh: forceRefresh),
        LibraryService.fetchReadingProgress(forceRefresh: forceRefresh),
      ]);
      if (mounted) {
        final List<Map<String, dynamic>> fetchedBooks = List<Map<String, dynamic>>.from(results[0]);
        fetchedBooks.shuffle();
        setState(() {
          _books = fetchedBooks;
          _inProgressBooks = LibraryService.filterInProgress(results[1]);
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  /// Immediately update UI from local cache (no spinner), then silently refresh from network.
  Future<void> _refreshAfterReading() async {
    if (!mounted) return;
    // Step 1: Read from in-memory cache synchronously — zero delay, no network needed.
    final cached = LibraryService.cachedProgressSnapshot;
    if (cached != null && mounted) {
      setState(() {
        _inProgressBooks = LibraryService.filterInProgress(cached);
      });
    }
    // Step 2: Silently refresh from network in background to sync any server-side changes
    try {
      final fresh = await LibraryService.fetchReadingProgress(forceRefresh: true);
      if (mounted) {
        setState(() {
          _inProgressBooks = LibraryService.filterInProgress(fresh);
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      drawerEnableOpenDragGesture: true,
      drawerEdgeDragWidth: MediaQuery.of(context).size.width * 0.25,
      backgroundColor: softCreamBg,
      drawer: StudentSidebarDrawer(
        currentIndex: 2, // Library index
        onItemSelected: (index) {
          if (index == 0) {
            // Navigate back to Home
            Navigator.pop(context);
          } else if (index == 1) {
            // Navigate to Phil-IRI page replacing this one
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const PhilIriAssessmentPage(),
              ),
            );
          } else if (index == 3) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const ActivitiesPage(),
              ),
            );
          } else if (index == 4) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const ProgressPage(),
              ),
            );
          } else if (index != 2) {
            AppToast.info(context, 'Navigation to item $index tapped.');
          }
        },
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity != null && details.primaryVelocity! > 200) {
            _scaffoldKey.currentState?.openDrawer();
          }
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
                      // 1. Navigation Row (App Bar)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Left Menu Drawer Icon
                            IconButton(
                              onPressed: () {
                                _scaffoldKey.currentState?.openDrawer();
                              },
                              icon: const Iconify(
                                Ph.list,
                                size: 28,
                                color: Colors.black,
                              ),
                            ),
                            // Center Title
                            Text(
                              'Library',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                             // Right Notification Bell
                             const NotificationBellIconButton(),
                          ],
                        ),
                      ),

                    // 2. Scrollable content
                    Expanded(
                      child: RefreshIndicator(
                        color: const Color(0xFF1B64D8),
                        backgroundColor: Colors.white,
                        onRefresh: () async {
                          await _loadData(forceRefresh: true);
                        },
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 24.0),
                          child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 20),
                            // Continue Reading Panel
                            _buildSectionHeader(
                              icon: PhIcons.bookOpenBold,
                              title: 'Continue Reading',
                              onSeeAll: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const ContinueReadingPage(),
                                  ),
                                ).then((_) {
                                  WidgetsBinding.instance.addPostFrameCallback((_) {
                                    if (mounted) _loadData(forceRefresh: true);
                                  });
                                });
                              },
                            ),
                            const SizedBox(height: 12),
                            _buildContinueReadingCard(),
                            const SizedBox(height: 28),

                            // Bookshelf Panel
                            _buildSectionHeader(
                              icon: PhIcons.booksRegular,
                              title: 'Bookshelf',
                              onSeeAll: () {
                                Feedback.forTap(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const BookshelfPage(),
                                  ),
                                ).then((_) {
                                  WidgetsBinding.instance.addPostFrameCallback((_) {
                                    if (mounted) _loadData(forceRefresh: true);
                                  });
                                });
                              },
                            ),
                            const SizedBox(height: 12),
                            _buildBookshelfRow(),
                            const SizedBox(height: 16),

                            // Side quests Panel
                            _buildSectionHeader(
                              icon: PhIcons.hourglassRegular,
                              title: 'Side quests',
                              onSeeAll: () {
                                Feedback.forTap(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const BadgesPage(),
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 12),
                            _buildSideQuestsList(),
                            const SizedBox(height: 32),
                          ],
                        ),
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
      ),
    );
  }

  Widget _buildSectionHeader({
    required String icon,
    required String title,
    required VoidCallback onSeeAll,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Iconify(
              icon,
              color: const Color(0xFF1B64D8),
              size: 24,
            ),
            const SizedBox(width: 8),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
                letterSpacing: -0.5,
              ),
            ),
          ],
        ),
        GestureDetector(
          onTap: onSeeAll,
          child: Text(
            'See all',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1B64D8),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContinueReadingCard() {
    const cardBg = Colors.white;
    const tagBg = Color(0xFFEFF6FF);
    const tagTextColor = Color(0xFF2563EB);
    const primaryBlue = Color(0xFF1B64D8);

    // Loading shimmer
    if (_isLoading) {
      return _buildContinueReadingShimmer();
    }

    // No in-progress books
    if (_inProgressBooks.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Text(
            'No books in progress yet.\nHead to the Bookshelf to start reading!',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF94A3B8),
              height: 1.5,
            ),
          ),
        ),
      );
    }

    // Show the first in-progress book
    final book = _inProgressBooks.first;
    final bookTitle = book['title'] as String? ?? '';
    final bookAuthor = book['author'] as String? ?? 'Juan dela Cruz';
    final rawLang = book['language'] as String? ?? 'en';
    final description = book['description'] as String? ?? '';
    final progressVal = LibraryService.parseDouble(book['progress']);
    final langLabel = LibraryService.languageLabel(rawLang);
    final progressPct = '${(progressVal * 100).toInt()}%';

    return GestureDetector(
      onTap: () async {
        Feedback.forTap(context);
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StoryPreviewPage(
              bookTitle: bookTitle,
              book: book,
            ),
          ),
        );
        if (mounted) _refreshAfterReading();
      },
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Left Column: Book Cover
            SizedBox(
              width: 110,
              height: 160,
              child: StyledBookCover(
                book: {
                  'title': bookTitle,
                  'author': bookAuthor,
                },
                index: 0,
                enableTap: false,
              ),
            ),
            const SizedBox(width: 14),

            // Right Column: Info & Action Controls
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Language Tag Row
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: tagBg,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      langLabel,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: tagTextColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Story Title
                  Text(
                    bookTitle,
                    maxLines: 2,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                      letterSpacing: -0.3,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Description
                  if (description.isNotEmpty)
                    Text(
                      description,
                      maxLines: 2,
                      overflow: TextOverflow.clip,
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: const Color(0xFF64748B),
                        height: 1.35,
                      ),
                    ),
                  const SizedBox(height: 10),

                  // Reading Progress
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF475569),
                        ),
                      ),
                      Text(
                        progressPct,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: primaryBlue,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(100),
                    child: LinearProgressIndicator(
                      value: progressVal,
                      backgroundColor: const Color(0xFFF1F5F9),
                      valueColor: const AlwaysStoppedAnimation<Color>(primaryBlue),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Continue Reading Button
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton(
                      onPressed: () async {
                        Feedback.forTap(context);
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => StoryPreviewPage(
                              bookTitle: bookTitle,
                              book: book,
                            ),
                          ),
                        );
                        if (mounted) _refreshAfterReading();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryBlue,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Continue Reading',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.arrow_forward_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ],
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
  }

  Widget _buildContinueReadingShimmer() {
    return Container(
      height: 200,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 110,
            height: 160,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(height: 12, width: 80, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 10),
                Container(height: 18, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 6),
                Container(height: 14, width: 160, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 16),
                Container(height: 6, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(100))),
                const SizedBox(height: 10),
                Container(height: 38, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(100))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookshelfRow() {
    // Loading shimmer row
    if (_isLoading) {
      return SizedBox(
        height: 268,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: 4,
          itemBuilder: (context, index) => Container(
            width: 130,
            margin: EdgeInsets.only(right: index == 3 ? 0 : 16, top: 4, bottom: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
      );
    }

    if (_books.isEmpty) {
      return Container(
        height: 120,
        alignment: Alignment.center,
        child: Text(
          'No stories available.',
          style: GoogleFonts.inter(
            fontSize: 13,
            color: const Color(0xFF94A3B8),
          ),
        ),
      );
    }

    final books = _books.take(4).toList();

    return SizedBox(
      height: 268,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        clipBehavior: Clip.none,
        padding: const EdgeInsets.symmetric(vertical: 4.0),
        itemCount: books.length,
        itemBuilder: (context, index) {
          final book = books[index];
          final title = (book['title'] as String?) ?? '';
          final language = LibraryService.languageLabel(book['language'] as String?);

          return Container(
            width: 130,
            margin: EdgeInsets.only(
              right: index == books.length - 1 ? 0.0 : 16.0,
            ),
            child: GestureDetector(
              onTap: () {
                Feedback.forTap(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => StoryPreviewPage(
                      bookTitle: title,
                      book: book,
                    ),
                  ),
                ).then((_) {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) _refreshAfterReading();
                  });
                });
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 190,
                    child: StyledBookCover(
                      book: book,
                      index: index,
                    ),
                  ),
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
                    title,
                    maxLines: 2,
                    style: GoogleFonts.inter(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                      height: 1.15,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSideQuestsList() {
    final cached = BadgeService.cachedBadges;
    if (cached.isEmpty) {
      return Column(
        children: List.generate(
          3,
          (index) => Container(
            margin: const EdgeInsets.only(bottom: 10.0),
            height: 88,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            padding: const EdgeInsets.all(14.0),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 120,
                        height: 14,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(7),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        height: 10,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(5),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final previewQuests = List<QuestItem>.from(cached)
      ..sort((a, b) {
        if (a.isUnlocked != b.isUnlocked) {
          return a.isUnlocked ? 1 : -1;
        }
        return b.progressRatio.compareTo(a.progressRatio);
      });
    final topQuests = previewQuests.take(3).toList();

    return Column(
      children: topQuests.map((quest) {
        final bool isUnlocked = quest.isUnlocked;

        return Container(
          margin: const EdgeInsets.only(bottom: 10.0),
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: isUnlocked ? const Color(0xFFBAE6FD) : const Color(0xFFE2E8F0),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              // Badge Graphic with Unlocked/Locked State
              SizedBox(
                width: 64,
                height: 64,
                child: ColorFiltered(
                  colorFilter: isUnlocked
                      ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
                      : const ColorFilter.matrix([
                          0.2126, 0.7152, 0.0722, 0, 0,
                          0.2126, 0.7152, 0.0722, 0, 0,
                          0.2126, 0.7152, 0.0722, 0, 0,
                          0,      0,      0,      0.4, 0,
                        ]),
                  child: Image.asset(
                    quest.badgeAsset,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Details + Linear Progress
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            quest.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (isUnlocked)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFD1FAE5),
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.check_circle_rounded,
                                  size: 13,
                                  color: Color(0xFF10B981),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Complete',
                                  style: GoogleFonts.inter(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF059669),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      quest.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF64748B),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Progress Bar & Ratio
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(100),
                            child: LinearProgressIndicator(
                              value: quest.progressRatio,
                              minHeight: 5,
                              backgroundColor: const Color(0xFFF1F5F9),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                isUnlocked ? const Color(0xFF10B981) : const Color(0xFF1B64D8),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          '${quest.currentProgress}/${quest.maxProgress}',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isUnlocked ? const Color(0xFF10B981) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
