import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/parent/parent_announcements_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/widgets/user_avatar.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ParentProgressReportsPage extends StatefulWidget {
  const ParentProgressReportsPage({super.key});

  @override
  State<ParentProgressReportsPage> createState() => _ParentProgressReportsPageState();
}

class _ParentProgressReportsPageState extends State<ParentProgressReportsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isLoading = true;
  String _selectedChild = 'Student';
  String _studentFirstName = 'Student';
  String _childGradeSection = 'Grade 4';
  String _activeBadgeTab = 'all'; // 'all', 'unlocked', 'locked'

  static const Color _primaryBlue = Color(0xFF1B64D8);
  static const Color _bgCanvas = Color(0xFFFCFAF7);

  // Mocked/Derived Student Analytics & Progress Data (Non-Phil-IRI)
  final Map<String, dynamic> _practiceAnalytics = {
    'storiesReadCount': 14,
    'totalPracticeMinutes': 148,
    'averageActivityScore': 92.5,
    'badgesUnlockedCount': 8,
    'totalBadgesCount': 10,
    'quizComprehensionPct': 0.94,
    'vocabularyPct': 0.91,
    'pronunciationPct': 0.88,
    'sentenceBuilderPct': 0.90,
    'activityCompletionPct': 0.85,
  };

  final List<Map<String, dynamic>> _badgesList = [
    {
      'id': 'first_step',
      'title': 'First Step',
      'description': 'Completed first reading practice activity',
      'asset': 'assets/badges/first_step_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Aug 12, 2026',
    },
    {
      'id': 'im_a_star',
      'title': 'I\'m a Star',
      'description': 'Scored 100% on a story comprehension quiz',
      'asset': 'assets/badges/im_a_star_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Aug 15, 2026',
    },
    {
      'id': 'sounds_right',
      'title': 'Sounds Right',
      'description': 'Completed pronunciation drill with 90%+ accuracy',
      'asset': 'assets/badges/sounds_right_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Aug 20, 2026',
    },
    {
      'id': 'sentence_builder',
      'title': 'Sentence Builder',
      'description': 'Mastered sentence arrangement practice',
      'asset': 'assets/badges/sentence_builder_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Aug 24, 2026',
    },
    {
      'id': 'streak_7',
      'title': '7-Day Streak',
      'description': 'Practiced reading for 7 consecutive days',
      'asset': 'assets/badges/six_seven_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Sep 01, 2026',
    },
    {
      'id': 'both_worlds',
      'title': 'Bilingual Reader',
      'description': 'Completed stories in both Tagalog & English',
      'asset': 'assets/badges/both_worlds_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Sep 08, 2026',
    },
    {
      'id': 'streak_10',
      'title': '10-Day Streak',
      'description': 'Maintained a 10-day active reading streak',
      'asset': 'assets/badges/ten_day_streak_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Sep 18, 2026',
    },
    {
      'id': 'triple_crown',
      'title': 'Triple Crown',
      'description': 'Completed 3 practice activities in a single day',
      'asset': 'assets/badges/triple_crowned_badge.webp',
      'isUnlocked': true,
      'dateUnlocked': 'Oct 02, 2026',
    },
    {
      'id': 'night_owl',
      'title': 'Night Owl',
      'description': 'Completed evening story reading session',
      'asset': 'assets/badges/night_owl_badge.webp',
      'isUnlocked': false,
      'dateUnlocked': null,
    },
    {
      'id': 'streak_20',
      'title': '20-Day Master',
      'description': 'Reach a 20-day active reading streak milestone',
      'asset': 'assets/badges/twenty_day_streak_badge.webp',
      'isUnlocked': false,
      'dateUnlocked': null,
    },
  ];

  final List<Map<String, dynamic>> _recentActivities = [
    {
      'title': 'Ang Matalinong Pagong at Matsing',
      'type': 'Story Reading',
      'date': 'Yesterday',
      'duration': '12 mins',
      'scoreText': '95% Quiz Score',
      'scoreColor': Color(0xFF059669),
      'iconSvg': PhIcons.bookOpenBold,
    },
    {
      'title': 'Vocabulary Matching Challenge',
      'type': 'Practice Mini-Game',
      'date': '2 days ago',
      'duration': '8 mins',
      'scoreText': '100% Score',
      'scoreColor': Color(0xFF1B64D8),
      'iconSvg': Ph.game_controller,
    },
    {
      'title': 'Si Langgam at si Tipaklong',
      'type': 'Oral Reading Practice',
      'date': '4 days ago',
      'duration': '15 mins',
      'scoreText': '88% Accuracy',
      'scoreColor': Color(0xFF7C3AED),
      'iconSvg': PhIcons.userSoundBold,
    },
    {
      'title': 'Sentence Builder Drill',
      'type': 'Grammar Practice',
      'date': '5 days ago',
      'duration': '6 mins',
      'scoreText': '90% Score',
      'scoreColor': Color(0xFFD97706),
      'iconSvg': Ph.puzzle_piece,
    },
    {
      'title': 'Ang Pambansang Bayani',
      'type': 'Story Reading',
      'date': '1 week ago',
      'duration': '10 mins',
      'scoreText': '92% Quiz Score',
      'scoreColor': Color(0xFF059669),
      'iconSvg': PhIcons.bookOpenBold,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadChildDetails();
  }

  Future<void> _loadChildDetails() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final rawChildStr = prefs.getString('parent_linked_child');
      Map<String, dynamic>? childMap;
      if (rawChildStr != null && rawChildStr.isNotEmpty) {
        try {
          childMap = jsonDecode(rawChildStr) as Map<String, dynamic>;
        } catch (_) {}
      }

      final user = AuthService.currentUser?.rawUser;
      final child = childMap ?? user?['linkedChild'] ?? user?['student'] ?? user;

      final fullName = (child?['name'] ?? child?['studentName'] ?? 'Student')
          .toString()
          .trim();
      final nameParts = fullName.isEmpty || fullName == 'Student'
          ? <String>[]
          : fullName.split(RegExp(r'\s+'));
      _studentFirstName = (child?['studentFirstName'] ?? child?['firstName'] ??
              (nameParts.isNotEmpty ? nameParts.first : 'Student'))
          .toString();
      final lastName = (child?['lastName'] ?? child?['last_name'] ??
              (nameParts.length > 1 ? nameParts.last : ''))
          .toString()
          .trim();
      _selectedChild = lastName.isNotEmpty ? '$_studentFirstName $lastName' : _studentFirstName;

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
    } catch (e) {
      debugPrint('[ParentProgressReports] Error loading child details: $e');
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refreshProgress() async {
    await _loadChildDetails();
  }

  List<Map<String, dynamic>> _filteredBadges() {
    if (_activeBadgeTab == 'unlocked') {
      return _badgesList.where((b) => b['isUnlocked'] == true).toList();
    } else if (_activeBadgeTab == 'locked') {
      return _badgesList.where((b) => b['isUnlocked'] == false).toList();
    }
    return _badgesList;
  }

  @override
  Widget build(BuildContext context) {
    final filteredBadges = _filteredBadges();
    final unlockedCount = _badgesList.where((b) => b['isUnlocked'] == true).length;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: _bgCanvas,
      drawer: buildParentSidebarDrawer(context, activeIndex: 2),
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
        centerTitle: true,
        title: Text(
          'Student Progress',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
        actions: const [
          NotificationBellIconButton(),
          SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: _primaryBlue),
              )
            : RefreshIndicator(
                color: _primaryBlue,
                backgroundColor: Colors.white,
                onRefresh: _refreshProgress,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 1. Sleek Hero Banner Card
                      _buildHeroBannerCard(),
                const SizedBox(height: 20),

                // 2. Practice Analytics Metrics Grid (4 Cards)
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard(
                        title: 'Stories Read',
                        value: '${_practiceAnalytics['storiesReadCount']} Completed',
                        badgeText: '3 This Week',
                        badgeColor: const Color(0xFF059669),
                        iconSvg: PhIcons.bookOpenBold,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard(
                        title: 'Practice Time',
                        value: '${_practiceAnalytics['totalPracticeMinutes']} mins',
                        badgeText: 'Avg 21m/day',
                        badgeColor: _primaryBlue,
                        iconSvg: Ph.clock,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildMetricCard(
                        title: 'Activity Score',
                        value: '${_practiceAnalytics['averageActivityScore']}% Avg',
                        badgeText: 'High Accuracy',
                        badgeColor: const Color(0xFF7C3AED),
                        iconSvg: Ph.check_circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard(
                        title: 'Badges Earned',
                        value: '$unlockedCount / ${_badgesList.length} Unlocked',
                        badgeText: '${((unlockedCount / _badgesList.length) * 100).round()}% Completed',
                        badgeColor: const Color(0xFFD97706),
                        iconSvg: Ph.trophy,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // 3. Activity Performance Analytics Section
                _buildSectionHeader(
                  title: 'Activity & Skill Analytics',
                  subtitle: 'Overall practice performance across reading exercises',
                  iconSvg: Ph.chart_bar_bold,
                  iconColor: _primaryBlue,
                ),
                const SizedBox(height: 12),
                _buildAnalyticsBreakdownCard(),
                const SizedBox(height: 28),

                // 4. Earned Badges & Achievements Showcase
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSectionHeader(
                      title: 'Earned Badges',
                      subtitle: '$unlockedCount of ${_badgesList.length} badges unlocked',
                      iconSvg: Ph.medal_bold,
                      iconColor: const Color(0xFFD97706),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$unlockedCount Unlocked',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFFB45309),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildBadgeFilterTabs(),
                const SizedBox(height: 14),
                _buildBadgesGrid(filteredBadges),
                const SizedBox(height: 28),

                // 5. Recent Practice Activities & Read Stories Log
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSectionHeader(
                      title: 'Recent Practice Activities',
                      subtitle: 'Recent story reads and practice exercises',
                      iconSvg: Ph.clock_counter_clockwise_bold,
                      iconColor: _primaryBlue,
                    ),
                    TextButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Showing all student practice activities...'),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                      child: Text(
                        'See All',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _primaryBlue,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ..._recentActivities.map((act) => _buildActivityTile(act)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroBannerCard() {
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          colors: [_primaryBlue, Color(0xFF195ECB)],
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
            right: -10,
            top: -10,
            bottom: -10,
            width: 180,
            child: Opacity(
              opacity: 0.18,
              child: Image.asset(
                'assets/teacher page/logo_bg.webp',
                fit: BoxFit.contain,
                alignment: Alignment.centerRight,
              ),
            ),
          ),
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
                          color: _primaryBlue,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Student Activity & Progress',
                            style: GoogleFonts.inter(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.4,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Track $_studentFirstName\'s stories read, practice performance analytics, and earned badges.',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white.withValues(alpha: 0.92),
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    InitialsAvatar(
                      name: _selectedChild,
                      radius: 24,
                      fontSize: 16,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String badgeText,
    required Color badgeColor,
    required String iconSvg,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
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
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Iconify(iconSvg, color: badgeColor, size: 16),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
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
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    String? subtitle,
    required String iconSvg,
    required Color iconColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Iconify(iconSvg, color: iconColor, size: 20),
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
          ],
        ),
        if (subtitle != null && subtitle.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildAnalyticsBreakdownCard() {
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
            valueText: '${(_practiceAnalytics['quizComprehensionPct'] * 100).round()}%',
            progress: _practiceAnalytics['quizComprehensionPct'],
            color: _primaryBlue,
            iconSvg: Ph.brain,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Vocabulary & Word Recognition',
            valueText: '${(_practiceAnalytics['vocabularyPct'] * 100).round()}%',
            progress: _practiceAnalytics['vocabularyPct'],
            color: const Color(0xFF059669),
            iconSvg: Ph.puzzle_piece,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Speech & Pronunciation Drill',
            valueText: '${(_practiceAnalytics['pronunciationPct'] * 100).round()}%',
            progress: _practiceAnalytics['pronunciationPct'],
            color: const Color(0xFF7C3AED),
            iconSvg: PhIcons.userSoundBold,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Grammar & Sentence Arrangement',
            valueText: '${(_practiceAnalytics['sentenceBuilderPct'] * 100).round()}%',
            progress: _practiceAnalytics['sentenceBuilderPct'],
            color: const Color(0xFFD97706),
            iconSvg: Ph.pencil_line,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Practice Activity Completion',
            valueText: '${(_practiceAnalytics['activityCompletionPct'] * 100).round()}%',
            progress: _practiceAnalytics['activityCompletionPct'],
            color: const Color(0xFF0D9488),
            iconSvg: Ph.check_circle,
          ),
        ],
      ),
    );
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
            Row(
              children: [
                Iconify(iconSvg, color: color, size: 16),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1E293B),
                  ),
                ),
              ],
            ),
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

  Widget _buildBadgeFilterTabs() {
    return Row(
      children: [
        _buildBadgePill(id: 'all', label: 'All Badges (${_badgesList.length})'),
        const SizedBox(width: 8),
        _buildBadgePill(
          id: 'unlocked',
          label: 'Unlocked (${_badgesList.where((b) => b['isUnlocked'] == true).length})',
        ),
        const SizedBox(width: 8),
        _buildBadgePill(
          id: 'locked',
          label: 'In Progress (${_badgesList.where((b) => b['isUnlocked'] == false).length})',
        ),
      ],
    );
  }

  Widget _buildBadgePill({required String id, required String label}) {
    final isSelected = _activeBadgeTab == id;

    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        setState(() => _activeBadgeTab = id);
      },
      borderRadius: BorderRadius.circular(20),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? _primaryBlue : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? _primaryBlue : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildBadgesGrid(List<Map<String, dynamic>> badges) {
    if (badges.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        alignment: Alignment.center,
        child: Text(
          'No badges found in this category.',
          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1.15,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: badges.length,
      itemBuilder: (context, index) {
        final badge = badges[index];
        final isUnlocked = badge['isUnlocked'] == true;

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isUnlocked ? Colors.white : const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isUnlocked ? const Color(0xFFFCD34D) : const Color(0xFFE2E8F0),
              width: isUnlocked ? 1.2 : 1,
            ),
            boxShadow: isUnlocked
                ? [
                    BoxShadow(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : [],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ColorFiltered(
                colorFilter: isUnlocked
                    ? const ColorFilter.mode(Colors.transparent, BlendMode.dst)
                    : const ColorFilter.matrix([
                        0.2126, 0.7152, 0.0722, 0, 0,
                        0.2126, 0.7152, 0.0722, 0, 0,
                        0.2126, 0.7152, 0.0722, 0, 0,
                        0,      0,      0,      0.4, 0,
                      ]),
                child: Image.asset(
                  badge['asset'],
                  width: 48,
                  height: 48,
                  fit: BoxFit.contain,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                badge['title'],
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isUnlocked ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                badge['description'],
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF64748B),
                  height: 1.2,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActivityTile(Map<String, dynamic> act) {
    final title = (act['title'] ?? '').toString();
    final type = (act['type'] ?? '').toString();
    final date = (act['date'] ?? '').toString();
    final duration = (act['duration'] ?? '').toString();
    final scoreText = (act['scoreText'] ?? '').toString();
    final scoreColor = (act['scoreColor'] as Color?) ?? _primaryBlue;
    final iconSvg = (act['iconSvg'] as String?) ?? PhIcons.bookOpenBold;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.015),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: scoreColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Iconify(iconSvg, color: scoreColor, size: 20),
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
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '$type • $date • $duration',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: scoreColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              scoreText,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: scoreColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
