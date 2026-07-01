/**
 * Date Management - Handle date parsing, filtering, and display
 */

function formatDateDisplay(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateForComparison(date) {
    return formatDateDisplay(date);
}

function updateDateDisplay() {
    const dateDisplay = document.getElementById('currentDate');
    if (dateDisplay) {
        dateDisplay.textContent = formatDateDisplay(currentDate);
    }
    updateCircleLabels();
}

async function getDefinitionByWord(word) {
    const entry = allDefinitions.find(d => d.word.toLowerCase() === word.toLowerCase());
    return entry || null;
}

function parseDate(dateString) {
    return new Date(dateString);
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function isSameYear(targetDate, referenceDate) {
    return targetDate.getFullYear() === referenceDate.getFullYear();
}

function isWithinLastTenYears(targetDate, referenceDate) {
    const diffYears = referenceDate.getFullYear() - targetDate.getFullYear();
    return diffYears >= 0 && diffYears <= 10;
}

// Date navigation
function setupDateNavigation() {
    document.getElementById('datePrevBtn').addEventListener('click', async function() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
    });
    
    document.getElementById('dateNextBtn').addEventListener('click', async function() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
    });
}
