/**
 * Search Functionality - Handle word search and similarity-based positioning
 */

async function searchWord(searchTerm) {
    if (!searchTerm.trim()) {
        displayDefinitions = allDefinitions;
        renderCircles();
        return;
    }
    
    console.log(`🔍 Searching for: ${searchTerm}`);
    
    const searchLower = searchTerm.toLowerCase().trim();
    const matchedEntries = allDefinitions.filter(entry =>
        entry.word.toLowerCase() === searchLower
    );
    
    if (matchedEntries.length === 0) {
        console.log('No matches found');
        return;
    }
    
    console.log(`Found ${matchedEntries.length} matching entries`);
    
    displayDefinitions = matchedEntries;
    
    applyKeywordPositioning(matchedEntries);
    removeAllCircles();
    renderCircles();
}

function applyKeywordPositioning(entries) {
    const positions = getPositionsByKeywordSimilarity(entries);
    
    entries.forEach((entry, index) => {
        if (positions[index]) {
            entry.x = positions[index].x;
            entry.y = positions[index].y;
        }
    });
}

function calculatePositionsByKeywordSimilarity(entries) {
    const positions = [];
    
    entries.forEach((entry, i) => {
        const keywords = extractKeywords(entry.definition);
        
        let x = 0, y = 0;
        entries.forEach((other, j) => {
            if (i === j) return;
            
            const otherKeywords = extractKeywords(other.definition);
            const similarity = calculateSimilarity(keywords, otherKeywords);
            
            const angle = (j / entries.length) * Math.PI * 2;
            const distance = 5 * (1 - similarity);
            
            x += distance * Math.cos(angle);
            y += distance * Math.sin(angle);
        });
        
        positions[i] = { x: x / entries.length, y: y / entries.length };
    });
    
    return positions;
}

function getPositionsByKeywordSimilarity(definitions) {
    const positions = [];
    
    definitions.forEach((text, i) => {
        let x = 0, y = 0;
        definitions.forEach((other, j) => {
            if (i === j) return;
            const distance = 3 + Math.random() * 2;
            const angle = (j / definitions.length) * Math.PI * 2;
            x += distance * Math.cos(angle);
            y += distance * Math.sin(angle);
        });
        positions[i] = { x: x / definitions.length, y: y / definitions.length };
    });
    
    return positions;
}
