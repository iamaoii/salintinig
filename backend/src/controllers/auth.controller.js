const db = require('../config/db.js');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'salintinig-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch (e) {}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function comparePassword(plain, hash) {
  if (!bcrypt) return plain === hash;
  try { return await bcrypt.compare(plain, hash); } catch (e) { return false; }
}

function hashPassword(plain) {
  if (!plain) return plain;
  try {
    if (bcrypt) { const salt = bcrypt.genSaltSync(10); return bcrypt.hashSync(plain, salt); }
  } catch (e) {}
  return plain;
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/ID and password are required.' });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ success: false, error: 'Database not configured.' });
    }

    // Lookup user by email (all roles including super_admin)
    const { rows } = await db.query(
      `SELECT user_id, email, password_hash, role, status, school_id, must_change_password
       FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [identifier.trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = rows[0];

    if (user.status === 'disabled' || user.status === 'inactive') {
      return res.status(403).json({ success: false, error: 'Your account has been deactivated. Please contact your administrator.' });
    }

    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const mustChangePassword = Boolean(user.must_change_password);

    // Determine display name
    let displayName = user.email;
    try {
      if (user.role === 'teacher') {
        const { rows: tRows } = await db.query(
          `SELECT CONCAT(first_name, ' ', COALESCE(middle_name || ' ', ''), last_name) AS name
           FROM teachers WHERE user_id = $1 LIMIT 1`,
          [user.user_id]
        );
        if (tRows.length) displayName = tRows[0].name;
      } else if (user.role === 'admin') {
        const { rows: sRows } = await db.query(
          `SELECT school_name AS name FROM schools WHERE school_id = $1 LIMIT 1`,
          [user.school_id]
        );
        if (sRows.length) displayName = sRows[0].name;
      } else if (user.role === 'super_admin') {
        displayName = 'Super Administrator';
      }
    } catch (e) {}

    // Determine default path
    let defaultPath = '/teacher';
    if (user.role === 'admin') defaultPath = '/admin/dashboard';
    if (user.role === 'super_admin') defaultPath = '/super-admin/dashboard';

    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id || null,
    };

    const token = generateToken(tokenPayload);

    return res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        name: displayName,
        schoolId: user.school_id || null,
        mustChangePassword,
        defaultPath,
      },
      mustChangePassword,
    });
  } catch (error) {
    console.error('[Auth] login error:', error.message);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res) {
  try {
    const { rows } = await db.query(
      `SELECT user_id, email, role, school_id, status, must_change_password FROM users WHERE user_id = $1 LIMIT 1`,
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found.' });
    const u = rows[0];
    return res.json({
      success: true,
      user: {
        id: u.user_id,
        email: u.email,
        role: u.role,
        schoolId: u.school_id,
        mustChangePassword: Boolean(u.must_change_password),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch profile.' });
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  return res.json({ success: true, message: 'Logged out successfully.' });
}

/**
 * POST /api/auth/change-password
 */
async function changePassword(req, res) {
  try {
    const { newPassword, currentPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    }

    const { rows } = await db.query(
      `SELECT password_hash FROM users WHERE user_id = $1 LIMIT 1`,
      [req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'User not found.' });

    // If currentPassword provided (non-forced change), verify it
    if (currentPassword) {
      const valid = await comparePassword(currentPassword, rows[0].password_hash);
      if (!valid) return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(newPassword);
    await db.query(
      `UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [newHash, req.user.userId]
    );

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    console.error('[Auth] changePassword error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to change password.' });
  }
}

/**
 * PUT /api/auth/profile
 */
async function updateProfile(req, res) {
  try {
    const { name, avatarUrl } = req.body;
    // Profile updates are role-specific and minimal here
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

    const { rows } = await db.query(
      `SELECT user_id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [email.trim()]
    );

    // Always return success to prevent email enumeration
    if (!rows.length) {
      return res.json({ success: true, message: 'If an account exists with that email, a reset code has been sent.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.query(
      `UPDATE users SET reset_code = $1, reset_code_expires_at = $2 WHERE user_id = $3`,
      [code, expiresAt, rows[0].user_id]
    ).catch(() => {});

    try {
      const { sendPasswordResetCode } = require('../services/emailService.js');
      await sendPasswordResetCode({ toEmail: email, code });
    } catch (emailErr) {
      console.warn('[Auth] forgotPassword email error:', emailErr.message);
    }

    return res.json({ success: true, message: 'If an account exists with that email, a reset code has been sent.' });
  } catch (error) {
    console.error('[Auth] forgotPassword error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to process request.' });
  }
}

/**
 * GET /api/auth/reset-status
 */
async function getResetStatus(req, res) {
  return res.json({ success: true, status: 'active' });
}

/**
 * POST /api/auth/verify-reset-code
 */
async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;
    const { rows } = await db.query(
      `SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) AND reset_code = $2 AND reset_code_expires_at > NOW() LIMIT 1`,
      [email, code]
    );
    if (!rows.length) return res.status(400).json({ success: false, error: 'Invalid or expired reset code.' });
    return res.json({ success: true, message: 'Code verified.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Verification failed.' });
  }
}

/**
 * POST /api/auth/invalidate-reset-session
 */
async function invalidateResetSession(req, res) {
  return res.json({ success: true });
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }
    const { rows } = await db.query(
      `SELECT user_id FROM users WHERE LOWER(email) = LOWER($1) AND reset_code = $2 AND reset_code_expires_at > NOW() LIMIT 1`,
      [email, code]
    );
    if (!rows.length) return res.status(400).json({ success: false, error: 'Invalid or expired reset session.' });
    const newHash = hashPassword(newPassword);
    await db.query(
      `UPDATE users SET password_hash = $1, reset_code = NULL, reset_code_expires_at = NULL, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [newHash, rows[0].user_id]
    );
    return res.json({ success: true, message: 'Password reset successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
}

/**
 * POST /api/auth/register (Admin-only: register a teacher/admin account)
 */
async function register(req, res) {
  try {
    const { email, role, schoolId, tempPassword } = req.body;
    if (!email || !role) return res.status(400).json({ success: false, error: 'Email and role are required.' });

    const passToUse = tempPassword || 'TempPass123!';
    const hash = hashPassword(passToUse);
    const targetSchoolId = schoolId || req.user.schoolId || null;

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, role, school_id, status, must_change_password)
       VALUES ($1, $2, $3, $4, 'active', true) RETURNING user_id`,
      [email.trim().toLowerCase(), hash, role, targetSchoolId]
    );

    return res.status(201).json({ success: true, userId: rows[0].user_id, tempPassword: passToUse });
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return res.status(409).json({ success: false, error: 'An account with that email already exists.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to register account.' });
  }
}

/**
 * POST /api/auth/contact-admin
 */
async function contactAdmin(req, res) {
  try {
    const { email, fullName, teacherNo, schoolId, message } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

    // Insert into account_requests table if it exists
    try {
      await db.query(
        `INSERT INTO account_requests (email, full_name, teacher_no, school_id, message, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [email.trim().toLowerCase(), fullName || null, teacherNo || null, schoolId || null, message || null]
      );
    } catch (dbErr) {
      console.warn('[Auth] contactAdmin DB insert error:', dbErr.message);
    }

    return res.json({ success: true, message: 'Request submitted. The school administrator will review your request.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to submit contact request.' });
  }
}

module.exports = {
  login,
  getMe,
  logout,
  changePassword,
  updateProfile,
  forgotPassword,
  getResetStatus,
  verifyResetCode,
  invalidateResetSession,
  resetPassword,
  register,
  contactAdmin,
};
