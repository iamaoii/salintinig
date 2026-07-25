import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:salintinig/pages/teacher/teacher_student_details_page.dart';

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

  final List<Map<String, dynamic>> _allStudents = const [
    {'name': 'Alvarez, Marco', 'score': 11, 'status': 'Under 14', 'lrn': '136670100001'},
    {'name': 'Bautista, Ethan', 'score': 9, 'status': 'Under 14', 'lrn': '136670100002'},
    {'name': 'Castillo, Mia', 'score': 12, 'status': 'Under 14', 'lrn': '136670100003'},
    {'name': 'Dela Cruz, Juan', 'score': 10, 'status': 'Under 14', 'lrn': '136670100004'},
    {'name': 'Enriquez, Chloe', 'score': 16, 'status': 'Above 14', 'lrn': '136670100005'},
    {'name': 'Flores, Gabriel', 'score': 8, 'status': 'Under 14', 'lrn': '136670100006'},
    {'name': 'Garcia, Hannah', 'score': 17, 'status': 'Above 14', 'lrn': '136670100007'},
    {'name': 'Hernandez, Liam', 'score': 13, 'status': 'Under 14', 'lrn': '136670100008'},
    {'name': 'Ignacio, Samantha', 'score': 15, 'status': 'Above 14', 'lrn': '136670100009'},
    {'name': 'Jose, Lucas', 'score': 7, 'status': 'Under 14', 'lrn': '136670100010'},
    {'name': 'Lim, Sophia', 'score': 18, 'status': 'Above 14', 'lrn': '136670100011'},
    {'name': 'Mendoza, Daniel', 'score': 14, 'status': 'Above 14', 'lrn': '136670100012'},
    {'name': 'Navarro, Olivia', 'score': 12, 'status': 'Under 14', 'lrn': '136670100013'},
    {'name': 'Ocampo, Benjamin', 'score': 10, 'status': 'Under 14', 'lrn': '136670100014'},
    {'name': 'Perez, Ava', 'score': 11, 'status': 'Under 14', 'lrn': '136670100015'},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);
    final isUnder = widget.filterType == 'Under 14';
    final titleText = isUnder ? 'Students Under 14 GST' : 'Students Above 14 GST';

    final categoryStudents = _allStudents.where((s) => s['status'] == widget.filterType).toList();

    final filteredStudents = categoryStudents.where((s) {
      final name = s['name'].toString().toLowerCase();
      final lrn = s['lrn'].toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      return name.contains(query) || lrn.contains(query);
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
                        hintText: 'Search student name or LRN...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: Colors.grey[400]),
                        prefixIcon: const Icon(Icons.search_rounded, color: Colors.grey, size: 20),
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
                          'Grade 4 - Fyang',
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
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filteredStudents.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final student = filteredStudents[index];
                        final String name = student['name'] as String;
                        final int score = student['score'] as int;
                        final String lrn = student['lrn'] as String;

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
                            leading: CircleAvatar(
                              radius: 20,
                              backgroundColor: isUnder ? const Color(0xFFFDF4F2) : const Color(0xFFECFDF5),
                              child: Text(
                                name.substring(0, 1),
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  color: isUnder ? const Color(0xFFD34426) : const Color(0xFF059669),
                                ),
                              ),
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
                                    color: isUnder ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: Text(
                                    'Score: $score / 20',
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: isUnder ? const Color(0xFFDC2626) : const Color(0xFF059669),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  isUnder ? 'Needs Form 3A ORT' : 'Passed GST',
                                  style: GoogleFonts.inter(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: isUnder ? const Color(0xFFD34426) : Colors.grey[600],
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
