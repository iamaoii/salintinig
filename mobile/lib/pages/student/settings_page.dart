import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:record/record.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:salintinig/widgets/user_avatar.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/reading_preferences_service.dart';
import 'package:salintinig/services/notification_preferences_service.dart';
import 'package:salintinig/services/local_notification_service.dart';
import 'package:salintinig/services/analytics_service.dart';
import 'package:salintinig/services/badge_service.dart';
import 'package:salintinig/services/library_service.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _isLoadingSession = true;

  @override
  void initState() {
    super.initState();
    _loadReadingPreferences();
    _loadNotificationPreferences();
    _loadUserSession();
    _audioPlayer.onPlayerComplete.listen((_) {
      if (mounted) {
        setState(() {
          _isPlayingReplay = false;
        });
      }
    });
  }

  Future<void> _loadNotificationPreferences() async {
    final daily = await NotificationPreferencesService.getDailyReminder();
    final hour = await NotificationPreferencesService.getReminderHour();
    final minute = await NotificationPreferencesService.getReminderMinute();
    final streak = await NotificationPreferencesService.getStreakProtection();
    final achievements =
        await NotificationPreferencesService.getAchievementAlerts();
    final assignments =
        await NotificationPreferencesService.getAssignmentAlerts();

    if (mounted) {
      setState(() {
        _dailyReminder = daily;
        _reminderTime = TimeOfDay(hour: hour, minute: minute);
        _streakProtectionAlert = streak;
        _achievementAlerts = achievements;
        _assignmentAlerts = assignments;
      });
    }
  }

  Future<void> _loadReadingPreferences() async {
    final savedFontSize = await ReadingPreferencesService.getFontSize();
    final savedDyslexiaFont = await ReadingPreferencesService.getDyslexiaFont();
    final savedHighlighting =
        await ReadingPreferencesService.getTextHighlighting();
    final savedHighlightColor =
        await ReadingPreferencesService.getHighlightColor();
    if (mounted) {
      setState(() {
        _readingFontSize = savedFontSize;
        _dyslexiaFont = savedDyslexiaFont;
        _textHighlighting = savedHighlighting;
        _highlightColor = savedHighlightColor;
      });
    }
  }

  Future<void> _loadUserSession() async {
    try {
      await AuthService.fetchMe();
    } catch (_) {
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingSession = false;
        });
      }
    }
  }

  // Reading Preferences state
  double _readingFontSize = 22.0;
  bool _dyslexiaFont = false;
  bool _textHighlighting = true;
  Color _highlightColor = const Color(0xFFFEF08A);

  // Microphone test state
  bool _isTestingMic = false;
  bool _micTestSuccess = false;
  bool _isPlayingReplay = false;
  String? _lastRecordedPath;
  List<double> _waveform = [0.1, 0.15, 0.12, 0.18, 0.1];
  Timer? _micTimer;
  final AudioRecorder _audioRecorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();

  // Notification Preferences state
  bool _dailyReminder = true;
  TimeOfDay _reminderTime = const TimeOfDay(hour: 19, minute: 0);
  bool _streakProtectionAlert = true;
  bool _achievementAlerts = true;
  bool _assignmentAlerts = true;

  // Cache clearing state
  bool _isClearingCache = false;

  // Helper method to format TimeOfDay
  String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    final minute = time.minute.toString().padLeft(2, '0');
    return "$hour:$minute $period";
  }

  // Trigger time picker for reminders
  Future<void> _selectReminderTime(
    BuildContext modalContext,
    StateSetter setModalState,
  ) async {
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
      await NotificationPreferencesService.setReminderHour(picked.hour);
      await NotificationPreferencesService.setReminderMinute(picked.minute);
      if (_dailyReminder) {
        await LocalNotificationService.scheduleDailyReminder(
          hour: picked.hour,
          minute: picked.minute,
        );
      }
    }
  }

  // Clear temporary cache (audio recordings, cached API snapshots) while preserving auth session & settings
  Future<void> _clearCache() async {
    setState(() {
      _isClearingCache = true;
    });

    int freedBytes = 0;

    try {
      // 1. Clear temp system directory (mic check recordings, temporary images)
      final tempDir = Directory.systemTemp;
      if (tempDir.existsSync()) {
        final entities = tempDir.listSync();
        for (final entity in entities) {
          try {
            if (entity is File) {
              final name = entity.path.toLowerCase();
              if (name.contains('mic_test') || name.endsWith('.m4a') || name.endsWith('.tmp') || name.endsWith('.webp') || name.endsWith('.jpg') || name.endsWith('.png')) {
                freedBytes += entity.lengthSync();
                entity.deleteSync();
              }
            }
          } catch (_) {}
        }
      }

      // 2. Clear in-memory and disk cached API snapshots (Analytics, Badges, Library books & progress)
      AnalyticsService.clearMemoryAndDiskCache();
      BadgeService.clearMemoryAndDiskCache();
      LibraryService.clearMemoryAndDiskCache();

      // Artificial small delay for smooth visual feedback
      await Future.delayed(const Duration(milliseconds: 600));
    } catch (e) {
      debugPrint('[SettingsPage] Error clearing cache: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isClearingCache = false;
        });
        AppToast.success(
          context,
          freedBytes > 0
              ? 'Temporary cache cleared (${(freedBytes / 1024).toStringAsFixed(1)} KB freed). Account remains logged in!'
              : 'Temporary cache cleared successfully! Account remains logged in.',
        );
      }
    }
  }

  @override
  void dispose() {
    _micTimer?.cancel();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  // Test microphone action (Records 3.5s of audio sample)
  Future<void> _testMicrophone() async {
    final hasPermission = await _audioRecorder.hasPermission();
    if (!hasPermission) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Microphone permission is required for reading assessments.',
              style: GoogleFonts.inter(),
            ),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
      return;
    }

    if (_isPlayingReplay) {
      await _audioPlayer.stop();
      _isPlayingReplay = false;
    }

    setState(() {
      _isTestingMic = true;
      _micTestSuccess = false;
      _waveform = [0.2, 0.4, 0.3, 0.5, 0.2];
    });

    try {
      final tempDir = Directory.systemTemp;
      final tempPath =
          '${tempDir.path}/mic_test_${DateTime.now().millisecondsSinceEpoch}.m4a';
      await _audioRecorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          noiseSuppress: true,
          echoCancel: true,
          autoGain: true,
        ),
        path: tempPath,
      );
      _lastRecordedPath = tempPath;
    } catch (e) {
      debugPrint('[MicTest] Recording error: $e');
    }

    int count = 0;
    final random = Random();
    _micTimer?.cancel();
    _micTimer = Timer.periodic(const Duration(milliseconds: 100), (
      timer,
    ) async {
      count++;
      double ampLevel = 0.15 + random.nextDouble() * 0.75;
      try {
        if (await _audioRecorder.isRecording()) {
          final amp = await _audioRecorder.getAmplitude();
          final db = amp.current; // -160 to 0 dB
          ampLevel = ((db + 60) / 60).clamp(0.1, 1.0);
        }
      } catch (_) {}

      if (!mounted || count >= 35) {
        timer.cancel();
        try {
          await _audioRecorder.stop();
        } catch (_) {}
        if (mounted) {
          setState(() {
            _isTestingMic = false;
            _micTestSuccess = true;
            _waveform = [0.1, 0.1, 0.1, 0.1, 0.1];
          });
        }
        return;
      }

      if (mounted) {
        setState(() {
          _waveform = List.generate(
            5,
            (_) => (ampLevel + random.nextDouble() * 0.2).clamp(0.1, 1.0),
          );
        });
      }
    });
  }

  // Toggle audio replay
  Future<void> _toggleAudioReplay() async {
    Feedback.forTap(context);
    if (_isPlayingReplay) {
      try {
        await _audioPlayer.stop();
      } catch (_) {}
      if (mounted) {
        setState(() {
          _isPlayingReplay = false;
        });
      }
      return;
    }

    if (_lastRecordedPath != null) {
      final file = File(_lastRecordedPath!);
      if (file.existsSync() && file.lengthSync() > 0) {
        final bytes = await file.readAsBytes();
        setState(() {
          _isPlayingReplay = true;
        });
        await _audioPlayer.stop();
        await _audioPlayer.play(BytesSource(bytes));
      }
    }
  }

  // ── Modals & Overlay Sheets ────────────────────────────────────────────────

  // 1. Profile Details Modal
  void _showProfileDetails() {
    final user = AuthService.currentUser;
    final fullName = user?.displayName ?? 'Student User';
    final nickname = user?.nickname?.isNotEmpty == true
        ? user!.nickname!
        : (user?.firstName ?? 'N/A');
    final gradeStr = user?.gradeLevel.isNotEmpty == true
        ? 'Grade ${user?.gradeLevel}'
        : '';
    final sectionStr = user?.sectionName.isNotEmpty == true
        ? user!.sectionName
        : '';
    final gradeSection = [
      gradeStr,
      sectionStr,
    ].where((s) => s.isNotEmpty).join(' - ');
    final lrn = user?.lrn.isNotEmpty == true ? user!.lrn : 'N/A';
    final email = user?.email.isNotEmpty == true ? user!.email : 'N/A';
    final school = (user?.schoolName.isNotEmpty == true)
        ? user!.schoolName
        : (user?.rawUser?['school_name']?.toString() ??
              user?.rawUser?['schoolName']?.toString() ??
              'N/A');

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
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),
              _buildModalInfoRow('Full Name', fullName),
              _buildModalInfoRow('Nickname', nickname),
              _buildModalInfoRow(
                'Grade & Section',
                gradeSection.isNotEmpty ? gradeSection : 'N/A',
              ),
              _buildModalInfoRow('LRN', lrn),
              _buildModalInfoRow('Email Address', email),
              _buildModalInfoRow('School', school),
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
  void _showChangePassword() {
    final currentController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();

    bool isSubmittingPassword = false;
    bool obscureCurrent = true;
    bool obscureNew = true;
    bool obscureConfirm = true;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (modalCtx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            const primaryBlue = Color(0xFF1B64D8);
            const textDark = Color(0xFF18181B);
            const textGray = Color(0xFF71717A);
            const borderColor = Color(0xFFE4E4E7);

            InputDecoration buildInputDecoration(
              String labelText,
              String hintText,
              bool isObscured,
              VoidCallback onToggle,
            ) {
              return InputDecoration(
                labelText: labelText,
                hintText: hintText,
                labelStyle: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: textGray,
                ),
                hintStyle: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFFA1A1AA),
                ),
                floatingLabelBehavior: FloatingLabelBehavior.always,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                filled: true,
                fillColor: const Color(0xFFFAFAFA),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: borderColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: primaryBlue, width: 2),
                ),
                suffixIcon: IconButton(
                  icon: Iconify(
                    isObscured ? Ph.eye_slash : Ph.eye,
                    size: 20,
                    color: textGray,
                  ),
                  onPressed: onToggle,
                ),
              );
            }

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
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Top Drag Handle & Title Row
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE4E4E7),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: primaryBlue.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Iconify(
                              Ph.lock_key_bold,
                              size: 20,
                              color: primaryBlue,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Change Password',
                            style: GoogleFonts.inter(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: textDark,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Iconify(
                          Ph.x_bold,
                          size: 20,
                          color: textGray,
                        ),
                        onPressed: () => Navigator.pop(modalCtx),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Ensure your account is using a strong password that you can easily remember.',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: textGray,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Current Password Input
                  TextField(
                    controller: currentController,
                    obscureText: obscureCurrent,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: buildInputDecoration(
                      'Current Password',
                      'Enter current password',
                      obscureCurrent,
                      () =>
                          setModalState(() => obscureCurrent = !obscureCurrent),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // New Password Input
                  TextField(
                    controller: newController,
                    obscureText: obscureNew,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: buildInputDecoration(
                      'New Password',
                      'At least 6 characters',
                      obscureNew,
                      () => setModalState(() => obscureNew = !obscureNew),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Confirm New Password Input
                  TextField(
                    controller: confirmController,
                    obscureText: obscureConfirm,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: buildInputDecoration(
                      'Confirm New Password',
                      'Re-enter new password',
                      obscureConfirm,
                      () =>
                          setModalState(() => obscureConfirm = !obscureConfirm),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Update Password Primary Action Button
                  ElevatedButton(
                    onPressed: isSubmittingPassword
                        ? null
                        : () async {
                            final current = currentController.text.trim();
                            final newPass = newController.text.trim();
                            final confirm = confirmController.text.trim();

                            if (current.isEmpty) {
                              AppToast.warning(
                                context,
                                'Please enter your current password.',
                              );
                              return;
                            }
                            if (newPass.length < 6) {
                              AppToast.warning(
                                context,
                                'New password must be at least 6 characters.',
                              );
                              return;
                            }
                            if (newPass != confirm) {
                              AppToast.error(
                                context,
                                'Passwords do not match!',
                              );
                              return;
                            }

                            setModalState(() => isSubmittingPassword = true);

                            try {
                              final res = await ApiService.post(
                                '/auth/change-password',
                                {
                                  'currentPassword': current,
                                  'newPassword': newPass,
                                },
                              );

                              if (res.success) {
                                if (modalCtx.mounted) Navigator.pop(modalCtx);
                                if (context.mounted) {
                                  AppToast.success(
                                    context,
                                    'Password updated successfully!',
                                  );
                                }
                              } else {
                                if (context.mounted) {
                                  AppToast.error(
                                    context,
                                    res.error ??
                                        res.message ??
                                        'Failed to update password.',
                                  );
                                }
                              }
                            } catch (e) {
                              if (context.mounted) {
                                AppToast.error(
                                  context,
                                  'Network error updating password.',
                                );
                              }
                            } finally {
                              setModalState(() => isSubmittingPassword = false);
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: isSubmittingPassword
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : Text(
                            'Update Password',
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // 3. Modern Notification Settings Modal
  void _showNotificationSettings() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (modalCtx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            const primaryBlue = Color(0xFF1B64D8);
            const textDark = Color(0xFF18181B);
            const textGray = Color(0xFF71717A);
            const cardBg = Color(0xFFF8FAFC);
            const borderColor = Color(0xFFE2E8F0);

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
                  // Top Drag Handle & Header
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE4E4E7),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: primaryBlue.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Iconify(
                              Ph.bell_bold,
                              size: 20,
                              color: primaryBlue,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            'Notification Settings',
                            style: GoogleFonts.inter(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: textDark,
                              letterSpacing: -0.3,
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Iconify(
                          Ph.x_bold,
                          size: 20,
                          color: textGray,
                        ),
                        onPressed: () => Navigator.pop(modalCtx),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Section 1: Daily Practice & Reminders
                  Container(
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Iconify(
                              Ph.alarm_bold,
                              size: 20,
                              color: primaryBlue,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Daily Practice Reminder',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                    ),
                                  ),
                                  Text(
                                    'Reminds you to read a story daily',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: textGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch.adaptive(
                              value: _dailyReminder,
                              activeThumbColor: primaryBlue,
                              onChanged: (val) async {
                                setModalState(() => _dailyReminder = val);
                                setState(() => _dailyReminder = val);
                                await NotificationPreferencesService.setDailyReminder(
                                  val,
                                );
                                if (val) {
                                  await LocalNotificationService.scheduleDailyReminder(
                                    hour: _reminderTime.hour,
                                    minute: _reminderTime.minute,
                                  );
                                } else {
                                  await LocalNotificationService.cancelDailyReminder();
                                }
                              },
                            ),
                          ],
                        ),
                        if (_dailyReminder) ...[
                          const Divider(height: 20, color: borderColor),
                          InkWell(
                            onTap: () =>
                                _selectReminderTime(context, setModalState),
                            borderRadius: BorderRadius.circular(10),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                vertical: 4.0,
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Scheduled Time',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: textDark,
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: primaryBlue.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _formatTimeOfDay(_reminderTime),
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                        color: primaryBlue,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const Divider(height: 20, color: borderColor),
                          Row(
                            children: [
                              const Iconify(
                                Ph.fire_bold,
                                size: 18,
                                color: Color(0xFFF97316),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Streak Risk Warning',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: textDark,
                                      ),
                                    ),
                                    Text(
                                      'Alert at 8:00 PM if streak is in danger',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: textGray,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Switch.adaptive(
                                value: _streakProtectionAlert,
                                activeThumbColor: const Color(0xFFF97316),
                                onChanged: (val) async {
                                  setModalState(
                                    () => _streakProtectionAlert = val,
                                  );
                                  setState(() => _streakProtectionAlert = val);
                                  await NotificationPreferencesService.setStreakProtection(
                                    val,
                                  );
                                },
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Section 2: Learning & Achievement Alerts
                  Container(
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: borderColor),
                    ),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            const Iconify(
                              Ph.trophy_bold,
                              size: 20,
                              color: Color(0xFFEAB308),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Achievement & Badges',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                    ),
                                  ),
                                  Text(
                                    'Get notified when unlocking badges',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: textGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch.adaptive(
                              value: _achievementAlerts,
                              activeThumbColor: primaryBlue,
                              onChanged: (val) async {
                                setModalState(() => _achievementAlerts = val);
                                setState(() => _achievementAlerts = val);
                                await NotificationPreferencesService.setAchievementAlerts(
                                  val,
                                );
                              },
                            ),
                          ],
                        ),
                        const Divider(height: 20, color: borderColor),
                        Row(
                          children: [
                            const Iconify(
                              Ph.book_open_bold,
                              size: 20,
                              color: Color(0xFF10B981),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Classroom Assignments',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                    ),
                                  ),
                                  Text(
                                    'Alert when teacher assigns stories',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: textGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Switch.adaptive(
                              value: _assignmentAlerts,
                              activeThumbColor: primaryBlue,
                              onChanged: (val) async {
                                setModalState(() => _assignmentAlerts = val);
                                setState(() => _assignmentAlerts = val);
                                await NotificationPreferencesService.setAssignmentAlerts(
                                  val,
                                );
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Section 3: Instant Sample Test Action Button
                  OutlinedButton.icon(
                    onPressed: () async {
                      await LocalNotificationService.showInstantNotification(
                        title: 'SalinTinig Reading Test',
                        body:
                            'Notifications are working perfectly! Keep reading to build your streak.',
                      );
                      if (context.mounted) {
                        AppToast.success(
                          context,
                          'Sample notification sent to your device status bar!',
                        );
                      }
                    },
                    icon: const Iconify(
                      Ph.paper_plane_tilt_bold,
                      size: 18,
                      color: primaryBlue,
                    ),
                    label: Text(
                      'Test Sample Notification',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: primaryBlue,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: primaryBlue),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
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
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
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
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: const Color(0xFF3F3F46),
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'App Version',
                    style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                  ),
                  Text(
                    'v1.0.0 (Build 24)',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF71717A),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
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
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
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
                      title: Text(
                        'How do I complete a story?',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                      ),
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
                      title: Text(
                        'How is my Reading Streak calculated?',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                      ),
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
                      title: Text(
                        'Can I change my registered Grade level?',
                        style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                      ),
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

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);
    const textGray = Color(0xFF71717A);

    final user = AuthService.currentUser;
    final firstName = user?.nickname?.isNotEmpty == true
        ? user!.nickname!
        : (user?.firstName.isNotEmpty == true ? user!.firstName : 'Student');
    final gradeStr = user?.gradeLevel.isNotEmpty == true
        ? 'Grade ${user?.gradeLevel}'
        : '';
    final sectionStr = user?.sectionName.isNotEmpty == true
        ? user!.sectionName
        : '';
    final gradeSection = [
      gradeStr,
      sectionStr,
    ].where((s) => s.isNotEmpty).join(' - ');

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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 12.0,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          IconButton(
                            onPressed: () {
                              if (Navigator.canPop(context)) {
                                Navigator.pop(context);
                              }
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
                          const SizedBox(
                            width: 48,
                          ), // Spacer to keep title centered
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

                            // ── Banner (Hello, {FirstName}!) ─────────────────────
                            if (_isLoadingSession)
                              _buildBannerSkeleton()
                            else
                              Container(
                                clipBehavior: Clip.antiAlias,
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
                                      padding: const EdgeInsets.all(22.0),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  'Hello, $firstName!',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 22,
                                                    fontWeight: FontWeight.w800,
                                                    color: Colors.white,
                                                    letterSpacing: -0.5,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  gradeSection.isNotEmpty
                                                      ? gradeSection
                                                      : 'Student Portal',
                                                  style: GoogleFonts.inter(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.w500,
                                                    color: Colors.white
                                                        .withValues(alpha: 0.8),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          const UserAvatar(size: 52),
                                        ],
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
                                      border: Border.all(
                                        color: const Color(0xFFEAEAEA),
                                      ),
                                    ),
                                    padding: const EdgeInsets.all(16),
                                    child: Builder(
                                      builder: (context) {
                                        final previewStyle = _dyslexiaFont
                                            ? GoogleFonts.lexend(
                                                fontSize: _readingFontSize,
                                                color: Colors.black,
                                                height: 1.5,
                                              )
                                            : GoogleFonts.merriweather(
                                                fontSize: _readingFontSize,
                                                color: Colors.black,
                                                height: 1.5,
                                              );
                                        return RichText(
                                          text: TextSpan(
                                            style: previewStyle,
                                            children: [
                                              const TextSpan(
                                                text:
                                                    'Nora was excited. It was ',
                                              ),
                                              TextSpan(
                                                text: 'summer and Lola',
                                                style: previewStyle.copyWith(
                                                  backgroundColor:
                                                      _textHighlighting
                                                      ? _highlightColor
                                                      : null,
                                                ),
                                              ),
                                              const TextSpan(
                                                text:
                                                    ' was making mango ice candy.',
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                  const SizedBox(height: 20),

                                  // Font Size
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        'Font Size',
                                        style: GoogleFonts.inter(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                        ),
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
                                    max: 30.0,
                                    divisions: 8,
                                    value: _readingFontSize,
                                    activeColor: primaryBlue,
                                    onChanged: (val) {
                                      setState(() => _readingFontSize = val);
                                      ReadingPreferencesService.setFontSize(
                                        val,
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 20),

                                  // Dyslexia Switch
                                  SwitchListTile.adaptive(
                                    title: Text(
                                      'Dyslexia-Friendly Font',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    subtitle: Text(
                                      'Specially designed for easier reading',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: textGray,
                                      ),
                                    ),
                                    value: _dyslexiaFont,
                                    activeTrackColor: primaryBlue.withValues(
                                      alpha: 0.5,
                                    ),
                                    activeThumbColor: primaryBlue,
                                    contentPadding: EdgeInsets.zero,
                                    onChanged: (val) {
                                      setState(() => _dyslexiaFont = val);
                                      ReadingPreferencesService.setDyslexiaFont(
                                        val,
                                      );
                                    },
                                  ),
                                  const SizedBox(height: 8),

                                  // Text Highlighting Tool Switch
                                  SwitchListTile.adaptive(
                                    title: Text(
                                      'Text Highlighting Tool',
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    subtitle: Text(
                                      'Allows selecting and highlighting text while practice reading',
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: textGray,
                                      ),
                                    ),
                                    value: _textHighlighting,
                                    activeTrackColor: primaryBlue.withValues(
                                      alpha: 0.5,
                                    ),
                                    activeThumbColor: primaryBlue,
                                    contentPadding: EdgeInsets.zero,
                                    onChanged: (val) {
                                      setState(() => _textHighlighting = val);
                                      ReadingPreferencesService.setTextHighlighting(
                                        val,
                                      );
                                    },
                                  ),

                                  // Highlight Color Selector (When enabled)
                                  if (_textHighlighting) ...[
                                    const SizedBox(height: 12),
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          'Highlight Color',
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: textGray,
                                          ),
                                        ),
                                        Row(
                                          children: ReadingPreferencesService
                                              .highlightColorOptions
                                              .map((color) {
                                                final isSelected =
                                                    _highlightColor
                                                        .toARGB32() ==
                                                    color.toARGB32();
                                                return GestureDetector(
                                                  onTap: () {
                                                    setState(
                                                      () => _highlightColor =
                                                          color,
                                                    );
                                                    ReadingPreferencesService.setHighlightColor(
                                                      color,
                                                    );
                                                  },
                                                  child: Container(
                                                    margin:
                                                        const EdgeInsets.only(
                                                          left: 10,
                                                        ),
                                                    width: 28,
                                                    height: 28,
                                                    decoration: BoxDecoration(
                                                      color: color,
                                                      shape: BoxShape.circle,
                                                      border: Border.all(
                                                        color: isSelected
                                                            ? primaryBlue
                                                            : Colors.black12,
                                                        width: isSelected
                                                            ? 2.5
                                                            : 1,
                                                      ),
                                                      boxShadow: isSelected
                                                          ? [
                                                              BoxShadow(
                                                                color: color
                                                                    .withValues(
                                                                      alpha:
                                                                          0.5,
                                                                    ),
                                                                blurRadius: 6,
                                                                offset:
                                                                    const Offset(
                                                                      0,
                                                                      2,
                                                                    ),
                                                              ),
                                                            ]
                                                          : null,
                                                    ),
                                                    child: isSelected
                                                        ? const Icon(
                                                            Icons.check_rounded,
                                                            size: 16,
                                                            color:
                                                                Colors.black87,
                                                          )
                                                        : null,
                                                  ),
                                                );
                                              })
                                              .toList(),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),

                            // ── Microphone Access & Health Check (DIRECT SECTION) ────────
                            Text(
                              'Microphone & Audio Check',
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
                                  // 1. Microphone Permission Status Row
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(8),
                                            decoration: BoxDecoration(
                                              color: const Color(
                                                0xFF1B64D8,
                                              ).withValues(alpha: 0.1),
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.mic_rounded,
                                              color: Color(0xFF1B64D8),
                                              size: 20,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Microphone Access',
                                                style: GoogleFonts.inter(
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                              Text(
                                                'Required for Phil-IRI reading',
                                                style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  color: textGray,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(
                                            0xFF00A859,
                                          ).withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(
                                            20,
                                          ),
                                          border: Border.all(
                                            color: const Color(
                                              0xFF00A859,
                                            ).withValues(alpha: 0.3),
                                          ),
                                        ),
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Icons.check_circle_rounded,
                                              color: Color(0xFF00A859),
                                              size: 14,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              'GRANTED',
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w800,
                                                color: const Color(0xFF00A859),
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const Divider(height: 24),

                                  // 2. Interactive Microphone test section
                                  Text(
                                    'Test Your Microphone',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Read the phrase below to make sure your mic is working clearly:',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: textGray,
                                    ),
                                  ),
                                  const SizedBox(height: 10),

                                  // Practice sentence box
                                  Container(
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF4F4F5),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFFE4E4E7),
                                      ),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                      vertical: 12,
                                    ),
                                    child: Text(
                                      '"The bright sun shines over the green hills."',
                                      textAlign: TextAlign.center,
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF18181B),
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 14),

                                  // 3. Soundwave Level & Status Bar (Full width)
                                  Container(
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF4F4F5),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFFE4E4E7),
                                      ),
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 14,
                                    ),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: _isTestingMic
                                          ? _waveform.map((heightValue) {
                                              return AnimatedContainer(
                                                duration: const Duration(
                                                  milliseconds: 100,
                                                ),
                                                width: 4,
                                                height: 6 + (28 * heightValue),
                                                margin:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 3,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: primaryBlue,
                                                  borderRadius:
                                                      BorderRadius.circular(2),
                                                ),
                                              );
                                            }).toList()
                                          : [
                                              Icon(
                                                _micTestSuccess
                                                    ? Icons.check_circle_rounded
                                                    : Icons.mic_none_rounded,
                                                color: _micTestSuccess
                                                    ? const Color(0xFF00A859)
                                                    : textGray,
                                                size: 18,
                                              ),
                                              const SizedBox(width: 8),
                                              Text(
                                                _micTestSuccess
                                                    ? 'Microphone working clearly!'
                                                    : 'Tap Test Mic and read the phrase',
                                                style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                  color: _micTestSuccess
                                                      ? const Color(0xFF00A859)
                                                      : textGray,
                                                ),
                                              ),
                                            ],
                                    ),
                                  ),
                                  const SizedBox(height: 12),

                                  // 4. Equal Side-by-Side Action Button Row
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton.icon(
                                          onPressed: _isTestingMic
                                              ? null
                                              : _testMicrophone,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: _isTestingMic
                                                ? Colors.grey[300]
                                                : primaryBlue,
                                            foregroundColor: Colors.white,
                                            elevation: 0,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(10),
                                            ),
                                            padding: const EdgeInsets.symmetric(
                                              vertical: 12,
                                            ),
                                          ),
                                          icon: Icon(
                                            _isTestingMic
                                                ? Icons.graphic_eq_rounded
                                                : Icons.mic_rounded,
                                            size: 18,
                                          ),
                                          label: Text(
                                            _isTestingMic
                                                ? 'Listening...'
                                                : 'Test Mic',
                                            style: GoogleFonts.inter(
                                              fontWeight: FontWeight.w700,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      ),
                                      if (_micTestSuccess &&
                                          !_isTestingMic) ...[
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            onPressed: _toggleAudioReplay,
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: _isPlayingReplay
                                                  ? const Color(0xFFEF4444)
                                                  : const Color(0xFF00A859),
                                              foregroundColor: Colors.white,
                                              elevation: 0,
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                              ),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 12,
                                                  ),
                                            ),
                                            icon: Icon(
                                              _isPlayingReplay
                                                  ? Icons.stop_rounded
                                                  : Icons.play_arrow_rounded,
                                              size: 18,
                                            ),
                                            label: Text(
                                              _isPlayingReplay
                                                  ? 'Stop Sample'
                                                  : 'Play Sample',
                                              style: GoogleFonts.inter(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
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
                                  _buildSettingItem(
                                    Ph.user,
                                    'Profile details',
                                    _showProfileDetails,
                                  ),
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFF1F1F4),
                                  ),
                                  _buildSettingItem(
                                    Ph.lock,
                                    'Password',
                                    _showChangePassword,
                                  ),
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFF1F1F4),
                                  ),
                                  _buildSettingItem(
                                    Ph.bell,
                                    'Notifications',
                                    _showNotificationSettings,
                                  ),
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
                                  _buildSettingItem(
                                    Ph.info,
                                    'About application',
                                    _showAboutApplication,
                                  ),
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFF1F1F4),
                                  ),
                                  _buildSettingItem(
                                    Ph.chat_teardrop_text,
                                    'Help / FAQ',
                                    _showHelpFAQ,
                                  ),
                                  const Divider(
                                    height: 1,
                                    indent: 56,
                                    endIndent: 16,
                                    color: Color(0xFFF1F1F4),
                                  ),
                                  // Clear Cache row directly in Group 2
                                  ListTile(
                                    onTap: _isClearingCache
                                        ? null
                                        : _clearCache,
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
                                              valueColor:
                                                  AlwaysStoppedAnimation<Color>(
                                                    primaryBlue,
                                                  ),
                                            ),
                                          )
                                        : const Icon(
                                            Icons.keyboard_arrow_right,
                                            color: Color(0xFFA1A1AA),
                                            size: 20,
                                          ),
                                    contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 4,
                                    ),
                                    visualDensity: VisualDensity.compact,
                                  ),
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

  // ── Helper Settings Item & Skeleton Builders ─────────────────────────────

  Widget _buildBannerSkeleton() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(22.0),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 140,
                  height: 24,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: 100,
                  height: 16,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
              color: Color(0xFFCBD5E1),
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingItem(
    String iconSvg,
    String title,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: ListTile(
        onTap: onTap,
        leading: Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF4F4F5),
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.all(8),
          child: Iconify(iconSvg, color: const Color(0xFF71717A), size: 20),
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        trailing: const Icon(
          Icons.keyboard_arrow_right,
          color: Color(0xFFA1A1AA),
          size: 20,
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}
