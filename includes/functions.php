<?php
require_once 'db.php';
require_once 'config.php';

function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'path' => '/salintinig/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getUserRole() {
    return $_SESSION['role'] ?? null;
}

function getUserName() {
    return $_SESSION['name'] ?? '';
}

function redirect($url) {
    header("Location: " . SITE_URL . $url);
    exit();
}

function sanitizeInput($data) {
    return trim(htmlspecialchars($data));
}

function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

// ============ STUDENT PROGRESS FUNCTIONS ============

function getUserId() {
    return $_SESSION['user_id'] ?? null;
}

function getStudentProgress($studentId) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM student_progress WHERE student_id = ?");
    $stmt->execute([$studentId]);
    $progress = $stmt->fetch();
    
    if (!$progress) {
        // Create progress record if not exists
        $pdo->prepare("INSERT INTO student_progress (student_id) VALUES (?)")->execute([$studentId]);
        return [
            'total_stars' => 0,
            'current_streak' => 0,
            'stories_read' => 0,
            'total_reading_time' => 0,
            'current_level' => 1
        ];
    }
    return $progress;
}

function updateStreak($studentId) {
    $pdo = getDB();
    
    // Get last completed reading date
    $stmt = $pdo->prepare("
        SELECT DATE(MAX(completed_at)) as last_read 
        FROM reading_sessions 
        WHERE student_id = ? AND completed_at IS NOT NULL
    ");
    $stmt->execute([$studentId]);
    $lastRead = $stmt->fetch()['last_read'];
    
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    
    if ($lastRead == $today) {
        // Already counted today
        return;
    } elseif ($lastRead == $yesterday) {
        // Consecutive day - increment
        $pdo->prepare("UPDATE student_progress SET current_streak = current_streak + 1 WHERE student_id = ?")->execute([$studentId]);
    } else {
        // Streak broken - reset to 1
        $pdo->prepare("UPDATE student_progress SET current_streak = 1 WHERE student_id = ?")->execute([$studentId]);
    }
}

function incrementStoriesRead($studentId, $starsEarned = 0) {
    $pdo = getDB();
    $pdo->prepare("
        UPDATE student_progress 
        SET stories_read = stories_read + 1,
            total_stars = total_stars + ?
        WHERE student_id = ?
    ")->execute([$starsEarned, $studentId]);
}

function checkAndAwardAchievements($studentId) {
    $pdo = getDB();
    $progress = getStudentProgress($studentId);
    
    // Get all achievements
    $achievements = $pdo->query("SELECT * FROM achievements")->fetchAll();
    
    foreach ($achievements as $a) {
        $value = match($a['requirement_type']) {
            'stories_read' => $progress['stories_read'],
            'streak' => $progress['current_streak'],
            'stars' => $progress['total_stars'],
            'level' => $progress['current_level'],
            default => 0
        };
        
        if ($value >= $a['requirement_value']) {
            // Award if not already earned
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO student_achievements (student_id, achievement_id) 
                VALUES (?, ?)
            ");
            $stmt->execute([$studentId, $a['id']]);
        }
    }
}

// ============ READING SESSION FUNCTIONS ============

function startReadingSession($studentId, $storyId) {
    $pdo = getDB();
    
    // Check for existing incomplete session
    $stmt = $pdo->prepare("
        SELECT id FROM reading_sessions 
        WHERE student_id = ? AND story_id = ? AND completed_at IS NULL
    ");
    $stmt->execute([$studentId, $storyId]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        return $existing['id'];
    }
    
    // Create new session
    $stmt = $pdo->prepare("INSERT INTO reading_sessions (student_id, story_id) VALUES (?, ?)");
    $stmt->execute([$studentId, $storyId]);
    return $pdo->lastInsertId();
}

function completeReadingSession($sessionId, $starsEarned, $wpm = 0) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        UPDATE reading_sessions 
        SET completed_at = NOW(), stars_earned = ?, words_per_minute = ?
        WHERE id = ?
    ");
    $stmt->execute([$starsEarned, $wpm, $sessionId]);
}

function getContinueReading($studentId) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT s.id, s.title, s.description, s.image_url, rs.id as session_id, rs.started_at
        FROM reading_sessions rs
        JOIN stories s ON rs.story_id = s.id
        WHERE rs.student_id = ? AND rs.completed_at IS NULL
        ORDER BY rs.started_at DESC 
        LIMIT 1
    ");
    $stmt->execute([$studentId]);
    return $stmt->fetch();
}

function getRecommendedStories($studentId, $gradeLevel, $limit = 4) {
    $pdo = getDB();
    $limit = (int)$limit; // Ensure integer
    $stmt = $pdo->prepare("
        SELECT * FROM stories 
        WHERE id NOT IN (
            SELECT story_id FROM reading_sessions 
            WHERE student_id = ? AND completed_at IS NOT NULL
        )
        ORDER BY RAND() 
        LIMIT $limit
    ");
    $stmt->execute([$studentId]);
    return $stmt->fetchAll();
}

function getAssignedStories($studentId) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT s.*, sa.due_date, sa.id as assignment_id
        FROM story_assignments sa
        JOIN stories s ON sa.story_id = s.id
        WHERE sa.student_id = ?
        AND s.id NOT IN (
            SELECT story_id FROM reading_sessions 
            WHERE student_id = ? AND completed_at IS NOT NULL
        )
        ORDER BY sa.due_date ASC
    ");
    $stmt->execute([$studentId, $studentId]);
    return $stmt->fetchAll();
}

function getWeeklyActivity($studentId) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT DATE(completed_at) as date, COUNT(*) as count
        FROM reading_sessions
        WHERE student_id = ? 
        AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(completed_at)
        ORDER BY date ASC
    ");
    $stmt->execute([$studentId]);
    return $stmt->fetchAll();
}

function getAverageWPM($studentId) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT ROUND(AVG(words_per_minute)) as avg_wpm
        FROM reading_sessions 
        WHERE student_id = ? 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND words_per_minute > 0
    ");
    $stmt->execute([$studentId]);
    return $stmt->fetch()['avg_wpm'] ?? 0;
}

function getStudentAchievements($studentId) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT a.*, sa.unlocked_at
        FROM achievements a
        LEFT JOIN student_achievements sa ON a.id = sa.achievement_id AND sa.student_id = ?
        ORDER BY a.id
    ");
    $stmt->execute([$studentId]);
    return $stmt->fetchAll();
}

function getFluencyHistory($studentId, $days = 7) {
    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT DATE(completed_at) as date, ROUND(AVG(words_per_minute)) as wpm
        FROM reading_sessions
        WHERE student_id = ? 
        AND completed_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        AND words_per_minute > 0
        GROUP BY DATE(completed_at)
        ORDER BY date ASC
    ");
    $stmt->execute([$studentId, $days]);
    return $stmt->fetchAll();
}
?>