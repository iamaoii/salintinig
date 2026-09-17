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
  submitPronunciationAttempt,
  verifyPronunciationAudio,
  ingestPronunciationWord,
  getVocabularyItems,
  submitVocabularyAttempt,
  getSentenceItems,
  submitSentenceAttempt,
  streamSentenceTts,
  getLibraryBooks,
  getStudentReadingProgress,
  startStoryProgress,
  getPracticeRemedialQuestion,
  getStudentStreak,
  getStudentBadges,
  getStudentAnalytics,
} = require('../controllers/student.controller.js');

// ── GET /api/student/streak & /badges & /analytics ─────────────────────────
router.get('/streak', verifyToken, getStudentStreak);
router.get('/badges', verifyToken, getStudentBadges);
router.get('/analytics', verifyToken, getStudentAnalytics);

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
router.post('/story/complete', verifyToken, completeStoryProgress);
router.post('/activity/complete', verifyToken, completeActivityProgress);

// ── Pronunciation Challenge ──────────────────────────────────────────────────
// GET  /api/student/pronunciation/items?language=fil&limit=10
router.get('/pronunciation/items', verifyToken, getPronunciationItems);
// POST /api/student/pronunciation/attempt
router.post('/pronunciation/attempt', verifyToken, submitPronunciationAttempt);
// POST /api/student/pronunciation/verify-audio (Groq Whisper Large-v3 STT verification)
router.post('/pronunciation/verify-audio', upload.single('audio'), verifyPronunciationAudio);

// POST /api/student/pronunciation/ingest-word (Dictionary API & Content Validator pipeline)
router.post('/pronunciation/ingest-word', verifyToken, ingestPronunciationWord);

// ── Vocabulary Matching Challenge ───────────────────────────────────────────
// GET  /api/student/vocabulary/items?difficulty=medium&limit=5
router.get('/vocabulary/items', verifyToken, getVocabularyItems);
// POST /api/student/vocabulary/attempt
router.post('/vocabulary/attempt', verifyToken, submitVocabularyAttempt);

// ── Sentence Arrangement Activity ──────────────────────────────────────────
// GET  /api/student/sentence/items?language=fil&difficulty=medium&limit=5
router.get('/sentence/items', verifyToken, getSentenceItems);
// GET  /api/student/sentence/tts?text=...&language=... (On-the-fly streaming, NO database storage)
router.get('/sentence/tts', verifyToken, streamSentenceTts);
// POST /api/student/sentence/attempt
router.post('/sentence/attempt', verifyToken, submitSentenceAttempt);

// ── Library ──────────────────────────────────────────────────────────
// GET  /api/student/library/books?language=fil&category=Alamat&grade=Grade+4
router.get('/library/books', getLibraryBooks);
// GET  /api/student/library/progress (student's in-progress & completed stories)
router.get('/library/progress', verifyToken, getStudentReadingProgress);
// POST /api/student/library/progress/start (record/update story progress)
router.post('/library/progress/start', verifyToken, startStoryProgress);

// ── Practice Story: AI Remedial Follow-Up Question ───────────────────────────
// POST /api/student/practice/remedial-question
// Called when a student answers a practice quiz question incorrectly.
// Returns GROQ AI-generated hint + follow-up question (~200 tokens per call).
router.post('/practice/remedial-question', verifyToken, getPracticeRemedialQuestion);



router.get('/:lrn', getStudentByLrn);
router.post('/', createStudent);
router.post('/import-csv', importStudentsCSV);
router.put('/:lrn', updateStudent);
router.patch('/:lrn/status', toggleStudentStatus);
router.delete('/:lrn', deleteStudent);

module.exports = router;
