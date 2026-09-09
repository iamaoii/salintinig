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
import 'package:salintinig/pages/student/library/side_quests_page.dart';
import 'package:salintinig/pages/student/library/story_preview_page.dart';
import 'package:salintinig/pages/student/activities/activities_page.dart';
import 'package:salintinig/pages/student/progress_page.dart';
import 'package:salintinig/services/auth_service.dart';

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
                          await AuthService.fetchMe();
                          if (mounted) setState(() {});
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
    const tagBg = Color(0xFFEFF6FF); // Light blue tint
    const tagTextColor = Color(0xFF2563EB); // Royal blue text
    const primaryBlue = Color(0xFF1B64D8);

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const StoryPreviewPage(
              bookTitle: 'Sari-Sari Summers',
              initialProgress: 0.35,
            ),
          ),
        );
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
            // Left Column: Compact Book Cover Aspect Ratio
            SizedBox(
              width: 110,
              height: 160,
              child: StyledBookCover(
                book: const {
                  'title': 'Sari-Sari Summers',
                  'author': 'Juan dela Cruz',
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
                  // Category Tag Row
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: tagBg,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      'Filipino',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: tagTextColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Main Story Title (Serif formal Playfair style)
                  Text(
                    'Ang Alamat ng Bahaghari',
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

                  // Short Synopsis/Description
                  Text(
                    'Tuklasin kung paano nagkaroon ng sari-saring kulay ang kalangitan.',
                    maxLines: 2,
                    overflow: TextOverflow.clip,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: const Color(0xFF64748B),
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Reading Progress Indicator (Pages & Percentage)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Page 7 of 20',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF475569),
                        ),
                      ),
                      Text(
                        '35%',
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
                    child: const LinearProgressIndicator(
                      value: 0.35,
                      backgroundColor: Color(0xFFF1F5F9),
                      valueColor: AlwaysStoppedAnimation<Color>(primaryBlue),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Full-Width Primary Button ("Continue Reading ->")
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton(
                      onPressed: () {
                        Feedback.forTap(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const StoryPreviewPage(
                              bookTitle: 'Sari-Sari Summers',
                              initialProgress: 0.35,
                            ),
                          ),
                        );
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

  Widget _buildBookshelfRow() {
    final books = [
      {
        'title': 'Sari-Sari Summers',
        'author': 'Juan dela Cruz',
      },
      {
        'title': 'A Song of Frutas',
        'author': 'Juan dela Cruz',
      },
      {
        'title': 'Old Clothes for Dinner',
        'author': 'Juan dela Cruz',
      },
    ];

    return SizedBox(
      height: 230,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        clipBehavior: Clip.none,
        padding: const EdgeInsets.symmetric(vertical: 10.0),
        itemCount: books.length,
        itemBuilder: (context, index) {
          final book = books[index];
          return Container(
            width: 135,
            margin: EdgeInsets.only(
              right: index == books.length - 1 ? 0.0 : 16.0,
            ),
            child: StyledBookCover(
              book: book,
              index: index,
            ),
          );
        },
      ),
    );
  }

  Widget _buildSideQuestsList() {
    final quests = [
      {
        'title': 'First step',
        'subtitle': 'Complete your very first practice activity',
        'badge': 'assets/badges/first_step_badge.webp',
      },
      {
        'title': 'I\'m a star!',
        'subtitle': 'Get a perfect score on a vocabulary matching activity',
        'badge': 'assets/badges/im_a_star_badge.webp',
      },
      {
        'title': 'Sounds right!',
        'subtitle': 'Get 3 out of 3 correct on a pronunciation challenge',
        'badge': 'assets/badges/sounds_right_badge.webp',
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
