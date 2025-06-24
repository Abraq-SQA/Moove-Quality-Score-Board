import { storage, formatDate, getKPIs } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const performanceDateRange = document.getElementById('performanceDateRange');
    const performanceDesignation = document.getElementById('performanceDesignation');
    const teamPerformanceChartCtx = document.getElementById('teamPerformanceChart').getContext('2d');
    const kpiStatsContainer = document.getElementById('kpiStats');
    const backFromPerformanceBtn = document.getElementById('backFromPerformanceBtn');

    // State
    let evaluations = storage.getEvaluations();
    let agents = storage.getAgents();
    let filterParams = storage.getFilterParams();
    let teamPerformanceChart;

    // Initialize the page
    function init() {
        displayFilterInfo();
        renderTeamPerformanceChart();
        renderKPIStats();
        setupEventListeners();
    }

    // Display filter information at the top
    function displayFilterInfo() {
        // Date range
        const startDate = formatDate(filterParams.startDate);
        const endDate = formatDate(filterParams.endDate);
        performanceDateRange.textContent = `Date Range: ${startDate} to ${endDate}`;
        
        // Designation
        if (filterParams.designation) {
            performanceDesignation.textContent = `Designation: ${filterParams.designation}`;
        } else {
            performanceDesignation.textContent = 'Designation: All Teams';
        }
    }

    // Render team performance chart
    function renderTeamPerformanceChart() {
        // Filter evaluations based on parameters
        let filteredEvaluations = evaluations.filter(evaluation => {
            // Date filter
            const evalDate = new Date(evaluation.date);
            const startDate = new Date(filterParams.startDate);
            const endDate = new Date(filterParams.endDate);
            
            if (evalDate < startDate || evalDate > endDate) {
                return false;
            }
            
            // Designation filter
            if (filterParams.designation) {
                const agent = agents.find(a => a.id === evaluation.agentId);
                if (!agent || agent.designation !== filterParams.designation) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (filteredEvaluations.length === 0) {
            // Show message if no data
            teamPerformanceChartCtx.canvas.parentNode.innerHTML = '<div class="no-data">No performance data available for the selected criteria</div>';
            return;
        }
        
        // Get KPI data
        const kpis = getKPIs();
        const kpiNames = kpis.map(kpi => kpi.name);
        const kpiAverages = {};
        
        // Calculate average for each KPI
        kpiNames.forEach(kpi => {
            const kpiScores = filteredEvaluations.map(e => e.kpis[kpi]).filter(score => score !== undefined);
            const average = kpiScores.length > 0 ? 
                kpiScores.reduce((sum, score) => sum + score, 0) / kpiScores.length : 0;
            kpiAverages[kpi] = Math.round(average);
        });
        
        // Create chart data
        const backgroundColors = [
            'rgba(255, 107, 0, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(153, 102, 255, 0.7)'
        ];
        
        const borderColors = [
            'rgba(255, 107, 0, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(153, 102, 255, 1)'
        ];
        
        // Create or update chart
        if (teamPerformanceChart) {
            teamPerformanceChart.data.datasets[0].data = Object.values(kpiAverages);
            teamPerformanceChart.update();
        } else {
            teamPerformanceChart = new Chart(teamPerformanceChartCtx, {
                type: 'bar',
                data: {
                    labels: kpiNames,
                    datasets: [{
                        label: 'Average Score (%)',
                        data: Object.values(kpiAverages),
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.raw + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Render KPI statistics
    function renderKPIStats() {
        // Filter evaluations based on parameters
        let filteredEvaluations = evaluations.filter(evaluation => {
            // Date filter
            const evalDate = new Date(evaluation.date);
            const startDate = new Date(filterParams.startDate);
            const endDate = new Date(filterParams.endDate);
            
            if (evalDate < startDate || evalDate > endDate) {
                return false;
            }
            
            // Designation filter
            if (filterParams.designation) {
                const agent = agents.find(a => a.id === evaluation.agentId);
                if (!agent || agent.designation !== filterParams.designation) {
                    return false;
                }
            }
            
            return true;
        });
        
        if (filteredEvaluations.length === 0) {
            kpiStatsContainer.innerHTML = '<div class="no-data">No KPI data available</div>';
            return;
        }
        
        // Get KPI data
        const kpis = getKPIs();
        const kpiNames = kpis.map(kpi => kpi.name);
        const kpiData = {};
        
        // Calculate statistics for each KPI
        kpiNames.forEach(kpi => {
            const scores = filteredEvaluations.map(e => e.kpis[kpi]).filter(score => score !== undefined);
            
            if (scores.length > 0) {
                const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
                const min = Math.min(...scores);
                const max = Math.max(...scores);
                
                kpiData[kpi] = {
                    average: Math.round(average),
                    min,
                    max,
                    count: scores.length
                };
            } else {
                kpiData[kpi] = {
                    average: 0,
                    min: 0,
                    max: 0,
                    count: 0
                };
            }
        });
        
        // Render KPI stats
        kpiStatsContainer.innerHTML = '';
        
        kpis.forEach(kpi => {
            const data = kpiData[kpi.name];
            const statElement = document.createElement('div');
            statElement.className = 'kpi-stat';
            
            statElement.innerHTML = `
                <h4>${kpi.name} (${kpi.weight}%)</h4>
                <p>Average: ${data.average}%</p>
                <p>Range: ${data.min}% - ${data.max}%</p>
                <p>Evaluations: ${data.count}</p>
            `;
            
            kpiStatsContainer.appendChild(statElement);
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        // Back button
        backFromPerformanceBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // Initialize the page
    init();
});