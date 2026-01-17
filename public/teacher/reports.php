<?php
session_start();
require_once '../../includes/functions.php';
if (!isLoggedIn() || getUserRole() !== 'teacher') {
    redirect('../auth.html');
}
$teacherName = htmlspecialchars(getUserName());

// Get database connection
$pdo = getDB();

// Get overall stats
$stmt = $pdo->query("SELECT COUNT(*) as total FROM students_account WHERE is_active = 1");
$totalStudents = $stmt->fetch()['total'] ?? 0;

$stmt = $pdo->query("SELECT SUM(stories_read) as total FROM student_progress");
$totalStoriesRead = $stmt->fetch()['total'] ?? 0;

$stmt = $pdo->query("SELECT SUM(total_reading_time) as total FROM student_progress");
$totalReadingTime = $stmt->fetch()['total'] ?? 0;

// Calculate average accuracy from stars (5 stars = 100%)
$stmt = $pdo->query("SELECT COALESCE(ROUND(AVG(stars_earned) * 20, 0), 0) as avg FROM reading_sessions WHERE stars_earned > 0");
$avgAccuracy = round($stmt->fetch()['avg'] ?? 0, 1);

// Get top performers
$stmt = $pdo->query("
    SELECT s.full_name, p.total_stars, p.stories_read, p.current_streak
    FROM students_account s
    JOIN student_progress p ON s.id = p.student_id
    ORDER BY p.total_stars DESC
    LIMIT 5
");
$topPerformers = $stmt->fetchAll();

// Get students needing attention (low activity - no streak)
$stmt = $pdo->query("
    SELECT s.full_name, p.total_stars, p.current_streak, s.created_at,
           (SELECT MAX(rs.completed_at) FROM reading_sessions rs WHERE rs.student_id = s.id) as last_activity_date
    FROM students_account s
    LEFT JOIN student_progress p ON s.id = p.student_id
    WHERE COALESCE(p.current_streak, 0) = 0 OR COALESCE(p.stories_read, 0) = 0
    ORDER BY p.total_stars ASC
    LIMIT 5
");
$needsAttention = $stmt->fetchAll();

// Get reading sessions by day for chart
$stmt = $pdo->query("
    SELECT DATE(started_at) as date, COUNT(*) as count, COUNT(*) * 5 as minutes
    FROM reading_sessions
    WHERE started_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    GROUP BY DATE(started_at)
    ORDER BY date ASC
");
$dailyData = $stmt->fetchAll();

// Get grade level distribution
$stmt = $pdo->query("
    SELECT grade_level, COUNT(*) as count
    FROM students_account
    GROUP BY grade_level
    ORDER BY grade_level ASC
");
$gradeDistribution = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Reports • SalinTinig Teacher</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../css/teacher/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="../css/teacher/reports.css?v=<?= time() ?>">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                <a href="reports.php" class="nav-link active">
                    <span class="material-symbols-outlined">analytics</span>
                    <span>Reports</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <div class="header-title">
                    <h1 class="text-xl font-bold text-slate-800">Class Reports</h1>
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
                
                <!-- Overview Stats -->
                <div class="stats-grid" style="margin-bottom: 2rem;">
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
                            <div class="stat-icon bg-blue-50 text-blue-600">
                                <span class="material-symbols-outlined">menu_book</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Stories Read</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($totalStoriesRead) ?></h3>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-green-50 text-green-600">
                                <span class="material-symbols-outlined">schedule</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Reading Time</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= number_format($totalReadingTime) ?></h3>
                            <span class="text-xs font-bold text-slate-500">mins</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-header">
                            <div class="stat-icon bg-purple-50 text-purple-600">
                                <span class="material-symbols-outlined">verified</span>
                            </div>
                            <span class="text-sm font-bold text-slate-400 uppercase tracking-tight">Avg Accuracy</span>
                        </div>
                        <div class="stat-value">
                            <h3 class="text-4xl font-bold text-slate-900"><?= $avgAccuracy ?>%</h3>
                        </div>
                    </div>
                </div>

                <!-- Charts Grid -->
                <div class="charts-grid">
                    <!-- Activity Chart -->
                    <div class="chart-card">
                        <div class="chart-header">
                            <div>
                                <h3 class="text-lg font-bold text-slate-800">Reading Activity</h3>
                                <p class="text-sm text-slate-500">Number of reading sessions over the last 30 days</p>
                            </div>
                        </div>
                        <div style="height: 300px;">
                            <canvas id="activityChart"></canvas>
                        </div>
                    </div>

                    <!-- Grade Distribution -->
                    <div class="chart-card">
                        <div class="chart-header">
                            <div>
                                <h3 class="text-lg font-bold text-slate-800">Students by Grade</h3>
                                <p class="text-sm text-slate-500">Distribution of students across grade levels</p>
                            </div>
                        </div>
                        <div style="height: 300px; display: flex; align-items: center; justify-content: center;">
                            <canvas id="gradeChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Detailed Lists Grid -->
                <div class="charts-grid">
                    <!-- Top Performers -->
                    <div class="table-card" style="margin-bottom: 0;">
                        <div class="table-header">
                            <div>
                                <h3 class="text-lg font-bold text-slate-800">Top Performers</h3>
                                <p class="text-sm text-slate-500">Highest achieving students based on total stars</p>
                            </div>
                        </div>
                        <div class="p-4">
                            <?php if (empty($topPerformers)): ?>
                                <div class="empty-state p-8 text-center">
                                    <span class="material-symbols-outlined text-4xl text-slate-300">emoji_events</span>
                                    <p class="text-slate-500 mt-2">No data available yet</p>
                                </div>
                            <?php else: ?>
                                <div class="flex flex-col gap-2">
                                    <?php foreach ($topPerformers as $index => $student): ?>
                                        <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                            <div class="w-8 h-8 rounded-full bg-orange-100 text-primary flex items-center justify-center font-bold text-sm">
                                                <?= $index + 1 ?>
                                            </div>
                                            <div class="flex-1">
                                                <h4 class="font-bold text-slate-800 text-sm"><?= htmlspecialchars($student['full_name']) ?></h4>
                                                <p class="text-xs text-slate-500"><?= $student['stories_read'] ?> stories • <?= $student['current_streak'] ?> day streak</p>
                                            </div>
                                            <div class="flex items-center gap-1 text-yellow-500 font-bold text-sm">
                                                <span class="material-symbols-outlined text-sm">star</span>
                                                <?= number_format($student['total_stars']) ?>
                                            </div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- Needs Attention -->
                    <div class="table-card" style="margin-bottom: 0;">
                        <div class="table-header">
                            <div>
                                <h3 class="text-lg font-bold text-slate-800">Needs Attention</h3>
                                <p class="text-sm text-slate-500">Students with low activity in the past week</p>
                            </div>
                        </div>
                        <div style="padding: 1rem;">
                            <?php if (empty($needsAttention)): ?>
                                <div style="padding: 2rem; text-align: center;">
                                    <span class="material-symbols-outlined" style="font-size: 3rem; color: #86EFAC;">check_circle</span>
                                    <p style="color: #64748B; margin-top: 0.5rem;">Everyone is actively learning!</p>
                                </div>
                            <?php else: ?>
                                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                    <?php foreach ($needsAttention as $student): ?>
                                        <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 0.75rem; border-left: 4px solid #EF4444; background: #FEF2F2;">
                                            <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #FCA5A5, #F87171); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.875rem;">
                                                <?= strtoupper(substr($student['full_name'], 0, 2)) ?>
                                            </div>
                                            <div style="flex: 1;">
                                                <h4 style="font-weight: 600; color: #1E293B; font-size: 0.9rem; margin: 0;"><?= htmlspecialchars($student['full_name']) ?></h4>
                                                <p style="font-size: 0.75rem; color: #DC2626; margin: 0.25rem 0 0 0;">
                                                    <?php if (!empty($student['last_activity_date'])): ?>
                                                        Last active: <?= date('M j, Y', strtotime($student['last_activity_date'])) ?>
                                                    <?php else: ?>
                                                        No activity recorded
                                                    <?php endif; ?>
                                                </p>
                                            </div>
                                            <span class="material-symbols-outlined" style="color: #F59E0B; font-size: 1.5rem;">warning</span>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <!-- Pass PHP data to JS -->
    <script>
        window.reportsData = {
            dailyActivity: <?= json_encode($dailyData) ?>,
            gradeDistribution: <?= json_encode($gradeDistribution) ?>
        };
    </script>
    <script src="../js/teacher/reports.js"></script>
    <script>
        function toggleProfileDropdown() { document.getElementById('profileMenu').classList.toggle('show'); }
        document.addEventListener('click', e => { if (!e.target.closest('.profile-dropdown')) document.getElementById('profileMenu')?.classList.remove('show'); });
    </script>
</body>
</html>
