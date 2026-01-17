document.addEventListener('DOMContentLoaded', function () {
    if (!window.dashboardData) return;

    // Activity Chart
    const activityCtx = document.getElementById('activityChart').getContext('2d');
    const activityData = window.dashboardData.activity;

    new Chart(activityCtx, {
        type: 'bar',
        data: {
            labels: activityData.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Reading Sessions',
                data: activityData.map(d => d.count),
                backgroundColor: 'rgba(255, 107, 0, 0.8)', // Primary Orange
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { display: true, color: '#f3f4f6' },
                    ticks: { stepSize: 1, font: { family: "'Inter', sans-serif" } },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { family: "'Inter', sans-serif" } },
                    border: { display: false }
                }
            }
        }
    });

    // Grade Distribution Chart
    const gradeCtx = document.getElementById('gradeChart').getContext('2d');
    const gradeData = window.dashboardData.grades;

    new Chart(gradeCtx, {
        type: 'doughnut',
        data: {
            labels: gradeData.map(d => 'Grade ' + d.grade_level),
            datasets: [{
                data: gradeData.map(d => d.count),
                backgroundColor: [
                    '#FF6B00', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: { family: "'Inter', sans-serif" },
                        boxWidth: 12,
                        usePointStyle: true
                    }
                }
            }
        }
    });
});
