import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_comprehension_summary_page.dart';

class SilentReadingResultPage extends StatelessWidget {
  final int score;
  final int totalQuestions;

  const SilentReadingResultPage({
    super.key,
    this.score = 3,
    this.totalQuestions = 3,
  });

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

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
                    // 1. Custom Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Iconify(
                              PhIcons.caretLeftRegular,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            'Silent Reading Test',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              _showMoreOptions(context);
                            },
                            icon: const Icon(
                              Icons.more_horiz_rounded,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // 2. Scrollable content
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Mint Green Accomplishment Card
                            Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFEAF5EC), // Soft mint green
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 52,
                                        height: 52,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFD1FAE5), // Soft green circle background
                                          shape: BoxShape.circle,
                                        ),
                                        alignment: Alignment.center,
                                        child: const Iconify(
                                          PhIcons.bookOpenRegular,
                                          color: Color(0xFF10B981), // Vivid Emerald Green
                                          size: 26,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Date Accomplished: May 18, 11:59 PM',
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF475569),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              'Silent Reading Test',
                                              style: GoogleFonts.inter(
                                                fontSize: 18,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.black,
                                                letterSpacing: -0.5,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Container(
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFD1FAE5),
                                                    borderRadius: BorderRadius.circular(12),
                                                  ),
                                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                                  child: Text(
                                                    '100 Stars',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w700,
                                                      color: const Color(0xFF059669),
                                                    ),
                                                  ),
                                                ),
                                                Text(
                                                  '$score/$totalQuestions',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w800,
                                                    color: const Color(0xFF059669),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const Padding(
                                    padding: EdgeInsets.symmetric(vertical: 16.0),
                                    child: Divider(
                                      color: Color(0xFFC7E2CE),
                                      thickness: 1,
                                    ),
                                  ),
                                  Text(
                                    'Instructions:',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.black,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  _buildInstructionStep('1.', 'Read the passage silently and understand the story carefully.'),
                                  const SizedBox(height: 6),
                                  _buildInstructionStep('2.', 'Pay attention to important details and unfamiliar words.'),
                                  const SizedBox(height: 6),
                                  _buildInstructionStep('3.', 'Answer the comprehension questions after reading.'),
                                  const SizedBox(height: 6),
                                  _buildInstructionStep('4.', 'Complete all answers correctly to earn a higher score.'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Metric Cards Row
                            Row(
                              children: [
                                Expanded(
                                  child: _buildMetricCard(
                                    valueNumber: '92',
                                    valueUnit: 'wps',
                                    label: 'Reading Speed',
                                    iconSvg: PhIcons.lightningRegular,
                                    iconColor: const Color(0xFFF59E0B),
                                    iconBgColor: const Color(0xFFFEF3C7),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildMetricCard(
                                    valueNumber: '${(score / totalQuestions * 100).round()}%',
                                    label: 'Comprehension',
                                    iconSvg: PhIcons.lightbulbRegular,
                                    iconColor: const Color(0xFF00AA5A),
                                    iconBgColor: const Color(0xFFD1FAE5),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 24),

                            // View Comprehension Summary Button
                            Container(
                              width: double.infinity,
                              height: 56,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryBlue.withValues(alpha: 0.15),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: () {
                                  Feedback.forTap(context);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => SilentReadingComprehensionSummaryPage(
                                        score: score,
                                        totalQuestions: totalQuestions,
                                      ),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryBlue,
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Iconify(
                                      PhIcons.examRegular,
                                      color: Colors.white,
                                      size: 22,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'View Comprehension Summary',
                                      style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 20),
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

  Widget _buildInstructionStep(String number, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 18,
          child: Text(
            number,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1E293B),
            ),
          ),
        ),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF334155),
              height: 1.35,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String valueNumber,
    String? valueUnit,
    required String label,
    required String iconSvg,
    required Color iconColor,
    required Color iconBgColor,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Iconify(
                  iconSvg,
                  color: iconColor,
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                valueNumber,
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                  letterSpacing: -1,
                ),
              ),
              if (valueUnit != null) ...[
                const SizedBox(width: 2),
                Text(
                  valueUnit,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  void _showMoreOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.share_rounded),
                  title: Text('Share Result', style: GoogleFonts.inter()),
                  onTap: () {
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.download_rounded),
                  title: Text('Download Report', style: GoogleFonts.inter()),
                  onTap: () {
                    Navigator.pop(context);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
