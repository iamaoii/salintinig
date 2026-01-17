<?php
session_start();
require_once __DIR__ . '/../../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'student') {
    header('Location: ../auth.html');
    exit();
}

$studentName = htmlspecialchars(getUserName());

// Get student data
$pdo = getDB();
$stmt = $pdo->prepare("SELECT * FROM students_account WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$student = $stmt->fetch();

// Check for messages from redirect
$message = '';
$error = '';
if (isset($_GET['success'])) {
    switch ($_GET['success']) {
        case 'profile':
            $message = 'Profile updated successfully!';
            break;
        case 'password':
            $message = 'Password changed successfully!';
            break;
    }
}
if (isset($_GET['error'])) {
    switch ($_GET['error']) {
        case 'profile_failed':
            $error = 'Failed to update profile. Email may already be in use.';
            break;
        case 'profile_empty':
            $error = 'Please fill in all required fields.';
            break;
        case 'password_empty':
            $error = 'Please fill in all password fields.';
            break;
        case 'password_wrong':
            $error = 'Current password is incorrect.';
            break;
        case 'password_mismatch':
            $error = 'New passwords do not match or are too short (min 6 characters).';
            break;
        case 'delete_confirm':
            $error = 'Please type DELETE to confirm account deletion.';
            break;
        case 'delete_password':
            $error = 'Password is incorrect.';
            break;
        case 'delete_failed':
            $error = 'Failed to delete account. Please try again.';
            break;
    }
}

// Handle form submission with PRG pattern
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'update_profile') {
        $newName = sanitizeInput($_POST['full_name'] ?? '');
        $newEmail = sanitizeInput($_POST['email'] ?? '');
        
        if (!empty($newName) && !empty($newEmail)) {
            try {
                $stmt = $pdo->prepare("UPDATE students_account SET full_name = ?, email = ? WHERE id = ?");
                $stmt->execute([$newName, $newEmail, $_SESSION['user_id']]);
                $_SESSION['name'] = $newName;
                header('Location: settings.php?success=profile');
                exit();
            } catch (PDOException $e) {
                header('Location: settings.php?error=profile_failed');
                exit();
            }
        } else {
            header('Location: settings.php?error=profile_empty');
            exit();
        }
    } elseif ($action === 'change_password') {
        $currentPassword = $_POST['current_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        
        if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
            header('Location: settings.php?error=password_empty');
            exit();
        } elseif (verifyPassword($currentPassword, $student['password_hash'])) {
            if ($newPassword === $confirmPassword && strlen($newPassword) >= 6) {
                $newHash = hashPassword($newPassword);
                $stmt = $pdo->prepare("UPDATE students_account SET password_hash = ? WHERE id = ?");
                $stmt->execute([$newHash, $_SESSION['user_id']]);
                header('Location: settings.php?success=password');
                exit();
            } else {
                header('Location: settings.php?error=password_mismatch');
                exit();
            }
        } else {
            header('Location: settings.php?error=password_wrong');
            exit();
        }
    } elseif ($action === 'delete_account') {
        $confirmPassword = $_POST['confirm_delete_password'] ?? '';
        $confirmText = $_POST['confirm_text'] ?? '';
        
        if ($confirmText !== 'DELETE') {
            header('Location: settings.php?error=delete_confirm');
            exit();
        } elseif (!verifyPassword($confirmPassword, $student['password_hash'])) {
            header('Location: settings.php?error=delete_password');
            exit();
        } else {
            try {
                // Delete student progress first
                $pdo->prepare("DELETE FROM student_progress WHERE student_id = ?")->execute([$_SESSION['user_id']]);
                // Delete student account
                $pdo->prepare("DELETE FROM students_account WHERE id = ?")->execute([$_SESSION['user_id']]);
                // Destroy session
                session_destroy();
                header('Location: ../auth.html?deleted=1');
                exit();
            } catch (PDOException $e) {
                header('Location: settings.php?error=delete_failed');
                exit();
            }
        }
    }
}
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig - Account Settings</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />
    <link rel="stylesheet" href="../css/student/style.css" />
    <link rel="stylesheet" href="../css/student/settings.css" />
</head>

<body>
    <div class="app">
        <header class="header">
            <div class="header__inner">
                <a class="brand" href="home.php">
                    <h1 class="brand__title">SalinTinig</h1>
                </a>
                <nav class="topnav" aria-label="Primary">
                    <a class="topnav__item topnav__item--inactive" href="home.php">
                        <span class="material-symbols-outlined">home</span>
                        <span class="topnav__label">Home</span>
                    </a>
                    <a class="topnav__item topnav__item--inactive" href="progress.php">
                        <span class="material-symbols-outlined">analytics</span>
                        <span class="topnav__label">Progress</span>
                    </a>
                    <a class="topnav__item topnav__item--inactive" href="reading.php">
                        <span class="material-symbols-outlined">auto_stories</span>
                        <span class="topnav__label">Reading</span>
                    </a>
                    <a class="topnav__item topnav__item--inactive" href="library.php">
                        <span class="material-symbols-outlined">library_books</span>
                        <span class="topnav__label">Library</span>
                    </a>
                    <a class="topnav__item topnav__item--inactive" href="rewards.php">
                        <span class="material-symbols-outlined">military_tech</span>
                        <span class="topnav__label">Rewards</span>
                    </a>
                </nav>
                <div class="header__actions">
                    <button class="iconBtn iconBtn--desktopOnly" type="button"><span
                            class="material-symbols-outlined">notifications</span></button>
                    <div class="dropdown">
                        <div class="avatar" role="button" aria-haspopup="true" aria-expanded="false"
                            aria-label="User profile"
                            style='background-image:url("https://lh3.googleusercontent.com/aida-public/AB6AXuD7hpPAKn5pdGO3eslTGiMonVR4pevUl0aC14EpdlwKpDmuCvdnGAL5Dpwxa0aUhDp4KbA6G6M75Ba4zt-tOdJfUCxWOB1U-pMyhnfv26oNQeI5YtnuVW6mmgqWTB96PEQwWr4KfWmkr46jQgQ3kzMiidaZ5JZ6Ktf3tUNPzR8Sl3Fhqkt0lzGwa8Huz9aCa2wl6sxMthrSkHtqPKeBMdDE49uMIZB-cF6vFhLSTFTcRcpVvDa_mPfEUNtK3XGvjsykmM56zZbuYQ");'>
                        </div>
                        <div class="dropdown__menu">
                            <a href="profile.php" class="dropdown__item">
                                <span class="material-symbols-outlined">person</span>
                                My Portfolio
                            </a>
                            <a href="settings.php" class="dropdown__item">
                                <span class="material-symbols-outlined">settings</span>
                                Account Settings
                            </a>
                            <a href="support.php" class="dropdown__item">
                                <span class="material-symbols-outlined">help</span>
                                Support
                            </a>
                            <a href="library.php" class="dropdown__item">
                                <span class="material-symbols-outlined">library_books</span>
                                My Library
                            </a>
                            <div class="dropdown__divider"></div>
                            <a href="../logout.php" class="dropdown__item dropdown__item--danger">
                                <span class="material-symbols-outlined">logout</span>
                                Log Out
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main class="main">
            <div class="container">
                <div class="settings-page">
                    <div class="settings-header">
                        <h1>Account Settings</h1>
                        <p>Manage your account information and security</p>
                    </div>

                    <?php if ($message): ?>
                        <div class="message message--success">
                            <span class="material-symbols-outlined">check_circle</span>
                            <?= $message ?>
                        </div>
                    <?php endif; ?>
                    <?php if ($error): ?>
                        <div class="message message--error">
                            <span class="material-symbols-outlined">error</span>
                            <?= $error ?>
                        </div>
                    <?php endif; ?>

                    <div class="settings-grid">
                        <!-- Profile Settings -->
                        <div class="settings-card">
                            <h2 class="settings-title">
                                <span class="material-symbols-outlined">person</span>
                                Profile Information
                            </h2>
                            <p class="settings-desc">Update your personal details</p>
                            
                            <form method="POST" onsubmit="return confirm('Are you sure you want to save these changes?');">
                                <input type="hidden" name="action" value="update_profile">
                                
                                <div class="current-info">
                                    <span class="material-symbols-outlined">badge</span>
                                    <span>LRN: <?= htmlspecialchars($student['lrn_number'] ?? 'N/A') ?></span>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">Full Name</label>
                                    <input type="text" name="full_name" class="form-input" value="<?= htmlspecialchars($student['full_name'] ?? '') ?>" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email Address</label>
                                    <input type="email" name="email" class="form-input" value="<?= htmlspecialchars($student['email'] ?? '') ?>" required>
                                    <p class="form-hint">Used for account recovery and notifications</p>
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <span class="material-symbols-outlined">save</span>
                                    Save Changes
                                </button>
                            </form>
                        </div>

                        <!-- Password Settings -->
                        <div class="settings-card">
                            <h2 class="settings-title">
                                <span class="material-symbols-outlined">lock</span>
                                Security
                            </h2>
                            <p class="settings-desc">Keep your account secure</p>
                            
                            <form method="POST" onsubmit="return confirm('Are you sure you want to change your password?');">
                                <input type="hidden" name="action" value="change_password">
                                <div class="form-group">
                                    <label class="form-label">Current Password</label>
                                    <input type="password" name="current_password" class="form-input" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">New Password</label>
                                    <input type="password" name="new_password" class="form-input" required minlength="6">
                                    <p class="form-hint">Minimum 6 characters</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Confirm New Password</label>
                                    <input type="password" name="confirm_password" class="form-input" required minlength="6">
                                </div>
                                <button type="submit" class="btn btn-primary">
                                    <span class="material-symbols-outlined">key</span>
                                    Change Password
                                </button>
                            </form>
                        </div>

                        <!-- Delete Account -->
                        <div class="settings-card settings-card--danger settings-card--full">
                            <h2 class="settings-title settings-title--danger">
                                <span class="material-symbols-outlined">warning</span>
                                Danger Zone
                            </h2>
                            <p class="settings-desc">Irreversible actions that affect your account</p>
                            
                            <div class="danger-zone">
                                <p><strong>Delete Account:</strong> Once you delete your account, all your data including progress, stars, and achievements will be permanently removed. This action cannot be undone.</p>
                                
                                <form method="POST" onsubmit="return confirm('Are you absolutely sure you want to delete your account? This cannot be undone!');">
                                    <input type="hidden" name="action" value="delete_account">
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Type DELETE to confirm</label>
                                            <input type="text" name="confirm_text" class="form-input form-input--danger" placeholder="DELETE" required>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Enter your password</label>
                                            <input type="password" name="confirm_delete_password" class="form-input form-input--danger" required>
                                        </div>
                                    </div>
                                    <button type="submit" class="btn btn-danger">
                                        <span class="material-symbols-outlined">delete_forever</span>
                                        Delete My Account
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <script src="../js/student/script.js"></script>
    <script src="../js/student/settings.js"></script>
</body>

</html>
