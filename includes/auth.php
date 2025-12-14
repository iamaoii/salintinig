<?php
// includes/auth.php - Fixed version with proper duplicate handling

startSession();

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

    try {
        if ($classification === 'student') {
            $lrn_number = sanitizeInput($_POST['lrn_number'] ?? '');

            if (empty($lrn_number)) {
                echo json_encode(['error' => 'LRN is required']);
                exit();
            }

            // Insert student (UNIQUE constraints will throw exception if duplicate)
            $stmt = $pdo->prepare("INSERT INTO students_account (full_name, email, lrn_number, password_hash) VALUES (?, ?, ?, ?)");
            $stmt->execute([$full_name, $email, $lrn_number, $password_hash]);

            $student_id = $pdo->lastInsertId();

            // Create progress record
            $pdo->prepare("INSERT INTO student_progress (student_id) VALUES (?)")->execute([$student_id]);

        } elseif ($classification === 'teacher') {
            $id_number = sanitizeInput($_POST['id_number'] ?? '');

            if (empty($id_number)) {
                echo json_encode(['error' => 'ID Number is required']);
                exit();
            }

            // Insert teacher
            $stmt = $pdo->prepare("INSERT INTO teachers_account (full_name, email, id_number, password_hash) VALUES (?, ?, ?, ?)");
            $stmt->execute([$full_name, $email, $id_number, $password_hash]);

        } else {
            echo json_encode(['error' => 'Invalid classification']);
            exit();
        }

        // Only reach here if INSERT succeeded
        echo json_encode(['success' => 'Account created successfully! Please log in.']);

    } catch (PDOException $e) {
        // Catch duplicate entry error (MySQL error code 1062)
        if ($e->getCode() == '23000' && strpos($e->getMessage(), 'Duplicate entry') !== false) {
            if (strpos($e->getMessage(), 'email') !== false) {
                echo json_encode(['error' => 'This email is already registered']);
            } elseif (strpos($e->getMessage(), 'lrn_number') !== false || strpos($e->getMessage(), 'id_number') !== false) {
                echo json_encode(['error' => 'This LRN/ID Number is already in use']);
            } else {
                echo json_encode(['error' => 'Email or ID Number already exists']);
            }
        } else {
            // Other database errors (log in production, hide from user)
            echo json_encode(['error' => 'An error occurred. Please try again.']);
        }
    }

} elseif ($action === 'login') {
    $email = sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = sanitizeInput($_POST['role'] ?? '');

    if ($role === 'student') {
        $table = 'students_account';
    } elseif ($role === 'teacher') {
        $table = 'teachers_account';
    } else {
        echo json_encode(['error' => 'Invalid role']);
        exit();
    }

    $stmt = $pdo->prepare("SELECT id, full_name, password_hash FROM $table WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && verifyPassword($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $role;
        $_SESSION['name'] = $user['full_name'];

        $redirect = $role === 'student' ? 'student-dashboard.php' : 'teacher-dashboard.php';
        echo json_encode(['success' => true, 'redirect' => $redirect]);
    } else {
        echo json_encode(['error' => 'Invalid email or password']);
    }

} else {
    echo json_encode(['error' => 'Invalid action']);
}
?>