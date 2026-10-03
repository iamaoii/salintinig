const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

/**
 * SalinTinig Speech-To-Text (STT) Engine Service
 * Powered by Groq Cloud API (Whisper Large v3)
 *
 * Design Goal for Oral Reading Assessment:
 *   The purpose of STT in Phil-IRI is to FAITHFULLY capture what the student
 *   actually said — including mispronunciations, dropped suffixes, swapped words,
 *   repetitions, and insertions. We do NOT want the AI to silently "fix" what
 *   the student said, because those "fixes" hide the very miscues we need to detect.
 *
 * What we disable:
 *   - Autocorrection / grammatical normalization
 *   - Smart punctuation and sentence reformatting
 *   - Language-model word substitution ("predicted" words vs heard words)
 *
 * What we preserve:
 *   - Exact phonetic output (what was acoustically heard)
 *   - Repeated words ("bata bata", "ang ang")
 *   - Partial/broken words ("na-" "nag-" false starts)
 *   - Vocal fillers (uhm, ah, eh) for disfluency analysis
 *   - Dropped suffixes and inflections
 *   - Word-level timestamps for pace/hesitation analysis
 */

/**
 * Transcribe audio file using Groq Whisper Large v3 in verbatim RAW mode.
 *
 * @param {string}  audioFilePath    - Path to local audio file (.wav, .m4a, .mp3, etc.)
 * @param {string}  [language='tl'] - 'tl' for Tagalog/Filipino, 'en' for English
 * @param {string}  [originalFilename=''] - Original filename (for extension detection)
 * @param {string}  [passageText='']    - Reference passage text (vocabulary conditioning only)
 * @param {boolean} [isPronunciation=false] - When true: single-word pronunciation mode
 * @returns {Promise<{text: string, words: Array<{word, start, end}>, segments: Array}>}
 */
async function transcribeAudio(audioFilePath, language = 'tl', originalFilename = '', passageText = '', isPronunciation = false) {
  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    console.warn('[STT]: Audio file does not exist:', audioFilePath);
    return null;
  }

  const groqKey = (process.env.GROQ_API_KEY || '').replace(/['"]/g, '').trim();
  if (!groqKey || groqKey === 'gsk_your_groq_api_key_here') {
    console.warn('[STT]: GROQ_API_KEY is not set.');
    return null;
  }

  const langCode = (language || 'tl').toLowerCase().startsWith('en') ? 'en' : 'tl';

  // ─────────────────────────────────────────────────────────────────────────
  // PROMPT DESIGN RATIONALE
  //
  // Whisper's "prompt" parameter acts as a vocabulary/style hint — it biases
  // Whisper toward specific spellings and transcription behavior.
  //
  // For Phil-IRI oral reading we craft the prompt to:
  //   1. Tell Whisper this is a child reading aloud (not conversational speech)
  //   2. Instruct it to output EXACTLY what was heard, not what was "meant"
  //   3. Seed it with key passage vocabulary to avoid hallucinating alternative
  //      spellings for unfamiliar Filipino/English story words.
  //   4. Explicitly forbid merging repeated words, correcting mispronunciations,
  //      or normalizing grammar — all of which would destroy miscue evidence.
  //
  // temperature: 0.0 = fully deterministic, maximally literal transcription.
  // ─────────────────────────────────────────────────────────────────────────

  let verbatimPrompt = '';

  if (isPronunciation) {
    // Single-word pronunciation check mode
    verbatimPrompt = langCode === 'tl'
      ? 'Isulat ang eksaktong tunog na narinig nang walang pagtatama. Literal na baybay ng narinig.'
      : 'Write the exact sounds heard as-is. Do not autocorrect or fix the pronunciation.';
  } else {
    // ── Oral Reading Assessment Mode ──
    // Build a vocabulary seed from the passage to help Whisper recognize
    // story-specific words (names, places, uncommon Filipino terms).
    let vocabSeed = '';
    if (passageText && typeof passageText === 'string') {
      const tokens = passageText
        .replace(/[^\w\sñÑáéíóú-]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3);
      const unique = Array.from(new Set(tokens.map(w => w.toLowerCase()))).slice(0, 25);
      if (unique.length > 0) vocabSeed = ` Story words: ${unique.join(', ')}.`;
    }

    // Core verbatim instruction
    // We deliberately start the prompt with disfluency examples so Whisper
    // does not strip them from the output.
    verbatimPrompt = langCode === 'tl'
      ? `Uhm... bata bata... ng ng... ah... Isulat ang EKSAKTO at LITERAL na narinig nang walang anumang pagtatama o pagbabago. Huwag pagsamahin ang mga inulit na salita. Huwag itama ang maling bigkas. Huwag mag-ayos ng gramatika. Isulat kung ano talaga ang narinig.${vocabSeed}`
      : `Uhm... the the... and and... er... Transcribe EXACTLY and LITERALLY what was heard without any correction or normalization. Do not merge repeated words. Do not fix mispronunciations. Do not correct grammar. Write only what was actually said.${vocabSeed}`;
  }

  try {
    console.log(`[STT]: Transcribing audio (Groq Whisper Large v3, lang=${langCode}, verbatim=true)...`);
    const groq = new Groq({ apiKey: groqKey });

    // Handle extensionless multer temp files
    let tempPathWithExt = null;
    let filePathToRead  = audioFilePath;
    const parsedPath    = path.parse(audioFilePath);
    if (!parsedPath.ext) {
      const origExt = originalFilename ? path.extname(originalFilename) : '';
      const ext     = origExt || '.m4a';
      tempPathWithExt = `${audioFilePath}${ext}`;
      try {
        fs.copyFileSync(audioFilePath, tempPathWithExt);
        filePathToRead = tempPathWithExt;
      } catch (copyErr) {
        console.warn('[STT]: Could not copy file with extension hint:', copyErr.message);
        filePathToRead = audioFilePath;
      }
    }

    const fileStream = fs.createReadStream(filePathToRead);

    const transcription = await groq.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-large-v3',
      language: langCode,
      prompt: verbatimPrompt,
      response_format: 'verbose_json',
      temperature: 0.0,           // Deterministic — no sampling variation
      timestamp_granularities: ['word'],  // Get per-word timestamps for miscue analysis
    });

    // Clean up temp file
    if (tempPathWithExt && fs.existsSync(tempPathWithExt)) {
      try { fs.unlinkSync(tempPathWithExt); } catch (_) {}
    }

    const text     = transcription?.text?.trim() || '';
    const words    = Array.isArray(transcription?.words) ? transcription.words : [];
    const segments = Array.isArray(transcription?.segments) ? transcription.segments : [];

    console.log(`[STT]: Done. Text="${text.substring(0, 100)}..." (${words.length} word timestamps)`);

    return { text, words, segments };

  } catch (groqErr) {
    console.error('[STT Error]:', groqErr.message);
    return null;
  }
}

module.exports = { transcribeAudio };
