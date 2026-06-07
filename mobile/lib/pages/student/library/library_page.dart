import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/library/continue_reading_page.dart';
import 'package:salintinig/pages/student/library/bookshelf_page.dart';
import 'package:salintinig/pages/student/library/side_quests_page.dart';
import 'package:salintinig/pages/student/library/story_preview_page.dart';

class LibraryPage extends StatefulWidget {
  const LibraryPage({super.key});

  @override
  State<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends State<LibraryPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
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
          } else if (index != 2) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Navigation to item $index tapped.', style: GoogleFonts.inter()),
                duration: const Duration(seconds: 1),
              ),
            );
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
                            // Right Spacer to keep title centered
                            const SizedBox(width: 48),
                          ],
                        ),
                      ),

                    // 2. Scrollable content
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 20),
                            // Continue Reading Panel
                            _buildSectionHeader(
                              icon: PhIcons.bookOpenRegular,
                              title: 'Continue Reading',
                              onSeeAll: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const ContinueReadingPage(),
                                  ),
                                );
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
                                );
                              },
                            ),
                            const SizedBox(height: 12),
                            _buildBookshelfRow(),
                            const SizedBox(height: 28),

                            // Side quests Panel
                            _buildSectionHeader(
                              icon: PhIcons.hourglassRegular,
                              title: 'Side quests',
                              onSeeAll: () {
                                Feedback.forTap(context);
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const SideQuestsPage(),
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
                color: Colors.black,
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
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1B64D8),
              decoration: TextDecoration.underline,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildContinueReadingCard() {
    const cardBg = Color(0xFFFEF8EC); // Creamy warm beige
    const tagBg = Color(0xFFE6F4EA);
    const tagTextColor = Color(0xFF137333);
    const continueBtnColor = Color(0xFFFBBF24);

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const StoryPreviewPage(
              bookTitle: 'SARI - SARI SUMMERS',
              initialProgress: 0.12,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFFDEEBE), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Large Book Cover
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AspectRatio(
                aspectRatio: 3 / 4,
                child: Image.asset(
                  'assets/stories/sari_sari_summers.jpg',
                  fit: BoxFit.cover,
                  alignment: Alignment.topCenter,
                ),
              ),
            ),
            const SizedBox(height: 16),
            // Book Title
            Text(
              'SARI - SARI SUMMERS',
              style: GoogleFonts.merriweather(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 8),
            // Book Description
            Text(
              'Nora helps her Lola save their sari-sari store by making mango ice candy during a hot summer in the Philippines.',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF71717A),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 16),
            // Progress Bar
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: const LinearProgressIndicator(
                value: 0.12, // approx progress value from mockup
                backgroundColor: Color(0xFFE4E2DC),
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1B64D8)),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 16),
            // Tag & Continue Button Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: tagBg,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  child: Text(
                    'Filipino',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: tagTextColor,
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    Feedback.forTap(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const StoryPreviewPage(
                          bookTitle: 'SARI - SARI SUMMERS',
                          initialProgress: 0.12,
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: continueBtnColor,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(100),
                    ),
                  ),
                  child: Text(
                    'Continue',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookshelfRow() {
    final books = [
      {
        'title': 'SARI - SARI SUMMERS',
        'cover': 'assets/stories/sari_sari_summers.jpg',
      },
      {
        'title': 'A Song of Frutas',
        'cover': 'assets/stories/a_song_of_frutas.png',
      },
      {
        'title': 'OLD CLOTHES FOR DINNER',
        'cover': 'assets/stories/old_clothes_for_dinner.png',
      },
    ];

    return SizedBox(
      height: 255,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        clipBehavior: Clip.none,
        padding: const EdgeInsets.symmetric(vertical: 10.0),
        itemCount: books.length,
        itemBuilder: (context, index) {
          final book = books[index];
          return GestureDetector(
            onTap: () {
              Feedback.forTap(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => StoryPreviewPage(bookTitle: book['title']!),
                ),
              );
            },
            child: Container(
              width: 140,
              margin: EdgeInsets.only(
                right: index == books.length - 1 ? 0.0 : 16.0,
              ),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  AspectRatio(
                    aspectRatio: 3 / 4,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.asset(
                        book['cover']!,
                        fit: BoxFit.cover,
                        alignment: Alignment.topCenter,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: Text(
                      book['title']!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                        height: 1.2,
                      ),
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
    final quests = [
      {
        'title': 'Ganda at Talino Badge',
        'subtitle': 'Read 3 books written by Female authors in 2 Days',
        'badge': 'assets/badges/ganda_talino_badge.webp',
      },
      {
        'title': 'Early Badge',
        'subtitle': 'Read 3 books written by Young authors in 2 Days',
        'badge': 'assets/badges/early_bird_badge.webp',
      },
      {
        'title': '10x day Streak',
        'subtitle': 'Read 3 books written by Female authors in 2 Days',
        'badge': 'assets/badges/10_day_streak_badge.webp',
      },
    ];

    const cardColor = Color(0xFFFFD13E); // Yellow matching reference (#FFD13E)

    return Column(
      children: quests.map((quest) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12.0),
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              // Badge Image
              SizedBox(
                width: 64,
                height: 64,
                child: Image.asset(
                  quest['badge']!,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(width: 16),
              // Details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      quest['title']!,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      quest['subtitle']!,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.black.withValues(alpha: 0.6),
                        fontWeight: FontWeight.w500,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // Finish Button
              ElevatedButton(
                onPressed: () {
                  Feedback.forTap(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B64D8), // Vibrant blue
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                child: Text(
                  'Finish',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
