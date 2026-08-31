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
 * @returns {Promise<{audioUrl: string, waveform: number[], cached: boolean}>}
 */
async function synthesizeTextToAudio(text, lang = 'fil', rate = '-8%', passageId = null) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Text to synthesize is required.');
  }

  const cleanText = text.trim();
  const langKey = (lang || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
  const voice = VOICES[langKey] || VOICES.fil;

  // Book Reading Cadence:
  // Converts flat robot reading into expressive human cadence with breath pauses after sentences
  const bookReadingText = cleanText
    .replace(/([.!?])\s+/g, '$1\n\n')
    .replace(/,\s*/g, ', ');

  // Create deterministic hash for Cloudinary caching
  const hash = crypto
    .createHash('md5')
    .update(`${voice}_${rate}_${bookReadingText}`)
    .digest('hex');

  // 1. Instant Cloudinary Cache Check
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    const existingResource = await cloudinary.api.resource(`salintinig/tts/tts_${hash}`, {
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
            folder: 'salintinig/tts',
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
