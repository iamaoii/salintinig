document.addEventListener('DOMContentLoaded', function () {

    // Tab Switching
    document.querySelectorAll('.tab-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(this.dataset.tab).classList.add('active');
        });
    });

    // Existing Charts
    const progressCtx = document.getElementById('studentProgressChart');
    if (progressCtx) {
        new Chart(progressCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'Fluency %',
                    data: [78, 82, 80, 85, 88],
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

    const goalsCtx = document.getElementById('goalsChart');
    if (goalsCtx) {
        new Chart(goalsCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [85, 15],
                    backgroundColor: ['#FF8C42', '#eee'],
                    borderWidth: 0,
                    cutout: '80%'
                }]
            },
            options: {
                plugins: { legend: { display: false } }
            }
        });
    }

    // Profile Edit Toggle
    window.enableEdit = function() {
        document.getElementById('profileView').style.display = 'none';
        document.getElementById('profileEdit').style.display = 'block';
    };

    window.cancelEdit = function() {
        document.getElementById('profileEdit').style.display = 'none';
        document.getElementById('profileView').style.display = 'block';
    };

    // Update Profile
    const updateForm = document.getElementById('updateProfileForm');
    if (updateForm) {
        updateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            formData.append('action', 'update_profile');

            fetch('api/student.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Profile updated successfully!');
                    location.reload();
                } else {
                    alert(data.error || 'Error updating profile');
                }
            })
            .catch(() => alert('Connection error. Please try again.'));
        });
    }

    // Delete Account
    window.deleteAccount = function() {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            fetch('api/student.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: 'action=delete_account'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Account deleted. Goodbye!');
                    window.location.href = 'logout.php';
                } else {
                    alert(data.error || 'Error deleting account');
                }
            })
            .catch(() => alert('Connection error. Please try again.'));
        }
    };
});