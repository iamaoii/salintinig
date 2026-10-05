import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';

class UrlUtils {
  static const String termsUrl = 'https://policies.salintinig.org/terms';
  static const String privacyUrl = 'https://policies.salintinig.org/privacy';
  static const String basePoliciesUrl = 'https://policies.salintinig.org';

  static Future<void> openTerms() async {
    await openUrl(termsUrl);
  }

  static Future<void> openPrivacy() async {
    await openUrl(privacyUrl);
  }

  static Future<void> openUrl(String urlString) async {
    try {
      final Uri uri = Uri.parse(urlString);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        // Fallback to platform default if external application fails
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error launching URL $urlString: $e');
      }
    }
  }
}
