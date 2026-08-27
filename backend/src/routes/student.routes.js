const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth.middleware.js');

const upload = multer({
  dest: path.join(__dirname, '../../uploads/temp/'),
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
router.get('/:lrn', getStudentByLrn);
router.post('/', createStudent);
router.post('/import-csv', importStudentsCSV);
router.put('/:lrn', updateStudent);
router.patch('/:lrn/status', toggleStudentStatus);
router.delete('/:lrn', deleteStudent);

module.exports = router;
