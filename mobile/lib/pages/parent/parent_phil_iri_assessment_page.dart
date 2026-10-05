import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/parent_sidebar_drawer.dart';
import 'package:salintinig/pages/parent/parent_assessment_result_detail_page.dart';
import 'package:salintinig/services/parent_portal_cache_service.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/widgets/parent_portal_skeletons.dart';

class ParentPhilIriAssessmentPage extends StatefulWidget {
  const ParentPhilIriAssessmentPage({super.key});

  @override
  State<ParentPhilIriAssessmentPage> createState() => _ParentPhilIriAssessmentPageState();
}

class _ParentPhilIriAssessmentPageState extends State<ParentPhilIriAssessmentPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isLoading = true;
  String _selectedTab = 'all'; // 'all', 'oral', 'listening', 'silent'
  List<Map<String, dynamic>> _allAssessments = [];
  Map<String, dynamic> _readingProfile = {
    'profileLevel': '',
    'avgAccuracy': 0,
    'avgComprehension': 0,
    'avgWpm': 0,
  };
  String _studentName = '';
  String _gradeSection = '';

  static const Color _primaryBlue = Color(0xFF1B64D8);
  static const Color _bgCanvas = Color(0xFFFCFAF7);

  @override
  void initState() {
    super.initState();
    _fetchAssessments();
  }

  Future<void> _fetchAssessments() async {
    try {
      final data = await ParentPortalCacheService.getParentView(
        forceRefresh: _allAssessments.isNotEmpty,
      );
      if (data is Map<String, dynamic>) {
        final rawList = data['assignedActivities'];
        if (rawList is List) {
          _allAssessments = rawList
              .whereType<Map>()
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        }

        if (data['readingProfile'] is Map) {
          _readingProfile = Map<String, dynamic>.from(data['readingProfile'] as Map);
        }

        _studentName = (data['studentName'] ?? data['studentFirstName'] ?? '').toString().trim();
        final grade = (data['gradeLevel'] ?? '').toString().trim();
        final section = (data['section'] ?? data['sectionName'] ?? '').toString().trim();
        if (grade.isNotEmpty || section.isNotEmpty) {
          _gradeSection = [grade, if (section.isNotEmpty) section].join(' - ');
        }
      }
    } catch (e) {
      debugPrint('[ParentPhilIri] fetch error: $e');
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> _filterByType(String type) {
    if (type == 'all') return _allAssessments;
    return _allAssessments.where((item) {
      final itemType = (item['assessmentType'] ?? item['type'] ?? '').toString().toLowerCase();
      return itemType == type;
    }).toList();
  }

  bool _isAwaitingTeacherReview(Map<String, dynamic> item) {
    final type = (item['assessmentType'] ?? item['type'] ?? '').toString().toLowerCase();
    final status = (item['status'] ?? '').toString().toLowerCase();
    return item['isAwaitingTeacherReview'] == true
        || (type == 'oral' && (status == 'pending_review' || status == 'submitted'));
  }

  bool _isFinalizedAssessment(Map<String, dynamic> item) {
    if (_isAwaitingTeacherReview(item)) return false;
    if (item['isFinalResult'] is bool) return item['isFinalResult'] == true;
    return item['isCompleted'] == true;
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _filterByType(_selectedTab);
    final activeList = filteredList.where((a) => !_isFinalizedAssessment(a)).toList();
    final completedList = filteredList.where(_isFinalizedAssessment).toList();

    final allCount = _allAssessments.length;
    final oralCount = _filterByType('oral').length;
    final listeningCount = _filterByType('listening').length;
    final silentCount = _filterByType('silent').length;

    return Scaffold(
      backgroundColor: _bgCanvas,
      key: _scaffoldKey,
      drawerEnableOpenDragGesture: false,
      drawer: buildParentSidebarDrawer(context, activeIndex: 1),
      appBar: AppBar(
        backgroundColor: _bgCanvas,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: Builder(
          builder: (scaffoldContext) => IconButton(
            onPressed: () {
              Feedback.forTap(context);
              Scaffold.of(scaffoldContext).openDrawer();
            },
            icon: Iconify(Ph.list, color: Colors.black, size: 26),
          ),
        ),
        title: Text(
          'Phil-IRI Assessment',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
        centerTitle: true,
        actions: [
          const NotificationBellIconButton(),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        color: _primaryBlue,
        backgroundColor: Colors.white,
        onRefresh: () async {
          await ParentPortalCacheService.invalidate();
          await _fetchAssessments();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Sleek Filter Pill Tabs
              Row(
                children: [
                  Expanded(
                    child: _buildTabPill(
                      id: 'all',
                      label: 'All',
                      iconSvg: PhIcons.examBold,
                      count: allCount,
                      activeColor: _primaryBlue,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildTabPill(
                      id: 'oral',
                      label: 'Oral',
                      iconSvg: PhIcons.userSoundBold,
                      count: oralCount,
                      activeColor: const Color(0xFF1B64D8),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildTabPill(
                      id: 'listening',
                      label: 'Listening',
                      iconSvg: PhIcons.earBold,
                      count: listeningCount,
                      activeColor: const Color(0xFFD97706),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: _buildTabPill(
                      id: 'silent',
                      label: 'Silent',
                      iconSvg: PhIcons.bookOpenBold,
                      count: silentCount,
                      activeColor: const Color(0xFF10B981),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // 2. Reading Profile Overview Strip (Clean, concise metrics — no heavy header)
              _buildReadingProfileStrip(),
              const SizedBox(height: 20),

              if (_isLoading)
                ParentPortalSkeletons.assessmentList()
              else ...[
                // 3. Assigned / Active Assessments Section
                if (activeList.isNotEmpty) ...[
                  _buildSectionHeader(
                    title: 'Active Assessments',
                    icon: Ph.clock_bold,
                    iconColor: _primaryBlue,
                  ),
                  const SizedBox(height: 10),
                  ...activeList.map((item) => _buildAssessmentCard(item, isCompleted: false)),
                  const SizedBox(height: 20),
                ],

                // 4. Completed Results Section
                _buildSectionHeader(
                  title: 'Assessment Results History',
                  icon: PhIcons.examBold,
                  iconColor: _primaryBlue,
                ),
                const SizedBox(height: 10),

                if (completedList.isEmpty && activeList.isEmpty)
                  _buildEmptyState()
                else if (completedList.isEmpty)
                  _buildNoResultsCard()
                else
                  ...completedList.map((item) => _buildAssessmentCard(item, isCompleted: true)),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabPill({
    required String id,
    required String label,
    required String iconSvg,
    required int count,
    required Color activeColor,
  }) {
    final isSelected = _selectedTab == id;

    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        setState(() {
          _selectedTab = id;
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? activeColor : const Color(0xFFE5E7EB),
            width: 1.2,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: activeColor.withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.02),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
        ),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Iconify(
                  iconSvg,
                  color: isSelected ? Colors.white : const Color(0xFF6B7280),
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  label,
                  maxLines: 1,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                    color: isSelected ? Colors.white : const Color(0xFF374151),
                  ),
                ),
                if (count > 0) ...[
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Colors.white.withValues(alpha: 0.25)
                          : const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '$count',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? Colors.white : const Color(0xFF4B5563),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildReadingProfileStrip() {
    final completedList = _allAssessments
        .where(_isFinalizedAssessment)
        .toList();

    int acc = 0;
    int comp = 0;
    int wpm = 0;
    bool hasCalculatedData = false;

    if (completedList.isNotEmpty) {
      final validAcc = completedList.map((a) => a['accuracyPercentage']).where((v) => v != null).cast<num>().toList();
      final validComp = completedList.map((a) => a['comprehensionScore']).where((v) => v != null).cast<num>().toList();
      final validWpm = completedList.map((a) => a['readingRateWpm']).where((v) => v != null && v > 0).cast<num>().toList();

      if (validAcc.isNotEmpty) acc = (validAcc.reduce((a, b) => a + b) / validAcc.length).round();
      if (validComp.isNotEmpty) comp = (validComp.reduce((a, b) => a + b) / validComp.length).round();
      if (validWpm.isNotEmpty) wpm = (validWpm.reduce((a, b) => a + b) / validWpm.length).round();
      hasCalculatedData = validAcc.isNotEmpty || validComp.isNotEmpty || validWpm.isNotEmpty;
    }

    if (!hasCalculatedData && _readingProfile.isNotEmpty) {
      acc = (_readingProfile['avgAccuracy'] as num?)?.round() ?? 0;
      comp = (_readingProfile['avgComprehension'] as num?)?.round() ?? 0;
      wpm = (_readingProfile['avgWpm'] as num?)?.round() ?? 0;
    }

    final displayName = _studentName.isNotEmpty ? _studentName : 'Student Reading Profile';
    final subText = _gradeSection.isNotEmpty ? _gradeSection : 'Phil-IRI Overview';

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [Color(0xFF246BDA), Color(0xFF1555C0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: _primaryBlue.withValues(alpha: 0.25),
            blurRadius: 12,
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
            padding: const EdgeInsets.all(18.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subText,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.13),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.22),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildMetricItem(
                          label: 'Oral Accuracy',
                          value: '$acc%',
                        ),
                      ),
                      Container(width: 1, height: 26, color: Colors.white.withValues(alpha: 0.3)),
                      Expanded(
                        child: _buildMetricItem(
                          label: 'Comprehension',
                          value: '$comp%',
                        ),
                      ),
                      Container(width: 1, height: 26, color: Colors.white.withValues(alpha: 0.3)),
                      Expanded(
                        child: _buildMetricItem(
                          label: 'Reading Speed',
                          value: '$wpm WPM',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricItem({
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: Colors.white.withValues(alpha: 0.85),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildSectionHeader({
    required String title,
    int? count,
    required String icon,
    required Color iconColor,
  }) {
    return Row(
      children: [
        Iconify(icon, color: iconColor, size: 22),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF0F172A),
            letterSpacing: -0.3,
          ),
        ),
        if (count != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$count',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF475569),
              ),
            ),
          ),
        ],
      ],
    );
  }  Widget _buildAssessmentCard(Map<String, dynamic> item, {required bool isCompleted}) {
    final type = (item['assessmentType'] ?? item['type'] ?? 'oral').toString().toLowerCase();
    final isListening = type == 'listening';
    final isOral = type == 'oral';

    final typeColor = isListening
        ? const Color(0xFFD97706)
        : (isOral ? _primaryBlue : const Color(0xFF10B981));
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
    final isAwaitingTeacherReview = _isAwaitingTeacherReview(item);
    final readingLevel = (item['readingLevelResult'] ?? '').toString().trim();
    final accuracy = item['accuracyPercentage'];
    final comp = item['comprehensionScore'];
    final wpm = item['readingRateWpm'];

    // Build concise metric text summary
    final metrics = <String>[];
    if (!isAwaitingTeacherReview) {
      if (accuracy != null) metrics.add('$accuracy% Acc');
      if (comp != null) metrics.add('$comp% Comp');
      if (wpm != null && wpm > 0) metrics.add('$wpm WPM');
    }

    // Subtitle string: "Oral Reading • Pre-Test • Filipino"
    final subtitleParts = [typeLabel, period, language].where((s) => s.isNotEmpty).toList();
    final subtitle = subtitleParts.join(' • ');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
          onTap: isAwaitingTeacherReview
              ? null
              : () {
                  Feedback.forTap(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ParentAssessmentResultDetailPage(
                        item: item,
                        studentName: _studentName,
                      ),
                    ),
                  );
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
                    _buildTrailingBadge(
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
                    'Teacher verification is in progress. The final result will appear after review.',
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
                          metrics.join('   •   '),
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

  /// Builds the badge on the right:
  /// - Reading level (Independent = Green, Instructional = Amber, Frustration = Red)
  /// - Or status badge if reading level is not yet finalized
  Widget _buildTrailingBadge({
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
        // Independent - Green
        textColor = const Color(0xFF047857);
        bgColor = const Color(0xFFD1FAE5);
      } else if (lvl.contains('frust')) {
        // Frustration - Red
        textColor = const Color(0xFFB91C1C);
        bgColor = const Color(0xFFFEE2E2);
      } else {
        // Instructional / Default - Amber
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

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: Iconify(Ph.article, color: _primaryBlue, size: 30),
          ),
          const SizedBox(height: 12),
          Text(
            'No Phil-IRI Assessments Yet',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Your child has no assessments assigned in this category.',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: const Color(0xFF64748B),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNoResultsCard() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Center(
        child: Text(
          'Completed teacher-evaluated results will appear here.',
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF94A3B8),
          ),
        ),
      ),
    );
  }

}
