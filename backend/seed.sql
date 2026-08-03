-- =============================================================================
-- SalinTinig Complete Seed Data (Execute in Supabase SQL Editor AFTER schema.sql)
-- =============================================================================

-- 1. Seed Active School Year
INSERT INTO school_years (school_year, is_active)
VALUES ('2026-2027', true)
ON CONFLICT (school_year) DO NOTHING;

-- 2. Seed Default DepEd School Institutional Account (Mandaluyong Elementary School)
INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name)
VALUES ('109283', 'Mandaluyong Elementary School', 'Division of Mandaluyong', 'NCR', '109283@deped.gov.ph', 'Dr. Maria Santos')
ON CONFLICT (school_id) DO NOTHING;

-- 3. Seed Testing Admin Account (admin@gmail.com)
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'admin@gmail.com', 'password', 'admin', 'active', false)
ON CONFLICT (email) DO UPDATE SET password_hash = 'password';

-- 4. Seed Testing Teacher Account & Profile Record (teacher@gmail.com / EMP-2024-001)
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'teacher@gmail.com', 'password', 'teacher', 'active', false)
ON CONFLICT (email) DO UPDATE SET password_hash = 'password';

INSERT INTO teachers (user_id, school_id, teacher_no, first_name, middle_name, last_name, sex, contact_number)
SELECT user_id, school_id, 'EMP-2024-001', 'Gaile', 'Maria', 'Espinosa', 'Female', '+63 917 123 4567'
FROM users WHERE email = 'teacher@gmail.com'
ON CONFLICT (teacher_no) DO UPDATE SET school_id = '109283', first_name = 'Gaile', middle_name = 'Maria', last_name = 'Espinosa', sex = 'Female';

-- 5. Seed Default Class Sections (Grade 4, Grade 5, Grade 6)
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
ON CONFLICT DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 4', 'Kalapati' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 5', 'Agila' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 5', 'Sampaguita' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 6', 'Narra' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT DO NOTHING;

INSERT INTO classes (school_id, school_year_id, grade_level, section_name)
SELECT '109283', sy.school_year_id, 'Grade 6', 'Rizal' FROM school_years sy WHERE sy.school_year = '2026-2027'
ON CONFLICT DO NOTHING;

-- 6. Seed Faculty-in-Charge for Grade 4 (Scoped to School 109283)
INSERT INTO faculty_in_charge (school_id, teacher_id, school_year_id, grade_level, status)
SELECT '109283', t.teacher_id, sy.school_year_id, 'Grade 4', 'active'
FROM teachers t
CROSS JOIN school_years sy
WHERE t.teacher_no = 'EMP-2024-001' AND sy.school_year = '2026-2027'
ON CONFLICT DO NOTHING;

-- 7. Seed Initial System Notification (Scoped to School 109283)
INSERT INTO notifications (school_id, user_id, title, message, notification_type)
SELECT '109283', user_id, 'Welcome to SalinTinig Admin', 'System initialized for Mandaluyong Elementary School.', 'system'
FROM users WHERE email = 'admin@gmail.com'
ON CONFLICT DO NOTHING;

-- 8. Seed System Audit Log (Scoped to School 109283)
INSERT INTO audit_logs (school_id, user_id, action_type, details)
SELECT '109283', user_id, 'SYSTEM_INITIALIZATION', 'Database seeded with default school year 2026-2027 and initial class sections.'
FROM users WHERE email = 'admin@gmail.com'
ON CONFLICT DO NOTHING;
