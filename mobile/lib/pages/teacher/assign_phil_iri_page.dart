import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_overview_page.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:salintinig/widgets/user_avatar.dart';
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
  // Wizard Step State (1: General Details & Type, 2: Students & Passages)
  int _currentStep = 1;

  // Form State
  String _selectedPeriod = 'pre_test'; // 'pre_test', 'post_test'
  String _selectedLanguage = 'fil'; // 'fil' or 'en'
  String _selectedType = 'oral'; // 'listening', 'oral', 'silent'
  DateTime? _dueDate;
  final TextEditingController _instructionsController = TextEditingController();
  bool _supplementaryEligibilityConfirmed = false;
  String _searchQuery = '';

  // Data Loading & States
  bool _isLoading = true;
  bool _isSubmitting = false;
  List<Map<String, dynamic>> _students = [];
  List<Map<String, dynamic>> _passages = [];

  // Assignment selections
  final Set<String> _selectedStudentIds = {};
  final Map<String, String> _assignedPassageMap = {}; // studentId -> passageId

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _instructionsController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);

    try {
      // 1. Fetch Passages
      final passageRes = await ApiService.get('/teacher/assessments/passages');
      if (passageRes.success && passageRes.data != null && passageRes.data['passages'] is List) {
        final List raw = passageRes.data['passages'];
        _passages = raw.map((item) => Map<String, dynamic>.from(item)).toList();
      }

      // 2. Fetch Class Students
      List<Map<String, dynamic>> stdList = [];
      final cachedStudents = AuthService.cachedClassStudents;
      if (cachedStudents != null && cachedStudents.isNotEmpty) {
        stdList = cachedStudents.map((e) => Map<String, dynamic>.from(e)).toList();
      } else {
        stdList = (await AuthService.fetchClassStudents(forceRefresh: true))
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }

      if (stdList.isNotEmpty) {
        final sectionName = (stdList[0]['sectionName'] ??
                stdList[0]['section_name'] ??
                stdList[0]['section'] ??
                '')
            .toString();

        Map<String, dynamic>? filSubmission;
        Map<String, dynamic>? engSubmission;

        if (sectionName.isNotEmpty) {
          final filRes = await ApiService.get(
              '/teacher/phil-iri/gst-submission?sectionName=${Uri.encodeComponent(sectionName)}&language=Tagalog');
          final engRes = await ApiService.get(
              '/teacher/phil-iri/gst-submission?sectionName=${Uri.encodeComponent(sectionName)}&language=English');

          if (filRes.success && filRes.data != null && filRes.data['submission'] != null) {
            filSubmission = filRes.data['submission']['form_data'];
          }
          if (engRes.success && engRes.data != null && engRes.data['submission'] != null) {
            engSubmission = engRes.data['submission']['form_data'];
          }
        }

        final filMap = <String, Map<String, dynamic>>{};
        final engMap = <String, Map<String, dynamic>>{};

        if (filSubmission != null) {
          final rows = [
            ...(filSubmission['maleRows'] as List? ?? []),
            ...(filSubmission['femaleRows'] as List? ?? [])
          ];
          for (var r in rows) {
            if (r is Map) {
              final mapR = Map<String, dynamic>.from(r);
              if (mapR['lrn'] != null) filMap[mapR['lrn'].toString().trim()] = mapR;
              if (mapR['name'] != null) filMap[mapR['name'].toString().trim().toLowerCase()] = mapR;
            }
          }
        }

        if (engSubmission != null) {
          final rows = [
            ...(engSubmission['maleRows'] as List? ?? []),
            ...(engSubmission['femaleRows'] as List? ?? [])
          ];
          for (var r in rows) {
            if (r is Map) {
              final mapR = Map<String, dynamic>.from(r);
              if (mapR['lrn'] != null) engMap[mapR['lrn'].toString().trim()] = mapR;
              if (mapR['name'] != null) engMap[mapR['name'].toString().trim().toLowerCase()] = mapR;
            }
          }
        }

        _students = stdList.map((std) {
          final lrn = (std['lrn'] ?? '').toString().trim();
          final stdName = (std['name'] ?? '${std['firstName'] ?? ''} ${std['lastName'] ?? ''}')
              .toString()
              .trim()
              .toLowerCase();
          final lName = (std['lastName'] ?? std['last_name'] ?? '').toString().trim();
          final fName = (std['firstName'] ?? std['first_name'] ?? '').toString().trim();
          final lastFirst = lName.isNotEmpty && fName.isNotEmpty ? '$lName, $fName'.toLowerCase() : '';

          final filRecord = filMap[lrn] ?? filMap[stdName] ?? filMap[lastFirst];
          final engRecord = engMap[lrn] ?? engMap[stdName] ?? engMap[lastFirst];

          return {
            ...std,
            'gstScoreFil': filRecord?['totalNum'] ?? filRecord?['score'],
            'gstScoreEng': engRecord?['totalNum'] ?? engRecord?['score'],
            'startingPointFil': filRecord?['startingPoint'],
            'startingPointEng': engRecord?['startingPoint'],
          };
        }).toList();
      }

      // 3. Preload Edit Mode Data if applicable
      if (widget.editId != null && widget.editId!.isNotEmpty) {
        final editRes = await ApiService.get('/teacher/assessments/activity-detail/${widget.editId}');
        if (editRes.success && editRes.data != null && editRes.data['activity'] != null) {
          final act = editRes.data['activity'];
          _selectedPeriod = (act['period'] ?? 'pre_test').toString();
          _selectedType = (act['assessmentType'] ?? 'oral').toString();
          _selectedLanguage = (act['language'] ?? 'fil').toString();
          if (act['dueDate'] != null) {
            _dueDate = DateTime.tryParse(act['dueDate'].toString());
          }
          if (act['instructions'] != null) {
            _instructionsController.text = act['instructions'].toString();
          }

          if (act['students'] is List) {
            for (var std in act['students']) {
              final sid = (std['studentId'] ?? std['id'] ?? '').toString();
              if (sid.isNotEmpty) {
                _selectedStudentIds.add(sid);
                if (std['passageId'] != null) {
                  _assignedPassageMap[sid] = std['passageId'].toString();
                }
              }
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Error loading assign data: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _enforceGstOralRules();
      }
    }
  }

  // Helper to compute DepEd Table 3 GST starting passage recommendation
  Map<String, dynamic> computeGstRecommendation(Map<String, dynamic> student, String langKey) {
    final isTagalog = langKey == 'fil';
    final score = isTagalog ? student['gstScoreFil'] : student['gstScoreEng'];
    final startingPointText = isTagalog ? student['startingPointFil'] : student['startingPointEng'];
    final currentGrade = int.tryParse(
            (student['gradeLevel'] ?? student['grade'] ?? '4').toString().replaceAll(RegExp(r'\D'), '')) ??
        4;
    final minimumPassageGrade = isTagalog ? 1 : 2;

    if (score != null && score.toString().isNotEmpty) {
      final numScore = score is num ? score.toInt() : (int.tryParse(score.toString()) ?? 0);
      if (numScore >= 14) {
        return {
          'label': 'Exempted (Score ≥ 14)',
          'targetGrade': currentGrade,
          'isExempt': true,
          'missingGst': false,
        };
      }
      if (numScore >= 8) {
        final targetGrade = math.max(minimumPassageGrade, currentGrade - 2);
        return {
          'label': 'Rec: Grade $targetGrade Passage',
          'targetGrade': targetGrade,
          'isExempt': false,
          'missingGst': false,
        };
      }
      final targetGrade = math.max(minimumPassageGrade, currentGrade - 3);
      return {
        'label': 'Rec: Grade $targetGrade Passage',
        'targetGrade': targetGrade,
        'isExempt': false,
        'missingGst': false,
      };
    }

    if (startingPointText != null && startingPointText.toString().isNotEmpty) {
      final spStr = startingPointText.toString();
      if (spStr.toLowerCase().contains('exempt')) {
        return {
          'label': 'Exempted (Discontinue)',
          'targetGrade': currentGrade,
          'isExempt': true,
          'missingGst': false,
        };
      }
      final matchGrade = int.tryParse(spStr.replaceAll(RegExp(r'\D'), ''));
      if (matchGrade != null) {
        return {
          'label': 'Rec: Grade $matchGrade Passage',
          'targetGrade': matchGrade,
          'isExempt': false,
          'missingGst': false,
        };
      }
    }

    return {
      'label': 'GST score required',
      'targetGrade': null,
      'isExempt': false,
      'missingGst': true,
    };
  }

  // Filtered Passages based on selected language and assessment period stage
  List<Map<String, dynamic>> get _filteredPassages {
    return _passages.where((p) {
      final lang = (p['language'] ?? '').toString().toLowerCase();
      final matchesLanguage = _selectedLanguage == 'fil'
          ? (lang == 'fil' || lang == 'filipino')
          : (lang == 'en' || lang == 'eng' || lang == 'english');
      if (!matchesLanguage) return false;

      if (_selectedPeriod.isEmpty) return true;
      final passagePeriod = (p['stage'] ?? p['assessment_period'] ?? p['assessmentPeriod'] ?? '')
          .toString()
          .toLowerCase()
          .replaceAll(RegExp(r'[^a-z]+'), '_')
          .replaceAll(RegExp(r'^_|_$'), '');
      return passagePeriod.isEmpty || passagePeriod == _selectedPeriod;
    }).toList();
  }

  // Filtered Passages matching student's GST recommendation level in Oral mode
  List<Map<String, dynamic>> _getPassagesForStudent(Map<String, dynamic> student) {
    if (_selectedType != 'oral') return _filteredPassages;
    final recommendation = computeGstRecommendation(student, _selectedLanguage);
    if (recommendation['targetGrade'] == null) return [];
    final targetGrade = recommendation['targetGrade'] as int;

    return _filteredPassages.where((passage) {
      final pGrade = int.tryParse((passage['grade_level'] ?? passage['gradeLevel'] ?? '')
              .toString()
              .replaceAll(RegExp(r'\D'), '')) ??
          0;
      return pGrade == targetGrade;
    }).toList();
  }

  // Check if student already has an assessment assigned
  Map<String, dynamic>? _checkAlreadyHasAssessment(Map<String, dynamic> student) {
    if (student['existingAssessments'] is! List || _selectedType.isEmpty || _selectedPeriod.isEmpty) {
      return null;
    }
    final List list = student['existingAssessments'];
    for (var a in list) {
      if (a is Map) {
        final matchesType = (a['type'] ?? '').toString().toLowerCase() == _selectedType.toLowerCase();
        final matchesPeriod = (a['period'] ?? '').toString().toLowerCase() == _selectedPeriod.toLowerCase();
        final aLang = (a['language'] ?? 'fil').toString().toLowerCase();
        final matchesLang = aLang == _selectedLanguage.toLowerCase() || aLang.startsWith(_selectedLanguage[0]);
        if (matchesType && matchesPeriod && matchesLang) {
          return Map<String, dynamic>.from(a);
        }
      }
    }
    return null;
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

  void _enforceGstOralRules() {
    if (_selectedType != 'oral') return;
    setState(() {
      _selectedStudentIds.removeWhere((id) {
        final std = _students.firstWhere(
          (s) => (s['student_id'] ?? s['id'] ?? '').toString() == id,
          orElse: () => {},
        );
        if (std.isEmpty) return true;
        final rec = computeGstRecommendation(std, _selectedLanguage);
        return rec['isExempt'] == true || rec['missingGst'] == true;
      });
      _assignedPassageMap.removeWhere((id, _) => !_selectedStudentIds.contains(id));
    });
  }

  void _goToNextStep() {
    Feedback.forTap(context);
    if (_selectedPeriod.isEmpty) {
      _showSnackBar('Please select an Assessment Period.', Colors.orange[800]!);
      return;
    }
    if (_selectedLanguage.isEmpty) {
      _showSnackBar('Please select an Assessment Language.', Colors.orange[800]!);
      return;
    }
    if (_selectedType.isEmpty) {
      _showSnackBar('Please select an Assessment Type.', Colors.orange[800]!);
      return;
    }
    if ((_selectedType == 'listening' || _selectedType == 'silent') && !_supplementaryEligibilityConfirmed) {
      _showSnackBar(
        'Please confirm that the selected learners are eligible for this supplementary assessment.',
        Colors.orange[800]!,
      );
      return;
    }

    setState(() => _currentStep = 2);
  }

  void _goToPreviousStep() {
    Feedback.forTap(context);
    setState(() => _currentStep = 1);
  }

  void _toggleStudent(String id) {
    Feedback.forTap(context);
    final std = _students.firstWhere(
      (s) => (s['student_id'] ?? s['id'] ?? '').toString() == id,
      orElse: () => {},
    );
    if (std.isNotEmpty) {
      if (_checkAlreadyHasAssessment(std) != null) return;
      if (_selectedType == 'oral') {
        final rec = computeGstRecommendation(std, _selectedLanguage);
        if (rec['missingGst'] == true) {
          _showSnackBar(
            'Save a GST score in Form 1A/1B before assigning Stage 2 Oral Reading.',
            Colors.orange[800]!,
          );
          return;
        }
        if (rec['isExempt'] == true) {
          _showSnackBar(
            'GST score is 14 or higher. No individualized Oral Reading assessment is required.',
            Colors.orange[800]!,
          );
          return;
        }
      }
    }

    setState(() {
      if (_selectedStudentIds.contains(id)) {
        _selectedStudentIds.remove(id);
        _assignedPassageMap.remove(id);
      } else {
        _selectedStudentIds.add(id);
        final availableForStudent = _getPassagesForStudent(std);
        if (availableForStudent.isNotEmpty) {
          _assignedPassageMap[id] = (availableForStudent.first['passage_id'] ?? '').toString();
        } else {
          _assignedPassageMap[id] = '';
        }
      }
    });
  }

  void _toggleSelectAll() {
    Feedback.forTap(context);
    final eligibleStudents = _students.where((std) {
      final sId = (std['student_id'] ?? std['id'] ?? '').toString();
      if (sId.isEmpty) return false;
      if (_checkAlreadyHasAssessment(std) != null) return false;
      if (_selectedType == 'oral') {
        final rec = computeGstRecommendation(std, _selectedLanguage);
        if (rec['missingGst'] == true || rec['isExempt'] == true) return false;
      }
      return true;
    }).toList();

    setState(() {
      if (_selectedStudentIds.length == eligibleStudents.length && eligibleStudents.isNotEmpty) {
        _selectedStudentIds.clear();
        _assignedPassageMap.clear();
      } else {
        _selectedStudentIds.clear();
        _assignedPassageMap.clear();
        for (var std in eligibleStudents) {
          final sId = (std['student_id'] ?? std['id'] ?? '').toString();
          _selectedStudentIds.add(sId);
          final psgs = _getPassagesForStudent(std);
          _assignedPassageMap[sId] = psgs.isNotEmpty ? (psgs.first['passage_id'] ?? '').toString() : '';
        }
      }
    });
  }

  void _autoAssignGstRecommendedPassages() {
    Feedback.forTap(context);
    if (_selectedType != 'oral') {
      _showSnackBar(
        'GST auto-assignment is available only for Oral Reading Assessment.',
        Colors.orange[800]!,
      );
      return;
    }

    if (_selectedStudentIds.isEmpty) {
      _showSnackBar('Please select at least one student first.', Colors.orange[800]!);
      return;
    }

    int assignedCount = 0;
    int missingGstCount = 0;
    int missingPassageCount = 0;
    final Map<int, int> gradeSetCounters = {};

    setState(() {
      for (var std in _students) {
        final sId = (std['student_id'] ?? std['id'] ?? '').toString();
        if (!_selectedStudentIds.contains(sId)) continue;

        final rec = computeGstRecommendation(std, _selectedLanguage);
        if (rec['isExempt'] == true) continue;
        if (rec['missingGst'] == true) {
          missingGstCount++;
          continue;
        }

        final targetGrade = rec['targetGrade'] as int?;
        if (targetGrade == null) continue;

        final matchingPassages = _filteredPassages.where((p) {
          final pGrade = int.tryParse((p['grade_level'] ?? p['gradeLevel'] ?? '')
                  .toString()
                  .replaceAll(RegExp(r'\D'), '')) ??
              0;
          return pGrade == targetGrade;
        }).toList();

        if (matchingPassages.isNotEmpty) {
          final counter = gradeSetCounters[targetGrade] ?? 0;
          final match = matchingPassages[counter % matchingPassages.length];
          gradeSetCounters[targetGrade] = counter + 1;

          _assignedPassageMap[sId] = (match['passage_id'] ?? '').toString();
          assignedCount++;
        } else {
          missingPassageCount++;
        }
      }
    });

    if (missingGstCount > 0 || missingPassageCount > 0) {
      _showSnackBar(
        'Assigned $assignedCount GST-based passage(s). ${missingGstCount > 0 ? '$missingGstCount learner(s) need GST score.' : ''}',
        Colors.orange[800]!,
      );
    } else {
      AppToast.success(
        context,
        'Auto-assigned GST recommended starting passages for $assignedCount student(s).',
      );
    }
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
    if (_selectedPeriod.isEmpty) {
      _showSnackBar('Please select an Assessment Period (Pre-Test or Post-Test).', Colors.orange[800]!);
      return;
    }
    if (_selectedLanguage.isEmpty) {
      _showSnackBar('Please select an Assessment Language (Filipino or English).', Colors.orange[800]!);
      return;
    }
    if (_selectedType.isEmpty) {
      _showSnackBar('Please select an Assessment Type (Listening, Oral, or Silent).', Colors.orange[800]!);
      return;
    }
    if (_selectedStudentIds.isEmpty) {
      _showSnackBar('Please select at least one student to assign.', Colors.orange[800]!);
      return;
    }

    if (_selectedType == 'oral') {
      final missingGstCount = _students.where((std) {
        final sId = (std['student_id'] ?? std['id'] ?? '').toString();
        if (!_selectedStudentIds.contains(sId)) return false;
        final rec = computeGstRecommendation(std, _selectedLanguage);
        return rec['missingGst'] == true;
      }).length;

      if (missingGstCount > 0) {
        _showSnackBar(
          '$missingGstCount selected learner(s) have no saved Form 1A/1B GST score. Save GST first before publishing Oral Reading.',
          Colors.orange[800]!,
        );
        return;
      }
    }

    if ((_selectedType == 'listening' || _selectedType == 'silent') && !_supplementaryEligibilityConfirmed) {
      _showSnackBar(
        'Please confirm that the selected learners are eligible for this supplementary assessment.',
        Colors.orange[800]!,
      );
      return;
    }

    final unassigned = _selectedStudentIds.any((id) => (_assignedPassageMap[id] ?? '').isEmpty);
    if (unassigned) {
      _showSnackBar(
        'Please select a passage set for all selected students (or tap Auto-Assign GST Level).',
        Colors.orange[800]!,
      );
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
        'instructions': _instructionsController.text.trim().isNotEmpty
            ? _instructionsController.text.trim()
            : null,
        'isEdit': widget.editId != null,
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

  void _showPassagePickerModal(Map<String, dynamic> student) {
    Feedback.forTap(context);
    final sId = (student['student_id'] ?? student['id'] ?? '').toString();
    final name = (student['name'] ?? '${student['firstName'] ?? ''} ${student['lastName'] ?? ''}').toString();
    final rec = computeGstRecommendation(student, _selectedLanguage);
    final pickerPassages = _getPassagesForStudent(student);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Select Passage for $name',
                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.black),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _selectedType == 'oral'
                            ? 'GST recommended level: ${rec['label']}'
                            : 'Choose passage for supplementary reading.',
                        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const Divider(height: 20),
            Expanded(
              child: pickerPassages.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Text(
                          _selectedType == 'oral'
                              ? 'No ${_selectedLanguage == 'en' ? 'English' : 'Filipino'} ${rec['targetGrade'] != null ? 'Grade ${rec['targetGrade']}' : ''} passage available for this period.'
                              : 'No passages available for the selected language & period.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(fontSize: 13, color: Colors.amber[900], fontWeight: FontWeight.w600),
                        ),
                      ),
                    )
                  : ListView.separated(
                      itemCount: pickerPassages.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final p = pickerPassages[index];
                        final pid = (p['passage_id'] ?? '').toString();
                        final title = (p['title'] ?? 'Passage Title').toString();
                        final wordCount = p['word_count'] ?? p['wordCount'] ?? 0;
                        final setName = p['set_name'] ?? p['passage_set'] ?? 'Set A';
                        final gradeStr = p['grade_level'] ?? p['gradeLevel'] ?? 'Grade 4';
                        final isSelectedPassage = _assignedPassageMap[sId] == pid;

                        return InkWell(
                          onTap: () {
                            setState(() {
                              _assignedPassageMap[sId] = pid;
                            });
                            Navigator.pop(ctx);
                          },
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSelectedPassage ? const Color(0xFFEFF6FF) : const Color(0xFFFCFAF7),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelectedPassage ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
                                width: isSelectedPassage ? 2 : 1,
                              ),
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
                                        style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black),
                                      ),
                                      Text('$wordCount words • $gradeStr', style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600])),
                                    ],
                                  ),
                                ),
                                if (isSelectedPassage)
                                  const Icon(Icons.check_circle_rounded, color: Color(0xFF2563EB), size: 20),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  String _getPassageLabel(String pid) {
    if (pid.isEmpty) return 'Choose Passage...';
    final p = _passages.firstWhere(
      (item) => (item['passage_id'] ?? item['id'] ?? '').toString() == pid,
      orElse: () => {},
    );
    if (p.isNotEmpty) {
      final title = (p['title'] ?? 'Passage').toString();
      final setStr = (p['set_name'] ?? p['passage_set'] ?? 'Set').toString();
      return '$setStr - $title';
    }
    return 'Passage Selected';
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
                      if (_currentStep == 2) {
                        _goToPreviousStep();
                      } else if (Navigator.canPop(context)) {
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
                          widget.editId != null ? 'Edit Phil-IRI Assessment' : 'Assign Phil-IRI Assessment',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                        Text(
                          _currentStep == 1
                              ? 'Step 1 of 2: Configure details & type'
                              : 'Step 2 of 2: Select students & passages',
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

            // Modern Stepper Header with Horizontal Progress Line
            _buildSleekStepperHeader(),

            // Form Body
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFFD34426)))
                  : SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_currentStep == 1) ...[
                            // Step 1 Cards
                            _buildGeneralDetailsCard(),
                            const SizedBox(height: 16),
                            _buildAssessmentTypeCard(),
                            const SizedBox(height: 100),
                          ] else ...[
                            // Step 2 Card
                            _buildStudentRosterCard(),
                            const SizedBox(height: 100),
                          ],
                        ],
                      ),
                    ),
            ),
          ],
        ),
      ),

      // Bottom Sticky Bar (Navigation / Submit)
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: SafeArea(
          child: _currentStep == 1
              ? ElevatedButton.icon(
                  onPressed: _goToNextStep,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFD34426),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  iconAlignment: IconAlignment.end,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                  label: Text(
                    'Next: Select Students',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800),
                  ),
                )
              : Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: OutlinedButton.icon(
                        onPressed: _goToPreviousStep,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.black87,
                          side: const BorderSide(color: Color(0xFFCBD5E1)),
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        icon: const Icon(Icons.arrow_back_rounded, size: 16),
                        label: Text(
                          'Back',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 3,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _submitAssignment,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFD34426),
                          foregroundColor: Colors.white,
                          minimumSize: const Size(0, 50),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Icon(Icons.send_rounded, size: 18),
                        label: Text(
                          _isSubmitting ? 'Publishing...' : 'Save & Publish',
                          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  // 0. Sleek Progress Bar Stepper Header
  Widget _buildSleekStepperHeader() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          // Step 1 Dot & Title
          GestureDetector(
            onTap: () => setState(() => _currentStep = 1),
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: _currentStep == 1 ? const Color(0xFFD34426) : const Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _currentStep == 1 ? const Color(0xFFD34426) : const Color(0xFF166534),
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: _currentStep > 1
                        ? const Icon(Icons.check_rounded, size: 16, color: Color(0xFF166534))
                        : Text(
                            '1',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Details & Type',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: _currentStep == 1 ? const Color(0xFFD34426) : Colors.black87,
                  ),
                ),
              ],
            ),
          ),

          // Connecting Timeline Line
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 12),
              height: 2,
              decoration: BoxDecoration(
                color: _currentStep == 2 ? const Color(0xFFD34426) : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Step 2 Dot & Title
          GestureDetector(
            onTap: _goToNextStep,
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: _currentStep == 2 ? const Color(0xFFD34426) : const Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: _currentStep == 2 ? const Color(0xFFD34426) : const Color(0xFFCBD5E1),
                      width: 1.5,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '2',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _currentStep == 2 ? Colors.white : Colors.grey[600],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Assign Students',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: _currentStep == 2 ? const Color(0xFFD34426) : Colors.grey[500],
                  ),
                ),
              ],
            ),
          ),
        ],
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
                value: _selectedPeriod.isNotEmpty ? _selectedPeriod : null,
                hint: Text('-- Select Assessment Period --', style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500])),
                isExpanded: true,
                style: GoogleFonts.inter(fontSize: 13, color: Colors.black87, fontWeight: FontWeight.w600),
                items: const [
                  DropdownMenuItem(value: 'pre_test', child: Text('Pre-Test (Panimulang Pagtatasa)')),
                  DropdownMenuItem(value: 'post_test', child: Text('Post-Test (Pangwakas na Pagtatasa)')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedPeriod = val);
                    _enforceGstOralRules();
                  }
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
                            DropdownMenuItem(value: 'en', child: Text('English (ENG)')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedLanguage = val);
                              _enforceGstOralRules();
                            }
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
                    setState(() {
                      _selectedType = t['key'] as String;
                      _supplementaryEligibilityConfirmed = false;
                    });
                    _enforceGstOralRules();
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

          // Supplementary Guidance Box
          if (_selectedType == 'silent' || _selectedType == 'listening') ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _selectedType == 'silent'
                        ? 'Silent Reading is a teacher-directed supplementary assessment.'
                        : 'Listening Comprehension is for a learner identified as a nonreader.',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF78350F)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _selectedType == 'silent'
                        ? 'Use it after Oral Reading to further check a reader’s speed and comprehension. GST does not select its passage.'
                        : 'Use it only when the completed Oral Reading findings and teacher judgment identify the learner as a nonreader. GST does not select its passage.',
                    style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF92400E), height: 1.4),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () {
                      setState(() {
                        _supplementaryEligibilityConfirmed = !_supplementaryEligibilityConfirmed;
                      });
                    },
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 20,
                          height: 20,
                          child: Checkbox(
                            value: _supplementaryEligibilityConfirmed,
                            activeColor: const Color(0xFFD34426),
                            onChanged: (val) {
                              setState(() {
                                _supplementaryEligibilityConfirmed = val ?? false;
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _selectedType == 'silent'
                                ? 'I confirm this learner is eligible based on Oral Reading findings.'
                                : 'I confirm this learner has been identified as a nonreader based on Oral Reading findings.',
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF78350F)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),
          // Special Instructions / Teacher Notes
          Text(
            'Special Instructions / Notes for Students (Optional)',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[800]),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _instructionsController,
            maxLines: 3,
            style: GoogleFonts.inter(fontSize: 12),
            decoration: InputDecoration(
              hintText: 'e.g., Please make sure you are in a quiet room and speak loudly into your microphone...',
              hintStyle: GoogleFonts.inter(fontSize: 12, color: Colors.grey[400]),
              filled: true,
              fillColor: const Color(0xFFFCFAF7),
              contentPadding: const EdgeInsets.all(12),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFD34426), width: 1.5),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 3. Assigned Students Roster Card Component
  Widget _buildStudentRosterCard() {
    final list = _filteredStudents;
    final eligibleStudents = list.where((std) {
      final sId = (std['student_id'] ?? std['id'] ?? '').toString();
      if (sId.isEmpty) return false;
      if (_checkAlreadyHasAssessment(std) != null) return false;
      if (_selectedType == 'oral') {
        final rec = computeGstRecommendation(std, _selectedLanguage);
        if (rec['missingGst'] == true || rec['isExempt'] == true) return false;
      }
      return true;
    }).toList();

    final isAllSelected = _selectedStudentIds.length == eligibleStudents.length && eligibleStudents.isNotEmpty;

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
                      '${_selectedStudentIds.length}/${eligibleStudents.length}',
                      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF1D4ED8)),
                    ),
                  ),
                ],
              ),

              // Auto-Assign GST Recommended Level Button
              if (_selectedType == 'oral')
                OutlinedButton.icon(
                  onPressed: _autoAssignGstRecommendedPassages,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    side: const BorderSide(color: Color(0xFFD34426)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Iconify(Ph.magic_wand, color: Color(0xFFD34426), size: 14),
                  label: Text(
                    'Auto-Assign GST',
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFFD34426)),
                  ),
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
                final isSelected = _selectedStudentIds.contains(sId);
                final selectedPassageId = _assignedPassageMap[sId] ?? '';

                final gstRec = computeGstRecommendation(student, _selectedLanguage);
                final existingAssigned = _checkAlreadyHasAssessment(student);
                final isAlreadyAssigned = existingAssigned != null;

                final isOralIneligible = _selectedType == 'oral' && (gstRec['missingGst'] == true || gstRec['isExempt'] == true);
                final isDisabled = isAlreadyAssigned || isOralIneligible;

                final avatarUrl = (student['profileImage'] ??
                        student['profile_image'] ??
                        student['avatarUrl'] ??
                        student['avatar'])
                    ?.toString();

                return Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isDisabled
                        ? const Color(0xFFF1F5F9).withValues(alpha: 0.6)
                        : isSelected
                            ? Colors.white
                            : const Color(0xFFFCFAF7),
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
                          // Student Avatar (Synced with Web colorFor algorithm & profile image)
                          Opacity(
                            opacity: isDisabled ? 0.6 : 1.0,
                            child: InitialsAvatar(
                              name: name,
                              imageUrl: avatarUrl,
                              radius: 18,
                            ),
                          ),
                          const SizedBox(width: 10),

                          // Name + GST Badge / Assigned Badge
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  name,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: isDisabled ? Colors.grey[600] : Colors.black,
                                  ),
                                ),
                                if (_selectedType == 'oral' || isAlreadyAssigned) ...[
                                  const SizedBox(height: 2),
                                  Wrap(
                                    spacing: 4,
                                    runSpacing: 4,
                                    children: [
                                      if (_selectedType == 'oral')
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: gstRec['missingGst'] == true
                                                ? const Color(0xFFFEE2E2)
                                                : gstRec['isExempt'] == true
                                                    ? const Color(0xFFD1FAE5)
                                                    : const Color(0xFFDBEAFE),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            gstRec['label'].toString(),
                                            style: GoogleFonts.inter(
                                              fontSize: 9,
                                              fontWeight: FontWeight.w800,
                                              color: gstRec['missingGst'] == true
                                                  ? const Color(0xFFDC2626)
                                                  : gstRec['isExempt'] == true
                                                      ? const Color(0xFF059669)
                                                      : const Color(0xFF1D4ED8),
                                            ),
                                          ),
                                        ),
                                      if (isAlreadyAssigned)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFE2E8F0),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Text(
                                            'Assigned',
                                            style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // Checkbox Selection
                          Checkbox(
                            value: isSelected,
                            activeColor: const Color(0xFFD34426),
                            onChanged: isDisabled ? null : (_) => _toggleStudent(sId),
                          ),
                        ],
                      ),

                      // Passage Selection per Student if selected
                      if (isSelected) ...[
                        const SizedBox(height: 8),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text('Passage Set:', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey[700])),
                            const SizedBox(width: 8),
                            Expanded(
                              child: InkWell(
                                onTap: () => _showPassagePickerModal(student),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFCBD5E1)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Expanded(
                                        child: Text(
                                          _getPassageLabel(selectedPassageId),
                                          style: GoogleFonts.inter(
                                            fontSize: 11,
                                            fontWeight: selectedPassageId.isNotEmpty ? FontWeight.bold : FontWeight.w500,
                                            color: selectedPassageId.isNotEmpty ? Colors.black87 : Colors.grey[500],
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const Icon(Icons.arrow_drop_down_rounded, size: 20, color: Colors.grey),
                                    ],
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
