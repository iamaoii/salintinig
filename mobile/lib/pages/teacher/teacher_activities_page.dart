import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/pages/teacher/assign_phil_iri_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';

class TeacherActivitiesPage extends StatefulWidget {
  final String className;

  const TeacherActivitiesPage({super.key, this.className = 'Grade 4 - FYANG'});

  @override
  State<TeacherActivitiesPage> createState() => _TeacherActivitiesPageState();
}

class _TeacherActivitiesPageState extends State<TeacherActivitiesPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Tab State: 'phil-iri' or 'practice'
  String _activeTab = 'phil-iri';

  // Pagination & Search State
  int _currentPage = 1;
  final int _itemsPerPage = 4;

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _assessmentFilter = 'all'; // 'all', 'oral', 'listening', 'silent'

  // Loading & Data States
  bool _isLoading = false;
  int _notificationsCount = 3;
  final List<Map<String, String>> _notifications = [
    {'title': 'Activity 1 completed', 'time': '5 mins ago', 'desc': 'Juan Dela Cruz just completed Pronunciation Challenge.'},
    {'title': 'Pending evaluation', 'time': '1 hour ago', 'desc': '3 students are waiting for oral reading grading.'},
    {'title': 'Low score alert', 'time': '2 hours ago', 'desc': 'Maria Clara scored Frustration level on Form 1A.'},
  ];
  List<Map<String, dynamic>> _philIriActivities = [];
  List<Map<String, dynamic>> _pendingReviews = [];

  // Default Mock Practice Activities
  final List<Map<String, dynamic>> _practiceActivities = [
    {
      'id': 'practice_1',
      'title': 'Pronunciation Challenge',
      'subtitle': 'Speech & Phonetics Game',
      'mode': 'practice',
      'assessmentType': 'oral',
      'period': 'practice',
      'language': 'fil',
      'badge': 'Practice',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 28,
      'pendingCount': 7,
      'totalAssigned': 35,
    },
    {
      'id': 'practice_2',
      'title': 'Vocabulary Matching Game',
      'subtitle': 'Word & Meaning Pair Game',
      'mode': 'practice',
      'assessmentType': 'silent',
      'period': 'practice',
      'language': 'fil',
      'badge': 'Practice',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 25,
      'pendingCount': 10,
      'totalAssigned': 35,
    },
    {
      'id': 'practice_3',
      'title': 'Sentence Reading & Quiz',
      'subtitle': 'Fluency & Comprehension Game',
      'mode': 'practice',
      'assessmentType': 'listening',
      'period': 'practice',
      'language': 'eng',
      'badge': 'Practice',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 30,
      'pendingCount': 5,
      'totalAssigned': 35,
    },
  ];

  // Default Mock Phil-IRI Activities (used if backend returns empty)
  final List<Map<String, dynamic>> _defaultPhilIriActivities = [
    {
      'id': 'phil_iri_gst_1',
      'title': 'Phil-IRI Group Screening Test (GST)',
      'subtitle': 'Form 1A & 1B Class Screening',
      'mode': 'phil-iri',
      'type': 'silent',
      'assessmentType': 'silent',
      'period': 'GST',
      'language': 'fil',
      'badge': 'Phil - IRI',
      'status': 'closed',
      'activityStatus': 'closed',
      'doneCount': 35,
      'pendingCount': 0,
      'totalAssigned': 35,
    },
    {
      'id': 'phil_iri_ort_1',
      'title': 'Phil-IRI Pre-Test Oral Reading - Tagalog (Set A)',
      'subtitle': 'Form 3A Graded Passage Evaluation',
      'mode': 'phil-iri',
      'type': 'oral',
      'assessmentType': 'oral',
      'period': 'Pre-Test',
      'language': 'fil',
      'badge': 'Phil - IRI',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 12,
      'pendingCount': 23,
      'totalAssigned': 35,
    },
    {
      'id': 'phil_iri_ort_2',
      'title': 'Phil-IRI Pre-Test Listening Comprehension (Set B)',
      'subtitle': 'Form 3B Graded Listening Evaluation',
      'mode': 'phil-iri',
      'type': 'listening',
      'assessmentType': 'listening',
      'period': 'Pre-Test',
      'language': 'fil',
      'badge': 'Phil - IRI',
      'status': 'open',
      'activityStatus': 'open',
      'doneCount': 5,
      'pendingCount': 30,
      'totalAssigned': 35,
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchActivitiesData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchActivitiesData() async {
    setState(() => _isLoading = true);

    try {
      final res = await ApiService.get(
        '/teacher/assessments/phil-iri-activities',
      );
      if (res.success && res.data != null && res.data['activities'] is List) {
        final List raw = res.data['activities'];
        setState(() {
          _philIriActivities = raw
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        });
      }
    } catch (_) {}

    try {
      final pRes = await ApiService.get('/teacher/assessments/pending-reviews');
      if (pRes.success &&
          pRes.data != null &&
          pRes.data['pendingReviews'] is List) {
        final List pRaw = pRes.data['pendingReviews'];
        setState(() {
          _pendingReviews = pRaw
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        });
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _currentRawActivities {
    if (_activeTab == 'practice') {
      return _practiceActivities;
    }
    return _philIriActivities.isNotEmpty
        ? _philIriActivities
        : _defaultPhilIriActivities;
  }

  List<Map<String, dynamic>> get _filteredActivities {
    return _currentRawActivities.where((act) {
      final title = (act['title'] ?? '').toString().toLowerCase();
      final subtitle = (act['subtitle'] ?? '').toString().toLowerCase();
      final matchesSearch =
          _searchQuery.isEmpty ||
          title.contains(_searchQuery.toLowerCase()) ||
          subtitle.contains(_searchQuery.toLowerCase());

      final typeStr = (act['assessmentType'] ?? act['type'] ?? '')
          .toString()
          .toLowerCase();
      bool matchesFilter = true;
      if (_assessmentFilter == 'oral') {
        matchesFilter = typeStr.contains('oral');
      } else if (_assessmentFilter == 'listening') {
        matchesFilter = typeStr.contains('listening');
      } else if (_assessmentFilter == 'silent') {
        matchesFilter = typeStr.contains('silent');
      }

      return matchesSearch && matchesFilter;
    }).toList();
  }

  int get _totalPages {
    if (_filteredActivities.isEmpty) return 1;
    return (_filteredActivities.length / _itemsPerPage).ceil();
  }

  List<Map<String, dynamic>> get _paginatedActivities {
    if (_filteredActivities.isEmpty) return [];
    final safePage = _currentPage.clamp(1, _totalPages);
    final startIndex = (safePage - 1) * _itemsPerPage;
    final endIndex = (startIndex + _itemsPerPage).clamp(
      0,
      _filteredActivities.length,
    );
    return _filteredActivities.sublist(startIndex, endIndex);
  }

  Future<void> _toggleActivityStatus(Map<String, dynamic> activity) async {
    Feedback.forTap(context);
    final String actId = (activity['id'] ?? '').toString();
    final bool isClosed =
        activity['activityStatus'] == 'closed' ||
        activity['status'] == 'closed';
    final String newStatus = isClosed ? 'open' : 'closed';

    try {
      final res = await ApiService.put('/teacher/assessments/toggle-status', {
        'activityId': actId,
        'status': newStatus,
      });

      if (res.success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Assessment status changed to ${newStatus.toUpperCase()}.',
            ),
            backgroundColor: const Color(0xFF059669),
            behavior: SnackBarBehavior.floating,
          ),
        );
        _fetchActivitiesData();
      } else {
        setState(() {
          activity['activityStatus'] = newStatus;
          activity['status'] = newStatus;
        });
      }
    } catch (_) {
      setState(() {
        activity['activityStatus'] = newStatus;
        activity['status'] = newStatus;
      });
    }
  }

  Future<void> _deleteActivity(Map<String, dynamic> activity) async {
    Feedback.forTap(context);
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Delete Assessment',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            color: Colors.red,
          ),
        ),
        content: Text(
          'Are you sure you want to delete "${activity['title']}"? This cannot be undone.',
          style: GoogleFonts.inter(fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx, false),
            child: Text(
              'Cancel',
              style: GoogleFonts.inter(
                color: Colors.grey[700],
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogCtx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(
              'Delete',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final String actId = (activity['id'] ?? '').toString();
      try {
        await ApiService.delete('/teacher/assessments/$actId');
      } catch (_) {}

      setState(() {
        _philIriActivities.removeWhere((a) => a['id'] == actId);
        _practiceActivities.removeWhere((a) => a['id'] == actId);
        _defaultPhilIriActivities.removeWhere((a) => a['id'] == actId);
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Assessment deleted successfully.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showActivityDetailSheet(Map<String, dynamic> activity) {
    Feedback.forTap(context);
    final String title = activity['title'] ?? 'Assessment Details';
    final String typeStr =
        (activity['assessmentType'] ?? activity['type'] ?? 'oral')
            .toString()
            .toUpperCase();
    final int done =
        int.tryParse(activity['doneCount']?.toString() ?? '0') ?? 0;
    final int pending =
        int.tryParse(activity['pendingCount']?.toString() ?? '0') ?? 0;
    final int total =
        int.tryParse(activity['totalAssigned']?.toString() ?? '0') ??
        (done + pending);
    final bool isOpen =
        activity['activityStatus'] != 'closed' &&
        activity['status'] != 'closed';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => Container(
        decoration: const BoxDecoration(
          color: Color(0xFFFCFAF7),
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 20,
        ),
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Iconify(
                        Ph.chart_pie_slice,
                        color: Color(0xFFD34426),
                        size: 22,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Activity Overview',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(sheetCtx),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Overview Stat Card (Web Design Concept)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[700],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '$total',
                              style: GoogleFonts.inter(
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                color: Colors.black,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Total\nStudents',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey[500],
                                height: 1.1,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 4,
                                  height: 14,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF00A652),
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '$done',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Done',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  width: 4,
                                  height: 14,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[300],
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  '$pending',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Not Done',
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 3 Metric Containers Grid (Total Assigned, Completed, Pending)
                    Row(
                      children: [
                        // Container 1: Total Assigned
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFBFDBFE),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$total',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFF1E40AF),
                                      ),
                                    ),
                                    const Iconify(
                                      Ph.users_three,
                                      color: Color(0xFF1D4ED8),
                                      size: 16,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Total\nAssigned',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF1E3A8A),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Container 2: Completed Students
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFA7F3D0),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$done',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFF047857),
                                      ),
                                    ),
                                    const Iconify(
                                      Ph.check_circle,
                                      color: Color(0xFF059669),
                                      size: 16,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Completed\nStudents',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF065F46),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        // Container 3: Pending Evaluation
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFFDE68A),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      '$pending',
                                      style: GoogleFonts.inter(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: const Color(0xFFB45309),
                                      ),
                                    ),
                                    const Iconify(
                                      Ph.clock,
                                      color: Color(0xFFD97706),
                                      size: 16,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Pending\nEvaluation',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF92400E),
                                    height: 1.1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Last Update: Active Assessment Session',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontStyle: FontStyle.italic,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Instructions & Controls Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: isOpen
                                ? const Color(0xFFDCFCE7)
                                : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(
                              color: isOpen
                                  ? const Color(0xFF86EFAC)
                                  : const Color(0xFFCBD5E1),
                            ),
                          ),
                          child: Text(
                            isOpen ? 'STATUS: OPEN' : 'STATUS: CLOSED',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: isOpen
                                  ? const Color(0xFF166534)
                                  : Colors.grey[700],
                            ),
                          ),
                        ),
                        Text(
                          'Type: $typeStr',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 10),
                    Text(
                      'Instructions:',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '1. Students complete oral, listening, or silent assessment in student app.\n2. Automated AI computes accuracy %, WPM, and comprehension level.\n3. Teacher verifies miscues for oral reading tests.',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.grey[700],
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Secondary Actions Grid (Toggle & Delete)
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(sheetCtx);
                        _toggleActivityStatus(activity);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isOpen
                            ? const Color(0xFFD97706)
                            : const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: Icon(
                        isOpen ? Icons.lock_outline : Icons.lock_open,
                        size: 16,
                      ),
                      label: Text(
                        isOpen ? 'Close Activity' : 'Re-Open Activity',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(sheetCtx);
                        _deleteActivity(activity);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      icon: const Icon(Icons.delete_outline_rounded, size: 16),
                      label: Text(
                        'Delete Activity',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  void _showNotificationCenter() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(sheetCtx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Iconify(Ph.bell_bold, color: Color(0xFFD34426), size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'Notifications',
                      style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () {
                    setState(() => _notificationsCount = 0);
                    Navigator.pop(sheetCtx);
                  },
                  child: Text('Mark all read', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFFD34426))),
                ),
              ],
            ),
            const SizedBox(height: 14),
            ..._notifications.map((notif) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFCFAF7),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Center(child: Iconify(Ph.bell_ringing, color: Color(0xFFD34426), size: 18)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(notif['title']!, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold)),
                            Text(notif['time']!, style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[500])),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(notif['desc']!, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[700])),
                      ],
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Future<void> _navigateToAssignPage() async {
    Feedback.forTap(context);
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => AssignPhilIriPage(className: widget.className),
      ),
    );
    if (result == true) {
      _fetchActivitiesData();
    }
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: const TeacherSidebarDrawer(activeRoute: 'Class Activities'),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _activeTab == 'phil-iri'
            ? _navigateToAssignPage
            : () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Practice activity creation opened...'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
        backgroundColor: const Color(0xFFD34426),
        foregroundColor: Colors.white,
        elevation: 4,
        icon: const Icon(Icons.add_rounded, size: 24),
        label: Text(
          _activeTab == 'phil-iri' ? 'Assign Phil-IRI' : 'Add Practice',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with Hamburger on left
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 16.0,
                vertical: 12.0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      _scaffoldKey.currentState?.openDrawer();
                    },
                    icon: const Iconify(Ph.list, size: 28, color: Colors.black),
                  ),
                  Text(
                    'Activities',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      IconButton(
                        onPressed: _showNotificationCenter,
                        icon: const Iconify(Ph.bell, size: 28, color: Colors.black),
                      ),
                      if (_notificationsCount > 0)
                        Positioned(
                          right: 6,
                          top: 6,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 16,
                              minHeight: 16,
                            ),
                            child: Text(
                              '$_notificationsCount',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),

            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchActivitiesData,
                color: const Color(0xFFD34426),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 8.0,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Mode Tabs (Matching Web Concept)
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  Feedback.forTap(context);
                                  setState(() {
                                    _activeTab = 'phil-iri';
                                    _currentPage = 1;
                                  });
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _activeTab == 'phil-iri'
                                        ? Colors.white
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: _activeTab == 'phil-iri'
                                        ? [
                                            BoxShadow(
                                              color: Colors.black.withValues(
                                                alpha: 0.05,
                                              ),
                                              blurRadius: 4,
                                              offset: const Offset(0, 2),
                                            ),
                                          ]
                                        : [],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Iconify(
                                        PhIcons.flagPennantBold,
                                        color: _activeTab == 'phil-iri'
                                            ? const Color(0xFFD34426)
                                            : Colors.grey[600],
                                        size: 18,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Phil-IRI Assessments',
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: _activeTab == 'phil-iri'
                                              ? const Color(0xFFD34426)
                                              : Colors.grey[700],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  Feedback.forTap(context);
                                  setState(() {
                                    _activeTab = 'practice';
                                    _currentPage = 1;
                                  });
                                },
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 10,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _activeTab == 'practice'
                                        ? Colors.white
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: _activeTab == 'practice'
                                        ? [
                                            BoxShadow(
                                              color: Colors.black.withValues(
                                                alpha: 0.05,
                                              ),
                                              blurRadius: 4,
                                              offset: const Offset(0, 2),
                                            ),
                                          ]
                                        : [],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Iconify(
                                        PhIcons.flagPennantBold,
                                        color: _activeTab == 'practice'
                                            ? const Color(0xFFD34426)
                                            : Colors.grey[600],
                                        size: 18,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Practice Mode',
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: _activeTab == 'practice'
                                              ? const Color(0xFFD34426)
                                              : Colors.grey[700],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Pending Reviews Banner Alert (Matching Web concept)
                      if (_activeTab == 'phil-iri' &&
                          _pendingReviews.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFFDE68A)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Iconify(
                                    Ph.microphone,
                                    color: Color(0xFFB45309),
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '${_pendingReviews.length} Oral Assessment(s) Awaiting Review',
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF92400E),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 6,
                                children: _pendingReviews.map((rev) {
                                  final name =
                                      rev['studentName'] ??
                                      rev['name'] ??
                                      'Student';
                                  final set = rev['passageSet'] ?? 'Set A';
                                  return Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: const Color(0xFFFCD34D),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          name,
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 6,
                                            vertical: 2,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFEF3C7),
                                            borderRadius: BorderRadius.circular(
                                              4,
                                            ),
                                          ),
                                          child: Text(
                                            set,
                                            style: GoogleFonts.inter(
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFFB45309),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Search & Filter Row
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => setState(() {
                            _searchQuery = val;
                            _currentPage = 1;
                          }),
                          style: GoogleFonts.inter(fontSize: 13),
                          decoration: InputDecoration(
                            icon: const Icon(
                              Icons.search_rounded,
                              size: 20,
                              color: Colors.grey,
                            ),
                            hintText: 'Search assessment activity...',
                            hintStyle: GoogleFonts.inter(
                              fontSize: 13,
                              color: Colors.grey[400],
                            ),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Assessment Category Filter Chips
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        child: Row(
                          children:
                              [
                                {'id': 'all', 'label': 'All'},
                                {'id': 'oral', 'label': 'Oral Reading'},
                                {'id': 'listening', 'label': 'Listening'},
                                {'id': 'silent', 'label': 'Silent Reading'},
                              ].map((f) {
                                final isSelected = _assessmentFilter == f['id'];
                                return Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: ChoiceChip(
                                    label: Text(
                                      f['label']!,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected
                                            ? Colors.white
                                            : Colors.grey[700],
                                      ),
                                    ),
                                    selected: isSelected,
                                    selectedColor: const Color(0xFFD34426),
                                    backgroundColor: Colors.white,
                                    side: BorderSide(
                                      color: isSelected
                                          ? const Color(0xFFD34426)
                                          : const Color(0xFFE2E8F0),
                                    ),
                                    onSelected: (_) {
                                      Feedback.forTap(context);
                                      setState(() {
                                        _assessmentFilter = f['id']!;
                                        _currentPage = 1;
                                      });
                                    },
                                  ),
                                );
                              }).toList(),
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Section Title & Activities List
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _activeTab == 'phil-iri'
                                ? 'Phil-IRI Assessments'
                                : 'Practice Activities',
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: Colors.black,
                            ),
                          ),
                          Text(
                            '${_filteredActivities.length} items',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Activities List / Loading / Empty State
                      if (_isLoading)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 36),
                          child: Center(
                            child: CircularProgressIndicator(
                              color: Color(0xFFD34426),
                            ),
                          ),
                        )
                      else if (_filteredActivities.isEmpty)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Column(
                            children: [
                              Iconify(
                                PhIcons.flagPennantBold,
                                color: const Color(0xFFD34426),
                                size: 40,
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'No Assessments Found',
                                style: GoogleFonts.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _searchQuery.isNotEmpty
                                    ? 'No activities match "$_searchQuery".'
                                    : 'Tap the button below to assign a new Phil-IRI assessment to your class.',
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: _navigateToAssignPage,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFD34426),
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                icon: const Icon(Icons.add, size: 18),
                                label: Text(
                                  'Assign Phil-IRI Set Now',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      else ...[
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _paginatedActivities.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 14),
                          itemBuilder: (context, index) {
                            final act = _paginatedActivities[index];
                            final String title = act['title'] ?? 'Assessment';
                            final String subtitle = act['subtitle'] ?? '';
                            final String typeStr =
                                (act['assessmentType'] ?? act['type'] ?? 'oral')
                                    .toString()
                                    .toLowerCase();
                            final bool isOpen =
                                act['activityStatus'] != 'closed' &&
                                act['status'] != 'closed';
                            final int done =
                                int.tryParse(
                                  act['doneCount']?.toString() ?? '0',
                                ) ??
                                0;
                            final int pending =
                                int.tryParse(
                                  act['pendingCount']?.toString() ?? '0',
                                ) ??
                                0;

                            String iconSvg = PhIcons.userSoundBold;
                            Color iconBg = const Color(0xFFDBEAFE);
                            Color iconColor = const Color(0xFF1D4ED8);

                            if (typeStr.contains('listening')) {
                              iconSvg = PhIcons.earBold;
                              iconBg = const Color(0xFFFEF3C7);
                              iconColor = const Color(0xFFB45309);
                            } else if (typeStr.contains('silent')) {
                              iconSvg = PhIcons.bookOpenBold;
                              iconBg = const Color(0xFFD1FAE5);
                              iconColor = const Color(0xFF047857);
                            } else if (typeStr.contains('practice')) {
                              iconSvg = PhIcons.puzzlePieceBold;
                              iconBg = const Color(0xFFF3E8FF);
                              iconColor = const Color(0xFF7E22CE);
                            }

                            return Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: const Color(0xFFE2E8F0),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Type Icon
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: iconBg,
                                          borderRadius: BorderRadius.circular(
                                            14,
                                          ),
                                        ),
                                        child: Center(
                                          child: Iconify(
                                            iconSvg,
                                            color: iconColor,
                                            size: 22,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      // Title & Details
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              title,
                                              style: GoogleFonts.inter(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w800,
                                                color: Colors.black,
                                              ),
                                            ),
                                            if (subtitle.isNotEmpty) ...[
                                              const SizedBox(height: 2),
                                              Text(
                                                subtitle,
                                                style: GoogleFonts.inter(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w500,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                            ],
                                            const SizedBox(height: 6),
                                            Row(
                                              children: [
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 2,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: isOpen
                                                        ? const Color(
                                                            0xFFDCFCE7,
                                                          )
                                                        : const Color(
                                                            0xFFF1F5F9,
                                                          ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          6,
                                                        ),
                                                  ),
                                                  child: Text(
                                                    isOpen ? 'OPEN' : 'CLOSED',
                                                    style: GoogleFonts.inter(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      color: isOpen
                                                          ? const Color(
                                                              0xFF15803D,
                                                            )
                                                          : Colors.grey[600],
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 2,
                                                      ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFF1F5F9,
                                                    ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          6,
                                                        ),
                                                  ),
                                                  child: Text(
                                                    typeStr.toUpperCase(),
                                                    style: GoogleFonts.inter(
                                                      fontSize: 10,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                      color: Colors.grey[700],
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),
                                  const Divider(
                                    height: 1,
                                    color: Color(0xFFF1F5F9),
                                  ),
                                  const SizedBox(height: 12),

                                  // Footer Stats & Actions
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          const Icon(
                                            Icons.check_circle_rounded,
                                            color: Color(0xFF059669),
                                            size: 16,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '$done',
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.black,
                                            ),
                                          ),
                                          Text(
                                            ' Done',
                                            style: GoogleFonts.inter(
                                              fontSize: 11,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          const Icon(
                                            Icons.access_time_rounded,
                                            color: Color(0xFFD97706),
                                            size: 16,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '$pending',
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w800,
                                              color: Colors.black,
                                            ),
                                          ),
                                          Text(
                                            ' Pending',
                                            style: GoogleFonts.inter(
                                              fontSize: 11,
                                              color: Colors.grey[600],
                                            ),
                                          ),
                                        ],
                                      ),

                                      // View Details Button
                                      ElevatedButton(
                                        onPressed: () =>
                                            _showActivityDetailSheet(act),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(
                                            0xFFD34426,
                                          ),
                                          foregroundColor: Colors.white,
                                          elevation: 0,
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 14,
                                            vertical: 6,
                                          ),
                                          minimumSize: Size.zero,
                                          tapTargetSize:
                                              MaterialTapTargetSize.shrinkWrap,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              100,
                                            ),
                                          ),
                                        ),
                                        child: Text(
                                          'View Details',
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                        if (_totalPages > 1) ...[
                          const SizedBox(height: 18),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              IconButton(
                                onPressed: _currentPage > 1
                                    ? () {
                                        Feedback.forTap(context);
                                        setState(() => _currentPage--);
                                      }
                                    : null,
                                icon: Icon(
                                  Icons.chevron_left_rounded,
                                  color: _currentPage > 1
                                      ? const Color(0xFFD34426)
                                      : Colors.grey[300],
                                  size: 26,
                                ),
                              ),
                              const SizedBox(width: 4),
                              ...List.generate(_totalPages, (i) {
                                final pageNum = i + 1;
                                final isSelected = pageNum == _currentPage;
                                return GestureDetector(
                                  onTap: () {
                                    Feedback.forTap(context);
                                    setState(() => _currentPage = pageNum);
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 150),
                                    margin: const EdgeInsets.symmetric(
                                      horizontal: 4,
                                    ),
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? const Color(0xFFD34426)
                                          : Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isSelected
                                            ? const Color(0xFFD34426)
                                            : const Color(0xFFE2E8F0),
                                      ),
                                      boxShadow: isSelected
                                          ? [
                                              BoxShadow(
                                                color: const Color(
                                                  0xFFD34426,
                                                ).withValues(alpha: 0.25),
                                                blurRadius: 6,
                                                offset: const Offset(0, 2),
                                              ),
                                            ]
                                          : [],
                                    ),
                                    child: Center(
                                      child: Text(
                                        '$pageNum',
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected
                                              ? Colors.white
                                              : Colors.grey[700],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              }),
                              const SizedBox(width: 4),
                              IconButton(
                                onPressed: _currentPage < _totalPages
                                    ? () {
                                        Feedback.forTap(context);
                                        setState(() => _currentPage++);
                                      }
                                    : null,
                                icon: Icon(
                                  Icons.chevron_right_rounded,
                                  color: _currentPage < _totalPages
                                      ? const Color(0xFFD34426)
                                      : Colors.grey[300],
                                  size: 26,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                      const SizedBox(height: 120),
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
