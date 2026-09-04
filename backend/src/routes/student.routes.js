const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const { verifyToken } = require('../middleware/auth.middleware.js');

const upload = multer({
  dest: path.join(os.tmpdir(), 'salintinig_uploads'),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max
});

const {
  getStudents,
  getStudentByLrn,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  deleteStudent,
  importStudentsCSV,
  submitPhilIriAssessment,
  getPhilIriPassages,
  assignPhilIriToStudent,
  getStudentActiveAssignment,
  completeStoryProgress,
  completeActivityProgress,
  submitStudentOralAudio,
  denoiseTestAudio,
  updateAssessmentStartProgress,
  getStudentAssessmentResults,
  getPronunciationItems,
  getPronunciationAudio,
  getPronunciationSyllableAudios,
  submitPronunciationAttempt,
  verifyPronunciationAudio,
  ingestPronunciationWord,
} = require('../controllers/student.controller.js');

// Routes for Student Records management & assessment submissions
router.get('/', getStudents);
router.get('/assessment/passages', getPhilIriPassages);
router.get('/assessment/my-assignment', verifyToken, getStudentActiveAssignment);
router.get('/assessment/my-results', verifyToken, getStudentAssessmentResults);
router.post('/assessment/assign', assignPhilIriToStudent);
router.post('/assessment/start-progress', updateAssessmentStartProgress);
router.post('/assessment/submit', submitPhilIriAssessment);
router.post('/assessment/submit-oral-audio', upload.single('audio'), submitStudentOralAudio);
router.post('/assessment/denoise-test-audio', upload.single('audio'), denoiseTestAudio);
router.post('/story/complete', completeStoryProgress);
router.post('/activity/complete', completeActivityProgress);

// ── Pronunciation Challenge ──────────────────────────────────────────────────
// GET  /api/student/pronunciation/items?language=fil&limit=10
router.get('/pronunciation/items', verifyToken, getPronunciationItems);
// GET  /api/student/pronunciation/audio/:itemId  (cache-first Edge-TTS)
router.get('/pronunciation/audio/:itemId', verifyToken, getPronunciationAudio);
// GET  /api/student/pronunciation/syllables-audio/:itemId  (cache-first syllable audios)
router.get('/pronunciation/syllables-audio/:itemId', verifyToken, getPronunciationSyllableAudios);
// POST /api/student/pronunciation/attempt
router.post('/pronunciation/attempt', verifyToken, submitPronunciationAttempt);
// POST /api/student/pronunciation/verify-audio (Groq Whisper Large-v3 STT verification)
router.post('/pronunciation/verify-audio', upload.single('audio'), verifyPronunciationAudio);


// POST /api/student/pronunciation/ingest-word (Dictionary API & Content Validator pipeline)
router.post('/pronunciation/ingest-word', verifyToken, ingestPronunciationWord);



router.get('/:lrn', getStudentByLrn);
router.post('/', createStudent);
router.post('/import-csv', importStudentsCSV);
router.put('/:lrn', updateStudent);
router.patch('/:lrn/status', toggleStudentStatus);
router.delete('/:lrn', deleteStudent);

module.exports = router;
