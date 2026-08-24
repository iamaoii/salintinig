import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/widgets/app_toast.dart';
import 'package:salintinig/widgets/user_avatar.dart';

class TeacherStudentDetailsPage extends StatefulWidget {
  final String studentName;
  final String level;
  final String grade;
  final String section;
  final String lrn;

  const TeacherStudentDetailsPage({
    super.key,
    this.studentName = 'Adrian Matthew Cruz',
    this.level = 'Instructional',
    this.grade = 'Grade 4',
    this.section = 'Fyang',
    this.lrn = '1366 7010 0099',
  });

  @override
  State<TeacherStudentDetailsPage> createState() => _TeacherStudentDetailsPageState();
}

class _TeacherStudentDetailsPageState extends State<TeacherStudentDetailsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  void _showGenerateReportModal() {
    Feedback.forTap(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        bool isGenerating = false;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Iconify(Ph.article_bold, color: Color(0xFF1B64D8), size: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Generate Student Report',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: Colors.black,
                              ),
                            ),
                            Text(
                              widget.studentName,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: Colors.grey[600],
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFCFAF7),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        _buildReportOptionRow('Phil-IRI Reading Level', widget.level),
                        const Divider(height: 16),
                        _buildReportOptionRow('Reading Speed (WPS)', '67 wps'),
                        const Divider(height: 16),
                        _buildReportOptionRow('Overall Accuracy', '87%'),
                        const Divider(height: 16),
                        _buildReportOptionRow('Comprehension Score', '37%'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: isGenerating
                        ? null
                        : () async {
                            setModalState(() {
                              isGenerating = true;
                            });
                            await Future.delayed(const Duration(seconds: 2));
                            if (!context.mounted) return;
                            Navigator.pop(context);
                            AppToast.success(context, 'Report for ${widget.studentName} generated & downloaded successfully!');
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1B64D8),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: isGenerating
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Generating PDF Report...',
                                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                            ],
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.download_rounded, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                'Export PDF Report',
                                style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildReportOptionRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            color: Colors.grey[700],
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
      ],
    );
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
              child: SingleChildScrollView(
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
                          name: widget.studentName,
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
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Expanded(
                                    child: Text(
                                      widget.studentName,
                                      style: GoogleFonts.inter(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.black,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEF3C7),
                                      borderRadius: BorderRadius.circular(100),
                                    ),
                                    child: Text(
                                      widget.level,
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFFD97706),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  _buildInfoColumn('Grade Level', widget.grade),
                                  const SizedBox(width: 16),
                                  _buildInfoColumn('Section', widget.section),
                                  const SizedBox(width: 16),
                                  _buildInfoColumn('LRN', widget.lrn),
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
                        onPressed: _showGenerateReportModal,
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
                        child: Row(
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
                    const SizedBox(height: 28),

                    // Section: Analytics Header
                    Row(
                      children: [
                        const Iconify(
                          Ph.hourglass_medium_bold,
                          color: Color(0xFFD34426),
                          size: 22,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Analytics',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Stats Summary Row (Stories, Badges, Streak)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatItem('5', 'Stories', Ph.book_open_bold, const Color(0xFFE05234)),
                        _buildStatItem('5', 'Badges', Ph.shield_bold, const Color(0xFFD34426)),
                        _buildStatItem('5', 'Streak', Ph.flame_bold, const Color(0xFFE05234)),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Accuracy Trend Chart Card
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
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Center(
                            child: Text(
                              'model accuracy',
                              style: GoogleFonts.inter(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Custom Painter Line Chart representing accuracy trend
                          SizedBox(
                            height: 180,
                            child: CustomPaint(
                              painter: _AccuracyChartPainter(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Center(
                            child: Text(
                              'Accuracy Trend',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Performance Metric Cards (Reading Speed, Accuracy, Comprehension)
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            value: '67',
                            unit: 'wps',
                            label: 'Reading Speed',
                            iconColor: const Color(0xFFEAB308),
                            bgColor: const Color(0xFFFEF9C3),
                            icon: Ph.lightning_bold,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricCard(
                            value: '87%',
                            unit: '',
                            label: 'Accuracy',
                            iconColor: const Color(0xFF1B64D8),
                            bgColor: const Color(0xFFDBEAFE),
                            icon: Ph.target_bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            value: '37%',
                            unit: '',
                            label: 'Comprehension',
                            iconColor: const Color(0xFF10B981),
                            bgColor: const Color(0xFFD1FAE5),
                            icon: Ph.lightbulb_bold,
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
                          Ph.hourglass_medium_bold,
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

                    // Badges Grid
                    GridView.count(
                      crossAxisCount: 4,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: 0.75,
                      children: [
                        _buildBadgeItem('assets/badges/sipag_talino_badge.webp', 'Sipag at Talino'),
                        _buildBadgeItem('assets/badges/early_bird_badge.webp', 'Early Badge'),
                        _buildBadgeItem('assets/badges/10_day_streak_badge.webp', '10th Day Streak'),
                        _buildBadgeItem('assets/badges/ganda_talino_badge.webp', 'Ganda at Talino'),
                      ],
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

  Widget _buildStatItem(String count, String label, String iconName, Color iconColor) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Iconify(iconName, color: iconColor, size: 24),
        const SizedBox(width: 8),
        Text(
          count,
          style: GoogleFonts.inter(
            fontSize: 26,
            fontWeight: FontWeight.w900,
            color: Colors.black,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: Colors.grey[600],
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
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: Colors.black,
                      height: 1.0,
                    ),
                  ),
                  if (unit.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    Text(
                      unit,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey[500],
                      ),
                    ),
                  ],
                ],
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

  Widget _buildBadgeItem(String imagePath, String title) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Image.asset(
          imagePath,
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}

class _AccuracyChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final borderPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final gridPaint = Paint()
      ..color = const Color(0xFFF1F5F9)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final trainLinePaint = Paint()
      ..color = const Color(0xFF3B82F6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    final testLinePaint = Paint()
      ..color = const Color(0xFFF97316)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    canvas.drawRRect(RRect.fromRectAndRadius(rect, const Radius.circular(12)), borderPaint);

    // Draw horizontal grid lines
    for (int i = 1; i < 5; i++) {
      final y = size.height * (i / 5);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    // Legend box
    final legendRect = Rect.fromLTWH(12, 12, 80, 48);
    canvas.drawRRect(RRect.fromRectAndRadius(legendRect, const Radius.circular(6)), borderPaint);

    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    
    // Train Legend
    canvas.drawLine(const Offset(18, 26), const Offset(36, 26), trainLinePaint);
    textPainter.text = TextSpan(
      text: 'train',
      style: GoogleFonts.inter(fontSize: 11, color: Colors.black87),
    );
    textPainter.layout();
    textPainter.paint(canvas, const Offset(42, 20));

    // Test Legend
    canvas.drawLine(const Offset(18, 44), const Offset(36, 44), testLinePaint);
    textPainter.text = TextSpan(
      text: 'test',
      style: GoogleFonts.inter(fontSize: 11, color: Colors.black87),
    );
    textPainter.layout();
    textPainter.paint(canvas, const Offset(42, 38));

    // Train Line Path
    final trainPath = Path();
    trainPath.moveTo(size.width * 0.05, size.height * 0.90);
    trainPath.quadraticBezierTo(size.width * 0.20, size.height * 0.35, size.width * 0.35, size.height * 0.25);
    trainPath.quadraticBezierTo(size.width * 0.50, size.height * 0.18, size.width * 0.70, size.height * 0.14);
    trainPath.lineTo(size.width * 0.95, size.height * 0.10);
    canvas.drawPath(trainPath, trainLinePaint);

    // Test Line Path
    final testPath = Path();
    testPath.moveTo(size.width * 0.05, size.height * 0.65);
    testPath.quadraticBezierTo(size.width * 0.25, size.height * 0.35, size.width * 0.40, size.height * 0.25);
    testPath.lineTo(size.width * 0.55, size.height * 0.45);
    testPath.quadraticBezierTo(size.width * 0.75, size.height * 0.28, size.width * 0.95, size.height * 0.18);
    canvas.drawPath(testPath, testLinePaint);

    // Epoch Axis Labels
    final epochLabels = ['0', '2', '4', '6', '8'];
    final epochPositions = [0.08, 0.30, 0.52, 0.72, 0.92];
    for (int i = 0; i < epochLabels.length; i++) {
      textPainter.text = TextSpan(
        text: epochLabels[i],
        style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[700], fontWeight: FontWeight.w600),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(size.width * epochPositions[i], size.height - 18));
    }

    textPainter.text = TextSpan(
      text: 'epoch',
      style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[700], fontWeight: FontWeight.w500),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(size.width * 0.5 - 12, size.height - 10));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
