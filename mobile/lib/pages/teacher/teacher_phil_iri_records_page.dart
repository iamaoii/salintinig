import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/pages/teacher/teacher_form_details_page.dart';
import 'package:salintinig/services/auth_service.dart';
import 'package:salintinig/services/notification_service.dart';
import 'package:salintinig/widgets/notification_bell_icon_button.dart';
import 'package:salintinig/widgets/teacher_sidebar_drawer.dart';

class TeacherPhilIriRecordsPage extends StatefulWidget {
  final String className;
  const TeacherPhilIriRecordsPage({
    super.key,
    this.className = 'Grade 4 - FYANG',
  });

  @override
  State<TeacherPhilIriRecordsPage> createState() => _TeacherPhilIriRecordsPageState();
}

class _TeacherPhilIriRecordsPageState extends State<TeacherPhilIriRecordsPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isLoadingRecords = true;

  @override
  void initState() {
    super.initState();
    _loadRecords();
  }

  final List<Map<String, dynamic>> _forms = [
    {
      'title': 'FORM 1A',
      'subtitle': 'Talaan ng Pangkatang Pagtatasa ng Klase (TPPK)',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFFEF08A),
      'iconColor': const Color(0xFFCA8A04),
      'icon': Ph.users_three,
      'buttonColor': const Color(0xFF059669),
    },
    {
      'title': 'FORM 1B',
      'subtitle': 'Screening Test Class Reading Record (STCRR)',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFDBEAFE),
      'iconColor': const Color(0xFF2563EB),
      'icon': Ph.users_three,
      'buttonColor': const Color(0xFFEAB308),
    },
    {
      'title': 'FORM 3A',
      'subtitle': 'Talaan ng Indibidwal na Pagtatasa sa Pagbabasa',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFFEF08A),
      'iconColor': const Color(0xFFCA8A04),
      'icon': Ph.user_circle,
      'buttonColor': const Color(0xFF1D4ED8),
    },
    {
      'title': 'FORM 3B',
      'subtitle': 'Individual Reading Profile',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFDBEAFE),
      'iconColor': const Color(0xFF2563EB),
      'icon': Ph.user_circle,
      'buttonColor': const Color(0xFF1D4ED8),
    },
    {
      'title': 'FORM 4',
      'subtitle': 'Running Record Form',
      'bgColor': Colors.white,
      'borderColor': const Color(0xFFE2E8F0),
      'iconBg': const Color(0xFFD1FAE5),
      'iconColor': const Color(0xFF059669),
      'icon': Ph.user,
      'buttonColor': const Color(0xFF1D4ED8),
    },
  ];

  void _onFormOpen(String formTitle, String subtitle) {
    Feedback.forTap(context);

    final bool hasGSTCards = formTitle == 'FORM 1A' || formTitle == 'FORM 1B';
    final Color progressColor = hasGSTCards
        ? (formTitle == 'FORM 1A' ? const Color(0xFF059669) : const Color(0xFFEAB308))
        : const Color(0xFF2563EB);
    final Color secondaryColor = hasGSTCards
        ? (formTitle == 'FORM 1A' ? const Color(0xFFE2E8F0) : const Color(0xFFFEF3C7))
        : const Color(0xFFDBEAFE);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => TeacherFormDetailsPage(
          formTitle: formTitle,
          formSubtitle: subtitle,
          progressColor: progressColor,
          secondaryColor: secondaryColor,
          hasGSTCards: hasGSTCards,
        ),
      ),
    );
  }

  Future<void> _refreshRecords() async {
    Feedback.forTap(context);
    await _loadRecords(forceRefresh: true);
  }

  Future<void> _loadRecords({bool forceRefresh = false}) async {
    if (mounted) setState(() => _isLoadingRecords = true);
    try {
      await Future.wait([
        AuthService.fetchClassStudents(forceRefresh: forceRefresh),
        NotificationService().fetchNotifications(),
      ]);
    } finally {
      if (mounted) setState(() => _isLoadingRecords = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const softBg = Color(0xFFFCFAF7);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: softBg,
      drawer: const TeacherSidebarDrawer(activeRoute: 'Phil-IRI Records'),
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with Hamburger on left
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () {
                      _scaffoldKey.currentState?.openDrawer();
                    },
                    icon: Iconify(Ph.list, size: 28, color: Colors.black),
                  ),
                  Text(
                    'Phil - IRI Records',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Colors.black,
                    ),
                  ),
                  const NotificationBellIconButton(),
                ],
              ),
            ),

            Expanded(
              child: RefreshIndicator(
                onRefresh: _refreshRecords,
                color: const Color(0xFFD34426),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                  child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section Title
                    Row(
                      children: [
                        const Iconify(
                          Ph.article_bold,
                          color: Color(0xFFD34426),
                          size: 24,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Phil - IRI Records',
                          style: GoogleFonts.inter(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Form cards are shown only after the class context has loaded.
                    if (_isLoadingRecords)
                      _buildRecordsSkeleton()
                    else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _forms.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final form = _forms[index];
                        final String title = form['title'] as String;
                        final String subtitle = form['subtitle'] as String;
                        final Color bgColor = form['bgColor'] as Color;
                        final Color borderColor = form['borderColor'] as Color;
                        final Color iconBg = form['iconBg'] as Color;
                        final Color iconColor = form['iconColor'] as Color;
                        final String icon = form['icon'] as String;
                        final Color buttonColor = form['buttonColor'] as Color;

                        return InkWell(
                          onTap: () => _onFormOpen(title, subtitle),
                          borderRadius: BorderRadius.circular(18),
                          child: Container(
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(color: borderColor),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 14.0),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                // Left Icon Container
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: iconBg,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Center(
                                    child: Iconify(icon, color: iconColor, size: 24),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                // Middle Title & Subtitle
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        title,
                                        style: GoogleFonts.inter(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w900,
                                          color: const Color(0xFF0F172A),
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        subtitle,
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                          color: const Color(0xFF64748B),
                                          height: 1.25,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 10),
                                // Right Open Pill Button
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: buttonColor,
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: Text(
                                    'Open',
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                    ),
                                  ),
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
          ),
        ],
      ),
    ),
  );
  }

  Widget _buildRecordsSkeleton() {
    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 5,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) => Container(
        height: 78,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(width: 76, height: 14, color: const Color(0xFFE2E8F0)),
                  const SizedBox(height: 8),
                  Container(width: 170, height: 11, color: const Color(0xFFF1F5F9)),
                ],
              ),
            ),
            Container(
              width: 56,
              height: 30,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(100),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
