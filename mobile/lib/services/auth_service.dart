import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/pages/common/home_page.dart';
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
    final first = rawUser!['firstName'] as String? ?? rawUser!['first_name'] as String? ?? '';
    final middle = rawUser!['middleName'] as String? ?? rawUser!['middle_name'] as String? ?? '';
    final last = rawUser!['lastName'] as String? ?? rawUser!['last_name'] as String? ?? '';
    if (first.isNotEmpty || last.isNotEmpty) {
      final parts = [first, if (middle.isNotEmpty) middle, last].where((s) => s.isNotEmpty).join(' ');
      if (parts.isNotEmpty) return parts;
    }
    final name = rawUser!['name'] as String?;
    if (name != null && name.isNotEmpty) return name;
    return email;
  }

  String get firstName {
    if (rawUser == null) return email.split('@').first;
    final first = rawUser!['firstName'] as String? ?? rawUser!['first_name'] as String?;
    if (first != null && first.isNotEmpty) return first;
    final name = rawUser!['name'] as String?;
    if (name != null && name.isNotEmpty) {
      final parts = name.trim().split(RegExp(r'\s+'));
      if (parts.length >= 3) {
        return parts.first;
      } else if (parts.length == 2) {
        return parts.first;
      }
      return name;
    }
    return email.split('@').first;
  }

  String get middleName {
    if (rawUser == null) return '';
    final mid = rawUser!['middleName'] as String? ?? rawUser!['middle_name'] as String?;
    if (mid != null && mid.isNotEmpty) return mid;
    final name = rawUser!['name'] as String?;
    if (name != null && name.isNotEmpty) {
      final parts = name.trim().split(RegExp(r'\s+'));
      if (parts.length >= 3) {
        return parts.sublist(1, parts.length - 1).join(' ');
      }
    }
    return '';
  }

  String get lastName {
    if (rawUser == null) return '';
    final last = rawUser!['lastName'] as String? ?? rawUser!['last_name'] as String?;
    if (last != null && last.isNotEmpty) return last;
    final name = rawUser!['name'] as String?;
    if (name != null && name.isNotEmpty) {
      final parts = name.trim().split(RegExp(r'\s+'));
      if (parts.length >= 2) {
        return parts.last;
      }
    }
    return '';
  }

  String get initials {
    final first = firstName;
    final last = lastName;
    if (first.isNotEmpty && last.isNotEmpty) {
      return '${first[0]}${last[0]}'.toUpperCase();
    }
    if (displayName.isNotEmpty) {
      final parts = displayName.trim().split(RegExp(r'\s+'));
      if (parts.length >= 2) {
        return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
      } else if (parts.isNotEmpty && parts[0].isNotEmpty) {
        return parts[0].substring(0, parts[0].length >= 2 ? 2 : 1).toUpperCase();
      }
    }
    return 'ST';
  }

  String get gradeLevel {
    if (rawUser == null) return '';
    final val = rawUser!['gradeLevel']?.toString() ?? rawUser!['grade']?.toString() ?? '';
    return val.replaceAll(RegExp(r'^Grade\s*', caseSensitive: false), '').trim();
  }

  String get sectionName {
    if (rawUser == null) return '';
    return rawUser!['sectionName'] as String? ?? rawUser!['section'] as String? ?? '';
  }

  String get schoolYear {
    if (rawUser == null) return '';
    final sy = rawUser!['schoolYear']?.toString() ?? rawUser!['school_year']?.toString() ?? rawUser!['activeSchoolYear']?.toString();
    if (sy != null && sy.isNotEmpty) {
      return sy.startsWith('S.Y.') ? sy : 'S.Y. $sy';
    }
    return '';
  }

  String get lrn {
    if (rawUser == null) return '';
    return rawUser!['lrn']?.toString() ?? rawUser!['id_no']?.toString() ?? '';
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

  Map<String, dynamic> toJson() => rawUser ?? {
    'user_id': userId,
    'email': email,
    'role': role,
    'status': status,
  };
}

class AuthService {
  static UserSession? _currentUser;

  static UserSession? get currentUser => _currentUser;

  /// Load persisted user session from SharedPreferences on app startup
  static Future<void> initSession() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJsonStr = prefs.getString('user_session');
      if (userJsonStr != null && userJsonStr.isNotEmpty) {
        final map = jsonDecode(userJsonStr) as Map<String, dynamic>;
        _currentUser = UserSession.fromJson(map);
      }
    } catch (_) {}
  }

  static Future<void> _saveSession(Map<String, dynamic> userData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_session', jsonEncode(userData));
    } catch (_) {}
  }

  /// Fetch currently authenticated user info from backend
  static Future<ApiResponse> fetchMe() async {
    final response = await ApiService.get('/auth/me');
    if (response.success && response.data != null) {
      if (response.data is Map<String, dynamic>) {
        final userData = response.data['user'] as Map<String, dynamic>? ?? response.data as Map<String, dynamic>;
        _currentUser = UserSession.fromJson(userData);
        await _saveSession(userData);
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
        await ApiService.setAuthToken(token);
      }
      if (userData != null) {
        _currentUser = UserSession.fromJson(userData);
        await _saveSession(userData);
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

  static List<Map<String, dynamic>>? _cachedClassStudents;

  static List<Map<String, dynamic>>? get cachedClassStudents => _cachedClassStudents;

  static Future<List<Map<String, dynamic>>> fetchClassStudents({bool forceRefresh = false}) async {
    if (!forceRefresh && _cachedClassStudents != null) {
      return _cachedClassStudents!;
    }
    try {
      final res = await ApiService.get('/teacher/class-students');
      if (res.success && res.data != null && res.data['students'] != null) {
        final List list = res.data['students'] as List;
        _cachedClassStudents = list.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        return _cachedClassStudents!;
      }
    } catch (e) {
      debugPrint('Error fetching class students: $e');
    }
    return _cachedClassStudents ?? [];
  }

  /// Clear all cached app data in memory
  static void clearAllCache() {
    _cachedClassStudents = null;
    PaintingBinding.instance.imageCache.clear();
    PaintingBinding.instance.imageCache.clearLiveImages();
  }

  /// Clear session
  static Future<void> logout() async {
    _currentUser = null;
    clearAllCache();
    await ApiService.setAuthToken(null);
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_session');
    } catch (_) {}
  }

  /// Show standard logout confirmation dialog and navigate to HomePage on logout
  static void showLogoutDialog(BuildContext context, {String portalName = 'teacher portal'}) {
    Feedback.forTap(context);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Log out', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          content: Text('Are you sure you want to log out of the $portalName?', style: GoogleFonts.inter()),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: Text('Cancel', style: GoogleFonts.inter(color: Colors.grey[600], fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () async {
                final nav = Navigator.of(dialogContext, rootNavigator: true);
                await logout();
                nav.pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const HomePage()),
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD34426),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              ),
              child: Text('Log out', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }
}
