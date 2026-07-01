/**
 * Circle Renderer - Rendering and positioning circles on canvas
 */

function generateColorPositionBackground() {
    const windowContent = document.getElementById('window-content');
    
    // Remove existing background canvas
    const existingCanvas = windowContent.querySelector('#backgroundCanvas');
    if (existingCanvas) {
        existingCanvas.remove();
    }
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.id = 'backgroundCanvas';
    canvas.width = windowContent.clientWidth;
    canvas.height = windowContent.clientHeight;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    canvas.style.pointerEvents = 'none';
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    
    // Fill background with solid white (no blending mode)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    console.log('🎨 Generating background with', displayDefinitions.length, 'entries');
    
    // Extract all X and Y values and find bounds
    const xs = displayDefinitions.map(d => parseFloat(d.x) || 0);
    const ys = displayDefinitions.map(d => parseFloat(d.y) || 0);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    let rangeX = (maxX - minX) || 1;
    let rangeY = (maxY - minY) || 1;
    
    const isSingleOrClustered = rangeX === 1 && rangeY === 1;
    
    function scaleX(x) {
        if (isSingleOrClustered) {
            return width / 2;
        }
        const normalized = (x - minX) / rangeX;
        return normalized * (width - padding * 2) + padding;
    }
    
    function scaleY(y) {
        if (isSingleOrClustered) {
            return height / 2;
        }
        const normalized = (y - minY) / rangeY;
        return height - (normalized * (height - padding * 2) + padding);
    }
    
    // Find min and max popularity scores for sizing
    const scores = displayDefinitions.map(d => (d.thumbs_up || 0) - (d.thumbs_down || 0));
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1;
    
    let colorCounts = { new: 0, middle: 0, old: 0 };
    
    // Draw radial gradient circles at word positions
    displayDefinitions.forEach((entry, idx) => {
        let x = scaleX(parseFloat(entry.x) || 0);
        let y = scaleY(parseFloat(entry.y) || 0);
        
        // Calculate popularity score
        const popularity = (entry.thumbs_up || 0) - (entry.thumbs_down || 0);
        
        // Normalize score to size (10px to 150px)
        const normalizedScore = (popularity - minScore) / scoreRange;
        const size = 10 + (normalizedScore * 140);
        
        // Determine center color based on date
        const dateStr = entry.written_on || entry.date;
        let centerColor = '#CCCCCC'; // Default gray
        
        if (dateStr && dateStr !== 'N/A') {
            try {
                const entryDate = new Date(dateStr);
                const today = new Date();
                const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
                
                // Adjust thresholds to spread entries more evenly
                if (daysDiff >= 0 && daysDiff <= 1500) {
                    centerColor = '#7683D9'; // New/recent
                } else if (daysDiff >= 1501 && daysDiff <= 3000) {
                    centerColor = '#FFD1FC'; // Middle-old
                } else if (daysDiff > 3000) {
                    centerColor = '#9466A5'; // Very old
                }
            } catch (error) {
                // Use default
                console.error('Date parse error:', error);
            }
        }
        
        // Create radial gradient matching the gradient.svg pattern
        // Smooth transition from center color to edge color
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.2);
        
        // Convert center color from hex to RGB for blending
        const centerRGB = hexToRgb(centerColor);
        
        // Determine edge color based on center color category
        let edgeRGB;
        if (centerColor === '#7683D9') {
            edgeRGB = hexToRgb('#7683D9'); // Same as center for new
        } else if (centerColor === '#FFD1FC') {
            edgeRGB = hexToRgb('#FFA896'); // Gradient to orange-pink for middle
        } else if (centerColor === '#9466A5') {
            edgeRGB = hexToRgb('#EAFF00'); // Gradient to lime for old
        } else {
            edgeRGB = [0, 174, 239]; // Default fallback
        }
        
        // Generate smooth gradient stops by interpolating between center and edge colors
        const stops = [0, 0.37, 0.53, 0.65, 0.75, 0.84, 0.91, 0.98, 1];
        
        stops.forEach((stop, idx) => {
            // Linear interpolation between center color and edge color
            const t = stop; // Use stop value directly for smooth fade
            const r = Math.round(centerRGB[0] + (edgeRGB[0] - centerRGB[0]) * t);
            const g = Math.round(centerRGB[1] + (edgeRGB[1] - centerRGB[1]) * t);
            const b = Math.round(centerRGB[2] + (edgeRGB[2] - centerRGB[2]) * t);
            
            const color = `rgb(${r},${g},${b})`;
            gradient.addColorStop(stop, color);
        });
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 0.95; // Almost solid opacity
        ctx.globalCompositeOperation = 'source-over'; // Default blend mode
        ctx.beginPath();
        ctx.arc(x, y, size * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // Reset opacity
        ctx.globalCompositeOperation = 'source-over'; // Reset to default
    });
    
    // Prepend canvas so it's behind circles
    windowContent.insertBefore(canvas, windowContent.firstChild);
}

function renderCircles() {
    // Route to different renderers based on mode
    console.log('🎯 renderCircles called, currentMode:', currentMode);
    if (currentMode === 'alphabetical') {
        console.log('📋 Routing to renderCirclesAlphabetical');
        renderCirclesAlphabetical();
    } else {
        console.log('📊 Routing to renderCirclesScatter');
        renderCirclesScatter();
    }
}

function renderCirclesScatter() {
    const windowContent = document.getElementById('window-content');
    windowContent.innerHTML = ''; // Clear existing circles
    
    const width = windowContent.clientWidth;
    const height = windowContent.clientHeight;
    const padding = 50;
    
    // Generate color position background
    generateColorPositionBackground();

    
    // Extract all X and Y values and find bounds
    const xs = displayDefinitions.map(d => parseFloat(d.x) || 0);
    const ys = displayDefinitions.map(d => parseFloat(d.y) || 0);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    let rangeX = (maxX - minX) || 1;
    let rangeY = (maxY - minY) || 1;
    
    const isSingleOrClustered = rangeX === 1 && rangeY === 1;
    
    function scaleX(x) {
        if (isSingleOrClustered) {
            return width / 2;
        }
        const normalized = (x - minX) / rangeX;
        return normalized * (width - padding * 2) + padding;
    }
    
    function scaleY(y) {
        if (isSingleOrClustered) {
            return height / 2;
        }
        const normalized = (y - minY) / rangeY;
        return height - (normalized * (height - padding * 2) + padding);
    }
    
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }
    
    // Find min and max popularity scores for sizing
    const scores = displayDefinitions.map(d => (d.thumbs_up || 0) - (d.thumbs_down || 0));
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1;
    
    // Create circles for each entry
    displayDefinitions.forEach((entry, index) => {
        let x = scaleX(parseFloat(entry.x) || 0);
        let y = scaleY(parseFloat(entry.y) || 0);
        
        // Apply jitter to overlapping points
        x += jitter();
        y += jitter();
        
        // Clamp to screen bounds
        x = clamp(x, padding, width - padding);
        y = clamp(y, padding, height - padding);
        
        // Calculate popularity score
        const popularity = (entry.thumbs_up || 0) - (entry.thumbs_down || 0);
        
        // Normalize score to size (10px to 150px)
        const normalizedScore = (popularity - minScore) / scoreRange;
        const size = 10 + (normalizedScore * 140);
        
        // Get color based on date
        const color = getColorByDate(entry);
        const [r, g, b] = hexToRgb(color);
        
        // Create circle element
        const circle = document.createElement('div');
        circle.className = 'circle';
        
        // Position with proper CSS
        circle.style.position = 'absolute';
        circle.style.left = x + 'px';
        circle.style.top = y + 'px';
        circle.style.transform = 'translate(-50%, -50%)';
        circle.style.width = size + 'px';
        circle.style.height = size + 'px';
        circle.style.zIndex = '100';
        circle.style.willChange = 'transform, filter';
        circle.style.borderRadius = '50%';
        
        // Semantic field + identity: light blur (not heavy) with edge preservation
        // This maintains recognizable objects while allowing semantic merging
        // const blurAmount = Math.min(6, size * 0.03); // Moderate blur, capped at 6px
        // circle.style.filter = `blur(${blurAmount}px)`;
        circle.style.opacity = '1'; // Higher opacity to maintain object visibility
        
        // Don't render solid circles - let canvas gradient show through
        circle.style.background = `transparent`;
        // circle.style.background = `radial-gradient(circle, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},0.8) 30%, rgba(${r},${g},${b},0.5) 60%, rgba(${r},${g},${b},0.2) 100%)`;
        
        // Subtle edge definition: inset shadow creates boundary perception
        circle.style.boxShadow = `none`;
        
        // Enable additive blending for semantic field merging
        // circle.style.mixBlendMode = 'screen';
        circle.style.mixBlendMode = 'normal';
        
        // Store RGB values and size for hover effect
        circle.dataset.r = r;
        circle.dataset.g = g;
        circle.dataset.b = b;
        circle.dataset.size = size;
        circle.dataset.glowSize = size * 0.2;
        circle.dataset.index = index;
        
        // Add hover event for tooltip with connecting lines and metadata
        circle.addEventListener('mouseenter', () => {
            if (stickyCircleIndex !== null && stickyCircleIndex !== index) return;
            
            const r = circle.dataset.r;
            const g = circle.dataset.g;
            const b = circle.dataset.b;
            const size = parseFloat(circle.style.width);
            const blurAmount = Math.min(8, size * 0.06); // Slightly more blur on hover
            // circle.style.filter = `blur(${blurAmount}px)`;
            circle.style.background = `rgba(${r},${g},${b},1)`;
            // circle.style.background = `radial-gradient(circle, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},0.9) 30%, rgba(${r},${g},${b},0.6) 60%, rgba(${r},${g},${b},0.3) 100%)`;
            circle.style.opacity = '1';
            circle.style.boxShadow = `none`;
            circle.style.transform = 'translate(-50%, -50%) scale(1.2)';
            circle.style.zIndex = '1000';
            console.log('🎯 Hover START - zIndex set to:', circle.style.zIndex, 'Computed:', getComputedStyle(circle).zIndex);
            handleCircleHover(entry, circle, index);
        });
        
        circle.addEventListener('mouseleave', () => {
            if (stickyCircleIndex === index) return;
            
            const r = circle.dataset.r;
            const g = circle.dataset.g;
            const b = circle.dataset.b;
            const size = parseFloat(circle.style.width);
            const blurAmount = Math.min(6, size * 0.03);
            // circle.style.filter = `blur(${blurAmount}px)`;
            circle.style.background = `rgba(${r},${g},${b},1)`;
            // circle.style.background = `radial-gradient(circle, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},0.8) 30%, rgba(${r},${g},${b},0.5) 60%, rgba(${r},${g},${b},0.2) 100%)`;
            circle.style.opacity = '1';
            circle.style.boxShadow = `none`;
            circle.style.transform = 'translate(-50%, -50%)';
            circle.style.zIndex = '100';
            console.log('🔙 Hover END - zIndex set to:', circle.style.zIndex, 'Computed:', getComputedStyle(circle).zIndex);
            hideCircleHover(index);
        });
        
        // Click to make tooltip sticky
        circle.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (stickyCircleIndex === index) {
                // Click again to unstick
                stickyCircleIndex = null;
                hideCircleHover(index);
                const r = circle.dataset.r;
                const g = circle.dataset.g;
                const b = circle.dataset.b;
                const size = parseFloat(circle.style.width);
                const blurAmount = size * 0.15;
                circle.style.filter = `blur(${blurAmount}px)`;
                circle.style.background = `radial-gradient(circle, rgba(${r},${g},${b},0.9) 0%, rgba(${r},${g},${b},0.6) 40%, rgba(${r},${g},${b},0.3) 70%, rgba(${r},${g},${b},0.1) 100%)`;
                circle.style.opacity = '0.85';
                circle.style.transform = 'translate(-50%, -50%)';;
                circle.style.zIndex = '';
            } else {
                // New circle clicked - make it sticky
                if (stickyCircleIndex !== null) {
                    const oldCircle = document.querySelector(`[data-index="${stickyCircleIndex}"]`);
                    if (oldCircle) {
                        hideCircleHover(stickyCircleIndex);
                        const oldR = oldCircle.dataset.r;
                        const oldG = oldCircle.dataset.g;
                        const oldB = oldCircle.dataset.b;
                        oldCircle.style.background = `radial-gradient(circle, rgba(${oldR},${oldG},${oldB},0.6) 0%, rgba(${oldR},${oldG},${oldB},0.4) 40%, rgba(${oldR},${oldG},${oldB},0.2) 70%, transparent 100%)`;
                        oldCircle.style.opacity = '1';
                        oldCircle.style.transform = 'translate(-50%, -50%)';
                        oldCircle.style.zIndex = '';
                    }
                }
                
                stickyCircleIndex = index;
                const r = circle.dataset.r;
                const g = circle.dataset.g;
                const b = circle.dataset.b;
                circle.style.background = `radial-gradient(circle, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},0.8) 40%, rgba(${r},${g},${b},0.5) 70%, transparent 100%)`;
                circle.style.opacity = '1';
                circle.style.transform = 'translate(-50%, -50%) scale(1.2)';
                circle.style.zIndex = '1000';
                handleCircleHover(entry, circle, index);
            }
        });
        
        // Add debug data attributes
        circle.setAttribute('data-index', index);
        circle.setAttribute('data-word', entry.word);
        
        windowContent.appendChild(circle);
    });
    
    // Apply current transform to ensure circles are visible
    updateTransform();
    
    console.log(`✅ Rendered ${displayDefinitions.length} circles in scatter mode`);
}

function renderCirclesAlphabetical() {
    const windowContent = document.getElementById('window-content');
    windowContent.innerHTML = ''; // Clear existing circles
    
    console.log('🔤 renderCirclesAlphabetical started');
    
    // Group words by first letter
    const letterGroups = {};
    displayDefinitions.forEach(entry => {
        const firstLetter = (entry.word.charAt(0) || 'Z').toUpperCase();
        if (!letterGroups[firstLetter]) {
            letterGroups[firstLetter] = [];
        }
        letterGroups[firstLetter].push(entry);
    });
    
    // Get all letters in order
    const letters = Object.keys(letterGroups).sort();
    
    // Create main container
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = 'column';
    mainContainer.style.width = '100%';
    mainContainer.style.height = 'auto';
    mainContainer.style.position = 'relative';
    mainContainer.style.maxHeight = windowContent.clientHeight + 'px';
    
    console.log('🔤 window-content height:', windowContent.clientHeight);
    console.log('🔤 mainContainer maxHeight set to:', windowContent.clientHeight);
    
    // Create letters header container
    const lettersHeader = document.createElement('div');
    lettersHeader.id = 'lettersHeader';
    lettersHeader.style.display = 'flex';
    lettersHeader.style.gap = '20px';
    lettersHeader.style.paddingLeft = '20px';
    lettersHeader.style.overflowX = 'auto';
    lettersHeader.style.height = '40px';
    lettersHeader.style.alignItems = 'center';
    lettersHeader.style.background = 'rgba(255, 255, 255, 0.6)';
    lettersHeader.style.backdropFilter = 'blur(3px)';
    lettersHeader.style.borderBottom = 'none';
    lettersHeader.style.flex = '0 0 40px';
    lettersHeader.style.position = 'sticky';
    lettersHeader.style.top = '0';
    lettersHeader.style.zIndex = '10';
    
    letters.forEach(letter => {
        const letterLabel = document.createElement('div');
        letterLabel.textContent = letter;
        letterLabel.style.fontSize = '16px';
        letterLabel.style.fontWeight = 'bold';
        letterLabel.style.color = '#0033FF';
        letterLabel.style.whiteSpace = 'nowrap';
        letterLabel.style.minWidth = '220px';
        letterLabel.style.textAlign = 'center';
        lettersHeader.appendChild(letterLabel);
    });
    
    mainContainer.appendChild(lettersHeader);
    
    
    // Create columns container
    const columnsContainer = document.createElement('div');
    columnsContainer.id = 'columnsContainer';
    columnsContainer.style.display = 'flex';
    columnsContainer.style.gap = '20px';
    columnsContainer.style.padding = '20px';
    columnsContainer.style.overflowX = 'auto';
    columnsContainer.style.overflowY = 'auto';
    columnsContainer.style.flex = '1';
    columnsContainer.style.position = 'relative';
    columnsContainer.style.minHeight = '0'; // Important for flex children to scroll
    
    // Create a column for each letter
    let globalIndex = 0;
    letters.forEach(letter => {
        const column = document.createElement('div');
        column.style.display = 'flex';
        column.style.flexDirection = 'column';
        column.style.gap = '15px';
        column.style.minWidth = '200px';
        column.style.padding = '10px';
        
        const items = letterGroups[letter];
        
        // Create circles for this letter's words
        items.forEach((entry, idx) => {
            const itemContainer = document.createElement('div');
            itemContainer.style.display = 'flex';
            itemContainer.style.alignItems = 'center';
            itemContainer.style.gap = '10px';
            
            const circle = document.createElement('div');
            circle.style.width = '60px';
            circle.style.height = '60px';
            circle.style.borderRadius = '50%';
            circle.style.flexShrink = '0';
            
            // Get color based on date (same as scatter mode)
            const color = getColorByDate(entry);
            const [r, g, b] = hexToRgb(color);
            
            // Determine edge color based on center color category
            const dateStr = entry.written_on || entry.date;
            let centerColor = color;
            let edgeColor = '#0AEAEF';
            
            if (dateStr && dateStr !== 'N/A') {
                try {
                    const entryDate = new Date(dateStr);
                    const today = new Date();
                    const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));
                    
                    if (daysDiff >= 0 && daysDiff <= 1500) {
                        edgeColor = '#7683D9'; // Same as center for new
                    } else if (daysDiff >= 1501 && daysDiff <= 3000) {
                        edgeColor = '#FFA896'; // Gradient to orange-pink for middle
                    } else if (daysDiff > 3000) {
                        edgeColor = '#EAFF00'; // Gradient to lime for old
                    }
                } catch (error) {
                    // Use default
                }
            }
            
            const [er, eg, eb] = hexToRgb(edgeColor);
            
            // Create gradient matching scatter mode
            const stops = [0, 0.37, 0.53, 0.65, 0.75, 0.84, 0.91, 0.98, 1];
            let gradientStops = '';
            stops.forEach((stop, idx) => {
                const t = stop;
                const ir = Math.round(r + (er - r) * t);
                const ig = Math.round(g + (eg - g) * t);
                const ib = Math.round(b + (eb - b) * t);
                const pct = stop * 100;
                // Use fixed opacity values like hover state for more vibrant appearance
                let opacity = 1;
                if (stop > 0.3) opacity = 0.9;
                if (stop > 0.6) opacity = 0.7;
                if (stop > 0.85) opacity = 0.4;
                if (idx > 0) gradientStops += ', ';
                gradientStops += `rgba(${ir},${ig},${ib},${opacity}) ${pct}%`;
            });
            
            circle.style.background = `radial-gradient(circle, ${gradientStops})`;
            circle.style.border = 'none';
            circle.style.cursor = 'pointer';
            circle.dataset.word = entry.word;
            circle.dataset.index = globalIndex;
            circle.dataset.r = r;
            circle.dataset.g = g;
            circle.dataset.b = b;
            
            // Create word label
            const label = document.createElement('div');
            label.textContent = entry.definition || entry.word;
            label.style.color = '#0066FF';
            label.style.fontSize = '12px';
            label.style.fontWeight = '400';
            label.style.whiteSpace = 'normal';
            label.style.wordWrap = 'break-word';
            label.style.maxWidth = '200px';
            label.style.lineHeight = '1.4';
            
            itemContainer.appendChild(circle);
            itemContainer.appendChild(label);
            
            itemContainer.appendChild(circle);
            itemContainer.appendChild(label);
            
            circle.addEventListener('mouseenter', () => {
                handleCircleHover(entry, circle, globalIndex);
            });
            
            circle.addEventListener('mouseleave', () => {
                hideCircleHover(globalIndex);
            });
            
            circle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (stickyCircleIndex === globalIndex) {
                    stickyCircleIndex = null;
                    hideCircleHover(globalIndex);
                } else {
                    if (stickyCircleIndex !== null) {
                        hideCircleHover(stickyCircleIndex);
                    }
                    stickyCircleIndex = globalIndex;
                    handleCircleHover(entry, circle, globalIndex);
                }
            });
            
            column.appendChild(itemContainer);
            globalIndex++;
        });
        
        columnsContainer.appendChild(column);
    });
    
    mainContainer.appendChild(columnsContainer);
    
    // Sync scroll between header and columns - one-way: columns drives header
    columnsContainer.addEventListener('scroll', () => {
        lettersHeader.scrollLeft = columnsContainer.scrollLeft;
    });
    
    windowContent.appendChild(mainContainer);
    
    const footer = document.getElementById('footer');
    console.log('🔤 footer element:', footer);
    console.log('🔤 footer height:', footer ? footer.clientHeight : 'no footer');
    console.log('🔤 window-content position:', windowContent.style.position);
    console.log('🔤 window-content height:', windowContent.clientHeight);
    console.log('🔤 body overflow:', getComputedStyle(document.body).overflow);
    console.log('🔤 window overflow:', getComputedStyle(document.getElementById('window')).overflow);
    
    // Add scroll arrows for alphabetical mode
    const leftArrow = document.createElement('div');
    leftArrow.id = 'alphabeticalLeftArrow';
    leftArrow.style.position = 'absolute';
    leftArrow.style.left = '20px';
    leftArrow.style.bottom = '15px';
    leftArrow.style.cursor = 'pointer';
    leftArrow.style.userSelect = 'none';
    leftArrow.style.color = '#0033FF';
    leftArrow.style.fontSize = '20px';
    leftArrow.style.fontWeight = 'bold';
    leftArrow.style.zIndex = '1006';
    leftArrow.style.display = 'block';
    leftArrow.style.width = '20px';
    leftArrow.style.height = '20px';
    leftArrow.style.display = 'flex';
    leftArrow.style.alignItems = 'center';
    leftArrow.style.justifyContent = 'center';
    leftArrow.textContent = '◀';
    windowContent.appendChild(leftArrow);
    
    const rightArrow = document.createElement('div');
    rightArrow.id = 'alphabeticalRightArrow';
    rightArrow.style.position = 'absolute';
    rightArrow.style.right = '20px';
    rightArrow.style.bottom = '15px';
    rightArrow.style.cursor = 'pointer';
    rightArrow.style.userSelect = 'none';
    rightArrow.style.color = '#0033FF';
    rightArrow.style.fontSize = '20px';
    rightArrow.style.fontWeight = 'bold';
    rightArrow.style.zIndex = '1006';
    rightArrow.style.display = 'flex';
    rightArrow.style.alignItems = 'center';
    rightArrow.style.justifyContent = 'center';
    rightArrow.style.width = '20px';
    rightArrow.style.height = '20px';
    rightArrow.textContent = '▶';
    windowContent.appendChild(rightArrow);
    
    const upArrow = document.createElement('div');
    upArrow.id = 'alphabeticalUpArrow';
    upArrow.style.position = 'absolute';
    upArrow.style.right = '20px';
    upArrow.style.top = '75px';
    upArrow.style.cursor = 'pointer';
    upArrow.style.userSelect = 'none';
    upArrow.style.color = '#0033FF';
    upArrow.style.fontSize = '20px';
    upArrow.style.fontWeight = 'bold';
    upArrow.style.zIndex = '1006';
    upArrow.style.display = 'none';
    upArrow.style.width = '20px';
    upArrow.style.height = '20px';
    upArrow.style.display = 'flex';
    upArrow.style.alignItems = 'center';
    upArrow.style.justifyContent = 'center';
    upArrow.textContent = '▲';
    windowContent.appendChild(upArrow);
    
    const downArrow = document.createElement('div');
    downArrow.id = 'alphabeticalDownArrow';
    downArrow.style.position = 'absolute';
    downArrow.style.right = '20px';
    downArrow.style.bottom = '45px';
    downArrow.style.cursor = 'pointer';
    downArrow.style.userSelect = 'none';
    downArrow.style.color = '#0033FF';
    downArrow.style.fontSize = '20px';
    downArrow.style.fontWeight = 'bold';
    downArrow.style.zIndex = '1006';
    downArrow.style.display = 'block';
    downArrow.style.width = '20px';
    downArrow.style.height = '20px';
    downArrow.style.display = 'flex';
    downArrow.style.alignItems = 'center';
    downArrow.style.justifyContent = 'center';
    downArrow.textContent = '▼';
    windowContent.appendChild(downArrow);
    
    windowContent.appendChild(mainContainer);
    
    // Setup arrow click handlers
    setupAlphabeticalArrows();
    
    console.log(`✅ Rendered ${displayDefinitions.length} circles in alphabetical mode`);
}

function removeAllCircles() {
    const circles = document.querySelectorAll('.circle');
    circles.forEach(circle => circle.remove());
}

function updateCircleLabels() {
    displayDefinitions.forEach((entry, index) => {
        const circle = document.querySelector(`[data-index="${index}"]`);
        if (!circle) return;
        
        const color = getColorByDate(entry);
        const [r, g, b] = hexToRgb(color);
        
        circle.style.background = `radial-gradient(circle, rgba(${r},${g},${b},0.6) 0%, rgba(${r},${g},${b},0.4) 40%, rgba(${r},${g},${b},0.2) 70%, transparent 100%)`;
        circle.dataset.r = r;
        circle.dataset.g = g;
        circle.dataset.b = b;
    });
}
