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

/**
 * Algorithmic phonetic normalization for isolated syllables and short words.
 * Prevents Edge-TTS from spelling out letters or mispronouncing Tagalog/English vowel-consonant combinations.
 *
 * @param {string} text
 * @param {string} langKey 'fil' or 'en'
 * @returns {string} normalized phonetics
 */
function normalizePhoneticText(text, langKey = 'fil') {
  let cleanText = (text || '').trim();
  if (cleanText.length <= 4 && !cleanText.includes(' ')) {
    const lower = cleanText.toLowerCase();
    if (langKey === 'fil') {
      // 1. Single Filipino Vowels
      if (lower === 'a') return 'ah';
      if (lower === 'e') return 'eh';
      if (lower === 'i') return 'ih';
      if (lower === 'o') return 'oh';
      if (lower === 'u') return 'oo';

      // 2. Digraph 'ng' combinations
      if (lower === 'nga') return 'ngah';
      if (lower === 'nge') return 'ngeh';
      if (lower === 'ngi') return 'ngih';
      if (lower === 'ngo') return 'ngoh';
      if (lower === 'ngu') return 'ngoo';

      // 3. Consonant + 'a' open syllables
      if (/^[b-df-hj-np-tv-z]a$/i.test(lower)) return `${lower}h`;
      // 4. Consonant + 'e' open syllables
      if (/^[b-df-hj-np-tv-z]e$/i.test(lower)) return `${lower}h`;
      // 5. Consonant + 'i' open syllables -> 'ee'
      if (/^([b-df-hj-np-tv-z])i$/i.test(lower)) return lower.replace(/i$/i, 'ee');
      // 6. Consonant + 'o' open syllables
      if (/^[b-df-hj-np-tv-z]o$/i.test(lower)) return `${lower}h`;
      // 7. Consonant + 'u' open syllables -> 'oo'
      if (/^([b-df-hj-np-tv-z])u$/i.test(lower)) return lower.replace(/u$/i, 'oo');

      // 8. Filipino VC syllables
      if (lower === 'ar') return 'ahr';
      if (lower === 'er') return 'ehr';
      if (lower === 'ir') return 'eer';
      if (lower === 'or') return 'ohr';
      if (lower === 'ur') return 'oor';
    } else {
      const EN_EXCEPTIONS = {
        'com': 'kahm', 'cate': 'kate', 'tion': 'shun', 'sion': 'zhun',
        'ment': 'ment', 'ness': 'ness', 'ing': 'ing', 'ful': 'fool',
        'ble': 'bull', 'cle': 'kull', 'dle': 'dull', 'fle': 'full',
        'gle': 'gull', 'ple': 'pull', 'tle': 'tull', 'zle': 'zull',
        'mu': 'myoo', 'ca': 'kuh', 'co': 'koh', 'cu': 'kyoo',
        'cy': 'see', 'ce': 'seh', 'ci': 'see',
      };

      if (lower === 'a') return 'ah';
      if (lower === 'e') return 'eh';
      if (lower === 'i') return 'ih';
      if (lower === 'o') return 'oh';
      if (lower === 'u') return 'ooh';

      if (EN_EXCEPTIONS[lower]) return EN_EXCEPTIONS[lower];

      if (lower === 'ar') return 'are';
      if (lower === 'er') return 'err';
      if (lower === 'ir') return 'err';
      if (lower === 'or') return 'ohr';
      if (lower === 'ur') return 'err';

      // Common VC
      if (lower === 'al') return 'ahl';
      if (lower === 'el') return 'ell';
      if (lower === 'il') return 'ill';
      if (lower === 'ol') return 'ohl';
      if (lower === 'ul') return 'ull';
      if (lower === 'an') return 'ahn';
      if (lower === 'en') return 'ehn';
      if (lower === 'in') return 'inn';
      if (lower === 'on') return 'ohn';
      if (lower === 'un') return 'uhn';
      if (lower === 'am') return 'ahm';
      if (lower === 'em') return 'ehm';
      if (lower === 'im') return 'imm';
      if (lower === 'om') return 'ohm';
      if (lower === 'um') return 'uhm';
      if (lower === 'ap') return 'app';
      if (lower === 'ep') return 'epp';
      if (lower === 'ip') return 'ipp';
      if (lower === 'op') return 'opp';
      if (lower === 'up') return 'upp';
      if (lower === 'at') return 'aht';
      if (lower === 'et') return 'eht';
      if (lower === 'it') return 'itt';
      if (lower === 'ot') return 'oht';
      if (lower === 'ut') return 'uht';
      if (lower === 'ad') return 'add';
      if (lower === 'ed') return 'edd';
      if (lower === 'id') return 'idd';
      if (lower === 'od') return 'odd';
      if (lower === 'ud') return 'udd';
      if (lower === 'as') return 'ahs';
      if (lower === 'es') return 'ehs';
      if (lower === 'is') return 'iss';
      if (lower === 'os') return 'ohs';
      if (lower === 'us') return 'uhs';

      // Consonant + Vowel
      if (/^([b-df-hj-np-tv-z])i$/i.test(lower)) return lower.replace(/i$/i, 'ee');
      if (/^([b-df-hj-np-tv-z])e$/i.test(lower)) return lower.replace(/e$/i, 'eh');
      if (/^([b-df-hj-np-tv-z])a$/i.test(lower)) return lower.replace(/a$/i, 'ah');
      if (/^([b-df-hj-np-tv-z])o$/i.test(lower)) return lower.replace(/o$/i, 'oh');
      if (/^([b-df-hj-np-tv-z])u$/i.test(lower)) return lower.replace(/u$/i, 'oo');
      if (/^([b-df-hj-np-tv-z])y$/i.test(lower)) return lower.replace(/y$/i, 'ee');
    }
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
  const cleanText = normalizePhoneticText(text, langKey);
  const voice = VOICES[langKey] || VOICES.fil;

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {});

  const { audioStream } = tts.toStream(cleanText, { rate: rate, pitch: '+1Hz' });
  return audioStream;
}

module.exports = {
  synthesizeTextToAudio,
  streamSpeechDirect,
  VOICES,
};

