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
    final name = _user?.displayName;
    if (name != null && name.isNotEmpty) {
      return name;
    }
    return 'Teacher';
  }

  String get _emailAddress {
    final email = _user?.email;
    if (email != null && email.isNotEmpty) {
      return email;
    }
    return 'N/A';
  }

  String get _employeeId {
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
    final pos = _raw?['title'] ?? _raw?['position'] ?? _raw?['designation'];
    if (pos != null && pos.toString().isNotEmpty) {
      return pos.toString();
    }
    final grade = _user?.gradeLevel;
    if (grade != null && grade.isNotEmpty) {
      return 'Grade $grade Teacher';
    }
    return 'Grade Teacher';
  }

  String get _schoolName {
    final school = _raw?['school_name'] ?? _raw?['schoolName'] ?? _raw?['school'];
    if (school != null && school.toString().isNotEmpty) {
      return school.toString();
    }
    return 'N/A';
  }

  String get _assignedClass {
    final sec = _user?.sectionName ?? '';
    final grade = _user?.gradeLevel ?? '';
    if (sec.toLowerCase().startsWith('grade')) return sec;
    if (sec.isNotEmpty && grade.isNotEmpty) return 'Grade $grade - $sec';
    if (sec.isNotEmpty) return sec;
    if (grade.isNotEmpty) return 'Grade $grade';
    return 'Assigned Class';
  }

  String? get _teacherImageUrl {
    final img = _raw?['profileImage'] ?? _raw?['profile_image'];
    return img?.toString();
  }

  Future<void> _openEditProfilePage() async {
    Feedback.forTap(context);
    final user = AuthService.currentUser;
    await Navigator.push<Map<String, dynamic>>(
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

    if (mounted) {
      await _refreshProfile();
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
                // Clean Center Avatar & Info (matching Student Profile design)
                const SizedBox(height: 12),
                Center(
                  child: InitialsAvatar(
                    radius: 54,
                    imageUrl: _teacherImageUrl,
                    name: _teacherName,
                  ),
                ),
                const SizedBox(height: 16),

                // Teacher Name
                Center(
                  child: Text(
                    _teacherName,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                      letterSpacing: -0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 6),

                // Subtitle (Line 1: Orange Section/Class; Line 2: Grey School Name)
                Center(
                  child: Column(
                    children: [
                      Text(
                        _assignedClass,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFD34426),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _schoolName,
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF71717A),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Edit Profile Button (matching Student Profile rounded button style)
                Center(
                  child: InkWell(
                    onTap: _openEditProfilePage,
                    borderRadius: BorderRadius.circular(100),
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAEAEA),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                      child: Text(
                        'Edit Profile',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF555558),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

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
