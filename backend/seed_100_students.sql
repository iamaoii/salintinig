-- =============================================================================
-- SalinTinig 100 Students Seed Script for Supabase / PostgreSQL
-- =============================================================================

DO $$
DECLARE
    v_school_id VARCHAR := '109283';
    v_sy_id UUID;
    v_class_g4_fyang UUID;
    v_class_g4_kalapati UUID;
    v_class_g5_agila UUID;
    v_class_g6_narra UUID;
    
    v_user_id UUID;
    v_student_id UUID;
    v_parent_id UUID;
    
    v_lrn VARCHAR;
    v_first_name VARCHAR;
    v_last_name VARCHAR;
    v_sex VARCHAR;
    v_email VARCHAR;
    v_parent_email VARCHAR;
    v_pac VARCHAR;
    v_class_id UUID;
    v_profile VARCHAR;
    v_status VARCHAR;
    
    first_names_m TEXT[] := ARRAY[
        'Adrian', 'Mateo', 'Lucas', 'Juan', 'Pedro', 'Joshua', 'Angelo', 'Gabriel', 'Daniel', 'Miguel', 
        'Ethan', 'Alexander', 'James', 'John', 'Justine', 'Kenneth', 'Kyle', 'Nathaniel', 'Paolo', 'Rafael', 
        'Santino', 'Tristan', 'Vincent', 'Xavier', 'Aaron', 'Carl', 'Diego', 'Enzo', 'Francis', 'Gerald', 
        'Ian', 'Jacob', 'Karl', 'Lance', 'Nico', 'Oliver', 'Renzo', 'Sam', 'Vince', 'Zoren', 
        'Benedict', 'Dominic', 'Gino', 'Harvey', 'Ivan', 'Joel', 'Kristoff', 'Lester', 'Marco', 'Noel'
    ];
    
    first_names_f TEXT[] := ARRAY[
        'Janna', 'Sofia', 'Maria', 'Ana', 'Samantha', 'Bea', 'Chloe', 'Princess', 'Angel', 'Andrea', 
        'Nicole', 'Hannah', 'Alyson', 'Beatrice', 'Camille', 'Denise', 'Ella', 'Faith', 'Grace', 'Hazel', 
        'Isabel', 'Julia', 'Kayla', 'Luisa', 'Mia', 'Natalie', 'Patricia', 'Rachelle', 'Stephanie', 'Trisha', 
        'Vanessa', 'Wendy', 'Yasmin', 'Zoe', 'Bianca', 'Cheska', 'Diane', 'Erika', 'Fiona', 'Janelle', 
        'Kyla', 'Rica', 'Sarah', 'Tania', 'Aaliyah', 'Bernadette', 'Clarisse', 'Daphne', 'Elaine', 'Giselle'
    ];
    
    last_names TEXT[] := ARRAY[
        'Cruz', 'Santos', 'Reyes', 'Garcia', 'Mendoza', 'Ramos', 'Flores', 'Gonzales', 'Bautista', 'Villanueva', 
        'Fernandez', 'De Guzman', 'Aquino', 'Torres', 'Navarro', 'Castaneda', 'Del Rosario', 'Santiago', 'Soriano', 'Perez', 
        'Mercado', 'Castillo', 'Salazar', 'Morales', 'Rivera', 'Valenzuela', 'Cordero', 'Domingo', 'Dela Cruz', 'Tolentino', 
        'Manalo', 'Serrano', 'Velasco', 'Pineda', 'Castro', 'Corpuz', 'Ocampo', 'Aguilar', 'Padilla', 'Vergara'
    ];
    
    profiles TEXT[] := ARRAY['Instructional', 'Independent', 'Frustrational'];
    
    i INT;
BEGIN
    -- 1. Ensure Default School exists
    INSERT INTO schools (school_id, school_name, division, region, official_email, principal_name)
    VALUES (v_school_id, 'Mandaluyong Elementary School', 'Division of Mandaluyong', 'NCR', '109283@deped.gov.ph', 'Dr. Maria Santos')
    ON CONFLICT (school_id) DO NOTHING;

    -- 2. Ensure Active School Year exists
    SELECT school_year_id INTO v_sy_id FROM school_years WHERE school_year = '2026-2027' LIMIT 1;
    IF v_sy_id IS NULL THEN
        INSERT INTO school_years (school_year, is_active) VALUES ('2026-2027', true) RETURNING school_year_id INTO v_sy_id;
    END IF;

    -- 3. Ensure Classes exist
    SELECT class_id INTO v_class_g4_fyang FROM classes WHERE grade_level = 'Grade 4' AND section_name = 'Fyang' LIMIT 1;
    IF v_class_g4_fyang IS NULL THEN
        INSERT INTO classes (school_id, school_year_id, grade_level, section_name) VALUES (v_school_id, v_sy_id, 'Grade 4', 'Fyang') RETURNING class_id INTO v_class_g4_fyang;
    END IF;

    SELECT class_id INTO v_class_g4_kalapati FROM classes WHERE grade_level = 'Grade 4' AND section_name = 'Kalapati' LIMIT 1;
    IF v_class_g4_kalapati IS NULL THEN
        INSERT INTO classes (school_id, school_year_id, grade_level, section_name) VALUES (v_school_id, v_sy_id, 'Grade 4', 'Kalapati') RETURNING class_id INTO v_class_g4_kalapati;
    END IF;

    SELECT class_id INTO v_class_g5_agila FROM classes WHERE grade_level = 'Grade 5' AND section_name = 'Agila' LIMIT 1;
    IF v_class_g5_agila IS NULL THEN
        INSERT INTO classes (school_id, school_year_id, grade_level, section_name) VALUES (v_school_id, v_sy_id, 'Grade 5', 'Agila') RETURNING class_id INTO v_class_g5_agila;
    END IF;

    SELECT class_id INTO v_class_g6_narra FROM classes WHERE grade_level = 'Grade 6' AND section_name = 'Narra' LIMIT 1;
    IF v_class_g6_narra IS NULL THEN
        INSERT INTO classes (school_id, school_year_id, grade_level, section_name) VALUES (v_school_id, v_sy_id, 'Grade 6', 'Narra') RETURNING class_id INTO v_class_g6_narra;
    END IF;

    -- 4. Generate 100 Students
    FOR i IN 1..100 LOOP
        v_lrn := (136670100000 + i)::TEXT;
        v_last_name := last_names[1 + ((i * 7) % array_length(last_names, 1))];

        IF (i % 2 = 1) THEN
            v_sex := 'Male';
            v_first_name := first_names_m[1 + ((i * 3) % array_length(first_names_m, 1))];
        ELSE
            v_sex := 'Female';
            v_first_name := first_names_f[1 + ((i * 5) % array_length(first_names_f, 1))];
        END IF;

        v_email := LOWER(v_first_name || '.' || v_last_name || i || '@salintinig.edu.ph');
        v_email := REPLACE(v_email, ' ', '');
        v_parent_email := LOWER('parent.' || v_last_name || i || '@gmail.com');
        v_parent_email := REPLACE(v_parent_email, ' ', '');
        v_pac := 'PAC-' || LPAD(((10000 + i * 37) % 89999 + 10000)::TEXT, 5, '0');
        v_profile := profiles[1 + (i % array_length(profiles, 1))];
        v_status := CASE WHEN (i % 15 = 0) THEN 'disabled' ELSE 'active' END;

        -- Assign class
        CASE (i % 4)
            WHEN 0 THEN v_class_id := v_class_g4_fyang;
            WHEN 1 THEN v_class_id := v_class_g4_kalapati;
            WHEN 2 THEN v_class_id := v_class_g5_agila;
            ELSE v_class_id := v_class_g6_narra;
        END CASE;

        -- Insert user
        INSERT INTO users (school_id, email, password_hash, role, status)
        VALUES (v_school_id, v_email, '$2b$10$e8T.W2bO9zL4x...mock', 'student', v_status)
        ON CONFLICT (email) DO UPDATE SET status = EXCLUDED.status
        RETURNING user_id INTO v_user_id;

        -- Insert student
        INSERT INTO students (user_id, lrn, first_name, last_name, sex)
        VALUES (v_user_id, v_lrn, v_first_name, v_last_name, v_sex)
        ON CONFLICT (lrn) DO UPDATE SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name
        RETURNING student_id INTO v_student_id;

        -- Insert parent
        INSERT INTO parents (first_name, last_name, email)
        VALUES ('Parent of ' || v_first_name, v_last_name, v_parent_email)
        ON CONFLICT (email) DO UPDATE SET last_name = EXCLUDED.last_name
        RETURNING parent_id INTO v_parent_id;

        -- Insert student_parent link
        INSERT INTO student_parents (student_id, parent_id, access_code)
        VALUES (v_student_id, v_parent_id, v_pac)
        ON CONFLICT DO NOTHING;

        -- Insert grade history
        INSERT INTO student_grade_history (student_id, class_id, promotion_status)
        VALUES (v_student_id, v_class_id, 'enrolled')
        ON CONFLICT DO NOTHING;

        -- Insert reading profile
        INSERT INTO reading_profiles (student_id, current_profile_label, reading_speed_wpm, comprehension_level)
        VALUES (v_student_id, v_profile, 60 + (i % 50), v_profile)
        ON CONFLICT DO NOTHING;

    END LOOP;
END $$;
