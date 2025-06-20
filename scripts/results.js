document.addEventListener('DOMContentLoaded', function() {
    const filterCriteria = JSON.parse(localStorage.getItem('filterCriteria'));
    const evaluations = JSON.parse(localStorage.getItem('evaluations')) || [];
    const agents = JSON.parse(localStorage.getItem('agents')) || [];
    const tableBody = document.querySelector('#resultsTable tbody');
    const filterDetails = document.getElementById('filterDetails');
    const exportBtn = document.getElementById('exportToSheet');
    const backBtn = document.getElementById('backToMain');
    
    if (!filterCriteria) {
        filterDetails.textContent = 'No filter criteria found. Please go back and apply a filter.';
        return;
    }
    
    // Display filter details
    filterDetails.textContent = `Showing results for ${filterCriteria.agents.join(', ')} from ${new Date(filterCriteria.startDate).toLocaleDateString()} to ${new Date(filterCriteria.endDate).toLocaleDateString()}`;
    
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
    
    // Populate table with filtered evaluations
    function populateTable() {
        tableBody.innerHTML = '';
        
        if (filteredEvaluations.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="10" style="text-align: center;">No evaluations found for the selected criteria</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        filteredEvaluations.forEach(eval => {
            const row = document.createElement('tr');
            const totalScore = calculateTotalScore(eval.scores);
            
            row.innerHTML = `
                <td>${eval.agent}</td>
                <td>${new Date(eval.date).toLocaleDateString()}</td>
                <td>${eval.scores.greetings}</td>
                <td>${eval.scores.empathy}</td>
                <td>${eval.scores.resolution}</td>
                <td>${eval.scores.knowledge}</td>
                <td>${eval.scores.closing}</td>
                <td>${eval.scores.compliance}</td>
                <td>${totalScore}</td>
                <td>${eval.comments}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
    
    // Calculate total weighted score
    function calculateTotalScore(scores) {
        return (
            (scores.greetings * 0.15) +
            (scores.empathy * 0.20) +
            (scores.resolution * 0.25) +
            (scores.knowledge * 0.20) +
            (scores.closing * 0.15) +
            (scores.compliance * 0.05)
        ).toFixed(1);
    }
    
    // Export to sheet
    exportBtn.addEventListener('click', function() {
        if (filteredEvaluations.length === 0) {
            alert('No data to export!');
            return;
        }
        
        // Create CSV content
        let csvContent = "Agent,Date,Greetings,Empathy,Resolution,Knowledge,Closing,Compliance,Total Score,Comments\n";
        
        filteredEvaluations.forEach(eval => {
            const totalScore = calculateTotalScore(eval.scores);
            csvContent += `"${eval.agent}","${new Date(eval.date).toLocaleDateString()}","${eval.scores.greetings}","${eval.scores.empathy}","${eval.scores.resolution}","${eval.scores.knowledge}","${eval.scores.closing}","${eval.scores.compliance}","${totalScore}","${eval.comments.replace(/"/g, '""')}"\n`;
        });
        
        // Create download link
        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `moove_ng_evaluations_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
    
    // Back to main button
    backBtn.addEventListener('click', function() {
        window.location.href = 'index.html';
    });
    
    // Initialize the page
    populateTable();
});