/**
 * Mode Management - Handle switching between MIX and ALPHABETICAL views
 * Uses globals declared in index.html: currentMode, modeFiles
 */

function setupModeButtons() {
    const numberBoxes = document.querySelectorAll('#header-numbers .number-box');
    const modeMap = {
        0: 'mix',
        1: 'alphabetical'
    };
    
    numberBoxes.forEach((box, index) => {
        if (modeMap[index]) {
            box.style.cursor = 'pointer';
            box.style.transition = 'all 0.3s ease';
            
            box.addEventListener('click', () => {
                const mode = modeMap[index];
                switchMode(mode);
            });
            
            // Hover effects
            box.addEventListener('mouseenter', () => {
                box.style.backgroundColor = '#e8e8e8'; // Darker grey on hover
            });
            
            box.addEventListener('mouseleave', () => {
                // Restore original color based on state
                if (currentMode === modeMap[index]) {
                    box.style.backgroundColor = '#D0D0D0'; // Active: random button style
                } else {
                    box.style.backgroundColor = '#F8F2F2'; // Inactive: footer style
                }
            });
            
            // Set initial state with colors
            box.style.color = 'black';
            if (currentMode === modeMap[index]) {
                box.style.backgroundColor = '#D0D0D0'; // Active: random button style
            } else {
                box.style.backgroundColor = '#F8F2F2'; // Inactive: footer style
            }
        }
    });
    
    // Hide date navigator if starting in alphabetical mode
    const dateNavigator = document.getElementById('dateNavigator');
    if (dateNavigator) {
        dateNavigator.style.display = (currentMode === 'alphabetical') ? 'none' : 'flex';
    }
    
    // Hide alphabetical arrows if not in alphabetical mode
    const leftArrow = document.getElementById('alphabeticalLeftArrow');
    const rightArrow = document.getElementById('alphabeticalRightArrow');
    if (leftArrow && rightArrow) {
        leftArrow.style.display = (currentMode === 'alphabetical') ? 'block' : 'none';
        rightArrow.style.display = (currentMode === 'alphabetical') ? 'block' : 'none';
    }
    
    // Hide zoom controls if not in mix mode
    const zoomControls = document.getElementById('zoomControls');
    if (zoomControls) {
        zoomControls.style.display = (currentMode === 'alphabetical') ? 'none' : 'flex';
    }
    
    // Set footer scroll button color
    const footerScrollBtn = document.getElementById('footerScrollBtn');
    if (footerScrollBtn) {
        footerScrollBtn.style.color = (currentMode === 'alphabetical') ? '#0066FF' : '#FF0000';
    }
}

async function switchMode(mode) {
    if (mode === currentMode) return;
    console.log(`🔄 Switching mode: ${currentMode} → ${mode}`);
    
    currentMode = mode;
    
    // Update button states
    const numberBoxes = document.querySelectorAll('#header-numbers .number-box');
    const modeMap = {
        0: 'mix',
        1: 'alphabetical'
    };
    
    numberBoxes.forEach((box, index) => {
        if (modeMap[index]) {
            box.style.color = 'black';
            if (currentMode === modeMap[index]) {
                box.style.backgroundColor = '#D0D0D0'; // Active: random button style
            } else {
                box.style.backgroundColor = '#F8F2F2'; // Inactive: footer style
            }
        }
    });
    
    // Show/hide date navigator based on mode
    const dateNavigator = document.getElementById('dateNavigator');
    if (dateNavigator) {
        dateNavigator.style.display = (mode === 'alphabetical') ? 'none' : 'flex';
    }
    
    // Show/hide alphabetical arrows based on mode
    const leftArrow = document.getElementById('alphabeticalLeftArrow');
    const rightArrow = document.getElementById('alphabeticalRightArrow');
    if (mode === 'alphabetical') {
        if (leftArrow) leftArrow.style.display = 'block';
        if (rightArrow) rightArrow.style.display = 'block';
    } else {
        if (leftArrow) leftArrow.style.display = 'none';
        if (rightArrow) rightArrow.style.display = 'none';
    }
    
    // Show/hide zoom controls based on mode
    const zoomControls = document.getElementById('zoomControls');
    if (zoomControls) {
        zoomControls.style.display = (mode === 'alphabetical') ? 'none' : 'flex';
    }
    
    // Update footer scroll button color
    const footerScrollBtn = document.getElementById('footerScrollBtn');
    if (footerScrollBtn) {
        footerScrollBtn.style.color = (mode === 'alphabetical') ? '#0066FF' : '#FF0000';
    }
    
    // Load and render with new mode
    await loadAndRenderCircles(mode);
    
    // Reset pan and zoom based on mode
    const windowContent = document.getElementById('window-content');
    if (mode === 'alphabetical') {
        offsetX = 0;
        offsetY = 0;
        zoomLevel = 1;
        windowContent.style.transform = 'translate(0px, 0px) scale(1)';
        windowContent.style.cursor = 'default';
    } else {
        // Reset for mix mode too
        offsetX = 0;
        offsetY = 0;
        zoomLevel = 1;
        windowContent.style.transform = 'translate(0px, 0px) scale(1)';
        windowContent.style.cursor = 'grab';
    }
}
