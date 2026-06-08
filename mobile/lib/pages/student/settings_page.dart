import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  // Reading Preferences state
  double _readingFontSize = 16.0;
  Color _selectedHighlightColor = const Color(0xFF1B64D8);
  bool _dyslexiaFont = false;

  // Audio & Microphone state
  double _voiceGuidanceVolume = 0.8;
  bool _noiseReduction = true;

  // Microphone test state
  bool _isTestingMic = false;
  bool _micTestSuccess = false;
  List<double> _waveform = [0.1, 0.15, 0.12, 0.18, 0.1];

  // Notification Preferences state
  bool _dailyReminder = true;
  TimeOfDay _reminderTime = const TimeOfDay(hour: 19, minute: 0);
  bool _achievementAlerts = true;

  // Cache clearing state
  bool _isClearingCache = false;

  final List<Color> _highlightColors = [
    const Color(0xFF1B64D8), // Primary Blue
    const Color(0xFF00A859), // Green
    const Color(0xFFFBBF24), // Yellow
    const Color(0xFFEF4444), // Red
    const Color(0xFF8B5CF6), // Purple
  ];

  // Helper method to format TimeOfDay
  String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    final minute = time.minute.toString().padLeft(2, '0');
    return "$hour:$minute $period";
  }

  // Trigger time picker for reminders
  Future<void> _selectReminderTime(BuildContext modalContext, StateSetter setModalState) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _reminderTime,
      builder: (BuildContext context, Widget? child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF1B64D8),
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _reminderTime) {
      setModalState(() {
        _reminderTime = picked;
      });
      setState(() {
        _reminderTime = picked;
      });
    }
  }

  // Clear cache action
  void _clearCache() {
    setState(() {
      _isClearingCache = true;
    });

    Future.delayed(const Duration(seconds: 2), () {
      if (!mounted) return;
      setState(() {
        _isClearingCache = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white),
              const SizedBox(width: 8),
              Text('Temporary app files cleared successfully!', style: GoogleFonts.inter()),
            ],
          ),
          backgroundColor: const Color(0xFF00A859),
        ),
      );
    });
  }

  // Test microphone action
  void _testMicrophone() {
    setState(() {
      _isTestingMic = true;
      _micTestSuccess = false;
    });

    int count = 0;
    final random = Random();
    Timer.periodic(const Duration(milliseconds: 120), (timer) {
      if (!mounted || count > 20) {
        timer.cancel();
        if (mounted) {
          setState(() {
            _isTestingMic = false;
            _micTestSuccess = true;
            _waveform = [0.1, 0.1, 0.1, 0.1, 0.1];
          });
        }
        return;
      }
      count++;
      setState(() {
        _waveform = List.generate(5, (_) => 0.15 + random.nextDouble() * 0.75);
      });
    });
  }

  // ── Modals & Overlay Sheets ────────────────────────────────────────────────

  // 1. Profile Details Modal
  void _showProfileDetails() {
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
              _buildModalInfoRow('Full Name', 'Doechii E. Carganilla'),
              _buildModalInfoRow('Nickname', 'Doechii'),
              _buildModalInfoRow('Grade & Section', 'Grade 4 - Malinis'),
              _buildModalInfoRow('LRN', '1366 7010 0099'),
              _buildModalInfoRow('Email Address', 'doechii@edu.org.ph'),
              _buildModalInfoRow('School', 'Fyang Elementary School'),
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
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF71717A)),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.black),
          ),
          const Divider(height: 16),
        ],
      ),
    );
  }

  // 2. Change Password Modal
  void _showChangePassword() {
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
                  backgroundColor: const Color(0xFF1B64D8),
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

  // 3. Simple Notification Settings Modal
  void _showNotificationSettings() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            const primaryBlue = Color(0xFF1B64D8);
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
                    activeTrackColor: primaryBlue.withValues(alpha: 0.5),
                    activeThumbColor: primaryBlue,
                    contentPadding: EdgeInsets.zero,
                    onChanged: (val) {
                      setModalState(() => _dailyReminder = val);
                      setState(() => _dailyReminder = val);
                    },
                  ),
                  if (_dailyReminder) ...[
                    ListTile(
                      title: Text('Reminder Time', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                      trailing: Text(_formatTimeOfDay(_reminderTime), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: primaryBlue)),
                      onTap: () => _selectReminderTime(context, setModalState),
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                  const SizedBox(height: 8),
                  SwitchListTile.adaptive(
                    title: Text('Achievement Alerts', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700)),
                    subtitle: Text('Get notified when you unlock badges', style: GoogleFonts.inter(fontSize: 12, color: textGray)),
                    value: _achievementAlerts,
                    activeTrackColor: primaryBlue.withValues(alpha: 0.5),
                    activeThumbColor: primaryBlue,
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
  void _showAboutApplication() {
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
  void _showHelpFAQ() {
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
                      title: Text('How do I complete a story?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Click on "Start Reading" in the Library, read the sentences aloud so the speech detection highlights them, and then complete the short quiz at the end!',
                            style: GoogleFonts.inter(height: 1.4),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text('How is my Reading Streak calculated?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Your Streak goes up for every consecutive day you read at least one practice story. Keep reading daily to build a high flame!',
                            style: GoogleFonts.inter(height: 1.4),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text('Can I change my registered Grade level?', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Official details like your name, LRN, and grade level are locked to prevent errors. Please ask your class teacher or admin to edit this.',
                            style: GoogleFonts.inter(height: 1.4),
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

  // 6. Deactivate Account Dialog
  void _showDeactivateAccount() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Deactivate Account?', style: GoogleFonts.inter(fontWeight: FontWeight.w800, color: const Color(0xFFEF4444))),
          content: Text(
            'This action is irreversible. You will lose all your reading records, streaks, and accumulated badges.',
            style: GoogleFonts.inter(height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF71717A), fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Account deactivation requested.', style: GoogleFonts.inter()),
                    backgroundColor: const Color(0xFFEF4444),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
              child: Text('Deactivate', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );
  }

  // 7. Log Out Dialog
  void _showLogOut() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text('Log Out?', style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
          content: Text('Are you sure you want to log out of SalinTinig?', style: GoogleFonts.inter()),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF71717A), fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // close dialog
                Navigator.pop(context); // pop settings page
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Logged out successfully!', style: GoogleFonts.inter()),
                    backgroundColor: const Color(0xFF1B64D8),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1B64D8)),
              child: Text('Log Out', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
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
                            'Settings',
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(width: 48), // Spacer to keep title centered
                        ],
                      ),
                    ),

                    // ── Settings Content ──────────────────────────────────────
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 12),

                            // ── Banner (Hello, Doechii!) ─────────────────────
                            Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: const LinearGradient(
                                  colors: [primaryBlue, Color(0xFF195ECB)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryBlue.withValues(alpha: 0.2),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(22.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Hello, Doechii!',
                                          style: GoogleFonts.inter(
                                            fontSize: 22,
                                            fontWeight: FontWeight.w800,
                                            color: Colors.white,
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Grade 4 - Malinis',
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                            color: Colors.white.withValues(alpha: 0.8),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Colors.white24,
                                    ),
                                    padding: const EdgeInsets.all(3),
                                    child: const CircleAvatar(
                                      radius: 26,
                                      backgroundImage: NetworkImage(
                                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── Reading Preferences (DIRECTLY ON PAGE) ────────
                            Text(
                              'Reading Preferences',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
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
                              padding: const EdgeInsets.all(18.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Story Preview
                                  Text(
                                    'Story Preview',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: textGray,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFBF8F5),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: const Color(0xFFEAEAEA)),
                                    ),
                                    padding: const EdgeInsets.all(16),
                                    child: RichText(
                                      text: TextSpan(
                                        style: _dyslexiaFont
                                            ? TextStyle(
                                                fontFamily: 'OpenDyslexic',
                                                fontSize: _readingFontSize,
                                                color: Colors.black,
                                                height: 1.5,
                                              )
                                            : GoogleFonts.merriweather(
                                                fontSize: _readingFontSize,
                                                color: Colors.black,
                                                height: 1.5,
                                              ),
                                        children: [
                                          const TextSpan(text: 'Nora was excited. It was '),
                                          TextSpan(
                                            text: 'summer',
                                            style: TextStyle(
                                              backgroundColor: _selectedHighlightColor.withValues(alpha: 0.25),
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          const TextSpan(text: ' and Lola was making mango ice candy.'),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Font Size
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Font Size',
                                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                                      ),
                                      Text(
                                        '${_readingFontSize.round()} px',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                          color: primaryBlue,
                                        ),
                                      ),
                                    ],
                                  ),
                                  Slider(
                                    min: 14.0,
                                    max: 26.0,
                                    divisions: 6,
                                    value: _readingFontSize,
                                    activeColor: primaryBlue,
                                    onChanged: (val) {
                                      setState(() => _readingFontSize = val);
                                    },
                                  ),
                                  const SizedBox(height: 16),

                                  // Highlight Colors
                                  Text(
                                    'Reading Highlight Color',
                                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: _highlightColors.map((color) {
                                      final isSelected = _selectedHighlightColor == color;
                                      return GestureDetector(
                                        onTap: () {
                                          setState(() => _selectedHighlightColor = color);
                                        },
                                        child: Container(
                                          width: 32,
                                          height: 32,
                                          decoration: BoxDecoration(
                                            color: color,
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: isSelected ? Colors.black : Colors.transparent,
                                              width: 2.5,
                                            ),
                                          ),
                                          child: isSelected
                                              ? const Icon(Icons.check, color: Colors.white, size: 16)
                                              : null,
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                  const SizedBox(height: 20),

                                  // Dyslexia Switch
                                  SwitchListTile.adaptive(
                                    title: Text(
                                      'Dyslexia-Friendly Font',
                                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                                    ),
                                    subtitle: Text(
                                      'Specially designed for easier reading',
                                      style: GoogleFonts.inter(fontSize: 12, color: textGray),
                                    ),
                                    value: _dyslexiaFont,
                                    activeTrackColor: primaryBlue.withValues(alpha: 0.5),
                                    activeThumbColor: primaryBlue,
                                    contentPadding: EdgeInsets.zero,
                                    onChanged: (val) {
                                      setState(() => _dyslexiaFont = val);
                                    },
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── Audio & Microphone settings (NEW DIRECT SECTION) ────────
                            Text(
                              'Voice & Microphone settings',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
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
                              padding: const EdgeInsets.all(18.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Voice assistant Volume
                                  Text(
                                    'Voice Assistant Volume',
                                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                                  ),
                                  Slider(
                                    min: 0.0,
                                    max: 1.0,
                                    value: _voiceGuidanceVolume,
                                    activeColor: primaryBlue,
                                    onChanged: (val) {
                                      setState(() => _voiceGuidanceVolume = val);
                                    },
                                  ),
                                  const SizedBox(height: 12),

                                  // Background Noise Reduction Switch
                                  SwitchListTile.adaptive(
                                    title: Text(
                                      'Background Noise Reduction',
                                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                                    ),
                                    subtitle: Text(
                                      'Filters out noisy school environment sounds',
                                      style: GoogleFonts.inter(fontSize: 12, color: textGray),
                                    ),
                                    value: _noiseReduction,
                                    activeTrackColor: primaryBlue.withValues(alpha: 0.5),
                                    activeThumbColor: primaryBlue,
                                    contentPadding: EdgeInsets.zero,
                                    onChanged: (val) {
                                      setState(() => _noiseReduction = val);
                                    },
                                  ),
                                  const Divider(height: 24),

                                  // Interactive Microphone test widget
                                  Text(
                                    'Test Your Microphone',
                                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Say a few words to check if the app hears you.',
                                    style: GoogleFonts.inter(fontSize: 12, color: textGray),
                                  ),
                                  const SizedBox(height: 14),

                                  Row(
                                    children: [
                                      ElevatedButton(
                                        onPressed: _isTestingMic ? null : _testMicrophone,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: _isTestingMic ? Colors.grey[200] : primaryBlue,
                                          foregroundColor: Colors.white,
                                          elevation: 0,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                        ),
                                        child: Text(
                                          _isTestingMic ? 'Listening...' : 'Test Mic',
                                          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Container(
                                          height: 40,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF4F4F5),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: _isTestingMic
                                                ? _waveform.map((heightValue) {
                                                    return AnimatedContainer(
                                                      duration: const Duration(milliseconds: 100),
                                                      width: 4,
                                                      height: 6 + (28 * heightValue),
                                                      margin: const EdgeInsets.symmetric(horizontal: 2),
                                                      decoration: BoxDecoration(
                                                        color: primaryBlue,
                                                        borderRadius: BorderRadius.circular(2),
                                                      ),
                                                    );
                                                  }).toList()
                                                : [
                                                    Icon(
                                                      _micTestSuccess ? Icons.check_circle : Icons.mic_none,
                                                      color: _micTestSuccess ? const Color(0xFF00A859) : textGray,
                                                      size: 18,
                                                    ),
                                                    const SizedBox(width: 8),
                                                    Text(
                                                      _micTestSuccess
                                                          ? 'Mic works perfectly!'
                                                          : 'Click Test and speak!',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 13,
                                                        fontWeight: FontWeight.w600,
                                                        color: _micTestSuccess ? const Color(0xFF00A859) : textGray,
                                                      ),
                                                    ),
                                                  ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 28),

                            // ── "Other Settings" Title ───────────────────────
                            Text(
                              'Other Settings',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 12),

                            // ── Group 1 Card ─────────────────────────────────
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
                              clipBehavior: Clip.antiAlias,
                              child: Column(
                                children: [
                                  _buildSettingItem(Ph.user, 'Profile details', _showProfileDetails),
                                  const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F1F4)),
                                  _buildSettingItem(Ph.lock, 'Password', _showChangePassword),
                                  const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F1F4)),
                                  _buildSettingItem(Ph.bell, 'Notifications', _showNotificationSettings),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // ── Group 2 Card ─────────────────────────────────
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
                              clipBehavior: Clip.antiAlias,
                              child: Column(
                                children: [
                                  _buildSettingItem(Ph.info, 'About application', _showAboutApplication),
                                  const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F1F4)),
                                  _buildSettingItem(Ph.chat_teardrop_text, 'Help / FAQ', _showHelpFAQ),
                                  const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F1F4)),
                                  // Clear Cache row directly in Group 2
                                  ListTile(
                                    onTap: _isClearingCache ? null : _clearCache,
                                    leading: Container(
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF4F4F5),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      padding: const EdgeInsets.all(8),
                                      child: Iconify(
                                        Ph.arrows_counter_clockwise,
                                        color: const Color(0xFF71717A),
                                        size: 20,
                                      ),
                                    ),
                                    title: Text(
                                      'Clear App Cache',
                                      style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black87,
                                      ),
                                    ),
                                    trailing: _isClearingCache
                                        ? const SizedBox(
                                            width: 18,
                                            height: 18,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor: AlwaysStoppedAnimation<Color>(primaryBlue),
                                            ),
                                          )
                                        : const Icon(
                                            Icons.keyboard_arrow_right,
                                            color: Color(0xFFA1A1AA),
                                            size: 20,
                                          ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                    visualDensity: VisualDensity.compact,
                                  ),
                                  const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F1F4)),
                                  _buildSettingItem(Ph.trash, 'Deactivate my account', _showDeactivateAccount, isDestructive: true),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── Log Out Button ───────────────────────────────
                            Align(
                              alignment: Alignment.centerRight,
                              child: ElevatedButton.icon(
                                onPressed: _showLogOut,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryBlue,
                                  foregroundColor: Colors.white,
                                  elevation: 2,
                                  shadowColor: primaryBlue.withValues(alpha: 0.3),
                                  padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
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
                                    fontSize: 15,
                                    fontWeight: FontWeight.w800,
                                    color: Colors.white,
                                  ),
                                ),
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

  // ── Helper Settings Item Builder ──────────────────────────────────────────

  Widget _buildSettingItem(String iconSvg, String title, VoidCallback onTap, {bool isDestructive = false}) {
    final textColor = isDestructive ? const Color(0xFFEF4444) : Colors.black87;
    final iconColor = isDestructive ? const Color(0xFFEF4444) : const Color(0xFF71717A);

    return ListTile(
      onTap: onTap,
      leading: Container(
        decoration: BoxDecoration(
          color: isDestructive ? const Color(0xFFFEF2F2) : const Color(0xFFF4F4F5),
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.all(8),
        child: Iconify(
          iconSvg,
          color: iconColor,
          size: 20,
        ),
      ),
      title: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: textColor,
        ),
      ),
      trailing: const Icon(
        Icons.keyboard_arrow_right,
        color: Color(0xFFA1A1AA),
        size: 20,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      visualDensity: VisualDensity.compact,
    );
  }
}
