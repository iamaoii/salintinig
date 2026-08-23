import 'dart:convert';
import 'package:http/http.dart' as http;
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

  static void setAuthToken(String? token) {
    _authToken = token;
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

  static Future<ApiResponse> post(String endpoint, Map<String, dynamic> body) async {
    final urlsToTry = [
      '${ApiConfig.baseUrl}$endpoint',
      'http://10.0.2.2:5000/api$endpoint',
      'http://192.168.1.146:5000/api$endpoint',
    ];

    String lastErr = '';
    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.post(
          url,
          headers: _headers,
          body: jsonEncode(body),
        ).timeout(const Duration(seconds: 4));
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to connect to server. ($lastErr)');
  }

  static Future<ApiResponse> get(String endpoint) async {
    final urlsToTry = [
      '${ApiConfig.baseUrl}$endpoint',
      'http://10.0.2.2:5000/api$endpoint',
      'http://192.168.1.146:5000/api$endpoint',
    ];

    String lastErr = '';
    for (final urlStr in urlsToTry) {
      try {
        final url = Uri.parse(urlStr);
        final response = await http.get(
          url,
          headers: _headers,
        ).timeout(const Duration(seconds: 4));
        return ApiResponse.fromResponse(response);
      } catch (e) {
        lastErr = e.toString();
      }
    }
    return ApiResponse.error('Network error: Unable to connect to server. ($lastErr)');
  }

  static Future<ApiResponse> put(String endpoint, Map<String, dynamic> body) async {
    final urlsToTry = [
      '${ApiConfig.baseUrl}$endpoint',
      'http://10.0.2.2:5000/api$endpoint',
      'http://192.168.1.146:5000/api$endpoint',
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

  static Future<ApiResponse> delete(String endpoint) async {
    final urlsToTry = [
      '${ApiConfig.baseUrl}$endpoint',
      'http://10.0.2.2:5000/api$endpoint',
      'http://192.168.1.146:5000/api$endpoint',
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
}
