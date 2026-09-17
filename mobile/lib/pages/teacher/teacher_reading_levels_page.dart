import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/pages/teacher/teacher_student_details_page.dart';
import 'package:salintinig/services/auth_service.dart';
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
  RealtimeChannel? _realtimeChannel;
  bool _isLoading = true;
  List<Map<String, dynamic>> _students = [];

  @override
  void initState() {
    super.initState();
    _selectedFilter = widget.initialLevel;

    final cached = AuthService.cachedClassStudents;
    if (cached != null && cached.isNotEmpty) {
      _students = cached;
      _isLoading = false;
    }
    _fetchStudents();
    _setupRealtimeSubscription();
  }

  void _setupRealtimeSubscription() {
    try {
      final client = Supabase.instance.client;
      _realtimeChannel = client
          .channel('public:reading_levels_updates')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'reading_profiles',
            callback: (payload) => _fetchStudents(),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'assessments',
            callback: (payload) => _fetchStudents(),
          )
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'students',
            callback: (payload) => _fetchStudents(),
          )
          .subscribe();
    } catch (e) {
      debugPrint('Realtime subscription notice in Reading Levels: $e');
    }
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
      debugPrint('Error fetching class students in Reading Levels page: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    if (_realtimeChannel != null) {
      try {
        Supabase.instance.client.removeChannel(_realtimeChannel!);
      } catch (_) {}
    }
    _searchController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> _getFilteredList(List<Map<String, dynamic>> list) {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) return list;
    return list.where((s) {
      final rawName = (s['name'] as String?)?.trim() ?? '';
      final first = (s['firstName'] ?? s['first_name'] ?? '').toString().trim();
      final middle = (s['middleName'] ?? s['middle_name'] ?? '').toString().trim();
      final last = (s['lastName'] ?? s['last_name'] ?? '').toString().trim();
      final full = '$first $middle $last'.trim().toLowerCase();

      return rawName.toLowerCase().contains(query) || full.contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    final frustList = <Map<String, dynamic>>[];
    final instList = <Map<String, dynamic>>[];
    final indepList = <Map<String, dynamic>>[];
    final pendingList = <Map<String, dynamic>>[];

    for (var s in _students) {
      final lvl = (s['readingLevel'] ?? s['level'] ?? s['reading_level'] ?? s['current_profile_label'] ?? '').toString().toLowerCase();
      if (lvl.contains('frustrat')) {
        frustList.add(s);
      } else if (lvl.contains('instruct')) {
        instList.add(s);
      } else if (lvl.contains('independ')) {
        indepList.add(s);
      } else {
        pendingList.add(s);
      }
    }

    final filteredFrust = _getFilteredList(frustList);
    final filteredInst = _getFilteredList(instList);
    final filteredIndep = _getFilteredList(indepList);
    final filteredPending = _getFilteredList(pendingList);

    final showFrust = (_selectedFilter == 'All' || _selectedFilter == 'Frustration') && filteredFrust.isNotEmpty;
    final showInst = (_selectedFilter == 'All' || _selectedFilter == 'Instructional') && filteredInst.isNotEmpty;
    final showIndep = (_selectedFilter == 'All' || _selectedFilter == 'Independent') && filteredIndep.isNotEmpty;
    final showPending = (_selectedFilter == 'All' || _selectedFilter == 'Pending') && filteredPending.isNotEmpty;

    final int totalCount = _students.length;

    return Scaffold(
      backgroundColor: softBg,
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with < Back button on left
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Row(
                children: [
                  IconButton(
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
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 22, color: Colors.black),
                  ),
                  Expanded(
                    child: Text(
                      'Reading Level Classification',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        color: Colors.black,
                      ),
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: Color(0xFFD34426)),
                    )
                  : RefreshIndicator(
                      onRefresh: _fetchStudents,
                      color: const Color(0xFFD34426),
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
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
                                _buildFilterChip('Frustration', frustList.length, const Color(0xFFD34426)),
                                const SizedBox(width: 8),
                                _buildFilterChip('Instructional', instList.length, const Color(0xFFD97706)),
                                const SizedBox(width: 8),
                                _buildFilterChip('Independent', indepList.length, const Color(0xFF059669)),
                                if (pendingList.isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  _buildFilterChip('Pending', pendingList.length, Colors.grey[600]),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          // 3. Search Bar
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
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? GestureDetector(
                                        onTap: () {
                                          _searchController.clear();
                                          setState(() {});
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
                          const SizedBox(height: 24),

                          // 4. Section: Frustration Level Students
                          if (showFrust) ...[
                            _buildSectionHeader(
                              title: 'Frustrational Level Students',
                              count: '${filteredFrust.length}',
                              accentColor: const Color(0xFFD34426),
                            ),
                            const SizedBox(height: 12),
                            _buildStudentGroupList(filteredFrust, const Color(0xFFD34426), const Color(0xFFFDF4F2), const Color(0xFFFEE2E2), 'Frustrational'),
                            const SizedBox(height: 28),
                          ],

                          // 5. Section: Instructional Level Students
                          if (showInst) ...[
                            _buildSectionHeader(
                              title: 'Instructional Level Students',
                              count: '${filteredInst.length}',
                              accentColor: const Color(0xFFD97706),
                            ),
                            const SizedBox(height: 12),
                            _buildStudentGroupList(filteredInst, const Color(0xFFD97706), const Color(0xFFFEFCE8), const Color(0xFFFEF08A), 'Instructional'),
                            const SizedBox(height: 28),
                          ],

                          // 6. Section: Independent Level Students
                          if (showIndep) ...[
                            _buildSectionHeader(
                              title: 'Independent Level Students',
                              count: '${filteredIndep.length}',
                              accentColor: const Color(0xFF059669),
                            ),
                            const SizedBox(height: 12),
                            _buildStudentGroupList(filteredIndep, const Color(0xFF059669), const Color(0xFFECFDF5), const Color(0xFFA7F3D0), 'Independent'),
                            const SizedBox(height: 28),
                          ],

                          // 7. Section: Pending Evaluation Students
                          if (showPending) ...[
                            _buildSectionHeader(
                              title: 'Pending Evaluation Students',
                              count: '${filteredPending.length}',
                              accentColor: Colors.grey[600]!,
                            ),
                            const SizedBox(height: 12),
                            _buildStudentGroupList(filteredPending, Colors.grey[700]!, Colors.grey[100]!, Colors.grey[300]!, 'Pending Evaluation'),
                            const SizedBox(height: 28),
                          ],

                          if (!showFrust && !showInst && !showIndep && !showPending) ...[
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 40.0),
                              child: Center(
                                child: Text(
                                  'No students found.',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ),
                          ],
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
    String levelLabel,
  ) {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: students.length,
      separatorBuilder: (context, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final student = students[index];
        final rawName = (student['name'] as String?)?.trim();
        final first = (student['firstName'] as String?)?.trim() ?? '';
        final last = (student['lastName'] as String?)?.trim() ?? '';
        final String name = (rawName != null && rawName.isNotEmpty)
            ? rawName
            : ('$first $last').trim().isNotEmpty
                ? ('$first $last').trim()
                : 'Student ${index + 1}';

        final String? avatarUrl = (student['profileImage'] ?? student['profile_image'] ?? student['avatarUrl'])?.toString();
        final wpsVal = student['readingSpeed'] ?? student['wps'] ?? student['reading_speed_wpm'];
        final accVal = student['accuracy'] ?? student['oralAccuracy'] ?? student['oral_accuracy'];

        final String metricsText = (wpsVal != null || accVal != null)
            ? '${wpsVal ?? 0} wps • ${accVal ?? 0}% Accuracy'
            : 'Pending Evaluation';

        return InkWell(
          onTap: () {
            Feedback.forTap(context);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => TeacherStudentDetailsPage(
                  studentName: name,
                  level: levelLabel,
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
                  imageUrl: avatarUrl,
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
                        metricsText,
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
                    levelLabel,
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
