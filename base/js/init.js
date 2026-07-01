/**
 * Initialization - Setup all event listeners and initialize the app
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Subjective Dictionary...');
    
    // Setup all systems
    setupModeButtons();
    setupPanHandlers();
    setupZoomHandlers();
    setupDateNavigation();
    setupFooterScrolling();
    
    // Setup search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length > 2) {
                searchWord(searchTerm);
            } else if (searchTerm.length === 0) {
                displayDefinitions = allDefinitions;
                removeAllCircles();
                renderCircles();
            }
        });
    }
    
    // Setup random button
    const randomBtn = document.getElementById('randomBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const randomEntry = allDefinitions[Math.floor(Math.random() * allDefinitions.length)];
            if (randomEntry) {
                displayDefinitions = [randomEntry];
                removeAllCircles();
                renderCircles();
            }
        });
    }
    
    // Initial load
    loadAndRenderCircles();
    
    console.log('✅ Initialization complete');
});
