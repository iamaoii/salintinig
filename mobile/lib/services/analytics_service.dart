import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/api_service.dart';

class AnalyticsData {
  final int totalXp;
  final int currentStreak;
  final int completedStoriesCount;
  final int totalBadgesCount;
  final int totalTimeSpentMins;
  final int totalSessionsCompleted;
  final int overallAccuracy;
  final List<Map<String, dynamic>> weeklyActivity;
  final Map<String, dynamic> skills;
  final String smartTip;
  final Map<String, dynamic>? rawJson;

  AnalyticsData({
    required this.totalXp,
    required this.currentStreak,
    required this.completedStoriesCount,
    required this.totalBadgesCount,
    required this.totalTimeSpentMins,
    required this.totalSessionsCompleted,
    required this.overallAccuracy,
    required this.weeklyActivity,
    required this.skills,
    required this.smartTip,
    this.rawJson,
  });

  factory AnalyticsData.fromJson(Map<String, dynamic> json) {
    final weekly = (json['weeklyActivity'] as List?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList() ??
        [];
    final skillsMap = json['skills'] is Map
        ? Map<String, dynamic>.from(json['skills'] as Map)
        : <String, dynamic>{};

    return AnalyticsData(
      totalXp: (json['totalXp'] as num?)?.toInt() ?? 0,
      currentStreak: (json['currentStreak'] as num?)?.toInt() ?? 0,
      completedStoriesCount: (json['completedStoriesCount'] as num?)?.toInt() ?? 0,
      totalBadgesCount: (json['totalBadgesCount'] as num?)?.toInt() ?? 0,
      totalTimeSpentMins: (json['totalTimeSpentMins'] as num?)?.toInt() ?? 0,
      totalSessionsCompleted: (json['totalSessionsCompleted'] as num?)?.toInt() ?? 0,
      overallAccuracy: (json['overallAccuracy'] as num?)?.toInt() ?? 0,
      weeklyActivity: weekly,
      skills: skillsMap,
      smartTip: json['smartTip']?.toString() ??
          "Keep practicing daily exercises to boost your literacy skills!",
      rawJson: json,
    );
  }

  Map<String, dynamic> toJson() => rawJson ?? {
    'totalXp': totalXp,
    'currentStreak': currentStreak,
    'completedStoriesCount': completedStoriesCount,
    'totalBadgesCount': totalBadgesCount,
    'totalTimeSpentMins': totalTimeSpentMins,
    'totalSessionsCompleted': totalSessionsCompleted,
    'overallAccuracy': overallAccuracy,
    'weeklyActivity': weeklyActivity,
    'skills': skills,
    'smartTip': smartTip,
  };
}

class AnalyticsService {
  static const String _keyCachedAnalytics = 'cached_student_analytics';
  static AnalyticsData? _cachedAnalytics;

  static AnalyticsData? get cachedAnalytics {
    if (_cachedAnalytics == null) {
      _loadFromDisk();
    }
    return _cachedAnalytics;
  }

  static final ValueNotifier<AnalyticsData?> analyticsNotifier =
      ValueNotifier<AnalyticsData?>(null);

  static void _loadFromDisk() {
    try {
      SharedPreferences.getInstance().then((prefs) {
        final jsonStr = prefs.getString(_keyCachedAnalytics);
        if (jsonStr != null && jsonStr.isNotEmpty) {
          final map = jsonDecode(jsonStr) as Map<String, dynamic>;
          _cachedAnalytics = AnalyticsData.fromJson(map);
          analyticsNotifier.value = _cachedAnalytics;
        }
      });
    } catch (e) {
      debugPrint('[AnalyticsService] Error loading disk cache: $e');
    }
  }

  static Future<AnalyticsData?> fetchAnalytics({bool forceRefresh = false}) async {
    if (_cachedAnalytics == null) {
      _loadFromDisk();
    }
    if (_cachedAnalytics != null && !forceRefresh) {
      _loadFromBackend();
      return _cachedAnalytics;
    }
    return await _loadFromBackend();
  }

  static Future<AnalyticsData?> _loadFromBackend() async {
    try {
      final res = await ApiService.get('/student/analytics');
      if (res.success && res.data != null && res.data['data'] != null) {
        final rawMap = res.data['data'] as Map<String, dynamic>;
        final data = AnalyticsData.fromJson(rawMap);
        _cachedAnalytics = data;
        analyticsNotifier.value = data;

        // Persist to disk asynchronously
        SharedPreferences.getInstance().then((prefs) {
          prefs.setString(_keyCachedAnalytics, jsonEncode(rawMap));
        });

        return data;
      }
    } catch (e) {
      debugPrint('[AnalyticsService] Error loading analytics: $e');
    }
    return _cachedAnalytics;
  }

  static void clearMemoryAndDiskCache() {
    _cachedAnalytics = null;
    analyticsNotifier.value = null;
    SharedPreferences.getInstance().then((prefs) {
      prefs.remove(_keyCachedAnalytics);
    });
  }
}

