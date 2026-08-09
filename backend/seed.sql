-- =============================================================================
-- SalinTinig Complete Seed Data (Execute in Supabase / PostgreSQL SQL Editor AFTER schema.sql)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SEED ACTIVE ACADEMIC SCHOOL YEAR
-- -----------------------------------------------------------------------------
INSERT INTO school_years (school_year, is_active)
VALUES ('2026-2027', true)
ON CONFLICT (school_year) DO UPDATE SET is_active = EXCLUDED.is_active;

-- -----------------------------------------------------------------------------
-- 2. SEED DEFAULT DEPED SCHOOL INSTITUTIONAL ACCOUNT
-- -----------------------------------------------------------------------------
INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name)
VALUES (
    '109283',
    'Mandaluyong Elementary School',
    'Division of Mandaluyong',
    'NCR',
    '109283@deped.gov.ph',
    'Dr. Maria Santos'
)
ON CONFLICT (school_id) DO UPDATE SET 
    school_name = EXCLUDED.school_name,
    division = EXCLUDED.division,
    region = EXCLUDED.region,
    official_email = EXCLUDED.official_email,
    principal_name = EXCLUDED.principal_name;

-- -----------------------------------------------------------------------------
-- 3. SEED ADMINISTRATOR & TEACHER USER ACCOUNTS
-- -----------------------------------------------------------------------------
-- Testing Admin Account (admin@gmail.com / password)
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'admin@gmail.com', 'password', 'admin', 'active', false)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    school_id = EXCLUDED.school_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- Testing Teacher Account (teacher@gmail.com / password)
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'teacher@gmail.com', 'password', 'teacher', 'active', false)
ON CONFLICT (email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    school_id = EXCLUDED.school_id,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- -----------------------------------------------------------------------------
-- 4. SEED TEACHER PROFILE RECORD
-- -----------------------------------------------------------------------------
INSERT INTO teachers (user_id, teacher_no, first_name, middle_name, last_name, sex)
SELECT 
    user_id, 
    'EMP-2024-001', 
    'Gaile', 
    'Maria', 
    'Espinosa', 
    'Female'
FROM users 
WHERE email = 'teacher@gmail.com'
ON CONFLICT (teacher_no) DO UPDATE SET 
    first_name = EXCLUDED.first_name, 
    middle_name = EXCLUDED.middle_name, 
    last_name = EXCLUDED.last_name, 
    sex = EXCLUDED.sex;

-- -----------------------------------------------------------------------------
-- 5. SEED CLASS SECTIONS (Grade 4, Grade 5, Grade 6)
-- -----------------------------------------------------------------------------
-- Grade 4 - Fyang (Assigned to Adviser Gaile Espinosa)
INSERT INTO classes (school_id, school_year_id, advisor_teacher_id, grade_level, section_name)
SELECT 
    '109283',
    sy.school_year_id,
    t.teacher_id,
    'Grade 4',
    'Fyang'
FROM school_years sy
CROSS JOIN teachers t
WHERE sy.school_year = '2026-2027' AND t.teacher_no = 'EMP-2024-001'
ON CONFLICT (school_id, school_year_id, grade_level, section_name) DO UPDATE SET advisor_teacher_id = EXCLUDED.advisor_teacher_id;

-- Additional Sections
INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 4', 'Kalapati' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT (school_id, school_year_id, grade_level, section_name) DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 5', 'Agila' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT (school_id, school_year_id, grade_level, section_name) DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 5', 'Sampaguita' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT (school_id, school_year_id, grade_level, section_name) DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 6', 'Narra' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT (school_id, school_year_id, grade_level, section_name) DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 6', 'Rizal' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT (school_id, school_year_id, grade_level, section_name) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. SEED FACULTY-IN-CHARGE SUPERVISORS
-- -----------------------------------------------------------------------------
INSERT INTO faculty_in_charge (school_id, teacher_id, school_year_id, grade_level, status)
SELECT 
    '109283', 
    t.teacher_id, 
    sy.school_year_id, 
    'Grade 4', 
    'active'
FROM teachers t
CROSS JOIN school_years sy
WHERE t.teacher_no = 'EMP-2024-001' AND sy.school_year = '2026-2027'
ON CONFLICT (school_id, school_year_id, grade_level) DO UPDATE SET teacher_id = EXCLUDED.teacher_id, status = 'active';

-- -----------------------------------------------------------------------------
-- 7. SEED SAMPLE STUDENT ACCOUNTS & ENROLLMENT
-- -----------------------------------------------------------------------------
-- Student 1: Adrian Alonzo (LRN: 136670100091) — Independent
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'adrian.alonzo@student.deped.gov.ph', 'password', 'student', 'active', false)
ON CONFLICT (email) DO UPDATE SET status = 'active';

INSERT INTO students (user_id, lrn, first_name, middle_name, last_name, sex)
SELECT user_id, '136670100091', 'Adrian', 'Santos', 'Alonzo', 'Male'
FROM users WHERE email = 'adrian.alonzo@student.deped.gov.ph'
ON CONFLICT (lrn) DO UPDATE SET first_name = 'Adrian', last_name = 'Alonzo';

INSERT INTO student_grade_history (student_id, class_id, promotion_status)
SELECT s.student_id, c.class_id, 'active'
FROM students s
CROSS JOIN classes c
WHERE s.lrn = '136670100091' AND c.grade_level = 'Grade 4' AND c.section_name = 'Fyang'
ON CONFLICT (student_id, class_id) DO UPDATE SET promotion_status = 'active';

INSERT INTO parents (parent_name, email)
VALUES ('Mr./Mrs. Alonzo', 'parent.136670100091@gmail.com')
ON CONFLICT (email) DO UPDATE SET parent_name = EXCLUDED.parent_name;

INSERT INTO student_parents (student_id, parent_id, access_code, is_active)
SELECT s.student_id, p.parent_id, 'PAC-00091', true
FROM students s, parents p
WHERE s.lrn = '136670100091' AND p.email = 'parent.136670100091@gmail.com'
ON CONFLICT (access_code) DO UPDATE SET is_active = true;

INSERT INTO reading_profiles (student_id, reading_speed_wpm, comprehension_level, fluency_level, current_profile_label)
SELECT student_id, 110, 'Excellent', 'Fluent', 'Independent'
FROM students WHERE lrn = '136670100091'
ON CONFLICT DO NOTHING;

-- Student 2: Janna Cruz (LRN: 136670100092) — Instructional
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'janna.cruz@student.deped.gov.ph', 'password', 'student', 'active', false)
ON CONFLICT (email) DO UPDATE SET status = 'active';

INSERT INTO students (user_id, lrn, first_name, middle_name, last_name, sex)
SELECT user_id, '136670100092', 'Janna', 'Reyes', 'Cruz', 'Female'
FROM users WHERE email = 'janna.cruz@student.deped.gov.ph'
ON CONFLICT (lrn) DO UPDATE SET first_name = 'Janna', last_name = 'Cruz';

INSERT INTO student_grade_history (student_id, class_id, promotion_status)
SELECT s.student_id, c.class_id, 'active'
FROM students s
CROSS JOIN classes c
WHERE s.lrn = '136670100092' AND c.grade_level = 'Grade 4' AND c.section_name = 'Fyang'
ON CONFLICT (student_id, class_id) DO UPDATE SET promotion_status = 'active';

INSERT INTO parents (parent_name, email)
VALUES ('Mr./Mrs. Cruz', 'parent.136670100092@gmail.com')
ON CONFLICT (email) DO UPDATE SET parent_name = EXCLUDED.parent_name;

INSERT INTO student_parents (student_id, parent_id, access_code, is_active)
SELECT s.student_id, p.parent_id, 'PAC-00092', true
FROM students s, parents p
WHERE s.lrn = '136670100092' AND p.email = 'parent.136670100092@gmail.com'
ON CONFLICT (access_code) DO UPDATE SET is_active = true;

INSERT INTO reading_profiles (student_id, reading_speed_wpm, comprehension_level, fluency_level, current_profile_label)
SELECT student_id, 85, 'Moderate', 'Developing', 'Instructional'
FROM students WHERE lrn = '136670100092'
ON CONFLICT DO NOTHING;

-- Student 3: Charlie Dizon (LRN: 136670100093) — Frustrational
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'charlie.dizon@student.deped.gov.ph', 'password', 'student', 'active', false)
ON CONFLICT (email) DO UPDATE SET status = 'active';

INSERT INTO students (user_id, lrn, first_name, middle_name, last_name, sex)
SELECT user_id, '136670100093', 'Charlie', 'Mendoza', 'Dizon', 'Male'
FROM users WHERE email = 'charlie.dizon@student.deped.gov.ph'
ON CONFLICT (lrn) DO UPDATE SET first_name = 'Charlie', last_name = 'Dizon';

INSERT INTO student_grade_history (student_id, class_id, promotion_status)
SELECT s.student_id, c.class_id, 'active'
FROM students s
CROSS JOIN classes c
WHERE s.lrn = '136670100093' AND c.grade_level = 'Grade 4' AND c.section_name = 'Fyang'
ON CONFLICT (student_id, class_id) DO UPDATE SET promotion_status = 'active';

INSERT INTO parents (parent_name, email)
VALUES ('Mr./Mrs. Dizon', 'parent.136670100093@gmail.com')
ON CONFLICT (email) DO UPDATE SET parent_name = EXCLUDED.parent_name;

INSERT INTO student_parents (student_id, parent_id, access_code, is_active)
SELECT s.student_id, p.parent_id, 'PAC-00093', true
FROM students s, parents p
WHERE s.lrn = '136670100093' AND p.email = 'parent.136670100093@gmail.com'
ON CONFLICT (access_code) DO UPDATE SET is_active = true;

INSERT INTO reading_profiles (student_id, reading_speed_wpm, comprehension_level, fluency_level, current_profile_label)
SELECT student_id, 42, 'Needs Support', 'Emerging', 'Frustrational'
FROM students WHERE lrn = '136670100093'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 8. SEED SYSTEM BADGES
-- -----------------------------------------------------------------------------
INSERT INTO badges (badge_name, description, criteria_type, criteria_value)
VALUES 
    ('10-Day Streak', 'Achieved a 10-day consecutive reading streak.', 'streak', '10'),
    ('Sipag at Talino', 'Completed 5 oral reading assessments with 90%+ score.', 'assessment_count', '5'),
    ('Maaga Nagsimula', 'Completed early bird reading task on time.', 'early_bird', '1'),
    ('Ganda at Talino', 'Achieved Independent reading status in Phil-IRI.', 'reading_level', 'Independent')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 9. SEED INITIAL SYSTEM NOTIFICATIONS
-- -----------------------------------------------------------------------------
INSERT INTO notifications (school_id, user_id, title, message, notification_type)
SELECT '109283', user_id, 'Welcome to SalinTinig Admin', 'System initialized for Mandaluyong Elementary School (S.Y. 2026-2027).', 'system'
FROM users WHERE email = 'admin@gmail.com'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 10. SEED SYSTEM AUDIT LOGS
-- -----------------------------------------------------------------------------
INSERT INTO audit_logs (school_id, user_id, action_type, details)
SELECT '109283', user_id, 'SYSTEM_INITIALIZATION', 'Database seeded with default school year 2026-2027, initial class sections, and sample accounts.'
FROM users WHERE email = 'admin@gmail.com'
ON CONFLICT DO NOTHING;
