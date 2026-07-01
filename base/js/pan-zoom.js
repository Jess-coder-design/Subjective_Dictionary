/**
 * Pan & Zoom Controls - Handle panning and zooming interactions
 * Uses globals declared in index.html: isDragging, dragStartX, dragStartY, offsetX, offsetY, zoomLevel, minZoom, maxZoom, zoomStep, zoomInterval
 */

function setupPanHandlers() {
    const windowContent = document.getElementById('window-content');
    
    windowContent.addEventListener('mousedown', function(e) {
        // Clear sticky state when user starts interaction
        if (stickyCircleIndex !== null) {
            clearStickyCircle();
        }
        
        if (e.button !== 0) return;
        // Disable dragging in alphabetical mode
        if (currentMode === 'alphabetical') return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        windowContent.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;
        
        offsetX += deltaX;
        offsetY += deltaY;
        
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        
        updateTransform();
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            const windowContent = document.getElementById('window-content');
            windowContent.style.cursor = 'grab';
        }
    });
    
    // Set cursor based on mode
    windowContent.addEventListener('mouseenter', function() {
        if (currentMode === 'alphabetical') {
            windowContent.style.cursor = 'default';
        } else {
            windowContent.style.cursor = isDragging ? 'grabbing' : 'grab';
        }
    });
    
    windowContent.addEventListener('mouseleave', function() {
        if (!isDragging) {
            windowContent.style.cursor = 'default';
        }
    });
    
    windowContent.addEventListener('wheel', function(e) {
        if (!e.ctrlKey && !e.metaKey) return;
        
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        zoomLevel *= delta;
        zoomLevel = clamp(zoomLevel, 0.05, 20);
        
        updateTransform();
    });
}

function updateTransform() {
    const windowContent = document.getElementById('window-content');
    windowContent.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
}

function setupZoomHandlers() {
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    zoomInBtn.addEventListener('click', () => {
        zoomLevel *= 1.2;
        zoomLevel = clamp(zoomLevel, 0.05, 20);
        updateTransform();
    });
    
    zoomOutBtn.addEventListener('click', () => {
        zoomLevel *= 0.85;
        zoomLevel = clamp(zoomLevel, 0.05, 20);
        updateTransform();
    });
}
