import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConfig {
  // Override this if testing with a physical device (e.g. '192.168.1.100:5000')
  static String? customHost;

  static String get baseUrl {
    if (customHost != null && customHost!.isNotEmpty) {
      return 'http://$customHost/api';
    }

    if (kIsWeb) {
      return 'http://localhost:5000/api';
    } else if (Platform.isAndroid) {
      // 10.0.2.2 is Android Emulator's default alias for localhost
      return 'http://10.0.2.2:5000/api';
    } else {
      return 'http://localhost:5000/api';
    }
  }
}
