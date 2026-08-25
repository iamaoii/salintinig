const db = require('../config/db.js');

/**
 * Fetch notifications for authenticated user (Admin or Teacher)
 * GET /api/notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const schoolId = req.user?.schoolId || req.user?.school_id || null;
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
    } else if (userRole === 'student') {
      let sGrade = null;
      let sSection = null;
      try {
        const sQuery = await db.query(
          `SELECT grade_level, section_name FROM students WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
        if (sQuery.rows && sQuery.rows.length > 0) {
          sGrade = sQuery.rows[0].grade_level ? String(sQuery.rows[0].grade_level) : null;
          sSection = sQuery.rows[0].section_name || null;
        }
      } catch (e) {
        console.warn('Student details fetch notice for notifications:', e.message);
      }

      const rawRes = await db.query(
        `SELECT notification_id AS id, school_id, user_id, title, message, notification_type, is_read, created_at
         FROM notifications
         WHERE (school_id = $1 OR school_id IS NULL OR user_id = $2)
           AND (notification_type IS NULL OR notification_type NOT IN ('account_request', 'account_approval', 'account_rejection', 'admin_audit', 'teacher'))
         ORDER BY created_at DESC
         LIMIT 100`,
        [schoolId, userId]
      );

      const allNotifs = rawRes.rows || [];
      const filtered = allNotifs.filter((n) => {
        if (n.user_id && String(n.user_id) === String(userId)) return true;
        const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        if (sSection && text.includes(sSection.toLowerCase().trim())) return true;
        if (sGrade && text.includes(`grade ${sGrade.toLowerCase().trim()}`)) return true;
        if (n.notification_type === 'announcement' || n.notification_type === 'general' || n.notification_type === 'student' || n.notification_type === 'assessment' || n.notification_type === 'phil_iri' || n.notification_type === 'activity') return true;
        return false;
      });

      result = { rows: filtered.slice(0, 50) };
    } else {
      // 1. Fetch Teacher profile to get assigned section & Faculty-in-Charge details
      let tGrade = null;
      let tSection = null;
      let isFIC = false;
      let ficGrade = null;

      try {
        const tQuery = await db.query(
          `SELECT c.grade_level, c.section_name,
                  EXISTS(
                    SELECT 1 FROM faculty_in_charge fic
                    JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
                    WHERE fic.teacher_id = t.teacher_id AND fic.status = 'active'
                  ) AS is_faculty_in_charge,
                  (
                    SELECT fic2.grade_level FROM faculty_in_charge fic2
                    JOIN school_years sy2 ON fic2.school_year_id = sy2.school_year_id AND sy2.is_active = true
                    WHERE fic2.teacher_id = t.teacher_id AND fic2.status = 'active'
                    LIMIT 1
                  ) AS fic_grade_level
           FROM teachers t
           LEFT JOIN classes c ON t.teacher_id = c.advisor_teacher_id
           WHERE t.user_id = $1 LIMIT 1`,
          [userId]
        );
        if (tQuery.rows && tQuery.rows.length > 0) {
          const row = tQuery.rows[0];
          tGrade = row.grade_level ? String(row.grade_level) : null;
          tSection = row.section_name || null;
          isFIC = row.is_faculty_in_charge === true;
          ficGrade = row.fic_grade_level ? String(row.fic_grade_level) : null;
        }
      } catch (e) {
        console.warn('Teacher details fetch notice for notifications:', e.message);
      }

      // 2. Query notifications excluding admin-only system logs & account approval requests
      const rawRes = await db.query(
        `SELECT notification_id AS id, school_id, user_id, title, message, notification_type, is_read, created_at
         FROM notifications
         WHERE (school_id = $1 OR school_id IS NULL OR user_id = $2)
           AND (notification_type IS NULL OR notification_type NOT IN ('account_request', 'account_approval', 'account_rejection', 'admin_audit'))
         ORDER BY created_at DESC
         LIMIT 100`,
        [schoolId, userId]
      );

      const allNotifs = rawRes.rows || [];

      // 3. Apply role scoping:
      // - Direct user notification (user_id = userId)
      // - Faculty in Charge (FIC): all notifications matching their Grade Level across sections
      // - Class Adviser: notifications matching their assigned section
      // - Unassigned teacher: only direct user notifications or general announcements
      const filtered = allNotifs.filter((n) => {
        if (n.user_id && String(n.user_id) === String(userId)) return true;

        const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();

        // Filter out admin-only system tasks
        if (text.includes('batch teacher csv import') || text.includes('account request') || text.includes('system admin') || text.includes('deactivate admin')) {
          return false;
        }

        // Faculty-in-Charge: receives notifications for the entire grade level
        const activeFICGrade = ficGrade || (isFIC ? tGrade : null);
        if (isFIC && activeFICGrade) {
          const targetG = activeFICGrade.toLowerCase().trim();
          if (text.includes(`grade ${targetG}`) || text.includes(`grade-${targetG}`) || text.includes(`g${targetG}`)) {
            return true;
          }
        }

        // Class Adviser: receives notifications for their specific assigned section
        if (tSection) {
          const secClean = tSection.toLowerCase().trim();
          const gradeClean = tGrade ? tGrade.toLowerCase().trim() : '';
          const fullLabel = gradeClean ? `grade ${gradeClean} - ${secClean}` : secClean;

          if (text.includes(secClean) || text.includes(fullLabel)) {
            return true;
          }
        }

        // General announcements directed to teachers
        if (n.notification_type === 'announcement' || n.notification_type === 'teacher') {
          return true;
        }

        return false;
      });

      result = { rows: filtered.slice(0, 50) };
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
    const schoolId = req.user?.schoolId || req.user?.school_id || null;

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
    const schoolId = req.user?.schoolId || req.user?.school_id || null;

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
    const schoolId = req.user?.schoolId || req.user?.school_id || null;

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
    const schoolId = req.user?.schoolId || req.user?.school_id || null;

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
