// Shared chart configuration and utility functions

// Chart default configuration
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#ecf0f1'; // Default text color
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)'; // Default border color

// Common chart options
const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#ecf0f1', // Legend text color
                font: {
                    size: 12
                },
                padding: 20
            }
        },
        tooltip: {
            backgroundColor: 'rgba(44, 62, 80, 0.9)',
            titleColor: '#f39c12',
            bodyColor: '#ecf0f1',
            borderColor: '#e67e22',
            borderWidth: 1,
            padding: 10,
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== undefined) {
                        label += context.parsed.y.toFixed(1) + '%';
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        x: {
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
                color: '#ecf0f1'
            }
        },
        y: {
            grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
                color: '#ecf0f1',
                callback: function(value) {
                    return value + '%';
                }
            },
            beginAtZero: true,
            max: 100
        }
    }
};

// Function to create a line chart
function createLineChart(ctx, labels, datasets, customOptions = {}) {
    const options = {
        ...commonChartOptions,
        ...customOptions
    };
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets
        },
        options
    });
}

// Function to create a bar chart
function createBarChart(ctx, labels, datasets, customOptions = {}) {
    const options = {
        ...commonChartOptions,
        ...customOptions,
        scales: {
            ...commonChartOptions.scales,
            x: {
                ...commonChartOptions.scales.x,
                grid: {
                    display: false
                }
            }
        }
    };
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets
        },
        options
    });
}

// Function to calculate weighted score
function calculateWeightedScore(scores) {
    return (
        (scores.greetings * 0.15) +
        (scores.empathy * 0.20) +
        (scores.resolution * 0.25) +
        (scores.knowledge * 0.20) +
        (scores.closing * 0.15) +
        (scores.compliance * 0.05)
    ).toFixed(1);
}

// Function to prepare dataset for KPI charts
function prepareKPIDataset(label, data, index) {
    const colors = [
        { bg: 'rgba(255, 99, 132, 0.7)', border: 'rgba(255, 99, 132, 1)' },
        { bg: 'rgba(54, 162, 235, 0.7)', border: 'rgba(54, 162, 235, 1)' },
        { bg: 'rgba(255, 206, 86, 0.7)', border: 'rgba(255, 206, 86, 1)' },
        { bg: 'rgba(75, 192, 192, 0.7)', border: 'rgba(75, 192, 192, 1)' },
        { bg: 'rgba(153, 102, 255, 0.7)', border: 'rgba(153, 102, 255, 1)' },
        { bg: 'rgba(255, 159, 64, 0.7)', border: 'rgba(255, 159, 64, 1)' }
    ];
    
    const colorIndex = index % colors.length;
    
    return {
        label,
        data,
        backgroundColor: colors[colorIndex].bg,
        borderColor: colors[colorIndex].border,
        borderWidth: 1,
        tension: 0.1,
        fill: false
    };
}

// Function to destroy existing chart if it exists
function destroyChart(chartInstance) {
    if (chartInstance) {
        chartInstance.destroy();
    }
}

export {
    createLineChart,
    createBarChart,
    calculateWeightedScore,
    prepareKPIDataset,
    destroyChart,
    commonChartOptions
};