<?php
session_start();
require_once '../../includes/functions.php';
if (!isLoggedIn() || getUserRole() !== 'teacher') {
    redirect('../auth.html');
}
$teacherName = htmlspecialchars(getUserName());
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Support • SalinTinig Teacher</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../css/teacher/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="../css/teacher/support.css?v=<?= time() ?>">
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
                <a href="reports.php" class="nav-link">
                    <span class="material-symbols-outlined">analytics</span>
                    <span>Reports</span>
                </a>
            </nav>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-header">
                <div class="header-title">
                    <h1 class="text-xl font-bold text-slate-800">Support Center</h1>
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
                
                <!-- Hero -->
                <div class="support-hero">
                    <h1>👋 How can we help you, <?= $teacherName ?>?</h1>
                    <p>Find answers to common questions or get in touch with our support team.</p>
                </div>

                <!-- FAQ Section -->
                <div class="faq-section">
                    <h2 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">quiz</span>
                        Frequently Asked Questions
                    </h2>
                    
                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFaq(this)">
                            <span>How do I assign a story to my students?</span>
                            <span class="material-symbols-outlined">expand_more</span>
                        </div>
                        <div class="faq-answer">
                            Go to the <strong>Stories</strong> page, click on the story you want to assign, and click the "Assign" button. You can assign stories to individual students or all students at once, with an optional due date.
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFaq(this)">
                            <span>How can I track my students' reading progress?</span>
                            <span class="material-symbols-outlined">expand_more</span>
                        </div>
                        <div class="faq-answer">
                            Visit the <strong>Reports</strong> page to see detailed analytics on your students' reading activity, including stories read, stars earned, and reading streaks. You can also view individual student progress from the Students page.
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFaq(this)">
                            <span>How do students earn badges and stars?</span>
                            <span class="material-symbols-outlined">expand_more</span>
                        </div>
                        <div class="faq-answer">
                            Students earn stars by completing reading sessions. Badges are automatically awarded when students reach milestones like reading their first story, maintaining a 7-day streak, or earning 100 stars.
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFaq(this)">
                            <span>Can I add my own stories?</span>
                            <span class="material-symbols-outlined">expand_more</span>
                        </div>
                        <div class="faq-answer">
                            Yes! Go to the <strong>Stories</strong> page and click "Add New Story". You can create stories in English or Filipino and set the appropriate grade level for your students.
                        </div>
                    </div>

                    <div class="faq-item">
                        <div class="faq-question" onclick="toggleFaq(this)">
                            <span>How do I update my account information?</span>
                            <span class="material-symbols-outlined">expand_more</span>
                        </div>
                        <div class="faq-answer">
                            Go to the <strong>Settings</strong> page where you can update your name, email, and change your password.
                        </div>
                    </div>
                </div>

                <!-- Contact Cards -->
                <h3 class="text-lg font-bold text-slate-800 mb-4">Need More Help?</h3>
                <div class="contact-cards">
                    <div class="contact-card">
                        <span class="material-symbols-outlined">mail</span>
                        <h4>Email Support</h4>
                        <p>Get help from our support team within 24 hours.</p>
                        <a href="mailto:support@salintinig.ph" class="contact-button">Send Email</a>
                    </div>
                    <div class="contact-card">
                        <span class="material-symbols-outlined">chat</span>
                        <h4>Live Chat</h4>
                        <p>Chat with us during school hours (8 AM - 5 PM).</p>
                        <a href="#" class="contact-button">Start Chat</a>
                    </div>
                    <div class="contact-card">
                        <span class="material-symbols-outlined">school</span>
                        <h4>Training Videos</h4>
                        <p>Watch tutorials on how to use SalinTinig effectively.</p>
                        <a href="#" class="contact-button">Watch Videos</a>
                    </div>
                </div>

                <!-- Quick Links -->
                <div class="quick-links">
                    <h3 class="text-lg font-bold text-slate-800 mb-4">Quick Links</h3>
                    <div class="quick-links-grid">
                        <a href="dashboard.php" class="quick-link">
                            <span class="material-symbols-outlined">dashboard</span>
                            <span>Go to Dashboard</span>
                        </a>
                        <a href="students.php" class="quick-link">
                            <span class="material-symbols-outlined">group</span>
                            <span>View Students</span>
                        </a>
                        <a href="stories.php" class="quick-link">
                            <span class="material-symbols-outlined">auto_stories</span>
                            <span>Manage Stories</span>
                        </a>
                        <a href="settings.php" class="quick-link">
                            <span class="material-symbols-outlined">settings</span>
                            <span>Account Settings</span>
                        </a>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <script>
        function toggleFaq(element) {
            const faqItem = element.parentElement;
            faqItem.classList.toggle('open');
            
            // Close other FAQs
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('open');
                }
            });
        }
        function toggleProfileDropdown() { document.getElementById('profileMenu').classList.toggle('show'); }
        document.addEventListener('click', e => { if (!e.target.closest('.profile-dropdown')) document.getElementById('profileMenu')?.classList.remove('show'); });
    </script>
</body>
</html>
