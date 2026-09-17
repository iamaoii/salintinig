import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:salintinig/services/auth_service.dart';

class ReadingPreferencesService {
  static const String _keyFontSize = 'reading_font_size';
  static const String _keyDyslexiaFont = 'dyslexia_font';
  static const String _keyTextHighlighting = 'text_highlighting';
  static const String _keyHighlightColor = 'highlight_color';

  static const int defaultHighlightColorValue =
      0xFFFEF08A; // Light Pastel Yellow

  static const List<Color> highlightColorOptions = [
    Color(0xFFFEF08A), // Light Pastel Yellow
    Color(0xFFA7F3D0), // Light Pastel Green
    Color(0xFFBAE6FD), // Light Pastel Blue
    Color(0xFFFBCFE8), // Light Pastel Pink
    Color(0xFFE9D5FF), // Light Pastel Lavender
  ];

  static double _cachedFontSize = 22.0;
  static bool _cachedDyslexiaFont = false;
  static bool _cachedTextHighlighting = true;
  static int _cachedHighlightColorValue = defaultHighlightColorValue;

  /// Helper to get user-specific SharedPreferences key per student
  static String _getUserKey(String baseKey) {
    final userId = AuthService.currentUser?.userId;
    if (userId != null && userId.isNotEmpty) {
      return '${baseKey}_$userId';
    }
    return baseKey;
  }

  /// Load preferences from SharedPreferences
  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final fontKey = _getUserKey(_keyFontSize);
    final dyslexiaKey = _getUserKey(_keyDyslexiaFont);
    final highlightKey = _getUserKey(_keyTextHighlighting);
    final colorKey = _getUserKey(_keyHighlightColor);

    _cachedFontSize = prefs.getDouble(fontKey) ?? 22.0;
    _cachedDyslexiaFont = prefs.getBool(dyslexiaKey) ?? false;
    _cachedTextHighlighting = prefs.getBool(highlightKey) ?? true;
    _cachedHighlightColorValue =
        prefs.getInt(colorKey) ?? defaultHighlightColorValue;
  }

  /// Get saved font size per student (default: 22.0)
  static Future<double> getFontSize() async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyFontSize);
    if (prefs.containsKey(key)) {
      _cachedFontSize = prefs.getDouble(key)!;
    } else {
      _cachedFontSize = 22.0;
    }
    return _cachedFontSize;
  }

  /// Sync getter if cached
  static double get fontSize => _cachedFontSize;

  /// Save font size per student
  static Future<void> setFontSize(double size) async {
    _cachedFontSize = size;
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyFontSize);
    await prefs.setDouble(key, size);
  }

  /// Get saved dyslexia-friendly font setting per student
  static Future<bool> getDyslexiaFont() async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyDyslexiaFont);
    if (prefs.containsKey(key)) {
      _cachedDyslexiaFont = prefs.getBool(key)!;
    } else {
      _cachedDyslexiaFont = false;
    }
    return _cachedDyslexiaFont;
  }

  /// Sync getter if cached
  static bool get dyslexiaFont => _cachedDyslexiaFont;

  /// Save dyslexia font setting per student
  static Future<void> setDyslexiaFont(bool enabled) async {
    _cachedDyslexiaFont = enabled;
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyDyslexiaFont);
    await prefs.setBool(key, enabled);
  }

  /// Get saved text highlighting tool setting per student (default: true)
  static Future<bool> getTextHighlighting() async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyTextHighlighting);
    if (prefs.containsKey(key)) {
      _cachedTextHighlighting = prefs.getBool(key)!;
    } else {
      _cachedTextHighlighting = true;
    }
    return _cachedTextHighlighting;
  }

  /// Sync getter if cached
  static bool get textHighlighting => _cachedTextHighlighting;

  /// Save text highlighting setting per student
  static Future<void> setTextHighlighting(bool enabled) async {
    _cachedTextHighlighting = enabled;
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyTextHighlighting);
    await prefs.setBool(key, enabled);
  }

  /// Get saved highlight color value per student (default: 0xFFFFE082)
  static Future<Color> getHighlightColor() async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyHighlightColor);
    if (prefs.containsKey(key)) {
      _cachedHighlightColorValue = prefs.getInt(key)!;
    } else {
      _cachedHighlightColorValue = defaultHighlightColorValue;
    }
    return Color(_cachedHighlightColorValue);
  }

  /// Sync getter for highlight color
  static Color get highlightColor => Color(_cachedHighlightColorValue);

  /// Save highlight color per student
  static Future<void> setHighlightColor(Color color) async {
    _cachedHighlightColorValue = color.toARGB32();
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey(_keyHighlightColor);
    await prefs.setInt(key, color.toARGB32());
  }

  /// Get saved highlighted text snippets for a specific story per student
  static Future<List<String>> getStoryHighlights(String storyIdentifier) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey('story_highlights_${storyIdentifier.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_')}');
    return prefs.getStringList(key) ?? [];
  }

  /// Save highlighted text snippets for a specific story per student
  static Future<void> saveStoryHighlights(
      String storyIdentifier, List<String> highlights) async {
    final prefs = await SharedPreferences.getInstance();
    final key = _getUserKey('story_highlights_${storyIdentifier.replaceAll(RegExp(r'[^a-zA-Z0-9_]'), '_')}');
    await prefs.setStringList(key, highlights);
  }
}
