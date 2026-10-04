import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';
import 'package:salintinig/widgets/user_avatar.dart';
import 'dart:math' as math;

class TeacherFormDetailsPage extends StatefulWidget {
  final String formTitle;
  final String formSubtitle;
  final int totalStudents;
  final int doneCount;
  final int notDoneCount;
  final Color progressColor;
  final Color secondaryColor;
  final bool hasGSTCards;
  final int underGSTCount;
  final int aboveGSTCount;

  const TeacherFormDetailsPage({
    super.key,
    required this.formTitle,
    required this.formSubtitle,
    this.totalStudents = 0,
    this.doneCount = 0,
    this.notDoneCount = 0,
    this.progressColor = const Color(0xFF059669),
    this.secondaryColor = const Color(0xFFE2E8F0),
    this.hasGSTCards = false,
    this.underGSTCount = 0,
    this.aboveGSTCount = 0,
  });

  @override
  State<TeacherFormDetailsPage> createState() => _TeacherFormDetailsPageState();
}

class _TeacherFormDetailsPageState extends State<TeacherFormDetailsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  List<Map<String, dynamic>> _students = [];
  bool _isLoadingSummary = true;

  @override
  void initState() {
    super.initState();
    _loadFormSummary();
  }

  Future<void> _loadFormSummary() async {
    if (mounted) {
      setState(() {
        _isLoadingSummary = true;
      });
    }

    try {
      final roster = await AuthService.fetchClassStudents(forceRefresh: true);
      final students = roster
          .map((student) => Map<String, dynamic>.from(student))
          .toList();

      if (students.isNotEmpty && widget.hasGSTCards) {
        final sectionName =
            (students.first['sectionName'] ??
                    students.first['section_name'] ??
                    students.first['section'] ??
                    '')
                .toString()
                .trim();
        final language = widget.formTitle == 'FORM 1A' ? 'Tagalog' : 'English';

        if (sectionName.isNotEmpty) {
          final response = await ApiService.get(
            '/teacher/phil-iri/gst-submission?sectionName=${Uri.encodeComponent(sectionName)}&language=$language',
          );
          final formData =
              response.success &&
                  response.data?['submission']?['form_data'] is Map
              ? Map<String, dynamic>.from(
                  response.data['submission']['form_data'] as Map,
                )
              : null;

          if (formData != null) {
            final scoreByStudent = <String, dynamic>{};
            final rows = [
              ...(formData['maleRows'] as List? ?? const []),
              ...(formData['femaleRows'] as List? ?? const []),
            ];
            for (final row in rows) {
              if (row is! Map) continue;
              final record = Map<String, dynamic>.from(row);
              final score = record['totalNum'] ?? record['score'];
              if (score == null || score.toString().trim().isEmpty) continue;
              final lrn = record['lrn']?.toString().trim();
              final name = record['name']?.toString().trim().toLowerCase();
              if (lrn != null && lrn.isNotEmpty) scoreByStudent[lrn] = score;
              if (name != null && name.isNotEmpty) scoreByStudent[name] = score;
            }

            for (final student in students) {
              final lrn = student['lrn']?.toString().trim();
              final firstName =
                  (student['firstName'] ?? student['first_name'] ?? '')
                      .toString()
                      .trim();
              final lastName =
                  (student['lastName'] ?? student['last_name'] ?? '')
                      .toString()
                      .trim();
              final displayName = (student['name'] ?? '$firstName $lastName')
                  .toString()
                  .trim()
                  .toLowerCase();
              final lastFirstName = lastName.isNotEmpty && firstName.isNotEmpty
                  ? '$lastName, $firstName'.toLowerCase()
                  : '';
              final score =
                  (lrn == null ? null : scoreByStudent[lrn]) ??
                  scoreByStudent[displayName] ??
                  scoreByStudent[lastFirstName];
              if (score != null) student['gstScore'] = score;
            }
          }
        }
      }

      if (mounted) setState(() => _students = students);
    } catch (_) {
      // Keep the cached roster visible when a refresh or saved form lookup fails.
    } finally {
      if (mounted) setState(() => _isLoadingSummary = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);
    final students = _students;
    final int totalStudentsCount = students.length;

    int realDone = 0;
    int realUnder = 0;
    int realAbove = 0;

    int totalOralEvaluated = 0;
    double totalAccuracySum = 0;
    double totalSpeedSum = 0;
    double totalCompSum = 0;

    int independentCount = 0;
    int instructionalCount = 0;
    int frustrationalCount = 0;
    int nonReaderCount = 0;

    int filProfileCount = 0;
    int engProfileCount = 0;
    int bothProfilesCount = 0;

    bool hasCompletedProfile(String profile) {
      final normalized = profile.trim().toLowerCase();
      return normalized.isNotEmpty &&
          !normalized.contains('pending') &&
          !normalized.contains('not assessed') &&
          normalized != 'n/a';
    }

    for (var s in students) {
      if (widget.hasGSTCards) {
        final gstScoreRaw =
            s['gstScore'] ?? s['gst_score'] ?? s['score'] ?? s['totalNum'];
        final gstScore = int.tryParse(gstScoreRaw?.toString() ?? '');
        if (gstScore != null) {
          realDone++;
          if (gstScore < 14) {
            realUnder++;
          } else {
            realAbove++;
          }
        }
        continue;
      }

      final filOral = (s['filOralProfile'] ?? s['fil_oral_profile_label'] ?? '').toString();
      final engOral = (s['engOralProfile'] ?? s['eng_oral_profile_label'] ?? '').toString();

      final hasFil = hasCompletedProfile(filOral);
      final hasEng = hasCompletedProfile(engOral);

      if (hasFil) filProfileCount++;
      if (hasEng) engProfileCount++;
      if (hasFil && hasEng) bothProfilesCount++;

      final isForm3A = widget.formTitle == 'FORM 3A';
      final isForm3B = widget.formTitle == 'FORM 3B';
      final activeProfile = isForm3A ? filOral : (isForm3B ? engOral : (hasFil ? filOral : engOral));

      if (hasCompletedProfile(activeProfile)) {
        realDone++;
        totalOralEvaluated++;

        final norm = activeProfile.trim().toLowerCase();
        if (norm.contains('independ')) {
          independentCount++;
        } else if (norm.contains('instruction')) {
          instructionalCount++;
        } else if (norm.contains('frustr')) {
          frustrationalCount++;
        } else if (norm.contains('non-reader') || norm.contains('non reader')) {
          nonReaderCount++;
        }

        final accRaw = isForm3A
            ? (s['filOralAccuracy'] ?? s['accuracy'])
            : (s['engOralAccuracy'] ?? s['accuracy']);
        final speedRaw = isForm3A
            ? (s['filOralSpeed'] ?? s['readingSpeed'])
            : (s['engOralSpeed'] ?? s['readingSpeed']);
        final compRaw = isForm3A
            ? (s['filOralComprehension'] ?? s['comprehension'])
            : (s['engOralComprehension'] ?? s['comprehension']);

        final acc = double.tryParse(accRaw?.toString() ?? '') ?? 0;
        final spd = double.tryParse(speedRaw?.toString() ?? '') ?? 0;
        final cmp = double.tryParse(compRaw?.toString() ?? '') ?? 0;

        totalAccuracySum += acc;
        totalSpeedSum += spd;
        totalCompSum += cmp;
      }
    }

    final double avgAccuracy = totalOralEvaluated > 0 ? (totalAccuracySum / totalOralEvaluated) : 0;
    final double avgSpeed = totalOralEvaluated > 0 ? (totalSpeedSum / totalOralEvaluated) : 0;
    final double avgComp = totalOralEvaluated > 0 ? (totalCompSum / totalOralEvaluated) : 0;

    final bool isForm3Or4 = widget.formTitle == 'FORM 3A' ||
        widget.formTitle == 'FORM 3B' ||
        widget.formTitle == 'FORM 4' ||
        widget.formTitle.startsWith('FORM 3');

    final progressColor = isForm3Or4 ? const Color(0xFF2563EB) : widget.progressColor;
    final secondaryColor = isForm3Or4 ? const Color(0xFFDBEAFE) : widget.secondaryColor;

    final int effectiveDone = realDone;
    final int effectiveNotDone = totalStudentsCount > effectiveDone
        ? totalStudentsCount - effectiveDone
        : 0;
    final int effectiveUnder = realUnder;
    final int effectiveAbove = realAbove;

    final double donePercentage = totalStudentsCount > 0
        ? (effectiveDone / totalStudentsCount) * 100
        : 0;

    final int evalTotal = effectiveUnder + effectiveAbove;
    final int underPct = evalTotal > 0
        ? ((effectiveUnder / evalTotal) * 100).round()
        : 0;
    final int abovePct = evalTotal > 0
        ? ((effectiveAbove / evalTotal) * 100).round()
        : 0;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: const TeacherSidebarDrawer(activeRoute: 'Phil-IRI Records'),
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with < Back button on left
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 16.0,
                vertical: 12.0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      if (Navigator.canPop(context)) {
                        Navigator.pop(context);
                      } else {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const TeacherOverviewPage(),
                          ),
                        );
                      }
                    },
                    icon: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      size: 22,
                      color: Colors.black,
                    ),
                  ),
                  Text(
                    widget.formTitle,
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            Expanded(
              child: RefreshIndicator(
                onRefresh: _loadFormSummary,
                color: const Color(0xFFD34426),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 8.0,
                  ),
                  child: _isLoadingSummary
                      ? _buildFormDetailsSkeleton(
                          hasGSTCards: widget.hasGSTCards,
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Main Progress Card
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: const Color(0xFFE2E8F0),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Iconify(
                                        Ph.chart_pie_slice,
                                        color: Colors.grey[600],
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Class ${widget.formTitle} Progress',
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.grey[600],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 20),
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.center,
                                    children: [
                                      // Left stats
                                      Expanded(
                                        flex: 5,
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.baseline,
                                              textBaseline:
                                                  TextBaseline.alphabetic,
                                              children: [
                                                Text(
                                                  '$totalStudentsCount',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 48,
                                                    fontWeight: FontWeight.w900,
                                                    color: Colors.black,
                                                    height: 1.0,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  'Total\nStudents',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    color: Colors.grey[600],
                                                    fontWeight: FontWeight.w600,
                                                    height: 1.1,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 16),
                                            const Divider(
                                              color: Color(0xFFE2E8F0),
                                              thickness: 1,
                                            ),
                                            const SizedBox(height: 12),
                                            // Done row
                                            Row(
                                              children: [
                                                Container(
                                                  width: 4,
                                                  height: 20,
                                                  decoration: BoxDecoration(
                                                    color: progressColor,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          4,
                                                        ),
                                                  ),
                                                ),
                                                const SizedBox(width: 10),
                                                Text(
                                                  '$effectiveDone',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.w900,
                                                    color: Colors.black,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  'Done',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600,
                                                    color: Colors.grey[700],
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 10),
                                            // Not Done row
                                            Row(
                                              children: [
                                                Container(
                                                  width: 4,
                                                  height: 20,
                                                  decoration: BoxDecoration(
                                                    color:
                                                        secondaryColor,
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          4,
                                                        ),
                                                  ),
                                                ),
                                                const SizedBox(width: 10),
                                                Text(
                                                  '$effectiveNotDone',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.w900,
                                                    color: Colors.black,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  'Not Done',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w600,
                                                    color: Colors.grey[700],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Right Donut Chart
                                      Expanded(
                                        flex: 5,
                                        child: Center(
                                          child: SizedBox(
                                            width: 140,
                                            height: 140,
                                            child: Stack(
                                              alignment: Alignment.center,
                                              children: [
                                                CustomPaint(
                                                  size: const Size(140, 140),
                                                  painter: _FormDonutPainter(
                                                    donePercentage:
                                                        donePercentage,
                                                    progressColor:
                                                        widget.progressColor,
                                                    secondaryColor:
                                                        widget.secondaryColor,
                                                  ),
                                                ),
                                                Column(
                                                  mainAxisSize:
                                                      MainAxisSize.min,
                                                  children: [
                                                    Text(
                                                      '${donePercentage.round()}%',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 26,
                                                        fontWeight:
                                                            FontWeight.w900,
                                                        color: Colors.black,
                                                        height: 1.0,
                                                      ),
                                                    ),
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      'DONE',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 9,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                        color: Colors.grey[500],
                                                        letterSpacing: 0.5,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // GST Interactive Cards (Only for Form 1A & 1B)
                            if (widget.hasGSTCards) ...[
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildGSTStatCard(
                                      count: effectiveUnder,
                                      label: 'Student under\n14 GST',
                                      filterType: 'Under 14',
                                      accentColor: const Color(0xFFDC2626),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: _buildGSTStatCard(
                                      count: effectiveAbove,
                                      label: 'Student above\n14 GST',
                                      filterType: 'Above 14',
                                      accentColor: const Color(0xFF059669),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: _buildGSTStatCard(
                                      count: effectiveNotDone,
                                      label: 'Student pending\nGST',
                                      filterType: 'Pending',
                                      accentColor: const Color(0xFFD97706),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),

                              // Score Range Distribution Bar
                              _buildScoreDistributionBar(
                                underCount: effectiveUnder,
                                aboveCount: effectiveAbove,
                                underPct: underPct,
                                abovePct: abovePct,
                              ),
                              const SizedBox(height: 20),
                            ],

                            if (!widget.hasGSTCards) ...[
                              if (widget.formTitle == 'FORM 3A' || widget.formTitle == 'FORM 3B')
                                _buildForm3LearnerRecords(students)
                              else if (widget.formTitle == 'FORM 4')
                                _buildForm4LearnerRecords(students)
                              else
                                _buildOralAssessmentOverview(
                                  totalStudents: totalStudentsCount,
                                  totalEvaluated: totalOralEvaluated,
                                  avgAccuracy: avgAccuracy,
                                  avgSpeed: avgSpeed,
                                  avgComp: avgComp,
                                  independentCount: independentCount,
                                  instructionalCount: instructionalCount,
                                  frustrationalCount: frustrationalCount,
                                  nonReaderCount: nonReaderCount,
                                  filProfileCount: filProfileCount,
                                  engProfileCount: engProfileCount,
                                  bothProfilesCount: bothProfilesCount,
                                ),
                              const SizedBox(height: 20),
                            ],

                            const SizedBox(height: 24),
                          ],
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormDetailsSkeleton({required bool hasGSTCards}) {
    final isForm3 = widget.formTitle == 'FORM 3A' || widget.formTitle == 'FORM 3B';
    final isForm4 = widget.formTitle == 'FORM 4';
    final isGST = widget.hasGSTCards;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Main Progress Card Skeleton
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 20,
                    height: 20,
                    decoration: const BoxDecoration(
                      color: Color(0xFFE2E8F0),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 160,
                    height: 16,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    flex: 5,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 80,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Divider(color: Color(0xFFE2E8F0), thickness: 1),
                        const SizedBox(height: 12),
                        Container(
                          width: 100,
                          height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: 100,
                          height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    flex: 5,
                    child: Center(
                      child: Container(
                        width: 140,
                        height: 140,
                        decoration: const BoxDecoration(
                          color: Color(0xFFF1F5F9),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // GST Interactive Cards Skeleton (Form 1A / 1B)
        if (isGST) ...[
          Row(
            children: List.generate(
              3,
              (index) => Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index == 2 ? 0 : 10),
                  height: 90,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 36,
                        height: 24,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      const Spacer(),
                      Container(
                        width: double.infinity,
                        height: 12,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      width: 180,
                      height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    Container(
                      width: 70,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Overview Section Skeleton (Form 3A, 3B, 4)
        if (isForm3 || isForm4) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: const BoxDecoration(
                        color: Color(0xFFE2E8F0),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 200,
                      height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Container(
                  width: 260,
                  height: 11,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 16),

                // 3 KPI metric badges
                Row(
                  children: List.generate(
                    3,
                    (index) => Expanded(
                      child: Container(
                        margin: EdgeInsets.only(right: index == 2 ? 0 : 8),
                        height: 58,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Distribution bar items
                Container(
                  width: 140,
                  height: 12,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 12),
                ...List.generate(
                  3,
                  (index) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFFE2E8F0),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          width: 80,
                          height: 11,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            height: 8,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          width: 36,
                          height: 11,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Learner Records Header Skeleton
          Row(
            children: [
              Container(
                width: 18,
                height: 18,
                decoration: const BoxDecoration(
                  color: Color(0xFFE2E8F0),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 150,
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Container(
            width: 240,
            height: 12,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 14),

          // Learner Record Card Skeletons matching exact InitialsAvatar + name + status badge
          ...List.generate(
            4,
            (index) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFFE2E8F0),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 120.0 + (index % 3) * 25,
                          height: 14,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          width: 100,
                          height: 11,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 76,
                    height: 24,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildForm3LearnerRecords(List<Map<String, dynamic>> students) {
    final isFilipino = widget.formTitle == 'FORM 3A';
    final language = isFilipino ? 'Filipino' : 'English';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Iconify(Ph.users_three, size: 19, color: const Color(0xFFD34426)),
            const SizedBox(width: 8),
            Text(
              'Learner Records',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Open a learner to view all $language oral-reading attempts.',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 12),
        if (students.isEmpty)
          _buildNoLearnerRecords()
        else
          ...students.map(
            (student) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildForm3LearnerCard(student, isFilipino: isFilipino),
            ),
          ),
      ],
    );
  }

  Widget _buildNoLearnerRecords() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        'No learner records are available for this class yet.',
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF64748B),
        ),
      ),
    );
  }

  Widget _buildForm4LearnerRecords(List<Map<String, dynamic>> students) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.description_outlined, size: 19, color: Color(0xFFD34426)),
            const SizedBox(width: 8),
            Text(
              'Individual Summary Records',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          'Open a learner to view their ISR and Filipino/English assessment attempts.',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF64748B),
          ),
        ),
        const SizedBox(height: 12),
        if (students.isEmpty)
          _buildNoLearnerRecords()
        else
          ...students.map(
            (student) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildForm4LearnerCard(student),
            ),
          ),
      ],
    );
  }

  Widget _buildForm4LearnerCard(Map<String, dynamic> student) {
    final name = (student['name'] ?? '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}').toString().trim();
    final String? avatarUrl = (student['profileImage'] ??
            student['profile_image'] ??
            student['avatarUrl'] ??
            student['image'])
        ?.toString();
    final hasFil = (student['filOralProfile'] ?? student['fil_oral_profile_label'] ?? '').toString().trim().isNotEmpty;
    final hasEng = (student['engOralProfile'] ?? student['eng_oral_profile_label'] ?? '').toString().trim().isNotEmpty;
    final coverage = hasFil && hasEng
        ? 'Filipino + English records'
        : hasFil
        ? 'Filipino record available'
        : hasEng
        ? 'English record available'
        : 'No completed profile yet';

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () => _showForm4Isr(student),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              InitialsAvatar(
                name: name,
                imageUrl: avatarUrl,
                radius: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name.isEmpty ? 'Unnamed learner' : name,
                      softWrap: true,
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      coverage,
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildForm3LearnerCard(
    Map<String, dynamic> student, {
    required bool isFilipino,
  }) {
    final targetLanguage = isFilipino ? 'fil' : 'en';
    final sessions = student['oralAdaptiveProfiles'] is List
        ? (student['oralAdaptiveProfiles'] as List)
            .whereType<Map>()
            .map((value) => Map<String, dynamic>.from(value))
            .where((session) => (session['language'] ?? '').toString().toLowerCase().startsWith(targetLanguage))
            .toList()
        : <Map<String, dynamic>>[];
    final assessments = student['existingAssessments'] is List
        ? (student['existingAssessments'] as List)
            .whereType<Map>()
            .map((value) => Map<String, dynamic>.from(value))
            .where((assessment) {
              final type = (assessment['type'] ?? '').toString().toLowerCase();
              final language = (assessment['language'] ?? '').toString().toLowerCase();
              return type.startsWith('oral') && language.startsWith(targetLanguage);
            })
            .toList()
        : <Map<String, dynamic>>[];
    final latestSession = sessions.isEmpty ? null : sessions.last;
    final latestAssessment = assessments.isEmpty ? null : assessments.last;
    final status = (latestSession?['status'] ?? latestAssessment?['status'] ?? 'Not started').toString();
    final displayStatus = status.toLowerCase() == 'open' ? 'In progress' : status.replaceAll('_', ' ');
    final period = (latestSession?['period'] ?? latestAssessment?['period'] ?? '').toString();
    final name = (student['name'] ?? '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}').toString().trim();
    final String? avatarUrl = (student['profileImage'] ??
            student['profile_image'] ??
            student['avatarUrl'] ??
            student['image'])
        ?.toString();
    final normalizedStatus = status.toLowerCase();
    final statusColor = normalizedStatus.contains('complete')
        ? const Color(0xFF059669)
        : normalizedStatus.contains('review')
        ? const Color(0xFFDC2626)
        : normalizedStatus.contains('start')
        ? const Color(0xFF94A3B8)
        : const Color(0xFFD97706);
    final statusBackground = normalizedStatus.contains('complete')
        ? const Color(0xFFD1FAE5)
        : normalizedStatus.contains('review')
        ? const Color(0xFFFEE2E2)
        : normalizedStatus.contains('start')
        ? const Color(0xFFF1F5F9)
        : const Color(0xFFFEF3C7);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () => _showForm3Attempts(student, isFilipino: isFilipino),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              InitialsAvatar(
                name: name,
                imageUrl: avatarUrl,
                radius: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name.isEmpty ? 'Unnamed learner' : name,
                      softWrap: true,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'View all oral-reading attempts',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    if (period.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        period.replaceAll('_', '-').toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF94A3B8),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusBackground,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      displayStatus.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        color: statusColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 7),
                  const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _showForm3Attempts(
    Map<String, dynamic> student, {
    required bool isFilipino,
  }) async {
    final lrn = (student['lrn'] ?? student['studentId'] ?? student['id'] ?? '').toString().trim();
    final name = (student['name'] ?? 'Learner').toString().trim();
    if (lrn.isEmpty) return;

    final language = isFilipino ? 'fil' : 'en';
    var attempts = <Map<String, dynamic>>[];
    try {
      final response = await ApiService.get(
        '/teacher/phil-iri/form3-attempts/${Uri.encodeComponent(lrn)}?language=$language',
      );
      if (response.success && response.data?['attempts'] is List) {
        attempts = (response.data['attempts'] as List)
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
      }
    } catch (_) {
      // The sheet still opens with an empty state if the attempt history is unavailable.
    }

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: FractionallySizedBox(
          heightFactor: 0.82,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE2E8F0),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  name.isEmpty ? 'Learner record' : name,
                  style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 3),
                Text(
                  '${isFilipino ? 'Filipino' : 'English'} oral-reading attempts',
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: const Color(0xFF64748B)),
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: attempts.isEmpty
                      ? Center(
                          child: Text(
                            'No completed attempts yet.',
                            style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                          ),
                        )
                      : ListView.separated(
                          itemCount: attempts.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) => _buildAttemptResultCard(attempts[index]),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showForm4Isr(Map<String, dynamic> student) async {
    final lrn = (student['lrn'] ?? student['studentId'] ?? student['id'] ?? '').toString().trim();
    final name = (student['name'] ?? 'Learner').toString().trim();
    if (lrn.isEmpty) return;

    List<Map<String, dynamic>> toAttempts(dynamic response) {
      if (response is! ApiResponse || !response.success || response.data?['attempts'] is! List) return [];
      return (response.data['attempts'] as List).whereType<Map>().map((item) => Map<String, dynamic>.from(item)).toList();
    }

    var filipinoAttempts = <Map<String, dynamic>>[];
    var englishAttempts = <Map<String, dynamic>>[];
    try {
      final responses = await Future.wait([
        ApiService.get('/teacher/phil-iri/form3-attempts/${Uri.encodeComponent(lrn)}?language=fil'),
        ApiService.get('/teacher/phil-iri/form3-attempts/${Uri.encodeComponent(lrn)}?language=en'),
      ]);
      filipinoAttempts = toAttempts(responses[0]);
      englishAttempts = toAttempts(responses[1]);
    } catch (_) {
      // Present the ISR empty state if either attempt lookup is unavailable.
    }

    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => SafeArea(
        child: FractionallySizedBox(
          heightFactor: 0.88,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(8)),
                  ),
                ),
                const SizedBox(height: 18),
                Text('Individual Summary Record (ISR)', style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w800)),
                const SizedBox(height: 3),
                Text(name.isEmpty ? 'Learner' : name, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
                const SizedBox(height: 18),
                Expanded(
                  child: filipinoAttempts.isEmpty && englishAttempts.isEmpty
                      ? Center(
                          child: Text('No completed oral-reading attempts yet.', style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
                        )
                      : ListView(
                          children: [
                            _buildIsrAttemptSection('Filipino', filipinoAttempts),
                            const SizedBox(height: 18),
                            _buildIsrAttemptSection('English', englishAttempts),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildIsrAttemptSection(String language, List<Map<String, dynamic>> attempts) {
    final preTest = attempts.where((attempt) => !(attempt['assessment_period'] ?? '').toString().toLowerCase().contains('post')).toList();
    final postTest = attempts.where((attempt) => (attempt['assessment_period'] ?? '').toString().toLowerCase().contains('post')).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(language, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: const Color(0xFF0F172A))),
        const SizedBox(height: 10),
        _buildIsrCycleGroup('Pre-Test', preTest),
        const SizedBox(height: 12),
        _buildIsrCycleGroup('Post-Test', postTest),
      ],
    );
  }

  Widget _buildIsrCycleGroup(String label, List<Map<String, dynamic>> attempts) {
    final hasAttempts = attempts.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 6,
              height: 6,
              decoration: BoxDecoration(
                color: hasAttempts ? const Color(0xFF059669) : const Color(0xFF94A3B8),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '$label (${attempts.length})',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF334155),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (!hasAttempts)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Iconify(Ph.info, size: 15, color: const Color(0xFF94A3B8)),
                const SizedBox(width: 8),
                Text(
                  'No $label attempts recorded yet',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          )
        else
          ...attempts.map((attempt) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _buildAttemptResultCard(attempt),
          )),
      ],
    );
  }

  Widget _buildAttemptResultCard(Map<String, dynamic> attempt) {
    final rawGrade = (attempt['passage_grade_level'] ?? '').toString().trim();
    final grade = rawGrade.replaceFirst(RegExp(r'^grade\s*', caseSensitive: false), '').trim();
    final rawSet = (attempt['passage_set'] ?? '').toString().trim();
    final set = rawSet.replaceFirst(RegExp(r'^set\s*', caseSensitive: false), '').trim();
    final title = (attempt['passage_title'] ?? 'Phil-IRI passage').toString();
    final profile = (attempt['overall_profile'] ?? 'Recorded').toString();
    final accuracy = double.tryParse(attempt['accuracy_percentage']?.toString() ?? '');
    final speed = double.tryParse(attempt['reading_rate_wpm']?.toString() ?? '');
    final comprehension = double.tryParse(attempt['comprehension_score']?.toString() ?? '');
    final normalizedProfile = profile.toLowerCase();
    final profileColor = normalizedProfile.contains('instruction')
        ? const Color(0xFFD97706)
        : normalizedProfile.contains('frustr')
        ? const Color(0xFFDC2626)
        : normalizedProfile.contains('independ')
        ? const Color(0xFF059669)
        : const Color(0xFF64748B);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w800)),
              ),
              Text(
                '${grade.isEmpty ? 'Grade —' : 'Grade $grade'}${set.isEmpty ? '' : ' • Set $set'}',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF2563EB)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _buildAttemptMetric('Accuracy', accuracy == null ? '—' : '${accuracy.toStringAsFixed(1)}%'),
              _buildAttemptMetric('Speed', speed == null ? '—' : '${speed.round()} WPM'),
              _buildAttemptMetric('Comprehension', comprehension == null ? '—' : '${comprehension.toStringAsFixed(0)}%'),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            profile.replaceAll('_', ' '),
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: profileColor),
          ),
        ],
      ),
    );
  }

  Widget _buildAttemptMetric(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$label: $value',
        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: const Color(0xFF475569)),
      ),
    );
  }

  Widget _buildOralAssessmentOverview({
    required int totalStudents,
    required int totalEvaluated,
    required double avgAccuracy,
    required double avgSpeed,
    required double avgComp,
    required int independentCount,
    required int instructionalCount,
    required int frustrationalCount,
    required int nonReaderCount,
    required int filProfileCount,
    required int engProfileCount,
    required int bothProfilesCount,
  }) {
    final isForm4 = widget.formTitle == 'FORM 4';
    final isForm3A = widget.formTitle == 'FORM 3A';

    final title = isForm4
        ? 'Individual Summary Record (ISR) Overview'
        : '${isForm3A ? 'Filipino' : 'English'} Oral Reading Performance';

    final subtitle = isForm4
        ? 'Learner reading profile records across Filipino and English oral assessments'
        : 'Class oral reading averages and profile distribution';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Iconify(Ph.chart_bar, size: 18, color: const Color(0xFF64748B)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 16),

          if (isForm4) ...[
            Row(
              children: [
                Expanded(
                  child: _buildProfileMetric(
                    count: filProfileCount,
                    label: 'Filipino\nprofiles',
                    color: const Color(0xFF2563EB),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildProfileMetric(
                    count: engProfileCount,
                    label: 'English\nprofiles',
                    color: const Color(0xFF7C3AED),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildProfileMetric(
                    count: bothProfilesCount,
                    label: 'Complete\nISR records',
                    color: const Color(0xFF059669),
                  ),
                ),
              ],
            ),
          ] else ...[
            Row(
              children: [
                Expanded(
                  child: _buildProfileMetric(
                    countText: avgAccuracy > 0 ? '${avgAccuracy.toStringAsFixed(1)}%' : '0%',
                    label: 'Avg. Accuracy',
                    color: const Color(0xFF059669),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildProfileMetric(
                    countText: avgSpeed > 0 ? '${avgSpeed.round()} WPM' : '0 WPM',
                    label: 'Avg. Speed',
                    color: const Color(0xFF2563EB),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildProfileMetric(
                    countText: avgComp > 0 ? '${avgComp.toStringAsFixed(1)}%' : '0%',
                    label: 'Avg. Comp.',
                    color: const Color(0xFF7C3AED),
                  ),
                ),
              ],
            ),
          ],

          const SizedBox(height: 16),
          Text(
            'Oral Reading Profile Levels',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF334155),
            ),
          ),
          const SizedBox(height: 10),

          _buildProfileDistributionRow(
            label: 'Independent',
            count: independentCount,
            total: totalEvaluated,
            color: const Color(0xFF059669),
          ),
          const SizedBox(height: 10),
          _buildProfileDistributionRow(
            label: 'Instructional',
            count: instructionalCount,
            total: totalEvaluated,
            color: const Color(0xFFD97706),
          ),
          const SizedBox(height: 10),
          _buildProfileDistributionRow(
            label: 'Frustrational',
            count: frustrationalCount,
            total: totalEvaluated,
            color: const Color(0xFFDC2626),
          ),
          if (nonReaderCount > 0) ...[
            const SizedBox(height: 10),
            _buildProfileDistributionRow(
              label: 'Non-reader',
              count: nonReaderCount,
              total: totalEvaluated,
              color: const Color(0xFF7C2D12),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProfileMetric({
    int? count,
    String? countText,
    required String label,
    required Color color,
  }) {
    final textVal = countText ?? '$count';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            textVal,
            style: GoogleFonts.inter(
              fontSize: textVal.length > 5 ? 17 : 22,
              height: 1,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              height: 1.2,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileDistributionRow({
    required String label,
    required int count,
    required int total,
    required Color color,
    double labelWidth = 130,
  }) {
    final percentage = total == 0 ? 0 : (count / total * 100).round();
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: labelWidth,
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF475569),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: total == 0 ? 0 : count / total,
              minHeight: 8,
              color: color,
              backgroundColor: const Color(0xFFF1F5F9),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          '$count · $percentage%',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF334155),
          ),
        ),
      ],
    );
  }

  Widget _buildScoreDistributionBar({
    required int underCount,
    required int aboveCount,
    required int underPct,
    required int abovePct,
  }) {
    final int safeUnderFlex = underCount > 0
        ? underCount
        : (aboveCount > 0 ? 0 : 1);
    final int safeAboveFlex = aboveCount > 0
        ? aboveCount
        : (underCount > 0 ? 0 : 1);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'GST Score Range Distribution',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              Text(
                'Score 0 - 20',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Multi-color segmented progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              height: 12,
              child: Row(
                children: [
                  Expanded(
                    flex: safeUnderFlex,
                    child: Container(
                      color: underCount > 0
                          ? const Color(0xFFEF4444)
                          : const Color(0xFFE2E8F0),
                    ), // Red for Under 14
                  ),
                  const SizedBox(width: 2),
                  Expanded(
                    flex: safeAboveFlex,
                    child: Container(
                      color: aboveCount > 0
                          ? const Color(0xFF10B981)
                          : const Color(0xFFE2E8F0),
                    ), // Green for Above 14
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Legend breakdown
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Color(0xFFEF4444),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Score 0 - 13 ($underPct%)',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.grey[700],
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: const BoxDecoration(
                      color: Color(0xFF10B981),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Score 14 - 20 ($abovePct%)',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.grey[700],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGSTStatCard({
    required int count,
    required String label,
    required String filterType,
    Color bgColor = Colors.white,
    Color borderColor = const Color(0xFFE2E8F0),
    Color accentColor = const Color(0xFF1D4ED8),
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                '$count',
                style: GoogleFonts.inter(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                  height: 1.0,
                ),
              ),
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: accentColor, width: 1.5),
                ),
                child: Icon(
                  Icons.arrow_forward_rounded,
                  color: accentColor,
                  size: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _FormDonutPainter extends CustomPainter {
  final double donePercentage;
  final Color progressColor;
  final Color secondaryColor;

  _FormDonutPainter({
    required this.donePercentage,
    required this.progressColor,
    required this.secondaryColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;
    final strokeWidth = radius * 0.45;
    final rect = Rect.fromCircle(
      center: center,
      radius: radius - strokeWidth / 2,
    );

    final bgPaint = Paint()
      ..color = secondaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final donePaint = Paint()
      ..color = progressColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    // Background circle
    canvas.drawCircle(center, radius - strokeWidth / 2, bgPaint);

    // Done Arc
    if (donePercentage > 0) {
      final sweepAngle = (donePercentage / 100) * 2 * math.pi;
      canvas.drawArc(rect, -math.pi / 2, sweepAngle, false, donePaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
