import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/models/quest_item.dart';

/// Service managing student badge fetching, caching, and progress evaluation.
class BadgeService {
  static final ValueNotifier<int> badgeNotifier = ValueNotifier<int>(0);
  static const String _keyCachedBadges = 'cached_student_badges';

  static List<QuestItem> _cachedBadges = [];

  static List<QuestItem> get cachedBadges {
    if (_cachedBadges.isEmpty) {
      _loadFromDisk();
    }
    return List.unmodifiable(_cachedBadges);
  }

  /// Synchronously or async load cached badges from disk
  static void _loadFromDisk() {
    try {
      SharedPreferences.getInstance().then((prefs) {
        final jsonStr = prefs.getString(_keyCachedBadges);
        if (jsonStr != null && jsonStr.isNotEmpty) {
          final List list = jsonDecode(jsonStr) as List;
          _cachedBadges = list.map((json) => QuestItem.fromJson(json as Map<String, dynamic>)).toList();
          badgeNotifier.value++;
        }
      });
    } catch (e) {
      debugPrint('[BadgeService] Error reading disk cache: $e');
    }
  }

  /// Fetch all 10 student badges with dynamic progress and unlock state from backend.
  static Future<List<QuestItem>> fetchBadges() async {
    // Try loading disk cache if in-memory cache is empty
    if (_cachedBadges.isEmpty) {
      _loadFromDisk();
    }

    try {
      final response = await ApiService.get('/student/badges');
      if (response.success && response.data != null) {
        final List<dynamic> list = response.data['data'] as List<dynamic>? ?? [];
        final parsed = list.map((json) => QuestItem.fromJson(json as Map<String, dynamic>)).toList();
        _cachedBadges = parsed;
        badgeNotifier.value++;

        // Persist to disk asynchronously
        SharedPreferences.getInstance().then((prefs) {
          prefs.setString(_keyCachedBadges, jsonEncode(list));
        });

        return parsed;
      }
    } catch (e) {
      debugPrint('[BadgeService] Error fetching badges: $e');
    }
    return _cachedBadges.isNotEmpty ? _cachedBadges : BadgesData.allQuests;
  }
}

