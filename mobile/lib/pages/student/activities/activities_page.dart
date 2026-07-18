import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';
import 'package:salintinig/pages/student/library/side_quests_page.dart';
import 'package:salintinig/pages/student/activities/pronunciation_challenge_page.dart';
import 'package:salintinig/pages/student/activities/vocabulary_matching_page.dart';
import 'package:salintinig/pages/student/activities/sentence_arrangement_page.dart';
import 'package:salintinig/pages/student/progress_page.dart';

class ActivitiesPage extends StatefulWidget {
  const ActivitiesPage({super.key});

  @override
  State<ActivitiesPage> createState() => _ActivitiesPageState();
}

class _ActivitiesPageState extends State<ActivitiesPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  int _selectedTab = 0; // 0 = Practice Activities, 1 = Side Quests


  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFFCFAF7);

    // Determine diagnostics for Pronunciation Challenge
    final bool oralDone = PhilIriAssessmentPage.isOralReadingDone;
    final int oralScore = PhilIriAssessmentPage.oralReadingScore;
    final String pronTag;
    final Color pronTagBg;
    final Color pronTagText;
    final String pronReason;

    if (oralDone) {
      if (oralScore < 3) {
        pronTag = 'Highly Recommended';
        pronTagBg = const Color(0xFFFEE2E2);
        pronTagText = const Color(0xFFEF4444);
        pronReason = 'Struggles in Oral Reading ($oralScore/3)';
      } else {
        pronTag = 'General Practice';
        pronTagBg = const Color(0xFFE2E8F0);
        pronTagText = const Color(0xFF475569);
        pronReason = 'Excellent Oral Score ($oralScore/3)';
      }
    } else {
      pronTag = 'Diagnostic Pending';
      pronTagBg = const Color(0xFFFEF3C7);
      pronTagText = const Color(0xFFD97706);
      pronReason = 'Pending Oral Assessment';
    }

    // Determine diagnostics for Vocabulary Matching
    final bool silentDone = PhilIriAssessmentPage.isSilentReadingDone;
    final int silentScore = PhilIriAssessmentPage.silentReadingScore;
    final bool listeningDone = PhilIriAssessmentPage.isListeningDone;
    final int listeningScore = PhilIriAssessmentPage.listeningScore;
    
    final String vocabTag;
    final Color vocabTagBg;
    final Color vocabTagText;
    final String vocabReason;

    if (silentDone || listeningDone) {
      bool struggles = false;
      String details = '';
      if (silentDone && silentScore < 3) {
        struggles = true;
        details = 'Silent Reading ($silentScore/3)';
      } else if (listeningDone && listeningScore < 4) {
        struggles = true;
        details = 'Listening Score ($listeningScore/5)';
      }
      
      if (struggles) {
        vocabTag = 'Highly Recommended';
        vocabTagBg = const Color(0xFFFEE2E2);
        vocabTagText = const Color(0xFFEF4444);
        vocabReason = 'Struggles in $details';
      } else {
        vocabTag = 'General Practice';
        vocabTagBg = const Color(0xFFE2E8F0);
        vocabTagText = const Color(0xFF475569);
        vocabReason = 'Comprehension scores are good';
      }
    } else {
      vocabTag = 'Diagnostic Pending';
      vocabTagBg = const Color(0xFFFEF3C7);
      vocabTagText = const Color(0xFFD97706);
      vocabReason = 'Pending Reading Assessment';
    }

    // Determine diagnostics for Sentence Arrangement
    final String sentenceTag;
    final Color sentenceTagBg;
    final Color sentenceTagText;
    final String sentenceReason;

    if (silentDone) {
      if (silentScore < 3) {
        sentenceTag = 'Recommended';
        sentenceTagBg = const Color(0xFFDBEAFE);
        sentenceTagText = const Color(0xFF1B64D8);
        sentenceReason = 'Improve sentence comprehension';
      } else {
        sentenceTag = 'General Practice';
        sentenceTagBg = const Color(0xFFE2E8F0);
        sentenceTagText = const Color(0xFF475569);
        sentenceReason = 'Comprehension score is perfect';
      }
    } else {
      sentenceTag = 'Diagnostic Pending';
      sentenceTagBg = const Color(0xFFFEF3C7);
      sentenceTagText = const Color(0xFFD97706);
      sentenceReason = 'Pending Library Reading Quiz';
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softCreamBg,
      drawer: StudentSidebarDrawer(
        currentIndex: 3, // Activities index
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
          } else if (index != 3) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Navigation to item $index tapped.', style: GoogleFonts.inter()),
                duration: const Duration(seconds: 1),
              ),
            );
          }
        },
      ),
      body: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity != null && details.primaryVelocity! > 200) {
            _scaffoldKey.currentState?.openDrawer();
          }
        },
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final isTablet = constraints.maxWidth > 600;

              return Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: isTablet ? 520 : double.infinity,
                  ),
                  child: Column(
                    children: [
                      // ── Header Row ──────────────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Hamburger Menu Icon (triggers Drawer)
                            IconButton(
                              onPressed: () {
                                _scaffoldKey.currentState?.openDrawer();
                              },
                              icon: const Iconify(
                                Ph.list,
                                size: 28,
                                color: Colors.black,
                              ),
                            ),
                            // Center Title
                            Text(
                              'Activities',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            // Symmetrical spacer to center the title
                            const SizedBox(width: 48),
                          ],
                        ),
                      ),

                      // ── Tab Toggle Buttons ──────────────────────────────
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                        child: Container(
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9), // Light grey/slate background
                            borderRadius: BorderRadius.circular(25),
                          ),
                          child: Stack(
                            children: [
                              // Sliding background indicator
                              AnimatedAlign(
                                alignment: _selectedTab == 0
                                    ? Alignment.centerLeft
                                    : Alignment.centerRight,
                                duration: const Duration(milliseconds: 250),
                                curve: Curves.easeInOut,
                                child: FractionallySizedBox(
                                  widthFactor: 0.5,
                                  child: Container(
                                    margin: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [
                                          Color(0xFF1B64D8), // primaryBlue
                                          Color(0xFF3B82F6), // lighter blue
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      borderRadius: BorderRadius.circular(21),
                                    ),
                                  ),
                                ),
                              ),
                              // Interactive buttons
                              Row(
                                children: [
                                  Expanded(
                                    child: GestureDetector(
                                      behavior: HitTestBehavior.opaque,
                                      onTap: () {
                                        setState(() {
                                          _selectedTab = 0;
                                        });
                                      },
                                      child: Center(
                                        child: AnimatedDefaultTextStyle(
                                          duration: const Duration(milliseconds: 200),
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: _selectedTab == 0
                                                ? Colors.white
                                                : const Color(0xFF64748B),
                                          ),
                                          child: const Text('Practice Activities'),
                                        ),
                                      ),
                                    ),
                                  ),
                                  Expanded(
                                    child: GestureDetector(
                                      behavior: HitTestBehavior.opaque,
                                      onTap: () {
                                        setState(() {
                                          _selectedTab = 1;
                                        });
                                      },
                                      child: Center(
                                        child: AnimatedDefaultTextStyle(
                                          duration: const Duration(milliseconds: 200),
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: _selectedTab == 1
                                                ? Colors.white
                                                : const Color(0xFF64748B),
                                          ),
                                          child: const Text('Side Quests'),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),

                      // ── Scrollable Body ─────────────────────────────────────
                      Expanded(
                        child: _selectedTab == 0
                            ? SingleChildScrollView(
                                key: const ValueKey('PracticeActivitiesScroll'),
                                physics: const BouncingScrollPhysics(),
                                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const SizedBox(height: 12),
                                    _buildSectionHeader('Personalized Practice', PhIcons.puzzlePieceBold),
                                    const SizedBox(height: 14),

                                    _buildPersonalizedPracticeCard(
                                      title: 'Pronunciation Challenge',
                                      description: 'Speak words out loud with Sally!',
                                      recommendationTag: pronTag,
                                      tagBgColor: pronTagBg,
                                      tagTextColor: pronTagText,
                                      diagnosticReason: pronReason,
                                      iconSvg: PhIcons.userSoundBold,
                                      iconColor: const Color(0xFF2563EB),
                                      iconBgColor: const Color(0xFFDBEAFE),
                                      cardBgColor: Colors.white,
                                      borderShadowColor: const Color(0xFFBFDBFE),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (context) => const PronunciationChallengePage()),
                                        );
                                      },
                                    ),

                                    _buildPersonalizedPracticeCard(
                                      title: 'Vocabulary Matching',
                                      description: 'Match words and learn translations!',
                                      recommendationTag: vocabTag,
                                      tagBgColor: vocabTagBg,
                                      tagTextColor: vocabTagText,
                                      diagnosticReason: vocabReason,
                                      iconSvg: PhIcons.equalsBold,
                                      iconColor: const Color(0xFFD97706),
                                      iconBgColor: const Color(0xFFFEF3C7),
                                      cardBgColor: Colors.white,
                                      borderShadowColor: const Color(0xFFFDE68A),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (context) => const VocabularyMatchingPage()),
                                        );
                                      },
                                    ),

                                    _buildPersonalizedPracticeCard(
                                      title: 'Sentence Arrangement',
                                      description: 'Arrange words to build sentences!',
                                      recommendationTag: sentenceTag,
                                      tagBgColor: sentenceTagBg,
                                      tagTextColor: sentenceTagText,
                                      diagnosticReason: sentenceReason,
                                      iconSvg: PhIcons.hammerBold,
                                      iconColor: const Color(0xFF059669),
                                      iconBgColor: const Color(0xFFD1FAE5),
                                      cardBgColor: Colors.white,
                                      borderShadowColor: const Color(0xFFA7F3D0),
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(builder: (context) => const SentenceArrangementPage()),
                                        );
                                      },
                                    ),

                                    const SizedBox(height: 32),
                                  ],
                                ),
                              )
                            : SingleChildScrollView(
                                key: const ValueKey('SideQuestsScroll'),
                                physics: const BouncingScrollPhysics(),
                                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    const SizedBox(height: 8),

                                    // ── Section 3: Side quests ──────────────────────────
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        _buildSectionHeader('Side quests', PhIcons.hourglassBold),
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
                                              color: const Color(0xFF1B64D8),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // Side quest items (Yellow layout)
                                    _buildQuestCard(
                                      title: 'Ganda at Talino Badge',
                                      desc: 'Read 3 books written by Female authors\nin 2 Days',
                                      badgePath: 'assets/badges/ganda_talino_badge.webp',
                                    ),
                                    _buildQuestCard(
                                      title: 'Early Badge',
                                      desc: 'Read 3 books written by Young authors\nin 2 Days',
                                      badgePath: 'assets/badges/early_bird_badge.webp',
                                    ),
                                    _buildQuestCard(
                                      title: '10x day Streak',
                                      desc: 'Read 3 books written by Female authors\nin 2 Days',
                                      badgePath: 'assets/badges/10_day_streak_badge.webp',
                                    ),
                                    const SizedBox(height: 32),
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
      ),
    );
  }

  // ── Helper Widgets ────────────────────────────────────────────────────────

  Widget _buildSectionHeader(String title, String iconSvg) {
    return Row(
      children: [
        Iconify(
          iconSvg,
          color: const Color(0xFF1B64D8),
          size: 22,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildPersonalizedPracticeCard({
    required String title,
    required String description,
    required String recommendationTag,
    required Color tagBgColor,
    required Color tagTextColor,
    required String diagnosticReason,
    required String iconSvg,
    required Color iconColor,
    required Color iconBgColor,
    required Color cardBgColor,
    required Color borderShadowColor,
    required VoidCallback onTap,
  }) {
    String simplifiedTag = recommendationTag;
    if (recommendationTag == 'Diagnostic Pending') {
      simplifiedTag = '⭐ Let\'s Try!';
    } else if (recommendationTag == 'Highly Recommended') {
      simplifiedTag = '🔥 Recommended';
    } else if (recommendationTag == 'General Practice') {
      simplifiedTag = '✨ Practice';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 18),
      decoration: BoxDecoration(
        color: cardBgColor,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          // Icon circular badge
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: iconBgColor,
              shape: BoxShape.circle,
            ),
            padding: const EdgeInsets.all(14),
            child: Iconify(
              iconSvg,
              color: iconColor,
            ),
          ),
          const SizedBox(width: 14),
          // Text Area
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Title
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: Colors.black,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 3),
                // Description
                Text(
                  description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF64748B),
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 6),
                // Recommendation Tag
                Container(
                  decoration: BoxDecoration(
                    color: tagBgColor,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  child: Text(
                    simplifiedTag,
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: tagTextColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Play Button
          ElevatedButton(
            onPressed: onTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B64D8),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              minimumSize: const Size(64, 34),
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

  Widget _buildQuestCard({
    required String title,
    required String desc,
    required String badgePath,
  }) {
    const cardColor = Color(0xFFFFD13E);

    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          // Badge Image
          SizedBox(
            width: 52,
            height: 52,
            child: Image.asset(
              badgePath,
              fit: BoxFit.contain,
            ),
          ),
          const SizedBox(width: 14),

          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF856404),
                    height: 1.25,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Finish Button
          ElevatedButton(
            onPressed: () {
              Feedback.forTap(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Quest "$title" finished!'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1B64D8),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: const Size(64, 34),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            child: Text(
              'Finish',
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
}
