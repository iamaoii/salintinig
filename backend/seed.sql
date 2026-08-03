-- =============================================================================
-- SalinTinig Seed Data (Execute in Supabase SQL Editor AFTER running schema.sql)
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

-- 4. Seed Testing Teacher Account (teacher@gmail.com)
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('109283', 'teacher@gmail.com', 'password', 'teacher', 'active', false)
ON CONFLICT (email) DO UPDATE SET password_hash = 'password';

-- 5. Seed Teacher Profile Record
INSERT INTO teachers (user_id, school_id, teacher_no, first_name, middle_name, last_name, contact_number)
SELECT user_id, school_id, 'EMP-2024-001', 'Gaile', 'Maria', 'Espinosa', '+63 917 123 4567'
FROM users WHERE email = 'teacher@gmail.com'
ON CONFLICT (teacher_no) DO NOTHING;

-- 6. Seed Default Class Sections (Grade 4, Grade 5, Grade 6)
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

-- 7. Seed Faculty-in-Charge for Grade 4
INSERT INTO faculty_in_charge (teacher_id, school_year_id, grade_level, status)
SELECT t.teacher_id, sy.school_year_id, 'Grade 4', 'active'
FROM teachers t
CROSS JOIN school_years sy
WHERE t.teacher_no = 'EMP-2024-001' AND sy.school_year = '2026-2027'
ON CONFLICT DO NOTHING;
