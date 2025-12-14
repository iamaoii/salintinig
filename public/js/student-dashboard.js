// public/js/student-dashboard.js

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

    // Student Progress Line Chart (small & reasonable)
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

    // Goals Doughnut Chart (compact)
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
});