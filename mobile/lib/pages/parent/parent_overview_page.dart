import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/parent/parent_announcements_page.dart';
import 'package:salintinig/pages/parent/parent_assessment_result_detail_page.dart';
import 'package:salintinig/pages/parent/parent_phil_iri_assessment_page.dart';
import 'package:salintinig/pages/parent/parent_progress_reports_page.dart';
import 'package:salintinig/services/parent_portal_cache_service.dart';
import 'package:salintinig/widgets/parent_portal_skeletons.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:salintinig/services/auth_service.dart';

class ParentOverviewPage extends StatefulWidget {
  final Map<String, dynamic>? linkedChild;

  const ParentOverviewPage({
    super.key,
    this.linkedChild,
  });

  @override
  State<ParentOverviewPage> createState() => _ParentOverviewPageState();
}

class _ParentOverviewPageState extends State<ParentOverviewPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  late String _selectedChild;
  late String _childGradeSection;
  late String _parentName;
  late String _studentFirstName;
  bool _isLoadingAssignments = true;
  List<Map<String, dynamic>> _assignedActivities = [];
  List<Map<String, dynamic>> _recentPracticeActivities = [];
  Map<String, dynamic> _practiceAnalytics = {
    'skills': <String, dynamic>{},
  };
  String _teacherNote = '';
  String _teacherNoteAuthor = '';

  // Persisted child data keys
  static const String _kLinkedChild = 'parent_linked_child';
  static const String _kAccessCode = 'parent_access_code';
  String _childLrn = '';
  String _childAccessCode = '';

  /// Persist the linked child info so it survives app restarts
  Future<void> _saveLinkedChild(Map<String, dynamic> child, {String accessCode = ''}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kLinkedChild, jsonEncode(child));
      if (accessCode.isNotEmpty) {
        await prefs.setString(_kAccessCode, accessCode);
      }
    } catch (_) {}
  }

  /// Restore linked child from SharedPreferences (called on app restart)
  Future<Map<String, dynamic>?> _restoreLinkedChild() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_kLinkedChild);
      if (raw != null && raw.isNotEmpty) {
        return jsonDecode(raw) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  Future<String> _restoreAccessCode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_kAccessCode) ?? '';
    } catch (_) {
      return '';
    }
  }

  @override
  void initState() {
    super.initState();
    _applyChildDetails();
    _initAndLoad();
  }

  Future<void> _initAndLoad() async {
    // If launched from login, save the child data for future restarts
    if (widget.linkedChild != null) {
      // Access code is stored on the child map by the login page
      final code = (widget.linkedChild!['accessCode'] ?? widget.linkedChild!['access_code'] ?? '').toString();
      await _saveLinkedChild(widget.linkedChild!, accessCode: code);
    }
    // Restore access code (needed to call the public parent-view endpoint)
    _childAccessCode = await _restoreAccessCode();
    // Extract child LRN
    final user = AuthService.currentUser?.rawUser;
    final restoredChild = await _restoreLinkedChild();
    final child = widget.linkedChild ?? restoredChild ?? user?['linkedChild'] ?? user?['student'] ?? user;
    if (child is Map) {
      final resolvedChild = Map<String, dynamic>.from(child);
      if (mounted) {
        setState(() => _applyChildDetails(resolvedChild));
      } else {
        _applyChildDetails(resolvedChild);
      }
    }
    _childLrn = (child?['lrn'] ?? child?['studentLrn'] ?? '').toString().trim();
    await _loadChildAssignments();
  }

  Future<void> _loadChildAssignments() async {
    try {
      _recentPracticeActivities = [];
      _practiceAnalytics = {'skills': <String, dynamic>{}};
      _teacherNote = '';
      _teacherNoteAuthor = '';
      // Use lrn already resolved in _initAndLoad (or fallback)
      String lrn = _childLrn;
      if (lrn.isEmpty) {
        final user = AuthService.currentUser?.rawUser;
        final child = widget.linkedChild ?? await _restoreLinkedChild() ?? user?['linkedChild'] ?? user?['student'] ?? user;
        lrn = (child?['lrn'] ?? child?['studentLrn'] ?? '').toString().trim();
        _childLrn = lrn;
      }
      if (_childAccessCode.isEmpty) {
        _childAccessCode = await _restoreAccessCode();
      }

      if (lrn.isEmpty) {
        if (mounted) setState(() => _isLoadingAssignments = false);
        return;
      }

      final data = await ParentPortalCacheService.getParentView(
        forceRefresh: _assignedActivities.isEmpty && _recentPracticeActivities.isEmpty ? false : true,
      );
      final activities = data is Map<String, dynamic> ? data['assignedActivities'] : null;
      if (activities is List) {
        _assignedActivities = activities
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();

        final practiceProgress = data?['practiceProgress'];
        final analytics = practiceProgress is Map ? practiceProgress['analytics'] : null;
        _practiceAnalytics = analytics is Map
            ? Map<String, dynamic>.from(analytics)
            : {'skills': <String, dynamic>{}};
        final recentActivities = practiceProgress is Map ? practiceProgress['recentActivities'] : null;
        _recentPracticeActivities = recentActivities is List
            ? recentActivities
                .whereType<Map>()
                .map((item) => Map<String, dynamic>.from(item))
                .toList()
            : [];

        final note = data?['teacherNote'] ?? data?['latestTeacherNote'];
        if (note is Map) {
          _teacherNote = (note['message'] ?? note['note'] ?? '').toString().trim();
          _teacherNoteAuthor = (note['teacherName'] ?? note['author'] ?? '').toString().trim();
        } else {
          _teacherNote = (note ?? '').toString().trim();
          _teacherNoteAuthor = '';
        }
      }
    } catch (_) {
      // Keep the empty state when the child has no assigned assessments yet.
    }
    if (mounted) setState(() => _isLoadingAssignments = false);
  }

  void _applyChildDetails([Map<String, dynamic>? resolvedChild]) {
    final user = AuthService.currentUser?.rawUser;
    final child = resolvedChild ?? widget.linkedChild ?? user?['linkedChild'] ?? user?['student'] ?? user;

    final fullName = (child?['name'] ?? child?['studentName'] ?? 'Student')
        .toString()
        .trim();
    final nameParts = fullName == 'Student'
        ? const <String>[]
        : fullName.split(RegExp(r'\s+'));
    _studentFirstName = (child?['studentFirstName'] ?? child?['firstName'] ??
            (nameParts.isNotEmpty ? nameParts.first : 'Student'))
        .toString();
    final lastName = (child?['lastName'] ?? child?['last_name'] ??
            (nameParts.length > 1 ? nameParts.last : ''))
        .toString()
        .trim();
    _selectedChild = lastName.isNotEmpty ? '$_studentFirstName $lastName' : _studentFirstName;
    _parentName = (child?['parentName'] ?? child?['parent_name'] ?? user?['parentName'] ?? user?['parent_name'] ?? 'Parent').toString();
    final grade = child?['gradeLevel'] ?? child?['grade'] ?? 'Grade 4';
    final section = (child?['sectionName'] ??
            child?['section_name'] ??
            child?['section'])
        ?.toString()
        .trim();
    _childGradeSection = section != null &&
            section.isNotEmpty &&
            section.toLowerCase() != 'unassigned'
        ? '$grade - $section'
        : grade.toString();
  }

  Future<void> _refreshOverview() async {
    final restoredChild = await _restoreLinkedChild();
    if (!mounted) return;
    setState(() => _applyChildDetails(restoredChild));
    // Reset loading state and reload
    setState(() => _isLoadingAssignments = true);
    await ParentPortalCacheService.invalidate();
    await _loadChildAssignments();
  }

  void _showAnnouncementsModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.75,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Iconify(Ph.bell, color: const Color(0xFF1B64D8), size: 24),
                      const SizedBox(width: 10),
                      Text(
                        'Class Announcements',
                        style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    _buildAnnouncementCard(
                      teacherName: 'Section Adviser',
                      date: 'Latest update',
                      title: 'Phil-IRI Post-Test Assessment Window',
                      body: '$_studentFirstName is demonstrating excellent reading fluency in Filipino stories. Please continue encouraging 15 minutes of daily practice at home before the upcoming ORT assessment window.',
                      isPinned: true,
                    ),
                    const SizedBox(height: 12),
                    _buildAnnouncementCard(
                      teacherName: 'Section Adviser',
                      date: 'Class advisory',
                      title: 'Parent-Teacher Reading Conference',
                      body: '$_childGradeSection reading assessment progress reviews will be coordinated by the adviser. Please wait for the confirmed schedule.',
                      isPinned: false,
                    ),
                    const SizedBox(height: 12),
                    _buildAnnouncementCard(
                      teacherName: 'SalinTinig System',
                      date: 'System update',
                      title: 'New Story Passages Available',
                      body: '5 new Level 4 reading passages have been added to $_studentFirstName\'s library for oral reading practice.',
                      isPinned: false,
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAnnouncementCard({
    required String teacherName,
    required String date,
    required String title,
    required String body,
    required bool isPinned,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isPinned ? const Color(0xFFEFF6FF) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPinned ? const Color(0xFFBFDBFE) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 14,
                    backgroundColor: const Color(0xFF1B64D8).withValues(alpha: 0.1),
                    child: Iconify(Ph.user, color: const Color(0xFF1B64D8), size: 14),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    teacherName,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                ],
              ),
              Text(
                date,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            body,
            style: GoogleFonts.inter(
              fontSize: 12,
              color: Colors.grey[700],
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        // Close drawer if open, otherwise stay on Parent Overview (Standard App Behavior)
        if (_scaffoldKey.currentState?.isDrawerOpen ?? false) {
          _scaffoldKey.currentState?.closeDrawer();
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: softBg,
        drawer: buildParentSidebarDrawer(context, activeIndex: 0),
      appBar: AppBar(
        backgroundColor: softBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
          icon: Iconify(Ph.list, color: Colors.black, size: 28),
        ),
        centerTitle: true,
        title: Row(
          mainAxisSize: MainAxisSize.min,
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
        actions: [
          IconButton(
            onPressed: _showAnnouncementsModal,
            icon: Iconify(Ph.bell, color: Colors.black, size: 28),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFF1B64D8),
          backgroundColor: Colors.white,
          onRefresh: _refreshOverview,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(16.0, 12.0, 16.0, 24.0),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Header Card (Blue Theme)
              Container(
                width: double.infinity,
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1B64D8), Color(0xFF2563EB)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF1B64D8).withValues(alpha: 0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Stack(
                  children: [
                    // Translucent watermark logo background
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
                    // Foreground Content
                    Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Iconify(Ph.student, color: Colors.white, size: 16),
                                      const SizedBox(width: 6),
                                      Flexible(
                                        child: Text(
                                          _selectedChild,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w700,
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  _childGradeSection,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF1B64D8),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Welcome, $_parentName',
                            style: GoogleFonts.inter(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Monitor $_studentFirstName\'s reading progress and Phil-IRI assessment results.',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.95),
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Quick Action Cards Row (Assessments & Student Progress)
              Row(
                children: [
                  Expanded(
                    child: _buildQuickActionCard(
                      icon: PhIcons.examBold,
                      title: 'Phil-IRI Assessment',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const ParentPhilIriAssessmentPage()),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _buildQuickActionCard(
                      icon: PhIcons.hourglassBold,
                      title: 'Student Progress',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const ParentProgressReportsPage(),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Phil-IRI Assessments Section Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Iconify(
                        PhIcons.examBold,
                        color: const Color(0xFF1B64D8),
                        size: 22,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Phil-IRI Assessments',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.black,
                          letterSpacing: -0.5,
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
                          builder: (context) => const ParentPhilIriAssessmentPage(),
                        ),
                      );
                    },
                    child: Text(
                      'See all',
                      style: GoogleFonts.inter(
                        color: const Color(0xFF1B64D8),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              if (_isLoadingAssignments)
                ParentPortalSkeletons.overview()
              else if (_assignedActivities.isEmpty)
                _buildNoAssignmentsCard()
              else
                ..._assignedActivities.take(3).expand((activity) {
                  return [
                    _buildPhilIriOverviewCard(activity),
                    const SizedBox(height: 10),
                  ];
                }),
              const SizedBox(height: 28),

              _buildAnalyticsSectionHeader(),
              const SizedBox(height: 12),
              _buildAnalyticsBreakdownCard(),
              const SizedBox(height: 28),

              if (_teacherNote.isNotEmpty) ...[
                _buildTeacherNoteCard(),
                const SizedBox(height: 28),
              ],

              // Child's Recent Activity Log
              Row(
                children: [
                  Iconify(
                    Ph.clock_counter_clockwise_bold,
                    color: const Color(0xFF1B64D8),
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Recent Reading Practice',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (_recentPracticeActivities.isEmpty)
                _buildNoRecentPracticeCard()
              else
                ..._recentPracticeActivities.take(3).expand((activity) {
                  return [
                    _buildPracticeActivityTile(activity),
                    const SizedBox(height: 10),
                  ];
                }),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    ),
  ),
);
}

  Widget _buildAnalyticsSectionHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Row(
            children: [
              Iconify(Ph.chart_bar_bold, color: const Color(0xFF1B64D8), size: 20),
              const SizedBox(width: 8),
              Text(
                'Activity & Skill Analytics',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
            ],
          ),
        ),
        TextButton(
          onPressed: () {
            Feedback.forTap(context);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const ParentProgressReportsPage(),
              ),
            );
          },
          child: Text(
            'See All',
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1B64D8),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAnalyticsBreakdownCard() {
    final rawSkills = _practiceAnalytics['skills'];
    final skills = rawSkills is Map ? rawSkills : const <String, dynamic>{};

    Map<String, dynamic> skill(String key) {
      final value = skills[key];
      return value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
    }

    return Container(
      padding: const EdgeInsets.all(18),
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
        children: [
          _buildProgressBarItem(
            label: 'Story Quiz Comprehension',
            valueText: _skillValueText(skill('comprehension')),
            progress: _skillProgress(skill('comprehension')),
            color: const Color(0xFF1B64D8),
            iconSvg: Ph.brain,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Vocabulary & Word Recognition',
            valueText: _skillValueText(skill('vocabulary')),
            progress: _skillProgress(skill('vocabulary')),
            color: const Color(0xFF059669),
            iconSvg: Ph.puzzle_piece,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Speech & Pronunciation Drill',
            valueText: _skillValueText(skill('pronunciation')),
            progress: _skillProgress(skill('pronunciation')),
            color: const Color(0xFF7C3AED),
            iconSvg: PhIcons.userSoundBold,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Grammar & Sentence Arrangement',
            valueText: _skillValueText(skill('sentence')),
            progress: _skillProgress(skill('sentence')),
            color: const Color(0xFFD97706),
            iconSvg: Ph.pencil_line,
          ),
        ],
      ),
    );
  }

  String _skillValueText(Map<String, dynamic> skill) {
    final count = (skill['count'] as num?)?.toInt() ?? 0;
    final accuracy = (skill['accuracy'] as num?)?.round() ?? 0;
    return count > 0 ? '$accuracy%' : 'No data';
  }

  double _skillProgress(Map<String, dynamic> skill) {
    final count = (skill['count'] as num?)?.toInt() ?? 0;
    final accuracy = (skill['accuracy'] as num?)?.toDouble() ?? 0;
    return count > 0 ? (accuracy / 100).clamp(0.0, 1.0).toDouble() : 0.0;
  }

  Widget _buildProgressBarItem({
    required String label,
    required String valueText,
    required double progress,
    required Color color,
    required String iconSvg,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  Iconify(iconSvg, color: color, size: 16),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              valueText,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 7,
            backgroundColor: const Color(0xFFF1F5F9),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildTeacherNoteCard() {
    final author = _teacherNoteAuthor.isNotEmpty ? _teacherNoteAuthor : 'Teacher';
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFF1B64D8).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Iconify(Ph.megaphone, color: const Color(0xFF1B64D8), size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Teacher\'s Note from $author',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1D4ED8),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _teacherNote,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF1E40AF),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPracticeActivityTile(Map<String, dynamic> activity) {
    final activityType = (activity['activityType'] ?? 'story').toString();
    final typeLabel = (activity['typeLabel'] ?? 'Practice Activity').toString();
    final score = (activity['score'] as num?)?.round() ?? 0;
    final scoreLabel = (activity['scoreLabel'] ?? 'Score').toString();
    final durationSeconds = (activity['durationSeconds'] as num?)?.round() ?? 0;
    final duration = durationSeconds > 0 ? ' - ${(durationSeconds / 60).ceil()} min' : '';

    return _buildActivityTile(
      title: (activity['title'] ?? 'Practice Activity').toString(),
      subtitle: '${_formatActivityDate(activity['occurredAt'])} - $typeLabel$duration',
      scoreText: '$score% $scoreLabel',
      scoreColor: _activityColor(activityType),
      icon: _activityIcon(activityType),
    );
  }

  Widget _buildNoRecentPracticeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        'No completed practice activities yet.',
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF64748B),
        ),
      ),
    );
  }

  Color _activityColor(String activityType) {
    if (activityType == 'story') return const Color(0xFF059669);
    if (activityType == 'pronunciation') return const Color(0xFF7C3AED);
    if (activityType == 'sentence') return const Color(0xFFD97706);
    return const Color(0xFF2563EB);
  }

  String _activityIcon(String activityType) {
    if (activityType == 'story') return Ph.book_bookmark;
    if (activityType == 'pronunciation') return Ph.microphone_stage;
    if (activityType == 'sentence') return Ph.puzzle_piece;
    return Ph.game_controller;
  }

  String _formatActivityDate(dynamic value) {
    final parsed = DateTime.tryParse((value ?? '').toString())?.toLocal();
    if (parsed == null) return 'Completed recently';
    final difference = DateTime.now().difference(parsed);
    if (difference.inMinutes < 1) return 'Completed just now';
    if (difference.inHours < 1) return 'Completed ${difference.inMinutes}m ago';
    if (difference.inHours < 24) return 'Completed ${difference.inHours}h ago';
    if (difference.inDays == 1) return 'Completed yesterday';
    if (difference.inDays < 7) return 'Completed ${difference.inDays} days ago';
    return 'Completed ${parsed.month}/${parsed.day}/${parsed.year}';
  }

  Widget _buildActivityTile({
    required String title,
    required String subtitle,
    required String scoreText,
    required Color scoreColor,
    required String icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: scoreColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Iconify(icon, color: scoreColor, size: 18),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: scoreColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              scoreText,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: scoreColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard({
    required String icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Feedback.forTap(context);
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFDBEAFE)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2563EB).withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Iconify(
                icon,
                color: const Color(0xFF2563EB),
                size: 38,
              ),
              const SizedBox(height: 10),
              Text(
                title,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhilIriOverviewCard(Map<String, dynamic> item) {
    final type = (item['assessmentType'] ?? item['type'] ?? 'oral').toString().toLowerCase();
    final isListening = type == 'listening';
    final isOral = type == 'oral';

    final typeColor = isListening
        ? const Color(0xFFD97706)
        : (isOral ? const Color(0xFF1B64D8) : const Color(0xFF10B981));
    final typeBg = isListening
        ? const Color(0xFFFEF3C7)
        : (isOral ? const Color(0xFFEFF6FF) : const Color(0xFFD1FAE5));
    final typeIcon = isListening
        ? PhIcons.earBold
        : (isOral ? PhIcons.userSoundBold : PhIcons.bookOpenBold);
    final typeLabel = isListening
        ? 'Listening'
        : (isOral ? 'Oral Reading' : 'Silent Reading');

    final passageTitle = (item['passageTitle'] ?? item['title'] ?? 'Phil-IRI Assessment').toString().trim();
    final period = (item['period'] ?? 'Pre-Test').toString().trim();
    final language = (item['language'] ?? 'Filipino').toString().trim();

    final status = (item['status'] ?? 'open').toString().toLowerCase();
    final readingLevel = (item['readingLevelResult'] ?? '').toString().trim();
    final accuracy = item['accuracyPercentage'];
    final comp = item['comprehensionScore'];
    final wpm = item['readingRateWpm'];
    final isAwaitingTeacherReview = item['isAwaitingTeacherReview'] == true
        || (isOral && (status == 'pending_review' || status == 'submitted'));
    final isCompleted = !isAwaitingTeacherReview
        && (item['isFinalResult'] == true
            || item['isCompleted'] == true
            || status == 'completed');

    // Build concise metric text summary
    final metrics = <String>[];
    if (!isAwaitingTeacherReview) {
      if (accuracy != null) metrics.add('$accuracy% Acc');
      if (comp != null) metrics.add('$comp% Comp');
      if (wpm != null && wpm > 0) metrics.add('$wpm WPM');
    }

    // Subtitle string: "Oral Reading - Pre-Test - Filipino"
    final subtitleParts = [typeLabel, period, language].where((s) => s.isNotEmpty).toList();
    final subtitle = subtitleParts.join(' - ');

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Feedback.forTap(context);
            if (isCompleted) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ParentAssessmentResultDetailPage(
                    item: item,
                    studentName: _selectedChild,
                  ),
                ),
              );
            } else {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ParentPhilIriAssessmentPage(),
                ),
              );
            }
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top row: Type icon + Titles + Level/Status badge
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: typeBg,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Iconify(typeIcon, color: typeColor, size: 22),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            passageTitle,
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            subtitle,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF64748B),
                              height: 1.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    _buildOverviewTrailingBadge(
                      status: status,
                      isCompleted: isCompleted,
                      readingLevel: readingLevel,
                      isAwaitingTeacherReview: isAwaitingTeacherReview,
                    ),
                  ],
                ),

                if (isAwaitingTeacherReview) ...[
                  const SizedBox(height: 10),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 10),
                  Text(
                    'Awaiting teacher verification. Results are not final yet.',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFFB45309),
                      height: 1.35,
                    ),
                  ),
                ],

                // Bottom row: Metrics summary + Arrow hint (if completed or has scores)
                if (metrics.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          metrics.join('   -   '),
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF475569),
                          ),
                        ),
                      ),
                      const Iconify(
                        Ph.caret_right,
                        color: Color(0xFF94A3B8),
                        size: 15,
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOverviewTrailingBadge({
    required String status,
    required bool isCompleted,
    required String readingLevel,
    required bool isAwaitingTeacherReview,
  }) {
    if (isAwaitingTeacherReview) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF3C7),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          'In Review',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: const Color(0xFFB45309),
          ),
        ),
      );
    }

    if (readingLevel.isNotEmpty) {
      final lvl = readingLevel.toLowerCase();
      final Color textColor;
      final Color bgColor;

      if (lvl.contains('indep')) {
        textColor = const Color(0xFF047857);
        bgColor = const Color(0xFFD1FAE5);
      } else if (lvl.contains('frust')) {
        textColor = const Color(0xFFB91C1C);
        bgColor = const Color(0xFFFEE2E2);
      } else {
        textColor = const Color(0xFFB45309);
        bgColor = const Color(0xFFFEF3C7);
      }

      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          readingLevel,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: textColor,
          ),
        ),
      );
    }

    if (isCompleted || status == 'completed') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFD1FAE5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          'Completed',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF047857),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'Pending',
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF1D4ED8),
        ),
      ),
    );
  }

  Widget _buildNoAssignmentsCard() => Container(
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
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFFEFF6FF),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Iconify(
                  Ph.clipboard_text_bold,
                  color: Color(0xFF1B64D8),
                  size: 28,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'No Phil-IRI Assessments Yet',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF18181B),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'No active Phil-IRI reading assessments have been assigned to $_studentFirstName by the teacher yet.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: const Color(0xFF64748B),
                height: 1.4,
              ),
            ),
          ],
        ),
      );
}

