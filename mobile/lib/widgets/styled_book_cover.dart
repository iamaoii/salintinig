import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../pages/student/library/story_preview_page.dart';

class StyledBookCover extends StatelessWidget {
  final Map<String, String> book;
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

  static const List<List<Color>> _coverGradients = [
    [Color(0xFF1E3A8A), Color(0xFF2563EB)], // Deep Sapphire
    [Color(0xFF064E3B), Color(0xFF059669)], // Emerald Forest
    [Color(0xFF831843), Color(0xFFDB2777)], // Ruby Rose
    [Color(0xFF7C2D12), Color(0xFFEA580C)], // Burnt Amber
    [Color(0xFF312E81), Color(0xFF4F46E5)], // Indigo Night
    [Color(0xFF134E4A), Color(0xFF0D9488)], // Teal Ocean
    [Color(0xFF8A2387), Color(0xFFE94057)], // Royal Amethyst
    [Color(0xFFB91C1C), Color(0xFFEA580C)], // Warm Crimson
    [Color(0xFF0F766E), Color(0xFF14B8A6)], // Deep Teal
    [Color(0xFF4C1D95), Color(0xFF7C3AED)], // Purple Majesty
  ];

  @override
  Widget build(BuildContext context) {
    final gradient = _coverGradients[index % _coverGradients.length];
    final title = book['title'] ?? 'Walang Pamagat';
    final author = book['author'] ?? 'Juan dela Cruz';

    Widget coverWidget = LayoutBuilder(
      builder: (context, constraints) {
        final cardHeight = constraints.maxHeight.isFinite ? constraints.maxHeight : 200.0;
        final scale = (cardHeight / 200.0).clamp(0.5, 2.0);

        return Container(
          width: width ?? (constraints.maxWidth.isFinite ? null : 130),
          height: height ?? (constraints.maxHeight.isFinite ? null : 200),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14 * scale),
            boxShadow: [
              BoxShadow(
                color: gradient[0].withValues(alpha: 0.30),
                blurRadius: 12 * scale,
                offset: Offset(0, 5 * scale),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14 * scale),
            child: Stack(
              children: [
                // 1. Dual-tone Gradient Background
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: gradient,
                    ),
                  ),
                ),

                // 2. Subtle Geometric Watermark Rings
                Positioned(
                  right: -25 * scale,
                  top: -25 * scale,
                  child: Container(
                    width: 90 * scale,
                    height: 90 * scale,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.10),
                        width: 14 * scale,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: -10 * scale,
                  bottom: 8 * scale,
                  child: Container(
                    width: 50 * scale,
                    height: 50 * scale,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.08),
                        width: 8 * scale,
                      ),
                    ),
                  ),
                ),

                // 3. Elegant Gold Foil Outer Border Frame
                Positioned.fill(
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(16 * scale, 8 * scale, 8 * scale, 8 * scale),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8 * scale),
                        border: Border.all(
                          color: const Color(0xFFFFDF79).withValues(alpha: 0.50),
                          width: 1 * scale,
                        ),
                      ),
                    ),
                  ),
                ),

                // 4. Center White Band: Fixed Proportional Height & Position
                Positioned(
                  top: cardHeight * 0.33,
                  left: 0,
                  right: 0,
                  height: cardHeight * 0.35,
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.22),
                          blurRadius: 8 * scale,
                          offset: Offset(0, 3 * scale),
                        ),
                      ],
                    ),
                    padding: EdgeInsets.fromLTRB(18 * scale, 6 * scale, 8 * scale, 6 * scale),
                    alignment: Alignment.centerLeft,
                    child: Text(
                      title,
                      maxLines: 4,
                      softWrap: true,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: (14.0 * scale).clamp(10.0, 18.0),
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF0F172A),
                        height: 1.12,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                ),

                // 5. Author Name directly below white container
                Positioned(
                  top: (cardHeight * 0.33) + (cardHeight * 0.35) + (6 * scale),
                  left: 18 * scale,
                  right: 8 * scale,
                  child: Align(
                    alignment: Alignment.center,
                    child: Container(
                      padding: EdgeInsets.symmetric(horizontal: 8 * scale, vertical: 3 * scale),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withValues(alpha: 0.40),
                            Colors.black.withValues(alpha: 0.25),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(6 * scale),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.20),
                          width: 0.8 * scale,
                        ),
                      ),
                      child: Text(
                        author,
                        maxLines: 1,
                        textAlign: TextAlign.center,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: (8.5 * scale).clamp(7.0, 12.0),
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                  ),
                ),

                // 6. Spine crease (3D Book spine shadow)
                _buildSpineCrease(scale),

                // 7. Top: Salintinig Logo + Brand Name
                Positioned(
                  top: 13 * scale,
                  left: 20 * scale,
                  right: 8 * scale,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Image.asset(
                        'assets/logo/logo_v2.webp',
                        height: 12 * scale,
                        color: const Color(0xFFFFDF79),
                      ),
                      SizedBox(width: 4 * scale),
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'SALINTINIG',
                            maxLines: 1,
                            style: GoogleFonts.outfit(
                              fontSize: (7.5 * scale).clamp(6.0, 11.0),
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFFFFDF79),
                              letterSpacing: 0.4,
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

  Widget _buildSpineCrease(double scale) {
    return Positioned(
      left: 0,
      top: 0,
      bottom: 0,
      width: 15 * scale,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
            colors: [
              Colors.black.withValues(alpha: 0.42),
              Colors.black.withValues(alpha: 0.14),
              Colors.white.withValues(alpha: 0.09),
              Colors.transparent,
            ],
            stops: const [0.0, 0.35, 0.45, 1.0],
          ),
        ),
      ),
    );
  }
}
