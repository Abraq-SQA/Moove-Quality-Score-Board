import { storage, formatDate, exportToCSV } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const resultsTitle = document.getElementById('resultsTitle');
    const resultsDateRange = document.getElementById('resultsDateRange');
    const resultsAgents = document.getElementById('resultsAgents');
    const resultsDesignation = document.getElementById('resultsDesignation');
    const resultsContainer = document.getElementById('resultsContainer');
    const exportToSheetsBtn = document.getElementById('exportToSheetsBtn');
    const backToMainBtn = document.getElementById('backToMainBtn');
    const editModal = document.getElementById('editModal');
    const editCommentTextarea = document.getElementById('editCommentTextarea');
    const saveCommentBtn = document.getElementById('saveCommentBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const deleteEvaluationBtn = document.getElementById('deleteEvaluationBtn');

    // State
    let evaluations = storage.getEvaluations();
    let agents = storage.getAgents();
    let filterParams = storage.getFilterParams();
    let currentEditId = null;

    // Initialize the page
    function init() {
        displayFilterInfo();
        renderResults();
        setupEventListeners();
    }

    // Display filter information at the top
    function displayFilterInfo() {
        // Date range
        const startDate = formatDate(filterParams.startDate);
        const endDate = formatDate(filterParams.endDate);
        resultsDateRange.textContent = `Date Range: ${startDate} to ${endDate}`;
        
        // Agents
        if (filterParams.agentIds && filterParams.agentIds.length > 0) {
            const selectedAgents = filterParams.agentIds.map(id => {
                const agent = agents.find(a => a.id === id);
                return agent ? agent.name : 'Unknown Agent';
            });
            resultsAgents.textContent = `Agents: ${selectedAgents.join(', ')}`;
        } else {
            resultsAgents.textContent = 'Agents: All Agents';
        }
        
        // Designation
        if (filterParams.designation) {
            resultsDesignation.textContent = `Designation: ${filterParams.designation}`;
            resultsTitle.textContent = `${filterParams.designation} Performance Results`;
        } else {
            resultsDesignation.textContent = 'Designation: All Designations';
        }
    }

    // Render filtered results
    function renderResults() {
        // Filter evaluations based on parameters
        let filteredEvaluations = evaluations.filter(evaluation => {
            // Date filter
            const evalDate = new Date(evaluation.date);
            const startDate = new Date(filterParams.startDate);
            const endDate = new Date(filterParams.endDate);
            
            if (evalDate < startDate || evalDate > endDate) {
                return false;
            }
            
            // Agent filter
            if (filterParams.agentIds && filterParams.agentIds.length > 0) {
                if (!filterParams.agentIds.includes(evaluation.agentId)) {
                    return false;
                }
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
        
        // Sort by date (newest first)
        filteredEvaluations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Group by agent for better display
        const agentsWithEvaluations = {};
        
        filteredEvaluations.forEach(evaluation => {
            if (!agentsWithEvaluations[evaluation.agentId]) {
                const agent = agents.find(a => a.id === evaluation.agentId) || { name: 'Unknown Agent', designation: 'Unknown' };
                agentsWithEvaluations[evaluation.agentId] = {
                    agent,
                    evaluations: []
                };
            }
            agentsWithEvaluations[evaluation.agentId].evaluations.push(evaluation);
        });
        
        // Render results
        resultsContainer.innerHTML = '';
        
        if (filteredEvaluations.length === 0) {
            resultsContainer.innerHTML = '<div class="glass-box no-results">No evaluations found for the selected criteria</div>';
            return;
        }
        
        for (const agentId in agentsWithEvaluations) {
            const { agent, evaluations } = agentsWithEvaluations[agentId];
            
            evaluations.forEach(evaluation => {
                const evaluationElement = document.createElement('div');
                evaluationElement.className = 'evaluation-result';
                evaluationElement.dataset.id = evaluation.id;
                
                // Format KPIs for display
                const kpiItems = Object.entries(evaluation.kpis).map(([name, score]) => {
                    return `<div class="kpi-result"><span>${name}:</span> ${score}%</div>`;
                }).join('');
                
                evaluationElement.innerHTML = `
                    <div class="evaluation-header">
                        <div class="evaluation-agent">${agent.name} (${agent.designation})</div>
                        <div class="evaluation-date">${formatDate(evaluation.date)}</div>
                    </div>
                    <div class="evaluation-kpis">${kpiItems}</div>
                    <div class="evaluation-total">Total Score: <strong>${evaluation.totalScore}%</strong></div>
                    <div class="evaluation-comment">${evaluation.comments}</div>
                    <div class="evaluation-actions">
                        <div class="hamburger-menu">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <div class="action-menu">
                            <button class="edit-btn">Edit</button>
                            <button class="delete-btn">Delete</button>
                        </div>
                    </div>
                `;
                
                resultsContainer.appendChild(evaluationElement);
            });
        }
    }

    // Set up event listeners
    function setupEventListeners() {
        // Export to sheets
        exportToSheetsBtn.addEventListener('click', exportResultsToCSV);
        
        // Back to main button
        backToMainBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
        
        // Hamburger menu for edit/delete
        document.addEventListener('click', (e) => {
            // Toggle action menu
            if (e.target.classList.contains('hamburger-menu') || e.target.closest('.hamburger-menu')) {
                const actionMenu = e.target.closest('.evaluation-actions').querySelector('.action-menu');
                const allMenus = document.querySelectorAll('.action-menu');
                
                // Close all other open menus
                allMenus.forEach(menu => {
                    if (menu !== actionMenu) {
                        menu.style.display = 'none';
                    }
                });
                
                // Toggle current menu
                actionMenu.style.display = actionMenu.style.display === 'block' ? 'none' : 'block';
            } else {
                // Close all menus when clicking elsewhere
                document.querySelectorAll('.action-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
            
            // Handle edit/delete buttons
            if (e.target.classList.contains('edit-btn')) {
                const evaluationElement = e.target.closest('.evaluation-result');
                currentEditId = evaluationElement.dataset.id;
                const evaluation = evaluations.find(e => e.id === currentEditId);
                
                if (evaluation) {
                    editCommentTextarea.value = evaluation.comments;
                    editModal.style.display = 'flex';
                }
            }
            
            if (e.target.classList.contains('delete-btn')) {
                const evaluationElement = e.target.closest('.evaluation-result');
                const evaluationId = evaluationElement.dataset.id;
                deleteEvaluation(evaluationId);
            }
        });
        
        // Edit modal buttons
        saveCommentBtn.addEventListener('click', saveEditedComment);
        cancelEditBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
            currentEditId = null;
        });
        
        deleteEvaluationBtn.addEventListener('click', () => {
            if (currentEditId) {
                deleteEvaluation(currentEditId);
                editModal.style.display = 'none';
                currentEditId = null;
            }
        });
    }

    // Export results to CSV
    function exportResultsToCSV() {
        // Get filtered evaluations
        let filteredEvaluations = evaluations.filter(evaluation => {
            // Date filter
            const evalDate = new Date(evaluation.date);
            const startDate = new Date(filterParams.startDate);
            const endDate = new Date(filterParams.endDate);
            
            if (evalDate < startDate || evalDate > endDate) {
                return false;
            }
            
            // Agent filter
            if (filterParams.agentIds && filterParams.agentIds.length > 0) {
                if (!filterParams.agentIds.includes(evaluation.agentId)) {
                    return false;
                }
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
        
        // Add agent names and designations to the data
        const exportData = filteredEvaluations.map(evaluation => {
            const agent = agents.find(a => a.id === evaluation.agentId) || { name: 'Unknown', designation: 'Unknown' };
            return {
                'Agent Name': agent.name,
                'Designation': agent.designation,
                'Date': formatDate(evaluation.date),
                ...evaluation.kpis,
                'Total Score': evaluation.totalScore,
                'Comments': evaluation.comments
            };
        });
        
        // Generate filename
        let filename = 'Quality_Evaluations_';
        if (filterParams.designation) {
            filename += filterParams.designation.replace(' ', '_') + '_';
        }
        filename += formatDate(filterParams.startDate) + '_to_' + formatDate(filterParams.endDate) + '.csv';
        
        // Export
        exportToCSV(exportData, filename);
    }

    // Save edited comment
    function saveEditedComment() {
        if (!currentEditId) return;
        
        const newComment = editCommentTextarea.value.trim();
        if (!newComment) {
            alert('Please enter a comment');
            return;
        }
        
        const evaluationIndex = evaluations.findIndex(e => e.id === currentEditId);
        if (evaluationIndex !== -1) {
            evaluations[evaluationIndex].comments = newComment;
            storage.saveEvaluations(evaluations);
            renderResults();
            editModal.style.display = 'none';
            currentEditId = null;
        }
    }

    // Delete evaluation
    function deleteEvaluation(evaluationId) {
        if (confirm('Are you sure you want to delete this evaluation? This cannot be undone.')) {
            evaluations = evaluations.filter(e => e.id !== evaluationId);
            storage.saveEvaluations(evaluations);
            renderResults();
        }
    }

    // Initialize the page
    init();
});