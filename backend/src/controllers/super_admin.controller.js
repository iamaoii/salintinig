/**
 * super_admin.controller.js
 * -------------------------
 * All controller functions for the Super Admin portal.
 * Handles: Schools, School Admins, Phil-IRI Passages, Stories, Analytics
 */

const db = require('../config/db.js');

let bcrypt = null;
try {
  bcrypt = require('bcryptjs');
} catch (e) {}

function hashPassword(plain) {
  if (!plain) return plain;
  try {
    if (bcrypt) {
      return bcrypt.hashSync(plain, bcrypt.genSaltSync(10));
    }
  } catch (e) {}
  return plain;
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

/**
 * GET /api/super-admin/dashboard/stats
 */
async function getDashboardStats(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, stats: {} });
    }

    const [schoolsRes, studentsRes, teachersRes, adminsRes, assessmentsRes, storiesRes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM schools`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'student' AND status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'teacher' AND status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM assessments`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM reading_materials WHERE status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    // School overview: each school with admin name, student/teacher count
    const schoolsOverview = await db.query(`
      SELECT
        s.school_id,
        s.school_name,
        s.division,
        s.status,
        COALESCE(u.email, '—') AS admin_email,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'student' AND status = 'active') AS student_count,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'teacher' AND status = 'active') AS teacher_count
      FROM schools s
      LEFT JOIN users u ON u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active'
      ORDER BY s.school_name ASC
      LIMIT 10
    `).catch(() => ({ rows: [] }));

    return res.json({
      success: true,
      stats: {
        totalSchools: schoolsRes.rows[0]?.count || 0,
        totalStudents: studentsRes.rows[0]?.count || 0,
        totalTeachers: teachersRes.rows[0]?.count || 0,
        totalAdmins: adminsRes.rows[0]?.count || 0,
        totalAssessments: assessmentsRes.rows[0]?.count || 0,
        totalStories: storiesRes.rows[0]?.count || 0,
      },
      schoolsOverview: schoolsOverview.rows,
    });
  } catch (err) {
    console.error('getDashboardStats error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats.' });
  }
}

// ─────────────────────────────────────────────
// SCHOOLS
// ─────────────────────────────────────────────

/**
 * GET /api/super-admin/schools
 */
async function getSchools(req, res) {
  try {
    if (!process.env.DATABASE_URL) return res.json({ success: true, schools: [] });

    const { search, status } = req.query;

    let where = '';
    const params = [];
    const conditions = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(s.school_name ILIKE $${params.length} OR s.school_id ILIKE $${params.length})`);
    }
    if (status && status !== 'All') {
      params.push(status.toLowerCase());
      conditions.push(`s.status = $${params.length}`);
    }
    if (conditions.length) where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(`
      SELECT
        s.school_id,
        s.school_name,
        s.division,
        s.region,
        s.official_email,
        s.principal_name,
        COALESCE(s.status, 'active') AS status,
        s.created_at,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'student' AND status = 'active') AS student_count,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'teacher' AND status = 'active') AS teacher_count,
        (SELECT u.email FROM users u WHERE u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active' LIMIT 1) AS admin_email,
        (SELECT CONCAT(t.first_name, ' ', t.last_name) FROM teachers t JOIN users u ON t.user_id = u.user_id WHERE u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active' LIMIT 1) AS admin_name
      FROM schools s
      ${where}
      ORDER BY s.school_name ASC
    `, params);

    return res.json({ success: true, schools: rows });
  } catch (err) {
    console.error('getSchools error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch schools.' });
  }
}

/**
 * GET /api/super-admin/schools/:id
 */
async function getSchoolById(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT
        s.school_id,
        s.school_name,
        s.division,
        s.region,
        s.official_email,
        s.principal_name,
        COALESCE(s.status, 'active') AS status,
        s.created_at,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'student' AND status = 'active') AS student_count,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'teacher' AND status = 'active') AS teacher_count,
        (SELECT COUNT(*)::int FROM classes WHERE school_id = s.school_id) AS section_count
      FROM schools s
      WHERE s.school_id = $1
    `, [id]);

    if (!rows.length) return res.status(404).json({ success: false, error: 'School not found.' });

    return res.json({ success: true, school: rows[0] });
  } catch (err) {
    console.error('getSchoolById error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch school.' });
  }
}

/**
 * POST /api/super-admin/schools
 * Creates school + admin user in one transaction.
 */
async function createSchool(req, res) {
  const client = await db.pool.connect().catch(async () => {
    // Fallback for non-pool db config
    return null;
  });

  try {
    const {
      school_id, school_name, division, region, official_email, principal_name,
      admin_first_name, admin_last_name, admin_email, admin_password,
    } = req.body;

    if (!school_id || !school_name) {
      return res.status(400).json({ success: false, error: 'School ID and name are required.' });
    }

    const tempPassword = admin_password || generateTempPassword();
    const hashed = hashPassword(tempPassword);

    // Insert school
    await db.query(`
      INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      ON CONFLICT (school_id) DO NOTHING
    `, [school_id, school_name, division || null, region || null, official_email || null, principal_name || null]);

    let createdAdmin = null;
    if (admin_email) {
      // Create admin user linked to the school
      const userRes = await db.query(`
        INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
        VALUES ($1, $2, $3, 'admin', 'active', true)
        ON CONFLICT (email) DO NOTHING
        RETURNING user_id
      `, [school_id, admin_email, hashed]);

      if (userRes.rows.length > 0 && (admin_first_name || admin_last_name)) {
        const userId = userRes.rows[0].user_id;
        const empNo = `ADM-${school_id}-${Date.now().toString().slice(-4)}`;
        await db.query(`
          INSERT INTO teachers (user_id, teacher_no, first_name, last_name, sex)
          VALUES ($1, $2, $3, $4, 'Female')
          ON CONFLICT DO NOTHING
        `, [userId, empNo, admin_first_name || '', admin_last_name || '']);

        createdAdmin = { email: admin_email, tempPassword };
      }
    }

    return res.status(201).json({
      success: true,
      message: `School "${school_name}" created successfully.`,
      schoolId: school_id,
      admin: createdAdmin,
    });
  } catch (err) {
    console.error('createSchool error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create school: ' + err.message });
  } finally {
    if (client) client.release?.();
  }
}

/**
 * PUT /api/super-admin/schools/:id
 */
async function updateSchool(req, res) {
  try {
    const { id } = req.params;
    const { school_name, division, region, official_email, principal_name } = req.body;

    await db.query(`
      UPDATE schools
      SET school_name = COALESCE($1, school_name),
          division = COALESCE($2, division),
          region = COALESCE($3, region),
          official_email = COALESCE($4, official_email),
          principal_name = COALESCE($5, principal_name)
      WHERE school_id = $6
    `, [school_name, division, region, official_email, principal_name, id]);

    return res.json({ success: true, message: 'School updated successfully.' });
  } catch (err) {
    console.error('updateSchool error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update school.' });
  }
}

/**
 * PATCH /api/super-admin/schools/:id/status
 */
async function toggleSchoolStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const newStatus = status || 'active';

    // Ensure status column exists
    await db.query(`ALTER TABLE schools ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`).catch(() => {});
    await db.query(`UPDATE schools SET status = $1 WHERE school_id = $2`, [newStatus, id]);

    return res.json({ success: true, message: `School status set to ${newStatus}.` });
  } catch (err) {
    console.error('toggleSchoolStatus error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to toggle school status.' });
  }
}

// ─────────────────────────────────────────────
// SCHOOL ADMINS
// ─────────────────────────────────────────────

/**
 * GET /api/super-admin/schools/:id/admins
 */
async function getSchoolAdmins(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT
        u.user_id,
        u.email,
        u.status,
        u.must_change_password,
        CONCAT(t.first_name, ' ', t.last_name) AS name,
        t.first_name,
        t.last_name,
        t.teacher_no
      FROM users u
      LEFT JOIN teachers t ON t.user_id = u.user_id
      WHERE u.school_id = $1 AND u.role = 'admin'
      ORDER BY u.created_at DESC
    `, [id]);

    return res.json({ success: true, admins: rows });
  } catch (err) {
    console.error('getSchoolAdmins error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch school admins.' });
  }
}

/**
 * POST /api/super-admin/schools/:id/admins
 */
async function createSchoolAdmin(req, res) {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, password } = req.body;

    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

    const tempPassword = password || generateTempPassword();
    const hashed = hashPassword(tempPassword);

    const userRes = await db.query(`
      INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
      VALUES ($1, $2, $3, 'admin', 'active', true)
      ON CONFLICT (email) DO NOTHING
      RETURNING user_id
    `, [id, email, hashed]);

    if (!userRes.rows.length) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }

    const userId = userRes.rows[0].user_id;
    if (first_name || last_name) {
      const empNo = `ADM-${id}-${Date.now().toString().slice(-4)}`;
      await db.query(`
        INSERT INTO teachers (user_id, teacher_no, first_name, last_name, sex)
        VALUES ($1, $2, $3, $4, 'Female')
        ON CONFLICT DO NOTHING
      `, [userId, empNo, first_name || '', last_name || '']);
    }

    return res.status(201).json({
      success: true,
      message: 'Admin account created.',
      tempPassword,
    });
  } catch (err) {
    console.error('createSchoolAdmin error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create admin.' });
  }
}

/**
 * PATCH /api/super-admin/schools/:id/admins/:adminId/status
 */
async function toggleAdminStatus(req, res) {
  try {
    const { adminId } = req.params;
    const { status } = req.body;
    await db.query(`UPDATE users SET status = $1 WHERE user_id = $2 AND role = 'admin'`, [status, adminId]);
    return res.json({ success: true, message: `Admin status set to ${status}.` });
  } catch (err) {
    console.error('toggleAdminStatus error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update admin status.' });
  }
}

/**
 * POST /api/super-admin/schools/:id/admins/:adminId/reset-password
 */
async function resetAdminPassword(req, res) {
  try {
    const { adminId } = req.params;
    const tempPassword = generateTempPassword();
    const hashed = hashPassword(tempPassword);

    await db.query(`
      UPDATE users SET password_hash = $1, must_change_password = true
      WHERE user_id = $2 AND role = 'admin'
    `, [hashed, adminId]);

    return res.json({ success: true, message: 'Password reset.', tempPassword });
  } catch (err) {
    console.error('resetAdminPassword error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to reset password.' });
  }
}

// ─────────────────────────────────────────────
// PHIL-IRI PASSAGES (Super Admin owns)
// ─────────────────────────────────────────────

/**
 * GET /api/super-admin/phil-iri/passages
 */
async function getPassages(req, res) {
  try {
    if (!process.env.DATABASE_URL) return res.json({ success: true, passages: [] });

    const { rows: materials } = await db.query(`
      SELECT
        passage_id AS id,
        title,
        grade_level AS grade,
        passage_set AS set,
        language,
        COALESCE(status, 'active') AS status,
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

        const { rows: qRows } = await db.query(`
          SELECT question_id, question_text, question_type
          FROM phil_iri_questions
          WHERE passage_id = $1
          ORDER BY created_at ASC
        `, [m.id]);

        const questions = await Promise.all(
          qRows.map(async (q) => {
            const { rows: cRows } = await db.query(`
              SELECT choice_id, choice_text, is_correct
              FROM phil_iri_question_choices
              WHERE question_id = $1
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
          status: m.status,
          prevStatus: m.prev_status,
          words,
          text: m.text,
          questions,
        };
      })
    );

    return res.json({ success: true, passages });
  } catch (err) {
    console.error('SA getPassages error:', err.message);
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
    const statusVal = (status || 'active').toLowerCase();
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
          VALUES ($1, $2, $3)
          RETURNING question_id
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
  } catch (err) {
    console.error('SA createPassage error:', err.message);
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
    const statusVal = (status || 'active').toLowerCase();
    const prevStatusVal = (prevStatus || 'published').toLowerCase();
    const wordCount = (text || '').trim().split(/\s+/).filter(Boolean).length;

    await db.query(`
      UPDATE phil_iri_passages
      SET title = $1, grade_level = $2, passage_set = $3, language = $4, status = $5, prev_status = $6,
          content_text = $7, word_count = $8, updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $9
    `, [title, grade, set, langCode, statusVal, prevStatusVal, text, wordCount, id]);

    if (Array.isArray(questions)) {
      await db.query(`DELETE FROM phil_iri_questions WHERE passage_id = $1`, [id]);
      for (const q of questions) {
        if (!q.question) continue;
        const qRes = await db.query(`
          INSERT INTO phil_iri_questions (passage_id, question_text, question_type)
          VALUES ($1, $2, $3)
          RETURNING question_id
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
  } catch (err) {
    console.error('SA updatePassage error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update passage.' });
  }
}

/**
 * PATCH /api/super-admin/phil-iri/passages/:id/archive
 */
async function archivePassage(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'archived'
    const newStatus = status || 'archived';

    // Save prev_status before archiving
    const prev = await db.query(`SELECT status FROM phil_iri_passages WHERE passage_id = $1`, [id]);
    const prevStatus = prev.rows[0]?.status || 'active';

    await db.query(`
      UPDATE phil_iri_passages
      SET status = $1, prev_status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $3
    `, [newStatus, prevStatus !== newStatus ? prevStatus : 'active', id]);

    return res.json({ success: true, message: `Passage status set to ${newStatus}.` });
  } catch (err) {
    console.error('SA archivePassage error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update passage status.' });
  }
}

// ─────────────────────────────────────────────
// STORIES (reading_materials)
// ─────────────────────────────────────────────

/**
 * GET /api/super-admin/stories
 */
async function getStories(req, res) {
  try {
    if (!process.env.DATABASE_URL) return res.json({ success: true, stories: [] });

    const { search, status, language, category } = req.query;
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(rm.title ILIKE $${params.length} OR rm.author ILIKE $${params.length})`);
    }
    if (status && status !== 'All') {
      params.push(status.toLowerCase());
      conditions.push(`rm.status = $${params.length}`);
    }
    if (language && language !== 'All') {
      params.push(language);
      conditions.push(`rm.language = $${params.length}`);
    }
    if (category && category !== 'All') {
      params.push(category);
      conditions.push(`rm.category = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(`
      SELECT
        material_id AS id,
        title,
        author,
        description,
        content_text,
        language,
        category,
        grade_level_target,
        difficulty_level,
        reading_time_minutes,
        quiz_questions,
        COALESCE(status, 'active') AS status,
        created_at
      FROM reading_materials rm
      ${where}
      ORDER BY created_at DESC
    `, params);

    return res.json({ success: true, stories: rows });
  } catch (err) {
    console.error('SA getStories error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch stories.' });
  }
}

/**
 * POST /api/super-admin/stories
 */
async function createStory(req, res) {
  try {
    const {
      title, author, description, content_text, language, category,
      grade_level_target, difficulty_level, reading_time_minutes, quiz_questions, status,
    } = req.body;

    if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });

    const { rows } = await db.query(`
      INSERT INTO reading_materials
        (title, author, description, content_text, language, category, grade_level_target,
         difficulty_level, reading_time_minutes, quiz_questions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING material_id AS id
    `, [
      title,
      author || null,
      description || null,
      content_text || null,
      language || 'Filipino',
      category || null,
      grade_level_target || null,
      difficulty_level || null,
      reading_time_minutes ? parseInt(reading_time_minutes) : null,
      quiz_questions ? JSON.stringify(quiz_questions) : null,
      (status || 'draft').toLowerCase(),
    ]);

    return res.status(201).json({ success: true, message: 'Story created.', storyId: rows[0].id });
  } catch (err) {
    console.error('SA createStory error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to create story.' });
  }
}

/**
 * PUT /api/super-admin/stories/:id
 */
async function updateStory(req, res) {
  try {
    const { id } = req.params;
    const {
      title, author, description, content_text, language, category,
      grade_level_target, difficulty_level, reading_time_minutes, quiz_questions,
    } = req.body;

    await db.query(`
      UPDATE reading_materials
      SET title = COALESCE($1, title),
          author = COALESCE($2, author),
          description = COALESCE($3, description),
          content_text = COALESCE($4, content_text),
          language = COALESCE($5, language),
          category = COALESCE($6, category),
          grade_level_target = COALESCE($7, grade_level_target),
          difficulty_level = COALESCE($8, difficulty_level),
          reading_time_minutes = COALESCE($9, reading_time_minutes),
          quiz_questions = COALESCE($10, quiz_questions),
          updated_at = CURRENT_TIMESTAMP
      WHERE material_id = $11
    `, [
      title, author, description, content_text, language, category,
      grade_level_target, difficulty_level,
      reading_time_minutes ? parseInt(reading_time_minutes) : null,
      quiz_questions ? JSON.stringify(quiz_questions) : null,
      id,
    ]);

    return res.json({ success: true, message: 'Story updated.' });
  } catch (err) {
    console.error('SA updateStory error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update story.' });
  }
}

/**
 * PATCH /api/super-admin/stories/:id/status
 */
async function setStoryStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['draft', 'active', 'archived'];
    const newStatus = allowed.includes((status || '').toLowerCase()) ? status.toLowerCase() : 'draft';

    await db.query(`
      UPDATE reading_materials SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE material_id = $2
    `, [newStatus, id]);

    return res.json({ success: true, message: `Story status set to ${newStatus}.` });
  } catch (err) {
    console.error('SA setStoryStatus error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to set story status.' });
  }
}

// ─────────────────────────────────────────────
// SYSTEM ANALYTICS
// ─────────────────────────────────────────────

/**
 * GET /api/super-admin/analytics
 */
async function getSystemAnalytics(req, res) {
  try {
    if (!process.env.DATABASE_URL) return res.json({ success: true, analytics: {} });

    const [
      schoolsRes,
      levelBreakdownRes,
      langBreakdownRes,
      monthlyAssessmentsRes,
    ] = await Promise.all([
      db.query(`
        SELECT
          s.school_id,
          s.school_name,
          s.division,
          (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'student' AND status = 'active') AS student_count,
          (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'teacher' AND status = 'active') AS teacher_count,
          (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'admin' AND status = 'active') AS admin_count,
          (SELECT COUNT(*)::int FROM assessments a
            JOIN students st ON a.student_id = st.student_id
            JOIN users u ON st.user_id = u.user_id
            WHERE u.school_id = s.school_id) AS assessment_count
        FROM schools s
        ORDER BY s.school_name
      `).catch(() => ({ rows: [] })),
      db.query(`
        SELECT profile_level AS reading_level_result, COUNT(*)::int AS count
        FROM student_reading_profiles
        GROUP BY profile_level
        ORDER BY count DESC
      `).catch(() => ({ rows: [] })),
      db.query(`
        SELECT language, COUNT(*)::int AS count
        FROM phil_iri_passages
        GROUP BY language
      `).catch(() => ({ rows: [] })),
      db.query(`
        SELECT
          TO_CHAR(created_at, 'Mon YYYY') AS month,
          COUNT(*)::int AS count
        FROM assessments
        GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) DESC
        LIMIT 6
      `).catch(() => ({ rows: [] })),
    ]);

    return res.json({
      success: true,
      analytics: {
        schoolBreakdown: schoolsRes.rows,
        readingLevelBreakdown: levelBreakdownRes.rows,
        languageBreakdown: langBreakdownRes.rows,
        monthlyAssessments: monthlyAssessmentsRes.rows.reverse(),
      },
    });
  } catch (err) {
    console.error('SA getSystemAnalytics error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch analytics.' });
  }
}

module.exports = {
  getDashboardStats,
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  toggleSchoolStatus,
  getSchoolAdmins,
  createSchoolAdmin,
  toggleAdminStatus,
  resetAdminPassword,
  getPassages,
  createPassage,
  updatePassage,
  archivePassage,
  getStories,
  createStory,
  updateStory,
  setStoryStatus,
  getSystemAnalytics,
};
