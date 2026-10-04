import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ParentBadgesPage extends StatefulWidget {
  final List<Map<String, dynamic>> badges;
  final String studentName;

  const ParentBadgesPage({
    super.key,
    required this.badges,
    required this.studentName,
  });

  @override
  State<ParentBadgesPage> createState() => _ParentBadgesPageState();
}

class _ParentBadgesPageState extends State<ParentBadgesPage> {
  static const _blue = Color(0xFF1B64D8);
  static const _softCreamBg = Color(0xFFFCFAF7);
  int _selectedFilter = 0; // 0 = All, 1 = In Progress, 2 = Unlocked
  bool _isGridView = false;

  List<Map<String, dynamic>> get _visibleBadges {
    return widget.badges.where((badge) {
      final isUnlocked = badge['isUnlocked'] == true;
      if (_selectedFilter == 1) return !isUnlocked;
      if (_selectedFilter == 2) return isUnlocked;
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final unlockedCount = widget.badges.where((badge) => badge['isUnlocked'] == true).length;
    final inProgressCount = widget.badges.length - unlockedCount;
    final totalCount = widget.badges.length;

    return Scaffold(
      backgroundColor: _softCreamBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: isTablet ? 580 : double.infinity),
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              Navigator.pop(context);
                            },
                            icon: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              size: 22,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Student Badges',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.4,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              setState(() => _isGridView = !_isGridView);
                            },
                            icon: Icon(
                              _isGridView ? Icons.view_list_rounded : Icons.grid_view_rounded,
                              size: 24,
                              color: _blue,
                            ),
                            tooltip: _isGridView ? 'Switch to List View' : 'Switch to Grid View',
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _buildProgressCard(unlockedCount, totalCount),
                            const SizedBox(height: 20),
                            SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              physics: const BouncingScrollPhysics(),
                              child: Row(
                                children: [
                                  _buildFilterChip(0, 'All ($totalCount)'),
                                  const SizedBox(width: 8),
                                  _buildFilterChip(1, 'In Progress ($inProgressCount)'),
                                  const SizedBox(width: 8),
                                  _buildFilterChip(2, 'Unlocked ($unlockedCount)'),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),
                            if (widget.badges.isEmpty || _visibleBadges.isEmpty)
                              _buildEmptyState()
                            else if (_isGridView)
                              _buildGridView(_visibleBadges, isTablet)
                            else
                              _buildListView(_visibleBadges),
                          ],
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

  Widget _buildProgressCard(int unlockedCount, int totalCount) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
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
                'Overall Progress',
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              Text(
                '$unlockedCount of $totalCount Unlocked',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: _blue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: totalCount > 0 ? unlockedCount / totalCount : 0,
              minHeight: 10,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(_blue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(int index, String label) {
    final isSelected = _selectedFilter == index;
    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        setState(() => _selectedFilter = index);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? _blue : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: isSelected ? _blue : const Color(0xFFE2E8F0)),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: _blue.withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildListView(List<Map<String, dynamic>> badges) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: badges.length,
      separatorBuilder: (context, index) => const SizedBox(height: 14),
      itemBuilder: (_, index) {
        final badge = badges[index];
        final unlocked = badge['isUnlocked'] == true;
        final progress = _progressRatio(badge);

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: unlocked ? const Color(0xFFBAE6FD) : const Color(0xFFE2E8F0),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _badgeImage(badge, unlocked, size: 76),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _title(badge),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: unlocked ? const Color(0xFFD1FAE5) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            unlocked ? 'Unlocked' : _rewardText(badge),
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: unlocked ? const Color(0xFF059669) : const Color(0xFF475569),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _description(badge),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF64748B),
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(100),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 6,
                              backgroundColor: const Color(0xFFF1F5F9),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                unlocked ? const Color(0xFF10B981) : _blue,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          _progressText(badge),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: unlocked ? const Color(0xFF10B981) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
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

  Widget _buildGridView(List<Map<String, dynamic>> badges, bool isTablet) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isTablet ? 4 : 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 0.82,
      ),
      itemCount: badges.length,
      itemBuilder: (_, index) {
        final badge = badges[index];
        final unlocked = badge['isUnlocked'] == true;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0F172A).withValues(alpha: 0.03),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _badgeImage(badge, unlocked, size: 64),
              const SizedBox(height: 12),
              Text(
                _title(badge),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: unlocked ? const Color(0xFF1E293B) : const Color(0xFF6482AD),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _progressText(badge).replaceAll(' ', ''),
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: unlocked ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _badgeImage(Map<String, dynamic> badge, bool unlocked, {required double size}) {
    return SizedBox(
      width: size,
      height: size,
      child: ColorFiltered(
        colorFilter: unlocked
            ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
            : const ColorFilter.matrix([
                0.2126, 0.7152, 0.0722, 0, 0,
                0.2126, 0.7152, 0.0722, 0, 0,
                0.2126, 0.7152, 0.0722, 0, 0,
                0, 0, 0, 0.4, 0,
              ]),
        child: Image.asset(
          _asset(badge),
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => const Icon(
            Icons.military_tech_rounded,
            size: 40,
            color: Color(0xFFF59E0B),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Text(
        'No badges in this category.',
        textAlign: TextAlign.center,
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: const Color(0xFF64748B),
        ),
      ),
    );
  }

  String _title(Map<String, dynamic> badge) {
    return (badge['title'] ?? badge['badgeName'] ?? badge['name'] ?? 'Badge').toString();
  }

  String _description(Map<String, dynamic> badge) {
    return (badge['description'] ?? 'Keep practicing to unlock this badge.').toString();
  }

  String _asset(Map<String, dynamic> badge) {
    return (badge['badgeAsset'] ?? badge['asset'] ?? 'assets/badges/first_step_badge.webp').toString();
  }

  String _rewardText(Map<String, dynamic> badge) {
    return (badge['rewardPoints'] ?? badge['reward'] ?? '+50 XP').toString();
  }

  double _progressRatio(Map<String, dynamic> badge) {
    final current = (badge['currentProgress'] as num?)?.toDouble() ?? 0;
    final maximum = (badge['maxProgress'] as num?)?.toDouble() ?? 1;
    return maximum > 0 ? (current / maximum).clamp(0.0, 1.0).toDouble() : 0;
  }

  String _progressText(Map<String, dynamic> badge) {
    final current = (badge['currentProgress'] as num?)?.round() ?? 0;
    final maximum = (badge['maxProgress'] as num?)?.round() ?? 1;
    return '$current / $maximum';
  }
}
