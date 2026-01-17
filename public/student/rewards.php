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
$totalStars = $progress['total_stars'] ?? 0;

// Get all achievements with unlock status
$achievements = getStudentAchievements($studentId);
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig Student Dashboard - Rewards</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />
    <link rel="stylesheet" href="../css/student/style.css" />
    <link rel="stylesheet" href="../css/student/rewards.css" />
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
                    <a class="topnav__item topnav__item--active" href="rewards.php">
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
                <section class="section">
                    <div class="section__header">
                        <h3 class="section__title">Aking Gantimpala (My Rewards)</h3>
                    </div>
                    
                    <!-- Stars Summary -->
                    <div style="background: linear-gradient(135deg, #FFD700, #FFA500); padding: 1.5rem; border-radius: 1rem; margin-bottom: 2rem; text-align: center; color: white;">
                        <span class="material-symbols-outlined" style="font-size: 3rem;">star</span>
                        <h2 style="font-size: 2rem; margin: 0.5rem 0;"><?= number_format($totalStars) ?></h2>
                        <p style="opacity: 0.9;">Total Stars Earned</p>
                    </div>

                    <!-- Achievements Grid -->
                    <h4 style="margin-bottom: 1rem;">Mga Badge (Badges)</h4>
                    <div class="cardGrid">
                        <?php foreach ($achievements as $achievement): ?>
                        <article class="choiceCard <?= $achievement['unlocked_at'] ? 'choiceCard--earned' : 'choiceCard--locked' ?>" tabindex="0">
                            <div class="choiceCard__media">
                                <div class="choiceCard__bg" style="background: <?= $achievement['unlocked_at'] ? 'linear-gradient(135deg, #10B981, #059669)' : '#E2E8F0' ?>;"></div>
                                <span class="material-symbols-outlined choiceCard__icon" style="<?= $achievement['unlocked_at'] ? '' : 'opacity: 0.4;' ?>" <?= $achievement['unlocked_at'] ? 'data-filled="1"' : '' ?>><?= htmlspecialchars($achievement['icon']) ?></span>
                            </div>
                            <h4 class="choiceCard__title" style="<?= $achievement['unlocked_at'] ? '' : 'color: #94A3B8;' ?>"><?= htmlspecialchars($achievement['name']) ?></h4>
                            <p class="choiceCard__desc"><?= $achievement['unlocked_at'] ? 'Unlocked ' . date('M j', strtotime($achievement['unlocked_at'])) : htmlspecialchars($achievement['description']) ?></p>
                        </article>
                        <?php endforeach; ?>
                    </div>
                </section>
            </div>
        </main>
    </div>
    <script src="../js/student/script.js"></script>
    <script src="../js/student/rewards.js"></script>
</body>

</html>
