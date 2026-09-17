import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_story_page.dart';

class ListeningAssessmentInstructionsPage extends StatelessWidget {
  final Map<String, dynamic>? item;
  final String? customInstructions;

  const ListeningAssessmentInstructionsPage({
    super.key,
    this.item,
    this.customInstructions,
  });

  String _formatDueDate(dynamic rawDate) {
    if (rawDate == null || rawDate.toString().isEmpty) return 'No due date';
    try {
      final dt = DateTime.parse(rawDate.toString()).toLocal();
      final months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      final month = months[dt.month - 1];
      final day = dt.day;
      final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final minute = dt.minute.toString().padLeft(2, '0');
      final period = dt.hour >= 12 ? 'PM' : 'AM';
      return 'Due: $month $day, $hour:$minute $period';
    } catch (_) {
      return 'Due: ${rawDate.toString().split('T')[0]}';
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);
    final isPhilIriPeriod = PhilIriAssessmentPage.isPhilIriPeriod;
    final effectiveInstructions =
        (item?['instructions'] ?? customInstructions ?? '').toString();

    final titleText = item?['title'] ?? 'Listening Assessment';
    final rawSet = (item?['passageSet'] ?? item?['set'] ?? item?['passage']?['set'] ?? 'Set A').toString().trim();
    final setLabel = rawSet.toLowerCase().startsWith('set') ? rawSet : 'Set $rawSet';
    final dueDateText = _formatDueDate(item?['dueDate']);
    final isDone = item?['isCompleted'] == true;
    final isClosed = !isDone && (item?['status'] ?? 'open') == 'closed';
    final statusText = isDone
        ? 'Completed'
        : (isClosed ? 'Closed' : 'Assessment not started.');

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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 12.0,
                      ),
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
                                color: isPhilIriPeriod
                                    ? Colors.white
                                    : const Color(0xFFEEEEEE),
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
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
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
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              dueDateText,
                                              style: GoogleFonts.inter(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF71717A),
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              titleText,
                                              style: GoogleFonts.inter(
                                                fontSize: 18,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.black,
                                                letterSpacing: -0.5,
                                              ),
                                            ),
                                            const SizedBox(height: 6),
                                            if (setLabel.isNotEmpty) ...[
                                              Container(
                                                padding: const EdgeInsets.symmetric(
                                                  horizontal: 10,
                                                  vertical: 4,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF4F4F5),
                                                  borderRadius: BorderRadius.circular(20),
                                                  border: Border.all(
                                                    color: const Color(0xFFE4E4E7),
                                                  ),
                                                ),
                                                child: Text(
                                                  setLabel,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w700,
                                                    color: primaryBlue,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 6),
                                            ],
                                            Text(
                                              statusText,
                                              style: GoogleFonts.inter(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500,
                                                color: isDone
                                                    ? const Color(0xFF059669)
                                                    : const Color(0xFF71717A),
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
                                  _buildInstructionRow(
                                    '1.',
                                    'Listen attentively while the reading passage is read aloud clearly.',
                                  ),
                                  _buildInstructionRow(
                                    '2.',
                                    'Focus on remembering key characters, events, and details of the story.',
                                  ),
                                  _buildInstructionRow(
                                    '3.',
                                    'Answer all comprehension questions based strictly on what you heard.',
                                  ),
                                  _buildInstructionRow(
                                    '4.',
                                    'Complete the assessment to determine Listening Comprehension level.',
                                  ),
                                  if (effectiveInstructions.trim().isNotEmpty) ...[
                                    const SizedBox(height: 16),
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEFF6FF),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: const Color(0xFFBFDBFE),
                                          width: 1.0,
                                        ),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Special Instructions from Teacher',
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                              color: const Color(0xFF1D4ED8),
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            effectiveInstructions.trim(),
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w400,
                                              color: const Color(0xFF1E293B),
                                              height: 1.4,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
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
                              color: isPhilIriPeriod
                                  ? primaryBlue.withValues(alpha: 0.25)
                                  : Colors.black.withValues(alpha: 0.02),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ElevatedButton(
                          onPressed: isPhilIriPeriod
                              ? () {
                                  Feedback.forTap(context);
                                  _startAssessment(context);
                                }
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isPhilIriPeriod
                                ? primaryBlue
                                : const Color(0xFFE4E4E7),
                            disabledBackgroundColor: const Color(0xFFE4E4E7),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Iconify(
                                PhIcons.examRegular,
                                color: isPhilIriPeriod
                                    ? Colors.white
                                    : const Color(0xFFA1A1AA),
                                size: 24,
                              ),
                              const SizedBox(width: 10),
                              Text(
                                isPhilIriPeriod
                                    ? 'Start Assessment'
                                    : 'Not Available',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: isPhilIriPeriod
                                      ? Colors.white
                                      : const Color(0xFFA1A1AA),
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
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => ListeningAssessmentStoryPage(item: item),
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
