const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware.js');
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
} = require('../controllers/student.controller.js');

// Routes for Student Records management & assessment submissions
router.get('/', getStudents);
router.get('/assessment/passages', getPhilIriPassages);
router.get('/assessment/my-assignment', verifyToken, getStudentActiveAssignment);
router.post('/assessment/assign', assignPhilIriToStudent);
router.post('/assessment/submit', submitPhilIriAssessment);
router.post('/assessment/submit-oral-audio', submitStudentOralAudio);
router.post('/story/complete', completeStoryProgress);
router.post('/activity/complete', completeActivityProgress);
router.get('/:lrn', getStudentByLrn);
router.post('/', createStudent);
router.post('/import-csv', importStudentsCSV);
router.put('/:lrn', updateStudent);
router.patch('/:lrn/status', toggleStudentStatus);
router.delete('/:lrn', deleteStudent);

module.exports = router;
