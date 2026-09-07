import 'dart:async';
import 'dart:io';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';

import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:record/record.dart';
import 'package:confetti/confetti.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/api_service.dart';
import 'package:salintinig/services/activity_progress_service.dart';


enum PracticeState {
  loading,     // Fetching session words from backend
  initial,     // Ready to Listen / Tap to speak
  listening,   // Sally reference audio playing
  readyToRecord, // "Your turn!"
  recording,   // Recording student audio
  analyzing,   // Evaluating audio
  success,     // Pronunciation Good (>=80%)
  needsPractice, // Pronunciation Needs Practice (<80%)
}

class PronunciationChallengePage extends StatefulWidget {
  /// Language for this session: 'fil' (Filipino) or 'en' (English).
  final String language;

  /// Difficulty tier: 'easy', 'medium', 'hard'.
  final String difficulty;

  const PronunciationChallengePage({
    super.key,
    this.language = 'fil',
    this.difficulty = 'medium',
  });

  @override
  State<PronunciationChallengePage> createState() =>
      _PronunciationChallengePageState();
}

class _PronunciationChallengePageState
    extends State<PronunciationChallengePage>
    with TickerProviderStateMixin {
  // ── Session State ──────────────────────────────────────────────────────────
  int _currentWordIndex = 0;
  PracticeState _state = PracticeState.loading;
  int _accuracyScore = 0;
  int _attemptsCount = 0;
  int _earnedXp = 0;
  String? _loadError;
  String _sessionId = '';
  late String _sessionLanguage;
  late String _sessionDifficulty;
  bool _isPlayingReferenceAudio = false;

  // ── Celebration / Completion State ─────────────────────────────────────────
  bool _isFinished = false;
  final List<int> _wordAccuracies = [];
  final List<Map<String, dynamic>> _sessionWordResults = [];
  int _mistakesCount = 0;
  int _finalAccuracy = 100;
  String _celebrationMessage = 'Awesome job!';
  String _celebrationSubtitle = 'Great pronunciation practice!';
  late ConfettiController _confettiController;

  int get _baseXpPerWord {
    switch (_sessionDifficulty.toLowerCase()) {
      case 'easy':
        return 10;
      case 'hard':
        return 25;
      case 'medium':
      default:
        return 15;
    }
  }

  // Words are fetched from the API (validated content pool)
  List<Map<String, dynamic>> _words = [];

  // ── Syllable Scaffolding ───────────────────────────────────────────────────
  int _activeGuidedSyllableIndex = -1;
  String? _selectedSyllable;
  final Set<int> _activeSyllableIndices = {}; // Tracks currently playing syllables by index (supports duplicate syllables like 'ma' 'ma')
  final Map<int, AudioPlayer> _syllablePlayers = {}; // Dedicated player per syllable index for polyphonic playback

  // ── Audio Services ───────────────────────────────────────────────────────
  final AudioPlayer _audioPlayer = AudioPlayer();
  final AudioRecorder _audioRecorder = AudioRecorder();
  final FlutterTts _flutterTts = FlutterTts();
  final Map<String, Uint8List> _audioCache = {}; // In-memory session cache for neural audio bytes
  String? _recordingPath;
  String _feedbackText = '';

  Timer? _waveformTimer;
  Timer? _systemAudioTimer;

  // ── Session Constants ─────────────────────────────────────────────────────

  static const int _sessionSize = 5;

  // ─────────────────────────────────────────────────────────────────────────
  // LIFECYCLE
  // ─────────────────────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _sessionLanguage = widget.language;
    _sessionDifficulty = widget.difficulty;
    _loadSessionOrResume();
  }

  /// Try to restore a saved in-progress session; otherwise fetch fresh words.
  Future<void> _loadSessionOrResume() async {
    setState(() {
      _state = PracticeState.loading;
      _loadError = null;
    });

    try {
      final saved = await ActivityProgressService.getProgress('pronunciation', widget.language);
      if (saved != null && saved['words'] is List && (saved['words'] as List).isNotEmpty) {
        final savedLanguage = saved['language']?.toString() ?? widget.language;
        // Verify language matches requested language
        final isMatch = (savedLanguage.toLowerCase().startsWith('en') == widget.language.toLowerCase().startsWith('en'));

        if (isMatch) {
          final savedWords = (saved['words'] as List)
              .map<Map<String, dynamic>>((e) {
                final map = Map<String, dynamic>.from(e as Map);
                // Restore syllables as List<String>
                if (map['syllables'] is List) {
                  map['syllables'] = (map['syllables'] as List).map((s) => s.toString()).toList();
                }
                if (map['syllableSoundMap'] is Map) {
                  map['syllableSoundMap'] = Map<int, String>.from(
                    (map['syllableSoundMap'] as Map).map((k, v) => MapEntry(int.tryParse(k.toString()) ?? 0, v.toString())),
                  );
                }
                return map;
              })
              .toList();

          final savedIndex = (saved['currentIndex'] as int?) ?? 0;
          final savedXp = (saved['earnedXp'] as int?) ?? 0;
          final savedSessionId = saved['sessionId']?.toString() ?? 'pron_${DateTime.now().millisecondsSinceEpoch}';
          final savedDifficulty = saved['difficulty']?.toString() ?? widget.difficulty;

          if (savedIndex >= savedWords.length) {
            // All items in the saved session were already completed!
            await ActivityProgressService.clearProgress('pronunciation', widget.language);
            _loadSessionWords();
            return;
          }

          final extra = (saved['extraMetadata'] as Map?) ?? {};
          final restoredAccuracies = (extra['wordAccuracies'] as List?)
                  ?.map((e) => int.tryParse(e.toString()) ?? 0)
                  .toList() ??
              [];
          final restoredResults = (extra['sessionWordResults'] as List?)
                  ?.map((e) => Map<String, dynamic>.from(e as Map))
                  .toList() ??
              [];
          final restoredMistakes = (extra['mistakesCount'] as int?) ?? 0;

          setState(() {
            _words = savedWords;
            _currentWordIndex = savedIndex;
            _earnedXp = savedXp;
            _sessionId = savedSessionId;
            _sessionLanguage = savedLanguage;
            _sessionDifficulty = savedDifficulty;
            _wordAccuracies.clear();
            _wordAccuracies.addAll(restoredAccuracies);
            _sessionWordResults.clear();
            _sessionWordResults.addAll(restoredResults);
            _mistakesCount = restoredMistakes;
            _state = PracticeState.initial;
            _attemptsCount = 0;
          });

          debugPrint('[PronunciationChallenge] Resumed session at word ${savedIndex + 1}/${savedWords.length} ($_sessionLanguage, $_sessionDifficulty)');
          return;
        }
      }
    } catch (e) {
      debugPrint('[PronunciationChallenge] Could not restore saved session: $e');
    }

    // No saved session — fetch fresh words
    _loadSessionWords();
  }

  @override
  void dispose() {
    _waveformTimer?.cancel();
    _systemAudioTimer?.cancel();
    _confettiController.dispose();
    try {
      _audioPlayer.stop();
    } catch (_) {}
    _audioPlayer.dispose();
    for (final player in _syllablePlayers.values) {
      try {
        player.stop();
      } catch (_) {}
      player.dispose();
    }
    _syllablePlayers.clear();
    _audioCache.clear();
    try {
      _flutterTts.stop();
    } catch (_) {}
    try {
      _audioRecorder.stop();
    } catch (_) {}
    _audioRecorder.dispose();
    super.dispose();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API: FETCH SESSION WORDS FROM VALIDATED CONTENT POOL
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _loadSessionWords() async {
    setState(() {
      _state = PracticeState.loading;
      _loadError = null;
    });

    try {
      final res = await ApiService.get(
        '/students/pronunciation/items?language=$_sessionLanguage&difficulty=$_sessionDifficulty&limit=$_sessionSize',
      );

      if (res.success && res.data != null && res.data['items'] is List) {

        final rawList = res.data['items'] as List;

        if (rawList.isEmpty) {
          setState(() {
            _loadError =
                'No practice words available right now. Please try again later.';
            _state = PracticeState.initial;
          });
          return;
        }

        final words = rawList.map<Map<String, dynamic>>((item) {
          final rawSyllables = item['syllables'];
          final List<String> syllables = [];
          final Map<int, String> syllableSoundMap = {};

          if (rawSyllables is List) {
            for (int i = 0; i < rawSyllables.length; i++) {
              final s = rawSyllables[i];
              if (s is Map) {
                final text = (s['text'] ?? s['syllable'] ?? '').toString().trim();
                final sound = (s['sound'] ?? s['phonetic'] ?? text).toString().trim();
                syllables.add(text);
                if (sound.isNotEmpty) syllableSoundMap[i] = sound;
              } else {
                final text = s.toString().trim();
                syllables.add(text);
              }
            }
          }

          return {
            'itemId': item['itemId']?.toString() ?? '',
            'word': item['word']?.toString() ?? '',
            'translation': item['translation']?.toString() ?? '',
            'definition': item['definition']?.toString() ?? '',
            'exampleSentence': item['exampleSentence']?.toString() ?? '',
            'syllables': syllables,
            'syllableSoundMap': syllableSoundMap,
            'language': item['language']?.toString() ?? _sessionLanguage,
            'difficulty': item['difficulty']?.toString() ?? _sessionDifficulty,
          };
        }).toList();


        _sessionId = 'pron_${DateTime.now().millisecondsSinceEpoch}';

        setState(() {
          _words = words;
          _currentWordIndex = 0;
          _state = PracticeState.initial;
          _earnedXp = 0;
          _attemptsCount = 0;
        });

        // Save initial progress so pressing back counts as an in-progress session
        ActivityProgressService.saveProgress(
          activityType: 'pronunciation',
          currentIndex: 0,
          totalItems: words.length,
          words: words,
          earnedXp: 0,
          sessionId: _sessionId,
          language: _sessionLanguage,
          difficulty: _sessionDifficulty,
        );
      } else {
        setState(() {
          _loadError = 'Could not load practice words. Please try again.';
          _state = PracticeState.initial;
        });
      }
    } catch (e) {
      setState(() {

        _loadError = 'Connection error. Please check your internet and try again.';
        _state = PracticeState.initial;
      });
    }
  }



  // ─────────────────────────────────────────────────────────────────────────
  // GAME LOGIC
  // ─────────────────────────────────────────────────────────────────────────

  String _getMascotAsset() {
    return (_state == PracticeState.success && !_isPlayingReferenceAudio)
        ? 'assets/mascot/sally_happy.webp'
        : 'assets/mascot/sally_speaking.webp';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REAL TTS AUDIO PLAYBACK (Edge-TTS via Backend Cache)
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _playReferenceAudio() async {
    if (_state == PracticeState.loading || _words.isEmpty || _isPlayingReferenceAudio) return;
    Feedback.forTap(context);

    // Interrupt and unhighlight any active syllables when word plays
    for (final player in _syllablePlayers.values) {
      try {
        player.stop();
      } catch (_) {}
    }

    final bool wasPassed = (_state == PracticeState.success);

    setState(() {
      _isPlayingReferenceAudio = true;
      if (!wasPassed) {
        _state = PracticeState.listening;
      }
      _activeSyllableIndices.clear();
      _selectedSyllable = null;
    });

    void onAudioFinished() {
      _systemAudioTimer?.cancel();
      if (!mounted) return;
      setState(() {
        _isPlayingReferenceAudio = false;
        if (wasPassed) {
          _state = PracticeState.success;
        } else if (_state == PracticeState.listening) {
          _state = PracticeState.readyToRecord;
        }
      });
    }

    try {
      final currentItem = _words[_currentWordIndex];
      final word = (currentItem['word'] as String? ?? '').trim();
      final lang = (currentItem['language'] as String? ?? _sessionLanguage).toLowerCase().startsWith('en') ? 'en' : 'fil';

      if (word.isEmpty) {
        onAudioFinished();
        return;
      }

      // 1. Check in-memory session cache
      final cacheKey = 'word_${lang}_$word';
      Uint8List? audioBytes = _audioCache[cacheKey];

      // 2. Fetch neural streaming TTS if not in cache
      if (audioBytes == null || audioBytes.isEmpty) {
        final query = '/students/sentence/tts?text=${Uri.encodeComponent(word)}&language=$lang&rate=-2%';
        final fetched = await ApiService.getRawBytes(query);
        if (fetched != null && fetched.isNotEmpty) {
          audioBytes = fetched;
          _audioCache[cacheKey] = fetched;
        }
      }

      if (!mounted) return;

      // 3. Play via AudioPlayer BytesSource
      if (audioBytes != null && audioBytes.isNotEmpty) {
        await _audioPlayer.stop();
        if (!mounted) return;
        await _audioPlayer.play(BytesSource(audioBytes));

        _audioPlayer.onPlayerComplete.first.then((_) {
          if (mounted) onAudioFinished();
        }).catchError((_) {
          if (mounted) onAudioFinished();
        });
        return;
      }

      // 4. Offline / Network Fallback: device FlutterTts
      debugPrint('[PronunciationChallenge] Falling back to device TTS for word: $word');
      final ttsLang = lang == 'en' ? 'en-US' : 'fil-PH';
      await _flutterTts.setLanguage(ttsLang);
      await _flutterTts.setSpeechRate(0.42);
      await _flutterTts.setPitch(1.0);
      await _flutterTts.speak(word);

      _systemAudioTimer?.cancel();
      _systemAudioTimer = Timer(const Duration(milliseconds: 1400), () {
        if (mounted) onAudioFinished();
      });
    } catch (e) {
      debugPrint('[PronunciationChallenge] TTS Playback error: $e');
      onAudioFinished();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REAL MICROPHONE RECORDING & WHISPER STT VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────

  Future<void> _startRecording() async {
    Feedback.forTap(context);

    try {
      if (await _audioRecorder.hasPermission()) {
        final tempDir = Directory.systemTemp;
        final path = '${tempDir.path}/pronounce_${DateTime.now().millisecondsSinceEpoch}.m4a';

        await _audioRecorder.start(
          const RecordConfig(
            encoder: AudioEncoder.aacLc,
            sampleRate: 16000,
            numChannels: 1,
            noiseSuppress: true,
            echoCancel: true,
            autoGain: true,
          ),
          path: path,
        );

        _recordingPath = path;

        setState(() {
          _state = PracticeState.recording;
          _attemptsCount++;
        });


        _waveformTimer?.cancel();
        _waveformTimer = Timer(const Duration(milliseconds: 3500), () {

          if (mounted && _state == PracticeState.recording) {
            _stopAndAnalyzeAudio();
          }
        });
      }
    } catch (e) {
      debugPrint('[PronunciationChallenge] Mic recording start error: $e');
      _stopAndAnalyzeAudio();
    }

  }

  bool _isAnalyzingAudio = false;

  Future<void> _stopAndAnalyzeAudio() async {
    if (_isAnalyzingAudio) return;
    _isAnalyzingAudio = true;
    _waveformTimer?.cancel();

    try {
      if (await _audioRecorder.isRecording()) {
        final recorded = await _audioRecorder.stop();
        if (recorded != null && recorded.isNotEmpty) {
          _recordingPath = recorded;
        }
      }
    } catch (e) {
      debugPrint('[PronunciationChallenge] Error stopping recorder: $e');
    }

    if (!mounted) {
      _isAnalyzingAudio = false;
      return;
    }

    setState(() {
      _state = PracticeState.analyzing;
    });

    if (_words.isEmpty) {
      _isAnalyzingAudio = false;
      return;
    }
    final currentItem = _words[_currentWordIndex];
    final itemId = currentItem['itemId'] as String? ?? '';

    // Verify student audio through Groq Whisper STT API
    if (_recordingPath != null && File(_recordingPath!).existsSync()) {
      try {
        debugPrint('[PronunciationChallenge] Uploading audio for verification: $_recordingPath (itemId: $itemId)');
        final res = await ApiService.uploadMultipartFile(
          '/students/pronunciation/verify-audio',
          _recordingPath!,
          'audio',
          fields: {
            'itemId': itemId,
            if (_sessionId.isNotEmpty) 'sessionId': _sessionId,
          },
        );

        debugPrint('[PronunciationChallenge] STT response: success=${res.success}, data=${res.data}, error=${res.error}');

        if (res.success && res.data != null) {
          final int score = res.data['accuracyScore'] is int
              ? res.data['accuracyScore']
              : int.tryParse(res.data['accuracyScore']?.toString() ?? '0') ?? 0;
          final String feedback = res.data['feedback']?.toString() ?? '';
          final bool isPassed = res.data['isPassed'] == true || score >= 80;

          if (!mounted) {
            _isAnalyzingAudio = false;
            return;
          }
          final int wordXp = res.data['xpEarned'] is int
              ? res.data['xpEarned'] as int
              : (int.tryParse(res.data['xpEarned']?.toString() ?? '') ?? _baseXpPerWord);

          setState(() {
            _accuracyScore = score;
            _feedbackText = feedback;
            if (isPassed) {
              _state = PracticeState.success;
              _earnedXp += wordXp;
            } else {
              _state = PracticeState.needsPractice;
              _activeGuidedSyllableIndex = 0;
            }
          });

          _isAnalyzingAudio = false;
          return;
        } else {
          // Server returned an error (e.g. no speech detected or auth error)
          final errMsg = res.error?.isNotEmpty == true
              ? res.error!
              : 'Could not hear clearly. Try again.';
          if (!mounted) {
            _isAnalyzingAudio = false;
            return;
          }
          setState(() {
            _accuracyScore = 0;
            _feedbackText = errMsg;
            _state = PracticeState.needsPractice;
            _activeGuidedSyllableIndex = 0;
          });
          _isAnalyzingAudio = false;
          return;
        }
      } catch (e) {
        debugPrint('[PronunciationChallenge] STT verify API error: $e');
        if (!mounted) {
          _isAnalyzingAudio = false;
          return;
        }
        setState(() {
          _accuracyScore = 0;
          _feedbackText = 'Connection error. Try again.';
          _state = PracticeState.needsPractice;
          _activeGuidedSyllableIndex = 0;
        });
        _isAnalyzingAudio = false;
        return;
      }
    }

    // If no recording file was produced (e.g., tap was too quick or mic didn't capture)
    if (!mounted) {
      _isAnalyzingAudio = false;
      return;
    }
    setState(() {
      _accuracyScore = 0;
      _feedbackText = 'Too short. Hold mic and speak.';
      _state = PracticeState.needsPractice;
      _activeGuidedSyllableIndex = 0;
    });
    _isAnalyzingAudio = false;
  }

  /// Removes a syllable index from the active highlight set and updates the
  /// guided syllable pointer. Safe to call from any async context.
  void _clearSyllableHighlight(int index) {
    if (!mounted) return;
    setState(() {
      _activeSyllableIndices.remove(index);
      if (_activeGuidedSyllableIndex == index) {
        _activeGuidedSyllableIndex =
            _activeSyllableIndices.isNotEmpty ? _activeSyllableIndices.last : -1;
        _selectedSyllable = _activeGuidedSyllableIndex >= 0
            ? _words[_currentWordIndex]['syllables'][_activeGuidedSyllableIndex]
            : null;
      }
    });
  }

  void _playSyllableAudio(int index, String syllable) async {
    // Anti-spam: Only block if THIS EXACT syllable index is already playing, or Sally is reading the full word
    if (_activeSyllableIndices.contains(index) || _state == PracticeState.listening) return;

    Feedback.forTap(context);
    if (!mounted) return;

    setState(() {
      _activeSyllableIndices.add(index);
      _selectedSyllable = syllable;
      _activeGuidedSyllableIndex = index;
    });

    try {
      final currentItem = _words[_currentWordIndex];
      final lang = (currentItem['language'] as String? ?? widget.language).toLowerCase().startsWith('en') ? 'en' : 'fil';
      final cleanSyllable = syllable.trim();
      final soundMap = currentItem['syllableSoundMap'] as Map<int, String>?;
      // If an explicit phonetic sound guide exists for this syllable, use it; otherwise use text
      final phoneticSound = soundMap?[index] ?? cleanSyllable;

      // Get or create dedicated player per syllable index for clean polyphony
      final player = _syllablePlayers.putIfAbsent(index, () => AudioPlayer());

      Future<void> playAudioBytes(Uint8List bytes, int idx) async {
        if (!mounted) return;
        await player.stop();
        if (!mounted) return;
        await player.play(BytesSource(bytes));

        Timer? safetyTimer;
        safetyTimer = Timer(const Duration(milliseconds: 1600), () {
          _clearSyllableHighlight(idx);
        });
        player.onPlayerComplete.first.then((_) {
          safetyTimer?.cancel();
          _clearSyllableHighlight(idx);
        }).catchError((_) {
          safetyTimer?.cancel();
          _clearSyllableHighlight(idx);
        });
      }

      // 1. Check in-memory cache
      final cacheKey = 'syl_${lang}_$phoneticSound';
      Uint8List? audioBytes = _audioCache[cacheKey];

      // 2. Fetch raw neural bytes from backend TTS streaming endpoint
      if (audioBytes == null || audioBytes.isEmpty) {
        final query = '/students/sentence/tts?text=${Uri.encodeComponent(phoneticSound)}&language=$lang&rate=-10%';
        final fetched = await ApiService.getRawBytes(query);
        if (fetched != null && fetched.isNotEmpty) {
          audioBytes = fetched;
          _audioCache[cacheKey] = fetched;
        }
      }

      if (audioBytes != null && audioBytes.isNotEmpty) {
        await playAudioBytes(audioBytes, index);
        return;
      }

      // 3. Device TTS Fallback
      final ttsLang = lang == 'en' ? 'en-US' : 'fil-PH';
      await _flutterTts.setLanguage(ttsLang);
      await _flutterTts.setSpeechRate(0.38);
      await _flutterTts.setPitch(1.0);
      await _flutterTts.speak(phoneticSound);

      Timer(const Duration(milliseconds: 800), () {
        _clearSyllableHighlight(index);
      });
    } catch (_) {
      _clearSyllableHighlight(index);
    }
  }

  void _nextWord() {
    Feedback.forTap(context);

    // Save the accuracy score and attempts for the completed word
    _wordAccuracies.add(_accuracyScore);
    if (_attemptsCount > 1) {
      _mistakesCount += (_attemptsCount - 1);
    }

    if (_currentWordIndex < _words.length) {
      final currentItem = _words[_currentWordIndex];
      _sessionWordResults.add({
        'itemId': currentItem['itemId']?.toString() ?? '',
        'word': currentItem['word']?.toString() ?? '',
        'accuracyScore': _accuracyScore,
        'attemptsCount': _attemptsCount,
        'isPassed': _accuracyScore >= 80,
      });
    }

    if (_currentWordIndex + 1 < _words.length) {
      setState(() {
        _currentWordIndex++;
        _state = PracticeState.initial;
        _activeGuidedSyllableIndex = -1;
        _selectedSyllable = null;
        _attemptsCount = 0;
      });

      // Persist progress so student can resume if they leave
      ActivityProgressService.saveProgress(
        activityType: 'pronunciation',
        currentIndex: _currentWordIndex,
        totalItems: _words.length,
        words: _words,
        earnedXp: _earnedXp,
        sessionId: _sessionId,
        language: _sessionLanguage,
        difficulty: _sessionDifficulty,
        extraMetadata: {
          'wordAccuracies': _wordAccuracies,
          'sessionWordResults': _sessionWordResults,
          'mistakesCount': _mistakesCount,
        },
      );
    } else {
      // Session fully completed — calculate overall metrics and display celebration screen
      ActivityProgressService.clearProgress('pronunciation', _sessionLanguage);
      final avgAccuracy = _wordAccuracies.isNotEmpty
          ? (_wordAccuracies.reduce((a, b) => a + b) / _wordAccuracies.length).round().clamp(0, 100)
          : 100;
      final feedback = _getCelebrationFeedback(avgAccuracy);

      setState(() {
        _finalAccuracy = avgAccuracy;
        _celebrationMessage = feedback['compliment']!;
        _celebrationSubtitle = feedback['subtitle']!;
        _isFinished = true;
      });
      _confettiController.play();
      _syncActivityCompletion();
    }
  }

  Future<void> _syncActivityCompletion() async {
    final totalWords = _words.length;
    final avgAccuracy = _finalAccuracy;

    try {
      debugPrint('[PronunciationChallenge] Submitting attempt: session=$_sessionId, diff=$_sessionDifficulty, lang=$_sessionLanguage, words=$totalWords, score=$avgAccuracy, xp=$_earnedXp');
      final res = await ApiService.post('/students/pronunciation/attempt', {
        'sessionId': _sessionId,
        'language': _sessionLanguage,
        'difficulty': _sessionDifficulty,
        'totalWords': totalWords,
        'mistakesCount': _mistakesCount,
        'score': avgAccuracy,
        'xpEarned': _earnedXp,
        'itemsDetail': _sessionWordResults,
      });

      debugPrint('[PronunciationChallenge] Attempt response: success=${res.success}, data=${res.data}');

      if (res.success && res.data != null && res.data['newBadgeUnlocked'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.stars_rounded, color: Color(0xFFFBBF24)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Badge Unlocked: Sounds right! 🎙️',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF0F172A),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('[PronunciationChallenge] Attempt submission error: $e');
    }
  }

  void _setupFreshSession() {
    setState(() {
      _isFinished = false;
      _wordAccuracies.clear();
      _sessionWordResults.clear();
      _mistakesCount = 0;
      _finalAccuracy = 100;
    });
    _confettiController.stop();
    _loadSessionWords();
  }


  // ─────────────────────────────────────────────────────────────────────────
  // DIALOGS / MODALS
  // ─────────────────────────────────────────────────────────────────────────

  void _showHelpModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(100),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDBEAFE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Iconify(
                      PhIcons.userSoundBold,
                      color: Color(0xFF1B64D8),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'How to Practice',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildHelpStep(
                '1',
                'Tap the word card to hear Sally pronounce the word.',
              ),
              _buildHelpStep(
                '2',
                'Tap the syllable buttons below to hear individual sounds.',
              ),
              _buildHelpStep(
                '3',
                'Press the green microphone button and speak clearly.',
              ),
              _buildHelpStep(
                '4',
                'Receive instant clarity feedback and earn XP!',
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B64D8),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Got It',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  Widget _buildHelpStep(String number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              number,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF475569),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF475569),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }



  String _getSpeechBubbleText() {
    if (_isPlayingReferenceAudio) {
      return 'Listening to Sally...';
    }
    switch (_state) {
      case PracticeState.loading:
        return 'Loading words...';
      case PracticeState.listening:
        return 'Listening to Sally...';
      case PracticeState.readyToRecord:
        return 'Your turn!';
      case PracticeState.recording:
        return 'Speaking...';
      case PracticeState.analyzing:
        return 'Checking...';
      case PracticeState.success:
        return 'Great job!';
      case PracticeState.needsPractice:
        return 'Try the syllables!';
      case PracticeState.initial:
        return 'Listen first!';
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const primaryGreen = Color(0xFF10B981);
    const softCanvasBg = Color(0xFFFCFAF7);

    // ── Celebration state ──────────────────────────────────────────────────
    if (_isFinished) {
      return Scaffold(
        backgroundColor: softCanvasBg,
        body: _buildCelebrationWidget(primaryBlue),
      );
    }

    // ── Loading state ──────────────────────────────────────────────────────
    if (_state == PracticeState.loading) {
      return Scaffold(
        backgroundColor: softCanvasBg,
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20.0, 4.0, 20.0, 2.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'PRONUNCIATION PRACTICE',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: const Color(0xFF94A3B8),
                        letterSpacing: 0.5,
                      ),
                    ),
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.pop(context),
                      icon: const Iconify(Ph.x, size: 22, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),
              const Expanded(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(color: primaryBlue),
                      SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // ── Error / empty state ────────────────────────────────────────────────
    if (_loadError != null || _words.isEmpty) {
      return Scaffold(
        backgroundColor: softCanvasBg,
        body: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20.0, 4.0, 20.0, 2.0),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'PRONUNCIATION PRACTICE',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF64748B),
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: _showHelpModal,
                      icon: const Icon(
                        Icons.help_outline_rounded,
                        size: 22,
                        color: Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(width: 14),
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.pop(context),
                      icon: const Iconify(
                        Ph.x,
                        size: 22,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.wifi_off_rounded,
                          size: 52,
                          color: Color(0xFFCBD5E1),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _loadError ?? 'No words available.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: const Color(0xFF64748B),
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _loadSessionWords,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryBlue,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 28,
                              vertical: 12,
                            ),
                          ),
                          child: Text(
                            'Try Again',
                            style: GoogleFonts.inter(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // ── Main Game UI ───────────────────────────────────────────────────────
    final currentWordData = _words[_currentWordIndex];
    final String wordText = currentWordData['word'] as String;
    final List<String> syllables =
        List<String>.from(currentWordData['syllables'] as List);
    final String definition = currentWordData['definition'] as String;
    final String translation = currentWordData['translation'] as String;
    final String exampleSentence =
        (currentWordData['exampleSentence'] as String?) ?? '';

    final double progress = (_currentWordIndex + 1) / _words.length;

    return Scaffold(
      backgroundColor: softCanvasBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, rootConstraints) {
            final double screenHeight = rootConstraints.maxHeight;
            final double screenWidth = rootConstraints.maxWidth;
            final bool isTablet = screenWidth > 600;
            final bool isCompactScreen = screenHeight < 680;

            // Responsive scale parameters
            final double mascotHeight = (screenHeight * (isCompactScreen ? 0.22 : 0.26)).clamp(110.0, 210.0);
            final double micSize = isCompactScreen ? 64.0 : 74.0;
            final double bottomControlsHeight = 52.0 + 4.0 + micSize + 6.0 + 22.0;
            final double cardVerticalPadding = isCompactScreen ? 8.0 : 12.0;
            final double wordFontSize = isCompactScreen ? 23.0 : 26.0;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 540.0 : double.infinity,
                ),
                child: Column(
                  children: [
                    // ── Top Header Navigation Bar ──────────────────────────────────
                    Padding(
                      padding: EdgeInsets.fromLTRB(20.0, isCompactScreen ? 4.0 : 8.0, 20.0, 0.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Row 1: Activity Title (Full width & prominent) + Actions (Help, Close)
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'PRONUNCIATION PRACTICE',
                                  style: GoogleFonts.inter(
                                    fontSize: isCompactScreen ? 12 : 13,
                                    fontWeight: FontWeight.w900,
                                    color: const Color(0xFF64748B),
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                              IconButton(
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: _showHelpModal,
                                icon: const Icon(
                                  Icons.help_outline_rounded,
                                  size: 22,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                              const SizedBox(width: 14),
                              IconButton(
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () => Navigator.pop(context),
                                icon: const Iconify(
                                  Ph.x,
                                  size: 22,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),

                          // Row 2: Progress Indicator across the full width
                          ClipRRect(
                            borderRadius: BorderRadius.circular(100),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 6,
                              backgroundColor: const Color(0xFFE2E8F0),
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                Color(0xFF1B64D8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ── Main Responsive Content Area ──────────────────────────────
                    Expanded(
                      child: LayoutBuilder(
                        builder: (context, contentConstraints) {
                          return SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                minHeight: contentConstraints.maxHeight,
                              ),
                              child: IntrinsicHeight(
                            child: Padding(
                              padding: EdgeInsets.fromLTRB(
                                24.0,
                                isCompactScreen ? 2.0 : 4.0,
                                24.0,
                                isCompactScreen ? 4.0 : 10.0,
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // 1. Top Card: Word + definition + example sentence
                                  GestureDetector(
                                    onTap: (_isPlayingReferenceAudio || _state == PracticeState.listening)
                                        ? null
                                        : _playReferenceAudio,
                                    child: Container(
                                      width: double.infinity,
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 18.0,
                                        vertical: cardVerticalPadding,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                          color: const Color(0xFF0F172A),
                                          width: 1.5,
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFF0F172A).withValues(alpha: 0.04),
                                            blurRadius: 10,
                                            offset: const Offset(0, 3),
                                          ),
                                        ],
                                      ),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          // Word + volume icon
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                wordText,
                                                textAlign: TextAlign.center,
                                                style: GoogleFonts.inter(
                                                  fontSize: wordFontSize,
                                                  fontWeight: FontWeight.w800,
                                                  color: const Color(0xFF0F172A),
                                                  letterSpacing: -0.3,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              Icon(
                                                Icons.volume_up_rounded,
                                                color: (_isPlayingReferenceAudio || _state == PracticeState.listening)
                                                    ? const Color(0xFF1B64D8)
                                                    : const Color(0xFF64748B),
                                                size: isCompactScreen ? 20 : 24,
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          // Definition + translation
                                          Text(
                                            '$definition ($translation)',
                                            textAlign: TextAlign.center,
                                            style: GoogleFonts.inter(
                                              fontSize: isCompactScreen ? 12 : 13,
                                              fontWeight: FontWeight.w500,
                                              color: const Color(0xFF334155),
                                              height: 1.3,
                                            ),
                                          ),
                                          // Example sentence (if available)
                                          if (exampleSentence.isNotEmpty) ...[
                                            const SizedBox(height: 3),
                                            Text(
                                              '"$exampleSentence"',
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.inter(
                                                fontSize: isCompactScreen ? 11 : 12,
                                                fontWeight: FontWeight.w400,
                                                color: const Color(0xFF94A3B8),
                                                fontStyle: FontStyle.italic,
                                                height: 1.3,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ),

                                  // 2. Middle: Sally Mascot + Speech Bubble
                                  Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      // Speech Bubble
                                      Container(
                                        margin: EdgeInsets.only(bottom: isCompactScreen ? 4 : 6),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 14,
                                          vertical: 5,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(12),
                                          border: Border.all(
                                            color: const Color(0xFF0F172A),
                                            width: 1.5,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.04),
                                              blurRadius: 4,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: Text(
                                          _getSpeechBubbleText(),
                                          style: GoogleFonts.inter(
                                            fontSize: isCompactScreen ? 12 : 13,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                      ),

                                      // Sally Mascot (Responsive height)
                                      Transform.translate(
                                        offset: Offset(
                                          (_state == PracticeState.success && !_isPlayingReferenceAudio) ? 0 : 18.5,
                                          0,
                                        ),
                                        child: SizedBox(
                                          height: mascotHeight,
                                          child: Image.asset(
                                            _getMascotAsset(),
                                            key: ValueKey<String>(_getMascotAsset()),
                                            fit: BoxFit.contain,
                                            errorBuilder: (context, error, stackTrace) =>
                                                const Icon(
                                              Icons.face_retouching_natural_rounded,
                                              size: 70,
                                              color: Color(0xFFD97706),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),

                                  // 3. Syllable Chips (Duolingo-style interactive scaffolding)
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 6,
                                    alignment: WrapAlignment.center,
                                    children: syllables.asMap().entries.map((entry) {
                                      final int idx = entry.key;
                                      final String syl = entry.value;
                                      final bool isSelected = _activeSyllableIndices.contains(idx);

                                      return GestureDetector(
                                        onTap: _activeSyllableIndices.contains(idx) ? null : () => _playSyllableAudio(idx, syl),
                                        child: AnimatedContainer(
                                          duration: const Duration(milliseconds: 150),
                                          width: isCompactScreen ? 58 : 64,
                                          height: isCompactScreen ? 44 : 48,
                                          decoration: BoxDecoration(
                                            color: isSelected
                                                ? const Color(0xFFEFF6FF)
                                                : Colors.white,
                                            borderRadius: BorderRadius.circular(14),
                                            border: Border.all(
                                              color: isSelected
                                                  ? const Color(0xFF1B64D8)
                                                  : const Color(0xFF0F172A),
                                              width: isSelected ? 2.5 : 1.5,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: isSelected
                                                    ? const Color(0xFF1B64D8).withValues(alpha: 0.15)
                                                    : Colors.black.withValues(alpha: 0.03),
                                                blurRadius: 4,
                                                offset: const Offset(0, 2),
                                              ),
                                            ],
                                          ),
                                          child: Center(
                                            child: Text(
                                              syl,
                                              style: GoogleFonts.inter(
                                                fontSize: isCompactScreen ? 15 : 17,
                                                fontWeight: FontWeight.w800,
                                                color: isSelected
                                                    ? const Color(0xFF1B64D8)
                                                    : const Color(0xFF0F172A),
                                              ),
                                            ),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),

                                  // 4. Bottom: Mic Button or Score+Next Controls
                                  Padding(
                                    padding: EdgeInsets.only(bottom: isCompactScreen ? 4.0 : 8.0),
                                    child: SizedBox(
                                      height: bottomControlsHeight,
                                      child: _state == PracticeState.success
                                          ? Column(
                                              mainAxisAlignment: MainAxisAlignment.end,
                                              children: [
                                                Container(
                                                  padding: const EdgeInsets.symmetric(
                                                    horizontal: 18,
                                                    vertical: 8,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(0xFFD1FAE5),
                                                    borderRadius: BorderRadius.circular(14),
                                                    border: Border.all(
                                                      color: const Color(0xFF10B981),
                                                    ),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      const Icon(
                                                        Icons.check_circle_rounded,
                                                        color: Color(0xFF10B981),
                                                        size: 18,
                                                      ),
                                                      const SizedBox(width: 8),
                                                      Text(
                                                        '$_accuracyScore% Match • +$_baseXpPerWord XP',
                                                        style: GoogleFonts.inter(
                                                          fontSize: 13,
                                                          fontWeight: FontWeight.w800,
                                                          color: const Color(0xFF047857),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                SizedBox(height: isCompactScreen ? 8 : 12),
                                                Container(
                                                  width: double.infinity,
                                                  height: isCompactScreen ? 48 : 54,
                                                  decoration: BoxDecoration(
                                                    borderRadius: BorderRadius.circular(16),
                                                    boxShadow: [
                                                      BoxShadow(
                                                        color: primaryGreen.withValues(alpha: 0.25),
                                                        blurRadius: 16,
                                                        offset: const Offset(0, 4),
                                                      ),
                                                    ],
                                                  ),
                                                  child: ElevatedButton(
                                                    onPressed: _nextWord,
                                                    style: ElevatedButton.styleFrom(
                                                      backgroundColor: primaryGreen,
                                                      foregroundColor: Colors.white,
                                                      elevation: 0,
                                                      shape: RoundedRectangleBorder(
                                                        borderRadius: BorderRadius.circular(16),
                                                      ),
                                                    ),
                                                    child: Text(
                                                      _currentWordIndex + 1 == _words.length
                                                          ? 'Finish Activity'
                                                          : 'Next Word',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 16,
                                                        fontWeight: FontWeight.w700,
                                                        color: Colors.white,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            )
                                          : Column(
                                              mainAxisAlignment: MainAxisAlignment.end,
                                              children: [
                                                // Floating Accuracy Callout / Status Badge directly on top of the Mic
                                                // Fixed height (52px) so 1 or 2-line remarks never shift or jump other components!
                                                SizedBox(
                                                  height: 52,
                                                  child: Center(
                                                    child: _state == PracticeState.needsPractice && _feedbackText.isNotEmpty
                                                        ? Container(
                                                            margin: const EdgeInsets.symmetric(horizontal: 12),
                                                            padding: const EdgeInsets.symmetric(
                                                              horizontal: 14,
                                                              vertical: 6,
                                                            ),
                                                            decoration: BoxDecoration(
                                                              color: _accuracyScore < 50
                                                                  ? const Color(0xFFFEE2E2)
                                                                  : const Color(0xFFFEF3C7),
                                                              borderRadius: BorderRadius.circular(12),
                                                              border: Border.all(
                                                                color: _accuracyScore < 50
                                                                    ? const Color(0xFFEF4444)
                                                                    : const Color(0xFFF59E0B),
                                                                width: 1.2,
                                                              ),
                                                              boxShadow: [
                                                                BoxShadow(
                                                                  color: (_accuracyScore < 50
                                                                          ? const Color(0xFFEF4444)
                                                                          : const Color(0xFFF59E0B))
                                                                      .withValues(alpha: 0.12),
                                                                  blurRadius: 6,
                                                                  offset: const Offset(0, 2),
                                                                ),
                                                              ],
                                                            ),
                                                            child: Text(
                                                              _accuracyScore > 0
                                                                  ? '$_accuracyScore% Match • $_feedbackText'
                                                                  : _feedbackText,
                                                              textAlign: TextAlign.center,
                                                              softWrap: true,
                                                              style: GoogleFonts.inter(
                                                                fontSize: isCompactScreen ? 11 : 12,
                                                                fontWeight: FontWeight.w800,
                                                                height: 1.35,
                                                                color: _accuracyScore < 50
                                                                    ? const Color(0xFFDC2626)
                                                                    : const Color(0xFFD97706),
                                                              ),
                                                            ),
                                                          )
                                                        : (_activeGuidedSyllableIndex >= 0
                                                            ? Container(
                                                                margin: const EdgeInsets.symmetric(horizontal: 12),
                                                                padding: const EdgeInsets.symmetric(
                                                                  horizontal: 12,
                                                                  vertical: 5,
                                                                ),
                                                                decoration: BoxDecoration(
                                                                  color: const Color(0xFFEFF6FF),
                                                                  borderRadius: BorderRadius.circular(10),
                                                                  border: Border.all(
                                                                    color: const Color(0xFF93C5FD),
                                                                  ),
                                                                ),
                                                                child: Text(
                                                                  'Practicing syllable ${_selectedSyllable ?? ""}',
                                                                  textAlign: TextAlign.center,
                                                                  softWrap: true,
                                                                  style: GoogleFonts.inter(
                                                                    fontSize: 11,
                                                                    fontWeight: FontWeight.w700,
                                                                    height: 1.3,
                                                                    color: const Color(0xFF1B64D8),
                                                                  ),
                                                                ),
                                                              )
                                                            : const SizedBox.shrink()),
                                                  ),
                                                ),
                                                const SizedBox(height: 4),

                                                // Hybrid Interactive Microphone (Tap to toggle OR Hold to speak)
                                                GestureDetector(
                                                  onTap: () {
                                                    if (_state == PracticeState.analyzing || _state == PracticeState.listening) return;
                                                    if (_state == PracticeState.recording) {
                                                      _stopAndAnalyzeAudio();
                                                    } else {
                                                      _startRecording();
                                                    }
                                                  },
                                                  onLongPressStart: (_) {
                                                    if (_state == PracticeState.analyzing || _state == PracticeState.listening) return;
                                                    if (_state != PracticeState.recording) {
                                                      _startRecording();
                                                    }
                                                  },
                                                  onLongPressEnd: (_) {
                                                    if (_state == PracticeState.recording) {
                                                      _stopAndAnalyzeAudio();
                                                    }
                                                  },
                                                  child: AnimatedContainer(
                                                    duration: const Duration(milliseconds: 150),
                                                    width: micSize,
                                                    height: micSize,
                                                    decoration: BoxDecoration(
                                                      color: _state == PracticeState.recording ? const Color(0xFFEF4444) : primaryBlue,
                                                      shape: BoxShape.circle,
                                                      boxShadow: [
                                                        BoxShadow(
                                                          color: (_state == PracticeState.recording ? const Color(0xFFEF4444) : primaryBlue).withValues(
                                                            alpha: _state == PracticeState.recording ? 0.45 : 0.35,
                                                          ),
                                                          blurRadius: _state == PracticeState.recording ? 20 : 14,
                                                          offset: const Offset(0, 4),
                                                        ),
                                                      ],
                                                    ),
                                                    child: Center(
                                                      child: _state == PracticeState.analyzing
                                                          ? const SizedBox(
                                                              width: 26,
                                                              height: 26,
                                                              child: CircularProgressIndicator(
                                                                strokeWidth: 3,
                                                                color: Colors.white,
                                                              ),
                                                            )
                                                          : Icon(
                                                              _state == PracticeState.recording ? Icons.mic : Icons.mic_rounded,
                                                              color: Colors.white,
                                                              size: micSize * 0.48,
                                                            ),
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(height: 6),

                                                // Instruction text below mic
                                                SizedBox(
                                                  height: 22,
                                                  child: Center(
                                                    child: Text(
                                                      _state == PracticeState.recording
                                                          ? 'Listening... (Tap or release to finish)'
                                                          : (_state == PracticeState.analyzing
                                                              ? 'Analyzing...'
                                                              : (_attemptsCount > 0 ? 'Tap or hold to try again' : 'Tap or hold to speak')),
                                                      textAlign: TextAlign.center,
                                                      style: GoogleFonts.inter(
                                                        fontSize: isCompactScreen ? 12 : 13,
                                                        fontWeight: FontWeight.w600,
                                                        color: _state == PracticeState.recording
                                                            ? const Color(0xFFEF4444)
                                                            : const Color(0xFF64748B),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
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

  Map<String, String> _getCelebrationFeedback(int accuracy) {
    final rand = Random();

    if (accuracy >= 90) {
      const compliments = [
        'Awesome job!',
        'Perfect voice!',
        'Outstanding!',
        'You nailed it!',
        'Super star!',
        'Brilliant work!',
        'Incredible!',
      ];
      const subtitles = [
        'Crystal-clear pronunciation! Your speech skills are outstanding!',
        'A wonderful session! You spoke each word with great confidence!',
        'Amazing accuracy! Keep speaking out loud with Sally!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else if (accuracy >= 80) {
      const compliments = [
        'Great effort!',
        'Well done!',
        'Way to go!',
        'Fantastic work!',
        'You did it!',
        'Keep shining!',
        'Almost perfect!',
      ];
      const subtitles = [
        'You pronounced almost every word clearly! Keep it up!',
        'Great pronunciation! Your tone and clarity are improving fast!',
        'Solid performance! You are speaking more naturally every day!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else if (accuracy >= 65) {
      const compliments = [
        'Good progress!',
        'Nice perseverance!',
        'Keep it up!',
        'Getting stronger!',
        'Step by step!',
        'Proud of your effort!',
      ];
      const subtitles = [
        'Great practice! Breaking words down by syllables makes you stronger!',
        'You pushed through and finished all the words! Well done!',
        'Steady progress! Keep listening to Sally and practice again!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else {
      const compliments = [
        'Keep practicing!',
        'Never give up!',
        'Practice pays off!',
        'You can do this!',
        'Keep learning!',
      ];
      const subtitles = [
        'Every practice round helps your pronunciation grow! Try once more!',
        'Great dedication! Tap each syllable to listen, then try again!',
        'You finished the activity! Try again to achieve an even higher score!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    }
  }

  Widget _buildCelebrationWidget(Color primaryBlue) {
    return Stack(
      alignment: Alignment.topCenter,
      children: [
        ConfettiWidget(
          confettiController: _confettiController,
          blastDirectionality: BlastDirectionality.explosive,
          shouldLoop: false,
          colors: const [
            Color(0xFF1B64D8),
            Color(0xFFF59E0B),
            Color(0xFF10B981),
            Color(0xFFEC4899),
            Color(0xFF8B5CF6),
          ],
          numberOfParticles: 35,
          gravity: 0.25,
        ),
        SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 8),

                // 1. Top Centered Speech Bubble above Sally
                Center(
                  child: CustomPaint(
                    painter: _CelebrationSpeechBubblePainter(
                      color: Colors.white,
                      borderColor: const Color(0xFF0F172A),
                      borderWidth: 2.2,
                      radius: 24.0,
                    ),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24.0,
                        vertical: 10.0,
                      ),
                      child: Text(
                        _celebrationMessage,
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0F172A),
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // 2. Sally Mascot Illustration (Celebration)
                Image.asset(
                  'assets/mascot/sally_celebration.webp',
                  height: 165,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Image.asset(
                    'assets/mascot/sally_sitting.webp',
                    height: 165,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 20),

                // 3. Title and Subtitle
                Text(
                  'Activity Completed!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 26,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF0F172A),
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _celebrationSubtitle,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: const Color(0xFF64748B),
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 24),

                // 4. Tri-Stat Metric Box (XP, Accuracy, Mistakes)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 18.0, horizontal: 12.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: const Color(0xFF0F172A),
                      width: 2.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.05),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Stat 1: XP
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.bolt_rounded,
                              color: Color(0xFFF59E0B),
                              size: 26,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'XP',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF94A3B8),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '+$_earnedXp',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Divider 1
                      Container(
                        width: 1,
                        height: 46,
                        color: const Color(0xFFE2E8F0),
                      ),

                      // Stat 2: Accuracy
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.check_circle_rounded,
                              color: Color(0xFF10B981),
                              size: 24,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'ACCURACY',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF94A3B8),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_finalAccuracy%',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Divider 2
                      Container(
                        width: 1,
                        height: 46,
                        color: const Color(0xFFE2E8F0),
                      ),

                      // Stat 3: Mistakes
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.cancel_rounded,
                              color: Color(0xFFEF4444),
                              size: 24,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'MISTAKES',
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF94A3B8),
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$_mistakesCount',
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Streak Banner Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFE2E8F0),
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // Flame Icon Container
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFFFFEDD5),
                            width: 1,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: const Iconify(
                          PhIcons.fireBold,
                          color: Color(0xFFEA580C),
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Streak Titles
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Practice Streak Active!',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Continue tomorrow for your badge',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // +1 Day pill badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: const Color(0xFFFED7AA),
                            width: 1.2,
                          ),
                        ),
                        child: Text(
                          '+1 Day',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFFEA580C),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // 6. Action Buttons: Stacked Full-Width
                // Primary Continue Button
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryBlue,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Continue',
                          style: GoogleFonts.inter(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(
                          Icons.arrow_forward_rounded,
                          size: 20,
                          color: Colors.white,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Secondary Repeat Practice Button
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton(
                    onPressed: _setupFreshSession,
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF334155),
                      side: const BorderSide(
                        color: Color(0xFFE2E8F0),
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.refresh_rounded,
                          size: 20,
                          color: Color(0xFF64748B),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Practice Again',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// Custom painter for the centered speech bubble above Sally during celebration
class _CelebrationSpeechBubblePainter extends CustomPainter {
  final Color color;
  final Color borderColor;
  final double borderWidth;
  final double radius;

  _CelebrationSpeechBubblePainter({
    this.color = Colors.white,
    this.borderColor = const Color(0xFF0F172A),
    this.borderWidth = 2.2,
    this.radius = 24.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final r = radius;
    final w = size.width;
    final h = size.height;

    // Tail on bottom center pointing straight down towards Sally's head
    final centerX = w / 2;
    const tailHalfWidth = 7.0;
    const tailHeight = 8.0;

    final path = Path();
    path.moveTo(r, 0);
    path.lineTo(w - r, 0);
    path.arcToPoint(Offset(w, r), radius: Radius.circular(r));
    path.lineTo(w, h - r);
    path.arcToPoint(Offset(w - r, h), radius: Radius.circular(r));

    // Bottom edge with center-pointing tail
    path.lineTo(centerX + tailHalfWidth, h);
    path.lineTo(centerX, h + tailHeight);
    path.lineTo(centerX - tailHalfWidth, h);

    path.lineTo(r, h);
    path.arcToPoint(Offset(0, h - r), radius: Radius.circular(r));
    path.lineTo(0, r);
    path.arcToPoint(Offset(r, 0), radius: Radius.circular(r));
    path.close();

    // Subtle drop shadow
    canvas.drawPath(
      path.shift(const Offset(0, 2)),
      Paint()
        ..color = Colors.black.withValues(alpha: 0.04)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
    );

    // White fill
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.fill,
    );

    // Border stroke
    canvas.drawPath(
      path,
      Paint()
        ..color = borderColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = borderWidth
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(covariant _CelebrationSpeechBubblePainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.borderColor != borderColor ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.radius != radius;
  }
}
