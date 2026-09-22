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
  final String language;
  final String assessmentType;

  const TeacherReadingLevelsPage({
    super.key,
    this.initialLevel = 'All',
    this.className = '',
    this.language = 'Filipino',
    this.assessmentType = 'Oral Reading',
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

  String _getProfileLevelForStudent(Map<String, dynamic> s) {
    final isEng = widget.language.toLowerCase().contains('eng');
    final isOral = widget.assessmentType.toLowerCase().contains('oral');
    final isSilent = widget.assessmentType.toLowerCase().contains('silent');

    dynamic val;
    if (isEng) {
      if (isOral) {
        val = s['engOralProfile'] ?? s['eng_oral_profile_label'];
      } else if (isSilent) {
        val = s['engSilentProfile'] ?? s['eng_silent_profile_label'];
      } else {
        val = s['engListeningProfile'] ?? s['eng_listening_profile_label'];
      }
    } else {
      if (isOral) {
        val = s['filOralProfile'] ?? s['fil_oral_profile_label'];
      } else if (isSilent) {
        val = s['filSilentProfile'] ?? s['fil_silent_profile_label'];
      } else {
        val = s['filListeningProfile'] ?? s['fil_listening_profile_label'];
      }
    }

    if (val != null && val.toString().trim().isNotEmpty) {
      return val.toString().trim();
    }

    return (s['readingLevel'] ??
            s['level'] ??
            s['reading_level'] ??
            s['current_profile_label'] ??
            s['gstResult'] ??
            s['gst_result'] ??
            '')
        .toString()
        .trim();
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    final frustList = <Map<String, dynamic>>[];
    final instList = <Map<String, dynamic>>[];
    final indepList = <Map<String, dynamic>>[];
    final pendingList = <Map<String, dynamic>>[];

    for (var s in _students) {
      final lvl = _getProfileLevelForStudent(s).toLowerCase();
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
                  ? _buildSkeletonLoading()
                  : RefreshIndicator(
                      onRefresh: _fetchStudents,
                      color: const Color(0xFFD34426),
                      child: SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 0. Primary Assessment Title Header
                          Text(
                            '${widget.language} · ${widget.assessmentType}',
                            style: GoogleFonts.inter(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                              letterSpacing: -0.4,
                            ),
                          ),
                          const SizedBox(height: 12),

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

                          // 2. Phil-IRI Level Filter Selector (Sleek Bottom Sheet)
                          InkWell(
                            onTap: () {
                              Feedback.forTap(context);
                              _showFilterBottomSheet(
                                context,
                                totalCount,
                                frustList.length,
                                instList.length,
                                indepList.length,
                                pendingList.length,
                              );
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: _getCurrentSelectedItemWidget(
                                      totalCount,
                                      frustList.length,
                                      instList.length,
                                      indepList.length,
                                      pendingList.length,
                                    ),
                                  ),
                                  const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF1E293B)),
                                ],
                              ),
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

  Widget _buildSkeletonLoading() {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 180,
            height: 24,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(6),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 50,
                height: 38,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            height: 38,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(100),
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: 200,
            height: 20,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(height: 12),
          for (int i = 0; i < 4; i++) ...[
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              padding: const EdgeInsets.all(14.0),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 120,
                          height: 14,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          width: 80,
                          height: 10,
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 70,
                    height: 22,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(100),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }

  void _showFilterBottomSheet(
    BuildContext context,
    int total,
    int frust,
    int inst,
    int indep,
    int pending,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (bottomSheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 38,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Filter Reading Level',
                      style: GoogleFonts.inter(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(bottomSheetContext),
                      icon: const Icon(Icons.close_rounded, size: 20, color: Colors.grey),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildBottomSheetOption(bottomSheetContext, 'All', 'All Levels', total, const Color(0xFF1B64D8)),
                _buildBottomSheetOption(bottomSheetContext, 'Frustration', 'Frustration', frust, const Color(0xFFD34426)),
                _buildBottomSheetOption(bottomSheetContext, 'Instructional', 'Instructional', inst, const Color(0xFFD97706)),
                _buildBottomSheetOption(bottomSheetContext, 'Independent', 'Independent', indep, const Color(0xFF059669)),
                if (pending > 0)
                  _buildBottomSheetOption(bottomSheetContext, 'Pending', 'Pending Evaluation', pending, Colors.grey[600]!),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBottomSheetOption(
    BuildContext context,
    String value,
    String label,
    int count,
    Color color,
  ) {
    final bool isSelected = _selectedFilter == value;

    return InkWell(
      onTap: () {
        Feedback.forTap(context);
        setState(() {
          _selectedFilter = value;
        });
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        margin: const EdgeInsets.symmetric(vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.08) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color.withValues(alpha: 0.3) : Colors.grey.withValues(alpha: 0.15),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  color: isSelected ? color : const Color(0xFF1E293B),
                ),
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                '$count',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 10),
              Icon(Icons.check_circle_rounded, color: color, size: 18),
            ],
          ],
        ),
      ),
    );
  }

  Widget _getCurrentSelectedItemWidget(int total, int frust, int inst, int indep, int pending) {
    switch (_selectedFilter) {
      case 'Frustration':
        return _buildDropdownItem('Frustration', frust, const Color(0xFFD34426));
      case 'Instructional':
        return _buildDropdownItem('Instructional', inst, const Color(0xFFD97706));
      case 'Independent':
        return _buildDropdownItem('Independent', indep, const Color(0xFF059669));
      case 'Pending':
        return _buildDropdownItem('Pending Evaluation', pending, Colors.grey[600]!);
      case 'All':
      default:
        return _buildDropdownItem('All Levels', total, const Color(0xFF1B64D8));
    }
  }

  Widget _buildDropdownItem(String label, int count, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF1E293B),
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(100),
          ),
          child: Text(
            '$count',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
      ],
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
                  studentData: student,
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
}
