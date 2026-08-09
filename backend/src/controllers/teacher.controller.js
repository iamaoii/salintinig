const db = require('../config/db.js');

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
      const tokenSchoolId = req.user?.schoolId || req.user?.school_id;
      if (tokenSchoolId) {
        const schoolRes = await db.query(
          `SELECT school_id FROM schools WHERE school_id = $1 LIMIT 1`,
          [tokenSchoolId]
        );
        if (schoolRes.rows?.[0]?.school_id) return schoolRes.rows[0].school_id;
      }

      if (req.user?.email) {
        const { rows } = await db.query(
          `SELECT school_id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
          [req.user.email]
        );
        if (rows?.[0]?.school_id) return rows[0].school_id;
      }

      const sRes = await db.query(`SELECT school_id FROM schools LIMIT 1`);
      if (sRes.rows?.[0]?.school_id) return sRes.rows[0].school_id;
    } catch (e) {}
  }
  return req.user?.schoolId || req.user?.school_id || null;
}

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
      console.log(`✅ Welcome email sent to ${toEmail}`);
    }
  } catch (err) {
    console.warn(`⚠️ Failed to send welcome email to ${toEmail}:`, err.message);
  }
}

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
        console.log(`[createTeacher] Resolved adminSchoolId: ${schoolId}`);
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

module.exports = {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  importTeachersCSV,
  getAccountRequests,
  approveAccountRequest,
  rejectAccountRequest,
};
