/**
 * Tooltip Management - Hover tooltips, pinning, and display
 */

function handleCircleHover(entryOrEntries, circleElement, index) {
    // Add hover class to remove blur
    circleElement.classList.add('circle-hover');
    
    const infoPanel = document.getElementById('circleInfo');
    const window_elem = document.getElementById('window');
    const svg = document.getElementById('circleLines');
    
    // Handle both single entry and array of entries
    const entries = Array.isArray(entryOrEntries) ? entryOrEntries : [entryOrEntries];
    
    // Initialize or get current entry index from a data attribute
    if (!window_elem.dataset[`tooltipIndex_${index}`]) {
        window_elem.dataset[`tooltipIndex_${index}`] = '0';
    }
    const currentIndex = parseInt(window_elem.dataset[`tooltipIndex_${index}`]);
    const entry = entries[currentIndex];
    
    // Get or create tooltip
    let tooltip = document.querySelector(`.circle-tooltip-${index}`);
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = `circle-tooltip circle-tooltip-${index}`;
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'white';
        tooltip.style.border = '2px solid rgba(255, 0, 0, 0.6)';
        tooltip.style.padding = '12px 15px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.zIndex = '1007';
        tooltip.style.maxWidth = '400px';
        tooltip.style.fontSize = '13px';
        tooltip.style.color = 'rgba(255, 0, 0, 0.6)';
        tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        tooltip.style.lineHeight = '1.5';
        tooltip.style.overflow = 'visible';
        tooltip.style.maxHeight = 'none';
        tooltip.style.transform = 'translate(-50%, -50%)';
        tooltip.dataset.expanded = 'false';
        window_elem.appendChild(tooltip);
    }
    
    // Enable pointer events when there are navigation buttons
    tooltip.style.pointerEvents = entries.length > 1 ? 'auto' : 'none';
    
    // Clear and recreate content structure
    while (tooltip.firstChild) {
        tooltip.removeChild(tooltip.firstChild);
    }
    
    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'tooltip-content-wrapper';
    contentWrapper.style.maxHeight = '150px';
    contentWrapper.style.overflow = 'hidden';
    contentWrapper.style.marginBottom = entries.length > 1 ? '8px' : '0px';
    contentWrapper.innerHTML = entry.definition || 'No definition';
    tooltip.appendChild(contentWrapper);
    
    // Add navigation buttons if multiple entries
    if (entries.length > 1) {
        const navButtons = document.createElement('div');
        navButtons.className = 'tooltip-nav-buttons';
        navButtons.style.display = 'flex';
        navButtons.style.justifyContent = 'center';
        navButtons.style.gap = '8px';
        navButtons.style.marginTop = '8px';
        navButtons.style.paddingTop = '8px';
        navButtons.style.borderTop = '1px solid #ccc';
        navButtons.style.lineHeight = '1';
        navButtons.style.pointerEvents = 'auto';
        
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Prev';
        prevBtn.style.padding = '4px 8px';
        prevBtn.style.cursor = 'pointer';
        prevBtn.style.border = '1px solid rgba(255, 0, 0, 0.6)';
        prevBtn.style.backgroundColor = 'white';
        prevBtn.style.color = 'rgba(255, 0, 0, 0.6)';
        prevBtn.style.borderRadius = '3px';
        prevBtn.style.fontSize = '12px';
        prevBtn.style.pointerEvents = 'auto';
        
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Next →';
        nextBtn.style.padding = '4px 8px';
        nextBtn.style.cursor = 'pointer';
        nextBtn.style.border = '1px solid rgba(255, 0, 0, 0.6)';
        nextBtn.style.backgroundColor = 'white';
        nextBtn.style.color = 'rgba(255, 0, 0, 0.6)';
        nextBtn.style.borderRadius = '3px';
        nextBtn.style.fontSize = '12px';
        nextBtn.style.pointerEvents = 'auto';
        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let idx = parseInt(window_elem.dataset[`tooltipIndex_${index}`]);
            idx = (idx - 1 + entries.length) % entries.length;
            window_elem.dataset[`tooltipIndex_${index}`] = idx.toString();
            handleCircleHover(entries, circleElement, index);
        });
        
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            let idx = parseInt(window_elem.dataset[`tooltipIndex_${index}`]);
            idx = (idx + 1) % entries.length;
            window_elem.dataset[`tooltipIndex_${index}`] = idx.toString();
            handleCircleHover(entries, circleElement, index);
        });
        
        navButtons.appendChild(prevBtn);
        navButtons.appendChild(nextBtn);
        tooltip.appendChild(navButtons);
    }
    
    // Build and display info panel in ABOUT section instead of bottom right
    // But only if there's no sticky circle, or if this IS the sticky circle
    const word = (entry.searchWord || entry.word || 'UNKNOWN').toUpperCase();
    const author = entry.author || 'Anonymous';
    const date = entry.written_on || entry.date || 'Unknown date';
    
    let infoPanelContent = `<strong style="word-break: break-word; display: block; margin-bottom: 4px;">${word}</strong>`;
    
    if (entries.length > 1) {
        infoPanelContent += ` <span style="color: #999; font-weight: normal;">(${currentIndex + 1}/${entries.length})</span>`;
    }
    
    infoPanelContent += `<strong style="display: block; margin-top: 2px; margin-bottom: 2px;">Example:</strong>
        ${entry.example || 'No example provided'}<br>
        <br>
        <strong>Author:</strong> ${author}<br>
        <strong>Date:</strong> ${date}<br>
        👍 ${entry.thumbs_up || 0}<br>
        👎 ${entry.thumbs_down || 0}
    `;
    
    const hoveredEntryInfo = document.getElementById('hoveredEntryInfo');
    const aboutText = document.getElementById('aboutText');
    
    // Only update about panel if no sticky circle, or if this is the sticky circle
    if (stickyCircleIndex === null || stickyCircleIndex === index) {
        hoveredEntryInfo.innerHTML = infoPanelContent;
        hoveredEntryInfo.style.display = 'block';
        aboutText.style.display = 'none';
    }
    
    tooltip.style.display = 'block';
    
    // Position off-screen temporarily to check if text overflows
    tooltip.style.left = '-9999px';
    tooltip.style.top = '-9999px';
    
    setTimeout(() => {
        // Check if content is overflowing
        const isOverflowing = contentWrapper.scrollHeight > contentWrapper.clientHeight;
        
        // Add (MORE) button if overflowing and not already expanded
        if (isOverflowing && tooltip.dataset.expanded === 'false') {
            const moreButton = document.createElement('div');
            moreButton.className = 'tooltip-more-btn';
            moreButton.textContent = '...(MORE)';
            moreButton.style.cursor = 'pointer';
            moreButton.style.color = 'rgba(255, 0, 0, 0.6)';
            moreButton.style.fontWeight = 'bold';
            moreButton.style.textAlign = 'center';
            moreButton.style.paddingTop = '8px';
            moreButton.style.borderTop = '1px solid #ccc';
            moreButton.style.userSelect = 'none';
            moreButton.style.pointerEvents = 'auto';
            
            tooltip.appendChild(moreButton);
            
            // Click handler to expand
            moreButton.addEventListener('click', (e) => {
                e.stopPropagation();
                contentWrapper.style.maxHeight = 'none';
                contentWrapper.style.overflow = 'visible';
                moreButton.remove();
                tooltip.dataset.expanded = 'true';
            });
        }
        
        // Get panel and circle bounds
        const panelBounds = window_elem.getBoundingClientRect();
        const circleBounds = circleElement.getBoundingClientRect();
        
        // Get circle position in viewport
        const circleScreenX = circleBounds.left + circleBounds.width / 2;
        const circleScreenY = circleBounds.top + circleBounds.height / 2;
        
        // Convert to panel-local coordinates
        const localX = circleScreenX - panelBounds.left;
        const localY = circleScreenY - panelBounds.top;
        
        // SHAPE TOOLTIP TO SQUARE (clamped to panel bounds)
        const BASE_SIZE = 260;
        const padding = 20;
        
        // Calculate max width based on available space relative to panel
        const spaceLeft = localX;
        const spaceRight = panelBounds.width - localX;
        const maxWidth = Math.min(spaceLeft, spaceRight) * 2 - padding;
        
        let width = Math.min(BASE_SIZE, maxWidth);
        
        // Apply width to measure height
        tooltip.style.width = width + 'px';
        tooltip.style.maxWidth = width + 'px';
        tooltip.style.height = 'auto';
        tooltip.style.display = 'flex';
        tooltip.style.flexDirection = 'column';
        tooltip.style.justifyContent = 'center';
        
        // Measure resulting height
        let rect = tooltip.getBoundingClientRect();
        let height = rect.height;
        
        // Adjust width toward square (20% tolerance)
        const SQUARE_TOLERANCE = 0.2;
        
        if (height > width * (1 + SQUARE_TOLERANCE)) {
            // Too tall → increase width (if possible)
            width = Math.min(maxWidth, width * 1.3);
        } else if (height < width * (1 - SQUARE_TOLERANCE)) {
            // Too wide → decrease width
            width = width * 0.8;
        }
        
        // Apply final width
        tooltip.style.width = width + 'px';
        tooltip.style.maxWidth = width + 'px';
        
        // Position using panel-local coordinates
        tooltip.style.left = localX + 'px';
        tooltip.style.top = localY + 'px';
        tooltip.style.transform = 'translate(-50%, -50%)';
        
        // Get final dimensions for line drawing
        const finalRect = tooltip.getBoundingClientRect();
        const tooltipWidth = finalRect.width;
        const tooltipHeight = finalRect.height;
        
        // Draw all four lines
        svg.innerHTML = '';
        const lineColor = 'rgba(255, 0, 0, 0.6)';
        const lineWidth = 1;
        
        const lines = [
            { x1: localX, y1: 0, x2: localX, y2: localY - tooltipHeight / 2 },
            { x1: localX, y1: localY + tooltipHeight / 2, x2: localX, y2: panelBounds.height },
            { x1: 0, y1: localY, x2: localX - tooltipWidth / 2, y2: localY },
            { x1: localX + tooltipWidth / 2, y1: localY, x2: panelBounds.width, y2: localY }
        ];
        
        lines.forEach(lineData => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', lineData.x1);
            line.setAttribute('y1', lineData.y1);
            line.setAttribute('x2', lineData.x2);
            line.setAttribute('y2', lineData.y2);
            line.setAttribute('stroke', lineColor);
            line.setAttribute('stroke-width', lineWidth);
            svg.appendChild(line);
        });
    }, 0);
}

// Hide all hover effects
function hideCircleHover(index) {
    const tooltip = document.querySelector(`.circle-tooltip-${index}`);
    if (tooltip) {
        tooltip.style.display = 'none';
        // Reset expansion state so it shows truncated again on next hover
        tooltip.dataset.expanded = 'false';
        const contentWrapper = tooltip.querySelector('.tooltip-content-wrapper');
        if (contentWrapper) {
            contentWrapper.style.maxHeight = '150px';
            contentWrapper.style.overflow = 'hidden';
        }
    }
    
    // Remove hover class from circle element
    const circleElement = document.querySelector(`.circle[data-index="${index}"]`);
    if (circleElement) {
        circleElement.classList.remove('circle-hover');
    }
    
    // Only clear about panel if there's no sticky circle
    if (stickyCircleIndex === null) {
        const hoveredEntryInfo = document.getElementById('hoveredEntryInfo');
        const aboutText = document.getElementById('aboutText');
        hoveredEntryInfo.style.display = 'none';
        aboutText.style.display = 'block';
    }
    
    document.getElementById('circleLines').innerHTML = '';
}

// Clear the sticky circle state and restore about panel
function clearStickyCircle() {
    if (stickyCircleIndex === null) return;
    
    const tooltip = document.querySelector(`.circle-tooltip-${stickyCircleIndex}`);
    if (tooltip) {
        tooltip.style.display = 'none';
        tooltip.dataset.expanded = 'false';
        const contentWrapper = tooltip.querySelector('.tooltip-content-wrapper');
        if (contentWrapper) {
            contentWrapper.style.maxHeight = '150px';
            contentWrapper.style.overflow = 'hidden';
        }
    }
    
    const hoveredEntryInfo = document.getElementById('hoveredEntryInfo');
    const aboutText = document.getElementById('aboutText');
    hoveredEntryInfo.style.display = 'none';
    aboutText.style.display = 'block';
    document.getElementById('circleLines').innerHTML = '';
    
    stickyCircleIndex = null;
}

// Draw lines from tooltip to edges of canvas
function drawTooltipLines(screenCenterX, screenCenterY) {
    const svg = document.getElementById('circleLines');
    if (!svg) return;
    
    svg.innerHTML = '';
    
    const window_elem = document.getElementById('window');
    const windowWidth = window_elem.offsetWidth;
    const windowHeight = window_elem.offsetHeight;
    
    // Lines are drawn in window space (screenCenterX, screenCenterY are already in window coordinates)
    const lines = [
        { x1: screenCenterX, y1: screenCenterY, x2: 0, y2: screenCenterY },              // Left
        { x1: screenCenterX, y1: screenCenterY, x2: windowWidth, y2: screenCenterY },    // Right
        { x1: screenCenterX, y1: screenCenterY, x2: screenCenterX, y2: 0 },              // Top
        { x1: screenCenterX, y1: screenCenterY, x2: screenCenterX, y2: windowHeight }    // Bottom
    ];
    
    lines.forEach(line => {
        const lineElem = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        lineElem.setAttribute('x1', line.x1);
        lineElem.setAttribute('y1', line.y1);
        lineElem.setAttribute('x2', line.x2);
        lineElem.setAttribute('y2', line.y2);
        lineElem.setAttribute('stroke', '#0033FF');
        lineElem.setAttribute('stroke-width', '2.5');
        lineElem.setAttribute('opacity', '0.5');
        lineElem.setAttribute('pointer-events', 'none');
        svg.appendChild(lineElem);
    });
}
