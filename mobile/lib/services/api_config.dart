import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String? customHost;

  static String get baseUrl {
    // 1. Check explicit API_BASE_URL from .env
    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      return envUrl;
    }

    // 2. Check custom host or LAN IP from .env
    if (customHost != null && customHost!.isNotEmpty) {
      return 'http://$customHost/api';
    }

    final envHost = dotenv.env['API_HOST'];
    if (envHost != null && envHost.isNotEmpty) {
      return 'http://$envHost/api';
    }

    // 3. Fallbacks for local development
    if (kIsWeb) {
      return 'http://localhost:5000/api';
    } else if (Platform.isAndroid) {
      return 'http://127.0.0.1:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }

  static String get rootUrl {
    final base = baseUrl;
    if (base.endsWith('/api')) {
      return base.substring(0, base.length - 4);
    }
    return base;
  }

  static String get supabaseUrl =>
      dotenv.env['SUPABASE_URL'] ?? '';

  static String get supabaseAnonKey =>
      dotenv.env['SUPABASE_PUBLISHABLE_KEY'] ??
      dotenv.env['SUPABASE_ANON_KEY'] ??
      '';


}
