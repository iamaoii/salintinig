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

    const [schoolsRes, studentsRes, teachersRes, adminsRes, assessmentsRes, storiesRes, passagesRes] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS count FROM schools`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'student' AND status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'teacher' AND status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin' AND status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM assessments`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM reading_materials WHERE status = 'active'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM phil_iri_passages`).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    // School overview: each school with admin email, student/teacher count
    const schoolsOverview = await db.query(`
      SELECT
        s.school_id,
        s.school_name,
        s.division,
        s.region,
        COALESCE(s.status, 'active') AS status,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'student' AND status = 'active') AS student_count,
        (SELECT COUNT(*)::int FROM users WHERE school_id = s.school_id AND role = 'teacher' AND status = 'active') AS teacher_count,
        (SELECT u.email FROM users u WHERE u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active' LIMIT 1) AS admin_email,
        (SELECT COALESCE(
          (SELECT CONCAT(t.first_name, ' ', t.last_name) FROM teachers t JOIN users u ON t.user_id = u.user_id WHERE u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active' AND TRIM(t.first_name) != '' AND TRIM(t.first_name) != 'Admin' LIMIT 1),
          (SELECT u.email FROM users u WHERE u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active' LIMIT 1),
          'School Admin'
        )) AS admin_name
      FROM schools s
      ORDER BY s.school_name ASC
      LIMIT 10
    `).catch((err) => {
      console.error('schoolsOverview error:', err.message);
      return { rows: [] };
    });

    return res.json({
      success: true,
      stats: {
        totalSchools: schoolsRes.rows[0]?.count || 0,
        totalStudents: studentsRes.rows[0]?.count || 0,
        totalTeachers: teachersRes.rows[0]?.count || 0,
        totalAdmins: adminsRes.rows[0]?.count || 0,
        totalAssessments: assessmentsRes.rows[0]?.count || 0,
        totalStories: storiesRes.rows[0]?.count || 0,
        totalPassages: passagesRes.rows[0]?.count || 0,
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
        (SELECT COALESCE(
          (SELECT CONCAT(t.first_name, ' ', t.last_name) FROM teachers t JOIN users u ON t.user_id = u.user_id WHERE u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active' AND TRIM(t.first_name) != '' AND TRIM(t.first_name) != 'Admin' LIMIT 1),
          (SELECT u.email FROM users u WHERE u.school_id = s.school_id AND u.role = 'admin' AND u.status = 'active' LIMIT 1),
          'School Admin'
        )) AS admin_name
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

    const [schoolRes, studentsRes, teachersRes, adminsRes, assessmentsRes] = await Promise.all([
      db.query(`
        SELECT
          s.school_id,
          s.school_name,
          s.division,
          s.region,
          s.official_email,
          s.principal_name,
          COALESCE(s.status, 'active') AS status,
          s.created_at
        FROM schools s
        WHERE s.school_id = $1
      `, [id]),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE school_id = $1 AND role = 'student' AND status = 'active'`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE school_id = $1 AND role = 'teacher' AND status = 'active'`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM users WHERE school_id = $1 AND role = 'admin' AND status = 'active'`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*)::int AS count FROM assessments a JOIN users u ON a.student_id = u.user_id WHERE u.school_id = $1`, [id]).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    if (!schoolRes.rows.length) return res.status(404).json({ success: false, error: 'School not found.' });

    return res.json({
      success: true,
      school: schoolRes.rows[0],
      stats: {
        studentCount: studentsRes.rows[0]?.count || 0,
        teacherCount: teachersRes.rows[0]?.count || 0,
        adminCount: adminsRes.rows[0]?.count || 0,
        assessmentCount: assessmentsRes.rows[0]?.count || 0,
      },
    });
  } catch (err) {
    console.error('getSchoolById error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch school.' });
  }
}

/**
 * POST /api/super-admin/schools
 * Creates school + admin user in users table only.
 */
async function createSchool(req, res) {
  const client = await db.pool.connect().catch(async () => {
    return null;
  });

  try {
    const {
      school_id, schoolId,
      school_name, schoolName,
      division,
      region,
      official_email, officialEmail,
      principal_name, principalName,
      admin_email, adminEmail,
      admin_password, tempPassword,
    } = req.body;

    const targetSchoolId = (schoolId || school_id || '').trim();
    const targetSchoolName = (schoolName || school_name || '').trim();
    const targetDivision = (division || '').trim() || null;
    const targetRegion = (region || '').trim() || null;
    const targetOfficialEmail = (officialEmail || official_email || '').trim() || null;
    const targetPrincipalName = (principalName || principal_name || '').trim() || null;

    const targetAdminEmail = (adminEmail || admin_email || officialEmail || official_email || '').trim() || null;

    if (!targetSchoolId || !targetSchoolName) {
      return res.status(400).json({ success: false, error: 'School ID and name are required.' });
    }

    const generatedPass = tempPassword || admin_password || generateTempPassword();
    const hashed = hashPassword(generatedPass);

    // Insert school
    const schoolRes = await db.query(`
      INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      ON CONFLICT (school_id) DO UPDATE SET
        school_name = EXCLUDED.school_name,
        division = EXCLUDED.division,
        region = EXCLUDED.region,
        official_email = EXCLUDED.official_email,
        principal_name = EXCLUDED.principal_name,
        status = 'active'
      RETURNING school_id, school_name, division, region, official_email, principal_name, status
    `, [targetSchoolId, targetSchoolName, targetDivision, targetRegion, targetOfficialEmail, targetPrincipalName]);

    let createdAdmin = null;
    if (targetAdminEmail) {
      // Create admin user linked strictly to users table (no teacher table insertion)
      await db.query(`
        INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
        VALUES ($1, $2, $3, 'admin', 'active', true)
        ON CONFLICT (email) DO UPDATE SET
          school_id = EXCLUDED.school_id,
          role = 'admin',
          status = 'active'
      `, [targetSchoolId, targetAdminEmail, hashed]);

      createdAdmin = { email: targetAdminEmail };

      // Send temporary password via Resend email service
      try {
        const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');
        await sendWelcomeEmailWithTempPassword({
          toEmail: targetAdminEmail,
          fullName: targetPrincipalName || targetSchoolName || 'School Administrator',
          role: 'School Administrator',
          tempPassword: generatedPass,
        });
      } catch (emailErr) {
        console.warn('Failed to send welcome email to admin:', emailErr.message);
      }
    }

    const createdSchool = schoolRes.rows[0] || {
      school_id: targetSchoolId,
      school_name: targetSchoolName,
      division: targetDivision,
      region: targetRegion,
      official_email: targetOfficialEmail,
      principal_name: targetPrincipalName,
      status: 'active',
    };

    return res.status(201).json({
      success: true,
      message: `School "${targetSchoolName}" registered successfully.`,
      school: createdSchool,
      schoolId: targetSchoolId,
      tempPassword: generatedPass,
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
    const body = req.body || {};

    const school_name = body.school_name || body.schoolName;
    const division = body.division;
    const region = body.region;
    const official_email = body.official_email || body.officialEmail;
    const principal_name = body.principal_name || body.principalName;
    const status = body.status;

    await db.query(`
      ALTER TABLE schools ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    `).catch(() => {});

    await db.query(`
      UPDATE schools
      SET school_name = COALESCE($1, school_name),
          division = COALESCE($2, division),
          region = COALESCE($3, region),
          official_email = COALESCE($4, official_email),
          principal_name = COALESCE($5, principal_name),
          status = COALESCE($6, status)
      WHERE school_id = $7
    `, [
      school_name !== undefined ? school_name : null,
      division !== undefined ? division : null,
      region !== undefined ? region : null,
      official_email !== undefined ? official_email : null,
      principal_name !== undefined ? principal_name : null,
      status !== undefined ? status : null,
      id,
    ]);

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
    const body = req.body || {};
    const email = (body.email || '').trim();

    if (!email) return res.status(400).json({ success: false, error: 'Email is required.' });

    const tempPassword = generateTempPassword();
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

    // Fetch school name for email greeting
    const schoolRes = await db.query(`SELECT school_name, principal_name FROM schools WHERE school_id = $1`, [id]).catch(() => ({ rows: [] }));
    const schoolObj = schoolRes.rows[0] || {};

    // Send temporary password via Resend
    try {
      const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');
      await sendWelcomeEmailWithTempPassword({
        toEmail: email,
        fullName: schoolObj.principal_name || schoolObj.school_name || 'School Administrator',
        role: 'School Administrator',
        tempPassword,
      });
    } catch (emailErr) {
      console.warn('Failed to send admin welcome email:', emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Admin account created and credentials emailed.',
      email,
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
    const { id, adminId } = req.params;
    const tempPassword = generateTempPassword();
    const hashed = hashPassword(tempPassword);

    const userRes = await db.query(`
      UPDATE users SET password_hash = $1, must_change_password = true
      WHERE user_id = $2 AND role = 'admin'
      RETURNING email
    `, [hashed, adminId]);

    const targetEmail = userRes.rows[0]?.email;
    if (targetEmail) {
      const schoolRes = await db.query(`SELECT school_name, principal_name FROM schools WHERE school_id = $1`, [id]).catch(() => ({ rows: [] }));
      const schoolObj = schoolRes.rows[0] || {};
      try {
        const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');
        await sendWelcomeEmailWithTempPassword({
          toEmail: targetEmail,
          fullName: schoolObj.principal_name || schoolObj.school_name || 'School Administrator',
          role: 'School Administrator',
          tempPassword,
        });
      } catch (emailErr) {
        console.warn('Failed to send reset password email:', emailErr.message);
      }
    }

    return res.json({ success: true, message: 'Password reset and emailed successfully.' });
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
        COALESCE(stage, 'Unassigned') AS stage,
        language,
        COALESCE(status, 'active') AS status,
        content_text AS text,
        word_count AS words,
        created_at
      FROM phil_iri_passages
      ORDER BY created_at DESC
    `);

    if (!materials.length) {
      return res.json({ success: true, passages: [] });
    }

    const passageIds = materials.map((m) => m.id);

    const { rows: allQuestions } = await db.query(`
      SELECT question_id, passage_id, question_text, question_type
      FROM phil_iri_questions
      WHERE passage_id = ANY($1::uuid[])
      ORDER BY created_at ASC
    `, [passageIds]);

    const questionIds = allQuestions.map((q) => q.question_id);

    let allChoices = [];
    if (questionIds.length) {
      const choicesRes = await db.query(`
        SELECT choice_id, question_id, choice_text, is_correct
        FROM phil_iri_question_choices
        WHERE question_id = ANY($1::uuid[])
      `, [questionIds]);
      allChoices = choicesRes.rows;
    }

    const choicesByQuestion = {};
    for (const c of allChoices) {
      if (!choicesByQuestion[c.question_id]) choicesByQuestion[c.question_id] = [];
      choicesByQuestion[c.question_id].push(c);
    }

    const questionsByPassage = {};
    for (const q of allQuestions) {
      const cRows = choicesByQuestion[q.question_id] || [];
      const options = cRows.map((c) => c.choice_text);
      const correctIndex = cRows.findIndex((c) => c.is_correct);

      const formattedQuestion = {
        id: q.question_id,
        question: q.question_text,
        type: q.question_type || 'Multiple Choice',
        options,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
      };

      if (!questionsByPassage[q.passage_id]) questionsByPassage[q.passage_id] = [];
      questionsByPassage[q.passage_id].push(formattedQuestion);
    }

    const passages = materials.map((m) => {
      const words = m.words || (m.text || '').trim().split(/\s+/).filter(Boolean).length;
      const langDisplay = m.language === 'en' ? 'English' : m.language === 'fil' ? 'Filipino' : m.language;

      return {
        id: m.id,
        title: m.title,
        grade: m.grade || 'Grade 4',
        set: m.set || 'Unassigned',
        stage: m.stage || 'Unassigned',
        language: langDisplay,
        status: m.status,
        words,
        text: m.text,
        questions: questionsByPassage[m.id] || [],
      };
    });

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
    const { title, grade, gradeLevel, set, passageSet, stage, language, status, text, contentText, questions } = req.body;
    const finalTitle = title ? title.trim() : '';
    const finalText = (text || contentText || '').trim();
    if (!finalTitle || !finalText) {
      return res.status(400).json({ success: false, error: 'Title and content text are required.' });
    }

    const finalGrade = grade || gradeLevel || 'Grade 4';
    const finalSet = set || passageSet || 'Unassigned';
    const finalStage = stage || (finalSet === 'Unassigned' ? 'Unassigned' : 'Pre-Test');
    const langCode = (language || '').toLowerCase().includes('english') || language === 'en' ? 'en' : 'fil';
    const statusVal = (status || 'active').toLowerCase();
    const wordCount = finalText.split(/\s+/).filter(Boolean).length;

    const { rows } = await db.query(`
      INSERT INTO phil_iri_passages (title, grade_level, passage_set, stage, language, status, content_text, word_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING passage_id AS id
    `, [finalTitle, finalGrade, finalSet, finalStage, langCode, statusVal, finalText, wordCount]);

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
    const { title, grade, gradeLevel, set, passageSet, stage, language, status, text, contentText, questions } = req.body;
    const finalTitle = title ? title.trim() : '';
    const finalText = (text || contentText || '').trim();
    if (!finalTitle || !finalText) {
      return res.status(400).json({ success: false, error: 'Title and content text are required.' });
    }

    const finalGrade = grade || gradeLevel || 'Grade 4';
    const finalSet = set || passageSet || 'Unassigned';
    const finalStage = stage || (finalSet === 'Unassigned' ? 'Unassigned' : 'Pre-Test');
    const langCode = (language || '').toLowerCase().includes('english') || language === 'en' ? 'en' : 'fil';
    const statusVal = (status || 'active').toLowerCase();
    const wordCount = finalText.split(/\s+/).filter(Boolean).length;

    await db.query(`
      UPDATE phil_iri_passages
      SET title = $1, grade_level = $2, passage_set = $3, stage = $4, language = $5, status = $6,
          content_text = $7, word_count = $8, updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $9
    `, [finalTitle, finalGrade, finalSet, finalStage, langCode, statusVal, finalText, wordCount, id]);

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
 * PATCH /api/super-admin/phil-iri/passages/:id/set
 */
async function updatePassageSet(req, res) {
  try {
    const { id } = req.params;
    const { set, stage, grade, language } = req.body;
    const setVal = set || 'Unassigned';
    const stageVal = setVal === 'Unassigned' ? 'Unassigned' : (stage || 'Pre-Test');

    // If setVal is Set A, Set B, Set C, or Set D, and grade/language/stage are provided,
    // unassign any existing passage in that same grade, language, stage, and set slot
    if (['Set A', 'Set B', 'Set C', 'Set D'].includes(setVal) && grade && language) {
      const langCode = (language || '').toLowerCase().includes('english') || language === 'en' ? 'en' : 'fil';
      await db.query(`
        UPDATE phil_iri_passages
        SET passage_set = 'Unassigned', stage = 'Unassigned', updated_at = CURRENT_TIMESTAMP
        WHERE grade_level = $1 AND (language = $2 OR (language = 'fil' AND $2 = 'Filipino') OR (language = 'en' AND $2 = 'English'))
          AND stage = $3 AND passage_set = $4 AND passage_id != $5
      `, [grade, langCode, stageVal, setVal, id]);
    }

    await db.query(`
      UPDATE phil_iri_passages
      SET passage_set = $1, stage = $2, updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $3
    `, [setVal, stageVal, id]);

    return res.json({ success: true, message: `Passage assigned to ${setVal} (${stageVal}).` });
  } catch (err) {
    console.error('SA updatePassageSet error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to update passage set.' });
  }
}

/**
 * PATCH /api/super-admin/phil-iri/passages/:id/archive
 */
async function archivePassage(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {}; // 'published' / 'active' or 'archived'
    let newStatus = status;

    if (!newStatus) {
      // Toggle status if not explicitly provided
      const currentRes = await db.query(`SELECT status FROM phil_iri_passages WHERE passage_id = $1`, [id]);
      const curr = (currentRes.rows[0]?.status || 'published').toLowerCase();
      newStatus = curr === 'archived' ? 'published' : 'archived';
    } else {
      newStatus = newStatus.toLowerCase();
    }

    await db.query(`
      UPDATE phil_iri_passages
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE passage_id = $2
    `, [newStatus, id]);

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
 * Helper to compute estimated reading time in minutes based on text word count.
 * Average reading speed: ~150 words per minute.
 */
function calculateReadingTime(text) {
  if (!text) return 1;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 150));
}

/**
 * POST /api/super-admin/stories
 */
async function createStory(req, res) {
  try {
    const {
      title, author, description, content_text, language, category,
      difficulty_level, reading_time_minutes, quiz_questions, status,
    } = req.body;

    if (!title) return res.status(400).json({ success: false, error: 'Title is required.' });

    const computedReadingTime = calculateReadingTime(content_text);

    const { rows } = await db.query(`
      INSERT INTO reading_materials
        (title, author, description, content_text, language, category,
         difficulty_level, reading_time_minutes, quiz_questions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING material_id AS id
    `, [
      title,
      author || null,
      description || null,
      content_text || null,
      language || 'Filipino',
      category || null,
      difficulty_level || null,
      reading_time_minutes ? parseInt(reading_time_minutes) : computedReadingTime,
      quiz_questions ? JSON.stringify(quiz_questions) : null,
      (status || 'active').toLowerCase(),
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
      difficulty_level, reading_time_minutes, quiz_questions,
    } = req.body;

    const computedReadingTime = content_text ? calculateReadingTime(content_text) : null;
    const finalReadingTime = reading_time_minutes ? parseInt(reading_time_minutes) : computedReadingTime;

    await db.query(`
      UPDATE reading_materials
      SET title = COALESCE($1, title),
          author = COALESCE($2, author),
          description = COALESCE($3, description),
          content_text = COALESCE($4, content_text),
          language = COALESCE($5, language),
          category = COALESCE($6, category),
          difficulty_level = COALESCE($7, difficulty_level),
          reading_time_minutes = COALESCE($8, reading_time_minutes),
          quiz_questions = COALESCE($9, quiz_questions),
          updated_at = CURRENT_TIMESTAMP
      WHERE material_id = $10
    `, [
      title, author, description, content_text, language, category,
      difficulty_level,
      finalReadingTime,
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
  updatePassageSet,
  archivePassage,
  getStories,
  createStory,
  updateStory,
  setStoryStatus,
  getSystemAnalytics,
};
