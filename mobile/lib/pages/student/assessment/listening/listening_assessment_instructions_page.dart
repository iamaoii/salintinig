import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_story_page.dart';

class ListeningAssessmentInstructionsPage extends StatelessWidget {
  const ListeningAssessmentInstructionsPage({super.key});

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
                    // 1. Header Navigation Row
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Back Button
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
                          // Title
                          Text(
                            'Listening Assessment',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          // More Options Button
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

                    // 2. Content Card Section
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.04),
                                    blurRadius: 16,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Top section of the card: Icon & Description details
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Styled Ear Badge Icon
                                      Container(
                                        width: 56,
                                        height: 56,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFFEF3C7),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Center(
                                          child: Iconify(
                                            PhIcons.earRegular,
                                            color: Color(0xFFF59E0B),
                                            size: 28,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      // Meta Info Details
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Due: May 18, 11:59 PM',
                                              style: GoogleFonts.inter(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF71717A),
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Listening Assessment',
                                              style: GoogleFonts.inter(
                                                fontSize: 20,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.black,
                                                letterSpacing: -0.5,
                                              ),
                                            ),
                                            const SizedBox(height: 8),
                                            // Reward star pill badge
                                            Container(
                                              decoration: BoxDecoration(
                                                color: const Color(0xFFD1FAE5),
                                                borderRadius: BorderRadius.circular(100),
                                              ),
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 12,
                                                vertical: 4,
                                              ),
                                              child: Text(
                                                '100 Stars',
                                                style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                  color: const Color(0xFF059669),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 24),
                                  // Separator line
                                  Container(
                                    height: 1,
                                    color: const Color(0xFFF4F4F5),
                                  ),
                                  const SizedBox(height: 24),
                                  // Instructions Section
                                  Text(
                                    'Instructions:',
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.black,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  _buildInstructionRow('1.', 'Listen carefully while the story is being read aloud.'),
                                  _buildInstructionRow('2.', 'Focus on the details, characters, and events in the passage.'),
                                  _buildInstructionRow('3.', 'Answer the questions based on what you heard.'),
                                  _buildInstructionRow('4.', 'Complete the activity correctly to receive a higher score.'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                    ),

                    // 3. Bottom Button Section
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Container(
                        width: double.infinity,
                        height: 56,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: primaryBlue.withValues(alpha: 0.25),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: () {
                            Feedback.forTap(context);
                            _startAssessment(context);
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
                                size: 24,
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'Start Assessment',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
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
    );
  }

  Widget _buildInstructionRow(String index, String instruction) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            child: Text(
              index,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF3F3F46),
              ),
            ),
          ),
          Expanded(
            child: Text(
              instruction,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF3F3F46),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _startAssessment(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const ListeningAssessmentStoryPage(),
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
                  leading: const Iconify(Ph.info),
                  title: Text('Assessment Details', style: GoogleFonts.inter()),
                  onTap: () {
                    Navigator.pop(context);
                  },
                ),
                ListTile(
                  leading: const Iconify(PhIcons.warningCircleRegular),
                  title: Text('Report an Issue', style: GoogleFonts.inter()),
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
