import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/api_service.dart';

/// Service managing student practice streaks and weekly activity tracking.
///
/// Design principles (Duolingo Style):
///   • The BACKEND is the sole source of truth for streak count and date.
///   • Days completed this week stay Orange ('done') in the weekly tracker,
///     even if streak breaks or restarts.
///   • Missed days in the past stay Grey ('missed'). Future days stay Grey ('future').
///   • When streak is explicitly reset (e.g. testing or logout), all days return to clean state.
class StreakService {
  static const String _keyCompletedDate        = 'streak_completed_today_date';
  static const String _keyCachedStreak         = 'streak_cached_count';
  static const String _keyCachedLastDate       = 'streak_cached_last_date';
  static const String _keyWeeklyCompletedDates = 'streak_weekly_completed_dates';
  static const String _keyServerTodayDate      = 'streak_server_today_date';

  /// Global notifier to alert UI components when streak state changes.
  static final ValueNotifier<int> streakNotifier = ValueNotifier<int>(0);

  // Cached weekly tracker for instant synchronous access in celebration modals
  static List<Map<String, String>> _cachedWeeklyTracker = [];

  static List<Map<String, String>> getCachedWeeklyTracker() => List.unmodifiable(_cachedWeeklyTracker);

  // Format using date string (YYYY-MM-DD)
  static String _formatDate(DateTime dt) {
    return '${dt.year.toString().padLeft(4, '0')}'
        '-${dt.month.toString().padLeft(2, '0')}'
        '-${dt.day.toString().padLeft(2, '0')}';
  }

  /// Returns today's weekday index (0 for Monday, 1 for Tuesday, ..., 6 for Sunday)
  static int getTodayDayIndex() {
    final now = DateTime.now();
    return (now.weekday - 1).clamp(0, 6);
  }

  static bool _isSyncing = false;

  // ─────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────

  /// Call this after the student finishes any activity to update streak state.
  static Future<void> recordActivityCompletion() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final todayStr = prefs.getString(_keyServerTodayDate) ?? _formatDate(DateTime.now());

      await prefs.setString(_keyCompletedDate, todayStr);
      await prefs.setString(_keyCachedLastDate, todayStr);

      // Duolingo style: record today in weekly completion history
      final List<String> weekly = prefs.getStringList(_keyWeeklyCompletedDates) ?? [];
      if (!weekly.contains(todayStr)) {
        weekly.add(todayStr);
        await prefs.setStringList(_keyWeeklyCompletedDates, weekly);
      }

      // Trigger backend sync to get authoritative server streak
      await syncStreakWithBackend();

      // Refresh cached weekly tracker
      await getWeeklyTracker();
    } catch (e) {
      debugPrint('[StreakService] Error recording completion: $e');
    }
  }

  /// Fetch authoritative streak data from backend (Duolingo style).
  static Future<void> syncStreakWithBackend() async {
    if (_isSyncing) return;
    _isSyncing = true;
    try {
      final response = await ApiService.get('/student/streak');
      if (response.success && response.data != null) {
        final data = response.data['data'];
        if (data == null) return;

        final String? serverLastDate = data['lastActivityDate'] as String?;
        final int serverStreak = (data['currentStreak'] as num?)?.toInt() ?? 0;
        final bool serverCompletedToday = data['hasCompletedToday'] == true;
        final String? serverToday = data['todayDate'] as String?;

        final prefs = await SharedPreferences.getInstance();
        if (serverToday != null && serverToday.isNotEmpty) {
          await prefs.setString(_keyServerTodayDate, serverToday);
        }

        final todayStr = serverToday ?? _formatDate(DateTime.now());

        final int oldStreak = prefs.getInt(_keyCachedStreak) ?? 0;
        final bool oldCompletedToday = (prefs.getString(_keyCompletedDate) == todayStr ||
                                         prefs.getString(_keyCachedLastDate) == todayStr);

        await prefs.setInt(_keyCachedStreak, serverStreak);

        if (serverLastDate != null) {
          await prefs.setString(_keyCachedLastDate, serverLastDate);
        } else {
          await prefs.remove(_keyCachedLastDate);
        }

        if (serverCompletedToday || serverLastDate == todayStr) {
          await prefs.setString(_keyCompletedDate, todayStr);
          // Also ensure todayStr is in weekly completed dates
          final List<String> weekly = prefs.getStringList(_keyWeeklyCompletedDates) ?? [];
          if (!weekly.contains(todayStr)) {
            weekly.add(todayStr);
            await prefs.setStringList(_keyWeeklyCompletedDates, weekly);
          }
        } else {
          await prefs.remove(_keyCompletedDate);
        }

        if (serverStreak == 0) {
          await prefs.remove(_keyCompletedDate);
          await prefs.remove(_keyCachedLastDate);
          await prefs.remove(_keyWeeklyCompletedDates);
        }

        final bool newCompletedToday = (prefs.getString(_keyCompletedDate) == todayStr ||
                                        prefs.getString(_keyCachedLastDate) == todayStr) &&
                                       serverStreak > 0;

        // Re-cache weekly tracker
        await getWeeklyTracker();

        // Only notify UI if streak count or completion state actually changed
        if (oldStreak != serverStreak || oldCompletedToday != newCompletedToday) {
          streakNotifier.value++;
        }
      }
    } catch (_) {
    } finally {
      _isSyncing = false;
    }
  }

  /// Returns true if the student has already completed an activity today.
  static Future<bool> hasCompletedToday() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final todayStr = prefs.getString(_keyServerTodayDate) ?? _formatDate(DateTime.now());
      final streakCount = prefs.getInt(_keyCachedStreak) ?? 0;
      if (streakCount == 0) return false;

      return prefs.getString(_keyCompletedDate) == todayStr ||
             prefs.getString(_keyCachedLastDate) == todayStr;
    } catch (_) {
      return false;
    }
  }

  /// Returns the cached streak count from the last sync (or optimistic value).
  static Future<int> getStreakCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getInt(_keyCachedStreak) ?? 0;
    } catch (_) {
      return 0;
    }
  }

  /// Returns per-day state for the current Mon-Sun week.
  /// Duolingo style: Completed days in the current week stay Orange ('done').
  /// Missed days in the past stay Grey ('missed'). Future days stay Light Grey ('future').
  static Future<List<Map<String, String>>> getWeeklyTracker() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final todayStr = prefs.getString(_keyServerTodayDate) ?? _formatDate(DateTime.now());
      final bool hasLocalToday = prefs.getString(_keyCompletedDate) == todayStr ||
                                 prefs.getString(_keyCachedLastDate) == todayStr;
      final int streakCount    = prefs.getInt(_keyCachedStreak) ?? 0;
      final String? lastDate   = prefs.getString(_keyCachedLastDate);

      final DateTime parsedToday = DateTime.tryParse(todayStr) ?? DateTime.now();
      final DateTime today       = DateTime(parsedToday.year, parsedToday.month, parsedToday.day);
      final DateTime monday      = today.subtract(Duration(days: today.weekday - 1));
      final String   mondayStr   = _formatDate(monday);

      // Stored individual completed days from this week (Duolingo style)
      final List<String> storedWeekly = prefs.getStringList(_keyWeeklyCompletedDates) ?? [];
      final Set<String> doneDates = storedWeekly
          .where((d) => d.compareTo(mondayStr) >= 0 && d.compareTo(todayStr) <= 0)
          .toSet();

      // Merge active streak consecutive window ending at effectiveAnchorDate
      if (streakCount > 0) {
        final DateTime effectiveAnchorDate = hasLocalToday
            ? today
            : (lastDate != null ? (DateTime.tryParse(lastDate) ?? today) : today);
        final DateTime anchorDate = DateTime(effectiveAnchorDate.year, effectiveAnchorDate.month, effectiveAnchorDate.day);

        for (int i = 0; i < streakCount; i++) {
          final DateTime d = anchorDate.subtract(Duration(days: i));
          final String dStr = _formatDate(d);
          if (dStr.compareTo(mondayStr) >= 0 && dStr.compareTo(todayStr) <= 0) {
            doneDates.add(dStr);
          }
        }
        if (hasLocalToday) doneDates.add(todayStr);
      }

      const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

      final tracker = List.generate(7, (i) {
        final DateTime dayDate = monday.add(Duration(days: i));
        final String   dayStr  = _formatDate(dayDate);
        final String   state   = doneDates.contains(dayStr)
            ? 'done'
            : dayDate.isAfter(today) ? 'future' : 'missed';
        return {'label': dayLabels[i], 'state': state, 'date': dayStr};
      });

      _cachedWeeklyTracker = tracker;
      return tracker;
    } catch (e) {
      debugPrint('[StreakService] Error building weekly tracker: $e');
      return List.generate(7, (i) => {
        'label': ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        'state': 'future',
      });
    }
  }

  /// Wipe all local streak state (useful for testing / account logout).
  static Future<void> resetStreak() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyCompletedDate);
      await prefs.remove(_keyCachedStreak);
      await prefs.remove(_keyCachedLastDate);
      await prefs.remove(_keyWeeklyCompletedDates);
      await prefs.remove(_keyServerTodayDate);
      _cachedWeeklyTracker = [];
      streakNotifier.value++;
      debugPrint('[StreakService] Local streak cache cleared.');
    } catch (e) {
      debugPrint('[StreakService] Error clearing streak cache: $e');
    }
  }
}
