import 'package:flutter/foundation.dart';
import 'package:salintinig/services/api_service.dart';

class AppNotification {
  final String id;
  final String title;
  final String message;
  final String notificationType;
  final bool isRead;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.notificationType,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: (json['id'] ?? json['notification_id'] ?? '').toString(),
      title: (json['title'] ?? 'Notification').toString(),
      message: (json['message'] ?? json['desc'] ?? '').toString(),
      notificationType: (json['notification_type'] ?? json['type'] ?? 'general').toString(),
      isRead: json['is_read'] == true || json['isRead'] == true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  String get timeAgo {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${createdAt.month}/${createdAt.day}/${createdAt.year}';
  }
}

class NotificationService extends ChangeNotifier {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  List<AppNotification> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;

  List<AppNotification> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;

  /// Fetch live notifications from backend API
  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final res = await ApiService.get('/notifications');
      if (res.success && res.data != null) {
        final List raw = res.data['notifications'] ?? [];
        _notifications = raw.map((n) => AppNotification.fromJson(Map<String, dynamic>.from(n))).toList();
        _unreadCount = res.data['unreadCount'] ?? _notifications.where((n) => !n.isRead).length;
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Mark single notification as read
  Future<void> markAsRead(String notificationId) async {
    // Optimistic update
    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = AppNotification(
        id: _notifications[index].id,
        title: _notifications[index].title,
        message: _notifications[index].message,
        notificationType: _notifications[index].notificationType,
        isRead: true,
        createdAt: _notifications[index].createdAt,
      );
      if (_unreadCount > 0) _unreadCount--;
      notifyListeners();
    }

    try {
      await ApiService.patch('/notifications/$notificationId/read', {});
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    // Optimistic update
    _notifications = _notifications.map((n) {
      return AppNotification(
        id: n.id,
        title: n.title,
        message: n.message,
        notificationType: n.notificationType,
        isRead: true,
        createdAt: n.createdAt,
      );
    }).toList();
    _unreadCount = 0;
    notifyListeners();

    try {
      await ApiService.patch('/notifications/read-all', {});
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
  }
}
