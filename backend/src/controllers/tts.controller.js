const { synthesizeTextToAudio, streamSpeechDirect, VOICES, audioBufferCache } = require('../services/ttsService.js');

/**
 * Controller for Neural Text-to-Speech synthesis
 */
async function synthesize(req, res) {
  try {
    const text = req.query.text || (req.body && req.body.text);
    const language = req.query.language || (req.body && req.body.language) || 'fil';
    const rate = req.query.rate || (req.body && req.body.rate) || '-6%';
    const passageId = req.query.passageId || (req.body && req.body.passageId) || null;
    const folder = req.query.folder || (req.body && req.body.folder) || 'salintinig/tts';

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text to synthesize is required.',
      });
    }

    let targetFolder = folder;
    if (folder.startsWith('salintinig/pronunciation/syllables') && !folder.endsWith('/eng') && !folder.endsWith('/fil')) {
      targetFolder = language.toLowerCase().startsWith('en') ? 'salintinig/pronunciation/syllables/eng' : 'salintinig/pronunciation/syllables/fil';
    } else if (folder.startsWith('salintinig/pronunciation/words') && !folder.endsWith('/eng') && !folder.endsWith('/fil')) {
      targetFolder = language.toLowerCase().startsWith('en') ? 'salintinig/pronunciation/words/eng' : 'salintinig/pronunciation/words/fil';
    }

    const result = await synthesizeTextToAudio(text, language, rate, passageId, targetFolder);

    // Return the audio URL, base64 memory buffer, and real RMS acoustic waveform data
    return res.json({
      success: true,
      audioUrl: result.audioUrl,
      audioBase64: result.audioBase64,
      waveform: result.waveform || [],
      cached: result.cached,
    });
  } catch (error) {
    console.error('[ttsController] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to synthesize speech.',
      details: error.message,
    });
  }
}

/**
 * Streams temporary audio directly from in-memory cache or on-the-fly synthesis
 */
async function streamAudio(req, res) {
  try {
    const hash = req.query.hash;
    const text = req.query.text;
    const language = req.query.language || 'fil';

    if (hash && audioBufferCache.has(hash)) {
      const buffer = audioBufferCache.get(hash);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.end(buffer);
    }

    if (text && typeof text === 'string' && text.trim()) {
      const langKey = (language || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
      res.setHeader('Content-Type', 'audio/mpeg');
      const audioStream = await streamSpeechDirect(text.trim(), langKey);
      return audioStream.pipe(res);
    }

    return res.status(404).json({
      success: false,
      error: 'Audio stream not found or expired.',
    });
  } catch (error) {
    console.error('[ttsController] streamAudio Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stream audio.',
      details: error.message,
    });
  }
}

/**
 * Get available voices
 */
function getVoices(req, res) {
  return res.json({
    success: true,
    voices: VOICES,
  });
}

module.exports = {
  synthesize,
  streamAudio,
  getVoices,
};
