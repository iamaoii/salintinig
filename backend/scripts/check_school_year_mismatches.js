require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const { rows } = await pool.query(
    `SELECT
       su.school_id AS student_school_id,
       ss.school_name AS student_school,
       c.school_id AS class_school_id,
       cs.school_name AS class_school,
       sgh.school_year_id AS history_school_year_id,
       hsy.school_year AS history_school_year,
       c.school_year_id AS class_school_year_id,
       csy.school_year AS class_school_year,
       COUNT(*)::int AS affected_students
     FROM student_grade_history sgh
     JOIN students st ON st.student_id = sgh.student_id
     JOIN users su ON su.user_id = st.user_id
     LEFT JOIN schools ss ON ss.school_id = su.school_id
     LEFT JOIN classes c ON c.class_id = sgh.class_id
     LEFT JOIN schools cs ON cs.school_id = c.school_id
     LEFT JOIN school_years hsy ON hsy.school_year_id = sgh.school_year_id
     LEFT JOIN school_years csy ON csy.school_year_id = c.school_year_id
     WHERE c.class_id IS NOT NULL
       AND (
         sgh.school_year_id IS DISTINCT FROM c.school_year_id
         OR su.school_id IS DISTINCT FROM c.school_id
       )
     GROUP BY su.school_id, ss.school_name, c.school_id, cs.school_name,
              sgh.school_year_id, hsy.school_year, c.school_year_id, csy.school_year
     ORDER BY affected_students DESC, student_school, class_school`
  );

  if (!rows.length) {
    console.log('No student/class school-year mismatches found.');
    return;
  }

  console.table(rows);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
