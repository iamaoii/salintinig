import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_class_details_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';

class TeacherClassProgressPage extends StatefulWidget {
  final String className;
  const TeacherClassProgressPage({
    super.key,
    this.className = '',
  });

  @override
  State<TeacherClassProgressPage> createState() =>
      _TeacherClassProgressPageState();
}

class _TeacherClassProgressPageState extends State<TeacherClassProgressPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  RealtimeChannel? _realtimeChannel;

  bool _isLoadingStudents = true;
  int _totalStudents = 0;
  int _maleCount = 0;
  int _femaleCount = 0;



  List<Map<String, dynamic>> _rawStudents = [];
  String _selectedLanguage = 'Filipino';
  String _adaptivePeriod = 'pre_test';
  String _adaptiveBoundary = 'instructional';

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
            callback: (payload) => _fetchClassStudents(forceRefresh: true),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'assessments',
            callback: (payload) => _fetchClassStudents(forceRefresh: true),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'students',
            callback: (payload) => _fetchClassStudents(forceRefresh: true),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'student_grade_history',
            callback: (payload) => _fetchClassStudents(forceRefresh: true),
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
    if (rawList.isNotEmpty) {
      _rawStudents = rawList;
    }
    final targetList = _rawStudents.isNotEmpty ? _rawStudents : (AuthService.cachedClassStudents ?? []);
    int males = 0;
    int females = 0;

    for (var s in targetList) {
      final g = (s['gender'] ?? s['sex'] ?? '').toString().trim().toLowerCase();
      if (g.startsWith('m')) {
        males++;
      } else if (g.startsWith('f')) {
        females++;
      }
    }

    _totalStudents = targetList.length;
    _maleCount = males;
    _femaleCount = females;
  }

  Future<void> _fetchClassStudents({bool forceRefresh = false}) async {
    try {
      final rawList = await AuthService.fetchClassStudents(forceRefresh: forceRefresh);
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
      drawerEnableOpenDragGesture: false,
      backgroundColor: softBg,
      drawer: const TeacherSidebarDrawer(activeRoute: 'Student Dashboard'),
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar
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
                  const NotificationBellIconButton(),
                ],
              ),
            ),

            Expanded(
              child: RefreshIndicator(
                onRefresh: () => _fetchClassStudents(forceRefresh: true),
                color: const Color(0xFFD34426),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 8.0,
                  ),
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

                      // 6. Reading Level Classification Grade Distribution Card
                      _buildDonutChartCard(),
                      const SizedBox(height: 20),

                      Builder(
                        builder: (context) {
                          final students = _rawStudents.isEmpty ? (AuthService.cachedClassStudents ?? []) : _rawStudents;

                          double totalAcc = 0.0;
                          int accCount = 0;
                          double totalComp = 0.0;
                          int compCount = 0;
                          double totalSpeed = 0.0;
                          int speedCount = 0;
                          int completeProfiles = 0;

                          final targetLang = _selectedLanguage.toLowerCase().contains('eng') ? 'en' : 'fil';
                          final targetPeriod = _adaptivePeriod.toLowerCase();

                          for (final s in students) {
                            // 1. Complete Adaptive Profiles check
                            final profiles = s['oralAdaptiveProfiles'];
                            if (profiles is List && profiles.isNotEmpty) {
                              bool hasComplete = false;
                              for (final rawP in profiles) {
                                if (rawP is! Map) continue;
                                final p = Map<String, dynamic>.from(rawP);
                                final pLang = (p['language'] ?? 'fil').toString().toLowerCase();
                                final pPeriod = (p['period'] ?? 'pre_test').toString().toLowerCase();
                                final langMatch = targetLang == 'en'
                                    ? pLang.startsWith('eng') || pLang.startsWith('en')
                                    : pLang.startsWith('fil');
                                final periodMatch = targetPeriod == 'post_test'
                                    ? pPeriod.contains('post')
                                    : !pPeriod.contains('post');

                                if (langMatch && periodMatch) {
                                  final hasInd = p['independentLevel'] != null && p['independentLevel'].toString().isNotEmpty;
                                  final hasIns = p['instructionalLevel'] != null && p['instructionalLevel'].toString().isNotEmpty;
                                  final hasFru = p['frustrationalLevel'] != null && p['frustrationalLevel'].toString().isNotEmpty;
                                  if (hasInd && hasIns && hasFru) {
                                    hasComplete = true;
                                  }
                                  break;
                                }
                              }
                              if (hasComplete) completeProfiles++;
                            }

                            // 2. Metrics lookup from oralProfileMetrics strictly matching web logic
                            double? accuracyVal;
                            double? speedVal;
                            double? compVal;

                            final rawMetrics = s['oralProfileMetrics'];
                            if (rawMetrics is List && rawMetrics.isNotEmpty) {
                              for (final rawM in rawMetrics) {
                                if (rawM is! Map) continue;
                                final m = Map<String, dynamic>.from(rawM);
                                final mLang = (m['language'] ?? 'fil').toString().toLowerCase();
                                final mPeriod = (m['period'] ?? 'pre_test').toString().toLowerCase();
                                final langMatch = targetLang == 'en'
                                    ? mLang.startsWith('eng') || mLang.startsWith('en')
                                    : mLang.startsWith('fil');
                                final periodMatch = targetPeriod == 'post_test'
                                    ? mPeriod.contains('post')
                                    : !mPeriod.contains('post');

                                if (langMatch && periodMatch) {
                                  if (m['accuracy'] != null) {
                                    accuracyVal = double.tryParse(m['accuracy'].toString().replaceAll('%', '').trim());
                                  }
                                  if (m['speed'] != null) {
                                    speedVal = double.tryParse(m['speed'].toString().replaceAll(RegExp(r'[^0-9.]'), '').trim());
                                  }
                                  if (m['comprehension'] != null) {
                                    compVal = double.tryParse(m['comprehension'].toString().replaceAll('%', '').trim());
                                  }
                                  break;
                                }
                              }
                            }

                            // If period is pre_test and oralProfileMetrics has no entry yet, fallback to top-level student pre_test fields
                            if (targetPeriod == 'pre_test') {
                              if (accuracyVal == null) {
                                dynamic accRaw = targetLang == 'en'
                                    ? (s['engOralAccuracy'] ?? s['accuracy'])
                                    : (s['filOralAccuracy'] ?? s['accuracy']);
                                if (accRaw != null) {
                                  accuracyVal = double.tryParse(accRaw.toString().replaceAll('%', '').trim());
                                }
                              }
                              if (speedVal == null) {
                                dynamic speedRaw = targetLang == 'en'
                                    ? (s['engOralSpeed'] ?? s['readingSpeed'])
                                    : (s['filOralSpeed'] ?? s['readingSpeed']);
                                if (speedRaw != null) {
                                  speedVal = double.tryParse(speedRaw.toString().replaceAll(RegExp(r'[^0-9.]'), '').trim());
                                }
                              }
                              if (compVal == null) {
                                dynamic compRaw = targetLang == 'en'
                                    ? (s['engOralComprehension'] ?? s['comprehension'])
                                    : (s['filOralComprehension'] ?? s['comprehension']);
                                if (compRaw != null) {
                                  compVal = double.tryParse(compRaw.toString().replaceAll('%', '').trim());
                                }
                              }
                            }

                            if (accuracyVal != null && accuracyVal > 0) {
                              totalAcc += accuracyVal;
                              accCount++;
                            }
                            if (speedVal != null && speedVal > 0) {
                              totalSpeed += speedVal;
                              speedCount++;
                            }
                            if (compVal != null && compVal > 0) {
                              totalComp += compVal;
                              compCount++;
                            }
                          }

                          final avgAccuracy = accCount > 0 ? (totalAcc / accCount) : 0.0;
                          final avgComprehension = compCount > 0 ? (totalComp / compCount) : 0.0;
                          final avgSpeed = speedCount > 0 ? (totalSpeed / speedCount) : 0.0;

                          return Column(
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildMetricCard(
                                      value: '${avgAccuracy.round()}',
                                      unit: '%',
                                      label: 'Average\nAccuracy',
                                      icon: Ph.target_bold,
                                      iconColor: const Color(0xFF2563EB),
                                      bgColor: const Color(0xFFDBEAFE),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildMetricCard(
                                      value: '$completeProfiles',
                                      unit: '',
                                      label: 'Complete Adaptive\nProfiles',
                                      icon: Ph.check_circle_bold,
                                      iconColor: const Color(0xFF8B5CF6),
                                      bgColor: const Color(0xFFF3E8FF),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildMetricCard(
                                      value: '${avgSpeed.round()}',
                                      unit: 'wps',
                                      label: 'Average\nReading Speed',
                                      icon: Ph.lightning_bold,
                                      iconColor: const Color(0xFFD97706),
                                      bgColor: const Color(0xFFFEF08A),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: _buildMetricCard(
                                      value: '${avgComprehension.round()}',
                                      unit: '%',
                                      label: 'Average\nComprehension',
                                      icon: Ph.lightbulb_bold,
                                      iconColor: const Color(0xFF059669),
                                      bgColor: const Color(0xFFA7F3D0),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 56),
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

  String get _displaySectionTitle {
    if (widget.className.isNotEmpty) {
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
    return '';
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
                _isLoadingStudents
                    ? Container(
                        width: 180,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      )
                    : Text(
                        _displaySectionTitle,
                        style: GoogleFonts.inter(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                const SizedBox(height: 12),
                _isLoadingStudents
                    ? Container(
                        width: 100,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      )
                    : Text(
                        AuthService.currentUser?.schoolYear ?? 'S.Y. 2026-2027',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.white.withValues(alpha: 0.9),
                          letterSpacing: 0.2,
                        ),
                      ),
                const SizedBox(height: 6),
                _isLoadingStudents
                    ? Container(
                        width: 130,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      )
                    : Text(
                        '${_totalStudents > 0 ? _totalStudents : (AuthService.currentUser?.rawUser?['studentsCount'] ?? 0)} Enrolled Learners',
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
                  Icon(
                    Icons.info_outline_rounded,
                    color: Colors.grey[500],
                    size: 20,
                  ),
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
                      builder: (context) => TeacherClassDetailsPage(
                        className: _displaySectionTitle,
                      ),
                    ),
                  );
                },
                child: Text(
                  'Class List',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1D4ED8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          LayoutBuilder(
            builder: (context, constraints) {
              final isSmallScreen = constraints.maxWidth < 360;

              if (isSmallScreen) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Iconify(Ph.users_three, color: Colors.black87, size: 28),
                        const SizedBox(width: 8),
                        _isLoadingStudents
                            ? Container(
                                width: 44,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: Colors.grey[200],
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              )
                            : Text(
                                '$_totalStudents',
                                style: GoogleFonts.inter(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black,
                                  height: 1.0,
                                ),
                              ),
                        const SizedBox(width: 6),
                        Text(
                          'Total Students',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[700],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _isLoadingStudents
                                    ? Container(
                                        width: 18,
                                        height: 15,
                                        decoration: BoxDecoration(
                                          color: Colors.grey[300],
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                      )
                                    : Text(
                                        '$_maleCount ',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w900,
                                          color: const Color(0xFF1D4ED8),
                                        ),
                                      ),
                                const SizedBox(width: 2),
                                Text(
                                  'Males',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF1D4ED8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                _isLoadingStudents
                                    ? Container(
                                        width: 18,
                                        height: 15,
                                        decoration: BoxDecoration(
                                          color: Colors.grey[300],
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                      )
                                    : Text(
                                        '$_femaleCount ',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w900,
                                          color: const Color(0xFF1D4ED8),
                                        ),
                                      ),
                                const SizedBox(width: 2),
                                Text(
                                  'Females',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: const Color(0xFF1D4ED8),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              }

              return Row(
                children: [
                  Iconify(Ph.users_three, color: Colors.black87, size: 26),
                  const SizedBox(width: 6),
                  _isLoadingStudents
                      ? Container(
                          width: 44,
                          height: 32,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(6),
                          ),
                        )
                      : Text(
                          '$_totalStudents',
                          style: GoogleFonts.inter(
                            fontSize: 28,
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                            height: 1.0,
                          ),
                        ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      'Total\nStudents',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[700],
                        height: 1.1,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _isLoadingStudents
                            ? Container(
                                width: 18,
                                height: 15,
                                decoration: BoxDecoration(
                                  color: Colors.grey[300],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              )
                            : Text(
                                '$_maleCount ',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF1D4ED8),
                                ),
                              ),
                        const SizedBox(width: 2),
                        Text(
                          'Males',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1D4ED8),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _isLoadingStudents
                            ? Container(
                                width: 18,
                                height: 15,
                                decoration: BoxDecoration(
                                  color: Colors.grey[300],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              )
                            : Text(
                                '$_femaleCount ',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  color: const Color(0xFF1D4ED8),
                                ),
                              ),
                        const SizedBox(width: 2),
                        Text(
                          'Females',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF1D4ED8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }



  Widget _buildDonutChartCard() {
    final students = _rawStudents.isEmpty ? (AuthService.cachedClassStudents ?? []) : _rawStudents;
    final gradeStart = _selectedLanguage.toLowerCase().contains('eng') ? 2 : 1;
    final gradeCounts = <int, int>{
      for (var grade = gradeStart; grade <= 7; grade++) grade: 0,
    };

    for (final student in students) {
      final profiles = student['oralAdaptiveProfiles'];
      if (profiles is! List) continue;
      Map<String, dynamic>? selectedProfile;
      for (final rawProfile in profiles) {
        if (rawProfile is! Map) continue;
        final profile = Map<String, dynamic>.from(rawProfile);
        final language = (profile['language'] ?? 'fil').toString().toLowerCase();
        final period = (profile['period'] ?? 'pre_test').toString().toLowerCase();
        final languageMatches = _selectedLanguage.toLowerCase().contains('eng')
            ? language.startsWith('eng')
            : language.startsWith('fil');
        final periodMatches = _adaptivePeriod == 'post_test'
            ? period.contains('post')
            : !period.contains('post');
        if (languageMatches && periodMatches) {
          selectedProfile = profile;
          break;
        }
      }
      if (selectedProfile == null) continue;

      final boundaryKey = _adaptiveBoundary == 'independent'
          ? 'independentLevel'
          : _adaptiveBoundary == 'instructional'
          ? 'instructionalLevel'
          : 'frustrationalLevel';
      final rawGrade = (selectedProfile[boundaryKey] ?? '').toString();
      final match = RegExp(r'\d+').firstMatch(rawGrade);
      final grade = match == null ? null : int.tryParse(match.group(0)!);
      if (grade != null && gradeCounts.containsKey(grade)) {
        gradeCounts[grade] = gradeCounts[grade]! + 1;
      }
    }

    final boundaryColor = _adaptiveBoundary == 'independent'
        ? const Color(0xFF10B981)
        : _adaptiveBoundary == 'instructional'
        ? const Color(0xFFEAB308)
        : const Color(0xFFF43F5E);
    final peak = gradeCounts.values.fold<int>(
      1,
      (maxCount, count) => count > maxCount ? count : maxCount,
    );

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Row 1: Period & Language Filters
          Row(
            children: [
              // Period Toggle
              Expanded(
                child: Container(
                  height: 36,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(
                    children: [
                      _buildPillToggleItem(
                        'pre_test',
                        'Pre-Test',
                        _adaptivePeriod == 'pre_test',
                        (val) => setState(() => _adaptivePeriod = val),
                      ),
                      _buildPillToggleItem(
                        'post_test',
                        'Post-Test',
                        _adaptivePeriod == 'post_test',
                        (val) => setState(() => _adaptivePeriod = val),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),

              // Language Toggle
              Expanded(
                child: Container(
                  height: 36,
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Row(
                    children: [
                      _buildPillToggleItem(
                        'Filipino',
                        'Filipino',
                        _selectedLanguage == 'Filipino',
                        (val) => setState(() => _selectedLanguage = val),
                      ),
                      _buildPillToggleItem(
                        'English',
                        'English',
                        _selectedLanguage == 'English',
                        (val) => setState(() => _selectedLanguage = val),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Row 2: Boundary Switcher (Independent / Instructional / Frustrational)
          Container(
            height: 38,
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                _buildBoundaryTab(
                  'independent',
                  'Independent',
                  const Color(0xFF10B981),
                ),
                _buildBoundaryTab(
                  'instructional',
                  'Instructional',
                  const Color(0xFFEAB308),
                ),
                _buildBoundaryTab(
                  'frustrational',
                  'Frustrational',
                  const Color(0xFFF43F5E),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Row 3: Grade Level Progress Bars
          ...gradeCounts.entries.map((entry) {
            final fraction = peak > 0 ? entry.value / peak : 0.0;
            final bool hasValue = entry.value > 0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  SizedBox(
                    width: 56,
                    child: Text(
                      'Grade ${entry.key}',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF475569),
                      ),
                    ),
                  ),
                  Expanded(
                    child: Stack(
                      children: [
                        Container(
                          height: 10,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(100),
                          ),
                        ),
                        FractionallySizedBox(
                          widthFactor: fraction.clamp(0.0, 1.0),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            height: 10,
                            decoration: BoxDecoration(
                              color: hasValue
                                  ? boundaryColor
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 20,
                    child: Text(
                      '${entry.value}',
                      textAlign: TextAlign.right,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: hasValue
                            ? const Color(0xFF1E293B)
                            : const Color(0xFF94A3B8),
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPillToggleItem(
    String key,
    String label,
    bool isSelected,
    ValueChanged<String> onTap,
  ) {
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(key),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(100),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : [],
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected
                  ? const Color(0xFF1E293B)
                  : const Color(0xFF64748B),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBoundaryTab(String key, String label, Color color) {
    final selected = _adaptiveBoundary == key;

    Color bgColor = Colors.transparent;
    Color textColor = const Color(0xFF64748B);

    if (selected) {
      if (key == 'independent') {
        bgColor = const Color(0xFFE6F4EA); // Mint pastel
        textColor = const Color(0xFF137333); // Dark mint
      } else if (key == 'instructional') {
        bgColor = const Color(0xFFFEF7E0); // Soft amber pastel
        textColor = const Color(0xFFB06000); // Dark amber
      } else if (key == 'frustrational') {
        bgColor = const Color(0xFFFCE8E6); // Soft rose pastel
        textColor = const Color(0xFFC5221F); // Dark rose
      } else {
        bgColor = color;
        textColor = Colors.white;
      }
    }

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _adaptiveBoundary = key),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(11),
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
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
              _isLoadingStudents
                  ? Container(
                      width: 50,
                      height: 28,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(6),
                      ),
                    )
                  : Row(
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
}
