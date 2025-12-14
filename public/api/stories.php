<?php
session_start();
require_once __DIR__ . '/../../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'teacher') {
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

header('Content-Type: application/json');
$pdo = getDB();

$action = $_POST['action'] ?? '';

try {
    if ($action === 'create') {
        $stmt = $pdo->prepare("INSERT INTO stories (title, description, grade_level, language) VALUES (?, ?, ?, ?)");
        $stmt->execute([$_POST['title'], $_POST['description'], $_POST['grade_level'], $_POST['language']]);
        echo json_encode(['success' => true]);
    } elseif ($action === 'update') {
        $stmt = $pdo->prepare("UPDATE stories SET title = ?, description = ?, grade_level = ?, language = ? WHERE id = ?");
        $stmt->execute([$_POST['title'], $_POST['description'], $_POST['grade_level'], $_POST['language'], $_POST['id']]);
        echo json_encode(['success' => true]);
    } elseif ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM stories WHERE id = ?");
        $stmt->execute([$_POST['id']]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Database error']);
}
?>