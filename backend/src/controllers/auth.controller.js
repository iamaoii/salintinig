const db = require('../config/db.js');
const supabase = require('../config/supabase.js');
const jwt = require('jsonwebtoken');

function createToken(user) {
  const secret = process.env.JWT_SECRET || 'salintinig_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const payload = {
    id: user.id || user.user_id,
    username: user.username || user.email,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId || user.school_id || '109283',
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
          SELECT u.user_id, u.school_id, u.email, u.password_hash, u.role, u.status, s.school_name
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
            SELECT u.user_id, u.school_id, u.email, u.password_hash, u.role, u.status, t.first_name, t.last_name, t.teacher_no
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
      let displayName = matchedUser.email.split('@')[0];
      let schoolId = matchedUser.school_id || '136660';
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
        defaultPath: matchedUser.role === 'admin' ? '/admin/dashboard' : '/dashboard',
        source: 'database',
      };

      const token = createToken(formattedUser);

      return res.json({
        success: true,
        token,
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

    // Check database if user exists
    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await db.query(
          'SELECT user_id, email FROM users WHERE LOWER(email) = $1 LIMIT 1',
          [cleanEmail]
        );
        if (!rows || rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'No account found matching that email address.',
          });
        }
        dbUserFound = true;
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
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'SalinTinig <onboarding@resend.dev>',
          to: cleanEmail,
          subject: `${resetCode} is your SalinTinig Password Reset Code`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f5f0; padding: 48px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e5e0d8; box-shadow: 0 4px 14px rgba(26, 24, 22, 0.04); overflow: hidden;">
                      
                      <!-- Header Blue Accent Bar -->
                      <tr>
                        <td style="background-color: #165fd5; height: 5px;"></td>
                      </tr>

                      <!-- SalinTinig Brand Header (Matching Frontend Font & Colors) -->
                      <tr>
                        <td align="center" style="padding: 32px 36px 20px 36px;">
                          <span style="font-size: 30px; font-weight: 800; color: #1a1816; letter-spacing: -0.6px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                            SalinTinig
                          </span>
                        </td>
                      </tr>

                      <!-- Decorative Divider -->
                      <tr>
                        <td style="padding: 0 36px;">
                          <div style="border-bottom: 1px solid #f0ece1; width: 100%;"></div>
                        </td>
                      </tr>

                      <!-- Main Email Content -->
                      <tr>
                        <td style="padding: 28px 36px 20px 36px; text-align: center;">
                          <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1a1816; line-height: 1.3; font-family: 'Inter', sans-serif;">
                            Password Reset Verification
                          </h1>
                          <p style="margin: 0 0 24px 0; font-size: 15px; color: #6e6a63; line-height: 1.6; font-family: 'Inter', sans-serif;">
                            We received a request to reset your account password for <strong style="color: #1a1816;">${cleanEmail}</strong>. Please enter the verification code below:
                          </p>

                          <!-- Solid Clean Verification Code Container -->
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 24px auto;">
                            <tr>
                              <td align="center" style="background-color: #f4f2ee; border: 1px solid #e0dad0; border-radius: 14px; padding: 22px 16px;">
                                <span style="font-size: 38px; font-weight: 800; color: #165fd5; letter-spacing: 14px; font-family: 'Inter', 'Courier New', monospace; display: block; margin-left: 14px;">
                                  ${resetCode}
                                </span>
                              </td>
                            </tr>
                          </table>

                          <p style="margin: 0 0 18px 0; font-size: 13px; color: #88837a; line-height: 1.5; font-family: 'Inter', sans-serif;">
                            This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
                          </p>
                        </td>
                      </tr>

                      <!-- Footer Notice -->
                      <tr>
                        <td style="background-color: #faf8f4; padding: 20px 36px; border-top: 1px solid #f0ece1; text-align: center;">
                          <p style="margin: 0 0 6px 0; font-size: 12px; color: #88837a; line-height: 1.5; font-family: 'Inter', sans-serif;">
                            If you did not request a password reset, please ignore this email. Your account is completely safe.
                          </p>
                          <p style="margin: 0; font-size: 11px; font-weight: 600; color: #b0aaa0; font-family: 'Inter', sans-serif;">
                            &copy; 2026 SalinTinig. All rights reserved.
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
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
        await db.query(
          'UPDATE users SET password_hash = $1, must_change_password = false, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = $2',
          [cleanPass, cleanEmail]
        );
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
    const { schoolId, fullName, email, contactNumber, gradeSubject } = req.body;

    if (!schoolId || !fullName || !email) {
      return res.status(400).json({
        success: false,
        error: 'School ID, Full Name, and Email are required.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanSchoolId = schoolId.trim();

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
          `INSERT INTO account_requests (school_id, full_name, email, contact_number, grade_subject)
           VALUES ($1, $2, $3, $4, $5)`,
          [cleanSchoolId, fullName.trim(), cleanEmail, contactNumber || null, gradeSubject || null]
        );
      } catch (dbErr) {
        console.warn('Account request DB notice:', dbErr.message);
      }
    }

    // 2. Fetch Admin Email for this school
    let adminEmail = 'admin@gmail.com';
    if (process.env.DATABASE_URL) {
      try {
        const { rows: schoolRows } = await db.query(
          'SELECT official_email FROM schools WHERE school_id = $1 LIMIT 1',
          [cleanSchoolId]
        );
        if (schoolRows && schoolRows.length > 0 && schoolRows[0].official_email) {
          adminEmail = schoolRows[0].official_email;
        }
      } catch (e) {}
    }

    // 3. Dispatch Resend notification email to School Admin
    if (
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.startsWith('re_') &&
      process.env.RESEND_API_KEY !== 're_your_resend_api_key_here'
    ) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'SalinTinig <onboarding@resend.dev>',
          to: adminEmail,
          subject: `New Teacher Activation Request from ${fullName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f5f0; padding: 48px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e5e0d8; box-shadow: 0 4px 14px rgba(26, 24, 22, 0.04); overflow: hidden;">
                      <tr>
                        <td style="background-color: #165fd5; height: 5px;"></td>
                      </tr>
                      <tr>
                        <td align="center" style="padding: 32px 36px 20px 36px;">
                          <span style="font-size: 30px; font-weight: 800; color: #1a1816; letter-spacing: -0.6px;">SalinTinig</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 36px;"><div style="border-bottom: 1px solid #f0ece1; width: 100%;"></div></td>
                      </tr>
                      <tr>
                        <td style="padding: 28px 36px 20px 36px;">
                          <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1a1816;">New Teacher Account Request</h1>
                          <p style="margin: 0 0 20px 0; font-size: 15px; color: #6e6a63; line-height: 1.6;">A teacher has submitted an account activation request for School ID <strong>${cleanSchoolId}</strong>:</p>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f2ee; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
                            <tr><td style="padding: 6px 0; font-size: 14px; color: #1a1816;"><strong>Full Name:</strong> ${fullName}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 14px; color: #1a1816;"><strong>Email:</strong> ${cleanEmail}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 14px; color: #1a1816;"><strong>Contact Number:</strong> ${contactNumber || 'N/A'}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 14px; color: #1a1816;"><strong>Grade / Subject:</strong> ${gradeSubject || 'N/A'}</td></tr>
                          </table>
                          <p style="margin: 0 0 18px 0; font-size: 14px; color: #6e6a63;">Log in to your Admin Dashboard to review and approve this request.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background-color: #faf8f4; padding: 20px 36px; border-top: 1px solid #f0ece1; text-align: center;">
                          <p style="margin: 0; font-size: 11px; font-weight: 600; color: #b0aaa0;">&copy; 2026 SalinTinig. All rights reserved.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        });
      } catch (resendErr) {
        console.warn('Contact Admin email notice:', resendErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Account request submitted successfully. The school admin will review your request.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to submit account request.' });
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
  register,
};
