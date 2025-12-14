// public/js/teacher-dashboard.js - FINAL: Edit works for ALL stories (safe data attributes)

document.addEventListener('DOMContentLoaded', function () {

    // ==================== TAB SWITCHING ====================
    document.querySelectorAll('.tab-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // ==================== CHARTS ====================
    const progressCtx = document.getElementById('progressChart');
    if (progressCtx) {
        new Chart(progressCtx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Fluency',
                    data: [70, 76, 80, 85],
                    borderColor: '#FF8C42',
                    backgroundColor: 'rgba(255,140,66,0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    const genderCtx = document.getElementById('genderChart');
    if (genderCtx) {
        new Chart(genderCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [55, 45],
                    backgroundColor: ['#4A90E2', '#FFB199'],
                    borderWidth: 0,
                    cutout: '75%'
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    const reportCtx = document.getElementById('reportChart');
    if (reportCtx) {
        new Chart(reportCtx, {
            type: 'bar',
            data: {
                labels: ['Fluency', 'Comprehension', 'Speed', 'Engagement'],
                datasets: [{
                    data: [85, 78, 82, 90],
                    backgroundColor: ['#FF8C42', '#4A90E2', '#9B59B6', '#1ABC9C']
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 100 } }
            }
        });
    }

    // ==================== CRUD FOR STORIES (SAFE & WORKING) ====================

    window.openAddModal = function() {
        document.getElementById('modalTitle').textContent = 'Add New Story';
        document.getElementById('storyForm').reset();
        document.getElementById('storyId').value = '';
        document.getElementById('storyDesc').value = '';
        document.getElementById('storyContent').value = '';
    };

    // Safe edit using data attributes
    window.openEditModalFromLink = function(link) {
        document.getElementById('modalTitle').textContent = 'Edit Story';
        document.getElementById('storyId').value = link.dataset.id;
        document.getElementById('storyTitle').value = link.dataset.title;
        document.getElementById('storyDesc').value = link.dataset.description;
        document.getElementById('storyContent').value = link.dataset.content;
        document.getElementById('storyGrade').value = link.dataset.grade;
        document.getElementById('storyLang').value = link.dataset.language;
        new bootstrap.Modal(document.getElementById('storyModal')).show();
    };

    window.deleteStory = function(id) {
        if (confirm('Are you sure you want to delete this story?')) {
            fetch('api/stories.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=delete&id=' + id
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '#stories';
                    location.reload();
                } else {
                    alert('Error deleting story');
                }
            })
            .catch(() => alert('Error deleting story'));
        }
    };

    const storyForm = document.getElementById('storyForm');
    if (storyForm) {
        storyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const storyId = document.getElementById('storyId').value;
            formData.append('action', storyId ? 'update' : 'create');

            fetch('api/stories.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    bootstrap.Modal.getInstance(document.getElementById('storyModal')).hide();
                    window.location.href = '#stories';
                    location.reload();
                } else {
                    alert('Error saving story: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(err => {
                console.error(err);
                alert('Error saving story');
            });
        });
    }

    // Keep on Stories tab after reload
    if (window.location.hash === '#stories') {
        document.querySelector('.tab-link[data-tab="stories"]')?.click();
    }
});