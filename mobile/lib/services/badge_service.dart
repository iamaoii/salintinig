import 'package:flutter/foundation.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/models/quest_item.dart';

/// Service managing student badge fetching, caching, and progress evaluation.
class BadgeService {
  static final ValueNotifier<int> badgeNotifier = ValueNotifier<int>(0);

  static List<QuestItem> _cachedBadges = [];

  static List<QuestItem> get cachedBadges => List.unmodifiable(_cachedBadges);

  /// Fetch all 10 student badges with dynamic progress and unlock state from backend.
  static Future<List<QuestItem>> fetchBadges() async {
    try {
      final response = await ApiService.get('/student/badges');
      if (response.success && response.data != null) {
        final List<dynamic> list = response.data['data'] as List<dynamic>? ?? [];
        final parsed = list.map((json) => QuestItem.fromJson(json as Map<String, dynamic>)).toList();
        _cachedBadges = parsed;
        badgeNotifier.value++;
        return parsed;
      }
    } catch (e) {
      debugPrint('[BadgeService] Error fetching badges: $e');
    }
    return _cachedBadges.isNotEmpty ? _cachedBadges : BadgesData.allQuests;
  }
}
