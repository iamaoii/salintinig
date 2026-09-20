/**
 * super_admin.routes.js
 * ---------------------
 * All API routes for the Super Admin portal.
 * All routes require verifyToken + requireRole('super_admin').
 */

const express = require('express');
const router = express.Router();
const sa = require('../controllers/super_admin.controller.js');
const { verifyToken, requireRole } = require('../middleware/auth.middleware.js');

// All super-admin routes require a valid token and the super_admin role
router.use(verifyToken);
router.use(requireRole('super_admin'));

// Dashboard
router.get('/dashboard/stats', sa.getDashboardStats);

// Schools management
router.get('/schools', sa.getSchools);
router.post('/schools', sa.createSchool);
router.get('/schools/:id', sa.getSchoolById);
router.put('/schools/:id', sa.updateSchool);
router.patch('/schools/:id/status', sa.toggleSchoolStatus);

// School Admin accounts
router.get('/schools/:id/admins', sa.getSchoolAdmins);
router.post('/schools/:id/admins', sa.createSchoolAdmin);
router.patch('/schools/:id/admins/:adminId/status', sa.toggleAdminStatus);
router.post('/schools/:id/admins/:adminId/reset-password', sa.resetAdminPassword);

// Phil-IRI Passages (Super Admin only — full CRUD with archive)
router.get('/phil-iri/passages', sa.getPassages);
router.post('/phil-iri/passages', sa.createPassage);
router.put('/phil-iri/passages/:id', sa.updatePassage);
router.patch('/phil-iri/passages/:id/archive', sa.archivePassage);

// Stories / Reading Materials
router.get('/stories', sa.getStories);
router.post('/stories', sa.createStory);
router.put('/stories/:id', sa.updateStory);
router.patch('/stories/:id/status', sa.setStoryStatus);

// System Analytics
router.get('/analytics', sa.getSystemAnalytics);

module.exports = router;
