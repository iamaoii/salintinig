const express = require('express');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notification.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

const router = express.Router();

// All notification routes require JWT authentication
router.use(verifyToken);

router.get('/', getUserNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
