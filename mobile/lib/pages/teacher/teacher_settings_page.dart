import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/local_notification_service.dart';
import 'package:salintinig/widgets/app_toast.dart';

class TeacherSettingsPage extends StatefulWidget {
  const TeacherSettingsPage({super.key});

  @override
  State<TeacherSettingsPage> createState() => _TeacherSettingsPageState();
}

class _TeacherSettingsPageState extends State<TeacherSettingsPage> {
  bool _dailyReminder = true;
  TimeOfDay _reminderTime = const TimeOfDay(hour: 19, minute: 0);
  bool _achievementAlerts = true;
  bool _isClearingCache = false;

  @override
  void initState() {
    super.initState();
    _loadNotificationPreferences();
  }

  Future<void> _loadNotificationPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    if (mounted) {
      setState(() {
        _dailyReminder = prefs.getBool('dailyReminder') ?? true;
        _achievementAlerts = prefs.getBool('achievementAlerts') ?? true;
        final savedHour = prefs.getInt('reminderHour') ?? 19;
        final savedMinute = prefs.getInt('reminderMinute') ?? 0;
        _reminderTime = TimeOfDay(hour: savedHour, minute: savedMinute);
      });
    }
  }

  Future<void> _saveNotificationPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('dailyReminder', _dailyReminder);
    await prefs.setBool('achievementAlerts', _achievementAlerts);
    await prefs.setInt('reminderHour', _reminderTime.hour);
    await prefs.setInt('reminderMinute', _reminderTime.minute);

    if (_dailyReminder) {
      await LocalNotificationService.scheduleDailyReminder(
        hour: _reminderTime.hour,
        minute: _reminderTime.minute,
      );
    } else {
      await LocalNotificationService.cancelDailyReminder();
    }

    if (mounted) {
      AppToast.success(context, 'Notification settings updated!');
    }
  }

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
      builder: (BuildContext context, Widget? child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFD34426),
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _reminderTime) {
      setModalState(() => _reminderTime = picked);
      setState(() => _reminderTime = picked);
      _saveNotificationPreferences();
    }
  }

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

      AuthService.clearAllCache();
      await AuthService.fetchClassStudents(forceRefresh: true);
      await Future.delayed(const Duration(milliseconds: 500));
    } catch (e) {
      debugPrint('[TeacherSettingsPage] Error clearing cache: $e');
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
  void _showProfileDetails() {
    Feedback.forTap(context);
    final user = AuthService.currentUser;
    final fullName = user?.displayName ?? 'Teacher';
    final raw = user?.rawUser;
    final title = raw?['title'] ??
        raw?['position'] ??
        (user?.gradeLevel.isNotEmpty == true
            ? 'Grade ${user?.gradeLevel} Teacher'
            : 'Grade Teacher');
    final school =
        raw?['school_name'] ?? raw?['schoolName'] ?? raw?['school'] ?? 'N/A';
    final empNo = raw?['teacher_no'] ??
        raw?['teacherNo'] ??
        raw?['id_no'] ??
        raw?['employeeId'] ??
        'N/A';
    final email = user?.email.isNotEmpty == true ? user!.email : 'N/A';
    final sec = user?.sectionName ?? '';
    final grade = user?.gradeLevel ?? '';
    final assignedClass = sec.toLowerCase().startsWith('grade')
        ? sec
        : (sec.isNotEmpty && grade.isNotEmpty
            ? 'Grade $grade - $sec'
            : (sec.isNotEmpty
                ? sec
                : (grade.isNotEmpty ? 'Grade $grade' : 'Assigned Class')));

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        const primaryColor = Color(0xFFD34426);
        const textDark = Color(0xFF18181B);
        const textGray = Color(0xFF71717A);

        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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
                          color: primaryColor.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Iconify(
                          Ph.user_bold,
                          size: 20,
                          color: primaryColor,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Profile Details',
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
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildModalInfoRow('Full Name', fullName),
              _buildModalInfoRow('Designation / Position', title.toString()),
              _buildModalInfoRow('Employee ID', empNo.toString()),
              _buildModalInfoRow('Email Address', email),
              _buildModalInfoRow('School', school.toString()),
              _buildModalInfoRow('Assigned Class', assignedClass),
              const SizedBox(height: 12),
            ],
          ),
        );
      },
    );
  }

  Widget _buildModalInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
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
          const Divider(height: 16, color: Color(0xFFF4F4F5)),
        ],
      ),
    );
  }

  // 2. Change Password Modal (matching student side with eye visibility toggles)
  void _showChangePasswordModal() {
    Feedback.forTap(context);
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
          builder: (modalCtx, setModalState) {
            const primaryColor = Color(0xFFD34426);
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
                  borderSide: const BorderSide(color: primaryColor, width: 2),
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
                top: 16,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
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
                              color: primaryColor.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Iconify(
                              Ph.lock_key_bold,
                              size: 20,
                              color: primaryColor,
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
                  TextField(
                    controller: currentController,
                    obscureText: obscureCurrent,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: textDark,
                    ),
                    decoration: buildInputDecoration(
                      'Current Password',
                      'Enter current password',
                      obscureCurrent,
                      () => setModalState(() => obscureCurrent = !obscureCurrent),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: newController,
                    obscureText: obscureNew,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: textDark,
                    ),
                    decoration: buildInputDecoration(
                      'New Password',
                      'Minimum 6 characters',
                      obscureNew,
                      () => setModalState(() => obscureNew = !obscureNew),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: confirmController,
                    obscureText: obscureConfirm,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: textDark,
                    ),
                    decoration: buildInputDecoration(
                      'Confirm New Password',
                      'Re-enter new password',
                      obscureConfirm,
                      () => setModalState(() => obscureConfirm = !obscureConfirm),
                    ),
                  ),
                  const SizedBox(height: 24),
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
                                if (mounted) {
                                  AppToast.success(
                                    context,
                                    'Password updated successfully!',
                                  );
                                }
                              } else {
                                if (mounted) {
                                  AppToast.error(
                                    context,
                                    res.error ??
                                        res.message ??
                                        'Failed to update password.',
                                  );
                                }
                              }
                            } catch (e) {
                              if (mounted) {
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
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      elevation: 0,
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

  // 3. Notification Settings Modal (matching student card container layout & test notification)
  void _showNotificationSettingsModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (modalCtx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            const primaryColor = Color(0xFFD34426);
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
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 16,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 24,
              ),
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
                              color: primaryColor.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Iconify(
                              Ph.bell_bold,
                              size: 20,
                              color: primaryColor,
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

                  // Section 1: Daily Practice & Reminders Card
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
                              color: primaryColor,
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
                                    'Reminds you to conduct reading assessments daily',
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
                              activeTrackColor: primaryColor.withValues(alpha: 0.5),
                              activeThumbColor: primaryColor,
                              onChanged: (val) {
                                setModalState(() => _dailyReminder = val);
                                setState(() => _dailyReminder = val);
                                _saveNotificationPreferences();
                              },
                            ),
                          ],
                        ),
                        if (_dailyReminder) ...[
                          const Divider(height: 20, color: borderColor),
                          InkWell(
                            onTap: () => _selectReminderTime(context, setModalState),
                            borderRadius: BorderRadius.circular(10),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                                      color: primaryColor.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _formatTimeOfDay(_reminderTime),
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                        color: primaryColor,
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
                                      'Assessment Deadline Warning',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: textDark,
                                      ),
                                    ),
                                    Text(
                                      'Alert at 8:00 PM if class assessments are pending',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: textGray,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Switch.adaptive(
                                value: _achievementAlerts,
                                activeTrackColor: const Color(0xFFF97316).withValues(alpha: 0.5),
                                activeThumbColor: const Color(0xFFF97316),
                                onChanged: (val) {
                                  setModalState(() => _achievementAlerts = val);
                                  setState(() => _achievementAlerts = val);
                                  _saveNotificationPreferences();
                                },
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Section 2: Class Alerts Card
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
                                    'Student Progress & Milestones',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                    ),
                                  ),
                                  Text(
                                    'Get notified when students reach reading goals',
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
                              activeTrackColor: primaryColor.withValues(alpha: 0.5),
                              activeThumbColor: primaryColor,
                              onChanged: (val) {
                                setModalState(() => _achievementAlerts = val);
                                setState(() => _achievementAlerts = val);
                                _saveNotificationPreferences();
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
                                    'Classroom Submissions',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: textDark,
                                    ),
                                  ),
                                  Text(
                                    'Alert when students submit reading tasks',
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
                              activeTrackColor: primaryColor.withValues(alpha: 0.5),
                              activeThumbColor: primaryColor,
                              onChanged: (val) {
                                setModalState(() => _achievementAlerts = val);
                                setState(() => _achievementAlerts = val);
                                _saveNotificationPreferences();
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
                        title: 'SalinTinig Teacher Alert',
                        body: 'Notifications are working perfectly! You will receive class reading updates.',
                      );
                      if (modalCtx.mounted) {
                        AppToast.success(
                          modalCtx,
                          'Sample notification sent to your device status bar!',
                        );
                      }
                    },
                    icon: const Iconify(
                      Ph.paper_plane_tilt_bold,
                      size: 18,
                      color: primaryColor,
                    ),
                    label: Text(
                      'Test Sample Notification',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: primaryColor,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: primaryColor, width: 1.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
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
        const textDark = Color(0xFF18181B);
        const textGray = Color(0xFF71717A);

        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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
                      Text(
                        'About SalinTinig',
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
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const Divider(height: 24, color: Color(0xFFF4F4F5)),
              Text(
                'SalinTinig is a speech-to-text capstone reading application designed to assist elementary teachers and students in conducting DepEd Phil-IRI reading assessments, tracking fluency speed, and managing oral reading progress.',
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
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      color: textDark,
                    ),
                  ),
                  Text(
                    'v1.0.0 (Build 24)',
                    style: GoogleFonts.inter(
                      color: textGray,
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
  void _showHelpFAQModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        const primaryColor = Color(0xFFD34426);
        const textDark = Color(0xFF18181B);
        const textGray = Color(0xFF71717A);

        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
          ),
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
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
                          color: primaryColor.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Iconify(
                          Ph.question_bold,
                          size: 20,
                          color: primaryColor,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Help / FAQ',
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
                    onPressed: () => Navigator.pop(context),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const Divider(height: 24, color: Color(0xFFF4F4F5)),
              Expanded(
                child: ListView(
                  physics: const BouncingScrollPhysics(),
                  children: [
                    ExpansionTile(
                      title: Text(
                        'What is SalinTinig?',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'SalinTinig is an automated Phil-IRI assessment and oral reading analysis platform designed for DepEd schools to monitor student reading proficiency levels in real time.',
                            style: GoogleFonts.inter(
                              height: 1.4,
                              color: const Color(0xFF3F3F46),
                            ),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text(
                        'How are student reading levels classified?',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Reading levels (Independent, Instructional, Frustrational, Non-Reader) are automatically calculated based on Oral Reading Score (%) and Comprehension Score (%) following official DepEd Phil-IRI guidelines.',
                            style: GoogleFonts.inter(
                              height: 1.4,
                              color: const Color(0xFF3F3F46),
                            ),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text(
                        'How do I generate and export Phil-IRI Form 1 to 4?',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Navigate to the Phil - IRI Records tab in the navigation bar to access pre-formatted templates, enter assessment scores, or export official DepEd Form 1–4 summary records.',
                            style: GoogleFonts.inter(
                              height: 1.4,
                              color: const Color(0xFF3F3F46),
                            ),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text(
                        'How do class activities and oral reading practice work?',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Go to Class Activities to create custom practice passages, assign reading tasks, and view real-time student recordings and submission progress.',
                            style: GoogleFonts.inter(
                              height: 1.4,
                              color: const Color(0xFF3F3F46),
                            ),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text(
                        'What notifications do I receive on my dashboard?',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'You will receive real-time alerts for student Phil-IRI oral reading assessment completions, class progress alerts, and school announcements.',
                            style: GoogleFonts.inter(
                              height: 1.4,
                              color: const Color(0xFF3F3F46),
                            ),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text(
                        'How do Faculty-in-Charge (FIC) grade-level permissions work?',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'If designated as Faculty-in-Charge for a grade level, you can view summary reading statistics, section performance, and faculty records across all sections in your assigned grade level.',
                            style: GoogleFonts.inter(
                              height: 1.4,
                              color: const Color(0xFF3F3F46),
                            ),
                          ),
                        ),
                      ],
                    ),
                    ExpansionTile(
                      title: Text(
                        'Need additional support?',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          color: textDark,
                        ),
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(12.0),
                          child: Text(
                            'Contact your school administrator or reach out to DepEd IT support at support.salintinig@deped.gov.ph.',
                            style: GoogleFonts.inter(
                              height: 1.4,
                              color: const Color(0xFF3F3F46),
                            ),
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
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softBg,
      appBar: AppBar(
        backgroundColor: softBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => const TeacherOverviewPage(),
                ),
              );
            }
          },
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            size: 20,
            color: Colors.black,
          ),
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
          padding: const EdgeInsets.fromLTRB(20.0, 12.0, 20.0, 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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

              // Card Group 1: Profile details, Password, Notifications
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
                    _buildSettingsTile(
                      iconName: Ph.user,
                      title: 'Profile details',
                      onTap: _showProfileDetails,
                    ),
                    const Divider(
                      height: 1,
                      indent: 56,
                      endIndent: 16,
                      color: Color(0xFFF1F1F4),
                    ),
                    _buildSettingsTile(
                      iconName: Ph.lock,
                      title: 'Password',
                      onTap: _showChangePasswordModal,
                    ),
                    const Divider(
                      height: 1,
                      indent: 56,
                      endIndent: 16,
                      color: Color(0xFFF1F1F4),
                    ),
                    _buildSettingsTile(
                      iconName: Ph.bell,
                      title: 'Notifications',
                      onTap: _showNotificationSettingsModal,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Card Group 2: About application, Help / FAQ, Clear App Cache (Deactivate removed)
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
                    _buildSettingsTile(
                      iconName: Ph.info,
                      title: 'About application',
                      onTap: _showAboutApplicationModal,
                    ),
                    const Divider(
                      height: 1,
                      indent: 56,
                      endIndent: 16,
                      color: Color(0xFFF1F1F4),
                    ),
                    _buildSettingsTile(
                      iconName: Ph.chat_teardrop_text,
                      title: 'Help / FAQ',
                      onTap: _showHelpFAQModal,
                    ),
                    const Divider(
                      height: 1,
                      indent: 56,
                      endIndent: 16,
                      color: Color(0xFFF1F1F4),
                    ),
                    _buildSettingsTile(
                      iconName: Ph.arrows_counter_clockwise,
                      title: 'Clear App Cache',
                      isLoading: _isClearingCache,
                      onTap: _clearAppCache,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
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
    bool isLoading = false,
  }) {
    final iconColor = Colors.grey[700]!;
    const iconBg = Color(0xFFF8FAFC);
    const textColor = Colors.black;

    return Material(
      color: Colors.transparent,
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
        trailing: isLoading
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFFD34426),
                ),
              )
            : Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: Colors.grey[400],
              ),
        onTap: isLoading
            ? null
            : () {
                Feedback.forTap(context);
                onTap();
              },
      ),
    );
  }
}
