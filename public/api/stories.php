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
        $imageUrl = !empty($_POST['image_url']) ? $_POST['image_url'] : null;
        $stmt = $pdo->prepare("INSERT INTO stories (title, description, content, image_url, grade_level, language) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $_POST['title'],
            $_POST['description'],
            $_POST['content'],
            $imageUrl,
            $_POST['grade_level'],
            $_POST['language']
        ]);
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
    elseif ($action === 'update') {
        $imageUrl = !empty($_POST['image_url']) ? $_POST['image_url'] : null;
        
        if ($imageUrl) {
            $stmt = $pdo->prepare("UPDATE stories SET title = ?, description = ?, content = ?, image_url = ?, grade_level = ?, language = ? WHERE id = ?");
            $stmt->execute([
                $_POST['title'],
                $_POST['description'],
                $_POST['content'],
                $imageUrl,
                $_POST['grade_level'],
                $_POST['language'],
                $_POST['id']
            ]);
        } else {
            $stmt = $pdo->prepare("UPDATE stories SET title = ?, description = ?, content = ?, grade_level = ?, language = ? WHERE id = ?");
            $stmt->execute([
                $_POST['title'],
                $_POST['description'],
                $_POST['content'],
                $_POST['grade_level'],
                $_POST['language'],
                $_POST['id']
            ]);
        }
        echo json_encode(['success' => true]);
    }
    elseif ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM stories WHERE id = ?");
        $stmt->execute([$_POST['id']]);
        echo json_encode(['success' => true]);
    }
    else {
        echo json_encode(['error' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Database error']);
}
?>