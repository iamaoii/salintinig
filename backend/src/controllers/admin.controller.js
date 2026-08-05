const db = require('../config/db.js');
const supabase = require('../config/supabase.js');

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

/**
 * Helper to send Welcome email with temporary credentials via Resend API
 */
async function sendWelcomeEmailWithTempPassword({ toEmail, fullName, role, tempPassword, identifier }) {
  if (!toEmail) return;
  try {
    if (
      process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY.startsWith('re_') &&
      process.env.RESEND_API_KEY !== 're_your_resend_api_key_here'
    ) {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'SalinTinig <onboarding@resend.dev>',
        to: [toEmail],
        subject: `Welcome to SalinTinig — Your Temporary Account Credentials`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
              <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">SalinTinig 🎙️</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">DepEd Phil-IRI Educational Portal</p>
            </div>
            
            <div style="padding: 20px 0;">
              <p style="font-size: 15px; color: #1e293b;">Hello <strong>${fullName}</strong>,</p>
              <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                An official <strong>${role.toUpperCase()}</strong> account has been registered for you on the SalinTinig portal. Here are your temporary login credentials:
              </p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 13px; color: #64748b;">
                  <strong>Portal ID / Email:</strong> <code style="background: #e2e8f0; padding: 3px 8px; border-radius: 6px; color: #0f172a; font-size: 14px;">${identifier || toEmail}</code>
                </p>
                <p style="margin: 0; font-size: 13px; color: #64748b;">
                  <strong>Temporary Password:</strong> <code style="background: #fee2e2; padding: 3px 8px; border-radius: 6px; color: #dc2626; font-size: 15px; font-weight: bold;">${tempPassword}</code>
                </p>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                ⚠️ <strong>Important Security Notice:</strong> Please log in to your portal and update your temporary password upon your first login.
              </p>
            </div>

            <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                This is an automated notification from the SalinTinig Educational Portal System.
              </p>
            </div>
          </div>
        `,
      });
      console.log(`✅ Welcome email with temporary password sent to ${toEmail}`);
    }
  } catch (err) {
    console.warn(`⚠️ Failed to send welcome email to ${toEmail}:`, err.message);
  }
}

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
  if (req.user && (req.user.schoolId || req.user.school_id)) {
    return req.user.schoolId || req.user.school_id;
  }
  if (req.user && req.user.email && process.env.DATABASE_URL) {
    try {
      const { rows } = await db.query(
        `SELECT school_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [req.user.email]
      );
      if (rows && rows[0] && rows[0].school_id) {
        return rows[0].school_id;
      }
    } catch (e) {}
  }
  return '109283';
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
          WHERE (t.school_id = $1 OR u.school_id = $1 OR t.school_id IS NULL)
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

    const tempPassword = generateTempPassword();

    const newTeacherObj = {
      id: `TCH-${Date.now().toString().slice(-4)}`,
      employeeId: cleanEmpId,
      firstName,
      middleName,
      lastName,
      name: fullName,
      gender: gender || 'Female',
      email: cleanEmail,
      gradeAssigned: gradeAssigned || 'Grade 4',
      sectionAssigned: sectionAssigned || 'Fyang',
      isFacultyInCharge: Boolean(isFacultyInCharge),
      status: 'Active',
      dateAdded: new Date().toISOString().split('T')[0],
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
            `INSERT INTO teachers (user_id, school_id, teacher_no, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (teacher_no) DO UPDATE SET school_id = $2, first_name = $4, middle_name = $5, last_name = $6, sex = $7
             RETURNING teacher_id`,
            [userId, schoolId, cleanEmpId, firstName, middleName || null, lastName, gender || 'Male']
          );

          if (tchRows && tchRows[0]) {
            const teacherId = tchRows[0].teacher_id;

            // Assign as class adviser if section specified
            if (sectionAssigned && sectionAssigned !== 'Unassigned') {
              await db.query(
                `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
                [teacherId, gradeAssigned || 'Grade 4', sectionAssigned]
              );
            }

            // Assign as Lead Faculty-in-Charge if checked
            if (isFacultyInCharge) {
              await db.query(
                `INSERT INTO faculty_in_charge (school_id, teacher_id, grade_level)
                 VALUES ($1, $2, $3)
                 ON CONFLICT DO NOTHING`,
                [schoolId, teacherId, gradeAssigned || 'Grade 4']
              );
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
          WHERE (s.school_id = $1 OR u.school_id = $1 OR s.school_id IS NULL)
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
            `INSERT INTO students (user_id, school_id, lrn, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (lrn) DO UPDATE SET school_id = $2, first_name = $4, middle_name = $5, last_name = $6, sex = $7
             RETURNING student_id`,
            [userId, schoolId, cleanLrn, firstName, middleName || null, lastName, gender || 'Male']
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
               ON CONFLICT DO NOTHING`,
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
        const empId = (row.employeeId || row.employee_id || row['Employee ID'] || '').trim().toUpperCase();
        if (!empId) {
          errors.push(`Row ${i + 1}: Missing Employee ID`);
          return;
        }

        const name = (row.name || row.Name || row['Full Name'] || 'Teacher').trim();
        const email = (row.email || row.Email || `${empId.toLowerCase()}@deped.gov.ph`).trim();

        const exists = teachersStore.some((t) => t.employeeId.toUpperCase() === empId);
        if (exists) {
          errors.push(`Row ${i + 1}: Employee ID "${empId}" already exists`);
          return;
        }

        const newTeacher = {
          id: `TCH-${Date.now().toString().slice(-4)}-${i}`,
          employeeId: empId,
          name,
          gender: row.gender || 'Female',
          email,
          gradeAssigned: row.gradeAssigned || row.grade || 'Grade 4',
          sectionAssigned: row.sectionAssigned || row.section || 'General',
          isFacultyInCharge: Boolean(row.isFacultyInCharge),
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
              [teacherIdToUse, targetGrade || 'Grade 4', sectionAssigned]
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
            `INSERT INTO teachers (user_id, school_id, teacher_no, first_name, middle_name, last_name, sex)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (teacher_no) DO UPDATE SET school_id = $2, first_name = $4, middle_name = $5, last_name = $6, sex = $7`,
            [userId, targetRequest.school_id, teacherNo, firstName, middleName, lastName, sex]
          );

          await db.query(
            "UPDATE account_requests SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
            [requestId]
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
    let activeSchoolYear = '2026-2027';

    if (process.env.DATABASE_URL) {
      try {
        const syRes = await db.query('SELECT school_year_id, school_year FROM school_years WHERE is_active = true LIMIT 1');
        const activeSyId = syRes.rows[0]?.school_year_id || null;
        if (syRes.rows[0]?.school_year) {
          activeSchoolYear = syRes.rows[0].school_year;
        }

        // Count students enrolled in active school year (or total if no history)
        let studentRes;
        if (activeSyId) {
          studentRes = await db.query('SELECT COUNT(DISTINCT student_id) FROM student_grade_history WHERE school_year_id = $1', [activeSyId]);
        } else {
          studentRes = await db.query('SELECT COUNT(*) FROM students');
        }
        totalStudents = parseInt(studentRes.rows[0].count, 10) || 0;

        const teacherRes = await db.query('SELECT COUNT(*) FROM teachers');
        totalTeachers = parseInt(teacherRes.rows[0].count, 10) || 0;

        const parentRes = await db.query('SELECT COUNT(*) FROM student_parents');
        totalParentAccounts = parseInt(parentRes.rows[0].count, 10) || 0;

        // Count sections created under active school year
        let sectionRes;
        if (activeSyId) {
          sectionRes = await db.query('SELECT COUNT(*) FROM classes WHERE school_year_id = $1', [activeSyId]);
        } else {
          sectionRes = await db.query('SELECT COUNT(*) FROM classes');
        }
        totalSections = parseInt(sectionRes.rows[0].count, 10) || 0;

        const gradeRes = await db.query('SELECT COUNT(DISTINCT grade_level) FROM classes');
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
          } else if (sectionAssigned) {
            await db.query(
              `UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id = $1`,
              [teacherId]
            );
            await db.query(
              `UPDATE classes SET advisor_teacher_id = $1 WHERE grade_level = $2 AND section_name = $3`,
              [teacherId, gradeAssigned || 'Grade 4', sectionAssigned]
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
          `SELECT teacher_id, user_id FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1 LIMIT 1`,
          [id]
        );

        if (rows && rows[0]) {
          const teacherId = rows[0].teacher_id;
          const userId = rows[0].user_id;

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
            COUNT(sgh.history_id)::int AS "studentsCount",
            COUNT(CASE WHEN rp.current_profile_label = 'Independent' THEN 1 END)::int AS "independentCount",
            COUNT(CASE WHEN rp.current_profile_label = 'Instructional' THEN 1 END)::int AS "instructionalCount",
            COUNT(CASE WHEN rp.current_profile_label = 'Frustrational' THEN 1 END)::int AS "frustrationalCount"
          FROM classes c
          JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
          LEFT JOIN teachers t ON c.advisor_teacher_id = t.teacher_id
          LEFT JOIN student_grade_history sgh ON sgh.class_id = c.class_id
          LEFT JOIN reading_profiles rp ON rp.student_id = sgh.student_id
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
        await db.query(
          `UPDATE classes 
           SET section_name = COALESCE(NULLIF($1, ''), section_name),
               grade_level = COALESCE($2, grade_level),
               advisor_teacher_id = COALESCE($3, advisor_teacher_id),
               updated_at = CURRENT_TIMESTAMP
           WHERE class_id::text = $4 OR (grade_level = $2 AND section_name = $4)`,
          [sectionName?.trim() || null, gradeLevel || null, adviserId || null, id]
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
        const { rows } = await db.query(`
          SELECT 
            fic.faculty_id AS id,
            fic.grade_level AS "gradeLevel",
            t.teacher_id AS "teacherId",
            CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name) AS "facultyInCharge"
          FROM faculty_in_charge fic
          JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
          JOIN teachers t ON fic.teacher_id = t.teacher_id
          WHERE fic.status = 'active'
        `);

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
        const { rows } = await db.query(`
          SELECT 
            school_year_id AS id,
            school_year AS "schoolYear",
            is_active AS "isActive",
            TO_CHAR(created_at, 'YYYY-MM-DD') AS "createdAt"
          FROM school_years
          ORDER BY created_at DESC
        `);

        return res.json({ success: true, schoolYears: rows || [] });
      } catch (dbErr) {
        console.warn('DB fetch school years notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      schoolYears: [
        { id: 'default-sy', schoolYear: '2026-2027', isActive: true, createdAt: '2026-08-01' }
      ]
    });
  } catch (error) {
    console.error('Error fetching school years:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch school years.' });
  }
}

/**
 * POST /api/admin/school-years — Create new school year
 */
async function createSchoolYear(req, res) {
  try {
    const { schoolYear, setAsActive } = req.body;
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
        if (setAsActive !== false) {
          await db.query('UPDATE school_years SET is_active = false');
        }

        const { rows } = await db.query(
          `INSERT INTO school_years (school_year, is_active)
           VALUES ($1, $2)
           ON CONFLICT (school_year) DO UPDATE SET is_active = $2
           RETURNING school_year_id AS id, school_year AS "schoolYear", is_active AS "isActive"`,
          [cleanSy, setAsActive !== false]
        );

        return res.status(201).json({
          success: true,
          message: `School Year S.Y. ${cleanSy} created successfully.`,
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

    if (process.env.DATABASE_URL) {
      try {
        await db.query('UPDATE school_years SET is_active = false');
        await db.query(
          'UPDATE school_years SET is_active = true WHERE school_year_id::text = $1 OR school_year = $1',
          [id]
        );
      } catch (dbErr) {
        console.warn('DB activate school year notice:', dbErr.message);
      }
    }

    return res.json({ success: true, message: 'Active school year updated.' });
  } catch (error) {
    console.error('Error setting active school year:', error);
    return res.status(500).json({ success: false, error: 'Failed to activate school year.' });
  }
}

/**
 * GET /api/admin/info — Get school details & active school year for admin dashboard banner
 */
async function getAdminInfo(req, res) {
  try {
    let schoolInfo = {
      schoolId: '109283',
      schoolName: 'Mandaluyong Elementary School',
      division: 'Division of City Schools',
      region: 'NCR',
    };
    let activeSchoolYear = '2026-2027';

    if (process.env.DATABASE_URL) {
      try {
        const schoolId = await getAdminSchoolId(req);

        // 1. Fetch School Details
        const sRes = await db.query(
          `SELECT school_id AS "schoolId", school_name AS "schoolName", division, region FROM schools WHERE school_id = $1 LIMIT 1`,
          [schoolId]
        );
        if (sRes.rows && sRes.rows[0]) {
          schoolInfo = {
            ...schoolInfo,
            ...sRes.rows[0],
          };
        }

        // 2. Fetch Active School Year
        const syRes = await db.query(
          `SELECT school_year AS "schoolYear" FROM school_years WHERE is_active = true LIMIT 1`
        );
        if (syRes.rows && syRes.rows[0]) {
          activeSchoolYear = syRes.rows[0].schoolYear;
        }
      } catch (dbErr) {
        console.warn('DB get admin info notice:', dbErr.message);
      }
    }

    return res.json({
      success: true,
      schoolInfo,
      activeSchoolYear,
    });
  } catch (error) {
    console.error('Error fetching admin info:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch admin info.' });
  }
}

module.exports = {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getSections,
  createSection,
  updateSection,
  deleteSection,
  getFacultyAssignments,
  getStudents,
  createStudent,
  batchImportCSV,
  verifyParentAccessCode,
  assignFaculty,
  getAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
  getSystemStats,
  getSchoolYears,
  createSchoolYear,
  activateSchoolYear,
  getAdminInfo,
};
