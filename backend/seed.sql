-- =============================================================================
-- SalinTinig Seed Data (Execute in Supabase SQL Editor AFTER running schema.sql)
-- =============================================================================

-- 1. Seed Initial Active School Year
INSERT INTO school_years (school_year, is_active)
VALUES ('2026-2027', true)
ON CONFLICT DO NOTHING;

-- 2. Seed Official DepEd School Institutional Account (Mandaluyong Elementary School)
INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name)
VALUES ('136660','Mandaluyong Elementary School','Mandaluyong City','NCR','admin@gmail.com','Dr. Jocelyn N. Tamayo')
ON CONFLICT (school_id) DO NOTHING;

-- 3. Seed Testing Admin Account (admin@gmail.com) FOR DEMO
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('136660', 'admin@gmail.com', 'password', 'admin', 'active', false)
ON CONFLICT (email) DO NOTHING;

-- 4. Seed Teacher User Account (teacher@gmail.com) FOR DEMO
INSERT INTO users (school_id, email, password_hash, role, status, must_change_password)
VALUES ('136660', 'teacher@gmail.com', 'password', 'teacher', 'active', false)
ON CONFLICT (email) DO NOTHING;

-- 5. Seed Teacher Profile Record
INSERT INTO teachers (user_id, school_id, teacher_no, first_name, middle_name, last_name, contact_number)
SELECT user_id, school_id, 'EMP-2024-001', 'Antoinette', '', 'Jadaone', '+63 917 123 4567'
FROM users WHERE email = 'teacher@gmail.com'
ON CONFLICT (teacher_no) DO NOTHING;
