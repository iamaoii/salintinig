import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/widgets/styled_book_cover.dart';
import 'package:salintinig/pages/student/library/story_preview_page.dart';

class ContinueReadingPage extends StatefulWidget {
  const ContinueReadingPage({super.key});

  @override
  State<ContinueReadingPage> createState() => _ContinueReadingPageState();
}

class _ContinueReadingPageState extends State<ContinueReadingPage> {
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  List<Map<String, dynamic>> _rawProgress = [];
  String _searchQuery = '';
  int _selectedTab = 0; // 0 = In Progress, 1 = Completed

  @override
  void initState() {
    super.initState();
    // Use cached snapshot immediately if available
    final cached = LibraryService.cachedProgressSnapshot;
    if (cached != null && cached.isNotEmpty) {
      _rawProgress = cached;
      _isLoading = false;
    }
    LibraryService.progressNotifier.addListener(_onProgressChanged);
    _searchController.addListener(() {
      setState(() => _searchQuery = _searchController.text.toLowerCase());
    });
    _loadProgress();
  }

  void _onProgressChanged() {
    if (!mounted) return;
    setState(() {
      _rawProgress = LibraryService.progressNotifier.value;
      _isLoading = false;
    });
  }

  Future<void> _loadProgress({bool forceRefresh = false}) async {
    if (!mounted) return;
    if (_rawProgress.isEmpty) {
      setState(() => _isLoading = true);
    }
    try {
      final progress = await LibraryService.fetchReadingProgress(forceRefresh: forceRefresh);
      if (mounted) {
        setState(() {
          _rawProgress = progress;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    LibraryService.progressNotifier.removeListener(_onProgressChanged);
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    final inProgressBooks = _rawProgress.where((b) {
      final status = (b['status'] as String?)?.toLowerCase();
      return status != 'completed';
    }).where((b) {
      final title = (b['title'] as String? ?? '').toLowerCase();
      return title.contains(_searchQuery);
    }).toList();

    final completedBooks = _rawProgress.where((b) {
      final status = (b['status'] as String?)?.toLowerCase();
      return status == 'completed';
    }).where((b) {
      final title = (b['title'] as String? ?? '').toLowerCase();
      return title.contains(_searchQuery);
    }).toList();

    final displayedBooks = _selectedTab == 0 ? inProgressBooks : completedBooks;

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
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Back Caret Icon
                          IconButton(
                            onPressed: () {
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
                            'Continue Reading',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 48), // Balancing spacer
                        ],
                      ),
                    ),

                    // 2. Main Content
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Search bar field
                            _buildSearchBar(),
                            const SizedBox(height: 16),

                            // Filter Tabs: In Progress vs Completed
                            Row(
                              children: [
                                _buildTabButton(
                                  label: 'In Progress (${inProgressBooks.length})',
                                  index: 0,
                                  icon: Icons.menu_book_rounded,
                                ),
                                const SizedBox(width: 8),
                                _buildTabButton(
                                  label: 'Completed (${completedBooks.length})',
                                  index: 1,
                                  icon: Icons.check_circle_rounded,
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Section Title Header
                            Row(
                              children: [
                                Icon(
                                  _selectedTab == 0 ? Icons.menu_book_rounded : Icons.check_circle_rounded,
                                  color: _selectedTab == 0 ? primaryBlue : const Color(0xFF00AA5A),
                                  size: 22,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _selectedTab == 0 ? 'Stories in Progress' : 'Completed Stories',
                                  style: GoogleFonts.inter(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Grid of Books
                            _isLoading
                                ? GridView.builder(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    clipBehavior: Clip.none,
                                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: isTablet ? 4 : 2,
                                      crossAxisSpacing: 16,
                                      mainAxisSpacing: 24,
                                      childAspectRatio: () {
                                        final count = isTablet ? 4 : 2;
                                        const spacing = 16.0;
                                        final cellWidth = (constraints.maxWidth - 40 - (count - 1) * spacing) / count;
                                        final coverH = cellWidth * 1.45;
                                        const belowH = 100.0;
                                        return cellWidth / (coverH + belowH);
                                      }(),
                                    ),
                                    itemCount: 4,
                                    itemBuilder: (context, index) => Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Expanded(child: Container(decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(12)))),
                                        const SizedBox(height: 8),
                                        Container(height: 10, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                                        const SizedBox(height: 4),
                                        Container(height: 10, width: 60, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                                      ],
                                    ),
                                  )
                                : displayedBooks.isEmpty
                                    ? Padding(
                                        padding: const EdgeInsets.symmetric(vertical: 48),
                                        child: Center(
                                          child: Text(
                                            _selectedTab == 0
                                                ? 'No stories in progress.\nExplore new books in the Bookshelf!'
                                                : 'No completed stories yet.\nFinish a story quiz to see it here!',
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              color: const Color(0xFF94A3B8),
                                              height: 1.5,
                                            ),
                                          ),
                                        ),
                                      )
                                    : GridView.builder(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        clipBehavior: Clip.none,
                                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                          crossAxisCount: isTablet ? 4 : 2,
                                          crossAxisSpacing: 16,
                                          mainAxisSpacing: 24,
                                          childAspectRatio: () {
                                            final count = isTablet ? 4 : 2;
                                            const spacing = 16.0;
                                            final cellWidth = (constraints.maxWidth - 40 - (count - 1) * spacing) / count;
                                            final coverH = cellWidth * 1.45;
                                            const belowH = 100.0;
                                            return cellWidth / (coverH + belowH);
                                          }(),
                                        ),
                                        itemCount: displayedBooks.length,
                                        itemBuilder: (context, index) {
                                          final book = displayedBooks[index];
                                          return GestureDetector(
                                            onTap: () {
                                              Feedback.forTap(context);
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (context) => StoryPreviewPage(
                                                    bookTitle: (book['title'] as String?) ?? '',
                                                    book: book,
                                                    initialProgress: LibraryService.parseDouble(book['progress']),
                                                  ),
                                                ),
                                              ).then((_) {
                                                WidgetsBinding.instance.addPostFrameCallback((_) {
                                                  if (mounted) _loadProgress(forceRefresh: true);
                                                });
                                              });
                                            },
                                            child: _buildBookCard(book, index),
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

  Widget _buildTabButton({
    required String label,
    required int index,
    required IconData icon,
  }) {
    final isSelected = _selectedTab == index;
    const primaryBlue = Color(0xFF1B64D8);
    final selectedBg = index == 1 ? const Color(0xFF00AA5A) : primaryBlue;

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        setState(() => _selectedTab = index);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? selectedBg : const Color(0xFFE2E8F0).withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : const Color(0xFF475569),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: const Color(0xFFE4E4E7).withValues(alpha: 0.5), // Greyish search bar background
        borderRadius: BorderRadius.circular(100),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search',
                hintStyle: GoogleFonts.inter(
                  color: const Color(0xFF8E8E93),
                  fontSize: 15,
                ),
                border: InputBorder.none,
                isDense: true,
              ),
              style: GoogleFonts.inter(
                fontSize: 15,
                color: Colors.black,
              ),
            ),
          ),
          const Icon(
            Icons.search_rounded,
            color: Color(0xFF8E8E93),
            size: 24,
          ),
        ],
      ),
    );
  }

  Widget _buildBookCard(Map<String, dynamic> book, int index) {
    final title = (book['title'] as String?) ?? '';
    final author = (book['author'] as String?) ?? 'Juan dela Cruz';
    final language = LibraryService.languageLabel(book['language'] as String?);
    final progress = LibraryService.parseDouble(book['progress']);
    final percentText = '${(progress * 100).toInt()}%';

    final isCompleted = (book['status'] as String?) == 'completed' || progress >= 1.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Book Cover (AspectRatio 1:1.45, width-driven)
        StyledBookCover(
          book: {
            'title': title,
            'author': author,
          },
          index: index,
        ),
        const SizedBox(height: 8),

        // 2. Language & Completed Badge Row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              language,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF64748B),
              ),
            ),
            if (isCompleted)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                decoration: BoxDecoration(
                  color: const Color(0xFFE6F4EA),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.check_circle_rounded,
                      color: Color(0xFF00AA5A),
                      size: 11,
                    ),
                    const SizedBox(width: 3.5),
                    Text(
                      'Completed',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF00AA5A),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 4),

        // 3. Title (Multi-line serif/inter style)
        Text(
          title,
          maxLines: 2,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF0F172A),
            height: 1.15,
          ),
        ),
        const SizedBox(height: 8),

        // 4. Progress Bar
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: isCompleted ? 1.0 : progress,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: AlwaysStoppedAnimation<Color>(
              isCompleted ? const Color(0xFF00AA5A) : const Color(0xFF1B64D8),
            ),
            minHeight: 5,
          ),
        ),
        // 5. Page Progress Text & Percentage (only when in progress)
        if (!isCompleted) ...[
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'Progress',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
              Text(
                percentText,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF1B64D8),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
