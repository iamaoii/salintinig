const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller.js');
const { verifyToken, requireRole } = require('../middleware/auth.middleware.js');

// All admin routes require a valid token + admin role
router.use(verifyToken);
router.use(requireRole('admin'));

// ── Admin Info ────────────────────────────────────────────────────────────────
router.get('/info', adminController.getAdminInfo);
router.put('/info', adminController.updateAdminInfo);

// ── Stats ─────────────────────────────────────────────────────────────────────
router.get('/stats', adminController.getSystemStats);

// ── Teachers ──────────────────────────────────────────────────────────────────
router.get('/teachers', adminController.getTeachers);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

// ── Students ──────────────────────────────────────────────────────────────────
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.post('/students/bulk', adminController.batchImportCSV);

// ── Sections / Faculty Assignment ─────────────────────────────────────────────
router.get('/sections', adminController.getSections);
router.post('/sections', adminController.createSection);
router.put('/sections/:id', adminController.updateSection);
router.delete('/sections/:id', adminController.deleteSection);
router.get('/faculty-assignments', adminController.getFacultyAssignments);
router.post('/faculty-assignments', adminController.assignFaculty);
router.get('/student-sectioning', adminController.getStudentSectioning);
router.post('/student-sectioning', adminController.assignStudentsToSection);
router.patch('/student-sectioning/:id/promotion', adminController.updateStudentPromotionStatus);

// ── School Years ──────────────────────────────────────────────────────────────
router.get('/school-years', adminController.getSchoolYears);
router.post('/school-years', adminController.createSchoolYear);
router.patch('/school-years/:id/activate', adminController.activateSchoolYear);

// ── Account Requests ──────────────────────────────────────────────────────────
router.get('/account-requests', adminController.getAccountRequests);
router.post('/account-requests/:id/approve', adminController.approveAccountRequest);
router.post('/account-requests/:id/reject', adminController.rejectAccountRequest);

// ── Phil-IRI ──────────────────────────────────────────────────────────────────
router.get('/analytics/phil-iri', adminController.getPhilIriAnalytics);
router.get('/phil-iri/assessments', adminController.getPhilIriAssessments);
router.get('/phil-iri/periods', adminController.getPhilIriPeriods);
router.post('/phil-iri/periods', adminController.updatePhilIriPeriods);

// Passages — READ ONLY for School Admin (CRUD is Super Admin only)
router.get('/phil-iri/passages', adminController.getPassages);

module.exports = router;
