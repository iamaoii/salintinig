/**
 * SalinTinig — Super Admin Controller
 *
 * Handles system-wide management: schools, school admins,
 * Phil-IRI passages (archive model), stories (reading_materials),
 * and cross-school analytics.
 */
const db = require('../config/db.js');

let bcrypt = null;
try { bcrypt = require('bcryptjs'); } catch (e) {}

function hashPassword(plain) {
  if (!plain) return plain;
  try {
    if (bcrypt) {
      const salt = bcrypt.genSaltSync(10);
      return bcrypt.hashSync(plain, salt);
    }
  } catch (e) {}
  return plain;
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let pass = 'SA-';
  for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  return pass;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/dashboard/stats
 * System-wide summary statistics.
 */
async function getDashboardStats(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, stats: { schools: 0, students: 0, teachers: 0, admins: 0, passages: 0, stories: 0 } });
    }

    const [schoolsRes, studentsRes, teachersRes, adminsRes, passagesRes, storiesRes] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM schools`),
      db.query(`SELECT COUNT(*) AS count FROM students s JOIN users u ON s.user_id = u.user_id WHERE u.status != 'disabled'`),
      db.query(`SELECT COUNT(*) AS count FROM teachers t JOIN users u ON t.user_id = u.user_id WHERE u.status != 'disabled'`),
      db.query(`SELECT COUNT(*) AS count FROM users WHERE role = 'admin' AND status = 'active'`),
      db.query(`SELECT COUNT(*) AS count FROM phil_iri_passages WHERE status != 'archived'`),
      db.query(`SELECT COUNT(*) AS count FROM reading_materials WHERE status = 'active'`),
    ]);

    const stats = {
      schools: Number(schoolsRes.rows[0]?.count || 0),
      students: Number(studentsRes.rows[0]?.count || 0),
      teachers: Number(teachersRes.rows[0]?.count || 0),
      admins: Number(adminsRes.rows[0]?.count || 0),
      passages: Number(passagesRes.rows[0]?.count || 0),
      stories: Number(storiesRes.rows[0]?.count || 0),
    };

    // School overview table
    const { rows: schoolRows } = await db.query(`
      SELECT
        s.school_id AS id,
        s.school_name AS name,
        s.division,
        COALESCE(u_admin.email, '') AS admin_email,
        COALESCE(st_count.count, 0)::int AS student_count,
        COALESCE(tc_count.count, 0)::int AS teacher_count,
        COALESCE(s.status, 'active') AS status
      FROM schools s
      LEFT JOIN users u_admin ON u_admin.school_id = s.school_id AND u_admin.role = 'admin' AND u_admin.status = 'active'
      LEFT JOIN (
        SELECT u.school_id, COUNT(st.student_id) AS count
        FROM students st JOIN users u ON st.user_id = u.user_id
        GROUP BY u.school_id
      ) st_count ON st_count.school_id = s.school_id
      LEFT JOIN (
        SELECT u.school_id, COUNT(t.teacher_id) AS count
        FROM teachers t JOIN users u ON t.user_id = u.user_id
        GROUP BY u.school_id
      ) tc_count ON tc_count.school_id = s.school_id
      ORDER BY s.school_name ASC
    `);

    return res.json({ success: true, stats, schoolOverview: schoolRows });
  } catch (error) {
    console.error('[SuperAdmin] getDashboardStats error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats.' });
  }
}

// ── Schools ───────────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/schools
 * List all schools with admin and student/teacher counts.
 */
async function getSchools(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, schools: [] });
    }

    const { rows } = await db.query(`
      SELECT
        s.school_id AS id,
        s.school_name AS name,
        s.division,
        s.region,
        s.official_email AS email,
        s.principal_name AS principal,
        COALESCE(s.status, 'active') AS status,
        TO_CHAR(s.created_at, 'YYYY-MM-DD') AS date_added,
        COALESCE(u_admin.email, '') AS admin_email,
        COALESCE(u_admin.user_id::text, '') AS admin_id,
        COALESCE(u_admin.status, '') AS admin_status,
        COALESCE(st_count.count, 0)::int AS student_count,
        COALESCE(tc_count.count, 0)::int AS teacher_count
      FROM schools s
      LEFT JOIN LATERAL (
        SELECT u.user_id, u.email, u.status
        FROM users u
        WHERE u.school_id = s.school_id AND u.role = 'admin'
        ORDER BY u.created_at ASC
        LIMIT 1
      ) u_admin ON true
      LEFT JOIN (
        SELECT u.school_id, COUNT(st.student_id) AS count
        FROM students st JOIN users u ON st.user_id = u.user_id
        GROUP BY u.school_id
      ) st_count ON st_count.school_id = s.school_id
      LEFT JOIN (
        SELECT u.school_id, COUNT(t.teacher_id) AS count
        FROM teachers t JOIN users u ON t.user_id = u.user_id
        GROUP BY u.school_id
      ) tc_count ON tc_count.school_id = s.school_id
      ORDER BY s.school_name ASC
    `);

    return res.json({ success: true, schools: rows });
  } catch (error) {
    console.error('[SuperAdmin] getSchools error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch schools.' });
  }
}

/**
 * POST /api/super-admin/schools
 * Create a new school + linked admin account in one transaction.
 */
async function createSchool(req, res) {
  const client = await db.pool.connect();
  try {
    const {
      schoolId, schoolName, division, region, officialEmail, principalName,
      adminEmail, adminName, sendWelcomeEmail,
    } = req.body;

    if (!schoolId || !schoolName) {
      return res.status(400).json({ success: false, error: 'School ID and School Name are required.' });
    }
    if (!adminEmail) {
      return res.status(400).json({ success: false, error: 'Admin email is required.' });
    }

    await client.query('BEGIN');

    // Insert school
    await client.query(`
      INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      ON CONFLICT (school_id) DO UPDATE SET
        school_name = EXCLUDED.school_name,
        division = EXCLUDED.division,
        region = EXCLUDED.region,
        official_email = EXCLUDED.official_email,
        principal_name = EXCLUDED.principal_name
    `, [schoolId, schoolName, division || null, region || null, officialEmail || null, principalName || null]);

    // Create admin user account
    const tempPassword = generateTempPassword();
    const passwordHash = hashPassword(tempPassword);

    const { rows: userRows } = await client.query(`
      INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
      VALUES ($1, $2, $3, 'admin', 'active', true)
      ON CONFLICT (email) DO UPDATE SET
        school_id = $1, password_hash = $3, role = 'admin',
        must_change_password = true, status = 'active'
      RETURNING user_id
    `, [schoolId, adminEmail.trim().toLowerCase(), passwordHash]);

    await client.query('COMMIT');

    // Optionally send welcome email (non-blocking)
    if (sendWelcomeEmail !== false) {
      try {
        const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');
        sendWelcomeEmailWithTempPassword({
          toEmail: adminEmail,
          fullName: adminName || 'School Administrator',
          role: 'Admin',
          tempPassword,
          identifier: adminEmail,
        });
      } catch (emailErr) {
        console.warn('[SuperAdmin] Welcome email notice:', emailErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `School "${schoolName}" and Admin account created successfully.`,
      tempPassword,
      adminId: userRows[0]?.user_id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SuperAdmin] createSchool error:', error.message);
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return res.status(409).json({ success: false, error: 'A school with that ID or admin email already exists.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create school.' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/super-admin/schools/:id
 * Get a single school's full details.
 */
async function getSchoolById(req, res) {
  try {
    const { id } = req.params;

    const { rows: schoolRows } = await db.query(`
      SELECT school_id AS id, school_name AS name, division, region,
             official_email AS email, principal_name AS principal,
             COALESCE(status, 'active') AS status,
             TO_CHAR(created_at, 'YYYY-MM-DD') AS date_added
      FROM schools WHERE school_id = $1 LIMIT 1
    `, [id]);

    if (!schoolRows.length) {
      return res.status(404).json({ success: false, error: 'School not found.' });
    }

    // Get admins for this school
    const { rows: adminRows } = await db.query(`
      SELECT user_id AS id, email, status, TO_CHAR(created_at, 'YYYY-MM-DD') AS date_added
      FROM users WHERE school_id = $1 AND role = 'admin'
      ORDER BY created_at ASC
    `, [id]);

    // Get school stats
    const [studentsRes, teachersRes, sectionsRes] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM students s JOIN users u ON s.user_id = u.user_id WHERE u.school_id = $1`, [id]),
      db.query(`SELECT COUNT(*) AS count FROM teachers t JOIN users u ON t.user_id = u.user_id WHERE u.school_id = $1`, [id]),
      db.query(`SELECT COUNT(*) AS count FROM classes c JOIN school_years sy ON c.school_year_id = sy.school_year_id WHERE sy.school_id = $1 AND sy.is_active = true`, [id]),
    ]);

    return res.json({
      success: true,
      school: schoolRows[0],
      admins: adminRows,
      stats: {
        students: Number(studentsRes.rows[0]?.count || 0),
        teachers: Number(teachersRes.rows[0]?.count || 0),
        sections: Number(sectionsRes.rows[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] getSchoolById error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch school details.' });
  }
}

/**
 * PUT /api/super-admin/schools/:id
 * Update school metadata.
 */
async function updateSchool(req, res) {
  try {
    const { id } = req.params;
    const { schoolName, division, region, officialEmail, principalName } = req.body;

    await db.query(`
      UPDATE schools SET
        school_name = COALESCE($1, school_name),
        division = COALESCE($2, division),
        region = COALESCE($3, region),
        official_email = COALESCE($4, official_email),
        principal_name = COALESCE($5, principal_name),
        updated_at = CURRENT_TIMESTAMP
      WHERE school_id = $6
    `, [schoolName || null, division || null, region || null, officialEmail || null, principalName || null, id]);

    return res.json({ success: true, message: 'School updated successfully.' });
  } catch (error) {
    console.error('[SuperAdmin] updateSchool error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to update school.' });
  }
}

/**
 * PATCH /api/super-admin/schools/:id/status
 * Activate or deactivate a school.
 */
async function toggleSchoolStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'inactive'

    await db.query(
      `UPDATE schools SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE school_id = $2`,
      [status || 'inactive', id]
    );

    return res.json({ success: true, message: `School status updated to "${status}".` });
  } catch (error) {
    console.error('[SuperAdmin] toggleSchoolStatus error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to update school status.' });
  }
}

// ── School Admins ─────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/schools/:id/admins
 */
async function getSchoolAdmins(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT user_id AS id, email, status, must_change_password AS "mustChangePassword",
             TO_CHAR(created_at, 'YYYY-MM-DD') AS date_added
      FROM users WHERE school_id = $1 AND role = 'admin'
      ORDER BY created_at ASC
    `, [id]);
    return res.json({ success: true, admins: rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch school admins.' });
  }
}

/**
 * POST /api/super-admin/schools/:id/admins
 * Create an admin account for a school.
 */
async function createSchoolAdmin(req, res) {
  try {
    const { id } = req.params;
    const { adminEmail, adminName, sendWelcomeEmail } = req.body;

    if (!adminEmail) {
      return res.status(400).json({ success: false, error: 'Admin email is required.' });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = hashPassword(tempPassword);

    await db.query(`
      INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
      VALUES ($1, $2, $3, 'admin', 'active', true)
    `, [id, adminEmail.trim().toLowerCase(), passwordHash]);

    if (sendWelcomeEmail !== false) {
      try {
        const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');
        sendWelcomeEmailWithTempPassword({
          toEmail: adminEmail,
          fullName: adminName || 'School Administrator',
          role: 'Admin',
          tempPassword,
          identifier: adminEmail,
        });
      } catch (emailErr) {
        console.warn('[SuperAdmin] createSchoolAdmin email notice:', emailErr.message);
      }
    }

    return res.status(201).json({ success: true, message: 'Admin account created.', tempPassword });
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('duplicate')) {
      return res.status(409).json({ success: false, error: 'An account with that email already exists.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create admin account.' });
  }
}

/**
 * PUT /api/super-admin/schools/:schoolId/admins/:adminId
 */
async function updateSchoolAdmin(req, res) {
  try {
    const { adminId } = req.params;
    const { email } = req.body;

    if (email) {
      await db.query(
        `UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND role = 'admin'`,
        [email.trim().toLowerCase(), adminId]
      );
    }

    return res.json({ success: true, message: 'Admin updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update admin.' });
  }
}

/**
 * PATCH /api/super-admin/schools/:schoolId/admins/:adminId/status
 */
async function toggleAdminStatus(req, res) {
  try {
    const { adminId } = req.params;
    const { status } = req.body;

    await db.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND role = 'admin'`,
      [status || 'disabled', adminId]
    );

    return res.json({ success: true, message: `Admin account ${status}.` });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update admin status.' });
  }
}

/**
 * POST /api/super-admin/schools/:schoolId/admins/:adminId/reset-password
 */
async function resetAdminPassword(req, res) {
  try {
    const { adminId } = req.params;
    const tempPassword = generateTempPassword();
    const passwordHash = hashPassword(tempPassword);

    await db.query(
      `UPDATE users SET password_hash = $1, must_change_password = true, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND role = 'admin'`,
      [passwordHash, adminId]
    );

    return res.json({ success: true, message: 'Password reset successfully.', tempPassword });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reset admin password.' });
  }
}

// ── School Analytics ──────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/schools/:id/analytics
 */
async function getSchoolAnalytics(req, res) {
  try {
    const { id } = req.params;

    const [studentsRes, gradeDist, levelDist] = await Promise.all([
      db.query(`
        SELECT COUNT(*) AS total FROM students s JOIN users u ON s.user_id = u.user_id WHERE u.school_id = $1
      `, [id]),
      db.query(`
        SELECT COALESCE(c.grade_level, 'Unassigned') AS grade, COUNT(*) AS count
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN student_grade_history sgh ON sgh.student_id = s.student_id
        LEFT JOIN classes c ON sgh.class_id = c.class_id
        WHERE u.school_id = $1
        GROUP BY COALESCE(c.grade_level, 'Unassigned')
        ORDER BY grade ASC
      `, [id]),
      db.query(`
        SELECT COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending') AS level, COUNT(*) AS count
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
        LEFT JOIN (
          SELECT DISTINCT ON (student_id) student_id, reading_level_result
          FROM assessments ORDER BY student_id, created_at DESC
        ) a ON a.student_id = s.student_id
        WHERE u.school_id = $1
        GROUP BY COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending')
        ORDER BY count DESC
      `, [id]),
    ]);

    return res.json({
      success: true,
      analytics: {
        totalStudents: Number(studentsRes.rows[0]?.total || 0),
        gradeDistribution: gradeDist.rows,
        readingLevelDistribution: levelDist.rows,
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] getSchoolAnalytics error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch school analytics.' });
  }
}

// ── Phil-IRI Passages ─────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/phil-iri/passages
 * All passages (including archived) for Super Admin management.
 */
async function getPassages(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, passages: [] });
    }

    const { rows: materials } = await db.query(`
      SELECT
        passage_id AS id,
        title,
        grade_level AS grade,
        passage_set AS set,
        language,
        status,
        COALESCE(prev_status, 'published') AS prev_status,
        content_text AS text,
        word_count AS words,
        created_at
      FROM phil_iri_passages
      ORDER BY created_at DESC
    `);

    const passages = await Promise.all(
      materials.map(async (m) => {
        const words = m.words || (m.text || '').trim().split(/\s+/).filter(Boolean).length;
        const langDisplay = m.language === 'en' ? 'English' : m.language === 'fil' ? 'Filipino' : m.language;
        const statusDisplay = (m.status || 'published').charAt(0).toUpperCase() + (m.status || 'published').slice(1);

        const { rows: qRows } = await db.query(`
          SELECT question_id, question_text, question_type
          FROM phil_iri_questions WHERE passage_id = $1 ORDER BY created_at ASC
        `, [m.id]);

        const questions = await Promise.all(
          qRows.map(async (q) => {
            const { rows: cRows } = await db.query(`
              SELECT choice_id, choice_text, is_correct
              FROM phil_iri_question_choices WHERE question_id = $1
            `, [q.question_id]);

            const options = cRows.map((c) => c.choice_text);
            const correctIndex = cRows.findIndex((c) => c.is_correct);
            return {
              id: q.question_id,
              question: q.question_text,
              type: q.question_type || 'Multiple Choice',
              options,
              correctAnswer: correctIndex >= 0 ? correctIndex : 0,
            };
          })
        );

        return {
          id: m.id,
          title: m.title,
          grade: m.grade || 'Grade 4',
          set: m.set || 'Set A',
          language: langDisplay,
          status: statusDisplay,
          prevStatus: (m.prev_status || 'published').charAt(0).toUpperCase() + (m.prev_status || 'published').slice(1),
          words,
          text: m.text,
          questions,
        };
      })
    );

    return res.json({ success: true, passages });
  } catch (error) {
    console.error('[SuperAdmin] getPassages error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch passages.' });
  }
}

/**
 * POST /api/super-admin/phil-iri/passages
 */
async function createPassage(req, res) {
  try {
    const { title, grade, set, language, status, text, questions } = req.body;
    if (!title || !text) {
      return res.status(400).json({ success: false, error: 'Title and content text are required.' });
    }

    const langCode = (language || '').toLowerCase().includes('english') || language === 'en' ? 'en' : 'fil';
    const statusVal = (status || 'published').toLowerCase();
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    const { rows } = await db.query(`
      INSERT INTO phil_iri_passages (title, grade_level, passage_set, language, status, prev_status, content_text, word_count)
      VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
      RETURNING passage_id AS id
    `, [title, grade || 'Grade 4', set || 'Set A', langCode, statusVal, text, wordCount]);

    const passageId = rows[0].id;

    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (!q.question) continue;
        const qRes = await db.query(`
          INSERT INTO phil_iri_questions (passage_id, question_text, question_type)
          VALUES ($1, $2, $3) RETURNING question_id
        `, [passageId, q.question, q.type || 'Multiple Choice']);

        const qId = qRes.rows[0].question_id;
        if (Array.isArray(q.options)) {
          for (let i = 0; i < q.options.length; i++) {
            await db.query(`
              INSERT INTO phil_iri_question_choices (question_id, choice_text, is_correct)
              VALUES ($1, $2, $3)
            `, [qId, q.options[i], i === (Number(q.correctAnswer) || 0)]);
          }
        }
      }
    }

    return res.status(201).json({ success: true, message: 'Passage created successfully.', passageId });
  } catch (error) {
    console.error('[SuperAdmin] createPassage error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to create passage.' });
  }
}

/**
 * PUT /api/super-admin/phil-iri/passages/:id
 */
async function updatePassage(req, res) {
  try {
    const { id } = req.params;
    const { title, grade, set, language, status, prevStatus, text, questions } = req.body;

    const langCode = (language || '').toLowerCase().includes('english') || language === 'en' ? 'en' : 'fil';
    const statusVal = (status || 'published').toLowerCase();
    const prevStatusVal = (prevStatus || 'published').toLowerCase();
    const wordCount = (text || '').trim().split(/\s+/).filter(Boolean).length;

    await db.query(`
      UPDATE phil_iri_passages SET
        title = $1, grade_level = $2, passage_set = $3, language = $4,
        status = $5, prev_status = $6, content_text = $7, word_count = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $9
    `, [title, grade, set, langCode, statusVal, prevStatusVal, text, wordCount, id]);

    if (Array.isArray(questions)) {
      await db.query(`DELETE FROM phil_iri_questions WHERE passage_id = $1`, [id]);
      for (const q of questions) {
        if (!q.question) continue;
        const qRes = await db.query(`
          INSERT INTO phil_iri_questions (passage_id, question_text, question_type)
          VALUES ($1, $2, $3) RETURNING question_id
        `, [id, q.question, q.type || 'Multiple Choice']);

        const qId = qRes.rows[0].question_id;
        if (Array.isArray(q.options)) {
          for (let i = 0; i < q.options.length; i++) {
            await db.query(`
              INSERT INTO phil_iri_question_choices (question_id, choice_text, is_correct)
              VALUES ($1, $2, $3)
            `, [qId, q.options[i], i === (Number(q.correctAnswer) || 0)]);
          }
        }
      }
    }

    return res.json({ success: true, message: 'Passage updated successfully.' });
  } catch (error) {
    console.error('[SuperAdmin] updatePassage error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to update passage.' });
  }
}

/**
 * PATCH /api/super-admin/phil-iri/passages/:id/archive
 * Soft-delete: sets status = 'archived', saves previous status.
 */
async function archivePassage(req, res) {
  try {
    const { id } = req.params;
    await db.query(`
      UPDATE phil_iri_passages
      SET prev_status = status, status = 'archived', updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $1
    `, [id]);
    return res.json({ success: true, message: 'Passage archived.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to archive passage.' });
  }
}

/**
 * PATCH /api/super-admin/phil-iri/passages/:id/restore
 * Restore archived passage to its previous status.
 */
async function restorePassage(req, res) {
  try {
    const { id } = req.params;
    await db.query(`
      UPDATE phil_iri_passages
      SET status = COALESCE(prev_status, 'published'), updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $1
    `, [id]);
    return res.json({ success: true, message: 'Passage restored.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to restore passage.' });
  }
}

// ── Stories (reading_materials) ───────────────────────────────────────────────

/**
 * GET /api/super-admin/stories
 * All stories including draft and archived.
 */
async function getStories(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, stories: [] });
    }

    const { status, language, category, grade } = req.query;
    let conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    if (language) { params.push(language); conditions.push(`language = $${params.length}`); }
    if (category) { params.push(category); conditions.push(`category = $${params.length}`); }
    if (grade) { params.push(grade); conditions.push(`grade_level_target = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(`
      SELECT
        material_id AS id,
        title,
        author,
        description,
        content_text AS "contentText",
        language,
        category,
        grade_level_target AS "gradeLevel",
        difficulty_level AS "difficultyLevel",
        reading_time_minutes AS "readingTimeMinutes",
        quiz_questions AS "quizQuestions",
        status,
        created_at AS "createdAt"
      FROM reading_materials
      ${where}
      ORDER BY created_at DESC
    `, params);

    return res.json({ success: true, stories: rows });
  } catch (error) {
    console.error('[SuperAdmin] getStories error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch stories.' });
  }
}

/**
 * POST /api/super-admin/stories
 */
async function createStory(req, res) {
  try {
    const { title, author, description, contentText, language, category, gradeLevel, difficultyLevel, readingTimeMinutes, quizQuestions, status } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required.' });
    }

    const { rows } = await db.query(`
      INSERT INTO reading_materials
        (title, author, description, content_text, language, category, grade_level_target, difficulty_level, reading_time_minutes, quiz_questions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING material_id AS id
    `, [
      title,
      author || null,
      description || null,
      contentText || null,
      language || 'Filipino',
      category || null,
      gradeLevel || null,
      difficultyLevel || null,
      readingTimeMinutes || null,
      quizQuestions ? JSON.stringify(quizQuestions) : null,
      status || 'draft',
    ]);

    return res.status(201).json({ success: true, message: 'Story created successfully.', storyId: rows[0].id });
  } catch (error) {
    console.error('[SuperAdmin] createStory error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to create story.' });
  }
}

/**
 * PUT /api/super-admin/stories/:id
 */
async function updateStory(req, res) {
  try {
    const { id } = req.params;
    const { title, author, description, contentText, language, category, gradeLevel, difficultyLevel, readingTimeMinutes, quizQuestions, status } = req.body;

    await db.query(`
      UPDATE reading_materials SET
        title = COALESCE($1, title),
        author = COALESCE($2, author),
        description = COALESCE($3, description),
        content_text = COALESCE($4, content_text),
        language = COALESCE($5, language),
        category = COALESCE($6, category),
        grade_level_target = COALESCE($7, grade_level_target),
        difficulty_level = COALESCE($8, difficulty_level),
        reading_time_minutes = COALESCE($9, reading_time_minutes),
        quiz_questions = COALESCE($10, quiz_questions),
        status = COALESCE($11, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE material_id = $12
    `, [
      title || null,
      author || null,
      description || null,
      contentText || null,
      language || null,
      category || null,
      gradeLevel || null,
      difficultyLevel || null,
      readingTimeMinutes || null,
      quizQuestions ? JSON.stringify(quizQuestions) : null,
      status || null,
      id,
    ]);

    return res.json({ success: true, message: 'Story updated successfully.' });
  } catch (error) {
    console.error('[SuperAdmin] updateStory error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to update story.' });
  }
}

/**
 * PATCH /api/super-admin/stories/:id/status
 * Set story status: 'draft' | 'active' | 'archived'
 */
async function setStoryStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be: draft, active, or archived.' });
    }

    await db.query(
      `UPDATE reading_materials SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE material_id = $2`,
      [status, id]
    );

    return res.json({ success: true, message: `Story status set to "${status}".` });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update story status.' });
  }
}

/**
 * DELETE /api/super-admin/stories/:id
 * Hard delete — only for draft stories with no student progress.
 */
async function deleteStory(req, res) {
  try {
    const { id } = req.params;

    // Check if students have any progress on this story
    const { rows: progressRows } = await db.query(
      `SELECT COUNT(*) AS count FROM story_progress WHERE material_id = $1`,
      [id]
    );

    if (Number(progressRows[0]?.count || 0) > 0) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete a story that has student progress. Archive it instead.',
      });
    }

    await db.query(`DELETE FROM reading_materials WHERE material_id = $1`, [id]);
    return res.json({ success: true, message: 'Story deleted.' });
  } catch (error) {
    console.error('[SuperAdmin] deleteStory error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to delete story.' });
  }
}

// ── System Analytics ──────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/analytics
 * System-wide reading analytics aggregated across all schools.
 */
async function getSystemAnalytics(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, analytics: {} });
    }

    const [totalStudents, levelDist, schoolComparison] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM students s JOIN users u ON s.user_id = u.user_id`),
      db.query(`
        SELECT
          COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending') AS level,
          COUNT(*) AS count
        FROM students s
        JOIN users u ON s.user_id = u.user_id
        LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
        LEFT JOIN (
          SELECT DISTINCT ON (student_id) student_id, reading_level_result
          FROM assessments ORDER BY student_id, created_at DESC
        ) a ON a.student_id = s.student_id
        GROUP BY COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending')
        ORDER BY count DESC
      `),
      db.query(`
        SELECT
          s.school_id AS id,
          s.school_name AS name,
          COALESCE(st_count.count, 0)::int AS student_count,
          COALESCE(assess_count.count, 0)::int AS assessment_count,
          CASE
            WHEN COALESCE(st_count.count, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(completed_count.count, 0)::numeric / st_count.count::numeric) * 100)::int
          END AS completion_rate
        FROM schools s
        LEFT JOIN (
          SELECT u.school_id, COUNT(st.student_id) AS count
          FROM students st JOIN users u ON st.user_id = u.user_id
          GROUP BY u.school_id
        ) st_count ON st_count.school_id = s.school_id
        LEFT JOIN (
          SELECT u.school_id, COUNT(a.assessment_id) AS count
          FROM assessments a
          JOIN students st ON a.student_id = st.student_id
          JOIN users u ON st.user_id = u.user_id
          GROUP BY u.school_id
        ) assess_count ON assess_count.school_id = s.school_id
        LEFT JOIN (
          SELECT u.school_id, COUNT(a.assessment_id) AS count
          FROM assessments a
          JOIN students st ON a.student_id = st.student_id
          JOIN users u ON st.user_id = u.user_id
          WHERE a.status = 'completed'
          GROUP BY u.school_id
        ) completed_count ON completed_count.school_id = s.school_id
        ORDER BY s.school_name ASC
      `),
    ]);

    return res.json({
      success: true,
      analytics: {
        totalStudents: Number(totalStudents.rows[0]?.count || 0),
        readingLevelDistribution: levelDist.rows,
        schoolComparison: schoolComparison.rows,
      },
    });
  } catch (error) {
    console.error('[SuperAdmin] getSystemAnalytics error:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch system analytics.' });
  }
}

module.exports = {
  getDashboardStats,
  getSchools,
  createSchool,
  getSchoolById,
  updateSchool,
  toggleSchoolStatus,
  getSchoolAdmins,
  createSchoolAdmin,
  updateSchoolAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  getSchoolAnalytics,
  getPassages,
  createPassage,
  updatePassage,
  archivePassage,
  restorePassage,
  getStories,
  createStory,
  updateStory,
  setStoryStatus,
  deleteStory,
  getSystemAnalytics,
};
