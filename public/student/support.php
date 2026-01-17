<?php
require_once __DIR__ . '/../../includes/functions.php';
startSession();

if (!isLoggedIn() || getUserRole() !== 'student') {
    header('Location: ../auth.html');
    exit();
}

$studentName = htmlspecialchars(getUserName());
?>
<!doctype html>
<html class="light" lang="en">

<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>SalinTinig - Support</title>
    <link
        href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Noto+Sans:wght@300..800&display=swap"
        rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet" />
    <link rel="stylesheet" href="../css/student/style.css" />
    <link rel="stylesheet" href="../css/student/support.css" />
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
                <div class="support-page">
                    <div class="support-header">
                        <h1>How can we help you?</h1>
                        <p>Find answers to common questions or contact our support team</p>
                    </div>

                    <div class="faq-section">
                        <h2 class="faq-title">
                            <span class="material-symbols-outlined">quiz</span>
                            Frequently Asked Questions
                        </h2>

                        <div class="faq-item">
                            <div class="faq-question">
                                How do I earn stars?
                                <span class="material-symbols-outlined">expand_more</span>
                            </div>
                            <div class="faq-answer">
                                You earn stars by completing reading missions, finishing stories, and maintaining your daily streak. The more you read, the more stars you collect!
                            </div>
                        </div>

                        <div class="faq-item">
                            <div class="faq-question">
                                How does the streak system work?
                                <span class="material-symbols-outlined">expand_more</span>
                            </div>
                            <div class="faq-answer">
                                Your streak increases each day you complete at least one reading activity. If you miss a day, your streak resets to zero. Try to maintain your streak for bonus rewards!
                            </div>
                        </div>

                        <div class="faq-item">
                            <div class="faq-question">
                                Can I change my LRN number?
                                <span class="material-symbols-outlined">expand_more</span>
                            </div>
                            <div class="faq-answer">
                                Your LRN number is set when you create your account and cannot be changed directly. If you need to update it, please contact your teacher or our support team.
                            </div>
                        </div>

                        <div class="faq-item">
                            <div class="faq-question">
                                How do I level up?
                                <span class="material-symbols-outlined">expand_more</span>
                            </div>
                            <div class="faq-answer">
                                You gain experience points (XP) by reading stories and completing missions. Once you reach the required XP threshold, you'll automatically level up and unlock new achievements!
                            </div>
                        </div>
                    </div>

                    <div class="contact-cards">
                        <div class="contact-card">
                            <div class="contact-icon">
                                <span class="material-symbols-outlined">mail</span>
                            </div>
                            <h3>Email Support</h3>
                            <p>Get help via email within 24 hours</p>
                            <a href="mailto:support@salintinig.com" class="contact-link">support@salintinig.com</a>
                        </div>

                        <div class="contact-card">
                            <div class="contact-icon">
                                <span class="material-symbols-outlined">school</span>
                            </div>
                            <h3>Ask Your Teacher</h3>
                            <p>Your teacher can help with account issues</p>
                            <a href="#" class="contact-link">Contact Teacher</a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
    <script src="../js/student/script.js"></script>
    <script src="../js/student/support.js"></script>
</body>

</html>
