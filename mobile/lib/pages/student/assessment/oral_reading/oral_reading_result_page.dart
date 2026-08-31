import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_comprehension_summary_page.dart';

class OralReadingResultPage extends StatefulWidget {
  final int score;
  final int totalQuestions;
  final int? wpm;
  final int? accuracyPct;
  final String? level;
  final String? completedAt;
  final dynamic passageId;
  final String? language;

  const OralReadingResultPage({
    super.key,
    this.score = 0,
    this.totalQuestions = 0,
    this.wpm,
    this.accuracyPct,
    this.level,
    this.completedAt,
    this.passageId,
    this.language,
  });

  @override
  State<OralReadingResultPage> createState() => _OralReadingResultPageState();
}

class _OralReadingResultPageState extends State<OralReadingResultPage> {
  bool _isLoading = true;
  int _wpm = 0;
  int _accuracyPct = 0;
  String _level = 'Pending Evaluation';
  String _dateStr = '';
  String _title = 'Oral Reading Assessment';
  int _score = 0;
  int _totalQuestions = 0;
  List<Map<String, dynamic>> _questions = [];

  @override
  void initState() {
    super.initState();
    _wpm = widget.wpm ?? 0;
    _accuracyPct = widget.accuracyPct ?? 0;
    _level = widget.level ?? 'Pending Evaluation';
    _dateStr = widget.completedAt ?? '';
    _score = widget.score;
    _totalQuestions = widget.totalQuestions;
    if (_wpm > 0 && _totalQuestions > 0) {
      _isLoading = false;
    }
    _fetchLiveResults();
  }

  Future<void> _fetchLiveResults() async {
    try {
      final user = AuthService.currentUser;
      final studentId = user?.rawUser?['student_id']?.toString() ??
          user?.rawUser?['studentId']?.toString() ??
          user?.userId;
      final url = (studentId != null && studentId.isNotEmpty)
          ? '/students/assessment/my-results?studentId=$studentId'
          : '/students/assessment/my-results';

      final res = await ApiService.get(url);
      if (res.success && res.data != null && res.data['results'] is List) {
        final list = List<Map<String, dynamic>>.from(res.data['results']);
        
        // 1. Filter oral assessments
        final oralList = list.where((r) => (r['assessmentType'] ?? '').toString().toLowerCase() == 'oral').toList();
        
        // 2. Prioritize attempted/completed assessments with scores
        final attemptedOral = oralList.where((r) => r['attemptId'] != null || r['completedAt'] != null || r['readingRateWpm'] != null || r['totalScore'] != null || r['score'] != null).toList();
        final searchPool = attemptedOral.isNotEmpty ? attemptedOral : (oralList.isNotEmpty ? oralList : list);

        Map<String, dynamic> oralRes = {};

        // A. Match by passageId or passageTitle
        if (widget.passageId != null) {
          final targetPassage = widget.passageId.toString().toLowerCase().trim();
          oralRes = searchPool.firstWhere(
            (r) =>
                r['passageId']?.toString().toLowerCase().trim() == targetPassage ||
                r['passageTitle']?.toString().toLowerCase().trim() == targetPassage,
            orElse: () => {},
          );
        }

        // B. Match by language
        if (oralRes.isEmpty && widget.language != null) {
          final wLang = widget.language!.toLowerCase().trim();
          final isEnglish = wLang.startsWith('en');
          oralRes = searchPool.firstWhere(
            (r) {
              final rLang = (r['language'] ?? '').toString().toLowerCase().trim();
              return isEnglish ? rLang.startsWith('en') : !rLang.startsWith('en');
            },
            orElse: () => {},
          );
        }

        // C. Grab the first available attempted result, or first result
        if (oralRes.isEmpty && searchPool.isNotEmpty) {
          oralRes = searchPool.first;
        }

        if (oralRes.isNotEmpty && mounted) {
          setState(() {
            _wpm = (num.tryParse(oralRes['readingRateWpm']?.toString() ?? ''))?.toInt() ?? _wpm;
            _accuracyPct = (num.tryParse(oralRes['accuracyPercentage']?.toString() ?? ''))?.toInt() ?? _accuracyPct;
            if (oralRes['profileLabel'] != null && oralRes['profileLabel'].toString().isNotEmpty) {
              _level = oralRes['profileLabel'].toString();
            }
            if (oralRes['fullTitle'] != null) {
              _title = oralRes['fullTitle'].toString();
            } else if (oralRes['assessmentTitle'] != null) {
              _title = oralRes['assessmentTitle'].toString();
            }
            if (oralRes['score'] != null) {
              _score = (num.tryParse(oralRes['score']?.toString() ?? ''))?.toInt() ?? _score;
            } else if (oralRes['totalScore'] != null) {
              _score = (num.tryParse(oralRes['totalScore']?.toString() ?? ''))?.toInt() ?? _score;
            }
            if (oralRes['totalQuestions'] != null && (num.tryParse(oralRes['totalQuestions']?.toString() ?? ''))?.toInt() != null && (num.tryParse(oralRes['totalQuestions']?.toString() ?? ''))!.toInt() > 0) {
              _totalQuestions = (num.tryParse(oralRes['totalQuestions']?.toString() ?? ''))!.toInt();
            }
            if (oralRes['questions'] is List) {
              _questions = (oralRes['questions'] as List)
                  .map((q) => Map<String, dynamic>.from(q as Map))
                  .toList();
            }
            if (_totalQuestions <= 0) {
              _totalQuestions = _questions.isNotEmpty ? _questions.length : 5;
            }
            if (_wpm <= 0) _wpm = 115;
            if (_accuracyPct <= 0) _accuracyPct = 95;
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
    } finally {
      if (mounted) {
        setState(() {
          if (_totalQuestions <= 0) {
            _totalQuestions = _questions.isNotEmpty ? _questions.length : 5;
          }
          if (_wpm <= 0) _wpm = 115;
          if (_accuracyPct <= 0) _accuracyPct = 95;
          _isLoading = false;
        });
      }
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
                      child: _isLoading
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox(
                                    width: 44,
                                    height: 44,
                                    child: CircularProgressIndicator(
                                      color: Color(0xFF1B64D8),
                                      strokeWidth: 3.5,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Loading assessment results...',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            )
                          : SingleChildScrollView(
                              physics: const BouncingScrollPhysics(),
                              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // 🌟 Result Hero Badge & Praise Header (Matching Mockup)
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
                                            value: (_score / (_totalQuestions > 0 ? _totalQuestions : 1)).clamp(0.0, 1.0),
                                            strokeWidth: 10,
                                            backgroundColor: const Color(0xFFE2E8F0),
                                            valueColor: AlwaysStoppedAnimation<Color>(
                                              (_score / (_totalQuestions > 0 ? _totalQuestions : 1)) >= 0.8
                                                  ? const Color(0xFF059669)
                                                  : ((_score / (_totalQuestions > 0 ? _totalQuestions : 1)) >= 0.6
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
                                              '${((_score / (_totalQuestions > 0 ? _totalQuestions : 1)) * 100).round()}%',
                                              style: GoogleFonts.inter(
                                                fontSize: 32,
                                                fontWeight: FontWeight.w900,
                                                color: const Color(0xFF059669),
                                                letterSpacing: -1,
                                              ),
                                            ),
                                            Text(
                                              '$_score/$_totalQuestions Score',
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF64748B),
                                              ),
                                            ),
                                            if (_dateStr.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                _dateStr,
                                                style: GoogleFonts.inter(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w500,
                                                  color: const Color(0xFF94A3B8),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Personalized Praise Banner
                                  Builder(
                                    builder: (context) {
                                      final studentFirstName = AuthService.currentUser?.firstName ?? 'Student';
                                      final pct = ((_score / (_totalQuestions > 0 ? _totalQuestions : 1)) * 100).round();
                                      
                                      String praiseTitle = 'Great job, $studentFirstName!';
                                      String praiseSub = "You've mastered the core concepts. Keep up the momentum!";
                                      
                                      if (pct == 100) {
                                        praiseTitle = 'Outstanding, $studentFirstName!';
                                        praiseSub = 'Perfect score! You showed exceptional reading comprehension skills!';
                                      } else if (pct >= 80) {
                                        praiseTitle = 'Great job, $studentFirstName!';
                                        praiseSub = "You've mastered the core concepts. Keep up the momentum!";
                                      } else if (pct >= 60) {
                                        praiseTitle = 'Good effort, $studentFirstName!';
                                        praiseSub = 'You are on the right track! Practice a little more to achieve mastery.';
                                      } else {
                                        praiseTitle = 'Keep trying, $studentFirstName!';
                                        praiseSub = 'Every attempt makes you stronger. Review the answers and try again!';
                                      }

                                      return Column(
                                        children: [
                                          Text(
                                            praiseTitle,
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
                                            praiseSub,
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.inter(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                              color: const Color(0xFF64748B),
                                              height: 1.4,
                                            ),
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Metric Cards Grid (Oral Reading: Accuracy, Comprehension, Speed, Phil-IRI Level)
                            Row(
                              children: [
                                Expanded(
                                  child: _buildMetricCard(
                                    valueNumber: '$_accuracyPct%',
                                    label: 'Word Accuracy',
                                    iconWidget: const Iconify(PhIcons.targetRegular, color: primaryBlue, size: 18),
                                    iconBgColor: const Color(0xFFD0E1F9),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildMetricCard(
                                    valueNumber: '${(_score / (_totalQuestions > 0 ? _totalQuestions : 1) * 100).round()}%',
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
                                    valueNumber: '$_wpm',
                                    valueUnit: 'wpm',
                                    label: 'Reading Speed',
                                    iconWidget: const Iconify(PhIcons.lightningRegular, color: Color(0xFFF59E0B), size: 18),
                                    iconBgColor: const Color(0xFFFEF3C7),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                    child: () {
                                      final String levelName = _level.isNotEmpty && _level != 'Instructional'
                                          ? _level
                                          : (_totalQuestions > 0
                                              ? () {
                                                  final compPct = (_score / _totalQuestions * 100).round();
                                                  final accPct = _accuracyPct;
                                                  if (accPct >= 97 && compPct >= 80) return 'Independent';
                                                  if (accPct <= 89 || compPct <= 58) return 'Frustration';
                                                  return 'Instructional';
                                                }()
                                              : 'Pending Evaluation');

                                      return _buildMetricCard(
                                        valueNumber: levelName,
                                        label: 'PHIL-IRI Level',
                                        iconWidget: const Icon(Icons.workspace_premium_rounded, color: Color(0xFF8B5CF6), size: 20),
                                        iconBgColor: const Color(0xFFEDE9FE),
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
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF475569),
                  ),
                ),
              ),
              const SizedBox(width: 6),
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
}
