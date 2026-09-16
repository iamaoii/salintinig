import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/edit_profile_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/streak_service.dart';
import 'package:salintinig/services/analytics_service.dart';
import 'package:salintinig/services/badge_service.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';
import 'package:salintinig/widgets/app_toast.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String? _customDisplayName;
  Map<String, dynamic>? _readingProfiles;
  String _selectedPhilIriLang = 'fil';
  bool _isLoading = true;

  int _streakCount = 0;
  int _completedStoriesCount = 0;
  int _unlockedBadgesCount = 0;

  @override
  void initState() {
    super.initState();
    _populateFromCache();
    _loadAllProfileData();
  }

  void _populateFromCache() {
    final user = AuthService.currentUser;
    if (user != null) {
      if (user.nickname != null && user.nickname!.isNotEmpty) {
        _customDisplayName = user.nickname;
      }
      if (user.profileImage != null && user.profileImage!.isNotEmpty) {
        _customAvatarUrl = user.profileImage;
      }
      if (user.avatarFrame.isNotEmpty) {
        _selectedFrame = user.avatarFrame;
      }
    }

    final analytics = AnalyticsService.cachedAnalytics;
    final cachedBadges = BadgeService.cachedBadges;
    final cachedProgress = LibraryService.cachedProgress;

    final streak = analytics?.currentStreak ?? 0;
    final completedStories = (cachedProgress ?? []).where((b) {
      final status = (b['status'] ?? '').toString().toLowerCase();
      final pct = (b['progress'] as num?)?.toDouble() ?? (b['completionPercentage'] as num?)?.toDouble() ?? 0.0;
      return status == 'completed' || pct >= 1.0;
    }).length;

    final unlockedBadges = cachedBadges.where((b) => b.isUnlocked == true).length;

    _streakCount = streak;
    _completedStoriesCount = analytics?.completedStoriesCount ?? completedStories;
    _unlockedBadgesCount = unlockedBadges > 0 ? unlockedBadges : (analytics?.totalBadgesCount ?? 0);

    // Instant 0-delay render if user session exists in memory
    if (user != null) {
      _isLoading = false;
    }
  }

  Future<void> _loadAllProfileData() async {
    // Only set loading if we have no cached data at all
    if (_readingProfiles == null && AuthService.currentUser == null) {
      setState(() => _isLoading = true);
    }

    try {
      // Execute network requests in PARALLEL for maximum speed
      final results = await Future.wait([
        AuthService.fetchMe(),
        ApiService.get('/students/assessment/my-assignment'),
        StreakService.getStreakCount(),
        AnalyticsService.fetchAnalytics(),
        BadgeService.fetchBadges(),
        LibraryService.fetchReadingProgress(),
      ]);

      final user = AuthService.currentUser;
      if (user != null) {
        if (user.nickname != null && user.nickname!.isNotEmpty) {
          _customDisplayName = user.nickname;
        }
        if (user.profileImage != null && user.profileImage!.isNotEmpty) {
          _customAvatarUrl = user.profileImage;
        }
        if (user.avatarFrame.isNotEmpty) {
          _selectedFrame = user.avatarFrame;
        }
      }

      final res = results[1] as ApiResponse;
      if (res.success && res.data != null) {
        if (res.data['readingProfiles'] != null) {
          _readingProfiles = res.data['readingProfiles'] as Map<String, dynamic>?;
        }
        final apiSec = res.data['sectionName'] ?? res.data['section'];
        if (apiSec != null && apiSec.toString().isNotEmpty) {
          _apiSection = apiSec.toString();
        }
        final apiGrade = res.data['gradeLevel'] ?? res.data['grade_level'] ?? res.data['grade'];
        if (apiGrade != null && apiGrade.toString().isNotEmpty) {
          _apiGradeLevel = apiGrade.toString();
        }
      }

      final streak = (results[2] as int?) ?? 0;
      final analytics = results[3] as dynamic;
      final badges = (results[4] as List<dynamic>?) ?? [];
      final libraryProgress = (results[5] as List<dynamic>?) ?? [];

      final completedStories = libraryProgress.where((b) {
        final status = (b['status'] ?? '').toString().toLowerCase();
        final pct = (b['progress'] as num?)?.toDouble() ?? (b['completionPercentage'] as num?)?.toDouble() ?? 0.0;
        return status == 'completed' || pct >= 1.0;
      }).length;

      final unlockedBadges = badges.where((b) => b.isUnlocked == true).length;

      if (mounted) {
        setState(() {
          _streakCount = analytics?.currentStreak ?? streak;
          _completedStoriesCount = analytics?.completedStoriesCount ?? completedStories;
          _unlockedBadgesCount = unlockedBadges > 0 ? unlockedBadges : (analytics?.totalBadgesCount ?? 0);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[ProfilePage] error loading profile data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String get _fullName {
    final user = AuthService.currentUser;
    if (user != null && user.displayName.isNotEmpty) {
      return user.displayName;
    }
    return "Student";
  }

  String get _displayName {
    if (_customDisplayName != null && _customDisplayName!.isNotEmpty) {
      return _customDisplayName!;
    }
    final user = AuthService.currentUser;
    if (user != null && user.nickname != null && user.nickname!.isNotEmpty) {
      return user.nickname!;
    }
    if (user != null && user.displayName.isNotEmpty) {
      return user.displayName;
    }
    return "Student";
  }

  String? _apiSection;
  String? _apiGradeLevel;

  String get _gradeLevel {
    final user = AuthService.currentUser;
    if (user != null && user.gradeLevel.isNotEmpty) {
      return user.gradeLevel.startsWith('Grade') ? user.gradeLevel : 'Grade ${user.gradeLevel}';
    }
    if (_apiGradeLevel != null && _apiGradeLevel!.isNotEmpty) {
      return _apiGradeLevel!.startsWith('Grade') ? _apiGradeLevel! : 'Grade $_apiGradeLevel';
    }
    final raw = user?.rawUser;
    final fallback = raw?['gradeLevel'] ?? raw?['grade_level'] ?? raw?['grade'];
    if (fallback != null && fallback.toString().isNotEmpty) {
      final str = fallback.toString().trim();
      return str.startsWith('Grade') ? str : 'Grade $str';
    }
    return "Unassigned";
  }

  String get _section {
    final user = AuthService.currentUser;
    if (user != null && user.sectionName.isNotEmpty) {
      return user.sectionName;
    }
    if (_apiSection != null && _apiSection!.isNotEmpty) {
      return _apiSection!;
    }
    final raw = user?.rawUser;
    final fallback = raw?['sectionName'] ?? raw?['section_name'] ?? raw?['section'];
    if (fallback != null && fallback.toString().isNotEmpty) {
      return fallback.toString().trim();
    }
    return "Unassigned";
  }

  String get _lrn {
    final user = AuthService.currentUser;
    if (user != null && user.lrn.isNotEmpty) {
      return user.lrn;
    }
    final raw = user?.rawUser;
    final fallback = raw?['id_no'] ?? raw?['lrn'];
    return fallback?.toString() ?? "N/A";
  }

  String get _parentAccessCode {
    final raw = AuthService.currentUser?.rawUser;
    final code = raw?['parentAccessCode'] ?? raw?['access_code'] ?? raw?['parent_access_code'];
    if (code != null && code.toString().isNotEmpty && code.toString() != 'N/A') {
      return code.toString();
    }
    // Generate fallback from student LRN if database does not return custom access_code yet
    final lrnStr = _lrn;
    if (lrnStr.length >= 5 && lrnStr != "N/A") {
      return "PAC-${lrnStr.substring(lrnStr.length - 5)}";
    }
    return "N/A";
  }

  String _selectedFrame = "None";

  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    AppToast.success(context, 'Parent access code copied to clipboard!');
  }

  String? _customAvatarUrl;
  bool _isNavigatingToEdit = false;

  Future<void> _navigateToEditProfile() async {
    if (_isNavigatingToEdit) return;
    _isNavigatingToEdit = true;

    try {
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => EditProfilePage(
            currentNickname: _displayName,
            currentAvatarUrl: _customAvatarUrl ?? '',
            currentFrame: _selectedFrame,
          ),
        ),
      );

      if (result != null && result is Map<String, dynamic> && mounted) {
        setState(() {
          _customDisplayName = result['nickname'] as String?;
          if (result['avatarUrl'] != null && (result['avatarUrl'] as String).isNotEmpty) {
            _customAvatarUrl = result['avatarUrl'] as String;
          }
          _selectedFrame = result['frame'] ?? _selectedFrame;
        });
        await _loadAllProfileData();
      }
    } finally {
      _isNavigatingToEdit = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const darkBlueBg = Color(0xFF195ECB);
    const softCreamBg = Color(0xFFFCFAF7);
    const textGray = Color(0xFF71717A);

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
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
                    // ── Header (Custom App Bar) ───────────────────────────────
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Iconify(
                              Ph.caret_left,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            'My Profile',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 48),
                        ],
                      ),
                    ),

                    // ── Scrollable Profile Details ────────────────────────────
                    Expanded(
                      child: RefreshIndicator(
                        color: primaryBlue,
                        backgroundColor: Colors.white,
                        onRefresh: _loadAllProfileData,
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                          padding: const EdgeInsets.symmetric(horizontal: 20.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              const SizedBox(height: 12),

                              // Profile Avatar with Frame styling
                              Center(
                                child: UserAvatar(
                                  size: 108,
                                  imageUrl: _customAvatarUrl,
                                  frame: _selectedFrame,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Display Name / Skeleton
                              if (_isLoading)
                                Center(
                                  child: Container(
                                    height: 24,
                                    width: 180,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE2E8F0),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                )
                              else
                                Center(
                                  child: Text(
                                    _displayName,
                                    style: GoogleFonts.inter(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.black,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 6),

                              // Grade & Section Subtitle / Skeleton
                              if (_isLoading)
                                Center(
                                  child: Container(
                                    height: 14,
                                    width: 120,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                )
                              else
                                Center(
                                  child: Text(
                                    '$_gradeLevel - $_section',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: textGray,
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 12),

                              // Edit Profile Button
                              Center(
                                child: InkWell(
                                  onTap: _navigateToEditProfile,
                                  borderRadius: BorderRadius.circular(100),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEAEAEA),
                                      borderRadius: BorderRadius.circular(100),
                                    ),
                                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                                    child: Text(
                                      'Edit Profile',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF555558),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // ── Blue Stats Card ───────────────────────────────────────
                              Container(
                                clipBehavior: Clip.antiAlias,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  gradient: const LinearGradient(
                                    colors: [primaryBlue, darkBlueBg],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: primaryBlue.withValues(alpha: 0.25),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Stack(
                                  children: [
                                    Positioned(
                                      right: 0,
                                      top: -12,
                                      bottom: -12,
                                      width: 200,
                                      child: Image.asset(
                                        'assets/student page/logo_bg.webp',
                                        fit: BoxFit.contain,
                                        alignment: Alignment.centerRight,
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 22.0, horizontal: 16.0),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                        children: [
                                          // Streak
                                          Row(
                                            children: [
                                              Iconify(PhIcons.fireBold, size: 32, color: Colors.white),
                                              const SizedBox(width: 8),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    '$_streakCount',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 22,
                                                      fontWeight: FontWeight.w800,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Streak',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w500,
                                                      color: Colors.white.withValues(alpha: 0.8),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                          Container(height: 32, width: 1, color: Colors.white.withValues(alpha: 0.2)),

                                          // Stories
                                          Row(
                                            children: [
                                              Iconify(PhIcons.booksRegular, size: 32, color: Colors.white),
                                              const SizedBox(width: 8),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    '$_completedStoriesCount',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 22,
                                                      fontWeight: FontWeight.w800,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Stories',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w500,
                                                      color: Colors.white.withValues(alpha: 0.8),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                          Container(height: 32, width: 1, color: Colors.white.withValues(alpha: 0.2)),

                                          // Badges
                                          Row(
                                            children: [
                                              Iconify(Ph.medal, size: 32, color: Colors.white),
                                              const SizedBox(width: 8),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    '$_unlockedBadgesCount',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 22,
                                                      fontWeight: FontWeight.w800,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                  Text(
                                                    'Badges',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w500,
                                                      color: Colors.white.withValues(alpha: 0.8),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 28),

                              // ── Basic Information Section ─────────────────────────────
                              _buildSectionHeader('Basic Information', Ph.user),
                              const SizedBox(height: 12),
                              if (_isLoading)
                                _buildSkeletonInfoCard()
                              else
                                Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.03),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  padding: const EdgeInsets.all(20.0),
                                  child: Column(
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(child: _buildInfoBlock('Full name', _fullName)),
                                          Expanded(child: _buildInfoBlock('Grade Level', _gradeLevel)),
                                        ],
                                      ),
                                      const SizedBox(height: 18),
                                      Row(
                                        children: [
                                          Expanded(child: _buildInfoBlock('LRN', _lrn)),
                                          Expanded(child: _buildInfoBlock('Section', _section)),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              const SizedBox(height: 28),

                              // ── Phil-IRI Reading Profiles Section ───────────────────────
                              _buildSectionHeader('Phil-IRI Reading Profiles', Ph.book_open),
                              const SizedBox(height: 12),
                              if (_isLoading)
                                _buildSkeletonPhilIriCard()
                              else
                                _buildPhilIriModalityProfilesCard(),
                              const SizedBox(height: 28),

                              // ── Parent Access Section ──────────────────────────────────
                              _buildSectionHeader('Parent Access', Ph.keyhole),
                              const SizedBox(height: 12),
                              if (_isLoading)
                                _buildSkeletonParentCard()
                              else
                                Container(
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.03),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  padding: const EdgeInsets.all(20.0),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Parent Access Code',
                                            style: GoogleFonts.inter(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: textGray,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Row(
                                            children: [
                                              Text(
                                                _parentAccessCode,
                                                style: GoogleFonts.inter(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.w800,
                                                  color: Colors.black,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              IconButton(
                                                onPressed: () => _copyToClipboard(_parentAccessCode),
                                                icon: const Iconify(
                                                  Ph.copy,
                                                  size: 20,
                                                  color: textGray,
                                                ),
                                                padding: EdgeInsets.zero,
                                                constraints: const BoxConstraints(),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              const SizedBox(height: 8),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                                child: Text(
                                  'Note: Parent must enter the student\'s LRN and access code to view progress.',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: textGray,
                                    height: 1.4,
                                  ),
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

  // ── Skeleton UI Cards ──────────────────────────────────────────────────────

  Widget _buildSkeletonInfoCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.all(20.0),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: _buildSkeletonBlock()),
              Expanded(child: _buildSkeletonBlock()),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(child: _buildSkeletonBlock()),
              Expanded(child: _buildSkeletonBlock()),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSkeletonBlock() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          height: 10,
          width: 70,
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          height: 14,
          width: 120,
          decoration: BoxDecoration(
            color: const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ],
    );
  }

  Widget _buildSkeletonPhilIriCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Container(
            height: 38,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 16),
          ...List.generate(3, (index) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
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
                          height: 12,
                          width: 110,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 10,
                          width: 150,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 70,
                    height: 24,
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

  Widget _buildSkeletonParentCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      padding: const EdgeInsets.all(20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 10,
                width: 110,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                height: 18,
                width: 130,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Helper UI builders ──────────────────────────────────────────────────────

  Widget _buildSectionHeader(String title, String iconSvg) {
    return Row(
      children: [
        Iconify(
          iconSvg,
          color: const Color(0xFF1B64D8),
          size: 24,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoBlock(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF71717A),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
      ],
    );
  }

  // ── Phil-IRI 3-Modality Profile Level Cards with Language Toggle ──
  Widget _buildPhilIriModalityProfilesCard() {
    final isFil = _selectedPhilIriLang == 'fil';

    final oralLevel = isFil
        ? (_readingProfiles?['filOralProfile']?.toString() ?? _readingProfiles?['oralProfile']?.toString() ?? 'Pending Evaluation')
        : (_readingProfiles?['engOralProfile']?.toString() ?? _readingProfiles?['oralProfile']?.toString() ?? 'Pending Evaluation');

    final listeningLevel = isFil
        ? (_readingProfiles?['filListeningProfile']?.toString() ?? _readingProfiles?['listeningProfile']?.toString() ?? 'Pending Evaluation')
        : (_readingProfiles?['engListeningProfile']?.toString() ?? _readingProfiles?['listeningProfile']?.toString() ?? 'Pending Evaluation');

    final silentLevel = isFil
        ? (_readingProfiles?['filSilentProfile']?.toString() ?? _readingProfiles?['silentProfile']?.toString() ?? 'Pending Evaluation')
        : (_readingProfiles?['engSilentProfile']?.toString() ?? _readingProfiles?['silentProfile']?.toString() ?? 'Pending Evaluation');

    final oralAcc = isFil
        ? (_readingProfiles?['filOralAccuracy'] ?? _readingProfiles?['oralAccuracy'])
        : (_readingProfiles?['engOralAccuracy'] ?? _readingProfiles?['oralAccuracy']);

    final oralComp = isFil
        ? (_readingProfiles?['filOralComprehension'] ?? _readingProfiles?['oralComprehension'])
        : (_readingProfiles?['engOralComprehension'] ?? _readingProfiles?['oralComprehension']);

    final listComp = isFil
        ? (_readingProfiles?['filListeningComprehension'] ?? _readingProfiles?['listeningComprehension'])
        : (_readingProfiles?['engListeningComprehension'] ?? _readingProfiles?['listeningComprehension']);

    final silentComp = isFil
        ? (_readingProfiles?['filSilentComprehension'] ?? _readingProfiles?['silentComprehension'])
        : (_readingProfiles?['engSilentComprehension'] ?? _readingProfiles?['silentComprehension']);

    final silentWpm = isFil
        ? (_readingProfiles?['filSilentWpm'] ?? _readingProfiles?['silentWpm'])
        : (_readingProfiles?['engSilentWpm'] ?? _readingProfiles?['silentWpm']);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 38,
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      Feedback.forTap(context);
                      setState(() => _selectedPhilIriLang = 'fil');
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: isFil ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: isFil
                            ? [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                )
                              ]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'Filipino',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: isFil ? FontWeight.w700 : FontWeight.w500,
                          color: isFil ? const Color(0xFF1B64D8) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      Feedback.forTap(context);
                      setState(() => _selectedPhilIriLang = 'en');
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: !isFil ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: !isFil
                            ? [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.05),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1),
                                )
                              ]
                            : null,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'English',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: !isFil ? FontWeight.w700 : FontWeight.w500,
                          color: !isFil ? const Color(0xFF1B64D8) : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          _buildModalityLevelRow(
            title: 'Oral Reading',
            subtitle: oralAcc != null && oralComp != null
                ? 'Accuracy: $oralAcc%  •  Comprehension: $oralComp%'
                : 'Word Reading & Comprehension',
            level: oralLevel,
            icon: PhIcons.userSoundBold,
            iconBg: const Color(0xFFD0E1F9),
            iconCol: const Color(0xFF1B64D8),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12.0),
            child: Divider(height: 1, color: Color(0xFFF1F5F9)),
          ),
          _buildModalityLevelRow(
            title: 'Listening Comprehension',
            subtitle: listComp != null
                ? 'Comprehension: $listComp%'
                : 'Listening Comprehension Score',
            level: listeningLevel,
            icon: PhIcons.earBold,
            iconBg: const Color(0xFFFEF3C7),
            iconCol: const Color(0xFFD97706),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12.0),
            child: Divider(height: 1, color: Color(0xFFF1F5F9)),
          ),
          _buildModalityLevelRow(
            title: 'Silent Reading',
            subtitle: silentComp != null
                ? 'Comprehension: $silentComp%${silentWpm != null ? '  •  $silentWpm WPM' : ''}'
                : 'Silent Comprehension & Speed',
            level: silentLevel,
            icon: PhIcons.bookOpenBold,
            iconBg: const Color(0xFFD1FAE5),
            iconCol: const Color(0xFF10B981),
          ),
        ],
      ),
    );
  }

  Widget _buildModalityLevelRow({
    required String title,
    required String subtitle,
    required String level,
    required String icon,
    required Color iconBg,
    required Color iconCol,
  }) {
    Color badgeBg;
    Color badgeBorder;
    Color badgeTextCol;
    String displayLevel;

    final lvl = level.toLowerCase().trim();
    if (lvl.contains('independ')) {
      badgeBg = const Color(0xFFECFDF5);
      badgeBorder = const Color(0xFFA7F3D0);
      badgeTextCol = const Color(0xFF047857);
      displayLevel = 'Independent';
    } else if (lvl.contains('instruct')) {
      badgeBg = const Color(0xFFFFFBEB);
      badgeBorder = const Color(0xFFFDE68A);
      badgeTextCol = const Color(0xFFB45309);
      displayLevel = 'Instructional';
    } else if (lvl.contains('frustrat')) {
      badgeBg = const Color(0xFFFEF2F2);
      badgeBorder = const Color(0xFFFECACA);
      badgeTextCol = const Color(0xFFB91C1C);
      displayLevel = 'Frustration';
    } else {
      badgeBg = const Color(0xFFF4F4F5);
      badgeBorder = const Color(0xFFE4E4E7);
      badgeTextCol = const Color(0xFF71717A);
      displayLevel = 'Pending';
    }

    return Row(
      children: [
        Container(
          width: 42,
          height: 42,
          decoration: BoxDecoration(
            color: iconBg,
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: Iconify(
            icon,
            color: iconCol,
            size: 20,
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
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF71717A),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: badgeBg,
            borderRadius: BorderRadius.circular(100),
            border: Border.all(color: badgeBorder, width: 1),
          ),
          child: Text(
            displayLevel,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: badgeTextCol,
            ),
          ),
        ),
      ],
    );
  }
}

