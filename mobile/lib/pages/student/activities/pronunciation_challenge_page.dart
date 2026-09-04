import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';

import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:record/record.dart';
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
                // Restore syllableAudioMap as Map<String, String>
                if (map['syllableAudioMap'] is Map) {
                  map['syllableAudioMap'] = Map<String, String>.from(
                    (map['syllableAudioMap'] as Map).map((k, v) => MapEntry(k.toString(), v.toString())),
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

          setState(() {
            _words = savedWords;
            _currentWordIndex = savedIndex;
            _earnedXp = savedXp;
            _sessionId = savedSessionId;
            _sessionLanguage = savedLanguage;
            _sessionDifficulty = savedDifficulty;
            _state = PracticeState.initial;
            _attemptsCount = 0;
          });

          debugPrint('[PronunciationChallenge] Resumed session at word ${savedIndex + 1}/${savedWords.length} ($_sessionLanguage, $_sessionDifficulty)');
          _preloadSyllablesForWord(_currentWordIndex);
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
          // Normalize syllables: API returns List<dynamic> from JSONB
          final rawSyllables = item['syllables'];
          final List<String> syllables = rawSyllables is List
              ? rawSyllables.map((s) => s.toString()).toList()
              : [];

          // Normalize syllable audios from JSONB (Option B)
          final rawSyllableAudios = item['syllableAudioUrls'];
          final Map<String, String> syllableAudioMap = {};
          if (rawSyllableAudios is List) {
            for (final entry in rawSyllableAudios) {
              if (entry is Map && entry['syllable'] != null && entry['audioUrl'] != null) {
                syllableAudioMap[entry['syllable'].toString()] = entry['audioUrl'].toString();
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
            'audioUrl': item['audioUrl']?.toString(),
            'syllableAudioMap': syllableAudioMap,
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

        // Preload first word's syllable audio in background so there is zero delay when tapped
        _preloadSyllablesForWord(0);
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
    if (_isPlayingReferenceAudio) {
      return 'assets/mascot/sally_speaking.webp';
    }
    if (_state == PracticeState.success) {
      return 'assets/mascot/sally_happy.webp';
    }
    return 'assets/mascot/sally_speaking.webp';
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
      String? audioUrl = currentItem['audioUrl'] as String?;
      final itemId = currentItem['itemId'] as String?;

      // If audioUrl not cached locally, request from backend endpoint
      if ((audioUrl == null || audioUrl.isEmpty) && itemId != null && itemId.isNotEmpty) {
        final res = await ApiService.get('/students/pronunciation/audio/$itemId');
        if (res.success && res.data != null && res.data['audioUrl'] != null) {
          audioUrl = res.data['audioUrl'].toString();
          currentItem['audioUrl'] = audioUrl; // Cache in session
        }
      }

      // Preload and persist syllable audios into DB in background
      if (itemId != null && itemId.isNotEmpty) {
        final syllableMap = currentItem['syllableAudioMap'] as Map<String, String>?;
        if (syllableMap == null || syllableMap.isEmpty) {
          ApiService.get('/students/pronunciation/syllables-audio/$itemId').then((res) {
            if (res.success && res.data?['syllableAudios'] is List) {
              final list = res.data['syllableAudios'] as List;
              for (final entry in list) {
                if (entry is Map && entry['syllable'] != null && entry['audioUrl'] != null) {
                  syllableMap?[entry['syllable'].toString()] = entry['audioUrl'].toString();
                }
              }
            }
          }).catchError((_) {});
        }
      }

      if (!mounted) return;

      if (audioUrl != null && audioUrl.isNotEmpty) {
        await _audioPlayer.stop();
        if (!mounted) return;
        await _audioPlayer.play(UrlSource(audioUrl));

        // Listen for completion to transition state
        _audioPlayer.onPlayerComplete.first.then((_) {
          if (mounted) onAudioFinished();
        });
      } else {
        // Fallback timer if audio unavailable
        _systemAudioTimer?.cancel();
        _systemAudioTimer = Timer(const Duration(milliseconds: 1400), () {
          onAudioFinished();
        });
      }
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

          if (isPassed) {
            if (_currentWordIndex + 1 < _words.length) {
              // Persist next word immediately so if user exits during congrats, Continue resumes at next word
              ActivityProgressService.saveProgress(
                activityType: 'pronunciation',
                currentIndex: _currentWordIndex + 1,
                totalItems: _words.length,
                words: _words,
                earnedXp: _earnedXp,
                sessionId: _sessionId,
                language: _sessionLanguage,
                difficulty: _sessionDifficulty,
              );
              // Preload next word's syllable audio in advance
              _preloadSyllablesForWord(_currentWordIndex + 1);
            } else {
              // Last word completed — clear session progress for this language so next time it starts fresh
              ActivityProgressService.clearProgress('pronunciation', _sessionLanguage);
            }
          }

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

  void _playSyllableAudio(int index, String syllable) async {
    // Anti-spam: Only block if THIS EXACT syllable index is already currently playing, or Sally is reading the full word
    if (_activeSyllableIndices.contains(index) || _state == PracticeState.listening) {
      return;
    }

    Feedback.forTap(context);

    if (!mounted) return;
    setState(() {
      _activeSyllableIndices.add(index);
      _selectedSyllable = syllable;
      _activeGuidedSyllableIndex = index;
    });

    void clearHighlight(int finishedIdx) {
      if (mounted) {
        setState(() {
          _activeSyllableIndices.remove(finishedIdx);
          if (_activeGuidedSyllableIndex == finishedIdx) {
            _activeGuidedSyllableIndex = _activeSyllableIndices.isNotEmpty ? _activeSyllableIndices.last : -1;
            _selectedSyllable = _activeGuidedSyllableIndex >= 0 ? _words[_currentWordIndex]['syllables'][_activeGuidedSyllableIndex] : null;
          }
        });
      }
    }

    try {
      final currentItem = _words[_currentWordIndex];
      final syllableMap = currentItem['syllableAudioMap'] as Map<String, String>?;
      final cachedUrl = syllableMap?[syllable];
      final itemId = currentItem['itemId'] as String? ?? '';

      // Get or create dedicated player for this syllable INDEX so duplicate syllables ("ma", "ma") have separate audio players
      final player = _syllablePlayers.putIfAbsent(index, () => AudioPlayer());

      // Helper to play without interrupting other syllables and unhighlight when this syllable finishes
      Future<void> playAudioUrl(String url, int idx) async {
        if (!mounted) return;
        await player.stop();
        if (!mounted) return;
        await player.play(UrlSource(url));

        // Safety fallback timer in case audio stream is interrupted
        Timer? safetyTimer;
        safetyTimer = Timer(const Duration(milliseconds: 1600), () {
          clearHighlight(idx);
        });

        player.onPlayerComplete.first.then((_) {
          safetyTimer?.cancel();
          clearHighlight(idx);
        }).catchError((_) {
          safetyTimer?.cancel();
          clearHighlight(idx);
        });
      }

      if (cachedUrl != null && cachedUrl.isNotEmpty) {
        // Attempt instant Zero-Latency Playback from preloaded DB column
        try {
          if (!mounted) return;
          await player.stop();
          if (!mounted) return;
          await player.play(UrlSource(cachedUrl));

          Timer? safetyTimer;
          safetyTimer = Timer(const Duration(milliseconds: 1600), () {
            clearHighlight(index);
          });

          player.onPlayerComplete.first.then((_) {
            safetyTimer?.cancel();
            clearHighlight(index);
          }).catchError((_) async {
            safetyTimer?.cancel();
            // Stale or deleted Cloudinary file: invalidate cache and synthesize fresh
            syllableMap?.remove(syllable);
            if (mounted) {
              _regenerateAndPlaySyllable(index, syllable, itemId, syllableMap);
            }
          });
          return;

        } catch (_) {
          syllableMap?.remove(syllable);
          if (mounted) {
            _regenerateAndPlaySyllable(index, syllable, itemId, syllableMap);
          }
          return;
        }
      }


      // If not yet in DB cache, request via backend endpoint and play
      if (itemId.isNotEmpty) {
        try {
          final res = await ApiService.get('/students/pronunciation/syllables-audio/$itemId');
          if (res.success && res.data?['syllableAudios'] is List) {
            final list = res.data['syllableAudios'] as List;
            for (final entry in list) {
              if (entry is Map && entry['syllable'] != null && entry['audioUrl'] != null) {
                syllableMap?[entry['syllable'].toString()] = entry['audioUrl'].toString();
              }
            }
            final freshUrl = syllableMap?[syllable];
            if (freshUrl != null && freshUrl.isNotEmpty) {
              await playAudioUrl(freshUrl, index);
              return;
            }
          }
        } catch (_) {}
      }

      // Direct fallback synthesis if needed
      final lang = currentItem['language'] as String? ?? widget.language;
      final langFolder = lang.toLowerCase().startsWith('en')
          ? 'salintinig/pronunciation/syllables/eng'
          : 'salintinig/pronunciation/syllables/fil';
      final res = await ApiService.get(
        '/tts/synthesize?text=${Uri.encodeComponent(syllable)}&language=$lang&rate=-12%&folder=$langFolder',
      );
      if (res.success && res.data?['audioUrl'] != null) {
        final url = res.data['audioUrl'].toString();
        syllableMap?[syllable] = url;
        await playAudioUrl(url, index);
      } else {
        clearHighlight(index);
      }
    } catch (_) {
      clearHighlight(index);
    }
  }

  void _regenerateAndPlaySyllable(
    int index,
    String syllable,
    String itemId,
    Map<String, String>? syllableMap,
  ) async {
    try {
      final currentItem = _words[_currentWordIndex];
      final lang = currentItem['language'] as String? ?? widget.language;
      final langFolder = lang.toLowerCase().startsWith('en')
          ? 'salintinig/pronunciation/syllables/eng'
          : 'salintinig/pronunciation/syllables/fil';
      final player = _syllablePlayers.putIfAbsent(index, () => AudioPlayer());

      final res = await ApiService.get(
        '/tts/synthesize?text=${Uri.encodeComponent(syllable)}&language=$lang&rate=-12%&folder=$langFolder',
      );

      if (res.success && res.data?['audioUrl'] != null) {
        final freshUrl = res.data['audioUrl'].toString();
        syllableMap?[syllable] = freshUrl;
        if (!mounted) return;
        await player.stop();
        if (!mounted) return;
        await player.play(UrlSource(freshUrl));
        player.onPlayerComplete.first.then((_) {
          if (mounted) {
            setState(() {
              _activeSyllableIndices.remove(index);
            });
          }
        }).catchError((_) {
          if (mounted) {
            setState(() {
              _activeSyllableIndices.remove(index);
            });
          }
        });
      } else {
        if (mounted) {
          setState(() {
            _activeSyllableIndices.remove(index);
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _activeSyllableIndices.remove(index);
        });
      }
    }
  }

  void _preloadSyllablesForWord(int wordIndex) {

    if (wordIndex >= _words.length) return;
    final item = _words[wordIndex];
    final itemId = item['itemId'] as String? ?? '';
    final syllableMap = item['syllableAudioMap'] as Map<String, String>?;

    if (itemId.isNotEmpty && (syllableMap == null || syllableMap.isEmpty)) {
      ApiService.get('/students/pronunciation/syllables-audio/$itemId').then((res) {
        if (res.success && res.data?['syllableAudios'] is List) {
          final list = res.data['syllableAudios'] as List;
          for (final entry in list) {
            if (entry is Map && entry['syllable'] != null && entry['audioUrl'] != null) {
              syllableMap?[entry['syllable'].toString()] = entry['audioUrl'].toString();
            }
          }
        }
      }).catchError((_) {});
    }
  }

  void _nextWord() {
    Feedback.forTap(context);
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
      );

      // Preload next word's syllable audio immediately
      _preloadSyllablesForWord(_currentWordIndex);
    } else {
      // Session fully completed — clear saved progress
      ActivityProgressService.clearProgress('pronunciation');
      _showCompletionDialog();
    }
  }


  // ─────────────────────────────────────────────────────────────────────────
  // DIALOGS / MODALS
  // ─────────────────────────────────────────────────────────────────────────

  void _showCompletionDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          contentPadding: const EdgeInsets.all(24),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: const BoxDecoration(
                  color: Color(0xFFD1FAE5),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF10B981),
                    size: 40,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Challenge Complete!',
                style: GoogleFonts.inter(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Awesome job on your pronunciation practice!',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.stars_rounded,
                      color: Color(0xFF1B64D8),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '+$_earnedXp XP Earned',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF1B64D8),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B64D8),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Finish Activity',
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

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
}
