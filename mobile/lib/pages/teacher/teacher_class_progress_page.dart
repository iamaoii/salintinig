import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_class_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_reading_levels_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';
import 'dart:math' as math;

class TeacherClassProgressPage extends StatefulWidget {
  final String className;
  const TeacherClassProgressPage({
    super.key,
    this.className = 'Grade 4 - FYANG',
  });

  @override
  State<TeacherClassProgressPage> createState() => _TeacherClassProgressPageState();
}

class _TeacherClassProgressPageState extends State<TeacherClassProgressPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  RealtimeChannel? _realtimeChannel;

  bool _isLoadingStudents = true;
  int _totalStudents = 0;
  int _maleCount = 0;
  int _femaleCount = 0;
  int _frustrationCount = 0;
  int _instructionalCount = 0;
  int _independentCount = 0;

  double _avgAccuracy = 0.0;
  double _avgComprehension = 0.0;
  double _avgReadingSpeed = 0.0;

  @override
  void initState() {
    super.initState();
    final cached = AuthService.cachedClassStudents;
    if (cached != null) {
      _applyStudentData(cached);
      _isLoadingStudents = false;
    } else {
      final count = AuthService.currentUser?.rawUser?['studentsCount'];
      if (count != null && count is int && count > 0) {
        _totalStudents = count;
      }
    }
    _fetchClassStudents();
    _setupRealtimeSubscription();
  }

  void _setupRealtimeSubscription() {
    try {
      final client = Supabase.instance.client;
      _realtimeChannel = client
          .channel('public:class_progress_updates')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'reading_profiles',
            callback: (payload) => _fetchClassStudents(),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'assessments',
            callback: (payload) => _fetchClassStudents(),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'students',
            callback: (payload) => _fetchClassStudents(),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'student_grade_history',
            callback: (payload) => _fetchClassStudents(),
          )
          .subscribe();
    } catch (e) {
      debugPrint('Realtime subscription notice: $e');
    }
  }

  @override
  void dispose() {
    if (_realtimeChannel != null) {
      try {
        Supabase.instance.client.removeChannel(_realtimeChannel!);
      } catch (_) {}
    }
    super.dispose();
  }

  void _applyStudentData(List<Map<String, dynamic>> rawList) {
    int males = 0;
    int females = 0;
    int frust = 0;
    int inst = 0;
    int indep = 0;

    double totalAcc = 0.0;
    int accCount = 0;
    double totalComp = 0.0;
    int compCount = 0;
    double totalSpeed = 0.0;
    int speedCount = 0;
    DateTime? latestDt;

    for (var s in rawList) {
      final g = (s['gender'] ?? s['sex'] ?? '').toString().trim().toLowerCase();
      if (g.startsWith('m')) {
        males++;
      } else if (g.startsWith('f')) {
        females++;
      }

      final lvl = (s['readingLevel'] ?? s['level'] ?? s['reading_level'] ?? s['current_profile_label'] ?? s['gstResult'] ?? s['gst_result'] ?? '').toString().trim().toLowerCase();
      if (lvl.contains('frustrat')) {
        frust++;
      } else if (lvl.contains('instruct')) {
        inst++;
      } else if (lvl.contains('independ')) {
        indep++;
      }

      final accRaw = s['accuracy'] ?? s['oralAccuracy'] ?? s['oral_accuracy'] ?? s['oral_accuracy_rate'];
      if (accRaw != null) {
        final val = double.tryParse(accRaw.toString().replaceAll('%', '').trim());
        if (val != null && val > 0) {
          totalAcc += val;
          accCount++;
        }
      }

      final compRaw = s['comprehension'] ?? s['comprehensionAccuracy'] ?? s['comprehension_score'] ?? s['comprehension_rate'];
      if (compRaw != null) {
        final val = double.tryParse(compRaw.toString().replaceAll('%', '').trim());
        if (val != null && val > 0) {
          totalComp += val;
          compCount++;
        }
      }

      final speedRaw = s['readingSpeed'] ?? s['reading_speed'] ?? s['wps'] ?? s['reading_speed_wpm'] ?? s['speed'];
      if (speedRaw != null) {
        final val = double.tryParse(speedRaw.toString().replaceAll(RegExp(r'[^0-9.]'), '').trim());
        if (val != null && val > 0) {
          totalSpeed += val;
          speedCount++;
        }
      }

      final tsRaw = s['lastUpdated'] ?? s['updatedAt'] ?? s['updated_at'] ?? s['createdAt'] ?? s['created_at'];
      if (tsRaw != null) {
        final dt = DateTime.tryParse(tsRaw.toString());
        if (dt != null) {
          if (latestDt == null || dt.isAfter(latestDt)) {
            latestDt = dt;
          }
        }
      }
    }

    _totalStudents = rawList.length;
    _maleCount = males;
    _femaleCount = females;
    _frustrationCount = frust;
    _instructionalCount = inst;
    _independentCount = indep;

    _avgAccuracy = accCount > 0 ? (totalAcc / accCount) : 0.0;
    _avgComprehension = compCount > 0 ? (totalComp / compCount) : 0.0;
    _avgReadingSpeed = speedCount > 0 ? (totalSpeed / speedCount) : 0.0;
  }

  Future<void> _fetchClassStudents() async {
    try {
      final rawList = await AuthService.fetchClassStudents(forceRefresh: true);
      if (mounted) {
        setState(() {
          _applyStudentData(rawList);
          _isLoadingStudents = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching class students: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingStudents = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: const TeacherSidebarDrawer(activeRoute: 'Student Dashboard'),
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      _scaffoldKey.currentState?.openDrawer();
                    },
                    icon: Iconify(Ph.list, size: 28, color: Colors.black),
                  ),
                  Text(
                    'Progress',
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
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // 1. Hero Class Card
                    _buildHeroCard(),
                    const SizedBox(height: 20),

                    // 2. General Information Card
                    _buildGeneralInfoCard(),
                    const SizedBox(height: 24),

                    // 4. Section Title: Class Progress Dashboard
                    Row(
                      children: [
                        const Iconify(
                          Ph.presentation_chart_bold,
                          color: Color(0xFFD34426),
                          size: 24,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Class Progress Dashboard',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // 5. Reading Level Classification Donut Chart Card
                    _buildDonutChartCard(),
                    const SizedBox(height: 20),

                    // 6. Metrics 2x2 Grid (Accuracy, Priority Students, Comprehension, Reading Speed)
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            value: '${_avgAccuracy.round()}%',
                            unit: '',
                            label: 'Average\nAccuracy',
                            icon: Ph.target_bold,
                            iconColor: const Color(0xFF1B64D8),
                            bgColor: const Color(0xFFDBEAFE),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildPriorityStudentsCard(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            value: '${_avgReadingSpeed.round()}',
                            unit: 'wps',
                            label: 'Average\nReading Speed',
                            icon: Ph.lightning_bold,
                            iconColor: const Color(0xFFEAB308),
                            bgColor: const Color(0xFFFEF9C3),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricCard(
                            value: '${_avgComprehension.round()}%',
                            unit: '',
                            label: 'Average\nComprehension',
                            icon: Ph.lightbulb_bold,
                            iconColor: const Color(0xFF10B981),
                            bgColor: const Color(0xFFD1FAE5),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 56),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String get _displaySectionTitle {
    if (widget.className.isNotEmpty && widget.className != 'Grade 4 - FYANG') {
      return widget.className;
    }
    final rawSection = AuthService.currentUser?.sectionName ?? '';
    final grade = AuthService.currentUser?.gradeLevel ?? '';
    if (rawSection.toLowerCase().startsWith('grade')) {
      return rawSection;
    }
    if (rawSection.isNotEmpty && grade.isNotEmpty) {
      return 'Grade $grade - $rawSection';
    }
    if (rawSection.isNotEmpty) {
      return rawSection;
    }
    if (grade.isNotEmpty) {
      return 'Grade $grade';
    }
    return 'Grade 4 - Fyang';
  }

  Widget _buildHeroCard() {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFFE05234), Color(0xFFDC4D2F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFDC4D2F).withValues(alpha: 0.25),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: 0,
            top: 0,
            bottom: 0,
            child: Image.asset(
              'assets/teacher page/logo_bg.webp',
              fit: BoxFit.fitHeight,
              alignment: Alignment.centerRight,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _displaySectionTitle,
                  style: GoogleFonts.inter(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  AuthService.currentUser?.schoolYear ?? 'S.Y. 2026-2027',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.white.withValues(alpha: 0.9),
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${AuthService.currentUser?.rawUser?['studentsCount'] ?? 4} Enrolled Learners',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.9),
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGeneralInfoCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: Colors.grey[500], size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'General Information',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const TeacherClassDetailsPage(className: 'Grade 4 - FYANG'),
                    ),
                  );
                },
                child: Text(
                  'Class List',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1D4ED8),
                    decoration: TextDecoration.underline,
                    decorationColor: const Color(0xFF1D4ED8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Iconify(Ph.users_three, color: Colors.black87, size: 28),
              const SizedBox(width: 8),
              Text(
                _isLoadingStudents ? '...' : '$_totalStudents',
                style: GoogleFonts.inter(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: Colors.black,
                  height: 1.0,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'Total\nStudents',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                  height: 1.1,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Text(
                      _isLoadingStudents ? '... ' : '$_maleCount ',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF1D4ED8),
                      ),
                    ),
                    Text(
                      'Males',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1D4ED8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Text(
                      _isLoadingStudents ? '... ' : '$_femaleCount ',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF1D4ED8),
                      ),
                    ),
                    Text(
                      'Females',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1D4ED8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDonutChartCard() {
    final totalEvaluated = _frustrationCount + _instructionalCount + _independentCount;

    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const TeacherReadingLevelsPage(initialLevel: 'All'),
          ),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Iconify(Ph.chart_pie_slice_bold, color: Color(0xFFD34426), size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'Reading Level Classification',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: Colors.grey,
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Donut Chart
                SizedBox(
                  width: 140,
                  height: 140,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CustomPaint(
                        size: const Size(140, 140),
                        painter: _DonutChartPainter(
                          frustration: _frustrationCount,
                          instructional: _instructionalCount,
                          independent: _independentCount,
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$totalEvaluated',
                            style: GoogleFonts.inter(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: Colors.black,
                              height: 1.0,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'LEARNERS',
                            style: GoogleFonts.inter(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: Colors.grey[500],
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                // Legend Column
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLegendRow(_frustrationCount, 'Frustration\nLevel', const Color(0xFFD34426), totalEvaluated, 'Frustration'),
                      const SizedBox(height: 12),
                      _buildLegendRow(_instructionalCount, 'Instructional\nLevel', const Color(0xFFEAB308), totalEvaluated, 'Instructional'),
                      const SizedBox(height: 12),
                      _buildLegendRow(_independentCount, 'Independent\nLevel', const Color(0xFF10B981), totalEvaluated, 'Independent'),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegendRow(int count, String label, Color color, int total, String filterLevel) {
    final pct = total > 0 ? ((count / total) * 100).round() : 0;

    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TeacherReadingLevelsPage(initialLevel: filterLevel),
          ),
        );
      },
      borderRadius: BorderRadius.circular(6),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2.0),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 32,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '$count',
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: Colors.black,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                  height: 1.1,
                ),
              ),
            ),
            Text(
              '($pct%)',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String value,
    required String unit,
    required String label,
    required String icon,
    required Color iconColor,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                      height: 1.0,
                    ),
                  ),
                  if (unit.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    Text(
                      unit,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ],
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Iconify(icon, color: iconColor, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriorityStudentsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFDF4F2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFEE2E2)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD34426).withValues(alpha: 0.03),
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
              Row(
                children: [
                  Text(
                    '$_frustrationCount',
                    style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFFD34426),
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFD34426), width: 1.5),
                    ),
                    child: const Icon(
                      Icons.arrow_forward_rounded,
                      color: Color(0xFFD34426),
                      size: 14,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Iconify(Ph.warning_circle_bold, color: Color(0xFFD34426), size: 20),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Priority\nStudents',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: const Color(0xFFD34426),
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

class _DonutChartPainter extends CustomPainter {
  final int frustration;
  final int instructional;
  final int independent;

  _DonutChartPainter({
    required this.frustration,
    required this.instructional,
    required this.independent,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2;
    final strokeWidth = radius * 0.42;
    final rect = Rect.fromCircle(center: center, radius: radius - strokeWidth / 2);

    final total = frustration + instructional + independent;

    if (total == 0) {
      final paintEmpty = Paint()
        ..color = const Color(0xFFE2E8F0)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth;
      canvas.drawCircle(center, radius - strokeWidth / 2, paintEmpty);
      return;
    }

    final paintFrustration = Paint()
      ..color = const Color(0xFFD34426)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintInstructional = Paint()
      ..color = const Color(0xFFEAB308)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintIndependent = Paint()
      ..color = const Color(0xFF10B981)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    double startAngle = -math.pi / 2;

    final slices = [
      {'count': frustration, 'paint': paintFrustration},
      {'count': instructional, 'paint': paintInstructional},
      {'count': independent, 'paint': paintIndependent},
    ];

    for (var slice in slices) {
      final count = slice['count'] as int;
      final paint = slice['paint'] as Paint;

      if (count > 0) {
        final sweepAngle = (count / total) * 2 * math.pi;
        canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
        startAngle += sweepAngle;
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DonutChartPainter oldDelegate) {
    return oldDelegate.frustration != frustration ||
        oldDelegate.instructional != instructional ||
        oldDelegate.independent != independent;
  }
}
