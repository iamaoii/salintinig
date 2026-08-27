import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_comprehension_summary_page.dart';

class OralReadingResultPage extends StatefulWidget {
  final int score;
  final int totalQuestions;
  final int? wpm;
  final int? accuracyPct;
  final String? level;
  final String? completedAt;

  const OralReadingResultPage({
    super.key,
    this.score = 3,
    this.totalQuestions = 3,
    this.wpm,
    this.accuracyPct,
    this.level,
    this.completedAt,
  });

  @override
  State<OralReadingResultPage> createState() => _OralReadingResultPageState();
}

class _OralReadingResultPageState extends State<OralReadingResultPage> {
  int _wpm = 67;
  int _accuracyPct = 87;
  String _level = 'Instructional';
  String _dateStr = 'Recently Completed';
  String _title = 'Oral Reading Assessment';
  int _score = 3;
  int _totalQuestions = 3;
  List<Map<String, dynamic>> _questions = [];

  @override
  void initState() {
    super.initState();
    _wpm = widget.wpm ?? 67;
    _accuracyPct = widget.accuracyPct ?? 87;
    _level = widget.level ?? 'Instructional';
    _dateStr = widget.completedAt ?? 'Recently Completed';
    _score = widget.score;
    _totalQuestions = widget.totalQuestions;
    _fetchLiveResults();
  }

  Future<void> _fetchLiveResults() async {
    try {
      final res = await ApiService.get('/students/assessment/my-results');
      if (res.success && res.data != null && res.data['results'] is List) {
        final list = List<Map<String, dynamic>>.from(res.data['results']);
        final oralRes = list.firstWhere(
          (r) => (r['assessmentType'] ?? '').toString().toLowerCase() == 'oral',
          orElse: () => {},
        );

        if (oralRes.isNotEmpty && mounted) {
          setState(() {
            _wpm = (oralRes['readingRateWpm'] as num?)?.toInt() ?? _wpm;
            _accuracyPct = (oralRes['accuracyPercentage'] as num?)?.toInt() ?? _accuracyPct;
            if (oralRes['profileLabel'] != null) {
              _level = oralRes['profileLabel'].toString();
            }
            if (oralRes['fullTitle'] != null) {
              _title = oralRes['fullTitle'].toString();
            } else if (oralRes['assessmentTitle'] != null) {
              _title = oralRes['assessmentTitle'].toString();
            }
            if (oralRes['score'] != null) {
              _score = (oralRes['score'] as num).toInt();
            }
            if (oralRes['totalQuestions'] != null) {
              _totalQuestions = (oralRes['totalQuestions'] as num).toInt();
            }
            if (oralRes['questions'] is List) {
              _questions = List<Map<String, dynamic>>.from(oralRes['questions']);
            }
            if (oralRes['completedAt'] != null) {
              final dt = DateTime.tryParse(oralRes['completedAt'].toString());
              if (dt != null) {
                final dateFormatted = '${dt.month}/${dt.day}/${dt.year}';
                final hourStr = (dt.hour % 12 == 0 ? 12 : dt.hour % 12).toString().padLeft(2, '0');
                final minStr = dt.minute.toString().padLeft(2, '0');
                final ampm = dt.hour >= 12 ? 'PM' : 'AM';
                _dateStr = '$dateFormatted, $hourStr:$minStr $ampm';
              }
            }
          });
        }
      }
    } catch (e) {
      debugPrint('[OralResultPage] fetch live results error: $e');
    }
  }

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
                          // Left Back Button
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
                          // Center Title
                          // Center Title
                          Expanded(
                            child: Text(
                              _title,
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                          ),
                          // Right Triple Dots
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
                            // Green Accomplishment Card
                            Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFFEAF5EC),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 52,
                                        height: 52,
                                        decoration: const BoxDecoration(
                                          color: Color(0xFFD0E1F9),
                                          shape: BoxShape.circle,
                                        ),
                                        alignment: Alignment.center,
                                        child: const Iconify(
                                          PhIcons.userSoundRegular,
                                          color: primaryBlue,
                                          size: 26,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Date Accomplished: $_dateStr',
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF475569),
                                              ),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              _title,
                                              style: GoogleFonts.inter(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.black,
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
                                                    '${(_score / (_totalQuestions > 0 ? _totalQuestions : 1) * 100).round()} Stars',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 11,
                                                      fontWeight: FontWeight.w700,
                                                      color: const Color(0xFF059669),
                                                    ),
                                                  ),
                                                ),
                                                Text(
                                                  '$_score/$_totalQuestions',
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
                                  _buildInstructionStep('1.', 'Read the passage aloud clearly and carefully.'),
                                  const SizedBox(height: 6),
                                  _buildInstructionStep('2.', 'Pronounce each word correctly and read with proper expression.'),
                                  const SizedBox(height: 6),
                                  _buildInstructionStep('3.', 'After reading, answer the questions about the passage.'),
                                  const SizedBox(height: 6),
                                  _buildInstructionStep('4.', 'Complete the activity to receive your reading score.'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Metric Cards Rows
                            Row(
                              children: [
                                Expanded(
                                  child: _buildMetricCard(
                                    valueNumber: '$_wpm',
                                    valueUnit: 'wpm',
                                    label: 'Reading Speed',
                                    iconSvg: PhIcons.lightningRegular,
                                    iconColor: const Color(0xFFF59E0B),
                                    iconBgColor: const Color(0xFFFEF3C7),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildMetricCard(
                                    valueNumber: '$_accuracyPct%',
                                    label: 'Accuracy',
                                    iconSvg: PhIcons.targetRegular,
                                    iconColor: primaryBlue,
                                    iconBgColor: const Color(0xFFD0E1F9),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildMetricCard(
                                    valueNumber: '${(_score / (_totalQuestions > 0 ? _totalQuestions : 1) * 100).round()}%',
                                    label: 'Comprehension',
                                    iconSvg: PhIcons.lightbulbRegular,
                                    iconColor: const Color(0xFF00AA5A),
                                    iconBgColor: const Color(0xFFD1FAE5),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: () {
                                    final compPct = (_score / (_totalQuestions > 0 ? _totalQuestions : 1) * 100).round();
                                    final accPct = _accuracyPct;
                                    final isIndependent = accPct >= 97 && compPct >= 80;
                                    final isFrustration = accPct <= 89 || compPct <= 59;
                                    
                                    final String levelName = _level.isNotEmpty
                                        ? _level
                                        : (isIndependent
                                            ? 'Independent'
                                            : (isFrustration ? 'Frustration' : 'Instructional'));
                                    final Color levelColor = levelName == 'Independent'
                                        ? const Color(0xFF059669)
                                        : (levelName == 'Frustration' ? const Color(0xFFDC2626) : const Color(0xFFD97706));
                                    final Color levelBgColor = levelName == 'Independent'
                                        ? const Color(0xFFD1FAE5)
                                        : (levelName == 'Frustration' ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7));
                                    final String levelIcon = levelName == 'Independent'
                                        ? PhIcons.flagPennantBold
                                        : (levelName == 'Frustration' ? PhIcons.warningCircleRegular : PhIcons.bookOpenRegular);

                                    return _buildMetricCard(
                                      valueNumber: levelName,
                                      label: 'Phil-IRI Level',
                                      iconSvg: levelIcon,
                                      iconColor: levelColor,
                                      iconBgColor: levelBgColor,
                                    );
                                  }(),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // View Comprehension Summary Button
                            Container(
                              width: double.infinity,
                              height: 56,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF1B64D8).withValues(alpha: 0.15),
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
                                        score: _score,
                                        totalQuestions: _totalQuestions,
                                        questionsList: _questions,
                                      ),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF1B64D8),
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

  Widget _buildInstructionStep(String num, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 20,
          child: Text(
            num,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF1E293B),
            ),
          ),
        ),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF334155),
              height: 1.45,
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
      padding: const EdgeInsets.all(16.0),
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
        children: [
          RichText(
            text: TextSpan(
              style: GoogleFonts.inter(
                color: const Color(0xFF1E293B),
              ),
              children: [
                TextSpan(
                  text: valueNumber,
                  style: GoogleFonts.inter(
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (valueUnit != null) ...[
                  const TextSpan(text: ' '),
                  TextSpan(
                    text: valueUnit,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 28),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
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
        ],
      ),
    );
  }
}
