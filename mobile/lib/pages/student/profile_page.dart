import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/edit_profile_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {


  // Profile data state
  final String _fullName = "Doechii E. Carganilla";
  String _displayName = "Doechii Carganilla";
  final String _gradeLevel = "Grade 4";
  final String _section = "Malinis";
  final String _lrn = "1366 7010 0099";
  final String _email = "doechii@edu.org.ph";
  String _parentAccessCode = "ABCD-1234";
  String _avatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300";
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
      _parentAccessCode = "$part1-$part2";
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('New parent access code generated!', style: GoogleFonts.inter()),
        backgroundColor: const Color(0xFF1B64D8),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  // Function to copy text to clipboard
  void _copyToClipboard(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Copied code to clipboard!', style: GoogleFonts.inter()),
        backgroundColor: const Color(0xFF00A859),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  // Navigate to Edit Profile Page
  Future<void> _navigateToEditProfile() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditProfilePage(
          currentNickname: _displayName,
          currentAvatarUrl: _avatarUrl,
          currentFrame: _selectedFrame,
        ),
      ),
    );

    if (result != null && result is Map<String, dynamic>) {
      setState(() {
        _displayName = result['nickname'] ?? _displayName;
        _avatarUrl = result['avatarUrl'] ?? _avatarUrl;
        _selectedFrame = result['frame'] ?? _selectedFrame;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Profile updated successfully!', style: GoogleFonts.inter()),
          backgroundColor: const Color(0xFF00A859),
        ),
      );
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
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
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
                                child: CircleAvatar(
                                  radius: 54,
                                  backgroundImage: NetworkImage(_avatarUrl),
                                  backgroundColor: Colors.grey[200],
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
                                '$_gradeLevel- $_section',
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
                                    right: -10,
                                    bottom: -20,
                                    width: 140,
                                    height: 140,
                                    child: Opacity(
                                      opacity: 0.1,
                                      child: Image.asset(
                                        'assets/logo/logo_v2.webp',
                                        color: Colors.white,
                                        fit: BoxFit.contain,
                                      ),
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
                                              PhIcons.bookBold,
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
                                              PhIcons.shieldBold, // Medal icon representation
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

                            // ── Parent Access Section ──────────────────────────────────
                            _buildSectionHeader('Parent Access', Ph.shield_check),
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
                            _buildSectionHeader('Account Settings', Ph.gear),
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
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  _buildInfoBlock('Email', _email),
                                  const SizedBox(height: 18),
                                  _buildInfoBlock('Current Password', '••••••••'),
                                ],
                              ),
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
}
