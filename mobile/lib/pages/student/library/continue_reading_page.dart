import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/styled_book_cover.dart';

class ContinueReadingPage extends StatefulWidget {
  const ContinueReadingPage({super.key});

  @override
  State<ContinueReadingPage> createState() => _ContinueReadingPageState();
}

class _ContinueReadingPageState extends State<ContinueReadingPage> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);

    final unfinishedBooks = [
      {
        'title': 'SARI - SARI SUMMERS',
        'progress': 0.12,
      },
      {
        'title': 'A Song of Frutas',
        'progress': 0.45,
      },
      {
        'title': 'OLD CLOTHES FOR DINNER',
        'progress': 0.60,
      },
    ];

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
                          // Right Three Dots Options
                          IconButton(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Options menu tapped'),
                                  duration: Duration(seconds: 1),
                                ),
                              );
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
                        padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Search bar field
                            _buildSearchBar(),
                            const SizedBox(height: 24),

                            // Section Title
                            Row(
                              children: [
                                const Iconify(
                                  PhIcons.bookOpenBold,
                                  color: Color(0xFF1B64D8),
                                  size: 24,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Continue Reading',
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

                            // Grid of Unfinished Books
                            GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              clipBehavior: Clip.none,
                              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: isTablet ? 4 : 2,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 16,
                                childAspectRatio: 0.58,
                              ),
                              itemCount: unfinishedBooks.length,
                              itemBuilder: (context, index) {
                                final book = unfinishedBooks[index];
                                return _buildBookCard(book, index);
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
    return Column(
      children: [
        Expanded(
          child: StyledBookCover(
            book: {
              'title': book['title'] as String,
              'author': 'Juan dela Cruz',
            },
            index: index,
          ),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(
            value: book['progress'] as double,
            backgroundColor: const Color(0xFFE4E2DC),
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1B64D8)),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}
