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
} = require('../controllers/student.controller.js');

// Routes for Student Records management
router.get('/', getStudents);
router.get('/:lrn', getStudentByLrn);
router.post('/', createStudent);
router.post('/import-csv', importStudentsCSV);
router.put('/:lrn', updateStudent);
router.patch('/:lrn/status', toggleStudentStatus);
router.delete('/:lrn', deleteStudent);

module.exports = router;
