<?php
require_once '../../includes/functions.php';
startSession();
if (!isLoggedIn() || getUserRole() !== 'teacher') {
    redirect('../auth.html');
}
$teacherName = htmlspecialchars(getUserName());
$pdo = getDB();
$teacherId = $_SESSION['user_id'];

// Get all assignments for this teacher
$stmt = $pdo->prepare("
    SELECT sa.id, sa.due_date, sa.created_at, sa.story_id,
           s.title as story_title, s.grade_level,
           st.full_name as student_name, st.id as student_id
    FROM story_assignments sa
    JOIN stories s ON sa.story_id = s.id
    JOIN students_account st ON sa.student_id = st.id
    WHERE sa.teacher_id = ?
    ORDER BY sa.due_date IS NULL, sa.due_date ASC, sa.created_at DESC
");
$stmt->execute([$teacherId]);
$assignments = $stmt->fetchAll();

// Check completion status for each assignment
foreach ($assignments as &$assignment) {
    $checkComplete = $pdo->prepare("
        SELECT id FROM reading_sessions 
        WHERE student_id = ? AND story_id = ?
    ");
    $checkComplete->execute([$assignment['student_id'], $assignment['story_id']]);
    $assignment['is_completed'] = $checkComplete->fetch() ? true : false;
}
unset($assignment);

// Get counts
$totalAssignments = count($assignments);
$completedCount = count(array_filter($assignments, fn($a) => $a['is_completed']));
$pendingCount = $totalAssignments - $completedCount;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Assignments • SalinTinig Teacher</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../css/teacher/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="../css/teacher/assignments.css?v=<?= time() ?>">
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
                <a href="assignments.php" class="nav-link active">
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
                    <h1 class="text-xl font-bold text-slate-800">Assignments</h1>
                </div>
                
                <div class="header-actions">
                    <button class="icon-btn">
                        <span class="material-symbols-outlined">notifications</span>
                        <span class="notification-dot"></span>
                    </button>
                    <a href="stories.php" class="btn-primary flex items-center gap-2" style="text-decoration: none;">
                        <span class="material-symbols-outlined text-sm">add</span>
                        <span>New Assignment</span>
                    </a>
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
                
                <!-- Stats Grid -->
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 2rem;">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-blue-50 text-blue-600">
                                <span class="material-symbols-outlined">assignment</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Total Assigned</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($totalAssignments) ?></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-green-50 text-green-600">
                                <span class="material-symbols-outlined">check_circle</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Completed</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($completedCount) ?></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-orange-50 text-primary">
                                <span class="material-symbols-outlined">pending</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Pending</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($pendingCount) ?></h3>
                        </div>
                    </div>
                </div>

                <!-- Assignments Table -->
                <div class="table-card">
                    <div class="table-header">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">Assignment List</h3>
                            <p class="text-sm text-slate-500">Track student progress on assigned stories</p>
                        </div>
                    </div>

                    <?php if (empty($assignments)): ?>
                        <div class="empty-state" style="padding: 4rem; text-align: center;">
                            <span class="material-symbols-outlined text-4xl text-slate-300 mb-3">assignment_add</span>
                            <h3 class="text-lg font-bold text-slate-700">No Assignments Yet</h3>
                            <p class="text-slate-500 mb-4">You haven't assigned any stories yet.</p>
                            <a href="stories.php" class="btn-primary" style="display: inline-flex; text-decoration: none;">Browse Stories</a>
                        </div>
                    <?php else: ?>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Story</th>
                                    <th>Student</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Assigned Date</th>
                                    <th style="text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($assignments as $assignment): ?>
                                    <tr>
                                        <td>
                                            <div class="flex flex-col">
                                                <span class="text-sm font-bold text-slate-900"><?= htmlspecialchars($assignment['story_title']) ?></span>
                                                <span class="text-xs text-slate-500">Grade <?= htmlspecialchars($assignment['grade_level']) ?></span>
                                            </div>
                                        </td>
                                        <td class="text-sm text-slate-800 font-medium"><?= htmlspecialchars($assignment['student_name']) ?></td>
                                        <td class="text-sm text-slate-600">
                                            <?php if ($assignment['due_date']): ?>
                                                <?= date('M j, Y', strtotime($assignment['due_date'])) ?>
                                            <?php else: ?>
                                                <span class="text-slate-400">No due date</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($assignment['is_completed']): ?>
                                                <span class="status-badge" style="background-color: #ECFDF5; color: #059669;">
                                                    <span class="material-symbols-outlined text-sm">check_circle</span>
                                                    Completed
                                                </span>
                                            <?php else: ?>
                                                <span class="status-badge warning" style="background-color: #FFF7ED; color: #EA580C;">
                                                    <span class="material-symbols-outlined text-sm">schedule</span>
                                                    Pending
                                                </span>
                                            <?php endif; ?>
                                        </td>
                                        <td class="text-sm text-slate-500"><?= date('M j, Y', strtotime($assignment['created_at'])) ?></td>
                                        <td style="text-align: right;">
                                            <button class="icon-btn text-red-600" onclick="deleteAssignment(<?= $assignment['id'] ?>)" title="Delete Assignment">
                                                <span class="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </div>
            </div>
        </main>
    </div>

    <script src="../js/teacher/assignments.js"></script>
    <script>
        function toggleProfileDropdown() { document.getElementById('profileMenu').classList.toggle('show'); }
        document.addEventListener('click', e => { if (!e.target.closest('.profile-dropdown')) document.getElementById('profileMenu')?.classList.remove('show'); });
    </script>
</body>
</html>
