const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

/**
 * SalinTinig Speech-To-Text (STT) Engine Service
 * Powered exclusively by Groq Cloud API (Whisper Large v3)
 * 
 * Features:
 * - Passage vocabulary prompt conditioning (eliminates hallucinations on story terms/names)
 * - Verbatim disfluency prompt (preserves uhm, ah, false starts, and stutters)
 * - Word-level timestamp extraction for pause and hesitation analysis
 */

/**
 * Transcribe audio file to text using Groq Whisper Large v3
 * @param {string} audioFilePath - Path to local audio file (.wav, .m4a, .mp3, etc.)
 * @param {string} [language='tl'] - 'tl' for Tagalog/Filipino, 'en' for English
 * @param {string} [originalFilename=''] - Original filename from req.file.originalname
 * @param {string} [passageText=''] - Optional reference passage text to condition Whisper's vocabulary
 * @param {boolean} [isPronunciation=false] - When true, optimizes for single-word pronunciation accuracy without filler bias
 * @returns {Promise<{text: string, words: Array<{word: string, start: number, end: number}>, segments: Array}>}
 */
async function transcribeAudio(audioFilePath, language = 'tl', originalFilename = '', passageText = '', isPronunciation = false) {
  if (!audioFilePath || !fs.existsSync(audioFilePath)) {
    console.warn('[STT Service Notice]: Audio file does not exist at path:', audioFilePath);
    return null;
  }

  const groqKey = (process.env.GROQ_API_KEY || '').replace(/['"]/g, '').trim();
  if (!groqKey || groqKey === 'gsk_your_groq_api_key_here') {
    console.warn('[STT Service Notice]: GROQ_API_KEY is not set or contains default placeholder in backend .env');
    return null;
  }

  const langCode = (language || 'tl').toLowerCase().startsWith('en') ? 'en' : 'tl';

  let verbatimPrompt = '';
  if (isPronunciation) {
    // Dedicated prompt for isolated vocabulary word pronunciation:
    // Avoids "uhm/ah" hallucinations and prevents autocorrecting mispronounced phonemes
    verbatimPrompt = langCode === 'tl'
      ? 'Pakinggan at isulat ang eksaktong binigkas na salita sa wikang Tagalog. Isulat ang literal na narinig na baybay at tunog nang walang pagtatama o pagwawasto sa maling bigkas.'
      : 'Carefully transcribe the exact single English vocabulary word spoken. Write the literal acoustic sounds heard without autocorrecting or fixing mispronounced letters.';
  } else {
    // Reading passage mode (Phil-IRI oral reading assessments)
    let baseTokens = '';
    if (passageText && typeof passageText === 'string') {
      const rawTokens = passageText
        .replace(/[^\w\sñÑáéíóú-]/gi, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3);

      // Strip common inflection suffixes (-ed, -ing, -s, -es, -ly) to create uninflected base prompts
      const bases = rawTokens.map(w => {
        const low = w.toLowerCase();
        if (low.endsWith('ed') && low.length > 4) return low.slice(0, -2);
        if (low.endsWith('ing') && low.length > 5) return low.slice(0, -3);
        if (low.endsWith('es') && low.length > 4) return low.slice(0, -2);
        if (low.endsWith('s') && !low.endsWith('ss') && low.length > 3) return low.slice(0, -1);
        return low;
      });

      const uniqueBases = Array.from(new Set(bases)).slice(0, 20).join(', ');
      if (uniqueBases) {
        baseTokens = ` Raw acoustic vocabulary: ${uniqueBases}.`;
      }
    }

    verbatimPrompt = langCode === 'tl'
      ? `Uhm... ah... um... eh... Isulat ang eksaktong binigkas nang walang pagwawasto. HUWAG itatama ang maling bigkas o tinanggal na panlapi. Bawal alisin ang mga inulit na salita tulad ng "bata bata" o uhm, ah, eh.${baseTokens}`
      : `Uhm... ah... um... er... Transcribe exact acoustic speech without grammatical autocorrection. If the speaker drops a suffix (like praise instead of praised, trap instead of trapped, bottle instead of bottles), write the exact uninflected word heard. Preserve all repeated words like "every saturday he every saturday he".${baseTokens}`;
  }

  try {
    console.log(`[STT Service]: Transcribing audio with Groq Whisper Large v3 (${langCode}) in verbatim mode...`);
    const groq = new Groq({ apiKey: groqKey });

    // Ensure multer extensionless temp files have an audio extension hint for Groq API
    let tempPathWithExt = null;
    let filePathToRead = audioFilePath;
    const parsedPath = path.parse(audioFilePath);
    if (!parsedPath.ext) {
      const origExt = originalFilename ? path.extname(originalFilename) : '';
      const ext = origExt || '.m4a';
      tempPathWithExt = `${audioFilePath}${ext}`;
      try {
        fs.copyFileSync(audioFilePath, tempPathWithExt);
        filePathToRead = tempPathWithExt;
      } catch (copyErr) {
        console.warn('[STT Service Notice]: Failed to copy file with ext:', copyErr.message);
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
      temperature: 0.0,
    });

    // Clean up temporary copied file if created
    if (tempPathWithExt && fs.existsSync(tempPathWithExt)) {
      try {
        fs.unlinkSync(tempPathWithExt);
      } catch (_) {}
    }

    const text = transcription?.text?.trim() || '';
    const words = Array.isArray(transcription?.words) ? transcription.words : [];
    const segments = Array.isArray(transcription?.segments) ? transcription.segments : [];

    console.log(`[STT Service]: Groq transcription completed successfully. Transcribed text: "${text.substring(0, 120)}..." (${words.length} timestamped words)`);

    return {
      text,
      words,
      segments,
    };
  } catch (groqErr) {
    console.error('[STT Service Error - Groq]:', groqErr.message);
    return null;
  }
}

module.exports = {
  transcribeAudio,
};
