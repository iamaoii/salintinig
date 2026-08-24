import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:image_picker/image_picker.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:salintinig/widgets/crop_profile_photo_dialog.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class EditProfilePage extends StatefulWidget {
  final String currentNickname;
  final String currentAvatarUrl;
  final String currentFrame;

  const EditProfilePage({
    super.key,
    required this.currentNickname,
    required this.currentAvatarUrl,
    required this.currentFrame,
  });

  @override
  State<EditProfilePage> createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage> {
  late TextEditingController _nicknameController;
  late String _avatarUrl;
  late String _selectedFrame;

  // Preset avatars lists
  final List<String> _presets = [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', // Neil Patrick Harris portrait (mockup original)
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // Boy glasses
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // Girl smile
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', // Boy yellow shirt
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', // Girl green
  ];

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

  @override
  void initState() {
    super.initState();
    _nicknameController = TextEditingController(text: widget.currentNickname);
    _avatarUrl = widget.currentAvatarUrl;
    _selectedFrame = widget.currentFrame;
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
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 90,
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
    const softCreamBg = Color(0xFFFCFAF7);
    const textGray = Color(0xFF71717A);
    const primaryYellow = Color(0xFFFFBF00);

    final frameData = _frames[_selectedFrame] ?? _frames['None'];
    final frameColor = frameData['color'] as Color;
    final frameWidth = frameData['width'] as double;
    final hasGlow = frameData['glow'] as bool;

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
                            onPressed: () {
                              Navigator.pop(context);
                            },
                            icon: const Iconify(
                              Ph.caret_left,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            'Edit Profile',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 48), // Right Spacer
                        ],
                      ),
                    ),

                    // ── Scrollable Edit Form ──────────────────────────────────
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 18),

                            // Avatar Circle Preview with selected frame and shadow glow
                            Center(
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 250),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: frameColor,
                                    width: frameWidth,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: hasGlow
                                          ? frameColor.withValues(alpha: 0.5)
                                          : Colors.black.withValues(alpha: 0.1),
                                      blurRadius: hasGlow ? 18 : 12,
                                      spreadRadius: hasGlow ? 2 : 0,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: InitialsAvatar(
                                  radius: 64,
                                  name: widget.currentNickname,
                                  imageUrl: _avatarUrl,
                                ),
                              ),
                            ),
                            const SizedBox(height: 12),

                            // Upload Button
                            Center(
                              child: TextButton(
                                onPressed: _showUploadDialog,
                                style: TextButton.styleFrom(
                                  foregroundColor: const Color(0xFF1B64D8),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                ),
                                child: Text(
                                  'Upload new profile',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 24),

                            // Nickname Input
                            Text(
                              'Nickname',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: textGray,
                              ),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _nicknameController,
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Enter nickname...',
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(color: Color(0xFF1B64D8), width: 1.5),
                                ),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                              ),
                            ),
                            const SizedBox(height: 28),

                            // Preset Avatars Grid header
                            Text(
                              'Select Preset Avatar',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Horizontal list of preset avatars
                            SizedBox(
                              height: 68,
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
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 200),
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected ? const Color(0xFF1B64D8) : Colors.transparent,
                                          width: 3.0,
                                        ),
                                      ),
                                       child: InitialsAvatar(
                                         radius: 30,
                                         name: 'Avatar',
                                         imageUrl: url,
                                       ),
                                    ),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(height: 28),

                            // Avatar Frames Selector Header
                            Text(
                              'Unlockable Avatar Borders',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Horizontal chip list of frames
                            Wrap(
                              spacing: 8,
                              runSpacing: 10,
                              children: _frames.keys.map((frameName) {
                                final isSelected = _selectedFrame == frameName;
                                final fData = _frames[frameName];
                                final fColor = fData['color'] as Color;

                                return ChoiceChip(
                                  label: Text(
                                    frameName,
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                      color: isSelected ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                  selected: isSelected,
                                  onSelected: (selected) {
                                    if (selected) {
                                      setState(() {
                                        _selectedFrame = frameName;
                                      });
                                    }
                                  },
                                  selectedColor: const Color(0xFF1B64D8),
                                  backgroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(100),
                                    side: BorderSide(
                                      color: isSelected
                                          ? Colors.transparent
                                          : fColor != Colors.transparent
                                              ? fColor
                                              : const Color(0xFFE4E4E7),
                                      width: 1.5,
                                    ),
                                  ),
                                  elevation: isSelected ? 2 : 0,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 48),

                            // Save changes button (Yellow, with sync/refresh icon, matching Image 1)
                            ElevatedButton(
                              onPressed: () {
                                final nick = _nicknameController.text.trim();
                                if (nick.isEmpty) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Nickname cannot be empty!', style: GoogleFonts.inter()),
                                      backgroundColor: const Color(0xFFEF4444),
                                    ),
                                  );
                                  return;
                                }

                                Navigator.pop(context, {
                                  'nickname': nick,
                                  'avatarUrl': _avatarUrl,
                                  'frame': _selectedFrame,
                                });
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryYellow,
                                foregroundColor: Colors.white,
                                elevation: 2,
                                shadowColor: primaryYellow.withValues(alpha: 0.3),
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Iconify(
                                    Ph.arrows_counter_clockwise, // Sync/refresh icon representation
                                    size: 20,
                                    color: Colors.white,
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    'Save changes',
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
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
