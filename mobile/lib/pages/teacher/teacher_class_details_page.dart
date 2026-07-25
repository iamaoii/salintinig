import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_profile_page.dart';
import 'package:salintinig/pages/teacher/teacher_settings_page.dart';
import 'package:salintinig/pages/teacher/teacher_student_details_page.dart';

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

  final List<Map<String, String>> _students = const [
    {'name': 'Adrian Matthew Cruz', 'avatar': 'A'},
    {'name': 'Bianca Louise Santos', 'avatar': 'B'},
    {'name': 'Caleb James Rivera', 'avatar': 'C'},
    {'name': 'Daniela Mae Flores', 'avatar': 'D'},
    {'name': 'Ethan Gabriel Reyes', 'avatar': 'E'},
    {'name': 'Fiona Claire Mendoza', 'avatar': 'F'},
    {'name': 'Hannah Nicole Castillo', 'avatar': 'H'},
    {'name': 'Gabriel Anthony Navarro', 'avatar': 'G'},
    {'name': 'Julia Camille Torres', 'avatar': 'J'},
    {'name': 'Isaac Daniel Ramos', 'avatar': 'I'},
    {'name': 'Juan Dela Cruz', 'avatar': 'J'},
    {'name': 'Maria Clara Santos', 'avatar': 'M'},
    {'name': 'Jose Protasio Rizal', 'avatar': 'J'},
    {'name': 'Andres Bonifacio', 'avatar': 'A'},
    {'name': 'Emilio Aguinaldo', 'avatar': 'E'},
    {'name': 'Kylie Marie Soriano', 'avatar': 'K'},
    {'name': 'Liam Alexander Diaz', 'avatar': 'L'},
    {'name': 'Mia Sofia Garcia', 'avatar': 'M'},
    {'name': 'Nathaniel Scott Villanueva', 'avatar': 'N'},
    {'name': 'Olivia Grace Hernandez', 'avatar': 'O'},
    {'name': 'Patrick John Aquino', 'avatar': 'P'},
    {'name': 'Quentin Blake Valenzuela', 'avatar': 'Q'},
    {'name': 'Rose Ann Del Rosario', 'avatar': 'R'},
    {'name': 'Samuel David Tan', 'avatar': 'S'},
    {'name': 'Tristan Paul Mercado', 'avatar': 'T'},
    {'name': 'Ursula Beatrice Lim', 'avatar': 'U'},
    {'name': 'Vincent Mark Pascual', 'avatar': 'V'},
    {'name': 'Wendy Joy Roxas', 'avatar': 'W'},
    {'name': 'Xavier Cole Bautista', 'avatar': 'X'},
    {'name': 'Yvonne Mae Alonzo', 'avatar': 'Y'},
    {'name': 'Zachary Sean Ocampo', 'avatar': 'Z'},
    {'name': 'Angelica Ruth Corpuz', 'avatar': 'A'},
    {'name': 'Benjamin Thomas Salazar', 'avatar': 'B'},
    {'name': 'Chloe Danielle Ibáñez', 'avatar': 'C'},
    {'name': 'Dominic Rafael David', 'avatar': 'D'},
  ];

  Widget _buildTeacherDrawer(BuildContext context) {
    return Drawer(
      child: Container(
        color: const Color(0xFFD34426),
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
                    Navigator.pop(context);
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
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
                              '${_students.length}',
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
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        radius: 20,
                        backgroundColor: const Color(0xFFFEF3C7),
                        child: Text(
                          'TM',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFFD97706),
                          ),
                        ),
                      ),
                      title: Text(
                        'Ted Mosby',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
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
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _students.length,
                      separatorBuilder: (context, index) => const Divider(color: Color(0xFFF1F5F9), height: 1),
                      itemBuilder: (context, index) {
                        final student = _students[index];
                        final String name = student['name']!;
                        final String initial = student['avatar']!;

                        final List<Color> avatarColors = [
                          const Color(0xFFEFF6FF),
                          const Color(0xFFFDF4F2),
                          const Color(0xFFFEF3C7),
                          const Color(0xFFECFDF5),
                          const Color(0xFFF5F3FF),
                        ];
                        final List<Color> textColors = [
                          const Color(0xFF1D4ED8),
                          const Color(0xFFD34426),
                          const Color(0xFFD97706),
                          const Color(0xFF059669),
                          const Color(0xFF7C3AED),
                        ];
                        final int colorIdx = index % avatarColors.length;

                        return InkWell(
                          onTap: () {
                            Feedback.forTap(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => TeacherStudentDetailsPage(
                                  studentName: name,
                                  avatarInitial: initial,
                                ),
                              ),
                            );
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10.0, horizontal: 4.0),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundColor: avatarColors[colorIdx],
                                  child: Text(
                                    initial,
                                    style: GoogleFonts.inter(
                                      fontWeight: FontWeight.bold,
                                      color: textColors[colorIdx],
                                      fontSize: 15,
                                    ),
                                  ),
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
