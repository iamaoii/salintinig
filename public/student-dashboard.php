<?php
session_start();  // Critical: Start session first

require_once '../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'student') {
    // Not logged in or wrong role → redirect to auth
    redirect('auth.html');
}

// Now safe to use session data
$studentName = getUserName();
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
        <div class="sidebar-logo">
            <a href="index.html" style="text-decoration: none; color: inherit;">
                SalinTinig
            </a>
        </div>
        <nav class="sidebar-nav">
            <a href="#" class="tab-link active" data-tab="progress"><i class="fas fa-home"></i> <span>My
                    Progress</span></a>
            <a href="#" class="tab-link" data-tab="stories"><i class="fas fa-book-open"></i> <span>My Stories</span></a>
            <a href="#" class="tab-link" data-tab="badges"><i class="fas fa-trophy"></i> <span>My Badges</span></a>
            <a href="#" class="tab-link" data-tab="profile"><i class="fas fa-user"></i> <span>Profile</span></a>
            <a href="logout.php"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a>
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="student-main">
        <div class="container-fluid">

            <!-- Greeting -->
            <div class="greeting-card mb-5">
                <div class="row align-items-center">
                    <div class="col-md-7">
                        <h1>Hi <?= htmlspecialchars(getUserName()) ?>! Welcome back!</h1>
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
                <h2 class="mb-4">My Current Stories 📚</h2>
                <div class="row g-4 text-center">
                    <?php
                    $pdo = getDB();
                    $stmt = $pdo->query("SELECT id, title, description, content, grade_level, language FROM stories ORDER BY created_at DESC");
                    $stories = $stmt->fetchAll();

                    if (empty($stories)) {
                        echo '<p class="text-center text-muted col-12">No stories available yet. Ask your teacher to add some!</p>';
                    }

                    foreach ($stories as $story) {
                        // Truncate content for preview (first 200 characters)
                        $preview = $story['content'] ? substr(strip_tags($story['content']), 0, 200) . '...' : 'No content available.';
                    ?>
                        <div class="col-md-4">
                            <div class="chart-container p-4">
                                <img src="assets/Yellow Star.png" width="100" class="mb-3" alt="Story">
                                <h5><?= htmlspecialchars($story['title']) ?></h5>
                                <small class="text-muted d-block mb-3">
                                    <?= htmlspecialchars($story['description'] ?? $preview) ?>
                                </small>
                                <div class="mb-3">
                                    <span class="badge bg-primary"><?= htmlspecialchars($story['grade_level']) ?></span>
                                    <span class="badge bg-info"><?= htmlspecialchars($story['language']) ?></span>
                                </div>
                                <a href="reading.php?story_id=<?= $story['id'] ?>" class="btn btn-primary rounded-pill">
                                    Start Reading →
                                </a>
                            </div>
                        </div>
                    <?php } ?>
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
                    <!-- Left: Profile Information -->
                    <div class="col-md-6">
                        <div class="chart-container p-5">
                            <?php
                            // Fetch latest student data from database
                            $pdo = getDB();
                            $stmt = $pdo->prepare("SELECT full_name, email, lrn_number, created_at FROM students_account WHERE id = ?");
                            $stmt->execute([$_SESSION['user_id']]);
                            $student = $stmt->fetch();
                            ?>

                            <!-- Read-Only View -->
                            <div id="profileView">
                                <h4 class="mb-4">My Information</h4>
                                <p><strong>Full Name:</strong> <span id="viewName"><?= htmlspecialchars($student['full_name'] ?? 'Not set') ?></span></p>
                                <p><strong>Email:</strong> <span id="viewEmail"><?= htmlspecialchars($student['email'] ?? 'Not set') ?></span></p>
                                <p><strong>LRN Number:</strong> <span id="viewLRN"><?= htmlspecialchars($student['lrn_number'] ?? 'Not set') ?></span></p>
                                <p><strong>Account Created:</strong> 
                                    <?= $student['created_at'] ? date('F j, Y', strtotime($student['created_at'])) : 'Unknown' ?>
                                </p>

                                <button class="btn btn-primary mt-4" onclick="enableEdit()">Edit Profile</button>
                            </div>

                            <!-- Edit Form (Hidden by default) -->
                            <div id="profileEdit" style="display: none;">
                                <h4 class="mb-4">Update Information</h4>
                                <form id="updateProfileForm">
                                    <div class="mb-3">
                                        <label class="form-label">Full Name</label>
                                        <input type="text" name="full_name" id="editName" class="form-control" value="<?= htmlspecialchars($student['full_name'] ?? '') ?>" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Email</label>
                                        <input type="email" name="email" id="editEmail" class="form-control" value="<?= htmlspecialchars($student['email'] ?? '') ?>" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">LRN Number (cannot be changed)</label>
                                        <input type="text" class="form-control" value="<?= htmlspecialchars($student['lrn_number'] ?? '') ?>" disabled>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">New Password (leave blank to keep current)</label>
                                        <input type="password" name="password" class="form-control" placeholder="Enter new password only if changing">
                                    </div>
                                    <div class="d-flex gap-2 mt-4">
                                        <button type="submit" class="btn btn-success">Save Changes</button>
                                        <button type="button" class="btn btn-secondary" onclick="cancelEdit()">Cancel</button>
                                    </div>
                                </form>
                            </div>

                            <hr class="my-5">

                            <h5 class="text-danger">Danger Zone</h5>
                            <p>Once you delete your account, there is no going back.</p>
                            <button class="btn btn-danger" onclick="deleteAccount()">Delete My Account</button>
                        </div>
                    </div>

                    <!-- Right: Avatar -->
                    <div class="col-md-6">
                        <div class="chart-container p-5 text-center">
                            <img src="assets/Blue Circle.png" width="150" class="rounded-circle mb-3">
                            <h4><?= htmlspecialchars($student['full_name'] ?? getUserName()) ?></h4>
                            <p>Student Account</p>
                            <p>Total Reading Time: 48 hours</p>
                        </div>
                    </div>
                </div>
            </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/student-dashboard.js"></script>
</body>

</html>