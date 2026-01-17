<?php
/**
 * Story Image Upload API
 */
session_start();
require_once __DIR__ . '/../../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'teacher') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

header('Content-Type: application/json');

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['error' => 'No image uploaded or upload error']);
    exit();
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSize = 5 * 1024 * 1024; // 5MB

// Validate file type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode(['error' => 'Invalid file type. Allowed: JPG, PNG, GIF, WebP']);
    exit();
}

if ($file['size'] > $maxSize) {
    echo json_encode(['error' => 'File too large. Maximum: 5MB']);
    exit();
}

// Generate unique filename
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'story_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $extension;

// Upload directory
$uploadDir = __DIR__ . '/../assets/stories/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$uploadPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    echo json_encode([
        'success' => true,
        'image_url' => 'assets/stories/' . $filename
    ]);
} else {
    echo json_encode(['error' => 'Failed to save image']);
}
