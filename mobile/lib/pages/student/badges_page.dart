import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/models/quest_item.dart';
import 'package:salintinig/services/badge_service.dart';

class BadgesPage extends StatefulWidget {
  final bool initialGridView;

  const BadgesPage({
    super.key,
    this.initialGridView = false,
  });

  @override
  State<BadgesPage> createState() => _BadgesPageState();
}

class _BadgesPageState extends State<BadgesPage> {
  List<QuestItem> _badgesList = BadgeService.cachedBadges;
  int _selectedFilter = 0; // 0 = All, 1 = In Progress, 2 = Unlocked
  late bool _isGridView;

  @override
  void initState() {
    super.initState();
    _isGridView = widget.initialGridView;
    _loadLocalBadgesFirst();
    BadgeService.badgeNotifier.addListener(_onBadgesUpdated);
    _loadLiveBadges();
  }

  @override
  void dispose() {
    BadgeService.badgeNotifier.removeListener(_onBadgesUpdated);
    super.dispose();
  }

  void _onBadgesUpdated() {
    if (mounted) {
      setState(() {
        _badgesList = BadgeService.cachedBadges;
      });
    }
  }

  void _loadLocalBadgesFirst() {
    final cached = BadgeService.cachedBadges;
    if (cached.isNotEmpty) {
      setState(() {
        _badgesList = cached;
      });
    }
  }

  Future<void> _loadLiveBadges() async {
    final live = await BadgeService.fetchBadges();
    if (mounted && live.isNotEmpty) {
      setState(() {
        _badgesList = live;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    final int unlockedCount = _badgesList.where((b) => b.isUnlocked).length;
    final int inProgressCount = _badgesList.where((b) => !b.isUnlocked).length;
    final int totalCount = _badgesList.length;

    final filteredBadges = _badgesList.where((b) {
      if (_selectedFilter == 1) return !b.isUnlocked;
      if (_selectedFilter == 2) return b.isUnlocked;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 580 : double.infinity,
                ),
                child: Column(
                  children: [
                    // ── App Bar Row ──
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
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
                            'Side Quests & Badges',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.4,
                            ),
                          ),
                          // View Toggle Switch (List vs Grid)
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              setState(() {
                                _isGridView = !_isGridView;
                              });
                            },
                            icon: Icon(
                              _isGridView
                                  ? Icons.view_list_rounded
                                  : Icons.grid_view_rounded,
                              size: 24,
                              color: primaryBlue,
                            ),
                            tooltip: _isGridView ? 'Switch to List View' : 'Switch to Grid View',
                          ),
                        ],
                      ),
                    ),

                    // ── Main Body Content ──
                    Expanded(
                      child: RefreshIndicator(
                        color: primaryBlue,
                        backgroundColor: Colors.white,
                        onRefresh: () async {
                          final live = await BadgeService.fetchBadges();
                          if (mounted && live.isNotEmpty) {
                            setState(() {
                              _badgesList = live;
                            });
                          }
                        },
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                          child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // ── Summary Progress Hero Card ──
                            Container(
                              padding: const EdgeInsets.all(18.0),
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
                                          color: primaryBlue,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: LinearProgressIndicator(
                                      value: totalCount > 0 ? (unlockedCount / totalCount) : 0.0,
                                      minHeight: 10,
                                      backgroundColor: const Color(0xFFE2E8F0),
                                      valueColor: const AlwaysStoppedAnimation<Color>(primaryBlue),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // ── Filter Tabs Row ──
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

                            // ── Badges List / Grid Content ──
                            _badgesList.isEmpty
                                ? (_isGridView ? _buildSkeletonGrid(isTablet) : _buildSkeletonList())
                                : filteredBadges.isEmpty
                                    ? _buildEmptyFilterState()
                                    : _isGridView
                                        ? _buildGridView(filteredBadges, isTablet)
                                        : _buildListView(filteredBadges),
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

  // ── Filter Chip Widget ──
  Widget _buildFilterChip(int index, String label) {
    final isSelected = _selectedFilter == index;
    const primaryBlue = Color(0xFF1B64D8);

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        setState(() {
          _selectedFilter = index;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 9.0),
        decoration: BoxDecoration(
          color: isSelected ? primaryBlue : Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected ? primaryBlue : const Color(0xFFE2E8F0),
            width: 1.0,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: primaryBlue.withValues(alpha: 0.25),
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

  // ── 1. List View Mode (Detailed Cards - Screenshot 1) ──
  Widget _buildListView(List<QuestItem> badges) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: badges.length,
      separatorBuilder: (context, index) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        final badge = badges[index];
        final isUnlocked = badge.isUnlocked;

        return GestureDetector(
          onTap: () {
            Feedback.forTap(context);
            _showBadgeDetailDialog(badge);
          },
          child: Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: isUnlocked ? const Color(0xFFBAE6FD) : const Color(0xFFE2E8F0),
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
                // Standalone Large Badge Graphic
                SizedBox(
                  width: 76,
                  height: 76,
                  child: ColorFiltered(
                    colorFilter: isUnlocked
                        ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
                        : const ColorFilter.matrix([
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0,      0,      0,      0.4, 0,
                          ]),
                    child: Image.asset(
                      badge.badgeAsset,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.military_tech_rounded,
                        size: 40,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),

                // Quest Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              badge.title,
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
                              color: isUnlocked ? const Color(0xFFD1FAE5) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              isUnlocked ? 'Unlocked' : badge.rewardPoints,
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: isUnlocked ? const Color(0xFF059669) : const Color(0xFF475569),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),
                      Text(
                        badge.description,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF64748B),
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Linear Progress Indicator
                      Row(
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(100),
                              child: LinearProgressIndicator(
                                value: badge.progressRatio,
                                minHeight: 6,
                                backgroundColor: const Color(0xFFF1F5F9),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  isUnlocked ? const Color(0xFF10B981) : const Color(0xFF1B64D8),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            '${badge.currentProgress} / ${badge.maxProgress}',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isUnlocked ? const Color(0xFF10B981) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── 2. Grid View Mode (Showcase Grid - Pic 3) ──
  Widget _buildGridView(List<QuestItem> badges, bool isTablet) {
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
      itemBuilder: (context, index) {
        final badge = badges[index];
        final isUnlocked = badge.isUnlocked;

        return GestureDetector(
          onTap: () {
            Feedback.forTap(context);
            _showBadgeDetailDialog(badge);
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
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
            padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 18.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SizedBox(
                  width: 64,
                  height: 64,
                  child: ColorFiltered(
                    colorFilter: isUnlocked
                        ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
                        : const ColorFilter.matrix([
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0,      0,      0,      0.4, 0,
                          ]),
                    child: Image.asset(
                      badge.badgeAsset,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.military_tech_rounded,
                        size: 40,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  badge.title,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isUnlocked ? const Color(0xFF1E293B) : const Color(0xFF6482AD),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${badge.currentProgress}/${badge.maxProgress}',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isUnlocked ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── Skeleton Loaders ──
  Widget _buildSkeletonList() {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 4,
      separatorBuilder: (context, index) => const SizedBox(height: 14),
      itemBuilder: (context, index) {
        return Container(
          height: 100,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 120,
                      height: 14,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(7),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      height: 10,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(5),
                      ),
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

  Widget _buildSkeletonGrid(bool isTablet) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isTablet ? 4 : 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: 6,
      itemBuilder: (context, index) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(height: 12),
              Container(
                width: 80,
                height: 12,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ── Empty Filter State ──
  Widget _buildEmptyFilterState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 20),
      alignment: Alignment.center,
      child: Column(
        children: [
          const Iconify(
            PhIcons.shieldBold,
            color: Color(0xFFCBD5E1),
            size: 48,
          ),
          const SizedBox(height: 12),
          Text(
            'No Badges Found',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF475569),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Keep practicing to unlock badges!',
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }

  // ── Inspection Detail Modal ──
  void _showBadgeDetailDialog(QuestItem badge) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          insetPadding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Category Pill Header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: badge.isUnlocked
                        ? const Color(0xFFDCFCE7)
                        : const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    badge.category.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: badge.isUnlocked
                          ? const Color(0xFF166534)
                          : const Color(0xFF1D4ED8),
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Badge Asset Preview (Full, unclipped graphic)
                SizedBox(
                  width: 120,
                  height: 120,
                  child: ColorFiltered(
                    colorFilter: badge.isUnlocked
                        ? const ColorFilter.mode(Colors.transparent, BlendMode.multiply)
                        : const ColorFilter.matrix([
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0,      0,      0,      0.4, 0,
                          ]),
                    child: Image.asset(
                      badge.badgeAsset,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.military_tech_rounded,
                        size: 80,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Badge Title
                Text(
                  badge.title,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 8),

                // Objective Description
                Text(
                  badge.description,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: const Color(0xFF64748B),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 20),

                // Progress Bar & Ratio
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            badge.isUnlocked ? 'Status: Completed' : 'Progress',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF334155),
                            ),
                          ),
                          Text(
                            '${badge.currentProgress} / ${badge.maxProgress}',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: badge.isUnlocked
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFF1B64D8),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: badge.progressRatio,
                          minHeight: 8,
                          backgroundColor: const Color(0xFFE2E8F0),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            badge.isUnlocked ? const Color(0xFF10B981) : const Color(0xFF1B64D8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Close Button
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B64D8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'CLOSE',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
