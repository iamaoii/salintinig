import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/common/home_page.dart';
import 'package:salintinig/pages/parent/parent_announcements_page.dart';

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

  // 1. Profile Details Modal
  void _showProfileDetailsModal() {
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
              _buildModalInfoRow('Full Name', 'Mrs. Doechii Carganilla'),
              _buildModalInfoRow('Email Address', 'parent.carganilla@gmail.com'),
              _buildModalInfoRow('Contact Number', '+63 917 123 4567'),
              _buildModalInfoRow('Active Child', 'Doechii Carganilla'),
              _buildModalInfoRow('Grade & Section', 'Grade 4 - FYANG'),
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

  // 2. Change Password Modal
  void _showChangePasswordModal() {
    Feedback.forTap(context);
    final currentController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();

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
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Change Password',
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),
              TextField(
                controller: currentController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Current Password',
                  labelStyle: GoogleFonts.inter(fontSize: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: newController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  labelStyle: GoogleFonts.inter(fontSize: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: confirmController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Confirm New Password',
                  labelStyle: GoogleFonts.inter(fontSize: 14),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password updated successfully!'),
                      backgroundColor: Color(0xFF059669),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1B64D8),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  'Update Password',
                  style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 3. Notification Settings Modal
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
                      'Tap the "Contact" button on the parent overview home screen or open the Contact Section Teacher action from the top menu to call or message Ms. Maria Santos directly.',
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

  // Deactivate Account Dialog
  void _showDeactivateDialog() {
    Feedback.forTap(context);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Deactivate Account?',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: Colors.red[700]),
          ),
          content: Text(
            'Are you sure you want to deactivate your parent account? You will lose access to your child\'s real-time Phil-IRI reports and teacher announcements.',
            style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[700]),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const HomePage()),
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red[600],
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('Deactivate', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);
    const primaryBlue = Color(0xFF1B64D8);

    return Scaffold(
      key: _scaffoldKey,
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

              // Card Group 1: Profile details, Password, Notifications
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
                      iconName: Ph.lock_key,
                      title: 'Password',
                      onTap: _showChangePasswordModal,
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

              // Card Group 2: About application, Help / FAQ, Clear App Cache, Deactivate my account
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
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('App cache cleared successfully!'),
                            backgroundColor: Color(0xFF059669),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                    ),
                    const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                    _buildSettingsTile(
                      iconName: Ph.trash,
                      title: 'Deactivate my account',
                      isDestructive: true,
                      onTap: _showDeactivateDialog,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Bottom Right Log Out Button
              Align(
                alignment: Alignment.centerRight,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Feedback.forTap(context);
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (context) => const HomePage()),
                      (route) => false,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryBlue,
                    foregroundColor: Colors.white,
                    elevation: 2,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: const Iconify(
                    Ph.sign_out,
                    size: 18,
                    color: Colors.white,
                  ),
                  label: Text(
                    'Log Out',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
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
