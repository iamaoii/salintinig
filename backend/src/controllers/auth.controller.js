const db = require('../config/db.js');
const { supabase } = require('../config/supabase.js');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail, sendTeacherAccountRequestEmail } = require('../services/emailService.js');

function createToken(user) {
  const secret = process.env.JWT_SECRET || 'salintinig_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const payload = {
    id: user.id || user.user_id,
    username: user.username || user.email,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId || user.school_id || null,
    defaultPath: user.defaultPath,
  };

  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (e) {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
} catch (e) {}

function hashPassword(plainPassword) {
  if (!plainPassword) return '';
  try {
    if (bcrypt) {
      const salt = bcrypt.genSaltSync(10);
      return bcrypt.hashSync(plainPassword, salt);
    }
  } catch (e) {}
  return plainPassword;
}

function checkPasswordMatch(inputPassword, storedHash) {
  if (!storedHash || !inputPassword) return false;
  // 1. Direct plaintext match (if stored in plain text in DB)
  if (storedHash === inputPassword) return true;
  // 2. Bcrypt comparison (if stored as bcrypt hash in DB)
  if (bcrypt && (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$'))) {
    try {
      return bcrypt.compareSync(inputPassword, storedHash);
    } catch (e) {
      return false;
    }
  }
  return false;
}

/**
 * Login handler — Authenticates via direct PostgreSQL (DATABASE_URL) or Supabase SDK
 */
async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email/identifier and password.',
      });
    }

    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    let matchedUser = null;

    // 1. Attempt PostgreSQL Query via DATABASE_URL if configured
    if (process.env.DATABASE_URL) {
      try {
        // A. Match strictly by Email
        const userQuery = `
          SELECT u.user_id, u.school_id, u.email, u.password_hash, u.role, u.status, u.must_change_password, s.school_name
          FROM users u
          LEFT JOIN schools s ON u.school_id = s.school_id
          WHERE LOWER(u.email) = $1
          LIMIT 1;
        `;
        const { rows } = await db.query(userQuery, [cleanId]);

        if (rows && rows.length > 0) {
          const u = rows[0];
          if (checkPasswordMatch(cleanPass, u.password_hash)) {
            matchedUser = u;
          }
        }

        // B. Match strictly by Teacher ID (Employee ID)
        if (!matchedUser) {
          const teacherQuery = `
            SELECT u.user_id, u.school_id, u.email, u.password_hash, u.role, u.status, u.must_change_password, t.first_name, t.last_name, t.teacher_no
            FROM teachers t
            JOIN users u ON t.user_id = u.user_id
            WHERE LOWER(t.teacher_no) = $1
            LIMIT 1;
          `;
          const { rows: teacherRows } = await db.query(teacherQuery, [cleanId]);
          if (teacherRows && teacherRows.length > 0) {
            const u = teacherRows[0];
            if (checkPasswordMatch(cleanPass, u.password_hash)) {
              matchedUser = u;
            }
          }
        }

        // C. Match by Student LRN (lrn) or LRN identifier
        if (!matchedUser) {
          const studentQuery = `
            SELECT u.user_id, u.school_id, u.email, u.password_hash, u.role, u.status, u.must_change_password, st.first_name, st.last_name, st.lrn, st.parent_access_code
            FROM students st
            JOIN users u ON st.user_id = u.user_id
            WHERE LOWER(st.lrn) = $1 OR LOWER(u.username) = $1
            LIMIT 1;
          `;
          const { rows: studentRows } = await db.query(studentQuery, [cleanId]);
          if (studentRows && studentRows.length > 0) {
            const u = studentRows[0];
            // Allow matching password_hash or parent_access_code
            if (checkPasswordMatch(cleanPass, u.password_hash) || (u.parent_access_code && u.parent_access_code.trim() === cleanPass)) {
              matchedUser = u;
            }
          }
        }
      } catch (dbErr) {
        console.warn('Direct Postgres login query notice:', dbErr.message || dbErr);
      }
    }

    // 2. Fallback to Supabase SDK if configured and DB query didn't match
    if (!matchedUser && supabase) {
      try {
        // A. Match strictly by Email
        const { data: usersByEmail } = await supabase
          .from('users')
          .select('*')
          .ilike('email', cleanId);

        if (usersByEmail && usersByEmail.length > 0) {
          matchedUser = usersByEmail.find((u) => checkPasswordMatch(cleanPass, u.password_hash));
        }

        // B. Match strictly by Teacher ID (Employee ID)
        if (!matchedUser) {
          const { data: teacherRec } = await supabase
            .from('teachers')
            .select('user_id')
            .ilike('teacher_no', cleanId)
            .maybeSingle();

          if (teacherRec && teacherRec.user_id) {
            const { data: userRec } = await supabase
              .from('users')
              .select('*')
              .eq('user_id', teacherRec.user_id)
              .maybeSingle();

            if (userRec && checkPasswordMatch(cleanPass, userRec.password_hash)) {
              matchedUser = userRec;
            }
          }
        }
      } catch (sErr) {
        console.warn('Supabase SDK fallback notice:', sErr.message);
      }
    }

    // Authenticated user formatting
    if (matchedUser) {
      const clientPlatform = (req.headers['x-client-platform'] || req.body.clientPlatform || '').toLowerCase();
      const isMobileApp = clientPlatform === 'mobile' || req.body.isMobile === true;
      const expectedRole = (req.headers['x-expected-role'] || req.body.expectedRole || '').toLowerCase();

      // Reject student/parent logins ONLY IF request is from Web Portal (not mobile app)
      if ((matchedUser.role === 'student' || matchedUser.role === 'parent') && !isMobileApp) {
        return res.status(403).json({
          success: false,
          error: 'This account is only accessible via the Salintinig mobile app.',
        });
      }

      // Enforce strict portal/button role matching
      if (expectedRole && matchedUser.role.toLowerCase() !== expectedRole) {
        const portalLabel = expectedRole.charAt(0).toUpperCase() + expectedRole.slice(1);
        return res.status(403).json({
          success: false,
          error: `Access denied. This account cannot log in through the ${portalLabel} portal.`,
        });
      }

      let displayName = matchedUser.email.split('@')[0];
      let schoolId = matchedUser.school_id || null;
      let empId = matchedUser.teacher_no || null;

      if (matchedUser.role === 'admin') {
        displayName = matchedUser.school_name || 'Mandaluyong Elementary School';
      } else if (matchedUser.role === 'teacher') {
        if (matchedUser.first_name) {
          displayName = `${matchedUser.first_name} ${matchedUser.last_name}`;
        } else {
          displayName = 'Teacher Account';
        }
      }

      const formattedUser = {
        id: matchedUser.user_id,
        username: matchedUser.email,
        name: displayName,
        email: matchedUser.email,
        role: matchedUser.role,
        schoolId,
        employeeId: empId,
        mustChangePassword: Boolean(matchedUser.must_change_password),
        defaultPath: matchedUser.role === 'admin' ? '/admin/dashboard' : '/dashboard',
        source: 'database',
      };

      const token = createToken(formattedUser);

      return res.json({
        success: true,
        token,
        mustChangePassword: Boolean(matchedUser.must_change_password),
        user: formattedUser,
        message: `Authenticated via PostgreSQL database (${matchedUser.role.toUpperCase()} role)`,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Incorrect username/email or password.',
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal server error occurred during login.',
    });
  }
}

/**
 * Get current authenticated user profile
 */
async function getMe(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
}

/**
 * Logout handler
 */
async function logout(req, res) {
  try {
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to logout.' });
  }
}

const { Resend } = require('resend');

// In-memory store for active password reset verification codes
const RESET_CODES = new Map();
// In-memory store for IP-based global rate limiting (Protects Resend email tokens)
const IP_REQUEST_LOG = new Map();

// Periodic automatic cleanup of expired reset sessions every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of RESET_CODES.entries()) {
    if (record.expiresAt && now > record.expiresAt + 3600000) {
      RESET_CODES.delete(email);
    }
  }
  for (const [ip, log] of IP_REQUEST_LOG.entries()) {
    if (log.resetTime && now > log.resetTime) {
      IP_REQUEST_LOG.delete(ip);
    }
  }
}, 60000);

/**
 * Forgot password request handler — Verifies email in database & sends email via Resend
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    // Email format validation & length sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length > 100 || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    // IP-Based Rate Limiting (Max 5 code requests per IP per 15 minutes to protect API tokens)
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const ipData = IP_REQUEST_LOG.get(clientIp) || { count: 0, resetTime: now + 15 * 60 * 1000 };

    if (now > ipData.resetTime) {
      ipData.count = 0;
      ipData.resetTime = now + 15 * 60 * 1000;
    }

    if (ipData.count >= 5) {
      const minsRemaining = Math.ceil((ipData.resetTime - now) / 60000);
      return res.status(429).json({
        success: false,
        error: `Too many password reset requests from this network. Please try again in ${minsRemaining} minute${minsRemaining > 1 ? 's' : ''}.`,
      });
    }

    let userFullName = '';

    // Check database if user exists and resolve real full name
    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await db.query(
          'SELECT user_id, email, role FROM users WHERE LOWER(email) = $1 LIMIT 1',
          [cleanEmail]
        );
        if (!rows || rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'No account found matching that email address.',
          });
        }
        dbUserFound = true;
        const u = rows[0];

        // 1. Try querying Teachers table by user_id
        const { rows: tRows } = await db.query(
          'SELECT first_name, last_name FROM teachers WHERE user_id = $1 LIMIT 1',
          [u.user_id]
        );
        if (tRows && tRows.length > 0 && tRows[0].first_name) {
          userFullName = `${tRows[0].first_name} ${tRows[0].last_name || ''}`.trim();
        }

        // 2. Try querying Students table by user_id if not found
        if (!userFullName) {
          const { rows: sRows } = await db.query(
            'SELECT first_name, last_name FROM students WHERE user_id = $1 LIMIT 1',
            [u.user_id]
          );
          if (sRows && sRows.length > 0 && sRows[0].first_name) {
            userFullName = `${sRows[0].first_name} ${sRows[0].last_name || ''}`.trim();
          }
        }

        // 3. Try querying Parents table by user_id if not found
        if (!userFullName) {
          const { rows: pRows } = await db.query(
            'SELECT parent_name FROM parents WHERE user_id = $1 LIMIT 1',
            [u.user_id]
          );
          if (pRows && pRows.length > 0 && pRows[0].parent_name) {
            userFullName = pRows[0].parent_name.trim();
          }
        }

        // 4. Try querying Account Requests table by email if not found
        if (!userFullName) {
          const { rows: reqRows } = await db.query(
            'SELECT first_name, last_name FROM account_requests WHERE LOWER(email) = $1 LIMIT 1',
            [cleanEmail]
          );
          if (reqRows && reqRows.length > 0 && reqRows[0].first_name) {
            userFullName = `${reqRows[0].first_name} ${reqRows[0].last_name || ''}`.trim();
          }
        }
      } catch (dbErr) {
        console.warn('Forgot password DB check notice:', dbErr.message);
      }
    }

    // Rate Limiting: 60-second cooldown & Max 3 resends per hour check
    const existingRecord = RESET_CODES.get(cleanEmail);
    if (existingRecord) {
      // Check max 3 resend attempts per hour first
      const currentResends = existingRecord.resendCount || 1;
      const hourlyElapsed = Date.now() - (existingRecord.firstSentAt || existingRecord.lastSentAt || Date.now());

      if (currentResends >= 3 && hourlyElapsed < 3600000) {
        const remainingMins = Math.ceil((3600000 - hourlyElapsed) / 60000);
        return res.status(429).json({
          success: false,
          error: `Maximum resend limit (3) reached. Please wait ${remainingMins} minute${remainingMins > 1 ? 's' : ''} before requesting a new code.`,
          maxResendsExceeded: true,
          resendCount: currentResends,
        });
      }

      if (existingRecord.lastSentAt) {
        const elapsed = Date.now() - existingRecord.lastSentAt;
        if (elapsed < 60000) {
          const remainingSecs = Math.ceil((60000 - elapsed) / 1000);
          return res.status(429).json({
            success: false,
            error: `Please wait ${remainingSecs} seconds before requesting a new code.`,
            cooldownSeconds: remainingSecs,
            resendCount: currentResends,
          });
        }
      }
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const prevResendCount = existingRecord ? (existingRecord.resendCount || 0) : 0;
    const firstSentAt = existingRecord && existingRecord.firstSentAt ? existingRecord.firstSentAt : Date.now();

    // Update IP request count
    ipData.count += 1;
    IP_REQUEST_LOG.set(clientIp, ipData);

    // Store in-memory with 10 minute expiration and 5 max verification attempts
    RESET_CODES.set(cleanEmail, {
      code: resetCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      lastSentAt: Date.now(),
      firstSentAt: firstSentAt,
      resendCount: prevResendCount + 1,
      attempts: 0,
      verified: false,
    });

    // Dispatch real email via Resend if actual API key is provided
    if (
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.startsWith('re_') &&
      process.env.RESEND_API_KEY !== 're_your_resend_api_key_here'
    ) {
      try {
        sendPasswordResetEmail({
          toEmail: cleanEmail,
          fullName: userFullName || cleanEmail.split('@')[0],
          resetCode,
        });
      } catch (resendErr) {
        console.warn('Resend email error:', resendErr.message);
      }
    }

    return res.json({
      success: true,
      email: cleanEmail,
      message: 'Password reset code sent to registered email address.',
      cooldownSeconds: 60,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to process forgot password.' });
  }
}

/**
 * Get active password reset status (cooldown, remaining attempts, resend count)
 */
async function getResetStatus(req, res) {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email parameter is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const record = RESET_CODES.get(cleanEmail);

    if (!record) {
      return res.json({
        success: true,
        active: false,
        cooldownSeconds: 0,
        resendCount: 0,
        maxResendsExceeded: false,
      });
    }

    const elapsed = record.lastSentAt ? (Date.now() - record.lastSentAt) : 60000;
    const remainingSecs = elapsed < 60000 ? Math.ceil((60000 - elapsed) / 1000) : 0;

    const resendCount = record.resendCount || 1;
    const hourlyElapsed = Date.now() - (record.firstSentAt || record.lastSentAt || Date.now());
    const maxResendsExceeded = resendCount >= 3 && hourlyElapsed < 3600000;

    return res.json({
      success: true,
      active: true,
      cooldownSeconds: remainingSecs,
      resendCount: resendCount,
      maxResendsExceeded: maxResendsExceeded,
      remainingAttempts: 5 - (record.attempts || 0),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch reset status.' });
  }
}

/**
 * Verify reset code handler — Validates entered 6-digit code with max 5 attempts
 */
async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification code are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const record = RESET_CODES.get(cleanEmail);

    if (!record || record.codeInvalidated) {
      return res.status(400).json({
        success: false,
        error: 'No active verification code found for this email. Please request a new code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      record.codeInvalidated = true;
      RESET_CODES.set(cleanEmail, record);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new code.',
      });
    }

    // Increment failed attempts
    if (record.code !== cleanCode) {
      record.attempts = (record.attempts || 0) + 1;
      
      if (record.attempts >= 5) {
        record.codeInvalidated = true;
        RESET_CODES.set(cleanEmail, record);
        return res.status(400).json({
          success: false,
          error: 'Maximum verification attempts (5) exceeded. Please request a new code.',
          maxAttemptsExceeded: true,
        });
      }

      const remainingAttempts = 5 - record.attempts;
      RESET_CODES.set(cleanEmail, record);

      return res.status(400).json({
        success: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`,
        remainingAttempts,
      });
    }

    // Mark code as verified
    record.verified = true;
    RESET_CODES.set(cleanEmail, record);

    return res.json({
      success: true,
      message: 'Verification code confirmed.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to verify reset code.' });
  }
}

/**
 * Invalidate active reset session when user navigates back to /forgot-password
 */
async function invalidateResetSession(req, res) {
  try {
    const { email } = req.body;
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const record = RESET_CODES.get(cleanEmail);
      if (record) {
        record.codeInvalidated = true;
        record.verified = false;
        record.code = null;
        RESET_CODES.set(cleanEmail, record);
      }
    }
    return res.json({ success: true, message: 'Reset session invalidated.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to invalidate reset session.' });
  }
}

/**
 * Reset password handler — Updates password_hash in PostgreSQL database
 */
async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password is required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.',
      });
    }

    const cleanPass = newPassword.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    if (cleanEmail) {
      const record = RESET_CODES.get(cleanEmail);
      if (!record || record.codeInvalidated || !record.verified || (record.code && record.code !== code)) {
        return res.status(400).json({
          success: false,
          error: 'Verification session expired or already used. Please request a new code.',
        });
      }
      
      // Permanently invalidate code session and reset resend count after successful password update
      record.codeInvalidated = true;
      record.verified = false;
      record.code = null;
      record.resendCount = 0;
      record.firstSentAt = null;
      RESET_CODES.set(cleanEmail, record);
    }

    // Update database password_hash if email is provided
    if (cleanEmail && process.env.DATABASE_URL) {
      try {
        const hashedPassword = hashPassword(cleanPass);
        await db.query(
          'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = $2',
          [hashedPassword, cleanEmail]
        );

        // Audit Log & Notification for Password Reset
        try {
          await db.query(
            `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
             VALUES ('109283', NULL, 'PASSWORD_RESET', $1, $2)`,
            [
              `Password reset completed via email verification code for ${cleanEmail}.`,
              req.ip || req.headers['x-forwarded-for'] || null,
            ]
          );

          await db.query(
            `INSERT INTO notifications (school_id, title, message, notification_type)
             VALUES ('109283', $1, $2, 'system')`,
            [
              `Password Reset Completed: ${cleanEmail}`,
              `Password reset was performed for ${cleanEmail}.`,
            ]
          );
        } catch (nErr) {
          console.warn('Reset password audit notice:', nErr.message);
        }
      } catch (dbErr) {
        console.warn('Reset password DB update notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Password updated successfully. You can now log in with your new password.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
}

/**
 * Register account in live DB
 */
async function register(req, res) {
  try {
    const { username, name, email, role, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    if (process.env.DATABASE_URL) {
      const insertQuery = `
        INSERT INTO users (email, password_hash, role, status)
        VALUES ($1, $2, $3, 'active')
        RETURNING user_id, email, role, created_at;
      `;
      const { rows } = await db.query(insertQuery, [email.trim().toLowerCase(), password.trim(), role || 'teacher']);
      if (rows && rows.length > 0) {
        return res.status(201).json({
          success: true,
          message: 'User account created in PostgreSQL database.',
          user: rows[0],
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'User account registered.',
      user: { email, role: role || 'teacher' },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create user account.' });
  }
}

/**
 * Contact Admin Request Handler — Saves activation request in DB & sends Resend notification to School Admin
 */
async function contactAdmin(req, res) {
  try {
    const { schoolId, teacherNo, firstName, middleName, lastName, sex, email, contactNumber, gradeSubject } = req.body;

    if (!schoolId || !firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        error: 'School ID, First Name, Last Name, and Email are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSchoolId = schoolId.trim();
    const cleanTeacherNo = teacherNo ? teacherNo.trim() : null;
    const cleanFirstName = firstName.trim();
    const cleanMiddleName = middleName ? middleName.trim() : null;
    const cleanLastName = lastName.trim();
    const cleanSex = sex || 'Male';
    const computedFullName = [cleanFirstName, cleanMiddleName, cleanLastName].filter(Boolean).join(' ');

    // 1. Verify if user already has an active account
    if (process.env.DATABASE_URL) {
      try {
        const { rows: existingUser } = await db.query(
          'SELECT user_id FROM users WHERE LOWER(email) = $1 LIMIT 1',
          [cleanEmail]
        );
        if (existingUser && existingUser.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'An account with this email address already exists. Please log in or reset your password.',
          });
        }

        // Save request in account_requests table
        await db.query(
          `INSERT INTO account_requests (school_id, teacher_no, first_name, middle_name, last_name, sex, email)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            cleanSchoolId,
            cleanTeacherNo,
            cleanFirstName,
            cleanMiddleName,
            cleanLastName,
            cleanSex,
            cleanEmail,
          ]
        );
      } catch (dbErr) {
        console.warn('Account request DB notice:', dbErr.message);
      }
    }

    // 2. Fetch Admin Email & User ID for this school
    let adminEmail = 'admin@gmail.com';
    let adminUserId = null;

    if (process.env.DATABASE_URL) {
      try {
        const { rows: adminUserRows } = await db.query(
          `SELECT user_id, email FROM users WHERE school_id = $1 AND role = 'admin' LIMIT 1`,
          [cleanSchoolId]
        );
        if (adminUserRows && adminUserRows.length > 0) {
          adminUserId = adminUserRows[0].user_id;
          if (adminUserRows[0].email) {
            adminEmail = adminUserRows[0].email;
          }
        }

        if (adminEmail === 'admin@gmail.com') {
          const { rows: schoolRows } = await db.query(
            'SELECT official_email FROM schools WHERE school_id = $1 LIMIT 1',
            [cleanSchoolId]
          );
          if (schoolRows && schoolRows.length > 0 && schoolRows[0].official_email) {
            adminEmail = schoolRows[0].official_email;
          }
        }

        // Create in-app notification record for Admin
        await db.query(
          `INSERT INTO notifications (school_id, user_id, title, message, notification_type)
           VALUES ($1, $2, $3, $4, 'account_request')`,
          [
            cleanSchoolId,
            adminUserId,
            `New Account Request from ${computedFullName}`,
            `${computedFullName} (${cleanEmail}) requested teacher account activation for School ID ${cleanSchoolId}.`
          ]
        );
      } catch (e) {
        console.warn('Admin email resolution notice:', e.message);
      }
    }

    // 3. Dispatch Resend notification email to School Admin
    sendTeacherAccountRequestEmail({
      adminEmail,
      computedFullName,
      cleanTeacherNo,
      cleanSex,
      cleanEmail,
      cleanSchoolId,
    });

    return res.json({
      success: true,
      message: 'Account request submitted successfully. The school admin will review your request.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to submit account request.' });
  }
}

/**
 * POST /api/auth/change-password — Update password for mandatory initial reset
 */
async function changePassword(req, res) {
  try {
    const { newPassword } = req.body;
    const userId = req.user?.id || req.user?.user_id;
    const userEmail = req.user?.email || req.user?.username;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      });
    }

    const cleanNewPass = newPassword.trim();

    if (process.env.DATABASE_URL) {
      try {
        const hashedPassword = hashPassword(cleanNewPass);
        await db.query(
          `UPDATE users 
           SET password_hash = $1, 
               must_change_password = false, 
               updated_at = CURRENT_TIMESTAMP 
           WHERE user_id::text = $2 OR LOWER(email) = LOWER($3)`,
          [hashedPassword, userId || '', userEmail || '']
        );

        // Audit Log & Notification for Password Change
        try {
          const schoolId = req.user?.schoolId || req.user?.school_id || '109283';
          const actualUserId = req.user?.userId || req.user?.user_id || req.user?.id;

          await db.query(
            `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
             VALUES ($1, $2, 'CHANGE_PASSWORD', $3, $4)`,
            [
              schoolId,
              actualUserId || null,
              `User ${userEmail || 'Account'} updated account password.`,
              req.ip || req.headers['x-forwarded-for'] || null,
            ]
          );

          await db.query(
            `INSERT INTO notifications (school_id, user_id, title, message, notification_type)
             VALUES ($1, $2, $3, $4, 'system')`,
            [
              schoolId,
              actualUserId || null,
              `Password Updated`,
              `Account password for ${userEmail || 'User'} was updated successfully.`,
            ]
          );
        } catch (nErr) {
          console.warn('Change password audit notice:', nErr.message);
        }
      } catch (dbErr) {
        console.warn('DB change password notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Password updated successfully! You may now access your portal.',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ success: false, error: 'Failed to update password.' });
  }
}

module.exports = {
  login,
  getMe,
  logout,
  contactAdmin,
  forgotPassword,
  getResetStatus,
  verifyResetCode,
  invalidateResetSession,
  resetPassword,
  changePassword,
  register,
};
