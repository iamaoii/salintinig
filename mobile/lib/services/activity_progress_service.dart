import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Lightweight local persistence for in-progress activity sessions.
///
/// When a student starts an activity, progress is saved locally so they can
/// resume later. On full completion the progress is cleared, reverting the
/// activity card from "Continue" back to "Play".
///
/// Follows the same SharedPreferences pattern as [QuizProgressService].
class ActivityProgressService {
  static const String _keyPrefix = 'activity_progress_';

  /// Global notifier so the Activities page can reactively rebuild when
  /// progress is saved or cleared.
  static final ValueNotifier<int> progressChangeNotifier = ValueNotifier<int>(0);

  static void _notifyChanged() {
    progressChangeNotifier.value++;
  }

  static String _getKey(String activityType, [String? language]) {
    final base = activityType.toLowerCase().trim();
    if (language != null && language.isNotEmpty) {
      final langKey = language.toLowerCase().startsWith('en') ? 'en' : 'fil';
      return '$_keyPrefix${base}_$langKey';
    }
    return '$_keyPrefix$base';
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  /// Persist current session state so the student can resume later.
  static Future<void> saveProgress({
    required String activityType,
    required int currentIndex,
    required int totalItems,
    required List<Map<String, dynamic>> words,
    int earnedXp = 0,
    String? sessionId,
    String? language,
    String? difficulty,
    Map<String, dynamic>? extraMetadata,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final Map<String, dynamic> data = {
        'activityType': activityType,
        'currentIndex': currentIndex,
        'totalItems': totalItems,
        'words': words,
        'earnedXp': earnedXp,
        'savedAt': DateTime.now().toIso8601String(),
      };
      if (sessionId != null) data['sessionId'] = sessionId;
      if (language != null) data['language'] = language;
      if (difficulty != null) data['difficulty'] = difficulty;
      if (extraMetadata != null) data.addAll(extraMetadata);

      // Save both to language-specific key and generic key
      if (language != null) {
        await prefs.setString(_getKey(activityType, language), jsonEncode(data));
      }
      await prefs.setString(_getKey(activityType), jsonEncode(data));
      _notifyChanged();
      debugPrint(
        '[ActivityProgressService] Saved $activityType (${language ?? "general"}) progress: '
        '${currentIndex + 1}/$totalItems (${earnedXp}xp)',
      );
    } catch (e) {
      debugPrint('[ActivityProgressService] Error saving progress: $e');
    }
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  /// Returns the saved session data, or `null` if no in-progress session exists.
  static Future<Map<String, dynamic>?> getProgress(String activityType, [String? language]) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (language != null && language.isNotEmpty) {
        final rawLang = prefs.getString(_getKey(activityType, language));
        if (rawLang != null && rawLang.isNotEmpty) {
          return jsonDecode(rawLang) as Map<String, dynamic>;
        }
      }
      final raw = prefs.getString(_getKey(activityType));
      if (raw != null && raw.isNotEmpty) {
        return jsonDecode(raw) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[ActivityProgressService] Error reading progress: $e');
    }
    return null;
  }

  // ── Check ─────────────────────────────────────────────────────────────────

  /// Quick boolean check — does an in-progress session exist?
  static Future<bool> hasActiveSession(String activityType, [String? language]) async {
    final data = await getProgress(activityType, language);
    return data != null;
  }

  // ── Clear ─────────────────────────────────────────────────────────────────

  /// Clear saved progress on session completion.
  static Future<void> clearProgress(String activityType, [String? language]) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (language != null && language.isNotEmpty) {
        await prefs.remove(_getKey(activityType, language));
      }
      await prefs.remove(_getKey(activityType));
      _notifyChanged();
      debugPrint(
        '[ActivityProgressService] Cleared $activityType (${language ?? "general"}) progress',
      );
    } catch (e) {
      debugPrint('[ActivityProgressService] Error clearing progress: $e');
    }
  }
}
