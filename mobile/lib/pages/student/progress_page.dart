import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/widgets/styled_book_cover.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/widgets/student_sidebar_drawer.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/pages/student/assessment/phil_iri_assessment_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/listening/listening_result_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/oral_reading/oral_reading_result_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_assessment_instructions_page.dart';
import 'package:salintinig/pages/student/assessment/silent_reading/silent_reading_result_page.dart';
import 'package:salintinig/pages/student/library/continue_reading_page.dart';
import 'package:salintinig/pages/student/library/story_preview_page.dart';
import 'package:salintinig/pages/student/library/library_page.dart';
import 'package:salintinig/pages/student/badges_page.dart';
import 'package:salintinig/pages/student/activities/activities_page.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/services/streak_service.dart';
import 'package:salintinig/services/badge_service.dart';
import 'package:salintinig/services/analytics_service.dart';
import 'package:salintinig/services/quiz_progress_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:salintinig/widgets/streak_celebration_modal.dart';

class ProgressPage extends StatefulWidget {
  const ProgressPage({super.key});

  @override
  State<ProgressPage> createState() => _ProgressPageState();
}

class _ProgressPageState extends State<ProgressPage>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  String _selectedPhilIriLang = 'fil'; // 'fil' or 'en'
  String _selectedPhilIriPeriod = 'pre'; // 'pre' or 'post'
  int _streakCount = 0;
  bool _hasPracticedToday = false;
  bool _isLoadingPhilIri = false;
  List<Map<String, dynamic>> _assignedActivities = [];
  List<Map<String, String>> _weeklyTrackerDays = [];

  Map<String, dynamic>? _getAssignedItem(String type) {
    if (_assignedActivities.isEmpty) return null;
    final normalizedTargetType = type.toLowerCase().trim();
    final targetPeriod = _selectedPhilIriPeriod.toLowerCase().trim();

    for (final act in _assignedActivities) {
      final actType = (act['assessmentType'] ?? act['type'] ?? '').toString().toLowerCase().trim();
      final actLang = (act['rawLanguage'] ?? act['language'] ?? 'fil').toString().toLowerCase().trim();
      final actStage = (act['stage'] ?? act['testType'] ?? act['period'] ?? '').toString().toLowerCase().trim();
      final selLang = _selectedPhilIriLang.toLowerCase().trim();
      
      bool langMatches = actLang == selLang || 
          (selLang == 'fil' && (actLang == 'fil' || actLang == 'filipino')) ||
          (selLang == 'en' && (actLang == 'en' || actLang == 'english'));

      // Check if period matches:
      // If target is 'post', actStage MUST explicitly indicate 'post'
      // If target is 'pre', actStage MUST indicate 'pre' or default if stage is unlabelled
      bool periodMatches = false;
      if (targetPeriod == 'post') {
        periodMatches = actStage.contains('post');
      } else {
        periodMatches = actStage.contains('pre') || (!actStage.contains('post'));
      }

      if (actType == normalizedTargetType && langMatches && periodMatches) {
        return act;
      }
    }

    return null;
  }

  late AnimationController _glowController;
  late Animation<double> _glowAnimation;
  static List<Map<String, dynamic>>? _cachedProgressAssignedActivities;
  static Map<String, dynamic>? _cachedAttemptsStatus;

  static void _loadAssignedCacheFromDisk() {
    try {
      SharedPreferences.getInstance().then((prefs) {
        final jsonStr = prefs.getString('cached_assigned_activities');
        if (jsonStr != null && jsonStr.isNotEmpty) {
          final List list = jsonDecode(jsonStr) as List;
          _cachedProgressAssignedActivities = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        }
        final attemptsStr = prefs.getString('cached_attempts_status');
        if (attemptsStr != null && attemptsStr.isNotEmpty) {
          _cachedAttemptsStatus = jsonDecode(attemptsStr) as Map<String, dynamic>;
        }
      });
    } catch (_) {}
  }

  void _applyAttemptsStatus(Map<String, dynamic> attempts) {
    if (attempts['listening'] == true) {
      PhilIriAssessmentPage.isListeningDone = true;
    }
    if (attempts['oral'] == true || attempts['oral_status'] == 'completed') {
      PhilIriAssessmentPage.isOralReadingDone = true;
      PhilIriAssessmentPage.isOralReadingPendingReview = false;
    } else if (attempts['oral_in_review'] == true || attempts['oral_status'] == 'pending_review' || attempts['oral_status'] == 'submitted') {
      PhilIriAssessmentPage.isOralReadingPendingReview = true;
    }
    if (attempts['silent'] == true) {
      PhilIriAssessmentPage.isSilentReadingDone = true;
    }
  }

  @override
  void initState() {
    super.initState();

    if (_cachedProgressAssignedActivities == null) {
      _loadAssignedCacheFromDisk();
    }

    if (_cachedProgressAssignedActivities != null && _cachedProgressAssignedActivities!.isNotEmpty) {
      _assignedActivities = List<Map<String, dynamic>>.from(_cachedProgressAssignedActivities!);
      _isLoadingPhilIri = false;
    }
    if (_cachedAttemptsStatus != null) {
      _applyAttemptsStatus(_cachedAttemptsStatus!);
    }

    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _glowAnimation = Tween<double>(begin: 0.18, end: 0.38).animate(
      CurvedAnimation(parent: _glowController, curve: Curves.easeInOut),
    );

    // 0ms instant render from in-memory caches
    if (LibraryService.cachedProgress != null) {
      _inProgressBooks = LibraryService.filterInProgress(LibraryService.cachedProgress!);
    }

    StreakService.streakNotifier.addListener(_onStreakChanged);
    BadgeService.badgeNotifier.addListener(_onStreakChanged);
    LibraryService.progressNotifier.addListener(_onLibraryProgressChanged);

    _setupRealtimeSubscription();
    _fetchLiveProgressData();
  }

  dynamic _realtimeSubscription;

  void _setupRealtimeSubscription() {
    try {
      final client = Supabase.instance.client;
      _realtimeSubscription = client
          .channel('public:progress_page_updates')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'user_assignments',
            callback: (payload) {
              _fetchLiveProgressData();
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'assigned_activities',
            callback: (payload) {
              _fetchLiveProgressData();
            },
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'assessments',
            callback: (payload) {
              _fetchLiveProgressData();
            },
          )
          .subscribe();
    } catch (e) {
      debugPrint('[ProgressPage] Realtime subscription notice: $e');
    }
  }

  @override
  void dispose() {
    if (_realtimeSubscription != null) {
      try {
        Supabase.instance.client.removeChannel(_realtimeSubscription);
      } catch (_) {}
    }
    _glowController.dispose();
    StreakService.streakNotifier.removeListener(_onStreakChanged);
    BadgeService.badgeNotifier.removeListener(_onStreakChanged);
    LibraryService.progressNotifier.removeListener(_onLibraryProgressChanged);
    super.dispose();
  }

  void _onStreakChanged() {
    if (!mounted) return;
    _loadLocalStreakInstantly();
  }

  void _onLibraryProgressChanged() {
    if (!mounted) return;
    setState(() {
      _inProgressBooks = LibraryService.filterInProgress(LibraryService.progressNotifier.value);
    });
  }

  List<Map<String, dynamic>> _inProgressBooks = [];
  bool _isFetchingLiveProgress = false;

  Future<void> _loadLocalStreakInstantly() async {
    try {
      final streak = await StreakService.getStreakCount();
      final tracker = await StreakService.getWeeklyTracker();
      final practicedToday = await StreakService.hasCompletedToday();
      if (mounted) {
        setState(() {
          _streakCount = streak;
          _hasPracticedToday = practicedToday;
          _weeklyTrackerDays = tracker;
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchLiveProgressData() async {
    if (_isFetchingLiveProgress) return;
    _isFetchingLiveProgress = true;

    try {
      // 1. Instant 0-delay render from cached memory
      if (LibraryService.cachedProgress != null && mounted) {
        setState(() {
          _inProgressBooks = LibraryService.filterInProgress(LibraryService.cachedProgress!);
        });
      }
      await _loadLocalStreakInstantly();

      // 2. Non-blocking parallel background sync
      try {
        await Future.wait([
          LibraryService.fetchReadingProgress(),
          StreakService.syncStreakWithBackend(),
          AnalyticsService.fetchAnalytics(),
        ]);

        final streak = await StreakService.getStreakCount();
        final tracker = await StreakService.getWeeklyTracker();
        final practicedToday = await StreakService.hasCompletedToday();

        if (mounted) {
          setState(() {
            if (LibraryService.cachedProgress != null) {
              _inProgressBooks = LibraryService.filterInProgress(LibraryService.cachedProgress!);
            }
            _streakCount = streak;
            _hasPracticedToday = practicedToday;
            _weeklyTrackerDays = tracker;
          });
        }

        // Only show loading indicator if we don't have any cached assigned activities at all
        if (_assignedActivities.isEmpty && _cachedProgressAssignedActivities == null && mounted) {
          setState(() {
            _isLoadingPhilIri = true;
          });
        }

        final res = await ApiService.get('/students/assessment/my-assignment');
        if (res.success && res.data != null && mounted) {
          final attempts = res.data['attemptsStatus'];
          final activitiesList = res.data['assignedActivities'];
          setState(() {
            _isLoadingPhilIri = false;
            if (activitiesList != null && activitiesList is List) {
              _assignedActivities = List<Map<String, dynamic>>.from(activitiesList);
              _cachedProgressAssignedActivities = List<Map<String, dynamic>>.from(_assignedActivities);
              SharedPreferences.getInstance().then((prefs) {
                prefs.setString('cached_assigned_activities', jsonEncode(_assignedActivities));
              });
            }
            if (attempts != null && attempts is Map) {
              final map = Map<String, dynamic>.from(attempts);
              _applyAttemptsStatus(map);
              _cachedAttemptsStatus = map;
              SharedPreferences.getInstance().then((prefs) {
                prefs.setString('cached_attempts_status', jsonEncode(map));
              });
            }
          });
        } else if (mounted) {
          setState(() {
            _isLoadingPhilIri = false;
          });
        }
      } catch (e) {
        debugPrint('[ProgressPage] bg sync error: $e');
      } finally {
        if (mounted && _isLoadingPhilIri) {
          setState(() {
            _isLoadingPhilIri = false;
          });
        }
      }
    } catch (e) {
      debugPrint('[ProgressPage] fetch progress error: $e');
    } finally {
      _isFetchingLiveProgress = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      drawerEnableOpenDragGesture: true,
      drawerEdgeDragWidth: MediaQuery.of(context).size.width * 0.25,
      backgroundColor: softCreamBg,
      drawer: StudentSidebarDrawer(
        currentIndex: 4, // Progress index
        onItemSelected: (index) {
          if (index == 0) {
            // Navigate back to Home
            Navigator.pop(context);
          } else if (index == 1) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const PhilIriAssessmentPage(),
              ),
            );
          } else if (index == 2) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const LibraryPage(),
              ),
            );
          } else if (index == 3) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => const ActivitiesPage(),
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
                      // 1. Navigation Row (App Bar)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            // Left Menu Drawer Icon (Hamburger)
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
                              'Progress',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            // Right Notification Bell
                            const NotificationBellIconButton(),
                          ],
                        ),
                      ),

                      // 2. Scrollable Content
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
                            padding: const EdgeInsets.only(left: 20.0, right: 20.0, bottom: 24.0),
                            child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const SizedBox(height: 12),

                              _buildStreakCard(),
                              const SizedBox(height: 28),



                              // ── Section: Your Badges ──
                              _buildSectionHeader(
                                icon: PhIcons.shieldBold,
                                title: 'Your Badges',
                                rightWidget: GestureDetector(
                                  onTap: () {
                                    Feedback.forTap(context);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const BadgesPage(),
                                      ),
                                    );
                                  },
                                  child: Text(
                                    'See all',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: primaryBlue,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildBadgesCard(),
                              const SizedBox(height: 28),

                              // ── Section: Phil-IRI Reading Profile (Tap header badge to switch Pre-Test / Post-Test) ──
                              _buildSectionHeader(
                                icon: PhIcons.examBold,
                                title: 'Phil - IRI Reading Profile',
                                rightWidget: GestureDetector(
                                  onTap: () {
                                    Feedback.forTap(context);
                                    setState(() {
                                      _selectedPhilIriPeriod = _selectedPhilIriPeriod == 'pre' ? 'post' : 'pre';
                                    });
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 250),
                                    curve: Curves.easeInOut,
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: _selectedPhilIriPeriod == 'pre'
                                          ? const Color(0xFF1B64D8).withValues(alpha: 0.1)
                                          : const Color(0xFF10B981).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(100),
                                      border: Border.all(
                                        color: _selectedPhilIriPeriod == 'pre'
                                            ? const Color(0xFF1B64D8).withValues(alpha: 0.3)
                                            : const Color(0xFF10B981).withValues(alpha: 0.3),
                                        width: 1.0,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        AnimatedSwitcher(
                                          duration: const Duration(milliseconds: 220),
                                          transitionBuilder: (Widget child, Animation<double> animation) {
                                            return FadeTransition(
                                              opacity: animation,
                                              child: ScaleTransition(
                                                scale: Tween<double>(begin: 0.88, end: 1.0).animate(animation),
                                                child: child,
                                              ),
                                            );
                                          },
                                          child: Text(
                                            _selectedPhilIriPeriod == 'pre' ? 'Pre-Test' : 'Post-Test',
                                            key: ValueKey<String>(_selectedPhilIriPeriod),
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: _selectedPhilIriPeriod == 'pre'
                                                  ? const Color(0xFF1B64D8)
                                                  : const Color(0xFF059669),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        AnimatedRotation(
                                          turns: _selectedPhilIriPeriod == 'pre' ? 0.0 : 0.5,
                                          duration: const Duration(milliseconds: 250),
                                          curve: Curves.easeInOut,
                                          child: Icon(
                                            Icons.swap_horiz_rounded,
                                            size: 14,
                                            color: _selectedPhilIriPeriod == 'pre'
                                                ? const Color(0xFF1B64D8)
                                                : const Color(0xFF059669),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildUnifiedPhilIriCard(primaryBlue),
                              const SizedBox(height: 28),

                              // ── Section: Continue Reading ──
                              _buildSectionHeader(
                                icon: PhIcons.bookOpenBold,
                                title: 'Continue Reading',
                                rightWidget: GestureDetector(
                                  onTap: () {
                                    Feedback.forTap(context);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const ContinueReadingPage(),
                                      ),
                                    ).then((_) {
                                      if (mounted) _fetchLiveProgressData();
                                    });
                                  },
                                  child: Text(
                                    'See all',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: primaryBlue,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildContinueReadingCard(),
                              const SizedBox(height: 28),

                              // ── Section: Analytics (Duolingo Style Gamified Dashboard) ──
                              _buildSectionHeader(
                                icon: PhIcons.chartBarBold,
                                title: 'Analytics',
                              ),
                              const SizedBox(height: 16),
                              _buildDuolingoAnalytics(primaryBlue),
                              const SizedBox(height: 24),
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
      ),
    );
  }

  // ── Section Header Builder ──
  Widget _buildSectionHeader({
    required String icon,
    required String title,
    Widget? rightWidget,
  }) {
    return Row(
      children: [
        Iconify(
          icon,
          color: const Color(0xFF1B64D8),
          size: 22,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Colors.black,
              letterSpacing: -0.4,
            ),
          ),
        ),
        ?rightWidget,
      ],
    );
  }

  // ── Streak Widget ──
  // ── Streak Widget ──
  Widget _buildStreakCard() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20.0, 28.0, 20.0, 24.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // 1. Flame Icon (Tap to trigger celebration modal)
          GestureDetector(
            onTap: () {
              Feedback.forTap(context);
              StreakCelebrationModal.show(
                context,
                streakCount: _streakCount,
              );
            },
            child: SizedBox(
              height: 125,
              child: OverflowBox(
                maxHeight: 160,
                minHeight: 160,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer Radial Glowing Flame Aura (matches celebration modal)
                    if (_hasPracticedToday)
                      AnimatedBuilder(
                        animation: _glowAnimation,
                        builder: (context, child) {
                          return Container(
                            width: 160,
                            height: 160,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(
                                colors: [
                                  const Color(0xFFF97316).withValues(alpha: _glowAnimation.value),
                                  const Color(0xFFF97316).withValues(alpha: 0.0),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    Icon(
                      Icons.local_fire_department_rounded,
                      size: 140,
                      color: _hasPracticedToday ? const Color(0xFFF97316) : const Color(0xFFCBD5E1),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 2. Single-line Title Layout (e.g. "5 Days Streaks" or "1 Day Streak")
          Text(
            _streakCount == 1 ? '1 Day Streak' : '$_streakCount Days Streaks',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            _streakCount == 0
                ? "Complete an activity today to start your streak!"
                : "You are doing really great!",
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF64748B),
            ),
          ),
          const SizedBox(height: 16),

          // 3. Bottom Weekly Tracker (Day Labels on TOP, Circles on BOTTOM)
          _buildWeeklyTracker(),
        ],
      ),
    );
  }

  // ── Badges Widget ──
  Widget _buildBadgesCard() {
    final cached = BadgeService.cachedBadges;
    if (cached.isEmpty) {
      return _buildSkeletonBadgesCard();
    }

    final badges = cached.take(4).toList();

    return GestureDetector(
      onTap: () {
        Feedback.forTap(context);
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const BadgesPage()),
        ).then((_) => _fetchLiveProgressData());
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: const Color(0xFFE2E8F0),
            width: 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20.0),
        child: Row(
          children: badges.map((badge) {
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
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
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildSkeletonBadgesCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.0,
        ),
      ),
      padding: const EdgeInsets.all(20.0),
      child: Row(
        children: List.generate(4, (index) {
          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 4.0),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const AspectRatio(
                aspectRatio: 80 / 108,
                child: SizedBox(),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildPhilIriSkeletonCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.0,
        ),
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Language Pill Skeleton
          Container(
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(100),
            ),
          ),
          const SizedBox(height: 16),

          // 3 Row Skeletons
          ...List.generate(3, (index) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF1F5F9),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 130,
                          height: 14,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          width: 180,
                          height: 10,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 70,
                    height: 32,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(100),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildWeeklyTracker() {
    final days = _weeklyTrackerDays.isNotEmpty
        ? _weeklyTrackerDays
        : [
            {'label': 'M', 'state': 'future'},
            {'label': 'T', 'state': 'future'},
            {'label': 'W', 'state': 'future'},
            {'label': 'T', 'state': 'future'},
            {'label': 'F', 'state': 'future'},
            {'label': 'S', 'state': 'future'},
            {'label': 'S', 'state': 'future'},
          ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: days
          .map((day) => _buildDayTrackerItem(
                day['label'] as String,
                day['state'] as String,
              ))
          .toList(),
    );
  }

  Widget _buildDayTrackerItem(String label, String state) {
    Widget circleChild;
    Color circleBgColor;
    Border? circleBorder;
    Color labelColor = const Color(0xFF94A3B8);

    if (state == 'done') {
      circleBgColor = const Color(0xFFF97316);
      circleChild = const Icon(
        Icons.check_rounded,
        color: Colors.white,
        size: 14,
      );
      labelColor = const Color(0xFFF97316);
    } else {
      // Missed or future days: soft light blue-grey filled circle with subtle checkmark (matching Picture 2)
      circleBgColor = const Color(0xFFF1F5F9);
      circleChild = const Icon(
        Icons.check_rounded,
        color: Color(0xFFCBD5E1),
        size: 14,
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Day Label ON TOP
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: labelColor,
          ),
        ),
        const SizedBox(height: 8),

        // Circle ON BOTTOM
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: circleBgColor,
            shape: BoxShape.circle,
            border: circleBorder,
          ),
          alignment: Alignment.center,
          child: circleChild,
        ),
      ],
    );
  }



  // ── Unified Phil-IRI Reading Profile Container (Merged Card Design) ──
  Widget _buildUnifiedPhilIriCard(Color primaryBlue) {
    if (_isLoadingPhilIri) {
      return _buildPhilIriSkeletonCard();
    }

    final oralItem = _getAssignedItem('oral');
    final listeningItem = _getAssignedItem('listening');
    final silentItem = _getAssignedItem('silent');

    final oralStatus = (oralItem?['status'] ?? '').toString().toLowerCase();
    final bool isOralDone = oralItem != null &&
        (oralItem['isCompleted'] == true || oralStatus == 'completed');
    final bool isOralPendingReview = oralItem != null &&
        !isOralDone &&
        (oralStatus == 'pending_review' || oralStatus == 'submitted');
    final bool isOralClosed = oralItem != null &&
        !isOralDone &&
        !isOralPendingReview &&
        oralStatus == 'closed';

    final listeningStatus = (listeningItem?['status'] ?? '').toString().toLowerCase();
    final bool isListeningDone = listeningItem != null &&
        (listeningItem['isCompleted'] == true || listeningStatus == 'completed');
    final bool isListeningClosed = listeningItem != null &&
        !isListeningDone &&
        listeningStatus == 'closed';

    final silentStatus = (silentItem?['status'] ?? '').toString().toLowerCase();
    final bool isSilentDone = silentItem != null &&
        (silentItem['isCompleted'] == true || silentStatus == 'completed');
    final bool isSilentClosed = silentItem != null &&
        !isSilentDone &&
        silentStatus == 'closed';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Language Toggle Pill Header (Filipino / English)
          Container(
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(100),
            ),
            padding: const EdgeInsets.all(3),
            child: Row(
              children: [
                Expanded(child: _buildPhilIriLangTab('fil', 'Filipino')),
                Expanded(child: _buildPhilIriLangTab('en', 'English')),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // 2. Modality Rows inside the card
          _buildMergedAssessmentItemRow(
            title: 'Oral Reading Assessment',
            subTitle: 'Word Reading & Comprehension',
            isDone: isOralDone,
            isPendingReview: isOralPendingReview,
            isClosed: isOralClosed,
            isNotAvailable: oralItem == null,
            iconSvg: PhIcons.userSoundBold,
            iconBg: const Color(0xFFD0E1F9),
            iconCol: primaryBlue,
            primaryBlue: primaryBlue,
            onStart: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => OralReadingAssessmentInstructionsPage(
                    item: oralItem,
                  ),
                ),
              ).then((_) {
                _fetchLiveProgressData();
              });
            },
            onViewResult: () {
              if (isOralPendingReview) {
                AppToast.warning(
                  context,
                  'Your recording is currently being reviewed by your teacher.',
                );
                return;
              }
              final passageId = oralItem != null ? QuizProgressService.extractPassageId(oralItem) : null;
              final lang = oralItem?['rawLanguage'] ?? oralItem?['language'];
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => OralReadingResultPage(
                    passageId: passageId,
                    language: lang,
                  ),
                ),
              );
            },
          ),
          const Divider(height: 24, thickness: 1, color: Color(0xFFF1F5F9)),

          _buildMergedAssessmentItemRow(
            title: 'Listening Assessment',
            subTitle: 'Listening Comprehension Score',
            isDone: isListeningDone,
            isClosed: isListeningClosed,
            isNotAvailable: listeningItem == null,
            iconSvg: PhIcons.earBold,
            iconBg: const Color(0xFFFEF3C7),
            iconCol: const Color(0xFFF59E0B),
            primaryBlue: primaryBlue,
            onStart: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ListeningAssessmentInstructionsPage(
                    item: listeningItem,
                  ),
                ),
              ).then((completed) {
                _fetchLiveProgressData();
              });
            },
            onViewResult: () {
              final passageId = listeningItem != null ? QuizProgressService.extractPassageId(listeningItem) : null;
              final lang = listeningItem?['rawLanguage'] ?? listeningItem?['language'];
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => ListeningResultPage(
                    passageId: passageId,
                    language: lang,
                  ),
                ),
              );
            },
          ),
          const Divider(height: 24, thickness: 1, color: Color(0xFFF1F5F9)),

          _buildMergedAssessmentItemRow(
            title: 'Silent Reading Assessment',
            subTitle: 'Silent Comprehension & Speed',
            isDone: isSilentDone,
            isClosed: isSilentClosed,
            isNotAvailable: silentItem == null,
            iconSvg: PhIcons.bookOpenBold,
            iconBg: const Color(0xFFD1FAE5),
            iconCol: const Color(0xFF10B981),
            primaryBlue: primaryBlue,
            onStart: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SilentReadingAssessmentInstructionsPage(
                    item: silentItem,
                  ),
                ),
              ).then((_) {
                _fetchLiveProgressData();
              });
            },
            onViewResult: () {
              final passageId = silentItem != null ? QuizProgressService.extractPassageId(silentItem) : null;
              final lang = silentItem?['rawLanguage'] ?? silentItem?['language'];
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SilentReadingResultPage(
                    passageId: passageId,
                    language: lang,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }





  Widget _buildPhilIriLangTab(String langKey, String label) {
    bool isActive = _selectedPhilIriLang == langKey;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedPhilIriLang = langKey;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isActive ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : [],
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
            color: isActive ? const Color(0xFF1B64D8) : const Color(0xFF64748B),
          ),
        ),
      ),
    );
  }

  Widget _buildMergedAssessmentItemRow({
    required String title,
    required String subTitle,
    required bool isDone,
    bool isPendingReview = false,
    bool isClosed = false,
    required String iconSvg,
    required Color iconBg,
    required Color iconCol,
    required Color primaryBlue,
    required VoidCallback onStart,
    required VoidCallback onViewResult,
    bool isNotAvailable = false,
  }) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Iconify(
            iconSvg,
            color: iconCol,
            size: 22,
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
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subTitle,
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
        if (isPendingReview)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF3C7),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              'Pending',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: const Color(0xFFD97706),
              ),
            ),
          )
        else if (isDone)
          ElevatedButton(
            onPressed: () {
              Feedback.forTap(context);
              onViewResult();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00A859),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            child: Text(
              'View Result',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800),
            ),
          )
        else if (isClosed)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              'Closed',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF94A3B8),
              ),
            ),
          )
        else if (isNotAvailable)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              'Not Available',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF94A3B8),
              ),
            ),
          )
        else
          ElevatedButton(
            onPressed: () {
              Feedback.forTap(context);
              onStart();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryBlue,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(100),
              ),
            ),
            child: Text(
              'Start',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800),
            ),
          ),
      ],
    );
  }

  // ── Continue Reading Card (Matching Library Page) ──
  Widget _buildContinueReadingCard() {
    final continueReadingBooks = LibraryService.filterInProgress(_inProgressBooks);

    const cardBg = Colors.white;
    const tagBg = Color(0xFFEFF6FF);
    const tagTextColor = Color(0xFF2563EB);
    const primaryBlue = Color(0xFF1B64D8);

    // No in-progress books
    if (continueReadingBooks.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(24),
        child: Center(
          child: Text(
            'No books in progress yet.\nHead to the Bookshelf to start reading!',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: const Color(0xFF94A3B8),
              height: 1.5,
            ),
          ),
        ),
      );
    }

    // Show the first in-progress book
    final book = continueReadingBooks.first;
    final bookTitle = book['title'] as String? ?? '';
    final bookAuthor = book['author'] as String? ?? 'Juan dela Cruz';
    final rawLang = book['language'] as String? ?? 'en';
    final description = book['description'] as String? ?? '';
    final progressVal = LibraryService.parseDouble(book['progress']);
    final langLabel = LibraryService.languageLabel(rawLang);
    final progressPct = '${(progressVal * 100).toInt()}%';

    return GestureDetector(
      onTap: () async {
        Feedback.forTap(context);
        await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => StoryPreviewPage(
              bookTitle: bookTitle,
              book: book,
            ),
          ),
        );
        if (mounted) _fetchLiveProgressData();
      },
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Left Column: Book Cover
            SizedBox(
              width: 110,
              height: 160,
              child: StyledBookCover(
                book: {
                  'title': bookTitle,
                  'author': bookAuthor,
                },
                index: 0,
                enableTap: false,
              ),
            ),
            const SizedBox(width: 14),

            // Right Column: Info & Action Controls
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Language Tag Row
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: tagBg,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      langLabel,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: tagTextColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Story Title
                  Text(
                    bookTitle,
                    maxLines: 2,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                      letterSpacing: -0.3,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 4),

                  // Description
                  if (description.isNotEmpty)
                    Text(
                      description,
                      maxLines: 2,
                      overflow: TextOverflow.clip,
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: const Color(0xFF64748B),
                        height: 1.35,
                      ),
                    ),
                  const SizedBox(height: 10),

                  // Reading Progress
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Progress',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF475569),
                        ),
                      ),
                      Text(
                        progressPct,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: primaryBlue,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(100),
                    child: LinearProgressIndicator(
                      value: progressVal,
                      backgroundColor: const Color(0xFFF1F5F9),
                      valueColor: const AlwaysStoppedAnimation<Color>(primaryBlue),
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Continue Reading Button
                  SizedBox(
                    width: double.infinity,
                    height: 38,
                    child: ElevatedButton(
                      onPressed: () async {
                        Feedback.forTap(context);
                        await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => StoryPreviewPage(
                              bookTitle: bookTitle,
                              book: book,
                            ),
                          ),
                        );
                        if (mounted) _fetchLiveProgressData();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryBlue,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Continue Reading',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.arrow_forward_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ],
                      ),
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



  Widget _buildAnalyticsSkeletonLoader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 1. Overview Card Skeleton
        Container(
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: List.generate(3, (i) => Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 50,
                    height: 18,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                    width: 40,
                    height: 12,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            )),
          ),
        ),
        const SizedBox(height: 16),

        // 2. Weekly Bar Chart Skeleton
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 140,
                        height: 14,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: 160,
                        height: 10,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                  Container(
                    width: 65,
                    height: 20,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(100),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 100,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(7, (index) => Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        width: 20,
                        height: index % 2 == 0 ? 45 : 25,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: 12,
                        height: 10,
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ],
                  )),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 3. Skill Mastery Grid Skeleton (2x2)
        Row(
          children: [
            Expanded(child: _buildSkillCardSkeleton()),
            const SizedBox(width: 12),
            Expanded(child: _buildSkillCardSkeleton()),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildSkillCardSkeleton()),
            const SizedBox(width: 12),
            Expanded(child: _buildSkillCardSkeleton()),
          ],
        ),
        const SizedBox(height: 16),

        // 4. Sally Smart Tip Card Skeleton
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF1B64D8).withValues(alpha: 0.15)),
          ),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: const BoxDecoration(
                  color: Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 120,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFFDBEAFE),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      height: 10,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      width: 140,
                      height: 10,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSkillCardSkeleton() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              Container(
                width: 36,
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: 70,
            height: 12,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: 50,
            height: 10,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(100),
            ),
          ),
        ],
      ),
    );
  }

  // ── SalinTinig Gamified Analytics Section ──
  Widget _buildDuolingoAnalytics(Color primaryBlue) {
    return ValueListenableBuilder<AnalyticsData?>(
      valueListenable: AnalyticsService.analyticsNotifier,
      builder: (context, data, _) {
        if (data == null && AnalyticsService.cachedAnalytics == null) {
          return _buildAnalyticsSkeletonLoader();
        }
        final totalXp = data?.totalXp ?? (BadgeService.cachedBadges.length * 15 + _streakCount * 10);
        final streak = data?.currentStreak ?? _streakCount;
        final stories = data?.completedStoriesCount ?? _inProgressBooks.length;
        final weekly = data?.weeklyActivity ?? [];
        final skills = data?.skills ?? {};
        final smartTip = data?.smartTip ??
            "Welcome! Complete daily practice exercises and read stories to see your learning stats grow!";

        final vocabAcc = (skills['vocabulary']?['accuracy'] as num?)?.toInt() ?? 0;
        final vocabCount = (skills['vocabulary']?['count'] as num?)?.toInt() ?? 0;
        final sentAcc = (skills['sentence']?['accuracy'] as num?)?.toInt() ?? 0;
        final sentCount = (skills['sentence']?['count'] as num?)?.toInt() ?? 0;
        final pronAcc = (skills['pronunciation']?['accuracy'] as num?)?.toInt() ?? 0;
        final pronCount = (skills['pronunciation']?['count'] as num?)?.toInt() ?? 0;
        final compAcc = (skills['comprehension']?['accuracy'] as num?)?.toInt() ?? 0;
        final compCount = (skills['comprehension']?['count'] as num?)?.toInt() ?? stories;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Unified Clean Overview Card (XP, Streak, Stories)
            _buildUnifiedOverviewCard(
              totalXp: totalXp,
              streak: streak,
              stories: stories,
            ),
            const SizedBox(height: 16),

            // 2. Weekly Activity Bar Chart
            _buildWeeklyBarChartCard(weekly),
            const SizedBox(height: 16),

            // 3. Skill Mastery Grid (2x2 Cards)
            Row(
              children: [
                Expanded(
                  child: _buildSkillMasteryCard(
                    title: 'Vocabulary',
                    accuracy: vocabAcc,
                    count: vocabCount,
                    iconSvg: PhIcons.equalsBold,
                    accentColor: const Color(0xFFD97706),
                    bgColor: const Color(0xFFFEF3C7),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSkillMasteryCard(
                    title: 'Sentence',
                    accuracy: sentAcc,
                    count: sentCount,
                    iconSvg: PhIcons.hammerBold,
                    accentColor: const Color(0xFF10B981),
                    bgColor: const Color(0xFFD1FAE5),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildSkillMasteryCard(
                    title: 'Pronunciation',
                    accuracy: pronAcc,
                    count: pronCount,
                    iconSvg: PhIcons.userSoundBold,
                    accentColor: const Color(0xFF1B64D8),
                    bgColor: const Color(0xFFDBEAFE),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildSkillMasteryCard(
                    title: 'Comprehension',
                    accuracy: compAcc,
                    count: compCount,
                    iconSvg: PhIcons.lightbulbRegular,
                    accentColor: const Color(0xFF8B5CF6),
                    bgColor: const Color(0xFFF3E8FF),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 4. Sally Mascot Smart Learning Tip Card
            _buildSallySmartTipCard(smartTip),
          ],
        );
      },
    );
  }

  Widget _buildUnifiedOverviewCard({
    required int totalXp,
    required int streak,
    required int stories,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildOverviewColumn(
              iconSvg: PhIcons.lightningFill,
              iconColor: const Color(0xFFF59E0B),
              val: '$totalXp',
              label: 'Total XP',
            ),
          ),
          Container(
            height: 36,
            width: 1.0,
            color: const Color(0xFFF1F5F9),
          ),
          Expanded(
            child: _buildOverviewColumn(
              iconSvg: PhIcons.fireBold,
              iconColor: const Color(0xFFF97316),
              val: '$streak',
              label: 'Streak',
            ),
          ),
          Container(
            height: 36,
            width: 1.0,
            color: const Color(0xFFF1F5F9),
          ),
          Expanded(
            child: _buildOverviewColumn(
              iconSvg: PhIcons.booksRegular,
              iconColor: const Color(0xFF1B64D8),
              val: '$stories',
              label: 'Stories',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewColumn({
    required String iconSvg,
    required Color iconColor,
    required String val,
    required String label,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Iconify(
              iconSvg,
              color: iconColor,
              size: 20,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                val,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildWeeklyBarChartCard(List<Map<String, dynamic>> weekly) {
    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    final todayIndex = StreakService.getTodayDayIndex();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Weekly Practice Activity',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Mon – Sun completion history',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1B64D8).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  'This Week',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1B64D8),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 7 Vertical Bars
          SizedBox(
            height: 110,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: List.generate(7, (index) {
                Map<String, dynamic> item = {};
                if (weekly.length > index) {
                  item = weekly[index];
                }

                final bool isCompleted = item.isNotEmpty
                    ? (item['completed'] == true)
                    : (_weeklyTrackerDays.length > index &&
                        _weeklyTrackerDays[index]['state'] == 'done');
                final int score = (item['score'] as num?)?.toInt() ?? 0;
                final bool isToday = index == todayIndex;

                final double barRatio = isCompleted
                    ? (score / 100).clamp(0.25, 1.0)
                    : 0.12;

                final Color barColor = isCompleted
                    ? (isToday ? const Color(0xFFF97316) : const Color(0xFF1B64D8))
                    : const Color(0xFFF1F5F9);

                final Color textColor = isCompleted
                    ? (isToday ? const Color(0xFFF97316) : const Color(0xFF1B64D8))
                    : const Color(0xFF94A3B8);

                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (isCompleted)
                      Text(
                        '${score > 0 ? score : 100}%',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: textColor,
                        ),
                      )
                    else
                      const SizedBox(height: 12),
                    const SizedBox(height: 4),

                    // Bar Pill
                    Container(
                      width: 20,
                      height: 64 * barRatio,
                      decoration: BoxDecoration(
                        color: barColor,
                        borderRadius: BorderRadius.circular(100),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Day Label
                    Text(
                      dayLabels[index],
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isToday ? FontWeight.w900 : FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSkillMasteryCard({
    required String title,
    required int accuracy,
    int count = 0,
    required String iconSvg,
    required Color accentColor,
    required Color bgColor,
  }) {
    final bool hasData = count > 0 && accuracy > 0;
    final double ratio = hasData ? (accuracy / 100).clamp(0.0, 1.0) : 0.0;
    final String statusLabel = !hasData
        ? 'Not Started'
        : accuracy >= 85
            ? 'Mastered'
            : accuracy >= 60
                ? 'Improving'
                : 'Needs Practice';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.0),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                alignment: Alignment.center,
                child: Iconify(
                  iconSvg,
                  color: accentColor,
                  size: 18,
                ),
              ),
              Text(
                hasData ? '$accuracy%' : '--',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            statusLabel,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: accentColor,
            ),
          ),
          const SizedBox(height: 10),

          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(100),
            child: LinearProgressIndicator(
              value: hasData ? ratio : 0.05,
              backgroundColor: const Color(0xFFF1F5F9),
              valueColor: AlwaysStoppedAnimation<Color>(accentColor),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSallySmartTipCard(String tipMessage) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF1B64D8).withValues(alpha: 0.2),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1B64D8).withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          SizedBox(
            height: 64,
            width: 64,
            child: Image.asset(
              'assets/mascot/sally_reading.webp',
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) => const Icon(
                Icons.face_rounded,
                color: Color(0xFF1B64D8),
                size: 36,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Sally's Learning Tip",
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: const Color(0xFF1B64D8),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  tipMessage,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF334155),
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


}


