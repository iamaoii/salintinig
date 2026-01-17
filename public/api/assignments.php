<?php
session_start();
require_once __DIR__ . '/../../includes/config.php';
require_once __DIR__ . '/../../includes/db.php';
require_once __DIR__ . '/../../includes/functions.php';

header('Content-Type: application/json');

if (!isLoggedIn() || getUserRole() !== 'teacher') {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$pdo = getDB();
$teacherId = $_SESSION['user_id'];
$action = $_REQUEST['action'] ?? '';

// CREATE assignment
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'create') {
    $storyId = (int)($_POST['story_id'] ?? 0);
    $studentId = $_POST['student_id'] ?? null; // Can be null for "all students"
    $dueDate = $_POST['due_date'] ?? null;
    
    if (!$storyId) {
        echo json_encode(['error' => 'Story ID is required']);
        exit();
    }
    
    try {
        if ($studentId === 'all' || empty($studentId)) {
            // Assign to all active students
            $students = $pdo->query("SELECT id FROM students_account WHERE is_active = 1")->fetchAll();
            $stmt = $pdo->prepare("INSERT INTO story_assignments (story_id, teacher_id, student_id, due_date) VALUES (?, ?, ?, ?)");
            $count = 0;
            foreach ($students as $student) {
                // Check if assignment already exists
                $check = $pdo->prepare("SELECT id FROM story_assignments WHERE story_id = ? AND student_id = ?");
                $check->execute([$storyId, $student['id']]);
                if (!$check->fetch()) {
                    $stmt->execute([$storyId, $teacherId, $student['id'], $dueDate ?: null]);
                    $count++;
                }
            }
            echo json_encode(['success' => true, 'message' => "Story assigned to $count students"]);
        } else {
            // Assign to specific student
            $studentId = (int)$studentId;
            
            // Check if assignment already exists
            $check = $pdo->prepare("SELECT id FROM story_assignments WHERE story_id = ? AND student_id = ?");
            $check->execute([$storyId, $studentId]);
            if ($check->fetch()) {
                echo json_encode(['error' => 'This story is already assigned to this student']);
                exit();
            }
            
            $stmt = $pdo->prepare("INSERT INTO story_assignments (story_id, teacher_id, student_id, due_date) VALUES (?, ?, ?, ?)");
            $stmt->execute([$storyId, $teacherId, $studentId, $dueDate ?: null]);
            echo json_encode(['success' => true, 'message' => 'Story assigned successfully']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to create assignment']);
    }
}

// LIST assignments
elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    $stmt = $pdo->prepare("
        SELECT sa.id, sa.due_date, sa.created_at,
               s.title as story_title, s.grade_level,
               st.full_name as student_name, st.id as student_id
        FROM story_assignments sa
        JOIN stories s ON sa.story_id = s.id
        JOIN students_account st ON sa.student_id = st.id
        WHERE sa.teacher_id = ?
        ORDER BY sa.created_at DESC
    ");
    $stmt->execute([$teacherId]);
    $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check completion status for each assignment
    foreach ($assignments as &$assignment) {
        $checkComplete = $pdo->prepare("
            SELECT id FROM reading_sessions 
            WHERE student_id = ? AND story_id = (
                SELECT story_id FROM story_assignments WHERE id = ?
            )
        ");
        $checkComplete->execute([$assignment['student_id'], $assignment['id']]);
        $assignment['is_completed'] = $checkComplete->fetch() ? true : false;
    }
    
    echo json_encode(['success' => true, 'assignments' => $assignments]);
}

// DELETE assignment
elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $assignmentId = (int)($_POST['id'] ?? 0);
    
    if (!$assignmentId) {
        echo json_encode(['error' => 'Assignment ID is required']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("DELETE FROM story_assignments WHERE id = ? AND teacher_id = ?");
        $stmt->execute([$assignmentId, $teacherId]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Assignment deleted']);
        } else {
            echo json_encode(['error' => 'Assignment not found']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Failed to delete assignment']);
    }
}

else {
    echo json_encode(['error' => 'Invalid action']);
}
?>
