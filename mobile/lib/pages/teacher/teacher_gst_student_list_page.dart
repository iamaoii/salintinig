import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/teacher/teacher_student_details_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class TeacherGstStudentListPage extends StatefulWidget {
  final String filterType; // 'Under 14' or 'Above 14'
  final String formTitle;

  const TeacherGstStudentListPage({
    super.key,
    required this.filterType,
    this.formTitle = 'FORM 1A',
  });

  @override
  State<TeacherGstStudentListPage> createState() => _TeacherGstStudentListPageState();
}

class _TeacherGstStudentListPageState extends State<TeacherGstStudentListPage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);
    final String filter = widget.filterType;
    final bool isUnder = filter == 'Under 14';
    final bool isPendingFilter = filter == 'Pending' || filter == 'Not Done';

    final String titleText = isPendingFilter
        ? 'Students Pending GST'
        : (isUnder ? 'Students Under 14 GST' : 'Students Above 14 GST');

    final String displaySection = AuthService.currentUser?.sectionName ?? '';
    final String displayGrade = AuthService.currentUser?.gradeLevel ?? '';
    final String classSubText = displaySection.isNotEmpty
        ? (displaySection.toLowerCase().startsWith('grade') ? displaySection : 'Grade $displayGrade - $displaySection')
        : 'Grade 4';

    final cached = AuthService.cachedClassStudents ?? [];
    final List<Map<String, dynamic>> allStudents = [];

    for (var s in cached) {
      final rawName = (s['name'] as String?)?.trim();
      final first = (s['firstName'] ?? s['first_name'] ?? '').toString().trim();
      final last = (s['lastName'] ?? s['last_name'] ?? '').toString().trim();
      final String name = (rawName != null && rawName.isNotEmpty)
          ? rawName
          : ('$first $last').trim().isNotEmpty
              ? ('$first $last').trim()
              : 'Learner';
      final lrn = (s['lrn'] ?? '').toString();
      final img = (s['profileImage'] ?? s['profile_image'])?.toString();
      final lvl = (s['readingLevel'] ?? s['level'] ?? s['reading_level'] ?? s['current_profile_label'] ?? '').toString().toLowerCase();

      final bool isPending = lvl.isEmpty || lvl.contains('pending');
      final bool isAbove = !isPending && lvl.contains('independ');

      final String status = isPending ? 'Pending' : (isAbove ? 'Above 14' : 'Under 14');
      final int score = isAbove ? 16 : (lvl.contains('instruct') ? 11 : 8);

      allStudents.add({
        'name': name,
        'score': score,
        'status': status,
        'isPending': isPending,
        'lrn': lrn,
        'profileImage': img,
        'student': s,
      });
    }

    final categoryStudents = allStudents.where((s) {
      if (isPendingFilter) return s['isPending'] == true;
      return s['status'] == filter;
    }).toList();

    final filteredStudents = categoryStudents.where((s) {
      final name = s['name'].toString().toLowerCase();
      final query = _searchQuery.toLowerCase().trim();
      return name.contains(query);
    }).toList();

    return Scaffold(
      backgroundColor: softBg,
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with < Back button
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
                    titleText,
                    style: GoogleFonts.inter(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
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
                    // Search Bar
                    TextField(
                      controller: _searchController,
                      onChanged: (val) {
                        setState(() {
                          _searchQuery = val;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: 'Search student name...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: Colors.grey[400]),
                        prefixIcon: const Icon(Icons.search_rounded, color: Colors.grey, size: 20),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? GestureDetector(
                                onTap: () {
                                  _searchController.clear();
                                  setState(() {
                                    _searchQuery = '';
                                  });
                                },
                                child: const Icon(Icons.close_rounded, color: Colors.grey, size: 18),
                              )
                            : null,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        filled: true,
                        fillColor: Colors.white,
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: Color(0xFFD34426)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // List Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Student Roster (${filteredStudents.length})',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                        Text(
                          classSubText,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Student List
                    filteredStudents.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40.0),
                            child: Center(
                              child: Text(
                                _searchQuery.isNotEmpty
                                    ? 'No student matches search.'
                                    : 'No learners found in this category.',
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
                            itemCount: filteredStudents.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final student = filteredStudents[index];
                              final String name = student['name'] as String;
                              final int score = student['score'] as int;
                              final String lrn = student['lrn'] as String;
                              final String? profileImg = student['profileImage'] as String?;
                              final bool pending = student['isPending'] == true;
                              final String itemStatus = student['status'] as String;
                              final bool itemUnder = itemStatus == 'Under 14';

                              return Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.02),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  leading: InitialsAvatar(
                                    name: name,
                                    imageUrl: profileImg,
                                    radius: 20,
                                    fontSize: 14,
                                  ),
                                  title: Text(
                                    name,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.black,
                                    ),
                                  ),
                                  subtitle: Text(
                                    'LRN: $lrn',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      color: Colors.grey[500],
                                    ),
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: pending
                                              ? const Color(0xFFFEF3C7)
                                              : (itemUnder ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5)),
                                          borderRadius: BorderRadius.circular(100),
                                        ),
                                        child: Text(
                                          pending ? 'Pending GST' : 'Score: $score / 20',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: pending
                                                ? const Color(0xFFD97706)
                                                : (itemUnder ? const Color(0xFFDC2626) : const Color(0xFF059669)),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        pending
                                            ? 'Needs Assessment'
                                            : (itemUnder ? 'Needs Form 3A ORT' : 'Passed GST'),
                                        style: GoogleFonts.inter(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: pending
                                              ? const Color(0xFFD97706)
                                              : (itemUnder ? const Color(0xFFD34426) : Colors.grey[600]),
                                        ),
                                      ),
                                    ],
                                  ),
                                  onTap: () {
                                    Feedback.forTap(context);
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => TeacherStudentDetailsPage(
                                          studentName: name,
                                          lrn: lrn,
                                        ),
                                      ),
                                    );
                                  },
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
