document.addEventListener('DOMContentLoaded', function() {
    // Initialize agents array from localStorage or empty array
    let agents = JSON.parse(localStorage.getItem('agents')) || [];
    let evaluations = JSON.parse(localStorage.getItem('evaluations')) || [];
    
    // DOM elements
    const agentNameInput = document.getElementById('agentName');
    const addAgentBtn = document.getElementById('addAgent');
    const agentListSelect = document.getElementById('agentList');
    const removeAgentBtn = document.getElementById('removeAgent');
    const selectedAgentSelect = document.getElementById('selectedAgent');
    const filterAgentsSelect = document.getElementById('filterAgents');
    const submitBtn = document.getElementById('submitEvaluation');
    const filterResultsBtn = document.getElementById('filterResults');
    const viewPerformanceBtn = document.getElementById('viewPerformanceChart');
    
    // Populate agent dropdowns
    function populateAgentDropdowns() {
        // Clear existing options
        agentListSelect.innerHTML = '<option value="">Select agent to remove</option>';
        selectedAgentSelect.innerHTML = '<option value="">-- Select Agent --</option>';
        filterAgentsSelect.innerHTML = '';
        
        // Add agents to dropdowns
        agents.forEach(agent => {
            const option1 = document.createElement('option');
            option1.value = agent;
            option1.textContent = agent;
            agentListSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = agent;
            option2.textContent = agent;
            selectedAgentSelect.appendChild(option2);
            
            const option3 = document.createElement('option');
            option3.value = agent;
            option3.textContent = agent;
            filterAgentsSelect.appendChild(option3);
        });
    }
    
    // Add new agent
    addAgentBtn.addEventListener('click', function() {
        const agentName = agentNameInput.value.trim();
        if (agentName && !agents.includes(agentName)) {
            agents.push(agentName);
            localStorage.setItem('agents', JSON.stringify(agents));
            populateAgentDropdowns();
            agentNameInput.value = '';
            alert(`Agent ${agentName} added successfully!`);
        } else if (agents.includes(agentName)) {
            alert('This agent already exists!');
        } else {
            alert('Please enter a valid agent name!');
        }
    });
    
    // Remove agent
    removeAgentBtn.addEventListener('click', function() {
        const agentToRemove = agentListSelect.value;
        if (agentToRemove && confirm(`Are you sure you want to remove ${agentToRemove}?`)) {
            agents = agents.filter(agent => agent !== agentToRemove);
            localStorage.setItem('agents', JSON.stringify(agents));
            populateAgentDropdowns();
            alert(`Agent ${agentToRemove} removed successfully!`);
        }
    });
    
    // Submit evaluation
    submitBtn.addEventListener('click', function() {
        const agent = selectedAgentSelect.value;
        const comments = document.getElementById('evaluationComments').value;
        
        if (!agent) {
            alert('Please select an agent!');
            return;
        }
        
        if (!comments) {
            alert('Please enter evaluation comments!');
            return;
        }
        
        const evaluation = {
            agent,
            date: new Date().toISOString(),
            scores: {
                greetings: parseInt(document.getElementById('greetings').value),
                empathy: parseInt(document.getElementById('empathy').value),
                resolution: parseInt(document.getElementById('resolution').value),
                knowledge: parseInt(document.getElementById('knowledge').value),
                closing: parseInt(document.getElementById('closing').value),
                compliance: parseInt(document.getElementById('compliance').value)
            },
            comments
        };
        
        evaluations.push(evaluation);
        localStorage.setItem('evaluations', JSON.stringify(evaluations));
        
        // Calculate and display areas for improvement
        displayImprovementAreas(agent);
        
        // Update score history chart
        updateScoreChart(agent);
        
        alert('Evaluation submitted successfully!');
        
        // Reset form
        document.querySelectorAll('.kpi-evaluation input[type="number"]').forEach(input => {
            input.value = 0;
        });
        document.getElementById('evaluationComments').value = '';
    });
    
    // Display improvement areas
    function displayImprovementAreas(agent) {
        const agentEvaluations = evaluations.filter(e => e.agent === agent);
        if (agentEvaluations.length === 0) return;
        
        const latestEvaluation = agentEvaluations[agentEvaluations.length - 1];
        const scores = latestEvaluation.scores;
        const improvementList = document.getElementById('improvementList');
        improvementList.innerHTML = '';
        
        // Find scores below 70 as areas for improvement
        Object.entries(scores).forEach(([kpi, score]) => {
            if (score < 70) {
                const li = document.createElement('li');
                li.textContent = `${kpi.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${score}% (Needs improvement)`;
                improvementList.appendChild(li);
            }
        });
        
        if (improvementList.children.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No significant areas for improvement. Good job!';
            improvementList.appendChild(li);
        }
    }
    
    // Update score chart
    function updateScoreChart(agent) {
        const agentEvaluations = evaluations.filter(e => e.agent === agent);
        if (agentEvaluations.length === 0) return;
        
        const ctx = document.getElementById('scoreChart').getContext('2d');
        
        // Prepare data for chart
        const labels = agentEvaluations.map(e => new Date(e.date).toLocaleDateString());
        const datasets = [
            {
                label: 'Greetings',
                data: agentEvaluations.map(e => e.scores.greetings),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
            },
            {
                label: 'Empathy',
                data: agentEvaluations.map(e => e.scores.empathy),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.1
            },
            {
                label: 'Resolution',
                data: agentEvaluations.map(e => e.scores.resolution),
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                tension: 0.1
            },
            {
                label: 'Knowledge',
                data: agentEvaluations.map(e => e.scores.knowledge),
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            },
            {
                label: 'Closing',
                data: agentEvaluations.map(e => e.scores.closing),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                tension: 0.1
            },
            {
                label: 'Compliance',
                data: agentEvaluations.map(e => e.scores.compliance),
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                tension: 0.1
            }
        ];
        
        // Destroy existing chart if it exists
        if (window.scoreChart) {
            window.scoreChart.destroy();
        }
        
        // Create new chart
        window.scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: `${agent}'s Score History`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
    
    // Filter results button
    filterResultsBtn.addEventListener('click', function() {
        const selectedAgents = Array.from(filterAgentsSelect.selectedOptions).map(opt => opt.value);
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (selectedAgents.length === 0) {
            alert('Please select at least one agent!');
            return;
        }
        
        if (!startDate || !endDate) {
            alert('Please select a date range!');
            return;
        }
        
        // Store filter criteria in localStorage
        localStorage.setItem('filterCriteria', JSON.stringify({
            agents: selectedAgents,
            startDate,
            endDate
        }));
        
        // Navigate to results page
        window.location.href = 'results.html';
    });
    
    // View performance chart button
    viewPerformanceBtn.addEventListener('click', function() {
        const selectedAgents = Array.from(filterAgentsSelect.selectedOptions).map(opt => opt.value);
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (selectedAgents.length === 0) {
            alert('Please select at least one agent!');
            return;
        }
        
        if (!startDate || !endDate) {
            alert('Please select a date range!');
            return;
        }
        
        // Store filter criteria in localStorage
        localStorage.setItem('filterCriteria', JSON.stringify({
            agents: selectedAgents,
            startDate,
            endDate
        }));
        
        // Navigate to performance page
        window.location.href = 'performance.html';
    });
    
    // When agent is selected, update their chart and improvement areas
    selectedAgentSelect.addEventListener('change', function() {
        const agent = this.value;
        if (agent) {
            displayImprovementAreas(agent);
            updateScoreChart(agent);
        }
    });
    
    // Initialize the page
    populateAgentDropdowns();
    
    // Set default dates for filter (current week)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
    
    document.getElementById('startDate').valueAsDate = startOfWeek;
    document.getElementById('endDate').valueAsDate = endOfWeek;
});