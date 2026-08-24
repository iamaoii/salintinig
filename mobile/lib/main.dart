import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:salintinig/services/api_config.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/local_notification_service.dart';
import 'package:salintinig/pages/common/loading_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.manual,
    overlays: SystemUiOverlay.values,
  );
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );

  try {
    await dotenv.load(fileName: '.env');
  } catch (e) {
    debugPrint('dotenv init notice: $e');
  }
  try {
    await Supabase.initialize(
      url: ApiConfig.supabaseUrl,
      anonKey: ApiConfig.supabaseAnonKey,
    );
  } catch (e) {
    debugPrint('Supabase init notice: $e');
  }

  try {
    await ApiService.initToken();
    await LocalNotificationService.init();
  } catch (e) {
    debugPrint('Service init notice: $e');
  }

  runApp(const SalinTinigApp());
}

class SalinTinigApp extends StatelessWidget {
  const SalinTinigApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SalinTinig',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF673AB7), // Deep Purple
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.dark,
            statusBarBrightness: Brightness.light,
          ),
        ),
        textTheme: GoogleFonts.interTextTheme(
          ThemeData.light().textTheme,
        ).copyWith(
          titleLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            letterSpacing: -0.5,
          ),
          titleMedium: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
          ),
          headlineLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w700,
            letterSpacing: -1.0,
          ),
          headlineMedium: GoogleFonts.inter(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF673AB7),
          brightness: Brightness.dark,
        ),
        appBarTheme: const AppBarTheme(
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.light,
            statusBarBrightness: Brightness.dark,
          ),
        ),
        textTheme: GoogleFonts.interTextTheme(
          ThemeData.dark().textTheme,
        ).copyWith(
          titleLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
            letterSpacing: -0.5,
          ),
          titleMedium: GoogleFonts.inter(
            fontWeight: FontWeight.w600,
          ),
          headlineLarge: GoogleFonts.inter(
            fontWeight: FontWeight.w700,
            letterSpacing: -1.0,
          ),
          headlineMedium: GoogleFonts.inter(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
        ),
      ),
      themeMode: ThemeMode.system,
      builder: (context, child) {
        return AnnotatedRegion<SystemUiOverlayStyle>(
          value: const SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: Brightness.dark, // Black/Dark icons visible on light app pages
            statusBarBrightness: Brightness.light,    // iOS contrast setting
          ),
          child: child ?? const SizedBox.shrink(),
        );
      },
      home: const LoadingPage(),
    );
  }
}

