const db = require('../config/db.js');

// In-Memory Fallback Store (Empty by default)
let mockStudents = [];

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
 * 3. Fall back to first school in schools table.
 */
async function getAdminSchoolId(req) {
  if (process.env.DATABASE_URL) {
    try {
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

      if (req.user && req.user.email) {
        const { rows } = await db.query(
          `SELECT school_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [req.user.email]
        );
        if (rows && rows[0] && rows[0].school_id) {
          return rows[0].school_id;
        }
      }

      const sRes = await db.query(`SELECT school_id FROM schools LIMIT 1`);
      if (sRes.rows && sRes.rows[0] && sRes.rows[0].school_id) {
        return sRes.rows[0].school_id;
      }
    } catch (e) {}
  }
  if (req.user && (req.user.schoolId || req.user.school_id)) {
    return req.user.schoolId || req.user.school_id;
  }
  return null;
}

/**
 * GET /api/admin/students — List all students
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
            CASE 
              WHEN c.grade_level IS NULL OR c.grade_level = '' THEN 'Grade 4'
              WHEN c.grade_level ILIKE 'Grade%' THEN c.grade_level
              ELSE CONCAT('Grade ', c.grade_level)
            END AS grade,
            COALESCE(c.section_name, '') AS section,
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
            COALESCE(rp.current_profile_label, 'Instructional') AS level,
            TO_CHAR(s.created_at, 'YYYY-MM-DD') AS "dateAdded"
          FROM students s
          LEFT JOIN users u ON s.user_id = u.user_id
          LEFT JOIN student_grade_history sgh ON s.student_id = sgh.student_id AND (sgh.promotion_status = 'active' OR sgh.promotion_status IS NULL)
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN student_parents sp ON s.student_id = sp.student_id
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

/**
 * GET /api/admin/students/:lrn — Get single student by LRN
 */
async function getStudentByLrn(req, res) {
  try {
    const { lrn } = req.params;

    if (isDbConfigured()) {
      try {
        const cleanLrn = String(lrn || '').trim();
        const { rows } = await db.query(`
          SELECT 
            s.student_id AS id,
            s.lrn,
            s.first_name AS "firstName",
            s.middle_name AS "middleName",
            s.last_name AS "lastName",
            CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
            COALESCE(c.grade_level, '') AS grade,
            COALESCE(c.section_name, '') AS section,
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
            SELECT DISTINCT ON (student_id) student_id, class_id, promotion_status
            FROM student_grade_history
            ORDER BY student_id, created_at DESC
          ) sgh ON s.student_id = sgh.student_id
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN student_parents sp ON s.student_id = sp.student_id
          LEFT JOIN parents p ON sp.parent_id = p.parent_id
          LEFT JOIN reading_profiles rp ON s.student_id = rp.student_id
          WHERE TRIM(s.lrn) = $1 OR s.student_id::text = $1
          LIMIT 1
        `, [cleanLrn]);

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

    const foundMock = mockStudents.find((s) => s.lrn === lrn || s.id === lrn);
    if (foundMock) {
      return res.json({ success: true, student: foundMock });
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
 * POST /api/admin/students — Create single student
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
                 ON CONFLICT DO NOTHING`,
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

            if (classId) {
              await db.query(
                `INSERT INTO student_grade_history (student_id, class_id, promotion_status)
                 VALUES ($1, $2, 'active')
                 ON CONFLICT (student_id, class_id) DO UPDATE SET promotion_status = 'active'`,
                [studentId, classId]
              );
            }

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
        console.error('❌ DB student insert error:', dbErr.message || dbErr);
      }
    }

    mockStudents.unshift({ ...newStudentObj, tempPassword });
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
 * PUT /api/admin/students/:lrn — Update student
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

        if (stRows && stRows[0] && (grade || section)) {
          const studentId = stRows[0].student_id;
          const rawGrade = grade ? String(grade).trim() : 'Grade 4';
          const gradeNum = rawGrade.replace(/^Grade\s*/i, '').trim();
          const targetGrade = rawGrade.toLowerCase().startsWith('grade') ? rawGrade : `Grade ${gradeNum}`;
          const targetSection = section || 'Fyang';

          // Find or create target class (supports 'Grade 4' or '4' in database)
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
            // Check if active history row exists
            const { rows: activeHist } = await db.query(
              `SELECT history_id FROM student_grade_history WHERE student_id = $1 AND promotion_status = 'active' LIMIT 1`,
              [studentId]
            );

            if (activeHist && activeHist[0]) {
              await db.query(
                `UPDATE student_grade_history SET class_id = $1 WHERE history_id = $2`,
                [classId, activeHist[0].history_id]
              );
            } else {
              await db.query(
                `INSERT INTO student_grade_history (student_id, class_id, promotion_status)
                 VALUES ($1, $2, 'active')
                 ON CONFLICT (student_id, class_id) DO UPDATE SET promotion_status = 'active'`,
                [studentId, classId]
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
 * PATCH /api/admin/students/:lrn/status — Toggle student status (Active / Disabled / Dropped)
 */
async function toggleStudentStatus(req, res) {
  try {
    const { lrn } = req.params;
    const { status: targetStatus } = req.body || {};
    let newStatus = targetStatus || 'Disabled';

    mockStudents = mockStudents.map((s) => {
      if (s.lrn === lrn || s.id === lrn) {
        newStatus = targetStatus || (s.status === 'Disabled' ? 'Active' : 'Disabled');
        return { ...s, status: newStatus };
      }
      return s;
    });

    if (isDbConfigured()) {
      try {
        const dbUserStatus = (newStatus === 'Disabled' || newStatus === 'Dropped' || newStatus === 'Transferred') ? 'disabled' : 'active';
        const promotionStatus = newStatus.toLowerCase();

        // 1. Update student user account login access
        await db.query(
          `UPDATE users SET status = $1 WHERE user_id = (SELECT user_id FROM students WHERE lrn = $2)`,
          [dbUserStatus, lrn]
        );

        // 2. Update student grade history enrollment status
        await db.query(
          `UPDATE student_grade_history 
           SET promotion_status = $1 
           WHERE student_id = (SELECT student_id FROM students WHERE lrn = $2)`,
          [promotionStatus, lrn]
        );

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
 * DELETE /api/admin/students/:lrn — Delete student
 */
async function deleteStudent(req, res) {
  try {
    const { lrn } = req.params;
    mockStudents = mockStudents.filter((s) => s.lrn !== lrn && s.id !== lrn);

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
              console.log(`✅ Deleted orphan parent record: ${pid}`);
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
        console.error('❌ DB deleteStudent error:', dbErr.message);
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
 * POST /api/admin/students/import-csv — Import batch CSV students
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
                   ON CONFLICT DO NOTHING`,
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
                console.warn(`⚠️ Skipped grade/section binding: Class "${grade} - ${section}" does not exist in database.`);
              }

              if (classId) {
                await db.query(
                  `INSERT INTO student_grade_history (student_id, class_id, promotion_status)
                   VALUES ($1, $2, 'active')
                   ON CONFLICT (student_id, class_id) DO UPDATE SET promotion_status = 'active'`,
                  [studentId, classId]
                );
              }

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
          console.error('❌ DB CSV import row notice:', dbErr.message || dbErr);
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
 * GET /api/admin/students/check/:lrn — Check if LRN already exists in national database
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

    const foundMock = mockStudents.find((s) => s.lrn === lrn);
    if (foundMock) {
      return res.json({ success: true, exists: true, student: foundMock });
    }

    return res.json({ success: true, exists: false });
  } catch (err) {
    console.error('Error checking existing student:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify student LRN.' });
  }
}

/**
 * POST /api/admin/students/transfer-in — Transfer existing student into current school
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
        console.error('❌ DB transfer-in student error:', dbErr.message || dbErr);
      }
    }

    // Update in mock array if present
    mockStudents = mockStudents.map((s) => {
      if (s.lrn === lrn) {
        return { ...s, grade, section, status: 'Active' };
      }
      return s;
    });

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
};
