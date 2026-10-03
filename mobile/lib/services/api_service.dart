import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/main.dart';
import 'package:salintinig/pages/common/home_page.dart';
import 'package:salintinig/services/api_config.dart';
import 'package:salintinig/services/auth_service.dart';

class ApiResponse {
  final bool success;
  final dynamic data;
  final String? message;
  final String? error;
  final int statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.error,
    required this.statusCode,
  });

  factory ApiResponse.fromResponse(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      body = null;
    }

    final isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    final isUnauthorized = response.statusCode == 401 ||
        (body is Map<String, dynamic> &&
            (body['error']?.toString().toLowerCase().contains('invalid or expired token') == true ||
             body['message']?.toString().toLowerCase().contains('invalid or expired token') == true ||
             body['error']?.toString().toLowerCase().contains('unauthorized') == true));

    if (isUnauthorized && ApiService.hasAuthToken) {
      ApiService.handleUnauthorized();
    }
    
    if (body is Map<String, dynamic>) {
      return ApiResponse(
        success: body['success'] ?? isSuccess,
        data: body,
        message: body['message'] as String?,
        error: body['error'] as String? ?? (isSuccess ? null : 'Request failed with status ${response.statusCode}'),
        statusCode: response.statusCode,
      );
    }

    return ApiResponse(
      success: isSuccess,
      data: body,
      error: isSuccess ? null : 'Server Error (${response.statusCode})',
      statusCode: response.statusCode,
    );
  }

  factory ApiResponse.error(String errorMessage) {
    return ApiResponse(
      success: false,
      error: errorMessage,
      statusCode: 500,
    );
  }
}

class ApiService {
  static String? _authToken;
  static bool _isHandlingUnauthorized = false;

  static bool get hasAuthToken => _authToken != null && _authToken!.isNotEmpty;

  static void handleUnauthorized() {
    if (_isHandlingUnauthorized || !hasAuthToken) return;
    _isHandlingUnauthorized = true;
    debugPrint('[ApiService] 401 Unauthorized detected! Clearing expired token & session.');

    Future.microtask(() async {
      try {
        await AuthService.logout();
        final state = navigatorKey.currentState;
        if (state != null && state.mounted) {
          state.pushAndRemoveUntil(
            MaterialPageRoute(
              settings: const RouteSettings(name: '/'),
              builder: (_) => const HomePage(),
            ),
            (route) => false,
          );
        }
      } catch (e) {
        debugPrint('[ApiService] Error during 401 logout redirect: $e');
      } finally {
        Future.delayed(const Duration(seconds: 3), () {
          _isHandlingUnauthorized = false;
        });
      }
    });
  }

  static Future<void> initToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _authToken = prefs.getString('auth_token');
    } catch (_) {}
  }

  static Future<void> setAuthToken(String? token) async {
    _authToken = token;
    try {
      final prefs = await SharedPreferences.getInstance();
      if (token != null && token.isNotEmpty) {
        await prefs.setString('auth_token', token);
      } else {
        await prefs.remove('auth_token');
      }
    } catch (_) {}
  }

  static String? get authToken => _authToken;

  static Map<String, String> get _headers {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Platform': 'mobile',
    };
    if (_authToken != null && _authToken!.isNotEmpty) {
      map['Authorization'] = 'Bearer $_authToken';
    }
    return map;
  }

  static String _cleanEndpoint(String endpoint) {
    String clean = endpoint.trim();
    if (clean.startsWith('/api/')) {
      clean = clean.substring(4);
    } else if (clean.startsWith('api/')) {
      clean = clean.substring(3);
    }
    if (!clean.startsWith('/')) {
      clean = '/$clean';
    }
    return clean;
  }

  static String? _workingBaseUrl;

  static void recordWorkingBaseUrl(String urlStr) {
    try {
      final uri = Uri.parse(urlStr);
      final pathSegs = uri.pathSegments;
      if (pathSegs.isNotEmpty && pathSegs.first == 'api') {
        _workingBaseUrl = '${uri.origin}/api';
      } else {
        _workingBaseUrl = uri.origin;
      }
    } catch (_) {}
  }

  static List<String> _buildCandidateUrls(String endpoint) {
    final clean = _cleanEndpoint(endpoint);
    final candidates = ApiConfig.candidateBaseUrls;
    final list = <String>[];
    if (_workingBaseUrl != null && _workingBaseUrl!.isNotEmpty) {
      final b = _workingBaseUrl!.endsWith('/')
          ? _workingBaseUrl!.substring(0, _workingBaseUrl!.length - 1)
          : _workingBaseUrl!;
      list.add('$b$clean');
    }
    for (final base in candidates) {
      final b = base.endsWith('/') ? base.substring(0, base.length - 1) : base;
      final full = '$b$clean';
      if (!list.contains(full)) {
        list.add(full);
      }
    }
    return list;
  }

  static Future<ApiResponse> post(String endpoint, Map<String, dynamic> body) async {
    final urls = _buildCandidateUrls(endpoint);
    return _raceRequest((url) => http.post(
          Uri.parse(url),
          headers: _headers,
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 8)), urls);
  }

  static Future<ApiResponse> get(String endpoint) async {
    final urls = _buildCandidateUrls(endpoint);
    return _raceRequest((url) => http.get(
          Uri.parse(url),
          headers: _headers,
        ).timeout(const Duration(seconds: 8)), urls);
  }

  static Future<ApiResponse> put(String endpoint, Map<String, dynamic> body) async {
    final urls = _buildCandidateUrls(endpoint);
    return _raceRequest((url) => http.put(
          Uri.parse(url),
          headers: _headers,
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 15)), urls);
  }

  static Future<ApiResponse> patch(String endpoint, Map<String, dynamic> body) async {
    final urls = _buildCandidateUrls(endpoint);
    return _raceRequest((url) => http.patch(
          Uri.parse(url),
          headers: _headers,
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 10)), urls);
  }

  static Future<ApiResponse> delete(String endpoint) async {
    final urls = _buildCandidateUrls(endpoint);
    return _raceRequest((url) => http.delete(
          Uri.parse(url),
          headers: _headers,
        ).timeout(const Duration(seconds: 10)), urls);
  }

  /// Race all URLs in parallel — first successful HTTP response wins.
  /// Falls back to error only if ALL URLs fail.
  static Future<ApiResponse> _raceRequest(
    Future<http.Response> Function(String url) buildRequest,
    List<String> urls,
  ) async {
    final completer = Completer<ApiResponse>();
    int failures = 0;
    String lastErr = '';

    for (final urlStr in urls) {
      buildRequest(urlStr).then((response) {
        if (response.statusCode >= 200 && response.statusCode < 500) {
          recordWorkingBaseUrl(urlStr);
        }
        if (!completer.isCompleted) {
          completer.complete(ApiResponse.fromResponse(response));
        }
      }).catchError((e) {
        lastErr = e.toString();
        failures++;
        if (failures == urls.length && !completer.isCompleted) {
          completer.complete(
            ApiResponse.error('Network error: Unable to connect to server. ($lastErr)'),
          );
        }
      });
    }

    return completer.future;
  }

  static Future<ApiResponse> uploadMultipartFile(
    String endpoint,
    String filePath,
    String fileFieldName, {
    Map<String, String>? fields,
  }) async {
    final urlsToTry = _buildCandidateUrls(endpoint);
    final completer = Completer<ApiResponse>();
    int failures = 0;
    String lastErr = '';

    for (final urlStr in urlsToTry) {
      () async {
        try {
          final request = http.MultipartRequest('POST', Uri.parse(urlStr));
          if (_authToken != null && _authToken!.isNotEmpty) {
            request.headers['Authorization'] = 'Bearer $_authToken';
          }
          request.headers['X-Client-Platform'] = 'mobile';
          if (fields != null) {
            request.fields.addAll(fields);
          }
          if (filePath.isNotEmpty && File(filePath).existsSync()) {
            request.files.add(await http.MultipartFile.fromPath(fileFieldName, filePath));
          }
          final streamedResponse = await request.send().timeout(const Duration(seconds: 15));
          final response = await http.Response.fromStream(streamedResponse);
          if (response.statusCode >= 200 && response.statusCode < 500) {
            recordWorkingBaseUrl(urlStr);
          }
          if (!completer.isCompleted) {
            completer.complete(ApiResponse.fromResponse(response));
          }
        } catch (e) {
          lastErr = e.toString();
          failures++;
          if (failures == urlsToTry.length && !completer.isCompleted) {
            completer.complete(
              ApiResponse.error('Network error: Unable to upload audio to server. ($lastErr)'),
            );
          }
        }
      }();
    }

    return completer.future;
  }

  static Future<List<int>?> uploadAudioForDenoising(String filePath) async {
    final urlsToTry = _buildCandidateUrls('/students/assessment/denoise-test-audio');
    final completer = Completer<List<int>?>();
    int failures = 0;

    for (final urlStr in urlsToTry) {
      () async {
        try {
          final request = http.MultipartRequest('POST', Uri.parse(urlStr));
          if (_authToken != null && _authToken!.isNotEmpty) {
            request.headers['Authorization'] = 'Bearer $_authToken';
          }
          if (filePath.isNotEmpty && File(filePath).existsSync()) {
            request.files.add(await http.MultipartFile.fromPath('audio', filePath));
          }
          final streamedResponse = await request.send().timeout(const Duration(seconds: 5));
          if (streamedResponse.statusCode == 200) {
            recordWorkingBaseUrl(urlStr);
            final response = await http.Response.fromStream(streamedResponse);
            if (!completer.isCompleted) {
              completer.complete(response.bodyBytes);
            }
          } else {
            throw Exception('Status ${streamedResponse.statusCode}');
          }
        } catch (e) {
          failures++;
          if (failures == urlsToTry.length && !completer.isCompleted) {
            if (!completer.isCompleted) completer.complete(null);
          }
        }
      }();
    }

    return completer.future;
  }

  static Future<Uint8List?> getRawBytes(String endpoint) async {
    final urlsToTry = _buildCandidateUrls(endpoint);

    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.get(
          url,
          headers: _headers,
        ).timeout(const Duration(seconds: 12));

        if (response.statusCode >= 200 && response.statusCode < 300 && response.bodyBytes.isNotEmpty) {
          return response.bodyBytes;
        }
      } catch (e) {
        debugPrint('[ApiService] getRawBytes notice for $urlStr: $e');
      }
    }
    return null;
  }
}

