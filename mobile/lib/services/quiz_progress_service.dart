import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class QuizProgressService {
  static const String _keyPrefix = 'quiz_draft_';

  static String normalizeType(dynamic rawType) {
    final t = (rawType ?? 'oral').toString().toLowerCase().trim();
    if (t.contains('listen')) return 'listening';
    if (t.contains('silent')) return 'silent';
    return 'oral';
  }

  static String _getKey(dynamic passageId, [String assessmentType = 'oral']) {
    final type = normalizeType(assessmentType);
    final id = (passageId ?? 'default').toString();
    return '$_keyPrefix${type}_$id';
  }

  /// Extract passage ID reliably from any item map structure
  static dynamic extractPassageId(dynamic item) {
    if (item == null) return 'default';
    if (item is Map) {
      final passageObj = item['passage'] is Map ? item['passage'] : null;
      return item['passage_id'] ??
          item['passageId'] ??
          passageObj?['passage_id'] ??
          passageObj?['passageId'] ??
          passageObj?['id'] ??
          item['id'] ??
          item['title'] ??
          passageObj?['title'] ??
          'default';
    }
    return item.toString();
  }

  /// Global notifier to trigger real-time UI sync across screens when quiz drafts change
  static final ValueNotifier<int> draftChangeNotifier = ValueNotifier<int>(0);

  static void notifyDraftChanged() {
    draftChangeNotifier.value++;
  }

  /// Save quiz draft when student starts the quiz after reading the story
  static Future<void> saveQuizDraft(
    dynamic passageId, {
    String assessmentType = 'oral',
    required String? recordedAudioPath,
    required int readingTimeSeconds,
    required String? storyTitle,
    required String? assessmentLanguage,
    required List<dynamic>? dynamicQuestions,
    int? currentQuestionIndex,
    dynamic selectedAnswers,
  }) async {
    if (passageId == null) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = {
        'passageId': passageId,
        'assessmentType': assessmentType,
        'recordedAudioPath': recordedAudioPath,
        'readingTimeSeconds': readingTimeSeconds,
        'storyTitle': storyTitle,
        'assessmentLanguage': assessmentLanguage,
        'dynamicQuestions': dynamicQuestions,
        'currentQuestionIndex': currentQuestionIndex ?? 0,
        'selectedAnswers': selectedAnswers,
        'savedAt': DateTime.now().toIso8601String(),
      };
      await prefs.setString(_getKey(passageId, assessmentType), jsonEncode(data));
      notifyDraftChanged();
      debugPrint('[QuizProgressService] Saved quiz draft for type=$assessmentType, passageId=$passageId (qIndex=$currentQuestionIndex)');
    } catch (e) {
      debugPrint('[QuizProgressService] Error saving quiz draft: $e');
    }
  }

  /// Check if a quiz draft exists for a given passage ID and assessment type
  static Future<Map<String, dynamic>?> getQuizDraft(
    dynamic passageId, [
    String assessmentType = 'oral',
  ]) async {
    if (passageId == null) return null;
    try {
      final prefs = await SharedPreferences.getInstance();
      final str = prefs.getString(_getKey(passageId, assessmentType));
      if (str != null && str.isNotEmpty) {
        final Map<String, dynamic> decoded = jsonDecode(str);
        return decoded;
      }
    } catch (e) {
      debugPrint('[QuizProgressService] Error reading quiz draft: $e');
    }
    return null;
  }

  /// Check active in-progress quiz drafts for a list of assigned items
  static Future<Map<dynamic, bool>> checkActiveDrafts(List<Map<String, dynamic>> assignedList) async {
    final draftsMap = <dynamic, bool>{};
    try {
      final prefs = await SharedPreferences.getInstance();
      final allKeys = prefs.getKeys().where((k) => k.startsWith(_keyPrefix)).toList();
      
      for (final item in assignedList) {
        final pId = extractPassageId(item);
        final type = normalizeType(item['assessmentType'] ?? item['type']);
        final key = '${type}_$pId';
        
        bool hasDraft = await hasQuizDraft(pId, type);
        if (!hasDraft) {
          // Fallback check matching any saved key for this assessment type
          for (final prefsKey in allKeys) {
            if (prefsKey.startsWith('$_keyPrefix${type}_')) {
              final rawJson = prefs.getString(prefsKey);
              if (rawJson != null && rawJson.isNotEmpty) {
                try {
                  final decoded = jsonDecode(rawJson) as Map<String, dynamic>;
                  final draftPassageId = decoded['passageId'];
                  final draftTitle = decoded['storyTitle']?.toString().toLowerCase().trim();
                  final itemTitle = item['title']?.toString().toLowerCase().trim();
                  
                  if (draftPassageId?.toString() == pId.toString() ||
                      (draftTitle != null && itemTitle != null && draftTitle == itemTitle)) {
                    hasDraft = true;
                    break;
                  }
                } catch (_) {}
              }
            }
          }
        }
        draftsMap[key] = hasDraft;
      }
    } catch (e) {
      debugPrint('[QuizProgressService] Error checking active drafts: $e');
    }
    return draftsMap;
  }

  /// Returns true if a quiz draft exists for the given passage ID and assessment type
  static Future<bool> hasQuizDraft(
    dynamic passageId, [
    String assessmentType = 'oral',
  ]) async {
    if (passageId == null) return false;
    final draft = await getQuizDraft(passageId, assessmentType);
    return draft != null;
  }

  /// Clear quiz draft upon successful assessment submission
  static Future<void> clearQuizDraft(
    dynamic passageId, [
    String assessmentType = 'oral',
  ]) async {
    if (passageId == null) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_getKey(passageId, assessmentType));
      notifyDraftChanged();
      debugPrint('[QuizProgressService] Cleared quiz draft for type=$assessmentType, passageId=$passageId');
    } catch (e) {
      debugPrint('[QuizProgressService] Error clearing quiz draft: $e');
    }
  }

  /// Clear all saved quiz drafts from device storage (Reset for dev/testing)
  static Future<void> clearAllQuizDrafts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith(_keyPrefix)).toList();
      for (final key in keys) {
        await prefs.remove(key);
      }
      notifyDraftChanged();
      debugPrint('[QuizProgressService] Cleared all active quiz drafts (${keys.length} drafts removed)');
    } catch (e) {
      debugPrint('[QuizProgressService] Error clearing all quiz drafts: $e');
    }
  }
}
