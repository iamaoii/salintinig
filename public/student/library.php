<?php
require_once __DIR__ . '/../../includes/functions.php';
startSession();

if (!isLoggedIn() || getUserRole() !== 'student') {
    header('Location: ../auth.html');
    exit();
}

$studentId = getUserId();
$studentName = htmlspecialchars(getUserName());

// Get assigned stories
$assignedStories = getAssignedStories($studentId);

// Get stories by language
$pdo = getDB();
$englishStories = $pdo->query("SELECT * FROM stories WHERE language = 'English' ORDER BY created_at DESC")->fetchAll();
$filipinoStories = $pdo->query("SELECT * FROM stories WHERE language = 'Filipino' ORDER BY created_at DESC")->fetchAll();
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig Student Dashboard - Library</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />
    <link rel="stylesheet" href="../css/student/style.css" />
    <link rel="stylesheet" href="../css/student/library.css" />
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
                    <a class="topnav__item topnav__item--active" href="library.php">
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
                <!-- My Assignments Section (at the top) -->
                <?php if (!empty($assignedStories)): ?>
                <section class="section">
                    <div class="section__header">
                        <h3 class="section__title">
                            <span class="material-symbols-outlined" style="vertical-align: middle; margin-right: 0.5rem; color: #FF6B35;">assignment</span>
                            My Assignments
                            <span style="background: #FF6B35; color: white; font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 99px; margin-left: 0.5rem;"><?= count($assignedStories) ?></span>
                        </h3>
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

                <!-- English Stories Section -->
                <section class="section">
                    <div class="section__header">
                        <h3 class="section__title">📘 English Stories</h3>
                        <span class="section__count"><?= count($englishStories) ?> stories</span>
                    </div>
                    <div class="cardGrid">
                        <?php if (empty($englishStories)): ?>
                            <div class="emptyState" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                                <span class="material-symbols-outlined" style="font-size: 3rem; color: #94A3B8;">menu_book</span>
                                <p style="color: #64748B;">No English stories available yet.</p>
                            </div>
                        <?php else: ?>
                            <?php foreach ($englishStories as $story): ?>
                            <a href="reading.php?story_id=<?= $story['id'] ?>" class="choiceCard choiceCard--blue" tabindex="0">
                                <div class="choiceCard__media">
                                    <?php if (!empty($story['image_url'])): ?>
                                        <div class="choiceCard__bg" style="background-image: url('../<?= htmlspecialchars($story['image_url']) ?>'); background-size: cover; background-position: center; opacity: 1;"></div>
                                    <?php else: ?>
                                        <div class="choiceCard__bg" style="background: linear-gradient(135deg, #3B82F6, #1D4ED8);"></div>
                                        <span class="material-symbols-outlined choiceCard__icon">menu_book</span>
                                    <?php endif; ?>
                                </div>
                                <h4 class="choiceCard__title"><?= htmlspecialchars($story['title']) ?></h4>
                                <p class="choiceCard__desc">Grade <?= htmlspecialchars($story['grade_level']) ?></p>
                            </a>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </section>

                <!-- Filipino Stories Section -->
                <section class="section">
                    <div class="section__header">
                        <h3 class="section__title">📕 Filipino Stories</h3>
                        <span class="section__count"><?= count($filipinoStories) ?> mga kwento</span>
                    </div>
                    <div class="cardGrid">
                        <?php if (empty($filipinoStories)): ?>
                            <div class="emptyState" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                                <span class="material-symbols-outlined" style="font-size: 3rem; color: #94A3B8;">auto_stories</span>
                                <p style="color: #64748B;">Wala pang mga kwentong Filipino.</p>
                            </div>
                        <?php else: ?>
                            <?php foreach ($filipinoStories as $story): ?>
                            <a href="reading.php?story_id=<?= $story['id'] ?>" class="choiceCard choiceCard--red" tabindex="0">
                                <div class="choiceCard__media">
                                    <?php if (!empty($story['image_url'])): ?>
                                        <div class="choiceCard__bg" style="background-image: url('../<?= htmlspecialchars($story['image_url']) ?>'); background-size: cover; background-position: center; opacity: 1;"></div>
                                    <?php else: ?>
                                        <div class="choiceCard__bg" style="background: linear-gradient(135deg, #EF4444, #B91C1C);"></div>
                                        <span class="material-symbols-outlined choiceCard__icon">auto_stories</span>
                                    <?php endif; ?>
                                </div>
                                <h4 class="choiceCard__title"><?= htmlspecialchars($story['title']) ?></h4>
                                <p class="choiceCard__desc">Grade <?= htmlspecialchars($story['grade_level']) ?></p>
                            </a>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </section>
            </div>
        </main>
    </div>
    <script src="../js/student/script.js"></script>
    <script src="../js/student/library.js"></script>
</body>

</html>
