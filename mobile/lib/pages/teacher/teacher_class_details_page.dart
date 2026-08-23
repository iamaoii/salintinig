import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_student_details_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';
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
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  String get _teacherName {
    final name = AuthService.currentUser?.displayName;
    if (name != null && name.isNotEmpty) return name;
    return 'Teacher';
  }

  String? get _teacherImageUrl {
    final user = AuthService.currentUser;
    final img = user?.rawUser?['profileImage'] ?? user?.rawUser?['profile_image'];
    return img?.toString();
  }

  bool _isLoading = true;
  List<Map<String, dynamic>> _students = [];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filteredStudents {
    if (_searchQuery.trim().isEmpty) return _students;
    final q = _searchQuery.toLowerCase().trim();
    return _students.where((s) {
      final rawName = (s['name'] as String?)?.trim() ?? '';
      final first = (s['firstName'] ?? s['first_name'] ?? '').toString().trim();
      final middle = (s['middleName'] ?? s['middle_name'] ?? '').toString().trim();
      final last = (s['lastName'] ?? s['last_name'] ?? '').toString().trim();
      final full = '$first $middle $last'.trim().toLowerCase();

      return rawName.toLowerCase().contains(q) || full.contains(q);
    }).toList();
  }

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

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: const TeacherSidebarDrawer(activeRoute: 'Class Details'),
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
              child: RefreshIndicator(
                onRefresh: _fetchStudents,
                color: const Color(0xFFD34426),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
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
                    const SizedBox(height: 12),

                    // Search Student Input Pill
                    Container(
                      height: 38,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9).withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      padding: const EdgeInsets.only(left: 16, right: 6),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val;
                          });
                        },
                        style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                        decoration: InputDecoration(
                          isDense: true,
                          hintText: 'Search student',
                          hintStyle: GoogleFonts.inter(
                            fontSize: 13,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w400,
                          ),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? GestureDetector(
                                  onTap: () {
                                    _searchController.clear();
                                    setState(() {
                                      _searchQuery = '';
                                    });
                                  },
                                  child: Icon(
                                    Icons.close_rounded,
                                    color: Colors.grey[600],
                                    size: 18,
                                  ),
                                )
                              : Icon(
                                  Icons.search_rounded,
                                  color: Colors.grey[600],
                                  size: 18,
                                ),
                          suffixIconConstraints: const BoxConstraints(minWidth: 32, minHeight: 0),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Student List
                    _isLoading
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32.0),
                              child: CircularProgressIndicator(color: Color(0xFFD34426)),
                            ),
                          )
                        : _filteredStudents.isEmpty
                            ? Padding(
                                padding: const EdgeInsets.symmetric(vertical: 32.0),
                                child: Center(
                                  child: Text(
                                    _searchQuery.isNotEmpty ? 'No student matches search.' : 'No enrolled learners found.',
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
                                itemCount: _filteredStudents.length,
                                separatorBuilder: (context, index) => const Divider(color: Color(0xFFF1F5F9), height: 1),
                                itemBuilder: (context, index) {
                                  final student = _filteredStudents[index];
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
          ),
        ],
      ),
    ),
  );
  }
}
