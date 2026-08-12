import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  // Override this if testing with a physical device (e.g. '192.168.1.100:5000')
  static String? customHost;

  static String get baseUrl {
    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }

    if (customHost != null && customHost!.isNotEmpty) {
      return 'http://$customHost/api';
    }

    final envHost = dotenv.env['API_HOST'];
    if (envHost != null && envHost.isNotEmpty) {
      return 'http://$envHost/api';
    }

    if (kIsWeb) {
      return 'http://localhost:5000/api';
    } else if (Platform.isAndroid) {
      // 127.0.0.1 works for physical devices via ADB reverse (`adb reverse tcp:5000 tcp:5000`)
      // You can also set API_HOST in .env to your PC IP (e.g. 192.168.1.146:5000)
      return 'http://127.0.0.1:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }

  static String get supabaseUrl =>
      dotenv.env['SUPABASE_URL'] ?? 'https://fgwztaonvetoyzywxggj.supabase.co';

  static String get supabaseAnonKey =>
      dotenv.env['SUPABASE_ANON_KEY'] ??
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnd3p0YW9udmV0b3l6eXd4Z2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MDYxNTgsImV4cCI6MjEwMTA4MjE1OH0.Y_M17lRj5G-3J3b8BwFh1G6z_V13A67';
}
