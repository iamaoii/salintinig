const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller.js');
const teacherController = require('../controllers/teacher.controller.js');
const studentController = require('../controllers/student.controller.js');
const { verifyToken, requireRole } = require('../middleware/auth.middleware.js');

// All teacher routes require a valid token
router.use(verifyToken);
router.use(requireRole('teacher'));

/**
 * GET /api/teacher/faculty/:id — Get teacher profile & classroom roster for teacher view
 */
router.get('/faculty/:id', teacherController.getTeacherById);

/**
 * GET /api/teacher/students/:lrn — Get student profile & Phil-IRI score history for teacher view
 */
router.get('/students/:lrn', studentController.getStudentByLrn);

/**
 * GET /api/teacher/grade-level
 * Returns sections, teachers, and students for the FIC teacher's grade level.
 */
router.get('/grade-level', async (req, res) => {
  const db = require('../config/db.js');
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;

    // Resolve teacher_id & verify FIC status
    const tRes = await db.query(
      `SELECT t.teacher_id, t.first_name, t.middle_name, t.last_name,
              fic.grade_level AS fic_grade_level
       FROM teachers t
       JOIN faculty_in_charge fic ON fic.teacher_id = t.teacher_id
       JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
       WHERE t.user_id = $1 AND fic.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (!tRes.rows || tRes.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not a Faculty In Charge for the active school year.' });
    }

    const { teacher_id: teacherId, fic_grade_level: gradeLevel, first_name, middle_name, last_name } = tRes.rows[0];
    const ficName = [first_name, middle_name, last_name].filter(Boolean).join(' ');

    // Get school_id from the teacher's user record
    const schoolRes = await db.query(`SELECT school_id FROM users WHERE user_id = $1 LIMIT 1`, [userId]);
    const schoolId = schoolRes.rows[0]?.school_id;

    // 1. Sections in this grade level
    const sectionsRes = await db.query(
      `SELECT
         c.class_id AS id,
         c.section_name AS "sectionName",
         c.grade_level AS "gradeLevel",
         c.advisor_teacher_id AS "advisorId",
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
       WHERE c.grade_level = $1 AND (c.school_id = $2 OR c.school_id IS NULL)
       GROUP BY c.class_id, c.section_name, c.grade_level, c.advisor_teacher_id, t.first_name, t.middle_name, t.last_name
       ORDER BY c.section_name ASC`,
      [gradeLevel, schoolId]
    );

    // 2. Teachers in this grade level (advisors of sections in the grade)
    const teachersRes = await db.query(
      `SELECT DISTINCT
         t.teacher_id AS id,
         t.teacher_no AS "employeeId",
         t.first_name AS "firstName",
         t.middle_name AS "middleName",
         t.last_name AS "lastName",
         CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name) AS name,
         COALESCE(u.email, '') AS email,
         c.section_name AS "sectionAssigned",
         c.class_id AS "classId",
         CASE WHEN u.status = 'disabled' THEN 'Disabled' ELSE 'Active' END AS status
       FROM teachers t
       JOIN classes c ON c.advisor_teacher_id = t.teacher_id
       JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
       LEFT JOIN users u ON t.user_id = u.user_id
       WHERE c.grade_level = $1 AND (c.school_id = $2 OR c.school_id IS NULL)
       ORDER BY t.last_name ASC`,
      [gradeLevel, schoolId]
    );

    // 3. All available teachers (for assignment dropdown)
    const allTeachersRes = await db.query(
      `SELECT
         t.teacher_id AS id,
         t.teacher_no AS "employeeId",
         CONCAT(t.first_name, ' ', COALESCE(t.middle_name || ' ', ''), t.last_name) AS name,
         COALESCE(u.email, '') AS email
       FROM teachers t
       LEFT JOIN users u ON t.user_id = u.user_id
       WHERE u.school_id = $1
       ORDER BY t.last_name ASC`,
      [schoolId]
    );

    // 4. Students in this grade level
    const studentsRes = await db.query(
      `SELECT
         s.student_id AS id,
         s.lrn,
         CONCAT(s.first_name, ' ', COALESCE(s.middle_name || ' ', ''), s.last_name) AS name,
         s.first_name AS "firstName",
         s.last_name AS "lastName",
         s.sex AS gender,
         s.profile_image AS "profileImage",
         c.section_name AS "sectionName",
         c.class_id AS "classId",
         COALESCE(rp.current_profile_label, a.reading_level_result, 'Pending') AS "readingLevel"
       FROM students s
       JOIN student_grade_history sgh ON sgh.student_id = s.student_id
       JOIN classes c ON sgh.class_id = c.class_id
       JOIN school_years sy ON c.school_year_id = sy.school_year_id AND sy.is_active = true
       LEFT JOIN reading_profiles rp ON rp.student_id = s.student_id
       LEFT JOIN (
         SELECT DISTINCT ON (student_id) student_id, reading_level_result
         FROM assessments
         WHERE reading_level_result IS NOT NULL
         ORDER BY student_id, created_at DESC
       ) a ON a.student_id = s.student_id
       WHERE c.grade_level = $1 AND (c.school_id = $2 OR c.school_id IS NULL)
       ORDER BY c.section_name ASC, s.last_name ASC`,
      [gradeLevel, schoolId]
    );

    return res.json({
      success: true,
      gradeLevel,
      ficName,
      sections: sectionsRes.rows || [],
      teachers: teachersRes.rows || [],
      allTeachers: allTeachersRes.rows || [],
      students: studentsRes.rows || [],
    });
  } catch (error) {
    console.error('Error fetching grade level overview:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch grade level data.' });
  }
});

/**
 * POST /api/teacher/grade-level/sections — FIC adds a new section in their grade
 */
router.post('/grade-level/sections', async (req, res) => {
  const db = require('../config/db.js');
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const { sectionName, adviserId } = req.body;

    if (!sectionName || !sectionName.trim()) {
      return res.status(400).json({ success: false, error: 'Section name is required.' });
    }

    const tRes = await db.query(
      `SELECT t.teacher_id, fic.grade_level
       FROM teachers t
       JOIN faculty_in_charge fic ON fic.teacher_id = t.teacher_id
       JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
       WHERE t.user_id = $1 AND fic.status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (!tRes.rows || tRes.rows.length === 0) {
      return res.status(403).json({ success: false, error: 'Not authorized.' });
    }

    const gradeLevel = tRes.rows[0].grade_level;
    const schoolRes = await db.query(`SELECT school_id FROM users WHERE user_id = $1 LIMIT 1`, [userId]);
    const schoolId = schoolRes.rows[0]?.school_id;
    const syRes = await db.query('SELECT school_year_id FROM school_years WHERE is_active = true LIMIT 1');
    const syId = syRes.rows[0]?.school_year_id;
    const cleanAdviserId = adviserId && adviserId !== 'none' ? adviserId : null;

    // Strict 1-to-1 constraint: Unassign teacher from any existing class first
    if (cleanAdviserId) {
      await db.query(
        `UPDATE classes SET advisor_teacher_id = NULL WHERE advisor_teacher_id::text = $1 OR advisor_teacher_id IN (SELECT teacher_id FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1)`,
        [String(cleanAdviserId)]
      );
    }

    await db.query(
      `INSERT INTO classes (school_id, school_year_id, grade_level, section_name, advisor_teacher_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [schoolId, syId, gradeLevel, sectionName.trim(), cleanAdviserId]
    );

    return res.status(201).json({ success: true, message: `Section "${sectionName.trim()}" created.` });
  } catch (error) {
    console.error('Error creating section (FIC):', error);
    return res.status(500).json({ success: false, error: 'Failed to create section.' });
  }
});

/**
 * PUT /api/teacher/grade-level/sections/:id — FIC updates a section (rename or reassign adviser)
 */
router.put('/grade-level/sections/:id', async (req, res) => {
  const db = require('../config/db.js');
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const { id } = req.params;
    const { sectionName, adviserId } = req.body;

    // Verify FIC owns this grade level
    const tRes = await db.query(
      `SELECT fic.grade_level FROM teachers t
       JOIN faculty_in_charge fic ON fic.teacher_id = t.teacher_id
       JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
       WHERE t.user_id = $1 AND fic.status = 'active' LIMIT 1`,
      [userId]
    );
    if (!tRes.rows || tRes.rows.length === 0) return res.status(403).json({ success: false, error: 'Not authorized.' });
    const gradeLevel = tRes.rows[0].grade_level;

    // Verify target section belongs to this grade level
    const secRes = await db.query(`SELECT class_id, grade_level FROM classes WHERE class_id::text = $1 LIMIT 1`, [id]);
    if (!secRes.rows || secRes.rows.length === 0 || secRes.rows[0].grade_level !== gradeLevel) {
      return res.status(403).json({ success: false, error: 'Section does not belong to your grade level.' });
    }

    const cleanAdviserId = adviserId && adviserId !== 'none' ? adviserId : null;

    // Strict 1-to-1 constraint: Unassign teacher from any existing class first
    if (cleanAdviserId) {
      await db.query(
        `UPDATE classes SET advisor_teacher_id = NULL WHERE (advisor_teacher_id::text = $1 OR advisor_teacher_id IN (SELECT teacher_id FROM teachers WHERE teacher_id::text = $1 OR teacher_no = $1)) AND class_id::text != $2`,
        [String(cleanAdviserId), String(id)]
      );
    }

    await db.query(
      `UPDATE classes
       SET section_name = COALESCE(NULLIF($1, ''), section_name),
           advisor_teacher_id = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE class_id::text = $3`,
      [sectionName?.trim() || null, cleanAdviserId, id]
    );

    return res.json({ success: true, message: 'Section updated.' });
  } catch (error) {
    console.error('Error updating section (FIC):', error);
    return res.status(500).json({ success: false, error: 'Failed to update section.' });
  }
});

/**
 * DELETE /api/teacher/grade-level/sections/:id — FIC deletes empty section only
 */
router.delete('/grade-level/sections/:id', async (req, res) => {
  const db = require('../config/db.js');
  try {
    const userId = req.user?.userId || req.user?.user_id || req.user?.id;
    const { id } = req.params;

    const tRes = await db.query(
      `SELECT fic.grade_level FROM teachers t
       JOIN faculty_in_charge fic ON fic.teacher_id = t.teacher_id
       JOIN school_years sy ON fic.school_year_id = sy.school_year_id AND sy.is_active = true
       WHERE t.user_id = $1 AND fic.status = 'active' LIMIT 1`,
      [userId]
    );
    if (!tRes.rows || tRes.rows.length === 0) return res.status(403).json({ success: false, error: 'Not authorized.' });
    const gradeLevel = tRes.rows[0].grade_level;

    // Verify section is in this grade level and has 0 students
    const secRes = await db.query(
      `SELECT c.class_id, c.grade_level, COUNT(sgh.student_id)::int AS student_count
       FROM classes c
       LEFT JOIN student_grade_history sgh ON sgh.class_id = c.class_id
       WHERE c.class_id::text = $1
       GROUP BY c.class_id, c.grade_level`,
      [id]
    );

    if (!secRes.rows || secRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Section not found.' });
    }
    if (secRes.rows[0].grade_level !== gradeLevel) {
      return res.status(403).json({ success: false, error: 'Section does not belong to your grade level.' });
    }
    if (secRes.rows[0].student_count > 0) {
      return res.status(400).json({ success: false, error: 'Cannot delete a section with enrolled students. Contact the admin.' });
    }

    await db.query(`DELETE FROM classes WHERE class_id::text = $1`, [id]);
    return res.json({ success: true, message: 'Section deleted.' });
  } catch (error) {
    console.error('Error deleting section (FIC):', error);
    return res.status(500).json({ success: false, error: 'Failed to delete section.' });
  }
});

module.exports = router;
