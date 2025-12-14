<?php
session_start();  // <-- THIS LINE WAS MISSING

require_once '../includes/functions.php';

if (!isLoggedIn() || getUserRole() !== 'student') {
    redirect('auth.html');
}

$story_id = $_GET['story_id'] ?? 0;
if (!is_numeric($story_id) || $story_id <= 0) {
    die("Invalid story ID.");
}

$pdo = getDB();
$stmt = $pdo->prepare("SELECT title, description, content, grade_level, language FROM stories WHERE id = ?");
$stmt->execute([$story_id]);
$story = $stmt->fetch();

if (!$story) {
    die("Story not found.");
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($story['title']) ?> - SalinTinig</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/student-dashboard.css">
    <style>
        .reading-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
        }
        .story-card {
            background: white;
            border-radius: 28px;
            box-shadow: var(--shadow);
            padding: 3rem;
        }
        .story-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--primary-orange);
            text-align: center;
            margin-bottom: 1.5rem;
        }
        .story-meta {
            text-align: center;
            margin-bottom: 2rem;
        }
        .story-content {
            font-size: 1.3rem;
            line-height: 2.2;
            color: #333;
            text-align: justify;
        }
        .back-btn {
            border-radius: 30px;
            padding: 12px 30px;
        }
        .read-aloud-btn {
            border-radius: 50px;
            padding: 15px 40px;
            font-size: 1.2rem;
            margin-top: 2rem;
        }
    </style>
</head>
<body class="student-dashboard-body">

    <div class="container py-5">
        <div class="text-center mb-4">
            <a href="student-dashboard.php#stories" class="btn btn-outline-primary back-btn">
                ← Back to My Stories
            </a>
        </div>

        <div class="reading-container">
            <div class="story-card">
                <h1 class="story-title"><?= htmlspecialchars($story['title']) ?></h1>
                
                <div class="story-meta">
                    <span class="badge bg-primary fs-6"><?= htmlspecialchars($story['grade_level']) ?></span>
                    <span class="badge bg-info fs-6 mx-2"><?= htmlspecialchars($story['language']) ?></span>
                </div>

                <?php if (!empty($story['description'])): ?>
                    <p class="text-center text-muted lead mb-4">
                        <?= htmlspecialchars($story['description']) ?>
                    </p>
                <?php endif; ?>

                <div class="story-content">
                    <?php if (!empty($story['content'])): ?>
                        <?= nl2br(htmlspecialchars($story['content'])) ?>
                    <?php else: ?>
                        <p class="text-muted text-center">No story content available yet.</p>
                    <?php endif; ?>
                </div>

                <div class="text-center mt-5">
                    <p class="lead fw-bold">Ready to read aloud?</p>
                    <p class="text-muted mb-4">Click the button below when you're ready to practice your reading!</p>
                    <button class="btn btn-danger btn-lg read-aloud-btn">
                        <i class="fas fa-microphone me-3"></i> Start Reading Aloud
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>