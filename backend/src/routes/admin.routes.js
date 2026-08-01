const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller.js');
const { verifyToken, requireRole } = require('../middleware/auth.middleware.js');

// Public route for Parent Account Registration verification
router.post('/verify-parent-code', adminController.verifyParentAccessCode);

// Protected Admin-only routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);

router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);

router.post('/import-csv', adminController.batchImportCSV);
router.post('/faculty-assignment', adminController.assignFaculty);

module.exports = router;
