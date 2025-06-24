import { storage, calculateWeightedScore, formatDate, getKPIs, getImprovementAreas } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const agentNameInput = document.getElementById('agentName');
    const agentDesignationSelect = document.getElementById('agentDesignation');
    const addAgentBtn = document.getElementById('addAgentBtn');
    const agentListSelect = document.getElementById('agentList');
    const removeAgentBtn = document.getElementById('removeAgentBtn');
    const evaluationAgentSelect = document.getElementById('evaluationAgent');
    const kpiScoreInputs = document.querySelectorAll('.kpi-score');
    const evaluationComments = document.getElementById('evaluationComments');
    const submitEvaluationBtn = document.getElementById('submitEvaluationBtn');
    const scoreHistoryChartCtx = document.getElementById('scoreHistoryChart').getContext('2d');
    const improvementList = document.getElementById('improvementList');
    const filterAgentsSelect = document.getElementById('filterAgents');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const filterDesignationSelect = document.getElementById('filterDesignation');
    const filterResultsBtn = document.getElementById('filterResultsBtn');
    const viewPerformanceChartBtn = document.getElementById('viewPerformanceChartBtn');
    const confirmationModal = document.getElementById('confirmationModal');
    const modalMessage = document.getElementById('modalMessage');
    const confirmActionBtn = document.getElementById('confirmActionBtn');
    const cancelActionBtn = document.getElementById('cancelActionBtn');

    // Initialize date inputs with default values (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    startDateInput.valueAsDate = firstDayOfMonth;
    endDateInput.valueAsDate = lastDayOfMonth;

    // State
    let scoreHistoryChart;
    let agents = storage.getAgents();
    let evaluations = storage.getEvaluations();
    let pendingAction = null;

    // Initialize the app
    function init() {
        renderAgentLists();
        setupEventListeners();
        
        // If an agent is selected in the evaluation dropdown, show their history
        if (evaluationAgentSelect.value) {
            updateAgentHistoryChart(evaluationAgentSelect.value);
        }
    }

    // Render agent lists in all select elements
    function renderAgentLists() {
        // Clear existing options
        agentListSelect.innerHTML = '';
        evaluationAgentSelect.innerHTML = '<option value="">Select Agent</option>';
        filterAgentsSelect.innerHTML = '';
        
        // Add agents to all select elements
        agents.forEach(agent => {
            const option1 = document.createElement('option');
            option1.value = agent.id;
            option1.textContent = `${agent.name} (${agent.designation})`;
            agentListSelect.appendChild(option1.cloneNode(true));
            
            const option2 = option1.cloneNode(true);
            evaluationAgentSelect.appendChild(option2);
            
            const option3 = option1.cloneNode(true);
            filterAgentsSelect.appendChild(option3);
        });
    }

    // Set up event listeners
    function setupEventListeners() {
        // Agent management
        addAgentBtn.addEventListener('click', addAgent);
        removeAgentBtn.addEventListener('click', confirmRemoveAgent);
        
        // Evaluation form
        evaluationAgentSelect.addEventListener('change', (e) => {
            updateAgentHistoryChart(e.target.value);
        });
        
        // KPI score validation
        kpiScoreInputs.forEach(input => {
            input.addEventListener('change', validateKPIScore);
        });
        
        submitEvaluationBtn.addEventListener('click', submitEvaluation);
        
        // Performance filter
        filterResultsBtn.addEventListener('click', filterResults);
        viewPerformanceChartBtn.addEventListener('click', viewPerformanceChart);
        
        // Modal buttons
        confirmActionBtn.addEventListener('click', executePendingAction);
        cancelActionBtn.addEventListener('click', closeModal);
    }

    // Add a new agent
    function addAgent() {
        const name = agentNameInput.value.trim();
        const designation = agentDesignationSelect.value;
        
        if (!name || !designation) {
            alert('Please enter both agent name and designation');
            return;
        }
        
        const newAgent = {
            id: Date.now().toString(),
            name,
            designation
        };
        
        agents.push(newAgent);
        storage.saveAgents(agents);
        renderAgentLists();
        
        // Reset form
        agentNameInput.value = '';
        agentDesignationSelect.value = '';
        
        // Show confirmation
        showModal('Agent added successfully!');
        setTimeout(closeModal, 1500);
    }

    // Confirm before removing agent
    function confirmRemoveAgent() {
        const selectedIndex = agentListSelect.selectedIndex;
        
        if (selectedIndex === -1) {
            alert('Please select an agent to remove');
            return;
        }
        
        const agentId = agentListSelect.options[selectedIndex].value;
        const agentName = agentListSelect.options[selectedIndex].text;
        
        // Check if agent has evaluations
        const agentEvaluations = evaluations.filter(e => e.agentId === agentId);
        if (agentEvaluations.length > 0) {
            showModal(`Agent ${agentName} has ${agentEvaluations.length} evaluation(s). Are you sure you want to remove them?`);
            pendingAction = () => removeAgent(agentId);
        } else {
            showModal(`Remove agent ${agentName}?`);
            pendingAction = () => removeAgent(agentId);
        }
    }

    // Remove agent after confirmation
    function removeAgent(agentId) {
        agents = agents.filter(agent => agent.id !== agentId);
        storage.saveAgents(agents);
        renderAgentLists();
        closeModal();
    }

    // Validate KPI score input (0-100)
    function validateKPIScore(e) {
        const input = e.target;
        const value = parseFloat(input.value);
        
        if (isNaN(value) || value < 0 || value > 100) {
            input.value = '';
            alert('Please enter a score between 0 and 100');
            input.focus();
        }
    }

    // Submit evaluation
    function submitEvaluation() {
    const agentId = evaluationAgentSelect.value;
    
    if (!agentId) {
        alert('Please select an agent');
        return;
    }
    
    // Validate all KPI scores
    let allValid = true;
    kpiScoreInputs.forEach(input => {
        const value = parseFloat(input.value);
        if (isNaN(value)) {
            allValid = false;
            input.focus();
        }
    });
    
    if (!allValid) {
        alert('Please enter valid scores for all KPIs (0-100)');
        return;
    }
    
    if (!evaluationComments.value.trim()) {
        alert('Please enter comments for the evaluation');
        evaluationComments.focus();
        return;
    }
    
    // Get KPI scores
    const kpis = {};
    const kpiDefinitions = getKPIs();
    
    kpiScoreInputs.forEach(input => {
        const kpiName = input.previousElementSibling.textContent.split(' (')[0];
        kpis[kpiName] = parseFloat(input.value);
    });
    
    // Create evaluation object
    const evaluation = {
        id: Date.now().toString(),
        agentId,
        date: new Date().toISOString(),
        kpis,
        totalScore: calculateWeightedScore(Array.from(kpiScoreInputs)),
        comments: evaluationComments.value.trim()
    };
    
    // Add to evaluations and save
    evaluations.push(evaluation);
    storage.saveEvaluations(evaluations);
    
    // Update UI
    updateAgentHistoryChart(agentId);
    
    // Clear the form completely
    resetEvaluationForm();
    
    // Show confirmation
    showModal('Evaluation submitted successfully!');
    setTimeout(closeModal, 1500);
}

// New function to reset the evaluation form
function resetEvaluationForm() {
    // Clear all KPI score inputs
    kpiScoreInputs.forEach(input => input.value = '');
    
    // Clear comments
    evaluationComments.value = '';
    
    // Reset agent selection (optional - remove if you want to keep the same agent selected)
    // evaluationAgentSelect.value = '';
    
    // If you want to keep the agent selected but clear scores:
    // Just keep the above three lines and remove the agent selection reset
}

    // Update the agent's score history chart
    function updateAgentHistoryChart(agentId) {
        if (!agentId) {
            if (scoreHistoryChart) {
                scoreHistoryChart.destroy();
            }
            improvementList.innerHTML = '';
            return;
        }
        
        const agentEvaluations = evaluations
            .filter(e => e.agentId === agentId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Update improvement areas
        const improvements = getImprovementAreas(agentEvaluations);
        improvementList.innerHTML = improvements.map(imp => `<li>${imp}</li>`).join('');
        
        if (agentEvaluations.length === 0) {
            if (scoreHistoryChart) {
                scoreHistoryChart.destroy();
            }
            return;
        }
        
        // Prepare chart data
        const labels = agentEvaluations.map(e => formatDate(e.date));
        const scores = agentEvaluations.map(e => e.totalScore);
        
        // Get KPI data for radar chart
        const kpiNames = getKPIs().map(kpi => kpi.name);
        const latestEvaluation = agentEvaluations[agentEvaluations.length - 1];
        const kpiScores = kpiNames.map(name => latestEvaluation.kpis[name]);
        
        // Create or update chart
        if (scoreHistoryChart) {
            scoreHistoryChart.data.labels = labels;
            scoreHistoryChart.data.datasets[0].data = scores;
            scoreHistoryChart.update();
        } else {
            scoreHistoryChart = new Chart(scoreHistoryChartCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Score',
                        data: scores,
                        borderColor: '#FF6B00',
                        backgroundColor: 'rgba(255, 107, 0, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
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
                                    return context.dataset.label + ': ' + context.raw + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Filter results and navigate to results page
    function filterResults() {
        const selectedOptions = Array.from(filterAgentsSelect.selectedOptions);
        const agentIds = selectedOptions.map(option => option.value);
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const designation = filterDesignationSelect.value;
        
        // Validate at least one agent is selected
        if (agentIds.length === 0 && !designation) {
            alert('Please select at least one agent or a designation');
            return;
        }
        
        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            alert('End date must be after start date');
            return;
        }
        
        // Save filter parameters to session storage
        const filterParams = {
            agentIds,
            startDate,
            endDate,
            designation
        };
        
        storage.saveFilterParams(filterParams);
        
        // Navigate to results page
        window.location.href = 'results.html';
    }

    // Navigate to performance chart page
    function viewPerformanceChart() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const designation = filterDesignationSelect.value;
        
        // Validate date range
        if (new Date(startDate) > new Date(endDate)) {
            alert('End date must be after start date');
            return;
        }
        
        // Save filter parameters to session storage
        const filterParams = {
            startDate,
            endDate,
            designation
        };
        
        storage.saveFilterParams(filterParams);
        
        // Navigate to performance page
        window.location.href = 'performance.html';
    }

    // Modal functions
    function showModal(message) {
        modalMessage.textContent = message;
        confirmationModal.style.display = 'flex';
    }

    function closeModal() {
        confirmationModal.style.display = 'none';
        pendingAction = null;
    }

    function executePendingAction() {
        if (pendingAction) {
            pendingAction();
        }
        closeModal();
    }

    // Initialize the app
    init();
});