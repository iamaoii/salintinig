<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$pdo = getDB();
$user_id = getUserId();
$role = getUserRole();

if ($role === 'student') {
    $stmt = $pdo->prepare("
        SELECT sp.*, s.full_name 
        FROM student_progress sp 
        JOIN students s ON s.id = sp.student_id 
        WHERE sp.student_id = ? 
        ORDER BY sp.last_active DESC LIMIT 1
    ");
    $stmt->execute([$user_id]);
    $data = $stmt->fetch();

    if (!$data) {
        $data = [
            'full_name' => $_SESSION['name'],
            'fluency_score' => 0,
            'comprehension_score' => 0,
            'total_stars' => 0,
            'days_streak' => 0
        ];
    }

    echo json_encode($data);

} elseif ($role === 'teacher') {
    $stmt = $pdo->prepare("SELECT full_name FROM teachers WHERE id = ?");
    $stmt->execute([$user_id]);
    $name = $stmt->fetchColumn();

    // Example aggregated data (you can expand this)
    $stmt = $pdo->query("SELECT COUNT(*) as total_students FROM students");
    $total_students = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT AVG(fluency_score) as avg_fluency FROM student_progress");
    $avg_fluency = round($stmt->fetchColumn() ?: 0);

    $stmt = $pdo->query("SELECT SUM(total_stars) as total_stars FROM student_progress");
    $total_stars = $stmt->fetchColumn() ?: 0;

    echo json_encode([
        'name' => $name,
        'total_students' => $total_students,
        'avg_fluency' => $avg_fluency,
        'total_stars' => $total_stars,
        'classes' => [  // dummy classes
            ['name' => 'Grade 3 - A', 'students' => 24, 'avg_fluency' => 78],
            ['name' => 'Grade 4 - B', 'students' => 24, 'avg_fluency' => 85]
        ]
    ]);
}
?>