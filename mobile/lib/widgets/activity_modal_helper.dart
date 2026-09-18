import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/activity_progress_service.dart';
import 'package:salintinig/pages/student/activities/pronunciation_challenge_page.dart';
import 'package:salintinig/pages/student/activities/vocabulary_matching_page.dart';
import 'package:salintinig/pages/student/activities/sentence_arrangement_page.dart';

/// Centralized launcher for Activity Setup Modals.
/// Can be invoked directly from [StudentOverviewPage], [ActivitiesPage], or any other page.
class ActivityModalHelper {
  // ── Pronunciation Challenge Setup & Resume ─────────────────────────────────

  static int _pronunciationXpPerWord(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 10;
      case 'hard':
        return 25;
      case 'medium':
      default:
        return 15;
    }
  }

  static Future<void> showPronunciationModal(BuildContext context) async {
    var filProgress = await ActivityProgressService.getProgress('pronunciation', 'fil');
    var enProgress = await ActivityProgressService.getProgress('pronunciation', 'en');

    if (filProgress == null && enProgress == null) {
      final genericProgress = await ActivityProgressService.getProgress('pronunciation');
      if (genericProgress != null) {
        final lang = (genericProgress['language'] as String?)?.toLowerCase().trim() ?? '';
        if (lang.startsWith('en')) {
          enProgress = genericProgress;
        } else {
          filProgress = genericProgress;
        }
      }
    }

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

            final int maxTotalXp = _pronunciationXpPerWord(effectiveDifficulty) * 5;

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
                              child: Iconify(
                                PhIcons.userSoundBold,
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
                          selectedLanguage == 'fil' ? 'ANTAS NG KASANAYAN' : 'DIFFICULTY LEVEL',
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
                          subtitle: selectedLanguage == 'fil' ? '1–2 pantig bawat salita' : '1–2 syllables per word',
                          xpBadge: '+10 XP',
                          accentColor: const Color(0xFF10B981),
                          isSelected: selectedDifficulty == 'easy',
                          onTap: () => setModalState(() => selectedDifficulty = 'easy'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'medium',
                          title: selectedLanguage == 'fil' ? 'Katamtaman' : 'Medium',
                          subtitle: selectedLanguage == 'fil' ? '2–3 pantig bawat salita' : '2–3 syllables per word',
                          xpBadge: '+15 XP',
                          accentColor: const Color(0xFFD97706),
                          isSelected: selectedDifficulty == 'medium',
                          onTap: () => setModalState(() => selectedDifficulty = 'medium'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'hard',
                          title: selectedLanguage == 'fil' ? 'Mahirap' : 'Hard',
                          subtitle: selectedLanguage == 'fil' ? '4+ pantig, mas mahahabang salita' : '4+ syllables, longer words',
                          xpBadge: '+25 XP',
                          accentColor: const Color(0xFFDC2626),
                          isSelected: selectedDifficulty == 'hard',
                          onTap: () => setModalState(() => selectedDifficulty = 'hard'),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.stars_rounded,
                                color: Color(0xFFF59E0B),
                                size: 22,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: RichText(
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
                            );
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

  // ── Vocabulary Matching Setup & Resume ──────────────────────────────────

  static int _vocabPairsCount(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 4;
      case 'hard':
        return 6;
      case 'medium':
      default:
        return 5;
    }
  }

  static int _vocabXpPerPair(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 10;
      case 'hard':
        return 25;
      case 'medium':
      default:
        return 15;
    }
  }

  static Future<void> showVocabularyModal(BuildContext context) async {
    final vocabProgress = await ActivityProgressService.getProgress('vocabulary');
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
            final bool hasOngoing = vocabProgress != null &&
                (vocabProgress['currentIndex'] as int? ?? 0) <
                    (vocabProgress['totalItems'] as int? ?? 5);
            final int activePairIdx =
                (vocabProgress?['currentIndex'] as int? ?? 0) + 1;
            final int activeTotal =
                (vocabProgress?['totalItems'] as int? ?? 5);
            final effectiveDifficulty = hasOngoing
                ? ((vocabProgress['difficulty'] as String?) ?? selectedDifficulty)
                : selectedDifficulty;

            final int pairCount = _vocabPairsCount(effectiveDifficulty);
            final int maxTotalXp = _vocabXpPerPair(effectiveDifficulty) * pairCount;

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
                              color: Color(0xFFFEF3C7),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Iconify(
                                PhIcons.equalsBold,
                                color: Color(0xFFD97706),
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
                                  'Vocabulary Matching',
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Match English words to Filipino translations!',
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

                      // Dynamic Content: Ongoing Session Card VS Difficulty Selection
                      if (hasOngoing) ...[
                        Text(
                          'ONGOING SESSION',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF94A3B8),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _buildOngoingVocabSessionCard(
                          difficulty:
                              (vocabProgress['difficulty'] as String?) ??
                              selectedDifficulty,
                          currentPairIndex: activePairIdx,
                          totalPairs: activeTotal,
                        ),
                        const SizedBox(height: 14),
                      ] else ...[
                        Text(
                          'DIFFICULTY LEVEL',
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
                          title: 'Easy',
                          subtitle: '4 simple word pairs (everyday words)',
                          xpBadge: '+10 XP/pair',
                          accentColor: const Color(0xFF10B981),
                          isSelected: selectedDifficulty == 'easy',
                          onTap: () => setModalState(() => selectedDifficulty = 'easy'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'medium',
                          title: 'Medium',
                          subtitle: '5 intermediate word pairs (common school vocab)',
                          xpBadge: '+15 XP/pair',
                          accentColor: const Color(0xFFD97706),
                          isSelected: selectedDifficulty == 'medium',
                          onTap: () => setModalState(() => selectedDifficulty = 'medium'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'hard',
                          title: 'Hard',
                          subtitle: '6 advanced word pairs (descriptive & expressive)',
                          xpBadge: '+25 XP/pair',
                          accentColor: const Color(0xFFDC2626),
                          isSelected: selectedDifficulty == 'hard',
                          onTap: () => setModalState(() => selectedDifficulty = 'hard'),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.stars_rounded,
                                color: Color(0xFFF59E0B),
                                size: 22,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: RichText(
                                  text: TextSpan(
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: const Color(0xFF334155),
                                    ),
                                    children: [
                                      const TextSpan(text: 'Earn up to '),
                                      TextSpan(
                                        text: '+$maxTotalXp XP',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                          color: Color(0xFFD97706),
                                        ),
                                      ),
                                      TextSpan(text: ' for $pairCount pairs!'),
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
                                builder: (_) => VocabularyMatchingPage(
                                  difficulty: effectiveDifficulty,
                                ),
                              ),
                            );
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
                                  ? 'Continue Practice'
                                  : 'Start Practice',
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

  // ── Sentence Arrangement Setup & Resume ──────────────────────────────────

  static int _sentenceXpPerItem(String difficulty) {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 10;
      case 'hard':
        return 25;
      case 'medium':
      default:
        return 15;
    }
  }

  static Future<void> showSentenceModal(BuildContext context) async {
    final filProgress = await ActivityProgressService.getProgress('sentence', 'fil');
    final enProgress = await ActivityProgressService.getProgress('sentence', 'en');

    String selectedLanguage = 'fil';
    if (filProgress == null && enProgress != null) {
      selectedLanguage = 'en';
    }
    String selectedDifficulty = 'easy';

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
            final int activeSentenceIdx = (activeProgress?['currentIndex'] as int? ?? 0) + 1;
            final int activeTotal = (activeProgress?['totalItems'] as int? ?? 5);
            final effectiveDifficulty = hasOngoing
                ? ((activeProgress['difficulty'] as String?) ?? selectedDifficulty)
                : selectedDifficulty;

            final int maxTotalXp = _sentenceXpPerItem(effectiveDifficulty) * 5;

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
                              color: Color(0xFFD1FAE5),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: Iconify(
                                PhIcons.hammerBold,
                                color: Color(0xFF10B981),
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
                                  'Sentence Arrangement',
                                  style: GoogleFonts.inter(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Arrange words to build complete sentences!',
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
                        _buildOngoingSentenceSessionCard(
                          language: selectedLanguage,
                          difficulty: (activeProgress['difficulty'] as String?) ?? selectedDifficulty,
                          currentSentenceIndex: activeSentenceIdx,
                          totalSentences: activeTotal,
                        ),
                        const SizedBox(height: 14),
                      ] else ...[
                        Text(
                          selectedLanguage == 'fil' ? 'ANTAS NG KASANAYAN' : 'DIFFICULTY LEVEL',
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
                          subtitle: selectedLanguage == 'fil' ? '3–4 na salita bawat pangungusap' : '3–4 words per sentence',
                          xpBadge: '+10 XP',
                          accentColor: const Color(0xFF10B981),
                          isSelected: selectedDifficulty == 'easy',
                          onTap: () => setModalState(() => selectedDifficulty = 'easy'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'medium',
                          title: selectedLanguage == 'fil' ? 'Katamtaman' : 'Medium',
                          subtitle: selectedLanguage == 'fil' ? '5–6 na salita bawat pangungusap' : '5–6 words per sentence',
                          xpBadge: '+15 XP',
                          accentColor: const Color(0xFFD97706),
                          isSelected: selectedDifficulty == 'medium',
                          onTap: () => setModalState(() => selectedDifficulty = 'medium'),
                        ),
                        const SizedBox(height: 8),
                        _buildDifficultyOptionTile(
                          keyDifficulty: 'hard',
                          title: selectedLanguage == 'fil' ? 'Mahirap' : 'Hard',
                          subtitle: selectedLanguage == 'fil' ? '7+ na salita, mas kumplikadong balangkas' : '7+ words, complex structure',
                          xpBadge: '+25 XP',
                          accentColor: const Color(0xFFDC2626),
                          isSelected: selectedDifficulty == 'hard',
                          onTap: () => setModalState(() => selectedDifficulty = 'hard'),
                        ),
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.stars_rounded,
                                color: Color(0xFF10B981),
                                size: 22,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: RichText(
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
                                          color: Color(0xFF10B981),
                                        ),
                                      ),
                                      TextSpan(
                                        text: selectedLanguage == 'fil'
                                            ? ' sa 5 pangungusap!'
                                            : ' for 5 sentences!',
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

                      // Start / Continue Button
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(ctx);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => SentenceArrangementPage(
                                  language: selectedLanguage,
                                  difficulty: effectiveDifficulty,
                                ),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Center(
                            child: Text(
                              hasOngoing
                                  ? (selectedLanguage == 'fil' ? 'Ipagpatuloy' : 'Continue Practice')
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

  // ── Common Modal Widgets ────────────────────────────────────────────────────

  static Widget _buildLanguageOptionCard({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
          children: [
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? const Color(0xFF1B64D8) : const Color(0xFF0F172A),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 6),
            Icon(
              isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
              color: isSelected ? const Color(0xFF1B64D8) : const Color(0xFFCBD5E1),
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildDifficultyOptionTile({
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
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: accentColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          xpBadge,
                          style: GoogleFonts.inter(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w700,
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
            Icon(
              isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
              color: isSelected ? accentColor : const Color(0xFFCBD5E1),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildOngoingSessionCard({
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

    final double progressRatio =
        totalWords > 0 ? (currentWordIndex - 1).clamp(0, totalWords) / totalWords : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFDBFE), width: 1.5),
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
                    language == 'fil' ? 'Kasalukuyang Sesyon' : 'In-Progress Session',
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

  static Widget _buildOngoingVocabSessionCard({
    required String difficulty,
    required int currentPairIndex,
    required int totalPairs,
  }) {
    String diffTitle;
    Color diffColor;
    switch (difficulty.toLowerCase()) {
      case 'easy':
        diffTitle = 'Easy';
        diffColor = const Color(0xFF10B981);
        break;
      case 'hard':
        diffTitle = 'Hard';
        diffColor = const Color(0xFFDC2626);
        break;
      case 'medium':
      default:
        diffTitle = 'Medium';
        diffColor = const Color(0xFFD97706);
        break;
    }

    final double progressRatio =
        totalPairs > 0 ? (currentPairIndex - 1).clamp(0, totalPairs) / totalPairs : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
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
                      color: const Color(0xFFD97706).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_circle_fill_rounded,
                      color: Color(0xFFD97706),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'In-Progress Activity',
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
                'Matching Progress',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF475569),
                ),
              ),
              Text(
                'Pair $currentPairIndex of $totalPairs',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFFD97706),
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
              backgroundColor: const Color(0xFFFEF3C7),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD97706)),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Finish the remaining pairs of words to record your XP and points!',
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

  static Widget _buildOngoingSentenceSessionCard({
    required String language,
    required String difficulty,
    required int currentSentenceIndex,
    required int totalSentences,
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

    final double progressRatio = totalSentences > 0
        ? (currentSentenceIndex - 1).clamp(0, totalSentences) / totalSentences
        : 0.0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFA7F3D0), width: 1.5),
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
                      color: const Color(0xFF10B981).withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_circle_fill_rounded,
                      color: Color(0xFF10B981),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    language == 'fil' ? 'Kasalukuyang Sesyon' : 'In-Progress Session',
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
                language == 'fil' ? 'Progreso sa Pangungusap' : 'Sentence Progress',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF475569),
                ),
              ),
              Text(
                language == 'fil'
                    ? 'Pangungusap $currentSentenceIndex ng $totalSentences'
                    : 'Sentence $currentSentenceIndex of $totalSentences',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF10B981),
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
              backgroundColor: const Color(0xFFA7F3D0),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            language == 'fil'
                ? 'Tapusin muna ang natitirang mga pangungusap upang maitala ang iyong XP at puntos!'
                : 'Finish the remaining sentences to record your XP and points!',
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
