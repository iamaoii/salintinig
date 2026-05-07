import 'package:flutter/material.dart';
import 'package:salintinig/pages/landing_page.dart';

void main() {
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
        fontFamily: 'Roboto',
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF673AB7),
          brightness: Brightness.dark,
        ),
        fontFamily: 'Roboto',
      ),
      themeMode: ThemeMode.system,
      home: const LandingPage(),
    );
  }
}
