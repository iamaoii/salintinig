<?php
require_once 'db.php';        // Brings in getDB()
require_once 'config.php';

function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
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
?>