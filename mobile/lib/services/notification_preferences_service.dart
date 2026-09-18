import 'package:shared_preferences/shared_preferences.dart';

class NotificationPreferencesService {
  static const String _keyDailyReminder = 'notif_daily_reminder';
  static const String _keyReminderHour = 'notif_reminder_hour';
  static const String _keyReminderMinute = 'notif_reminder_minute';
  static const String _keyStreakProtection = 'notif_streak_protection';
  static const String _keyAchievementAlerts = 'notif_achievement_alerts';
  static const String _keyAssignmentAlerts = 'notif_assignment_alerts';

  static Future<bool> getDailyReminder() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyDailyReminder) ?? true;
  }

  static Future<void> setDailyReminder(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyDailyReminder, value);
  }

  static Future<int> getReminderHour() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_keyReminderHour) ?? 19; // Default 7:00 PM
  }

  static Future<void> setReminderHour(int hour) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyReminderHour, hour);
  }

  static Future<int> getReminderMinute() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt(_keyReminderMinute) ?? 0;
  }

  static Future<void> setReminderMinute(int minute) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_keyReminderMinute, minute);
  }

  static Future<bool> getStreakProtection() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyStreakProtection) ?? true;
  }

  static Future<void> setStreakProtection(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyStreakProtection, value);
  }

  static Future<bool> getAchievementAlerts() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyAchievementAlerts) ?? true;
  }

  static Future<void> setAchievementAlerts(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyAchievementAlerts, value);
  }

  static Future<bool> getAssignmentAlerts() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_keyAssignmentAlerts) ?? true;
  }

  static Future<void> setAssignmentAlerts(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyAssignmentAlerts, value);
  }
}
