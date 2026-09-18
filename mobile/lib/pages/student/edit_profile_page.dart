import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:image_picker/image_picker.dart';
import 'package:salintinig/services/analytics_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:salintinig/widgets/crop_profile_photo_dialog.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class EditProfilePage extends StatefulWidget {
  final String currentNickname;
  final String currentAvatarUrl;
  final String currentFrame;
  final int? userXp;

  const EditProfilePage({
    super.key,
    required this.currentNickname,
    required this.currentAvatarUrl,
    required this.currentFrame,
    this.userXp,
  });

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  late TextEditingController _nicknameController;
  late String _avatarUrl;
  late String _selectedFrame;
  late int _userXp;
  bool _isSaving = false;

  Future<void> _handleSaveChanges() async {
    if (_isSaving) return;

    final nick = _nicknameController.text.trim();
    if (nick.isEmpty) {
      AppToast.error(context, 'Nickname cannot be empty!');
      return;
    }

    setState(() => _isSaving = true);
    AppToast.info(context, 'Saving profile changes...');

    try {
      final res = await AuthService.updateStudentProfile(
        nickname: nick,
        avatarUrl: _avatarUrl,
        frame: _selectedFrame,
      );

      if (!mounted) return;

      if (res.success) {
        AppToast.success(context, 'Profile updated successfully!');
        Navigator.pop(context, {
          'nickname': nick,
          'avatarUrl': _avatarUrl,
          'frame': _selectedFrame,
        });
      } else {
        if (mounted) setState(() => _isSaving = false);
        final errMsg = (res.message != null && res.message!.isNotEmpty)
            ? res.message!
            : 'Failed to save profile changes.';
        AppToast.error(context, errMsg);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        AppToast.error(context, 'Error updating profile: $e');
      }
    }
  }

  // Preset avatars lists (Child-friendly mascot & animal avatars)
  final List<String> _presets = [
    'assets/avatars/avatar_1.png',
    'assets/avatars/avatar_2.png',
    'assets/avatars/avatar_3.png',
    'assets/avatars/avatar_4.png',
    'assets/avatars/avatar_5.png',
    'assets/avatars/avatar_6.png',
    'assets/avatars/avatar_7.png',
    'assets/avatars/avatar_8.png',
  ];

  // Border frames details with XP requirement thresholds
  final Map<String, dynamic> _frames = {
    'None': {
      'color': Colors.transparent,
      'width': 0.0,
      'glow': false,
      'requiredXp': 0,
    },
    'Bronze': {
      'color': const Color(0xFFCD7F32),
      'width': 4.0,
      'glow': false,
      'requiredXp': 2500,
    },
    'Silver': {
      'color': const Color(0xFFC0C0C0),
      'width': 4.0,
      'glow': false,
      'requiredXp': 8000,
    },
    'Gold Star': {
      'color': const Color(0xFFF59E0B),
      'width': 4.0,
      'glow': true,
      'requiredXp': 20000,
    },
    'Cosmic Neon': {
      'color': const Color(0xFF8B5CF6),
      'width': 4.0,
      'glow': true,
      'requiredXp': 50000,
    },
  };

  @override
  void initState() {
    super.initState();
    _nicknameController = TextEditingController(text: widget.currentNickname);
    _avatarUrl = widget.currentAvatarUrl;
    _selectedFrame = widget.currentFrame;
    _userXp = widget.userXp ?? AnalyticsService.cachedAnalytics?.totalXp ?? 0;
    _loadUserXp();
  }

  Future<void> _loadUserXp() async {
    final analytics = await AnalyticsService.fetchAnalytics();
    if (analytics != null && mounted) {
      setState(() {
        _userXp = analytics.totalXp;
      });
    }
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    super.dispose();
  }

  // Simulate image upload dialog
  Future<void> _pickAndCropImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: source,
        maxWidth: 500,
        maxHeight: 500,
        imageQuality: 80,
      );

      if (file != null && mounted) {
        final croppedBytes = await showDialog<Uint8List>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => CropProfilePhotoDialog(imageFile: file),
        );

        if (croppedBytes != null && mounted) {
          final base64Str = 'data:image/png;base64,${base64Encode(croppedBytes)}';
          setState(() {
            _avatarUrl = base64Str;
          });
          AppToast.success(context, 'Profile picture updated successfully!');
        }
      }
    } catch (e) {
      if (mounted) {
        AppToast.error(context, 'Failed to pick photo: ${e.toString()}');
      }
    }
  }

  void _showUploadDialog() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Change Profile Photo',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(Icons.photo_library_rounded, color: Color(0xFF1B64D8)),
                title: Text('Choose from Gallery', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndCropImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt_rounded, color: Color(0xFF1B64D8)),
                title: Text('Take a Photo', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickAndCropImage(ImageSource.camera);
                },
              ),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const softCreamBg = Color(0xFFF8FAFC);
    const primaryBlue = Color(0xFF1B64D8);

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
                    // ── Modern Header App Bar ───────────────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        border: Border(
                          bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Material(
                            color: Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            child: IconButton(
                              onPressed: () => Navigator.pop(context),
                              icon: const Iconify(
                                Ph.caret_left_bold,
                                size: 24,
                                color: Color(0xFF1E293B),
                              ),
                              tooltip: 'Back',
                            ),
                          ),
                          Text(
                            'Edit Profile',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(width: 48),
                        ],
                      ),
                    ),

                    // ── Scrollable Form Area ──────────────────────────────────
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // ── Card 1: Avatar Profile Photo Section ──
                            Container(
                              padding: const EdgeInsets.all(20.0),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                children: [
                                  Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      UserAvatar(
                                        size: 108,
                                        imageUrl: _avatarUrl,
                                        frame: _selectedFrame,
                                      ),
                                      // Floating Camera Badge Button
                                      Positioned(
                                        right: 0,
                                        bottom: 0,
                                        child: Material(
                                          color: primaryBlue,
                                          shape: const CircleBorder(),
                                          elevation: 3,
                                          shadowColor: primaryBlue.withValues(alpha: 0.4),
                                          child: InkWell(
                                            customBorder: const CircleBorder(),
                                            onTap: _showUploadDialog,
                                            child: const Padding(
                                              padding: EdgeInsets.all(9.0),
                                              child: Iconify(
                                                Ph.camera_bold,
                                                size: 18,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  OutlinedButton.icon(
                                    onPressed: _showUploadDialog,
                                    icon: const Iconify(
                                      Ph.upload_simple_bold,
                                      size: 16,
                                      color: primaryBlue,
                                    ),
                                    label: Text(
                                      'Upload New Photo',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: primaryBlue,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Color(0xFFBFDBFE), width: 1.5),
                                      backgroundColor: const Color(0xFFEFF6FF),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(100),
                                      ),
                                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // ── Card 2: Nickname Input ──
                            Container(
                              padding: const EdgeInsets.all(20.0),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Iconify(
                                        Ph.user_bold,
                                        size: 18,
                                        color: primaryBlue,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Nickname',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF1E293B),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  TextField(
                                    controller: _nicknameController,
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: const Color(0xFF0F172A),
                                    ),
                                    decoration: InputDecoration(
                                      hintText: 'Enter your nickname...',
                                      hintStyle: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w400,
                                        color: const Color(0xFF64748B),
                                      ),
                                      filled: true,
                                      fillColor: const Color(0xFFF8FAFC),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(14),
                                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(14),
                                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(14),
                                        borderSide: const BorderSide(color: primaryBlue, width: 2),
                                      ),
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // ── Card 3: Preset Avatars ──
                            Container(
                              padding: const EdgeInsets.all(20.0),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      const Iconify(
                                        Ph.user_circle_gear_bold,
                                        size: 18,
                                        color: primaryBlue,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Select Preset Avatar',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: const Color(0xFF1E293B),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  SizedBox(
                                    height: 72,
                                    child: ListView.separated(
                                      scrollDirection: Axis.horizontal,
                                      physics: const BouncingScrollPhysics(),
                                      itemCount: _presets.length,
                                      separatorBuilder: (context, index) => const SizedBox(width: 14),
                                      itemBuilder: (context, index) {
                                        final url = _presets[index];
                                        final isSelected = _avatarUrl == url;
                                        return GestureDetector(
                                          onTap: () {
                                            setState(() {
                                              _avatarUrl = url;
                                            });
                                          },
                                          child: Stack(
                                            children: [
                                              AnimatedContainer(
                                                duration: const Duration(milliseconds: 200),
                                                padding: const EdgeInsets.all(2),
                                                decoration: BoxDecoration(
                                                  shape: BoxShape.circle,
                                                  border: Border.all(
                                                    color: isSelected ? primaryBlue : Colors.transparent,
                                                    width: 3.0,
                                                  ),
                                                  boxShadow: isSelected
                                                      ? [
                                                          BoxShadow(
                                                            color: primaryBlue.withValues(alpha: 0.3),
                                                            blurRadius: 8,
                                                            offset: const Offset(0, 2),
                                                          ),
                                                        ]
                                                      : [],
                                                ),
                                                child: InitialsAvatar(
                                                  radius: 30,
                                                  name: 'Avatar',
                                                  imageUrl: url,
                                                ),
                                              ),
                                              if (isSelected)
                                                Positioned(
                                                  right: 0,
                                                  bottom: 0,
                                                  child: Container(
                                                    padding: const EdgeInsets.all(2),
                                                    decoration: const BoxDecoration(
                                                      color: primaryBlue,
                                                      shape: BoxShape.circle,
                                                    ),
                                                    child: const Icon(
                                                      Icons.check_rounded,
                                                      size: 12,
                                                      color: Colors.white,
                                                    ),
                                                  ),
                                                ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // ── Card 4: Unlockable Avatar Borders ──
                            Container(
                              padding: const EdgeInsets.all(20.0),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
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
                                      Row(
                                        children: [
                                          const Iconify(
                                            Ph.sparkle_bold,
                                            size: 18,
                                            color: Color(0xFFF59E0B),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            'Unlockable Avatar Borders',
                                            style: GoogleFonts.inter(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              color: const Color(0xFF1E293B),
                                            ),
                                          ),
                                        ],
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFFF7ED),
                                          borderRadius: BorderRadius.circular(100),
                                          border: Border.all(color: const Color(0xFFFFEDD5)),
                                        ),
                                        child: Row(
                                          children: [
                                            const Iconify(
                                              Ph.lightning_fill,
                                              size: 12,
                                              color: Color(0xFFF59E0B),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              '$_userXp XP',
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFFC2410C),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  Column(
                                    children: _frames.keys.map((frameName) {
                                      final isSelected = _selectedFrame == frameName;
                                      final fData = _frames[frameName];
                                      final reqXp = (fData['requiredXp'] as int?) ?? 0;
                                      final isUnlocked = _userXp >= reqXp;

                                      final formattedXp = reqXp == 0
                                          ? 'Free'
                                          : '${reqXp.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')} XP';

                                      return Padding(
                                        padding: const EdgeInsets.only(bottom: 8.0),
                                        child: Material(
                                          color: isSelected
                                              ? primaryBlue.withValues(alpha: 0.05)
                                              : isUnlocked
                                                  ? const Color(0xFFF8FAFC)
                                                  : const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(14),
                                          child: InkWell(
                                            borderRadius: BorderRadius.circular(14),
                                            onTap: () {
                                              if (!isUnlocked) {
                                                AppToast.error(
                                                  context,
                                                  'You need $formattedXp to unlock $frameName frame! (Current: $_userXp XP)',
                                                );
                                                return;
                                              }
                                              setState(() {
                                                _selectedFrame = frameName;
                                              });
                                            },
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                              decoration: BoxDecoration(
                                                borderRadius: BorderRadius.circular(14),
                                                border: Border.all(
                                                  color: isSelected
                                                      ? primaryBlue
                                                      : isUnlocked
                                                          ? const Color(0xFFE2E8F0)
                                                          : const Color(0xFFCBD5E1).withValues(alpha: 0.5),
                                                  width: isSelected ? 2.0 : 1.0,
                                                ),
                                              ),
                                              child: Row(
                                                children: [
                                                  // Color ring preview
                                                  UserAvatar(
                                                    size: 28,
                                                    imageUrl: _avatarUrl,
                                                    frame: frameName,
                                                  ),
                                                  const SizedBox(width: 12),
                                                  // Title and XP requirement
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Text(
                                                          frameName,
                                                          style: GoogleFonts.inter(
                                                            fontSize: 14,
                                                            fontWeight:
                                                                isSelected ? FontWeight.w800 : FontWeight.w700,
                                                            color: isUnlocked
                                                                ? const Color(0xFF0F172A)
                                                                : const Color(0xFF64748B),
                                                          ),
                                                        ),
                                                        Text(
                                                          reqXp == 0
                                                              ? 'Default Frame'
                                                              : 'Requires $formattedXp',
                                                          style: GoogleFonts.inter(
                                                            fontSize: 12,
                                                            fontWeight: FontWeight.w500,
                                                            color: isUnlocked
                                                                ? const Color(0xFF64748B)
                                                                : const Color(0xFF94A3B8),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                  // Lock icon or Selection indicator
                                                  if (!isUnlocked)
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(
                                                          horizontal: 8, vertical: 4),
                                                      decoration: BoxDecoration(
                                                        color: const Color(0xFFE2E8F0),
                                                        borderRadius: BorderRadius.circular(100),
                                                      ),
                                                      child: Row(
                                                        children: [
                                                          const Iconify(
                                                            Ph.lock_key_fill,
                                                            size: 13,
                                                            color: Color(0xFF64748B),
                                                          ),
                                                          const SizedBox(width: 4),
                                                          Text(
                                                            'Locked',
                                                            style: GoogleFonts.inter(
                                                              fontSize: 11,
                                                              fontWeight: FontWeight.w700,
                                                              color: const Color(0xFF64748B),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    )
                                                  else if (isSelected)
                                                    Container(
                                                      padding: const EdgeInsets.all(4),
                                                      decoration: const BoxDecoration(
                                                        color: primaryBlue,
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: const Icon(
                                                        Icons.check_rounded,
                                                        size: 14,
                                                        color: Colors.white,
                                                      ),
                                                    ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 28),

                            // ── Save Changes Primary Action Button ──
                            ElevatedButton(
                              onPressed: _isSaving ? null : _handleSaveChanges,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryBlue,
                                disabledBackgroundColor: primaryBlue.withValues(alpha: 0.6),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (_isSaving) ...[
                                    const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: Colors.white,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'Saving Changes...',
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ] else ...[
                                    const Iconify(
                                      Ph.floppy_disk_back_bold,
                                      size: 20,
                                      color: Colors.white,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Save Changes',
                                      style: GoogleFonts.inter(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
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
}

