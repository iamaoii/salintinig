const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth.middleware.js');
const ctrl = require('../controllers/super_admin.controller.js');

// All Super Admin routes require a valid token AND the super_admin role
router.use(authenticateToken);
router.use(requireRole('super_admin'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard/stats', ctrl.getDashboardStats);

// ── Schools ───────────────────────────────────────────────────────────────────
router.get('/schools', ctrl.getSchools);
router.post('/schools', ctrl.createSchool);
router.get('/schools/:id', ctrl.getSchoolById);
router.put('/schools/:id', ctrl.updateSchool);
router.patch('/schools/:id/status', ctrl.toggleSchoolStatus);
router.get('/schools/:id/analytics', ctrl.getSchoolAnalytics);

// ── School Admins ─────────────────────────────────────────────────────────────
router.get('/schools/:id/admins', ctrl.getSchoolAdmins);
router.post('/schools/:id/admins', ctrl.createSchoolAdmin);
router.put('/schools/:schoolId/admins/:adminId', ctrl.updateSchoolAdmin);
router.patch('/schools/:schoolId/admins/:adminId/status', ctrl.toggleAdminStatus);
router.post('/schools/:schoolId/admins/:adminId/reset-password', ctrl.resetAdminPassword);

// ── Phil-IRI Passages ─────────────────────────────────────────────────────────
router.get('/phil-iri/passages', ctrl.getPassages);
router.post('/phil-iri/passages', ctrl.createPassage);
router.put('/phil-iri/passages/:id', ctrl.updatePassage);
router.patch('/phil-iri/passages/:id/archive', ctrl.archivePassage);
router.patch('/phil-iri/passages/:id/restore', ctrl.restorePassage);

// ── Stories (reading_materials) ───────────────────────────────────────────────
router.get('/stories', ctrl.getStories);
router.post('/stories', ctrl.createStory);
router.put('/stories/:id', ctrl.updateStory);
router.patch('/stories/:id/status', ctrl.setStoryStatus);
router.delete('/stories/:id', ctrl.deleteStory);

// ── System Analytics ──────────────────────────────────────────────────────────
router.get('/analytics', ctrl.getSystemAnalytics);

module.exports = router;
