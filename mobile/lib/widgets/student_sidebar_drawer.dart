import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/student/profile_page.dart';
import 'package:salintinig/pages/student/settings_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class StudentSidebarDrawer extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int>? onItemSelected;

  const StudentSidebarDrawer({
    super.key,
    required this.currentIndex,
    this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    final user = AuthService.currentUser;
    final String studentName = user?.displayName ?? 'Student';
    final String? studentImageUrl = (user?.rawUser?['profileImage'] ?? user?.rawUser?['profile_image'])?.toString();

    const navItems = [
      {'icon': Ph.house, 'isSvg': false, 'label': 'Home'},
      {'icon': PhIcons.examRegular, 'isSvg': true, 'label': 'Phil-IRI Assessment'},
      {'icon': PhIcons.bookOpenRegular, 'isSvg': true, 'label': 'Library'},
      {'icon': PhIcons.puzzlePieceRegular, 'isSvg': true, 'label': 'Activities'},
      {'icon': PhIcons.hourglassRegular, 'isSvg': true, 'label': 'Progress'},
    ];

    return Drawer(
      width: 290,
      backgroundColor: primaryBlue,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Container(
        color: primaryBlue,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header (Logo + Brand Name) ──────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                child: Row(
                  children: [
                    Image.asset(
                      'assets/logo/logo_v2.webp',
                      height: 32,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'SalinTinig',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
              ),

              // ── Navigation Items ────────────────────────────────────────────
              Expanded(
                child: ListView.builder(
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: navItems.length,
                  itemBuilder: (context, index) {
                    final item = navItems[index];
                    final isSelected = currentIndex == index;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Material(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            Navigator.of(context).pop();
                            if (onItemSelected != null) {
                              onItemSelected!(index);
                            }
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: isSelected ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                // Render either native Iconify SVG or custom SVG string
                                SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: item['isSvg'] == true
                                      ? Iconify(
                                          item['icon'] as String,
                                          size: 24,
                                          color: isSelected ? primaryBlue : Colors.white,
                                        )
                                      : Iconify(
                                          item['icon'] as String,
                                          size: 24,
                                          color: isSelected ? primaryBlue : Colors.white,
                                        ),
                                ),
                                const SizedBox(width: 16),
                                Text(
                                  item['label'] as String,
                                  style: GoogleFonts.inter(
                                    fontSize: 16,
                                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                                    color: isSelected ? primaryBlue : Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // ── Translucent Divider ─────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Divider(
                  color: Colors.white.withValues(alpha: 0.2),
                  thickness: 1.5,
                ),
              ),

              // ── Bottom Items (My Profile, Settings, Logout) ──────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    // 1. My Profile
                    _buildBottomMenuItem(
                      iconWidget: InitialsAvatar(
                        name: studentName,
                        imageUrl: studentImageUrl,
                        radius: 11,
                        fontSize: 10,
                      ),
                      label: 'My Profile',
                      isSelected: currentIndex == 5,
                      onTap: () {
                        Navigator.of(context).pop();
                        if (currentIndex != 5) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const ProfilePage(),
                            ),
                          );
                        }
                      },
                    ),
                    const SizedBox(height: 6),

                    // 2. Settings
                    _buildBottomMenuItem(
                      iconWidget: Iconify(
                        Ph.gear,
                        size: 22,
                        color: currentIndex == 6 ? primaryBlue : Colors.white,
                      ),
                      label: 'Settings',
                      isSelected: currentIndex == 6,
                      onTap: () {
                        Navigator.of(context).pop();
                        if (currentIndex != 6) {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const SettingsPage(),
                            ),
                          );
                        }
                      },
                    ),
                    const SizedBox(height: 6),

                    // 3. Logout
                    _buildBottomMenuItem(
                      iconWidget: const Iconify(
                        Ph.sign_out,
                        size: 22,
                        color: Colors.white,
                      ),
                      label: 'Logout',
                      onTap: () {
                        Navigator.of(context).pop();
                        AuthService.showLogoutDialog(context);
                      },
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomMenuItem({
    required Widget iconWidget,
    required String label,
    required VoidCallback onTap,
    bool isSelected = false,
  }) {
    const primaryBlue = Color(0xFF1B64D8);
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Center(child: iconWidget),
              ),
              const SizedBox(width: 16),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  color: isSelected ? primaryBlue : Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
