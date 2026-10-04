import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../utils/url_utils.dart';

class PolicyFooter extends StatelessWidget {
  final String prefixText;
  final TextStyle? baseStyle;
  final TextStyle? linkStyle;

  const PolicyFooter({
    super.key,
    this.prefixText = 'By signing in you accept the ',
    this.baseStyle,
    this.linkStyle,
  });

  @override
  Widget build(BuildContext context) {
    final defaultBaseStyle = baseStyle ??
        GoogleFonts.inter(
          color: const Color(0xFF71717A),
          fontSize: 13,
          height: 1.5,
        );

    final defaultLinkStyle = linkStyle ??
        GoogleFonts.inter(
          fontWeight: FontWeight.w600,
          color: const Color(0xFF27272A),
          fontSize: 13,
          decoration: TextDecoration.underline,
        );

    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(
        style: defaultBaseStyle,
        children: [
          TextSpan(text: prefixText),
          TextSpan(
            text: 'Terms of Service',
            style: defaultLinkStyle,
            recognizer: TapGestureRecognizer()
              ..onTap = () => UrlUtils.openTerms(),
          ),
          const TextSpan(text: '\nand '),
          TextSpan(
            text: 'Privacy Policy',
            style: defaultLinkStyle,
            recognizer: TapGestureRecognizer()
              ..onTap = () => UrlUtils.openPrivacy(),
          ),
        ],
      ),
    );
  }
}
