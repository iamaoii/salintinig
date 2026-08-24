import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'teacher_edit_profile_page.dart';
import 'teacher_overview_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class TeacherProfilePage extends StatefulWidget {
  const TeacherProfilePage({super.key});

  @override
  State<TeacherProfilePage> createState() => _TeacherProfilePageState();
}

class _TeacherProfilePageState extends State<TeacherProfilePage> {
  String? _customTeacherName;
  String? _customEmailAddress;
  String? _customEmployeeId;
  String? _customTitle;
  String? _customSchool;
  String? _customAssignedClass;

  @override
  void initState() {
    super.initState();
    _refreshProfile();
  }

  Future<void> _refreshProfile() async {
    final res = await AuthService.fetchMe();
    if (res.success && mounted) {
      setState(() {});
    }
  }

  UserSession? get _user => AuthService.currentUser;
  Map<String, dynamic>? get _raw => _user?.rawUser;

  String get _teacherName {
    if (_customTeacherName != null && _customTeacherName!.isNotEmpty) {
      return _customTeacherName!;
    }
    final name = _user?.displayName;
    if (name != null && name.isNotEmpty) {
      return name;
    }
    return 'Teacher';
  }

  String get _emailAddress {
    if (_customEmailAddress != null && _customEmailAddress!.isNotEmpty) {
      return _customEmailAddress!;
    }
    final email = _user?.email;
    if (email != null && email.isNotEmpty) {
      return email;
    }
    return 'N/A';
  }

  String get _employeeId {
    if (_customEmployeeId != null && _customEmployeeId!.isNotEmpty) {
      return _customEmployeeId!;
    }
    final empNo = _raw?['teacher_no'] ??
        _raw?['teacherNo'] ??
        _raw?['id_no'] ??
        _raw?['employeeId'] ??
        _raw?['user_id'];
    if (empNo != null && empNo.toString().isNotEmpty) {
      return empNo.toString();
    }
    return 'N/A';
  }

  String get _teacherTitle {
    if (_customTitle != null && _customTitle!.isNotEmpty) {
      return _customTitle!;
    }
    final pos = _raw?['title'] ?? _raw?['position'] ?? _raw?['designation'];
    if (pos != null && pos.toString().isNotEmpty) {
      return pos.toString();
    }
    final grade = _user?.gradeLevel;
    if (grade != null && grade.isNotEmpty) {
      return 'Grade $grade Teacher';
    }
    return 'Grade IV Teacher';
  }

  String get _schoolName {
    if (_customSchool != null && _customSchool!.isNotEmpty) {
      return _customSchool!;
    }
    final school = _raw?['school_name'] ?? _raw?['schoolName'] ?? _raw?['school'];
    if (school != null && school.toString().isNotEmpty) {
      return school.toString();
    }
    return 'Mandaluyong Elementary School';
  }

  String get _assignedClass {
    if (_customAssignedClass != null && _customAssignedClass!.isNotEmpty) {
      return _customAssignedClass!;
    }
    final sec = _user?.sectionName ?? '';
    final grade = _user?.gradeLevel ?? '';
    if (sec.toLowerCase().startsWith('grade')) return sec;
    if (sec.isNotEmpty && grade.isNotEmpty) return 'Grade $grade - $sec';
    if (sec.isNotEmpty) return sec;
    if (grade.isNotEmpty) return 'Grade $grade';
    return 'Grade 4 - FYANG';
  }

  String? get _teacherImageUrl {
    final img = _raw?['profileImage'] ?? _raw?['profile_image'];
    return img?.toString();
  }

  Future<void> _openEditProfilePage() async {
    Feedback.forTap(context);
    final user = AuthService.currentUser;
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => TeacherEditProfilePage(
          currentName: _teacherName,
          currentFirstName: user?.firstName ?? '',
          currentMiddleName: user?.middleName ?? '',
          currentLastName: user?.lastName ?? '',
          currentTitle: _teacherTitle,
          currentSchool: _schoolName,
          currentEmployeeId: _employeeId,
          currentEmail: _emailAddress,
          currentAssignedClass: _assignedClass,
          currentAvatarIcon: Icons.person_rounded,
        ),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _customTeacherName = result['name'] as String?;
        _customTitle = result['title'] as String?;
        _customSchool = result['school'] as String?;
        _customEmployeeId = result['employeeId'] as String?;
        _customEmailAddress = result['email'] as String?;
        _customAssignedClass = result['assignedClass'] as String?;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softBg,
      appBar: AppBar(
        backgroundColor: softBg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const TeacherOverviewPage()),
              );
            }
          },
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Colors.black),
        ),
        centerTitle: true,
        title: Text(
          'My Profile',
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
          ),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refreshProfile,
          color: const Color(0xFFD34426),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
            padding: const EdgeInsets.fromLTRB(20.0, 8.0, 20.0, 60.0),
            child: Column(
              children: [
                // Header Profile Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Profile Avatar using InitialsAvatar with DB Image support
                      Container(
                        width: 86,
                        height: 86,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFD34426), width: 2.5),
                          color: const Color(0xFFFDF4F2),
                        ),
                        child: InitialsAvatar(
                          name: _teacherName,
                          imageUrl: _teacherImageUrl,
                          radius: 40,
                          fontSize: 26,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Teacher Name & Credentials
                      Text(
                        _teacherName,
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _teacherTitle,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFD34426),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _schoolName,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        onPressed: _openEditProfilePage,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFD34426),
                          side: const BorderSide(color: Color(0xFFFBE8E6), width: 1.5),
                          backgroundColor: const Color(0xFFFDF4F2),
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(100),
                          ),
                        ),
                        icon: Iconify(Ph.pencil_simple, color: const Color(0xFFD34426), size: 16),
                        label: Text(
                          'Edit Profile',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Account & Personal Info Section
                _buildSectionHeader('Account Details', Ph.user),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      _buildDetailTile(
                        icon: Ph.identification_card,
                        label: 'Employee ID',
                        value: _employeeId,
                      ),
                      const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                      _buildDetailTile(
                        icon: Ph.envelope_simple,
                        label: 'Email Address',
                        value: _emailAddress,
                      ),
                      const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                      _buildDetailTile(
                        icon: Ph.briefcase,
                        label: 'Designation / Position',
                        value: _teacherTitle,
                      ),
                      const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                      _buildDetailTile(
                        icon: Ph.buildings,
                        label: 'School Name',
                        value: _schoolName,
                      ),
                      const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                      _buildDetailTile(
                        icon: Ph.users_three,
                        label: 'Assigned Class',
                        value: _assignedClass,
                      ),
                      if (_user?.schoolYear.isNotEmpty == true) ...[
                        const Divider(height: 1, indent: 56, endIndent: 16, color: Color(0xFFF1F5F9)),
                        _buildDetailTile(
                          icon: Ph.calendar_blank,
                          label: 'Active School Year',
                          value: _user!.schoolYear,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 36),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, String iconName) {
    return Row(
      children: [
        Iconify(iconName, color: const Color(0xFFD34426), size: 20),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: Colors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildDetailTile({
    required String icon,
    required String label,
    required String value,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Iconify(icon, color: Colors.grey[700], size: 18),
        ),
      ),
      title: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: Colors.grey[600],
        ),
      ),
      subtitle: Text(
        value,
        style: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: Colors.black,
        ),
      ),
    );
  }
}
