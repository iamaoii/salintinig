<?php
require_once '../../includes/functions.php';
startSession();
if (!isLoggedIn() || getUserRole() !== 'teacher') {
    redirect('../auth.html');
}

$teacherName = htmlspecialchars(getUserName());

// Get teacher data
$pdo = getDB();
$stmt = $pdo->prepare("SELECT * FROM teachers_account WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$teacher = $stmt->fetch();

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
                $stmt = $pdo->prepare("UPDATE teachers_account SET full_name = ?, email = ? WHERE id = ?");
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
        } elseif (verifyPassword($currentPassword, $teacher['password_hash'])) {
            if ($newPassword === $confirmPassword && strlen($newPassword) >= 6) {
                $newHash = hashPassword($newPassword);
                $stmt = $pdo->prepare("UPDATE teachers_account SET password_hash = ? WHERE id = ?");
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
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Settings • SalinTinig Teacher</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../css/teacher/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="../css/teacher/settings.css?v=<?= time() ?>">
</head>

<body>
    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-icon">
                    <span class="material-symbols-outlined">graphic_eq</span>
                </div>
                <div class="brand-text">
                    <h1>SalinTinig</h1>
                    <p>Teacher Dashboard</p>
                </div>
            </div>
            
            <nav class="nav-menu">
                <a href="dashboard.php" class="nav-link">
                    <span class="material-symbols-outlined">dashboard</span>
                    <span>Overview</span>
                </a>
                <a href="students.php" class="nav-link">
                    <span class="material-symbols-outlined">group</span>
                    <span>Students</span>
                </a>
                <a href="stories.php" class="nav-link">
                    <span class="material-symbols-outlined">auto_stories</span>
                    <span>Stories</span>
                </a>
                <a href="assignments.php" class="nav-link">
                    <span class="material-symbols-outlined">assignment</span>
                    <span>Assignments</span>
                </a>
                <a href="reports.php" class="nav-link">
                    <span class="material-symbols-outlined">analytics</span>
                    <span>Reports</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <div class="header-title">
                    <h1 class="text-xl font-bold text-slate-800">Account Settings</h1>
                </div>
                
                <div class="header-actions">
                    <button class="icon-btn">
                        <span class="material-symbols-outlined">notifications</span>
                        <span class="notification-dot"></span>
                    </button>
                    <div class="profile-dropdown">
                        <button class="profile-trigger" onclick="toggleProfileDropdown()">
                            <div class="user-avatar"><?= substr($teacherName, 0, 1) ?></div>
                            <span class="material-symbols-outlined" style="font-size: 1.25rem; color: #64748B;">expand_more</span>
                        </button>
                        <div class="profile-menu" id="profileMenu">
                            <div class="profile-menu-header">
                                <p class="font-bold text-slate-800"><?= $teacherName ?></p>
                                <p class="text-xs text-slate-500">Teacher</p>
                            </div>
                            <div class="profile-menu-divider"></div>
                            <a href="settings.php" class="profile-menu-item"><span class="material-symbols-outlined">settings</span>Settings</a>
                            <a href="support.php" class="profile-menu-item"><span class="material-symbols-outlined">help</span>Support</a>
                            <div class="profile-menu-divider"></div>
                            <a href="../logout.php" class="profile-menu-item profile-menu-item--danger"><span class="material-symbols-outlined">logout</span>Logout</a>
                        </div>
                    </div>
                </div>
            </header>

            <div class="content-wrapper">
                
                <?php if ($message): ?>
                    <div class="status-badge" style="background-color: #ECFDF5; color: #059669; margin-bottom: 2rem; width: 100%; justify-content: center; padding: 1rem;">
                        <span class="material-symbols-outlined">check_circle</span>
                        <?= $message ?>
                    </div>
                <?php endif; ?>
                
                <?php if ($error): ?>
                    <div class="status-badge" style="background-color: #FEF2F2; color: #DC2626; margin-bottom: 2rem; width: 100%; justify-content: center; padding: 1rem;">
                        <span class="material-symbols-outlined">error</span>
                        <?= $error ?>
                    </div>
                <?php endif; ?>

                <div class="charts-grid">
                    <!-- Profile Settings -->
                    <div class="chart-card">
                        <div class="chart-header">
                            <div>
                                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-primary">person</span>
                                    Profile Information
                                </h2>
                                <p class="text-sm text-slate-500">Update your personal details</p>
                            </div>
                        </div>
                        
                        <form method="POST" onsubmit="return confirm('Are you sure you want to save these changes?');">
                            <input type="hidden" name="action" value="update_profile">
                            <div class="form-group">
                                <label class="form-label">Full Name</label>
                                <input type="text" name="full_name" class="form-control" value="<?= htmlspecialchars($teacher['full_name'] ?? '') ?>" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email Address</label>
                                <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($teacher['email'] ?? '') ?>" required>
                            </div>
                            <button type="submit" class="btn-primary flex items-center justify-center gap-2 w-full" style="width: 100%;">
                                <span class="material-symbols-outlined">save</span>
                                Save Changes
                            </button>
                        </form>
                    </div>

                    <!-- Password Settings -->
                    <div class="chart-card">
                        <div class="chart-header">
                            <div>
                                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span class="material-symbols-outlined text-primary">lock</span>
                                    Security
                                </h2>
                                <p class="text-sm text-slate-500">Keep your account secure</p>
                            </div>
                        </div>
                        
                        <form method="POST" onsubmit="return confirm('Are you sure you want to change your password?');">
                            <input type="hidden" name="action" value="change_password">
                            <div class="form-group">
                                <label class="form-label">Current Password</label>
                                <input type="password" name="current_password" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">New Password</label>
                                <input type="password" name="new_password" class="form-control" required minlength="6">
                                <p class="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Confirm New Password</label>
                                <input type="password" name="confirm_password" class="form-control" required minlength="6">
                            </div>
                            <button type="submit" class="btn-primary flex items-center justify-center gap-2" style="width: 100%;">
                                <span class="material-symbols-outlined">key</span>
                                Change Password
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Danger Zone (Delete Account) -->
                <div class="chart-card mt-6" style="border-color: #dc2626;">
                    <div class="chart-header">
                        <div>
                            <h2 class="text-lg font-bold text-red-600 flex items-center gap-2">
                                <span class="material-symbols-outlined">warning</span>
                                Danger Zone
                            </h2>
                            <p class="text-sm text-slate-500">Irreversible account actions</p>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold text-slate-800">Delete Account</p>
                            <p class="text-sm text-slate-500">Once you delete your account, there is no going back. Please be certain.</p>
                        </div>
                        <button class="btn-danger" onclick="if(confirm('Are you absolutely sure? This cannot be undone.')) alert('Please contact admin to delete account.');">
                            Delete Account
                        </button>
                    </div>
                </div>

            </div>
        </main>
    </div>
    <script>
        function toggleProfileDropdown() { document.getElementById('profileMenu').classList.toggle('show'); }
        document.addEventListener('click', e => { if (!e.target.closest('.profile-dropdown')) document.getElementById('profileMenu')?.classList.remove('show'); });
    </script>
</body>
</html>
