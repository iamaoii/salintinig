import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/models/quest_item.dart';

class SideQuestsPage extends StatefulWidget {
  const SideQuestsPage({super.key});

  @override
  State<SideQuestsPage> createState() => _SideQuestsPageState();
}

class _SideQuestsPageState extends State<SideQuestsPage> {
  int _selectedFilter = 0; // 0 = All, 1 = In Progress, 2 = Completed

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    final allQuests = BadgesData.allQuests;
    final int unlockedCount = allQuests.where((q) => q.isUnlocked).length;
    final int totalCount = allQuests.length;

    final filteredQuests = allQuests.where((q) {
      if (_selectedFilter == 1) return !q.isUnlocked;
      if (_selectedFilter == 2) return q.isUnlocked;
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
                  maxWidth: isTablet ? 540 : double.infinity,
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
                          const SizedBox(width: 44), // Balanced placeholder for spacing
                        ],
                      ),
                    ),

                    // ── Main Content ──
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Summary Hero Card
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
                                    borderRadius: BorderRadius.circular(100),
                                    child: LinearProgressIndicator(
                                      value: unlockedCount / totalCount,
                                      minHeight: 8,
                                      backgroundColor: const Color(0xFFF1F5F9),
                                      valueColor: const AlwaysStoppedAnimation<Color>(primaryBlue),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Filter Tabs
                            Row(
                              children: [
                                _buildFilterChip('All ($totalCount)', 0),
                                const SizedBox(width: 8),
                                _buildFilterChip('In Progress (${totalCount - unlockedCount})', 1),
                                const SizedBox(width: 8),
                                _buildFilterChip('Unlocked ($unlockedCount)', 2),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Quests List
                            ...filteredQuests.map((quest) => _buildQuestTile(quest)),
                            const SizedBox(height: 24),
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

  Widget _buildFilterChip(String label, int index) {
    final bool isSelected = _selectedFilter == index;

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        setState(() => _selectedFilter = index);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF1B64D8) : Colors.white,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: isSelected ? const Color(0xFF1B64D8) : const Color(0xFFE2E8F0),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildQuestTile(QuestItem quest) {
    final bool isUnlocked = quest.isUnlocked;

    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
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
                quest.badgeAsset,
                fit: BoxFit.contain,
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
                        quest.title,
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
                        isUnlocked ? 'Unlocked' : quest.rewardPoints,
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
                  quest.description,
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
                          value: quest.progressRatio,
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
                      '${quest.currentProgress} / ${quest.maxProgress}',
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
    );
  }
}
