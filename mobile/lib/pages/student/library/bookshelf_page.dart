import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/widgets/styled_book_cover.dart';
import 'package:salintinig/pages/student/library/story_preview_page.dart';

class BookshelfPage extends StatefulWidget {
  const BookshelfPage({super.key});

  @override
  State<BookshelfPage> createState() => _BookshelfPageState();
}

class _BookshelfPageState extends State<BookshelfPage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  bool _isLoading = true;
  List<Map<String, dynamic>> _allBooks = [];

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
    _loadBooks();
  }

  Future<void> _loadBooks({bool forceRefresh = false}) async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final books = await LibraryService.fetchBooks(forceRefresh: forceRefresh);
      if (mounted) {
        final List<Map<String, dynamic>> fetchedBooks = List<Map<String, dynamic>>.from(books);
        fetchedBooks.shuffle();
        setState(() {
          _allBooks = fetchedBooks;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

  final filteredBooks = _allBooks.where((book) {
      final title = (book['title'] as String? ?? '').toLowerCase();
      return title.contains(_searchQuery);
    }).toList();

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
                          Text(
                            'Bookshelf',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                            },
                            icon: const Icon(
                              Icons.more_horiz_rounded,
                              size: 26,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 2. Main Content
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.only(
                          left: 20.0,
                          right: 20.0,
                          bottom: 24.0,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Search bar field
                            _buildSearchBar(),
                            const SizedBox(height: 16),

                            // Section Title
                            Row(
                              children: [
                                const Iconify(
                                  PhIcons.booksRegular,
                                  color: primaryBlue,
                                  size: 24,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Bookshelf',
                                  style: GoogleFonts.inter(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.black87,
                                    letterSpacing: -0.3,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),

                            // Grid of books
                            filteredBooks.isEmpty
                                ? Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 40.0,
                                    ),
                                    child: Center(
                                      child: Text(
                                        'No books found',
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: const Color(0xFF8E8E93),
                                        ),
                                      ),
                                    ),
                                  )
                                : GridView.builder(
                                    shrinkWrap: true,
                                    physics:
                                        const NeverScrollableScrollPhysics(),
                                    clipBehavior: Clip.none,
                                    gridDelegate:
                                        SliverGridDelegateWithFixedCrossAxisCount(
                                          crossAxisCount: isTablet ? 5 : 3,
                                          crossAxisSpacing: 12,
                                          mainAxisSpacing: 24,
                                          childAspectRatio: () {
                                            final count = isTablet ? 5 : 3;
                                            final spacing = 12.0;
                                            final cellWidth = (constraints.maxWidth - 40 - (count - 1) * spacing) / count;
                                            final coverH = cellWidth * 1.45;
                                            const belowH = 68.0;
                                            return cellWidth / (coverH + belowH);
                                          }(),
                                        ),
                                    itemCount: _isLoading ? 6 : filteredBooks.length,
                                    itemBuilder: (context, index) {
                                      if (_isLoading) {
                                        // Shimmer placeholder
                                        return Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Expanded(
                                              child: Container(
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFE2E8F0),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Container(height: 10, width: double.infinity, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                                            const SizedBox(height: 4),
                                            Container(height: 10, width: 70, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                                          ],
                                        );
                                      }
                                      final book = filteredBooks[index];
                                      return GestureDetector(
                                        onTap: () {
                                          Feedback.forTap(context);
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (context) => StoryPreviewPage(
                                                bookTitle: (book['title'] as String?) ?? '',
                                                book: book,
                                              ),
                                            ),
                                          ).then((_) {
                                            WidgetsBinding.instance.addPostFrameCallback((_) {
                                              if (mounted) _loadBooks(forceRefresh: true);
                                            });
                                          });
                                        },
                                        child: _buildSelectedBookCard(book, index),
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

  Widget _buildSearchBar() {
    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: const Color(0xFFE4E4E7).withValues(alpha: 0.5),
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
              style: GoogleFonts.inter(fontSize: 15, color: Colors.black),
            ),
          ),
          const Icon(Icons.search_rounded, color: Color(0xFF8E8E93), size: 24),
        ],
      ),
    );
  }

  Widget _buildSelectedBookCard(Map<String, dynamic> book, int index) {
    final title = (book['title'] as String?) ?? '';
    final language = LibraryService.languageLabel(book['language'] as String?);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Styled 3D Hardbound Cover (AspectRatio 1:1.45, width-driven)
        StyledBookCover(
          book: book,
          index: index,
        ),
        const SizedBox(height: 6),

        // Language label below cover
        Text(
          language,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 3),

        // Story Title below cover
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
    );
  }
}
