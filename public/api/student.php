<?php
session_start();
require_once __DIR__ . '/../../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'student') {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

header('Content-Type: application/json');
$pdo = getDB();
$student_id = $_SESSION['user_id'];
$action = $_POST['action'] ?? '';

try {
    if ($action === 'update_profile') {
        $full_name = sanitizeInput($_POST['full_name'] ?? '');
        $email = sanitizeInput($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($full_name) || empty($email)) {
            echo json_encode(['error' => 'Name and email are required']);
            exit();
        }

        $sql = "UPDATE students_account SET full_name = ?, email = ?";
        $params = [$full_name, $email];

        if (!empty($password)) {
            $password_hash = hashPassword($password);
            $sql .= ", password_hash = ?";
            $params[] = $password_hash;
        }

        $sql .= " WHERE id = ?";
        $params[] = $student_id;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $_SESSION['name'] = $full_name;
        $_SESSION['email'] = $email;

        echo json_encode(['success' => true]);
    }

    elseif ($action === 'delete_account') {
        $pdo->prepare("DELETE FROM student_progress WHERE student_id = ?")->execute([$student_id]);
        $pdo->prepare("DELETE FROM students_account WHERE id = ?")->execute([$student_id]);

        session_destroy();
        echo json_encode(['success' => true]);
    }

} catch (Exception $e) {
    echo json_encode(['error' => 'Database error']);
}
?>