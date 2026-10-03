import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConfig {
  static String? customHost;

  /// Get candidate base URLs ordered by preference for the current environment.
  static List<String> get candidateBaseUrls {
    final list = <String>[];

    void addHost(String? raw) {
      if (raw == null || raw.trim().isEmpty) return;
      var h = raw.trim();
      if (!h.startsWith('http://') && !h.startsWith('https://')) {
        h = 'http://$h';
      }
      if (!h.endsWith('/api')) {
        if (h.endsWith('/')) {
          h = '${h}api';
        } else {
          h = '$h/api';
        }
      }
      list.add(h);
    }

    final envUrl = dotenv.env['API_BASE_URL'];
    if (envUrl != null && envUrl.isNotEmpty) {
      addHost(envUrl);
    }

    if (customHost != null && customHost!.isNotEmpty) {
      addHost(customHost);
    }

    final envHost = dotenv.env['API_HOST'];
    if (envHost != null && envHost.isNotEmpty) {
      addHost(envHost);
    }

    // Default LAN IP fallback for physical devices connected on host Wi-Fi
    addHost('192.168.111.185:5000');

    // Android Emulator host loopback alias
    addHost('10.0.2.2:5000');

    // Web / iOS Simulator / Desktop loopback
    addHost('localhost:5000');
    addHost('127.0.0.1:5000');

    return list.toSet().toList();
  }

  static String get baseUrl {
    final candidates = candidateBaseUrls;
    if (kIsWeb) {
      return candidates.firstWhere(
        (url) => url.contains('localhost') || url.contains('127.0.0.1'),
        orElse: () => candidates.first,
      );
    }
    return candidates.first;
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
