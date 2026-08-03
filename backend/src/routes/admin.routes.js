const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller.js');
const studentController = require('../controllers/student.controller.js');
const { verifyToken, requireRole } = require('../middleware/auth.middleware.js');

// Public or Dashboard stats endpoint
router.get('/stats', adminController.getSystemStats);
router.post('/verify-parent-code', adminController.verifyParentAccessCode);

// Protected Admin-only routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);

// Student Records management endpoints
router.get('/students', studentController.getStudents);
router.post('/students', studentController.createStudent);
router.put('/students/:lrn', studentController.updateStudent);
router.patch('/students/:lrn/status', studentController.toggleStudentStatus);
router.delete('/students/:lrn', studentController.deleteStudent);
router.post('/students/import-csv', studentController.importStudentsCSV);

router.post('/import-csv', adminController.batchImportCSV);
router.post('/faculty-assignment', adminController.assignFaculty);

// Account Requests Management
router.get('/account-requests', adminController.getAccountRequests);
router.post('/account-requests/:id/approve', adminController.approveAccountRequest);
router.post('/account-requests/:id/reject', adminController.rejectAccountRequest);

module.exports = router;
