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
             COALESCE(t.sex, 'Male') AS gender,
             COALESCE(u.email, '') AS email,
             COALESCE(
               (SELECT c.grade_level FROM classes c JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true WHERE c.advisor_teacher_id = t.teacher_id LIMIT 1),
               'Unassigned'
             ) AS "gradeAssigned",
             COALESCE(
               (SELECT c.section_name FROM classes c JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true WHERE c.advisor_teacher_id = t.teacher_id LIMIT 1),
               'Unassigned'
             ) AS "sectionAssigned",
             COALESCE(
               (SELECT c.class_id FROM classes c JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true WHERE c.advisor_teacher_id = t.teacher_id LIMIT 1),
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
          const classId = teacherObj.classId;

          // Fetch enrolled class roster if teacher has assigned section
          if (classId) {
            const { rows: roster } = await db.query(
              `SELECT 
                 s.student_id AS id,
                 s.lrn,
                 CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
                 COALESCE(s.sex, 'Male') AS gender,
                 COALESCE(rp.current_profile_label, 'Pending Evaluation') AS level
               FROM student_grade_history sgh
               JOIN students s ON sgh.student_id = s.student_id
               LEFT JOIN reading_profiles rp ON s.student_id = rp.student_id
               WHERE sgh.class_id = $1 AND (sgh.promotion_status = 'active' OR sgh.promotion_status IS NULL)
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
              `SELECT COUNT(*) FROM assessments WHERE assigned_by_teacher_id = $1`,
              [teacherObj.id]
            );
            teacherObj.submissionsCount = parseInt(subRes[0]?.count || 0, 10);

            const { rows: logRows } = await db.query(
              `SELECT 
                 a.assessment_id AS id,
                 CONCAT('Assigned ', UPPER(a.assessment_type), ' Assessment (', REPLACE(a.assessment_period, '_', ' '), ')') AS title,
                 CONCAT('Material ID: ', COALESCE(rm.title, 'Phil-IRI Passage')) AS detail,
                 TO_CHAR(a.date_assigned, 'Mon DD, YYYY "at" HH12:MI AM') AS time
               FROM assessments a
               LEFT JOIN reading_materials rm ON a.material_id = rm.material_id
               WHERE a.assigned_by_teacher_id = $1
               ORDER BY a.date_assigned DESC
               LIMIT 10`,
              [teacherObj.id]
            );
            teacherObj.activityLogs = logRows || [];
          } catch (e) {
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
                await db.query(
                  `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
                  [teacherId, gradeAssigned, sectionAssigned]
                );
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
    const { assignments, assessmentType, assessmentPeriod, dueDate, isEdit } = req.body;
    if (!Array.isArray(assignments) || !assessmentType || !assessmentPeriod) {
      return res.status(400).json({ success: false, error: 'Assignments array, assessmentType, and assessmentPeriod are required.' });
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
          if (isEdit) {
            await db.query(
              `UPDATE assessments 
               SET passage_id = $1, 
                   assigned_by_teacher_id = COALESCE($2, assigned_by_teacher_id),
                   due_date = $3,
                   updated_at = CURRENT_TIMESTAMP
               WHERE assessment_id = $4`,
              [item.passageId, teacherId, cleanDueDate, existingId]
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
          `INSERT INTO assessments (student_id, passage_id, assigned_by_teacher_id, assessment_type, assessment_period, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'open')`,
          [item.studentId, item.passageId, teacherId, assessmentType, assessmentPeriod, cleanDueDate]
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
          CONCAT(s.first_name, ' ', s.last_name) AS "studentName",
          s.lrn,
          p.passage_id AS "passageId",
          p.title AS "passageTitle",
          p.grade_level AS "gradeLevel",
          p.passage_set AS "passageSet",
          p.language,
          orr.oral_result_id AS "oralResultId",
          orr.audio_recording_url AS "audioUrl",
          orr.reading_rate_wpm AS "wpm",
          orr.accuracy_percentage AS "accuracyPct",
          orr.verification_status AS "verificationStatus",
          aa.completed_at AS "submittedAt"
        FROM assessments a
        JOIN students s ON a.student_id = s.student_id
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
        JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
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
// PUT /api/teacher/assessments/:attemptId/verify-oral — Save Verified Miscues
// ---------------------------------------------------------------------------
async function verifyOralReadingResult(req, res) {
  try {
    const { attemptId } = req.params;
    const { verifiedMiscues, verifiedWpm, verifiedAccuracyPct, comprehensionScore } = req.body;

    const { getPhilIriProfile } = require('../services/miscueEngine.js');
    const profileLabel = getPhilIriProfile(verifiedAccuracyPct || 0, comprehensionScore || 0);

    if (process.env.DATABASE_URL) {
      await db.query(
        `UPDATE oral_reading_results
         SET verified_miscues_json = $1,
             reading_rate_wpm = $2,
             accuracy_percentage = $3,
             comprehension_score = $4,
             verification_status = 'verified',
             updated_at = CURRENT_TIMESTAMP
         WHERE assessment_attempt_id = $5`,
        [JSON.stringify(verifiedMiscues), verifiedWpm, verifiedAccuracyPct, comprehensionScore, attemptId]
      );

      // Update main assessment record status, reading profile, and remarks
      const remarksText = `Verified Oral Reading Assessment Result - ${profileLabel} (${verifiedAccuracyPct || 0}% Accuracy, ${verifiedWpm || 0} WPM)`;
      await db.query(
        `UPDATE assessments
         SET status = 'completed',
             reading_level_result = $1,
             remarks = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE assessment_id = (SELECT assessment_id FROM assessment_attempts WHERE attempt_id = $3)`,
        [profileLabel, remarksText, attemptId]
      );
    }

    return res.json({
      success: true,
      message: 'Phil-IRI oral reading result verified successfully!',
      profileLabel
    });
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
      const activeSyRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
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
          BOOL_OR(LOWER(a.status) = 'closed') AS "isClosed"
        FROM assessments a
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        LEFT JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
        JOIN student_grade_history sgh ON sgh.student_id = a.student_id
        JOIN classes c ON sgh.class_id = c.class_id
        JOIN teachers t ON (c.advisor_teacher_id = t.teacher_id OR t.teacher_id IN (
          SELECT fic.teacher_id FROM faculty_in_charge fic 
          WHERE fic.grade_level = c.grade_level AND fic.status = 'active'
        ))
        WHERE t.user_id = $1
          AND ($2::uuid IS NULL OR c.school_year_id = $2 OR sgh.school_year_id = $2)
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
          instructions: [
            `Complete the ${typeLabel} (${periodLabel}) assessment for ${langLabel}.`,
            'Includes assigned passage sets for your section students.',
          ],
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
    const { rows } = await db.query(
      `SELECT passage_id, title, grade_level, passage_set, language, status, content_text, word_count 
       FROM phil_iri_passages 
       ORDER BY passage_set ASC, title ASC`
    );
    return res.json({ success: true, count: rows.length, passages: rows });
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

      // 1. Delete child records in oral_reading_results
      await db.query(
        `DELETE FROM oral_reading_results 
         WHERE assessment_attempt_id IN (
           SELECT aa.attempt_id FROM assessment_attempts aa
           JOIN assessments a ON aa.assessment_id = a.assessment_id
           WHERE ${whereClause}
         )`,
        params
      );

      // 2. Delete child records in assessment_attempts
      await db.query(
        `DELETE FROM assessment_attempts 
         WHERE assessment_id IN (SELECT a.assessment_id FROM assessments a WHERE ${whereClause})`,
        params
      );

      // 3. Delete target records from assessments
      const result = await db.query(
        `DELETE FROM assessments a WHERE ${whereClause}`,
        params
      );

      console.log(`Successfully deleted ${result.rowCount} assessment record(s) for query: ${cleanId}`);
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
          c.section_name AS "sectionName",
          c.grade_level AS "gradeLevel",
          c.class_id AS "classId",
          COALESCE(sgh.promotion_status, 'pending') AS "promotionStatus",
          COALESCE(rp.current_profile_label, a.reading_level_result, 'Pending Evaluation') AS "readingLevel"
        FROM students s
        JOIN student_grade_history sgh ON sgh.student_id = s.student_id
        JOIN classes c ON sgh.class_id = c.class_id
        JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
        JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
        LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
        LEFT JOIN (
          SELECT DISTINCT ON (student_id) student_id, reading_level_result
          FROM assessments
          WHERE reading_level_result IS NOT NULL
          ORDER BY student_id, created_at DESC
        ) a ON a.student_id = s.student_id
        WHERE t.user_id = $1
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
            c.section_name AS "sectionName",
            c.grade_level AS "gradeLevel",
            c.class_id AS "classId",
            COALESCE(sgh.promotion_status, 'pending') AS "promotionStatus",
            COALESCE(rp.current_profile_label, a.reading_level_result, 'Pending Evaluation') AS "readingLevel"
          FROM students s
          JOIN student_grade_history sgh ON sgh.student_id = s.student_id
          JOIN classes c ON sgh.class_id = c.class_id
          JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
          JOIN faculty_in_charge fic ON fic.grade_level = c.grade_level AND fic.school_year_id = sy.school_year_id AND fic.status = 'active'
          JOIN teachers t ON fic.teacher_id = t.teacher_id
          LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
          LEFT JOIN (
            SELECT DISTINCT ON (student_id) student_id, reading_level_result
            FROM assessments
            WHERE reading_level_result IS NOT NULL
            ORDER BY student_id, created_at DESC
          ) a ON a.student_id = s.student_id
          WHERE t.user_id = $1
          ORDER BY c.section_name ASC, s.last_name ASC
        `;
        const ficRes = await db.query(ficQuery, [userId]);
        students = ficRes.rows || [];
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

      return res.json({ success: true, students });
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
      const activeSyRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
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
        JOIN teachers t ON (c.advisor_teacher_id = t.teacher_id OR t.teacher_id IN (
          SELECT fic.teacher_id FROM faculty_in_charge fic 
          WHERE fic.grade_level = c.grade_level AND fic.status = 'active'
        ))
        WHERE sgh.student_id = a.student_id
          AND t.user_id = $${params.length}
          AND ($${params.length + 1}::uuid IS NULL OR c.school_year_id = $${params.length + 1} OR sgh.school_year_id = $${params.length + 1})
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
          LOWER(COALESCE(a.assessment_type, 'oral')) AS "assessmentType",
          LOWER(COALESCE(a.assessment_period, 'pre_test')) AS "period",
          a.status,
          a.due_date AS "dueDate",
          COALESCE(a.reading_level_result, 'Pending Evaluation') AS "readingLevelResult",
          a.remarks,
          aa.attempt_id AS "attemptId",
          aa.completed_at AS "completedAt",
          orr.oral_result_id AS "oralResultId",
          orr.audio_recording_url AS "audioUrl",
          orr.reading_rate_wpm AS "wpm",
          orr.accuracy_percentage AS "accuracyPct",
          orr.comprehension_score AS "comprehensionScore",
          orr.verification_status AS "verificationStatus"
        FROM assessments a
        JOIN students s ON a.student_id = s.student_id
        LEFT JOIN student_grade_history sgh ON sgh.student_id = s.student_id
        LEFT JOIN classes c ON sgh.class_id = c.class_id
        JOIN phil_iri_passages p ON a.passage_id = p.passage_id
        LEFT JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
        LEFT JOIN oral_reading_results orr ON orr.assessment_attempt_id = aa.attempt_id
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

      return res.json({
        success: true,
        activity: {
          id: cleanId,
          title: `${typeLabel} Assessment (${periodLabel} - ${langLabel})`,
          assessmentType: assessmentType || 'oral',
          period: period || 'pre_test',
          language: language || 'fil',
          dueDate: firstDueDate,
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
  verifyOralReadingResult,
  getPhilIriActivities,
  getPhilIriPassages,
  deleteAssessment,
  getTeacherClassStudents,
  getActivityDetail,
  updateStudentPromotionByTeacher,
};
