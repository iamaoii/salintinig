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
        <div class="sidebar-logo">
            <a href="index.html" style="text-decoration: none; color: inherit;">
                SalinTinig
            </a>
        </div>
        <nav class="sidebar-nav">
            <a href="#" class="tab-link active" data-tab="dashboard"><i class="fas fa-home"></i>
                <span>Dashboard</span></a>
            <a href="#" class="tab-link" data-tab="students"><i class="fas fa-users"></i> <span>Students</span></a>
            <a href="#" class="tab-link" data-tab="stories"><i class="fas fa-book-open"></i> <span>Stories</span></a>
            <a href="#" class="tab-link" data-tab="reports"><i class="fas fa-chart-bar"></i> <span>Reports</span></a>
            <a href="logout.php"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a>
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
                            <h3 class="title">Top Reading Stars</h3>
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
                <h2 class="mb-4">My Students</h2>
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
                <h2 class="mb-4">Manage Stories</h2>
                
                <!-- Add New Story Button -->
                <div class="text-end mb-3">
                    <button class="btn btn-primary rounded-pill" data-bs-toggle="modal" data-bs-target="#storyModal" onclick="openAddModal()">
                        Add New Story +
                    </button>
                </div>

                <!-- Stories List -->
                <div class="row g-4" id="storiesList">
                    <?php
                    $pdo = getDB();
                    $stmt = $pdo->query("SELECT * FROM stories ORDER BY created_at DESC");
                    $stories = $stmt->fetchAll();

                    if (empty($stories)) {
                        echo '<p class="text-center text-muted col-12">No stories yet. Add one above!</p>';
                    }

                    foreach ($stories as $story) {
                    ?>
                        <div class="col-md-4">
                            <div class="chart-container p-4 position-relative">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h5><?= htmlspecialchars($story['title']) ?></h5>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" onclick='openEditModal(<?= json_encode($story) ?>)'>Edit</a></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteStory(<?= $story['id'] ?>)">Delete</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <p class="small text-muted"><?= htmlspecialchars($story['description'] ?? 'No description') ?></p>
                                <div class="mt-3">
                                    <span class="badge bg-primary"><?= htmlspecialchars($story['grade_level']) ?></span>
                                    <span class="badge bg-info"><?= htmlspecialchars($story['language']) ?></span>
                                </div>
                            </div>
                        </div>
                    <?php } ?>
                </div>
            </div>

            <!-- Reports Tab -->
            <div id="reports" class="tab-content">
                <h2 class="mb-4">Class Reports</h2>
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

        <!-- Story Modal -->
        <div class="modal fade" id="storyModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <form id="storyForm">
                        <div class="modal-header">
                            <h5 class="modal-title" id="modalTitle">Add New Story</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" name="id" id="storyId">
                            
                            <div class="mb-3">
                                <label class="form-label">Title</label>
                                <input type="text" name="title" id="storyTitle" class="form-control" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea name="description" id="storyDesc" class="form-control" rows="4"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Grade Level</label>
                                <select name="grade_level" id="storyGrade" class="form-select">
                                    <option value="1-2">Grades 1-2</option>
                                    <option value="3-4">Grades 3-4</option>
                                    <option value="5-6">Grades 5-6</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Language</label>
                                <select name="language" id="storyLang" class="form-select">
                                    <option value="English">English</option>
                                    <option value="Filipino">Filipino</option>
                                    <option value="Bilingual">Bilingual</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Story</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/teacher-dashboard.js"></script>
</body>

</html>