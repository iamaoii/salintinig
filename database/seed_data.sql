-- Clear existing data (optional, but good for resetting)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE story_assignments;
TRUNCATE TABLE student_achievements;
TRUNCATE TABLE reading_sessions;
TRUNCATE TABLE student_progress;
TRUNCATE TABLE stories;
TRUNCATE TABLE students_account;
TRUNCATE TABLE teachers_account;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Teachers
INSERT INTO teachers_account (full_name, email, password_hash) VALUES 
('Teacher One', 'teacher1@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'), -- password: password
('Teacher Two', 'teacher2@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- 2. Insert Students
INSERT INTO students_account (full_name, email, lrn_number, grade_level, password_hash) VALUES 
('Student One', 'student1@gmail.com', '100000000001', 4, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Two', 'student2@gmail.com', '100000000002', 5, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Three', 'student3@gmail.com', '100000000003', 6, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Four', 'student4@gmail.com', '100000000004', 4, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('Student Five', 'student5@gmail.com', '100000000005', 5, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Optimize Student Progress Initialization (for all inserted students)
INSERT INTO student_progress (student_id, total_stars, current_streak, stories_read)
SELECT id, 0, 0, 0 FROM students_account;

-- 3. Insert Stories
INSERT INTO stories (title, description, content, grade_level, language) VALUES 
('The Clever Turtle', 'A story about a turtle who outwits a monkey.', 'Once upon a time, there was a turtle who found a banana tree floating in the river. He dragged it to the shore, but he could not plant it because it was too heavy. A monkey saw him and offered to help...', '4', 'English'),
('Ang Alamat ng Pinya', 'The legend of the pineapple fruit.', 'Noong unang panahon, may isang batang nagngangalang Pina. Siya ay laging umaasa sa kanyang ina para sa lahat ng bagay...', '4', 'Filipino'),
('The Space Adventure', 'A journey to the moon and beyond.', 'Three brave astronauts boarded their rocket ship. 3... 2... 1... Blast off! They soared through the clouds and into the starry sky...', '5', 'English'),
('Si Pagong at si Matsing', 'The classic fable of the turtle and the monkey.', 'Isang araw, nakakita si Pagong at si Matsing ng isang puno ng saging na palutang-lutang sa ilog...', '5', 'Filipino'),
('The Mystery of the Old House', 'Kids explore a spooky old house.', 'The old house on the hill had been empty for years. Everyone said it was haunted. But Tom and Jerry were not afraid...', '6', 'English'),
('Ang Huling Higante', 'A story about the last giant.', 'Sa isang malayong lupain, may naninirahang huling higante. Siya ay mabait at matulungin sa mga tao...', '6', 'Filipino');

-- 4. Insert Reading Sessions (History)
-- Student 1 has read some stories
INSERT INTO reading_sessions (student_id, story_id, stars_earned, words_per_minute, started_at, completed_at) VALUES 
(1, 1, 3, 120, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 2, 2, 110, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 3, 3, 130, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Student 2 has read one story
INSERT INTO reading_sessions (student_id, story_id, stars_earned, words_per_minute, started_at, completed_at) VALUES 
(2, 3, 3, 140, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Student 3 has no completed sessions yet

-- 5. Update Student Progress base on sessions
UPDATE student_progress SET 
    total_stars = 8, 
    current_streak = 2, 
    stories_read = 3,
    total_reading_time = 45 
WHERE student_id = 1;

UPDATE student_progress SET 
    total_stars = 3, 
    current_streak = 1, 
    stories_read = 1,
    total_reading_time = 15 
WHERE student_id = 2;

-- 6. Assignments
INSERT INTO story_assignments (story_id, teacher_id, student_id, due_date) VALUES 
(4, 1, 1, DATE_ADD(NOW(), INTERVAL 7 DAY)), -- Teacher 1 assigns Story 4 to Student 1
(5, 1, 2, DATE_ADD(NOW(), INTERVAL 5 DAY)), -- Teacher 1 assigns Story 5 to Student 2
(1, 1, 3, DATE_ADD(NOW(), INTERVAL 3 DAY)); -- Teacher 1 assigns Story 1 to Student 3

-- 7. Unlocked Achievements
INSERT INTO student_achievements (student_id, achievement_id) VALUES 
(1, 1); -- Student 1 unlocked "First Story"
