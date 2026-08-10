import 'package:salintinig/services/api_service.dart';

class UserSession {
  final String userId;
  final String email;
  final String role;
  final String status;
  final Map<String, dynamic>? rawUser;

  UserSession({
    required this.userId,
    required this.email,
    required this.role,
    required this.status,
    this.rawUser,
  });

  String get displayName {
    if (rawUser == null) return email;
    final first = rawUser!['first_name'] as String? ?? '';
    final last = rawUser!['last_name'] as String? ?? '';
    final fullName = '$first $last'.trim();
    return fullName.isNotEmpty ? fullName : email;
  }

  String get firstName {
    if (rawUser == null) return email.split('@').first;
    return rawUser!['first_name'] as String? ?? email.split('@').first;
  }

  String get lastName {
    if (rawUser == null) return '';
    return rawUser!['last_name'] as String? ?? '';
  }

  bool get mustChangePassword {
    if (rawUser == null) return false;
    return rawUser!['must_change_password'] == true || rawUser!['mustChangePassword'] == true;
  }

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      userId: json['user_id']?.toString() ?? json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
      status: json['status'] ?? 'Active',
      rawUser: json,
    );
  }
}

class AuthService {
  static UserSession? _currentUser;

  static UserSession? get currentUser => _currentUser;

  /// Fetch currently authenticated user info from backend
  static Future<ApiResponse> fetchMe() async {
    final response = await ApiService.get('/auth/me');
    if (response.success && response.data != null) {
      if (response.data is Map<String, dynamic>) {
        final userData = response.data['user'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>;
        _currentUser = UserSession.fromJson(userData);
      }
    }
    return response;
  }

  /// Log in student or teacher with identifier, password, and expected role
  static Future<ApiResponse> login(String identifier, String password, {String? expectedRole}) async {
    final response = await ApiService.post('/auth/login', {
      'identifier': identifier,
      'loginIdentifier': identifier,
      'email': identifier,
      'password': password,
      'isMobile': true,
      'clientPlatform': 'mobile',
      if (expectedRole != null && expectedRole.isNotEmpty) 'expectedRole': expectedRole,
    });

    if (response.success && response.data != null) {
      Map<String, dynamic>? dataMap;
      if (response.data is Map<String, dynamic>) {
        dataMap = response.data as Map<String, dynamic>;
      }

      final token = dataMap?['token'] as String?;
      final userData = dataMap?['user'] as Map<String, dynamic>? ?? dataMap;

      if (token != null) {
        ApiService.setAuthToken(token);
      }
      if (userData != null) {
        _currentUser = UserSession.fromJson(userData);
      }
    }

    return response;
  }

  /// Request account creation (Contact Admin)
  static Future<ApiResponse> contactAdmin({
    required String role,
    required String firstName,
    String? middleName,
    required String lastName,
    required String email,
    required String sex,
    String? idNo,
    String? schoolId,
    String? gradeLevel,
    String? section,
  }) async {
    return await ApiService.post('/auth/contact-admin', {
      'role': role,
      'firstName': firstName,
      'middleName': middleName ?? '',
      'lastName': lastName,
      'email': email,
      'sex': sex,
      'idNo': idNo ?? '',
      'schoolId': schoolId ?? '',
      'gradeLevel': gradeLevel ?? '',
      'section': section ?? '',
    });
  }

  /// Send forgot password reset email code
  static Future<ApiResponse> forgotPassword(String email) async {
    return await ApiService.post('/auth/forgot-password', {
      'email': email,
    });
  }

  /// Verify 6-digit reset code
  static Future<ApiResponse> verifyResetCode(String email, String resetCode) async {
    return await ApiService.post('/auth/verify-reset-code', {
      'email': email,
      'resetCode': resetCode,
    });
  }

  /// Reset password with new password
  static Future<ApiResponse> resetPassword(String email, String resetCode, String newPassword) async {
    return await ApiService.post('/auth/reset-password', {
      'email': email,
      'resetCode': resetCode,
      'newPassword': newPassword,
    });
  }

  /// Clear session
  static void logout() {
    _currentUser = null;
    ApiService.setAuthToken(null);
  }
}
