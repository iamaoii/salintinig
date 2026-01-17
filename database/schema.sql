-- SalinTinig Database Schema (School Project)

CREATE DATABASE IF NOT EXISTS salintinig_db;
USE salintinig_db;

-- Teachers
CREATE TABLE IF NOT EXISTS teachers_account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE IF NOT EXISTS students_account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    lrn_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    grade_level INT DEFAULT 4,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Progress
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    total_stars INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    stories_read INT DEFAULT 0,
    total_reading_time INT DEFAULT 0,
    current_level INT DEFAULT 1,
    FOREIGN KEY (student_id) REFERENCES students_account(id) ON DELETE CASCADE
);

-- Stories
CREATE TABLE IF NOT EXISTS stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content LONGTEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    grade_level VARCHAR(20) DEFAULT '4-6',
    language ENUM('English', 'Filipino') DEFAULT 'English',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading Sessions
CREATE TABLE IF NOT EXISTS reading_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    story_id INT NOT NULL,
    stars_earned INT DEFAULT 0,
    words_per_minute INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students_account(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);

-- Achievements (Badge Definitions)
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT 'emoji_events',
    requirement_type ENUM('stories_read', 'streak', 'stars', 'level') NOT NULL,
    requirement_value INT NOT NULL
);

-- Student Achievements (Unlocked Badges)
CREATE TABLE IF NOT EXISTS student_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_achievement (student_id, achievement_id),
    FOREIGN KEY (student_id) REFERENCES students_account(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);

-- Default Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value) VALUES
('First Story', 'Complete your first story', 'auto_stories', 'stories_read', 1),
('Bookworm', 'Read 10 stories', 'menu_book', 'stories_read', 10),
('Week Warrior', '7-day reading streak', 'local_fire_department', 'streak', 7),
('Star Collector', 'Earn 100 stars', 'star', 'stars', 100),
('Level 5', 'Reach Level 5', 'trending_up', 'level', 5);

-- Story Assignments (Teachers assign stories to students)
CREATE TABLE IF NOT EXISTS story_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    story_id INT NOT NULL,
    teacher_id INT NOT NULL,
    student_id INT DEFAULT NULL,
    due_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers_account(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students_account(id) ON DELETE CASCADE
);
