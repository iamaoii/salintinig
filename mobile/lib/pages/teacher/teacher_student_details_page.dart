import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:salintinig/widgets/user_avatar.dart';
import 'package:salintinig/models/quest_item.dart';

class TeacherStudentDetailsPage extends StatefulWidget {
  final String studentName;
  final String level;
  final String grade;
  final String section;
  final String lrn;
  final Map<String, dynamic>? studentData;

  const TeacherStudentDetailsPage({
    super.key,
    this.studentName = '',
    this.level = 'Pending Evaluation',
    this.grade = '',
    this.section = '',
    this.lrn = '',
    this.studentData,
  });

  @override
  State<TeacherStudentDetailsPage> createState() => _TeacherStudentDetailsPageState();
}

class _TeacherStudentDetailsPageState extends State<TeacherStudentDetailsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  Map<String, dynamic>? _resolvedData;
  bool _isLoadingApi = false;
  String _profilePeriod = 'pre_test';
  String _profileLanguage = 'fil';

  @override
  void initState() {
    super.initState();
    _resolveStudentData();
    _fetchStudentDetailsApi();
  }

  void _resolveStudentData() {
    if (widget.studentData != null && widget.studentData!.isNotEmpty) {
      _resolvedData = Map<String, dynamic>.from(widget.studentData!);
    } else if (AuthService.cachedClassStudents != null) {
      final match = AuthService.cachedClassStudents!.firstWhere(
        (s) {
          final sName = (s['name'] ?? '').toString().toLowerCase().trim();
          final wName = widget.studentName.toLowerCase().trim();
          final sLrn = (s['lrn'] ?? '').toString().trim();
          final wLrn = widget.lrn.trim();
          return (wLrn.isNotEmpty && sLrn == wLrn) || (wName.isNotEmpty && sName.contains(wName));
        },
        orElse: () => <String, dynamic>{},
      );
      if (match.isNotEmpty) {
        _resolvedData = Map<String, dynamic>.from(match);
      }
    }
  }

  Future<void> _fetchStudentDetailsApi() async {
    final targetLrn = (_resolvedData?['lrn'] ?? widget.lrn).toString().replaceAll(' ', '').trim();
    if (targetLrn.isEmpty) return;

    if (mounted) setState(() => _isLoadingApi = true);
    try {
      final res = await ApiService.get('/api/teacher/students/$targetLrn');
      if (res.success && res.data != null && res.data['student'] != null) {
        if (mounted) {
          setState(() {
            _resolvedData = Map<String, dynamic>.from(res.data['student']);
          });
        }
      }
    } catch (e) {
      debugPrint('[TeacherStudentDetailsPage] API fetch error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingApi = false);
    }
  }

  num _safeParseNum(dynamic val) {
    if (val == null) return 0;
    if (val is num) return val;
    if (val is String) return num.tryParse(val) ?? 0;
    return 0;
  }

  int _safeParseInt(dynamic val) {
    if (val == null) return 0;
    if (val is int) return val;
    if (val is num) return val.toInt();
    if (val is String) return int.tryParse(val) ?? 0;
    return 0;
  }

  String get _displayName {
    final raw = (_resolvedData?['name'] ?? widget.studentName).toString().trim();
    if (raw.isNotEmpty && raw != 'Student') return raw;
    final first = (_resolvedData?['firstName'] ?? _resolvedData?['first_name'] ?? '').toString().trim();
    final last = (_resolvedData?['lastName'] ?? _resolvedData?['last_name'] ?? '').toString().trim();
    final full = '$first $last'.trim();
    return full.isNotEmpty ? full : (widget.studentName.isNotEmpty ? widget.studentName : 'Student Record');
  }

  String get _displayLrn => (_resolvedData?['lrn'] ?? widget.lrn).toString().trim();
  String get _displayGrade => (_resolvedData?['grade'] ?? _resolvedData?['gradeLevel'] ?? _resolvedData?['grade_level'] ?? widget.grade).toString().trim();
  String get _displaySection => (_resolvedData?['section'] ?? _resolvedData?['sectionName'] ?? _resolvedData?['section_name'] ?? widget.section).toString().trim();
  String? get _avatarUrl => (_resolvedData?['profileImage'] ?? _resolvedData?['profile_image'] ?? _resolvedData?['avatarUrl'])?.toString();

  Map<String, dynamic>? get _selectedAdaptiveProfile {
    final profiles = (_resolvedData?['oralAdaptiveProfiles'] as List?) ?? [];
    for (final p in profiles) {
      if (p is Map) {
        final lang = (p['language'] ?? '').toString().toLowerCase().startsWith('en') ? 'en' : 'fil';
        final period = (p['period'] ?? 'pre_test').toString().toLowerCase();
        if (lang == _profileLanguage && period == _profilePeriod) {
          return Map<String, dynamic>.from(p);
        }
      }
    }
    return null;
  }

  List<Map<String, dynamic>> get _oralEvidence {
    final activities = (_resolvedData?['activities'] as List?) ?? [];
    final filtered = <Map<String, dynamic>>[];
    for (final act in activities) {
      if (act is Map) {
        final status = (act['status'] ?? '').toString().toLowerCase();
        if (status == 'done' || status == 'completed' || status == 'finished') {
          final type = (act['assessmentType'] ?? '').toString().toLowerCase();
          final lang = (act['language'] ?? '').toString().toLowerCase().startsWith('en') ? 'en' : 'fil';
          final period = (act['assessmentPeriod'] ?? 'pre_test').toString().toLowerCase();
          if (type == 'oral' && lang == _profileLanguage && period == _profilePeriod) {
            filtered.add(Map<String, dynamic>.from(act));
          }
        }
      }
    }
    return filtered;
  }

  num _evidenceAverage(String key) {
    final evidence = _oralEvidence;
    if (evidence.isEmpty) return 0;
    num sum = 0;
    for (final item in evidence) {
      sum += _safeParseNum(item[key] ?? item[key.replaceAll('Score', '')]);
    }
    return (sum / evidence.length).round();
  }

  num get _wpsVal => _evidenceAverage('readingSpeed');
  num get _accuracyVal => _evidenceAverage('accuracyScore');
  num get _comprehensionVal => _evidenceAverage('comprehensionScore');

  List<Widget> _buildDiagnosticEvidenceRows() {
    final profile = _selectedAdaptiveProfile;
    final evidenceItems = _oralEvidence;

    final config = [
      {'label': 'Independent', 'key': 'independent', 'level': profile?['independentLevel'], 'bg': const Color(0xFFECFDF5), 'text': const Color(0xFF065F46)},
      {'label': 'Instructional', 'key': 'instructional', 'level': profile?['instructionalLevel'], 'bg': const Color(0xFFFFFBEB), 'text': const Color(0xFF92400E)},
      {'label': 'Frustrational', 'key': 'frustrational', 'level': profile?['frustrationalLevel'], 'bg': const Color(0xFFFFF1F2), 'text': const Color(0xFF9F1239)},
    ];

    return config.map((c) {
      final label = c['label'] as String;
      final key = c['key'] as String;
      final level = (c['level'] ?? '').toString();
      final bg = c['bg'] as Color;
      final textColor = c['text'] as Color;

      final gradeMatch = RegExp(r'\d+').firstMatch(level)?.group(0);
      final resultPrefix = key == 'frustrational' ? 'frustr' : key;

      Map<String, dynamic>? evidence;
      if (gradeMatch != null) {
        for (final item in evidenceItems) {
          final itemGrade = RegExp(r'\d+').firstMatch((item['passageGradeLevel'] ?? '').toString())?.group(0);
          final res = (item['readingLevelResult'] ?? '').toString().toLowerCase();
          if (itemGrade == gradeMatch && (res.isEmpty || res.startsWith(resultPrefix))) {
            evidence = item;
            break;
          }
        }
      }
      evidence ??= evidenceItems.firstWhere(
        (item) => (item['readingLevelResult'] ?? '').toString().toLowerCase().startsWith(resultPrefix),
        orElse: () => <String, dynamic>{},
      );
      if (evidence.isEmpty) evidence = null;

      final formattedGrade = level.isEmpty ? '—' : (level.toLowerCase().startsWith('grade') ? level : 'Grade $level');

      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(
            left: BorderSide(color: Color(0xFFE2E8F0)),
            right: BorderSide(color: Color(0xFFE2E8F0)),
            bottom: BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            SizedBox(
              width: 95,
              child: UnconstrainedBox(
                alignment: Alignment.centerLeft,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: bg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    label,
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: textColor),
                  ),
                ),
              ),
            ),
            SizedBox(
              width: 65,
              child: Text(
                formattedGrade,
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black),
              ),
            ),
            Expanded(
              child: evidence != null
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (evidence['passageTitle'] ?? evidence['passageSet'] ?? 'Oral Assessment').toString(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black),
                        ),
                        Text(
                          '${evidence['passageSet'] ?? ''} · ${evidence['accuracyScore'] ?? 0}% Acc · ${evidence['comprehensionScore'] ?? 0}% Comp',
                          style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[600]),
                        ),
                      ],
                    )
                  : Text(
                      'No reviewed result yet',
                      style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[400]),
                    ),
            ),
          ],
        ),
      );
    }).toList();
  }

  int get _storiesVal {
    final storiesList = _resolvedData?['stories'];
    if (storiesList is List) return storiesList.length;
    return _safeParseInt(
      _resolvedData?['storiesCount'] ??
      _resolvedData?['storiesRead'] ??
      _resolvedData?['stories_read'] ??
      _resolvedData?['completedStoriesCount'],
    );
  }

  int get _badgesVal {
    final badgesList = _resolvedData?['badges'];
    if (badgesList is List) return badgesList.length;
    return _safeParseInt(
      _resolvedData?['badgesCount'] ??
      _resolvedData?['badges_count'],
    );
  }

  int get _streakVal {
    final streak = _resolvedData?['streakCount'] ??
        _resolvedData?['streak_count'] ??
        _resolvedData?['streak_days'] ??
        _resolvedData?['currentStreak'] ??
        _resolvedData?['streak'];
    return _safeParseInt(streak);
  }

  String _reportGrade(dynamic value) {
    final raw = (value ?? '').toString().trim();
    if (raw.isEmpty) return '-';
    final match = RegExp(r'\d+').firstMatch(raw);
    return match == null ? raw : 'Grade ${match.group(0)}';
  }

  List<Map<String, dynamic>> _reportActivities() => (_resolvedData?['activities'] as List? ?? [])
      .whereType<Map>()
      .where((item) {
        final status = (item['status'] ?? '').toString().toLowerCase();
        return status == 'done' || status == 'completed' || status == 'finished';
      })
      .map((item) => Map<String, dynamic>.from(item))
      .toList();

  List<Map<String, dynamic>> _reportBoundaries(Map<String, dynamic>? profile, List<Map<String, dynamic>> evidenceItems) {
    const entries = [
      ('Independent', 'independent', 'independentLevel'),
      ('Instructional', 'instructional', 'instructionalLevel'),
      ('Frustrational', 'frustr', 'frustrationalLevel'),
    ];
    return entries.map((entry) {
      final level = profile?[entry.$3];
      final grade = RegExp(r'\d+').firstMatch((level ?? '').toString())?.group(0);
      final evidence = evidenceItems.cast<Map<String, dynamic>?>().firstWhere(
        (item) {
          if (item == null) return false;
          final result = (item['readingLevelResult'] ?? '').toString().toLowerCase();
          final itemGrade = RegExp(r'\d+').firstMatch((item['passageGradeLevel'] ?? '').toString())?.group(0);
          return result.startsWith(entry.$2) && (grade == null || itemGrade == grade);
        },
        orElse: () => evidenceItems.cast<Map<String, dynamic>?>().firstWhere(
          (item) => item != null && (item['readingLevelResult'] ?? '').toString().toLowerCase().startsWith(entry.$2),
          orElse: () => null,
        ),
      );
      return {'label': entry.$1, 'level': _reportGrade(level), 'evidence': evidence};
    }).toList();
  }

  Future<void> _generateStudentReport() async {
    final activities = _reportActivities();
    final profiles = ((_resolvedData?['oralAdaptiveProfiles'] as List?) ?? [])
        .whereType<Map>()
        .map((profile) => Map<String, dynamic>.from(profile))
        .toList();
    final doc = pw.Document();
    pw.MemoryImage? logo;
    try {
      logo = pw.MemoryImage((await rootBundle.load('assets/logo/logo.png')).buffer.asUint8List());
    } catch (_) {}

    final accuracy = activities.isEmpty ? 0 : (activities.fold<num>(0, (sum, item) => sum + _safeParseNum(item['accuracyScore'])) / activities.length).round();
    final comprehension = activities.isEmpty ? 0 : (activities.fold<num>(0, (sum, item) => sum + _safeParseNum(item['comprehensionScore'])) / activities.length).round();
    final speed = activities.isEmpty ? 0 : (activities.fold<num>(0, (sum, item) => sum + _safeParseNum(item['readingSpeed'])) / activities.length).round();
    final now = DateTime.now();
    final reportDate = '${const ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.month - 1]} ${now.day}, ${now.year}';

    pw.Widget heading(String value) => pw.Padding(
      padding: const pw.EdgeInsets.only(top: 12, bottom: 6),
      child: pw.Text(value, style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
    );
    pw.Widget field(String label, String value) => pw.Expanded(child: pw.Padding(
      padding: const pw.EdgeInsets.all(4),
      child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey700)),
        pw.SizedBox(height: 3),
        pw.Text(value.isEmpty ? '-' : value, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
      ]),
    ));
    pw.Widget metric(String label, String value, String description) => pw.Expanded(child: pw.Container(
      padding: const pw.EdgeInsets.all(8),
      decoration: pw.BoxDecoration(border: pw.Border.all(color: PdfColors.grey700)),
      child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 7)),
        pw.SizedBox(height: 4),
        pw.Text(value, style: pw.TextStyle(fontSize: 14, color: PdfColors.blue800, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 3),
        pw.Text(description, style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey700)),
      ]),
    ));

    doc.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(16 * PdfPageFormat.mm),
      footer: (context) => pw.Container(
        padding: const pw.EdgeInsets.only(top: 7),
        decoration: const pw.BoxDecoration(border: pw.Border(top: pw.BorderSide(color: PdfColors.grey300))),
        child: pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
          pw.Text('SalinTinig Official Student Assessment Document - Confidential Educational Record', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600)),
          pw.Text('Page ${context.pageNumber} of ${context.pagesCount}', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey600)),
        ]),
      ),
      build: (context) => [
        pw.Row(children: [
          if (logo != null) pw.Image(logo, width: 34, height: 34),
          if (logo != null) pw.SizedBox(width: 8),
          pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
            pw.Text('SalinTinig', style: pw.TextStyle(fontSize: 17, fontWeight: pw.FontWeight.bold)),
            pw.Text('COMPREHENSIVE STUDENT READING & PERFORMANCE REPORT', style: pw.TextStyle(fontSize: 10, color: PdfColors.blue800, fontWeight: pw.FontWeight.bold)),
            pw.Text('Phil-IRI & Adaptive Literacy Assessment System', style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey600)),
          ]),
        ]),
        pw.Container(margin: const pw.EdgeInsets.only(top: 8), height: 1, color: PdfColors.blue800),
        pw.SizedBox(height: 8),
        pw.Container(decoration: pw.BoxDecoration(border: pw.Border.all()), child: pw.Column(children: [
          pw.Row(children: [field('FULL NAME', _displayName), field('LEARNER REFERENCE NO. (LRN)', _displayLrn), field('GRADE & SECTION', '$_displayGrade${_displaySection.isEmpty ? '' : ' / $_displaySection'}')]),
          pw.Row(children: [field('TOTAL ASSESSMENTS TAKEN', '${activities.length} completed record(s)'), field('REPORT DATE', reportDate), pw.Spacer()]),
        ])),
        heading('Executive Reading Performance Summary'),
        pw.Row(children: [metric('Overall Average Accuracy', '$accuracy%', 'Oral Reading Precision'), pw.SizedBox(width: 5), metric('Overall Average Comprehension', '$comprehension%', 'Understanding & Recall'), pw.SizedBox(width: 5), metric('Average Reading Speed', '$speed WPS', 'Words Per Second Rate')]),
        if (profiles.isNotEmpty) heading('Phil-IRI Diagnostic Oral Reading Profiles'),
        ...profiles.expand((profile) {
          final language = (profile['language'] ?? '').toString().toLowerCase().startsWith('en') ? 'English' : 'Filipino';
          final period = (profile['period'] ?? 'pre_test').toString().toLowerCase() == 'post_test' ? 'Post-Test' : 'Pre-Test';
          final evidence = activities.where((item) => (item['assessmentType'] ?? '').toString().toLowerCase() == 'oral' && ((item['language'] ?? '').toString().toLowerCase().startsWith('en') ? 'English' : 'Filipino') == language && ((item['assessmentPeriod'] ?? 'pre_test').toString().toLowerCase() == 'post_test' ? 'Post-Test' : 'Pre-Test') == period).toList();
          final rows = _reportBoundaries(profile, evidence);
          return <pw.Widget>[
            pw.Text('$period - $language Oral Reading Profile', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 4),
            pw.TableHelper.fromTextArray(
              headers: const ['RESULT BOUNDARY', 'CONFIRMED GRADE LEVEL', 'TEACHER-REVIEWED EVIDENCE BASIS'],
              data: rows.map((row) { final item = row['evidence'] as Map<String, dynamic>?; return [row['label'], row['level'], item == null ? 'No reviewed assessment evidence recorded' : '${item['passageTitle'] ?? item['passageSet'] ?? 'Oral Assessment'} (${item['passageSet'] ?? ''}) - Acc: ${item['accuracyScore'] ?? 0}%, Comp: ${item['comprehensionScore'] ?? 0}%']; }).toList(),
              headerStyle: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold), cellStyle: const pw.TextStyle(fontSize: 7), headerDecoration: const pw.BoxDecoration(color: PdfColors.grey200), border: pw.TableBorder.all(color: PdfColors.grey500, width: .4), cellPadding: const pw.EdgeInsets.all(4),
            ),
            pw.SizedBox(height: 8),
          ];
        }),
        if (activities.isNotEmpty) heading('Phil-IRI Assessment Attempt History'),
        if (activities.isNotEmpty) pw.TableHelper.fromTextArray(
          headers: const ['PASSAGE TITLE / RECORD', 'TYPE / LANG', 'ACCURACY', 'COMPREHENSION', 'RESULT LEVEL'],
          data: activities.map((item) => ['${item['passageTitle'] ?? item['title'] ?? item['passageSet'] ?? 'Assessment Attempt'}', '${(item['assessmentType'] ?? 'oral').toString().toUpperCase()} / ${(item['language'] ?? 'fil').toString().toUpperCase()}', '${item['accuracyScore'] ?? '-'}%', '${item['comprehensionScore'] ?? '-'}%', '${item['readingLevelResult'] ?? item['level'] ?? 'Completed'}']).toList(),
          headerStyle: pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold), cellStyle: const pw.TextStyle(fontSize: 7), headerDecoration: const pw.BoxDecoration(color: PdfColors.grey200), border: pw.TableBorder.all(color: PdfColors.grey500, width: .4), cellPadding: const pw.EdgeInsets.all(3),
        ),
        heading('Student Reading Achievements & Milestones'),
        pw.Text('Unlocked Badges ($_badgesVal)', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
        pw.Text(_badgesVal == 0 ? 'No achievement badges unlocked yet.' : ((_resolvedData?['badges'] as List?) ?? []).map((item) => item is Map ? (item['badgeName'] ?? item['name'] ?? '').toString() : item.toString()).where((s) => s.isNotEmpty).join(' - '), style: const pw.TextStyle(fontSize: 8)),
        pw.SizedBox(height: 6),
        pw.Text('Completed Reading Stories ($_storiesVal)', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
        pw.Text(_storiesVal == 0 ? 'No reading stories completed yet.' : ((_resolvedData?['stories'] as List?) ?? []).map((item) => item is Map ? (item['title'] ?? '').toString() : item.toString()).where((s) => s.isNotEmpty).join(' - '), style: const pw.TextStyle(fontSize: 8)),
        heading('Teacher Remarks & Literacy Intervention Recommendations'),
        pw.Container(height: 72, padding: const pw.EdgeInsets.all(8), decoration: pw.BoxDecoration(border: pw.Border.all()), child: pw.Column(crossAxisAlignment: pw.CrossAxisAlignment.start, children: [
          pw.Text('[ ] Individual Remediation Recommended   [ ] Peer Reading Buddy Program   [ ] Maintain Independent Progress', style: const pw.TextStyle(fontSize: 7)),
          pw.SizedBox(height: 14), pw.Divider(), pw.SizedBox(height: 12), pw.Divider(),
        ])),
      ],
    ));
    final cleanName = _displayName.replaceAll(RegExp(r'[^A-Za-z0-9]+'), '-').replaceAll(RegExp(r'^-+|-+$'), '');
    final fileName = 'SalinTinig-Reading-Profile-${cleanName.isEmpty ? 'Student' : cleanName}.pdf';
    final pdfBytes = await doc.save();

    try {
      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdfBytes,
        name: fileName,
      );
    } catch (_) {
      await Printing.sharePdf(bytes: pdfBytes, filename: fileName);
    }
  }

  bool _isGeneratingPdf = false;

  Future<void> _triggerPdfGeneration() async {
    if (_isGeneratingPdf) return;
    Feedback.forTap(context);
    setState(() => _isGeneratingPdf = true);
    try {
      await _generateStudentReport();
      if (!mounted) return;
      AppToast.success(context, 'Report for $_displayName is ready.');
    } catch (e, stack) {
      debugPrint('[TeacherStudentDetailsPage] PDF report export error: $e\n$stack');
      if (!mounted) return;
      AppToast.error(context, 'Unable to export PDF report: $e');
    } finally {
      if (mounted) setState(() => _isGeneratingPdf = false);
    }
  }



  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar
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
                    'Student',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(width: 48),
                ],
              ),
            ),
            Expanded(
              child: _isLoadingApi && _resolvedData == null
                  ? _buildSkeletonBody()
                  : SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                    // Profile Header Card
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Avatar Circle
                        InitialsAvatar(
                          name: _displayName,
                          imageUrl: _avatarUrl,
                          radius: 38,
                          fontSize: 26,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Full name',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: Colors.grey[500],
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _displayName,
                                style: GoogleFonts.inter(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black,
                                  height: 1.25,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  _buildInfoColumn('Grade Level', _displayGrade),
                                  const SizedBox(width: 16),
                                  _buildInfoColumn('Section', _displaySection),
                                  const SizedBox(width: 16),
                                  _buildInfoColumn('LRN', _displayLrn),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Generate Report Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isGeneratingPdf ? null : _triggerPdfGeneration,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryBlue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 2,
                          shadowColor: primaryBlue.withValues(alpha: 0.3),
                        ),
                        child: _isGeneratingPdf
                            ? Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    'Generating PDF...',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Iconify(Ph.article_bold, color: Colors.white, size: 20),
                                  const SizedBox(width: 10),
                                  Text(
                                    'Generate report',
                                    style: GoogleFonts.inter(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Stats Summary Pill Card (Stories, Badges, Streak - matching Duolingo style pill container)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: _buildPillStatColumn('$_storiesVal', 'Stories', Ph.book_open_bold, const Color(0xFFE05234)),
                          ),
                          Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                          Expanded(
                            child: _buildPillStatColumn('$_badgesVal', 'Badges', Ph.shield_bold, const Color(0xFFD34426)),
                          ),
                          Container(width: 1, height: 28, color: const Color(0xFFE2E8F0)),
                          Expanded(
                            child: _buildPillStatColumn('$_streakVal', 'Streak', Ph.flame_bold, const Color(0xFFEA580C)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Section: Oral Reading Adaptive Profile (Matching Web Version)
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              // Period Pill Switcher (Pre-Test / Post-Test)
                              Expanded(
                                child: Container(
                                  height: 38,
                                  padding: const EdgeInsets.all(3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: LayoutBuilder(
                                    builder: (context, constraints) {
                                      final halfWidth = (constraints.maxWidth - 6) / 2;
                                      final isPre = _profilePeriod == 'pre_test';
                                      return Stack(
                                        children: [
                                          AnimatedAlign(
                                            duration: const Duration(milliseconds: 220),
                                            curve: Curves.easeInOut,
                                            alignment: isPre ? Alignment.centerLeft : Alignment.centerRight,
                                            child: Container(
                                              width: halfWidth,
                                              height: double.infinity,
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius: BorderRadius.circular(100),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black.withValues(alpha: 0.08),
                                                    blurRadius: 4,
                                                    offset: const Offset(0, 1),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              Expanded(
                                                child: GestureDetector(
                                                  behavior: HitTestBehavior.opaque,
                                                  onTap: () => setState(() => _profilePeriod = 'pre_test'),
                                                  child: Center(
                                                    child: Text(
                                                      'Pre-Test',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        fontWeight: isPre ? FontWeight.w800 : FontWeight.w600,
                                                        color: isPre ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              Expanded(
                                                child: GestureDetector(
                                                  behavior: HitTestBehavior.opaque,
                                                  onTap: () => setState(() => _profilePeriod = 'post_test'),
                                                  child: Center(
                                                    child: Text(
                                                      'Post-Test',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        fontWeight: !isPre ? FontWeight.w800 : FontWeight.w600,
                                                        color: !isPre ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Language Pill Switcher (Filipino / English)
                              Expanded(
                                child: Container(
                                  height: 38,
                                  padding: const EdgeInsets.all(3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: LayoutBuilder(
                                    builder: (context, constraints) {
                                      final halfWidth = (constraints.maxWidth - 6) / 2;
                                      final isFil = _profileLanguage == 'fil';
                                      return Stack(
                                        children: [
                                          AnimatedAlign(
                                            duration: const Duration(milliseconds: 220),
                                            curve: Curves.easeInOut,
                                            alignment: isFil ? Alignment.centerLeft : Alignment.centerRight,
                                            child: Container(
                                              width: halfWidth,
                                              height: double.infinity,
                                              decoration: BoxDecoration(
                                                color: Colors.white,
                                                borderRadius: BorderRadius.circular(100),
                                                boxShadow: [
                                                  BoxShadow(
                                                    color: Colors.black.withValues(alpha: 0.08),
                                                    blurRadius: 4,
                                                    offset: const Offset(0, 1),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          Row(
                                            children: [
                                              Expanded(
                                                child: GestureDetector(
                                                  behavior: HitTestBehavior.opaque,
                                                  onTap: () => setState(() => _profileLanguage = 'fil'),
                                                  child: Center(
                                                    child: Text(
                                                      'Filipino',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        fontWeight: isFil ? FontWeight.w800 : FontWeight.w600,
                                                        color: isFil ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              Expanded(
                                                child: GestureDetector(
                                                  behavior: HitTestBehavior.opaque,
                                                  onTap: () => setState(() => _profileLanguage = 'en'),
                                                  child: Center(
                                                    child: Text(
                                                      'English',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        fontWeight: !isFil ? FontWeight.w800 : FontWeight.w600,
                                                        color: !isFil ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          // Table Header
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                              border: Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 95,
                                  child: Text('RESULT', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[600])),
                                ),
                                SizedBox(
                                  width: 65,
                                  child: Text('GRADE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[600])),
                                ),
                                Expanded(
                                  child: Text('ASSESSMENT BASIS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey[600])),
                                ),
                              ],
                            ),
                          ),
                          // Table Rows
                          ..._buildDiagnosticEvidenceRows(),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Performance Metric Cards (Average Accuracy, Average Comprehension, Average Reading Speed)
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            value: '$_accuracyVal%',
                            unit: '',
                            label: 'Average\nAccuracy',
                            iconColor: const Color(0xFF1B64D8),
                            bgColor: const Color(0xFFDBEAFE),
                            icon: Ph.target_bold,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricCard(
                            value: '$_comprehensionVal%',
                            unit: '',
                            label: 'Average\nComprehension',
                            iconColor: const Color(0xFF10B981),
                            bgColor: const Color(0xFFD1FAE5),
                            icon: Ph.lightbulb_bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            value: '$_wpsVal',
                            unit: 'WPS',
                            label: 'Average\nReading Speed',
                            iconColor: const Color(0xFFD97706),
                            bgColor: const Color(0xFFFEF3C7),
                            icon: Ph.gauge_bold,
                          ),
                        ),
                        const Expanded(child: SizedBox()),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Section: Badges Header
                    Row(
                      children: [
                        const Iconify(
                          Ph.shield_bold,
                          color: Color(0xFFD34426),
                          size: 22,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Badges',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Badges Horizontal List
                    _buildBadgesHorizontalList(),
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

  List<Map<String, dynamic>> get _badgeItems {
    final rawBadges = _resolvedData?['badges'];
    if (rawBadges is List && rawBadges.isNotEmpty) {
      final list = <Map<String, dynamic>>[];
      for (final b in rawBadges) {
        if (b is Map) {
          final id = (b['id'] ?? b['badge_id'] ?? b['badgeId'] ?? '').toString().toLowerCase();
          final name = (b['badgeName'] ?? b['name'] ?? b['title'] ?? '').toString();
          final iconPath = (b['iconPath'] ?? b['badgeAsset'] ?? '').toString();

          final foundQuest = BadgesData.allQuests.firstWhere(
            (q) => q.id.toLowerCase() == id || q.title.toLowerCase() == name.toLowerCase(),
            orElse: () => const QuestItem(
              id: '',
              title: '',
              description: '',
              badgeAsset: 'assets/badges/first_step_badge.webp',
              category: '',
              currentProgress: 1,
              maxProgress: 1,
              isUnlocked: true,
              rewardPoints: '',
            ),
          );

          final asset = foundQuest.id.isNotEmpty
              ? foundQuest.badgeAsset
              : (iconPath.isNotEmpty ? iconPath : 'assets/badges/first_step_badge.webp');

          list.add({
            'name': name.isNotEmpty ? name : foundQuest.title,
            'asset': asset,
            'isUnlocked': true,
          });
        }
      }
      return list;
    }

    return [];
  }

  Widget _buildBadgesHorizontalList() {
    final badges = _badgeItems;
    if (badges.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFCFAF7),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Iconify(
              Ph.medal_bold,
              color: Color(0xFFCBD5E1),
              size: 32,
            ),
            const SizedBox(height: 10),
            Text(
              'No Badges Unlocked Yet',
              style: GoogleFonts.inter(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'This student has not unlocked any achievement badges yet.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: const Color(0xFF64748B),
                height: 1.3,
              ),
            ),
          ],
        ),
      );
    }

    return SizedBox(
      height: 110,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: badges.length,
        separatorBuilder: (context, index) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final badge = badges[index];
          final asset = badge['asset'] as String;
          final name = badge['name'] as String;
          final isUnlocked = badge['isUnlocked'] == true;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 6,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Opacity(
                  opacity: isUnlocked ? 1.0 : 0.4,
                  child: asset.startsWith('http')
                      ? Image.network(asset, fit: BoxFit.contain, errorBuilder: (ctx, err, stack) => Image.asset('assets/badges/first_step_badge.webp', fit: BoxFit.contain))
                      : Image.asset(asset, fit: BoxFit.contain, errorBuilder: (ctx, err, stack) => Image.asset('assets/badges/first_step_badge.webp', fit: BoxFit.contain)),
                ),
              ),
              const SizedBox(height: 6),
              SizedBox(
                width: 80,
                child: Text(
                  name,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isUnlocked ? const Color(0xFF0F172A) : Colors.grey[500],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: Colors.grey[500],
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Colors.black,
          ),
        ),
      ],
    );
  }

  Widget _buildPillStatColumn(String count, String label, String iconName, Color iconColor) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Iconify(iconName, color: iconColor, size: 20),
            const SizedBox(width: 8),
            Text(
              count,
              style: GoogleFonts.inter(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String value,
    required String unit,
    required String label,
    required Color iconColor,
    required Color bgColor,
    required String icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Flexible(
                      child: Text(
                        value,
                        style: GoogleFonts.inter(
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                          height: 1.0,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (unit.isNotEmpty) ...[
                      const SizedBox(width: 4),
                      Text(
                        unit,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Iconify(icon, color: iconColor, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildSkeletonBody() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: const BoxDecoration(
                  color: Color(0xFFE2E8F0),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 60, height: 12, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                    const SizedBox(height: 6),
                    Container(width: 160, height: 20, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(6))),
                    const SizedBox(height: 8),
                    Container(width: 100, height: 22, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(100))),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(width: 50, height: 14, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                        const SizedBox(width: 16),
                        Container(width: 50, height: 14, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                        const SizedBox(width: 16),
                        Container(width: 80, height: 14, decoration: BoxDecoration(color: const Color(0xFFE2E8F0), borderRadius: BorderRadius.circular(4))),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFE2E8F0),
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          const SizedBox(height: 28),
          Container(
            width: double.infinity,
            height: 200,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: Container(height: 80, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))))),
              const SizedBox(width: 12),
              Expanded(child: Container(height: 80, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))))),
            ],
          ),
        ],
      ),
    );
  }
}
