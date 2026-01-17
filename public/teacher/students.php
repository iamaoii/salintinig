<?php
require_once '../../includes/functions.php';
startSession();
if (!isLoggedIn() || getUserRole() !== 'teacher') {
    redirect('../auth.html');
}
$teacherName = htmlspecialchars(getUserName());

// Get database connection
$pdo = getDB();

// Fetch all students with their progress
$stmt = $pdo->query("
    SELECT 
        s.id,
        s.full_name,
        s.email,
        s.lrn_number,
        s.grade_level,
        s.is_active,
        s.created_at,
        COALESCE(p.total_stars, 0) as total_stars,
        COALESCE(p.current_streak, 0) as current_streak,
        COALESCE(p.stories_read, 0) as stories_read,
        COALESCE(p.current_level, 1) as current_level,
        COALESCE(p.total_reading_time, 0) as total_reading_time
    FROM students_account s
    LEFT JOIN student_progress p ON s.id = p.student_id
    ORDER BY s.full_name ASC
");
$students = $stmt->fetchAll();

// Get summary stats
$totalStudents = count($students);
$activeStudents = count(array_filter($students, fn($s) => $s['is_active']));
$totalReading = array_sum(array_column($students, 'total_reading_time'));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Students • SalinTinig Teacher</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../css/teacher/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="../css/teacher/students.css?v=<?= time() ?>">
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
                <a href="students.php" class="nav-link active">
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

            <div class="sidebar-footer">
                <div class="goal-card">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-bold text-slate-500 uppercase tracking-tight">Active Students</span>
                        <span class="text-xs font-bold text-primary"><?= number_format($totalStudents) ?></span>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <div class="search-container">
                    <span class="material-symbols-outlined search-icon">search</span>
                    <input type="text" id="searchInput" class="search-input" placeholder="Search students..." onkeyup="filterStudents()">
                </div>
                
                <div class="header-actions">
                    <button class="icon-btn">
                        <span class="material-symbols-outlined">notifications</span>
                        <span class="notification-dot"></span>
                    </button>
                    
                    <div class="profile-dropdown">
                        <button class="profile-trigger" onclick="toggleProfileDropdown()">
                            <div class="user-avatar">
                                <?= substr($teacherName, 0, 1) ?>
                            </div>
                            <span class="material-symbols-outlined" style="font-size: 1.25rem; color: #64748B;">expand_more</span>
                        </button>
                        <div class="profile-menu" id="profileMenu">
                            <div class="profile-menu-header">
                                <p class="font-bold text-slate-800"><?= $teacherName ?></p>
                                <p class="text-xs text-slate-500">Teacher</p>
                            </div>
                            <div class="profile-menu-divider"></div>
                            <a href="settings.php" class="profile-menu-item">
                                <span class="material-symbols-outlined">settings</span>
                                Settings
                            </a>
                            <a href="support.php" class="profile-menu-item">
                                <span class="material-symbols-outlined">help</span>
                                Support
                            </a>
                            <div class="profile-menu-divider"></div>
                            <a href="../logout.php" class="profile-menu-item profile-menu-item--danger">
                                <span class="material-symbols-outlined">logout</span>
                                Logout
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <div class="content-wrapper">
                
                <!-- Stats Grid -->
                <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 2rem;">
                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-orange-50 text-primary">
                                <span class="material-symbols-outlined">groups</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Total Students</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($totalStudents) ?></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-green-50 text-green-600">
                                <span class="material-symbols-outlined">check_circle</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Active Students</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($activeStudents) ?></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-blue-50 text-blue-600">
                                <span class="material-symbols-outlined">schedule</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Total Reading Time</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($totalReading) ?></h3>
                            <span class="text-xs font-bold text-slate-500">mins</span>
                        </div>
                    </div>
                </div>

                <!-- Students Table -->
                <div class="table-card">
                    <div class="table-header">
                        <div>
                            <h3 class="text-lg font-bold text-slate-800">All Students</h3>
                            <p class="text-sm text-slate-500">Manage your class roster and view progress</p>
                        </div>
                    </div>

                    <?php if (empty($students)): ?>
                        <div class="empty-state" style="padding: 4rem; text-align: center;">
                            <span class="material-symbols-outlined text-4xl text-slate-300 mb-3">person_search</span>
                            <h3 class="text-lg font-bold text-slate-700">No Students Yet</h3>
                            <p class="text-slate-500">Students will appear here once they register.</p>
                        </div>
                    <?php else: ?>
                        <table class="data-table" id="studentsTable">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>LRN</th>
                                    <th>Grade</th>
                                    <th>Level & Streak</th>
                                    <th>Stars</th>
                                    <th>Stories</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($students as $student): ?>
                                    <tr>
                                        <td>
                                            <div class="student-cell">
                                                <div class="student-avatar-small">
                                                    <?= strtoupper(substr($student['full_name'], 0, 1)) ?>
                                                </div>
                                                <div>
                                                    <p class="text-sm font-bold text-slate-900"><?= htmlspecialchars($student['full_name']) ?></p>
                                                    <p class="text-xs text-slate-500 mt-1"><?= htmlspecialchars($student['email']) ?></p>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="text-sm text-slate-600"><?= htmlspecialchars($student['lrn_number']) ?></td>
                                        <td class="text-sm text-slate-600">Grade <?= $student['grade_level'] ?? '-' ?></td>
                                        <td>
                                            <div class="flex flex-col gap-1">
                                                <span class="text-xs font-bold text-primary">Lv <?= $student['current_level'] ?></span>
                                                <span class="text-xs text-slate-500">🔥 <?= $student['current_streak'] ?> days</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div class="flex items-center gap-1 text-slate-700 font-bold text-sm">
                                                <span class="material-symbols-outlined text-yellow-500 text-sm">star</span>
                                                <?= number_format($student['total_stars']) ?>
                                            </div>
                                        </td>
                                        <td class="text-sm font-bold text-slate-700"><?= $student['stories_read'] ?></td>
                                        <td>
                                            <?php if ($student['is_active']): ?>
                                                <div class="status-badge" style="background-color: #ECFDF5; color: #059669;">
                                                    <span class="material-symbols-outlined text-sm">check_circle</span>
                                                    Active
                                                </div>
                                            <?php else: ?>
                                                <div class="status-badge" style="background-color: #F3F4F6; color: #6B7280;">
                                                    <span class="material-symbols-outlined text-sm">cancel</span>
                                                    Inactive
                                                </div>
                                            <?php endif; ?>
                                        </td>
                                        <td style="text-align: right;">
                                            <button onclick="viewStudent(<?= $student['id'] ?>)" class="icon-btn" title="View Details">
                                                <span class="material-symbols-outlined">visibility</span>
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

    <script src="../js/teacher/students.js"></script>
    <script>
        function toggleProfileDropdown() {
            document.getElementById('profileMenu').classList.toggle('show');
        }
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.profile-dropdown')) {
                document.getElementById('profileMenu')?.classList.remove('show');
            }
        });
    </script>
</body>
</html>
