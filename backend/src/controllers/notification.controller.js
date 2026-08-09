const db = require('../config/db.js');

/**
 * Fetch notifications for authenticated user
 * GET /api/notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    // Query notifications by user_id OR by school_id (for school admins)
    const result = await db.query(
      `SELECT notification_id AS id, school_id, user_id, title, message, notification_type, is_read, created_at
       FROM notifications
       WHERE user_id = $1 OR (school_id = $2 AND user_id IS NULL)
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId, schoolId]
    );

    const notifications = result.rows;
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch notifications.' });
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id;

    const result = await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = $1 AND (user_id = $2 OR school_id = $3)
       RETURNING notification_id, is_read`,
      [id, userId, schoolId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      notification: result.rows[0],
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, error: 'Failed to update notification.' });
  }
};

/**
 * Mark all notifications as read for current user
 * PATCH /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id;

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE (user_id = $1 OR school_id = $2) AND is_read = FALSE`,
      [userId, schoolId]
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ success: false, error: 'Failed to update notifications.' });
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id;

    const result = await db.query(
      `DELETE FROM notifications
       WHERE notification_id = $1 AND (user_id = $2 OR school_id = $3)
       RETURNING notification_id`,
      [id, userId, schoolId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete notification.' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
