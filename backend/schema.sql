-- =============================================================================
-- SalinTinig Complete Database Schema (PostgreSQL / Supabase)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. SCHOOLS & INSTITUTIONAL PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
    school_id VARCHAR(50) PRIMARY KEY, -- DepEd School ID e.g. '109283'
    school_name VARCHAR(255) NOT NULL,
    division VARCHAR(150),
    region VARCHAR(150),
    official_email VARCHAR(255) UNIQUE NOT NULL,
    principal_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. USERS & AUTHENTICATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) REFERENCES schools(school_id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    must_change_password BOOLEAN DEFAULT FALSE,
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    reset_token VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'password_reset',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. SCHOOL YEARS, TEACHERS & CLASSES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_years (
    school_year_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) REFERENCES schools(school_id) ON DELETE CASCADE,
    school_year VARCHAR(20) NOT NULL, -- e.g. '2026-2027'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_school_sy UNIQUE (school_id, school_year)
);

CREATE TABLE IF NOT EXISTS teachers (
    teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    teacher_no VARCHAR(50) UNIQUE NOT NULL, -- Employee ID
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    sex VARCHAR(20) DEFAULT 'Male',
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS classes (
    class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) REFERENCES schools(school_id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(school_year_id) ON DELETE CASCADE,
    advisor_teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    grade_level VARCHAR(50) NOT NULL, -- e.g. 'Grade 4'
    section_name VARCHAR(100) NOT NULL, -- e.g. 'Fyang'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_grade_section UNIQUE (school_id, school_year_id, grade_level, section_name)
);

CREATE TABLE IF NOT EXISTS faculty_in_charge (
    faculty_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) REFERENCES schools(school_id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(school_year_id) ON DELETE CASCADE,
    grade_level VARCHAR(50) NOT NULL, -- Lead Faculty for Grade 4, 5, or 6
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_faculty_grade UNIQUE (school_id, school_year_id, grade_level)
);

-- -----------------------------------------------------------------------------
-- 4. STUDENTS, PARENTS & ENROLLMENT
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    lrn VARCHAR(20) UNIQUE NOT NULL, -- 12-digit Learner Reference Number
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    sex VARCHAR(20) CHECK (sex IN ('Male', 'Female')),
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parents (
    parent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_name VARCHAR(255) NOT NULL DEFAULT 'Mr./Mrs.', -- e.g. 'Mr./Mrs. Dela Cruz'
    email VARCHAR(255) UNIQUE, -- Optional parent email
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_parents (
    student_parent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(parent_id) ON DELETE SET NULL,
    access_code VARCHAR(50) NOT NULL UNIQUE, -- e.g. 'PAC-88491'
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_student_parent_link UNIQUE (student_id)
);

CREATE TABLE IF NOT EXISTS student_grade_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(school_year_id) ON DELETE CASCADE,
    grade_level VARCHAR(50), -- e.g. 'Grade 4', 'Grade 5', 'Grade 6'
    class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
    promotion_status VARCHAR(50) DEFAULT 'promoted', -- 'promoted', 'retained', 'active', 'dropped', 'transferred', 'graduated'
    promoted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_sy UNIQUE (student_id, school_year_id)
);

-- -----------------------------------------------------------------------------
-- 5. READING MATERIALS & QUESTION BANK (Practice Story Library)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reading_materials (
    material_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_text TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'fil', -- 'fil' or 'en'
    difficulty_level VARCHAR(50),
    category VARCHAR(50),
    material_type VARCHAR(50) DEFAULT 'practice_story',
    grade_level_target VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES reading_materials(material_id) ON DELETE CASCADE,
    question_type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    points INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_choices (
    choice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(question_id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 5B. DEDICATED PHIL-IRI PASSAGES & QUESTIONS (Formal Assessment Schema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS phil_iri_passages (
    passage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    grade_level VARCHAR(50) NOT NULL DEFAULT 'Grade 4',
    passage_set VARCHAR(50) NOT NULL DEFAULT 'Set A',
    language VARCHAR(20) DEFAULT 'fil',
    status VARCHAR(50) DEFAULT 'published',
    prev_status VARCHAR(50) DEFAULT 'published',
    content_text TEXT NOT NULL,
    word_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phil_iri_questions (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passage_id UUID REFERENCES phil_iri_passages(passage_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'Multiple Choice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS phil_iri_question_choices (
    choice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES phil_iri_questions(question_id) ON DELETE CASCADE,
    choice_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 6. PHIL-IRI ASSESSMENTS & RESULTS (Phil-IRI Assessment Only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    passage_id UUID REFERENCES phil_iri_passages(passage_id) ON DELETE SET NULL,
    assigned_by_teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    assessment_type VARCHAR(50) NOT NULL, -- 'oral' or 'silent'
    assessment_period VARCHAR(50) NOT NULL, -- 'pre_test' or 'post_test'
    date_assigned TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'open', -- 'open' or 'closed'
    reading_level_result VARCHAR(50), -- 'Independent', 'Instructional', 'Frustration'
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_score DECIMAL(5,2),
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS oral_reading_results (
    oral_result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_attempt_id UUID REFERENCES assessment_attempts(attempt_id) ON DELETE CASCADE,
    audio_recording_url TEXT,
    transcript_text TEXT,
    ai_miscues_json JSONB,
    verified_miscues_json JSONB,
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified'
    reading_time_seconds INT,
    words_read INT,
    correct_words INT,
    reading_rate_wpm DECIMAL(6,2),
    accuracy_percentage DECIMAL(5,2),
    self_corrections_count INT DEFAULT 0,
    fluency_score DECIMAL(5,2),
    pronunciation_score DECIMAL(5,2),
    comprehension_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS silent_reading_results (
    silent_result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_attempt_id UUID REFERENCES assessment_attempts(attempt_id) ON DELETE CASCADE,
    reading_time_seconds INT,
    comprehension_score DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS assessment_answers (
    answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_attempt_id UUID REFERENCES assessment_attempts(attempt_id) ON DELETE CASCADE,
    phil_iri_question_id UUID REFERENCES phil_iri_questions(question_id) ON DELETE CASCADE,
    selected_choice_id UUID REFERENCES phil_iri_question_choices(choice_id) ON DELETE SET NULL,
    answer_text TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2),
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES assessments(assessment_id) ON DELETE CASCADE,
    feedback_text TEXT NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. CLASS ACTIVITIES & GAMIFICATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
    activity_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
    created_by_teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(50),
    grade_level_target VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_attempts (
    activity_attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(activity_id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_points INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vocabulary_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(activity_id) ON DELETE CASCADE,
    english_word VARCHAR(100),
    filipino_word VARCHAR(100),
    distractor_1 VARCHAR(100),
    distractor_2 VARCHAR(100),
    distractor_3 VARCHAR(100),
    points INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pronunciation_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(activity_id) ON DELETE CASCADE,
    reference_text TEXT NOT NULL,
    audio_path TEXT,
    points INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sentence_builder_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(activity_id) ON DELETE CASCADE,
    correct_sentence TEXT NOT NULL,
    scrambled_words TEXT NOT NULL,
    points INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS activity_answers (
    activity_answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_attempt_id UUID REFERENCES activity_attempts(activity_attempt_id) ON DELETE CASCADE,
    item_type VARCHAR(50),
    item_id UUID,
    response_text TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    points_earned INT DEFAULT 0,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. BADGES, PRACTICE STORY ATTEMPTS & READING PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
    badge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_path TEXT,
    criteria_type VARCHAR(50),
    criteria_value VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_badges (
    student_badge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(badge_id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_progress (
    progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    current_reading_level VARCHAR(50),
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_story_progress (
    story_progress_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    material_id UUID REFERENCES reading_materials(material_id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress' or 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Detailed Practice Story Attempts (Analytics)
CREATE TABLE IF NOT EXISTS story_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    material_id UUID REFERENCES reading_materials(material_id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    score DECIMAL(5,2),
    total_questions INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress'
);

CREATE TABLE IF NOT EXISTS story_answers (
    answer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID REFERENCES story_attempts(attempt_id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(question_id) ON DELETE CASCADE,
    selected_choice_id UUID REFERENCES question_choices(choice_id) ON DELETE SET NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reading_profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID UNIQUE REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- Overall Composite Profile
    current_profile_label VARCHAR(100), -- 'Independent', 'Instructional', 'Frustration'
    
    -- Oral Reading Summary
    oral_accuracy_rate DECIMAL(5,2),
    oral_comprehension_rate DECIMAL(5,2),
    oral_speed_wpm INT,
    oral_profile_label VARCHAR(50),
    
    -- Silent Reading Summary
    silent_comprehension_rate DECIMAL(5,2),
    silent_speed_wpm INT,
    silent_profile_label VARCHAR(50),
    
    -- Listening Comprehension Summary
    listening_comprehension_rate DECIMAL(5,2),
    listening_profile_label VARCHAR(50),
    
    -- Language Breakdown Summary
    filipino_profile_label VARCHAR(50),
    english_profile_label VARCHAR(50),
    
    -- Compatibility & DepEd Diagnostic Levels
    reading_speed_wpm INT,
    comprehension_rate DECIMAL(5,2),
    comprehension_level VARCHAR(50),
    fluency_level VARCHAR(50),
    pronunciation_level VARCHAR(50),
    
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 9. NOTIFICATIONS & ACCOUNT REQUESTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) REFERENCES schools(school_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) REFERENCES schools(school_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS account_requests (
    request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(50) REFERENCES schools(school_id) ON DELETE CASCADE,
    teacher_no VARCHAR(100),
    first_name VARCHAR(100),
    middle_name VARCHAR(100),
    last_name VARCHAR(100),
    sex VARCHAR(20) DEFAULT 'Male',
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 10. INDEXES FOR HIGH-PERFORMANCE LOOKUPS
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_teachers_no ON teachers(teacher_no);
CREATE INDEX IF NOT EXISTS idx_students_lrn ON students(lrn);
CREATE INDEX IF NOT EXISTS idx_classes_advisor ON classes(advisor_teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_section ON classes(grade_level, section_name);
CREATE INDEX IF NOT EXISTS idx_student_grade_history_class ON student_grade_history(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_reading_profiles_student ON reading_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_story_attempts_student ON story_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_story_attempts_material ON story_attempts(material_id);
CREATE INDEX IF NOT EXISTS idx_story_answers_attempt ON story_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_attempt ON assessment_answers(assessment_attempt_id);
CREATE INDEX IF NOT EXISTS idx_oral_results_attempt ON oral_reading_results(assessment_attempt_id);
