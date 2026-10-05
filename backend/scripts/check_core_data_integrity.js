require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const checks = [
  {
    name: 'students_without_user',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM students s
      LEFT JOIN users u ON u.user_id = s.user_id
      WHERE s.user_id IS NULL OR u.user_id IS NULL
    `,
  },
  {
    name: 'teachers_without_user',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM teachers t
      LEFT JOIN users u ON u.user_id = t.user_id
      WHERE t.user_id IS NULL OR u.user_id IS NULL
    `,
  },
  {
    name: 'student_class_school_mismatch',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM student_grade_history sgh
      JOIN students st ON st.student_id = sgh.student_id
      JOIN users u ON u.user_id = st.user_id
      JOIN classes c ON c.class_id = sgh.class_id
      WHERE u.school_id IS DISTINCT FROM c.school_id
    `,
  },
  {
    name: 'student_history_class_year_mismatch',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM student_grade_history sgh
      JOIN classes c ON c.class_id = sgh.class_id
      WHERE sgh.school_year_id IS DISTINCT FROM c.school_year_id
    `,
  },
  {
    name: 'classes_missing_school_or_year',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM classes
      WHERE school_id IS NULL OR school_year_id IS NULL
    `,
  },
  {
    name: 'schools_without_active_year',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM schools s
      WHERE NOT EXISTS (
        SELECT 1 FROM school_years sy
        WHERE sy.school_id = s.school_id AND sy.is_active = true
      )
    `,
  },
  {
    name: 'schools_with_multiple_active_years',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM (
        SELECT school_id
        FROM school_years
        WHERE is_active = true
        GROUP BY school_id
        HAVING COUNT(*) > 1
      ) dup
    `,
  },
  {
    name: 'assessments_without_attempt_for_completed_status',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM assessments a
      LEFT JOIN assessment_attempts aa ON aa.assessment_id = a.assessment_id
      WHERE LOWER(COALESCE(a.status, '')) = 'completed'
        AND aa.assessment_id IS NULL
    `,
  },
  {
    name: 'in_progress_adaptive_sessions_without_assessments',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM phil_iri_adaptive_sessions s
      WHERE LOWER(COALESCE(s.status, '')) = 'in_progress'
        AND NOT EXISTS (
          SELECT 1 FROM assessments a
          WHERE a.adaptive_session_id = s.session_id
        )
    `,
  },
  {
    name: 'parent_links_without_access_code',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM student_parents
      WHERE NULLIF(TRIM(access_code), '') IS NULL
    `,
  },
  {
    name: 'active_parent_links_without_student_or_parent',
    sql: `
      SELECT COUNT(*)::int AS count
      FROM student_parents sp
      LEFT JOIN students s ON s.student_id = sp.student_id
      LEFT JOIN parents p ON p.parent_id = sp.parent_id
      WHERE COALESCE(sp.is_active, true) = true
        AND (s.student_id IS NULL OR sp.parent_id IS NULL OR p.parent_id IS NULL)
    `,
  },
  {
    name: 'activity_attempts_without_student',
    sql: `
      SELECT SUM(count)::int AS count
      FROM (
        SELECT COUNT(*)::int AS count
        FROM vocabulary_attempts va
        LEFT JOIN students s ON s.student_id = va.student_id
        WHERE s.student_id IS NULL
        UNION ALL
        SELECT COUNT(*)::int
        FROM sentence_attempts sa
        LEFT JOIN students s ON s.student_id = sa.student_id
        WHERE s.student_id IS NULL
        UNION ALL
        SELECT COUNT(*)::int
        FROM pronunciation_attempts pa
        LEFT JOIN students s ON s.student_id = pa.student_id
        WHERE s.student_id IS NULL
      ) counts
    `,
  },
];

async function main() {
  const results = [];

  for (const check of checks) {
    try {
      const { rows } = await pool.query(check.sql);
      const count = Number(rows[0]?.count || 0);
      results.push({
        check: check.name,
        count,
        status: count === 0 ? 'ok' : 'needs_review',
      });
    } catch (error) {
      results.push({
        check: check.name,
        count: null,
        status: 'error',
        error: error.message,
      });
    }
  }

  console.table(results);

  const failures = results.filter((row) => row.status !== 'ok');
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
