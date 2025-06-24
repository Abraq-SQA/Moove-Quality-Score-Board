// Utility functions shared across pages

// LocalStorage management for evaluations and agents
const storage = {
    getAgents: () => {
        const agents = localStorage.getItem('qualityScoreBoardAgents');
        return agents ? JSON.parse(agents) : [];
    },
    
    saveAgents: (agents) => {
        localStorage.setItem('qualityScoreBoardAgents', JSON.stringify(agents));
    },
    
    getEvaluations: () => {
        const evaluations = localStorage.getItem('qualityScoreBoardEvaluations');
        return evaluations ? JSON.parse(evaluations) : [];
    },
    
    saveEvaluations: (evaluations) => {
        localStorage.setItem('qualityScoreBoardEvaluations', JSON.stringify(evaluations));
    },
    
    // For results page to get filter parameters
    getFilterParams: () => {
        return JSON.parse(sessionStorage.getItem('qualityScoreBoardFilterParams')) || {};
    },
    
    saveFilterParams: (params) => {
        sessionStorage.setItem('qualityScoreBoardFilterParams', JSON.stringify(params));
    }
};

// Calculate weighted score from KPI inputs
const calculateWeightedScore = (kpiInputs) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    kpiInputs.forEach(input => {
        const score = parseFloat(input.value) || 0;
        const weight = parseFloat(input.dataset.weight) || 0;
        totalScore += score * (weight / 100);
        totalWeight += weight;
    });
    
    // Ensure total weight is 100% to avoid incorrect calculations
    if (totalWeight !== 100) {
        console.warn('Total KPI weights do not sum to 100%');
    }
    
    return Math.round(totalScore);
};

// Format date for display
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Export data to CSV (for Excel/Sheets)
const exportToCSV = (data, filename) => {
    const csvContent = [];
    
    // Add headers
    const headers = Object.keys(data[0]);
    csvContent.push(headers.join(','));
    
    // Add data rows
    data.forEach(item => {
        const row = headers.map(header => {
            // Handle nested objects (like KPIs)
            if (typeof item[header] === 'object') {
                return JSON.stringify(item[header]);
            }
            return `"${item[header]}"`;
        });
        csvContent.push(row.join(','));
    });
    
    // Create download link
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Get KPI names and weights for consistent reference
const getKPIs = () => {
    return [
        { name: 'Proper Greetings', weight: 15 },
        { name: 'Empathy Shown', weight: 20 },
        { name: 'Issue Resolution', weight: 25 },
        { name: 'Product Knowledge', weight: 20 },
        { name: 'Proper Closing', weight: 15 },
        { name: 'Compliance', weight: 5 }
    ];
};

// Identify areas for improvement based on scores
const getImprovementAreas = (evaluations) => {
    if (!evaluations || evaluations.length === 0) return [];
    
    const kpis = getKPIs();
    const latestEvaluation = evaluations[evaluations.length - 1];
    const improvementAreas = [];
    
    kpis.forEach(kpi => {
        const score = latestEvaluation.kpis[kpi.name];
        if (score < 70) { // Threshold for improvement
            improvementAreas.push(`${kpi.name} (${score}%)`);
        }
    });
    
    return improvementAreas.length > 0 ? improvementAreas : ["No significant areas for improvement identified"];
};

export { storage, calculateWeightedScore, formatDate, exportToCSV, getKPIs, getImprovementAreas };