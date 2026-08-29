import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/api_config.dart';

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

  static Future<ApiResponse> post(String endpoint, Map<String, dynamic> body) async {
    final clean = _cleanEndpoint(endpoint);
    final urlsToTry = [
      '${ApiConfig.baseUrl}$clean',
      'http://10.0.2.2:5000/api$clean',
      'http://192.168.1.146:5000/api$clean',
    ];

    String lastErr = '';
    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.post(
          url,
          headers: _headers,
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 8));
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to connect to server. ($lastErr)');
  }

  static Future<ApiResponse> get(String endpoint) async {
    final clean = _cleanEndpoint(endpoint);
    final urlsToTry = [
      '${ApiConfig.baseUrl}$clean',
      'http://10.0.2.2:5000/api$clean',
      'http://192.168.1.146:5000/api$clean',
    ];

    String lastErr = '';
    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.get(
          url,
          headers: _headers,
        ).timeout(const Duration(seconds: 8));
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to connect to server. ($lastErr)');
  }

  static Future<ApiResponse> put(String endpoint, Map<String, dynamic> body) async {
    final clean = _cleanEndpoint(endpoint);
    final urlsToTry = [
      '${ApiConfig.baseUrl}$clean',
      'http://10.0.2.2:5000/api$clean',
      'http://192.168.1.146:5000/api$clean',
    ];

    String lastErr = '';
    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.put(
          url,
          headers: _headers,
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 15));
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to connect to server. ($lastErr)');
  }

  static Future<ApiResponse> patch(String endpoint, Map<String, dynamic> body) async {
    final clean = _cleanEndpoint(endpoint);
    final urlsToTry = [
      '${ApiConfig.baseUrl}$clean',
      'http://10.0.2.2:5000/api$clean',
      'http://192.168.1.146:5000/api$clean',
    ];

    String lastErr = '';
    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.patch(
          url,
          headers: _headers,
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 10));
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to connect to server. ($lastErr)');
  }

  static Future<ApiResponse> delete(String endpoint) async {
    final clean = _cleanEndpoint(endpoint);
    final urlsToTry = [
      '${ApiConfig.baseUrl}$clean',
      'http://10.0.2.2:5000/api$clean',
      'http://192.168.1.146:5000/api$clean',
    ];

    String lastErr = '';
    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.delete(
          url,
          headers: _headers,
        ).timeout(const Duration(seconds: 10));
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to connect to server. ($lastErr)');
  }

  static Future<ApiResponse> uploadMultipartFile(
    String endpoint,
    String filePath,
    String fileFieldName, {
    Map<String, String>? fields,
  }) async {
    final cleanEndpoint = _cleanEndpoint(endpoint);
    final urlsToTry = [
      '${ApiConfig.baseUrl}$cleanEndpoint',
      'http://10.0.2.2:5000/api$cleanEndpoint',
      'http://192.168.1.146:5000/api$cleanEndpoint',
    ];
    String lastErr = '';

    for (final urlStr in urlsToTry) {
      try {
        final request = http.MultipartRequest('POST', Uri.parse(urlStr));
        if (_authToken != null && _authToken!.isNotEmpty) {
          request.headers['Authorization'] = 'Bearer $_authToken';
        }
        if (fields != null) {
          request.fields.addAll(fields);
        }
        if (filePath.isNotEmpty) {
          request.files.add(await http.MultipartFile.fromPath(fileFieldName, filePath));
        }
        final streamedResponse = await request.send().timeout(const Duration(seconds: 25));
        final response = await http.Response.fromStream(streamedResponse);
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to upload audio to server. ($lastErr)');
  }

  static Future<List<int>?> uploadAudioForDenoising(String filePath) async {
    final urlsToTry = [
      '${ApiConfig.baseUrl}/students/assessment/denoise-test-audio',
      'http://10.0.2.2:5000/api/students/assessment/denoise-test-audio',
      'http://192.168.1.146:5000/api/students/assessment/denoise-test-audio',
    ];

    for (final urlStr in urlsToTry) {
      try {
        final request = http.MultipartRequest('POST', Uri.parse(urlStr));
        if (_authToken != null && _authToken!.isNotEmpty) {
          request.headers['Authorization'] = 'Bearer $_authToken';
        }
        request.files.add(await http.MultipartFile.fromPath('audio', filePath));
        final streamedResponse = await request.send().timeout(const Duration(seconds: 8));
        if (streamedResponse.statusCode == 200) {
          final response = await http.Response.fromStream(streamedResponse);
          return response.bodyBytes;
        }
      } catch (e) {
        debugPrint('[ApiService] Denoise upload attempt notice: $e');
      }
    }
    return null;
  }
}
