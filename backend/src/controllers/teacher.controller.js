const db = require('../config/db.js');
const { encodeActivityId, decodeActivityId, encodeSecureToken, decodeSecureToken } = require('../utils/securityToken.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let tempPass = 'St-';
  for (let i = 0; i < 6; i++) {
    tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tempPass;
}

function hashPassword(plainPassword) {
  if (!plainPassword) return '';
  try {
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(plainPassword, salt);
  } catch (e) {
    return plainPassword;
  }
}

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
 * Resolve the logged-in admin's school_id.
 * 1. From JWT token (verified against schools table)
 * 2. From users table via admin email
 * 3. From first school in schools table (last resort)
 */
async function getAdminSchoolId(req) {
  if (process.env.DATABASE_URL) {
    try {
      if (req.user?.email) {
        const { rows } = await db.query(
          `SELECT school_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [req.user.email]
        );
        if (rows?.[0]?.school_id) return rows[0].school_id;
      }

      const tokenSchoolId = req.user?.schoolId || req.user?.school_id;
      if (tokenSchoolId) {
        const schoolRes = await db.query(
          `SELECT school_id FROM schools WHERE school_id = $1 LIMIT 1`,
          [tokenSchoolId]
        );
        if (schoolRes.rows?.[0]?.school_id) return schoolRes.rows[0].school_id;
      }
    } catch (e) {}
  }
  return req.user?.schoolId || req.user?.school_id || null;
}

const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');

// ---------------------------------------------------------------------------
// GET /api/admin/teachers — List all teachers scoped to admin's school
// ---------------------------------------------------------------------------
async function getTeachers(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const { rows } = await db.query(`
          SELECT 
            t.teacher_id AS id,
            t.teacher_no AS "employeeId",
            t.first_name AS "firstName",
            t.middle_name AS "middleName",
            t.last_name AS "lastName",
            CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name) AS name,
            COALESCE(t.sex, 'Male') AS gender,
            COALESCE(u.email, '') AS email,
            u.profile_image AS "profileImage",
            u.profile_image AS "profile_image",
            u.profile_image AS "avatarUrl",
            COALESCE(
              (SELECT c.grade_level FROM classes c JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true WHERE c.advisor_teacher_id = t.teacher_id LIMIT 1),
              'Unassigned'
            ) AS "gradeAssigned",
            COALESCE(
              (SELECT c.section_name FROM classes c JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true WHERE c.advisor_teacher_id = t.teacher_id LIMIT 1),
              'Unassigned'
            ) AS "sectionAssigned",
            EXISTS(
              SELECT 1 FROM faculty_in_charge fic JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true WHERE fic.teacher_id = t.teacher_id AND fic.status = 'active'
            ) AS "isFacultyInCharge",
            CASE WHEN u.status = 'disabled' THEN 'Disabled' ELSE 'Active' END AS status,
            TO_CHAR(t.created_at, 'YYYY-MM-DD') AS "dateAdded"
          FROM teachers t
          LEFT JOIN users u ON t.user_id = u.user_id
          WHERE u.school_id = $1
          ORDER BY t.created_at DESC
        `, [schoolId]);

        return res.json({ success: true, teachers: rows || [] });
      } catch (dbErr) {
        console.warn('DB fetch teachers notice:', dbErr.message);
      }
    }

    return res.json({ success: true, teachers: [] });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch teachers.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/teachers/:id — Get single teacher by ID or Employee ID
// ---------------------------------------------------------------------------
async function getTeacherById(req, res) {
  try {
    const { id } = req.params;
    const cleanId = String(id || '').trim();

    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await db.query(
          `SELECT 
             t.teacher_id AS id,
             t.teacher_no AS "employeeId",
             t.first_name AS "firstName",
             t.middle_name AS "middleName",
             t.last_name AS "lastName",
             CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name) AS name,
             COALESCE(t.sex, 'Female') AS gender,
             COALESCE(u.email, '') AS email,
             u.profile_image AS "profileImage",
             u.profile_image AS "profile_image",
             u.profile_image AS "avatarUrl",
             COALESCE(
               (SELECT c.grade_level FROM classes c WHERE c.advisor_teacher_id::text = t.teacher_id::text OR c.advisor_teacher_id::text = t.teacher_no::text ORDER BY c.created_at DESC LIMIT 1),
               'Unassigned'
             ) AS "gradeAssigned",
             COALESCE(
               (SELECT c.section_name FROM classes c WHERE c.advisor_teacher_id::text = t.teacher_id::text OR c.advisor_teacher_id::text = t.teacher_no::text ORDER BY c.created_at DESC LIMIT 1),
               'Unassigned'
             ) AS "sectionAssigned",
             COALESCE(
               (SELECT c.class_id FROM classes c WHERE c.advisor_teacher_id::text = t.teacher_id::text OR c.advisor_teacher_id::text = t.teacher_no::text ORDER BY c.created_at DESC LIMIT 1),
               NULL
             ) AS "classId",
             EXISTS(
               SELECT 1 FROM faculty_in_charge fic JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true WHERE fic.teacher_id = t.teacher_id AND fic.status = 'active'
             ) AS "isFacultyInCharge",
             CASE WHEN u.status = 'disabled' THEN 'Disabled' ELSE 'Active' END AS status,
             TO_CHAR(t.created_at, 'YYYY-MM-DD') AS "dateAdded"
           FROM teachers t
           LEFT JOIN users u ON t.user_id = u.user_id
           WHERE TRIM(t.teacher_no) = $1 OR t.teacher_id::text = $1
           LIMIT 1`,
          [cleanId]
        );

        if (rows && rows.length > 0) {
          const teacherObj = rows[0];
          let classId = teacherObj.classId;

          if (!classId && teacherObj.sectionAssigned !== 'Unassigned') {
            const { rows: cMatch } = await db.query(
              `SELECT class_id FROM classes WHERE section_name = $1 LIMIT 1`,
              [teacherObj.sectionAssigned]
            );
            if (cMatch.length > 0) classId = cMatch[0].class_id;
          }

          // Fetch enrolled class roster if teacher has assigned section
          if (classId) {
            const { rows: roster } = await db.query(
              `SELECT 
                 s.student_id AS id,
                 s.lrn,
                 CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
                 COALESCE(s.sex, 'Male') AS gender,
                 COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending Evaluation') AS level
               FROM student_grade_history sgh
               JOIN students s ON sgh.student_id = s.student_id
               LEFT JOIN reading_profiles rp ON s.student_id = rp.student_id
               LEFT JOIN (
                 SELECT DISTINCT ON (student_id) student_id, reading_level_result
                 FROM assessments
                 ORDER BY student_id, created_at DESC
               ) a ON a.student_id = s.student_id
               WHERE sgh.class_id = $1 AND LOWER(COALESCE(sgh.promotion_status, '')) NOT IN ('dropped', 'transferred')
               ORDER BY s.last_name ASC`,
              [classId]
            );
            teacherObj.students = roster || [];
          } else {
            teacherObj.students = [];
          }

          // Count submissions created by teacher and fetch recent assessment activity logs
          try {
            const { rows: subRes } = await db.query(
              `SELECT COUNT(*) FROM assessments a 
               WHERE a.assigned_by_teacher_id::text = $1 
                  OR a.assigned_by_teacher_id::text = $2
                  OR ($3::text IS NOT NULL AND a.student_id IN (
                     SELECT sgh.student_id FROM student_grade_history sgh WHERE sgh.class_id::text = $3
                  ))`,
              [teacherObj.id, teacherObj.employeeId, classId]
            );
            teacherObj.submissionsCount = parseInt(subRes[0]?.count || 0, 10);

            const { rows: logRows } = await db.query(
              `SELECT 
                 a.assessment_id AS id,
                 CONCAT('Assigned ', UPPER(a.assessment_type), ' Assessment (', REPLACE(a.assessment_period, '_', ' '), ')') AS title,
                 CONCAT('Material: ', COALESCE(p.title, 'Phil-IRI Passage'), COALESCE(' • Student: ' || s.first_name || ' ' || s.last_name, '')) AS detail,
                 TO_CHAR(a.created_at, 'Mon DD, YYYY "at" HH12:MI AM') AS time,
                 a.status,
                 a.reading_level_result AS "readingLevelResult"
               FROM assessments a
               LEFT JOIN phil_iri_passages p ON a.passage_id = p.passage_id
               LEFT JOIN students s ON a.student_id = s.student_id
               WHERE a.assigned_by_teacher_id::text = $1 
                  OR a.assigned_by_teacher_id::text = $2
                  OR ($3::text IS NOT NULL AND a.student_id IN (
                     SELECT sgh.student_id FROM student_grade_history sgh WHERE sgh.class_id::text = $3
                  ))
               ORDER BY a.created_at DESC
               LIMIT 20`,
              [teacherObj.id, teacherObj.employeeId, classId]
            );
            teacherObj.activityLogs = logRows || [];
          } catch (e) {
            console.error('Error fetching teacher activity logs:', e);
            teacherObj.submissionsCount = 0;
            teacherObj.activityLogs = [];
          }

          return res.json({ success: true, teacher: teacherObj });
        }
      } catch (dbErr) {
        console.warn('DB fetch teacher by ID notice:', dbErr.message);
      }
    }

    return res.status(404).json({ success: false, error: 'Teacher record not found.' });
  } catch (error) {
    console.error('Error fetching teacher by ID:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch teacher profile.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/teachers — Create single teacher
// ---------------------------------------------------------------------------
async function createTeacher(req, res) {
  try {
    let { employeeId, firstName, middleName, lastName, name, gender, email, gradeAssigned, sectionAssigned, isFacultyInCharge } = req.body;

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required and must be provided by Admin.',
      });
    }

    const cleanEmpId = employeeId.trim().toUpperCase();

    if (!firstName || !lastName) {
      if (name) {
        const parsed = parseNameString(name);
        firstName = firstName || parsed.firstName;
        middleName = middleName || parsed.middleName;
        lastName = lastName || parsed.lastName;
      }
    }

    firstName = (firstName || 'Teacher').trim();
    middleName = (middleName || '').trim();
    lastName = (lastName || 'Faculty').trim();
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
    const cleanEmail = email?.trim() || `${cleanEmpId.toLowerCase()}@salintinig.edu.ph`;
    const cleanGender = gender?.trim() || 'Male';
    const cleanGradeAssigned = gradeAssigned?.trim() || 'Unassigned';
    const cleanSectionAssigned = sectionAssigned?.trim() || 'Unassigned';
    const hasSectionAssignment = cleanGradeAssigned !== 'Unassigned' && cleanSectionAssigned !== 'Unassigned';
    const hasFacultyAssignment = Boolean(isFacultyInCharge) && cleanGradeAssigned !== 'Unassigned';

    const tempPassword = generateTempPassword();

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const hashedPassword = hashPassword(tempPassword);

        const { rows: userRows } = await db.query(
          `INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
           VALUES ($1, $2, $3, 'teacher', 'active', true)
           ON CONFLICT (email) DO UPDATE SET school_id = $1, password_hash = $3, must_change_password = true, status = 'active'
           RETURNING user_id`,
          [schoolId, cleanEmail, hashedPassword]
        );

        if (userRows?.[0]) {
          const userId = userRows[0].user_id;

          const { rows: tchRows } = await db.query(
            `INSERT INTO teachers (user_id, teacher_no, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (teacher_no) DO UPDATE SET first_name = $3, middle_name = $4, last_name = $5, sex = $6
             RETURNING teacher_id`,
            [userId, cleanEmpId, firstName, middleName || null, lastName, cleanGender]
          );

          if (tchRows?.[0]) {
            const teacherId = tchRows[0].teacher_id;

            if (hasSectionAssignment) {
              await db.query(
                `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
                [teacherId, cleanGradeAssigned, cleanSectionAssigned]
              );
            }

            if (hasFacultyAssignment) {
              await db.query(
                `INSERT INTO faculty_in_charge (school_id, teacher_id, grade_level)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING`,
                [schoolId, teacherId, cleanGradeAssigned]
              );
            }
          }

          sendWelcomeEmailWithTempPassword({
            toEmail: cleanEmail,
            fullName,
            role: 'Teacher',
            tempPassword,
            identifier: cleanEmpId || cleanEmail,
          });
        }
      } catch (dbErr) {
        console.warn('DB create teacher notice:', dbErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Teacher account for ${fullName} created. Temporary password sent to ${cleanEmail}.`,
      tempPassword,
      teacher: {
        id: cleanEmpId,
        employeeId: cleanEmpId,
        firstName,
        middleName,
        lastName,
        name: fullName,
        gender: cleanGender,
        email: cleanEmail,
        gradeAssigned: cleanGradeAssigned,
        sectionAssigned: cleanSectionAssigned,
        isFacultyInCharge: hasFacultyAssignment,
        status: 'Active',
        dateAdded: new Date().toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return res.status(500).json({ success: false, error: 'Failed to create teacher account.' });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/teachers/:id — Update teacher
// ---------------------------------------------------------------------------
async function updateTeacher(req, res) {
  try {
    const { id } = req.params;
    let { firstName, middleName, lastName, name, gender, email, gradeAssigned, sectionAssigned, isFacultyInCharge } = req.body;

    if (!firstName || !lastName) {
      if (name) {
        const parsed = parseNameString(name);
        firstName = firstName || parsed.firstName;
        middleName = middleName || parsed.middleName;
        lastName = lastName || parsed.lastName;
      }
    }

    firstName = (firstName || 'Teacher').trim();
    middleName = (middleName || '').trim();
    lastName = (lastName || 'Faculty').trim();

    if (process.env.DATABASE_URL) {
      try {
        // Update teachers table
        await db.query(
          `UPDATE teachers
           SET first_name = $1, middle_name = $2, last_name = $3, sex = $4, updated_at = CURRENT_TIMESTAMP
           WHERE teacher_id::text = $5 OR teacher_no = $5`,
          [firstName, middleName || null, lastName, gender || 'Male', id]
        );

        // Update email in users table if provided
        if (email) {
          await db.query(
            `UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = (SELECT user_id FROM teachers WHERE teacher_id::text = $2 OR teacher_no = $2 LIMIT 1)`,
            [email.trim(), id]
          );
        }

        // Update class adviser assignment
        if (gradeAssigned && gradeAssigned !== 'Unassigned' && sectionAssigned && sectionAssigned !== 'Unassigned') {
          const { rows: tRows } = await db.query(
            `SELECT teacher_id FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1 LIMIT 1`,
            [id]
          );
          if (tRows?.[0]) {
            await db.query(
              `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
              [tRows[0].teacher_id, gradeAssigned, sectionAssigned]
            );
          }
        }
      } catch (dbErr) {
        console.warn('DB update teacher notice:', dbErr.message);
      }
    }

    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();
    return res.json({
      success: true,
      message: `Teacher record for ${fullName} updated.`,
      teacher: { id, firstName, middleName, lastName, name: fullName, gender, email, gradeAssigned, sectionAssigned, isFacultyInCharge },
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({ success: false, error: 'Failed to update teacher record.' });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/teachers/:id — Delete teacher
// ---------------------------------------------------------------------------
async function deleteTeacher(req, res) {
  try {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        // Get user_id linked to this teacher before deleting
        const { rows } = await db.query(
          `SELECT teacher_id, user_id FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1 LIMIT 1`,
          [id]
        );

        if (rows?.[0]) {
          const { teacher_id, user_id } = rows[0];

          // Remove faculty-in-charge assignments
          await db.query(`DELETE FROM faculty_in_charge WHERE teacher_id = $1`, [teacher_id]);

          // Unset adviser from classes
          await db.query(`UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id = $1`, [teacher_id]);

          // Delete teacher record
          await db.query(`DELETE FROM teachers WHERE teacher_id = $1`, [teacher_id]);

          // Delete user account
          if (user_id) {
            await db.query(`DELETE FROM users WHERE user_id = $1`, [user_id]);
          }
        }
      } catch (dbErr) {
        console.warn('DB delete teacher notice:', dbErr.message);
        return res.status(500).json({ success: false, error: `Failed to delete teacher: ${dbErr.message}` });
      }
    }

    return res.json({ success: true, message: 'Teacher record and account deleted successfully.' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete teacher record.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/teachers/import-csv — Batch import teachers from CSV/Excel
// ---------------------------------------------------------------------------
async function importTeachersCSV(req, res) {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No teacher records provided.' });
    }

    const imported = [];
    const errors = [];

    const schoolId = process.env.DATABASE_URL ? await getAdminSchoolId(req) : null;
    console.log(`[importTeachersCSV] Resolved adminSchoolId: ${schoolId}`);

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const empId = String(row.employeeId || row.employee_id || row['Employee ID'] || row['DepEd Employee ID'] || '').trim().toUpperCase();

      if (!empId) {
        errors.push(`Row ${i + 1}: Missing Employee ID — skipped.`);
        continue;
      }

      let firstName = String(row.firstName || row.first_name || row['First Name'] || '').trim();
      let middleName = String(row.middleName || row.middle_name || row['Middle Name'] || '').trim();
      let lastName = String(row.lastName || row.last_name || row['Last Name'] || '').trim();

      if (!firstName || !lastName) {
        const rawName = String(row.name || row.Name || row['Full Name'] || '').trim();
        if (rawName) {
          const parsed = parseNameString(rawName);
          firstName = firstName || parsed.firstName;
          middleName = middleName || parsed.middleName;
          lastName = lastName || parsed.lastName;
        }
      }

      if (!firstName || !lastName) {
        errors.push(`Row ${i + 1} (${empId}): Missing name — skipped.`);
        continue;
      }

      const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();
      const email = String(row.email || row.Email || row['DepEd Email'] || row['DepEd Email Address'] || `${empId.toLowerCase()}@deped.gov.ph`).trim();
      const gender = String(row.gender || row.Gender || row.Sex || row['Sex / Gender'] || 'Male').trim();
      const gradeAssigned = String(row.gradeAssigned || row.grade || row['Assigned Grade'] || 'Unassigned').trim();
      const sectionAssigned = String(row.sectionAssigned || row.section || row['Assigned Section'] || 'Unassigned').trim();
      const hasSectionAssignment = gradeAssigned !== 'Unassigned' && sectionAssigned !== 'Unassigned';
      const isFacultyInCharge = ['true', 'yes', '1'].includes(
        String(row.isFacultyInCharge || row.facultyInCharge || row['Faculty In Charge'] || '').trim().toLowerCase()
      );
      const hasFacultyAssignment = isFacultyInCharge && gradeAssigned !== 'Unassigned';

      if (process.env.DATABASE_URL) {
        try {
          let assignedClassId = null;
          if (hasSectionAssignment) {
            const { rows: classRows } = await db.query(
              `SELECT c.class_id
               FROM classes c
               JOIN school_years sy ON sy.school_year_id = c.school_year_id AND sy.is_active = true
               WHERE (c.school_id = $1 OR c.school_id IS NULL)
                 AND LOWER(c.grade_level) = LOWER($2)
                 AND LOWER(c.section_name) = LOWER($3)
               LIMIT 1`,
              [schoolId, gradeAssigned, sectionAssigned]
            );
            assignedClassId = classRows[0]?.class_id || null;
            if (!assignedClassId) {
              errors.push(`Row ${i + 1} (${empId}): Grade/section "${gradeAssigned} - ${sectionAssigned}" was not found in the active school year — skipped.`);
              continue;
            }
          }

          // Check for duplicate Employee ID
          const { rows: dupRows } = await db.query(
            `SELECT teacher_id FROM teachers WHERE teacher_no = $1 LIMIT 1`,
            [empId]
          );
          if (dupRows?.length > 0) {
            errors.push(`Row ${i + 1}: Employee ID "${empId}" already exists — skipped.`);
            continue;
          }

          const tempPassword = generateTempPassword();
          const hashedPassword = hashPassword(tempPassword);

          const { rows: userRows } = await db.query(
            `INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
             VALUES ($1, $2, $3, 'teacher', 'active', true)
             ON CONFLICT (email) DO UPDATE SET school_id = $1, password_hash = $3, must_change_password = true, status = 'active'
             RETURNING user_id`,
            [schoolId, email, hashedPassword]
          );

          if (userRows?.[0]) {
            const userId = userRows[0].user_id;

            const { rows: tchRows } = await db.query(
              `INSERT INTO teachers (user_id, teacher_no, first_name, middle_name, last_name, sex)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT (teacher_no) DO UPDATE SET first_name = $3, middle_name = $4, last_name = $5, sex = $6
               RETURNING teacher_id`,
              [userId, empId, firstName, middleName || null, lastName, gender]
            );

            if (tchRows?.[0]) {
              const teacherId = tchRows[0].teacher_id;

              if (hasSectionAssignment) {
                const assignment = await db.query(
                  `UPDATE classes SET advisor_teacher_id = $1 WHERE class_id = $2 RETURNING class_id`,
                  [teacherId, assignedClassId]
                );
                if (!assignment.rows.length) {
                  errors.push(`Row ${i + 1} (${empId}): Grade/section "${gradeAssigned} - ${sectionAssigned}" was not found in the active school year.`);
                }
              }

              if (hasFacultyAssignment) {
                await db.query(
                  `INSERT INTO faculty_in_charge (school_id, teacher_id, grade_level)
                   VALUES ($1, $2, $3)
                   ON CONFLICT DO NOTHING`,
                  [schoolId, teacherId, gradeAssigned]
                );
              }

              sendWelcomeEmailWithTempPassword({
                toEmail: email,
                fullName,
                role: 'Teacher',
                tempPassword,
                identifier: empId,
              });

              imported.push({ employeeId: empId, name: fullName, email });
            }
          }
        } catch (dbErr) {
          errors.push(`Row ${i + 1} (${empId}): DB error — ${dbErr.message}`);
          console.error(`❌ DB teacher import error row ${i + 1}:`, dbErr.message);
        }
      } else {
        // In-memory fallback
        imported.push({
          id: empId,
          employeeId: empId,
          name: fullName,
          gender,
          email,
          gradeAssigned,
          sectionAssigned,
          isFacultyInCharge: hasFacultyAssignment,
          status: 'Active',
          dateAdded: new Date().toISOString().split('T')[0],
        });
      }
    }

    // Audit Log & Notification for Batch Teacher CSV Import
    try {
      const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;
      const count = imported.length;

      await db.query(
        `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
         VALUES ($1, $2, 'BATCH_IMPORT_TEACHERS', $3, $4)`,
        [
          schoolId || '109283',
          adminUserId || null,
          `Batch imported ${count} teacher accounts via CSV upload.`,
          req.ip || req.headers['x-forwarded-for'] || null,
        ]
      );

      await db.query(
        `INSERT INTO notifications (school_id, title, message, notification_type)
         VALUES ($1, $2, $3, 'system')`,
        [
          schoolId || '109283',
          `Batch Teacher CSV Import Completed`,
          `Successfully processed and imported ${count} teacher accounts into the system.`,
        ]
      );
    } catch (nErr) {
      console.warn('Batch teacher import audit notice:', nErr.message);
    }

    return res.json({
      success: true,
      count: imported.length,
      importedRecords: imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Batch import completed. Successfully imported ${imported.length} teacher(s).${errors.length > 0 ? ` ${errors.length} row(s) had issues.` : ''}`,
    });
  } catch (error) {
    console.error('Teacher CSV Import Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process teacher CSV batch upload.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/account-requests
// ---------------------------------------------------------------------------
async function getAccountRequests(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const { rows } = await db.query(
          `SELECT request_id, school_id, teacher_no, first_name, middle_name, last_name, sex, email, status, created_at
           FROM account_requests
           WHERE (school_id = $1 OR school_id IS NULL)
           ORDER BY created_at DESC`,
          [schoolId]
        );
        return res.json({ success: true, requests: rows });
      } catch (dbErr) {
        console.warn('Fetch account requests DB notice:', dbErr.message);
      }
    }
    return res.json({ success: true, requests: [] });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch account requests.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/account-requests/:id/approve
// ---------------------------------------------------------------------------
async function approveAccountRequest(req, res) {
  try {
    const requestId = req.params.id;
    let targetRequest = null;

    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await db.query(
          'SELECT * FROM account_requests WHERE request_id = $1 LIMIT 1',
          [requestId]
        );
        if (rows?.length > 0) targetRequest = rows[0];
      } catch (e) {}
    }

    if (!targetRequest) {
      return res.status(404).json({ success: false, error: 'Account request not found.' });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = hashPassword(tempPassword);
    const generatedTeacherNo = `EMP-2026-${Math.floor(100 + Math.random() * 900)}`;

    if (process.env.DATABASE_URL) {
      try {
        const { rows: userRows } = await db.query(
          `INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
           VALUES ($1, $2, $3, 'teacher', 'active', true)
           ON CONFLICT (email) DO UPDATE SET school_id = $1, password_hash = $3, must_change_password = true, status = 'active'
           RETURNING user_id`,
          [targetRequest.school_id, targetRequest.email, hashedPassword]
        );

        if (userRows?.length > 0) {
          const userId = userRows[0].user_id;
          const firstName = targetRequest.first_name || 'Teacher';
          const middleName = targetRequest.middle_name || null;
          const lastName = targetRequest.last_name || 'Faculty';
          const teacherNo = targetRequest.teacher_no || generatedTeacherNo;
          const sex = targetRequest.sex || 'Male';

          await db.query(
            `INSERT INTO teachers (user_id, teacher_no, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (teacher_no) DO UPDATE SET first_name = $3, middle_name = $4, last_name = $5, sex = $6`,
            [userId, teacherNo, firstName, middleName, lastName, sex]
          );

          await db.query(
            "UPDATE account_requests SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
            [requestId]
          );

          sendWelcomeEmailWithTempPassword({
            toEmail: targetRequest.email,
            fullName: targetRequest.full_name || `${firstName} ${lastName}`,
            role: 'Teacher',
            tempPassword,
            identifier: teacherNo,
          });
        }
      } catch (dbErr) {
        console.warn('Approve account request DB notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Account approved for ${targetRequest.full_name || targetRequest.email}. Credentials sent to ${targetRequest.email}.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to approve account request.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/account-requests/:id/reject
// ---------------------------------------------------------------------------
async function rejectAccountRequest(req, res) {
  try {
    const requestId = req.params.id;

    if (process.env.DATABASE_URL) {
      try {
        await db.query(
          "UPDATE account_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
          [requestId]
        );
      } catch (e) {}
    }

    return res.json({ success: true, message: 'Account request rejected.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reject account request.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/teacher/assign-phil-iri — Assign Phil-IRI Set (Set A/B/C/D) to Class
// ---------------------------------------------------------------------------
async function assignPhilIriSetToClass(req, res) {
  try {
    const { classId, gradeLevel, set, period } = req.body;
    if (!set || !period) {
      return res.status(400).json({ success: false, error: 'Set (Set A/B/C/D) and period (Pre-Test/Post-Test) are required.' });
    }

    if (process.env.DATABASE_URL) {
      try {
        await db.query(
          `INSERT INTO notifications (school_id, title, message, notification_type)
           VALUES ('109283', $1, $2, 'system')`,
          [
            `Phil-IRI ${set} Assigned`,
            `Teacher assigned Phil-IRI ${set} (${period}) for ${gradeLevel || 'Class Section'}.`,
          ]
        );
      } catch (dbErr) {
        console.warn('Notice creating assignment notification:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Successfully assigned Phil-IRI ${set} (${period}) to ${gradeLevel || 'class'}.`,
      assignment: { classId, gradeLevel, set, period, assignedAt: new Date().toISOString() },
    });
  } catch (err) {
    console.error('Error assigning Phil-IRI set:', err);
    return res.status(500).json({ success: false, error: 'Failed to assign Phil-IRI set.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/teacher/assessments/assign-phil-iri-students — Per-Student Set Assignment
// ---------------------------------------------------------------------------
async function assignPhilIriToStudents(req, res) {
  try {
    let { assignments, passageSet, assessmentType, assessmentPeriod, language, dueDate, isEdit, instructions: customInstructions, teacherNotes } = req.body;
    const finalInstructions = (customInstructions || teacherNotes || '').trim() || null;

    if (!assessmentType || !assessmentPeriod) {
      return res.status(400).json({ success: false, error: 'assessmentType and assessmentPeriod are required.' });
    }

    const teacherUserId = req.user?.teacherId || req.user?.teacher_id || req.user?.userId || req.user?.user_id || req.user?.id;

    let successfulCount = 0;
    const skippedDuplicates = [];

    if (process.env.DATABASE_URL) {
      // Find teacher_id from teachers table
      const tRes = await db.query(
        `SELECT teacher_id FROM teachers WHERE user_id::text = $1::text OR teacher_id::text = $1::text LIMIT 1`,
        [teacherUserId]
      );
      const teacherId = tRes.rows[0]?.teacher_id || null;

      // If assignments array is not provided, automatically gather section students and matching passage
      if (!Array.isArray(assignments) || assignments.length === 0) {
        // Find matching passage
        const pMatch = await db.query(
          `SELECT passage_id FROM phil_iri_passages 
           WHERE (LOWER(passage_set) = LOWER($1) OR passage_set = $1 OR passage_set ILIKE $1)
             AND (LOWER(COALESCE(language, 'fil')) LIKE LOWER($2) || '%')
             AND LOWER(REGEXP_REPLACE(COALESCE(stage, ''), '[^a-zA-Z]+', '_', 'g')) = LOWER($3)
           LIMIT 1`,
          [passageSet || 'Set A', (language || 'fil').substring(0, 2), assessmentPeriod]
        );

        let targetPassageId = pMatch.rows[0]?.passage_id;
        if (!targetPassageId) {
          const fallbackPassage = await db.query(
            `SELECT passage_id
             FROM phil_iri_passages
             WHERE LOWER(COALESCE(language, 'fil')) LIKE LOWER($1) || '%'
               AND LOWER(REGEXP_REPLACE(COALESCE(stage, ''), '[^a-zA-Z]+', '_', 'g')) = LOWER($2)
             LIMIT 1`,
            [(language || 'fil').substring(0, 2), assessmentPeriod]
          );
          targetPassageId = fallbackPassage.rows[0]?.passage_id;
        }

        // Find section students
        const stRes = await db.query(
          `SELECT s.student_id 
           FROM students s
           JOIN student_grade_history sgh ON sgh.student_id = s.student_id
           JOIN classes c ON sgh.class_id = c.class_id
        JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
        JOIN users u ON u.user_id = t.user_id
        JOIN school_years sy ON sy.school_year_id = c.school_year_id AND sy.is_active = true
           WHERE (t.user_id::text = $1::text OR t.teacher_id::text = $1::text)
             AND c.school_id = u.school_id`,
          [teacherUserId]
        );

        if (stRes.rows && stRes.rows.length > 0 && targetPassageId) {
          assignments = stRes.rows.map((row) => ({
            studentId: row.student_id,
            passageId: targetPassageId,
          }));
        } else {
          assignments = [];
        }
      }

      const cleanDueDate = dueDate ? new Date(dueDate) : null;

      for (const item of assignments) {
        if (!item.studentId || !item.passageId) continue;

        // Fetch passage language first
        const pRes = await db.query(`SELECT language, title FROM phil_iri_passages WHERE passage_id::text = $1 LIMIT 1`, [String(item.passageId)]);
        const passageLang = (pRes.rows[0]?.language || 'fil').toLowerCase();
        const langLabel = passageLang.startsWith('en') ? 'English' : 'Filipino';

        // Check if student already has an official assessment for this (assessment_type, assessment_period, language)
        const dupCheck = await db.query(
          `SELECT a.assessment_id, p.title 
           FROM assessments a
           LEFT JOIN phil_iri_passages p ON a.passage_id = p.passage_id
           WHERE a.student_id = $1
             AND LOWER(COALESCE(a.assessment_type, 'oral')) = LOWER($2)
             AND LOWER(COALESCE(a.assessment_period, 'pre_test')) = LOWER($3)
             AND LOWER(COALESCE(p.language, 'fil')) = LOWER($4)
           LIMIT 1`,
          [item.studentId, assessmentType, assessmentPeriod, passageLang]
        );

        if (dupCheck.rows && dupCheck.rows.length > 0) {
          const existingId = dupCheck.rows[0].assessment_id;
          // If this is an adaptive session assignment, allow it regardless of duplicates
          if (item.adaptiveSessionId) {
            // Just proceed to create a new assessment linked to the adaptive session (fall through)
          } else if (isEdit) {
            await db.query(
              `UPDATE assessments 
               SET passage_id = $1, 
                   assigned_by_teacher_id = COALESCE($2, assigned_by_teacher_id),
                   due_date = $3,
                   instructions = $4,
                   updated_at = CURRENT_TIMESTAMP
               WHERE assessment_id = $5`,
              [item.passageId, teacherId, cleanDueDate, finalInstructions, existingId]
            );
            successfulCount++;
            continue;
          } else {
            const existingTitle = dupCheck.rows[0].title || 'an existing passage';
            skippedDuplicates.push({
              studentId: item.studentId,
              reason: `Already has an official ${langLabel} ${assessmentPeriod === 'pre_test' ? 'Pre-test' : 'Post-test'} for ${assessmentType} (${existingTitle}).`
            });
            continue;
          }
        }

        await db.query(
          `INSERT INTO assessments (student_id, passage_id, assigned_by_teacher_id, assessment_type, assessment_period, due_date, instructions, status, adaptive_session_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8)`,
          [item.studentId, item.passageId, teacherId, assessmentType, assessmentPeriod, cleanDueDate, finalInstructions, item.adaptiveSessionId || null]
        );
        successfulCount++;
      }
    } else {
      successfulCount = assignments.length;
    }

    if (successfulCount === 0 && skippedDuplicates.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Selected student(s) already have an official ${assessmentPeriod === 'pre_test' ? 'Pre-test' : 'Post-test'} assigned for ${assessmentType}. Only ONE official Pre-test and Post-test per assessment cycle is allowed.`,
        skippedDuplicates,
      });
    }

    return res.json({
      success: true,
      message: `Successfully assigned Phil-IRI passages to ${successfulCount} student(s).` +
        (skippedDuplicates.length > 0 ? ` (${skippedDuplicates.length} student(s) skipped as they already have an official ${assessmentPeriod} assigned).` : ''),
      assignedCount: successfulCount,
      skippedCount: skippedDuplicates.length,
      skippedDuplicates,
    });
  } catch (err) {
    console.error('Error in assignPhilIriToStudents:', err);
    return res.status(500).json({ success: false, error: 'Failed to assign Phil-IRI to students.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/teacher/assessments/pending-reviews — Get student oral assessments awaiting teacher review
// ---------------------------------------------------------------------------
async function getPendingOralReviews(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      const query = `
        SELECT 
          a.assessment_id AS "assessmentId",
          aa.attempt_id AS "attemptId",
          s.student_id AS "studentId",
          CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name) AS "studentName",
          s.lrn,
          p.passage_id AS "passageId",
          p.title AS "passageTitle",
          p.grade_level AS "gradeLevel",
          p.passage_set AS "passageSet",
          p.language,
          p.content_text AS "passageText",
          orr.oral_result_id AS "oralResultId",
          orr.audio_recording_url AS "audioUrl",
          orr.transcript_text AS "spokenTranscript",
          orr.ai_miscues_json AS "aiMiscues",
          orr.verified_miscues_json AS "verifiedMiscues",
          orr.reading_rate_wpm AS "wpm",
          orr.accuracy_percentage AS "accuracyPct",
          orr.comprehension_score AS "comprehensionScore",
          orr.verification_status AS "verificationStatus",
          aa.completed_at AS "submittedAt"
        FROM assessments a
        JOIN students s ON a.student_id = s.student_id
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
        JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
        WHERE LOWER(COALESCE(orr.verification_status, 'pending')) != 'verified'
          AND LOWER(COALESCE(a.status, 'open')) != 'completed'
        ORDER BY aa.completed_at DESC
      `;
      const { rows } = await db.query(query);
      return res.json({ success: true, pendingReviews: rows });
    }

    return res.json({ success: true, pendingReviews: [] });
  } catch (err) {
    console.error('Error in getPendingOralReviews:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch pending reviews.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/teacher/assessments/review/:attemptId — Get individual oral assessment review details
// ---------------------------------------------------------------------------
async function getOralReviewDetail(req, res) {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    if (process.env.DATABASE_URL) {
      const query = `
        SELECT 
          a.assessment_id AS "assessmentId",
          aa.attempt_id AS "attemptId",
          s.student_id AS "studentId",
          CONCAT_WS(' ', s.first_name, NULLIF(s.middle_name, ''), s.last_name) AS "studentName",
          s.lrn,
          p.passage_id AS "passageId",
          p.title AS "passageTitle",
          p.grade_level AS "gradeLevel",
          p.passage_set AS "passageSet",
          p.language,
          p.content_text AS "passageText",
          orr.oral_result_id AS "oralResultId",
          orr.audio_recording_url AS "audioUrl",
          orr.transcript_text AS "spokenTranscript",
          orr.ai_miscues_json AS "aiMiscues",
          orr.verified_miscues_json AS "verifiedMiscues",
          orr.reading_rate_wpm AS "wpm",
          orr.accuracy_percentage AS "accuracyPct",
          orr.comprehension_score AS "comprehensionScore",
          (SELECT COUNT(*)::int FROM phil_iri_questions q WHERE q.passage_id = p.passage_id) AS "totalQuestions",
          orr.verification_status AS "verificationStatus",
          aa.completed_at AS "submittedAt"
        FROM assessment_attempts aa
        JOIN assessments a ON aa.assessment_id = a.assessment_id
        JOIN students s ON a.student_id = s.student_id
        JOIN users student_user ON student_user.user_id = s.user_id
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        LEFT JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
        WHERE (aa.attempt_id::text = $1 OR a.assessment_id::text = $1)
          AND student_user.school_id = (SELECT school_id FROM users WHERE user_id = $2)
        ORDER BY aa.completed_at DESC NULLS LAST, aa.created_at DESC NULLS LAST
        LIMIT 1
      `;
      const { rows } = await db.query(query, [attemptId, userId]);
      if (rows.length > 0) {
        return res.json({ success: true, review: rows[0] });
      }
      return res.status(404).json({ success: false, error: 'Review attempt not found.' });
    }

    return res.status(404).json({ success: false, error: 'Database not configured.' });
  } catch (err) {
    console.error('Error in getOralReviewDetail:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch review detail.' });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/teacher/assessments/:attemptId/verify-oral — Save Verified Miscues
// ---------------------------------------------------------------------------
async function verifyOralReadingResult(req, res) {
  try {
    const { attemptId } = req.params;
    const { verifiedMiscues, verifiedWpm, verifiedAccuracyPct, comprehensionScore, isDiscontinued, discontinuationReason, overallProfile } = req.body;

    const { getPhilIriProfile } = require('../services/miscueEngine.js');
    const profileLabel = isDiscontinued
      ? 'Frustration'
      : (overallProfile || getPhilIriProfile(verifiedAccuracyPct || 0, comprehensionScore || 0));

    if (process.env.DATABASE_URL) {
      // 1. Resolve real attempt_id, assessment_id, and student_id
      let resolvedAttemptId = attemptId;
      let resolvedAssessmentId = null;
      let resolvedStudentId = null;

      const attemptCheck = await db.query(
        `SELECT aa.attempt_id, aa.assessment_id, a.student_id 
         FROM assessment_attempts aa
         JOIN assessments a ON a.assessment_id = aa.assessment_id
         WHERE aa.attempt_id::text = $1 OR a.assessment_id::text = $1
         ORDER BY aa.completed_at DESC NULLS LAST, aa.created_at DESC NULLS LAST
         LIMIT 1`,
        [attemptId]
      );

      if (attemptCheck.rows?.[0]) {
        resolvedAttemptId = attemptCheck.rows[0].attempt_id;
        resolvedAssessmentId = attemptCheck.rows[0].assessment_id;
        resolvedStudentId = attemptCheck.rows[0].student_id;
      }

      if (!resolvedAssessmentId) {
        const aDirect = await db.query(
          `SELECT assessment_id, student_id FROM assessments WHERE assessment_id::text = $1 LIMIT 1`,
          [attemptId]
        );
        if (aDirect.rows?.[0]) {
          resolvedAssessmentId = aDirect.rows[0].assessment_id;
          resolvedStudentId = aDirect.rows[0].student_id;
        }
      }

      // 2. Update or Insert oral_reading_results record
      const existingOral = await db.query(
        `SELECT oral_result_id FROM oral_reading_results WHERE assessment_attempt_id = $1 LIMIT 1`,
        [resolvedAttemptId]
      );

      if (existingOral.rows?.[0]) {
        await db.query(
          `UPDATE oral_reading_results
           SET verified_miscues_json = $1,
               reading_rate_wpm = $2,
               accuracy_percentage = $3,
               fluency_score = $2,
               pronunciation_score = $3,
               comprehension_score = COALESCE($4, comprehension_score),
               verification_status = 'verified',
               updated_at = CURRENT_TIMESTAMP
           WHERE assessment_attempt_id = $5`,
          [JSON.stringify(verifiedMiscues || []), verifiedWpm || 0, verifiedAccuracyPct || 0, comprehensionScore ?? null, resolvedAttemptId]
        );
      } else {
        await db.query(
          `INSERT INTO oral_reading_results (
             assessment_attempt_id, verified_miscues_json, reading_rate_wpm,
             accuracy_percentage, fluency_score, pronunciation_score,
             comprehension_score, verification_status, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            resolvedAttemptId,
            JSON.stringify(verifiedMiscues || []),
            verifiedWpm || 0,
            verifiedAccuracyPct || 0,
            verifiedWpm || 0,
            verifiedAccuracyPct || 0,
            comprehensionScore ?? null
          ]
        );
      }

      // 3. Update assessment attempt status to completed
      await db.query(
        `UPDATE assessment_attempts
         SET status = 'completed',
             updated_at = CURRENT_TIMESTAMP
         WHERE attempt_id = $1`,
        [resolvedAttemptId]
      );

      // 4. Update main assessment record status, reading profile, and remarks
      const remarksText = isDiscontinued
        ? `Verified Oral Reading Assessment Result - Frustration (Discontinued - Refusal to Read)`
        : `Verified Oral Reading Assessment Result - ${profileLabel} (${verifiedAccuracyPct || 0}% Accuracy, ${verifiedWpm || 0} WPM)`;
      if (resolvedAssessmentId) {
        await db.query(
          `UPDATE assessments
           SET status = 'completed',
               reading_level_result = $1,
               remarks = $2,
               updated_at = CURRENT_TIMESTAMP
           WHERE assessment_id = $3`,
          [profileLabel, remarksText, resolvedAssessmentId]
        );
      }

      // 5. Also update student's overall reading_profiles
      let isEng = false;
      let adaptiveProgression = null;

      if (resolvedAssessmentId) {
        try {
          const passRow = await db.query(
            `SELECT p.language FROM assessments a
             JOIN phil_iri_passages p ON p.passage_id = a.passage_id
             WHERE a.assessment_id = $1
             LIMIT 1`,
            [resolvedAssessmentId]
          );
          if (passRow.rows?.[0]?.language) {
            isEng = passRow.rows[0].language.toLowerCase().startsWith('en');
          }
        } catch (langErr) {
          console.warn('[verifyOralReadingResult] Passage language lookup notice:', langErr.message);
        }
      }

      const langCode = isEng ? 'en' : 'fil';
      const accVal = Number(verifiedAccuracyPct) || 0;
      const roundedWpm = Math.round(Number(verifiedWpm) || 0);

      if (resolvedStudentId) {
        try {
          // Normalized table upsert (student_reading_profiles — Single Source of Truth)
          try {
            await db.query(
              `INSERT INTO student_reading_profiles (
                 student_id, language, assessment_type, assessment_period,
                 profile_level, accuracy_rate, comprehension_rate, speed_wpm, updated_at
               )
               VALUES ($1, $2, 'oral', 'pre_test', $3, $4, $5, $6, CURRENT_TIMESTAMP)
               ON CONFLICT (student_id, language, assessment_type, assessment_period)
               DO UPDATE SET
                 profile_level = $3,
                 accuracy_rate = $4,
                 comprehension_rate = COALESCE($5, student_reading_profiles.comprehension_rate),
                 speed_wpm = COALESCE(NULLIF($6, 0), student_reading_profiles.speed_wpm),
                 updated_at = CURRENT_TIMESTAMP`,
              [
                resolvedStudentId,
                langCode,
                profileLabel,
                accVal,
                comprehensionScore ?? null,
                roundedWpm
              ]
            );
          } catch (normErr) {
            console.warn('[verifyOralReadingResult] student_reading_profiles upsert notice:', normErr.message);
          }
        } catch (rpErr) {
          console.warn('[verifyOralReadingResult] Notice updating reading_profiles:', rpErr.message);
        }

        // 6. ── Phase 2 Adaptive Progression (Triggered strictly upon Teacher Verification) ──
        try {
          // Look up active adaptive session for this oral assessment
          let targetSessionId = null;
          if (resolvedAssessmentId) {
            const aCheck = await db.query(
              `SELECT adaptive_session_id FROM assessments WHERE assessment_id = $1 LIMIT 1`,
              [resolvedAssessmentId]
            );
            if (aCheck.rows?.[0]?.adaptive_session_id) {
              targetSessionId = aCheck.rows[0].adaptive_session_id;
            }
          }

          if (!targetSessionId && resolvedStudentId) {
            const sCheck = await db.query(
              `SELECT session_id FROM phil_iri_adaptive_sessions
               WHERE student_id = $1 AND assessment_type = 'oral' AND LOWER(COALESCE(language, 'fil')) = LOWER($2) AND status = 'in_progress'
               ORDER BY started_at DESC LIMIT 1`,
              [resolvedStudentId, langCode]
            );
            if (sCheck.rows?.[0]?.session_id) {
              targetSessionId = sCheck.rows[0].session_id;
            } else if (profileLabel === 'Frustration' || profileLabel === 'Independent') {
              // Auto-initialize adaptive session from baseline result
              const { computeInitialStep } = require('../services/adaptiveEngine.js');
              let baselineGradeLevel = 'Grade 3';
              
              // Get passage grade level or student grade history
              if (resolvedAssessmentId) {
                const pGrade = await db.query(
                  `SELECT p.grade_level FROM assessments a
                   JOIN phil_iri_passages p ON p.passage_id = a.passage_id
                   WHERE a.assessment_id = $1 LIMIT 1`,
                  [resolvedAssessmentId]
                );
                if (pGrade.rows?.[0]?.grade_level) {
                  baselineGradeLevel = pGrade.rows[0].grade_level;
                }
              }

              const initialStep = computeInitialStep(baselineGradeLevel, profileLabel);
              if (!initialStep.noPhase2Needed) {
                const syRes = await db.query(`SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1`);
                const schoolYearId = syRes.rows?.[0]?.school_year_id || null;

                // Find assigned teacher from assessment or current logged-in teacher
                let assignedTeacherId = null;
                if (resolvedAssessmentId) {
                  const aTeacher = await db.query(
                    `SELECT assigned_by_teacher_id FROM assessments WHERE assessment_id = $1 LIMIT 1`,
                    [resolvedAssessmentId]
                  );
                  assignedTeacherId = aTeacher.rows?.[0]?.assigned_by_teacher_id || null;
                }
                if (!assignedTeacherId && req.user) {
                  const reqUserVal = req.user.teacherId || req.user.teacher_id || req.user.userId || req.user.user_id || req.user.id;
                  if (reqUserVal) {
                    const tRes = await db.query(
                      `SELECT teacher_id FROM teachers WHERE user_id::text = $1::text OR teacher_id::text = $1::text LIMIT 1`,
                      [reqUserVal]
                    );
                    assignedTeacherId = tRes.rows?.[0]?.teacher_id || null;
                  }
                }

                const sessInsert = await db.query(
                  `INSERT INTO phil_iri_adaptive_sessions (
                     student_id, language, assessment_type,
                     baseline_grade_level, baseline_profile_level,
                     current_grade_level, direction, school_year_id,
                     assigned_by_teacher_id
                   ) VALUES ($1, $2, 'oral', $3, $4, $5, $6, $7, $8)
                   RETURNING session_id`,
                  [
                    resolvedStudentId, langCode,
                    baselineGradeLevel, profileLabel,
                    baselineGradeLevel, initialStep.direction,
                    schoolYearId,
                    assignedTeacherId,
                  ]
                );
                targetSessionId = sessInsert.rows?.[0]?.session_id || null;

                if (targetSessionId && resolvedAssessmentId) {
                  await db.query(
                    `UPDATE assessments SET adaptive_session_id = $1 WHERE assessment_id = $2`,
                    [targetSessionId, resolvedAssessmentId]
                  );
                }
              }
            }
          }

          if (targetSessionId) {
            const { evaluateNextStep, buildSessionSummary } = require('../services/adaptiveEngine.js');

            const sessRes = await db.query(
              `SELECT * FROM phil_iri_adaptive_sessions WHERE session_id = $1 LIMIT 1`,
              [targetSessionId]
            );
            const session = sessRes.rows?.[0];

            if (session && session.status === 'in_progress') {
              // Fetch grade level of the passage that was just verified
              let passageGradeLevel = session.current_grade_level || 'Grade 3';
              if (resolvedAssessmentId) {
                const pGrade = await db.query(
                  `SELECT p.grade_level FROM assessments a
                   JOIN phil_iri_passages p ON p.passage_id = a.passage_id
                   WHERE a.assessment_id = $1 LIMIT 1`,
                  [resolvedAssessmentId]
                );
                if (pGrade.rows?.[0]?.grade_level) {
                  passageGradeLevel = pGrade.rows[0].grade_level;
                }
              }

              const progression = evaluateNextStep(passageGradeLevel, profileLabel);
              const newStepCount = (session.step_count || 0) + 1;

              if (progression.action === 'complete') {
                // ── Session COMPLETE ──
                await db.query(
                  `UPDATE phil_iri_adaptive_sessions SET
                     current_grade_level = $1,
                     status = 'completed',
                     final_instructional_level = $2,
                     final_profile_level = $3,
                     step_count = $4,
                     completed_at = CURRENT_TIMESTAMP,
                     updated_at = CURRENT_TIMESTAMP
                   WHERE session_id = $5`,
                  [
                    passageGradeLevel,
                    progression.finalLevel,
                    progression.finalProfileLevel,
                    newStepCount,
                    targetSessionId,
                  ]
                );

                // Update student_reading_profiles with confirmed final instructional level
                try {
                  await db.query(
                    `INSERT INTO student_reading_profiles (
                       student_id, language, assessment_type, assessment_period,
                       profile_level, accuracy_rate, comprehension_rate, speed_wpm, updated_at
                     )
                     VALUES ($1, $2, 'oral', 'pre_test', $3, $4, $5, $6, CURRENT_TIMESTAMP)
                     ON CONFLICT (student_id, language, assessment_type, assessment_period)
                     DO UPDATE SET
                       profile_level = $3,
                       accuracy_rate = $4,
                       comprehension_rate = COALESCE($5, student_reading_profiles.comprehension_rate),
                       speed_wpm = COALESCE(NULLIF($6, 0), student_reading_profiles.speed_wpm),
                       updated_at = CURRENT_TIMESTAMP`,
                    [
                      resolvedStudentId,
                      langCode,
                      progression.finalProfileLevel || profileLabel,
                      accVal,
                      comprehensionScore ?? null,
                      roundedWpm,
                    ]
                  );
                } catch (profErr) {
                  console.warn('[verifyOralReadingResult] pre_test profile upsert error:', profErr.message);
                }

                adaptiveProgression = {
                  ...buildSessionSummary({ ...session, status: 'completed', final_instructional_level: progression.finalLevel, final_profile_level: progression.finalProfileLevel, step_count: newStepCount }),
                  nextAction: 'complete',
                  nextGradeLevel: null,
                  currentResult: profileLabel,
                  passageGradeLevel,
                  reason: progression.reason,
                  atBoundary: progression.atBoundary,
                };
              } else {
                // ── Session CONTINUES (stepUp or stepDown) ──
                await db.query(
                  `UPDATE phil_iri_adaptive_sessions SET
                     current_grade_level = $1,
                     direction = $2,
                     step_count = $3,
                     updated_at = CURRENT_TIMESTAMP
                   WHERE session_id = $4`,
                  [
                    passageGradeLevel,
                    session.direction || (progression.action === 'stepUp' ? 'stepping_up' : 'stepping_down'),
                    newStepCount,
                    targetSessionId,
                  ]
                );

                // Automatically find and assign a passage at progression.nextGradeLevel
                let nextPassage = null;
                const nextPassageRes = await db.query(
                  `SELECT passage_id, title, grade_level, word_count
                   FROM phil_iri_passages
                   WHERE LOWER(grade_level) = LOWER($1)
                     AND LOWER(COALESCE(language, 'fil')) = LOWER($2)
                     AND status != 'archived'
                     AND passage_id != (SELECT COALESCE(passage_id, '00000000-0000-0000-0000-000000000000') FROM assessments WHERE assessment_id = $3)
                   ORDER BY created_at DESC LIMIT 1`,
                  [progression.nextGradeLevel, langCode, resolvedAssessmentId || '00000000-0000-0000-0000-000000000000']
                );

                if (nextPassageRes.rows?.[0]) {
                  nextPassage = nextPassageRes.rows[0];
                  // Auto-create assessment assignment for the student
                  let teacherId = session.assigned_by_teacher_id || null;
                  if (!teacherId && resolvedAssessmentId) {
                    const origAss = await db.query(
                      `SELECT assigned_by_teacher_id FROM assessments WHERE assessment_id = $1 LIMIT 1`,
                      [resolvedAssessmentId]
                    );
                    teacherId = origAss.rows?.[0]?.assigned_by_teacher_id || null;
                  }
                  if (!teacherId && req.user) {
                    const reqUserVal = req.user.teacherId || req.user.teacher_id || req.user.userId || req.user.user_id || req.user.id;
                    if (reqUserVal) {
                      const tRes = await db.query(
                        `SELECT teacher_id FROM teachers WHERE user_id::text = $1::text OR teacher_id::text = $1::text LIMIT 1`,
                        [reqUserVal]
                      );
                      teacherId = tRes.rows?.[0]?.teacher_id || null;
                    }
                  }
                  if (!teacherId && resolvedStudentId) {
                    const sAdvisor = await db.query(
                      `SELECT c.advisor_teacher_id
                       FROM student_grade_history sgh
                       JOIN classes c ON c.class_id = sgh.class_id
                       WHERE sgh.student_id = $1
                       ORDER BY sgh.created_at DESC LIMIT 1`,
                      [resolvedStudentId]
                    );
                    teacherId = sAdvisor.rows?.[0]?.advisor_teacher_id || null;
                  }
                  await db.query(
                    `INSERT INTO assessments (
                       student_id, passage_id, assigned_by_teacher_id,
                       assessment_type, assessment_period, status,
                       adaptive_session_id, adaptive_step_number
                     ) VALUES ($1, $2, $3, 'oral', 'pre_test', 'open', $4, $5)`,
                    [
                      resolvedStudentId,
                      nextPassage.passage_id,
                      teacherId,
                      targetSessionId,
                      newStepCount + 1,
                    ]
                  );
                }

                adaptiveProgression = {
                  ...buildSessionSummary({ ...session, current_grade_level: passageGradeLevel, step_count: newStepCount }),
                  nextAction: progression.action,
                  nextGradeLevel: progression.nextGradeLevel,
                  currentResult: profileLabel,
                  passageGradeLevel,
                  reason: progression.reason,
                  atBoundary: progression.atBoundary,
                  assignedNextPassage: nextPassage ? {
                    id: nextPassage.passage_id,
                    title: nextPassage.title,
                    gradeLevel: nextPassage.grade_level,
                  } : null,
                };
              }
            }
          }
        } catch (adaptiveErr) {
          console.warn('[verifyOralReadingResult] Adaptive progression notice:', adaptiveErr.message);
        }
      }

      return res.json({
        success: true,
        message: 'Phil-IRI oral reading result verified successfully!',
        profileLabel,
        accuracyPct: verifiedAccuracyPct,
        wpm: verifiedWpm,
        attemptId: resolvedAttemptId,
        adaptiveProgression,
      });
    }

    return res.status(404).json({ success: false, error: 'Database not configured.' });
  } catch (err) {
    console.error('Error in verifyOralReadingResult:', err);
    return res.status(500).json({ success: false, error: 'Failed to verify oral reading result.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/teacher/assessments/phil-iri-activities — Get real DB Phil-IRI assessment activities
// ---------------------------------------------------------------------------
async function getPhilIriActivities(req, res) {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;

    if (process.env.DATABASE_URL) {
      // Fetch active school year
      const activeSyRes = await db.query(
        `SELECT sy.school_year_id
         FROM school_years sy
         JOIN users u ON u.school_id = sy.school_id
         WHERE u.user_id = $1 AND sy.is_active = true
         LIMIT 1`,
        [userId]
      );
      const activeSyId = activeSyRes.rows[0]?.school_year_id;

      const query = `
        SELECT 
          LOWER(COALESCE(a.assessment_type, 'oral')) AS "assessmentType",
          LOWER(COALESCE(a.assessment_period, 'pre_test')) AS "period",
          LOWER(COALESCE(p.language, 'fil')) AS "language",
          MAX(p.grade_level) AS "gradeLevel",
          STRING_AGG(DISTINCT p.passage_set, ', ' ORDER BY p.passage_set) AS "setsIncluded",
          COUNT(DISTINCT a.assessment_id)::int AS "totalAssigned",
          COUNT(DISTINCT CASE WHEN LOWER(aa.status) = 'completed' THEN a.assessment_id END)::int AS "done",
          COUNT(DISTINCT CASE WHEN COALESCE(LOWER(aa.status), 'pending') != 'completed' THEN a.assessment_id END)::int AS "pending",
          MAX(a.created_at) AS "created_at",
          MAX(a.due_date) AS "dueDate",
          BOOL_OR(LOWER(a.status) = 'closed') AS "isClosed",
          MAX(a.instructions) AS "specialInstructions"
        FROM assessments a
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        LEFT JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
        JOIN student_grade_history sgh ON sgh.student_id = a.student_id
        JOIN classes c ON sgh.class_id = c.class_id
        JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
        WHERE t.user_id = $1
          AND c.school_id = (SELECT school_id FROM users WHERE user_id = $1)
          AND ($2::uuid IS NULL OR (c.school_year_id = $2 AND sgh.school_year_id = $2))
        GROUP BY LOWER(COALESCE(a.assessment_type, 'oral')), LOWER(COALESCE(a.assessment_period, 'pre_test')), LOWER(COALESCE(p.language, 'fil'))
        ORDER BY MAX(a.created_at) DESC
      `;
      const { rows } = await db.query(query, [userId, activeSyId || null]);
      const activities = rows.map((r) => {
        const typeLabel = r.assessmentType === 'oral'
          ? 'Oral Reading'
          : r.assessmentType === 'listening'
            ? 'Listening'
            : 'Silent Reading';
        
        const periodLabel = r.period === 'post_test' ? 'Post-Test' : 'Pre-Test';
        const langLabel = r.language.startsWith('en') ? 'English' : 'Filipino';
        const masterTitle = `${typeLabel} Assessment (${periodLabel} - ${langLabel})`;

        const uniqueId = encodeActivityId(r.assessmentType, r.period, r.language);
        const isClosed = Boolean(r.isClosed);
        const formattedDueDate = r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'No Deadline';

        let depEdInstructions = [];
        if (r.assessmentType === 'oral') {
          depEdInstructions = [
            'Read the assigned passage aloud clearly and accurately into your device microphone.',
            'Maintain proper pronunciation, pace, and reading expression.',
            'Answer all comprehension questions carefully after completing the reading passage.',
            'Complete the assessment to evaluate Oral Reading Fluency (WPM) and Comprehension level.',
          ];
        } else if (r.assessmentType === 'listening') {
          depEdInstructions = [
            'Listen attentively while the reading passage is read aloud clearly.',
            'Focus on remembering key characters, events, and details of the story.',
            'Answer all comprehension questions based strictly on what you heard.',
            'Complete the assessment to determine Listening Comprehension level.',
          ];
        } else {
          depEdInstructions = [
            'Read the assigned passage silently at your regular reading speed.',
            'Focus on understanding main ideas, details, and context clues in the passage.',
            'Answer all comprehension questions independently after reading.',
            'Complete the assessment to determine Silent Reading Rate and Comprehension level.',
          ];
        }

        return {
          id: uniqueId,
          title: masterTitle,
          tag: 'Phil-IRI',
          type: 'phil-iri',
          assessmentType: r.assessmentType,
          period: r.period,
          language: r.language,
          gradeLevel: r.gradeLevel || 'Grade 4',
          passageSet: r.setsIncluded ? `Sets ${r.setsIncluded}` : 'All Sets',
          activityStatus: isClosed ? 'closed' : 'open',
          status: isClosed ? 'closed' : r.pending === 0 ? 'completed' : 'pending',
          done: r.done,
          pending: r.pending,
          totalAssigned: r.totalAssigned,
          action: isClosed ? 'Closed' : r.pending === 0 ? 'View result' : 'Open',
          dueDate: r.dueDate ? new Date(r.dueDate).toISOString().split('T')[0] : '',
          formattedDueDate: isClosed ? 'Closed' : formattedDueDate,
          stars: 100,
          studentsUnder14Gst: r.done,
          studentsAbove14Gst: r.pending,
          lastUpdate: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today',
          specialInstructions: r.specialInstructions || null,
          instructions: depEdInstructions,
        };
      });
      return res.json({ success: true, activities });
    }

    return res.json({ success: true, activities: [] });
  } catch (err) {
    console.error('Error in getPhilIriActivities:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch Phil-IRI activities.' });
  }
}

async function getPhilIriPassages(req, res) {
  try {
    const { rows: materials } = await db.query(
      `SELECT passage_id, passage_id AS id, title, grade_level, grade_level AS grade, passage_set, passage_set AS set, COALESCE(stage, 'Pre-Test') AS stage, language, status, content_text, content_text AS text, word_count, word_count AS words 
       FROM phil_iri_passages 
       WHERE LOWER(COALESCE(passage_set, '')) NOT IN ('unassigned', '')
       ORDER BY stage ASC, passage_set ASC, title ASC`
    );

    if (!materials || !materials.length) {
      return res.json({ success: true, count: 0, passages: [] });
    }

    const passageIds = materials.map((m) => m.passage_id);

    const { rows: allQuestions } = await db.query(
      `SELECT question_id, passage_id, question_text, question_type
       FROM phil_iri_questions
       WHERE passage_id = ANY($1::uuid[])
       ORDER BY created_at ASC`,
      [passageIds]
    );

    const questionIds = allQuestions.map((q) => q.question_id);

    let allChoices = [];
    if (questionIds.length) {
      const choicesRes = await db.query(
        `SELECT choice_id, question_id, choice_text, is_correct
         FROM phil_iri_question_choices
         WHERE question_id = ANY($1::uuid[])`,
        [questionIds]
      );
      allChoices = choicesRes.rows;
    }

    const choicesByQuestion = {};
    for (const c of allChoices) {
      if (!choicesByQuestion[c.question_id]) choicesByQuestion[c.question_id] = [];
      choicesByQuestion[c.question_id].push(c);
    }

    const questionsByPassage = {};
    for (const q of allQuestions) {
      const cRows = (choicesByQuestion[q.question_id] || [])
        .filter((c) => c && c.choice_text && String(c.choice_text).trim().length > 0);
      const options = cRows.map((c) => c.choice_text.trim());
      const correctIndex = cRows.findIndex((c) => c.is_correct === true);
      const correctChoice = cRows.find((c) => c.is_correct === true);

      const formattedQuestion = {
        id: q.question_id,
        question: q.question_text,
        type: q.question_type || 'Multiple Choice',
        options,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
        answer: correctChoice ? correctChoice.choice_text : '',
      };

      if (!questionsByPassage[q.passage_id]) questionsByPassage[q.passage_id] = [];
      questionsByPassage[q.passage_id].push(formattedQuestion);
    }

    const passages = materials.map((m) => ({
      ...m,
      questions: questionsByPassage[m.passage_id] || [],
    }));

    return res.json({ success: true, count: passages.length, passages });
  } catch (error) {
    console.error('Error fetching teacher passages:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch passages.' });
  }
}

async function deleteAssessment(req, res) {
  try {
    const { id } = req.params;
    const { passageId, assessmentType, period, language } = decodeActivityId(id);

    if (process.env.DATABASE_URL) {
      let whereClause = `1=1`;
      const params = [];

      if (passageId) {
        params.push(passageId);
        whereClause += ` AND (a.passage_id::text = $${params.length} OR a.assessment_id::text = $${params.length})`;
      }

      if (assessmentType) {
        params.push(assessmentType);
        whereClause += ` AND LOWER(COALESCE(a.assessment_type, 'oral')) = LOWER($${params.length})`;
      }

      if (period) {
        params.push(period);
        whereClause += ` AND LOWER(COALESCE(a.assessment_period, 'pre_test')) = LOWER($${params.length})`;
      }

      if (language) {
        params.push(language);
        whereClause += ` AND EXISTS (SELECT 1 FROM phil_iri_passages p WHERE p.passage_id = a.passage_id AND (LOWER(COALESCE(p.language, 'fil')) = LOWER($${params.length}) OR LOWER(COALESCE(p.language, 'fil')) LIKE LOWER($${params.length}) || '%'))`;
      }

      // 1. Gather linked adaptive_session_ids and affected students before deletion
      const linkedSessionsRes = await db.query(
        `SELECT DISTINCT a.adaptive_session_id, a.student_id, LOWER(COALESCE(p.language, 'fil')) AS lang, LOWER(COALESCE(a.assessment_type, 'oral')) AS type, LOWER(COALESCE(a.assessment_period, 'pre_test')) AS period
         FROM assessments a
         LEFT JOIN phil_iri_passages p ON p.passage_id = a.passage_id
         WHERE ${whereClause}`,
        params
      );
      const affectedRows = linkedSessionsRes.rows || [];
      const linkedSessionIds = affectedRows.map((r) => r.adaptive_session_id).filter(Boolean);

      // Unique student-language combinations affected
      const affectedStudents = Array.from(
        new Set(affectedRows.map((r) => `${r.student_id}:${r.lang.startsWith('en') ? 'en' : 'fil'}:${r.type}:${r.period}`))
      ).map((item) => {
        const [studentId, lang, type, period] = item.split(':');
        return { studentId, lang, type, period };
      });

      // 2. Delete child records in oral_reading_results
      await db.query(
        `DELETE FROM oral_reading_results 
         WHERE assessment_attempt_id IN (
           SELECT aa.attempt_id FROM assessment_attempts aa
           JOIN assessments a ON aa.assessment_id = a.assessment_id
           WHERE ${whereClause}
         )`,
        params
      );

      // 3. Delete child records in assessment_attempts
      await db.query(
        `DELETE FROM assessment_attempts 
         WHERE assessment_id IN (SELECT a.assessment_id FROM assessments a WHERE ${whereClause})`,
        params
      );

      // 4. Delete target records from assessments (including linked adaptive steps)
      let deleteWhere = whereClause;
      if (linkedSessionIds.length > 0) {
        deleteWhere = `(${whereClause}) OR (a.adaptive_session_id IN (${linkedSessionIds.map((_, i) => `$${params.length + i + 1}`).join(',')}))`;
      }
      const deleteParams = [...params, ...linkedSessionIds];

      // Also clean up any assessment attempts / oral results for the linked adaptive step assessments
      if (linkedSessionIds.length > 0) {
        await db.query(
          `DELETE FROM oral_reading_results 
           WHERE assessment_attempt_id IN (
             SELECT aa.attempt_id FROM assessment_attempts aa
             JOIN assessments a ON aa.assessment_id = a.assessment_id
             WHERE a.adaptive_session_id IN (${linkedSessionIds.map((_, i) => `$${i + 1}`).join(',')})
           )`,
          linkedSessionIds
        );
        await db.query(
          `DELETE FROM assessment_attempts 
           WHERE assessment_id IN (
             SELECT a.assessment_id FROM assessments a
             WHERE a.adaptive_session_id IN (${linkedSessionIds.map((_, i) => `$${i + 1}`).join(',')})
           )`,
          linkedSessionIds
        );
      }

      const result = await db.query(
        `DELETE FROM assessments a WHERE ${deleteWhere}`,
        deleteParams
      );

      // 5. Clean up the linked adaptive sessions
      if (linkedSessionIds.length > 0) {
        await db.query(
          `DELETE FROM phil_iri_adaptive_sessions
           WHERE session_id IN (${linkedSessionIds.map((_, i) => `$${i + 1}`).join(',')})`,
          linkedSessionIds
        );
      }

      // 6. Recalculate or clean up student_reading_profiles for affected students
      for (const { studentId, lang, type, period } of affectedStudents) {
        try {
          // Check if student has any remaining verified assessment for this type/period/language
          const latestRes = await db.query(
            `SELECT a.reading_level_result, ORR.word_accuracy_pct, ORR.words_per_minute, aa.score
             FROM assessments a
             JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
             LEFT JOIN oral_reading_results ORR ON ORR.assessment_attempt_id = aa.attempt_id
             LEFT JOIN phil_iri_passages p ON p.passage_id = a.passage_id
             WHERE a.student_id = $1
               AND a.status = 'completed'
               AND LOWER(COALESCE(a.assessment_type, 'oral')) = LOWER($2)
               AND (LOWER(COALESCE(p.language, 'fil')) = LOWER($3) OR LOWER(COALESCE(p.language, 'fil')) LIKE LOWER($3) || '%')
             ORDER BY aa.completed_at DESC NULLS LAST, aa.created_at DESC NULLS LAST
             LIMIT 1`,
            [studentId, type, lang]
          );

          if (latestRes.rows?.[0] && latestRes.rows[0].reading_level_result) {
            // Update profile with the previous verified assessment result
            const prev = latestRes.rows[0];
            await db.query(
              `UPDATE student_reading_profiles
               SET profile_level = $1,
                   accuracy_rate = COALESCE($2, accuracy_rate),
                   speed_wpm = COALESCE($3, speed_wpm),
                   updated_at = CURRENT_TIMESTAMP
               WHERE student_id = $4
                 AND LOWER(language) = LOWER($5)
                 AND LOWER(assessment_type) = LOWER($6)`,
              [prev.reading_level_result, prev.word_accuracy_pct, prev.words_per_minute, studentId, lang, type]
            );
          } else {
            // No remaining verified assessments: delete the student reading profile entry
            await db.query(
              `DELETE FROM student_reading_profiles
               WHERE student_id = $1
                 AND LOWER(language) = LOWER($2)
                 AND LOWER(assessment_type) = LOWER($3)`,
              [studentId, lang, type]
            );
          }
        } catch (profErr) {
          console.warn('[deleteAssessment] Error recalculating student_reading_profiles:', profErr.message);
        }
      }

      console.log(`Successfully deleted ${result.rowCount} assessment record(s), linked adaptive sessions, and updated reading profiles for query: ${id}`);
    }

    return res.json({ success: true, message: 'Assessment deleted successfully.' });
  } catch (err) {
    console.error('Error deleting assessment:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete assessment.' });
  }
}

// GET /api/teacher/class-students — Get students enrolled strictly in the teacher's section
async function getTeacherClassStudents(req, res) {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;

    if (process.env.DATABASE_URL) {
      let sectionName = null;
      let gradeLevel = null;
      let schoolYear = null;
      let schoolName = null;
      let principalName = null;

      // Query school metadata (school_name, principal_name) for teacher
      try {
        const schoolMeta = await db.query(
          `SELECT sch.school_name, sch.principal_name
           FROM users u
           JOIN schools sch ON u.school_id = sch.school_id
           WHERE u.user_id = $1
           LIMIT 1`,
          [userId]
        );
        if (schoolMeta.rows && schoolMeta.rows.length > 0) {
          schoolName = schoolMeta.rows[0].school_name;
          principalName = schoolMeta.rows[0].principal_name;
        } else {
          // Fallback to first school record if user school_id is unlinked
          const fallbackSch = await db.query(`SELECT school_name, principal_name FROM schools LIMIT 1`);
          if (fallbackSch.rows && fallbackSch.rows.length > 0) {
            schoolName = fallbackSch.rows[0].school_name;
            principalName = fallbackSch.rows[0].principal_name;
          }
        }
      } catch (sErr) {
        console.warn('School metadata query notice:', sErr.message);
      }

      // Query section metadata directly for advisor teacher
      try {
        const metaRes = await db.query(
          `SELECT c.section_name, c.grade_level, sy.school_year
           FROM teachers t
           JOIN classes c ON c.advisor_teacher_id = t.teacher_id
           JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
           WHERE t.user_id = $1
           LIMIT 1`,
          [userId]
        );
        if (metaRes.rows && metaRes.rows.length > 0) {
          sectionName = metaRes.rows[0].section_name;
          gradeLevel = metaRes.rows[0].grade_level ? String(metaRes.rows[0].grade_level) : null;
          schoolYear = metaRes.rows[0].school_year;
        }
      } catch (mErr) {
        console.warn('Teacher section metadata query notice:', mErr.message);
      }

      // Fallback for active school year if not resolved yet
      if (!schoolYear) {
        try {
          const syRes = await db.query(`SELECT school_year FROM school_years WHERE is_active = true LIMIT 1`);
          if (syRes.rows?.[0]?.school_year) {
            schoolYear = syRes.rows[0].school_year;
          }
        } catch (syErr) {}
      }

      // Fallback for FIC metadata if teacher is FIC with no direct section advisory
      if (!sectionName) {
        try {
          const ficMetaRes = await db.query(
            `SELECT fic.grade_level, sy.school_year
             FROM teachers t
             JOIN faculty_in_charge fic ON fic.teacher_id = t.teacher_id AND fic.status = 'active'
             JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
             WHERE t.user_id = $1
             LIMIT 1`,
            [userId]
          );
          if (ficMetaRes.rows && ficMetaRes.rows.length > 0) {
            gradeLevel = ficMetaRes.rows[0].grade_level ? String(ficMetaRes.rows[0].grade_level) : null;
            sectionName = gradeLevel ? `Grade ${gradeLevel} (All Sections)` : 'Grade Level Mode';
            schoolYear = ficMetaRes.rows[0].school_year;
          }
        } catch (fErr) {}
      }

      // 1. Fetch students enrolled in the teacher's assigned section
      const sectionQuery = `
        SELECT 
          s.student_id AS id,
          s.student_id AS "studentId",
          s.lrn,
          CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
          s.first_name AS "firstName",
          s.middle_name AS "middleName",
          s.last_name AS "lastName",
          s.sex AS gender,
          u.profile_image AS "profileImage",
          u.profile_image AS "profile_image",
          c.section_name AS "sectionName",
          c.section_name AS "section_name",
          c.section_name AS "section",
          c.grade_level AS "gradeLevel",
          c.class_id AS "classId",
          COALESCE(sgh.promotion_status, 'pending') AS "promotionStatus",
          COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending Evaluation') AS "readingLevel",
          COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending Evaluation') AS level,
          COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending Evaluation') AS reading_level,
          rp.fil_oral_profile_label AS "filOralProfile",
          rp.fil_listening_profile_label AS "filListeningProfile",
          rp.fil_silent_profile_label AS "filSilentProfile",
          rp.eng_oral_profile_label AS "engOralProfile",
          rp.eng_listening_profile_label AS "engListeningProfile",
          rp.eng_silent_profile_label AS "engSilentProfile",

          -- Distinct metrics per classification
          COALESCE(rp.fil_oral_accuracy_rate, 0) AS "filOralAccuracy",
          COALESCE(rp.fil_oral_speed_wpm, 0) AS "filOralSpeed",
          COALESCE(rp.fil_oral_comprehension_rate, 0) AS "filOralComprehension",

          COALESCE(rp.fil_silent_comprehension_rate, 0) AS "filSilentComprehension",
          COALESCE(rp.fil_listening_comprehension_rate, 0) AS "filListeningComprehension",

          COALESCE(rp.eng_oral_accuracy_rate, 0) AS "engOralAccuracy",
          COALESCE(rp.eng_oral_speed_wpm, 0) AS "engOralSpeed",
          COALESCE(rp.eng_oral_comprehension_rate, 0) AS "engOralComprehension",

          COALESCE(rp.eng_silent_comprehension_rate, 0) AS "engSilentComprehension",
          COALESCE(rp.eng_listening_comprehension_rate, 0) AS "engListeningComprehension",

          COALESCE(rp.fil_oral_speed_wpm, 0) AS "readingSpeed",
          COALESCE(rp.fil_oral_accuracy_rate, 0) AS accuracy,
          COALESCE(rp.fil_oral_comprehension_rate, 0) AS comprehension,
          CURRENT_TIMESTAMP AS "lastUpdated"
        FROM students s
        LEFT JOIN users u ON s.user_id = u.user_id
        JOIN student_grade_history sgh ON sgh.student_id = s.student_id
        JOIN classes c ON sgh.class_id = c.class_id
        JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
        JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
        LEFT JOIN reading_profiles rp ON rp.student_id::text = s.student_id::text
        LEFT JOIN (
          SELECT DISTINCT ON (student_id) student_id, reading_level_result
          FROM assessments
          ORDER BY student_id, created_at DESC
        ) a ON a.student_id::text = s.student_id::text
        WHERE t.user_id = $1
          AND c.school_id = (SELECT school_id FROM users WHERE user_id = $1)
        ORDER BY s.last_name ASC, s.first_name ASC
      `;
      const { rows } = await db.query(sectionQuery, [userId]);
      let students = rows && rows.length > 0 ? rows : [];

      if (students.length === 0) {
        const ficQuery = `
          SELECT 
            s.student_id AS id,
            s.student_id AS "studentId",
            s.lrn,
            CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
            s.first_name AS "firstName",
            s.middle_name AS "middleName",
            s.last_name AS "lastName",
            s.sex AS gender,
            u.profile_image AS "profileImage",
            u.profile_image AS "profile_image",
            c.section_name AS "sectionName",
            c.section_name AS "section_name",
            c.section_name AS "section",
            c.grade_level AS "gradeLevel",
            c.class_id AS "classId",
            COALESCE(sgh.promotion_status, 'pending') AS "promotionStatus",
            COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending Evaluation') AS "readingLevel",
            COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending Evaluation') AS level,
            COALESCE(a.reading_level_result, rp.fil_oral_profile_label, 'Pending Evaluation') AS reading_level,
            rp.fil_oral_profile_label AS "filOralProfile",
            rp.fil_listening_profile_label AS "filListeningProfile",
            rp.fil_silent_profile_label AS "filSilentProfile",
            rp.eng_oral_profile_label AS "engOralProfile",
            rp.eng_listening_profile_label AS "engListeningProfile",
            rp.eng_silent_profile_label AS "engSilentProfile",

            -- Distinct metrics per classification
            COALESCE(rp.fil_oral_accuracy_rate, 0) AS "filOralAccuracy",
            COALESCE(rp.fil_oral_speed_wpm, 0) AS "filOralSpeed",
            COALESCE(rp.fil_oral_comprehension_rate, 0) AS "filOralComprehension",

            COALESCE(rp.fil_silent_comprehension_rate, 0) AS "filSilentComprehension",
            COALESCE(rp.fil_listening_comprehension_rate, 0) AS "filListeningComprehension",

            COALESCE(rp.eng_oral_accuracy_rate, 0) AS "engOralAccuracy",
            COALESCE(rp.eng_oral_speed_wpm, 0) AS "engOralSpeed",
            COALESCE(rp.eng_oral_comprehension_rate, 0) AS "engOralComprehension",

            COALESCE(rp.eng_silent_comprehension_rate, 0) AS "engSilentComprehension",
            COALESCE(rp.eng_listening_comprehension_rate, 0) AS "engListeningComprehension",

            COALESCE(rp.fil_oral_speed_wpm, 0) AS "readingSpeed",
            COALESCE(rp.fil_oral_accuracy_rate, 0) AS accuracy,
            COALESCE(rp.fil_oral_comprehension_rate, 0) AS comprehension,
            CURRENT_TIMESTAMP AS "lastUpdated"
          FROM students s
          LEFT JOIN users u ON s.user_id = u.user_id
          JOIN student_grade_history sgh ON sgh.student_id = s.student_id
          JOIN classes c ON sgh.class_id = c.class_id
          JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
          JOIN faculty_in_charge fic ON fic.grade_level = c.grade_level AND fic.school_year_id = sy.school_year_id AND fic.status = 'active'
          JOIN teachers t ON fic.teacher_id = t.teacher_id
          LEFT JOIN reading_profiles rp ON rp.student_id::text = s.student_id::text
          LEFT JOIN (
            SELECT DISTINCT ON (student_id) student_id, reading_level_result
            FROM assessments
            ORDER BY student_id, created_at DESC
          ) a ON a.student_id::text = s.student_id::text
          WHERE t.user_id = $1
          ORDER BY c.section_name ASC, s.last_name ASC
        `;
        const ficRes = await db.query(ficQuery, [userId]);
        students = ficRes.rows || [];
      }

      // Extract section metadata from students list if available
      if (!sectionName && students.length > 0 && students[0].sectionName) {
        sectionName = students[0].sectionName;
        gradeLevel = gradeLevel || (students[0].gradeLevel ? String(students[0].gradeLevel) : null);
      }

      if (students.length > 0) {
        const studentIds = students.map((s) => String(s.id || s.studentId)).filter(Boolean);
        if (studentIds.length > 0) {
          const assRes = await db.query(
            `SELECT 
               a.student_id::text AS "studentId",
               LOWER(COALESCE(a.assessment_type, 'oral')) AS type,
               LOWER(COALESCE(a.assessment_period, 'pre_test')) AS period,
               LOWER(COALESCE(p.language, 'fil')) AS language,
               a.status,
               p.title AS "passageTitle",
               p.passage_set AS "passageSet"
             FROM assessments a
             LEFT JOIN phil_iri_passages p ON a.passage_id = p.passage_id
             WHERE a.student_id::text = ANY($1::text[])`,
            [studentIds]
          );

          const assMap = new Map();
          (assRes.rows || []).forEach((row) => {
            const sidStr = String(row.studentId);
            if (!assMap.has(sidStr)) assMap.set(sidStr, []);
            assMap.get(sidStr).push(row);
          });

          students.forEach((s) => {
            const sidStr = String(s.id || s.studentId);
            s.existingAssessments = assMap.get(sidStr) || [];
          });
        }
      }

      return res.json({
        success: true,
        students,
        sectionName,
        gradeLevel,
        schoolYear: schoolYear || '2026-2027',
        schoolName,
        principalName,
        totalStudents: students.length,
      });
    }

    return res.json({ success: true, students: [] });
  } catch (err) {
    console.error('Error fetching teacher class students:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch class students.' });
  }
}

// GET /api/teacher/assessments/activity-detail/:id — Get full detail for a master activity
async function getActivityDetail(req, res) {
  try {
    const { id } = req.params;
    let cleanId = String(id || '').trim();

    // Decode base64url encoded activity token if prefixed with 'act-'
    if (cleanId.startsWith('act-')) {
      try {
        const hash = cleanId.replace(/^act-/, '');
        cleanId = Buffer.from(hash, 'base64url').toString('utf-8');
      } catch (e) {
        // Fallback to raw string if decoding fails
      }
    }

    if (process.env.DATABASE_URL) {
      const userId = req.user?.userId || req.user?.user_id || req.user?.id;
      const activeSyRes = await db.query(
        `SELECT sy.school_year_id
         FROM school_years sy
         JOIN users u ON u.school_id = sy.school_id
         WHERE u.user_id = $1 AND sy.is_active = true
         LIMIT 1`,
        [userId]
      );
      const activeSyId = activeSyRes.rows[0]?.school_year_id;

      let passageId = null;
      let assessmentType = null;
      let period = null;
      let language = null;

      const knownTypes = ['oral', 'listening', 'silent'];
      const matchingType = knownTypes.find((t) => cleanId.toLowerCase().startsWith(t + '_'));

      if (matchingType) {
        assessmentType = matchingType;
        const remainder = cleanId.substring(matchingType.length + 1).toLowerCase();
        if (remainder.endsWith('_fil') || remainder.endsWith('_en')) {
          language = remainder.endsWith('_en') ? 'en' : 'fil';
          period = remainder.substring(0, remainder.lastIndexOf('_'));
        } else {
          period = remainder;
        }
      } else if (cleanId.includes('_')) {
        const parts = cleanId.split('_');
        passageId = parts[0];
        if (parts.length > 1) assessmentType = parts[1];
        if (parts.length > 2) period = parts.slice(2).join('_');
      } else {
        passageId = cleanId;
      }

      // Build WHERE conditions scoped to teacher & active school year
      let whereClause = `1=1`;
      const params = [];

      params.push(userId);
      whereClause += ` AND EXISTS (
        SELECT 1 FROM student_grade_history sgh
        JOIN classes c ON sgh.class_id = c.class_id
        JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
        WHERE sgh.student_id = a.student_id
          AND t.user_id = $${params.length}
          AND c.school_id = (SELECT school_id FROM users WHERE user_id = $${params.length})
          AND ($${params.length + 1}::uuid IS NULL OR (c.school_year_id = $${params.length + 1} AND sgh.school_year_id = $${params.length + 1}))
      )`;
      params.push(activeSyId || null);

      if (passageId) {
        params.push(passageId);
        whereClause += ` AND (a.passage_id::text = $${params.length} OR a.assessment_id::text = $${params.length})`;
      }

      if (assessmentType) {
        params.push(assessmentType);
        whereClause += ` AND LOWER(COALESCE(a.assessment_type, 'oral')) = LOWER($${params.length})`;
      }

      if (period) {
        params.push(period);
        whereClause += ` AND LOWER(COALESCE(a.assessment_period, 'pre_test')) = LOWER($${params.length})`;
      }

      if (language) {
        params.push(language);
        whereClause += ` AND EXISTS (SELECT 1 FROM phil_iri_passages p WHERE p.passage_id = a.passage_id AND (LOWER(COALESCE(p.language, 'fil')) = LOWER($${params.length}) OR LOWER(COALESCE(p.language, 'fil')) LIKE LOWER($${params.length}) || '%'))`;
      }

      // Query 1: Fetch passages included in this activity
      const passagesQuery = `
        SELECT DISTINCT
          p.passage_id AS "passageId",
          p.title,
          p.passage_set AS "passageSet",
          p.grade_level AS "gradeLevel",
          p.language,
          p.word_count AS "wordCount",
          COUNT(DISTINCT a.assessment_id)::int AS "assignedCount"
        FROM assessments a
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        WHERE ${whereClause}
        GROUP BY p.passage_id, p.title, p.passage_set, p.grade_level, p.language, p.word_count
        ORDER BY p.passage_set ASC, p.title ASC
      `;
      const pRes = await db.query(passagesQuery, params);

      // Query 2: Fetch student roster and attempt details
      const studentRosterQuery = `
        SELECT 
          a.assessment_id AS "assessmentId",
          s.student_id AS "studentId",
          s.lrn,
          CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS "studentName",
          s.sex AS gender,
          c.section_name AS "sectionName",
          c.grade_level AS "gradeLevel",
          p.passage_id AS "passageId",
          p.title AS "passageTitle",
          p.passage_set AS "passageSet",
          p.language AS "passageLanguage",
          p.content_text AS "passageText",
          orr.transcript_text AS "spokenTranscript",
          orr.ai_miscues_json AS "aiMiscues",
          orr.verified_miscues_json AS "verifiedMiscues",
          LOWER(COALESCE(a.assessment_type, 'oral')) AS "assessmentType",
          LOWER(COALESCE(a.assessment_period, 'pre_test')) AS "period",
          a.status,
          a.due_date AS "dueDate",
          a.instructions AS "instructions",
          COALESCE(a.reading_level_result, 'Pending Evaluation') AS "readingLevelResult",
          a.remarks,
          aa.attempt_id AS "attemptId",
          aa.completed_at AS "completedAt",
          orr.oral_result_id AS "oralResultId",
          orr.audio_recording_url AS "audioUrl",
          orr.reading_rate_wpm AS "wpm",
          orr.accuracy_percentage AS "accuracyPct",
          COALESCE(orr.comprehension_score, srr.comprehension_score, lrr.comprehension_score) AS "comprehensionScore",
          (SELECT COUNT(*)::int FROM phil_iri_questions q WHERE q.passage_id = p.passage_id) AS "totalQuestions",
          orr.verification_status AS "verificationStatus",
          COALESCE(orr.reading_time_seconds, srr.reading_time_seconds, lrr.audio_duration_seconds) AS "readingTimeSeconds"
        FROM assessments a
        JOIN students s ON a.student_id = s.student_id
        LEFT JOIN student_grade_history sgh ON sgh.student_id = s.student_id
        LEFT JOIN classes c ON sgh.class_id = c.class_id
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        LEFT JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
        LEFT JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
        LEFT JOIN silent_reading_results srr ON srr.assessment_attempt_id = aa.attempt_id
        LEFT JOIN listening_reading_results lrr ON lrr.assessment_attempt_id = aa.attempt_id
        WHERE ${whereClause}
        ORDER BY s.last_name ASC, s.first_name ASC
      `;
      const sRes = await db.query(studentRosterQuery, params);

      const typeLabel = (assessmentType || 'oral') === 'oral'
        ? 'Oral Reading'
        : (assessmentType || 'oral') === 'listening'
          ? 'Listening'
          : 'Silent Reading';
      const periodLabel = (period || 'pre_test') === 'post_test' ? 'Post-Test' : 'Pre-Test';
      const langLabel = (language || 'fil').startsWith('en') ? 'English' : 'Filipino';

      const firstDueDate = sRes.rows.find((r) => r.dueDate)?.dueDate || null;
      const firstInstructions = sRes.rows.find((r) => r.instructions)?.instructions || null;

      return res.json({
        success: true,
        activity: {
          id: cleanId,
          title: `${typeLabel} Assessment (${periodLabel} - ${langLabel})`,
          assessmentType: assessmentType || 'oral',
          period: period || 'pre_test',
          language: language || 'fil',
          dueDate: firstDueDate,
          instructions: firstInstructions,
          typeLabel,
          periodLabel,
          langLabel,
          passages: pRes.rows || [],
          students: sRes.rows || [],
        },
      });
    }

    return res.json({ success: false, error: 'Database connection not available.' });
  } catch (err) {
    console.error('Error fetching activity detail:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch activity detail.' });
  }
}

async function updateStudentPromotionByTeacher(req, res) {
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const { studentId } = req.params;
    const { promotionStatus } = req.body;

    if (!['promoted', 'retained', 'dropped', 'transferred', 'pending'].includes(promotionStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid promotion status.' });
    }

    if (process.env.DATABASE_URL) {
      const schoolId = await getAdminSchoolId(req);
      const activeSyRes = await db.query(
        'SELECT school_year_id FROM school_years WHERE is_active = true AND (school_id = $1 OR school_id IS NULL) LIMIT 1',
        [schoolId]
      );
      if (!activeSyRes.rows || activeSyRes.rows.length === 0) {
        return res.status(400).json({ success: false, error: 'No active school year found.' });
      }
      const activeSyId = activeSyRes.rows[0].school_year_id;

      // Verify that the teacher is the class adviser or FIC for this student's class
      const verifyRes = await db.query(
        `SELECT sgh.student_id
         FROM student_grade_history sgh
         JOIN classes c ON sgh.class_id = c.class_id
         JOIN teachers t ON (c.advisor_teacher_id = t.teacher_id OR t.teacher_id IN (
           SELECT fic.teacher_id FROM faculty_in_charge fic WHERE fic.grade_level = c.grade_level AND fic.school_year_id = $1 AND fic.status = 'active'
         ))
         WHERE (sgh.student_id::text = $2 OR sgh.student_id IN (SELECT student_id FROM students WHERE lrn = $2)) 
           AND t.user_id = $3 AND c.school_year_id = $1
         LIMIT 1`,
        [activeSyId, String(studentId), userId]
      );

      if (!verifyRes.rows || verifyRes.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'Not authorized to update promotion status for this student.' });
      }

      await db.query(
        `UPDATE student_grade_history
         SET promotion_status = $1::varchar,
             promoted_at = CASE WHEN $1::text = 'promoted' THEN CURRENT_TIMESTAMP ELSE NULL END
         WHERE (student_id::text = $2 OR student_id IN (SELECT student_id FROM students WHERE lrn = $2))
           AND (school_year_id = $3 OR class_id IN (SELECT class_id FROM classes WHERE school_year_id = $3))`,
        [promotionStatus, String(studentId), activeSyId]
      );

      return res.json({ success: true, message: `Student promotion status updated to ${promotionStatus.toUpperCase()}.` });
    }

    return res.json({ success: true, message: 'Updated promotion status.' });
  } catch (error) {
    console.error('Error updating promotion status by teacher:', error);
    return res.status(500).json({ success: false, error: 'Failed to update promotion status.' });
  }
}

// ---------------------------------------------------------------------------
// POST /api/teacher/assessments/start-adaptive-sessions — Teacher initiates Phase 2
// for one or more students. Creates adaptive_sessions + assigns the first passage.
// ---------------------------------------------------------------------------
async function startStudentAdaptiveSessions(req, res) {
  try {
    const { students, assessmentType, language, passageId, assessmentPeriod, dueDate, instructions: customInstructions } = req.body;
    // students = [{ studentId, baselineGradeLevel, baselineProfileLevel }]

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, error: 'students array is required.' });
    }
    if (!assessmentType) {
      return res.status(400).json({ success: false, error: 'assessmentType is required.' });
    }

    const { computeInitialStep, buildSessionSummary } = require('../services/adaptiveEngine.js');

    const teacherUserId = req.user?.teacherId || req.user?.teacher_id || req.user?.userId || req.user?.user_id || req.user?.id;
    const langCode = (language || 'fil').toLowerCase().startsWith('en') ? 'en' : 'fil';
    const aType = (assessmentType || 'oral').toLowerCase();
    const finalInstructions = (customInstructions || '').trim() || null;
    const cleanDueDate = dueDate ? new Date(dueDate) : null;
    const finalPeriod = assessmentPeriod || 'pre_test';

    const results = [];
    let successCount = 0;
    let skippedCount = 0;

    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, message: 'Phase 2 sessions initialized (local mode).', successCount: students.length, skippedCount: 0, results });
    }

    const tRes = await db.query(
      `SELECT teacher_id FROM teachers WHERE user_id::text = $1::text OR teacher_id::text = $1::text LIMIT 1`,
      [teacherUserId]
    );
    const teacherId = tRes.rows[0]?.teacher_id || null;

    // Use the active year of this teacher's school only.
    const syRes = await db.query(
      `SELECT sy.school_year_id
       FROM school_years sy
       JOIN teachers t ON (t.user_id::text = $1::text OR t.teacher_id::text = $1::text)
       JOIN users u ON u.user_id = t.user_id AND u.school_id = sy.school_id
       WHERE sy.is_active = true
       LIMIT 1`,
      [teacherUserId]
    );
    const schoolYearId = syRes.rows[0]?.school_year_id || null;

    // A teacher can start adaptive sessions only for learners in their own
    // adviser section. This is also an authorization boundary for direct API use.
    const allowedStudentsRes = await db.query(
      `SELECT DISTINCT s.student_id::text AS student_id
       FROM students s
       JOIN student_grade_history sgh ON sgh.student_id = s.student_id
       JOIN classes c ON c.class_id = sgh.class_id
       JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
       WHERE (t.user_id::text = $1::text OR t.teacher_id::text = $1::text)
         AND c.school_id = (
           SELECT u.school_id
           FROM teachers tx JOIN users u ON u.user_id = tx.user_id
           WHERE tx.user_id::text = $1::text OR tx.teacher_id::text = $1::text
           LIMIT 1
         )
         AND c.school_year_id = $2
         AND sgh.school_year_id = $2`,
      [teacherUserId, schoolYearId]
    );
    const allowedStudentIds = new Set((allowedStudentsRes.rows || []).map((row) => String(row.student_id)));

    for (const item of students) {
      const { studentId, baselineGradeLevel, baselineProfileLevel } = item;
      if (!studentId || !baselineGradeLevel || !baselineProfileLevel) {
        skippedCount++;
        results.push({ studentId, status: 'skipped', reason: 'Missing required fields.' });
        continue;
      }

      if (!allowedStudentIds.has(String(studentId))) {
        skippedCount++;
        results.push({ studentId, status: 'skipped', reason: 'Student is not enrolled in your assigned section.' });
        continue;
      }

      const initialStep = computeInitialStep(baselineGradeLevel, baselineProfileLevel);

      if (initialStep.noPhase2Needed) {
        skippedCount++;
        results.push({ studentId, status: 'skipped', reason: `Already Instructional at ${baselineGradeLevel}. Phase 2 not needed.` });
        continue;
      }

      try {
        // Check for existing in-progress session for this (student, lang, type)
        const existingSess = await db.query(
          `SELECT session_id FROM phil_iri_adaptive_sessions
           WHERE student_id = $1 AND language = $2 AND assessment_type = $3 AND status = 'in_progress'
           LIMIT 1`,
          [studentId, langCode, aType]
        );

        let sessionId;
        if (existingSess.rows?.[0]) {
          sessionId = existingSess.rows[0].session_id;
          results.push({ studentId, status: 'existing_session', sessionId, firstGradeLevel: initialStep.firstGradeLevel });
        } else {
          const sessInsert = await db.query(
            `INSERT INTO phil_iri_adaptive_sessions (
               student_id, language, assessment_type,
               baseline_grade_level, baseline_profile_level,
               current_grade_level, direction,
               assigned_by_teacher_id, school_year_id
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING session_id`,
            [
              studentId, langCode, aType,
              baselineGradeLevel, baselineProfileLevel,
              initialStep.firstGradeLevel, initialStep.direction,
              teacherId, schoolYearId,
            ]
          );
          sessionId = sessInsert.rows?.[0]?.session_id;
          results.push({ studentId, status: 'session_created', sessionId, firstGradeLevel: initialStep.firstGradeLevel });
        }

        // Assign the first passage if passageId provided or find one at the target grade level
        let targetPassageId = passageId || null;
        if (!targetPassageId) {
          const pRes = await db.query(
            `SELECT passage_id FROM phil_iri_passages
             WHERE LOWER(grade_level) = LOWER($1)
               AND LOWER(COALESCE(language, 'fil')) = LOWER($2)
               AND status != 'archived'
             ORDER BY created_at DESC LIMIT 1`,
            [initialStep.firstGradeLevel, langCode]
          );
          targetPassageId = pRes.rows?.[0]?.passage_id || null;
        }

        if (targetPassageId && sessionId) {
          await db.query(
            `INSERT INTO assessments (student_id, passage_id, assigned_by_teacher_id, assessment_type, assessment_period, due_date, instructions, status, adaptive_session_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8)`,
            [studentId, targetPassageId, teacherId, aType, finalPeriod, cleanDueDate, finalInstructions, sessionId]
          );
          successCount++;
        } else {
          skippedCount++;
          const lastResult = results[results.length - 1];
          if (lastResult) lastResult.warning = `No passage found at ${initialStep.firstGradeLevel} for ${langCode}. Session created but no assignment made.`;
        }
      } catch (studentErr) {
        skippedCount++;
        results.push({ studentId, status: 'error', reason: studentErr.message });
      }
    }

    return res.json({
      success: true,
      message: `Phase 2 adaptive sessions started for ${successCount} student(s). ${skippedCount} skipped.`,
      successCount,
      skippedCount,
      results,
    });
  } catch (err) {
    console.error('[startStudentAdaptiveSessions] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to start adaptive sessions.' });
  }
}

// ---------------------------------------------------------------------------
// GET /api/teacher/assessments/adaptive-sessions — List Phase 2 sessions for teacher's class
// ---------------------------------------------------------------------------
async function getAdaptiveSessions(req, res) {
  try {
    const { status, assessmentType, language } = req.query;
    const teacherUserId = req.user?.teacherId || req.user?.teacher_id || req.user?.userId || req.user?.user_id || req.user?.id;

    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, sessions: [], count: 0 });
    }

    const params = [teacherUserId];
    let filterClauses = '';

    if (status && status !== 'all') {
      params.push(status);
      filterClauses += ` AND s.status = $${params.length}`;
    }
    if (assessmentType && assessmentType !== 'all') {
      params.push(assessmentType.toLowerCase());
      filterClauses += ` AND s.assessment_type = $${params.length}`;
    }
    if (language && language !== 'all') {
      const lc = language.toLowerCase().startsWith('en') ? 'en' : 'fil';
      params.push(lc);
      filterClauses += ` AND s.language = $${params.length}`;
    }

    const query = `
      SELECT
        s.session_id                          AS "sessionId",
        s.student_id                          AS "studentId",
        CONCAT(st.first_name, ' ', COALESCE(st.middle_name || ' ', ''), st.last_name) AS "studentName",
        st.lrn,
        s.language,
        s.assessment_type                     AS "assessmentType",
        s.baseline_grade_level                AS "baselineGradeLevel",
        s.baseline_profile_level              AS "baselineProfileLevel",
        s.current_grade_level                 AS "currentGradeLevel",
        s.direction,
        s.status,
        s.final_instructional_level           AS "finalInstructionalLevel",
        s.final_profile_level                 AS "finalProfileLevel",
        s.step_count                          AS "stepCount",
        s.started_at                          AS "startedAt",
        s.completed_at                        AS "completedAt",
        -- Latest assessment linked to this session
        la.assessment_id                      AS "latestAssessmentId",
        la.reading_level_result               AS "latestResult",
        la.status                             AS "latestAssessmentStatus",
        lp.title                              AS "latestPassageTitle",
        lp.grade_level                        AS "latestPassageGrade",
        -- Class info
        c.grade_level                         AS "gradeLevel",
        c.section_name                        AS "sectionName"
      FROM phil_iri_adaptive_sessions s
      JOIN students st ON st.student_id = s.student_id
      -- Restrict to teacher's class students
      JOIN student_grade_history sgh ON sgh.student_id = s.student_id
      JOIN classes c ON c.class_id = sgh.class_id
      JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
      JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
      LEFT JOIN LATERAL (
        SELECT assessment_id, reading_level_result, status, passage_id
        FROM assessments
        WHERE adaptive_session_id = s.session_id
        ORDER BY created_at DESC LIMIT 1
      ) la ON true
      LEFT JOIN phil_iri_passages lp ON lp.passage_id = la.passage_id
      WHERE (t.user_id::text = $1::text OR t.teacher_id::text = $1::text)
        AND c.school_id = (
          SELECT u.school_id
          FROM teachers tx JOIN users u ON u.user_id = tx.user_id
          WHERE tx.user_id::text = $1::text OR tx.teacher_id::text = $1::text
          LIMIT 1
        )
        AND s.school_year_id = c.school_year_id
        AND sgh.school_year_id = c.school_year_id
        ${filterClauses}
      ORDER BY s.status = 'in_progress' DESC, s.updated_at DESC
      LIMIT 200
    `;

    const { rows } = await db.query(query, params);

    return res.json({
      success: true,
      count: rows.length,
      sessions: rows,
    });
  } catch (err) {
    console.error('[getAdaptiveSessions] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch adaptive sessions.' });
  }
}

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  importTeachersCSV,
  getAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
  assignPhilIriSetToClass,
  assignPhilIriToStudents,
  getPendingOralReviews,
  getOralReviewDetail,
  verifyOralReadingResult,
  getPhilIriActivities,
  getPhilIriPassages,
  deleteAssessment,
  getTeacherClassStudents,
  getActivityDetail,
  updateStudentPromotionByTeacher,
  startStudentAdaptiveSessions,
  getAdaptiveSessions,
};
