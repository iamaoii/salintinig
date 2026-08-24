import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'dart:math' as math;

class AssignPhilIriPage extends StatefulWidget {
  final String? editId;
  final String className;

  const AssignPhilIriPage({
    super.key,
    this.editId,
    this.className = 'Grade 4 - FYANG',
  });

  @override
  State<AssignPhilIriPage> createState() => _AssignPhilIriPageState();
}

class _AssignPhilIriPageState extends State<AssignPhilIriPage> {
  // Form State
  String _selectedPeriod = 'GST'; // 'GST', 'Pre-Test', 'Post-Test'
  String _selectedLanguage = 'fil'; // 'fil' or 'eng'
  String _selectedType = 'oral'; // 'listening', 'oral', 'silent'
  DateTime? _dueDate;
  String _searchQuery = '';

  // Data Loading & States
  bool _isLoading = true;
  bool _isSubmitting = false;
  List<Map<String, dynamic>> _students = [];
  List<Map<String, dynamic>> _passages = [];

  // Assignment selections
  final Set<String> _selectedStudentIds = {};
  final Map<String, String> _assignedPassageMap = {}; // studentId -> passageId

  final List<Color> _avatarColors = const [
    Color(0xFF0D9488), // Teal
    Color(0xFF059669), // Emerald
    Color(0xFFD97706), // Amber
    Color(0xFF2563EB), // Blue
    Color(0xFF4F46E5), // Indigo
    Color(0xFFE11D48), // Rose
  ];

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);

    try {
      // 1. Fetch Students
      final cachedStudents = AuthService.cachedClassStudents;
      if (cachedStudents != null && cachedStudents.isNotEmpty) {
        _students = cachedStudents;
      } else {
        _students = await AuthService.fetchClassStudents(forceRefresh: true);
      }

      // 2. Fetch Passages
      final passageRes = await ApiService.get('/teacher/assessments/passages');
      if (passageRes.success && passageRes.data != null && passageRes.data['passages'] is List) {
        final List raw = passageRes.data['passages'];
        _passages = raw.map((item) => Map<String, dynamic>.from(item)).toList();
      }
    } catch (e) {
      debugPrint('Error loading assign data: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  // Filtered Passages based on selected language
  List<Map<String, dynamic>> get _filteredPassages {
    return _passages.where((p) {
      final lang = (p['language'] ?? '').toString().toLowerCase();
      if (_selectedLanguage == 'fil') {
        return lang == 'fil' || lang == 'filipino';
      } else {
        return lang == 'en' || lang == 'eng' || lang == 'english';
      }
    }).toList();
  }

  // Filtered Students based on search query
  List<Map<String, dynamic>> get _filteredStudents {
    if (_searchQuery.trim().isEmpty) return _students;
    final q = _searchQuery.trim().toLowerCase();
    return _students.where((s) {
      final name = (s['name'] ?? '${s['firstName'] ?? ''} ${s['lastName'] ?? ''}').toString().toLowerCase();
      return name.contains(q);
    }).toList();
  }

  void _toggleStudent(String id) {
    Feedback.forTap(context);
    setState(() {
      if (_selectedStudentIds.contains(id)) {
        _selectedStudentIds.remove(id);
        _assignedPassageMap.remove(id);
      } else {
        _selectedStudentIds.add(id);
        // Default to first available passage if available
        if (_filteredPassages.isNotEmpty) {
          _assignedPassageMap[id] = (_filteredPassages.first['passage_id'] ?? '').toString();
        } else {
          _assignedPassageMap[id] = '';
        }
      }
    });
  }

  void _toggleSelectAll() {
    Feedback.forTap(context);
    setState(() {
      if (_selectedStudentIds.length == _filteredStudents.length && _filteredStudents.isNotEmpty) {
        _selectedStudentIds.clear();
        _assignedPassageMap.clear();
      } else {
        final firstPassageId = _filteredPassages.isNotEmpty ? (_filteredPassages.first['passage_id'] ?? '').toString() : '';
        for (var s in _filteredStudents) {
          final sid = (s['student_id'] ?? s['id'] ?? '').toString();
          if (sid.isNotEmpty) {
            _selectedStudentIds.add(sid);
            _assignedPassageMap[sid] = firstPassageId;
          }
        }
      }
    });
  }

  void _autoDistributeSets() {
    Feedback.forTap(context);
    if (_selectedStudentIds.isEmpty) {
      _showSnackBar('Please select at least one student before auto-distributing sets.', Colors.orange[800]!);
      return;
    }
    final available = _filteredPassages.isNotEmpty ? _filteredPassages : _passages;
    if (available.isEmpty) {
      _showSnackBar('No passages available for the selected language.', Colors.orange[800]!);
      return;
    }

    final rand = math.Random();
    setState(() {
      for (var sId in _selectedStudentIds) {
        final p = available[rand.nextInt(available.length)];
        _assignedPassageMap[sId] = (p['passage_id'] ?? '').toString();
      }
    });
  }

  Future<void> _selectDueDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? now.add(const Duration(days: 7)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(primary: Color(0xFFD34426)),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _dueDate = picked);
    }
  }

  Future<void> _submitAssignment() async {
    if (_selectedStudentIds.isEmpty) {
      _showSnackBar('Please select at least one student to assign.', Colors.orange[800]!);
      return;
    }

    // Check unassigned passages
    final unassigned = _selectedStudentIds.any((id) => (_assignedPassageMap[id] ?? '').isEmpty);
    if (unassigned) {
      _showSnackBar('Please select a passage set for all selected students (or tap Auto-Distribute).', Colors.orange[800]!);
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final assignmentList = _selectedStudentIds.map((studentId) {
        return {
          'studentId': studentId,
          'passageId': _assignedPassageMap[studentId],
        };
      }).toList();

      final payload = {
        'assignments': assignmentList,
        'assessmentType': _selectedType,
        'assessmentPeriod': _selectedPeriod,
        'dueDate': _dueDate?.toIso8601String().split('T')[0],
      };

      final res = await ApiService.post('/teacher/assessments/assign-phil-iri-students', payload);
      if (!mounted) return;

      if (res.success) {
        AppToast.success(context, 'Assessment assigned successfully!');
        Navigator.pop(context, true);
      } else {
        AppToast.error(context, res.message ?? 'Failed to publish assessment.');
      }
    } catch (e) {
      if (mounted) {
        AppToast.error(context, 'An error occurred while publishing assessment.');
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showSnackBar(String msg, Color bg) {
    if (bg == Colors.red[700] || bg == const Color(0xFFEF4444)) {
      AppToast.error(context, msg);
    } else {
      AppToast.warning(context, msg);
    }
  }

  void _previewPassageModal(Map<String, dynamic> passage) {
    Feedback.forTap(context);
    final title = passage['title'] ?? 'Passage Title';
    final content = passage['content'] ?? passage['text'] ?? 'No text available.';
    final wordCount = passage['word_count'] ?? passage['wordCount'] ?? 0;
    final setName = passage['set_name'] ?? passage['setName'] ?? 'Set A';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3E8FF),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      setName,
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF6B21A8)),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(title, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.black)),
              const SizedBox(height: 4),
              Text('$wordCount words • Grade 4', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
              const Divider(height: 24),
              Text(
                content,
                style: GoogleFonts.inter(fontSize: 14, height: 1.6, color: Colors.grey[800]),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  String _getInitials(String name) {
    if (name.trim().isEmpty) return 'ST';
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts[0].substring(0, math.min(2, parts[0].length)).toUpperCase();
    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }

  Color _getLevelColor(String level) {
    final l = level.toLowerCase();
    if (l.contains('independ')) return const Color(0xFF059669);
    if (l.contains('instruct')) return const Color(0xFFD97706);
    if (l.contains('frustrat')) return const Color(0xFFDC2626);
    return Colors.grey[600]!;
  }

  Color _getLevelBg(String level) {
    final l = level.toLowerCase();
    if (l.contains('independ')) return const Color(0xFFD1FAE5);
    if (l.contains('instruct')) return const Color(0xFFFEF3C7);
    if (l.contains('frustrat')) return const Color(0xFFFEE2E2);
    return const Color(0xFFF1F5F9);
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softBg,
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar
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
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: Colors.black),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Assign Phil-IRI Assessment',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                        Text(
                          'Configure details & passage distribution',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Form Body
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFFD34426)))
                  : SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. General Details Card
                          _buildGeneralDetailsCard(),
                          const SizedBox(height: 16),

                          // 2. Assessment Type Card
                          _buildAssessmentTypeCard(),
                          const SizedBox(height: 16),

                          // 3. Available Passage Sets Card
                          _buildPassageSetsCard(),
                          const SizedBox(height: 16),

                          // 4. Assigned Students Roster Card
                          _buildStudentRosterCard(),
                          const SizedBox(height: 100),
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),

      // Bottom Sticky Publish Bar
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: ElevatedButton.icon(
          onPressed: _isSubmitting ? null : _submitAssignment,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFFD34426),
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 50),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          icon: _isSubmitting
              ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Icon(Icons.send_rounded, size: 20),
          label: Text(
            _isSubmitting ? 'Publishing...' : 'Save & Publish Assessment',
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800),
          ),
        ),
      ),
    );
  }

  // 1. General Details Card Component
  Widget _buildGeneralDetailsCard() {
    return Container(
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
            children: [
              const Iconify(Ph.article, color: Color(0xFFD34426), size: 20),
              const SizedBox(width: 8),
              Text(
                'General Details',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.black),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Assessment Period Dropdown
          Text('Assessment Period *', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[800])),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFCFAF7),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFCBD5E1)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedPeriod,
                isExpanded: true,
                style: GoogleFonts.inter(fontSize: 13, color: Colors.black87, fontWeight: FontWeight.w600),
                items: const [
                  DropdownMenuItem(value: 'GST', child: Text('Group Screening Test (GST)')),
                  DropdownMenuItem(value: 'Pre-Test', child: Text('Pre-Test Evaluation')),
                  DropdownMenuItem(value: 'Post-Test', child: Text('Post-Test Evaluation')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _selectedPeriod = val);
                },
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Language & Due Date Row
          Row(
            children: [
              // Language Selection
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Language *', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[800])),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFCFAF7),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedLanguage,
                          isExpanded: true,
                          style: GoogleFonts.inter(fontSize: 13, color: Colors.black87, fontWeight: FontWeight.w600),
                          items: const [
                            DropdownMenuItem(value: 'fil', child: Text('Filipino (FIL)')),
                            DropdownMenuItem(value: 'eng', child: Text('English (ENG)')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedLanguage = val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),

              // Due Date Selection
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Due Date (Optional)', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[800])),
                    const SizedBox(height: 6),
                    InkWell(
                      onTap: _selectDueDate,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFCFAF7),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _dueDate != null ? _dueDate!.toIso8601String().split('T')[0] : 'Select date',
                              style: GoogleFonts.inter(fontSize: 12, color: _dueDate != null ? Colors.black87 : Colors.grey[500], fontWeight: FontWeight.w600),
                            ),
                            const Icon(Icons.calendar_today_rounded, size: 16, color: Color(0xFFD34426)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // 2. Assessment Type Card Component
  Widget _buildAssessmentTypeCard() {
    final types = [
      {'key': 'listening', 'label': 'Listening', 'icon': Ph.ear, 'color': const Color(0xFFD97706), 'bg': const Color(0xFFFEF3C7)},
      {'key': 'oral', 'label': 'Oral Reading', 'icon': Ph.microphone, 'color': const Color(0xFF1D4ED8), 'bg': const Color(0xFFDBEAFE)},
      {'key': 'silent', 'label': 'Silent Reading', 'icon': Ph.book_open, 'color': const Color(0xFF047857), 'bg': const Color(0xFFD1FAE5)},
    ];

    return Container(
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
            children: [
              const Iconify(Ph.target_bold, color: Color(0xFFD34426), size: 20),
              const SizedBox(width: 8),
              Text(
                'Assessment Type *',
                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.black),
              ),
            ],
          ),
          const SizedBox(height: 14),

          Row(
            children: types.map((t) {
              final isSelected = _selectedType == t['key'];
              final color = t['color'] as Color;
              final bg = t['bg'] as Color;
              final iconStr = t['icon'] as String;

              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    Feedback.forTap(context);
                    setState(() => _selectedType = t['key'] as String);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? bg : const Color(0xFFFCFAF7),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? color : const Color(0xFFE2E8F0),
                        width: isSelected ? 2 : 1,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: color.withValues(alpha: 0.15),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : [],
                    ),
                    child: Column(
                      children: [
                        Iconify(iconStr, color: color, size: 24),
                        const SizedBox(height: 8),
                        Text(
                          t['label'] as String,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? color : Colors.grey[800],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // 3. Available Passage Sets Card Component
  Widget _buildPassageSetsCard() {
    final list = _filteredPassages;

    return Container(
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
              Row(
                children: [
                  const Iconify(Ph.books_bold, color: Color(0xFFD34426), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Available Phil-IRI Passages (${list.length})',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.black),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text('Grade 4', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[700])),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (list.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text('No passages found for selected language.', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: list.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final p = list[index];
                final title = p['title'] ?? 'Passage Title';
                final wordCount = p['word_count'] ?? p['wordCount'] ?? 0;
                final setName = p['set_name'] ?? p['setName'] ?? 'Set A';

                return InkWell(
                  onTap: () => _previewPassageModal(p),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFCFAF7),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3E8FF),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            setName,
                            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFF6B21A8)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text('$wordCount words', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600])),
                            ],
                          ),
                        ),
                        const Icon(Icons.remove_red_eye_outlined, size: 16, color: Colors.grey),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  // 4. Assigned Students Roster Card Component
  Widget _buildStudentRosterCard() {
    final list = _filteredStudents;
    final isAllSelected = _selectedStudentIds.length == list.length && list.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header & Counter
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'Assigned Students',
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800, color: Colors.black),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDBEAFE),
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      '${_selectedStudentIds.length}/${_students.length}',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF1D4ED8)),
                    ),
                  ),
                ],
              ),

              // Auto-Distribute Magic Button
              OutlinedButton.icon(
                onPressed: _autoDistributeSets,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  side: const BorderSide(color: Color(0xFFD34426)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Iconify(Ph.magic_wand, color: Color(0xFFD34426), size: 14),
                label: Text('Auto-Distribute', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFFD34426))),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Search & Select All Row
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFCFAF7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    style: GoogleFonts.inter(fontSize: 12),
                    decoration: InputDecoration(
                      icon: const Icon(Icons.search_rounded, size: 18, color: Colors.grey),
                      hintText: 'Search student...',
                      hintStyle: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
                      border: InputBorder.none,
                      isDense: true,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: _toggleSelectAll,
                child: Text(
                  isAllSelected ? 'Deselect All' : 'Select All',
                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF1D4ED8)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Student Roster List
          if (list.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: Text('No students found.', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: list.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final student = list[index];
                final sId = (student['student_id'] ?? student['id'] ?? '').toString();
                final name = (student['name'] ?? '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}').toString();
                final level = (student['readingLevel'] ?? student['level'] ?? 'Pending Evaluation').toString();
                final isSelected = _selectedStudentIds.contains(sId);
                final selectedPassageId = _assignedPassageMap[sId] ?? '';

                final color = _avatarColors[index % _avatarColors.length];

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white : const Color(0xFFFCFAF7),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? const Color(0xFFD34426) : const Color(0xFFE2E8F0),
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          // Initials Avatar
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: color,
                            child: Text(
                              _getInitials(name),
                              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                          const SizedBox(width: 10),

                          // Name & Reading Level
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black),
                                ),
                                const SizedBox(height: 2),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: _getLevelBg(level),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    level,
                                    style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: _getLevelColor(level)),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Checkbox Selection
                          Checkbox(
                            value: isSelected,
                            activeColor: const Color(0xFFD34426),
                            onChanged: (_) => _toggleStudent(sId),
                          ),
                        ],
                      ),

                      // Passage Selection per Student if selected
                      if (isSelected && _filteredPassages.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text('Passage Set:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[700])),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: selectedPassageId.isNotEmpty ? selectedPassageId : null,
                                    hint: Text('Select set...', style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500])),
                                    isExpanded: true,
                                    style: GoogleFonts.inter(fontSize: 11, color: Colors.black87, fontWeight: FontWeight.w600),
                                    items: _filteredPassages.map((p) {
                                      final pid = (p['passage_id'] ?? '').toString();
                                      final title = (p['title'] ?? 'Passage').toString();
                                      final setStr = (p['set_name'] ?? 'Set').toString();
                                      return DropdownMenuItem(
                                        value: pid,
                                        child: Text('$setStr - $title', overflow: TextOverflow.ellipsis),
                                      );
                                    }).toList(),
                                    onChanged: (newPid) {
                                      if (newPid != null) {
                                        setState(() => _assignedPassageMap[sId] = newPid);
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
