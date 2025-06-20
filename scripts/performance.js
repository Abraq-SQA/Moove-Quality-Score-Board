document.addEventListener('DOMContentLoaded', function() {
    const filterCriteria = JSON.parse(localStorage.getItem('filterCriteria'));
    const evaluations = JSON.parse(localStorage.getItem('evaluations')) || [];
    const filterDetails = document.getElementById('performanceFilterDetails');
    const backBtn = document.getElementById('backToResults');
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    if (!filterCriteria) {
        filterDetails.textContent = 'No filter criteria found. Please go back and apply a filter.';
        return;
    }
    
    // Display filter details
    filterDetails.textContent = `Showing performance for ${filterCriteria.agents.join(', ')} from ${new Date(filterCriteria.startDate).toLocaleDateString()} to ${new Date(filterCriteria.endDate).toLocaleDateString()}`;
    
    // Filter evaluations based on criteria
    const filteredEvaluations = evaluations.filter(eval => {
        const evalDate = new Date(eval.date);
        const startDate = new Date(filterCriteria.startDate);
        const endDate = new Date(filterCriteria.endDate);
        endDate.setDate(endDate.getDate() + 1); // Include end date
        
        return filterCriteria.agents.includes(eval.agent) && 
               evalDate >= startDate && 
               evalDate <= endDate;
    });
    
    if (filteredEvaluations.length === 0) {
        filterDetails.textContent += ' - No evaluations found for this period';
        return;
    }
    
    // Calculate average scores for each KPI
    function calculateAverages() {
        const kpiSums = {
            greetings: 0,
            empathy: 0,
            resolution: 0,
            knowledge: 0,
            closing: 0,
            compliance: 0
        };
        
        filteredEvaluations.forEach(eval => {
            kpiSums.greetings += eval.scores.greetings;
            kpiSums.empathy += eval.scores.empathy;
            kpiSums.resolution += eval.scores.resolution;
            kpiSums.knowledge += eval.scores.knowledge;
            kpiSums.closing += eval.scores.closing;
            kpiSums.compliance += eval.scores.compliance;
        });
        
        const count = filteredEvaluations.length;
        return {
            greetings: kpiSums.greetings / count,
            empathy: kpiSums.empathy / count,
            resolution: kpiSums.resolution / count,
            knowledge: kpiSums.knowledge / count,
            closing: kpiSums.closing / count,
            compliance: kpiSums.compliance / count
        };
    }
    
    const averageScores = calculateAverages();
    
    // Create chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Greetings', 'Empathy', 'Resolution', 'Knowledge', 'Closing', 'Compliance'],
            datasets: [{
                label: 'Average Scores',
                data: [
                    averageScores.greetings,
                    averageScores.empathy,
                    averageScores.resolution,
                    averageScores.knowledge,
                    averageScores.closing,
                    averageScores.compliance
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Team Performance by KPI',
                    font: {
                        size: 18
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Average: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score (%)'
                    }
                }
            }
        }
    });
    
    // Back button
    backBtn.addEventListener('click', function() {
        window.location.href = 'results.html';
    });
});