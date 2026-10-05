import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ParentPortalCacheService {
  static const Duration _ttl = Duration(minutes: 3);
  static const String _linkedChildKey = 'parent_linked_child';
  static const String _accessCodeKey = 'parent_access_code';
  static const String _cachedPayloadKey = 'parent_portal_parent_view_cache';
  static const String _cachedAtKey = 'parent_portal_parent_view_cached_at';

  static Map<String, dynamic>? _parentView;
  static DateTime? _cachedAt;
  static Future<Map<String, dynamic>?>? _inFlight;

  static Map<String, dynamic>? get cachedParentView => _parentView;

  static bool get hasFreshParentView =>
      _parentView != null &&
      _cachedAt != null &&
      DateTime.now().difference(_cachedAt!) < _ttl;

  static Future<void> loadDiskCache() async {
    if (_parentView != null) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_cachedPayloadKey);
      final cachedAtRaw = prefs.getString(_cachedAtKey);
      if (raw == null || raw.isEmpty) return;
      final decoded = jsonDecode(raw);
      if (decoded is Map) {
        _parentView = Map<String, dynamic>.from(decoded);
        _cachedAt = DateTime.tryParse(cachedAtRaw ?? '');
      }
    } catch (e) {
      debugPrint('[ParentPortalCache] disk cache read failed: $e');
    }
  }

  static Future<Map<String, dynamic>?> getParentView({
    bool forceRefresh = false,
    bool allowStale = true,
  }) async {
    await loadDiskCache();
    if (!forceRefresh && hasFreshParentView) return _parentView;
    if (!forceRefresh && allowStale && _parentView != null) {
      prefetchParentView(forceRefresh: true);
      return _parentView;
    }
    if (_inFlight != null) return _inFlight!;

    _inFlight = _fetchParentView();
    try {
      return await _inFlight;
    } finally {
      _inFlight = null;
    }
  }

  static void prefetchParentView({bool forceRefresh = false}) {
    if (_inFlight != null) return;
    Future.microtask(() => getParentView(forceRefresh: forceRefresh, allowStale: false));
  }

  static Future<Map<String, dynamic>?> _fetchParentView() async {
    final resolved = await _resolveChildAccess();
    final lrn = resolved['lrn'] ?? '';
    if (lrn.isEmpty) return _parentView;

    final params = StringBuffer('?lrn=${Uri.encodeQueryComponent(lrn)}');
    final accessCode = resolved['accessCode'] ?? '';
    if (accessCode.isNotEmpty) {
      params.write('&accessCode=${Uri.encodeQueryComponent(accessCode)}');
    }

    final response = await ApiService.get('/student/assessment/parent-view$params');
    if (response.success && response.data is Map<String, dynamic>) {
      _parentView = Map<String, dynamic>.from(response.data as Map<String, dynamic>);
      _cachedAt = DateTime.now();
      await _saveDiskCache(_parentView!, _cachedAt!);
      return _parentView;
    }
    return _parentView;
  }

  static Future<Map<String, String>> _resolveChildAccess() async {
    String lrn = '';
    String accessCode = '';

    try {
      final prefs = await SharedPreferences.getInstance();
      accessCode = prefs.getString(_accessCodeKey) ?? '';
      final rawChildStr = prefs.getString(_linkedChildKey);
      if (rawChildStr != null && rawChildStr.isNotEmpty) {
        final child = jsonDecode(rawChildStr);
        if (child is Map) {
          lrn = (child['lrn'] ?? child['studentLrn'] ?? '').toString().trim();
          if (accessCode.isEmpty) {
            accessCode = (child['accessCode'] ?? child['access_code'] ?? '').toString().trim();
          }
        }
      }
    } catch (_) {}

    if (lrn.isEmpty) {
      final raw = AuthService.currentUser?.rawUser;
      final child = raw?['linkedChild'] ?? raw?['student'] ?? raw;
      if (child is Map) {
        lrn = (child['lrn'] ?? child['studentLrn'] ?? '').toString().trim();
        if (accessCode.isEmpty) {
          accessCode = (child['accessCode'] ?? child['access_code'] ?? '').toString().trim();
        }
      }
    }

    return {'lrn': lrn, 'accessCode': accessCode};
  }

  static Future<void> _saveDiskCache(Map<String, dynamic> data, DateTime cachedAt) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_cachedPayloadKey, jsonEncode(data));
      await prefs.setString(_cachedAtKey, cachedAt.toIso8601String());
    } catch (e) {
      debugPrint('[ParentPortalCache] disk cache write failed: $e');
    }
  }

  static Future<void> invalidate() async {
    _parentView = null;
    _cachedAt = null;
    _inFlight = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_cachedPayloadKey);
      await prefs.remove(_cachedAtKey);
    } catch (_) {}
  }
}
