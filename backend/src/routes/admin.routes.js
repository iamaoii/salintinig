const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller.js');
const studentController = require('../controllers/student.controller.js');
const teacherController = require('../controllers/teacher.controller.js');
const { verifyToken, requireRole } = require('../middleware/auth.middleware.js');

router.post('/verify-parent-code', adminController.verifyParentAccessCode);

// Protected Admin-only routes
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/stats', adminController.getSystemStats);

router.get('/info', adminController.getAdminInfo);
router.put('/info', adminController.updateAdminInfo);
router.get('/analytics/phil-iri', adminController.getPhilIriAnalytics);

// Teacher management & assignment endpoints
router.get('/teachers', teacherController.getTeachers);
router.get('/teachers/:id', teacherController.getTeacherById);
router.post('/teachers', teacherController.createTeacher);
router.put('/teachers/:id', teacherController.updateTeacher);
router.delete('/teachers/:id', teacherController.deleteTeacher);
router.post('/teachers/import-csv', teacherController.importTeachersCSV);
router.post('/teacher/assign-phil-iri', teacherController.assignPhilIriSetToClass);

// Section & Faculty Assignment endpoints
router.get('/sections', adminController.getSections);
router.post('/sections', adminController.createSection);
router.put('/sections/:id', adminController.updateSection);
router.delete('/sections/:id', adminController.deleteSection);

router.get('/faculty-assignments', adminController.getFacultyAssignments);
router.post('/faculty-assignments', adminController.assignFaculty);

// School Year endpoints
router.get('/school-years', adminController.getSchoolYears);
router.post('/school-years', adminController.createSchoolYear);
router.put('/school-years/:id/activate', adminController.activateSchoolYear);

// Student Sectioning & Promotion endpoints
router.get('/student-sectioning', adminController.getStudentSectioning);
router.post('/assign-students-section', adminController.assignStudentsToSection);
router.put('/student-promotion', adminController.updateStudentPromotionStatus);

// Student Records management endpoints
router.get('/students', studentController.getStudents);
router.get('/students/check/:lrn', studentController.checkExistingStudent);
router.get('/students/:lrn', studentController.getStudentByLrn);
router.post('/students/transfer-in', studentController.transferInStudent);
router.post('/students', studentController.createStudent);
router.put('/students/:lrn', studentController.updateStudent);
router.patch('/students/:lrn/status', studentController.toggleStudentStatus);
router.delete('/students/:lrn', studentController.deleteStudent);
router.post('/students/import-csv', studentController.importStudentsCSV);

// Phil-IRI Passages — Admin READ-ONLY (write operations moved to Super Admin)
router.get('/phil-iri/passages', adminController.getPassages);
// POST/PUT/DELETE passages are now handled by /api/super-admin/phil-iri/passages

// Phil-IRI Assessment Monitoring & Screening Periods
router.get('/phil-iri/assessments', adminController.getPhilIriAssessments);
router.get('/phil-iri/periods', adminController.getPhilIriPeriods);
router.post('/phil-iri/periods', adminController.updatePhilIriPeriods);
// Read-only GST Form 1A/1B lookup for Admin Form 2 summary reports (saving is handled via /api/teacher/phil-iri/gst-submission)
router.get('/phil-iri/gst-submission', adminController.getGstFormSubmission);

// Account Requests Management
router.get('/account-requests', teacherController.getAccountRequests);
router.post('/account-requests/:id/approve', teacherController.approveAccountRequest);
router.post('/account-requests/:id/reject', teacherController.rejectAccountRequest);

module.exports = router;
