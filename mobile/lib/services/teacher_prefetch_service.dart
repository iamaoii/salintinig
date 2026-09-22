import 'package:flutter/foundation.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/notification_service.dart';

/// Background prefetch service for Teacher Portal to ensure 0-delay page loads.
class TeacherPrefetchService {
  static bool _isPrefetching = false;

  /// Trigger a non-blocking background prefetch of all teacher data.
  static void prefetchAll() {
    if (_isPrefetching) return;
    _isPrefetching = true;

    Future.microtask(() async {
      try {
        if (AuthService.currentUser == null ||
            AuthService.currentUser!.role.toLowerCase() != 'teacher') {
          _isPrefetching = false;
          return;
        }

        debugPrint('[TeacherPrefetchService] Starting background prefetch for Teacher Portal...');

        await Future.wait([
          AuthService.fetchMe(),
          AuthService.fetchClassStudents(forceRefresh: true),
          ApiService.get('/teacher/assessments/phil-iri-activities'),
          NotificationService().fetchNotifications(),
        ]);

        debugPrint('[TeacherPrefetchService] Teacher Portal prefetch complete!');
      } catch (e) {
        debugPrint('[TeacherPrefetchService] Error during teacher prefetch: $e');
      } finally {
        _isPrefetching = false;
      }
    });
  }
}
