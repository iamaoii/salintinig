<?php
require_once __DIR__ . '/../../includes/functions.php';
startSession();

if (!isLoggedIn() || getUserRole() !== 'student') {
    header('Location: ../auth.html');
    exit();
}

$studentName = htmlspecialchars(getUserName());

// Get student data from database
$pdo = getDB();
$stmt = $pdo->prepare("SELECT * FROM students_account WHERE id = ?");
$stmt->execute([$_SESSION['user_id']]);
$student = $stmt->fetch();

// Get student progress data
$progressData = null;
try {
    $stmt = $pdo->prepare("SELECT * FROM student_progress WHERE student_id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $progressData = $stmt->fetch();
} catch (PDOException $e) {
    // Table might not exist or no data
}

// Default values if no progress data
$starsEarned = $progressData['stars_earned'] ?? 0;
$dayStreak = $progressData['current_streak'] ?? 0;
$storiesRead = $progressData['stories_completed'] ?? 0;
$totalReadingTime = $progressData['total_reading_time'] ?? 0;
$currentLevel = $progressData['current_level'] ?? 1;
$currentXP = $progressData['current_xp'] ?? 0;

// Level names
$levelNames = [
    1 => 'Beginner Reader',
    2 => 'Word Explorer',
    3 => 'Story Seeker',
    4 => 'Book Champion',
    5 => 'Reading Master'
];
$levelName = $levelNames[$currentLevel] ?? 'Beginner Reader';

// Calculate reading time in hours/mins
$readingHours = floor($totalReadingTime / 60);
$readingMins = $totalReadingTime % 60;
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig - My Profile</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />
    <link rel="stylesheet" href="../css/student/style.css" />
    <link rel="stylesheet" href="../css/student/profile.css" />
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
                <div class="profile-page">
                    <!-- Hero Section -->
                    <div class="profile-hero">
                        <div class="profile-hero-content">
                            <div class="profile-avatar">
                                <?= strtoupper(substr($studentName, 0, 1)) ?>
                            </div>
                            <div class="profile-info">
                                <h1><?= $studentName ?></h1>
                                <p><?= htmlspecialchars($student['email'] ?? '') ?></p>
                                <div class="profile-level">
                                    <span class="material-symbols-outlined">workspace_premium</span>
                                    <span>Level <?= $currentLevel ?> - <?= $levelName ?></span>
                                </div>
                                <a href="settings.php" class="edit-profile-btn">
                                    <span class="material-symbols-outlined">edit</span>
                                    Edit Profile
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Stats Grid -->
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon stat-icon--stars">
                                <span class="material-symbols-outlined">star</span>
                            </div>
                            <div class="stat-value"><?= number_format($starsEarned) ?></div>
                            <div class="stat-label">Stars Earned</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon--streak">
                                <span class="material-symbols-outlined">local_fire_department</span>
                            </div>
                            <div class="stat-value"><?= $dayStreak ?></div>
                            <div class="stat-label">Day Streak</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon--stories">
                                <span class="material-symbols-outlined">auto_stories</span>
                            </div>
                            <div class="stat-value"><?= $storiesRead ?></div>
                            <div class="stat-label">Stories Read</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon stat-icon--time">
                                <span class="material-symbols-outlined">schedule</span>
                            </div>
                            <div class="stat-value"><?= $readingHours ?>h <?= $readingMins ?>m</div>
                            <div class="stat-label">Reading Time</div>
                        </div>
                    </div>

                    <!-- Content Grid -->
                    <div class="content-grid">
                        <!-- Account Info -->
                        <div class="content-card">
                            <h3>
                                <span class="material-symbols-outlined">person</span>
                                Account Information
                            </h3>
                            <div class="info-list">
                                <div class="info-item">
                                    <span class="material-symbols-outlined">badge</span>
                                    <div class="info-item-content">
                                        <div class="info-item-label">LRN Number</div>
                                        <div class="info-item-value"><?= htmlspecialchars($student['lrn_number'] ?? 'N/A') ?></div>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <span class="material-symbols-outlined">mail</span>
                                    <div class="info-item-content">
                                        <div class="info-item-label">Email Address</div>
                                        <div class="info-item-value"><?= htmlspecialchars($student['email'] ?? 'N/A') ?></div>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <span class="material-symbols-outlined">calendar_month</span>
                                    <div class="info-item-content">
                                        <div class="info-item-label">Member Since</div>
                                        <div class="info-item-value"><?= isset($student['created_at']) ? date('F j, Y', strtotime($student['created_at'])) : 'N/A' ?></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Achievements -->
                        <div class="content-card">
                            <h3>
                                <span class="material-symbols-outlined">emoji_events</span>
                                Achievements
                            </h3>
                            <div class="achievements-list">
                                <div class="achievement <?= $storiesRead >= 1 ? '' : 'achievement-locked' ?>">
                                    <div class="achievement-icon">
                                        <span class="material-symbols-outlined">auto_stories</span>
                                    </div>
                                    <div class="achievement-info">
                                        <h4>First Story</h4>
                                        <p>Complete your first story</p>
                                    </div>
                                </div>
                                <div class="achievement <?= $dayStreak >= 7 ? '' : 'achievement-locked' ?>">
                                    <div class="achievement-icon">
                                        <span class="material-symbols-outlined">local_fire_department</span>
                                    </div>
                                    <div class="achievement-info">
                                        <h4>Week Warrior</h4>
                                        <p>Maintain a 7-day streak</p>
                                    </div>
                                </div>
                                <div class="achievement <?= $starsEarned >= 100 ? '' : 'achievement-locked' ?>">
                                    <div class="achievement-icon">
                                        <span class="material-symbols-outlined">star</span>
                                    </div>
                                    <div class="achievement-info">
                                        <h4>Star Collector</h4>
                                        <p>Earn 100 stars</p>
                                    </div>
                                </div>
                                <div class="achievement <?= $storiesRead >= 10 ? '' : 'achievement-locked' ?>">
                                    <div class="achievement-icon">
                                        <span class="material-symbols-outlined">menu_book</span>
                                    </div>
                                    <div class="achievement-info">
                                        <h4>Bookworm</h4>
                                        <p>Read 10 stories</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <script src="../js/student/script.js"></script>
    <script src="../js/student/profile.js"></script>
</body>

</html>
