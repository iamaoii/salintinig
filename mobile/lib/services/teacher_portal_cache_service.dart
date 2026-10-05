import 'package:salintinig/services/api_service.dart';

/// Shared, short-lived cache for teacher portal data used across overview and
/// Phil-IRI activity pages. It avoids refetching the same payload on each tap.
class TeacherPortalCacheService {
  static const Duration _ttl = Duration(minutes: 3);

  static List<Map<String, dynamic>>? _activities;
  static List<Map<String, dynamic>>? _pendingReviews;
  static DateTime? _cachedAt;
  static Future<void>? _inFlight;
  static final Map<String, List<Map<String, dynamic>>> _form3Attempts = {};
  static final Map<String, DateTime> _form3AttemptsCachedAt = {};
  static final Map<String, Future<List<Map<String, dynamic>>>> _form3AttemptsInFlight = {};

  static List<Map<String, dynamic>>? get cachedActivities => _activities;
  static List<Map<String, dynamic>>? get cachedPendingReviews => _pendingReviews;

  static bool get _isFresh =>
      _cachedAt != null && DateTime.now().difference(_cachedAt!) < _ttl;

  static Future<void> warm({bool forceRefresh = false}) async {
    if (!forceRefresh && _isFresh && _activities != null) return;
    if (_inFlight != null) return _inFlight!;

    _inFlight = _fetch();
    try {
      await _inFlight;
    } finally {
      _inFlight = null;
    }
  }

  static Future<void> _fetch() async {
    final responses = await Future.wait<ApiResponse>([
      ApiService.get('/teacher/assessments/phil-iri-activities'),
      ApiService.get('/teacher/assessments/pending-reviews'),
    ]);
    final activitiesResponse = responses[0];
    final reviewsResponse = responses[1];

    var receivedData = false;
    if (activitiesResponse.success && activitiesResponse.data?['activities'] is List) {
      _activities = (activitiesResponse.data['activities'] as List)
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      receivedData = true;
    }
    if (reviewsResponse.success && reviewsResponse.data?['pendingReviews'] is List) {
      _pendingReviews = (reviewsResponse.data['pendingReviews'] as List)
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      receivedData = true;
    }
    if (receivedData) _cachedAt = DateTime.now();
  }

  static void invalidate() {
    _activities = null;
    _pendingReviews = null;
    _cachedAt = null;
    _form3Attempts.clear();
    _form3AttemptsCachedAt.clear();
  }

  static Future<List<Map<String, dynamic>>> fetchForm3Attempts(
    String lrn,
    String language, {
    bool forceRefresh = false,
  }) {
    final key = '$lrn:${language.toLowerCase()}';
    final cachedAt = _form3AttemptsCachedAt[key];
    if (!forceRefresh && cachedAt != null && DateTime.now().difference(cachedAt) < _ttl) {
      return Future.value(_form3Attempts[key] ?? []);
    }
    if (_form3AttemptsInFlight.containsKey(key)) return _form3AttemptsInFlight[key]!;

    final request = _fetchForm3Attempts(lrn, language, key);
    _form3AttemptsInFlight[key] = request;
    return request.whenComplete(() => _form3AttemptsInFlight.remove(key));
  }

  static Future<List<Map<String, dynamic>>> _fetchForm3Attempts(String lrn, String language, String key) async {
    final response = await ApiService.get(
      '/teacher/phil-iri/form3-attempts/${Uri.encodeComponent(lrn)}?language=$language',
    );
    if (response.success && response.data?['attempts'] is List) {
      final attempts = (response.data['attempts'] as List)
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      _form3Attempts[key] = attempts;
      _form3AttemptsCachedAt[key] = DateTime.now();
      return attempts;
    }
    return _form3Attempts[key] ?? [];
  }
}
