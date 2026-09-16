import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/library_service.dart';
import 'package:salintinig/services/streak_service.dart';
import 'package:salintinig/services/badge_service.dart';
import 'package:salintinig/services/analytics_service.dart';

/// Background prefetch service that pre-warms and caches all student data
/// for Overview, Progress, Library, Badges, and Profile pages silently.
class StudentPrefetchService {
  static bool _isPrefetching = false;

  /// Trigger a non-blocking background prefetch of all student tab data.
  static void prefetchAll() {
    if (_isPrefetching) return;
    _isPrefetching = true;

    Future.microtask(() async {
      try {
        if (AuthService.currentUser == null || AuthService.currentUser!.role.toLowerCase() != 'student') {
          _isPrefetching = false;
          return;
        }

        debugPrint('[StudentPrefetchService] Starting background prefetch for all student tabs...');

        await Future.wait([
          StreakService.syncStreakWithBackend(),
          LibraryService.fetchBooks(),
          LibraryService.fetchReadingProgress(),
          BadgeService.fetchBadges(),
          AnalyticsService.fetchAnalytics(),
          prefetchAssignedActivities(),
        ]);

        debugPrint('[StudentPrefetchService] All student tabs background prefetch complete!');
      } catch (e) {
        debugPrint('[StudentPrefetchService] Error during background prefetch: $e');
      } finally {
        _isPrefetching = false;
      }
    });
  }

  /// Prefetch Phil-IRI assigned assessments & attempt statuses into disk/memory cache.
  static Future<void> prefetchAssignedActivities() async {
    try {
      final res = await ApiService.get('/students/assessment/my-assignment');
      if (res.success && res.data != null) {
        final activitiesList = res.data['assignedActivities'];
        final attempts = res.data['attemptsStatus'];
        final prefs = await SharedPreferences.getInstance();

        if (activitiesList != null && activitiesList is List) {
          final list = List<Map<String, dynamic>>.from(activitiesList);
          await prefs.setString('cached_assigned_activities', jsonEncode(list));
        }

        if (attempts != null && attempts is Map) {
          final map = Map<String, dynamic>.from(attempts);
          await prefs.setString('cached_attempts_status', jsonEncode(map));
        }
      }
    } catch (e) {
      debugPrint('[StudentPrefetchService] Error prefetching assignments: $e');
    }
  }
}
