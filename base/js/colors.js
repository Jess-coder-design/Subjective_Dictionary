/**
 * Color Management - Color assignment based on date and other factors
 */

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [100, 100, 100];
}

function getColorByDate(entry) {
    const dateStr = entry.written_on || entry.date;
    
    if (!dateStr || dateStr === 'N/A') {
        return '#CCCCCC';
    }
    
    try {
        const entryDate = new Date(dateStr);
        const today = new Date();
        const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
        
        // Adjust thresholds to spread entries more evenly
        if (daysDiff >= 0 && daysDiff <= 1500) {
            return '#7683D9';
        }
        if (daysDiff >= 1501 && daysDiff <= 3000) {
            return '#FFD1FC';
        }
        if (daysDiff > 3000) {
            return '#9466A5';
        }
        return '#CCCCCC';
    } catch (error) {
        return '#CCCCCC';
    }
}

function getCircleClass(entryDate, refDate) {
    if (isSameDay(entryDate, refDate)) return 'same-day';
    if (isSameYear(entryDate, refDate)) return 'same-year';
    if (isWithinLastTenYears(entryDate, refDate)) return 'last-decade';
    return 'older';
}
