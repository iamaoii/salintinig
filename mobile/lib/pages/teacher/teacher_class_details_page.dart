import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_profile_page.dart';
import 'package:salintinig/pages/teacher/teacher_settings_page.dart';
import 'package:salintinig/pages/teacher/teacher_student_details_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class TeacherClassDetailsPage extends StatefulWidget {
  final String className;
  const TeacherClassDetailsPage({
    super.key,
    this.className = 'Grade 4 - FYANG',
  });

  @override
  State<TeacherClassDetailsPage> createState() => _TeacherClassDetailsPageState();
}

class _TeacherClassDetailsPageState extends State<TeacherClassDetailsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  bool _isLoading = true;
  List<Map<String, dynamic>> _students = [];

  @override
  void initState() {
    super.initState();
    final cached = AuthService.cachedClassStudents;
    if (cached != null) {
      _students = cached;
      _isLoading = false;
    }
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    try {
      final rawList = await AuthService.fetchClassStudents(forceRefresh: true);
      if (mounted) {
        setState(() {
          _students = rawList;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching class students: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String get _teacherName {
    final name = AuthService.currentUser?.displayName;
    if (name != null && name.isNotEmpty) {
      return name;
    }
    return 'Teacher';
  }

  String? get _teacherImageUrl {
    final user = AuthService.currentUser;
    final img = user?.rawUser?['profileImage'] ?? user?.rawUser?['profile_image'];
    return img?.toString();
  }

  Widget _buildTeacherDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFFD34426),
      child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),
                Row(
                  children: [
                    Image.asset(
                      'assets/logo/logo_v2.webp',
                      height: 32,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'SalinTinig',
                      style: GoogleFonts.inter(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.house, color: Colors.white, size: 22),
                  title: Text(
                    'Home',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 4),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.presentation_chart, color: Colors.white, size: 22),
                  title: Text(
                    'Student Dashboard',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 4),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.exam, color: Colors.white, size: 22),
                  title: Text(
                    'Phil-IRI Records',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 4),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.puzzle_piece, color: Colors.white, size: 22),
                  title: Text(
                    'Class Activities',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.only(left: 16.0, bottom: 8.0),
                  child: Text(
                    'Your classes',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    dense: true,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                    leading: Iconify(Ph.users_three, color: const Color(0xFFD34426), size: 22),
                    title: Text(
                      'Grade 4 - Fyang',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFD34426),
                      ),
                    ),
                    onTap: () {
                      Navigator.pop(context);
                    },
                  ),
                ),
                const Spacer(),
                const Divider(color: Colors.white30, height: 24, thickness: 1),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Container(
                    width: 22,
                    height: 22,
                    decoration: const BoxDecoration(
                      color: Colors.white70,
                      shape: BoxShape.circle,
                    ),
                  ),
                  title: Text(
                    'My Profile',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherProfilePage(),
                      ),
                    );
                  },
                ),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.gear, color: Colors.white, size: 22),
                  title: Text(
                    'Settings',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const TeacherSettingsPage(),
                      ),
                    );
                  },
                ),
                ListTile(
                  dense: true,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  leading: Iconify(Ph.sign_out, color: Colors.white, size: 22),
                  title: Text(
                    'Logout',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    AuthService.showLogoutDialog(context);
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: _buildTeacherDrawer(context),
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with Hamburger Menu on left
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 22, color: Colors.black),
                  ),
                  Text(
                    widget.className.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Total Students Stat Header
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Iconify(Ph.users_three, color: Colors.black87, size: 36),
                        const SizedBox(width: 14),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isLoading ? '...' : '${_students.length}',
                              style: GoogleFonts.inter(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: Colors.black,
                                height: 1.0,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Total Students',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Teacher Section
                    Row(
                      children: [
                        const Icon(Icons.assignment_ind_outlined, color: Color(0xFFD34426), size: 24),
                        const SizedBox(width: 8),
                        Text(
                          'Teacher',
                          style: GoogleFonts.inter(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Divider(color: Color(0xFFE2E8F0), thickness: 1.2),
                    const SizedBox(height: 4),
                    Material(
                      color: Colors.transparent,
                      child: ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: InitialsAvatar(
                          name: _teacherName,
                          imageUrl: _teacherImageUrl,
                          radius: 20,
                          fontSize: 14,
                        ),
                        title: Text(
                          _teacherName,
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),

                    // Students Section
                    Row(
                      children: [
                        Iconify(Ph.users_three, color: const Color(0xFFD34426), size: 24),
                        const SizedBox(width: 8),
                        Text(
                          'Students',
                          style: GoogleFonts.inter(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Divider(color: Color(0xFFE2E8F0), thickness: 1.2),
                    const SizedBox(height: 8),

                    // Student List
                    _isLoading
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32.0),
                              child: CircularProgressIndicator(color: Color(0xFFD34426)),
                            ),
                          )
                        : _students.isEmpty
                            ? Padding(
                                padding: const EdgeInsets.symmetric(vertical: 32.0),
                                child: Center(
                                  child: Text(
                                    'No enrolled learners found.',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      color: Colors.grey[600],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              )
                            : ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _students.length,
                                separatorBuilder: (context, index) => const Divider(color: Color(0xFFF1F5F9), height: 1),
                                itemBuilder: (context, index) {
                                  final student = _students[index];
                                  final rawName = (student['name'] as String?)?.trim();
                                  final first = (student['firstName'] as String?)?.trim() ?? '';
                                  final last = (student['lastName'] as String?)?.trim() ?? '';
                                  final String name = (rawName != null && rawName.isNotEmpty)
                                      ? rawName
                                      : ('$first $last').trim().isNotEmpty
                                          ? ('$first $last').trim()
                                          : 'Student ${index + 1}';
                                  final String? studentAvatar = (student['profileImage'] ?? student['profile_image'] ?? student['avatarUrl'] ?? student['image'])?.toString();

                                  return InkWell(
                                    onTap: () {
                                      Feedback.forTap(context);
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => TeacherStudentDetailsPage(
                                            studentName: name,
                                          ),
                                        ),
                                      );
                                    },
                                    borderRadius: BorderRadius.circular(10),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 4.0),
                                      child: Row(
                                        children: [
                                          InitialsAvatar(
                                            name: name,
                                            imageUrl: studentAvatar,
                                            radius: 20,
                                            fontSize: 14,
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Text(
                                              name,
                                              style: GoogleFonts.inter(
                                                fontSize: 15,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.black87,
                                              ),
                                            ),
                                          ),
                                          const Icon(
                                            Icons.chevron_right_rounded,
                                            color: Colors.grey,
                                            size: 20,
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
