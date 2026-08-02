const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');
const { verifyToken, requireRole } = require('../middleware/auth.middleware.js');

// Public routes
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-status', authController.getResetStatus);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/invalidate-reset-session', authController.invalidateResetSession);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', verifyToken, authController.getMe);
router.post('/logout', verifyToken, authController.logout);

// Admin-only route
router.post('/register', verifyToken, requireRole('admin'), authController.register);

module.exports = router;
