<?php
session_start();
require_once '../../includes/functions.php';
if (!isLoggedIn() || getUserRole() !== 'teacher') {
    redirect('../auth.html');
}
$teacherName = getUserName();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Stories • SalinTinig Teacher</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../css/teacher/style.css?v=<?= time() ?>">
    <link rel="stylesheet" href="../css/teacher/stories.css?v=<?= time() ?>">
    <!-- Extra styles for stories grid -->
    <style>
        .stories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        .story-card {
            background: white;
            border-radius: var(--border-radius);
            border: 1px solid var(--border-light);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            transition: box-shadow 0.2s;
        }
        .story-card:hover {
            box-shadow: var(--shadow-md);
        }
        .story-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-weight: 600;
        }
        .badge-grade { background: #EEF2FF; color: #4F46E5; }
        .badge-lang { background: #F0FDF4; color: #16A34A; }
    </style>
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
                <a href="stories.php" class="nav-link active">
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
                    <h1 class="text-xl font-bold text-slate-800">Manage Stories</h1>
                </div>
                
                <div class="header-actions">
                    <button class="icon-btn">
                        <span class="material-symbols-outlined">notifications</span>
                        <span class="notification-dot"></span>
                    </button>
                    <a href="javascript:void(0)" class="btn-primary flex items-center gap-2" onclick="openAddModal()" style="text-decoration: none;">
                        <span class="material-symbols-outlined text-sm">add</span>
                        <span>Add New Story</span>
                    </a>
                    <div class="profile-dropdown">
                        <button class="profile-trigger" onclick="toggleProfileDropdown()">
                            <div class="user-avatar">
                                <?= substr($teacherName, 0, 1) ?>
                            </div>
                            <span class="material-symbols-outlined" style="font-size: 1.25rem; color: #64748B;">expand_more</span>
                        </button>
                        <div class="profile-menu" id="profileMenu">
                            <div class="profile-menu-header">
                                <p class="font-bold text-slate-800"><?= htmlspecialchars($teacherName) ?></p>
                                <p class="text-xs text-slate-500">Teacher</p>
                            </div>
                            <div class="profile-menu-divider"></div>
                            <a href="settings.php" class="profile-menu-item">
                                <span class="material-symbols-outlined">settings</span>
                                Settings
                            </a>
                            <a href="support.php" class="profile-menu-item">
                                <span class="material-symbols-outlined">help</span>
                                Support
                            </a>
                            <div class="profile-menu-divider"></div>
                            <a href="../logout.php" class="profile-menu-item profile-menu-item--danger">
                                <span class="material-symbols-outlined">logout</span>
                                Logout
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <div class="content-wrapper">
                <?php
                // Get stories
                $pdo = getDB();
                $stmt = $pdo->query("SELECT * FROM stories ORDER BY created_at DESC");
                $stories = $stmt->fetchAll();
                
                // Get students for assignment modal
                $studentsStmt = $pdo->query("SELECT id, full_name, grade_level FROM students_account WHERE is_active = 1 ORDER BY full_name");
                $students = $studentsStmt->fetchAll();
                ?>

                <?php if (empty($stories)): ?>
                    <div class="empty-state text-center py-12">
                        <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">library_books</span>
                        <h3 class="text-lg font-bold text-slate-700">No stories yet</h3>
                        <p class="text-slate-500 mb-6">Create your first story to get started.</p>
                        <a href="javascript:void(0)" class="btn-primary" onclick="openAddModal()" style="display: inline-flex; text-decoration: none;">Create Story</a>
                    </div>
                <?php else: ?>
                    <div class="stories-grid">
                        <?php foreach ($stories as $story): ?>
                            <div class="story-card">
                                <div class="flex justify-between items-start mb-3">
                                    <h3 class="font-bold text-slate-800 text-lg"><?= htmlspecialchars($story['title']) ?></h3>
                                    <div class="flex gap-1">
                                        <button class="icon-btn" 
                                            data-id="<?= $story['id'] ?>"
                                            data-title="<?= htmlspecialchars($story['title'], ENT_QUOTES) ?>"
                                            data-description="<?= htmlspecialchars($story['description'] ?? '', ENT_QUOTES) ?>"
                                            data-content="<?= htmlspecialchars($story['content'] ?? '', ENT_QUOTES) ?>"
                                            data-grade="<?= htmlspecialchars($story['grade_level']) ?>"
                                            data-language="<?= htmlspecialchars($story['language']) ?>"
                                            onclick="openEditModal(this)" title="Edit">
                                            <span class="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button class="icon-btn text-red-600" onclick="deleteStory(<?= $story['id'] ?>)" title="Delete">
                                            <span class="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-slate-500 text-sm mb-4 flex-1 line-clamp-3">
                                    <?= htmlspecialchars($story['description'] ?? 'No description') ?>
                                </p>
                                <div class="flex items-center justify-between mt-auto">
                                    <div class="flex gap-2">
                                        <span class="story-badge badge-grade">Gr <?= htmlspecialchars($story['grade_level']) ?></span>
                                        <span class="story-badge badge-lang"><?= htmlspecialchars($story['language']) ?></span>
                                    </div>
                                    <button class="btn-sm flex items-center gap-1" onclick="openAssignModal(<?= $story['id'] ?>, '<?= htmlspecialchars($story['title'], ENT_QUOTES) ?>')">
                                        <span class="material-symbols-outlined text-sm">person_add</span>
                                        Assign
                                    </button>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </main>
    </div>

    <!-- Add/Edit Story Modal -->
    <div id="storyModal" class="modal-overlay">
        <div class="modal modal-lg">
            <div class="modal-header">
                <h3 class="modal-title" id="modalTitle">Add New Story</h3>
                <button class="modal-close" onclick="closeModal('storyModal')">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="modal-body">
                <form id="storyForm">
                    <input type="hidden" name="id" id="storyId">
                    <div class="form-group">
                        <label class="form-label">Title</label>
                        <input type="text" name="title" id="storyTitle" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Short Description</label>
                        <textarea name="description" id="storyDesc" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Full Story Content</label>
                        <textarea name="content" id="storyContent" class="form-control" rows="10" required></textarea>
                    </div>
                    <div class="flex gap-4">
                        <div class="form-group flex-1">
                            <label class="form-label">Grade Level</label>
                            <select name="grade_level" id="storyGrade" class="form-select">
                                <option value="4">Grade 4</option>
                                <option value="5">Grade 5</option>
                                <option value="6">Grade 6</option>
                                <option value="4-6" selected>Grades 4-6</option>
                            </select>
                        </div>
                        <div class="form-group flex-1">
                            <label class="form-label">Language</label>
                            <select name="language" id="storyLang" class="form-select">
                                <option value="English">English</option>
                                <option value="Filipino">Filipino</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 0; border: none; background: none; margin-top: 1rem;">
                        <button type="button" class="btn-secondary" onclick="closeModal('storyModal')">Cancel</button>
                        <button type="submit" class="btn-primary">Save Story</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Assign Modal -->
    <div id="assignModal" class="modal-overlay">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Assign Story</h3>
                <button class="modal-close" onclick="closeModal('assignModal')">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="modal-body">
                <form id="assignForm">
                    <input type="hidden" name="story_id" id="assignStoryId">
                    <div class="mb-4">
                        <p class="text-sm text-slate-600">Assigning: <strong id="assignStoryTitle" class="text-slate-900"></strong></p>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Assign To</label>
                        <select name="student_id" id="assignStudent" class="form-select" required>
                            <option value="all">Check All Students</option>
                            <?php foreach ($students as $student): ?>
                                <option value="<?= $student['id'] ?>">
                                    <?= htmlspecialchars($student['full_name']) ?> (Grade <?= $student['grade_level'] ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Due Date (Optional)</label>
                        <input type="date" name="due_date" id="assignDueDate" class="form-control">
                    </div>

                    <div class="modal-footer" style="padding: 0; border: none; background: none; margin-top: 1rem;">
                        <button type="button" class="btn-secondary" onclick="closeModal('assignModal')">Cancel</button>
                        <button type="submit" class="btn-primary">Assign Story</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="../js/teacher/stories.js"></script>
    <script>
        function toggleProfileDropdown() { document.getElementById('profileMenu').classList.toggle('show'); }
        document.addEventListener('click', e => { if (!e.target.closest('.profile-dropdown')) document.getElementById('profileMenu')?.classList.remove('show'); });
    </script>
</body>
</html>
