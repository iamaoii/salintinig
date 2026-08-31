import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/edit_profile_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String? _customDisplayName;
  Map<String, dynamic>? _readingProfiles;
  String _selectedPhilIriLang = 'fil';

  @override
  void initState() {
    super.initState();
    _fetchProfileData();
  }

  Future<void> _fetchProfileData() async {
    try {
      final res = await ApiService.get('/students/assessment/my-assignment');
      if (res.success && res.data != null && res.data['readingProfiles'] != null) {
        if (mounted) {
          setState(() {
            _readingProfiles = res.data['readingProfiles'] as Map<String, dynamic>?;
          });
        }
      }
    } catch (e) {
      debugPrint('[ProfilePage] error fetching reading profiles: $e');
    }
  }

  String get _fullName {
    final user = AuthService.currentUser;
    if (user != null && user.displayName.isNotEmpty) {
      return user.displayName;
    }
    return "Doechii E. Carganilla";
  }

  String get _displayName {
    if (_customDisplayName != null && _customDisplayName!.isNotEmpty) {
      return _customDisplayName!;
    }
    final user = AuthService.currentUser;
    if (user != null && user.displayName.isNotEmpty) {
      return user.displayName;
    }
    return "Doechii Carganilla";
  }

  String get _gradeLevel {
    final user = AuthService.currentUser;
    if (user != null && user.gradeLevel.isNotEmpty) {
      return user.gradeLevel.startsWith('Grade') ? user.gradeLevel : 'Grade ${user.gradeLevel}';
    }
    return "Grade 4";
  }

  String get _section {
    final user = AuthService.currentUser;
    if (user != null && user.sectionName.isNotEmpty) {
      return user.sectionName;
    }
    return "Fyang";
  }

  String get _lrn {
    final user = AuthService.currentUser;
    if (user != null && user.lrn.isNotEmpty) {
      return user.lrn;
    }
    final raw = user?.rawUser;
    return raw?['id_no'] ?? raw?['lrn'] ?? "N/A";
  }

  String? _customParentAccessCode;

  String get _parentAccessCode {
    if (_customParentAccessCode != null && _customParentAccessCode!.isNotEmpty) {
      return _customParentAccessCode!;
    }
    final raw = AuthService.currentUser?.rawUser;
    return raw?['parentAccessCode'] ?? raw?['access_code'] ?? "PAC-9SA7HJ";
  }

  String _selectedFrame = "None";

  // Border frames details
  final Map<String, dynamic> _frames = {
    'None': {
      'color': Colors.transparent,
      'width': 0.0,
      'glow': false,
    },
    'Bronze': {
      'color': const Color(0xFFCD7F32),
      'width': 4.0,
      'glow': false,
    },
    'Silver': {
      'color': const Color(0xFFC0C0C0),
      'width': 4.0,
      'glow': false,
    },
    'Gold Star': {
      'color': const Color(0xFFFFD700),
      'width': 4.0,
      'glow': true,
    },
    'Cosmic Neon': {
      'color': const Color(0xFF8B5CF6),
      'width': 4.0,
      'glow': true,
    },
  };

  // Mock stats
  final int _streak = 5;
  final int _stories = 16;
  final int _badges = 5;

  // Function to generate a new parent access code
  void _generateNewAccessCode() {
    final chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    final random = DateTime.now().millisecondsSinceEpoch;
    String part1 = '';
    String part2 = '';
    
    for (int i = 0; i < 4; i++) {
      part1 += chars[(random + i * 7) % chars.length];
      part2 += chars[(random + i * 13 + 5) % chars.length];
    }
    
    setState(() {
      _customParentAccessCode = "$part1-$part2";
    });
  }

  // Function to copy text to clipboard
  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
  }

  // Navigate to Edit Profile Page
  Future<void> _navigateToEditProfile() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditProfilePage(
          currentNickname: _displayName,
          currentAvatarUrl: '',
          currentFrame: _selectedFrame,
        ),
      ),
    );

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _customDisplayName = result['nickname'] as String?;
        _selectedFrame = result['frame'] ?? _selectedFrame;
      });
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
                          // Left Back Arrow
                          IconButton(
                            onPressed: () {
                              Navigator.pop(context);
                            },
                            icon: const Iconify(
                              Ph.caret_left,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          // Center Title
                          Text(
                            'My Profile',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          // Right Spacer to keep title centered
                          const SizedBox(width: 48),
                        ],
                      ),
                    ),

                    // ── Scrollable Profile Details ────────────────────────────
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
                          padding: const EdgeInsets.symmetric(horizontal: 20.0),
                          child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 12),

                            // Profile Avatar with Frame styling
                            Center(
                              child: Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: _frames[_selectedFrame]?['color'] ?? Colors.transparent,
                                    width: (_frames[_selectedFrame]?['width'] ?? 0.0) as double,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: (_frames[_selectedFrame]?['glow'] ?? false) as bool
                                          ? ((_frames[_selectedFrame]?['color'] ?? Colors.transparent) as Color).withValues(alpha: 0.5)
                                          : Colors.black.withValues(alpha: 0.1),
                                      blurRadius: (_frames[_selectedFrame]?['glow'] ?? false) as bool ? 18 : 12,
                                      spreadRadius: (_frames[_selectedFrame]?['glow'] ?? false) as bool ? 2 : 0,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: const UserAvatar(
                                  size: 108,
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Display Name
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
                            const SizedBox(height: 4),

                            // Grade & Section Subtitle
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
                                  // Translucent background watermark design
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
                                  // Stats Content
                                  Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 22.0, horizontal: 16.0),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                      children: [
                                        // Streak Item
                                        Row(
                                          children: [
                                            Iconify(
                                              PhIcons.fireBold,
                                              size: 32,
                                              color: Colors.white,
                                            ),
                                            const SizedBox(width: 8),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  '$_streak',
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

                                        // Divider line
                                        Container(
                                          height: 32,
                                          width: 1,
                                          color: Colors.white.withValues(alpha: 0.2),
                                        ),

                                        // Stories Item
                                        Row(
                                          children: [
                                            Iconify(
                                              PhIcons.booksRegular,
                                              size: 32,
                                              color: Colors.white,
                                            ),
                                            const SizedBox(width: 8),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  '$_stories',
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

                                        // Divider line
                                        Container(
                                          height: 32,
                                          width: 1,
                                          color: Colors.white.withValues(alpha: 0.2),
                                        ),

                                        // Badges Item
                                        Row(
                                          children: [
                                            Iconify(
                                              Ph.medal,
                                              size: 32,
                                              color: Colors.white,
                                            ),
                                            const SizedBox(width: 8),
                                            Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  '$_badges',
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
                                      Expanded(
                                        child: _buildInfoBlock('Full name', _fullName),
                                      ),
                                      Expanded(
                                        child: _buildInfoBlock('Grade Level', _gradeLevel),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 18),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildInfoBlock('LRN', _lrn),
                                      ),
                                      Expanded(
                                        child: _buildInfoBlock('Section', _section),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 28),

                            // ── Phil-IRI Reading Profiles Section ───────────────────────
                            _buildSectionHeader('Phil-IRI Reading Profiles', Ph.book_open),
                            const SizedBox(height: 12),
                            _buildPhilIriModalityProfilesCard(),
                            const SizedBox(height: 28),

                            // ── Parent Access Section ──────────────────────────────────
                            _buildSectionHeader('Parent Access', Ph.keyhole),
                            const SizedBox(height: 12),
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
                                  ElevatedButton(
                                    onPressed: _generateNewAccessCode,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: primaryBlue,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(100),
                                      ),
                                      elevation: 0,
                                    ),
                                    child: Text(
                                      'New Code',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
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
                            const SizedBox(height: 28),

                            // ── Account Settings Section ───────────────────────────────
                            const SizedBox.shrink(),
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
          // ── Language Toggle Switch (Simplified without flags) ──
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
