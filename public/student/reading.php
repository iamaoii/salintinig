<?php
session_start();
require_once __DIR__ . '/../../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'student') {
    header('Location: ../auth.html');
    exit();
}

$studentId = getUserId();
$studentName = htmlspecialchars(getUserName());
$progress = getStudentProgress($studentId);
$streak = $progress['current_streak'] ?? 0;

// Get story ID from URL
$storyId = isset($_GET['story_id']) ? (int)$_GET['story_id'] : 0;
$story = null;
$sessionId = null;

if ($storyId > 0) {
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT * FROM stories WHERE id = ?");
    $stmt->execute([$storyId]);
    $story = $stmt->fetch();
    
    if ($story) {
        // Start or resume reading session
        $sessionId = startReadingSession($studentId, $storyId);
    }
}

// Handle completion via POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['complete'])) {
    $sessionId = (int)$_POST['session_id'];
    $starsEarned = (int)$_POST['stars'] ?? 3;
    $wpm = (int)$_POST['wpm'] ?? 0;
    
    // Complete the session
    completeReadingSession($sessionId, $starsEarned, $wpm);
    
    // Update streak and stats
    updateStreak($studentId);
    incrementStoriesRead($studentId, $starsEarned);
    checkAndAwardAchievements($studentId);
    
    // Redirect to avoid resubmission
    header('Location: home.php?completed=1');
    exit();
}
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig Student Dashboard - Reading</title>
    <!-- Fonts -->
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />
    <!-- Your CSS -->
    <link rel="stylesheet" href="../css/student/style.css" />
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
                    <a class="topnav__item topnav__item--inactive" href="progress.php">
                        <span class="material-symbols-outlined">analytics</span>
                        <span class="topnav__label">Progress</span>
                    </a>
                    <a class="topnav__item topnav__item--active" href="reading.php">
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
                <?php if ($story): ?>
                <!-- Reading Mode: Story loaded -->
                <section class="hero">
                    <div class="hero__text">
                        <h2 class="hero__title"><?= htmlspecialchars($story['title']) ?></h2>
                        <p class="hero__subtitle"><?= htmlspecialchars($story['language']) ?> • Grade <?= htmlspecialchars($story['grade_level']) ?></p>
                    </div>
                    <div class="streakCard">
                        <span class="material-symbols-outlined streakCard__icon" data-filled="1">local_fire_department</span>
                        <div class="streakCard__meta">
                            <span class="streakCard__days"><?= $streak ?> Day<?= $streak != 1 ? 's' : '' ?></span>
                            <span class="streakCard__label">Streak!</span>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <div class="readingContent" style="background: white; padding: 2rem; border-radius: 1.5rem; line-height: 1.8; font-size: 1.1rem;">
                        <?= nl2br(htmlspecialchars($story['content'])) ?>
                    </div>
                </section>

                <section class="section" style="margin-top: 2rem;">
                    <form method="POST" class="completeForm" style="background: linear-gradient(135deg, #FF8C42, #FFA726); padding: 2rem; border-radius: 1.5rem; text-align: center;">
                        <input type="hidden" name="complete" value="1">
                        <input type="hidden" name="session_id" value="<?= $sessionId ?>">
                        <input type="hidden" name="stars" value="3">
                        <input type="hidden" name="wpm" value="100">
                        
                        <h3 style="color: white; margin-bottom: 1rem;">Finished reading?</h3>
                        <p style="color: rgba(255,255,255,0.9); margin-bottom: 1.5rem;">Click below to complete this story and earn stars!</p>
                        
                        <button type="submit" class="primaryBtn" style="background: white; color: #FF8C42;">
                            <span class="material-symbols-outlined">check_circle</span>
                            <span>Complete Story (+3 ⭐)</span>
                        </button>
                    </form>
                </section>

                <?php else: ?>
                <!-- Browse Mode: No story selected -->
                <section class="hero">
                    <div class="hero__text">
                        <h2 class="hero__title">Kumusta, <?= $studentName ?>! ☀️</h2>
                        <p class="hero__subtitle">Handa ka na bang matuto ngayong araw?</p>
                    </div>
                    <div class="streakCard">
                        <span class="material-symbols-outlined streakCard__icon" data-filled="1">local_fire_department</span>
                        <div class="streakCard__meta">
                            <span class="streakCard__days"><?= $streak ?> Day<?= $streak != 1 ? 's' : '' ?></span>
                            <span class="streakCard__label">Streak!</span>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <div style="text-align: center; padding: 3rem;">
                        <span class="material-symbols-outlined" style="font-size: 4rem; color: #94A3B8;">auto_stories</span>
                        <h3 style="margin: 1rem 0;">Select a Story to Read</h3>
                        <p style="color: #64748B; margin-bottom: 1.5rem;">Choose a story from your library or assignments to start reading.</p>
                        <a href="library.php" class="primaryBtn" style="display: inline-flex;">
                            <span class="material-symbols-outlined">library_books</span>
                            <span>Browse Library</span>
                        </a>
                    </div>
                </section>
                <?php endif; ?>
            </div>
        </main>
    </div>
    <script src="../js/student/script.js"></script>
    <script src="../js/student/reading.js"></script>
</body>

</html>
