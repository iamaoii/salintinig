import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';

// Custom Phosphor Bold SVG strings matching reference icons
const String phExamBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M216 36H40a20 20 0 0 0-20 20v160a12 12 0 0 0 17.37 10.73L64 213.42l26.63 13.31a12 12 0 0 0 10.74 0L128 213.42l26.63 13.31a12 12 0 0 0 10.74 0L192 213.42l26.63 13.31A12 12 0 0 0 236 216V56a20 20 0 0 0-20-20m-4 160.58l-14.63-7.31a12 12 0 0 0-10.74 0L160 202.58l-26.63-13.31a12 12 0 0 0-10.74 0L96 202.58l-26.63-13.31a12 12 0 0 0-10.74 0L44 196.58V60h168ZM62.63 170.73a12 12 0 0 0 16.1-5.36l2.69-5.37h37.16l2.69 5.37a12 12 0 1 0 21.46-10.74l-32-64a12 12 0 0 0-21.46 0l-32 64a12 12 0 0 0 5.36 16.1M106.58 136H93.42l6.58-13.17Zm37.42-8a12 12 0 0 1 12-12h4v-4a12 12 0 0 1 24 0v4h4a12 12 0 0 1 0 24h-4v4a12 12 0 0 1-24 0v-4h-4a12 12 0 0 1-12-12"/></svg>';

const String phBookBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M208 20H72a36 36 0 0 0-36 36v168a12 12 0 0 0 12 12h144a12 12 0 0 0 0-24H60v-4a12 12 0 0 1 12-12h136a12 12 0 0 0 12-12V32a12 12 0 0 0-12-12m-12 152H72a35.6 35.6 0 0 0-12 2.06V56a12 12 0 0 1 12-12h124Z"/></svg>';

const String phFlagPennantBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="m243.94 92.67l-184-64A12 12 0 0 0 44 40v176a12 12 0 0 0 24 0v-39.47l175.94-61.2a12 12 0 0 0 0-22.66M68 151.12V56.88L203.47 104Z"/></svg>';

const String phHourglassBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M204 75.64V40a20 20 0 0 0-20-20H72a20 20 0 0 0-20 20v36a20.1 20.1 0 0 0 8 16l48 36l-48 36a20.1 20.1 0 0 0-8 16v36a20 20 0 0 0 20 20h112a20 20 0 0 0 20-20v-35.64a20.13 20.13 0 0 0-7.94-16L147.9 128l48.16-36.4A20.13 20.13 0 0 0 204 75.64M180 212H76v-30l52-39l52 39.33Zm0-138.35L128 113L76 74V44h104Z"/></svg>';

const String phEarBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M220 104a12 12 0 0 1-24 0a68 68 0 0 0-136 0c0 25 7.58 32.3 16.35 40.76S96 163.71 96 188a32 32 0 0 0 32 32c9 0 16.19-3.7 22.75-11.64a12 12 0 0 1 18.5 15.28C158.09 237.15 144.21 244 128 244a56.06 56.06 0 0 1-56-56c0-14.09-4.63-18.56-12.31-26C49.13 151.86 36 139.19 36 104a92 92 0 0 1 184 0m-40.13 53.61a12 12 0 0 0-16.4 4.38a4 4 0 0 1-7.47-2c0-7.61 3.65-12.86 9.6-20.8C172 130.65 180 120 180 104a52 52 0 0 0-104 0a12 12 0 0 0 24 0a28 28 0 0 1 56 0c0 7.61-3.65 12.86-9.6 20.8C140 133.35 132 144 132 160a28 28 0 0 0 52.25 14a12 12 0 0 0-4.38-16.39"/></svg>';

const String phBookOpenBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M232 44h-72a43.86 43.86 0 0 0-32 13.85A43.86 43.86 0 0 0 96 44H24a12 12 0 0 0-12 12v144a12 12 0 0 0 12 12h72a20 20 0 0 1 20 20a12 12 0 0 0 24 0a20 20 0 0 1 20-20h72a12 12 0 0 0 12-12V56a12 12 0 0 0-12-12M96 188H36V68h60a20 20 0 0 1 20 20v104.81A43.8 43.8 0 0 0 96 188m124 0h-60a43.7 43.7 0 0 0-20 4.83V88a20 20 0 0 1 20-20h60Z"/></svg>';

const String phUserSoundBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M152.5 164.53a72 72 0 1 0-89 0a124.1 124.1 0 0 0-48.69 35.75a12 12 0 0 0 18.38 15.44C46.88 199.42 71 180 108 180s61.12 19.42 74.81 35.72a12 12 0 1 0 18.38-15.44a124 124 0 0 0-48.69-35.75M60 108a48 48 0 1 1 48 48a48.05 48.05 0 0 1-48-48m192 0a143.1 143.1 0 0 1-11.61 56.73a12 12 0 1 1-22-9.46a120.48 120.48 0 0 0 0-94.54a12 12 0 1 1 22-9.46A143.1 143.1 0 0 1 252 108m-45-43.24a108.26 108.26 0 0 1 0 86.48a12 12 0 0 1-22-9.62a84.35 84.35 0 0 0 0-67.24a12 12 0 1 1 22-9.62"/></svg>';

const String phGameControllerBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M176 116h-24a12 12 0 0 1 0-24h24a12 12 0 0 1 0 24m-72-24h-4v-4a12 12 0 0 0-24 0v4h-4a12 12 0 0 0 0 24h4v4a12 12 0 0 0 24 0v-4h4a12 12 0 0 0 0-24m140.76 110.94a40 40 0 0 1-61 5.35a7 7 0 0 1-.53-.56L144.67 164h-33.34l-38.52 43.73c-.17.19-.35.38-.53.56a40 40 0 0 1-67.66-35.24a1 1 0 0 1 0-.2L21 88.79A63.88 63.88 0 0 1 83.88 36H172a64.08 64.08 0 0 1 62.93 52.48a2 2 0 0 1 0 .19l16.36 84.17a2 2 0 0 1 0 .2a39.74 39.74 0 0 1-6.53 29.9M172 140a40 40 0 0 0 0-80H83.89a39.9 39.9 0 0 0-39.27 33.06a2 2 0 0 0 0 .21l-16.34 84a16 16 0 0 0 13 18.44a16.07 16.07 0 0 0 13.86-4.21l41.76-47.43a12 12 0 0 1 9-4.07Zm55.76 37.31l-7-35.95a63.84 63.84 0 0 1-44.27 22.46l24.41 27.72a16 16 0 0 0 26.85-14.23Z"/></svg>';

const String phPuzzlePieceBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M222.41 155.16a12 12 0 0 0-11.56-.69A16 16 0 0 1 188 139a16.2 16.2 0 0 1 14.8-15a15.83 15.83 0 0 1 8 1.5a12 12 0 0 0 17.2-10.8V72a20 20 0 0 0-20-20h-32a40.15 40.15 0 0 0-12.62-29.16a39.67 39.67 0 0 0-29.94-10.76a40.08 40.08 0 0 0-37.34 37C96 50.07 96 51 96 52H64a20 20 0 0 0-20 20v28a40.15 40.15 0 0 0-29.16 12.62A40 40 0 0 0 41.1 179.9a28 28 0 0 0 2.9.1v28a20 20 0 0 0 20 20h144a20 20 0 0 0 20-20v-42.69a12 12 0 0 0-5.59-10.15M204 204H68v-38.69a12 12 0 0 0-17.15-10.84A15.9 15.9 0 0 1 42.8 156A16.2 16.2 0 0 1 28 141.06a16 16 0 0 1 22.82-15.52A12 12 0 0 0 68 114.7V76h42.7a12 12 0 0 0 10.83-17.15A15.9 15.9 0 0 1 120 50.8A16.19 16.19 0 0 1 134.94 36a16 16 0 0 1 15.53 22.81A12 12 0 0 0 161.31 76H204v24c-1 0-1.93 0-2.9.11A40 40 0 0 0 204 180Z"/></svg>';

const String phHammerBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="m250.18 105.17l-63.47-63.92a100.11 100.11 0 0 0-141.43 0l-.13.14l-13.78 14.22a12 12 0 1 0 17.24 16.7l13.71-14.15a75.7 75.7 0 0 1 15.17-11.73L119 88l-93.15 93.16a20 20 0 0 0 0 28.29l20.69 20.69a20 20 0 0 0 28.28 0L168 137l1.51 1.51l23.65 23.66a20 20 0 0 0 28.29 0l28.69-28.7a20 20 0 0 0 .04-28.3M60.68 210.34l-15-15L108 133l15 15ZM140 131l-15-15l19.51-19.51a12 12 0 0 0 0-17l-42.27-42.25a75.94 75.94 0 0 1 67.47 20.95l31.44 31.67L178 113l-1.51-1.51a12 12 0 0 0-17 0Zm67.32 11.31L195 130l23.09-23.09l12.3 12.39Z"/></svg>';

const String phChartBarBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M224 196h-4V40a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v36H96a12 12 0 0 0-12 12v36H48a12 12 0 0 0-12 12v60h-4a12 12 0 0 0 0 24h192a12 12 0 0 0 0-24M164 52h32v144h-32Zm-56 48h32v96h-32Zm-48 48h24v48H60Z"/></svg>';

const String phMicrophoneStageBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M168 12a75.9 75.9 0 0 0-75.51 84.33l-68.58 93.52a19.89 19.89 0 0 0 2 26l14.29 14.29a19.89 19.89 0 0 0 26 2l93.52-68.58A76 76 0 1 0 168 12m52 76a51.66 51.66 0 0 1-7.75 27.27l-71.51-71.52A52 52 0 0 1 220 88M54.72 210.71l-9.43-9.43l56.19-76.63a76.46 76.46 0 0 0 29.87 29.87ZM116 88a51.63 51.63 0 0 1 7.75-27.27l71.51 71.51A52 52 0 0 1 116 88"/></svg>';

const String phEqualsBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M228 160a12 12 0 0 1-12 12H40a12 12 0 0 1 0-24h176a12 12 0 0 1 12 12M40 108h176a12 12 0 0 0 0-24H40a12 12 0 0 0 0 24"/></svg>';

const String phWrenchBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M230.47 67.5a12 12 0 0 0-19.26-4.32L172.43 99l-12.68-2.72L157 83.57l35.79-38.78a12 12 0 0 0-4.32-19.26a76.07 76.07 0 0 0-100.06 96.11l-57.49 52.54a5 5 0 0 0-.39.38a36 36 0 0 0 50.91 50.91l.38-.39l52.54-57.49A76.05 76.05 0 0 0 230.47 67.5M160 148a51.5 51.5 0 0 1-23.35-5.52a12 12 0 0 0-14.26 2.62l-58.08 63.56a12 12 0 0 1-17-17l63.55-58.07a12 12 0 0 0 2.62-14.26A51.5 51.5 0 0 1 108 96a52.06 52.06 0 0 1 52-52h.89l-25.72 27.87a12 12 0 0 0-2.91 10.65l5.66 26.35a12 12 0 0 0 9.21 9.21l26.35 5.66a12 12 0 0 0 10.65-2.91L212 95.12v.89A52.06 52.06 0 0 1 160 148"/></svg>';

const String phBooksRegular = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="m231.65 194.55l-33.19-157.8a16 16 0 0 0-19-12.39l-46.81 10.06a16.08 16.08 0 0 0-12.3 19l33.19 157.8A16 16 0 0 0 169.16 224a16.3 16.3 0 0 0 3.38-.36l46.81-10.06a16.09 16.09 0 0 0 12.3-19.03M136 50.15v-.09l46.8-10l3.33 15.87L139.33 66Zm6.62 31.47l46.82-10.05l3.34 15.9L146 97.53Zm6.64 31.57l46.82-10.06l13.3 63.24l-46.82 10.06ZM216 197.94l-46.8 10l-3.33-15.87l46.8-10.07l3.33 15.85zM104 32H56a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h48a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16M56 48h48v16H56Zm0 32h48v96H56Zm48 128H56v-16h48z"/></svg>';

const String phShieldBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M208 36H48a20 20 0 0 0-20 20v56c0 54.29 26.32 87.22 48.4 105.29c23.71 19.39 47.44 26 48.44 26.29a12.1 12.1 0 0 0 6.32 0c1-.28 24.73-6.9 48.44-26.29c22.08-18.07 48.4-51 48.4-105.29V56a20 20 0 0 0-20-20m-4 76c0 35.71-13.09 64.69-38.91 86.15A126.3 126.3 0 0 1 128 219.38a126.1 126.1 0 0 1-37.09-21.23C65.09 176.69 52 147.71 52 112V60h152Z"/></svg>';

const String phFireBold = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="currentColor" d="M177.62 159.6a52 52 0 0 1-34 34a12.2 12.2 0 0 1-3.6.55a12 12 0 0 1-3.6-23.45a28 28 0 0 0 18.32-18.32a12 12 0 0 1 22.9 7.2ZM220 144a92 92 0 0 1-184 0c0-28.81 11.27-58.18 33.48-87.28a12 12 0 0 1 17.9-1.33l19.69 19.11L127 19.89a12 12 0 0 1 18.94-5.12C168.2 33.25 220 82.85 220 144m-24 0c0-41.71-30.61-78.39-52.52-99.29l-20.21 55.4a12 12 0 0 1-19.63 4.5L80.71 82.36C67 103.38 60 124.06 60 144a68 68 0 0 0 136 0"/></svg>';

class StudentOverviewPage extends StatefulWidget {
  const StudentOverviewPage({super.key});

  @override
  State<StudentOverviewPage> createState() => _StudentOverviewPageState();
}

class _StudentOverviewPageState extends State<StudentOverviewPage> {
  // Simple state toggles for interactive button feedback
  bool _notificationAlert = true;

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const darkBlueBg = Color(0xFF195ECB);
    const softCreamBg = Color(0xFFFCFAF7);

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isTablet = constraints.maxWidth > 600;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 520 : double.infinity,
                ),
                child: Column(
                  children: [
                    // 1. Fixed Custom Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Left Menu Drawer Icon
                          IconButton(
                            onPressed: () {
                              Feedback.forTap(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Menu drawer opened (Simulation)', style: GoogleFonts.inter()),
                                  duration: const Duration(seconds: 1),
                                ),
                              );
                            },
                            icon: Iconify(
                              Ph.list,
                              size: 28,
                              color: Colors.black,
                            ),
                          ),
                          // Center Brand Identity
                          Row(
                            children: [
                              Image.asset(
                                'assets/logo/logo_v2.webp',
                                height: 32,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SalinTinig',
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                          // Right Notification Bell
                          Stack(
                            children: [
                              IconButton(
                                onPressed: () {
                                  Feedback.forTap(context);
                                  setState(() {
                                    _notificationAlert = false;
                                  });
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('No new notifications.', style: GoogleFonts.inter()),
                                      duration: const Duration(seconds: 1),
                                    ),
                                  );
                                },
                                icon: Iconify(
                                  Ph.bell,
                                  size: 28,
                                  color: Colors.black,
                                ),
                              ),
                              if (_notificationAlert)
                                Positioned(
                                  right: 8,
                                  top: 8,
                                  child: Container(
                                    width: 10,
                                    height: 10,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEF4444),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // 2. Scrollable Dashboard Body
                    Expanded(
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // ── Hero Banner Card ──
                            Container(
                              clipBehavior: Clip.antiAlias,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: const LinearGradient(
                                  colors: [primaryBlue, darkBlueBg],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryBlue.withValues(alpha: 0.25),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Stack(
                                children: [
                                  // Translucent watermark logo background
                                  Positioned(
                                    right: 0,
                                    top: -12,
                                    bottom: -12,
                                    width: 200,
                                    child: Image.asset(
                                      'assets/student page/logo_bg.webp',
                                      fit: BoxFit.contain,
                                      alignment: Alignment.centerRight,
                                    ),
                                  ),
                                  // Foreground content
                                  Padding(
                                    padding: const EdgeInsets.all(20.0),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                'Hello, Doechii!',
                                                style: GoogleFonts.inter(
                                                  fontSize: 26,
                                                  fontWeight: FontWeight.w800,
                                                  color: Colors.white,
                                                  letterSpacing: -0.5,
                                                ),
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                'Grade 4 - Fyang',
                                                style: GoogleFonts.inter(
                                                  fontSize: 15,
                                                  color: Colors.white.withValues(alpha: 0.8),
                                                  fontWeight: FontWeight.w500,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        // User Avatar Profile Picture
                                        Container(
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(color: Colors.white, width: 2),
                                          ),
                                          child: const CircleAvatar(
                                            radius: 30,
                                            backgroundImage: NetworkImage(
                                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // ── Navigation Quick Cards Row ──
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildQuickNavCard('Phil-IRI', phExamBold, primaryBlue),
                                _buildQuickNavCard('Library', phBookBold, primaryBlue),
                                _buildQuickNavCard('Activities', phFlagPennantBold, primaryBlue),
                                _buildQuickNavCard('Progress', phHourglassBold, primaryBlue),
                              ],
                            ),
                            const SizedBox(height: 28),

                            // ── Section 1: Phil-IRI Assessments ──
                            _buildSectionHeader('Phil - IRI Assessments', phExamBold),
                            const SizedBox(height: 12),
                            _buildAssessmentCard(
                              title: 'Listening\nComprehension Test',
                              tag: 'Required',
                              tagBgColor: const Color(0xFFFEE2E2),
                              tagTextColor: const Color(0xFFEF4444),
                              buttonText: 'Start',
                              buttonColor: primaryBlue,
                              icon: phEarBold,
                              iconColor: const Color(0xFFF59E0B),
                              iconBg: const Color(0xFFFEF3C7),
                            ),
                            _buildAssessmentCard(
                              title: 'Silent Reading\nTest',
                              tag: 'Optional',
                              tagBgColor: const Color(0xFFF3F4F6),
                              tagTextColor: const Color(0xFF71717A),
                              buttonText: 'Not Available',
                              buttonColor: const Color(0xFFE4E4E7),
                              buttonTextColor: const Color(0xFFA1A1AA),
                              icon: phBookOpenBold,
                              iconColor: const Color(0xFF10B981),
                              iconBg: const Color(0xFFD1FAE5),
                            ),
                            _buildAssessmentCard(
                              title: 'Oral Reading Test',
                              tag: 'Done',
                              tagBgColor: const Color(0xFFD1FAE5),
                              tagTextColor: const Color(0xFF059669),
                              buttonText: 'View Result',
                              buttonColor: const Color(0xFF00A859),
                              icon: phUserSoundBold,
                              iconColor: primaryBlue,
                              iconBg: const Color(0xFFD0E1F9),
                              cardBg: const Color(0xFFEAF5EC),
                            ),
                            const SizedBox(height: 28),

                            // ── Section 2: Continue Reading ──
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                _buildSectionHeader('Continue Reading', phBookOpenBold),
                                Text(
                                  'See all',
                                  style: GoogleFonts.inter(
                                    color: primaryBlue,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    decoration: TextDecoration.underline,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            _buildContinueReadingCard(context),
                            const SizedBox(height: 28),

                            // ── Section 3: Activities (from Picture 2) ──
                            _buildSectionHeader('Activities', phPuzzlePieceBold),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildActivityCard('Pronunciation\nChallenge', phUserSoundBold, const Color(0xFFD0E1F9), primaryBlue),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildActivityCard('Vocabulary\nMatching', phEqualsBold, const Color(0xFFFFF0C2), const Color(0xFFF59E0B)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _buildActivityCard('Sentence\nArrangement', phHammerBold, const Color(0xFFC7ECDA), const Color(0xFF10B981)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 28),

                            // ── Section 4: Progress (from Picture 2) ──
                            _buildSectionHeader('Progress', phHourglassBold),
                            const SizedBox(height: 12),
                            // Stat Row
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                _buildStatItem('5', 'Stories', phBooksRegular, primaryBlue),
                                _buildStatItem('5', 'Badges', phShieldBold, primaryBlue),
                                _buildStatItem('5', 'Streak', phFireBold, primaryBlue),
                              ],
                            ),
                            const SizedBox(height: 20),
                            // Accuracy Chart Card
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text(
                                    'model accuracy',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  // Live custom accuracy graph
                                  SizedBox(
                                    height: 200,
                                    child: CustomPaint(
                                      painter: AccuracyChartPainter(),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Accuracy Trend',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: const Color(0xFF71717A),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ── Helper Widgets ──

  Widget _buildSectionHeader(String title, String iconSvg) {
    return Row(
      children: [
        Iconify(
          iconSvg,
          color: const Color(0xFF1B64D8),
          size: 22,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: Colors.black,
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildQuickNavCard(String label, String iconSvg, Color activeColor) {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: const Color(0xFFE8EEF9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Feedback.forTap(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$label navigation tapped.', style: GoogleFonts.inter()),
                duration: const Duration(milliseconds: 500),
              ),
            );
          },
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Iconify(
                iconSvg,
                color: activeColor,
                size: 34,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF27272A),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAssessmentCard({
    required String title,
    required String tag,
    required Color tagBgColor,
    required Color tagTextColor,
    required String buttonText,
    required Color buttonColor,
    Color buttonTextColor = Colors.white,
    required String icon,
    required Color iconColor,
    required Color iconBg,
    Color cardBg = Colors.white,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Circular Icon backing
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: iconBg,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Iconify(
              icon,
              color: iconColor,
              size: 26,
            ),
          ),
          const SizedBox(width: 14),
          // Assessment Title & Capsule tag
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF18181B),
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  decoration: BoxDecoration(
                    color: tagBgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  child: Text(
                    tag,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: tagTextColor,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          // Action Button
          ElevatedButton(
            onPressed: buttonColor == const Color(0xFFE4E4E7)
                ? null
                : () {
                    Feedback.forTap(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Starting $title...')),
                    );
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: buttonColor,
              foregroundColor: buttonTextColor,
              disabledBackgroundColor: buttonColor,
              disabledForegroundColor: buttonTextColor,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: Text(
              buttonText,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildContinueReadingCard(BuildContext context) {
    const cardBg = Color(0xFFFEF8EC); // Warm cream/beige tint matching reference
    const tagBg = Color(0xFFE6F4EA); // Soft green background
    const tagTextColor = Color(0xFF137333); // Dark green text
    const continueBtnColor = Color(0xFFFBBF24); // Vibrant golden yellow button

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDEEBE), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Actual book cover image asset
          Container(
            width: 90,
            height: 120,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
                  blurRadius: 4,
                  offset: const Offset(1, 2),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/student page/sari_sari_summers.jpg',
                fit: BoxFit.cover,
              ),
            ),
          ),
          const SizedBox(width: 16),
          // Book details & controls
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SARI - SARI SUMMERS',
                  style: GoogleFonts.merriweather(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF18181B),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Nora helps her Lola save their sari-sari store by making mango ice candy during a hot summer in the Philippines.',
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF71717A),
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 12),
                // Progress Bar (stretching full width of column)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: const LinearProgressIndicator(
                    value: 0.25, // Fill level matches reference indicator approx
                    backgroundColor: Color(0xFFE4E2DC),
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF1B64D8)),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Tag capsule
                    Container(
                      decoration: BoxDecoration(
                        color: tagBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: Text(
                        'Filipino',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: tagTextColor,
                        ),
                      ),
                    ),
                    // Action button
                    ElevatedButton(
                      onPressed: () {
                        Feedback.forTap(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Opening book reader...')),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: continueBtnColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: Text(
                        'Continue',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
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
    );
  }

  Widget _buildActivityCard(String label, String iconSvg, Color iconBg, Color iconColor) {
    return Container(
      height: 156,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
        border: Border.all(color: const Color(0xFFE5E7EB), width: 1.2),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Feedback.forTap(context);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Launching ${label.replaceAll('\n', ' ')}...')),
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 12.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 4),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: iconBg,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Iconify(
                    iconSvg,
                    color: iconColor,
                    size: 38,
                  ),
                ),
                const Spacer(),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF18181B),
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 4),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(String count, String label, String iconSvg, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Iconify(
          iconSvg,
          color: color,
          size: 32,
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              count,
              style: GoogleFonts.inter(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: Colors.black,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF71717A),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ── Live accuracy curve vector custom painter ──
class AccuracyChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paintLineTrain = Paint()
      ..color = const Color(0xFF1B64D8)
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final paintLineTest = Paint()
      ..color = const Color(0xFFF97316)
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final paintGrid = Paint()
      ..color = const Color(0xFFF1F1F4)
      ..strokeWidth = 1.0;

    final paintAxis = Paint()
      ..color = const Color(0xFFD4D4D8)
      ..strokeWidth = 1.5;

    // Dimensions
    const paddingLeft = 32.0;
    const paddingBottom = 24.0;
    const paddingTop = 12.0;
    const paddingRight = 12.0;

    final width = size.width - paddingLeft - paddingRight;
    final height = size.height - paddingTop - paddingBottom;

    // Draw grid intersections
    final yGridLines = 5;
    for (int i = 0; i <= yGridLines; i++) {
      final y = paddingTop + height * (1 - i / yGridLines);
      canvas.drawLine(Offset(paddingLeft, y), Offset(size.width - paddingRight, y), paintGrid);
    }

    final xGridLines = 8;
    for (int i = 0; i <= xGridLines; i++) {
      final x = paddingLeft + width * (i / xGridLines);
      canvas.drawLine(Offset(x, paddingTop), Offset(x, size.height - paddingBottom), paintGrid);
    }

    // Outer Axis Lines
    canvas.drawLine(Offset(paddingLeft, paddingTop), Offset(paddingLeft, size.height - paddingBottom), paintAxis);
    canvas.drawLine(Offset(paddingLeft, size.height - paddingBottom), Offset(size.width - paddingRight, size.height - paddingBottom), paintAxis);

    // Labels & Legends text paints
    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
    );

    // X Axis ticks numbers (0, 2, 4, 6, 8)
    final tickLabels = ['0', '2', '4', '6', '8'];
    for (int i = 0; i < tickLabels.length; i++) {
      final label = tickLabels[i];
      final x = paddingLeft + width * (i * 2 / xGridLines);
      
      textPainter.text = TextSpan(
        text: label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: const Color(0xFF71717A),
        ),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(x - textPainter.width / 2, size.height - paddingBottom + 4));
    }

    // Centered "epoch" label
    textPainter.text = TextSpan(
      text: 'epoch',
      style: GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.bold,
        color: const Color(0xFF27272A),
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(paddingLeft + width / 2 - textPainter.width / 2, size.height - 12));

    // Live Vector curves calculation matching mockup
    final trainPoints = [
      Offset(paddingLeft, size.height - paddingBottom - height * 0.10),
      Offset(paddingLeft + width * 0.125, size.height - paddingBottom - height * 0.40),
      Offset(paddingLeft + width * 0.25, size.height - paddingBottom - height * 0.65),
      Offset(paddingLeft + width * 0.375, size.height - paddingBottom - height * 0.78),
      Offset(paddingLeft + width * 0.50, size.height - paddingBottom - height * 0.82),
      Offset(paddingLeft + width * 0.625, size.height - paddingBottom - height * 0.83),
      Offset(paddingLeft + width * 0.75, size.height - paddingBottom - height * 0.84),
      Offset(paddingLeft + width * 0.875, size.height - paddingBottom - height * 0.85),
      Offset(paddingLeft + width, size.height - paddingBottom - height * 0.87),
    ];

    final testPoints = [
      Offset(paddingLeft, size.height - paddingBottom - height * 0.46),
      Offset(paddingLeft + width * 0.125, size.height - paddingBottom - height * 0.58),
      Offset(paddingLeft + width * 0.25, size.height - paddingBottom - height * 0.71),
      Offset(paddingLeft + width * 0.375, size.height - paddingBottom - height * 0.81),
      Offset(paddingLeft + width * 0.50, size.height - paddingBottom - height * 0.79),
      Offset(paddingLeft + width * 0.625, size.height - paddingBottom - height * 0.68),
      Offset(paddingLeft + width * 0.75, size.height - paddingBottom - height * 0.79),
      Offset(paddingLeft + width * 0.875, size.height - paddingBottom - height * 0.79),
      Offset(paddingLeft + width, size.height - paddingBottom - height * 0.83),
    ];

    // Smooth spline draw for Train
    final pathTrain = Path()..moveTo(trainPoints[0].dx, trainPoints[0].dy);
    for (int i = 0; i < trainPoints.length - 1; i++) {
      final p1 = trainPoints[i];
      final p2 = trainPoints[i + 1];
      final controlX = p1.dx + (p2.dx - p1.dx) / 2;
      pathTrain.cubicTo(controlX, p1.dy, controlX, p2.dy, p2.dx, p2.dy);
    }
    canvas.drawPath(pathTrain, paintLineTrain);

    // Smooth spline draw for Test
    final pathTest = Path()..moveTo(testPoints[0].dx, testPoints[0].dy);
    for (int i = 0; i < testPoints.length - 1; i++) {
      final p1 = testPoints[i];
      final p2 = testPoints[i + 1];
      final controlX = p1.dx + (p2.dx - p1.dx) / 2;
      pathTest.cubicTo(controlX, p1.dy, controlX, p2.dy, p2.dx, p2.dy);
    }
    canvas.drawPath(pathTest, paintLineTest);

    // Draw Legend frame in the top left
    final legendX = paddingLeft + 12;
    final legendY = paddingTop + 10;

    // Train legend dot/line indicator
    canvas.drawLine(Offset(legendX, legendY + 5), Offset(legendX + 15, legendY + 5), paintLineTrain);
    textPainter.text = TextSpan(
      text: 'train',
      style: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: const Color(0xFF27272A),
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(legendX + 20, legendY));

    // Test legend dot/line indicator
    canvas.drawLine(Offset(legendX, legendY + 17), Offset(legendX + 15, legendY + 17), paintLineTest);
    textPainter.text = TextSpan(
      text: 'test',
      style: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        color: const Color(0xFF27272A),
      ),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(legendX + 20, legendY + 12));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
