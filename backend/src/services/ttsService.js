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

  let cleanText = text.trim();
  const langKey = (lang || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
  const voice = VOICES[langKey] || VOICES.fil;

  // Syllable & Phonetic Normalization for Isolated Syllables / Single Letters:
  // Prevents Edge-TTS from reading isolated letters like 'a' as English "ey" instead of Filipino "ah"
  if (cleanText.length <= 4 && !cleanText.includes(' ')) {
    const lower = cleanText.toLowerCase();
    if (langKey === 'fil') {
      // General Algorithmic Filipino (Tagalog) Syllable Phonetic Engine
      // Prevents Edge-TTS from spelling out letters or mispronouncing Tagalog vowels/consonants

      // 1. Single Filipino Vowels
      if (lower === 'a') cleanText = 'ah';
      else if (lower === 'e') cleanText = 'eh';
      else if (lower === 'i') cleanText = 'ih';
      else if (lower === 'o') cleanText = 'oh';
      else if (lower === 'u') cleanText = 'oo';

      // 2. Digraph 'ng' combinations (e.g., 'nga', 'nge', 'ngi', 'ngo', 'ngu')
      else if (lower === 'nga') cleanText = 'ngah';
      else if (lower === 'nge') cleanText = 'ngeh';
      else if (lower === 'ngi') cleanText = 'ngih';
      else if (lower === 'ngo') cleanText = 'ngoh';
      else if (lower === 'ngu') cleanText = 'ngoo';

      // 3. Consonant + 'a' open syllables (ba, ka, da, ga, la, ma, na, pa, ra, sa, ta, wa, ya) -> add 'h' for clean Tagalog open "ah"
      else if (/^[b-df-hj-np-tv-z]a$/i.test(lower)) {
        cleanText = `${lower}h`;
      }
      // 4. Consonant + 'e' open syllables (be, ke, de, ge, le, me, ne, pe, re, se, te, we, ye) -> add 'h' for clean "eh"
      else if (/^[b-df-hj-np-tv-z]e$/i.test(lower)) {
        cleanText = `${lower}h`;
      }
      // 5. Consonant + 'i' open syllables (bi, ki, di, gi, li, mi, ni, pi, ri, si, ti, wi, yi) -> replace 'i' with 'ee' sound
      else if (/^([b-df-hj-np-tv-z])i$/i.test(lower)) {
        cleanText = lower.replace(/i$/i, 'ee');
      }
      // 6. Consonant + 'o' open syllables (bo, ko, do, go, lo, mo, no, po, ro, so, to, wo, yo) -> add 'h' for clean "oh"
      else if (/^[b-df-hj-np-tv-z]o$/i.test(lower)) {
        cleanText = `${lower}h`;
      }
      // 7. Consonant + 'u' open syllables (bu, ku, du, gu, lu, mu, nu, pu, ru, su, tu, wu, yu) -> replace 'u' with 'oo'
      else if (/^([b-df-hj-np-tv-z])u$/i.test(lower)) {
        cleanText = lower.replace(/u$/i, 'oo');
      }

      // 8. Filipino VC syllables (e.g., 'ar' -> 'ahr', 'at' -> 'aht', 'ak' -> 'ahk', 'ag' -> 'ahg', 'am' -> 'ahm', 'an' -> 'ahn')
      else if (lower === 'ar') cleanText = 'ahr';
      else if (lower === 'er') cleanText = 'ehr';
      else if (lower === 'ir') cleanText = 'eer';
      else if (lower === 'or') cleanText = 'ohr';
      else if (lower === 'ur') cleanText = 'oor';
    } else {
      // General Algorithmic English Syllable Phonetic Engine
      // Prevents Edge-TTS from spelling out any short isolated syllable (e.g., "n i", "b u", "m e", "c a")
      const EN_EXCEPTIONS = {
        'com': 'kahm',
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
        'tle': 'tull',
        'zle': 'zull',
        'mu': 'myoo',
        'ca': 'kuh',
        'co': 'koh',
        'cu': 'kyoo',
        'cy': 'see',
        'ce': 'seh',
        'ci': 'see',
      };

      // 1. Single English Vowels
      if (lower === 'a') cleanText = 'ah';
      else if (lower === 'e') cleanText = 'eh';
      else if (lower === 'i') cleanText = 'ih';
      else if (lower === 'o') cleanText = 'oh';
      else if (lower === 'u') cleanText = 'ooh';

      // 2. Known specific multi-letter syllables / irregular phonetics
      else if (EN_EXCEPTIONS[lower]) {
        cleanText = EN_EXCEPTIONS[lower];
      }

      // 3. R-Controlled Vowel Syllables (e.g. ar -> are (sounds like /ɑːr/), er -> err, ir -> err, or -> ohr, ur -> err)
      // Edge TTS spells out isolated "ar" and "ahr", but "are" produces the exact clean English /ɑːr/ syllable sound
      else if (lower === 'ar') cleanText = 'are';
      else if (lower === 'er') cleanText = 'err';
      else if (lower === 'ir') cleanText = 'err';
      else if (lower === 'or') cleanText = 'ohr';
      else if (lower === 'ur') cleanText = 'err';

      // 4. Common Vowel + Consonant (VC) isolated syllables
      // Prevents TTS from spelling out 2-letter VC chunks like "al", "en", "op", "in", "it"
      else if (lower === 'al') cleanText = 'ahl';
      else if (lower === 'el') cleanText = 'ell';
      else if (lower === 'il') cleanText = 'ill';
      else if (lower === 'ol') cleanText = 'ohl';
      else if (lower === 'ul') cleanText = 'ull';
      else if (lower === 'an') cleanText = 'ahn';
      else if (lower === 'en') cleanText = 'ehn';
      else if (lower === 'in') cleanText = 'inn';
      else if (lower === 'on') cleanText = 'ohn';
      else if (lower === 'un') cleanText = 'uhn';
      else if (lower === 'am') cleanText = 'ahm';
      else if (lower === 'em') cleanText = 'ehm';
      else if (lower === 'im') cleanText = 'imm';
      else if (lower === 'om') cleanText = 'ohm';
      else if (lower === 'um') cleanText = 'uhm';
      else if (lower === 'ap') cleanText = 'app';
      else if (lower === 'ep') cleanText = 'epp';
      else if (lower === 'ip') cleanText = 'ipp';
      else if (lower === 'op') cleanText = 'opp';
      else if (lower === 'up') cleanText = 'upp';
      else if (lower === 'at') cleanText = 'aht';
      else if (lower === 'et') cleanText = 'eht';
      else if (lower === 'it') cleanText = 'itt';
      else if (lower === 'ot') cleanText = 'oht';
      else if (lower === 'ut') cleanText = 'uht';
      else if (lower === 'ad') cleanText = 'add';
      else if (lower === 'ed') cleanText = 'edd';
      else if (lower === 'id') cleanText = 'idd';
      else if (lower === 'od') cleanText = 'odd';
      else if (lower === 'ud') cleanText = 'udd';
      else if (lower === 'as') cleanText = 'ahs';
      else if (lower === 'es') cleanText = 'ehs';
      else if (lower === 'is') cleanText = 'iss';
      else if (lower === 'os') cleanText = 'ohs';
      else if (lower === 'us') cleanText = 'uhs';

      // 5. Algorithmic pattern matching for ANY Consonant + Vowel combinations (e.g. ni, bi, ma, ge, lu, ro, etc.)
      // Consonant + 'i' -> 'ee' sound (e.g. ni -> nee, ti -> tee, ri -> ree, bi -> bee, fi -> fee, ki -> kee, etc.)
      else if (/^([b-df-hj-np-tv-z])i$/i.test(lower)) {
        cleanText = lower.replace(/i$/i, 'ee');
      }
      // Consonant + 'e' -> 'eh' sound (e.g. ne -> neh, be -> beh, me -> meh, fe -> feh)
      else if (/^([b-df-hj-np-tv-z])e$/i.test(lower)) {
        cleanText = lower.replace(/e$/i, 'eh');
      }
      // Consonant + 'a' -> 'ah' sound (e.g. na -> nah, ba -> bah, ma -> mah, pa -> pah)
      else if (/^([b-df-hj-np-tv-z])a$/i.test(lower)) {
        cleanText = lower.replace(/a$/i, 'ah');
      }
      // Consonant + 'o' -> 'oh' sound (e.g. no -> noh, bo -> boh, mo -> moh, po -> poh)
      else if (/^([b-df-hj-np-tv-z])o$/i.test(lower)) {
        cleanText = lower.replace(/o$/i, 'oh');
      }
      // Consonant + 'u' -> 'oo' sound (e.g. nu -> noo, bu -> boo, ru -> roo, du -> doo)
      else if (/^([b-df-hj-np-tv-z])u$/i.test(lower)) {
        cleanText = lower.replace(/u$/i, 'oo');
      }
      // Consonant + 'y' -> 'ee' sound (e.g. ny -> nee, by -> bee, ty -> tee, ly -> lee)
      else if (/^([b-df-hj-np-tv-z])y$/i.test(lower)) {
        cleanText = lower.replace(/y$/i, 'ee');
      }
    }
  }

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

module.exports = {
  synthesizeTextToAudio,
  VOICES,
};
