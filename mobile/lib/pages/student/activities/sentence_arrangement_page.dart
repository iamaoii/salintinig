import 'dart:async';
import 'dart:math';
import 'package:audioplayers/audioplayers.dart';
import 'package:confetti/confetti.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:iconify_flutter/iconify_flutter.dart';
import 'package:iconify_flutter/icons/ph.dart';
import 'package:salintinig/constants/ph_icons.dart';
import 'package:salintinig/services/activity_progress_service.dart';
import 'package:salintinig/services/api_service.dart';

class SentenceArrangementPage extends StatefulWidget {
  /// Language code: 'fil' or 'en'
  final String language;

  /// Difficulty tier: 'easy', 'medium', 'hard'.
  final String difficulty;

  const SentenceArrangementPage({
    super.key,
    this.language = 'fil',
    this.difficulty = 'medium',
  });

  @override
  State<SentenceArrangementPage> createState() => _SentenceArrangementPageState();
}

class _SentenceArrangementPageState extends State<SentenceArrangementPage> {
  // ── Session Configuration & State ──────────────────────────────────────────
  late String _sessionLanguage;
  late String _sessionDifficulty;
  late ConfettiController _confettiController;
  final FlutterTts _flutterTts = FlutterTts();
  final AudioPlayer _audioPlayer = AudioPlayer();
  final Map<String, Uint8List> _audioCache = {};
  bool _isPlayingTts = false;

  String _sessionId = '';
  int _earnedXp = 0;
  bool _isFinished = false;
  bool _isLoading = false;
  int _mistakesCount = 0;
  int _finalAccuracy = 100;
  String _celebrationMessage = 'Awesome job!';
  String _celebrationSubtitle = 'Great sentence building!';

  // Sentence Items & Current State
  List<Map<String, dynamic>> _sentences = [];
  int _currentIndex = 0;
  List<String> _scrambledWords = [];
  List<String> _arrangedWords = [];
  bool _isChecked = false;
  bool _isCorrect = false;

  // Mascot & Speech Bubble State
  String _sallyMessage = 'Arrange the words!';
  Timer? _sallyResetTimer;

  // ── Offline Curated Fallback Sentences (DepEd-aligned & Cross-Language) ──
  static const Map<String, Map<String, List<Map<String, dynamic>>>> _offlinePool = {
    'fil': {
      'easy': [
        {
          'promptText': 'Mother is kind.',
          'promptLanguage': 'en',
          'targetText': 'Mabait si nanay.',
          'targetLanguage': 'fil',
          'correct': ['Mabait', 'si', 'nanay'],
          'scrambled': ['nanay', 'Mabait', 'si'],
        },
        {
          'promptText': 'The child is happy.',
          'promptLanguage': 'en',
          'targetText': 'Masaya ang bata.',
          'targetLanguage': 'fil',
          'correct': ['Masaya', 'ang', 'bata'],
          'scrambled': ['bata', 'Masaya', 'ang'],
        },
        {
          'promptText': 'The apple is red.',
          'promptLanguage': 'en',
          'targetText': 'Pula ang mansanas.',
          'targetLanguage': 'fil',
          'correct': ['Pula', 'ang', 'mansanas'],
          'scrambled': ['mansanas', 'ang', 'Pula'],
        },
        {
          'promptText': 'The dog is fast.',
          'promptLanguage': 'en',
          'targetText': 'Mabilis ang aso.',
          'targetLanguage': 'fil',
          'correct': ['Mabilis', 'ang', 'aso'],
          'scrambled': ['aso', 'Mabilis', 'ang'],
        },
        {
          'promptText': 'Drink some water.',
          'promptLanguage': 'en',
          'targetText': 'Uminom ng tubig.',
          'targetLanguage': 'fil',
          'correct': ['Uminom', 'ng', 'tubig'],
          'scrambled': ['tubig', 'Uminom', 'ng'],
        },
      ],
      'medium': [
        {
          'promptText': 'We play in the yard.',
          'promptLanguage': 'en',
          'targetText': 'Naglalaro kami sa bakuran.',
          'targetLanguage': 'fil',
          'correct': ['Naglalaro', 'kami', 'sa', 'bakuran'],
          'scrambled': ['sa', 'bakuran', 'kami', 'Naglalaro'],
        },
        {
          'promptText': 'Older brother eats sweet fruit.',
          'promptLanguage': 'en',
          'targetText': 'Kumakain si kuya ng prutas.',
          'targetLanguage': 'fil',
          'correct': ['Kumakain', 'si', 'kuya', 'ng', 'prutas'],
          'scrambled': ['ng', 'prutas', 'Kumakain', 'si', 'kuya'],
        },
        {
          'promptText': 'Our classroom is very clean.',
          'promptLanguage': 'en',
          'targetText': 'Malinis ang aming silid.',
          'targetLanguage': 'fil',
          'correct': ['Malinis', 'ang', 'aming', 'silid'],
          'scrambled': ['silid', 'aming', 'Malinis', 'ang'],
        },
        {
          'promptText': 'The green tree is tall.',
          'promptLanguage': 'en',
          'targetText': 'Mataas ang berdeng puno.',
          'targetLanguage': 'fil',
          'correct': ['Mataas', 'ang', 'berdeng', 'puno'],
          'scrambled': ['puno', 'Mataas', 'berdeng', 'ang'],
        },
        {
          'promptText': 'Grandfather planted fresh corn.',
          'promptLanguage': 'en',
          'targetText': 'Nagtanim si lolo ng mais.',
          'targetLanguage': 'fil',
          'correct': ['Nagtanim', 'si', 'lolo', 'ng', 'mais'],
          'scrambled': ['mais', 'lolo', 'Nagtanim', 'si', 'ng'],
        },
      ],
      'hard': [
        {
          'promptText': 'The students study very hard.',
          'promptLanguage': 'en',
          'targetText': 'Masipag mag-aral ang mga mag-aaral.',
          'targetLanguage': 'fil',
          'correct': ['Masipag', 'mag-aral', 'ang', 'mga', 'mag-aaral'],
          'scrambled': ['mga', 'mag-aaral', 'Masipag', 'ang', 'mag-aral'],
        },
        {
          'promptText': 'I help my own parents.',
          'promptLanguage': 'en',
          'targetText': 'Tumutulong ako sa aking mga magulang.',
          'targetLanguage': 'fil',
          'correct': ['Tumutulong', 'ako', 'sa', 'aking', 'mga', 'magulang'],
          'scrambled': ['magulang', 'sa', 'Tumutulong', 'mga', 'ako', 'aking'],
        },
        {
          'promptText': 'Planting green plants is very important.',
          'promptLanguage': 'en',
          'targetText': 'Mahalaga ang pagtatanim ng mga halaman.',
          'targetLanguage': 'fil',
          'correct': ['Mahalaga', 'ang', 'pagtatanim', 'ng', 'mga', 'halaman'],
          'scrambled': ['halaman', 'mga', 'ng', 'Mahalaga', 'pagtatanim', 'ang'],
        },
        {
          'promptText': 'Always tell truth to everyone.',
          'promptLanguage': 'en',
          'targetText': 'Laging magsabi ng totoo sa lahat.',
          'targetLanguage': 'fil',
          'correct': ['Laging', 'magsabi', 'ng', 'totoo', 'sa', 'lahat'],
          'scrambled': ['lahat', 'totoo', 'Laging', 'sa', 'magsabi', 'ng'],
        },
        {
          'promptText': 'The little child danced happily.',
          'promptLanguage': 'en',
          'targetText': 'Masayang sumayaw ang maliit na bata.',
          'targetLanguage': 'fil',
          'correct': ['Masayang', 'sumayaw', 'ang', 'maliit', 'na', 'bata'],
          'scrambled': ['bata', 'sumayaw', 'Masayang', 'na', 'ang', 'maliit'],
        },
        {
          'promptText': 'Let us respect our kind teachers.',
          'promptLanguage': 'en',
          'targetText': 'Igalang natin ang ating mga guro.',
          'targetLanguage': 'fil',
          'correct': ['Igalang', 'natin', 'ang', 'ating', 'mga', 'guro'],
          'scrambled': ['guro', 'ating', 'Igalang', 'mga', 'natin', 'ang'],
        },
      ],
    },
    'en': {
      'easy': [
        {
          'promptText': 'Mabait si nanay.',
          'promptLanguage': 'fil',
          'targetText': 'Mother is kind.',
          'targetLanguage': 'en',
          'correct': ['Mother', 'is', 'kind'],
          'scrambled': ['kind', 'Mother', 'is'],
        },
        {
          'promptText': 'Masaya ang bata.',
          'promptLanguage': 'fil',
          'targetText': 'The child is happy.',
          'targetLanguage': 'en',
          'correct': ['The', 'child', 'is', 'happy'],
          'scrambled': ['happy', 'The', 'is', 'child'],
        },
        {
          'promptText': 'Pula ang mansanas.',
          'promptLanguage': 'fil',
          'targetText': 'The apple is red.',
          'targetLanguage': 'en',
          'correct': ['The', 'apple', 'is', 'red'],
          'scrambled': ['red', 'is', 'The', 'apple'],
        },
        {
          'promptText': 'Mabilis ang aso.',
          'promptLanguage': 'fil',
          'targetText': 'The dog is fast.',
          'targetLanguage': 'en',
          'correct': ['The', 'dog', 'is', 'fast'],
          'scrambled': ['fast', 'The', 'dog', 'is'],
        },
        {
          'promptText': 'Uminom ng tubig.',
          'promptLanguage': 'fil',
          'targetText': 'Drink some water.',
          'targetLanguage': 'en',
          'correct': ['Drink', 'some', 'water'],
          'scrambled': ['water', 'Drink', 'some'],
        },
      ],
      'medium': [
        {
          'promptText': 'Naglalaro kami sa bakuran.',
          'promptLanguage': 'fil',
          'targetText': 'We play in the yard.',
          'targetLanguage': 'en',
          'correct': ['We', 'play', 'in', 'the', 'yard'],
          'scrambled': ['yard', 'in', 'We', 'the', 'play'],
        },
        {
          'promptText': 'Kumakain si kuya ng prutas.',
          'promptLanguage': 'fil',
          'targetText': 'Older brother eats sweet fruit.',
          'targetLanguage': 'en',
          'correct': ['Older', 'brother', 'eats', 'sweet', 'fruit'],
          'scrambled': ['fruit', 'Older', 'sweet', 'eats', 'brother'],
        },
        {
          'promptText': 'Malinis ang aming silid.',
          'promptLanguage': 'fil',
          'targetText': 'Our classroom is very clean.',
          'targetLanguage': 'en',
          'correct': ['Our', 'classroom', 'is', 'very', 'clean'],
          'scrambled': ['clean', 'Our', 'very', 'is', 'classroom'],
        },
        {
          'promptText': 'Mataas ang berdeng puno.',
          'promptLanguage': 'fil',
          'targetText': 'The green tree is tall.',
          'targetLanguage': 'en',
          'correct': ['The', 'green', 'tree', 'is', 'tall'],
          'scrambled': ['tall', 'The', 'is', 'green', 'tree'],
        },
        {
          'promptText': 'Nagtanim si lolo ng mais.',
          'promptLanguage': 'fil',
          'targetText': 'Grandfather planted fresh corn.',
          'targetLanguage': 'en',
          'correct': ['Grandfather', 'planted', 'fresh', 'corn'],
          'scrambled': ['corn', 'Grandfather', 'fresh', 'planted'],
        },
      ],
      'hard': [
        {
          'promptText': 'Masipag mag-aral ang mga mag-aaral.',
          'promptLanguage': 'fil',
          'targetText': 'The students study very hard.',
          'targetLanguage': 'en',
          'correct': ['The', 'students', 'study', 'very', 'hard'],
          'scrambled': ['hard', 'very', 'The', 'students', 'study'],
        },
        {
          'promptText': 'Tumutulong ako sa aking mga magulang.',
          'promptLanguage': 'fil',
          'targetText': 'I help my own parents.',
          'targetLanguage': 'en',
          'correct': ['I', 'help', 'my', 'own', 'parents'],
          'scrambled': ['parents', 'own', 'I', 'help', 'my'],
        },
        {
          'promptText': 'Mahalaga ang pagtatanim ng mga halaman.',
          'promptLanguage': 'fil',
          'targetText': 'Planting green plants is very important.',
          'targetLanguage': 'en',
          'correct': ['Planting', 'green', 'plants', 'is', 'very', 'important'],
          'scrambled': ['important', 'very', 'Planting', 'is', 'plants', 'green'],
        },
        {
          'promptText': 'Laging magsabi ng totoo sa lahat.',
          'promptLanguage': 'fil',
          'targetText': 'Always tell truth to everyone.',
          'targetLanguage': 'en',
          'correct': ['Always', 'tell', 'truth', 'to', 'everyone'],
          'scrambled': ['everyone', 'truth', 'Always', 'to', 'tell'],
        },
        {
          'promptText': 'Masayang sumayaw ang maliit na bata.',
          'promptLanguage': 'fil',
          'targetText': 'The little child danced happily.',
          'targetLanguage': 'en',
          'correct': ['The', 'little', 'child', 'danced', 'happily'],
          'scrambled': ['happily', 'The', 'child', 'danced', 'little'],
        },
        {
          'promptText': 'Igalang natin ang ating mga guro.',
          'promptLanguage': 'fil',
          'targetText': 'Let us respect our kind teachers.',
          'targetLanguage': 'en',
          'correct': ['Let', 'us', 'respect', 'our', 'kind', 'teachers'],
          'scrambled': ['teachers', 'kind', 'Let', 'our', 'respect', 'us'],
        },
      ],
    },
  };

  // ── Word Count & XP Helpers ───────────────────────────────────────────────

  int get _targetSentenceCount => 5;

  int get _xpPerSentence {
    switch (_sessionDifficulty.toLowerCase()) {
      case 'easy': return 10;
      case 'hard': return 25;
      case 'medium':
      default:     return 15;
    }
  }

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(duration: const Duration(seconds: 3));
    _sessionLanguage = widget.language;
    _sessionDifficulty = widget.difficulty;
    _sallyMessage = _sessionLanguage == 'fil' ? 'Ayusin ang mga salita!' : 'Arrange the words!';
    _initTts();
    _initOrResumeSession();
  }

  void _initTts() {
    _flutterTts.setStartHandler(() {
      if (mounted) setState(() => _isPlayingTts = true);
    });
    _flutterTts.setCompletionHandler(() {
      if (mounted) setState(() => _isPlayingTts = false);
    });
    _flutterTts.setErrorHandler((msg) {
      if (mounted) setState(() => _isPlayingTts = false);
    });

    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (!mounted) return;
      if (state == PlayerState.playing) {
        setState(() => _isPlayingTts = true);
      } else if (state == PlayerState.completed || state == PlayerState.stopped) {
        setState(() => _isPlayingTts = false);
      }
    });
  }

  Future<void> _speakPrompt(String text, String langCode) async {
    final cleanText = text.trim();
    if (cleanText.isEmpty) return;

    try {
      // Toggle off if already playing
      if (_isPlayingTts) {
        await _audioPlayer.stop();
        await _flutterTts.stop();
        if (mounted) setState(() => _isPlayingTts = false);
        return;
      }

      setState(() => _isPlayingTts = true);

      // 1. Check in-memory session cache
      final cacheKey = '${langCode.toLowerCase().startsWith('en') ? 'en' : 'fil'}_$cleanText';
      Uint8List? audioBytes = _audioCache[cacheKey];

      // 2. If not cached, fetch neural audio stream from backend
      if (audioBytes == null || audioBytes.isEmpty) {
        final lang = langCode.toLowerCase().startsWith('en') ? 'en' : 'fil';
        final query = '/students/sentence/tts?text=${Uri.encodeComponent(cleanText)}&language=$lang';
        final fetched = await ApiService.getRawBytes(query);
        if (fetched != null && fetched.isNotEmpty) {
          audioBytes = fetched;
          _audioCache[cacheKey] = fetched;
        }
      }

      // 3. Play via AudioPlayer with the exact neural voice
      if (audioBytes != null && audioBytes.isNotEmpty) {
        await _audioPlayer.stop();
        await _audioPlayer.play(BytesSource(audioBytes));
        return;
      }

      // 4. Offline or Network Fallback: device FlutterTts
      debugPrint('[SentenceArrangement] Falling back to device TTS for prompt');
      final ttsLang = langCode.toLowerCase().startsWith('en') ? 'en-US' : 'fil-PH';
      await _flutterTts.setLanguage(ttsLang);
      await _flutterTts.setSpeechRate(0.42);
      await _flutterTts.setPitch(1.0);
      await _flutterTts.speak(cleanText);
    } catch (e) {
      debugPrint('[SentenceArrangement] TTS error: $e');
      if (mounted) setState(() => _isPlayingTts = false);
    }
  }

  @override
  void dispose() {
    _sallyResetTimer?.cancel();
    _confettiController.dispose();
    _audioPlayer.dispose();
    _flutterTts.stop();
    super.dispose();
  }

  void _setSallyMessage(String message, {bool temporary = false}) {
    _sallyResetTimer?.cancel();
    if (!mounted) return;
    setState(() {
      _sallyMessage = message;
    });
    if (temporary) {
      _sallyResetTimer = Timer(const Duration(milliseconds: 2200), () {
        if (mounted && !_isFinished && !(_isChecked && _isCorrect)) {
          setState(() {
            final remaining = _sentences.length - _currentIndex;
            if (remaining == 1) {
              _sallyMessage = _sessionLanguage == 'fil' ? 'Huling pangungusap na!' : 'One last sentence!';
            } else {
              _sallyMessage = _getRandomIdleMessage();
            }
          });
        }
      });
    }
  }

  // ── Sally Speech Variety Pools (Filipino & English) ─────────────────────────

  String _getRandomIdleMessage() {
    final rand = Random();
    if (_sessionLanguage == 'fil') {
      const messages = [
        'Ayusin ang mga salita!',
        'Basahin at buuin!',
        'Piliin ang tamang ayos!',
        'Kayang-kaya mo \'yan!',
        'Aling salita ang una?',
        'Bumuo tayo ng pangungusap!',
      ];
      return messages[rand.nextInt(messages.length)];
    } else {
      const messages = [
        'Arrange the words!',
        'Read and build!',
        'Find the right order!',
        'You can do this!',
        'Which word comes first?',
        'Let\'s build a sentence!',
      ];
      return messages[rand.nextInt(messages.length)];
    }
  }

  String _getRandomCorrectMessage() {
    final rand = Random();
    if (_sessionLanguage == 'fil') {
      const messages = [
        'Tumpak! Ang galing mo!',
        'Swak na swak! Husay!',
        'Tama ang ayos! Ipagpatuloy!',
        'Napakagaling! Nakuha mo!',
        'Ang talas ng isip mo!',
        'Ang husay magbasa!',
      ];
      return messages[rand.nextInt(messages.length)];
    } else {
      const messages = [
        'Spot on! Great sentence!',
        'Awesome job! You got it!',
        'Perfect order! Brilliant!',
        'You nailed it! Keep going!',
        'Sentence master!',
        'Fantastic sentence building!',
      ];
      return messages[rand.nextInt(messages.length)];
    }
  }

  String _getRandomIncorrectMessage() {
    final rand = Random();
    if (_sessionLanguage == 'fil') {
      const messages = [
        'Malapit na! Subukan muli!',
        'Kaya mo \'yan, isa pa!',
        'Huwag sumuko, subukan ulit!',
        'Tingnan muli ang mga salita!',
        'Subukang basahing muli!',
      ];
      return messages[rand.nextInt(messages.length)];
    } else {
      const messages = [
        'Not quite! Try again!',
        'Almost there! Try once more!',
        'Don\'t give up, give it a shot!',
        'Check the word order carefully!',
        'Take a breath and try again!',
      ];
      return messages[rand.nextInt(messages.length)];
    }
  }

  String _getRandomTryAgainMessage() {
    final rand = Random();
    if (_sessionLanguage == 'fil') {
      const messages = [
        'Kaya mo \'yan! Ayusin muli!',
        'Bawi tayo! Piliing mabuti!',
        'Magtiwala sa sarili, kaya \'yan!',
        'Subukan muli nang dahan-dahan!',
      ];
      return messages[rand.nextInt(messages.length)];
    } else {
      const messages = [
        'You can do it! Arrange again!',
        'Take your time! You got this!',
        'Fresh try! Pick carefully!',
        'Reset! Let\'s nail it this time!',
      ];
      return messages[rand.nextInt(messages.length)];
    }
  }

  String _getRandomNextSentenceMessage() {
    final rand = Random();
    if (_sessionLanguage == 'fil') {
      const messages = [
        'Susunod na pangungusap!',
        'Tuloy-tuloy lang ang galing!',
        'Isa pa para sa bituin!',
        'Tara sa susunod!',
        'Handa na sa kasunod!',
      ];
      return messages[rand.nextInt(messages.length)];
    } else {
      const messages = [
        'Next sentence! Keep going!',
        'Keep up the momentum!',
        'Another one! You got this!',
        'Moving forward! Nice job!',
        'Ready for the next one!',
      ];
      return messages[rand.nextInt(messages.length)];
    }
  }

  String _getRandomMascotTapMessage() {
    final rand = Random();
    if (_sessionLanguage == 'fil') {
      const messages = [
        'Nandito ako para tulungan ka!',
        'Kayang-kaya mo ang bawat salita!',
        'Ang galing mong mag-aral!',
        'Bawat salita, mahalaga!',
        'Go, go, go! Kaya mo \'yan!',
        'Makinig at mag-isip nang mabuti!',
      ];
      return messages[rand.nextInt(messages.length)];
    } else {
      const messages = [
        'I\'m here to cheer you on!',
        'Every sentence makes you wiser!',
        'You have great reading skills!',
        'Word by word, you\'ve got this!',
        'Keep up the awesome effort!',
        'Think clearly and have fun!',
      ];
      return messages[rand.nextInt(messages.length)];
    }
  }

  void _onMascotTap() {
    // When the answer is done / correct, keep the praise and do not change message
    if (_isChecked && _isCorrect) return;
    Feedback.forTap(context);
    _setSallyMessage(_getRandomMascotTapMessage(), temporary: true);
  }

  /// Encouraging, motivating compliment and subtitle tailored to how well the student performed
  Map<String, String> _getCelebrationFeedback(int accuracy) {
    final rand = Random();

    if (accuracy == 100) {
      const compliments = [
        'Awesome job!',
        'Sentence master!',
        'Outstanding!',
        'You nailed it!',
        'Super star!',
        'Brilliant work!',
        'Incredible!',
      ];
      const subtitles = [
        'You formed every sentence on the first try! Incredible grammar mastery!',
        'A flawless construction! You arranged all sentences perfectly!',
        '100% accuracy! Your sentence building skills are top-notch!',
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
        'You mastered almost every sentence! Keep up the great work!',
        'Great accuracy! You are becoming a confident sentence builder!',
        'Solid performance! You are learning word order and grammar fast!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    } else if (accuracy >= 60) {
      const compliments = [
        'Good progress!',
        'Nice perseverance!',
        'Keep it up!',
        'Getting stronger!',
        'Step by step!',
        'Proud of your effort!',
      ];
      const subtitles = [
        'Every rearranged word helps build your grammar instincts! Well done!',
        'You pushed through and finished all the sentences! Good job!',
        'Steady progress! Keep practicing to master sentence patterns!',
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
        'Mistakes help us understand sentence order! Try once more to master these!',
        'Great perseverance! Practice again and watch your score soar!',
        'You completed the sentences! Try again to achieve an even higher score!',
      ];
      return {
        'compliment': compliments[rand.nextInt(compliments.length)],
        'subtitle': subtitles[rand.nextInt(subtitles.length)],
      };
    }
  }

  // ── Session Init & Persistence ─────────────────────────────────────────────

  Future<void> _initOrResumeSession() async {
    final saved = await ActivityProgressService.getProgress('sentence', widget.language);

    final rawList = (saved != null && saved['sentences'] is List && (saved['sentences'] as List).isNotEmpty)
        ? saved['sentences'] as List
        : (saved != null && saved['words'] is List && (saved['words'] as List).isNotEmpty
            ? saved['words'] as List
            : null);

    if (saved != null && rawList != null && rawList.isNotEmpty) {
      try {
        final savedLanguage = saved['language']?.toString() ?? widget.language;
        final isLangMatch = (savedLanguage.toLowerCase().startsWith('en') == widget.language.toLowerCase().startsWith('en'));

        if (isLangMatch) {
          final rawSentences = rawList.map<Map<String, dynamic>>((e) {
            final m = Map<String, dynamic>.from(e as Map);
            if (m['correct'] is List) {
              m['correct'] = (m['correct'] as List).map((w) => w.toString()).toList();
            }
            if (m['scrambled'] is List) {
              m['scrambled'] = (m['scrambled'] as List).map((w) => w.toString()).toList();
            }
            // Ensure promptText is always populated even from legacy or stale saved items
            if ((m['promptText'] == null || m['promptText'].toString().trim().isEmpty)) {
              m['promptText'] = m['translation']?.toString() ?? m['prompt']?.toString() ?? '';
            }
            if ((m['targetText'] == null || m['targetText'].toString().trim().isEmpty)) {
              m['targetText'] = m['fullText']?.toString() ?? m['text']?.toString() ?? '';
            }
            return m;
          }).toList();

          final savedIdx = (saved['currentIndex'] as int?) ?? 0;
          final extra = (saved['extraMetadata'] as Map?) ?? {};
          final savedScrambled = (extra['scrambledWords'] as List?)?.map((w) => w.toString()).toList();
          final savedArranged = (extra['arrangedWords'] as List?)?.map((w) => w.toString()).toList();

          if (rawSentences.isNotEmpty && savedIdx < rawSentences.length) {
            setState(() {
              _sessionId = saved['sessionId']?.toString() ?? 'sentence_${DateTime.now().millisecondsSinceEpoch}';
              _sessionDifficulty = saved['difficulty']?.toString() ?? _sessionDifficulty;
              _sessionLanguage = savedLanguage;
              _earnedXp = (saved['earnedXp'] as int?) ?? (savedIdx * _xpPerSentence);
              _mistakesCount = (extra['mistakesCount'] as int?) ?? 0;
              _sentences = rawSentences;
              _currentIndex = savedIdx;

              if (savedScrambled != null && savedArranged != null && (savedScrambled.isNotEmpty || savedArranged.isNotEmpty)) {
                _scrambledWords = savedScrambled;
                _arrangedWords = savedArranged;
                _isChecked = (extra['isChecked'] as bool?) ?? false;
                _isCorrect = (extra['isCorrect'] as bool?) ?? false;
              } else {
                _scrambledWords = List<String>.from(_sentences[_currentIndex]['scrambled']);
                _arrangedWords = [];
                _isChecked = false;
                _isCorrect = false;
              }

              if (_isChecked && _isCorrect) {
                _sallyMessage = _getRandomCorrectMessage();
              } else {
                _sallyMessage = _sessionLanguage == 'fil'
                    ? 'Ayusin ang mga salita!'
                    : 'Arrange the words!';
              }
            });

            return;
          }
        }
      } catch (e) {
        debugPrint('[SentenceArrangement] Error restoring session: $e');
      }
    }

    _setupFreshSession();
  }

  Future<void> _setupFreshSession() async {
    _sessionId = 'sentence_${DateTime.now().millisecondsSinceEpoch}';
    _mistakesCount = 0;
    _currentIndex = 0;
    _earnedXp = 0;

    setState(() => _isLoading = true);

    List<Map<String, dynamic>> items = [];

    // 1. Fetch from live backend sentence bank
    try {
      final res = await ApiService.get(
        '/students/sentence/items?language=$_sessionLanguage&difficulty=$_sessionDifficulty&limit=$_targetSentenceCount',
      );

      if (res.success && res.data != null && res.data['sentences'] is List) {
        final list = res.data['sentences'] as List;
        if (list.isNotEmpty) {
          items = list.map<Map<String, dynamic>>((s) {
            return {
              'promptText': s['promptText']?.toString() ?? s['translation']?.toString() ?? '',
              'promptLanguage': s['promptLanguage']?.toString() ?? (_sessionLanguage == 'fil' ? 'en' : 'fil'),
              'targetText': s['targetText']?.toString() ?? s['fullText']?.toString() ?? '',
              'targetLanguage': s['targetLanguage']?.toString() ?? _sessionLanguage,
              'fullText': s['fullText']?.toString() ?? '',
              'correct': (s['correctWords'] as List).map((w) => w.toString()).toList(),
              'scrambled': (s['scrambledWords'] as List).map((w) => w.toString()).toList(),
            };
          }).toList();
        }
      }
    } catch (e) {
      debugPrint('[SentenceArrangement] Backend fetch notice: $e');
    }

    // 2. Offline Fallback if backend returned empty or network unavailable
    if (items.length < _targetSentenceCount) {
      final langKey = _sessionLanguage.toLowerCase().startsWith('en') ? 'en' : 'fil';
      final langPool = _offlinePool[langKey] ?? _offlinePool['fil']!;
      final diffPool = langPool[_sessionDifficulty.toLowerCase()] ?? langPool['medium']!;

      final shuffled = List<Map<String, dynamic>>.from(diffPool)..shuffle(Random());
      items = shuffled.take(_targetSentenceCount).map((s) {
        return {
          'promptText': s['promptText'] ?? '',
          'promptLanguage': s['promptLanguage'] ?? (langKey == 'fil' ? 'en' : 'fil'),
          'targetText': s['targetText'] ?? '',
          'targetLanguage': s['targetLanguage'] ?? langKey,
          'correct': List<String>.from(s['correct']),
          'scrambled': List<String>.from(s['scrambled']),
        };
      }).toList();
    }

    _confettiController.stop();

    if (!mounted) return;
    setState(() {
      _sentences = items;
      _currentIndex = 0;
      _scrambledWords = items.isNotEmpty ? List<String>.from(items[0]['scrambled']) : [];
      _arrangedWords = [];
      _isChecked = false;
      _isCorrect = false;
      _isFinished = false;
      _isLoading = false;
      _finalAccuracy = 100;
      _celebrationMessage = 'Awesome job!';
      _celebrationSubtitle = 'Great sentence building!';
      _sallyMessage = 'Arrange the words!';
    });

    _sallyResetTimer?.cancel();
    _persistCurrentProgress();
  }

  Future<void> _persistCurrentProgress() async {
    if (_sentences.isEmpty) return;

    await ActivityProgressService.saveProgress(
      activityType: 'sentence',
      currentIndex: _currentIndex,
      totalItems: _sentences.length,
      words: _sentences,
      earnedXp: _earnedXp,
      sessionId: _sessionId,
      language: _sessionLanguage,
      difficulty: _sessionDifficulty,
      extraMetadata: {
        'sentences': _sentences,
        'mistakesCount': _mistakesCount,
        'scrambledWords': _scrambledWords,
        'arrangedWords': _arrangedWords,
        'isChecked': _isChecked,
        'isCorrect': _isCorrect,
      },
    );
  }

  Future<void> _syncActivityCompletion() async {
    final totalSentences = _sentences.length;
    final int score = _mistakesCount == 0
        ? 100
        : ((totalSentences / (totalSentences + _mistakesCount)) * 100).round().clamp(50, 99);

    final itemsDetail = _sentences.map((s) {
      return {
        'promptText': s['promptText']?.toString() ?? '',
        'targetText': s['targetText']?.toString() ?? '',
        'correctWords': s['correct'] is List ? s['correct'] : [],
      };
    }).toList();

    try {
      debugPrint('[SentenceArrangement] Submitting attempt: session=$_sessionId, diff=$_sessionDifficulty, lang=$_sessionLanguage, total=$totalSentences, score=$score, xp=$_earnedXp');
      final res = await ApiService.post('/students/sentence/attempt', {
        'sessionId': _sessionId,
        'language': _sessionLanguage,
        'difficulty': _sessionDifficulty,
        'totalSentences': totalSentences,
        'mistakesCount': _mistakesCount,
        'score': score,
        'xpEarned': _earnedXp,
        'itemsDetail': itemsDetail,
      });

      debugPrint('[SentenceArrangement] Attempt response: success=${res.success}, data=${res.data}');

      if (res.success && res.data != null && res.data['newBadgeUnlocked'] == true && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: const [
                Icon(Icons.stars_rounded, color: Color(0xFFFBBF24)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Badge Unlocked: Sentence builder! 🛠️',
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
      debugPrint('[SentenceArrangement] Attempt submission error: $e');
    }
  }

  // ── Gameplay Actions ───────────────────────────────────────────────────────

  void _onWordTap(int index, bool isFromScrambledPool) {
    // If the answer is already checked and correct, don't allow altering
    if (_isChecked && _isCorrect) return;
    Feedback.forTap(context);

    bool shouldTriggerAdvance = false;

    setState(() {
      if (isFromScrambledPool) {
        if (_isChecked && !_isCorrect) {
          _isChecked = false;
        }
        if (index >= 0 && index < _scrambledWords.length) {
          final word = _scrambledWords.removeAt(index);
          _arrangedWords.add(word);
        }
      } else {
        if (index >= 0 && index < _arrangedWords.length) {
          final word = _arrangedWords.removeAt(index);
          _scrambledWords.add(word);
          if (_isChecked && !_isCorrect) {
            _isChecked = false;
          }
        }
      }

      // Check sentence immediately within the same frame build pass
      if (_sentences.isNotEmpty) {
        final correctList = List<String>.from(_sentences[_currentIndex]['correct']);
        if (_arrangedWords.length == correctList.length) {
          bool correct = true;
          for (int i = 0; i < correctList.length; i++) {
            final arranged = _cleanWord(_arrangedWords[i]);
            final target = _cleanWord(correctList[i]);
            if (arranged != target) {
              correct = false;
              break;
            }
          }

          _isChecked = true;
          _isCorrect = correct;
          if (!correct) {
            _mistakesCount++;
            _sallyResetTimer?.cancel();
            _sallyMessage = _getRandomIncorrectMessage();
          } else {
            shouldTriggerAdvance = true;
            _sallyResetTimer?.cancel();
            _sallyMessage = _getRandomCorrectMessage();
            _earnedXp += _xpPerSentence;
          }
        }
      }
    });

    if (shouldTriggerAdvance) {
      if (_currentIndex + 1 < _sentences.length) {
        ActivityProgressService.saveProgress(
          activityType: 'sentence',
          currentIndex: _currentIndex + 1,
          totalItems: _sentences.length,
          words: _sentences,
          earnedXp: _earnedXp,
          sessionId: _sessionId,
          language: _sessionLanguage,
          difficulty: _sessionDifficulty,
          extraMetadata: {
            'sentences': _sentences,
            'mistakesCount': _mistakesCount,
            'scrambledWords': List<String>.from(_sentences[_currentIndex + 1]['scrambled']),
            'arrangedWords': <String>[],
            'isChecked': false,
            'isCorrect': false,
          },
        );
      } else {
        ActivityProgressService.clearProgress('sentence', _sessionLanguage);
      }
    } else if (!_isCorrect) {
      if (_isChecked) {
        // If wrong, reset message after short delay
        _sallyResetTimer = Timer(const Duration(milliseconds: 2200), () {
          if (mounted && !_isFinished && !(_isChecked && _isCorrect)) {
            setState(() {
              final remaining = _sentences.length - _currentIndex;
              _sallyMessage = remaining == 1
                  ? (_sessionLanguage == 'fil' ? 'Huling pangungusap na!' : 'One last sentence!')
                  : _getRandomIdleMessage();
            });
          }
        });
      }
      _persistCurrentProgress();
    }
  }


  static String _cleanWord(String word) {
    return word.trim().toLowerCase().replaceAll(RegExp(r'^[.,!?;:]+|[.,!?;:]+$'), '');
  }

  void _tryAgain() {
    Feedback.forTap(context);
    final current = _sentences[_currentIndex];
    setState(() {
      _scrambledWords = List<String>.from(current['scrambled']);
      _arrangedWords = [];
      _isChecked = false;
      _isCorrect = false;
    });
    _setSallyMessage(_getRandomTryAgainMessage());
    _persistCurrentProgress();
  }

  void _nextSentence() {
    Feedback.forTap(context);

    if (_currentIndex + 1 < _sentences.length) {
      setState(() {
        _currentIndex++;
        _scrambledWords = List<String>.from(_sentences[_currentIndex]['scrambled']);
        _arrangedWords = [];
        _isChecked = false;
        _isCorrect = false;
      });

      _setSallyMessage(_getRandomNextSentenceMessage(), temporary: true);
      _persistCurrentProgress();
    } else {
      // Completed all sentences!
      final totalSentences = _sentences.length;
      final computedAccuracy = (_mistakesCount == 0)
          ? 100
          : ((totalSentences / (totalSentences + _mistakesCount)) * 100).round().clamp(20, 99);
      final feedback = _getCelebrationFeedback(computedAccuracy);

      setState(() {
        _finalAccuracy = computedAccuracy;
        _celebrationMessage = feedback['compliment']!;
        _celebrationSubtitle = feedback['subtitle']!;
        _isFinished = true;
      });

      _confettiController.play();
      ActivityProgressService.clearProgress('sentence', _sessionLanguage);
      _syncActivityCompletion();
    }
  }

  // ── Help Modal ─────────────────────────────────────────────────────────────

  void _showHelpModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
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
                      color: const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Iconify(
                      PhIcons.hammerBold,
                      color: Color(0xFF10B981),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'How to Play',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _buildHelpStep('1', 'Tap scrambled words from the pool to place them into the sentence slot.'),
              _buildHelpStep('2', 'If you change your mind, tap any placed word to return it to the pool.'),
              _buildHelpStep('3', 'Once all words are placed, Sally will check if your sentence makes sense!'),
              _buildHelpStep('4', 'Complete without using "Try Again" to unlock the "Sentence builder" badge!'),
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
                      borderRadius: BorderRadius.circular(14),
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

  // ── Main UI Build ──────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF1B64D8);
    const softCreamBg = Color(0xFFFCFAF7);

    final double progress = _sentences.isEmpty
        ? 0.0
        : ((_currentIndex + 1) / _sentences.length).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: softCreamBg,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final double screenHeight = constraints.maxHeight;
            final double screenWidth = constraints.maxWidth;
            final bool isTablet = screenWidth > 600;

            final double scale = (screenHeight / 780.0).clamp(0.72, 1.0);

            final double sectionHeight = 240.0 * scale;
            final double mascotHeight = 210.0 * scale;
            final double bottomPad = 50.0 * scale;

            return Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isTablet ? 540.0 : double.infinity,
                ),
                child: _isFinished
                    ? _buildCelebrationWidget(primaryBlue)
                    : Column(
                        children: [
                          // ── Top Header Navigation Bar ──────────────────────────────
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20.0, 8.0, 20.0, 0.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        'SENTENCE ARRANGEMENT',
                                        style: GoogleFonts.inter(
                                          fontSize: 13,
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

                                // Progress Bar
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

                          // ── Translation Prompt Card (Duolingo-style) ───────────
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20.0, 10.0, 20.0, 0.0),
                            child: Builder(
                              builder: (context) {
                                final currentItem = _sentences.isNotEmpty && _currentIndex < _sentences.length
                                    ? _sentences[_currentIndex]
                                    : null;
                                final promptText = currentItem?['promptText']?.toString().trim() ?? '';
                                final promptLang = currentItem?['promptLanguage'] ?? (_sessionLanguage == 'fil' ? 'en' : 'fil');

                                return Column(
                                  children: [
                                    Text(
                                      _sessionLanguage == 'fil'
                                          ? 'Ayusin ang mga salita para mabuo ang pangungusap'
                                          : 'Arrange the words to form the sentence',
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.inter(
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    GestureDetector(
                                      onTap: () => _speakPrompt(promptText, promptLang),
                                      child: Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
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
                                            // Word + volume icon right next to text (like pronunciation challenge)
                                            RichText(
                                              textAlign: TextAlign.center,
                                              text: TextSpan(
                                                text: promptText,
                                                style: GoogleFonts.inter(
                                                  fontSize: 21,
                                                  fontWeight: FontWeight.w800,
                                                  color: const Color(0xFF0F172A),
                                                  letterSpacing: -0.3,
                                                ),
                                                children: [
                                                  WidgetSpan(
                                                    alignment: PlaceholderAlignment.middle,
                                                    child: Padding(
                                                      padding: const EdgeInsets.only(left: 6.0),
                                                      child: Icon(
                                                        Icons.volume_up_rounded,
                                                        color: _isPlayingTts
                                                            ? const Color(0xFF1B64D8)
                                                            : const Color(0xFF64748B),
                                                        size: 23,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(height: 5),
                                            Text(
                                              _sessionLanguage == 'fil'
                                                  ? 'Isalin sa Filipino gamit ang mga salita sa ibaba'
                                                  : 'Translate to English using the words below',
                                              textAlign: TextAlign.center,
                                              style: GoogleFonts.inter(
                                                fontSize: 12,
                                                fontStyle: FontStyle.italic,
                                                fontWeight: FontWeight.w500,
                                                color: const Color(0xFF64748B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ],
                                );
                              },
                            ),
                          ),
                          const SizedBox(height: 10),

                          // ── Game Arena ───────────────────────────────────────────
                          Expanded(
                            child: _isLoading
                                ? const Center(
                                    child: CircularProgressIndicator(color: primaryBlue),
                                  )
                                : Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 20.0),
                                    child: Column(
                                      children: [
                                        Expanded(
                                          child: SingleChildScrollView(
                                            physics: const BouncingScrollPhysics(),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.stretch,
                                              children: [
                                                const SizedBox(height: 6),
                                                CustomPaint(
                                                  foregroundPainter: _DashedRoundedBorderPainter(
                                                    color: _isChecked
                                                        ? (_isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                                                        : const Color(0xFF94A3B8),
                                                    strokeWidth: 1.8,
                                                    radius: 18.0,
                                                    dashLength: 7.0,
                                                    dashGap: 4.5,
                                                  ),
                                                  child: Container(
                                                    constraints: const BoxConstraints(minHeight: 82),
                                                    decoration: BoxDecoration(
                                                      color: _arrangedWords.isEmpty ? const Color(0xFFF8FAFC) : Colors.white,
                                                      borderRadius: BorderRadius.circular(18),
                                                    ),
                                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                                    child: _arrangedWords.isEmpty
                                                        ? Center(
                                                            child: Text(
                                                              _sessionLanguage == 'fil'
                                                                  ? 'I-tap ang mga salita sa ibaba'
                                                                  : 'Tap the words below',
                                                              textAlign: TextAlign.center,
                                                              style: GoogleFonts.inter(
                                                                fontSize: 13.5,
                                                                fontWeight: FontWeight.w600,
                                                                color: const Color(0xFF94A3B8),
                                                              ),
                                                            ),
                                                          )
                                                        : Wrap(
                                                            spacing: 8,
                                                            runSpacing: 10,
                                                            alignment: WrapAlignment.center,
                                                            children: _arrangedWords.asMap().entries.map((entry) {
                                                              return _buildWordTile(
                                                                word: entry.value,
                                                                onTap: () => _onWordTap(entry.key, false),
                                                                bgColor: _isChecked
                                                                    ? (_isCorrect ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2))
                                                                    : Colors.white,
                                                                borderColor: _isChecked
                                                                    ? (_isCorrect ? const Color(0xFF10B981) : const Color(0xFFEF4444))
                                                                    : const Color(0xFF1E3A5F),
                                                                textColor: _isChecked
                                                                    ? (_isCorrect ? const Color(0xFF047857) : const Color(0xFFB91C1C))
                                                                    : const Color(0xFF0F172A),
                                                              );
                                                            }).toList(),
                                                          ),
                                                   ),
                                                 ),
                                                const SizedBox(height: 16),

                                                // Scrambled Words Pool Row
                                                Wrap(
                                                  spacing: 8,
                                                  runSpacing: 10,
                                                  alignment: WrapAlignment.center,
                                                  children: _scrambledWords.asMap().entries.map((entry) {
                                                    return _buildWordTile(
                                                      word: entry.value,
                                                      onTap: () => _onWordTap(entry.key, true),
                                                      bgColor: Colors.white,
                                                      borderColor: const Color(0xFF1E3A5F),
                                                      textColor: const Color(0xFF0F172A),
                                                    );
                                                  }).toList(),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),

                                        // Mascot & Speech Bubble Section at Bottom (Lifted higher)
                                        _buildMascotSection(
                                          sectionHeight: sectionHeight,
                                          mascotHeight: mascotHeight,
                                          bottomPadding: 8.0 * scale,
                                          scale: scale,
                                        ),

                                        // Persistent bottom button container (prevents mascot shifting)
                                        Container(
                                          width: double.infinity,
                                          height: 52,
                                          margin: EdgeInsets.only(bottom: (bottomPad * 0.5).clamp(10.0, 24.0)),
                                          child: _isChecked
                                              ? (!_isCorrect
                                                  ? ElevatedButton.icon(
                                                      onPressed: _tryAgain,
                                                      icon: const Icon(Icons.refresh_rounded, size: 20, color: Colors.white),
                                                      label: Text(
                                                        _sessionLanguage == 'fil' ? 'Subukan Muli' : 'Try Again',
                                                        style: GoogleFonts.inter(
                                                          fontSize: 16,
                                                          fontWeight: FontWeight.w800,
                                                          color: Colors.white,
                                                        ),
                                                      ),
                                                      style: ElevatedButton.styleFrom(
                                                        backgroundColor: const Color(0xFFEF4444),
                                                        foregroundColor: Colors.white,
                                                        elevation: 1.5,
                                                        shadowColor: const Color(0xFFEF4444).withValues(alpha: 0.3),
                                                        shape: RoundedRectangleBorder(
                                                          borderRadius: BorderRadius.circular(16),
                                                        ),
                                                      ),
                                                    )
                                                  : ElevatedButton(
                                                      onPressed: _nextSentence,
                                                      style: ElevatedButton.styleFrom(
                                                        backgroundColor: const Color(0xFF10B981),
                                                        foregroundColor: Colors.white,
                                                        elevation: 0,
                                                        shape: RoundedRectangleBorder(
                                                          borderRadius: BorderRadius.circular(16),
                                                        ),
                                                      ),
                                                      child: Text(
                                                        _currentIndex + 1 < _sentences.length ? 'Next Sentence' : 'Finish',
                                                        style: GoogleFonts.inter(
                                                          fontSize: 16,
                                                          fontWeight: FontWeight.w800,
                                                        ),
                                                      ),
                                                    ))
                                              : const SizedBox.shrink(),
                                        ),
                                      ],
                                    ),
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

  // ── Word Tile Widget with Tactile Drop Shadow & Crisp Touch Response ──────

  Widget _buildWordTile({
    required String word,
    required VoidCallback onTap,
    required Color bgColor,
    required Color borderColor,
    required Color textColor,
  }) {
    final bool isPeriod = word.trim() == '.';
    final double horizontalPadding = isPeriod ? 18.0 : 16.0;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        Feedback.forTap(context);
        onTap();
      },
      child: Container(
        height: 48,
        padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: borderColor,
            width: 1.8,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1E3A5F).withValues(alpha: 0.14),
              offset: const Offset(0, 3.5),
              blurRadius: 4,
              spreadRadius: 0,
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              offset: const Offset(0, 1),
              blurRadius: 2,
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            ConstrainedBox(
              constraints: BoxConstraints(minWidth: isPeriod ? 12 : 18),
              child: Text(
                word,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: isPeriod ? 22 : 16.5,
                  fontWeight: FontWeight.w800,
                  color: textColor,
                  height: isPeriod ? 0.9 : 1.2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Mascot & Speech Bubble Section ─────────────────────────────────────────

  Widget _buildMascotSection({
    required double sectionHeight,
    required double mascotHeight,
    required double bottomPadding,
    required double scale,
  }) {
    final double textFontSize = (15.0 * scale).clamp(13.0, 15.0);
    final double bubbleTop = (-26.0 * scale).clamp(-32.0, -18.0);

    return Padding(
      padding: EdgeInsets.only(bottom: bottomPadding),
      child: GestureDetector(
        onTap: _onMascotTap,
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          height: sectionHeight,
          width: double.infinity,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // 1. Sally Mascot in the Middle (Nerdy by default, Instant switch to Happy when correct)
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: Center(
                  child: Image.asset(
                    (_isChecked && _isCorrect)
                        ? 'assets/mascot/sally_happy.webp'
                        : 'assets/mascot/sally_nerdy.webp',
                    height: mascotHeight,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => SizedBox(
                      height: mascotHeight,
                      width: mascotHeight,
                    ),
                  ),
                ),
              ),

              // 2. Speech Bubble on Top of Sally in the Middle
              Positioned(
                top: bubbleTop,
                left: 0,
                right: 0,
                child: Center(
                  child: _buildSpeechBubble(
                    fontSize: textFontSize,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSpeechBubble({
    required double fontSize,
  }) {
    return CustomPaint(
      painter: const _SpeechBubblePainter(
        color: Colors.white,
        borderColor: Color(0xFF0F172A),
        borderWidth: 2.2,
        radius: 18.0,
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.5),
        child: Text(
          _sallyMessage,
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
            color: const Color(0xFF0F172A),
            letterSpacing: -0.2,
          ),
        ),
      ),
    );
  }

  // ── Celebration Screen (Parity with Pronunciation & Vocabulary) ────────────

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
                    painter: const _SpeechBubblePainter(
                      color: Colors.white,
                      borderColor: Color(0xFF0F172A),
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
                  'Sentence Arrangement Complete!',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 22,
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

class _SpeechBubblePainter extends CustomPainter {
  final Color color;
  final Color borderColor;
  final double borderWidth;
  final double radius;

  const _SpeechBubblePainter({
    this.color = Colors.white,
    this.borderColor = const Color(0xFF0F172A),
    this.borderWidth = 2.2,
    this.radius = 18.0,
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

    final path = Path()
      ..moveTo(r, 0)
      ..lineTo(w - r, 0)
      ..arcToPoint(Offset(w, r), radius: Radius.circular(r))
      ..lineTo(w, h - r)
      ..arcToPoint(Offset(w - r, h), radius: Radius.circular(r))
      ..lineTo(centerX + tailHalfWidth, h)
      ..lineTo(centerX, h + tailHeight)
      ..lineTo(centerX - tailHalfWidth, h)
      ..lineTo(r, h)
      ..arcToPoint(Offset(0, h - r), radius: Radius.circular(r))
      ..lineTo(0, r)
      ..arcToPoint(Offset(r, 0), radius: Radius.circular(r))
      ..close();

    // Subtle drop shadow
    canvas.drawPath(
      path.shift(const Offset(0, 2)),
      Paint()
        ..color = Colors.black.withValues(alpha: 0.05)
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
  bool shouldRepaint(covariant _SpeechBubblePainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.borderColor != borderColor ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.radius != radius;
  }
}

// ── Custom Painter for Broken/Dashed Rounded Border ──────────────────────────

class _DashedRoundedBorderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double radius;
  final double dashLength;
  final double dashGap;

  const _DashedRoundedBorderPainter({
    required this.color,
    this.strokeWidth = 1.8,
    this.radius = 18.0,
    this.dashLength = 7.0,
    this.dashGap = 4.5,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final RRect rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        strokeWidth / 2,
        strokeWidth / 2,
        size.width - strokeWidth,
        size.height - strokeWidth,
      ),
      Radius.circular(radius - strokeWidth / 2),
    );

    final Path path = Path()..addRRect(rrect);
    final Paint paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    for (final metric in path.computeMetrics()) {
      double distance = 0.0;
      while (distance < metric.length) {
        final double length = (distance + dashLength < metric.length)
            ? dashLength
            : metric.length - distance;
        final Path extractPath = metric.extractPath(distance, distance + length);
        canvas.drawPath(extractPath, paint);
        distance += dashLength + dashGap;
      }
    }
  }

  @override
  bool? hitTest(Offset position) => false;

  @override
  bool shouldRepaint(covariant _DashedRoundedBorderPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.radius != radius ||
        oldDelegate.dashLength != dashLength ||
        oldDelegate.dashGap != dashGap;
  }
}
