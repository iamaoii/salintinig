import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/parent/parent_announcements_page.dart';
import 'package:salintinig/pages/parent/parent_phil_iri_assessment_page.dart';
import 'package:salintinig/pages/parent/parent_progress_reports_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/api_service.dart';

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
  final String _readingLevel = 'Instructional Level';
  final double _oralAccuracy = 88.5;
  final double _comprehension = 85.0;
  final int _wordsPerMinute = 82;
  bool _isLoadingAssignments = true;
  List<Map<String, dynamic>> _assignedActivities = [];

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
    final child = widget.linkedChild ?? await _restoreLinkedChild() ?? user?['linkedChild'] ?? user?['student'] ?? user;
    _childLrn = (child?['lrn'] ?? child?['studentLrn'] ?? '').toString().trim();
    await _loadChildAssignments();
  }

  Future<void> _loadChildAssignments() async {
    try {
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

      // Use the public parent-view endpoint (no JWT token needed)
      final params = StringBuffer('?lrn=$lrn');
      if (_childAccessCode.isNotEmpty) params.write('&accessCode=$_childAccessCode');

      final response = await ApiService.get('/student/assessment/parent-view$params');
      final data = response.data;
      final activities = data is Map<String, dynamic> ? data['assignedActivities'] : null;
      if (response.success && activities is List) {
        _assignedActivities = activities
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
      }
    } catch (_) {
      // Keep the empty state when the child has no assigned assessments yet.
    }
    if (mounted) setState(() => _isLoadingAssignments = false);
  }

  void _applyChildDetails() {
    final user = AuthService.currentUser?.rawUser;
    final child = widget.linkedChild ?? user?['linkedChild'] ?? user?['student'] ?? user;

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
    _parentName = child?['parentName'] ?? 'Parent';
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
    await AuthService.fetchMe();
    if (!mounted) return;
    setState(_applyChildDetails);
    // Reset loading state and reload
    setState(() => _isLoadingAssignments = true);
    await _loadChildAssignments();
  }


  void _showContactTeacherModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
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
                  Text(
                    'Contact Section Teacher',
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFFEFF6FF),
                  child: Iconify(Ph.user, color: const Color(0xFF1B64D8), size: 20),
                ),
                title: Text('Ms. Maria Santos', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                subtitle: Text('Grade 4 - FYANG Adviser', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Calling Ms. Maria Santos (+63 917 890 1234)...'), behavior: SnackBarBehavior.floating),
                  );
                },
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF1B64D8),
                  side: const BorderSide(color: Color(0xFF1B64D8)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: Iconify(Ph.phone, color: const Color(0xFF1B64D8), size: 18),
                label: Text('Call Teacher', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 10),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Opening direct message with teacher...'), behavior: SnackBarBehavior.floating),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B64D8),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: Iconify(Ph.chat_circle_text, color: Colors.white, size: 18),
                label: Text('Send Message', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
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
                      teacherName: 'Ms. Maria Santos',
                      date: 'Today, 8:30 AM',
                      title: 'Phil-IRI Post-Test Assessment Window',
                      body: '$_studentFirstName is demonstrating excellent reading fluency in Filipino stories. Please continue encouraging 15 minutes of daily practice at home before the upcoming ORT assessment window.',
                      isPinned: true,
                    ),
                    const SizedBox(height: 12),
                    _buildAnnouncementCard(
                      teacherName: 'Ms. Maria Santos',
                      date: 'July 22, 2026',
                      title: 'Parent-Teacher Reading Conference',
                      body: 'Grade 4 - FYANG quarterly reading assessment progress review is scheduled for next Friday. Please coordinate with the adviser for your preferred time slot.',
                      isPinned: false,
                    ),
                    const SizedBox(height: 12),
                    _buildAnnouncementCard(
                      teacherName: 'SalinTinig System',
                      date: 'July 18, 2026',
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
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(child: CircularProgressIndicator(color: Color(0xFF1B64D8))),
                )
              else if (_assignedActivities.isEmpty)
                _buildNoAssignmentsCard()
              else
                ..._assignedActivities.take(3).expand((activity) {
                  final type = (activity['assessmentType'] ?? activity['type'] ?? '').toString().toLowerCase();
                  final isListening = type == 'listening';
                  final isOral = type == 'oral';
                  return [
                    _buildPhilIriItemCard(
                      title: (activity['title'] ?? 'Phil-IRI Assessment').toString(),
                      statusTag: (activity['status'] ?? 'open').toString().toUpperCase(),
                      typeTag: type.toUpperCase(),
                      icon: isListening ? PhIcons.earBold : (isOral ? PhIcons.userSoundBold : PhIcons.bookOpenBold),
                      iconColor: isListening ? const Color(0xFFEAB308) : (isOral ? const Color(0xFF1B64D8) : const Color(0xFF10B981)),
                      iconBg: isListening ? const Color(0xFFFEF9C3) : (isOral ? const Color(0xFFD0E1F9) : const Color(0xFFD1FAE5)),
                      statusText: 'View Details',
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ParentPhilIriAssessmentPage())),
                    ),
                    const SizedBox(height: 10),
                  ];
                }),
              const SizedBox(height: 24),

              // Phil-IRI Status & Stats Grid
              Text(
                'Current Reading Status',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      icon: Ph.book_open,
                      title: 'Phil-IRI Level',
                      value: _readingLevel,
                      badgeColor: const Color(0xFF059669),
                      badgeText: 'Grade 4 Standard',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      icon: Ph.timer,
                      title: 'Reading Speed',
                      value: '$_wordsPerMinute WPM',
                      badgeColor: const Color(0xFF2563EB),
                      badgeText: '+5 WPM vs GST',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      icon: Ph.check_circle,
                      title: 'Oral Accuracy',
                      value: '${_oralAccuracy.toStringAsFixed(1)}%',
                      badgeColor: const Color(0xFF1B64D8),
                      badgeText: 'GST Post-Test',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      icon: Ph.brain,
                      title: 'Comprehension',
                      value: '${_comprehension.toStringAsFixed(0)}%',
                      badgeColor: const Color(0xFF7C3AED),
                      badgeText: '8 / 10 Answers',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),

              // Teacher Announcement Card
              Container(
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
                            'Teacher\'s Note from Ms. Maria Santos',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF1D4ED8),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '"Doechii is demonstrating excellent reading fluency in Filipino stories. Please continue encouraging 15 minutes of daily practice at home before the upcoming ORT assessment window."',
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
              ),
              const SizedBox(height: 22),

              // Child's Recent Activity Log
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Reading Practice',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Opening full practice history...'), behavior: SnackBarBehavior.floating),
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
              ),
              const SizedBox(height: 6),
              _buildActivityTile(
                title: 'Ang Matalinong Pagong at Matsing',
                subtitle: 'Completed Yesterday • GST Passage',
                scoreText: '92% Accuracy',
                scoreColor: const Color(0xFF059669),
                icon: Ph.book_bookmark,
              ),
              const SizedBox(height: 10),
              _buildActivityTile(
                title: 'Si Langgam at si Tipaklong',
                subtitle: 'Completed 3 days ago • Practice Game',
                scoreText: '85% Score',
                scoreColor: const Color(0xFF2563EB),
                icon: Ph.game_controller,
              ),
              const SizedBox(height: 10),
              _buildActivityTile(
                title: 'Ang Pambansang Bayani',
                subtitle: 'Completed 5 days ago • Oral Reading',
                scoreText: '88% Accuracy',
                scoreColor: const Color(0xFF1B64D8),
                icon: Ph.microphone_stage,
              ),
              const SizedBox(height: 24),

              // Contact Teacher Action Card
              Container(
                padding: const EdgeInsets.all(18),
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
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Iconify(Ph.chat_dots, color: const Color(0xFF1B64D8), size: 22),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Have questions about $_studentFirstName?',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Reach out directly to Ms. Maria Santos',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _showContactTeacherModal,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1B64D8),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        'Contact',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    ),
  ),
);
}

  Widget _buildStatCard({
    required String icon,
    required String title,
    required String value,
    required Color badgeColor,
    required String badgeText,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
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
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Iconify(icon, color: badgeColor, size: 16),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badgeText,
                  style: GoogleFonts.inter(
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: Colors.black,
            ),
          ),
        ],
      ),
    );
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

  Widget _buildPhilIriItemCard({
    required String title,
    required String statusTag,
    required String typeTag,
    required String icon,
    required Color iconColor,
    required Color iconBg,
    required String statusText,
    VoidCallback? onTap,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
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
          // Row 1: Left Circle Icon + Title
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
                alignment: Alignment.center,
                child: Iconify(icon, color: iconColor, size: 26),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                      fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF18181B),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: const Color(0xFF86EFAC)),
                          ),
                          child: Text(
                            statusTag,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF166534),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Text(
                            typeTag,
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF64748B),
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
          const SizedBox(height: 10),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          const SizedBox(height: 9),
          // Row 2: Status Indicator & Primary Blue Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Iconify(
                    Ph.check_circle_fill,
                    color: Color(0xFF10B981),
                    size: 16,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Available for Student',
                    style: GoogleFonts.inter(
                    fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: onTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B64D8),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
                child: Text(
                  statusText,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ],
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
