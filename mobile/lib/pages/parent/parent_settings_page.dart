import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/widgets/parent_sidebar_drawer.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/parent_portal_cache_service.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ParentSettingsPage extends StatefulWidget {
  const ParentSettingsPage({super.key});

  @override
  State<ParentSettingsPage> createState() => _ParentSettingsPageState();
}

class _ParentSettingsPageState extends State<ParentSettingsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _pushNotifications = true;
  bool _emailWeeklyReports = true;
  bool _readingAlerts = true;
  bool _isClearingCache = false;

  // Clear App Cache with exact memory & temp cleanup visual feedback
  Future<void> _clearAppCache() async {
    Feedback.forTap(context);
    setState(() => _isClearingCache = true);

    int freedBytes = 0;
    try {
      final tempDir = Directory.systemTemp;
      if (tempDir.existsSync()) {
        final entities = tempDir.listSync();
        for (final entity in entities) {
          try {
            if (entity is File) {
              final name = entity.path.toLowerCase();
              if (name.contains('mic_test') ||
                  name.endsWith('.m4a') ||
                  name.endsWith('.tmp') ||
                  name.endsWith('.webp') ||
                  name.endsWith('.jpg') ||
                  name.endsWith('.png')) {
                freedBytes += entity.lengthSync();
                entity.deleteSync();
              }
            }
          } catch (_) {}
        }
      }

      await ParentPortalCacheService.invalidate();
      await Future.delayed(const Duration(milliseconds: 500));
    } catch (e) {
      debugPrint('[ParentSettingsPage] Error clearing cache: $e');
    } finally {
      if (mounted) {
        setState(() => _isClearingCache = false);
        AppToast.success(
          context,
          freedBytes > 0
              ? 'Temporary cache cleared (${(freedBytes / 1024).toStringAsFixed(1)} KB freed). Account remains logged in!'
              : 'Temporary cache cleared successfully! Account remains logged in.',
        );
      }
    }
  }

  // 1. Profile Details Modal
  Future<void> _showProfileDetailsModal() async {
    Feedback.forTap(context);
    final prefs = await SharedPreferences.getInstance();
    final rawAccessCode = prefs.getString('parent_access_code') ?? '';
    final cachedData = ParentPortalCacheService.cachedParentView;

    final user = AuthService.currentUser?.rawUser;
    final childData = cachedData ?? user?['linkedChild'] ?? user?['student'] ?? user;

    final lrn = (childData?['lrn'] ?? childData?['studentLrn'] ?? user?['lrn'] ?? '').toString().trim();
    final studentName = (cachedData?['studentName'] ??
            childData?['name'] ??
            childData?['studentName'] ??
            'Student')
        .toString()
        .trim();
    final parentName = (childData?['parentName'] ??
            childData?['parent_name'] ??
            user?['parentName'] ??
            user?['parent_name'] ??
            user?['name'] ??
            'Parent Security Access')
        .toString()
        .trim();
    final grade = (cachedData?['gradeLevel'] ?? childData?['gradeLevel'] ?? childData?['grade'] ?? 'Grade 4').toString().trim();
    final section = (cachedData?['section'] ?? cachedData?['sectionName'] ?? childData?['sectionName'] ?? childData?['section_name'] ?? '').toString().trim();
    final gradeSection = [grade, if (section.isNotEmpty && section.toLowerCase() != 'unassigned') section]
        .where((item) => item.trim().isNotEmpty)
        .join(' - ');

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Profile Details',
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),
              _buildModalInfoRow('Parent / Guardian Name', parentName),
              _buildModalInfoRow('Student LRN (12-Digit)', lrn.isNotEmpty ? lrn : '12-Digit LRN'),
              if (rawAccessCode.isNotEmpty) _buildModalInfoRow('Parent Security Access Code', rawAccessCode),
              _buildModalInfoRow('Active Student', studentName),
              _buildModalInfoRow('Grade & Section', gradeSection.isEmpty ? 'Not assigned' : gradeSection),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  Widget _buildModalInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
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
          const Divider(height: 16),
        ],
      ),
    );
  }

  // 2. Notification Settings Modal
  void _showNotificationSettingsModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Notification Settings',
                        style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  SwitchListTile(
                    activeThumbColor: const Color(0xFF1B64D8),
                    title: Text('Push Notifications', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15)),
                    subtitle: Text('Receive teacher announcements & app alerts', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                    value: _pushNotifications,
                    onChanged: (val) {
                      setModalState(() => _pushNotifications = val);
                      setState(() => _pushNotifications = val);
                    },
                  ),
                  SwitchListTile(
                    activeThumbColor: const Color(0xFF1B64D8),
                    title: Text('Weekly Progress Reports', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15)),
                    subtitle: Text('Receive child Phil-IRI summary email', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                    value: _emailWeeklyReports,
                    onChanged: (val) {
                      setModalState(() => _emailWeeklyReports = val);
                      setState(() => _emailWeeklyReports = val);
                    },
                  ),
                  SwitchListTile(
                    activeThumbColor: const Color(0xFF1B64D8),
                    title: Text('Reading Assessment Alerts', style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15)),
                    subtitle: Text('Get notified when new test scores are posted', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                    value: _readingAlerts,
                    onChanged: (val) {
                      setModalState(() => _readingAlerts = val);
                      setState(() => _readingAlerts = val);
                    },
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // 4. About Application Modal
  void _showAboutApplicationModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset('assets/logo/logo_v2.webp', height: 48),
              const SizedBox(height: 12),
              Text(
                'SalinTinig Parent Portal',
                style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                'Version 2.4.0 • Phil-IRI Reading Companion',
                style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
              ),
              const SizedBox(height: 16),
              Text(
                'SalinTinig connects parents, teachers, and students to track Phil-IRI oral reading fluency, comprehension accuracy, and reading progress in Filipino elementary education.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[700], height: 1.4),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B64D8),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Close', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      },
    );
  }

  // 5. Help / FAQ Modal
  void _showHelpFAQModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Help / FAQ',
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: [
                    _buildFaqAccordion(
                      'How do I view my child\'s Phil-IRI test results?',
                      'Navigate to Student Progress from the sidebar menu or dashboard quick cards to view GST Pre-Test and Post-Test scores, oral accuracy percentages, and words per minute (WPM).',
                    ),
                    _buildFaqAccordion(
                      'How can I help my child practice reading at home?',
                      'Encourage 15 minutes of daily reading practice using story passages assigned in SalinTinig. Your child can record their oral reading and practice comprehension quizzes.',
                    ),
                    _buildFaqAccordion(
                      'How do I contact my child\'s teacher?',
                      'Please use the official school communication channel or contact the section adviser through the contact details provided by the school.',
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      drawerEnableOpenDragGesture: false,
      backgroundColor: softBg,
      drawer: buildParentSidebarDrawer(context, activeIndex: 5),
      appBar: AppBar(
        backgroundColor: softBg,
        elevation: 0,
        scrolledUnderElevation: 0,
      leading: IconButton(
        onPressed: () => Navigator.pop(context),
        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Colors.black),
      ),
        centerTitle: true,
        title: Text(
          'Settings',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20.0, 12.0, 20.0, 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Other Settings Section Header
              Text(
                'Other Settings',
                style: GoogleFonts.inter(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 14),

              // Card Group 1: Profile details, Notifications
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildSettingsTile(
                      iconName: Ph.user,
                      title: 'Profile details',
                      onTap: _showProfileDetailsModal,
                    ),
                    const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                    _buildSettingsTile(
                      iconName: Ph.bell,
                      title: 'Notifications',
                      onTap: _showNotificationSettingsModal,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Card Group 2: About application, Help / FAQ, Clear App Cache
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _buildSettingsTile(
                      iconName: Ph.info,
                      title: 'About application',
                      onTap: _showAboutApplicationModal,
                    ),
                    const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                    _buildSettingsTile(
                      iconName: Ph.chat_dots,
                      title: 'Help / FAQ',
                      onTap: _showHelpFAQModal,
                    ),
                    const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                    _buildSettingsTile(
                      iconName: Ph.arrows_clockwise,
                      title: 'Clear App Cache',
                      onTap: _isClearingCache ? () {} : _clearAppCache,
                      isLoading: _isClearingCache,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required String iconName,
    required String title,
    required VoidCallback onTap,
    bool isDestructive = false,
    bool isLoading = false,
  }) {
    const primaryBlue = Color(0xFF1B64D8);
    final iconColor = isDestructive ? Colors.red[600]! : primaryBlue;
    final textColor = isDestructive ? Colors.red[600]! : Colors.black;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Feedback.forTap(context);
          onTap();
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
          child: Row(
            children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Iconify(
                  iconName,
                  size: 22,
                  color: iconColor,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: textColor,
                  ),
                ),
              ),
              if (isLoading)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(primaryBlue),
                  ),
                )
              else
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: Colors.grey[400],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFaqAccordion(String question, String answer) {
    return ExpansionTile(
      title: Text(question, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black)),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Text(answer, style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[700], height: 1.4)),
        ),
      ],
    );
  }
}
