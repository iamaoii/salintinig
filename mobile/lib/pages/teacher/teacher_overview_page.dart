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
import 'package:salintinig/pages/teacher/assign_phil_iri_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/notification_service.dart';
import 'package:salintinig/services/teacher_prefetch_service.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';

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

  static List<Map<String, dynamic>>? _cachedOverviewActivities;

  String _adaptivePeriod = 'pre_test';
  String _adaptiveLanguage = 'fil';
  String _adaptiveBoundary = 'independent';
  List<Map<String, dynamic>> _overviewActivities =
      _cachedOverviewActivities ?? [];

  bool _isLoadingUser = _cachedOverviewActivities == null;

  @override
  void initState() {
    super.initState();
    if (_cachedOverviewActivities != null &&
        _cachedOverviewActivities!.isNotEmpty) {
      _overviewActivities = _cachedOverviewActivities!;
      _isLoadingUser = false;
    }
    _refreshTeacherProfile();
    _setupRealtimeSubscription();
    TeacherPrefetchService.prefetchAll();
  }

  Future<void> _refreshTeacherProfile() async {
    try {
      final results = await Future.wait([
        AuthService.fetchMe(),
        AuthService.fetchClassStudents(forceRefresh: false),
        ApiService.get('/teacher/assessments/phil-iri-activities'),
        NotificationService().fetchNotifications(),
      ]);

      final res = results[2] as ApiResponse;
      if (res.success && res.data != null && res.data['activities'] is List) {
        final List raw = res.data['activities'];
        _overviewActivities = raw
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
        _cachedOverviewActivities = _overviewActivities;
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
            table: 'notifications',
            callback: (payload) {
              NotificationService().fetchNotifications();
            },
          )
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

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        // Close drawer if open, otherwise stay on Home (Social Media App standard)
        if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
          _scaffoldKey.currentState?.closeDrawer();
        }
      },
      child: Scaffold(
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
                            const NotificationBellIconButton(),
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
                                          color: const Color(0xFFD34426),
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

    final String rawNotes =
        (activity['specialInstructions'] ??
                activity['teacherNotes'] ??
                activity['teacher_notes'] ??
                activity['customInstructions'] ??
                '')
            .toString()
            .trim();

    final bool isDefaultOrArrayString =
        rawNotes.isEmpty ||
        rawNotes.startsWith('[') ||
        rawNotes.contains('Read the assigned passage') ||
        rawNotes.contains('Listen attentively') ||
        rawNotes.contains('Complete the assessment');

    final String teacherNotes = isDefaultOrArrayString ? '' : rawNotes;

    List<String> standardInstructions;
    final upperType = typeStr.toUpperCase();
    if (upperType.contains('SILENT')) {
      standardInstructions = [
        'Read the assigned passage silently at your regular reading speed.',
        'Focus on understanding main ideas, details, and context clues in the passage.',
        'Answer all comprehension questions independently after reading.',
        'Complete the assessment to determine Silent Reading Rate and Comprehension level.',
      ];
    } else if (upperType.contains('LISTEN')) {
      standardInstructions = [
        'Listen attentively while the reading passage is read aloud clearly.',
        'Focus on remembering key characters, events, and details of the story.',
        'Answer all comprehension questions based strictly on what you heard.',
        'Complete the assessment to determine Listening Comprehension level.',
      ];
    } else {
      standardInstructions = [
        'Read the assigned passage aloud clearly and accurately into your device microphone.',
        'Maintain proper pronunciation, pace, and reading expression.',
        'Answer all comprehension questions carefully after completing the reading passage.',
        'Complete the assessment to evaluate Oral Reading Fluency (WPM) and Comprehension level.',
      ];
    }

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
                        Ph.clipboard_text_bold,
                        color: Color(0xFFF97316),
                        size: 22,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Assessment Overview',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF18181B),
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

              // Unified Assessment Detail Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status Badge & Type Chip
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
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
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Text(
                            'TYPE: $typeStr',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF1E40AF),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Title
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF18181B),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Clean 3 Metric Columns Row
                    Container(
                      padding: const EdgeInsets.symmetric(
                        vertical: 14,
                        horizontal: 12,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          // Total Assigned
                          Expanded(
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Iconify(
                                      Ph.users_three_bold,
                                      color: Color(0xFF1B64D8),
                                      size: 16,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '$total',
                                      style: GoogleFonts.inter(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF18181B),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Assigned',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF71717A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            height: 32,
                            width: 1,
                            color: const Color(0xFFE2E8F0),
                          ),
                          // Completed
                          Expanded(
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Iconify(
                                      Ph.check_circle_bold,
                                      color: Color(0xFF10B981),
                                      size: 16,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '$done',
                                      style: GoogleFonts.inter(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF18181B),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Completed',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF71717A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            height: 32,
                            width: 1,
                            color: const Color(0xFFE2E8F0),
                          ),
                          // Pending Evaluation
                          Expanded(
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Iconify(
                                      Ph.clock_bold,
                                      color: Color(0xFFF59E0B),
                                      size: 16,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '$pending',
                                      style: GoogleFonts.inter(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF18181B),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Pending',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF71717A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // Instructions Header
                    Text(
                      'Instructions:',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // Standard Instruction Bullet Points (1..4)
                    ...standardInstructions.asMap().entries.map((entry) {
                      final idx = '${entry.key + 1}.';
                      final text = entry.value;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 24,
                              child: Text(
                                idx,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF3F3F46),
                                ),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                text,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(0xFF3F3F46),
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),

                    // Special Instructions from Teacher Container (if provided)
                    if (teacherNotes.isNotEmpty) ...[
                      const SizedBox(height: 12),
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
                          crossAxisAlignment: CrossAxisAlignment.start,
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
                              teacherNotes,
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
    // Show only the 3 most recent activities on overview page
    final displayList = _overviewActivities.take(3).toList();

    return Column(
      key: _activitiesKey,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Section Title & View All Action Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Iconify(
                  PhIcons.examBold,
                  color: const Color(0xFFD34426),
                  size: 24,
                ),
                const SizedBox(width: 8),
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
                  '${_overviewActivities.length} total',
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

        // Activities List Cards (Limited to 3 recent items or Skeleton Cards)
        if (_isLoadingUser && displayList.isEmpty)
          Column(
            children: List.generate(
              2,
              (i) => Container(
                margin: const EdgeInsets.only(bottom: 14),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 140,
                            height: 14,
                            decoration: BoxDecoration(
                              color: Colors.grey[200],
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            width: 90,
                            height: 10,
                            decoration: BoxDecoration(
                              color: Colors.grey[150],
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
        else if (displayList.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Iconify(
                      PhIcons.examBold,
                      color: const Color(0xFFD34426),
                      size: 26,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'No Assessments Found',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'No Phil-IRI assessments created yet for this class.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 36,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Feedback.forTap(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              AssignPhilIriPage(className: _currentClassName),
                        ),
                      ).then((_) => _refreshTeacherProfile());
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD34426),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: Text(
                      'Assign Assessment',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          )
        else
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
                  act['activityStatus'] != 'closed' &&
                  act['status'] != 'closed';
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
                                        color: const Color(0xFFD34426),
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
                          onPressed: () =>
                              _showOverviewActivityDetailSheet(act),
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
    final students = AuthService.cachedClassStudents ?? [];
    final gradeStart = _adaptiveLanguage == 'en' ? 2 : 1;
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
        final language = (profile['language'] ?? 'fil')
            .toString()
            .toLowerCase();
        final period = (profile['period'] ?? 'pre_test')
            .toString()
            .toLowerCase();
        final languageMatches =
            language == _adaptiveLanguage ||
            (_adaptiveLanguage == 'en' && language.startsWith('eng')) ||
            (_adaptiveLanguage == 'fil' && language.startsWith('fil'));
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
        ? const Color(0xFFFBBF24)
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
          // Filters Row (Period & Language Pills)

          // Filters Row (Period & Language Pills)
          Row(
            children: [
              // Period Filter Pill Toggle
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

              // Language Filter Pill Toggle
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
                        'fil',
                        'Filipino',
                        _adaptiveLanguage == 'fil',
                        (val) => setState(() => _adaptiveLanguage = val),
                      ),
                      _buildPillToggleItem(
                        'en',
                        'English',
                        _adaptiveLanguage == 'en',
                        (val) => setState(() => _adaptiveLanguage = val),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Boundary Category Switcher (Independent / Instructional / Frustrational)
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
                  const Color(0xFFFBBF24),
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

          // Distribution Progress Bars
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
                    color: const Color(0xFFD34426),
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
