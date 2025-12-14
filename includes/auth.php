<?php
// includes/auth.php - Auto-login after signup + store email & LRN in session

session_start();  // Must be first

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';
require_once __DIR__ . '/../functions.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit();
}

$action = $_POST['action'] ?? '';
$pdo = getDB();

if ($action === 'signup') {
    $classification = sanitizeInput($_POST['classification'] ?? '');
    $full_name = sanitizeInput($_POST['full_name'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';

    if ($password !== $confirm_password) {
        echo json_encode(['error' => 'Passwords do not match']);
        exit();
    }

    if (empty($password)) {
        echo json_encode(['error' => 'Password is required']);
        exit();
    }

    $password_hash = hashPassword($password);
    $role = $classification;

    try {
        $user_id = null;
        $lrn_number = null;

        if ($classification === 'student') {
            $lrn_number = sanitizeInput($_POST['lrn_number'] ?? '');

            if (empty($lrn_number)) {
                echo json_encode(['error' => 'LRN is required']);
                exit();
            }

            $stmt = $pdo->prepare("INSERT INTO students_account (full_name, email, lrn_number, password_hash) VALUES (?, ?, ?, ?)");
            $stmt->execute([$full_name, $email, $lrn_number, $password_hash]);
            $user_id = $pdo->lastInsertId();

            $pdo->prepare("INSERT INTO student_progress (student_id) VALUES (?)")->execute([$user_id]);

        } elseif ($classification === 'teacher') {
            $id_number = sanitizeInput($_POST['id_number'] ?? '');

            if (empty($id_number)) {
                echo json_encode(['error' => 'ID Number is required']);
                exit();
            }

            $stmt = $pdo->prepare("INSERT INTO teachers_account (full_name, email, id_number, password_hash) VALUES (?, ?, ?, ?)");
            $stmt->execute([$full_name, $email, $id_number, $password_hash]);
            $user_id = $pdo->lastInsertId();
        } else {
            echo json_encode(['error' => 'Invalid classification']);
            exit();
        }

        // === AUTO-LOGIN + STORE EMAIL & LRN ===
        $_SESSION['user_id'] = $user_id;
        $_SESSION['role'] = $role;
        $_SESSION['name'] = $full_name;
        $_SESSION['email'] = $email;  // Store email

        if ($role === 'student') {
            $_SESSION['lrn_number'] = $lrn_number;  // Store LRN for students
        }

        $dashboard = $role === 'student' ? 'student-dashboard.php' : 'teacher-dashboard.php';
        $redirect_url = SITE_URL . $dashboard;

        echo json_encode([
            'success' => true,
            'redirect' => $redirect_url
        ]);

    } catch (PDOException $e) {
        if ($e->getCode() == '23000' && strpos($e->getMessage(), 'Duplicate entry') !== false) {
            if (strpos($e->getMessage(), 'email') !== false) {
                echo json_encode(['error' => 'This email is already registered']);
            } elseif (strpos($e->getMessage(), 'lrn_number') !== false || strpos($e->getMessage(), 'id_number') !== false) {
                echo json_encode(['error' => 'This LRN/ID Number is already in use']);
            } else {
                echo json_encode(['error' => 'Email or ID Number already exists']);
            }
        } else {
            echo json_encode(['error' => 'An error occurred. Please try again later.']);
        }
    }

} elseif ($action === 'login') {
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = sanitizeInput($_POST['role'] ?? '');

    $table = $role === 'student' ? 'students_account' : 'teachers_account';

    // Fetch email and lrn_number for students
    $sql = "SELECT id, full_name, email, password_hash";
    if ($role === 'student') {
        $sql .= ", lrn_number";
    }
    $sql .= " FROM $table WHERE email = ?";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && verifyPassword($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $role;
        $_SESSION['name'] = $user['full_name'];
        $_SESSION['email'] = $user['email'];  // Store email

        if ($role === 'student' && isset($user['lrn_number'])) {
            $_SESSION['lrn_number'] = $user['lrn_number'];  // Store LRN for students
        }

        $dashboard = $role === 'student' ? 'student-dashboard.php' : 'teacher-dashboard.php';
        $redirect_url = SITE_URL . $dashboard;

        echo json_encode(['success' => true, 'redirect' => $redirect_url]);
    } else {
        echo json_encode(['error' => 'Invalid email or password']);
    }

} else {
    echo json_encode(['error' => 'Invalid action']);
}
?>