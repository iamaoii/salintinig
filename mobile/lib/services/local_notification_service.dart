import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class LocalNotificationService {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static bool _initialized = false;

  /// Initialize local notification settings for Android and iOS
  static Future<void> init() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    const darwinSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: darwinSettings,
    );

    await _notificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        debugPrint('Notification clicked: ${details.payload}');
      },
    );

    // Request permissions on Android 13+ (API level 33+)
    final androidImplementation =
        _notificationsPlugin.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    if (androidImplementation != null) {
      await androidImplementation.requestNotificationsPermission();
    }

    _initialized = true;
  }

  /// Show an instant OS system tray notification
  static Future<void> showInstantNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    await init();

    const androidDetails = AndroidNotificationDetails(
      'salintinig_alerts_channel',
      'SalinTinig Alerts',
      channelDescription: 'System and assessment notifications for SalinTinig',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      color: Color(0xFFD34426),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.show(
      DateTime.now().millisecond,
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  /// Schedule a daily reminder system tray notification
  static Future<void> scheduleDailyReminder({
    required int hour,
    required int minute,
  }) async {
    await init();

    // Cancel existing reminder first to prevent duplicates
    await cancelDailyReminder();

    const androidDetails = AndroidNotificationDetails(
      'salintinig_daily_reminder',
      'SalinTinig Daily Reminders',
      channelDescription: 'Daily practice and evaluation reminders for SalinTinig',
      importance: Importance.high,
      priority: Priority.high,
      color: Color(0xFFD34426),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    // Show immediate test notification when scheduled
    await _notificationsPlugin.show(
      888,
      'Daily Reminder Set',
      'You will receive daily reminders at ${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}.',
      notificationDetails,
    );
  }

  /// Cancel daily scheduled reminder
  static Future<void> cancelDailyReminder() async {
    await _notificationsPlugin.cancel(888);
  }
}
