import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';

class TeacherSettingsPage extends StatefulWidget {
  const TeacherSettingsPage({super.key});

  @override
  State<TeacherSettingsPage> createState() => _TeacherSettingsPageState();
}

class _TeacherSettingsPageState extends State<TeacherSettingsPage> {
  bool _dailyReminder = true;
  TimeOfDay _reminderTime = const TimeOfDay(hour: 19, minute: 0);
  bool _achievementAlerts = true;

  String _formatTimeOfDay(TimeOfDay tod) {
    final hour = tod.hourOfPeriod == 0 ? 12 : tod.hourOfPeriod;
    final minute = tod.minute.toString().padLeft(2, '0');
    final period = tod.period == DayPeriod.am ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  Future<void> _selectReminderTime(BuildContext context, StateSetter setModalState) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _reminderTime,
    );
    if (picked != null && picked != _reminderTime) {
      setModalState(() => _reminderTime = picked);
      setState(() => _reminderTime = picked);
    }
  }

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
              _buildModalInfoRow('Full Name', 'Maria Santos'),
              _buildModalInfoRow('Designation / Title', 'Grade IV Teacher'),
              _buildModalInfoRow('Grade & Section', 'Grade 4 - FYANG'),
              _buildModalInfoRow('Employee ID', '198420349'),
              _buildModalInfoRow('Email Address', 'maria.santos@deped.gov.ph'),
              _buildModalInfoRow('Contact Number', '+63 917 890 1234'),
              _buildModalInfoRow('School', 'San Juan Elementary School'),
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
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: newController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: confirmController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Confirm New Password',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  if (newController.text != confirmController.text) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Passwords do not match!', style: GoogleFonts.inter()),
                        backgroundColor: const Color(0xFFEF4444),
                      ),
                    );
                    return;
                  }
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Password updated successfully!', style: GoogleFonts.inter()),
                      backgroundColor: const Color(0xFF00A859),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD34426),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text('Update Password', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
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
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            const primaryColor = Color(0xFFD34426);
            const textGray = Color(0xFF71717A);

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
                  SwitchListTile.adaptive(
                    title: Text('Daily Practice Reminder', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                    subtitle: Text('Reminds you to read daily', style: GoogleFonts.inter(fontSize: 12, color: textGray)),
                    value: _dailyReminder,
                    activeTrackColor: primaryColor.withValues(alpha: 0.5),
                    activeThumbColor: primaryColor,
                    contentPadding: EdgeInsets.zero,
                    onChanged: (val) {
                      setModalState(() => _dailyReminder = val);
                      setState(() => _dailyReminder = val);
                    },
                  ),
                  if (_dailyReminder) ...[
                    ListTile(
                      title: Text('Reminder Time', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      trailing: Text(_formatTimeOfDay(_reminderTime), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: primaryColor)),
                      onTap: () => _selectReminderTime(context, setModalState),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                  const SizedBox(height: 8),
                  SwitchListTile.adaptive(
                    title: Text('Achievement Alerts', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                    subtitle: Text('Get notified when you unlock badges', style: GoogleFonts.inter(fontSize: 12, color: textGray)),
                    value: _achievementAlerts,
                    activeTrackColor: primaryColor.withValues(alpha: 0.5),
                    activeThumbColor: primaryColor,
                    contentPadding: EdgeInsets.zero,
                    onChanged: (val) {
                      setModalState(() => _achievementAlerts = val);
                      setState(() => _achievementAlerts = val);
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
                    'About SalinTinig',
                    style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),
              Text(
                'SalinTinig is a speech-to-text capstone reading application designed to assist elementary students in reinforcing their reading comprehension, speed, and pronunciation through immersive stories and quizzes.',
                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF3F3F46), height: 1.5),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('App Version', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                  Text('v1.0.0 (Build 24)', style: GoogleFonts.inter(color: const Color(0xFF71717A), fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 16),
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
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
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
              Expanded(
                child: ListView(
                  physics: const BouncingScrollPhysics(),
                  children: [
                    ExpansionTile(
                      title: Text('How do I export Phil-IRI assessment forms (Form 1A / 1B)?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Navigate to Class Progress or Form Details, select your desired assessment period (GST or ORT), and tap Export Report to generate standardized DepEd Form 1A/1B documents.',
                            style: GoogleFonts.inter(height: 1.4, color: const Color(0xFF3F3F46)),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text('How are student Phil-IRI reading levels categorized?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Student profiles are automatically categorized as Independent, Instructional, Frustration, or Non-Reader based on oral reading accuracy percentage and comprehension scores recorded in GST and ORT testing.',
                            style: GoogleFonts.inter(height: 1.4, color: const Color(0xFF3F3F46)),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text('How do I add or manage students in my assigned class?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Go to Class Details under your section and tap Add Student to enroll new learners, or tap an existing student to review individual score histories and reading progress.',
                            style: GoogleFonts.inter(height: 1.4, color: const Color(0xFF3F3F46)),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text('What should I do if a student\'s speech recording fails to sync?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Ensure the device microphone permission is allowed and internet connection is stable. Offline assessment scores are saved locally and automatically sync once reconnected.',
                            style: GoogleFonts.inter(height: 1.4, color: const Color(0xFF3F3F46)),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text('How do I assign reading activities or games to my class?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Open the Activities page from the navigation drawer, select the target reading tier or practice module, and tap Assign to Class to distribute it to student devices.',
                            style: GoogleFonts.inter(height: 1.4, color: const Color(0xFF3F3F46)),
                          ),
                        ),
                      ],
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

  void _showDeactivateDialog() {
    Feedback.forTap(context);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(
            'Deactivate Account',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFFDC2626)),
          ),
          content: Text(
            'Are you sure you want to deactivate your account? You can reactivate it anytime by logging back in.',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.black87),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Cancel',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.grey[700]),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Deactivation request sent.'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                'Deactivate',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softBg,
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
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD34426),
                    foregroundColor: Colors.white,
                    elevation: 2,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  icon: Iconify(Ph.sign_out, color: Colors.white, size: 18),
                  label: Text(
                    'Log Out',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
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
    final iconColor = isDestructive ? const Color(0xFFDC2626) : Colors.grey[700]!;
    final iconBg = isDestructive ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC);
    final textColor = isDestructive ? const Color(0xFFDC2626) : Colors.black;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: iconBg,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Iconify(iconName, color: iconColor, size: 18),
        ),
      ),
      title: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: textColor,
        ),
      ),
      trailing: Icon(
        Icons.chevron_right_rounded,
        size: 20,
        color: isDestructive ? const Color(0xFFDC2626).withValues(alpha: 0.7) : Colors.grey[400],
      ),
      onTap: () {
        Feedback.forTap(context);
        onTap();
      },
    );
  }
}
