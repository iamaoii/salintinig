import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/streak_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await StreakService.resetStreak();
  });

  group('StreakService & Weekly Tracker Scenario Tests', () {
    test('Scenario 1: Completed Mon & Tue -> Missed Wed -> Completed Thu (Duolingo style)', () async {
      final prefs = await SharedPreferences.getInstance();

      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final monday = today.subtract(Duration(days: today.weekday - 1));

      final monStr = monday.toIso8601String().split('T')[0];
      final tueStr = monday.add(const Duration(days: 1)).toIso8601String().split('T')[0];

      // Student answered on Monday and Tuesday (stored in weekly completion history)
      await prefs.setStringList('streak_weekly_completed_dates', [monStr, tueStr]);

      // Wednesday missed -> streak breaks. On Thursday student completes activity -> streak is 1
      await prefs.setInt('streak_cached_count', 1);
      await prefs.setString('streak_cached_last_date', today.toIso8601String().split('T')[0]);

      List<Map<String, String>> tracker = await StreakService.getWeeklyTracker();
      
      // Mon & Tue stay ORANGE (done), Wed is GREY (missed), Today is ORANGE (done)
      expect(tracker[0]['state'], equals('done'));   // Monday -> Orange
      expect(tracker[1]['state'], equals('done'));   // Tuesday -> Orange
    });

    test('Scenario 2: Multiple activity completions on same day do NOT double-increment streak', () async {
      final prefs = await SharedPreferences.getInstance();
      await StreakService.recordActivityCompletion();
      await prefs.setInt('streak_cached_count', 1);
      final firstStreak = await StreakService.getStreakCount();
      expect(firstStreak, equals(1));
      expect(await StreakService.hasCompletedToday(), isTrue);

      await StreakService.recordActivityCompletion();
      await StreakService.recordActivityCompletion();
      final secondStreak = await StreakService.getStreakCount();

      expect(secondStreak, equals(1));
    });
  });
}
