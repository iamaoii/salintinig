document.addEventListener('DOMContentLoaded', function () {
    if (!window.reportsData) return;

    // Activity Chart
    const activityCanvas = document.getElementById('activityChart');
    if (activityCanvas && window.reportsData.dailyActivity) {
        const activityCtx = activityCanvas.getContext('2d');
        const activityData = window.reportsData.dailyActivity;

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
                    backgroundColor: 'rgba(255, 107, 0, 0.8)', // Primary color
                    borderRadius: 4,
                    hoverBackgroundColor: '#FF6B00'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        grid: { color: '#F1F5F9' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Grade Distribution Chart
    const gradeCanvas = document.getElementById('gradeChart');
    if (gradeCanvas && window.reportsData.gradeDistribution) {
        const gradeCtx = gradeCanvas.getContext('2d');
        const gradeData = window.reportsData.gradeDistribution;

        new Chart(gradeCtx, {
            type: 'doughnut',
            data: {
                labels: gradeData.map(d => 'Grade ' + d.grade_level),
                datasets: [{
                    data: gradeData.map(d => d.count),
                    backgroundColor: [
                        '#FF6B00', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }
});
