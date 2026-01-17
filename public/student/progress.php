<?php
session_start();
require_once __DIR__ . '/../../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'student') {
    header('Location: ../auth.html');
    exit();
}

$studentId = getUserId();
$studentName = htmlspecialchars(getUserName());

// Get student progress
$progress = getStudentProgress($studentId);
$streak = $progress['current_streak'] ?? 0;
$level = $progress['current_level'] ?? 1;
$totalStars = $progress['total_stars'] ?? 0;
$storiesRead = $progress['stories_read'] ?? 0;

// Get fluency (average WPM)
$avgWpm = getAverageWPM($studentId);

// Get fluency history for sparkline
$fluencyHistory = getFluencyHistory($studentId, 7);
$fluencyLabels = [];
$fluencyData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $fluencyLabels[] = date('D', strtotime($date));
    $found = false;
    foreach ($fluencyHistory as $day) {
        if ($day['date'] === $date) {
            $fluencyData[] = (int)$day['wpm'];
            $found = true;
            break;
        }
    }
    if (!$found) $fluencyData[] = 0;
}

// Get weekly activity for chart
$weeklyActivity = getWeeklyActivity($studentId);

// Prepare chart data (last 7 days)
$chartLabels = [];
$chartData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $chartLabels[] = date('D', strtotime($date));
    $found = false;
    foreach ($weeklyActivity as $day) {
        if ($day['date'] === $date) {
            $chartData[] = (int)$day['count'];
            $found = true;
            break;
        }
    }
    if (!$found) $chartData[] = 0;
}

// Level titles
$levelTitles = ['', 'Beginner Reader', 'Word Explorer', 'Story Seeker', 'Page Turner', 'Bookworm', 'Reading Champion'];
$levelTitle = $levelTitles[$level] ?? 'Reading Star';

// Points to next level (100 stars per level)
$pointsToNext = (($level) * 100) - $totalStars;
$levelProgress = ($totalStars % 100);
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig Student Dashboard - Progress</title>

    <!-- Fonts -->
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />

    <!-- Your CSS -->
    <link rel="stylesheet" href="../css/student/style.css" />
    <link rel="stylesheet" href="../css/student/progress.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body>
    <div class="app">
        <!-- Header -->
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
                    <a class="topnav__item topnav__item--active" href="progress.php">
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
                    <button class="iconBtn iconBtn--desktopOnly" type="button" aria-label="Notifications">
                        <span class="material-symbols-outlined">notifications</span>
                    </button>

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

        <!-- Main -->
        <main class="main">
            <div class="container">
                <!-- Greeting + Streak -->
                <section class="hero">
                    <div class="hero__text">
                        <h2 class="hero__title">Kumusta, <?= $studentName ?>! ☀️</h2>
                        <p class="hero__subtitle">Your learning progress at a glance.</p>
                    </div>

                    <div class="streakCard">
                        <span class="material-symbols-outlined streakCard__icon"
                            data-filled="1">local_fire_department</span>
                        <div class="streakCard__meta">
                            <span class="streakCard__days"><?= $streak ?> Day<?= $streak != 1 ? 's' : '' ?></span>
                            <span class="streakCard__label">Streak!</span>
                        </div>
                    </div>
                </section>


                <!-- Progress Stats -->
                <section class="section">
                    <h3 class="section__title section__title--pad">Aking Pag-unlad (My Progress)</h3>

                    <div class="progressGrid">
                        <!-- Fluency speed -->
                        <article class="progressCard">
                            <div class="progressCard__top">
                                <div>
                                    <p class="eyebrow">Fluency Speed</p>
                                    <h4 class="bigStat">
                                        <?= $avgWpm ?: '--' ?> <span class="bigStat__unit">wpm</span>
                                    </h4>
                                </div>

                                <div class="deltaPill">
                                    <span class="material-symbols-outlined">trending_up</span>
                                    <span>+5%</span>
                                </div>
                            </div>

                            <div class="sparkline" aria-label="Fluency speed chart" style="height: 80px;">
                                <canvas id="fluencyChart"></canvas>
                            </div>
                        </article>

                        <!-- Current level -->
                        <article class="levelCard">
                            <div class="levelCard__glow" aria-hidden="true"></div>

                            <div class="levelBadge">
                                <span class="material-symbols-outlined" data-filled="1">workspace_premium</span>
                            </div>

                            <div class="levelInfo">
                                <div>
                                    <p class="eyebrow">Level <?= $level ?></p>
                                    <h4 class="levelInfo__title"><?= htmlspecialchars($levelTitle) ?></h4>
                                </div>

                                <div class="stars" aria-label="Level stars">
                                    <?php for ($i = 1; $i <= 5; $i++): ?>
                                    <span class="material-symbols-outlined" <?= $i <= $level ? 'data-filled="1"' : '' ?>>star</span>
                                    <?php endfor; ?>
                                </div>

                                <div class="bar">
                                    <div class="bar__fill" style="width: <?= $levelProgress ?>%"></div>
                                </div>

                                <p class="levelInfo__note"><?= max(0, $pointsToNext) ?> stars to next level</p>
                            </div>
                        </article>
                    </div>
                </section>

                <!-- Activity Chart -->
                <section class="section section--bottomSpace">
                    <h3 class="section__title section__title--pad">Weekly Reading Activity</h3>
                    <div
                        style="background: white; padding: 24px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
                        <canvas id="activityChart" style="width: 100%; height: 300px;"></canvas>
                    </div>
                </section>
            </div>
        </main>

        <!-- Mobile bottom nav -->
        <nav class="bottomNav" aria-label="Bottom navigation">
            <a class="bottomNav__item bottomNav__item--active" href="progress.php">
                <span class="material-symbols-outlined">analytics</span>
                <span class="bottomNav__label">Progress</span>
            </a>
            <a class="bottomNav__item bottomNav__item--inactive" href="reading.php">
                <span class="material-symbols-outlined" data-filled="1">auto_stories</span>
                <span class="bottomNav__label">Reading</span>
            </a>
            <a class="bottomNav__item bottomNav__item--inactive" href="library.php">
                <span class="material-symbols-outlined">library_books</span>
                <span class="bottomNav__label">Library</span>
            </a>
            <a class="bottomNav__item bottomNav__item--inactive" href="rewards.php">
                <span class="material-symbols-outlined">military_tech</span>
                <span class="bottomNav__label">Rewards</span>
            </a>
        </nav>
    </div>

    <script src="../js/student/script.js"></script>
    <script>
        // Chart data from PHP
        window.chartLabels = <?= json_encode($chartLabels) ?>;
        window.chartData = <?= json_encode($chartData) ?>;
        window.fluencyLabels = <?= json_encode($fluencyLabels) ?>;
        window.fluencyData = <?= json_encode($fluencyData) ?>;
    </script>
    <script src="../js/student/progress.js"></script>
</body>

</html>
