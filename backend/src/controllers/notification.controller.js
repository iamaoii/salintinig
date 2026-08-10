const db = require('../config/db.js');

/**
 * Fetch notifications for authenticated user (Admin or Teacher)
 * GET /api/notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id || '109283';
    const userRole = req.user?.role || 'admin';

    let result;
    if (userRole === 'admin') {
      result = await db.query(
        `SELECT notification_id AS id, school_id, user_id, title, message, notification_type, is_read, created_at
         FROM notifications
         WHERE school_id = $1 OR school_id IS NULL OR user_id = $2
         ORDER BY created_at DESC
         LIMIT 50`,
        [schoolId, userId]
      );
    } else {
      result = await db.query(
        `SELECT notification_id AS id, school_id, user_id, title, message, notification_type, is_read, created_at
         FROM notifications
         WHERE user_id = $1 OR school_id = $2 OR school_id IS NULL
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId, schoolId]
      );
    }

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
    const schoolId = req.user?.schoolId || req.user?.school_id || '109283';

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = $1 AND (user_id = $2 OR school_id = $3 OR school_id IS NULL)`,
      [id, userId, schoolId]
    );

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
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
    const schoolId = req.user?.schoolId || req.user?.school_id || '109283';

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE (user_id = $1 OR school_id = $2 OR school_id IS NULL) AND is_read = FALSE`,
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
 * Delete a single notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id || '109283';

    await db.query(
      `DELETE FROM notifications
       WHERE notification_id = $1 AND (user_id = $2 OR school_id = $3 OR school_id IS NULL)`,
      [id, userId, schoolId]
    );

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete notification.' });
  }
};

/**
 * Clear all notifications for authenticated user/school
 * DELETE /api/notifications/clear-all
 */
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id || '109283';

    await db.query(
      `DELETE FROM notifications
       WHERE school_id = $1 OR user_id = $2 OR school_id IS NULL`,
      [schoolId, userId]
    );

    return res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully.',
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear notifications.' });
  }
};

/**
 * Automatically prune notifications older than 30 days & audit logs older than 90 days
 * DELETE /api/notifications/prune
 */
const pruneOldNotifications = async (req, res) => {
  try {
    const notifRes = await db.query(
      `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'`
    );
    const auditRes = await db.query(
      `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'`
    );

    return res.status(200).json({
      success: true,
      message: `Pruned ${notifRes.rowCount || 0} old notifications (>30 days) and ${auditRes.rowCount || 0} old audit logs (>90 days).`,
    });
  } catch (error) {
    console.error('Error pruning old records:', error);
    return res.status(500).json({ success: false, error: 'Failed to prune old records.' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  pruneOldNotifications,
};
