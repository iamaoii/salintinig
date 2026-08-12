const express = require('express');
const router = express.Router();
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
  completeStoryProgress,
  completeActivityProgress,
} = require('../controllers/student.controller.js');

// Routes for Student Records management & assessment submissions
router.get('/', getStudents);
router.get('/assessment/passages', getPhilIriPassages);
router.post('/assessment/submit', submitPhilIriAssessment);
router.post('/story/complete', completeStoryProgress);
router.post('/activity/complete', completeActivityProgress);
router.get('/:lrn', getStudentByLrn);
router.post('/', createStudent);
router.post('/import-csv', importStudentsCSV);
router.put('/:lrn', updateStudent);
router.patch('/:lrn/status', toggleStudentStatus);
router.delete('/:lrn', deleteStudent);

module.exports = router;
