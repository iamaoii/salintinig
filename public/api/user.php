<?php
session_start();
require_once __DIR__ . '/../../includes/functions.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

echo json_encode([
    'success' => true,
    'name' => getUserName(),
    'role' => getUserRole(),
    'user_id' => $_SESSION['user_id']
]);
?>
