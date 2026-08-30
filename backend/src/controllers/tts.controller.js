const { synthesizeTextToAudio, VOICES } = require('../services/ttsService.js');
const fs = require('fs');

/**
 * Controller for Neural Text-to-Speech synthesis
 */
async function synthesize(req, res) {
  try {
    const text = req.query.text || (req.body && req.body.text);
    const language = req.query.language || (req.body && req.body.language) || 'fil';
    const rate = req.query.rate || (req.body && req.body.rate) || '-6%';
    const stream = req.query.stream === 'true' || (req.body && req.body.stream === true);

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Text to synthesize is required.',
      });
    }

    const result = await synthesizeTextToAudio(text, language, rate);

    if (stream) {
      if (fs.existsSync(result.filePath)) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return fs.createReadStream(result.filePath).pipe(res);
      }
    }

    // Return the audio URL path
    return res.json({
      success: true,
      audioUrl: result.urlPath,
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
  getVoices,
};
