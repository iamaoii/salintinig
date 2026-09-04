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
import 'package:salintinig/services/activity_progress_service.dart';
import 'package:salintinig/pages/student/progress_page.dart';

class ActivitiesPage extends StatefulWidget {
  const ActivitiesPage({super.key});

  @override
  State<ActivitiesPage> createState() => _ActivitiesPageState();
}

class _ActivitiesPageState extends State<ActivitiesPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _pronunciationInProgress = false;
  int _pronunciationCurrentIndex = 0;
  int _pronunciationTotalItems = 5;

  @override
  void initState() {
    super.initState();
    _checkActiveSessionsQuiet();
    ActivityProgressService.progressChangeNotifier.addListener(_checkActiveSessionsQuiet);
  }

  @override
  void dispose() {
    ActivityProgressService.progressChangeNotifier.removeListener(_checkActiveSessionsQuiet);
    super.dispose();
  }

  void _checkActiveSessionsQuiet() {
    ActivityProgressService.getProgress('pronunciation').then((data) {
      if (mounted) {
        final bool has = data != null;
        final int currentIdx = (data?['currentIndex'] as int?) ?? 0;
        final int total = (data?['totalItems'] as int?) ?? 5;

        if (has != _pronunciationInProgress ||
            currentIdx != _pronunciationCurrentIndex ||
            total != _pronunciationTotalItems) {
          setState(() {
            _pronunciationInProgress = has;
            _pronunciationCurrentIndex = currentIdx;
            _pronunciationTotalItems = total > 0 ? total : 5;
          });
        }
      }
    });
  }

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
                                iconSvg: PhIcons.userSoundRegular,
                                iconColor: const Color(0xFF1B64D8),
                                iconBgColor: const Color(0xFFDBEAFE),
                                isInProgress: _pronunciationInProgress,
                                currentIndex: _pronunciationCurrentIndex,
                                totalItems: _pronunciationTotalItems,
                                onPlayTap: () => _showPronunciationMissionSetup(context),
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
    bool isInProgress = false,
    int currentIndex = 0,
    int totalItems = 10,
  }) {
    const primaryBlue = Color(0xFF1B64D8);
    final buttonText = isInProgress ? 'Continue' : 'Play';
    final double progressValue = totalItems > 0
        ? ((currentIndex + 1) / totalItems).clamp(0.0, 1.0)
        : 0.0;

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

          // Title & Description & Progress
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
                if (isInProgress) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(100),
                          child: LinearProgressIndicator(
                            value: progressValue,
                            minHeight: 5,
                            backgroundColor: const Color(0xFFF1F5F9),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              primaryBlue,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${currentIndex + 1}/$totalItems',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: primaryBlue,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Play / Continue Button (Shadowless & Clean Blue)
          ElevatedButton(
            onPressed: onPlayTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryBlue,
              foregroundColor: Colors.white,
              elevation: 0,
              shadowColor: Colors.transparent,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              minimumSize: const Size(68, 36),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            child: Text(
              buttonText,
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

  // ── Pronunciation Challenge Setup & Resume ─────────────────────────────────

  /// Returns the XP awarded per word for a given difficulty tier.
  /// Kept in sync with `_baseXpPerWord` in [PronunciationChallengePage].
  static int _xpPerWord(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 10;
      case 'hard': return 25;
      case 'medium':
      default:     return 15;
    }
  }

  void _showPronunciationMissionSetup(BuildContext context) async {
    // Check initial language active session
    final filProgress = await ActivityProgressService.getProgress('pronunciation', 'fil');
    final enProgress = await ActivityProgressService.getProgress('pronunciation', 'en');

    String selectedLanguage = 'fil';
    if (filProgress == null && enProgress != null) {
      selectedLanguage = 'en';
    }
    String selectedDifficulty = 'medium';

    if (!context.mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (sheetContext, setModalState) {
            final activeProgress = selectedLanguage == 'fil' ? filProgress : enProgress;
            final bool hasOngoing = activeProgress != null &&
                (activeProgress['currentIndex'] as int? ?? 0) < (activeProgress['totalItems'] as int? ?? 5);
            final int activeWordIdx = (activeProgress?['currentIndex'] as int? ?? 0) + 1;
            final int activeTotal = (activeProgress?['totalItems'] as int? ?? 5);
            final effectiveDifficulty = hasOngoing
                ? ((activeProgress['difficulty'] as String?) ?? selectedDifficulty)
                : selectedDifficulty;

            final int maxTotalXp = _xpPerWord(effectiveDifficulty) * 5;

            return SafeArea(
              child: Padding(
                padding: EdgeInsets.only(
                  left: 22,
                  right: 22,
                  top: 14,
                  bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
                ),
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Drag handle
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Header
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 46,
                            height: 46,
                            decoration: const BoxDecoration(
                              color: Color(0xFFDBEAFE),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Icon(
                                Icons.record_voice_over_outlined,
                                color: Color(0xFF1B64D8),
                                size: 24,
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Pronunciation Challenge',
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Speak words out loud with Sally!',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF64748B),
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(ctx),
                            icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // 1. Language Selection
                      Text(
                        selectedLanguage == 'fil' ? 'PUMILI NG WIKA' : 'SELECT LANGUAGE',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF94A3B8),
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _buildLanguageOptionCard(
                              label: 'Filipino',
                              isSelected: selectedLanguage == 'fil',
                              onTap: () {
                                setModalState(() => selectedLanguage = 'fil');
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildLanguageOptionCard(
                              label: 'English',
                              isSelected: selectedLanguage == 'en',
                              onTap: () {
                                setModalState(() => selectedLanguage = 'en');
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 22),

                      // 2. Dynamic Content: Ongoing Session Card VS Difficulty Selection
                      if (hasOngoing) ...[
                        Text(
                          selectedLanguage == 'fil' ? 'KASALUKUYANG SESYON' : 'ONGOING SESSION',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF94A3B8),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _buildOngoingSessionCard(
                          language: selectedLanguage,
                          difficulty: (activeProgress['difficulty'] as String?) ?? selectedDifficulty,
                          currentWordIndex: activeWordIdx,
                          totalWords: activeTotal,
                        ),
                        const SizedBox(height: 14),
                      ] else ...[
                        Text(
                          selectedLanguage == 'fil' ? 'ANTAS NG HIRAP' : 'DIFFICULTY LEVEL',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF94A3B8),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'easy',
                          title: selectedLanguage == 'fil' ? 'Madali' : 'Easy',
                          subtitle: selectedLanguage == 'fil'
                              ? '1–3 pantig • Para sa simula'
                              : '1–3 syllables • Great for beginners',
                          xpBadge: selectedLanguage == 'fil' ? '+10 XP bawat salita' : '+10 XP per word',
                          accentColor: const Color(0xFF10B981),
                          isSelected: selectedDifficulty == 'easy',
                          onTap: () => setModalState(() => selectedDifficulty = 'easy'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'medium',
                          title: selectedLanguage == 'fil' ? 'Katamtaman' : 'Medium',
                          subtitle: selectedLanguage == 'fil'
                              ? '3–4 pantig • Karaniwang salita'
                              : '3–4 syllables • Standard vocabulary',
                          xpBadge: selectedLanguage == 'fil' ? '+15 XP bawat salita' : '+15 XP per word',
                          accentColor: const Color(0xFFD97706),
                          isSelected: selectedDifficulty == 'medium',
                          onTap: () => setModalState(() => selectedDifficulty = 'medium'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'hard',
                          title: selectedLanguage == 'fil' ? 'Mahirap' : 'Hard',
                          subtitle: selectedLanguage == 'fil'
                              ? '4–6 pantig • Mahahabang salita'
                              : '4–6 syllables • Advanced vocabulary',
                          xpBadge: selectedLanguage == 'fil' ? '+25 XP bawat salita' : '+25 XP per word',
                          accentColor: const Color(0xFFDC2626),
                          isSelected: selectedDifficulty == 'hard',
                          onTap: () => setModalState(() => selectedDifficulty = 'hard'),
                        ),
                        const SizedBox(height: 18),

                        // 3. Potential Reward Callout
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.stars_rounded,
                                color: Color(0xFF1B64D8),
                                size: 22,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: RichText(
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  text: TextSpan(
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: const Color(0xFF334155),
                                    ),
                                    children: [
                                      TextSpan(
                                        text: selectedLanguage == 'fil'
                                            ? 'Kumita ng hanggang '
                                            : 'Earn up to ',
                                      ),
                                      TextSpan(
                                        text: '+$maxTotalXp XP',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFF1B64D8),
                                        ),
                                      ),
                                      TextSpan(
                                        text: selectedLanguage == 'fil'
                                            ? ' sa 5 salita!'
                                            : ' for 5 words!',
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Start Button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => PronunciationChallengePage(
                                  language: selectedLanguage,
                                  difficulty: effectiveDifficulty,
                                ),
                              ),
                            ).then((_) => _checkActiveSessionsQuiet());
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1B64D8),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Center(
                            child: Text(
                              hasOngoing
                                  ? (selectedLanguage == 'fil' ? 'Ipagpatuloy' : 'Continue')
                                  : (selectedLanguage == 'fil'
                                      ? 'Simulan ang Pagsasanay'
                                      : 'Start Practice'),
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildLanguageOptionCard({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFF1B64D8) : const Color(0xFFE2E8F0),
            width: isSelected ? 2.0 : 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF1B64D8).withValues(alpha: 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: isSelected ? const Color(0xFF1B64D8) : const Color(0xFF0F172A),
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle_rounded,
                color: Color(0xFF1B64D8),
                size: 20,
              )
            else
              const Icon(
                Icons.radio_button_unchecked_rounded,
                color: Color(0xFFCBD5E1),
                size: 20,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDifficultyOptionTile({
    required String keyDifficulty,
    required String title,
    required String subtitle,
    required String xpBadge,
    required Color accentColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        decoration: BoxDecoration(
          color: isSelected ? accentColor.withValues(alpha: 0.07) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? accentColor : const Color(0xFFE2E8F0),
            width: isSelected ? 2.0 : 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: accentColor,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.inter(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: accentColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          xpBadge,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: accentColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOngoingSessionCard({
    required String language,
    required String difficulty,
    required int currentWordIndex,
    required int totalWords,
  }) {
    String diffTitle;
    Color diffColor;
    switch (difficulty.toLowerCase()) {
      case 'easy':
        diffTitle = language == 'fil' ? 'Madali' : 'Easy';
        diffColor = const Color(0xFF10B981);
        break;
      case 'hard':
        diffTitle = language == 'fil' ? 'Mahirap' : 'Hard';
        diffColor = const Color(0xFFDC2626);
        break;
      case 'medium':
      default:
        diffTitle = language == 'fil' ? 'Katamtaman' : 'Medium';
        diffColor = const Color(0xFFD97706);
        break;
    }

    final double progressRatio = totalWords > 0 ? (currentWordIndex - 1).clamp(0, totalWords) / totalWords : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF93C5FD), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1B64D8).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_circle_fill_rounded,
                      color: Color(0xFF1B64D8),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    language == 'fil' ? 'Nakasimulang Gawain' : 'In-Progress Activity',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                decoration: BoxDecoration(
                  color: diffColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: diffColor.withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: diffColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      diffTitle,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: diffColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                language == 'fil' ? 'Progreso sa Pagbigkas' : 'Speaking Progress',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF475569),
                ),
              ),
              Text(
                language == 'fil'
                    ? 'Salita $currentWordIndex ng $totalWords'
                    : 'Word $currentWordIndex of $totalWords',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF1B64D8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(100),
            child: LinearProgressIndicator(
              value: progressRatio,
              minHeight: 8,
              backgroundColor: const Color(0xFFDBEAFE),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1B64D8)),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            language == 'fil'
                ? 'Tapusin muna ang natitirang mga salita upang maitala ang iyong XP at puntos!'
                : 'Finish the remaining words to record your XP and points!',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: const Color(0xFF64748B),
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}
