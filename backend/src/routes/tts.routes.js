const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/tts.controller.js');

// GET or POST /api/tts/synthesize
router.get('/synthesize', ttsController.synthesize);
router.post('/synthesize', ttsController.synthesize);

// GET /api/tts/voices
router.get('/voices', ttsController.getVoices);

module.exports = router;
