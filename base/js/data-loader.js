/**
 * Data Loader - Fetch and load data from JSON files
 */

async function loadAndRenderCircles(mode = 'mix') {
    try {
        const dataFile = modeFiles[mode] || modeFiles['mix'];
        console.log(`📂 Loading ${mode} mode from: ${dataFile}`);
        
        const response = await fetch(dataFile);
        if (!response.ok) {
            console.warn(`File not found: ${dataFile}, falling back to collected-data.json`);
            const fallbackResponse = await fetch('./data/collected-data.json');
            allDefinitions = await fallbackResponse.json();
        } else {
            allDefinitions = await response.json();
        }
        
        displayDefinitions = allDefinitions;
        console.log(`✅ Loaded ${allDefinitions.length} definitions in ${mode} mode`);
        console.log(`📍 Mode: ${mode.toUpperCase()}`);
        
        const xs = allDefinitions.map(d => d.x || 0);
        const ys = allDefinitions.map(d => d.y || 0);
        console.log({
            'X Range': `[${Math.min(...xs).toFixed(2)}, ${Math.max(...xs).toFixed(2)}]`,
            'Y Range': `[${Math.min(...ys).toFixed(2)}, ${Math.max(...ys).toFixed(2)}]`
        });
        
        document.getElementById('window-content').innerHTML = '';
        stickyCircleIndex = null;
        
        renderCircles();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}
