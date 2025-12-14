// public/js/teacher-dashboard.js

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

    // Dashboard Charts
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

    // Reports Tab Chart
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
});