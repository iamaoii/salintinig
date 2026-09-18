import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/streak_service.dart';

/// Singleton service for fetching library books and reading progress.
class LibraryService {
  LibraryService._();

  static const String _keyCachedBooks = 'cached_library_books';
  static const String _keyCachedProgress = 'cached_library_progress';

  // In-memory cache
  static List<Map<String, dynamic>>? _cachedBooks;
  static List<Map<String, dynamic>>? _cachedProgress;
  static DateTime? _booksCachedAt;
  static DateTime? _progressCachedAt;

  static const _cacheTtl = Duration(minutes: 5);

  static List<Map<String, dynamic>>? get cachedBooks {
    if (_cachedBooks == null) {
      _loadBooksFromDisk();
    }
    return _cachedBooks;
  }

  static List<Map<String, dynamic>>? get cachedProgress {
    if (_cachedProgress == null) {
      _loadProgressFromDisk();
    }
    return _cachedProgress;
  }

  static void _loadBooksFromDisk() {
    try {
      SharedPreferences.getInstance().then((prefs) {
        final jsonStr = prefs.getString(_keyCachedBooks);
        if (jsonStr != null && jsonStr.isNotEmpty) {
          final List list = jsonDecode(jsonStr) as List;
          _cachedBooks = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _booksCachedAt = DateTime.now();
        }
      });
    } catch (e) {
      debugPrint('[LibraryService] Error loading books from disk: $e');
    }
  }

  static void _loadProgressFromDisk() {
    try {
      SharedPreferences.getInstance().then((prefs) {
        final jsonStr = prefs.getString(_keyCachedProgress);
        if (jsonStr != null && jsonStr.isNotEmpty) {
          final List list = jsonDecode(jsonStr) as List;
          _cachedProgress = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _progressCachedAt = DateTime.now();
          progressNotifier.value = List.unmodifiable(_cachedProgress!);
        }
      });
    } catch (e) {
      debugPrint('[LibraryService] Error loading progress from disk: $e');
    }
  }

  // ── Books ────────────────────────────────────────────────────────────────

  /// Fetch all active reading materials from the backend.
  /// Returns empty list when offline or DB is unavailable.
  static Future<List<Map<String, dynamic>>> fetchBooks({
    String? language,
    String? category,
    String? grade,
    bool forceRefresh = false,
  }) async {
    if (_cachedBooks == null) {
      _loadBooksFromDisk();
    }

    // Return cache if still fresh and no filters are applied
    if (!forceRefresh &&
        _cachedBooks != null &&
        _booksCachedAt != null &&
        DateTime.now().difference(_booksCachedAt!) < _cacheTtl &&
        language == null &&
        category == null &&
        grade == null) {
      return _cachedBooks!;
    }

    try {
      final queryParams = <String>[];
      if (language != null && language.isNotEmpty) {
        queryParams.add('language=${Uri.encodeQueryComponent(language)}');
      }
      if (category != null && category.isNotEmpty) {
        queryParams.add('category=${Uri.encodeQueryComponent(category)}');
      }
      if (grade != null && grade.isNotEmpty) {
        queryParams.add('grade=${Uri.encodeQueryComponent(grade)}');
      }
      final endpoint = '/student/library/books${queryParams.isNotEmpty ? '?${queryParams.join('&')}' : ''}';

      final res = await ApiService.get(endpoint);
      if (res.success && res.data != null) {
        final raw = res.data['books'];
        if (raw is List) {
          final books = raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          if (language == null && category == null && grade == null) {
            _cachedBooks = books;
            _booksCachedAt = DateTime.now();
            SharedPreferences.getInstance().then((prefs) {
              prefs.setString(_keyCachedBooks, jsonEncode(books));
            });
          }
          return books;
        }
      }
    } catch (_) {}

    return _cachedBooks ?? [];
  }


  // ── Reading Progress ─────────────────────────────────────────────────────

  /// Fetch the authenticated student's story progress (in-progress & completed).
  /// Returns an empty list when user is not logged in or DB is unavailable.
  static Future<List<Map<String, dynamic>>> fetchReadingProgress({
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh &&
        _cachedProgress != null &&
        _progressCachedAt != null &&
        DateTime.now().difference(_progressCachedAt!) < _cacheTtl) {
      return _cachedProgress!;
    }

    // Skip if user is not authenticated
    if (AuthService.currentUser == null) {
      return [];
    }

    try {
      final res = await ApiService.get('/student/library/progress');
      if (res.success && res.data != null) {
        final raw = res.data['progress'];
        if (raw is List) {
          final serverProgress = raw.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          
          // Server is authoritative for progress
          final Map<String, Map<String, dynamic>> progressMap = {};
          for (final sp in serverProgress) {
            final uuid = (sp['id'] ?? sp['material_id'] ?? '').toString().trim();
            final key = uuid.isNotEmpty ? uuid : (sp['title'] ?? '').toString().toLowerCase();
            if (key.isNotEmpty) {
              progressMap[key] = sp;
            }
          }
          
          final mergedProgress = progressMap.values.toList();
          _sortByRecency(mergedProgress);
          _cachedProgress = mergedProgress;
          _progressCachedAt = DateTime.now();
          progressNotifier.value = List.unmodifiable(_cachedProgress!);
          SharedPreferences.getInstance().then((prefs) {
            prefs.setString(_keyCachedProgress, jsonEncode(mergedProgress));
          });
          return mergedProgress;
        }
      }
    } catch (_) {}

    return _cachedProgress ?? [];
  }

  /// Observable ValueNotifier for real-time reactive UI updates
  static final ValueNotifier<List<Map<String, dynamic>>> progressNotifier =
      ValueNotifier<List<Map<String, dynamic>>>([]);

  /// Record or update story reading progress on backend.
  static Future<bool> recordStoryProgress({
    String? materialId,
    required String bookTitle,
    double progress = 0.05,
    int lastPageRead = 1,
  }) async {
    StreakService.recordActivityCompletion();
    _cachedProgress ??= [];

    // Find full story metadata from _cachedBooks if available
    Map<String, dynamic>? storyMetadata;
    if (_cachedBooks != null && _cachedBooks!.isNotEmpty) {
      for (final b in _cachedBooks!) {
        final bId = (b['id'] ?? b['material_id'])?.toString();
        final bTitle = (b['title'] as String?)?.toLowerCase();
        if ((materialId != null && bId == materialId) ||
            (bTitle != null && bTitle == bookTitle.toLowerCase())) {
          storyMetadata = b;
          break;
        }
      }
    }

    bool found = false;
    for (int i = 0; i < _cachedProgress!.length; i++) {
      final item = _cachedProgress![i];
      final itemTitle = (item['title'] as String?)?.toLowerCase();
      final itemId = (item['id'] ?? item['material_id'] ?? item['materialId'])?.toString();
      final idMatch = materialId != null && itemId != null && itemId == materialId;
      final titleMatch = !idMatch && itemTitle != null && itemTitle == bookTitle.toLowerCase();
      if (idMatch || titleMatch) {
        // Update in place
        _cachedProgress![i] = {
          ...item,
          ...?storyMetadata,
          'progress': progress,
          'lastPageRead': lastPageRead,
          'status': 'in_progress',
          'updated_at': DateTime.now().toIso8601String(),
        };
        // Move to front so it's the most recent
        final updated = _cachedProgress!.removeAt(i);
        _cachedProgress!.insert(0, updated);
        found = true;
        break;
      }
    }

    if (!found) {
      final Map<String, dynamic> newEntry = {
        ...?storyMetadata,
        'material_id': materialId ?? storyMetadata?['id'] ?? storyMetadata?['material_id'],
        'id': materialId ?? storyMetadata?['id'] ?? storyMetadata?['material_id'],
        'title': bookTitle,
        'progress': progress,
        'lastPageRead': lastPageRead,
        'status': 'in_progress',
        'updated_at': DateTime.now().toIso8601String(),
      };
      _cachedProgress!.insert(0, newEntry);
    }

    // Immediately notify all listeners in real-time on the next microtask (prevents setState during build error)
    final unmodifiableList = List<Map<String, dynamic>>.unmodifiable(_cachedProgress!);
    Future.microtask(() {
      progressNotifier.value = unmodifiableList;
    });

    try {
      final Map<String, dynamic> body = {
        'bookTitle': bookTitle,
        'progress': progress,
        'lastPageRead': lastPageRead,
      };
      if (materialId != null) {
        body['materialId'] = materialId;
      }
      final res = await ApiService.post('/student/library/progress/start', body);
      return res.success;
    } catch (_) {
      return false;
    }
  }

  // ── Cache Management ─────────────────────────────────────────────────────

  /// Invalidate all cached data (call after completing/saving a story).
  /// Does NOT clear the notifier — the current value stays visible until
  /// the next fetch replaces it so there's no empty flash on the UI.
  static void invalidateAll() {
    _cachedBooks = null;
    _cachedProgress = null;
    _booksCachedAt = null;
    _progressCachedAt = null;
  }

  /// Returns the current in-memory progress snapshot synchronously (null if not yet loaded).
  /// Use this for instant UI updates without waiting for any async operation.
  static List<Map<String, dynamic>>? get cachedProgressSnapshot => _cachedProgress;

  // ── Helpers ──────────────────────────────────────────────────────────────

  /// Sorts a progress list by updated_at date (most recent first).
  static void _sortByRecency(List<Map<String, dynamic>> list) {
    list.sort((a, b) {
      final aStr = (a['updatedAt'] ?? a['updated_at'] ?? '').toString();
      final bStr = (b['updatedAt'] ?? b['updated_at'] ?? '').toString();
      final aDate = DateTime.tryParse(aStr) ?? DateTime.fromMillisecondsSinceEpoch(0);
      final bDate = DateTime.tryParse(bStr) ?? DateTime.fromMillisecondsSinceEpoch(0);
      return bDate.compareTo(aDate);
    });
  }

  /// Returns only in-progress books (status != 'completed' and progress < 0.99),
  /// sorted most-recently-updated first so the library card always shows the latest.
  static List<Map<String, dynamic>> filterInProgress(
    List<Map<String, dynamic>> progress,
  ) {
    final filtered = progress.where((p) {
      final status = (p['status'] as String?)?.toLowerCase();
      return status != 'completed';
    }).toList();
    _sortByRecency(filtered);
    return filtered;
  }

  /// Converts a raw language code ('en'/'fil') to a display label.
  static String languageLabel(String? rawLang) {
    if (rawLang == null) return 'English';
    switch (rawLang.toLowerCase()) {
      case 'fil':
      case 'filipino':
      case 'tagalog':
        return 'Filipino';
      default:
        return 'English';
    }
  }

  /// Safely parse dynamic value (num, String, or null) to double.
  static double parseDouble(dynamic val, [double fallback = 0.0]) {
    if (val == null) return fallback;
    if (val is num) return val.toDouble();
    if (val is String) return double.tryParse(val) ?? fallback;
    return fallback;
  }

  /// Safely parse dynamic value (num, String, or null) to int.
  static int parseInt(dynamic val, [int fallback = 0]) {
    if (val == null) return fallback;
    if (val is num) return val.toInt();
    if (val is String) return int.tryParse(val) ?? fallback;
    return fallback;
  }

  /// Extracts a `List<String>` of tag labels from a raw tag field (List or null).
  static List<String> parseTags(dynamic rawTags) {
    if (rawTags == null) return [];
    if (rawTags is List) return rawTags.map((e) => e.toString()).toList();
    return [];
  }

  static void clearMemoryAndDiskCache() {
    _cachedBooks = null;
    _cachedProgress = null;
    _booksCachedAt = null;
    _progressCachedAt = null;
    progressNotifier.value = [];
    SharedPreferences.getInstance().then((prefs) {
      prefs.remove(_keyCachedBooks);
      prefs.remove(_keyCachedProgress);
    });
  }
}
