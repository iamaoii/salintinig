<?php
require_once '../includes/functions.php';
if (!isLoggedIn() || getUserRole() !== 'student') {
    redirect('auth.html');
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Dashboard • SalinTinig</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/student-dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body class="student-dashboard-body">

    <!-- Sidebar -->
    <aside class="student-sidebar">
        <div class="sidebar-logo">SalinTinig</div>
        <nav class="sidebar-nav">
            <a href="#" class="tab-link active" data-tab="progress"><i class="fas fa-home"></i> <span>My
                    Progress</span></a>
            <a href="#" class="tab-link" data-tab="stories"><i class="fas fa-book-open"></i> <span>My Stories</span></a>
            <a href="#" class="tab-link" data-tab="badges"><i class="fas fa-trophy"></i> <span>My Badges</span></a>
            <a href="#" class="tab-link" data-tab="profile"><i class="fas fa-user"></i> <span>Profile</span></a>
            <a href="index.html"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a>
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="student-main">
        <div class="container-fluid">

            <!-- Greeting -->
            <div class="greeting-card mb-5">
                <div class="row align-items-center">
                    <div class="col-md-7">
                        <h1>Hi Maria! Welcome back!</h1>
                        <p class="lead fs-3">You're on a 12-day reading streak! Keep going!</p>
                    </div>
                    <div class="col-md-5 text-center">
                        <img src="assets/Yellow Star.png" alt="Happy Star" class="greeting-char img-fluid"
                            style="max-width: 250px;">
                    </div>
                </div>
            </div>

            <!-- My Progress Tab -->
            <div id="progress" class="tab-content active">
                <!-- Stats Cards -->
                <div class="row stats-cards g-4 mb-5">
                    <div class="col-md-4">
                        <div class="stat-card orange">
                            <div class="icon"><i class="fas fa-microphone"></i></div>
                            <div class="number">85%</div>
                            <div class="label">Fluency</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card blue">
                            <div class="icon"><i class="fas fa-brain"></i></div>
                            <div class="number">92%</div>
                            <div class="label">Comprehension</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card purple">
                            <div class="icon"><i class="fas fa-star"></i></div>
                            <div class="number">156</div>
                            <div class="label">Stars Earned</div>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="row g-4">
                    <div class="col-lg-7">
                        <div class="chart-container">
                            <h3 class="chart-title">My Reading Progress</h3>
                            <canvas id="studentProgressChart" height="140"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-5">
                        <div class="chart-container text-center">
                            <h3 class="chart-title">This Week's Goals</h3>
                            <canvas id="goalsChart" height="200"></canvas>
                            <p class="mt-3">You're doing great!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- My Stories Tab -->
            <div id="stories" class="tab-content">
                <h2 class="mb-4">My Current Stories</h2>
                <div class="row g-4 text-center">
                    <div class="col-md-4">
                        <div class="chart-container p-4">
                            <img src="assets/Blue Circle.png" width="100" class="mb-3">
                            <h5>Ang Alamat ng Pakwan</h5>
                            <small>70% Complete • 12 Stars</small>
                            <button class="btn btn-primary rounded-pill mt-3">Continue Reading →</button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="chart-container p-4">
                            <img src="assets/Orange Star.png" width="100" class="mb-3">
                            <h5>The Magic Fish</h5>
                            <small>45% Complete • 8 Stars</small>
                            <button class="btn btn-primary rounded-pill mt-3">Continue Reading →</button>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="chart-container p-4">
                            <img src="assets/Yellow Star.png" width="100" class="mb-3">
                            <h5>Si Juan Tamad</h5>
                            <small>New! • Challenge Story</small>
                            <button class="btn btn-success rounded-pill mt-3">Start Reading →</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- My Badges Tab -->
            <div id="badges" class="tab-content">
                <h2 class="mb-4">My Badges & Rewards</h2>
                <div class="row g-4 text-center">
                    <div class="col-md-3">
                        <div class="chart-container p-4">
                            <i class="fas fa-star fa-5x text-warning mb-3"></i>
                            <h5>Reading Star</h5>
                            <small>Earned 100+ Stars</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="chart-container p-4">
                            <i class="fas fa-fire fa-5x text-danger mb-3"></i>
                            <h5>Streak Master</h5>
                            <small>10-Day Streak</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="chart-container p-4">
                            <i class="fas fa-book fa-5x text-primary mb-3"></i>
                            <h5>Story Master</h5>
                            <small>Completed 20 Stories</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="chart-container p-4 opacity-50">
                            <i class="fas fa-medal fa-5x text-secondary mb-3"></i>
                            <h5>Super Reader</h5>
                            <small>Locked • Need 200 Stars</small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Tab -->
            <div id="profile" class="tab-content">
                <h2 class="mb-4">My Profile</h2>
                <div class="row">
                    <div class="col-md-6">
                        <div class="chart-container p-5 text-center">
                            <img src="assets/Blue Circle.png" width="150" class="rounded-circle mb-3">
                            <h4>Maria Santos</h4>
                            <p>Grade 4 • Section A</p>
                            <p>LRN: 123456789012</p>
                            <p>Total Reading Time: 48 hours</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="chart-container p-5">
                            <h4>Reading Streak Calendar</h4>
                            <p class="text-center">You've read on 12 days this month!</p>
                            <!-- Placeholder for calendar -->
                            <div class="text-center mt-4">
                                <i class="fas fa-calendar fa-10x text-muted opacity-25"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/student-dashboard.js"></script>
</body>

</html>