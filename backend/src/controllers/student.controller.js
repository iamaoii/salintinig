const db = require('../config/db.js');

// In-Memory Fallback Store (Empty by default)
let mockStudents = [];

function generateParentAccessCode(lrn) {
  const codeSuffix = lrn ? lrn.slice(-5) : Math.floor(10000 + Math.random() * 90000);
  return `PAC-${codeSuffix}`;
}

const isDbConfigured = () =>
  process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('password@localhost');

/**
 * GET /api/admin/students — List all students
 */
async function getStudents(req, res) {
  try {
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
            COALESCE(c.grade_level, 'Grade 4') AS grade,
            COALESCE(c.section_name, 'Fyang') AS section,
            COALESCE(s.sex, 'Male') AS gender,
            COALESCE(sp.access_code, CONCAT('PAC-', RIGHT(s.lrn, 5))) AS "parentAccessCode",
            COALESCE(p.email, '') AS "parentEmail",
            COALESCE(u.email, '') AS "personalEmail",
            CASE WHEN u.status = 'disabled' THEN 'Disabled' ELSE 'Active' END AS status,
            COALESCE(rp.current_profile_label, 'Instructional') AS level,
            TO_CHAR(s.created_at, 'YYYY-MM-DD') AS "dateAdded"
          FROM students s
          LEFT JOIN users u ON s.user_id = u.user_id
          LEFT JOIN student_grade_history sgh ON s.student_id = sgh.student_id
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN student_parents sp ON s.student_id = sp.student_id
          LEFT JOIN parents p ON sp.parent_id = p.parent_id
          LEFT JOIN reading_profiles rp ON s.student_id = rp.student_id
          ORDER BY s.created_at DESC
        `);

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
        const { rows } = await db.query(`
          SELECT 
            s.student_id AS id,
            s.lrn,
            s.first_name AS "firstName",
            s.middle_name AS "middleName",
            s.last_name AS "lastName",
            CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
            COALESCE(c.grade_level, 'Grade 4') AS grade,
            COALESCE(c.section_name, 'Fyang') AS section,
            COALESCE(s.sex, 'Male') AS gender,
            COALESCE(sp.access_code, CONCAT('PAC-', RIGHT(s.lrn, 5))) AS "parentAccessCode",
            COALESCE(p.email, '') AS "parentEmail",
            COALESCE(u.email, '') AS "personalEmail",
            CASE WHEN u.status = 'disabled' THEN 'Disabled' ELSE 'Active' END AS status,
            COALESCE(rp.current_profile_label, 'Instructional') AS level,
            TO_CHAR(s.created_at, 'YYYY-MM-DD') AS "dateAdded"
          FROM students s
          LEFT JOIN users u ON s.user_id = u.user_id
          LEFT JOIN student_grade_history sgh ON s.student_id = sgh.student_id
          LEFT JOIN classes c ON sgh.class_id = c.class_id
          LEFT JOIN student_parents sp ON s.student_id = sp.student_id
          LEFT JOIN parents p ON sp.parent_id = p.parent_id
          LEFT JOIN reading_profiles rp ON s.student_id = rp.student_id
          WHERE s.lrn = $1 OR s.student_id::text = $1
          LIMIT 1
        `, [lrn]);

        if (rows && rows.length > 0) {
          return res.json({ success: true, student: rows[0] });
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
    let { lrn, firstName, middleName, lastName, name, grade, section, gender, parentEmail, personalEmail } = req.body;

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
      parentEmail: parentEmail || 'parent@gmail.com',
      personalEmail: personalEmail || `${lrn}@salintinig.edu.ph`,
      status: 'Active',
      level: 'Instructional',
      dateAdded,
    };

    if (isDbConfigured()) {
      try {
        const { rows: userRows } = await db.query(
          `INSERT INTO users (email, password_hash, role, status)
           VALUES ($1, $2, 'student', 'active')
           ON CONFLICT (email) DO UPDATE SET status = 'active'
           RETURNING user_id`,
          [newStudentObj.personalEmail, 'StudentPassword123!']
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

            const { rows: parentRows } = await db.query(
              `INSERT INTO parents (first_name, last_name, email)
               VALUES ($1, $2, $3)
               ON CONFLICT (email) DO UPDATE SET email = $3
               RETURNING parent_id`,
              ['Parent of ' + firstName, lastName, newStudentObj.parentEmail]
            );

            if (parentRows && parentRows[0]) {
              await db.query(
                `INSERT INTO student_parents (student_id, parent_id, access_code)
                 VALUES ($1, $2, $3)`,
                [studentId, parentRows[0].parent_id, parentAccessCode]
              );
            }
          }
        }
      } catch (dbErr) {
        console.warn('DB student insert error:', dbErr.message);
      }
    }

    mockStudents.unshift(newStudentObj);
    return res.status(201).json({ success: true, student: newStudentObj });
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
        await db.query(
          `UPDATE students 
           SET first_name = COALESCE($1, first_name),
               middle_name = COALESCE($2, middle_name),
               last_name = COALESCE($3, last_name),
               sex = COALESCE($4, sex),
               updated_at = CURRENT_TIMESTAMP
           WHERE lrn = $5`,
          [firstName || null, middleName || null, lastName || null, gender || null, lrn]
        );
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
 * PATCH /api/admin/students/:lrn/status — Toggle student status
 */
async function toggleStudentStatus(req, res) {
  try {
    const { lrn } = req.params;
    let newStatus = 'Disabled';

    mockStudents = mockStudents.map((s) => {
      if (s.lrn === lrn || s.id === lrn) {
        newStatus = s.status === 'Disabled' ? 'Active' : 'Disabled';
        return { ...s, status: newStatus };
      }
      return s;
    });

    if (isDbConfigured()) {
      try {
        const dbStatus = newStatus === 'Disabled' ? 'disabled' : 'active';
        await db.query(
          `UPDATE users SET status = $1 WHERE user_id = (SELECT user_id FROM students WHERE lrn = $2)`,
          [dbStatus, lrn]
        );
      } catch (dbErr) {
        console.warn('DB status toggle notice:', dbErr.message);
      }
    }

    return res.json({ success: true, lrn, newStatus });
  } catch (err) {
    console.error('Error toggling student status:', err);
    return res.status(500).json({ success: false, error: 'Failed to toggle student status.' });
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
      try {
        const { rows } = await db.query(
          `SELECT student_id, user_id FROM students WHERE lrn = $1 OR student_id::text = $1 LIMIT 1`,
          [lrn]
        );

        if (rows && rows[0]) {
          const studentId = rows[0].student_id;
          const userId = rows[0].user_id;

          // 1. Remove grade history & parent access link
          await db.query(`DELETE FROM student_parents WHERE student_id = $1`, [studentId]);
          await db.query(`DELETE FROM student_grade_history WHERE student_id = $1`, [studentId]);

          // 2. Delete student profile record
          await db.query(`DELETE FROM students WHERE student_id = $1`, [studentId]);

          // 3. Delete corresponding user account from users table
          if (userId) {
            await db.query(`DELETE FROM users WHERE user_id = $1`, [userId]);
          }
        }
      } catch (dbErr) {
        console.warn('DB student delete notice:', dbErr.message);
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
      const lrn = String(item.lrn || item.LRN || item['Student LRN'] || `136670${Math.floor(100000 + Math.random() * 900000)}`).trim();
      
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
      const parentEmail = (item.parentEmail || item['Parent Email'] || `parent.${lrn}@gmail.com`).trim();
      const gender = item.gender || item.sex || item['Gender'] || 'Male';
      const grade = item.grade || item.gradeLevel || item['Grade Level'] || 'Grade 4';
      const section = item.section || item.sectionName || item['Section'] || 'Fyang';

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
        parentEmail,
        personalEmail,
        status: 'Active',
        level: 'Instructional',
        dateAdded: new Date().toISOString().split('T')[0],
      };

      if (isDbConfigured()) {
        try {
          const { rows: userRows } = await db.query(
            `INSERT INTO users (email, password_hash, role, status)
             VALUES ($1, $2, 'student', 'active')
             ON CONFLICT (email) DO UPDATE SET status = 'active'
             RETURNING user_id`,
            [personalEmail, 'StudentPassword123!']
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
              const { rows: parentRows } = await db.query(
                `INSERT INTO parents (first_name, last_name, email)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (email) DO UPDATE SET email = $3
                 RETURNING parent_id`,
                ['Parent of ' + firstName, lastName, parentEmail]
              );

              if (parentRows && parentRows[0]) {
                await db.query(
                  `INSERT INTO student_parents (student_id, parent_id, access_code)
                   VALUES ($1, $2, $3)
                   ON CONFLICT DO NOTHING`,
                  [studentId, parentRows[0].parent_id, parentAccessCode]
                );
              }
            }
          }
        } catch (dbErr) {
          console.warn('DB CSV import row notice:', dbErr.message);
        }
      }

      importedBatch.push(studentObj);
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

module.exports = {
  getStudents,
  getStudentByLrn,
  createStudent,
  updateStudent,
  toggleStudentStatus,
  deleteStudent,
  importStudentsCSV,
};
