import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/parent/parent_announcements_page.dart';
import 'package:salintinig/pages/parent/parent_badges_page.dart';
import 'package:salintinig/services/parent_portal_cache_service.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/widgets/parent_portal_skeletons.dart';

class ParentProgressReportsPage extends StatefulWidget {
  const ParentProgressReportsPage({super.key});

  @override
  State<ParentProgressReportsPage> createState() => _ParentProgressReportsPageState();
}

class _ParentProgressReportsPageState extends State<ParentProgressReportsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isLoading = true;
  String _selectedChild = 'Student';

  static const Color _primaryBlue = Color(0xFF1B64D8);
  static const Color _bgCanvas = Color(0xFFFCFAF7);

  // Populated from the parent-authorized progress payload.
  final Map<String, dynamic> _practiceAnalytics = {
    'storiesReadCount': 0,
    'storiesThisWeek': 0,
    'totalPracticeSessions': 0,
    'averageActivityScore': 0,
    'skills': <String, dynamic>{},
  };

  final List<Map<String, dynamic>> _badgesList = [];
  final List<Map<String, dynamic>> _recentActivities = [];

  @override
  void initState() {
    super.initState();
    _loadChildDetails();
  }

  Future<void> _loadChildDetails() async {
    try {
      _practiceAnalytics
        ..clear()
        ..addAll({
          'storiesReadCount': 0,
          'storiesThisWeek': 0,
          'totalPracticeSessions': 0,
          'averageActivityScore': 0,
          'skills': <String, dynamic>{},
        });
      _badgesList.clear();
      _recentActivities.clear();

      final responseData = await ParentPortalCacheService.getParentView(
        forceRefresh: _badgesList.isNotEmpty || _recentActivities.isNotEmpty,
      );
      if (responseData is Map) {
        _selectedChild = (responseData?['studentName'] ?? responseData?['studentFirstName'] ?? 'Student')
            .toString()
            .trim();
        final progress = responseData?['practiceProgress'];
        if (progress is Map) {
          final analytics = progress['analytics'];
          if (analytics is Map) {
            _practiceAnalytics
              ..clear()
              ..addAll(Map<String, dynamic>.from(analytics));
          }
          final badges = progress['badges'];
          if (badges is List) {
            _badgesList.addAll(
              badges.whereType<Map>().map((badge) => Map<String, dynamic>.from(badge)),
            );
          }
          final activities = progress['recentActivities'];
          if (activities is List) {
            _recentActivities.addAll(
              activities.whereType<Map>().map((activity) => Map<String, dynamic>.from(activity)),
            );
          }
        }
      }
    } catch (e) {
      debugPrint('[ParentProgressReports] Error loading child details: $e');
    }

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refreshProgress() async {
    await ParentPortalCacheService.invalidate();
    await _loadChildDetails();
  }

  @override
  Widget build(BuildContext context) {
    final unlockedCount = _badgesList.where((b) => b['isUnlocked'] == true).length;
    final recentBadges = _badgesList.where((b) => b['isUnlocked'] == true).toList()
      ..sort((a, b) => DateTime.tryParse((b['earnedAt'] ?? '').toString())
              ?.compareTo(DateTime.tryParse((a['earnedAt'] ?? '').toString()) ?? DateTime(1970))
          ?? 0);
    final badgePreview = recentBadges.take(4).toList();

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
            ? SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
                child: ParentPortalSkeletons.progress(),
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
                        badgeText: '${_practiceAnalytics['storiesThisWeek'] ?? 0} This Week',
                        badgeColor: const Color(0xFF059669),
                        iconSvg: PhIcons.bookOpenBold,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard(
                        title: 'Practice Sessions',
                        value: '${_practiceAnalytics['totalPracticeSessions'] ?? 0} Completed',
                        badgeText: 'Recorded Attempts',
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
                        value: '${_practiceAnalytics['averageActivityScore'] ?? 0}% Avg',
                        badgeText: 'All Activities',
                        badgeColor: const Color(0xFF7C3AED),
                        iconSvg: Ph.check_circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildMetricCard(
                        title: 'Badges Earned',
                        value: '$unlockedCount / ${_badgesList.length} Unlocked',
                        badgeText: _badgesList.isEmpty
                            ? 'No Badge Data'
                            : '${((unlockedCount / _badgesList.length) * 100).round()}% Completed',
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

                // 4. Badge preview
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: _buildSectionHeader(
                        title: 'Student Badges',
                        subtitle: '$unlockedCount of ${_badgesList.length} badges unlocked',
                        iconSvg: PhIcons.shieldBold,
                        iconColor: _primaryBlue,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Feedback.forTap(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ParentBadgesPage(
                              badges: _badgesList,
                              studentName: _selectedChild,
                            ),
                          ),
                        );
                      },
                      child: Text(
                        'See all',
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
                _buildBadgePreviewCard(badgePreview),
                const SizedBox(height: 28),

                // 5. Recent Practice Activities & Read Stories Log
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: _buildSectionHeader(
                        title: 'Recent Practice Activities',
                        subtitle: 'Showing the latest 5 completed activities',
                        iconSvg: Ph.clock_counter_clockwise_bold,
                        iconColor: _primaryBlue,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                if (_recentActivities.isEmpty)
                  _buildEmptyDataCard('No completed practice activities yet.')
                else
                  ..._recentActivities.take(5).map((act) => _buildActivityTile(act)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroBannerCard() {
    return Container(
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [_primaryBlue, Color(0xFF2563EB)],
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
            padding: const EdgeInsets.fromLTRB(20, 22, 92, 22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Reading Activity & Progress',
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 250),
                  child: Text(
                    'Track stories read, practice scores, recent activities, and earned badges.',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.white.withValues(alpha: 0.92),
                      height: 1.4,
                    ),
                  ),
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
    final rawSkills = _practiceAnalytics['skills'];
    final skills = rawSkills is Map ? rawSkills : const <String, dynamic>{};

    Map<String, dynamic> skill(String key) {
      final value = skills[key];
      return value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
    }

    final comprehension = skill('comprehension');
    final vocabulary = skill('vocabulary');
    final pronunciation = skill('pronunciation');
    final sentence = skill('sentence');

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
            valueText: _skillValueText(comprehension),
            progress: _skillProgress(comprehension),
            color: _primaryBlue,
            iconSvg: Ph.brain,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Vocabulary & Word Recognition',
            valueText: _skillValueText(vocabulary),
            progress: _skillProgress(vocabulary),
            color: const Color(0xFF059669),
            iconSvg: Ph.puzzle_piece,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Speech & Pronunciation Drill',
            valueText: _skillValueText(pronunciation),
            progress: _skillProgress(pronunciation),
            color: const Color(0xFF7C3AED),
            iconSvg: PhIcons.userSoundBold,
          ),
          const SizedBox(height: 16),
          _buildProgressBarItem(
            label: 'Grammar & Sentence Arrangement',
            valueText: _skillValueText(sentence),
            progress: _skillProgress(sentence),
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

  Widget _buildBadgePreviewCard(List<Map<String, dynamic>> badges) {
    if (badges.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        ),
        child: Text(
          'No earned badges yet.',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF64748B),
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ParentBadgesPage(
              badges: _badgesList,
              studentName: _selectedChild,
            ),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: badges.map((badge) {
            final isUnlocked = badge['isUnlocked'] == true;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: ColorFiltered(
                    colorFilter: isUnlocked
                        ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
                        : const ColorFilter.matrix([
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0, 0, 0, 0.4, 0,
                          ]),
                    child: Image.asset(
                      (badge['badgeAsset'] ?? 'assets/badges/first_step_badge.webp').toString(),
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.workspace_premium,
                        size: 44,
                        color: Color(0xFFD97706),
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildActivityTile(Map<String, dynamic> act) {
    final title = (act['title'] ?? '').toString();
    final activityType = (act['activityType'] ?? 'story').toString();
    final type = (act['typeLabel'] ?? 'Practice Activity').toString();
    final date = _formatActivityDate(act['occurredAt']);
    final durationSeconds = (act['durationSeconds'] as num?)?.round() ?? 0;
    final duration = durationSeconds > 0 ? '${(durationSeconds / 60).ceil()} min' : 'Recorded';
    final score = (act['score'] as num?)?.round() ?? 0;
    final scoreText = '$score% ${act['scoreLabel'] ?? 'Score'}';
    final scoreColor = activityType == 'story'
        ? const Color(0xFF059669)
        : activityType == 'pronunciation'
            ? const Color(0xFF7C3AED)
            : activityType == 'sentence'
                ? const Color(0xFFD97706)
                : _primaryBlue;
    final iconSvg = activityType == 'story'
        ? PhIcons.bookOpenBold
        : activityType == 'pronunciation'
            ? PhIcons.userSoundBold
            : activityType == 'sentence'
                ? Ph.puzzle_piece
                : Ph.game_controller;

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

  String _formatActivityDate(dynamic value) {
    final parsed = DateTime.tryParse((value ?? '').toString())?.toLocal();
    if (parsed == null) return 'Date unavailable';
    final difference = DateTime.now().difference(parsed);
    if (difference.inMinutes < 1) return 'Just now';
    if (difference.inHours < 1) return '${difference.inMinutes}m ago';
    if (difference.inHours < 24) return '${difference.inHours}h ago';
    if (difference.inDays == 1) return 'Yesterday';
    if (difference.inDays < 7) return '${difference.inDays} days ago';
    return '${parsed.month}/${parsed.day}/${parsed.year}';
  }

  Widget _buildEmptyDataCard(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF64748B),
        ),
      ),
    );
  }
}
