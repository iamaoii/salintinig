document.addEventListener('DOMContentLoaded', () => {
    // Fluency Sparkline Chart
    const fluencyCtx = document.getElementById('fluencyChart');
    if (fluencyCtx && window.fluencyLabels && window.fluencyData) {
        new Chart(fluencyCtx, {
            type: 'line',
            data: {
                labels: window.fluencyLabels,
                datasets: [{
                    data: window.fluencyData,
                    borderColor: '#FF8C42',
                    backgroundColor: 'rgba(255, 140, 66, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#FF8C42',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => `${ctx.raw} wpm`
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Weekly Activity Bar Chart
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx && window.chartLabels && window.chartData) {
        new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: window.chartLabels,
                datasets: [{
                    label: 'Stories Read',
                    data: window.chartData,
                    backgroundColor: 'rgba(255, 140, 66, 0.8)',
                    hoverBackgroundColor: '#FF8C42',
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => `${ctx.raw} ${ctx.raw === 1 ? 'story' : 'stories'} completed`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: '#94A3B8',
                            font: { size: 12 }
                        },
                        grid: {
                            color: '#F1F5F9',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            color: '#64748B',
                            font: { size: 12, weight: '500' }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }
});
