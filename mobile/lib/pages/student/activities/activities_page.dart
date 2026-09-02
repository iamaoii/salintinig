import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';
import 'package:salintinig/pages/student/library/side_quests_page.dart';
import 'package:salintinig/pages/student/activities/pronunciation_challenge_page.dart';
import 'package:salintinig/pages/student/activities/vocabulary_matching_page.dart';
import 'package:salintinig/pages/student/activities/sentence_arrangement_page.dart';
import 'package:salintinig/models/quest_item.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/pages/student/progress_page.dart';

class ActivitiesPage extends StatefulWidget {
  const ActivitiesPage({super.key});

  @override
  State<ActivitiesPage> createState() => _ActivitiesPageState();
}

class _ActivitiesPageState extends State<ActivitiesPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    final allQuests = BadgesData.allQuests;
    final int unlockedCount = allQuests.where((q) => q.isUnlocked).length;
    final int totalCount = allQuests.length;

    // Prioritize in-progress quests closest to completion, then unlocked ones (top 3 preview)
    final previewQuests = List<QuestItem>.from(allQuests)
      ..sort((a, b) {
        if (a.isUnlocked != b.isUnlocked) {
          return a.isUnlocked ? 1 : -1; // In-progress quests first
        }
        return b.progressRatio.compareTo(a.progressRatio); // Highest progress first
      });
    final topPreviewQuests = previewQuests.take(3).toList();

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softCreamBg,
      drawer: StudentSidebarDrawer(
        currentIndex: 3,
        onItemSelected: (index) {
          if (index == 0) {
            Navigator.pop(context);
          } else if (index == 1) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const PhilIriAssessmentPage()),
            );
          } else if (index == 2) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const LibraryPage()),
            );
          } else if (index == 4) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (context) => const ProgressPage()),
            );
          }
        },
      ),
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
                    // ── Top Bar ──
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                            icon: const Iconify(
                              Ph.list,
                              size: 28,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Activities',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.4,
                            ),
                          ),
                          const NotificationBellIconButton(),
                        ],
                      ),
                    ),

                    // ── Scrollable Body ──
                    Expanded(
                      child: RefreshIndicator(
                        color: primaryBlue,
                        backgroundColor: Colors.white,
                        onRefresh: () async {
                          await AuthService.fetchMe();
                          if (mounted) setState(() {});
                        },
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // ── Section 1: Daily Practice ──
                              Row(
                                children: [
                                  const Iconify(
                                    PhIcons.puzzlePieceBold,
                                    color: primaryBlue,
                                    size: 24,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Daily Practice',
                                    style: GoogleFonts.inter(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: const Color(0xFF0F172A),
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),

                              // Practice Card 1: Pronunciation Challenge
                              _buildPracticeCard(
                                title: 'Pronunciation\nChallenge',
                                description: 'Speak words out\nloud with Sally!',
                                iconSvg: PhIcons.userSoundBold,
                                iconColor: const Color(0xFF1B64D8),
                                iconBgColor: const Color(0xFFDBEAFE),
                                onPlayTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => const PronunciationChallengePage()),
                                  );
                                },
                              ),
                              const SizedBox(height: 14),

                              // Practice Card 2: Vocabulary Matching
                              _buildPracticeCard(
                                title: 'Vocabulary\nMatching',
                                description: 'Match words and\nlearn translations!',
                                iconSvg: PhIcons.equalsBold,
                                iconColor: const Color(0xFFD97706),
                                iconBgColor: const Color(0xFFFFEDD5),
                                onPlayTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => const VocabularyMatchingPage()),
                                  );
                                },
                              ),
                              const SizedBox(height: 14),

                              // Practice Card 3: Sentence Arrangement
                              _buildPracticeCard(
                                title: 'Sentence\nArrangement',
                                description: 'Arrange words to\nbuild sentences!',
                                iconSvg: PhIcons.hammerBold,
                                iconColor: const Color(0xFF10B981),
                                iconBgColor: const Color(0xFFD1FAE5),
                                onPlayTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (context) => const SentenceArrangementPage()),
                                  );
                                },
                              ),
                              const SizedBox(height: 28),

                              // ── Section 2: Side Quests & Achievements ──
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Iconify(
                                        PhIcons.hourglassBold,
                                        color: primaryBlue,
                                        size: 24,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Side Quests',
                                        style: GoogleFonts.inter(
                                          fontSize: 18,
                                          fontWeight: FontWeight.w800,
                                          color: const Color(0xFF0F172A),
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFE2E8F0),
                                          borderRadius: BorderRadius.circular(100),
                                        ),
                                        child: Text(
                                          '$unlockedCount / $totalCount Unlocked',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                            color: const Color(0xFF475569),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (context) => const SideQuestsPage()),
                                      );
                                    },
                                    child: Text(
                                      'See all',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: primaryBlue,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),

                              // Horizontal Quest Carousel (Top 3 active)
                              SizedBox(
                                height: 136,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  physics: const BouncingScrollPhysics(),
                                  itemCount: topPreviewQuests.length,
                                  separatorBuilder: (context, index) => const SizedBox(width: 12),
                                  itemBuilder: (context, index) {
                                    final quest = topPreviewQuests[index];
                                    return _buildModernQuestCard(quest);
                                  },
                                ),
                              ),
                              const SizedBox(height: 32),
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

  // ── Helper Widgets ──────────────────────────────────────────────────────────

  Widget _buildPracticeCard({
    required String title,
    required String description,
    required String iconSvg,
    required Color iconColor,
    required Color iconBgColor,
    required VoidCallback onPlayTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1B64D8).withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Icon Container
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: iconBgColor,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Iconify(
              iconSvg,
              size: 28,
              color: iconColor,
            ),
          ),
          const SizedBox(width: 16),

          // Title & Description
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF0F172A),
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
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
          const SizedBox(width: 12),

          // Play Button
          ElevatedButton(
            onPressed: onPlayTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B64D8),
              foregroundColor: Colors.white,
              elevation: 4,
              shadowColor: const Color(0xFF1B64D8).withValues(alpha: 0.4),
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
              minimumSize: const Size(68, 36),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            child: Text(
              'Play',
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernQuestCard(QuestItem quest) {
    final bool isUnlocked = quest.isUnlocked;

    return Container(
      width: 270,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isUnlocked ? const Color(0xFFBAE6FD) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          // Standalone Large Badge Graphic with Unlocked/Locked State
          SizedBox(
            width: 72,
            height: 72,
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
          const SizedBox(width: 12),

          // Details + Linear Progress
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        quest.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    if (isUnlocked)
                      const Icon(
                        Icons.check_circle_rounded,
                        size: 16,
                        color: Color(0xFF10B981),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  quest.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 8),

                // Progress Bar & Ratio
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(100),
                        child: LinearProgressIndicator(
                          value: quest.progressRatio,
                          minHeight: 5,
                          backgroundColor: const Color(0xFFF1F5F9),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            isUnlocked ? const Color(0xFF10B981) : const Color(0xFF1B64D8),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${quest.currentProgress}/${quest.maxProgress}',
                      style: GoogleFonts.inter(
                        fontSize: 10,
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
