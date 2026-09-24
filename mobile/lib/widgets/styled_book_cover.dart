import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../pages/student/library/story_preview_page.dart';

class BookCoverTheme {
  final Color primary;
  final Color darkSpine;
  final Color titleColor;

  const BookCoverTheme({
    required this.primary,
    required this.darkSpine,
    required this.titleColor,
  });
}

class StyledBookCover extends StatelessWidget {
  final Map<String, dynamic> book;
  final int index;
  final bool enableTap;
  final double? width;
  final double? height;

  const StyledBookCover({
    super.key,
    required this.book,
    required this.index,
    this.enableTap = true,
    this.width,
    this.height,
  });

  // 4 Signature Story Book Colors from Picture 1 (Green, Gold/Amber, Crimson Red, Royal Blue)
  static const List<BookCoverTheme> _coverThemes = [
    BookCoverTheme(
      primary: Color(0xFF008744), // Rich emerald green
      darkSpine: Color(0xFF005F30), // Deep darker green spine
      titleColor: Color(0xFF008744),
    ),
    BookCoverTheme(
      primary: Color(0xFFF4B400), // Vibrant amber gold
      darkSpine: Color(0xFFC48E00), // Dark golden yellow spine
      titleColor: Color(0xFFC48E00),
    ),
    BookCoverTheme(
      primary: Color(0xFFD83B27), // Crimson Red
      darkSpine: Color(0xFF9E2213), // Deep wine red spine
      titleColor: Color(0xFF9E2213),
    ),
    BookCoverTheme(
      primary: Color(0xFF1565C0), // Royal Blue
      darkSpine: Color(0xFF0D47A1), // Navy spine
      titleColor: Color(0xFF1565C0),
    ),
  ];

  static BookCoverTheme getThemeForBook(
    Map<String, dynamic> book, [
    int fallbackIndex = 0,
  ]) {
    final title = (book['title'] as String?) ?? (book['id'] as String?) ?? '';
    if (title.isEmpty) {
      return _coverThemes[fallbackIndex % _coverThemes.length];
    }

    int hash = 0;
    for (int i = 0; i < title.length; i++) {
      hash = (hash * 37 + title.codeUnitAt(i)) & 0xFFFFFFFF;
    }

    return _coverThemes[hash.abs() % _coverThemes.length];
  }

  @override
  Widget build(BuildContext context) {
    final theme = getThemeForBook(book, index);
    final title = (book['title'] as String?) ?? 'Walang Pamagat';
    final author = (book['author'] as String?) ?? 'Juan dela Cruz';

    Widget coverWidget = LayoutBuilder(
      builder: (context, constraints) {
        final effectiveWidth = constraints.maxWidth.isFinite
            ? constraints.maxWidth
            : 138.0;
        final totalHeight = effectiveWidth * 1.45;
        final scale = (totalHeight / 200.0).clamp(0.5, 2.0);

        final strokeWidth = 2.4 * scale;
        final spineWidth = effectiveWidth * 0.135;
        final pagesHeight = 11.5 * scale;

        return AspectRatio(
          aspectRatio: 1 / 1.45,
          child: Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.22),
                  blurRadius: 8 * scale,
                  offset: Offset(0, 4 * scale),
                ),
              ],
            ),
            child: Column(
              children: [
                // Top Cover Board (Main Face + Spine)
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A1816),
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(10 * scale),
                        topRight: Radius.circular(10 * scale),
                        bottomRight: Radius.circular(2 * scale),
                      ),
                    ),
                    padding: EdgeInsets.fromLTRB(
                      strokeWidth,
                      strokeWidth,
                      strokeWidth,
                      0,
                    ),
                    child: Stack(
                      children: [
                        // Primary Book Background Color
                        Container(
                          width: double.infinity,
                          height: double.infinity,
                          decoration: BoxDecoration(
                            color: theme.primary,
                            borderRadius: BorderRadius.only(
                              topLeft: Radius.circular(8 * scale),
                              topRight: Radius.circular(8 * scale),
                            ),
                          ),
                        ),

                        // Subtle Organic Circular Watermark Rings
                        Positioned(
                          right: -30 * scale,
                          top: -30 * scale,
                          child: Container(
                            width: 130 * scale,
                            height: 130 * scale,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.14),
                            ),
                          ),
                        ),
                        Positioned(
                          right: -20 * scale,
                          top: totalHeight * 0.22,
                          child: Container(
                            width: 90 * scale,
                            height: 90 * scale,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.black.withValues(alpha: 0.08),
                            ),
                          ),
                        ),

                        // Left Spine Vertical Strip
                        Positioned(
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: spineWidth,
                          child: Container(
                            decoration: BoxDecoration(
                              color: theme.darkSpine,
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(8 * scale),
                              ),
                              border: Border(
                                right: BorderSide(
                                  color: const Color(0xFF1A1816),
                                  width: strokeWidth,
                                ),
                              ),
                            ),
                          ),
                        ),

                        // Spine Groove Shadow
                        Positioned(
                          left: spineWidth,
                          top: 0,
                          bottom: 0,
                          width: 4 * scale,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  Colors.black.withValues(alpha: 0.32),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ),

                        // Center White Belt / Belly Band for Title & Author
                        Positioned(
                          left: 0,
                          right: 0,
                          top: totalHeight * 0.36,
                          height: totalHeight * 0.28,
                          child: Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border(
                                top: BorderSide(
                                  color: const Color(0xFF1A1816),
                                  width: strokeWidth,
                                ),
                                bottom: BorderSide(
                                  color: const Color(0xFF1A1816),
                                  width: strokeWidth,
                                ),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.12),
                                  blurRadius: 3 * scale,
                                  offset: Offset(0, 1.5 * scale),
                                ),
                              ],
                            ),
                            child: Stack(
                              children: [
                                // Left Spine Tint in White Belt
                                Positioned(
                                  left: 0,
                                  top: 0,
                                  bottom: 0,
                                  width: spineWidth,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: theme.darkSpine.withValues(
                                        alpha: 0.26,
                                      ),
                                      border: Border(
                                        right: BorderSide(
                                          color: const Color(0xFF1A1816),
                                          width: strokeWidth,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),

                                // Title and Author text inside white band
                                Positioned.fill(
                                  child: Padding(
                                    padding: EdgeInsets.fromLTRB(
                                      spineWidth + (8 * scale),
                                      3 * scale,
                                      6 * scale,
                                      3 * scale,
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          title,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.playfairDisplay(
                                            fontSize: (13.0 * scale).clamp(
                                              9.0,
                                              18.0,
                                            ),
                                            fontWeight: FontWeight.w900,
                                            color: theme.titleColor,
                                            height: 1.08,
                                            letterSpacing: -0.3,
                                          ),
                                        ),
                                        SizedBox(height: 2 * scale),
                                        Text(
                                          'by $author',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.playfairDisplay(
                                            fontStyle: FontStyle.italic,
                                            fontSize: (8.0 * scale).clamp(
                                              6.5,
                                              11.0,
                                            ),
                                            fontWeight: FontWeight.w600,
                                            color: const Color(
                                              0xFF1A1816,
                                            ).withValues(alpha: 0.82),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Bottom-Right Branding (Logo + SalinTinig)
                        Positioned(
                          bottom: 7 * scale,
                          right: 8 * scale,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Image.asset(
                                'assets/logo/logo_v2.webp',
                                height: 12 * scale,
                                color: Colors.white,
                              ),
                              SizedBox(width: 4 * scale),
                              Text(
                                'SalinTinig',
                                style: GoogleFonts.inter(
                                  fontSize: (9.5 * scale).clamp(7.0, 13.0),
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Bottom Pages Section (Exposed Book Edge from Picture 1)
                SizedBox(
                  height: pagesHeight,
                  width: double.infinity,
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      // White / Grey Block of Pages with rounded ends & dark stroke
                      Positioned(
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCDFE4), // Pages base tone
                            borderRadius: BorderRadius.horizontal(
                              left: Radius.circular(pagesHeight / 2),
                              right: Radius.circular(2 * scale),
                            ),
                            border: Border.all(
                              color: const Color(0xFF1A1816),
                              width: strokeWidth,
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.horizontal(
                              left: Radius.circular(
                                (pagesHeight / 2) - strokeWidth,
                              ),
                              right: Radius.circular(1 * scale),
                            ),
                            child: Column(
                              children: [
                                // Top lighter highlight of pages
                                Expanded(
                                  flex: 5,
                                  child: Container(
                                    color: const Color(0xFFEEEEF0),
                                  ),
                                ),
                                // Bottom darker beveled shadow of pages
                                Expanded(
                                  flex: 4,
                                  child: Container(
                                    color: const Color(0xFFBCC2CA),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      // Left Spine Overhang Curve
                      // Connects the dark vertical spine to the rounded front curve of the book
                      Positioned(
                        left: 0,
                        top: -strokeWidth,
                        width: strokeWidth,
                        height: pagesHeight * 0.5,
                        child: Container(color: const Color(0xFF1A1816)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (!enableTap) return coverWidget;

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StoryPreviewPage(bookTitle: title),
          ),
        );
      },
      child: coverWidget,
    );
  }
}
