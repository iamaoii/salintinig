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

// Get continue reading (incomplete session)
$continueReading = getContinueReading($studentId);

// Get assigned stories first
$assignedStories = getAssignedStories($studentId);

// Get recommended stories (unread) - limit to 3
$recommendedStories = getRecommendedStories($studentId, $progress['current_level'] ?? 1, 3);
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig Student Dashboard - Home</title>

    <!-- Fonts -->
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />

    <!-- Your CSS -->
    <link rel="stylesheet" href="../css/student/style.css" />
    <link rel="stylesheet" href="../css/student/home.css" />
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
                    <a class="topnav__item topnav__item--active" href="home.php">
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
                        <h2 class="hero__title">Welcome Back, <?= $studentName ?>! 👋</h2>
                        <p class="hero__subtitle">Ready to continue your reading adventure?</p>
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

                <!-- Continue Reading -->
                <?php if ($continueReading): ?>
                <section class="section">
                    <div class="section__header">
                        <h3 class="section__title">Continue Reading</h3>
                    </div>
                    <div class="missionCard">
                        <div class="missionCard__image"
                            style='<?php if (!empty($continueReading['image_url'])): ?>background-image: url("../<?= htmlspecialchars($continueReading['image_url']) ?>"); background-size: cover; background-position: center;<?php else: ?>background: linear-gradient(135deg, #FF8C42, #FFA726);<?php endif; ?>'
                            aria-label="Story cover image">
                            <div class="missionCard__overlay">
                                <div class="missionCard__overlayInner">
                                    <span class="pill pill--primary">In Progress</span>
                                </div>
                            </div>
                        </div>

                        <div class="missionCard__content">
                            <div>
                                <h3 class="missionCard__title"><?= htmlspecialchars($continueReading['title']) ?></h3>
                                <p class="missionCard__subtitle">Continue where you left off</p>
                            </div>

                            <p class="missionCard__desc">
                                <?= htmlspecialchars($continueReading['description'] ?? 'Your story awaits!') ?>
                            </p>

                            <div class="missionCard__actions">
                                <a href="reading.php?story_id=<?= $continueReading['id'] ?>&resume=1" class="primaryBtn">
                                    <span class="material-symbols-outlined">play_circle</span>
                                    <span>Resume</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
                <?php endif; ?>

                <!-- My Assignments Section (only if assignments exist) -->
                <?php if (!empty($assignedStories)): ?>
                <section class="section">
                    <div class="section__header">
                        <h3 class="section__title">
                            <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 0.5rem; color: #FF6B35;">assignment</span>
                            My Assignments
                            <span style="background: #FF6B35; color: white; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 99px; margin-left: 0.5rem;"><?= count($assignedStories) ?></span>
                        </h3>
                        <a class="section__link" href="library.php">View All Assignments</a>
                    </div>

                    <div class="cardGrid">
                        <?php foreach ($assignedStories as $story): ?>
                        <a href="reading.php?story_id=<?= $story['id'] ?>" class="choiceCard choiceCard--assigned" tabindex="0">
                            <div class="choiceCard__media">
                                <?php if (!empty($story['image_url'])): ?>
                                    <div class="choiceCard__bg" style="background-image: url('../<?= htmlspecialchars($story['image_url']) ?>'); background-size: cover; background-position: center; opacity: 1;"></div>
                                <?php else: ?>
                                    <div class="choiceCard__bg" style="background: linear-gradient(135deg, #FF6B6B, #FF8E53);"></div>
                                    <span class="material-symbols-outlined choiceCard__icon">assignment</span>
                                <?php endif; ?>
                            </div>
                            <h4 class="choiceCard__title"><?= htmlspecialchars($story['title']) ?></h4>
                            <p class="choiceCard__desc">
                                <?php if ($story['due_date']): ?>
                                    Due: <?= date('M j', strtotime($story['due_date'])) ?>
                                <?php else: ?>
                                    Assigned by teacher
                                <?php endif; ?>
                            </p>
                        </a>
                        <?php endforeach; ?>
                    </div>
                </section>
                <?php endif; ?>

                <!-- Recommendations -->
                <section class="section">
                    <div class="section__header">
                        <h3 class="section__title">Recommended for You</h3>
                        <a class="section__link" href="library.php">View Library</a>
                    </div>

                    <div class="cardGrid">
                        <?php if (!empty($recommendedStories)): ?>
                            <?php foreach ($recommendedStories as $story): ?>
                            <a href="reading.php?story_id=<?= $story['id'] ?>" class="choiceCard" tabindex="0">
                                <div class="choiceCard__media">
                                    <?php if (!empty($story['image_url'])): ?>
                                        <div class="choiceCard__bg" style="background-image: url('../<?= htmlspecialchars($story['image_url']) ?>'); background-size: cover; background-position: center; opacity: 1;"></div>
                                    <?php else: ?>
                                        <div class="choiceCard__bg" style="background: linear-gradient(135deg, <?= $story['language'] === 'Filipino' ? '#9B59B6, #8E44AD' : '#3498DB, #2980B9' ?>);"></div>
                                        <span class="material-symbols-outlined choiceCard__icon">auto_stories</span>
                                    <?php endif; ?>
                                </div>
                                <h4 class="choiceCard__title"><?= htmlspecialchars($story['title']) ?></h4>
                                <p class="choiceCard__desc"><?= htmlspecialchars($story['language']) ?> • Grade <?= htmlspecialchars($story['grade_level']) ?></p>
                            </a>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div style="grid-column: 1 / -1; background: linear-gradient(135deg, #FFF7ED, #FFEDD5); padding: 2.5rem; border-radius: 1.5rem; text-align: center; border: 2px dashed #FDBA74;">
                                <span class="material-symbols-outlined" style="font-size: 4rem; color: #FB923C; margin-bottom: 1rem;">explore</span>
                                <h3 style="color: #9A3412; margin-bottom: 0.5rem;">Your reading adventure begins here!</h3>
                                <p style="color: #C2410C; margin-bottom: 1.5rem;">Visit the library to discover amazing stories.</p>
                                <a href="library.php" class="primaryBtn" style="display: inline-flex; gap: 0.5rem;">
                                    <span class="material-symbols-outlined">library_books</span>
                                    <span>Explore Library</span>
                                </a>
                            </div>
                        <?php endif; ?>
                    </div>
                </section>
            </div>
        </main>
    </div>
    <script src="../js/student/script.js"></script>
    <script src="../js/student/home.js"></script>
</body>

</html>
