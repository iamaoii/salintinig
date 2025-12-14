<?php
session_start();  // Critical: Start session first

require_once '../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'teacher') {
    // Not logged in or wrong role → redirect to auth
    redirect('auth.html');
}

// Now safe to use session data
$teacherName = getUserName();
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teacher Dashboard • SalinTinig</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/teacher-dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>

<body class="teacher-dashboard-body">

    <!-- Sidebar -->
    <aside class="teacher-sidebar">
        <div class="sidebar-logo">SalinTinig</div>
        <nav class="sidebar-nav">
            <a href="#" class="tab-link active" data-tab="dashboard"><i class="fas fa-home"></i>
                <span>Dashboard</span></a>
            <a href="#" class="tab-link" data-tab="students"><i class="fas fa-users"></i> <span>Students</span></a>
            <a href="#" class="tab-link" data-tab="stories"><i class="fas fa-book-open"></i> <span>Stories</span></a>
            <a href="#" class="tab-link" data-tab="reports"><i class="fas fa-chart-bar"></i> <span>Reports</span></a>
            <a href="index.html"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a>
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="teacher-main">
        <div class="container-fluid">

            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-content active">
                <div class="row stats-cards g-4 mb-5">
                    <div class="col-md-4">
                        <div class="stat-card orange">
                            <div class="icon"><i class="fas fa-user-graduate"></i></div>
                            <div class="number">48</div>
                            <div class="label">Total Students</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card purple">
                            <div class="icon"><i class="fas fa-chalkboard-teacher"></i></div>
                            <div class="number">6</div>
                            <div class="label">Active Classes</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card teal">
                            <div class="icon"><i class="fas fa-star"></i></div>
                            <div class="number">892</div>
                            <div class="label">Stars Earned</div>
                        </div>
                    </div>
                </div>

                <div class="row g-4 mb-5">
                    <div class="col-lg-8">
                        <div class="chart-container">
                            <h3 class="chart-title">Reading Progress This Month</h3>
                            <canvas id="progressChart" height="80"></canvas> <!-- Smaller -->
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="chart-container text-center">
                            <h3 class="chart-title">Boys vs Girls</h3>
                            <canvas id="genderChart" height="140"></canvas> <!-- Smaller -->
                            <div class="mt-3 fs-5">
                                <span class="me-4"><strong>Boys</strong> 55%</span>
                                <span><strong>Girls</strong> 45%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row g-4">
                    <div class="col-lg-8">
                        <div class="chart-container">
                            <h3 class="chart-title">Top Reading Activities</h3>
                            <div class="subject-bars">
                                <div class="subject">
                                    <div class="subject-label">English Fluency</div>
                                    <div class="subject-bar">
                                        <div class="subject-bar-fill orange" style="width: 88%;" data-percent="88">
                                        </div>
                                    </div>
                                </div>
                                <div class="subject">
                                    <div class="subject-label">Filipino Stories</div>
                                    <div class="subject-bar">
                                        <div class="subject-bar-fill blue" style="width: 82%;" data-percent="82"></div>
                                    </div>
                                </div>
                                <div class="subject">
                                    <div class="subject-label">Comprehension Quizzes</div>
                                    <div class="subject-bar">
                                        <div class="subject-bar-fill teal" style="width: 75%;" data-percent="75"></div>
                                    </div>
                                </div>
                                <div class="subject">
                                    <div class="subject-label">Challenge Levels</div>
                                    <div class="subject-bar">
                                        <div class="subject-bar-fill purple" style="width: 68%;" data-percent="68">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="top-students">
                            <h3 class="title">Top Reading Stars ⭐</h3>
                            <div class="student-item">
                                <div class="student-avatar">MS</div>
                                <div class="student-info">
                                    <h5>Maria Santos</h5>
                                    <small>88% Fluency • 38 Stars</small>
                                </div>
                            </div>
                            <div class="student-item">
                                <div class="student-avatar">JR</div>
                                <div class="student-info">
                                    <h5>Jose Rizal Jr.</h5>
                                    <small>85% Fluency • 35 Stars</small>
                                </div>
                            </div>
                            <div class="student-item">
                                <div class="student-avatar">AB</div>
                                <div class="student-info">
                                    <h5>Ana Beatriz</h5>
                                    <small>82% Fluency • 32 Stars</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Students Tab -->
            <div id="students" class="tab-content">
                <h2 class="mb-4">My Students 👨‍🎓👩‍🎓</h2>
                <div class="row g-4">
                    <div class="col-md-6">
                        <div class="chart-container p-4 text-center">
                            <h4>Grade 3 - Section A</h4>
                            <p>Students: <strong>24</strong></p>
                            <p>Average Fluency: <strong>78%</strong></p>
                            <p>Total Stars: <strong>456</strong></p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="chart-container p-4 text-center">
                            <h4>Grade 4 - Section B</h4>
                            <p>Students: <strong>24</strong></p>
                            <p>Average Fluency: <strong>85%</strong></p>
                            <p>Total Stars: <strong>512</strong></p>
                        </div>
                    </div>
                </div>
                <p class="mt-4 text-center text-muted">Click on a class to view detailed student progress.</p>
            </div>

            <!-- Stories Tab -->
            <div id="stories" class="tab-content">
                <h2 class="mb-4">Available Stories 📚</h2>
                <div class="row g-4 text-center">
                    <div class="col-md-4">
                        <div class="chart-container p-4">
                            <img src="assets/Blue Circle.png" width="80" class="mb-3" alt="Story">
                            <h5>Ang Alamat ng Pakwan</h5>
                            <small>Filipino Folktale • Grade 3</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="chart-container p-4">
                            <img src="assets/Orange Star.png" width="80" class="mb-3" alt="Story">
                            <h5>The Magic Fish</h5>
                            <small>English Adventure • Grade 4</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="chart-container p-4">
                            <img src="assets/Yellow Star.png" width="80" class="mb-3" alt="Story">
                            <h5>Si Juan Tamad</h5>
                            <small>Filipino Classic • Challenge</small>
                        </div>
                    </div>
                </div>
                <div class="text-center mt-4">
                    <button class="btn btn-primary rounded-pill px-5">Add New Story +</button>
                </div>
            </div>

            <!-- Reports Tab -->
            <div id="reports" class="tab-content">
                <h2 class="mb-4">Class Reports 📊</h2>
                <div class="chart-container p-4">
                    <h4 class="text-center mb-4">Monthly Reading Summary</h4>
                    <div class="row text-center mb-4">
                        <div class="col-md-4">
                            <p class="fs-5">Total Sessions</p>
                            <h3 class="text-primary">342</h3>
                        </div>
                        <div class="col-md-4">
                            <p class="fs-5">Avg. Daily Time</p>
                            <h3 class="text-success">28 min</h3>
                        </div>
                        <div class="col-md-4">
                            <p class="fs-5">Most Improved</p>
                            <h3 class="text-warning">Maria Santos (+18%)</h3>
                        </div>
                    </div>
                    <canvas id="reportChart" height="100"></canvas> <!-- Smaller -->
                </div>
            </div>

        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/teacher-dashboard.js"></script>
</body>

</html>