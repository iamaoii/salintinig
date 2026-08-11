import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_student_details_page.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class TeacherReadingLevelsPage extends StatefulWidget {
  final String initialLevel;
  final String className;

  const TeacherReadingLevelsPage({
    super.key,
    this.initialLevel = 'All',
    this.className = 'Grade 4 - FYANG',
  });

  @override
  State<TeacherReadingLevelsPage> createState() => _TeacherReadingLevelsPageState();
}

class _TeacherReadingLevelsPageState extends State<TeacherReadingLevelsPage> {
  late String _selectedFilter;
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, dynamic>> _frustrationStudents = const [
    {'name': 'Adrian Matthew Cruz', 'level': 'Frustration', 'wps': '45 wps', 'accuracy': '62%', 'initial': 'A'},
    {'name': 'Bianca Louise Santos', 'level': 'Frustration', 'wps': '48 wps', 'accuracy': '64%', 'initial': 'B'},
    {'name': 'Caleb James Rivera', 'level': 'Frustration', 'wps': '50 wps', 'accuracy': '60%', 'initial': 'C'},
    {'name': 'Daniela Mae Flores', 'level': 'Frustration', 'wps': '42 wps', 'accuracy': '58%', 'initial': 'D'},
    {'name': 'Ethan Gabriel Reyes', 'level': 'Frustration', 'wps': '52 wps', 'accuracy': '65%', 'initial': 'E'},
    {'name': 'Fiona Claire Mendoza', 'level': 'Frustration', 'wps': '40 wps', 'accuracy': '55%', 'initial': 'F'},
    {'name': 'Hannah Nicole Castillo', 'level': 'Frustration', 'wps': '46 wps', 'accuracy': '63%', 'initial': 'H'},
    {'name': 'Gabriel Anthony Navarro', 'level': 'Frustration', 'wps': '44 wps', 'accuracy': '61%', 'initial': 'G'},
    {'name': 'Julia Camille Torres', 'level': 'Frustration', 'wps': '49 wps', 'accuracy': '66%', 'initial': 'J'},
    {'name': 'Isaac Daniel Ramos', 'level': 'Frustration', 'wps': '41 wps', 'accuracy': '57%', 'initial': 'I'},
    {'name': 'Juan Dela Cruz', 'level': 'Frustration', 'wps': '43 wps', 'accuracy': '59%', 'initial': 'J'},
    {'name': 'Maria Clara Santos', 'level': 'Frustration', 'wps': '47 wps', 'accuracy': '62%', 'initial': 'M'},
    {'name': 'Kylie Marie Soriano', 'level': 'Frustration', 'wps': '45 wps', 'accuracy': '60%', 'initial': 'K'},
    {'name': 'Liam Alexander Diaz', 'level': 'Frustration', 'wps': '48 wps', 'accuracy': '64%', 'initial': 'L'},
    {'name': 'Mia Sofia Garcia', 'level': 'Frustration', 'wps': '42 wps', 'accuracy': '58%', 'initial': 'M'},
    {'name': 'Nathaniel Scott Villanueva', 'level': 'Frustration', 'wps': '51 wps', 'accuracy': '65%', 'initial': 'N'},
    {'name': 'Olivia Grace Hernandez', 'level': 'Frustration', 'wps': '46 wps', 'accuracy': '62%', 'initial': 'O'},
    {'name': 'Patrick John Aquino', 'level': 'Frustration', 'wps': '44 wps', 'accuracy': '60%', 'initial': 'P'},
    {'name': 'Quentin Blake Valenzuela', 'level': 'Frustration', 'wps': '40 wps', 'accuracy': '54%', 'initial': 'Q'},
    {'name': 'Rose Ann Del Rosario', 'level': 'Frustration', 'wps': '49 wps', 'accuracy': '66%', 'initial': 'R'},
  ];

  final List<Map<String, dynamic>> _instructionalStudents = const [
    {'name': 'Jose Protasio Rizal', 'level': 'Instructional', 'wps': '68 wps', 'accuracy': '82%', 'initial': 'J'},
    {'name': 'Andres Bonifacio', 'level': 'Instructional', 'wps': '70 wps', 'accuracy': '85%', 'initial': 'A'},
    {'name': 'Samuel David Tan', 'level': 'Instructional', 'wps': '65 wps', 'accuracy': '80%', 'initial': 'S'},
    {'name': 'Tristan Paul Mercado', 'level': 'Instructional', 'wps': '72 wps', 'accuracy': '86%', 'initial': 'T'},
    {'name': 'Ursula Beatrice Lim', 'level': 'Instructional', 'wps': '67 wps', 'accuracy': '83%', 'initial': 'U'},
    {'name': 'Vincent Mark Pascual', 'level': 'Instructional', 'wps': '69 wps', 'accuracy': '84%', 'initial': 'V'},
    {'name': 'Wendy Joy Roxas', 'level': 'Instructional', 'wps': '66 wps', 'accuracy': '81%', 'initial': 'W'},
    {'name': 'Xavier Cole Bautista', 'level': 'Instructional', 'wps': '71 wps', 'accuracy': '87%', 'initial': 'X'},
    {'name': 'Yvonne Mae Alonzo', 'level': 'Instructional', 'wps': '64 wps', 'accuracy': '79%', 'initial': 'Y'},
    {'name': 'Zachary Sean Ocampo', 'level': 'Instructional', 'wps': '73 wps', 'accuracy': '88%', 'initial': 'Z'},
  ];

  final List<Map<String, dynamic>> _independentStudents = const [
    {'name': 'Emilio Aguinaldo', 'level': 'Independent', 'wps': '92 wps', 'accuracy': '96%', 'initial': 'E'},
    {'name': 'Angelica Ruth Corpuz', 'level': 'Independent', 'wps': '95 wps', 'accuracy': '98%', 'initial': 'A'},
    {'name': 'Benjamin Thomas Salazar', 'level': 'Independent', 'wps': '90 wps', 'accuracy': '94%', 'initial': 'B'},
    {'name': 'Chloe Danielle Ibáñez', 'level': 'Independent', 'wps': '94 wps', 'accuracy': '97%', 'initial': 'C'},
    {'name': 'Dominic Rafael David', 'level': 'Independent', 'wps': '91 wps', 'accuracy': '95%', 'initial': 'D'},
  ];

  @override
  void initState() {
    super.initState();
    _selectedFilter = widget.initialLevel;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> _filterList(List<Map<String, dynamic>> original) {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return original;
    return original.where((s) => (s['name'] as String).toLowerCase().contains(query)).toList();
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);
    final filteredFrustration = _filterList(_frustrationStudents);
    final filteredInstructional = _filterList(_instructionalStudents);
    final filteredIndependent = _filterList(_independentStudents);

    final showFrustration = (_selectedFilter == 'All' || _selectedFilter == 'Frustration') && filteredFrustration.isNotEmpty;
    final showInstructional = (_selectedFilter == 'All' || _selectedFilter == 'Instructional') && filteredInstructional.isNotEmpty;
    final showIndependent = (_selectedFilter == 'All' || _selectedFilter == 'Independent') && filteredIndependent.isNotEmpty;

    final int totalCount = _frustrationStudents.length + _instructionalStudents.length + _independentStudents.length;

    return Scaffold(
      backgroundColor: softBg,
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with < Back button on left and ... on right
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
                    'Reading Level Classification',
                    style: GoogleFonts.inter(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: Colors.black,
                    ),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.more_horiz_rounded, size: 26, color: Colors.black),
                  ),
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
                    // 1. Total Students Header
                    Row(
                      children: [
                        Iconify(Ph.users_three, color: Colors.black87, size: 30),
                        const SizedBox(width: 8),
                        Text(
                          '$totalCount',
                          style: GoogleFonts.inter(
                            fontSize: 38,
                            fontWeight: FontWeight.w900,
                            color: Colors.black,
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Total\nStudents',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w700,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // 2. Filter Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('All', totalCount),
                          const SizedBox(width: 8),
                          _buildFilterChip('Frustration', _frustrationStudents.length, const Color(0xFFD34426)),
                          const SizedBox(width: 8),
                          _buildFilterChip('Instructional', _instructionalStudents.length, const Color(0xFFD97706)),
                          const SizedBox(width: 8),
                          _buildFilterChip('Independent', _independentStudents.length, const Color(0xFF059669)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // 3. Search Bar (Slim Pill Style - Reverted Color)
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
                        onChanged: (val) => setState(() {}),
                        style: GoogleFonts.inter(fontSize: 13, color: Colors.black87),
                        decoration: InputDecoration(
                          isDense: true,
                          hintText: 'Search student',
                          hintStyle: GoogleFonts.inter(
                            fontSize: 13,
                            color: Colors.grey[500],
                            fontWeight: FontWeight.w400,
                          ),
                          suffixIcon: Icon(
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
                    const SizedBox(height: 24),

                    // 4. Section: Frustration Level Students
                    if (showFrustration) ...[
                      _buildSectionHeader(
                        title: 'Frustrational Level Students',
                        count: '${filteredFrustration.length}',
                        accentColor: const Color(0xFFD34426),
                      ),
                      const SizedBox(height: 12),
                      _buildStudentGroupList(filteredFrustration, const Color(0xFFD34426), const Color(0xFFFDF4F2), const Color(0xFFFEE2E2)),
                      const SizedBox(height: 28),
                    ],

                    // 5. Section: Instructional Level Students
                    if (showInstructional) ...[
                      _buildSectionHeader(
                        title: 'Instructional Level Students',
                        count: '${filteredInstructional.length}',
                        accentColor: const Color(0xFFD97706),
                      ),
                      const SizedBox(height: 12),
                      _buildStudentGroupList(filteredInstructional, const Color(0xFFD97706), const Color(0xFFFEFCE8), const Color(0xFFFEF08A)),
                      const SizedBox(height: 28),
                    ],

                    // 6. Section: Independent Level Students
                    if (showIndependent) ...[
                      _buildSectionHeader(
                        title: 'Independent Level Students',
                        count: '${filteredIndependent.length}',
                        accentColor: const Color(0xFF059669),
                      ),
                      const SizedBox(height: 12),
                      _buildStudentGroupList(filteredIndependent, const Color(0xFF059669), const Color(0xFFECFDF5), const Color(0xFFA7F3D0)),
                      const SizedBox(height: 28),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader({
    required String title,
    required String count,
    required Color accentColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 22,
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              title,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Colors.black,
              ),
            ),
          ],
        ),
        Text(
          count,
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Colors.grey[500],
          ),
        ),
      ],
    );
  }

  Widget _buildStudentGroupList(
    List<Map<String, dynamic>> students,
    Color textColor,
    Color bgColor,
    Color tagBorderColor,
  ) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: students.length,
      separatorBuilder: (context, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final student = students[index];
        final String name = student['name'] as String;
        final String level = student['level'] as String;
        final String initial = student['initial'] as String;
        final String wps = student['wps'] as String;
        final String accuracy = student['accuracy'] as String;

        return InkWell(
          onTap: () {
            Feedback.forTap(context);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => TeacherStudentDetailsPage(
                  studentName: name,
                  level: level,
                  avatarInitial: initial,
                ),
              ),
            );
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
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
            padding: const EdgeInsets.all(14.0),
            child: Row(
              children: [
                InitialsAvatar(
                  name: name,
                  radius: 22,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: Colors.black,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$wps • $accuracy Accuracy',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(color: tagBorderColor),
                  ),
                  child: Text(
                    level == 'Frustration' ? 'Frustrational' : level,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Colors.grey,
                  size: 18,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFilterChip(String label, int count, [Color? color]) {
    final bool isSelected = _selectedFilter == label;
    final activeColor = color ?? const Color(0xFF1B64D8);

    return ChoiceChip(
      label: Text(
        '$label ($count)',
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          color: isSelected ? Colors.white : Colors.black87,
        ),
      ),
      selected: isSelected,
      selectedColor: activeColor,
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? activeColor : const Color(0xFFE2E8F0),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = label;
          });
        }
      },
    );
  }
}
