const db = require('../config/db.js');
const { supabase, uploadImageToSupabase } = require('../config/supabase.js');

/**
 * Helper to generate a unique Parent Access Code (e.g. PAC-48219)
 */
function generateParentAccessCode() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PAC-${randomNum}`;
}

/**
 * Helper to generate a random 8-character temporary password
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let tempPass = 'St-';
  for (let i = 0; i < 6; i++) {
    tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return tempPass;
}

/**
 * Helper to hash password using bcrypt
 */
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

const { sendWelcomeEmailWithTempPassword } = require('../services/emailService.js');

// In-Memory Database Store for backend REST endpoints
let teachersStore = [];
let studentsStore = [];

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
 * GET /api/admin/teachers — List all teachers
 */
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

    return res.json({ success: true, teachers: teachersStore });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch teachers.' });
  }
}

/**
 * POST /api/admin/teachers — Create single teacher
 */
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
    const dateAdded = new Date().toISOString().split('T')[0];

    const tempPassword = generateTempPassword();

    const newTeacherObj = {
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
      dateAdded,
    };

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

        if (userRows && userRows[0]) {
          const userId = userRows[0].user_id;

          const { rows: tchRows } = await db.query(
            `INSERT INTO teachers (user_id, teacher_no, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (teacher_no) DO UPDATE SET first_name = $3, middle_name = $4, last_name = $5, sex = $6
             RETURNING teacher_id`,
            [userId, cleanEmpId, firstName, middleName || null, lastName, cleanGender]
          );

          if (tchRows && tchRows[0]) {
            const teacherId = tchRows[0].teacher_id;

            // Ensure 1 section per teacher max: unassign teacher from any existing sections first
            await db.query(
              `UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id = $1`,
              [teacherId]
            );

            // Assign as class adviser if section specified
            if (hasSectionAssignment) {
              await db.query(
                `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
                [teacherId, cleanGradeAssigned, cleanSectionAssigned]
              );
            }

            // Assign as Lead Faculty-in-Charge if checked
            if (hasFacultyAssignment) {
              await db.query(
                `INSERT INTO faculty_in_charge (school_id, teacher_id, grade_level)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING`,
                [schoolId, teacherId, cleanGradeAssigned]
              );
            }

            // Audit Log & Notification for Teacher Creation
            try {
              const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;
              await db.query(
                `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
                 VALUES ($1, $2, 'CREATE_TEACHER', $3, $4)`,
                [
                  schoolId || '109283',
                  adminUserId || null,
                  `Created teacher account for ${fullName} (${cleanEmail}, Employee ID: ${cleanEmpId})`,
                  req.ip || req.headers['x-forwarded-for'] || null,
                ]
              );

              await db.query(
                `INSERT INTO notifications (school_id, title, message, notification_type)
                 VALUES ($1, $2, $3, 'system')`,
                [
                  schoolId || '109283',
                  `New Teacher Profile Added: ${fullName}`,
                  `Teacher account for ${fullName} (${cleanEmpId}) was created and assigned to ${cleanGradeAssigned} - ${cleanSectionAssigned}.`,
                ]
              );
            } catch (nErr) {
              console.warn('Create teacher audit notice:', nErr.message);
            }
          }

          // Send welcome email with temporary credentials asynchronously
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

    teachersStore.unshift(newTeacherObj);

    return res.status(201).json({
      success: true,
      message: `Teacher account for ${fullName} created. Temporary password sent to ${cleanEmail}.`,
      tempPassword,
      teacher: newTeacherObj,
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return res.status(500).json({ success: false, error: 'Failed to create teacher account.' });
  }
}

/**
 * GET /api/admin/students — List all students with parentAccessCode
 */
async function getStudents(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const { rows } = await db.query(`
          SELECT DISTINCT ON (s.student_id)
            s.student_id AS id,
            s.lrn,
            s.first_name AS "firstName",
            s.middle_name AS "middleName",
            s.last_name AS "lastName",
            CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
            COALESCE(s.sex, 'Male') AS gender,
            COALESCE(c.grade_level, 'Grade 4') AS grade,
            COALESCE(c.section_name, 'Unassigned') AS section,
            COALESCE(rp.current_profile_label, 'Pending Evaluation') AS level,
            COALESCE(u.email, '') AS "personalEmail",
            CASE WHEN u.status = 'disabled' THEN 'Disabled' ELSE 'Account Created' END AS status,
            COALESCE(sp.access_code, CONCAT('PAC-', RIGHT(s.lrn, 5))) AS "parentAccessCode"
          FROM students s
          LEFT JOIN users u ON s.user_id = u.user_id
          LEFT JOIN student_grade_history sgh ON sgh.student_id = s.student_id
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
          LEFT JOIN student_parents sp ON sp.student_id = s.student_id
          WHERE u.school_id = $1
          ORDER BY s.student_id, s.created_at DESC
        `, [schoolId]);

        return res.json({ success: true, students: rows || [] });
      } catch (dbErr) {
        console.warn('DB fetch students notice:', dbErr.message);
      }
    }

    return res.json({ success: true, students: studentsStore });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch students.' });
  }
}

/**
 * POST /api/admin/students — Create single student (Requires LRN & Auto-generates Parent Access Code)
 */
async function createStudent(req, res) {
  try {
    let { lrn, firstName, middleName, lastName, name, gender, grade, section, personalEmail } = req.body;

    if (!lrn || !lrn.trim()) {
      return res.status(400).json({
        success: false,
        error: 'LRN (Learner Reference Number) is required and must be provided by Admin.',
      });
    }

    const cleanLrn = lrn.trim();

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
    lastName = (lastName || 'Learner').trim();
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
    const cleanEmail = personalEmail?.trim() || `${cleanLrn}@student.salintinig.edu.ph`;
    const tempPassword = generateTempPassword();
    const parentAccessCode = generateParentAccessCode();

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const hashedPassword = hashPassword(tempPassword);

        const { rows: uRows } = await db.query(
          `INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
           VALUES ($1, $2, $3, 'student', 'active', true)
           ON CONFLICT (email) DO UPDATE SET school_id = $1, password_hash = $3, must_change_password = true, status = 'active'
           RETURNING user_id`,
          [schoolId, cleanEmail, hashedPassword]
        );

        if (uRows && uRows[0]) {
          const userId = uRows[0].user_id;

          const { rows: sRows } = await db.query(
            `INSERT INTO students (user_id, lrn, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (lrn) DO UPDATE SET first_name = $3, middle_name = $4, last_name = $5, sex = $6
             RETURNING student_id`,
            [userId, cleanLrn, firstName, middleName || null, lastName, gender || 'Male']
          );

          if (sRows && sRows[0]) {
            const studentId = sRows[0].student_id;

            // Link to class section
            if (section && section !== 'Unassigned') {
              const { rows: cRows } = await db.query(
                `SELECT class_id FROM classes WHERE grade_level = $1 AND section_name = $2 LIMIT 1`,
                [grade || 'Grade 4', section]
              );
              if (cRows && cRows[0]) {
                await db.query(
                  `INSERT INTO student_grade_history (student_id, class_id, promotion_status)
                   VALUES ($1, $2, 'enrolled')
                   ON CONFLICT DO NOTHING`,
                  [studentId, cRows[0].class_id]
                );
              }
            }

            // Create Parent Access Code link
            await db.query(
              `INSERT INTO student_parents (student_id, access_code)
               VALUES ($1, $2)
               ON CONFLICT (student_id) DO UPDATE SET access_code = EXCLUDED.access_code`,
              [studentId, parentAccessCode]
            );

            // Send welcome email with temporary credentials asynchronously
            sendWelcomeEmailWithTempPassword({
              toEmail: cleanEmail,
              fullName,
              role: 'Student',
              tempPassword,
              identifier: cleanLrn,
            });
          }
        }
      } catch (dbErr) {
        console.warn('DB create student notice:', dbErr.message);
      }
    }

    const newStudent = {
      id: `STD-${Date.now().toString().slice(-4)}`,
      lrn: cleanLrn,
      firstName,
      middleName,
      lastName,
      name: fullName,
      gender: gender || 'Male',
      grade: grade || 'Grade 4',
      section: section || 'Fyang',
      level: 'Pending Evaluation',
      personalEmail: cleanEmail,
      status: 'Account Created',
      parentAccessCode,
    };

    return res.status(201).json({
      success: true,
      message: `Student record created. Temporary password sent to ${cleanEmail}.`,
      tempPassword,
      parentAccessCode,
      student: newStudent,
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return res.status(500).json({ success: false, error: 'Failed to create student record.' });
  }
}

/**
 * POST /api/admin/import-csv — CSV Batch Import for Teachers or Students
 */
async function batchImportCSV(req, res) {
  try {
    const { type, records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'No records provided in CSV payload.' });
    }

    const imported = [];
    const errors = [];

    if (type === 'teacher') {
      records.forEach((row, i) => {
        const empId = String(row.employeeId || row.employee_id || row['Employee ID'] || '').trim().toUpperCase();
        if (!empId) {
          errors.push(`Row ${i + 1}: Missing Employee ID`);
          return;
        }

        const name = String(row.name || row.Name || row['Full Name'] || 'Teacher').trim();
        const email = String(row.email || row.Email || row['DepEd Email'] || `${empId.toLowerCase()}@deped.gov.ph`).trim();
        const cleanGender = String(row.gender || row.Gender || row.Sex || 'Male').trim();
        const cleanGradeAssigned = String(row.gradeAssigned || row.grade || row['Assigned Grade'] || 'Unassigned').trim();
        const cleanSectionAssigned = String(row.sectionAssigned || row.section || row['Assigned Section'] || 'Unassigned').trim();
        const isFacultyInCharge = ['true', 'yes', '1'].includes(
          String(row.isFacultyInCharge || row.facultyInCharge || row['Faculty In Charge'] || '').trim().toLowerCase()
        );

        const exists = teachersStore.some((t) => t.employeeId.toUpperCase() === empId);
        if (exists) {
          errors.push(`Row ${i + 1}: Employee ID "${empId}" already exists`);
          return;
        }

        const newTeacher = {
          id: empId,
          employeeId: empId,
          name,
          gender: cleanGender,
          email,
          gradeAssigned: cleanGradeAssigned,
          sectionAssigned: cleanSectionAssigned,
          isFacultyInCharge,
          status: 'Active',
          dateAdded: new Date().toISOString().split('T')[0],
        };

        teachersStore.unshift(newTeacher);
        imported.push(newTeacher);
      });
    } else {
      // Default: student batch import
      records.forEach((row, i) => {
        const lrn = String(row.lrn || row.LRN || row['Student LRN'] || '').trim();
        if (!lrn) {
          errors.push(`Row ${i + 1}: Missing LRN`);
          return;
        }

        const name = (row.name || row.Name || row['Student Name'] || 'Student').trim();
        const exists = studentsStore.some((s) => s.lrn === lrn);
        if (exists) {
          errors.push(`Row ${i + 1}: LRN "${lrn}" already exists`);
          return;
        }

        const parentAccessCode = generateParentAccessCode();
        const newStudent = {
          id: `STD-${Date.now().toString().slice(-4)}-${i}`,
          lrn,
          name,
          gender: row.gender || 'Male',
          grade: row.grade || 'Grade 4',
          section: row.section || 'Fyang',
          level: row.level || 'Pending Evaluation',
          personalEmail: (row.personalEmail || row.email || `${lrn}@student.deped.gov.ph`).trim(),
          status: 'Account Created',
          parentAccessCode,
        };

        studentsStore.unshift(newStudent);
        imported.push(newStudent);
      });
    }

    return res.json({
      success: true,
      count: imported.length,
      importedRecords: imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Batch import completed. Successfully processed ${imported.length} accounts.`,
    });
  } catch (error) {
    console.error('CSV Import Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to process CSV batch upload.' });
  }
}

/**
 * POST /api/admin/verify-parent-code — Validate student LRN + Parent Access Code for Parent signup
 */
async function verifyParentAccessCode(req, res) {
  try {
    const { lrn, parentAccessCode } = req.body;

    if (!lrn || !parentAccessCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both Student LRN and Parent Access Code.',
      });
    }

    const cleanLrn = lrn.trim();
    const cleanCode = parentAccessCode.trim().toUpperCase();

    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await db.query(
          `SELECT 
             s.student_id,
             s.lrn,
             s.first_name AS student_first_name,
             CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
             COALESCE(c.grade_level, 'Grade 4') AS grade,
             COALESCE(c.section_name, 'Unassigned') AS section,
             sp.access_code,
             COALESCE(NULLIF(p.parent_name, ''), 'Parent') AS parent_name
           FROM students s
           JOIN student_parents sp ON s.student_id = sp.student_id
           LEFT JOIN parents p ON sp.parent_id = p.parent_id
           LEFT JOIN student_grade_history sgh ON s.student_id = sgh.student_id AND (sgh.promotion_status = 'active' OR sgh.promotion_status IS NULL)
           LEFT JOIN classes c ON sgh.class_id = c.class_id
           WHERE TRIM(s.lrn) = $1 AND UPPER(TRIM(sp.access_code)) = $2
           LIMIT 1`,
          [cleanLrn, cleanCode]
        );

        if (rows && rows.length > 0) {
          const std = rows[0];
          return res.json({
            success: true,
            message: 'Parent Access Code verified successfully!',
            student: {
              studentId: std.student_id,
              lrn: std.lrn,
              name: std.name,
              studentFirstName: std.student_first_name,
              grade: std.grade,
              section: std.section,
              parentName: std.parent_name,
            },
          });
        }
      } catch (dbErr) {
        console.warn('DB verify parent access code notice:', dbErr.message);
      }
    }

    // Fallback store check
    const student = studentsStore.find(
      (s) => s.lrn === cleanLrn && s.parentAccessCode.toUpperCase() === cleanCode
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Invalid Student LRN or Parent Access Code. Please double-check with the school administrator.',
      });
    }

    return res.json({
      success: true,
      message: 'Parent Access Code verified successfully!',
      student: {
        lrn: student.lrn,
        name: student.name,
        grade: student.grade,
        section: student.section,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to verify Parent Access Code.' });
  }
}

/**
 * POST /api/admin/faculty-assignments — Update faculty assignment
 */
async function assignFaculty(req, res) {
  try {
    const { teacherId, gradeAssigned, sectionAssigned, isFacultyInCharge, gradeLevel, teacherName } = req.body;
    const targetGrade = gradeLevel || gradeAssigned;

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        let teacherIdToUse = teacherId;
        let foundTeacherName = teacherName || '';

        // Search for teacher by ID, teacher_no, or full name in database
        if (teacherIdToUse || teacherName) {
          const { rows: tRows } = await db.query(
            `SELECT teacher_id, CONCAT(first_name, ' ', COALESCE(middle_name || ' ', ''), last_name) AS name
             FROM teachers
             WHERE teacher_id::text = $1 OR teacher_no = $1 OR CONCAT(first_name, ' ', COALESCE(middle_name || ' ', ''), last_name) = $2 OR CONCAT(first_name, ' ', last_name) = $2
             LIMIT 1`,
            [teacherIdToUse || '', teacherName || '']
          );
          if (tRows && tRows.length > 0) {
            teacherIdToUse = tRows[0].teacher_id;
            foundTeacherName = tRows[0].name;
          }
        }

        if (targetGrade) {
          const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
          const syId = syRes.rows[0]?.school_year_id || null;

          // Always delete existing Faculty-in-Charge for this grade level
          await db.query(
            `DELETE FROM faculty_in_charge WHERE grade_level = $1 AND (school_id = $2 OR school_id IS NULL) AND (school_year_id = $3 OR school_year_id IS NULL)`,
            [targetGrade, schoolId, syId]
          );

          // If a teacher was selected, insert new Faculty-in-Charge assignment
          if (teacherIdToUse) {
            await db.query(
              `INSERT INTO faculty_in_charge (school_id, school_year_id, teacher_id, grade_level, status)
               VALUES ($1, $2, $3, $4, 'active')`,
              [schoolId, syId, teacherIdToUse, targetGrade]
            );
          }

          // Assign class adviser if sectionAssigned is provided
          if (teacherIdToUse && sectionAssigned && sectionAssigned !== 'Unassigned') {
            await db.query(
              `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
              [teacherIdToUse, targetGrade, sectionAssigned]
            );
          }

          return res.json({
            success: true,
            message: teacherIdToUse
              ? `Faculty assignment updated for ${foundTeacherName || 'teacher'}.`
              : `Faculty-in-Charge for ${targetGrade} set to Unassigned.`,
          });
        }
      } catch (dbErr) {
        console.warn('DB assign faculty notice:', dbErr.message);
      }
    }

    // Fallback to in-memory store if DB not available or teacher not found in DB
    const teacher = teachersStore.find((t) => t.id === teacherId || t.employeeId === teacherId || t.name === teacherName);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher record not found.' });
    }

    if (targetGrade) teacher.gradeAssigned = targetGrade;
    if (sectionAssigned) teacher.sectionAssigned = sectionAssigned;
    if (typeof isFacultyInCharge === 'boolean') teacher.isFacultyInCharge = isFacultyInCharge;

    return res.json({
      success: true,
      message: `Faculty assignment updated for ${teacher.name}.`,
      teacher,
    });
  } catch (error) {
    console.error('Error updating faculty assignment:', error);
    return res.status(500).json({ success: false, error: 'Failed to update faculty assignment.' });
  }
}

/**
 * GET /api/admin/account-requests — Fetch all account activation requests
 */
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

/**
 * POST /api/admin/account-requests/:id/approve — Approve request, generate credentials, send email via Resend
 */
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
        if (rows && rows.length > 0) targetRequest = rows[0];
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

        if (userRows && userRows.length > 0) {
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

          await db.query(
            `INSERT INTO notifications (school_id, title, message, notification_type)
             VALUES ($1, $2, $3, 'account_approval')`,
            [
              targetRequest.school_id || '109283',
              `Account Approved: ${targetRequest.first_name} ${targetRequest.last_name}`,
              `Teacher account for ${targetRequest.first_name} ${targetRequest.last_name} (${targetRequest.email}) was approved.`,
            ]
          );

          // Audit Log
          const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;
          await db.query(
            `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
             VALUES ($1, $2, 'APPROVE_ACCOUNT', $3, $4)`,
            [
              targetRequest.school_id || '109283',
              adminUserId || null,
              `Approved teacher account request for ${targetRequest.first_name} ${targetRequest.last_name} (${targetRequest.email})`,
              req.ip || req.headers['x-forwarded-for'] || null,
            ]
          );

          sendWelcomeEmailWithTempPassword({
            toEmail: targetRequest.email,
            fullName: targetRequest.full_name,
            role: 'Teacher',
            tempPassword,
            identifier: generatedTeacherNo,
          });
        }
      } catch (dbErr) {
        console.warn('Approve account request DB notice:', dbErr.message);
      }
    }

    // Dispatch welcome email with credentials via Resend
    if (
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.startsWith('re_') &&
      process.env.RESEND_API_KEY !== 're_your_resend_api_key_here'
    ) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'SalinTinig <onboarding@resend.dev>',
          to: targetRequest.email,
          subject: 'Account Approved — Welcome to SalinTinig',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: 'Inter', sans-serif;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f5f0; padding: 48px 16px;">
                <tr>
                  <td align="center">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 18px; border: 1px solid #e5e0d8; box-shadow: 0 4px 14px rgba(26, 24, 22, 0.04); overflow: hidden;">
                      <tr><td style="background-color: #165fd5; height: 5px;"></td></tr>
                      <tr>
                        <td align="center" style="padding: 32px 36px 20px 36px;">
                          <span style="font-size: 30px; font-weight: 800; color: #1a1816; letter-spacing: -0.6px;">SalinTinig</span>
                        </td>
                      </tr>
                      <tr><td style="padding: 0 36px;"><div style="border-bottom: 1px solid #f0ece1; width: 100%;"></div></td></tr>
                      <tr>
                        <td style="padding: 28px 36px 20px 36px;">
                          <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #1a1816;">Account Request Approved!</h1>
                          <p style="margin: 0 0 20px 0; font-size: 15px; color: #6e6a63; line-height: 1.6;">Hello <strong>${targetRequest.full_name}</strong>, your SalinTinig teacher account has been activated. Here are your login credentials:</p>
                          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f2ee; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;">
                            <tr><td style="padding: 6px 0; font-size: 14px; color: #1a1816;"><strong>Login Identifier:</strong> ${targetRequest.email} or ${generatedTeacherNo}</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 14px; color: #1a1816;"><strong>Temporary Password:</strong> ${defaultPassword}</td></tr>
                          </table>
                          <p style="margin: 0 0 18px 0; font-size: 13px; color: #88837a;">Please change your password after logging in for security.</p>
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
        console.warn('Approve account email notice:', resendErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Account approved for ${targetRequest.full_name}. Credentials have been sent to ${targetRequest.email}.`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to approve account request.' });
  }
}

/**
 * POST /api/admin/account-requests/:id/reject — Reject account activation request
 */
async function rejectAccountRequest(req, res) {
  try {
    const requestId = req.params.id;

    if (process.env.DATABASE_URL) {
      try {
        const reqRes = await db.query('SELECT * FROM account_requests WHERE request_id = $1 LIMIT 1', [requestId]);
        const targetReq = reqRes.rows?.[0];

        await db.query(
          "UPDATE account_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
          [requestId]
        );

        if (targetReq) {
          await db.query(
            `INSERT INTO notifications (school_id, title, message, notification_type)
             VALUES ($1, $2, $3, 'account_rejection')`,
            [
              targetReq.school_id || '109283',
              `Account Request Rejected`,
              `Account activation request for ${targetReq.first_name} ${targetReq.last_name} (${targetReq.email}) was rejected.`,
            ]
          );

          // Audit Log
          const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;
          await db.query(
            `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
             VALUES ($1, $2, 'REJECT_ACCOUNT', $3, $4)`,
            [
              targetReq.school_id || '109283',
              adminUserId || null,
              `Rejected teacher account request for ${targetReq.first_name} ${targetReq.last_name} (${targetReq.email})`,
              req.ip || req.headers['x-forwarded-for'] || null,
            ]
          );
        }
      } catch (e) {
        console.warn('Reject account request DB notice:', e.message);
      }
    }

    return res.json({ success: true, message: 'Account request rejected.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reject account request.' });
  }
}

/**
 * GET /api/admin/stats — Get live system counts from DB
 */
async function getSystemStats(req, res) {
  try {
    let totalStudents = 0;
    let totalTeachers = 0;
    let totalParentAccounts = 0;
    let totalSections = 0;
    let totalGradeLevels = 3;
    let activeSchoolYear = null;

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const syRes = await db.query('SELECT school_year_id, school_year FROM school_years WHERE is_active = true LIMIT 1');
        const activeSyId = syRes.rows[0]?.school_year_id || null;
        if (syRes.rows[0]?.school_year) {
          activeSchoolYear = syRes.rows[0].school_year;
        }

        // Count students enrolled in active school year (or total from students table)
        let studentRes = await db.query(
          `SELECT COUNT(DISTINCT s.student_id) 
           FROM students s
           JOIN users u ON s.user_id = u.user_id
           WHERE u.school_id = $1`,
          [schoolId]
        );
        totalStudents = parseInt(studentRes.rows[0]?.count || 0, 10);

        const teacherRes = await db.query(
          `SELECT COUNT(DISTINCT t.teacher_id) FROM teachers t
           JOIN users u ON t.user_id = u.user_id
           WHERE u.school_id = $1`,
          [schoolId]
        );
        totalTeachers = parseInt(teacherRes.rows[0].count, 10) || 0;

        const parentRes = await db.query(
          `SELECT COUNT(DISTINCT sp.parent_id) FROM student_parents sp
           JOIN students s ON sp.student_id = s.student_id
           JOIN users u ON s.user_id = u.user_id
           WHERE u.school_id = $1`,
          [schoolId]
        );
        totalParentAccounts = parseInt(parentRes.rows[0].count, 10) || 0;

        // Count sections created under active school year
        let sectionRes;
        if (activeSyId) {
          sectionRes = await db.query('SELECT COUNT(*) FROM classes WHERE school_year_id = $1 AND (school_id = $2 OR school_id IS NULL)', [activeSyId, schoolId]);
        } else {
          sectionRes = await db.query('SELECT COUNT(*) FROM classes WHERE school_id = $1 OR school_id IS NULL', [schoolId]);
        }
        totalSections = parseInt(sectionRes.rows[0].count, 10) || 0;

        const gradeRes = await db.query('SELECT COUNT(DISTINCT grade_level) FROM classes WHERE school_id = $1 OR school_id IS NULL', [schoolId]);
        totalGradeLevels = parseInt(gradeRes.rows[0].count, 10) || 3;
      } catch (dbErr) {
        console.warn('Stats DB query notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      stats: {
        totalStudents,
        totalTeachers,
        totalParentAccounts,
        totalSections,
        totalGradeLevels: totalGradeLevels || 3,
        activeSchoolYear,
      },
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch system stats.' });
  }
}

/**
 * PUT /api/admin/teachers/:id — Update teacher
 */
async function updateTeacher(req, res) {
  try {
    const { id } = req.params;
    let { employeeId, firstName, middleName, lastName, name, gender, email, gradeAssigned, sectionAssigned, isFacultyInCharge } = req.body;

    if (!firstName || !lastName) {
      if (name) {
        const parsed = parseNameString(name);
        firstName = firstName || parsed.firstName;
        middleName = middleName || parsed.middleName;
        lastName = lastName || parsed.lastName;
      }
    }

    if (process.env.DATABASE_URL) {
      try {
        const tchRes = await db.query(
          `SELECT teacher_id, user_id FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1 LIMIT 1`,
          [id]
        );

        if (tchRes.rows && tchRes.rows.length > 0) {
          const teacherId = tchRes.rows[0].teacher_id;
          const userId = tchRes.rows[0].user_id;

          if (email && userId) {
            const cleanEmail = email.toLowerCase().trim();
            const conflict = await db.query(
              `SELECT user_id FROM users WHERE LOWER(email) = $1 AND user_id != $2 LIMIT 1`,
              [cleanEmail, userId]
            );
            if (conflict.rows && conflict.rows.length > 0) {
              return res.status(400).json({ success: false, error: 'Email is already in use by another user.' });
            }
            await db.query(
              `UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
              [cleanEmail, userId]
            );
          }

          await db.query(
            `UPDATE teachers
             SET first_name = COALESCE($1, first_name),
                 middle_name = COALESCE($2, middle_name),
                 last_name = COALESCE($3, last_name),
                 sex = COALESCE($4, sex),
                 updated_at = CURRENT_TIMESTAMP
             WHERE teacher_id = $5`,
            [firstName || null, middleName || null, lastName || null, gender || null, teacherId]
          );

          if (sectionAssigned === 'Unassigned' || gradeAssigned === 'Unassigned') {
            await db.query(
              `UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id = $1`,
              [teacherId]
            );
          } else if (gradeAssigned && sectionAssigned) {
            await db.query(
              `UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id = $1`,
              [teacherId]
            );
            await db.query(
              `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
              [teacherId, gradeAssigned, sectionAssigned]
            );
          }
        }
      } catch (dbErr) {
        console.warn('DB update teacher notice:', dbErr.message);
      }
    }

    const storeIdx = teachersStore.findIndex((t) => t.id === id || t.employeeId === id);
    if (storeIdx !== -1) {
      const prev = teachersStore[storeIdx];
      teachersStore[storeIdx] = {
        ...prev,
        firstName: firstName || prev.firstName,
        middleName: middleName !== undefined ? middleName : prev.middleName,
        lastName: lastName || prev.lastName,
        name: `${firstName || prev.firstName} ${middleName ? middleName + ' ' : ''}${lastName || prev.lastName}`.trim(),
        gender: gender || prev.gender,
        email: email || prev.email,
        gradeAssigned: gradeAssigned || prev.gradeAssigned,
        sectionAssigned: sectionAssigned || prev.sectionAssigned,
        isFacultyInCharge: isFacultyInCharge !== undefined ? isFacultyInCharge : prev.isFacultyInCharge,
      };
    }

    return res.json({ success: true, message: 'Teacher record updated successfully.' });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return res.status(500).json({ success: false, error: 'Failed to update teacher record.' });
  }
}

/**
 * DELETE /api/admin/teachers/:id — Delete teacher
 */
async function deleteTeacher(req, res) {
  try {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        const { rows } = await db.query(
          `SELECT teacher_id, user_id, first_name, last_name, teacher_no FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1 LIMIT 1`,
          [id]
        );

        if (rows && rows[0]) {
          const teacherId = rows[0].teacher_id;
          const userId = rows[0].user_id;
          const tName = [rows[0].first_name, rows[0].last_name].filter(Boolean).join(' ') || 'Teacher';

          // 1. Unassign from class sections
          await db.query(`UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id = $1`, [teacherId]);

          // 2. Remove from faculty_in_charge
          await db.query(`DELETE FROM faculty_in_charge WHERE teacher_id = $1`, [teacherId]);

          // 3. Delete teacher profile record
          await db.query(`DELETE FROM teachers WHERE teacher_id = $1`, [teacherId]);

          // 4. Delete corresponding user account from users table
          if (userId) {
            await db.query(`DELETE FROM users WHERE user_id = $1`, [userId]);
          }

          // 5. Create System Notification & Audit Log
          try {
            const adminSchoolId = await getAdminSchoolId(req);
            const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;

            // 5a. Record in audit_logs
            await db.query(
              `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
               VALUES ($1, $2, 'DELETE_TEACHER', $3, $4)`,
              [
                adminSchoolId || '109283',
                adminUserId || null,
                `Deleted teacher record ${tName} (Teacher No: ${rows[0].teacher_no || id})`,
                req.ip || req.headers['x-forwarded-for'] || null,
              ]
            );

            // 5b. Record in notifications
            await db.query(
              `INSERT INTO notifications (school_id, title, message, notification_type)
               VALUES ($1, $2, $3, 'system')`,
              [
                adminSchoolId || '109283',
                `Teacher Record Deleted: ${tName}`,
                `Teacher record for ${tName} (${rows[0].teacher_no || id}) was permanently deleted from the system.`,
              ]
            );
          } catch (nErr) {
            console.warn('Delete teacher audit/notification notice:', nErr.message);
          }
        }
      } catch (dbErr) {
        console.warn('DB delete teacher notice:', dbErr.message);
      }
    }

    teachersStore = teachersStore.filter((t) => t.id !== id && t.employeeId !== id);

    return res.json({ success: true, message: 'Teacher record & login account removed. Historical student test scores preserved.' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete teacher record.' });
  }
}

/**
 * GET /api/admin/sections — Get all sections grouped by grade level & detailed section list
 */
async function getSections(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const { rows } = await db.query(`
          SELECT 
            c.class_id AS id,
            c.grade_level AS "gradeLevel",
            c.section_name AS "sectionName",
            c.advisor_teacher_id AS "adviserId",
            CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name) AS adviser,
            COUNT(DISTINCT sgh.student_id)::int AS "studentsCount",
            COUNT(DISTINCT CASE WHEN COALESCE(rp.current_profile_label, a.reading_level_result) = 'Independent' THEN sgh.student_id END)::int AS "independentCount",
            COUNT(DISTINCT CASE WHEN COALESCE(rp.current_profile_label, a.reading_level_result) = 'Instructional' THEN sgh.student_id END)::int AS "instructionalCount",
            COUNT(DISTINCT CASE WHEN COALESCE(rp.current_profile_label, a.reading_level_result) = 'Frustrational' THEN sgh.student_id END)::int AS "frustrationalCount"
          FROM classes c
          JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
          LEFT JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
          LEFT JOIN student_grade_history sgh ON sgh.class_id = c.class_id
          LEFT JOIN reading_profiles rp ON rp.student_id = sgh.student_id
          LEFT JOIN (
            SELECT DISTINCT ON (student_id) student_id, reading_level_result
            FROM assessments
            WHERE reading_level_result IS NOT NULL
            ORDER BY student_id, created_at DESC
          ) a ON a.student_id = sgh.student_id
          WHERE (c.school_id = $1 OR c.school_id IS NULL)
          GROUP BY c.class_id, c.grade_level, c.section_name, c.advisor_teacher_id, t.first_name, t.middle_name, t.last_name
          ORDER BY c.grade_level ASC, c.section_name ASC
        `, [schoolId]);

        const sectionsByGrade = {
          'Grade 4': [],
          'Grade 5': [],
          'Grade 6': [],
        };

        (rows || []).forEach((row) => {
          if (!sectionsByGrade[row.gradeLevel]) {
            sectionsByGrade[row.gradeLevel] = [];
          }
          if (!sectionsByGrade[row.gradeLevel].includes(row.sectionName)) {
            sectionsByGrade[row.gradeLevel].push(row.sectionName);
          }
        });

        return res.json({ success: true, sections: sectionsByGrade, allSections: rows || [] });
      } catch (dbErr) {
        console.warn('DB fetch sections notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      sections: {
        'Grade 4': [],
        'Grade 5': [],
        'Grade 6': [],
      },
      allSections: [],
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch sections.' });
  }
}

/**
 * POST /api/admin/sections — Create new class section
 */
async function createSection(req, res) {
  try {
    const { gradeLevel, sectionName, adviserId } = req.body;
    if (!gradeLevel || !sectionName || !sectionName.trim()) {
      return res.status(400).json({ success: false, error: 'Grade level and section name are required.' });
    }

    const cleanSection = sectionName.trim();

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
        const syId = syRes.rows[0]?.school_year_id || null;

        await db.query(
          `INSERT INTO classes (school_id, school_year_id, grade_level, section_name, advisor_teacher_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [schoolId, syId, gradeLevel, cleanSection, adviserId || null]
        );

        // Audit Log & Notification for Section Creation
        try {
          const adminUserId = req.user?.userId || req.user?.user_id || req.user?.id;
          await db.query(
            `INSERT INTO audit_logs (school_id, user_id, action_type, details, ip_address)
             VALUES ($1, $2, 'CREATE_SECTION', $3, $4)`,
            [
              schoolId || '109283',
              adminUserId || null,
              `Created class section "${cleanSection}" under ${gradeLevel}`,
              req.ip || req.headers['x-forwarded-for'] || null,
            ]
          );

          await db.query(
            `INSERT INTO notifications (school_id, title, message, notification_type)
             VALUES ($1, $2, $3, 'system')`,
            [
              schoolId || '109283',
              `New Section Created: ${cleanSection}`,
              `Class section "${cleanSection}" was added under ${gradeLevel}.`,
            ]
          );
        } catch (nErr) {
          console.warn('Create section audit notice:', nErr.message);
        }
      } catch (dbErr) {
        console.warn('DB create section notice:', dbErr.message);
      }
    }

    return res.status(201).json({ success: true, message: `Section "${cleanSection}" created under ${gradeLevel}.` });
  } catch (error) {
    console.error('Error creating section:', error);
    return res.status(500).json({ success: false, error: 'Failed to create section.' });
  }
}

/**
 * PUT /api/admin/sections/:id — Update/rename class section
 */
async function updateSection(req, res) {
  try {
    const { id } = req.params;
    const { gradeLevel, sectionName, adviserId } = req.body;

    if (process.env.DATABASE_URL) {
      try {
        const cleanAdviserId = adviserId && adviserId !== 'Unassigned' ? adviserId : null;

        // Strict 1-to-1 constraint: If assigning an adviser, unassign them from any existing section first
        if (cleanAdviserId) {
          await db.query(
            `UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id::text = $1 OR advisor_teacher_id IN (SELECT teacher_id FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1)`,
            [String(cleanAdviserId)]
          );
        }

        await db.query(
          `UPDATE classes 
           SET section_name = COALESCE(NULLIF($1, ''), section_name),
               grade_level = COALESCE($2, grade_level),
               advisor_teacher_id = $3,
               updated_at = CURRENT_TIMESTAMP
           WHERE class_id::text = $4 OR (grade_level = $2 AND section_name = $4)`,
          [sectionName?.trim() || null, gradeLevel || null, cleanAdviserId, id]
        );
      } catch (dbErr) {
        console.warn('DB update section notice:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'Section updated successfully.' });
  } catch (error) {
    console.error('Error updating section:', error);
    return res.status(500).json({ success: false, error: 'Failed to update section.' });
  }
}

/**
 * DELETE /api/admin/sections/:id — Delete class section
 */
async function deleteSection(req, res) {
  try {
    const { id } = req.params;

    if (process.env.DATABASE_URL) {
      try {
        await db.query(`DELETE FROM classes WHERE class_id::text = $1 OR section_name = $1`, [id]);
      } catch (dbErr) {
        console.warn('DB delete section notice:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'Section deleted successfully.' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete section.' });
  }
}

/**
 * GET /api/admin/faculty-assignments — Get lead faculty in charge assignments per grade
 */
async function getFacultyAssignments(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const { rows } = await db.query(`
          SELECT 
            fic.faculty_id AS id,
            fic.grade_level AS "gradeLevel",
            t.teacher_id AS "teacherId",
            CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name) AS "facultyInCharge"
          FROM faculty_in_charge fic
          JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
          JOIN teachers t ON fic.teacher_id = t.teacher_id
          JOIN users u ON t.user_id = u.user_id
          WHERE fic.status = 'active' AND u.school_id = $1
        `, [schoolId]);

        return res.json({ success: true, assignments: rows || [] });
      } catch (dbErr) {
        console.warn('DB fetch faculty assignments notice:', dbErr.message);
      }
    }

    return res.json({ success: true, assignments: [] });
  } catch (error) {
    console.error('Error fetching faculty assignments:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch faculty assignments.' });
  }
}

/**
 * GET /api/admin/school-years — List all school years
 */
async function getSchoolYears(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        let { rows } = await db.query(`
          SELECT 
            school_year_id AS id,
            school_year AS "schoolYear",
            is_active AS "isActive",
            TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt"
          FROM school_years
          WHERE school_id = $1 OR school_id IS NULL
          ORDER BY is_active DESC, created_at DESC
        `, [schoolId]);

        return res.json({ success: true, schoolYears: rows || [] });
      } catch (dbErr) {
        console.warn('DB fetch school years notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      schoolYears: []
    });
  } catch (error) {
    console.error('Error fetching school years:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch school years.' });
  }
}

/**
 * Helper to perform DepEd student rollover to a new active school year
 */
async function performStudentRollover(newSchoolYearId, schoolId) {
  try {
    // 1. Get the previous school year ID for this school
    const prevSyRes = await db.query(
      `SELECT school_year_id FROM school_years 
       WHERE school_year_id != $1 AND (school_id = $2 OR school_id IS NULL)
       ORDER BY created_at DESC LIMIT 1`,
      [newSchoolYearId, schoolId]
    );

    const prevSchoolYearId = prevSyRes.rows[0]?.school_year_id || null;

    // 2. Fetch student enrollments from previous school year belonging to this school
    let studentsToRollover = [];
    if (prevSchoolYearId) {
      const { rows } = await db.query(
        `SELECT DISTINCT ON (sgh.student_id) 
           sgh.student_id, 
           COALESCE(c.grade_level, sgh.grade_level, 'Grade 4') AS grade_level, 
           COALESCE(sgh.promotion_status, 'pending') AS promotion_status
         FROM student_grade_history sgh
         JOIN students s ON sgh.student_id = s.student_id
         JOIN users u ON s.user_id = u.user_id
         LEFT JOIN classes c ON sgh.class_id = c.class_id
         WHERE (c.school_year_id = $1 OR sgh.school_year_id = $1)
           AND u.school_id = $2
         ORDER BY sgh.student_id, (c.grade_level IS NOT NULL) DESC, sgh.created_at DESC`,
        [prevSchoolYearId, schoolId]
      );
      studentsToRollover = rows;
    } else {
      const { rows } = await db.query(
        `SELECT DISTINCT ON (s.student_id) 
           s.student_id, 
           COALESCE(c.grade_level, sgh.grade_level, 'Grade 4') AS grade_level, 
           COALESCE(sgh.promotion_status, 'pending') AS promotion_status
         FROM students s
         JOIN users u ON s.user_id = u.user_id
         LEFT JOIN student_grade_history sgh ON s.student_id = sgh.student_id
         LEFT JOIN classes c ON sgh.class_id = c.class_id
         WHERE u.school_id = $1
         ORDER BY s.student_id, (c.grade_level IS NOT NULL) DESC, sgh.created_at DESC`,
        [schoolId]
      );
      studentsToRollover = rows;
    }

    // 3. For each student, check if an entry already exists for this school_year_id before performing rollover
    for (const std of studentsToRollover) {
      const existingRes = await db.query(
        `SELECT sgh.history_id 
         FROM student_grade_history sgh
         LEFT JOIN classes c ON sgh.class_id = c.class_id
         WHERE sgh.student_id = $1 
           AND (sgh.school_year_id = $2 OR c.school_year_id = $2) 
         LIMIT 1`,
        [std.student_id, newSchoolYearId]
      );

      if (existingRes.rows && existingRes.rows.length > 0) {
        continue;
      }

      const status = (std.promotion_status || 'pending').toLowerCase();
      if (status !== 'promoted' && status !== 'retained') {
        continue;
      }

      const currentGrade = std.grade_level || 'Grade 4';
      let nextGrade = currentGrade;
      if (status === 'retained') {
        nextGrade = currentGrade;
      } else {
        if (currentGrade.includes('4')) nextGrade = 'Grade 5';
        else if (currentGrade.includes('5')) nextGrade = 'Grade 6';
        else if (currentGrade.includes('6')) nextGrade = 'Grade 6 (Graduated)';
        else nextGrade = currentGrade;
      }

      try {
        await db.query(
          `INSERT INTO student_grade_history (student_id, school_year_id, grade_level, class_id, promotion_status)
           VALUES ($1, $2, $3, NULL, 'pending')`,
          [std.student_id, newSchoolYearId, nextGrade]
        );
      } catch (insErr) {
        // Safe catch
      }
    }
  } catch (err) {
    console.error('Error during student rollover:', err);
  }
}

/**
 * Helper to check if there are pending student evaluations in the currently active school year
 */
async function getPendingEvaluationsCount(schoolId) {
  try {
    const activeSyRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true AND (school_id = $1 OR school_id IS NULL) LIMIT 1', [schoolId]);
    const activeSyId = activeSyRes.rows[0]?.school_year_id;
    if (!activeSyId) return 0;

    const { rows } = await db.query(
      `SELECT COUNT(*)::int AS count 
       FROM student_grade_history sgh
       JOIN students s ON sgh.student_id = s.student_id
       JOIN users u ON s.user_id = u.user_id
       LEFT JOIN classes c ON sgh.class_id = c.class_id
       WHERE (c.school_year_id = $1 OR sgh.school_year_id = $1)
         AND u.school_id = $2
         AND (sgh.promotion_status = 'pending' OR sgh.promotion_status IS NULL)`,
      [activeSyId, schoolId]
    );

    return Number(rows[0]?.count || 0);
  } catch (err) {
    console.warn('Check pending count notice:', err.message);
    return 0;
  }
}

/**
 * POST /api/admin/school-years — Create new school year
 */
async function createSchoolYear(req, res) {
  try {
    const { schoolYear, setAsActive, allowOverride } = req.body;
    if (!schoolYear || !schoolYear.trim()) {
      return res.status(400).json({ success: false, error: 'School year is required (e.g. 2027-2028).' });
    }

    const cleanSy = schoolYear.trim();

    // Strict format validation: YYYY-YYYY (e.g. 2027-2028)
    const syRegex = /^\d{4}-\d{4}$/;
    if (!syRegex.test(cleanSy)) {
      return res.status(400).json({ success: false, error: 'School year must follow the YYYY-YYYY format (e.g. 2027-2028).' });
    }

    const [startYear, endYear] = cleanSy.split('-').map(Number);
    if (endYear !== startYear + 1) {
      return res.status(400).json({ success: false, error: 'School year end year must be the consecutive year (e.g. 2027-2028).' });
    }

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        if (setAsActive !== false && !allowOverride) {
          const pendingCount = await getPendingEvaluationsCount(schoolId);
          if (pendingCount > 0) {
            return res.status(400).json({
              success: false,
              requiresConfirmation: true,
              pendingCount,
              error: `Cannot activate S.Y. ${cleanSy}: There are still ${pendingCount} unevaluated (Pending) learner(s) in the current school year. Please ask class advisers to complete EOSY evaluations first.`,
            });
          }
        }

        if (setAsActive !== false) {
          await db.query('UPDATE school_years SET is_active = false WHERE school_id = $1', [schoolId]);
        }

        const { rows } = await db.query(
          `INSERT INTO school_years (school_id, school_year, is_active)
           VALUES ($1, $2, $3)
           ON CONFLICT (school_id, school_year) DO UPDATE SET is_active = $3
           RETURNING school_year_id AS id, school_year AS "schoolYear", is_active AS "isActive"`,
          [schoolId, cleanSy, setAsActive !== false]
        );

        const newSyId = rows[0]?.id;
        if (newSyId && setAsActive !== false) {
          await performStudentRollover(newSyId, schoolId);
        }

        return res.status(201).json({
          success: true,
          message: `School Year S.Y. ${cleanSy} created successfully with student rollover.`,
          schoolYear: rows[0],
        });
      } catch (dbErr) {
        console.warn('DB create school year notice:', dbErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `School Year S.Y. ${cleanSy} created successfully.`,
      schoolYear: { id: `sy-${Date.now()}`, schoolYear: cleanSy, isActive: setAsActive !== false },
    });
  } catch (error) {
    console.error('Error creating school year:', error);
    return res.status(500).json({ success: false, error: 'Failed to create school year.' });
  }
}

/**
 * PUT /api/admin/school-years/:id/activate — Set active school year
 */
async function activateSchoolYear(req, res) {
  try {
    const { id } = req.params;
    const { allowOverride } = req.body || {};

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        if (!allowOverride) {
          const pendingCount = await getPendingEvaluationsCount(schoolId);
          if (pendingCount > 0) {
            return res.status(400).json({
              success: false,
              requiresConfirmation: true,
              pendingCount,
              error: `Cannot activate new school year: There are still ${pendingCount} unevaluated (Pending) learner(s) in the active school year. Please ensure class advisers complete EOSY evaluations first.`,
            });
          }
        }

        await db.query('UPDATE school_years SET is_active = false WHERE school_id = $1', [schoolId]);
        const { rows } = await db.query(
          'UPDATE school_years SET is_active = true WHERE (school_year_id::text = $1 OR school_year = $1) AND (school_id = $2 OR school_id IS NULL) RETURNING school_year_id',
          [id, schoolId]
        );
        const activeSyId = rows[0]?.school_year_id;
        if (activeSyId) {
          await performStudentRollover(activeSyId, schoolId);
        }
      } catch (dbErr) {
        console.warn('DB activate school year notice:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'Active school year updated and students rolled over as Unassigned.' });
  } catch (error) {
    console.error('Error setting active school year:', error);
    return res.status(500).json({ success: false, error: 'Failed to activate school year.' });
  }
}

/**
 * GET /api/admin/student-sectioning — List students for sectioning (Unassigned vs Assigned)
 */
async function getStudentSectioning(req, res) {
  try {
    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const syRes = await db.query('SELECT school_year_id, school_year FROM school_years WHERE is_active = true LIMIT 1');
        const activeSy = syRes.rows[0];

        const { rows } = await db.query(
          `SELECT 
             s.student_id AS "studentId",
             s.lrn,
             CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
             COALESCE(c.grade_level, sgh.grade_level, 'Grade 4') AS "gradeLevel",
             COALESCE(c.section_name, 'Unassigned') AS "sectionName",
             c.class_id AS "classId",
             COALESCE(sgh.promotion_status, 'pending') AS "promotionStatus"
           FROM students s
           JOIN users u ON s.user_id = u.user_id
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
             ORDER BY 
               sgh_inner.student_id, 
               (COALESCE(sy_c.is_active, sy_direct.is_active, FALSE)) DESC, 
               sgh_inner.created_at DESC
           ) sgh ON s.student_id = sgh.student_id
           LEFT JOIN classes c ON sgh.class_id = c.class_id
           WHERE (u.school_id = $1 OR u.school_id IS NULL OR $1 IS NULL)
           ORDER BY COALESCE(c.section_name, 'Unassigned') ASC, s.last_name ASC`,
          [schoolId]
        );

        return res.json({
          success: true,
          activeSchoolYear: activeSy?.school_year || '',
          students: rows || [],
        });
      } catch (dbErr) {
        console.warn('DB fetch student sectioning notice:', dbErr.message);
      }
    }
    return res.json({ success: true, activeSchoolYear: '', students: [] });
  } catch (error) {
    console.error('Error fetching student sectioning:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch student sectioning.' });
  }
}

/**
 * POST /api/admin/assign-students-section — Assign one or more students to a class section
 */
async function assignStudentsToSection(req, res) {
  try {
    const { studentIds, classId, sectionName, gradeLevel } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Please select at least one student.' });
    }

    if (process.env.DATABASE_URL) {
      try {
        const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
        const activeSyId = syRes.rows[0]?.school_year_id || null;

        let targetClassId = classId;
        if (!targetClassId && sectionName && gradeLevel) {
          const { rows } = await db.query(
            `SELECT class_id FROM classes WHERE grade_level = $1 AND section_name = $2 LIMIT 1`,
            [gradeLevel, sectionName]
          );
          targetClassId = rows[0]?.class_id || null;
        }

        for (const sid of studentIds) {
          await db.query(
            `INSERT INTO student_grade_history (student_id, class_id, grade_level)
             VALUES ($1, $2, $3)
             ON CONFLICT (student_id, class_id) DO UPDATE SET class_id = EXCLUDED.class_id, grade_level = EXCLUDED.grade_level`,
            [sid, targetClassId, gradeLevel]
          );
        }

        return res.json({
          success: true,
          message: `Successfully assigned ${studentIds.length} student(s) to section.`,
        });
      } catch (dbErr) {
        console.warn('DB assign students notice:', dbErr.message);
      }
    }

    return res.json({ success: true, message: `Assigned ${studentIds.length} student(s) to section.` });
  } catch (error) {
    console.error('Error assigning students to section:', error);
    return res.status(500).json({ success: false, error: 'Failed to assign students to section.' });
  }
}

/**
 * PUT /api/admin/student-promotion — Update a student's promotion status (promoted vs retained)
 */
async function updateStudentPromotionStatus(req, res) {
  try {
    const { studentId, promotionStatus } = req.body;
    if (!studentId || !promotionStatus) {
      return res.status(400).json({ success: false, error: 'Student ID and promotion status are required.' });
    }

    if (process.env.DATABASE_URL) {
      try {
        const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
        const activeSyId = syRes.rows[0]?.school_year_id || null;

        if (activeSyId) {
          await db.query(
            `UPDATE student_grade_history SET promotion_status = $1 WHERE student_id = $2 AND school_year_id = $3`,
            [promotionStatus.toLowerCase(), studentId, activeSyId]
          );
        } else {
          await db.query(
            `UPDATE student_grade_history SET promotion_status = $1 WHERE student_id = $2`,
            [promotionStatus.toLowerCase(), studentId]
          );
        }

        return res.json({ success: true, message: `Student status set to ${promotionStatus}.` });
      } catch (dbErr) {
        console.warn('DB update promotion status notice:', dbErr.message);
      }
    }

    return res.json({ success: true, message: `Student status updated.` });
  } catch (error) {
    console.error('Error updating promotion status:', error);
    return res.status(500).json({ success: false, error: 'Failed to update promotion status.' });
  }
}

/**
 * GET /api/admin/info — Get school details & active school year for admin dashboard banner
 */
async function getAdminInfo(req, res) {
  try {
    let schoolInfo = null;
    let activeSchoolYear = null;
    let profileImage = null;

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);

        // 1. Fetch School Details
        let sRes;
        if (schoolId) {
          sRes = await db.query(
            `SELECT school_id AS "schoolId", school_name AS "schoolName", division, region, official_email AS "officialEmail", principal_name AS "principalName" FROM schools WHERE school_id = $1 LIMIT 1`,
            [schoolId]
          );
        } else {
          sRes = await db.query(
            `SELECT school_id AS "schoolId", school_name AS "schoolName", division, region, official_email AS "officialEmail", principal_name AS "principalName" FROM schools LIMIT 1`
          );
        }
        if (sRes.rows && sRes.rows[0]) {
          schoolInfo = sRes.rows[0];
        }

        // 2. Fetch Active School Year
        const syRes = await db.query(
          `SELECT school_year AS "schoolYear" FROM school_years WHERE is_active = true LIMIT 1`
        );
        if (syRes.rows && syRes.rows[0]) {
          activeSchoolYear = syRes.rows[0].schoolYear;
        }

        // 3. Fetch Admin User Profile Image
        const userId = req.user?.user_id || req.user?.userId || req.user?.id;
        let uRes;
        if (userId) {
          uRes = await db.query(`SELECT profile_image FROM users WHERE user_id = $1 LIMIT 1`, [userId]);
        } else {
          uRes = await db.query(`SELECT profile_image FROM users WHERE role = 'admin' AND profile_image IS NOT NULL ORDER BY updated_at DESC LIMIT 1`);
        }
        if (uRes.rows && uRes.rows[0]) {
          profileImage = uRes.rows[0].profile_image;
        }
      } catch (dbErr) {
        console.warn('DB get admin info notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      schoolInfo: schoolInfo || {
        schoolId: '',
        schoolName: '',
        division: '',
        region: '',
        officialEmail: '',
        principalName: '',
      },
      activeSchoolYear: activeSchoolYear || '',
      profileImage,
    });
  } catch (error) {
    console.error('Error fetching admin info:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin info.' });
  }
}

/**
 * PUT /api/admin/info — Update school profile details & admin avatar in PostgreSQL
 */
async function updateAdminInfo(req, res) {
  try {
    const { schoolName, schoolId, division, region, principalName, officialEmail, profileImage, avatarUrl } = req.body;
    const currentSchoolId = await getAdminSchoolId(req);
    const targetSchoolId = schoolId || currentSchoolId;

    if (process.env.DATABASE_URL) {
      // 1. Update School Profile details if school attributes are supplied
      if (schoolName || division || region || officialEmail || principalName) {
        if (!targetSchoolId) {
          console.warn('Cannot update school: no school_id found for admin.');
        } else {
          const existingRes = await db.query(`SELECT * FROM schools WHERE school_id = $1 LIMIT 1`, [targetSchoolId]);
          const existing = existingRes.rows?.[0] || {};

          await db.query(
            `INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             ON CONFLICT (school_id) DO UPDATE SET
               school_name = EXCLUDED.school_name,
               division = EXCLUDED.division,
               region = EXCLUDED.region,
               official_email = EXCLUDED.official_email,
               principal_name = EXCLUDED.principal_name,
               updated_at = CURRENT_TIMESTAMP`,
            [
              targetSchoolId,
              schoolName || existing.school_name || '',
              division || existing.division || '',
              region || existing.region || '',
              officialEmail || existing.official_email || '',
              principalName || existing.principal_name || '',
            ]
          );
        }
      }

      // 2. Update Admin Profile Image if present
      const imgUrl = profileImage || avatarUrl;
      if (imgUrl) {
        let finalImageUrl = imgUrl;
        const userId = req.user?.user_id || req.user?.userId || req.user?.id;

        if (imgUrl.startsWith('data:image')) {
          try {
            // Use unique timestamp filename to bypass Supabase CDN cache
            const fileName = `admin-avatar-${userId || 'admin'}-${Date.now()}.webp`;

            // Delete old avatar from Supabase Storage using old filename from DB
            if (supabase) {
              const oldUrlRes = userId
                ? await db.query(`SELECT profile_image FROM users WHERE user_id = $1 LIMIT 1`, [userId])
                : await db.query(`SELECT profile_image FROM users WHERE role = 'admin' AND profile_image IS NOT NULL LIMIT 1`);
              const oldUrl = oldUrlRes.rows?.[0]?.profile_image;
              if (oldUrl && oldUrl.includes('supabase')) {
                // Extract just the filename from the URL path
                const urlPath = oldUrl.split('/avatars/')[1]?.split('?')[0];
                if (urlPath) {
                  const { error: removeError } = await supabase.storage.from('avatars').remove([urlPath]);
                  if (removeError) {
                    console.warn('Could not delete old avatar:', removeError.message);
                  } else {
                    console.log('🗑️ Old avatar deleted:', urlPath);
                  }
                }
              }
            }

            const supabaseImageUrl = await uploadImageToSupabase(imgUrl, fileName, 'avatars');
            if (supabaseImageUrl) {
              finalImageUrl = supabaseImageUrl;
              console.log('✅ New avatar uploaded to Supabase Storage:', finalImageUrl);
            } else {
              console.warn('⚠️ Supabase upload returned null — storing base64 in DB as fallback.');
            }
          } catch (imgErr) {
            console.warn('Avatar image upload error:', imgErr.message);
          }
        }

        if (userId) {
          await db.query(`UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`, [finalImageUrl, userId]);
        } else {
          await db.query(`UPDATE users SET profile_image = $1, updated_at = CURRENT_TIMESTAMP WHERE role = 'admin'`, [finalImageUrl]);
        }
      }
    }

    return res.json({ success: true, message: 'Admin details updated successfully.' });
  } catch (error) {
    console.error('Error updating admin info:', error);
    return res.status(500).json({ success: false, error: 'Failed to update admin details.' });
  }
}

/**
 * GET /api/admin/analytics/phil-iri — Phil-IRI Reading Profile Analytics & Distribution
 */
async function getPhilIriAnalytics(req, res) {
  try {
    let analytics = {
      summary: {
        totalEvaluated: 0,
        independent: 0,
        instructional: 0,
        frustration: 0,
        nonReader: 0,
        pending: 0,
        proficiencyRate: 0,
      },
      byGrade: {
        'Grade 4': { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 },
        'Grade 5': { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 },
        'Grade 6': { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 },
      },
    };

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);
        const { rows } = await db.query(`
          SELECT 
            COALESCE(c.grade_level, 'Grade 4') AS grade,
            COALESCE(rp.current_profile_label, 'Pending Evaluation') AS level,
            COUNT(s.student_id)::int AS count
          FROM students s
          JOIN users u ON s.user_id = u.user_id
          LEFT JOIN student_grade_history sgh ON sgh.student_id = s.student_id
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
          WHERE u.school_id = $1
          GROUP BY COALESCE(c.grade_level, 'Grade 4'), COALESCE(rp.current_profile_label, 'Pending Evaluation')
        `, [schoolId]);

        rows.forEach((r) => {
          const count = Number(r.count) || 0;
          const levelKey = (r.level || '').toLowerCase();
          const gradeKey = r.grade || 'Grade 4';

          if (!analytics.byGrade[gradeKey]) {
            analytics.byGrade[gradeKey] = { independent: 0, instructional: 0, frustration: 0, nonReader: 0, pending: 0, total: 0 };
          }

          if (levelKey.includes('independent')) {
            analytics.summary.independent += count;
            analytics.byGrade[gradeKey].independent += count;
          } else if (levelKey.includes('instructional')) {
            analytics.summary.instructional += count;
            analytics.byGrade[gradeKey].instructional += count;
          } else if (levelKey.includes('frustration')) {
            analytics.summary.frustration += count;
            analytics.byGrade[gradeKey].frustration += count;
          } else if (levelKey.includes('non-reader') || levelKey.includes('non reader')) {
            analytics.summary.nonReader += count;
            analytics.byGrade[gradeKey].nonReader += count;
          } else {
            analytics.summary.pending += count;
            analytics.byGrade[gradeKey].pending += count;
          }

          analytics.byGrade[gradeKey].total += count;
        });

        const totalEvaluated = analytics.summary.independent + analytics.summary.instructional + analytics.summary.frustration + analytics.summary.nonReader;
        analytics.summary.totalEvaluated = totalEvaluated;
        const proficientCount = analytics.summary.independent + analytics.summary.instructional;
        analytics.summary.proficiencyRate = totalEvaluated > 0 ? Math.round((proficientCount / totalEvaluated) * 100) : 0;
      } catch (dbErr) {
        console.warn('DB Phil-IRI analytics notice:', dbErr.message);
      }
    }

    return res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error fetching Phil-IRI analytics:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch Phil-IRI analytics.' });
  }
}

// Memory store for active screening period per grade
let memoryPeriods = {
  'Grade 4': 'Pre-Test',
  'Grade 5': 'Pre-Test',
  'Grade 6': 'Pre-Test',
};

/**
 * GET /api/admin/phil-iri/passages — Fetch all Phil-IRI passages with questions
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
        const prevStatusDisplay = (m.prev_status || 'published').charAt(0).toUpperCase() + (m.prev_status || 'published').slice(1);

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
          status: statusDisplay,
          prevStatus: prevStatusDisplay,
          words,
          text: m.text,
          questions,
        };
      })
    );

    return res.json({ success: true, passages });
  } catch (error) {
    console.error('Error fetching passages:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch passages.' });
  }
}

/**
 * POST /api/admin/phil-iri/passages — Create new Phil-IRI passage with questions
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

    const materialId = rows[0].id;

    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (!q.question) continue;
        const qRes = await db.query(`
          INSERT INTO phil_iri_questions (passage_id, question_text, question_type)
          VALUES ($1, $2, $3)
          RETURNING question_id
        `, [materialId, q.question, q.type || 'Multiple Choice']);

        const qId = qRes.rows[0].question_id;

        if (Array.isArray(q.options)) {
          for (let i = 0; i < q.options.length; i++) {
            const optText = q.options[i];
            const isCorrect = i === (Number(q.correctAnswer) || 0);
            await db.query(`
              INSERT INTO phil_iri_question_choices (question_id, choice_text, is_correct)
              VALUES ($1, $2, $3)
            `, [qId, optText, isCorrect]);
          }
        }
      }
    }

    return res.status(201).json({ success: true, message: 'Passage created successfully.', passageId: materialId });
  } catch (error) {
    console.error('Error creating passage:', error);
    return res.status(500).json({ success: false, error: 'Failed to create passage.' });
  }
}

/**
 * PUT /api/admin/phil-iri/passages/:id — Update existing Phil-IRI passage
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
      UPDATE phil_iri_passages
      SET title = $1, grade_level = $2, passage_set = $3, language = $4, status = $5, prev_status = $6, content_text = $7, word_count = $8, updated_at = CURRENT_TIMESTAMP
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
            const optText = q.options[i];
            const isCorrect = i === (Number(q.correctAnswer) || 0);
            await db.query(`
              INSERT INTO phil_iri_question_choices (question_id, choice_text, is_correct)
              VALUES ($1, $2, $3)
            `, [qId, optText, isCorrect]);
          }
        }
      }
    }

    return res.json({ success: true, message: 'Passage updated successfully.' });
  } catch (error) {
    console.error('Error updating passage:', error);
    return res.status(500).json({ success: false, error: 'Failed to update passage.' });
  }
}

/**
 * DELETE /api/admin/phil-iri/passages/:id — Delete Phil-IRI passage
 */
async function deletePassage(req, res) {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM phil_iri_passages WHERE passage_id = $1`, [id]);
    return res.json({ success: true, message: 'Passage deleted successfully.' });
  } catch (error) {
    console.error('Error deleting passage:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete passage.' });
  }
}

/**
 * GET /api/admin/phil-iri/assessments — Fetch Phil-IRI Assessment status records
 */
async function getPhilIriAssessments(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, assessments: [], periods: memoryPeriods });
    }

    const schoolId = await getAdminSchoolId(req);
    const { rows } = await db.query(`
      SELECT 
        s.student_id AS id,
        s.lrn,
        COALESCE(NULLIF(TRIM(CONCAT(s.first_name, ' ', s.last_name)), ''), s.lrn) AS name,
        COALESCE(c.grade_level, 'Grade 4') AS grade,
        COALESCE(c.section_name, 'Unassigned') AS section,
        COALESCE(rp.current_profile_label, 'Pending Evaluation') AS level,
        COALESCE(a.assessment_type, 'Oral Reading') AS type,
        COALESCE(a.assessment_period, 'Pre-Test') AS period,
        COALESCE(a.status, 'assigned') AS status,
        TO_CHAR(a.date_assigned, 'YYYY-MM-DD') AS date_assigned
      FROM students s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN student_grade_history sgh ON sgh.student_id = s.student_id
      LEFT JOIN classes c ON sgh.class_id = c.class_id
      LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
      LEFT JOIN (
        SELECT DISTINCT ON (student_id) student_id, assessment_type, assessment_period, status, date_assigned
        FROM assessments
        ORDER BY student_id, created_at DESC
      ) a ON a.student_id = s.student_id
      WHERE u.school_id = $1
      ORDER BY COALESCE(s.last_name, s.lrn) ASC
    `, [schoolId]);

    return res.json({ success: true, assessments: rows, periods: memoryPeriods });
  } catch (error) {
    console.error('Error fetching Phil-IRI assessments:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch assessments.' });
  }
}

/**
 * GET /api/admin/phil-iri/periods — Fetch screening periods
 */
async function getPhilIriPeriods(req, res) {
  return res.json({ success: true, periods: memoryPeriods });
}

/**
 * POST /api/admin/phil-iri/periods — Update active screening period per grade
 */
async function updatePhilIriPeriods(req, res) {
  try {
    const { grade, period } = req.body;
    if (grade && period) {
      memoryPeriods[grade] = period;
    }
    return res.json({ success: true, message: `${grade} active period updated to ${period}.`, periods: memoryPeriods });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update screening period.' });
  }
}

module.exports = {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getFacultyAssignments,
  getStudents,
  createStudent,
  verifyParentAccessCode,
  assignFaculty,
  getSystemStats,
  getSchoolYears,
  createSchoolYear,
  activateSchoolYear,
  getStudentSectioning,
  assignStudentsToSection,
  updateStudentPromotionStatus,
  getAdminInfo,
  updateAdminInfo,
  getPhilIriAnalytics,
  getPassages,
  createPassage,
  updatePassage,
  deletePassage,
  getPhilIriAssessments,
  getPhilIriPeriods,
  updatePhilIriPeriods,
};
