const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// High-fidelity natural neural voices
const VOICES = {
  fil: 'fil-PH-BlessicaNeural', // Warm, clear, natural Filipino female voice
  'fil-male': 'fil-PH-AngeloNeural',
  en: 'en-US-JennyNeural', // High-fidelity natural English female voice
  'en-ph': 'en-PH-RosaNeural',
  'en-male': 'en-US-GuyNeural',
};

// Cache folder for synthesized audio to ensure instant replay
const CACHE_DIR = path.join(__dirname, '../../public/tts_cache');
if (!fs.existsSync(CACHE_DIR)) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  } catch (err) {
    console.warn('[ttsService] Could not create CACHE_DIR:', err.message);
  }
}

/**
 * Synthesizes text into natural neural speech MP3
 * @param {string} text Story or passage text
 * @param {string} lang 'fil' or 'en'
 * @param {string} rate Speed adjustment (e.g. '-6%', '0%')
 * @returns {Promise<{filePath: string, cached: boolean, urlPath: string}>}
 */
async function synthesizeTextToAudio(text, lang = 'fil', rate = '-6%') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Text to synthesize is required.');
  }

  const cleanText = text.trim();
  const langKey = (lang || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
  const voice = VOICES[langKey] || VOICES.fil;

  // Create deterministic hash for file caching
  const hash = crypto
    .createHash('md5')
    .update(`${voice}_${rate}_${cleanText}`)
    .digest('hex');
  const cacheFilePath = path.join(CACHE_DIR, `${hash}.mp3`);

  if (fs.existsSync(cacheFilePath) && fs.statSync(cacheFilePath).size > 0) {
    return {
      filePath: cacheFilePath,
      cached: true,
      urlPath: `/tts_cache/${hash}.mp3`,
    };
  }

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, {});

  const { audioStream } = tts.toStream(cleanText, { rate: rate, pitch: '+0Hz' });

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(cacheFilePath);
    audioStream.pipe(writeStream);
    audioStream.on('error', (err) => {
      try {
        writeStream.destroy();
        if (fs.existsSync(cacheFilePath)) fs.unlinkSync(cacheFilePath);
      } catch (_) {}
      reject(err);
    });
    writeStream.on('finish', resolve);
    writeStream.on('error', (err) => {
      try {
        if (fs.existsSync(cacheFilePath)) fs.unlinkSync(cacheFilePath);
      } catch (_) {}
      reject(err);
    });
  });

  return {
    filePath: cacheFilePath,
    cached: false,
    urlPath: `/tts_cache/${hash}.mp3`,
  };
}

module.exports = {
  synthesizeTextToAudio,
  VOICES,
};
