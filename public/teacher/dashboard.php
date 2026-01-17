<?php
session_start();
require_once '../../includes/functions.php';
if (!isLoggedIn() || getUserRole() !== 'teacher') {
    redirect('../auth.html');
}
$teacherName = htmlspecialchars(getUserName());

// Get database connection and fetch stats
$pdo = getDB();

// Get total students count
$stmt = $pdo->query("SELECT COUNT(*) as total FROM students_account WHERE is_active = 1");
$totalStudents = $stmt->fetch()['total'] ?? 0;

// Get total stories count
$stmt = $pdo->query("SELECT COUNT(*) as total FROM stories");
$totalStories = $stmt->fetch()['total'] ?? 0;

// Get total stars earned by all students
$stmt = $pdo->query("SELECT SUM(total_stars) as total FROM student_progress");
$totalStars = $stmt->fetch()['total'] ?? 0;

// Get total reading sessions this month
$stmt = $pdo->query("SELECT COUNT(*) as total FROM reading_sessions WHERE MONTH(started_at) = MONTH(CURRENT_DATE()) AND YEAR(started_at) = YEAR(CURRENT_DATE())");
$sessionsThisMonth = $stmt->fetch()['total'] ?? 0;

// Get top performing students
$stmt = $pdo->query("
    SELECT s.full_name, s.grade_level, p.total_stars, p.current_streak, p.stories_read
    FROM students_account s
    LEFT JOIN student_progress p ON s.id = p.student_id
    WHERE s.is_active = 1
    ORDER BY p.total_stars DESC
    LIMIT 5
");
$topStudents = $stmt->fetchAll();

// Get recent reading sessions
$stmt = $pdo->query("
    SELECT s.full_name, st.title, rs.stars_earned, rs.started_at
    FROM reading_sessions rs
    JOIN students_account s ON rs.student_id = s.id
    JOIN stories st ON rs.story_id = st.id
    ORDER BY rs.started_at DESC
    LIMIT 5
");
$recentSessions = $stmt->fetchAll();

// Get reading progress data for chart (last 7 days)
$stmt = $pdo->query("
    SELECT DATE(started_at) as date, COUNT(*) as sessions
    FROM reading_sessions
    WHERE started_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    GROUP BY DATE(started_at)
    ORDER BY date ASC
");
$chartData = $stmt->fetchAll();

// Get total stories read across all students
$stmt = $pdo->query("SELECT COALESCE(SUM(stories_read), 0) as total FROM student_progress");
$totalStoriesRead = $stmt->fetch()['total'] ?? 0;

// Get total reading time estimate (count sessions * avg 5 mins as rough estimate since no duration column)
$stmt = $pdo->query("SELECT COUNT(*) * 5 as total FROM reading_sessions");
$totalReadingTime = $stmt->fetch()['total'] ?? 0;

// Get average stars as accuracy proxy (since no accuracy_score column exists)
$stmt = $pdo->query("SELECT COALESCE(ROUND(AVG(stars_earned) * 20, 0), 0) as avg FROM reading_sessions WHERE stars_earned > 0");
$avgAccuracy = $stmt->fetch()['avg'] ?? 0;

// Get students by grade level
$stmt = $pdo->query("
    SELECT grade_level, COUNT(*) as count
    FROM students_account
    WHERE is_active = 1
    GROUP BY grade_level
    ORDER BY grade_level ASC
");
$studentsByGrade = $stmt->fetchAll();
$gradeLabels = [];
$gradeData = [];
foreach ($studentsByGrade as $grade) {
    $gradeLabels[] = "Grade " . $grade['grade_level'];
    $gradeData[] = (int)$grade['count'];
}

// Get students needing attention (low activity - no streak or stories)
$stmt = $pdo->query("
    SELECT s.id, s.full_name, s.grade_level, 
           COALESCE(p.total_stars, 0) as total_stars,
           COALESCE(p.current_streak, 0) as current_streak,
           COALESCE(p.stories_read, 0) as stories_read,
           (SELECT MAX(rs.completed_at) FROM reading_sessions rs WHERE rs.student_id = s.id) as last_activity
    FROM students_account s
    LEFT JOIN student_progress p ON s.id = p.student_id
    WHERE s.is_active = 1 
    AND (COALESCE(p.current_streak, 0) = 0 OR COALESCE(p.stories_read, 0) < 3)
    ORDER BY COALESCE(p.stories_read, 0) ASC, s.full_name ASC
    LIMIT 5
");
$needsAttention = $stmt->fetchAll();

// Prepare chart data for last 7 days
$activityLabels = [];
$activityData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $activityLabels[] = date('D', strtotime($date));
    $found = false;
    foreach ($chartData as $day) {
        if ($day['date'] === $date) {
            $activityData[] = (int)$day['sessions'];
            $found = true;
            break;
        }
    }
    if (!$found) $activityData[] = 0;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Dashboard • SalinTinig Teacher</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../css/teacher/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="../css/teacher/dashboard.css?v=<?= time() ?>">
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
                <a href="dashboard.php" class="nav-link active">
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
                    <input type="text" class="search-input" placeholder="Search for students, stories, or assignments...">
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
                <div class="stats-grid">
                    <!-- Total Students -->
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

                    <!-- Stories Read -->
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

                    <!-- Reading Time -->
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

                    <!-- Avg Accuracy -->
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
                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="text-xl font-bold text-slate-800">Reading Activity</h3>
                        </div>
                        <div style="height: 250px;">
                            <canvas id="activityChart"></canvas>
                        </div>
                    </div>

                    <div class="chart-card">
                        <div class="chart-header">
                            <h3 class="text-xl font-bold text-slate-800">Students by Grade</h3>
                        </div>
                        <div style="height: 250px;">
                            <canvas id="gradeChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Needs Attention Table -->
                <div class="table-card">
                    <div class="table-header">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="material-symbols-outlined text-primary font-bold">flag</span>
                                <h3 class="text-lg font-bold text-slate-800">Priority Intervention List</h3>
                            </div>
                            <p class="text-sm text-slate-500">Students needing attention based on recent activity</p>
                        </div>
                    </div>

                    <?php if (empty($needsAttention)): ?>
                        <div class="empty-state" style="padding: 3rem; text-align: center;">
                            <span class="material-symbols-outlined text-4xl text-slate-400 mb-2">celebration</span>
                            <p class="text-slate-500">All students are doing great!</p>
                        </div>
                    <?php else: ?>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Student Details</th>
                                    <th>Status</th>
                                    <th style="text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($needsAttention as $student): ?>
                                <tr>
                                    <td>
                                        <div class="student-cell">
                                            <div class="student-avatar-small">
                                                <?= substr($student['full_name'], 0, 2) ?>
                                            </div>
                                            <div>
                                                <p class="text-sm font-bold text-slate-900"><?= htmlspecialchars($student['full_name']) ?></p>
                                                <p class="text-xs text-slate-500 mt-1">
                                                    <?php if (!empty($student['last_activity'])): ?>
                                                        Last active: <?= date('M j, Y', strtotime($student['last_activity'])) ?>
                                                    <?php else: ?>
                                                        No activity recorded
                                                    <?php endif; ?>
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="status-badge warning">
                                            <span class="material-symbols-outlined" style="font-size: 16px;">priority_high</span>
                                            Needs Attention
                                        </div>
                                    </td>
                                    <td style="text-align: right;">
                                        <a href="students.php?search=<?= urlencode($student['full_name']) ?>" class="btn-sm">Review</a>
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

    <!-- Pass PHP data to JS and initialize charts -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Reading Activity Chart
            const activityCtx = document.getElementById('activityChart');
            if (activityCtx) {
                new Chart(activityCtx, {
                    type: 'bar',
                    data: {
                        labels: <?= json_encode($activityLabels) ?>,
                        datasets: [{
                            label: 'Reading Sessions',
                            data: <?= json_encode($activityData) ?>,
                            backgroundColor: 'rgba(255, 107, 0, 0.8)',
                            hoverBackgroundColor: '#FF6B00',
                            borderRadius: 6,
                            borderSkipped: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { stepSize: 1, color: '#64748B' },
                                grid: { color: '#F1F5F9' }
                            },
                            x: {
                                ticks: { color: '#64748B' },
                                grid: { display: false }
                            }
                        }
                    }
                });
            }

            // Students by Grade Chart
            const gradeCtx = document.getElementById('gradeChart');
            if (gradeCtx) {
                new Chart(gradeCtx, {
                    type: 'doughnut',
                    data: {
                        labels: <?= json_encode($gradeLabels) ?>,
                        datasets: [{
                            data: <?= json_encode($gradeData) ?>,
                            backgroundColor: ['#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { 
                                    usePointStyle: true,
                                    font: { size: 12 }
                                }
                            }
                        }
                    }
                });
            }
        });

        // Profile dropdown toggle
        function toggleProfileDropdown() {
            document.getElementById('profileMenu').classList.toggle('show');
        }
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.profile-dropdown')) {
                document.getElementById('profileMenu')?.classList.remove('show');
            }
        });
    </script>
</body>
</html>
