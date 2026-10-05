import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_comprehension_summary_page.dart';

class ParentAssessmentResultDetailPage extends StatelessWidget {
  final Map<String, dynamic> item;
  final String studentName;

  const ParentAssessmentResultDetailPage({
    super.key,
    required this.item,
    required this.studentName,
  });

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    final type = (item['assessmentType'] ?? item['type'] ?? 'oral').toString().toLowerCase();
    final isOral = type == 'oral';
    final isSilent = type == 'silent';

    final title = (item['title'] ?? item['passageTitle'] ?? 'Phil-IRI Assessment').toString();
    final passageTitle = (item['passageTitle'] ?? '').toString();
    final period = (item['period'] ?? 'Pre-Test').toString();
    final language = (item['language'] ?? 'Filipino').toString();
    final grade = (item['gradeLevel'] ?? '').toString();

    final accuracy = item['accuracyPercentage'];
    final comp = item['comprehensionScore'];
    final timeSec = item['readingTimeSeconds'] != null ? numberToNum(item['readingTimeSeconds']).round() : null;
    final wordCount = item['words'] != null ? numberToNum(item['words']).round() : 92;

    int? wpm;
    if (item['readingRateWpm'] != null && numberToNum(item['readingRateWpm']) > 0) {
      wpm = numberToNum(item['readingRateWpm']).round();
    } else if (timeSec != null && timeSec > 0) {
      wpm = ((wordCount / timeSec) * 60).round();
    }

    final rawLevel = (item['readingLevelResult'] ?? '').toString().trim();

    final rawQuestions = item['questions'];
    final List<Map<String, dynamic>> questions = (rawQuestions is List)
        ? rawQuestions.map((q) => Map<String, dynamic>.from(q as Map)).toList()
        : [];

    final int totalQuestions = (item['totalQuestions'] != null && item['totalQuestions'] > 0)
        ? item['totalQuestions'] as int
        : (questions.isNotEmpty ? questions.length : 5);

    final int score = item['score'] != null
        ? item['score'] as int
        : (comp != null
            ? ((numberToNum(comp) / 100) * totalQuestions).round()
            : (questions.where((q) => q['isCorrect'] == true).length));

    final int compPercent = comp != null
        ? numberToNum(comp).round()
        : (totalQuestions > 0 ? ((score / totalQuestions) * 100).round() : 0);

    // Calculate level if missing
    final String levelName = rawLevel.isNotEmpty && rawLevel != 'Pending Evaluation'
        ? rawLevel
        : _calculateLevel(type: type, compPct: compPercent, accuracyPct: accuracy != null ? numberToNum(accuracy).round() : null);

    // Date
    String dateStr = '';
    final completedAt = item['completedAt'] ?? item['assignedAt'];
    if (completedAt != null && completedAt.toString().isNotEmpty) {
      try {
        final dt = DateTime.parse(completedAt.toString()).toLocal();
        final periodStr = dt.hour >= 12 ? 'PM' : 'AM';
        final hour12 = dt.hour == 0 ? 12 : (dt.hour > 12 ? dt.hour - 12 : dt.hour);
        final hourStr = hour12.toString().padLeft(2, '0');
        final minStr = dt.minute.toString().padLeft(2, '0');
        dateStr = '${dt.month}/${dt.day}/${dt.year}, $hourStr:$minStr $periodStr';
      } catch (_) {
        dateStr = completedAt.toString();
      }
    }

    final firstName = studentName.trim().isNotEmpty ? studentName.trim().split(' ').first : 'Your child';

    // Praise subtitle logic
    final praiseData = _getPraise(compPercent, firstName);

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
                    // Top App Header
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
                          Expanded(
                            child: Text(
                              title,
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                                letterSpacing: -0.4,
                              ),
                            ),
                          ),
                          const SizedBox(width: 44), // Balances left button
                        ],
                      ),
                    ),

                    // Scrollable report body
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // 🌟 Result Hero Badge & Praise Card
                            Container(
                              padding: const EdgeInsets.all(24.0),
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
                              child: Column(
                                children: [
                                  // Radial Score Gauge Ring
                                  SizedBox(
                                    width: 140,
                                    height: 140,
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        SizedBox(
                                          width: 140,
                                          height: 140,
                                          child: CircularProgressIndicator(
                                            value: (compPercent / 100.0).clamp(0.0, 1.0),
                                            strokeWidth: 10,
                                            backgroundColor: const Color(0xFFE2E8F0),
                                            valueColor: AlwaysStoppedAnimation<Color>(
                                              compPercent >= 80
                                                  ? const Color(0xFF059669)
                                                  : (compPercent >= 59
                                                      ? const Color(0xFFD97706)
                                                      : const Color(0xFFDC2626)),
                                            ),
                                            strokeCap: StrokeCap.round,
                                          ),
                                        ),
                                        Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text(
                                              '$compPercent%',
                                              style: GoogleFonts.inter(
                                                fontSize: 32,
                                                fontWeight: FontWeight.w900,
                                                color: compPercent >= 80
                                                    ? const Color(0xFF059669)
                                                    : (compPercent >= 59
                                                        ? const Color(0xFFD97706)
                                                        : const Color(0xFFDC2626)),
                                                letterSpacing: -1,
                                              ),
                                            ),
                                            Text(
                                              '$score/$totalQuestions Score',
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF64748B),
                                              ),
                                            ),
                                            if (dateStr.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Padding(
                                                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                                child: Text(
                                                  dateStr,
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w500,
                                                    color: const Color(0xFF94A3B8),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Praise Headline & Subtitle
                                  Text(
                                    praiseData.$1,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF0F172A),
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    praiseData.$2,
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF64748B),
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Grid of Metric Cards (Adapts per assessment type)
                            if (isOral) ...[
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildMetricCard(
                                      valueNumber: accuracy != null ? '$accuracy%' : '--',
                                      label: 'Word Accuracy',
                                      iconWidget: const Iconify(PhIcons.targetRegular, color: primaryBlue, size: 18),
                                      iconBgColor: const Color(0xFFD0E1F9),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildMetricCard(
                                      valueNumber: '$compPercent%',
                                      label: 'Comprehension',
                                      iconWidget: const Iconify(PhIcons.lightbulbRegular, color: Color(0xFF00AA5A), size: 18),
                                      iconBgColor: const Color(0xFFD1FAE5),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildMetricCard(
                                      valueNumber: wpm != null ? '$wpm' : '--',
                                      valueUnit: 'wpm',
                                      label: 'Reading Speed',
                                      iconWidget: const Iconify(PhIcons.lightningRegular, color: Color(0xFFF59E0B), size: 18),
                                      iconBgColor: const Color(0xFFFEF3C7),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildLevelMetricCard(levelName),
                                  ),
                                ],
                              ),
                            ] else if (isSilent) ...[
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildMetricCard(
                                      valueNumber: wpm != null ? '$wpm' : '--',
                                      valueUnit: 'wpm',
                                      label: 'Reading Speed',
                                      iconWidget: const Iconify(PhIcons.lightningRegular, color: Color(0xFFF59E0B), size: 18),
                                      iconBgColor: const Color(0xFFFEF3C7),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildMetricCard(
                                      valueNumber: '$compPercent%',
                                      label: 'Comprehension',
                                      iconWidget: const Iconify(PhIcons.lightbulbRegular, color: Color(0xFF00AA5A), size: 18),
                                      iconBgColor: const Color(0xFFD1FAE5),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildMetricCard(
                                      valueNumber: timeSec != null ? '${timeSec}s' : '--',
                                      label: 'Reading Time',
                                      iconWidget: const Iconify(Ph.hourglass, color: Color(0xFF3B82F6), size: 18),
                                      iconBgColor: const Color(0xFFDBEAFE),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildLevelMetricCard(levelName),
                                  ),
                                ],
                              ),
                            ] else ...[
                              // Listening
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildMetricCard(
                                      valueNumber: '$compPercent%',
                                      label: 'Comprehension',
                                      iconWidget: const Iconify(PhIcons.lightbulbRegular, color: Color(0xFF00AA5A), size: 18),
                                      iconBgColor: const Color(0xFFD1FAE5),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildLevelMetricCard(levelName),
                                  ),
                                ],
                              ),
                            ],
                            const SizedBox(height: 20),

                            // View Comprehension Summary Button
                            Container(
                              width: double.infinity,
                              height: 54,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryBlue.withValues(alpha: 0.18),
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
                                      builder: (context) => OralReadingComprehensionSummaryPage(
                                        score: score,
                                        totalQuestions: totalQuestions,
                                        questionsList: questions,
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
                            const SizedBox(height: 16),

                            // Detailed Assessment Meta Breakdown Card
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Assessment Details',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(height: 10),
                                  _buildMetaRow('Passage Title', passageTitle.isNotEmpty ? passageTitle : title),
                                  _buildMetaRow('Period / Cycle', period),
                                  _buildMetaRow('Language', language),
                                  if (grade.isNotEmpty) _buildMetaRow('Grade Level', grade),
                                  if (item['passageSet'] != null)
                                    _buildMetaRow('Passage Set', item['passageSet'].toString()),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
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

  static (String, String) _getPraise(int compPct, String childName) {
    if (compPct == 100) {
      return (
        'Outstanding, $childName!',
        'Perfect score! $childName showed exceptional reading comprehension skills!'
      );
    } else if (compPct >= 80) {
      return (
        'Great job, $childName!',
        "$childName has mastered the core concepts. Keep up the momentum!"
      );
    } else if (compPct >= 59) {
      return (
        'Good effort, $childName!',
        '$childName is on the right track! Practice will boost confidence and comprehension.'
      );
    } else {
      return (
        'Keep encouraging, $childName!',
        'Every assessment is a stepping stone. Regular practice helps strengthen reading skills!'
      );
    }
  }

  static String _calculateLevel({required String type, required int compPct, int? accuracyPct}) {
    if (type == 'oral' && accuracyPct != null) {
      if (accuracyPct >= 97 && compPct >= 80) return 'Independent';
      if (accuracyPct <= 89 || compPct <= 58) return 'Frustration';
      return 'Instructional';
    }
    if (compPct >= 80) return 'Independent';
    if (compPct >= 59) return 'Instructional';
    return 'Frustration';
  }

  static num numberToNum(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value;
    return num.tryParse(value.toString()) ?? 0;
  }

  Widget _buildMetricCard({
    required String valueNumber,
    String? valueUnit,
    required String label,
    required Widget iconWidget,
    required Color iconBgColor,
  }) {
    return Container(
      constraints: const BoxConstraints(minHeight: 104),
      padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 14.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          SizedBox(
            height: 34,
            child: Align(
              alignment: Alignment.centerLeft,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: RichText(
                  text: TextSpan(
                    style: GoogleFonts.inter(
                      color: const Color(0xFF1E293B),
                    ),
                    children: [
                      TextSpan(
                        text: valueNumber,
                        style: GoogleFonts.inter(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      if (valueUnit != null) ...[
                        const TextSpan(text: ' '),
                        TextSpan(
                          text: valueUnit,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: iconWidget,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLevelMetricCard(String levelName) {
    final lvl = levelName.toLowerCase();
    final Color badgeColor;
    final Color badgeBg;
    if (lvl.contains('indep')) {
      badgeColor = const Color(0xFF047857);
      badgeBg = const Color(0xFFD1FAE5);
    } else if (lvl.contains('frust')) {
      badgeColor = const Color(0xFFB91C1C);
      badgeBg = const Color(0xFFFEE2E2);
    } else {
      badgeColor = const Color(0xFFB45309);
      badgeBg = const Color(0xFFFEF3C7);
    }

    return Container(
      constraints: const BoxConstraints(minHeight: 104),
      padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 14.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          SizedBox(
            height: 34,
            child: Align(
              alignment: Alignment.centerLeft,
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  levelName,
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: badgeColor,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'PHIL-IRI Level',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF64748B),
                ),
              ),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Icon(Icons.workspace_premium_rounded, color: badgeColor, size: 20),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetaRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0F172A),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
