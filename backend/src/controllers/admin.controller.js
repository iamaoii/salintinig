const db = require('../config/db.js');
const supabase = require('../config/supabase.js');

/**
 * Helper to generate a unique Parent Access Code (e.g. PAC-48219)
 */
function generateParentAccessCode() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `PAC-${randomNum}`;
}

// In-Memory Database Store for backend REST endpoints
let teachersStore = [
  {
    id: 'TCH-101',
    employeeId: 'EMP-2024-001',
    name: 'Antoinette Jadaone',
    gender: 'Female',
    email: 'antoinette.jadaone@deped.gov.ph',
    gradeAssigned: 'Grade 4',
    sectionAssigned: 'Fyang',
    isFacultyInCharge: true,
    status: 'Active',
    dateAdded: '2025-06-15',
  },
  {
    id: 'TCH-102',
    employeeId: 'EMP-2024-002',
    name: 'Bernadette Reyes',
    gender: 'Female',
    email: 'bernadette.reyes@deped.gov.ph',
    gradeAssigned: 'Grade 4',
    sectionAssigned: 'Kalapati',
    isFacultyInCharge: false,
    status: 'Active',
    dateAdded: '2025-06-15',
  },
  {
    id: 'TCH-103',
    employeeId: 'EMP-2024-003',
    name: 'Carlos Mendoza',
    gender: 'Male',
    email: 'carlos.mendoza@deped.gov.ph',
    gradeAssigned: 'Grade 5',
    sectionAssigned: 'Sampaguita',
    isFacultyInCharge: false,
    status: 'Active',
    dateAdded: '2025-06-15',
  },
];

let studentsStore = [
  {
    id: 'STD-1001',
    lrn: '109283748291',
    name: 'Adrian Dela Cruz',
    gender: 'Male',
    grade: 'Grade 4',
    section: 'Fyang',
    level: 'Instructional',
    personalEmail: 'adrian.delacruz@gmail.com',
    status: 'Account Created',
    parentAccessCode: 'PAC-88491',
  },
  {
    id: 'STD-1002',
    lrn: '109283748292',
    name: 'Janna Santos',
    gender: 'Female',
    grade: 'Grade 4',
    section: 'Fyang',
    level: 'Independent',
    personalEmail: 'janna.santos@gmail.com',
    status: 'Account Created',
    parentAccessCode: 'PAC-88492',
  },
  {
    id: 'STD-1003',
    lrn: '109283748293',
    name: 'Mateo Reyes',
    gender: 'Male',
    grade: 'Grade 4',
    section: 'Fyang',
    level: 'Frustrational',
    personalEmail: 'mateo.reyes@gmail.com',
    status: 'Account Created',
    parentAccessCode: 'PAC-88493',
  },
];

/**
 * GET /api/admin/teachers — List all teachers
 */
async function getTeachers(req, res) {
  try {
    return res.json({ success: true, teachers: teachersStore });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch teachers.' });
  }
}

/**
 * POST /api/admin/teachers — Create single teacher (Requires Employee ID)
 */
async function createTeacher(req, res) {
  try {
    const { employeeId, name, gender, email, gradeAssigned, sectionAssigned, isFacultyInCharge } = req.body;

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Employee ID is required and must be provided by Admin.',
      });
    }

    const cleanEmpId = employeeId.trim().toUpperCase();

    // Validate uniqueness
    const exists = teachersStore.some((t) => t.employeeId.toUpperCase() === cleanEmpId);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `Teacher with Employee ID "${cleanEmpId}" already exists.`,
      });
    }

    const newTeacher = {
      id: `TCH-${Date.now().toString().slice(-4)}`,
      employeeId: cleanEmpId,
      name: name?.trim() || 'Faculty Member',
      gender: gender || 'Female',
      email: email?.trim() || `${cleanEmpId.toLowerCase()}@deped.gov.ph`,
      gradeAssigned: gradeAssigned || 'Grade 4',
      sectionAssigned: sectionAssigned || 'Unassigned',
      isFacultyInCharge: Boolean(isFacultyInCharge),
      status: 'Active',
      dateAdded: new Date().toISOString().split('T')[0],
    };

    teachersStore.unshift(newTeacher);

    return res.status(201).json({
      success: true,
      message: 'Teacher account created successfully.',
      teacher: newTeacher,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create teacher account.' });
  }
}

/**
 * GET /api/admin/students — List all students with parentAccessCode
 */
async function getStudents(req, res) {
  try {
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
    const { lrn, name, gender, grade, section, personalEmail } = req.body;

    if (!lrn || !lrn.trim()) {
      return res.status(400).json({
        success: false,
        error: 'LRN (Learner Reference Number) is required and must be provided by Admin.',
      });
    }

    const cleanLrn = lrn.trim();

    // Validate LRN uniqueness
    const exists = studentsStore.some((s) => s.lrn === cleanLrn);
    if (exists) {
      return res.status(400).json({
        success: false,
        error: `Student with LRN "${cleanLrn}" already exists.`,
      });
    }

    const parentAccessCode = generateParentAccessCode();

    const newStudent = {
      id: `STD-${Date.now().toString().slice(-4)}`,
      lrn: cleanLrn,
      name: name?.trim() || 'Student Name',
      gender: gender || 'Male',
      grade: grade || 'Grade 4',
      section: section || 'Fyang',
      level: 'Pending Evaluation',
      personalEmail: personalEmail?.trim() || `${cleanLrn}@student.deped.gov.ph`,
      status: 'Account Created',
      parentAccessCode,
    };

    studentsStore.unshift(newStudent);

    return res.status(201).json({
      success: true,
      message: 'Student account created and Parent Access Code generated successfully.',
      student: newStudent,
    });
  } catch (error) {
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
 * POST /api/admin/faculty-assignment — Update faculty assignment
 */
async function assignFaculty(req, res) {
  try {
    const { teacherId, gradeAssigned, sectionAssigned, isFacultyInCharge } = req.body;

    const teacher = teachersStore.find((t) => t.id === teacherId || t.employeeId === teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher record not found.' });
    }

    if (gradeAssigned) teacher.gradeAssigned = gradeAssigned;
    if (sectionAssigned) teacher.sectionAssigned = sectionAssigned;
    if (typeof isFacultyInCharge === 'boolean') teacher.isFacultyInCharge = isFacultyInCharge;

    return res.json({
      success: true,
      message: `Faculty assignment updated for ${teacher.name}.`,
      teacher,
    });
  } catch (error) {
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
        const { rows } = await db.query(
          `SELECT request_id, school_id, full_name, email, contact_number, grade_subject, status, created_at
           FROM account_requests ORDER BY created_at DESC`
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

    const defaultPassword = 'Password123!';
    const generatedTeacherNo = `EMP-2026-${Math.floor(100 + Math.random() * 900)}`;

    if (process.env.DATABASE_URL) {
      try {
        const { rows: userRows } = await db.query(
          `INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
           VALUES ($1, $2, $3, 'teacher', 'active', true)
           ON CONFLICT (email) DO UPDATE SET status = 'active'
           RETURNING user_id`,
          [targetRequest.school_id, targetRequest.email, defaultPassword]
        );

        if (userRows && userRows.length > 0) {
          const userId = userRows[0].user_id;
          const nameParts = (targetRequest.full_name || '').trim().split(' ');
          const firstName = nameParts[0] || 'Teacher';
          const lastName = nameParts.slice(1).join(' ') || 'Faculty';

          await db.query(
            `INSERT INTO teachers (user_id, school_id, teacher_no, first_name, last_name, contact_number)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (teacher_no) DO NOTHING`,
            [userId, targetRequest.school_id, generatedTeacherNo, firstName, lastName, targetRequest.contact_number || null]
          );

          await db.query(
            "UPDATE account_requests SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE request_id = $1",
            [requestId]
          );
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

    if (process.env.DATABASE_URL) {
      try {
        const studentRes = await db.query('SELECT COUNT(*) FROM students');
        totalStudents = parseInt(studentRes.rows[0].count, 10) || 0;

        const teacherRes = await db.query('SELECT COUNT(*) FROM teachers');
        totalTeachers = parseInt(teacherRes.rows[0].count, 10) || 0;

        const parentRes = await db.query('SELECT COUNT(*) FROM student_parents');
        totalParentAccounts = parseInt(parentRes.rows[0].count, 10) || 0;

        const sectionRes = await db.query('SELECT COUNT(*) FROM classes');
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
      },
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch system stats.' });
  }
}

module.exports = {
  getTeachers,
  createTeacher,
  getStudents,
  createStudent,
  batchImportCSV,
  verifyParentAccessCode,
  assignFaculty,
  getAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
  getSystemStats,
};
