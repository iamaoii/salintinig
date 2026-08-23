import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/teacher/teacher_activities_page.dart';
import 'package:salintinig/pages/teacher/teacher_class_progress_page.dart';
import 'package:salintinig/pages/teacher/teacher_form_details_page.dart';
import 'package:salintinig/pages/teacher/teacher_phil_iri_records_page.dart';
import 'package:salintinig/pages/teacher/teacher_reading_levels_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';
import 'dart:math' as math;

class TeacherOverviewPage extends StatefulWidget {
  const TeacherOverviewPage({super.key});

  @override
  State<TeacherOverviewPage> createState() => _TeacherOverviewPageState();
}

class _TeacherOverviewPageState extends State<TeacherOverviewPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final ScrollController _scrollController = ScrollController();
  dynamic _realtimeSubscription;

  // Scroll keys
  final GlobalKey _activitiesKey = GlobalKey();
  final GlobalKey _dashboardKey = GlobalKey();
  final GlobalKey _recordsKey = GlobalKey();

  int _notificationsCount = 3;
  String _overviewFilter = 'all'; // 'all', 'oral', 'listening', 'silent'
  List<Map<String, dynamic>> _overviewActivities = [];

  final List<Map<String, dynamic>> _defaultOverviewActivities = [
    {
      'id': 'phil_iri_gst_1',
      'title': 'Phil-IRI Group Screening Test (GST)',
      'subtitle': 'Form 1A & 1B Class Screening',
      'mode': 'phil-iri',
      'type': 'silent',
      'assessmentType': 'silent',
      'period': 'GST',
      'language': 'fil',
      'badge': 'Phil - IRI',
      'status': 'closed',
      'activityStatus': 'closed',
      'doneCount': 35,
      'pendingCount': 0,
      'totalAssigned': 35,
    },
    {
      'id': 'phil_iri_ort_1',
      'title': 'Oral Reading Assessment (Pre-Test - Filipino)',
      'subtitle': 'Form 3A Graded Passage Evaluation',
      'mode': 'phil-iri',
      'type': 'oral',
      'assessmentType': 'oral',
      'period': 'Pre-Test',
      'language': 'fil',
      'badge': 'Phil - IRI',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 0,
      'pendingCount': 0,
      'totalAssigned': 0,
    },
    {
      'id': 'phil_iri_ort_2',
      'title': 'Oral Reading Assessment (Pre-Test - English)',
      'subtitle': 'Form 3A Graded Passage Evaluation',
      'mode': 'phil-iri',
      'type': 'oral',
      'assessmentType': 'oral',
      'period': 'Pre-Test',
      'language': 'eng',
      'badge': 'Phil - IRI',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 0,
      'pendingCount': 0,
      'totalAssigned': 0,
    },
    {
      'id': 'phil_iri_ort_3',
      'title': 'Listening Assessment (Pre-Test - Filipino)',
      'subtitle': 'Form 3B Graded Listening Evaluation',
      'mode': 'phil-iri',
      'type': 'listening',
      'assessmentType': 'listening',
      'period': 'Pre-Test',
      'language': 'fil',
      'badge': 'Phil - IRI',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 0,
      'pendingCount': 0,
      'totalAssigned': 0,
    },
  ];

  // Notifications
  final List<Map<String, String>> _notifications = [
    {
      'title': 'Activity 1 completed',
      'time': '5 mins ago',
      'desc': 'Juan Dela Cruz just completed Pronunciation Challenge.',
    },
    {
      'title': 'Pending evaluation',
      'time': '1 hour ago',
      'desc': '3 students are waiting for oral reading grading.',
    },
    {
      'title': 'Low score alert',
      'time': '2 hours ago',
      'desc': 'Maria Clara scored Frustration level on Form 1A.',
    },
  ];

  bool _isLoadingUser = true;

  @override
  void initState() {
    super.initState();
    _isLoadingUser = true;
    _overviewActivities = List.from(_defaultOverviewActivities);
    _refreshTeacherProfile();
    _setupRealtimeSubscription();
  }

  Future<void> _refreshTeacherProfile() async {
    await AuthService.fetchMe();
    await AuthService.fetchClassStudents(forceRefresh: true);

    try {
      final res = await ApiService.get(
        '/teacher/assessments/phil-iri-activities',
      );
      if (res.success && res.data != null && res.data['activities'] is List) {
        final List raw = res.data['activities'];
        if (raw.isNotEmpty) {
          _overviewActivities = raw
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() {
        _isLoadingUser = false;
      });
    }
  }

  void _setupRealtimeSubscription() {
    try {
      final client = Supabase.instance.client;
      _realtimeSubscription = client
          .channel('public:teacher_updates')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'student_grade_history',
            callback: (payload) {
              _refreshTeacherProfile();
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'assessments',
            callback: (payload) {
              _refreshTeacherProfile();
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'reading_profiles',
            callback: (payload) {
              _refreshTeacherProfile();
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'students',
            callback: (payload) {
              _refreshTeacherProfile();
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('Teacher Realtime subscription notice: $e');
    }
  }

  @override
  void dispose() {
    if (_realtimeSubscription != null) {
      try {
        Supabase.instance.client.removeChannel(_realtimeSubscription);
      } catch (_) {}
    }
    _scrollController.dispose();
    super.dispose();
  }

  void _showNotificationCenter() {
    Feedback.forTap(context);
    setState(() {
      _notificationsCount = 0;
    });
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Notifications',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded, color: Colors.black),
                  ),
                ],
              ),
              const Divider(height: 24, thickness: 1, color: Color(0xFFE4E4E7)),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _notifications.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final item = _notifications[index];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFCFAF7),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                item['title']!,
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                ),
                              ),
                              Text(
                                item['time']!,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item['desc']!,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: Colors.grey[700],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softCreamBg,
      drawer: const TeacherSidebarDrawer(activeRoute: 'Overview'),
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
                    // 1. Navigation Row (App Bar)
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 12.0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Menu hamburger Button
                          IconButton(
                            onPressed: () {
                              _scaffoldKey.currentState?.openDrawer();
                            },
                            icon: Iconify(
                              Ph.list,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          // Center Logo & Title
                          Row(
                            children: [
                              Image.asset(
                                'assets/logo/logo_v2.webp',
                                height: 32,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SalinTinig',
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                          // Right Notification Bell
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              IconButton(
                                onPressed: _showNotificationCenter,
                                icon: Iconify(
                                  Ph.bell,
                                  size: 28,
                                  color: Colors.black,
                                ),
                              ),
                              if (_notificationsCount > 0)
                                Positioned(
                                  right: 6,
                                  top: 6,
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 16,
                                      minHeight: 16,
                                    ),
                                    child: Text(
                                      '$_notificationsCount',
                                      style: GoogleFonts.inter(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // 2. Scrollable Body
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _refreshTeacherProfile,
                        color: const Color(0xFFD34426),
                        child: SingleChildScrollView(
                          controller: _scrollController,
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16.0,
                            vertical: 12.0,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // ── Hero Header Card (Grade 4 - Fyang) ──
                              _buildHeroHeaderCard(),
                              const SizedBox(height: 20),

                              // ── Quick Access Row ──
                              _buildQuickAccessRow(),
                              const SizedBox(height: 28),

                              // ── Section: Class Activities ──
                              _buildClassActivitiesSection(),
                              const SizedBox(height: 28),

                              // ── Section: Student Dashboard ──
                              Row(
                                key: _dashboardKey,
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Iconify(
                                        Ph.presentation_chart,
                                        color: Colors.grey[700],
                                        size: 24,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Student Dashboard',
                                        style: GoogleFonts.inter(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.black,
                                        ),
                                      ),
                                    ],
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      Feedback.forTap(context);
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) =>
                                              TeacherClassProgressPage(
                                                className: _currentClassName,
                                              ),
                                        ),
                                      );
                                    },
                                    child: Text(
                                      'View Details',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: primaryBlue,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              _buildReadingClassificationCard(),
                              const SizedBox(height: 28),

                              // ── Section: Phil - IRI Records ──
                              Row(
                                key: _recordsKey,
                                children: [
                                  const Icon(
                                    Icons.assignment_outlined,
                                    color: Color(0xFFD34426),
                                    size: 24,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Phil - IRI Records',
                                    style: GoogleFonts.inter(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.black,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _buildRecordsGrid(),
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
          },
        ),
      ),
    );
  }

  Widget _buildHeroHeaderCard() {
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
          // Translucent watermark logo background (identical to student overview page)
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
          // Foreground content
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _isLoadingUser
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
                _isLoadingUser
                    ? Container(
                        width: 100,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      )
                    : Text(
                        AuthService.currentUser?.schoolYear ?? '',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Colors.white.withValues(alpha: 0.9),
                          letterSpacing: 0.2,
                        ),
                      ),
                const SizedBox(height: 6),
                _isLoadingUser
                    ? Container(
                        width: 130,
                        height: 14,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      )
                    : Text(
                        '${AuthService.currentUser?.rawUser?['studentsCount'] ?? 0} Enrolled Learners',
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

  String get _displaySectionTitle {
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

  String get _currentClassName {
    return _displaySectionTitle;
  }

  Widget _buildQuickAccessRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: _buildQuickAccessCard(
            label: 'Student\nDashboard',
            icon: Ph.presentation_chart,
            onTap: () {
              Feedback.forTap(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      TeacherClassProgressPage(className: _currentClassName),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickAccessCard(
            label: 'Phil - IRI\nRecords',
            icon: Ph.files_bold,
            onTap: () {
              Feedback.forTap(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      TeacherPhilIriRecordsPage(className: _currentClassName),
                ),
              );
            },
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildQuickAccessCard(
            label: 'Activities',
            icon: PhIcons.flagPennantBold,
            onTap: () {
              Feedback.forTap(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      TeacherActivitiesPage(className: _currentClassName),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showOverviewActivityDetailSheet(Map<String, dynamic> activity) {
    Feedback.forTap(context);
    final String title = activity['title'] ?? 'Assessment Details';
    final String typeStr =
        (activity['assessmentType'] ?? activity['type'] ?? 'oral')
            .toString()
            .toUpperCase();
    final int done =
        int.tryParse(
          activity['doneCount']?.toString() ??
              activity['done']?.toString() ??
              '0',
        ) ??
        0;
    final int pending =
        int.tryParse(
          activity['pendingCount']?.toString() ??
              activity['pending']?.toString() ??
              '0',
        ) ??
        0;
    final int total =
        int.tryParse(activity['totalAssigned']?.toString() ?? '0') ??
        (done + pending);
    final bool isOpen =
        activity['activityStatus'] != 'closed' &&
        activity['status'] != 'closed';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFFFCFAF7),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 20,
        ),
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Iconify(
                        Ph.chart_pie_slice,
                        color: Color(0xFFD34426),
                        size: 22,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Activity Overview',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(sheetCtx),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Overview Stat Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[700],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // 3 Metric Containers Grid
                    Row(
                      children: [
                        // Total Assigned
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFBFDBFE),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$total',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFF1E40AF),
                                      ),
                                    ),
                                    const Iconify(
                                      Ph.users_three,
                                      color: Color(0xFF1D4ED8),
                                      size: 16,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Total\nAssigned',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1E3A8A),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Completed
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFA7F3D0),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$done',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFF047857),
                                      ),
                                    ),
                                    const Iconify(
                                      Ph.check_circle,
                                      color: Color(0xFF059669),
                                      size: 16,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Completed\nStudents',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF065F46),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Pending
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFFDE68A),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$pending',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFFB45309),
                                      ),
                                    ),
                                    const Iconify(
                                      Ph.clock,
                                      color: Color(0xFFD97706),
                                      size: 16,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Pending\nEvaluation',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF92400E),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Last Update: Active Assessment Session',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Instructions Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isOpen
                                ? const Color(0xFFDCFCE7)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(
                              color: isOpen
                                  ? const Color(0xFF86EFAC)
                                  : const Color(0xFFCBD5E1),
                            ),
                          ),
                          child: Text(
                            isOpen ? 'STATUS: OPEN' : 'STATUS: CLOSED',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isOpen
                                  ? const Color(0xFF166534)
                                  : Colors.grey[700],
                            ),
                          ),
                        ),
                        Text(
                          'Type: $typeStr',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 10),
                    Text(
                      'Instructions:',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '1. Students complete oral, listening, or silent assessment in student app.\n2. Automated AI computes accuracy %, WPM, and comprehension level.\n3. Teacher verifies miscues for oral reading tests.',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.grey[700],
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // View Full Page Link
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(sheetCtx);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          TeacherActivitiesPage(className: _currentClassName),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD34426),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                label: Text(
                  'Open Full Class Activities Page',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildClassActivitiesSection() {
    final filteredList = _overviewActivities.where((act) {
      final typeStr = (act['assessmentType'] ?? act['type'] ?? '')
          .toString()
          .toLowerCase();
      if (_overviewFilter == 'oral') return typeStr.contains('oral');
      if (_overviewFilter == 'listening') return typeStr.contains('listening');
      if (_overviewFilter == 'silent') return typeStr.contains('silent');
      return true;
    }).toList();

    // Show only the 3 most recent activities on overview page
    final displayList = filteredList.take(3).toList();

    return Column(
      key: _activitiesKey,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Category Filter Chips Row
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children:
                [
                  {'id': 'all', 'label': 'All'},
                  {'id': 'oral', 'label': 'Oral Reading'},
                  {'id': 'listening', 'label': 'Listening'},
                  {'id': 'silent', 'label': 'Silent Reading'},
                ].map((f) {
                  final isSelected = _overviewFilter == f['id'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        f['label']!,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : Colors.grey[700],
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: const Color(0xFFD34426),
                      backgroundColor: Colors.white,
                      side: BorderSide(
                        color: isSelected
                            ? const Color(0xFFD34426)
                            : const Color(0xFFE2E8F0),
                      ),
                      onSelected: (_) {
                        Feedback.forTap(context);
                        setState(() => _overviewFilter = f['id']!);
                      },
                    ),
                  );
                }).toList(),
          ),
        ),
        const SizedBox(height: 16),

        // Section Title & Items Count
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Text(
                  'Phil-IRI Assessments',
                  style: GoogleFonts.inter(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${filteredList.length} items',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            GestureDetector(
              onTap: () {
                Feedback.forTap(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        TeacherActivitiesPage(className: _currentClassName),
                  ),
                );
              },
              child: Text(
                'View All',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1B64D8),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Activities List Cards (Limited to 3 recent items)
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: displayList.length,
          separatorBuilder: (context, index) => const SizedBox(height: 14),
          itemBuilder: (context, index) {
            final act = displayList[index];
            final String title = act['title'] ?? 'Assessment';
            final String subtitle = act['subtitle'] ?? '';
            final String typeStr =
                (act['assessmentType'] ?? act['type'] ?? 'oral')
                    .toString()
                    .toLowerCase();
            final bool isOpen =
                act['activityStatus'] != 'closed' && act['status'] != 'closed';
            final int done =
                int.tryParse(
                  act['doneCount']?.toString() ??
                      act['done']?.toString() ??
                      '0',
                ) ??
                0;
            final int pending =
                int.tryParse(
                  act['pendingCount']?.toString() ??
                      act['pending']?.toString() ??
                      '0',
                ) ??
                0;

            String iconSvg = PhIcons.userSoundBold;
            Color iconBg = const Color(0xFFDBEAFE);
            Color iconColor = const Color(0xFF1D4ED8);

            if (typeStr.contains('listening')) {
              iconSvg = PhIcons.earBold;
              iconBg = const Color(0xFFFEF3C7);
              iconColor = const Color(0xFFB45309);
            } else if (typeStr.contains('silent')) {
              iconSvg = PhIcons.bookOpenBold;
              iconBg = const Color(0xFFD1FAE5);
              iconColor = const Color(0xFF047857);
            } else if (typeStr.contains('practice')) {
              iconSvg = PhIcons.puzzlePieceBold;
              iconBg = const Color(0xFFF3E8FF);
              iconColor = const Color(0xFF7E22CE);
            }

            return Container(
              padding: const EdgeInsets.all(16),
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Type Icon
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Iconify(iconSvg, color: iconColor, size: 22),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Title & Details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                              ),
                            ),
                            if (subtitle.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                subtitle,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isOpen
                                        ? const Color(0xFFDCFCE7)
                                        : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isOpen ? 'OPEN' : 'CLOSED',
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isOpen
                                          ? const Color(0xFF15803D)
                                          : Colors.grey[600],
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    typeStr.toUpperCase(),
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.grey[700],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 12),

                  // Footer Stats & Actions
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.check_circle_rounded,
                            color: Color(0xFF059669),
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$done',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            ' Done',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(
                            Icons.access_time_rounded,
                            color: Color(0xFFD97706),
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '$pending',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            ' Pending',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),

                      // View Details Button
                      ElevatedButton(
                        onPressed: () => _showOverviewActivityDetailSheet(act),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD34426),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(100),
                          ),
                        ),
                        child: Text(
                          'View Details',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildQuickAccessCard({
    required String label,
    required String icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        onTap();
      },
      child: Container(
        height: 110,
        decoration: BoxDecoration(
          color: const Color(
            0xFFFDF4F2,
          ), // Light peach/pinkish matching first screenshot
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFFBE8E6), width: 1.5),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Iconify(icon, size: 32, color: const Color(0xFFD34426)),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.black87,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReadingClassificationCard() {
    final cached = AuthService.cachedClassStudents ?? [];
    int frust = 0;
    int inst = 0;
    int indep = 0;

    for (var s in cached) {
      final lvl =
          (s['readingLevel'] ??
                  s['level'] ??
                  s['reading_level'] ??
                  s['current_profile_label'] ??
                  s['gstResult'] ??
                  s['gst_result'] ??
                  '')
              .toString()
              .trim()
              .toLowerCase();
      if (lvl.contains('frustrat')) {
        frust++;
      } else if (lvl.contains('instruct')) {
        inst++;
      } else if (lvl.contains('independ')) {
        indep++;
      }
    }

    final totalEvaluated = frust + inst + indep;
    final frustPct = totalEvaluated > 0
        ? ((frust / totalEvaluated) * 100).round()
        : 0;
    final instPct = totalEvaluated > 0
        ? ((inst / totalEvaluated) * 100).round()
        : 0;
    final indepPct = totalEvaluated > 0
        ? ((indep / totalEvaluated) * 100).round()
        : 0;

    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                const TeacherReadingLevelsPage(initialLevel: 'All'),
          ),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                      'Reading Level Classification',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.black,
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
            const SizedBox(height: 16),
            Row(
              children: [
                // Left content
                Expanded(
                  flex: 5,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '$totalEvaluated',
                            style: GoogleFonts.inter(
                              fontSize: 44,
                              fontWeight: FontWeight.w900,
                              color: Colors.black,
                              height: 1,
                            ),
                          ),
                          const SizedBox(width: 6),
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
                      const Divider(color: Color(0xFFE2E8F0), thickness: 1),
                      const SizedBox(height: 12),
                      // Legend
                      _buildLegendItem(
                        '$frust',
                        'Frustration Level ($frustPct%)',
                        const Color(0xFFD34426),
                        'Frustration',
                      ),
                      const SizedBox(height: 8),
                      _buildLegendItem(
                        '$inst',
                        'Instructional Level ($instPct%)',
                        const Color(0xFFFFD13E),
                        'Instructional',
                      ),
                      const SizedBox(height: 8),
                      _buildLegendItem(
                        '$indep',
                        'Independent Level ($indepPct%)',
                        const Color(0xFF00A859),
                        'Independent',
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Right content: Custom donut chart
                Expanded(
                  flex: 4,
                  child: Center(
                    child: SizedBox(
                      width: 110,
                      height: 110,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          CustomPaint(
                            size: const Size(110, 110),
                            painter: DonutChartPainter(
                              frustration: frust,
                              instructional: inst,
                              independent: indep,
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '$totalEvaluated',
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.black,
                                  height: 1.0,
                                ),
                              ),
                              const SizedBox(height: 1),
                              Text(
                                'LEARNERS',
                                style: GoogleFonts.inter(
                                  fontSize: 8,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.grey[500],
                                  letterSpacing: 0.3,
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
    );
  }

  Widget _buildLegendItem(
    String count,
    String label,
    Color color, [
    String? levelFilter,
  ]) {
    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                TeacherReadingLevelsPage(initialLevel: levelFilter ?? 'All'),
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
              height: 18,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              count,
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.black,
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.45,
      children: [
        _buildRecordCard(
          title: 'FORM 1A',
          subtitle: 'Filipino GST',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF10B981),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 1B',
          subtitle: 'English GST',
          bgColor: Colors.white,
          arrowColor: const Color(0xFFF59E0B),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 2',
          subtitle: 'School Reading Profile',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 3A',
          subtitle: 'Filipino ORT\nAssessment',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 3B',
          subtitle: 'English ORT\nAssessment',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
        _buildRecordCard(
          title: 'FORM 4',
          subtitle: 'Individual Summary\nRecord',
          bgColor: Colors.white,
          arrowColor: const Color(0xFF1B64D8),
          hasBorder: true,
        ),
      ],
    );
  }

  Widget _buildRecordCard({
    required String title,
    required String subtitle,
    required Color bgColor,
    required Color arrowColor,
    bool hasBorder = false,
  }) {
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);

        int doneCount = 0;
        int notDoneCount = 35;
        Color progressColor = const Color(0xFFF87171);
        Color secondaryColor = const Color(0xFFFEE2E2);
        bool hasGSTCards = false;
        int underGSTCount = 0;
        int aboveGSTCount = 0;

        final cleanSubtitle = subtitle.replaceAll('\n', ' ');

        if (title == 'FORM 1A') {
          doneCount = 35;
          notDoneCount = 0;
          progressColor = const Color(0xFF059669);
          secondaryColor = const Color(0xFFE2E8F0);
          hasGSTCards = true;
          underGSTCount = 30;
          aboveGSTCount = 5;
        } else if (title == 'FORM 1B') {
          doneCount = 25;
          notDoneCount = 10;
          progressColor = const Color(0xFFEAB308);
          secondaryColor = const Color(0xFFFEF3C7);
          hasGSTCards = true;
          underGSTCount = 20;
          aboveGSTCount = 5;
        } else {
          doneCount = 0;
          notDoneCount = 35;
          progressColor = const Color(0xFFF87171);
          secondaryColor = const Color(0xFFFEE2E2);
          hasGSTCards = false;
        }

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TeacherFormDetailsPage(
              formTitle: title,
              formSubtitle: cleanSubtitle,
              doneCount: doneCount,
              notDoneCount: notDoneCount,
              progressColor: progressColor,
              secondaryColor: secondaryColor,
              hasGSTCards: hasGSTCards,
              underGSTCount: underGSTCount,
              aboveGSTCount: aboveGSTCount,
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: hasBorder ? Border.all(color: const Color(0xFFE2E8F0)) : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[500],
                    height: 1.1,
                  ),
                ),
              ],
            ),
            Align(
              alignment: Alignment.bottomRight,
              child: Icon(
                Icons.arrow_circle_right_rounded,
                color: arrowColor,
                size: 26,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DonutChartPainter extends CustomPainter {
  final int frustration;
  final int instructional;
  final int independent;

  DonutChartPainter({
    this.frustration = 0,
    this.instructional = 0,
    this.independent = 0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2.3;
    const strokeWidth = 26.0;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final total = frustration + instructional + independent;

    if (total == 0) {
      final paintEmpty = Paint()
        ..color = const Color(0xFFE2E8F0)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth;
      canvas.drawCircle(center, radius, paintEmpty);
      return;
    }

    final paintFrustration = Paint()
      ..color = const Color(0xFFD34426)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintInstructional = Paint()
      ..color = const Color(0xFFFFD13E)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    final paintIndependent = Paint()
      ..color = const Color(0xFF00A859)
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
  bool shouldRepaint(covariant DonutChartPainter oldDelegate) {
    return oldDelegate.frustration != frustration ||
        oldDelegate.instructional != instructional ||
        oldDelegate.independent != independent;
  }
}
