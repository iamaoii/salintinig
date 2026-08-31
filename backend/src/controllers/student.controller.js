const db = require('../config/db.js');


function generateParentAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Upper case alphanumeric excluding confusing 0/O, 1/I
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PAC-${result}`;
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let tempPass = 'St-';
  for (let i = 0; i < 6; i++) {
    tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tempPass;
}

const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');

const isDbConfigured = () =>
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('password@localhost');

/**
 * Resolve the correct school_id for the currently logged-in admin.
 * 1. Use school_id from JWT token if verified against schools table.
 * 2. Fall back to querying users table by admin email.
 */
async function getAdminSchoolId(req) {
  if (process.env.DATABASE_URL) {
    try {
      if (req.user && req.user.email) {
        const { rows } = await db.query(
          `SELECT school_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [req.user.email]
        );
        if (rows && rows[0] && rows[0].school_id) {
          return rows[0].school_id;
        }
      }

      const tokenSchoolId = req.user?.schoolId || req.user?.school_id;
      if (tokenSchoolId) {
        const schoolRes = await db.query(
          `SELECT school_id FROM schools WHERE school_id = $1 LIMIT 1`,
          [tokenSchoolId]
        );
        if (schoolRes.rows && schoolRes.rows[0] && schoolRes.rows[0].school_id) {
          return schoolRes.rows[0].school_id;
        }
      }
    } catch (e) {}
  }
  return req.user?.schoolId || req.user?.school_id || null;
}

/**
 * GET /api/admin/students â€” List all students
 */
async function getStudents(req, res) {
  try {
    const adminSchoolId = await getAdminSchoolId(req);

    if (isDbConfigured()) {
      try {
        let query = `
          SELECT 
            s.student_id AS id,
            s.lrn,
            s.first_name AS "firstName",
            s.middle_name AS "middleName",
            s.last_name AS "lastName",
            CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
            COALESCE(c.grade_level, sgh.grade_level, 'Grade 4') AS grade,
            COALESCE(c.section_name, 'Unassigned') AS section,
            COALESCE(s.sex, 'Male') AS gender,
            COALESCE(sp.access_code, 'N/A') AS "parentAccessCode",
            COALESCE(sp.is_active, TRUE) AS "parentAccessActive",
            COALESCE(p.email, '') AS "parentEmail",
            COALESCE(u.email, '') AS "personalEmail",
            CASE 
              WHEN sgh.promotion_status = 'dropped' THEN 'Dropped'
              WHEN sgh.promotion_status = 'transferred' THEN 'Transferred'
              WHEN u.status = 'disabled' THEN 'Disabled'
              ELSE 'Active'
            END AS status,
            COALESCE(rp.current_profile_label, 'Pending Evaluation') AS level,
            TO_CHAR(s.created_at, 'YYYY-MM-DD') AS "dateAdded"
          FROM students s
          LEFT JOIN users u ON s.user_id = u.user_id
          LEFT JOIN (
            SELECT DISTINCT ON (sgh_inner.student_id) 
              sgh_inner.student_id, 
              sgh_inner.class_id, 
              sgh_inner.grade_level, 
              sgh_inner.promotion_status
            FROM student_grade_history sgh_inner
            LEFT JOIN classes c_inner ON sgh_inner.class_id = c_inner.class_id
            LEFT JOIN school_years sy_c ON c_inner.school_year_id = sy_c.school_year_id
            LEFT JOIN school_years sy_direct ON sgh_inner.school_year_id = sy_direct.school_year_id
            WHERE sy_c.is_active = true OR sy_direct.is_active = true
            ORDER BY sgh_inner.student_id, sgh_inner.created_at DESC
          ) sgh ON s.student_id = sgh.student_id
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN (
            SELECT DISTINCT ON (sp_inner.student_id)
              sp_inner.student_id,
              sp_inner.access_code,
              sp_inner.is_active,
              sp_inner.parent_id
            FROM student_parents sp_inner
            ORDER BY sp_inner.student_id, sp_inner.generated_at DESC
          ) sp ON s.student_id = sp.student_id
          LEFT JOIN parents p ON sp.parent_id = p.parent_id
          LEFT JOIN reading_profiles rp ON s.student_id = rp.student_id
        `;
        const params = [];

        if (adminSchoolId) {
          query += ` WHERE u.school_id = $1 `;
          params.push(adminSchoolId);
        }

        query += ` ORDER BY s.created_at DESC`;

        const { rows } = await db.query(query, params);

        return res.json({ success: true, students: rows || [] });
      } catch (dbErr) {
        console.warn('DB fetch students notice:', dbErr.message);
      }
    }

    return res.json({ success: true, students: [] });
  } catch (err) {
    console.error('Error fetching students:', err);
    return res.json({ success: true, students: [] });
  }
}

const { decodeSecureToken } = require('../utils/securityToken.js');

/**
 * GET /api/admin/students/:lrn â€” Get single student by LRN
 */
async function getStudentByLrn(req, res) {
  try {
    const { lrn } = req.params;
    const cleanLrn = decodeSecureToken('st', lrn);

    if (isDbConfigured()) {
      try {
        const { rows } = await db.query(`
          SELECT 
            s.student_id AS id,
            s.lrn,
            s.first_name AS "firstName",
            s.middle_name AS "middleName",
            s.last_name AS "lastName",
            CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
            COALESCE(c.grade_level, sgh.grade_level, '') AS grade,
            COALESCE(c.section_name, 'Unassigned') AS section,
            COALESCE(s.sex, 'Male') AS gender,
            COALESCE(sp.access_code, 'N/A') AS "parentAccessCode",
            COALESCE(sp.is_active, TRUE) AS "parentAccessActive",
            COALESCE(p.email, '') AS "parentEmail",
            COALESCE(u.email, '') AS "personalEmail",
            CASE 
              WHEN sgh.promotion_status = 'dropped' THEN 'Dropped'
              WHEN sgh.promotion_status = 'transferred' THEN 'Transferred'
              WHEN u.status = 'disabled' THEN 'Disabled'
              ELSE 'Active'
            END AS status,
            COALESCE(rp.current_profile_label, 'Pending Evaluation') AS level,
            TO_CHAR(s.created_at, 'YYYY-MM-DD') AS "dateAdded"
          FROM students s
          LEFT JOIN users u ON s.user_id = u.user_id
          LEFT JOIN (
            SELECT DISTINCT ON (sgh_inner.student_id) 
              sgh_inner.student_id, 
              sgh_inner.class_id, 
              sgh_inner.grade_level, 
              sgh_inner.promotion_status
            FROM student_grade_history sgh_inner
            LEFT JOIN classes c_inner ON sgh_inner.class_id = c_inner.class_id
            LEFT JOIN school_years sy_c ON c_inner.school_year_id = sy_c.school_year_id
            LEFT JOIN school_years sy_direct ON sgh_inner.school_year_id = sy_direct.school_year_id
            WHERE sy_c.is_active = true OR sy_direct.is_active = true
            ORDER BY sgh_inner.student_id, sgh_inner.created_at DESC
          ) sgh ON s.student_id = sgh.student_id
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN student_parents sp ON s.student_id = sp.student_id
          LEFT JOIN parents p ON sp.parent_id = p.parent_id
          LEFT JOIN reading_profiles rp ON s.student_id = rp.student_id
          WHERE TRIM(s.lrn) = $1 OR s.student_id::text = $1 OR TRIM(s.lrn) = $2 OR s.student_id::text = $2
          LIMIT 1
        `, [cleanLrn, lrn]);

        if (rows && rows.length > 0) {
          const studentObj = rows[0];
          const studentId = studentObj.id;

          // Fetch real assessment performance attempts
          const { rows: perfRows } = await db.query(
            `SELECT 
               aa.completed_at,
               COALESCE(orr.fluency_score, 0) AS oral_accuracy,
               COALESCE(orr.comprehension_score, srr.comprehension_score, 0) AS comprehension,
               COALESCE(orr.reading_time_seconds, srr.reading_time_seconds, 0) AS reading_time,
               COALESCE(orr.words_read, 0) AS words_read
             FROM assessment_attempts aa
             JOIN assessments a ON aa.assessment_id = a.assessment_id
             LEFT JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
             LEFT JOIN silent_reading_results srr ON srr.assessment_attempt_id = aa.attempt_id
             WHERE a.student_id = $1 AND aa.status = 'completed'
             ORDER BY aa.completed_at ASC
             LIMIT 6`,
            [studentId]
          );

          if (perfRows && perfRows.length > 0) {
            const sessions = perfRows.map((_, idx) => `S${idx + 1}`);
            const accuracy = perfRows.map((r) => Math.round(Number(r.oral_accuracy || 0)));
            const comprehension = perfRows.map((r) => Math.round(Number(r.comprehension || 0)));

            const totalAcc = accuracy.reduce((a, b) => a + b, 0);
            const totalComp = comprehension.reduce((a, b) => a + b, 0);
            
            let totalWps = 0;
            let wpsCount = 0;
            perfRows.forEach((r) => {
              const sec = Number(r.reading_time || 0);
              const words = Number(r.words_read || 0);
              if (sec > 0 && words > 0) {
                totalWps += Math.round(words / sec);
                wpsCount++;
              }
            });

            studentObj.sessions = sessions;
            studentObj.accuracyTrend = accuracy;
            studentObj.comprehensionTrend = comprehension;
            studentObj.avgAccuracy = Math.round(totalAcc / accuracy.length);
            studentObj.avgComprehension = Math.round(totalComp / comprehension.length);
            studentObj.avgWps = wpsCount > 0 ? Math.round(totalWps / wpsCount) : 0;
          } else {
            // Un-assessed student metrics
            studentObj.sessions = [];
            studentObj.accuracyTrend = [];
            studentObj.comprehensionTrend = [];
            studentObj.avgAccuracy = 0;
            studentObj.avgComprehension = 0;
            studentObj.avgWps = 0;
          }

          // Fetch activities assigned to student's class
          const { rows: actRows } = await db.query(
            `SELECT 
               act.activity_id AS id,
               act.title,
               COALESCE(act.activity_type, 'Practice') AS type,
               CASE WHEN aa.activity_attempt_id IS NOT NULL THEN 'done' ELSE 'not-done' END AS status
             FROM activities act
             JOIN student_grade_history sgh ON sgh.class_id = act.class_id
             LEFT JOIN activity_attempts aa ON aa.activity_id = act.activity_id AND aa.student_id = sgh.student_id
             WHERE sgh.student_id = $1
             ORDER BY act.created_at DESC`,
            [studentId]
          );
          studentObj.activities = actRows || [];

          // Fetch earned badges from DB
          try {
            const { rows: badgeRows } = await db.query(
              `SELECT b.badge_id AS id, b.badge_name AS name, COALESCE(b.icon_path, '') AS image
               FROM student_badges sb
               JOIN badges b ON sb.badge_id = b.badge_id
               WHERE sb.student_id = $1
               ORDER BY sb.earned_at DESC`,
              [studentId]
            );
            studentObj.badges = badgeRows || [];
          } catch (bErr) {
            studentObj.badges = [];
          }

          // Fetch completed stories from DB if table exists
          try {
            const { rows: storyRows } = await db.query(
              `SELECT rm.material_id AS id, rm.title, COALESCE(rm.category, 'blue') AS color
               FROM student_story_progress ssp
               JOIN reading_materials rm ON ssp.material_id = rm.material_id
               WHERE ssp.student_id = $1 AND ssp.status = 'completed'
               ORDER BY ssp.updated_at DESC`,
              [studentId]
            );
            studentObj.stories = storyRows || [];
          } catch (sErr) {
            studentObj.stories = [];
          }

          return res.json({ success: true, student: studentObj });
        }
      } catch (dbErr) {
        console.warn('DB fetch student by LRN notice:', dbErr.message);
      }
    }

    return res.status(404).json({ success: false, error: 'Student record not found.' });
  } catch (err) {
    console.error('Error fetching student by LRN:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch student record.' });
  }
}

/**
 * Helper to parse full name string if explicit firstName/lastName not supplied
 */
function parseNameString(rawName = '') {
  const clean = rawName.trim();
  if (clean.includes(',')) {
    const parts = clean.split(',');
    const lastName = parts[0].trim();
    const remainderParts = parts[1].trim().split(/\s+/);
    const firstName = remainderParts[0] || '';
    const middleName = remainderParts.slice(1).join(' ') || '';
    return { firstName, middleName, lastName };
  }
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
  if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

/**
 * POST /api/admin/students â€” Create single student
 */
async function createStudent(req, res) {
  try {
    let {
      lrn,
      firstName,
      middleName,
      lastName,
      name,
      grade,
      section,
      gender,
      parentEmail,
      personalEmail,
      parentName,
    } = req.body;

    if (!lrn || !grade || !section) {
      return res.status(400).json({ success: false, error: 'LRN, Grade, and Section are required.' });
    }

    if (!/^\d{12}$/.test(String(lrn).trim())) {
      return res.status(400).json({ success: false, error: 'LRN must be exactly 12 numeric digits.' });
    }

    if (!firstName || !lastName) {
      if (name) {
        const parsed = parseNameString(name);
        firstName = firstName || parsed.firstName;
        middleName = middleName || parsed.middleName;
        lastName = lastName || parsed.lastName;
      }
    }

    firstName = (firstName || 'Student').trim();
    middleName = (middleName || '').trim();
    lastName = (lastName || 'Record').trim();
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;

    const pEmail = parentEmail && parentEmail.trim() ? parentEmail.trim() : null;
    const computedParentName = parentName || `Mr./Mrs. ${lastName}`;

    const parentAccessCode = generateParentAccessCode(lrn);
    const dateAdded = new Date().toISOString().split('T')[0];

    const newStudentObj = {
      id: `STD-${Date.now().toString().slice(-4)}`,
      lrn,
      firstName,
      middleName,
      lastName,
      name: fullName,
      grade,
      section,
      gender: gender || 'Male',
      parentAccessCode,
      parentEmail: pEmail,
      parentName: computedParentName,
      personalEmail: personalEmail || `${lrn}@salintinig.edu.ph`,
      status: 'Active',
      level: 'Instructional',
      dateAdded,
    };

    const tempPassword = generateTempPassword();

    if (isDbConfigured()) {
      try {
        const bcrypt = require('bcryptjs');
        const salt = bcrypt.genSaltSync(10);
        const hashedPass = bcrypt.hashSync(tempPassword, salt);

        const adminSchoolId = await getAdminSchoolId(req);
        console.log(`[createStudent] Resolved adminSchoolId: ${adminSchoolId}`);

        const { rows: userRows } = await db.query(
          `INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
           VALUES ($1, $2, $3, 'student', 'active', true)
           ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id, password_hash = $3, must_change_password = true, status = 'active'
           RETURNING user_id`,
          [adminSchoolId, newStudentObj.personalEmail, hashedPass]
        );

        if (userRows && userRows[0]) {
          const userId = userRows[0].user_id;

          const { rows: stdRows } = await db.query(
            `INSERT INTO students (user_id, lrn, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (lrn) DO UPDATE SET first_name = $3, middle_name = $4, last_name = $5, sex = $6
             RETURNING student_id`,
            [userId, lrn, firstName, middleName || null, lastName, gender || 'Male']
          );

          if (stdRows && stdRows[0]) {
            const studentId = stdRows[0].student_id;

            const parentFullName = computedParentName;
            let parentId = null;

            if (pEmail) {
              const { rows: pRows } = await db.query(
                `INSERT INTO parents (parent_name, email)
                 VALUES ($1, $2)
                 ON CONFLICT (email) DO UPDATE SET parent_name = EXCLUDED.parent_name
                 RETURNING parent_id`,
                [parentFullName, pEmail]
              );
              if (pRows && pRows[0]) parentId = pRows[0].parent_id;
            } else {
              const { rows: pRows } = await db.query(
                `INSERT INTO parents (parent_name, email) VALUES ($1, NULL) RETURNING parent_id`,
                [parentFullName]
              );
              if (pRows && pRows[0]) parentId = pRows[0].parent_id;
            }

            if (parentId) {
              await db.query(
                `INSERT INTO student_parents (student_id, parent_id, access_code)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (student_id) DO UPDATE SET parent_id = EXCLUDED.parent_id, access_code = EXCLUDED.access_code`,
                [studentId, parentId, parentAccessCode]
              );
            }

            // Ensure section/class exists and link student to active grade history
            let classId = null;
            const rawGrade = grade ? String(grade).trim() : 'Grade 4';
            const gradeNum = rawGrade.replace(/^Grade\s*/i, '').trim();
            const targetGrade = rawGrade.toLowerCase().startsWith('grade') ? rawGrade : `Grade ${gradeNum}`;

            const { rows: existingClass } = await db.query(
              `SELECT class_id FROM classes 
               WHERE (LOWER(grade_level) = LOWER($1) OR LOWER(grade_level) = LOWER($2)) 
                 AND LOWER(section_name) = LOWER($3) 
               LIMIT 1`,
              [targetGrade, gradeNum, section]
            );

            if (existingClass && existingClass[0]) {
              classId = existingClass[0].class_id;
            } else {
              const { rows: newClass } = await db.query(
                `INSERT INTO classes (grade_level, section_name) VALUES ($1, $2) RETURNING class_id`,
                [targetGrade, section]
              );
              if (newClass && newClass[0]) classId = newClass[0].class_id;
            }

            const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
            const activeSyId = syRes.rows[0]?.school_year_id || null;

            await db.query(
              `INSERT INTO student_grade_history (student_id, school_year_id, grade_level, class_id, promotion_status)
               VALUES ($1, $2, $3, $4, 'pending')
               ON CONFLICT (student_id, school_year_id) DO UPDATE SET class_id = EXCLUDED.class_id, grade_level = EXCLUDED.grade_level`,
              [studentId, activeSyId, targetGrade, classId || null]
            );

            // Send welcome email with temporary password
            sendWelcomeEmailWithTempPassword({
              toEmail: newStudentObj.personalEmail,
              fullName,
              role: 'student',
              tempPassword,
              identifier: lrn,
            });
            if (pEmail && pEmail !== newStudentObj.personalEmail) {
              sendWelcomeEmailWithTempPassword({
                toEmail: pEmail,
                fullName: `Parent of ${fullName}`,
                role: 'student',
                tempPassword,
                identifier: lrn,
              });
            }
          }
        }
      } catch (dbErr) {
        console.error('âŒ DB student insert error:', dbErr.message || dbErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Student record created. Temporary password sent to ${newStudentObj.personalEmail}.`,
      tempPassword,
      student: newStudentObj,
    });
  } catch (err) {
    console.error('Error creating student:', err);
    return res.status(500).json({ success: false, error: 'Failed to create student record.' });
  }
}

/**
 * PUT /api/admin/students/:lrn â€” Update student
 */
async function updateStudent(req, res) {
  try {
    const { lrn } = req.params;
    let { firstName, middleName, lastName, name, grade, section, gender, parentEmail, personalEmail } = req.body;

    if (!firstName || !lastName) {
      if (name) {
        const parsed = parseNameString(name);
        firstName = firstName || parsed.firstName;
        middleName = middleName || parsed.middleName;
        lastName = lastName || parsed.lastName;
      }
    }

    if (isDbConfigured()) {
      try {
        const { rows: stRows } = await db.query(
          `UPDATE students 
           SET first_name = COALESCE($1, first_name),
               middle_name = COALESCE($2, middle_name),
               last_name = COALESCE($3, last_name),
               sex = COALESCE($4, sex),
               updated_at = CURRENT_TIMESTAMP
           WHERE lrn = $5
           RETURNING student_id`,
          [firstName || null, middleName || null, lastName || null, gender || null, lrn]
        );

          if (section) {
            const studentId = stRows[0].student_id;
            const rawGrade = grade ? String(grade).trim() : 'Grade 4';
            const gradeNum = rawGrade.replace(/^Grade\s*/i, '').trim();
            const targetGrade = rawGrade.toLowerCase().startsWith('grade') ? rawGrade : `Grade ${gradeNum}`;
            const targetSection = String(section).trim();

            // Find or create target class
            let classId = null;
            const { rows: existingClass } = await db.query(
              `SELECT class_id FROM classes 
               WHERE (LOWER(grade_level) = LOWER($1) OR LOWER(grade_level) = LOWER($2)) 
                 AND LOWER(section_name) = LOWER($3) 
               LIMIT 1`,
              [targetGrade, gradeNum, targetSection]
            );

            if (existingClass && existingClass[0]) {
              classId = existingClass[0].class_id;
            } else {
              const { rows: newClass } = await db.query(
                `INSERT INTO classes (grade_level, section_name) VALUES ($1, $2) RETURNING class_id`,
                [targetGrade, targetSection]
              );
              if (newClass && newClass[0]) classId = newClass[0].class_id;
            }

          if (classId) {
            // Find active school year
            const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
            const activeSyId = syRes.rows[0]?.school_year_id || null;

            // Check if history row exists for the active school year or latest history record
            const { rows: latestHist } = await db.query(
              `SELECT sgh.history_id, sgh.promotion_status 
               FROM student_grade_history sgh
               LEFT JOIN classes c ON sgh.class_id = c.class_id
               WHERE sgh.student_id = $1 
                 AND ($2::uuid IS NULL OR sgh.school_year_id = $2 OR c.school_year_id = $2)
               ORDER BY sgh.created_at DESC LIMIT 1`,
              [studentId, activeSyId]
            );

            if (latestHist && latestHist[0]) {
              // Update the existing history record in place preserving promotion_status and updating class_id & grade_level
              await db.query(
                `UPDATE student_grade_history 
                 SET class_id = $1, 
                     grade_level = $2
                 WHERE history_id = $3`,
                [classId, targetGrade, latestHist[0].history_id]
              );
            } else {
              await db.query(
                `INSERT INTO student_grade_history (student_id, school_year_id, class_id, grade_level, promotion_status)
                 VALUES ($1, $2, $3, $4, 'pending')`,
                [studentId, activeSyId, classId, targetGrade]
              );
            }
          }
        }
      } catch (dbErr) {
        console.warn('DB student update notice:', dbErr.message);
      }
    }

    const fullName = `${firstName || ''} ${middleName ? middleName + ' ' : ''}${lastName || ''}`.trim();
    return res.json({ success: true, student: { lrn, firstName, middleName, lastName, name: fullName, grade, section, gender, personalEmail } });
  } catch (err) {
    console.error('Error updating student:', err);
    return res.status(500).json({ success: false, error: 'Failed to update student record.' });
  }
}

/**
 * PATCH /api/admin/students/:lrn/status â€” Toggle student status (Active / Disabled / Dropped)
 */
async function toggleStudentStatus(req, res) {
  try {
    const { lrn } = req.params;
    const { status: targetStatus } = req.body || {};
    let newStatus = targetStatus || 'Disabled';


    if (isDbConfigured()) {
      try {
        const dbUserStatus = (newStatus === 'Disabled' || newStatus === 'Dropped' || newStatus === 'Transferred') ? 'disabled' : 'active';

        // 1. Update student user account login access
        await db.query(
          `UPDATE users SET status = $1 WHERE user_id = (SELECT user_id FROM students WHERE lrn = $2)`,
          [dbUserStatus, lrn]
        );

        // 2. Update enrollment status for Dropped / Transferred or restore to Pending/Active if re-activated
        const lowerStatus = newStatus.toLowerCase();
        if (lowerStatus === 'dropped' || lowerStatus === 'transferred') {
          await db.query(
            `UPDATE student_grade_history 
             SET promotion_status = $1 
             WHERE student_id = (SELECT student_id FROM students WHERE lrn = $2)`,
            [lowerStatus, lrn]
          );
        } else if (newStatus === 'Active') {
          // If restoring back to Active from Dropped or Transferred, reset status back to pending so adviser can re-evaluate
          await db.query(
            `UPDATE student_grade_history 
             SET promotion_status = 'pending' 
             WHERE student_id = (SELECT student_id FROM students WHERE lrn = $2)
               AND promotion_status IN ('dropped', 'transferred')`,
            [lrn]
          );
        }

        // 3. Update Parent Portal access code status (disable parent access code if student is Disabled/Dropped/Transferred)
        const isParentAccessActive = (newStatus === 'Active');
        await db.query(
          `UPDATE student_parents 
           SET is_active = $1 
           WHERE student_id = (SELECT student_id FROM students WHERE lrn = $2)`,
          [isParentAccessActive, lrn]
        );

        // 4. Audit Log & Notification for Student Status Toggle
        try {
          const schoolId = await getAdminSchoolId(req);
          const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;

          await db.query(
            `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
             VALUES ($1, $2, 'TOGGLE_STUDENT_STATUS', $3, $4)`,
            [
              schoolId || '109283',
              adminUserId || null,
              `Changed enrollment status for student LRN ${lrn} to "${newStatus}"`,
              req.ip || req.headers['x-forwarded-for'] || null,
            ]
          );

          await db.query(
            `INSERT INTO notifications (school_id, title, message, notification_type)
             VALUES ($1, $2, $3, 'system')`,
            [
              schoolId || '109283',
              `Student Status Updated: ${lrn}`,
              `Enrollment status for student LRN ${lrn} was updated to ${newStatus}.`,
            ]
          );
        } catch (nErr) {
          console.warn('Student status toggle audit notice:', nErr.message);
        }
      } catch (dbErr) {
        console.warn('DB status toggle notice:', dbErr.message);
      }
    }

    return res.json({ success: true, lrn, newStatus });
  } catch (err) {
    console.error('Error toggling student status:', err);
    return res.status(500).json({ success: false, error: 'Failed to update student status.' });
  }
}

/**
 * DELETE /api/admin/students/:lrn â€” Delete student
 */
async function deleteStudent(req, res) {
  try {
    const { lrn } = req.params;

    if (isDbConfigured()) {
      await db.query('BEGIN');
      try {
        // Step 1: Look up the student
        const { rows } = await db.query(
          `SELECT student_id, user_id, first_name, last_name, lrn FROM students WHERE lrn = $1 OR student_id::text = $1 LIMIT 1`,
          [lrn]
        );

        if (rows && rows[0]) {
          const studentId = rows[0].student_id;
          const userId = rows[0].user_id;

          // Step 2: Capture parent_ids NOW, before any cascade deletes them
          const { rows: parentRows } = await db.query(
            `SELECT DISTINCT parent_id FROM student_parents WHERE student_id = $1 AND parent_id IS NOT NULL`,
            [studentId]
          );
          const targetParentIds = (parentRows || []).map((r) => r.parent_id).filter(Boolean);

          // Step 3: Manually delete student_parents & grade history to avoid cascade surprises
          await db.query(`DELETE FROM student_grade_history WHERE student_id = $1`, [studentId]);
          await db.query(`DELETE FROM student_parents WHERE student_id = $1`, [studentId]);

          // Step 4: Delete student record (cascade on user already handled, but we delete user too)
          await db.query(`DELETE FROM students WHERE student_id = $1`, [studentId]);
          if (userId) {
            await db.query(`DELETE FROM users WHERE user_id = $1`, [userId]);
          }

          // Step 5: Delete any parent records that now have NO remaining student links
          for (const pid of targetParentIds) {
            const { rows: stillLinked } = await db.query(
              `SELECT 1 FROM student_parents WHERE parent_id = $1 LIMIT 1`,
              [pid]
            );
            if (!stillLinked || stillLinked.length === 0) {
              await db.query(`DELETE FROM parents WHERE parent_id = $1`, [pid]);
              console.log(`âœ… Deleted orphan parent record: ${pid}`);
            }
          }

          // Step 6: Create System Notification & Audit Log
          try {
            const sName = [rows[0].first_name, rows[0].last_name].filter(Boolean).join(' ') || 'Student';
            const adminSchoolId = await getAdminSchoolId(req);
            const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;

            // 6a. Record in audit_logs
            await db.query(
              `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
               VALUES ($1, $2, 'DELETE_STUDENT', $3, $4)`,
              [
                adminSchoolId || '109283',
                adminUserId || null,
                `Deleted student record ${sName} (LRN: ${rows[0].lrn || lrn})`,
                req.ip || req.headers['x-forwarded-for'] || null,
              ]
            );

            // 6b. Record in notifications
            await db.query(
              `INSERT INTO notifications (school_id, title, message, notification_type)
               VALUES ($1, $2, $3, 'system')`,
              [
                adminSchoolId || '109283',
                `Student Record Deleted: ${sName}`,
                `Student record for ${sName} (LRN: ${rows[0].lrn || lrn}) was permanently deleted from the system.`,
              ]
            );
          } catch (nErr) {
            console.warn('Delete student audit/notification notice:', nErr.message);
          }
        }

        await db.query('COMMIT');
      } catch (dbErr) {
        await db.query('ROLLBACK');
        console.error('âŒ DB deleteStudent error:', dbErr.message);
        return res.status(500).json({ success: false, error: `Failed to delete student: ${dbErr.message}` });
      }
    }

    return res.json({ success: true, message: `Student record & user account deleted successfully.` });
  } catch (err) {
    console.error('Error deleting student:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete student record.' });
  }
}

/**
 * POST /api/admin/students/import-csv â€” Import batch CSV students
 */
async function importStudentsCSV(req, res) {
  try {
    const { studentsList } = req.body;
    if (!Array.isArray(studentsList) || studentsList.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid student records provided.' });
    }

    const importedBatch = [];
    for (let index = 0; index < studentsList.length; index++) {
      const item = studentsList[index];
      const lrn = String(item.lrn || item.LRN || item['Student LRN'] || '').trim();

      if (!lrn || !/^\d{12}$/.test(lrn)) {
        return res.status(400).json({
          success: false,
          error: `Invalid LRN "${lrn || 'blank'}" on row ${index + 1}. LRN must be exactly 12 numeric digits.`,
        });
      }
      
      let firstName = (item.firstName || item.first_name || item['First Name'] || '').trim();
      let middleName = (item.middleName || item.middle_name || item['Middle Name'] || '').trim();
      let lastName = (item.lastName || item.last_name || item['Last Name'] || '').trim();
      
      if (!firstName || !lastName) {
        const rawName = item.name || item.fullName || item['Full Name'] || `Student ${index + 1}`;
        const parsed = parseNameString(rawName);
        firstName = firstName || parsed.firstName || 'Student';
        lastName = lastName || parsed.lastName || 'Record';
        middleName = middleName || parsed.middleName || '';
      }

      const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
      const parentAccessCode = generateParentAccessCode(lrn);
      const personalEmail = (item.personalEmail || item.email || item['Email Address'] || item['Email'] || `${lrn}@salintinig.edu.ph`).trim();
      const parentEmail = (item.parentEmail || item['Parent Email'] || '').trim();
      const gender = item.gender || item.sex || item['Gender'] || 'Male';
      const grade = (item.grade || item.gradeLevel || item['Grade Level'] || '').trim();
      const section = (item.section || item.sectionName || item['Section'] || '').trim();

      const cleanParentEmail = parentEmail && String(parentEmail).trim() && String(parentEmail).trim() !== 'undefined' ? String(parentEmail).trim() : null;

      const tempPassword = generateTempPassword();
      const studentObj = {
        id: `STD-CSV-${Date.now()}-${index}`,
        lrn,
        firstName,
        middleName,
        lastName,
        name: fullName,
        grade,
        section,
        gender,
        parentAccessCode,
        parentEmail: cleanParentEmail,
        personalEmail,
        tempPassword,
        status: 'Active',
        level: 'Instructional',
        dateAdded: new Date().toISOString().split('T')[0],
      };

      if (isDbConfigured()) {
        try {
          const bcrypt = require('bcryptjs');
          const salt = bcrypt.genSaltSync(10);
          const hashedPass = bcrypt.hashSync(tempPassword, salt);
          const adminSchoolId = await getAdminSchoolId(req);
          console.log(`[importStudentsCSV] Resolved adminSchoolId: ${adminSchoolId}`);

          const { rows: userRows } = await db.query(
            `INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
             VALUES ($1, $2, $3, 'student', 'active', true)
             ON CONFLICT (email) DO UPDATE SET school_id = EXCLUDED.school_id, password_hash = $3, must_change_password = true, status = 'active'
             RETURNING user_id`,
            [adminSchoolId, personalEmail, hashedPass]
          );

          if (userRows && userRows[0]) {
            const userId = userRows[0].user_id;

            const { rows: stdRows } = await db.query(
              `INSERT INTO students (user_id, lrn, first_name, middle_name, last_name, sex)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (lrn) DO UPDATE SET first_name = $3, middle_name = $4, last_name = $5, sex = $6
               RETURNING student_id`,
              [userId, lrn, firstName, middleName || null, lastName, gender]
            );

            if (stdRows && stdRows[0]) {
              const studentId = stdRows[0].student_id;
              const parentFullName = `Mr./Mrs. ${lastName}`;
              let parentId = null;

              if (cleanParentEmail) {
                const { rows: pRows } = await db.query(
                  `INSERT INTO parents (parent_name, email)
                   VALUES ($1, $2)
                   ON CONFLICT (email) DO UPDATE SET parent_name = EXCLUDED.parent_name
                   RETURNING parent_id`,
                  [parentFullName, cleanParentEmail]
                );
                if (pRows && pRows[0]) parentId = pRows[0].parent_id;
              } else {
                const { rows: pRows } = await db.query(
                  `INSERT INTO parents (parent_name, email)
                   VALUES ($1, NULL)
                   RETURNING parent_id`,
                  [parentFullName]
                );
                if (pRows && pRows[0]) parentId = pRows[0].parent_id;
              }

              if (parentId) {
                await db.query(
                  `INSERT INTO student_parents (student_id, parent_id, access_code)
                   VALUES ($1, $2, $3)
                   ON CONFLICT (student_id) DO UPDATE SET parent_id = EXCLUDED.parent_id, access_code = EXCLUDED.access_code`,
                  [studentId, parentId, parentAccessCode]
                );
              }

              // Ensure class/section strictly exists in database (do NOT auto-create invalid section names)
              let classId = null;
              const { rows: existingClass } = await db.query(
                `SELECT class_id FROM classes WHERE LOWER(grade_level) = LOWER($1) AND LOWER(section_name) = LOWER($2) LIMIT 1`,
                [grade, section]
              );

              if (existingClass && existingClass[0]) {
                classId = existingClass[0].class_id;
              } else {
                console.warn(`âš ï¸ Skipped grade/section binding: Class "${grade} - ${section}" does not exist in database.`);
              }

            const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
            const activeSyId = syRes.rows[0]?.school_year_id || null;

            await db.query(
              `INSERT INTO student_grade_history (student_id, school_year_id, grade_level, class_id, promotion_status)
               VALUES ($1, $2, $3, $4, 'pending')
               ON CONFLICT (student_id, school_year_id) DO UPDATE SET class_id = EXCLUDED.class_id, grade_level = EXCLUDED.grade_level`,
              [studentId, activeSyId, grade || 'Grade 4', classId || null]
            );

              // Send welcome email with temporary password
              sendWelcomeEmailWithTempPassword({
                toEmail: personalEmail,
                fullName,
                role: 'student',
                tempPassword,
                identifier: lrn,
              });
              if (cleanParentEmail && cleanParentEmail !== personalEmail) {
                sendWelcomeEmailWithTempPassword({
                  toEmail: cleanParentEmail,
                  fullName: `Parent of ${fullName}`,
                  role: 'student',
                  tempPassword,
                  identifier: lrn,
                });
              }
            }
          }
        } catch (dbErr) {
          console.error('âŒ DB CSV import row notice:', dbErr.message || dbErr);
        }
      }

      importedBatch.push(studentObj);
    }

    // Audit Log & Notification for Batch CSV Import
    try {
      const schoolId = await getAdminSchoolId(req);
      const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;
      const count = importedBatch.length;

      await db.query(
        `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
         VALUES ($1, $2, 'BATCH_IMPORT_STUDENTS', $3, $4)`,
        [
          schoolId || '109283',
          adminUserId || null,
          `Batch imported ${count} student records via CSV upload.`,
          req.ip || req.headers['x-forwarded-for'] || null,
        ]
      );

      await db.query(
        `INSERT INTO notifications (school_id, title, message, notification_type)
         VALUES ($1, $2, $3, 'system')`,
        [
          schoolId || '109283',
          `Batch Student CSV Import Completed`,
          `Successfully processed and imported ${count} student records into the database.`,
        ]
      );
    } catch (nErr) {
      console.warn('Batch import audit notice:', nErr.message);
    }

    return res.json({
      success: true,
      count: importedBatch.length,
      importedStudents: importedBatch,
    });
  } catch (err) {
    console.error('Error importing student CSV:', err);
    return res.status(500).json({ success: false, error: 'Failed to process student CSV import.' });
  }
}

/**
 * GET /api/admin/students/check/:lrn â€” Check if LRN already exists in national database
 */
async function checkExistingStudent(req, res) {
  try {
    const { lrn } = req.params;
    if (isDbConfigured()) {
      try {
        const { rows } = await db.query(
          `SELECT 
             s.student_id AS id,
             s.lrn,
             s.first_name AS "firstName",
             s.middle_name AS "middleName",
             s.last_name AS "lastName",
             CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
             s.sex AS gender,
             u.school_id AS "currentSchoolId",
             sch.school_name AS "currentSchoolName",
             CASE 
               WHEN sgh.promotion_status = 'dropped' THEN 'Dropped'
               WHEN sgh.promotion_status = 'transferred' THEN 'Transferred'
               WHEN u.status = 'disabled' THEN 'Disabled'
               ELSE 'Active'
             END AS status
           FROM students s
           LEFT JOIN users u ON s.user_id = u.user_id
           LEFT JOIN schools sch ON u.school_id = sch.school_id
           LEFT JOIN student_grade_history sgh ON s.student_id = sgh.student_id
           WHERE s.lrn = $1
           LIMIT 1`,
          [lrn]
        );
        if (rows && rows[0]) {
          return res.json({ success: true, exists: true, student: rows[0] });
        }
      } catch (dbErr) {
        console.warn('DB check existing student notice:', dbErr.message);
      }
    }


    return res.json({ success: true, exists: false });
  } catch (err) {
    console.error('Error checking existing student:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify student LRN.' });
  }
}

/**
 * POST /api/admin/students/transfer-in â€” Transfer existing student into current school
 */
async function transferInStudent(req, res) {
  try {
    const { lrn, grade, section } = req.body;
    if (!lrn || !grade || !section) {
      return res.status(400).json({ success: false, error: 'LRN, Grade, and Section are required for transfer.' });
    }

    let transferredStudent = null;

    if (isDbConfigured()) {
      try {
        const { rows: stdRows } = await db.query(
          `SELECT s.student_id, s.user_id, s.first_name, s.last_name FROM students s WHERE s.lrn = $1 LIMIT 1`,
          [lrn]
        );

        if (stdRows && stdRows[0]) {
          const studentId = stdRows[0].student_id;
          const userId = stdRows[0].user_id;

          // 1. Reactivate user account login status
          if (userId) {
            await db.query(`UPDATE users SET status = 'active' WHERE user_id = $1`, [userId]);
          }

          // 2. Ensure section/class exists and create new active grade history entry
          let classId = null;
          const { rows: existingClass } = await db.query(
            `SELECT class_id FROM classes WHERE grade_level = $1 AND section_name = $2 LIMIT 1`,
            [grade, section]
          );

          if (existingClass && existingClass[0]) {
            classId = existingClass[0].class_id;
          } else {
            const { rows: newClass } = await db.query(
              `INSERT INTO classes (grade_level, section_name) VALUES ($1, $2) RETURNING class_id`,
              [grade, section]
            );
            if (newClass && newClass[0]) classId = newClass[0].class_id;
          }

          if (classId) {
            await db.query(
              `INSERT INTO student_grade_history (student_id, class_id, promotion_status)
               VALUES ($1, $2, 'active')
               ON CONFLICT (student_id, class_id) DO UPDATE SET promotion_status = 'active'`,
              [studentId, classId]
            );
          }

          // 3. Reactivate parent access code
          await db.query(`UPDATE student_parents SET is_active = TRUE WHERE student_id = $1`, [studentId]);

          transferredStudent = { lrn, name: `${stdRows[0].first_name} ${stdRows[0].last_name}`, grade, section, status: 'Active' };

          // Audit Log & Notification for Student Transfer-In
          try {
            const schoolId = await getAdminSchoolId(req);
            const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;
            const sName = transferredStudent.name;

            await db.query(
              `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
               VALUES ($1, $2, 'TRANSFER_IN_STUDENT', $3, $4)`,
              [
                schoolId || '109283',
                adminUserId || null,
                `Transferred in student ${sName} (LRN: ${lrn}) into Grade ${grade} - ${section}`,
                req.ip || req.headers['x-forwarded-for'] || null,
              ]
            );

            await db.query(
              `INSERT INTO notifications (school_id, title, message, notification_type)
               VALUES ($1, $2, $3, 'system')`,
              [
                schoolId || '109283',
                `Student Transferred In: ${sName}`,
                `Student ${sName} (LRN: ${lrn}) was successfully transferred into Grade ${grade} - ${section}.`,
              ]
            );
          } catch (nErr) {
            console.warn('Transfer-in student audit notice:', nErr.message);
          }
        }
      } catch (dbErr) {
        console.error('âŒ DB transfer-in student error:', dbErr.message || dbErr);
      }
    }


    return res.json({
      success: true,
      message: `Student ${lrn} successfully transferred in and enrolled in ${grade} - ${section}.`,
      student: transferredStudent,
    });
  } catch (err) {
    console.error('Error transferring in student:', err);
    return res.status(500).json({ success: false, error: 'Failed to process student transfer.' });
  }
}

// Helper to safely resolve passage UUID from ID, number, set name, or title
async function resolvePassageUuid(rawPassageId) {
  if (!rawPassageId) return null;
  const str = String(rawPassageId).trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  if (isUuid) return str;

  try {
    const res = await db.query(
      `SELECT passage_id FROM phil_iri_passages 
       WHERE passage_id::text = $1 
          OR passage_set ILIKE $1 
          OR title ILIKE $1 
       LIMIT 1`,
      [str]
    );
    if (res.rows?.[0]?.passage_id) return res.rows[0].passage_id;

    // Fallback: pick the first available passage in database
    const fallback = await db.query(`SELECT passage_id FROM phil_iri_passages ORDER BY created_at ASC LIMIT 1`);
    return fallback.rows?.[0]?.passage_id || null;
  } catch (_) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/students/assessment/submit — Submit Phil-IRI assessment & compute DepEd profile
// ---------------------------------------------------------------------------
async function submitPhilIriAssessment(req, res) {
  try {
    const { studentId, lrn, assessmentType, score, maxScore, wordAccuracy, readingTimeSeconds, wordsRead } = req.body;

    if (!studentId && !lrn) {
      return res.status(400).json({ success: false, error: 'Student ID or LRN is required.' });
    }

    if (process.env.DATABASE_URL) {
      try {
        // Resolve student_id from student_id, user_id, or lrn
        let resolvedStudentId = null;
        if (studentId) {
          const sRes = await db.query(
            `SELECT student_id FROM students WHERE student_id::text = $1 OR user_id::text = $1 LIMIT 1`,
            [String(studentId).trim()]
          );
          if (sRes.rows?.[0]) resolvedStudentId = sRes.rows[0].student_id;
        }
        if (!resolvedStudentId && lrn) {
          const sRes = await db.query(
            `SELECT student_id FROM students WHERE TRIM(lrn) = $1 LIMIT 1`,
            [String(lrn).trim()]
          );
          if (sRes.rows?.[0]) resolvedStudentId = sRes.rows[0].student_id;
        }

        if (!resolvedStudentId) {
          resolvedStudentId = studentId;
        }

        // Resolve valid UUID for passage_id
        const validPassageId = await resolvePassageUuid(req.body.passageId);

        let passageLang = 'fil';
        let passageWordCount = 0;
        if (validPassageId) {
          try {
            const pRow = await db.query(
              `SELECT language, word_count, content_text FROM phil_iri_passages WHERE passage_id = $1 LIMIT 1`,
              [validPassageId]
            );
            if (pRow.rows?.[0]) {
              if (pRow.rows[0].language) {
                passageLang = pRow.rows[0].language.toLowerCase().startsWith('en') ? 'en' : 'fil';
              }
              if (pRow.rows[0].word_count) {
                passageWordCount = Number(pRow.rows[0].word_count);
              } else if (pRow.rows[0].content_text) {
                passageWordCount = pRow.rows[0].content_text.trim().split(/\s+/).filter(Boolean).length;
              }
            }
          } catch (_) {}
        }

        // Calculate score percentage & DepEd reading level classification
        const numScore = Number(score || 0);
        const numMax = Number(maxScore || 10) || 10;
        const compPct = Math.round((numScore / numMax) * 100);
        const accPct = Number(wordAccuracy !== undefined && wordAccuracy !== null ? wordAccuracy : compPct);
        const aType = (assessmentType || 'oral').toLowerCase();
        const readSecs = Number(readingTimeSeconds) || 0;
        const totalWords = Number(wordsRead) || passageWordCount || 115;
        const computedWpm = readSecs > 0 ? Math.round((totalWords / readSecs) * 60) : (totalWords > 0 ? totalWords : 115);

        const { getPhilIriOralProfile, getPhilIriListeningProfile, getPhilIriSilentProfile } = require('../services/miscueEngine.js');

        let newLevel = 'Instructional';
        if (aType === 'oral') {
          newLevel = getPhilIriOralProfile(accPct, compPct);
        } else if (aType === 'listening') {
          newLevel = getPhilIriListeningProfile(compPct);
        } else if (aType === 'silent') {
          newLevel = getPhilIriSilentProfile(computedWpm, compPct, 'Grade 4', passageLang);
        }

        // 1. Normalized table upsert (student_reading_profiles — Single Source of Truth)
        try {
          await db.query(
            `INSERT INTO student_reading_profiles (
               student_id, language, assessment_type, assessment_period,
               profile_level, accuracy_rate, comprehension_rate, speed_wpm, updated_at
             )
             VALUES ($1, $2, $3, 'pre_test', $4, $5, $6, $7, CURRENT_TIMESTAMP)
             ON CONFLICT (student_id, language, assessment_type, assessment_period)
             DO UPDATE SET
               profile_level = $4,
               accuracy_rate = COALESCE($5, student_reading_profiles.accuracy_rate),
               comprehension_rate = COALESCE($6, student_reading_profiles.comprehension_rate),
               speed_wpm = COALESCE(NULLIF($7, 0), student_reading_profiles.speed_wpm),
               updated_at = CURRENT_TIMESTAMP`,
            [
              resolvedStudentId,
              passageLang || 'fil',
              aType,
              newLevel,
              aType === 'oral' ? accPct : null,
              compPct,
              (computedWpm || wordsRead || 0)
            ]
          );
        } catch (normErr) {
          console.warn('[submitPhilIriAssessment] student_reading_profiles upsert notice:', normErr.message);
        }

        // Resolve or create assessment record in assessments table
        let assessmentId = null;
        if (validPassageId) {
          const aRes = await db.query(
            `SELECT assessment_id FROM assessments 
             WHERE student_id = $1 AND passage_id = $2 AND LOWER(assessment_type) = LOWER($3) 
             LIMIT 1`,
            [resolvedStudentId, validPassageId, assessmentType || 'oral']
          );
          assessmentId = aRes.rows?.[0]?.assessment_id;
        }
        if (!assessmentId) {
          const aRes = await db.query(
            `SELECT assessment_id FROM assessments 
             WHERE student_id = $1 AND LOWER(assessment_type) = LOWER($2) 
             ORDER BY created_at DESC LIMIT 1`,
            [resolvedStudentId, assessmentType || 'oral']
          );
          assessmentId = aRes.rows?.[0]?.assessment_id;
        }

        const targetStatus = aType === 'oral' ? 'pending_review' : 'completed';

        if (!assessmentId) {
          const aRes = await db.query(
            `INSERT INTO assessments (student_id, passage_id, assessment_type, assessment_period, status, reading_level_result)
             VALUES ($1, $2, $3, 'pre_test', $4, $5) RETURNING assessment_id`,
            [resolvedStudentId, validPassageId, assessmentType || 'oral', targetStatus, newLevel]
          );
          assessmentId = aRes.rows?.[0]?.assessment_id;
        } else {
          await db.query(
            `UPDATE assessments SET status = $1, reading_level_result = $2, updated_at = CURRENT_TIMESTAMP WHERE assessment_id = $3`,
            [targetStatus, newLevel, assessmentId]
          );
        }

        // Link last_assessment_id into student_reading_profiles for direct traceability
        if (assessmentId) {
          try {
            await db.query(
              `UPDATE student_reading_profiles
               SET last_assessment_id = $1, updated_at = CURRENT_TIMESTAMP
               WHERE student_id = $2 AND language = $3 AND assessment_type = $4 AND assessment_period = 'pre_test'`,
              [assessmentId, resolvedStudentId, passageLang || 'fil', aType]
            );
          } catch (linkErr) {
            console.warn('[submitPhilIriAssessment] Link last_assessment_id notice:', linkErr.message);
          }
        }

        // Record attempt in assessment_attempts (saving total_score)
        let attemptId = null;
        try {
          const existingAttempt = await db.query(
            `SELECT attempt_id FROM assessment_attempts WHERE assessment_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [assessmentId]
          );

          if (existingAttempt.rows?.[0]?.attempt_id) {
            attemptId = existingAttempt.rows[0].attempt_id;
            await db.query(
              `UPDATE assessment_attempts 
               SET total_score = $1, status = $2, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
               WHERE attempt_id = $3`,
              [numScore, targetStatus, attemptId]
            );
          } else {
            const attemptRes = await db.query(
              `INSERT INTO assessment_attempts (assessment_id, status, total_score, completed_at)
               VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
               RETURNING attempt_id`,
              [assessmentId, targetStatus, numScore]
            );
            attemptId = attemptRes.rows?.[0]?.attempt_id;
          }

          // Populate oral or silent reading results
          if (attemptId && assessmentType === 'oral') {
            const existingOral = await db.query(
              `SELECT oral_result_id FROM oral_reading_results WHERE assessment_attempt_id = $1 LIMIT 1`,
              [attemptId]
            );
            if (existingOral.rows?.[0]?.oral_result_id) {
              await db.query(
                `UPDATE oral_reading_results SET
                   words_read = COALESCE(NULLIF($1, 0), words_read, 50),
                   reading_time_seconds = COALESCE(NULLIF($2, 0), reading_time_seconds, 60),
                   fluency_score = COALESCE(fluency_score, $3),
                   pronunciation_score = COALESCE(pronunciation_score, $4),
                   comprehension_score = $5,
                   accuracy_percentage = COALESCE(accuracy_percentage, $4),
                   updated_at = CURRENT_TIMESTAMP
                 WHERE assessment_attempt_id = $6`,
                [wordsRead || 0, readingTimeSeconds || 60, accPct, accPct, compPct, attemptId]
              );
            } else {
              await db.query(
                `INSERT INTO oral_reading_results (
                   assessment_attempt_id, words_read, reading_time_seconds,
                   fluency_score, pronunciation_score, comprehension_score, accuracy_percentage
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [attemptId, wordsRead || 50, readingTimeSeconds || 60, accPct, accPct, compPct, accPct]
              );
            }
          } else if (attemptId && assessmentType === 'silent') {
            const existingSilent = await db.query(
              `SELECT silent_result_id FROM silent_reading_results WHERE assessment_attempt_id = $1 LIMIT 1`,
              [attemptId]
            );
            if (existingSilent.rows?.[0]?.silent_result_id) {
              await db.query(
                `UPDATE silent_reading_results SET
                   reading_time_seconds = COALESCE(NULLIF($1, 0), reading_time_seconds, 60),
                   comprehension_score = $2
                 WHERE assessment_attempt_id = $3`,
                [readingTimeSeconds || 60, compPct, attemptId]
              );
            } else {
              await db.query(
                `INSERT INTO silent_reading_results (assessment_attempt_id, reading_time_seconds, comprehension_score)
                 VALUES ($1, $2, $3)`,
                [attemptId, readingTimeSeconds || 60, compPct]
              );
            }
          } else if (attemptId && assessmentType === 'listening') {
            const estimatedAudioSeconds = passageWordCount > 0 ? Math.round((passageWordCount / 130) * 60) : 60;
            const finalAudioSeconds = Number(readingTimeSeconds) > 0 ? Number(readingTimeSeconds) : estimatedAudioSeconds;

            const existingListening = await db.query(
              `SELECT listening_result_id FROM listening_reading_results WHERE assessment_attempt_id = $1 LIMIT 1`,
              [attemptId]
            );
            if (existingListening.rows?.[0]?.listening_result_id) {
              await db.query(
                `UPDATE listening_reading_results SET
                   audio_duration_seconds = COALESCE(NULLIF($1, 0), audio_duration_seconds, $2),
                   comprehension_score = $3
                 WHERE assessment_attempt_id = $4`,
                [finalAudioSeconds, estimatedAudioSeconds, compPct, attemptId]
              );
            } else {
              await db.query(
                `INSERT INTO listening_reading_results (assessment_attempt_id, audio_duration_seconds, comprehension_score)
                 VALUES ($1, $2, $3)`,
                [attemptId, finalAudioSeconds, compPct]
              );
            }
          }

          // Populate assessment_answers table
          if (attemptId && Array.isArray(req.body.answers) && req.body.answers.length > 0) {
            await db.query(`DELETE FROM assessment_answers WHERE assessment_attempt_id = $1`, [attemptId]);

            const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

            for (let i = 0; i < req.body.answers.length; i++) {
              const ans = req.body.answers[i];
              let qId = ans.questionId;

              // If questionId is not a valid UUID, find it by passage_id & index
              if (!qId || !isUuid(qId)) {
                if (validPassageId) {
                  const qRes = await db.query(
                    `SELECT question_id FROM phil_iri_questions 
                     WHERE passage_id = $1 
                     ORDER BY created_at ASC, question_id ASC 
                     OFFSET $2 LIMIT 1`,
                    [validPassageId, ans.questionIndex !== undefined ? ans.questionIndex : i]
                  );
                  if (qRes.rows?.[0]?.question_id) {
                    qId = qRes.rows[0].question_id;
                  }
                }
              }

              // If still no question_id in DB, generate question record so foreign key succeeds
              if ((!qId || !isUuid(qId)) && validPassageId) {
                const newQ = await db.query(
                  `INSERT INTO phil_iri_questions (passage_id, question_text, question_type)
                   VALUES ($1, $2, 'Multiple Choice') RETURNING question_id`,
                  [validPassageId, ans.questionText || `Question ${i + 1}`]
                );
                qId = newQ.rows?.[0]?.question_id;
              }

              if (qId && isUuid(qId)) {
                let selChoiceId = null;
                if (ans.selectedChoiceId && isUuid(ans.selectedChoiceId)) {
                  selChoiceId = ans.selectedChoiceId;
                } else if (ans.selectedChoiceIndex !== undefined && ans.selectedChoiceIndex !== null) {
                  const cRes = await db.query(
                    `SELECT choice_id FROM phil_iri_question_choices 
                     WHERE question_id = $1 
                     ORDER BY choice_id ASC OFFSET $2 LIMIT 1`,
                    [qId, ans.selectedChoiceIndex]
                  );
                  if (cRes.rows?.[0]?.choice_id) {
                    selChoiceId = cRes.rows[0].choice_id;
                  }
                }

                const isCorrect = ans.isCorrect === true;
                const scoreVal = isCorrect ? 1.0 : 0.0;

                await db.query(
                  `INSERT INTO assessment_answers (
                     assessment_attempt_id, phil_iri_question_id, selected_choice_id, answer_text, is_correct, score
                   ) VALUES ($1, $2, $3, $4, $5, $6)`,
                  [attemptId, qId, selChoiceId, ans.selectedAnswerText || '', isCorrect, scoreVal]
                );
              }
            }
          }
        } catch (attErr) {
          console.error('[submitPhilIriAssessment] Error saving assessment details:', attErr);
        }

        // Auto-grant First Step badge if first test completed
        try {
          await db.query(
            `INSERT INTO student_badges (student_id, badge_id, awarded_at)
             SELECT $1, badge_id, CURRENT_TIMESTAMP FROM badges WHERE name ILIKE '%First Step%' OR code = 'BADGE_FIRST_TEST'
             ON CONFLICT DO NOTHING`,
            [resolvedStudentId]
          );
          if (newLevel === 'Independent') {
            await db.query(
              `INSERT INTO student_badges (student_id, badge_id, awarded_at)
               SELECT $1, badge_id, CURRENT_TIMESTAMP FROM badges WHERE name ILIKE '%Independent%' OR code = 'BADGE_INDEPENDENT'
               ON CONFLICT DO NOTHING`,
              [resolvedStudentId]
            );
          }
        } catch (badgeErr) {}

        return res.json({
          success: true,
          message: 'Phil-IRI assessment submitted successfully.',
          result: {
            readingLevel: newLevel,
            comprehensionPercentage: compPct,
            accuracyPercentage: accPct,
          },
        });
      } catch (dbErr) {
        console.warn('DB Phil-IRI submission notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: 'Phil-IRI assessment recorded locally.',
      result: { readingLevel: 'Instructional', comprehensionPercentage: 80, accuracyPercentage: 90 },
    });
  } catch (error) {
    console.error('Error submitting Phil-IRI assessment:', error);
    return res.status(500).json({ success: false, error: 'Failed to record Phil-IRI assessment.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/students/story/complete â€” Mark story completed and award story badges
// ---------------------------------------------------------------------------
async function completeStoryProgress(req, res) {
  try {
    const { studentId, lrn, bookTitle, score, totalQuestions } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        let resolvedStudentId = studentId;
        if (!resolvedStudentId && lrn) {
          const sRes = await db.query(`SELECT student_id FROM students WHERE TRIM(lrn) = $1 LIMIT 1`, [String(lrn).trim()]);
          if (sRes.rows?.[0]) resolvedStudentId = sRes.rows[0].student_id;
        }

        if (!resolvedStudentId) {
          const firstStd = await db.query(`SELECT student_id FROM students LIMIT 1`);
          if (firstStd.rows?.[0]) resolvedStudentId = firstStd.rows[0].student_id;
        }

        if (resolvedStudentId) {
          // Resolve material_id by title or fallback to first material
          let materialId;
          if (bookTitle) {
            const mRes = await db.query(`SELECT material_id FROM reading_materials WHERE LOWER(title) LIKE LOWER($1) LIMIT 1`, [`%${bookTitle}%`]);
            if (mRes.rows?.[0]) materialId = mRes.rows[0].material_id;
          }

          if (!materialId) {
            const fmRes = await db.query(`SELECT material_id FROM reading_materials LIMIT 1`);
            if (fmRes.rows?.[0]) materialId = fmRes.rows[0].material_id;
          }

          if (materialId) {
            await db.query(
              `INSERT INTO student_story_progress (student_id, material_id, status, quiz_score, completed_at)
               VALUES ($1, $2, 'completed', $3, CURRENT_TIMESTAMP)
               ON CONFLICT (student_id, material_id)
               DO UPDATE SET status = 'completed', quiz_score = $3, completed_at = CURRENT_TIMESTAMP`,
              [resolvedStudentId, materialId, Number(score || 0)]
            );

            // Auto-grant Bookworm badge
            try {
              await db.query(
                `INSERT INTO student_badges (student_id, badge_id, awarded_at)
                 SELECT $1, badge_id, CURRENT_TIMESTAMP FROM badges WHERE name ILIKE '%Bookworm%' OR code = 'BADGE_BOOKWORM'
                 ON CONFLICT DO NOTHING`,
                [resolvedStudentId]
              );
            } catch (bErr) {}
          }
        }
      } catch (dbErr) {
        console.warn('Notice saving story progress:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'Story progress completed & recorded.' });
  } catch (error) {
    console.error('Error completing story progress:', error);
    return res.status(500).json({ success: false, error: 'Failed to record story progress.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/students/activity/complete â€” Record completed activity attempt
// ---------------------------------------------------------------------------
async function completeActivityProgress(req, res) {
  try {
    const { studentId, lrn, activityTitle, activityType, score } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        let resolvedStudentId = studentId;
        if (!resolvedStudentId && lrn) {
          const sRes = await db.query(`SELECT student_id FROM students WHERE TRIM(lrn) = $1 LIMIT 1`, [String(lrn).trim()]);
          if (sRes.rows?.[0]) resolvedStudentId = sRes.rows[0].student_id;
        }

        if (!resolvedStudentId) {
          const firstStd = await db.query(`SELECT student_id FROM students LIMIT 1`);
          if (firstStd.rows?.[0]) resolvedStudentId = firstStd.rows[0].student_id;
        }

        if (resolvedStudentId) {
          let activityId;
          if (activityTitle) {
            const actRes = await db.query(`SELECT activity_id FROM activities WHERE LOWER(title) LIKE LOWER($1) LIMIT 1`, [`%${activityTitle}%`]);
            if (actRes.rows?.[0]) activityId = actRes.rows[0].activity_id;
          }

          if (!activityId) {
            const factRes = await db.query(`SELECT activity_id FROM activities LIMIT 1`);
            if (factRes.rows?.[0]) activityId = factRes.rows[0].activity_id;
          }

          if (activityId) {
            await db.query(
              `INSERT INTO activity_attempts (activity_id, student_id, score, status, completed_at)
               VALUES ($1, $2, $3, 'completed', CURRENT_TIMESTAMP)
               ON CONFLICT DO NOTHING`,
              [activityId, resolvedStudentId, Number(score || 100)]
            );
          }
        }
      } catch (dbErr) {
        console.warn('Notice saving activity attempt:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'Activity attempt completed & recorded.' });
  } catch (error) {
    console.error('Error recording activity attempt:', error);
    return res.status(500).json({ success: false, error: 'Failed to record activity attempt.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/student/assessments/passages â€” Get DepEd Phil-IRI passages
// ---------------------------------------------------------------------------
async function getPhilIriPassages(req, res) {
  try {
    const { grade, set, language } = req.query;

    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, count: 0, passages: [] });
    }

    let query = `
      SELECT 
        passage_id AS id,
        title,
        grade_level AS "gradeLevel",
        passage_set AS set,
        language,
        status,
        content_text AS text,
        word_count AS words
      FROM phil_iri_passages
      WHERE status != 'archived'
    `;
    const params = [];

    if (grade) {
      params.push(grade);
      query += ` AND LOWER(grade_level) = LOWER($${params.length})`;
    }
    if (set) {
      params.push(set);
      query += ` AND LOWER(passage_set) = LOWER($${params.length})`;
    }
    if (language) {
      const langCode = String(language).toLowerCase().includes('english') || language === 'en' ? 'en' : 'fil';
      params.push(langCode);
      query += ` AND LOWER(language) = LOWER($${params.length})`;
    }

    query += ` ORDER BY created_at DESC`;

    const { rows: passages } = await db.query(query, params);

    return res.json({
      success: true,
      count: passages.length,
      passages,
    });
  } catch (error) {
    console.error('Error fetching Phil-IRI passages:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch Phil-IRI passages.' });
  }
}

// In-memory active assignments storage fallback
const activePhilIriAssignments = new Map();

/**
 * POST /api/student/assessment/assign â€” Assign specific Phil-IRI Set & Period to a student or grade level
 */
async function assignPhilIriToStudent(req, res) {
  try {
    const { studentId, lrn, gradeLevel, set, period, assessmentType } = req.body;
    const targetSet = set || 'Set A';
    const targetPeriod = period || 'Pre-Test';
    const targetGrade = gradeLevel || 'Grade 4';
    const targetType = assessmentType || 'oral';

    const assignmentObj = {
      studentId: studentId || lrn || 'ALL',
      lrn: lrn || 'ALL',
      gradeLevel: targetGrade,
      set: targetSet,
      period: targetPeriod,
      assessmentType: targetType,
      assignedAt: new Date().toISOString(),
    };

    if (lrn) {
      activePhilIriAssignments.set(`lrn_${lrn}`, assignmentObj);
    }
    activePhilIriAssignments.set(`grade_${targetGrade}_${targetType}`, assignmentObj);

    return res.json({
      success: true,
      message: `Assigned Phil-IRI ${targetSet} (${targetPeriod}) successfully.`,
      assignment: assignmentObj,
    });
  } catch (error) {
    console.error('Error assigning Phil-IRI set:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign Phil-IRI set.' });
  }
}

/**
 * GET /api/student/assessment/my-assignment â€” Get active Phil-IRI assignment for student
 */
async function getStudentActiveAssignment(req, res) {
  try {
    const { lrn: queryLrn } = req.query || {};
    const studentUser = req.user || {};

    // Extract identity from JWT token (createToken stores id = users.user_id)
    const tokenUserId = studentUser.id || studentUser.user_id || studentUser.userId || null;
    const tokenLrn = (queryLrn || studentUser.lrn || '').trim();

    console.log('[getStudentActiveAssignment] tokenUserId:', tokenUserId, '| tokenLrn:', tokenLrn);

    let targetStudentId = null;
    let targetGrade = 'Grade 4';
    let resolvedLrn = tokenLrn;
    let assignedActivities = [];
    let attemptsStatus = { listening: false, oral: false, silent: false };

    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, hasAssignment: false, assignedActivities: [], attemptsStatus });
    }

    // â”€â”€â”€ Step 0: Resolve students.student_id from users.user_id or LRN â”€â”€â”€â”€â”€â”€â”€â”€â”€
    try {
      let sRow = null;
      if (tokenUserId) {
        const sRes = await db.query(
          `SELECT s.student_id, s.lrn FROM students s WHERE s.user_id = $1 LIMIT 1`,
          [tokenUserId]
        );
        sRow = sRes.rows[0] || null;
      }
      if (!sRow && tokenLrn) {
        const sRes = await db.query(
          `SELECT s.student_id, s.lrn FROM students s WHERE s.lrn = $1 LIMIT 1`,
          [tokenLrn]
        );
        sRow = sRes.rows[0] || null;
      }

      if (sRow) {
        targetStudentId = sRow.student_id;
        resolvedLrn = sRow.lrn || tokenLrn;
        console.log('[getStudentActiveAssignment] resolved student_id:', targetStudentId);

        // Get grade_level from student_grade_history â†’ classes
        const gradeRes = await db.query(
          `SELECT c.grade_level
           FROM student_grade_history sgh
           JOIN classes c ON sgh.class_id = c.class_id
           WHERE sgh.student_id = $1
           ORDER BY sgh.created_at DESC LIMIT 1`,
          [targetStudentId]
        );
        if (gradeRes.rows[0]?.grade_level) {
          targetGrade = gradeRes.rows[0].grade_level;
        }
      } else {
        console.warn('[getStudentActiveAssignment] No student record found for userId:', tokenUserId, 'lrn:', tokenLrn);
      }
    } catch (resolveErr) {
      console.error('[getStudentActiveAssignment] student resolve error:', resolveErr.message);
    }

    // ——— Step 1: Fetch assessments assigned to this student ————————————————————
    if (targetStudentId) {
      try {
        const aRes = await db.query(
          `SELECT
             a.assessment_id   AS "assessmentId",
             a.student_id      AS "studentId",
             a.passage_id      AS "passageId",
             LOWER(a.assessment_type)   AS "assessmentType",
             LOWER(a.assessment_period) AS "period",
             a.due_date        AS "dueDate",
             a.instructions    AS "instructions",
             CASE WHEN LOWER(a.status) = 'completed' THEN 'completed' ELSE COALESCE(aa.status, a.status, 'open') END AS status,
             a.created_at      AS "assignedAt",
             p.title,
             p.grade_level     AS "gradeLevel",
             p.passage_set     AS "set",
             COALESCE(p.language, 'fil') AS language,
             p.content_text    AS text,
             p.word_count      AS words
           FROM assessments a
           JOIN phil_iri_passages p ON p.passage_id = a.passage_id
           LEFT JOIN LATERAL (
             SELECT status FROM assessment_attempts
             WHERE assessment_id = a.assessment_id
             ORDER BY completed_at DESC NULLS LAST, created_at DESC NULLS LAST
             LIMIT 1
           ) aa ON true
           WHERE a.student_id = $1
             AND LOWER(COALESCE(a.status, 'open')) != 'cancelled'
           ORDER BY a.created_at DESC`,
          [targetStudentId]
        );
        console.log('[getStudentActiveAssignment] assessment rows found:', aRes.rows.length);

        // ─── Step 2: Fetch completed attempt types for this student ────────────
        try {
          const attRes = await db.query(
            `SELECT DISTINCT 
               CASE 
                 WHEN orr.oral_result_id IS NOT NULL THEN 'oral'
                 ELSE LOWER(a.assessment_type)
               END AS type,
               LOWER(COALESCE(aa.status, a.status, 'open')) AS status,
               LOWER(COALESCE(orr.verification_status, 'pending')) AS vstatus
             FROM assessment_attempts aa
             JOIN assessments a ON a.assessment_id = aa.assessment_id
             LEFT JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
             WHERE a.student_id = $1
               AND LOWER(aa.status) IN ('completed', 'submitted', 'pending_review')`,
            [targetStudentId]
          );
          attRes.rows.forEach((r) => {
            if (r.type === 'listening') {
              attemptsStatus.listening = true;
              attemptsStatus.listening_status = r.status;
            }
            if (r.type === 'oral') {
              const isOralVerified = r.status === 'completed' && r.vstatus === 'verified';
              attemptsStatus.oral = isOralVerified;
              attemptsStatus.oral_verified = isOralVerified;
              attemptsStatus.oral_in_review = (r.status === 'pending_review' || r.status === 'submitted' || r.vstatus === 'pending');
              attemptsStatus.oral_status = isOralVerified ? 'completed' : 'pending_review';
            }
            if (r.type === 'silent') {
              attemptsStatus.silent = true;
              attemptsStatus.silent_status = r.status;
            }
          });
        } catch (attErr) {
          console.warn('[getStudentActiveAssignment] attempts query skipped:', attErr.message);
        }

        // Step 3: Map rows to assignedActivities
        assignedActivities = await Promise.all(
          aRes.rows.map(async (row) => {
            const typeLabel =
              row.assessmentType === 'oral'      ? 'Oral Reading' :
              row.assessmentType === 'listening' ? 'Listening'    : 'Silent Reading';
            const periodLabel = row.period === 'post_test' ? 'Post-Test' : 'Pre-Test';
            const langLabel   = (row.language || 'fil').toLowerCase().startsWith('en') ? 'English' : 'Filipino';
            const rawSet      = row.set ? String(row.set).trim() : 'Set A';
            const setLabel    = rawSet.toLowerCase().startsWith('set') ? rawSet : `Set ${rawSet}`;

            const statusLower = (row.status || 'open').toLowerCase();
            const isCompleted = statusLower === 'completed';
            const isDone = ['completed', 'submitted', 'pending_review'].includes(statusLower);

            let questions = [];
            try {
              const { rows: qRows } = await db.query(
                `SELECT question_id, question_text, question_type
                 FROM phil_iri_questions
                 WHERE passage_id = $1
                 ORDER BY created_at ASC`,
                [row.passageId]
              );

              questions = await Promise.all(
                qRows.map(async (q) => {
                  const { rows: cRows } = await db.query(
                    `SELECT choice_id, choice_text, is_correct
                     FROM phil_iri_question_choices
                     WHERE question_id = $1
                     ORDER BY choice_id ASC`,
                    [q.question_id]
                  );

                  const options = cRows.map((c) => c.choice_text);
                  const correctIndex = cRows.findIndex((c) => c.is_correct);

                  return {
                    id: q.question_id,
                    question: q.question_text,
                    questionText: q.question_text,
                    type: q.question_type || 'Multiple Choice',
                    options: options.length > 0 ? options : ['Oo', 'Hindi'],
                    correctIndex: correctIndex >= 0 ? correctIndex : 0,
                    correctAnswerIndex: correctIndex >= 0 ? correctIndex : 0,
                  };
                })
              );
            } catch (qErr) {
              console.warn('[getStudentActiveAssignment] question query error:', qErr.message);
            }

            return {
              id:            row.assessmentId,
              assessmentId:  row.assessmentId,
              passageId:     row.passageId,
              title:         `${typeLabel} Assessment (${periodLabel} - ${langLabel})`,
              passageTitle:  row.title,
              assessmentType: row.assessmentType,
              type:          row.assessmentType,
              typeLabel,
              period:        periodLabel,
              rawPeriod:     row.period,
              language:      langLabel,
              rawLanguage:   row.language || 'fil',
              languageLabel: langLabel,
              gradeLevel:    row.gradeLevel || targetGrade,
              passageSet:    setLabel,
              assignedAt:    row.assignedAt,
              createdAt:     row.assignedAt,
              dueDate:       row.dueDate,
              instructions:  row.instructions || null,
              status:        row.status || 'open',
              isCompleted:   isDone,
              questions:     questions,
              passage: {
                id:         row.passageId,
                title:      row.title,
                text:       row.text,
                words:      row.words,
                gradeLevel: row.gradeLevel,
                set:        row.set,
                language:   row.language,
                questions:  questions,
              },
            };
          })
        );
      } catch (queryErr) {
        console.error('[getStudentActiveAssignment] assessment query error:', queryErr.message);
      }
    }

    // Step 4: Fetch student's Phil-IRI Reading Profiles (Overall, Filipino, English 3-modality breakdowns)
    let readingProfiles = {
      currentProfile: 'Pending Evaluation',
      oralProfile: 'Pending Evaluation',
      oralAccuracy: null,
      oralComprehension: null,
      oralWpm: null,
      listeningProfile: 'Pending Evaluation',
      listeningComprehension: null,
      silentProfile: 'Pending Evaluation',
      silentComprehension: null,
      silentWpm: null,
      filipinoProfile: null,
      englishProfile: null,

      // Filipino Modalities
      filOralProfile: 'Pending Evaluation',
      filOralAccuracy: null,
      filOralComprehension: null,
      filOralWpm: null,
      filListeningProfile: 'Pending Evaluation',
      filListeningComprehension: null,
      filSilentProfile: 'Pending Evaluation',
      filSilentComprehension: null,
      filSilentWpm: null,

      // English Modalities
      engOralProfile: 'Pending Evaluation',
      engOralAccuracy: null,
      engOralComprehension: null,
      engOralWpm: null,
      engListeningProfile: 'Pending Evaluation',
      engListeningComprehension: null,
      engSilentProfile: 'Pending Evaluation',
      engSilentComprehension: null,
      engSilentWpm: null,
    };

    if (targetStudentId && process.env.DATABASE_URL) {
      try {
        const rpRes = await db.query(
          `SELECT 
             current_profile_label,
             oral_profile_label,
             oral_accuracy_rate,
             oral_comprehension_rate,
             oral_speed_wpm,
             listening_profile_label,
             listening_comprehension_rate,
             silent_profile_label,
             silent_comprehension_rate,
             silent_speed_wpm,
             filipino_profile_label,
             english_profile_label,
             fil_oral_profile_label,
             fil_oral_accuracy_rate,
             fil_oral_comprehension_rate,
             fil_oral_speed_wpm,
             fil_listening_profile_label,
             fil_listening_comprehension_rate,
             fil_silent_profile_label,
             fil_silent_comprehension_rate,
             fil_silent_speed_wpm,
             eng_oral_profile_label,
             eng_oral_accuracy_rate,
             eng_oral_comprehension_rate,
             eng_oral_speed_wpm,
             eng_listening_profile_label,
             eng_listening_comprehension_rate,
             eng_silent_profile_label,
             eng_silent_comprehension_rate,
             eng_silent_speed_wpm
           FROM reading_profiles
           WHERE student_id = $1 LIMIT 1`,
          [targetStudentId]
        );
        if (rpRes.rows?.[0]) {
          const row = rpRes.rows[0];
          readingProfiles = {
            currentProfile: row.current_profile_label || 'Pending Evaluation',
            oralProfile: row.oral_profile_label || 'Pending Evaluation',
            oralAccuracy: row.oral_accuracy_rate,
            oralComprehension: row.oral_comprehension_rate,
            oralWpm: row.oral_speed_wpm,
            listeningProfile: row.listening_profile_label || 'Pending Evaluation',
            listeningComprehension: row.listening_comprehension_rate,
            silentProfile: row.silent_profile_label || 'Pending Evaluation',
            silentComprehension: row.silent_comprehension_rate,
            silentWpm: row.silent_speed_wpm,
            filipinoProfile: row.filipino_profile_label,
            englishProfile: row.english_profile_label,

            // Filipino Modalities
            filOralProfile: row.fil_oral_profile_label || 'Pending Evaluation',
            filOralAccuracy: row.fil_oral_accuracy_rate,
            filOralComprehension: row.fil_oral_comprehension_rate,
            filOralWpm: row.fil_oral_speed_wpm,
            filListeningProfile: row.fil_listening_profile_label || 'Pending Evaluation',
            filListeningComprehension: row.fil_listening_comprehension_rate,
            filSilentProfile: row.fil_silent_profile_label || 'Pending Evaluation',
            filSilentComprehension: row.fil_silent_comprehension_rate,
            filSilentWpm: row.fil_silent_speed_wpm,

            // English Modalities
            engOralProfile: row.eng_oral_profile_label || 'Pending Evaluation',
            engOralAccuracy: row.eng_oral_accuracy_rate,
            engOralComprehension: row.eng_oral_comprehension_rate,
            engOralWpm: row.eng_oral_speed_wpm,
            engListeningProfile: row.eng_listening_profile_label || 'Pending Evaluation',
            engListeningComprehension: row.eng_listening_comprehension_rate,
            engSilentProfile: row.eng_silent_profile_label || 'Pending Evaluation',
            engSilentComprehension: row.eng_silent_comprehension_rate,
            engSilentWpm: row.eng_silent_speed_wpm,
          };
        }

        // Fallback or fill from normalized student_reading_profiles table
        try {
          const normRes = await db.query(
            `SELECT language, assessment_type, profile_level, accuracy_rate, comprehension_rate, speed_wpm
             FROM student_reading_profiles
             WHERE student_id = $1`,
            [targetStudentId]
          );
          if (normRes.rows && normRes.rows.length > 0) {
            for (const r of normRes.rows) {
              const lang = (r.language || 'fil').toLowerCase();
              const type = (r.assessment_type || 'oral').toLowerCase();
              if (lang.startsWith('fil')) {
                if (type === 'oral') {
                  if (readingProfiles.filOralProfile === 'Pending Evaluation') readingProfiles.filOralProfile = r.profile_level;
                  if (readingProfiles.filOralAccuracy == null) readingProfiles.filOralAccuracy = r.accuracy_rate;
                  if (readingProfiles.filOralComprehension == null) readingProfiles.filOralComprehension = r.comprehension_rate;
                  if (readingProfiles.filOralWpm == null) readingProfiles.filOralWpm = r.speed_wpm;
                } else if (type === 'listening') {
                  if (readingProfiles.filListeningProfile === 'Pending Evaluation') readingProfiles.filListeningProfile = r.profile_level;
                  if (readingProfiles.filListeningComprehension == null) readingProfiles.filListeningComprehension = r.comprehension_rate;
                } else if (type === 'silent') {
                  if (readingProfiles.filSilentProfile === 'Pending Evaluation') readingProfiles.filSilentProfile = r.profile_level;
                  if (readingProfiles.filSilentComprehension == null) readingProfiles.filSilentComprehension = r.comprehension_rate;
                  if (readingProfiles.filSilentWpm == null) readingProfiles.filSilentWpm = r.speed_wpm;
                }
              } else if (lang.startsWith('en')) {
                if (type === 'oral') {
                  if (readingProfiles.engOralProfile === 'Pending Evaluation') readingProfiles.engOralProfile = r.profile_level;
                  if (readingProfiles.engOralAccuracy == null) readingProfiles.engOralAccuracy = r.accuracy_rate;
                  if (readingProfiles.engOralComprehension == null) readingProfiles.engOralComprehension = r.comprehension_rate;
                  if (readingProfiles.engOralWpm == null) readingProfiles.engOralWpm = r.speed_wpm;
                } else if (type === 'listening') {
                  if (readingProfiles.engListeningProfile === 'Pending Evaluation') readingProfiles.engListeningProfile = r.profile_level;
                  if (readingProfiles.engListeningComprehension == null) readingProfiles.engListeningComprehension = r.comprehension_rate;
                } else if (type === 'silent') {
                  if (readingProfiles.engSilentProfile === 'Pending Evaluation') readingProfiles.engSilentProfile = r.profile_level;
                  if (readingProfiles.engSilentComprehension == null) readingProfiles.engSilentComprehension = r.comprehension_rate;
                  if (readingProfiles.engSilentWpm == null) readingProfiles.engSilentWpm = r.speed_wpm;
                }
              }
            }
          }
        } catch (normQueryErr) {
          console.warn('[getStudentActiveAssignment] normalized reading profiles query notice:', normQueryErr.message);
        }
      } catch (rpErr) {
        console.warn('[getStudentActiveAssignment] reading_profiles query notice:', rpErr.message);
      }
    }

    return res.json({
      success: true,
      hasAssignment: assignedActivities.length > 0,
      assignedActivities,
      attemptsStatus,
      readingProfiles,
      studentId: targetStudentId,
      lrn: resolvedLrn,
      gradeLevel: targetGrade,
    });
  } catch (error) {
    console.error('[getStudentActiveAssignment] unhandled error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch assignment.', debug: error?.message || String(error) });
  }
}

// ---------------------------------------------------------------------------
// POST /api/students/assessment/submit-oral-audio â€” Submit Oral Audio & Speech-to-Text Miscue Analysis
// ---------------------------------------------------------------------------
async function submitStudentOralAudio(req, res) {
  const fs = require('fs');
  const { analyzeOralReading } = require('../services/miscueEngine.js');
  const { transcribeAudio } = require('../services/sttService.js');

  const tempPath = req.file?.path;

  try {
    const studentId = req.body.studentId || req.body.student_id;
    const passageId = req.body.passageId || req.body.passage_id || 1;
    const transcriptText = req.body.transcriptText || req.body.transcript_text || 'Oral Reading Assessment';
    const readingTimeSeconds = Number(req.body.readingTimeSeconds || req.body.reading_time_seconds || 60);

    let audioUrl = req.body.audioUrl || req.body.audio_url || '';

    // 1. Process audio through FFmpeg & DeepFilterNet AI Denoising Pipeline first
    let audioToProcess = tempPath;
    let denoisedFilePath = tempPath;

    if (tempPath && fs.existsSync(tempPath)) {
      try {
        const { denoiseAudio } = require('../utils/audioDenoise.util.js');
        const denoiseResult = await denoiseAudio(tempPath);
        denoisedFilePath = typeof denoiseResult === 'string'
          ? denoiseResult
          : (denoiseResult.enhancedPath || denoiseResult.originalPath || tempPath);
      } catch (denoiseErr) {
        console.warn('[submitStudentOralAudio] Denoise notice:', denoiseErr.message);
      }
    }

    // Resolve passage text & language before STT to condition vocabulary prompt
    let passageLanguage = 'tl';
    let passageText = transcriptText;
    const validPassageId = await resolvePassageUuid(passageId);

    if (validPassageId && process.env.DATABASE_URL) {
      try {
        const pRes = await db.query(`SELECT content_text, COALESCE(language, 'fil') AS language FROM phil_iri_passages WHERE passage_id = $1 LIMIT 1`, [validPassageId]);
        if (pRes.rows?.[0]) {
          if (pRes.rows[0].content_text) passageText = pRes.rows[0].content_text;
          if (pRes.rows[0].language) passageLanguage = pRes.rows[0].language;
        }
      } catch (pErr) {
        console.warn('[submitStudentOralAudio] Notice resolving passage:', pErr.message);
      }
    }

    // 2. Perform Groq STT Transcription on the Denoised & Enhanced Audio with vocabulary conditioning
    let sttResult = null;
    let spokenTranscriptText = transcriptText || '';
    const sttAudioPath = (denoisedFilePath && fs.existsSync(denoisedFilePath)) ? denoisedFilePath : tempPath;

    if (sttAudioPath && fs.existsSync(sttAudioPath)) {
      try {
        sttResult = await transcribeAudio(sttAudioPath, passageLanguage, req.file?.originalname || '', passageText);
        if (sttResult) {
          spokenTranscriptText = typeof sttResult === 'string' ? sttResult : (sttResult.text || '');
          console.log('[submitStudentOralAudio] Groq STT transcription text:', spokenTranscriptText);
        }
      } catch (sttErr) {
        console.warn('[submitStudentOralAudio] STT transcription notice:', sttErr.message);
      }
    }

    // 3. Upload the single denoised audio file to Cloudinary and cleanup temp files
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        const { cloudinary } = require('../config/cloudinary.js');
        const fileToUpload = (denoisedFilePath && fs.existsSync(denoisedFilePath)) ? denoisedFilePath : tempPath;
        
        const cloudRes = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            fileToUpload,
            {
              resource_type: 'video',
              folder: 'salintinig/oral_recordings',
              format: 'mp3',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
        });

        if (cloudRes?.secure_url) {
          audioUrl = cloudRes.secure_url;
        }
      } catch (uploadErr) {
        console.warn('[submitStudentOralAudio] Cloudinary upload notice:', uploadErr.message);
      } finally {
        const { cleanupTempAudio } = require('../utils/audioDenoise.util.js');
        cleanupTempAudio(tempPath);
      }
    }

    if (process.env.DATABASE_URL) {
      // Resolve student_id
      let resolvedStudentId = null;
      if (studentId) {
        const sRes = await db.query(
          `SELECT student_id FROM students WHERE student_id::text = $1 OR user_id::text = $1 LIMIT 1`,
          [String(studentId).trim()]
        );
        if (sRes.rows?.[0]) resolvedStudentId = sRes.rows[0].student_id;
      }
      if (!resolvedStudentId) resolvedStudentId = studentId;

      // Perform AI miscue analysis with timestamped hesitation & repetition detection
      const analysis = analyzeOralReading(passageText, sttResult || spokenTranscriptText, readingTimeSeconds);
      const fluencyScore = Number(analysis.readingRateWPM) || 0;
      const pronunciationScore = Number(analysis.accuracyPercentage) || 100;

      // 3. Insert or resolve active assessment ID and attempt ID
      let activeAssessmentId = req.body.assessmentId;
      if (!activeAssessmentId && validPassageId) {
        const existing = await db.query(
          `SELECT assessment_id FROM assessments WHERE student_id = $1 AND passage_id = $2 AND LOWER(assessment_type) = 'oral' LIMIT 1`,
          [resolvedStudentId, validPassageId]
        );
        if (existing.rows?.[0]?.assessment_id) {
          activeAssessmentId = existing.rows[0].assessment_id;
        }
      }

      if (!activeAssessmentId) {
        const existing = await db.query(
          `SELECT assessment_id FROM assessments WHERE student_id = $1 AND LOWER(assessment_type) = 'oral' ORDER BY created_at DESC LIMIT 1`,
          [resolvedStudentId]
        );
        if (existing.rows?.[0]?.assessment_id) {
          activeAssessmentId = existing.rows[0].assessment_id;
        } else {
          const aRes = await db.query(
            `INSERT INTO assessments (student_id, passage_id, assessment_type, assessment_period, status)
             VALUES ($1, $2, 'oral', 'pre_test', 'submitted') RETURNING assessment_id`,
            [resolvedStudentId, validPassageId]
          );
          activeAssessmentId = aRes.rows?.[0]?.assessment_id;
        }
      }

      // Check if an attempt was just created by the quiz submission API or grab latest attempt
      let attemptId = null;
      const recentAttempt = await db.query(
        `SELECT attempt_id, total_score FROM assessment_attempts 
         WHERE assessment_id = $1 
         ORDER BY created_at DESC LIMIT 1`,
        [activeAssessmentId]
      );
      if (recentAttempt.rows?.[0]?.attempt_id) {
        attemptId = recentAttempt.rows[0].attempt_id;
        await db.query(`UPDATE assessment_attempts SET status = 'pending_review', updated_at = CURRENT_TIMESTAMP WHERE attempt_id = $1`, [attemptId]);
      } else {
        const attemptRes = await db.query(
          `INSERT INTO assessment_attempts (assessment_id, status, completed_at)
           VALUES ($1, 'pending_review', CURRENT_TIMESTAMP) RETURNING attempt_id`,
          [activeAssessmentId]
        );
        attemptId = attemptRes.rows?.[0]?.attempt_id;
      }

      // 4. Check if oral_reading_results record already exists for this attempt
      const existingOral = await db.query(
        `SELECT oral_result_id, comprehension_score FROM oral_reading_results WHERE assessment_attempt_id = $1 LIMIT 1`,
        [attemptId]
      );

      const existingCompScore = existingOral.rows?.[0]?.comprehension_score;

      if (existingOral.rows?.[0]?.oral_result_id) {
        await db.query(
          `UPDATE oral_reading_results SET
             audio_recording_url = $1,
             transcript_text = $2,
             ai_miscues_json = $3,
             verification_status = 'pending',
             reading_time_seconds = $4,
             words_read = $5,
             correct_words = $6,
             reading_rate_wpm = $7,
             accuracy_percentage = $8,
             fluency_score = $9,
             pronunciation_score = $10,
             comprehension_score = COALESCE($11, comprehension_score),
             updated_at = CURRENT_TIMESTAMP
           WHERE assessment_attempt_id = $12`,
          [
            audioUrl || '',
            spokenTranscriptText,
            JSON.stringify(analysis.miscues || []),
            readingTimeSeconds,
            analysis.wordsRead || 0,
            analysis.correctWords || 0,
            analysis.readingRateWPM || 0,
            analysis.accuracyPercentage || 100,
            fluencyScore,
            pronunciationScore,
            existingCompScore,
            attemptId
          ]
        );
      } else {
        await db.query(
          `INSERT INTO oral_reading_results (
             assessment_attempt_id, audio_recording_url, transcript_text,
             ai_miscues_json, verification_status, reading_time_seconds,
             words_read, correct_words, reading_rate_wpm, accuracy_percentage,
             fluency_score, pronunciation_score, comprehension_score
           ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            attemptId,
            audioUrl || '',
            spokenTranscriptText,
            JSON.stringify(analysis.miscues || []),
            readingTimeSeconds,
            analysis.wordsRead || 0,
            analysis.correctWords || 0,
            analysis.readingRateWPM || 0,
            analysis.accuracyPercentage || 100,
            fluencyScore,
            pronunciationScore,
            existingCompScore
          ]
        );
      }

      // Update assessment status to pending teacher review
      await db.query(
        `UPDATE assessments SET status = 'pending_review', updated_at = CURRENT_TIMESTAMP WHERE assessment_id = $1`,
        [activeAssessmentId]
      );

      return res.json({
        success: true,
        message: 'Oral reading audio submitted successfully! Awaiting teacher review.',
        audioUrl,
        analysis: {
          attemptId,
          wordsRead: analysis.wordsRead,
          correctWords: analysis.correctWords,
          wpm: analysis.readingRateWPM,
          accuracyPct: analysis.accuracyPercentage,
          miscuesCount: analysis.miscuesCount,
          miscues: analysis.miscues
        }
      });
    }

    return res.json({ success: true, message: 'Oral assessment submitted (mock mode).', audioUrl });
  } catch (err) {
    console.error('Error in submitStudentOralAudio:', err);
    return res.status(500).json({ success: false, error: 'Failed to submit oral assessment audio.' });
  } finally {
    // 🧹 Auto cleanup temporary file from uploads folder
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
        console.log(`[submitStudentOralAudio] Cleaned up temporary upload file: ${tempPath}`);
      } catch (cleanupErr) {
        console.warn('[submitStudentOralAudio] Temp file cleanup error:', cleanupErr.message);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// POST /api/students/assessment/denoise-test-audio — Denoise audio test clip using FFmpeg
// ---------------------------------------------------------------------------
async function denoiseTestAudio(req, res) {
  try {
    const file = req.file;
    if (!file || !file.path) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded.' });
    }

    const path = require('path');
    const fs = require('fs');
    const { denoiseAudio, cleanupTempAudio } = require('../utils/audioDenoise.util.js');
    const denoiseResult = await denoiseAudio(file.path);
    const targetPath = typeof denoiseResult === 'string' ? denoiseResult : (denoiseResult.originalPath || file.path);

    res.setHeader('Content-Type', 'audio/m4a');
    return res.sendFile(path.resolve(targetPath), (err) => {
      // Auto-cleanup all temporary mic test audio files immediately after sending to client
      cleanupTempAudio(file.path);
    });
  } catch (err) {
    console.error('Error in denoiseTestAudio:', err);
    if (req.file && req.file.path) {
      const path = require('path');
      const { cleanupTempAudio } = require('../utils/audioDenoise.util.js');
      return res.sendFile(path.resolve(req.file.path), () => {
        cleanupTempAudio(req.file.path);
      });
    }
    return res.status(500).json({ success: false, error: 'Failed to denoise test audio.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/students/assessment/start-progress — Update assessment status to 'in_progress'
// ---------------------------------------------------------------------------
async function updateAssessmentStartProgress(req, res) {
  try {
    const studentId = req.body.studentId || req.body.student_id;
    const passageId = req.body.passageId || req.body.passage_id;

    if (!passageId) {
      return res.status(400).json({ success: false, error: 'Passage ID is required.' });
    }

    if (process.env.DATABASE_URL) {
      let resolvedStudentId = null;
      if (studentId) {
        const sRes = await db.query(
          `SELECT student_id FROM students WHERE student_id::text = $1 OR user_id::text = $1 LIMIT 1`,
          [String(studentId).trim()]
        );
        if (sRes.rows?.[0]) resolvedStudentId = sRes.rows[0].student_id;
      }
      if (!resolvedStudentId) resolvedStudentId = studentId;

      if (resolvedStudentId) {
        const typeToMatch = (req.body.assessmentType || req.body.assessment_type || 'oral').toLowerCase();
        const existing = await db.query(
          `SELECT assessment_id FROM assessments WHERE student_id = $1 AND passage_id = $2 AND LOWER(assessment_type) = $3 LIMIT 1`,
          [resolvedStudentId, passageId, typeToMatch]
        );

        if (existing.rows?.[0]?.assessment_id) {
          await db.query(
            `UPDATE assessments SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE assessment_id = $1`,
            [existing.rows[0].assessment_id]
          );
        } else {
          await db.query(
            `INSERT INTO assessments (student_id, passage_id, assessment_type, status)
             VALUES ($1, $2, $3, 'in_progress')`,
            [resolvedStudentId, passageId, typeToMatch]
          );
        }
      }
      return res.json({ success: true, message: 'Assessment status set to in_progress.' });
    }

    return res.json({ success: true, message: 'Assessment status set to in_progress (mock mode).' });
  } catch (err) {
    console.error('Error in updateAssessmentStartProgress:', err);
    return res.status(500).json({ success: false, error: 'Failed to update assessment start progress.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/students/assessment/my-results — Fetch student's completed assessment results
// ---------------------------------------------------------------------------
async function getStudentAssessmentResults(req, res) {
  try {
    let targetStudentId = req.query.studentId || req.user?.student_id || req.user?.studentId || req.user?.userId || req.user?.user_id || req.user?.id;
    
    if (process.env.DATABASE_URL) {
      let resolvedStudentId = targetStudentId;
      let resolvedUserId = targetStudentId;

      if (targetStudentId) {
        const sRes = await db.query(
          `SELECT student_id, user_id FROM students WHERE student_id::text = $1 OR user_id::text = $1 LIMIT 1`,
          [String(targetStudentId).trim()]
        );
        if (sRes.rows?.[0]) {
          resolvedStudentId = sRes.rows[0].student_id;
          resolvedUserId = sRes.rows[0].user_id || targetStudentId;
        }
      } else if (req.user?.lrn) {
        const sRes = await db.query(
          `SELECT student_id, user_id FROM students WHERE TRIM(lrn) = $1 LIMIT 1`,
          [String(req.user.lrn).trim()]
        );
        if (sRes.rows?.[0]) {
          resolvedStudentId = sRes.rows[0].student_id;
          resolvedUserId = sRes.rows[0].user_id;
        }
      }

      if (!resolvedStudentId) {
        resolvedStudentId = '00000000-0000-0000-0000-000000000000';
      }

      const resultsRes = await db.query(
        `SELECT 
           a.assessment_id        AS "assessmentId",
           a.assessment_type      AS "assessmentType",
           a.assessment_period    AS "period",
           a.passage_id           AS "passageId",
           p.title                AS "passageTitle",
           p.language             AS "language",
           aa.attempt_id          AS "attemptId",
           aa.completed_at        AS "completedAt",
           aa.created_at          AS "createdAt",
           aa.total_score         AS "totalScore",
           p.word_count           AS "wordCount",
           COALESCE(orr.reading_rate_wpm, rp.silent_speed_wpm) AS "readingRateWpm",
           orr.accuracy_percentage AS "accuracyPercentage",
           orr.words_read          AS "wordsRead",
           orr.correct_words      AS "correctWords",
           COALESCE(orr.reading_time_seconds, srr.reading_time_seconds, lrr.audio_duration_seconds) AS "readingTimeSeconds",
           COALESCE(orr.comprehension_score, srr.comprehension_score, lrr.comprehension_score) AS "comprehensionScore",
           rp.current_profile_label AS "profileLabel",
           COALESCE(orr.comprehension_score, srr.comprehension_score, lrr.comprehension_score, rp.oral_comprehension_rate, rp.silent_comprehension_rate, rp.listening_comprehension_rate) AS "comprehensionRate",
           rp.oral_accuracy_rate   AS "oralAccuracyRate",
           rp.silent_profile_label AS "silentProfileLabel",
           rp.listening_profile_label AS "listeningProfileLabel",
           rp.oral_profile_label   AS "oralProfileLabel",
           a.reading_level_result  AS "readingLevelResult",
           COALESCE(aa.status, a.status, 'open') AS "status",
           orr.verification_status AS "verificationStatus"
         FROM assessments a
         JOIN phil_iri_passages p ON p.passage_id = a.passage_id
         LEFT JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
         LEFT JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
         LEFT JOIN silent_reading_results srr ON srr.assessment_attempt_id = aa.attempt_id
         LEFT JOIN listening_reading_results lrr ON lrr.assessment_attempt_id = aa.attempt_id
         LEFT JOIN reading_profiles rp ON (rp.student_id = a.student_id OR rp.student_id = $2)
         WHERE (a.student_id = $1 OR a.student_id = $2)
         ORDER BY COALESCE(aa.completed_at, aa.created_at, a.created_at) DESC`,
        [resolvedStudentId, resolvedUserId || resolvedStudentId]
      );

      // 1. Gather all passageIds and attemptIds for batch querying (avoids pool exhaustion)
      const passageIds = [...new Set(resultsRes.rows.map((r) => r.passageId).filter(Boolean))];
      const attemptIds = [...new Set(resultsRes.rows.map((r) => r.attemptId).filter(Boolean))];

      let allQuestions = [];
      let allChoices = [];
      let allAnswers = [];

      if (passageIds.length > 0) {
        try {
          const qRes = await db.query(
            `SELECT question_id, passage_id, question_text, question_type 
             FROM phil_iri_questions 
             WHERE passage_id = ANY($1) 
             ORDER BY created_at ASC`,
            [passageIds]
          );
          allQuestions = qRes.rows || [];

          const qIds = allQuestions.map((q) => q.question_id);
          if (qIds.length > 0) {
            const cRes = await db.query(
              `SELECT choice_id, question_id, choice_text, is_correct 
               FROM phil_iri_question_choices 
               WHERE question_id = ANY($1) 
               ORDER BY choice_id ASC`,
              [qIds]
            );
            allChoices = cRes.rows || [];
          }
        } catch (qErr) {
          console.warn('[getStudentAssessmentResults] Batch question fetch notice:', qErr.message);
        }
      }

      if (attemptIds.length > 0) {
        try {
          const ansRes = await db.query(
            `SELECT answer_id, assessment_attempt_id, phil_iri_question_id, selected_choice_id, answer_text, is_correct, score 
             FROM assessment_answers 
             WHERE assessment_attempt_id = ANY($1) 
             ORDER BY answered_at ASC`,
            [attemptIds]
          );
          allAnswers = ansRes.rows || [];
        } catch (aErr) {
          console.warn('[getStudentAssessmentResults] Batch answers fetch notice:', aErr.message);
        }
      }

      // 2. Map in-memory with zero DB overhead per item
      const mappedResults = resultsRes.rows.map((row) => {
        const typeLabel =
          row.assessmentType === 'oral'      ? 'Oral Reading' :
          row.assessmentType === 'listening' ? 'Listening'    : 'Silent Reading';
        const periodLabel = row.period === 'post_test' ? 'Post-Test' : 'Pre-Test';
        const langLabel   = (row.language || 'fil').toLowerCase().startsWith('en') ? 'English' : 'Filipino';
        const formattedTitle = `${typeLabel} Assessment (${periodLabel} - ${langLabel})`;

        const passageQs = allQuestions.filter((q) => String(q.passage_id) === String(row.passageId));
        let questions = [];

        if (passageQs.length > 0) {
          questions = passageQs.map((q, index) => {
            const choicesForQ = allChoices.filter((c) => String(c.question_id) === String(q.question_id));
            const choiceTexts = choicesForQ.map((c) => c.choice_text);
            const correctChoice = choicesForQ.find((c) => c.is_correct);

            let studentAnswer = '';
            let isCorrect = false;

            if (row.attemptId) {
              const studentAns = allAnswers.find(
                (a) => String(a.assessment_attempt_id) === String(row.attemptId) && String(a.phil_iri_question_id) === String(q.question_id)
              );
              if (studentAns) {
                isCorrect = studentAns.is_correct === true;
                if (studentAns.selected_choice_id) {
                  const selChoice = choicesForQ.find((c) => String(c.choice_id) === String(studentAns.selected_choice_id));
                  studentAnswer = selChoice?.choice_text || studentAns.answer_text || '';
                } else {
                  studentAnswer = studentAns.answer_text || '';
                }
              }
            }

            if (!studentAnswer) {
              studentAnswer = correctChoice?.choice_text || choiceTexts[0] || '';
              isCorrect = true;
            }

            return {
              number: index + 1,
              question: q.question_text,
              choices: choiceTexts.length > 0 ? choiceTexts : ['Oo', 'Hindi'],
              isCorrect: isCorrect,
              studentAnswer: studentAnswer,
              correctAnswer: correctChoice?.choice_text || choiceTexts[0] || '',
            };
          });
        }

        // Fallback: If no passage questions matched, retrieve from assessment answers
        if (questions.length === 0 && row.attemptId) {
          const directAnswers = allAnswers.filter((a) => String(a.assessment_attempt_id) === String(row.attemptId));
          if (directAnswers.length > 0) {
            questions = directAnswers.map((da, idx) => {
              const matchedQ = allQuestions.find((q) => String(q.question_id) === String(da.phil_iri_question_id));
              const choicesForQ = da.phil_iri_question_id ? allChoices.filter((c) => String(c.question_id) === String(da.phil_iri_question_id)) : [];
              const choiceTexts = choicesForQ.map((c) => c.choice_text);
              const correctChoice = choicesForQ.find((c) => c.is_correct);

              return {
                number: idx + 1,
                question: matchedQ?.question_text || `Question ${idx + 1}`,
                choices: choiceTexts.length > 0 ? choiceTexts : [da.answer_text || 'Option'],
                isCorrect: da.is_correct === true,
                studentAnswer: da.answer_text || '',
                correctAnswer: correctChoice?.choice_text || da.answer_text || '',
              };
            });
          }
        }

          const totalQ = questions.length > 0 ? questions.length : 3;
          const actualCorrectCount = questions.filter((q) => q.isCorrect === true).length;
          const scoreNum = row.totalScore !== null && row.totalScore !== undefined
            ? Math.round(Number(row.totalScore))
            : (row.comprehensionScore !== null && row.comprehensionScore !== undefined
                ? Math.round((Number(row.comprehensionScore) / 100) * totalQ)
                : actualCorrectCount);

          const { getPhilIriOralProfile, getPhilIriListeningProfile, getPhilIriSilentProfile } = require('../services/miscueEngine.js');
          const compRate = Number(row.comprehensionScore) || Number(row.comprehensionRate) || (totalQ > 0 ? Math.round((scoreNum / totalQ) * 100) : 0);
          
          let calculatedLevel = 'Pending Evaluation';
          if (row.assessmentType === 'oral') {
            calculatedLevel = getPhilIriOralProfile(Number(row.accuracyPercentage) || 0, compRate);
          } else if (row.assessmentType === 'listening') {
            calculatedLevel = getPhilIriListeningProfile(compRate);
          } else if (row.assessmentType === 'silent') {
            const sWpm = Number(row.readingRateWpm) || (row.readingTimeSeconds > 0 ? Math.round(((Number(row.wordCount) || 115) / row.readingTimeSeconds) * 60) : 0);
            calculatedLevel = getPhilIriSilentProfile(sWpm, compRate, 'Grade 4', row.language || 'fil');
          }
          const finalProfile = (row.readingLevelResult && row.readingLevelResult !== 'Pending Evaluation')
            ? row.readingLevelResult
            : (calculatedLevel !== 'Pending Evaluation'
                ? calculatedLevel
                : (row.profileLabel || 'Pending Evaluation'));

          return {
            ...row,
            profileLabel: finalProfile,
            completedAt: row.completedAt || row.createdAt,
            assessmentTitle: formattedTitle,
            fullTitle: `${formattedTitle} - ${row.passageTitle}`,
            score: scoreNum,
            totalQuestions: totalQ,
            questions: questions,
          };
        });

        if (mappedResults.length === 0) {
          try {
            const rpRes = await db.query(
              `SELECT * FROM reading_profiles WHERE student_id = $1 OR student_id = $2 LIMIT 1`,
              [resolvedStudentId, resolvedUserId || resolvedStudentId]
            );
            if (rpRes.rows?.[0]) {
              const rp = rpRes.rows[0];
              const fallbackList = [];
              if (rp.oral_profile_label && rp.oral_profile_label !== 'Pending Evaluation') {
                const oComp = Number(rp.oral_comprehension_rate) || 0;
                fallbackList.push({
                  assessmentType: 'oral',
                  assessmentTitle: 'Oral Reading Assessment',
                  passageTitle: 'Oral Reading Passage',
                  language: 'fil',
                  score: Math.round((oComp / 100) * 5),
                  totalQuestions: 5,
                  accuracyPercentage: Number(rp.oral_accuracy_rate) || 0,
                  readingRateWpm: Number(rp.oral_speed_wpm) || 0,
                  profileLabel: rp.oral_profile_label,
                  completedAt: new Date().toISOString(),
                  questions: [],
                });
              }
              if (rp.listening_profile_label && rp.listening_profile_label !== 'Pending Evaluation') {
                const lComp = Number(rp.listening_comprehension_rate) || 0;
                fallbackList.push({
                  assessmentType: 'listening',
                  assessmentTitle: 'Listening Assessment',
                  passageTitle: 'Listening Passage',
                  language: 'fil',
                  score: Math.round((lComp / 100) * 5),
                  totalQuestions: 5,
                  profileLabel: rp.listening_profile_label,
                  completedAt: new Date().toISOString(),
                  questions: [],
                });
              }
              if (rp.silent_profile_label && rp.silent_profile_label !== 'Pending Evaluation') {
                const sComp = Number(rp.silent_comprehension_rate) || 0;
                fallbackList.push({
                  assessmentType: 'silent',
                  assessmentTitle: 'Silent Reading Assessment',
                  passageTitle: 'Silent Reading Passage',
                  language: 'fil',
                  score: Math.round((sComp / 100) * 5),
                  totalQuestions: 5,
                  readingRateWpm: Number(rp.silent_speed_wpm) || 0,
                  readingTimeSeconds: 0,
                  profileLabel: rp.silent_profile_label,
                  completedAt: new Date().toISOString(),
                  questions: [],
                });
              }
              if (fallbackList.length > 0) {
                return res.json({ success: true, results: fallbackList });
              }
            }
          } catch (_) {}
        }

        return res.json({
          success: true,
          results: mappedResults,
        });
      }

      return res.json({ success: true, results: [] });
  } catch (err) {
    console.error('Error in getStudentAssessmentResults:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch assessment results.' });
  }
}

module.exports = {
  getStudents,
  getStudentByLrn,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  deleteStudent,
  importStudentsCSV,
  checkExistingStudent,
  transferInStudent,
  submitPhilIriAssessment,
  getPhilIriPassages,
  assignPhilIriToStudent,
  getStudentActiveAssignment,
  completeStoryProgress,
  completeActivityProgress,
  submitStudentOralAudio,
  denoiseTestAudio,
  updateAssessmentStartProgress,
  getStudentAssessmentResults,
};
