const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { execFile } = require('child_process');
const { cloudinary } = require('../config/cloudinary.js');

// Ensure latest environment variables are loaded
require('dotenv').config({ path: path.join(__dirname, '../../.env'), override: true });

// High-fidelity natural neural voices (Best Native Voices)
const VOICES = {
  fil: 'fil-PH-BlessicaNeural', // The #1 best native Filipino/Tagalog teacher voice
  'fil-male': 'fil-PH-AngeloNeural', // Native Filipino male educator
  en: 'en-PH-RosaNeural', // Philippine English educator voice
  'en-male': 'en-PH-JamesNeural', // Philippine English male educator
};

// System temp directory for transient audio before Cloudinary upload
const TEMP_DIR = os.tmpdir();

// In-memory cache for deterministic waveform peaks
const waveformCache = new Map();

/**
 * Extracts real RMS acoustic amplitude peaks from audio file (50ms resolution)
 * @param {string} filePath - Path to audio file
 * @returns {Promise<number[]>} Array of normalized RMS amplitude values (0.0 to 1.0)
 */
function extractWaveformPeaks(filePath) {
  return new Promise((resolve) => {
    execFile(
      'ffmpeg',
      ['-y', '-i', filePath, '-f', 's16le', '-ac', '1', '-ar', '8000', '-'],
      { encoding: 'buffer', maxBuffer: 15 * 1024 * 1024 },
      (err, stdout) => {
        if (err || !stdout) return resolve([]);
        const pcm = stdout;
        const samplesPerFrame = Math.floor((8000 * 50) / 1000); // 50ms per frame
        const peaks = [];
        let maxPeak = 0;

        for (let i = 0; i < pcm.length; i += samplesPerFrame * 2) {
          let sum = 0;
          let count = 0;
          for (let j = 0; j < samplesPerFrame * 2 && i + j + 1 < pcm.length; j += 2) {
            const s = pcm.readInt16LE(i + j);
            sum += s * s;
            count++;
          }
          const rms = count > 0 ? Math.sqrt(sum / count) : 0;
          peaks.push(rms);
          if (rms > maxPeak) maxPeak = rms;
        }

        const normalized = peaks.map((p) => {
          if (maxPeak === 0) return 0;
          const val = p / maxPeak;
          return val < 0.04 ? 0 : Number(val.toFixed(3)); // Below 4% is true silence
        });

        resolve(normalized);
      }
    );
  });
}

// Vowel → natural spoken sound mapping for phonetic normalization
const VOWEL_SOUNDS = {
  fil: { a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo' },
  en:  { a: 'ah', e: 'eh', i: 'ih', o: 'oh', u: 'uh' },
};

// Hard-coded phonetic exceptions: DB phonetic hints → TTS-friendly spelling
// Prevents Edge TTS from spelling out letters or mispronouncing syllables
const PHONETIC_EXCEPTIONS = {
  // English phonetic sounds stored in DB
  'myoo': 'mew',
  'byoo': 'bew',
  'cyoo': 'kew',
  'kyoo': 'kew',
  'pyoo': 'pew',
  'tyoo': 'tew',
  'dyoo': 'dew',
  'nyoo': 'new',
  'kuhm': 'com',
  'kuhv': 'cuv',
  'muhs': 'muss',
  'vahl': 'vol',
  'sull': 'sul',
  'uhnt': 'unt',
  'muhnt': 'ment',
  'ih-zuhm': 'ism',
  'fear': 'fear',
  'shun': 'shun',
  'brayt': 'brayt',
  'kwayk': 'kwayk',
  'dunce': 'dunce',
  'uns': 'uns',
  'trih': 'tree',
  'sih': 'see',
  'tih': 'tee',
  'dih': 'dee',
  'kih': 'kee',
  'nih': 'nee',
  'bih': 'bee',
  'lih': 'lee',
  'mih': 'mee',
  'pih': 'pee',
  'rih': 'ree',
  'gih': 'gee',
  'hih': 'hee',
  'vih': 'vee',
  'fih': 'fee',
  'jih': 'jee',
  'tee': 'tee',
  'nee': 'nee',
  'see': 'see',
  'mee': 'mee',
  'dee': 'dee',
  'bee': 'bee',
  'fee': 'fee',
  'gee': 'gee',
  'hee': 'hee',
  'lee': 'lee',
};

// English suffix/syllable exception lookup
const EN_EXCEPTIONS = {
  'mu': 'mew',
  'nu': 'noo',
  'lu': 'loo',
  'su': 'soo',
  'tu': 'too',
  'du': 'doo',
  'bu': 'boo',
  'pu': 'poo',
  'ca': 'kuh',
  'co': 'koh',
  'cu': 'kew',
  'cy': 'see',
  'ce': 'seh',
  'ci': 'see',
  'ty': 'tee',
  'ni': 'nee',
  'si': 'see',
  'di': 'dee',
  'ki': 'kee',
  'li': 'lee',
  'mi': 'mee',
  'pi': 'pee',
  'ri': 'ree',
  'gi': 'gee',
  'ti': 'tee',
  'bi': 'bee',
  'fi': 'fee',
  'hi': 'hee',
  'vi': 'vee',
  'beau': 'bew',
  'com': 'com',
  'cate': 'kate',
  'tion': 'shun',
  'sion': 'zhun',
  'ment': 'ment',
  'ness': 'ness',
  'ing': 'ing',
  'ful': 'fool',
  'ble': 'bull',
  'cle': 'kull',
  'dle': 'dull',
  'fle': 'full',
  'gle': 'gull',
  'ple': 'pull',
  'tle': 'tull',
  'zle': 'zull',
};

/**
 * Normalizes isolated syllables and phonetic hints for natural TTS output.
 * Ensures Edge TTS pronounces syllables accurately without spelling them out.
 *
 * @param {string} text The syllable or word to speak
 * @param {string} langKey 'fil' or 'en'
 * @returns {string} normalized text safe for Edge TTS
 */
function normalizePhoneticText(text, langKey = 'fil') {
  const cleanText = (text || '').trim();
  if (!cleanText) return cleanText;

  const lower = cleanText.toLowerCase();

  // Multi-word phrases or long sentences: leave untouched
  if (cleanText.includes(' ') || cleanText.length > 12) {
    return cleanText;
  }

  // ── FILIPINO / TAGALOG ──
  if (langKey === 'fil') {
    // 1. If DB stored phonetic hint with trailing 'h' (e.g. 'nih' → 'ni', 'mah' → 'ma', 'tah' → 'ta')
    const filHMatch = lower.match(/^([b-df-hj-np-tv-z]{1,2}|ng)([aeiou])h$/i);
    if (filHMatch) {
      return `${filHMatch[1]}${filHMatch[2]}`;
    }

    // 2. If DB stored phonetic hint with double vowel (e.g. 'too' → 'tu', 'moo' → 'mu', 'boo' → 'bu', 'koo' → 'ku')
    const filDblMatch = lower.match(/^([b-df-hj-np-tv-z]{1,2}|ng)(ee|oo)$/i);
    if (filDblMatch) {
      return `${filDblMatch[1]}${filDblMatch[2] === 'ee' ? 'i' : 'u'}`;
    }

    // 3. Isolated pure vowels in Filipino
    if (/^[aeiou]$/i.test(lower)) {
      return lower;
    }

    // 4. Native Tagalog syllables (e.g. 'ni', 'ma', 'ta', 'pin', 'bang') are read natively by Blessica
    return lower;
  }

  // ── ENGLISH ──
  if (langKey === 'en') {
    // 1. Exact DB phonetic exceptions (e.g. 'myoo' → 'mew', 'nih' → 'nee')
    if (PHONETIC_EXCEPTIONS[lower]) return PHONETIC_EXCEPTIONS[lower];
    if (EN_EXCEPTIONS[lower]) return EN_EXCEPTIONS[lower];

    // 2. C + 'yoo' pattern (e.g. 'myoo' → 'mew', 'byoo' → 'bew', 'pyoo' → 'pew')
    const yooMatch = lower.match(/^([b-df-hj-np-tv-z]{1,2})yoo$/i);
    if (yooMatch) {
      const c = yooMatch[1];
      if (c === 'm') return 'mew';
      if (c === 'b') return 'bew';
      if (c === 'f') return 'few';
      if (c === 'd') return 'dew';
      if (c === 'n') return 'new';
      if (c === 'c' || c === 'k') return 'kew';
      if (c === 'p') return 'pew';
      if (c === 't') return 'tew';
      if (c === 'v') return 'view';
      if (c === 'h') return 'hue';
      return `${c}ew`;
    }

    // 3. C + 'ih' pattern (e.g. 'nih' → 'nee', 'sih' → 'see', 'tih' → 'tee')
    const ihMatch = lower.match(/^([b-df-hj-np-tv-z]{1,2})ih$/i);
    if (ihMatch) {
      return `${ihMatch[1]}ee`;
    }

    // 4. Open CV syllable with 'i' (e.g. 'ni' → 'nee', 'ti' → 'tee', 'si' → 'see')
    const ciMatch = lower.match(/^([b-df-hj-np-tv-z]{1,2})i$/i);
    if (ciMatch) {
      return `${ciMatch[1]}ee`;
    }

    // 5. Single vowels in English
    if (lower === 'a') return 'ay';
    if (lower === 'e') return 'ee';
    if (lower === 'i') return 'eye';
    if (lower === 'o') return 'oh';
    if (lower === 'u') return 'you';
  }

  return cleanText;
}

/**
 * Synthesizes text into natural neural speech MP3 and uploads to Cloudinary CDN
 * @param {string} text Story or passage text
 * @param {string} lang 'fil' or 'en'
 * @param {string} rate Speed adjustment (e.g. '-8%', '0%')
 * @param {string|number|null} passageId Optional database passageId
 * @param {string} folder Cloudinary folder path (e.g. 'salintinig/tts', 'salintinig/pronunciation')
 * @returns {Promise<{audioUrl: string, waveform: number[], cached: boolean}>}
 */
async function synthesizeTextToAudio(text, lang = 'fil', rate = '-8%', passageId = null, folder = 'salintinig/tts') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Text to synthesize is required.');
  }

  const langKey = (lang || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
  const voice = VOICES[langKey] || VOICES.fil;
  const cleanText = normalizePhoneticText(text, langKey);

  // Book Reading Cadence:
  // Converts flat robot reading into expressive human cadence with breath pauses after sentences
  const bookReadingText = cleanText
    .replace(/([.!?])\s+/g, '$1\n\n')
    .replace(/,\s*/g, ', ');

  // Create deterministic hash for Cloudinary caching
  const hash = crypto
    .createHash('md5')

    .update(`${voice}_${rate}_${folder}_${bookReadingText}`)
    .digest('hex');

  // 1. Instant Cloudinary Cache Check
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const uploadFolder = folder || 'salintinig/tts';

  try {
    const existingResource = await cloudinary.api.resource(`${uploadFolder}/tts_${hash}`, {
      resource_type: 'video',
    });
    if (existingResource && existingResource.secure_url) {
      console.log(`⚡ [TTS Cloudinary] Instant cache hit: ${existingResource.secure_url}`);

      let cachedWaveform = waveformCache.get(hash);
      if (!cachedWaveform) {
        // Extract waveform from Cloudinary stream if not in memory
        cachedWaveform = await extractWaveformPeaks(existingResource.secure_url);
        waveformCache.set(hash, cachedWaveform);
      }
      return {
        audioUrl: existingResource.secure_url,
        waveform: cachedWaveform,
        cached: true,
      };
    }
  } catch (_) {
    // Audio not in Cloudinary yet, proceed with synthesis
  }

  const tempFilePath = path.join(TEMP_DIR, `salintinig_tts_${hash}.mp3`);
  const masteredFilePath = path.join(TEMP_DIR, `salintinig_mastered_${hash}.mp3`);
  let fileToUpload = tempFilePath;

  // 2. Synthesize with natural neural voice
  console.log(`📖 [Edge TTS] Synthesizing ${langKey === 'en' ? 'Philippine English (Rosa)' : 'Filipino Tagalog (Blessica)'}...`);
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {});

  const { audioStream } = tts.toStream(bookReadingText, { rate: rate, pitch: '+1Hz' });

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(tempFilePath);
    audioStream.pipe(writeStream);
    audioStream.on('error', (err) => {
      try {
        writeStream.destroy();
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch (_) {}
      reject(err);
    });
    writeStream.on('finish', resolve);
    writeStream.on('error', (err) => {
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      } catch (_) {}
      reject(err);
    });
  });

  // 3. Acoustic Vocal Mastering
  try {
    const filter =
      'equalizer=f=220:t=q:w=1.2:g=3.0,equalizer=f=4200:t=q:w=1.0:g=-3.0,aecho=0.9:0.7:22:0.08,acompressor=threshold=-16dB:ratio=2.5:attack=15:release=120:makeup=2.5,loudnorm=I=-14:TP=-1.5:LRA=10';

    await new Promise((resolve) => {
      execFile(
        'ffmpeg',
        ['-y', '-i', tempFilePath, '-af', filter, '-c:a', 'libmp3lame', '-b:a', '128k', masteredFilePath],
        (err) => {
          if (!err && fs.existsSync(masteredFilePath) && fs.statSync(masteredFilePath).size > 0) {
            fileToUpload = masteredFilePath;
          }
          resolve();
        }
      );
    });
  } catch (mErr) {
    console.warn('[ttsService] Acoustic mastering notice:', mErr.message);
  }

  // 4. Extract Real Acoustic RMS Waveform Peaks (50ms resolution)
  const waveformPeaks = await extractWaveformPeaks(fileToUpload);
  waveformCache.set(hash, waveformPeaks);

  // 5. Upload to Cloudinary CDN
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          fileToUpload,
          {
            resource_type: 'video', // Audio uses video resource_type in Cloudinary
            folder: uploadFolder,
            public_id: `tts_${hash}`,
            format: 'mp3',
            overwrite: true,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });

      const secureUrl = uploadResult.secure_url;
      console.log(`☁️ [TTS Cloudinary] Uploaded mastered neural audio: ${secureUrl}`);

      // 6. 🧹 Cleanup local temporary MP3 files immediately (0 MB local disk storage)
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(masteredFilePath)) fs.unlinkSync(masteredFilePath);
      } catch (_) {}

      return {
        audioUrl: secureUrl,
        waveform: waveformPeaks,
        cached: false,
      };
    } catch (uploadError) {
      try {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(masteredFilePath)) fs.unlinkSync(masteredFilePath);
      } catch (_) {}
      throw uploadError;
    }
  }

  throw new Error('Cloudinary credentials are required for permanent audio hosting.');
}

/**
 * Streams neural TTS audio directly to a writable stream (e.g. Express res)
 * Purely on-the-fly streaming: DOES NOT write to database, Cloudinary, or disk.
 * @param {string} text Prompt or sentence to speak
 * @param {string} lang 'fil' or 'en'
 * @param {string} rate Speed adjustment (e.g. '-4%', '0%')
 * @returns {Promise<stream.Readable>} audioStream
 */
async function streamSpeechDirect(text, lang = 'fil', rate = '-4%') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Text to synthesize is required.');
  }

  const langKey = (lang || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
  const trimmed = text.trim();
  const voice = VOICES[langKey] || VOICES.fil;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {});

  const normalizedText = normalizePhoneticText(trimmed, langKey);
  console.log(`[TTS Speech] "${trimmed}" (${langKey}) → spoken as: "${normalizedText}"`);

  const { audioStream } = tts.toStream(normalizedText, { rate: rate, pitch: '+1Hz' });
  return audioStream;
}

module.exports = {
  synthesizeTextToAudio,
  streamSpeechDirect,
  VOICES,
};

