/**
 * Footer Scroller - Handle scrolling in the about panel with down arrow button
 * Also handles alphabetical list horizontal scrolling with left/right arrows
 */

function setupFooterScrolling() {
    const footerContent = document.getElementById('footer-content');
    const footerScrollBtn = document.getElementById('footerScrollBtn');
    
    const scrollAmount = 30; // pixels to scroll per click
    
    footerScrollBtn.addEventListener('click', () => {
        footerContent.scrollTop += scrollAmount;
    });
    
    // Add hover effects
    footerScrollBtn.addEventListener('mouseenter', () => {
        footerScrollBtn.style.color = '#0022cc';
    });
    
    footerScrollBtn.addEventListener('mouseleave', () => {
        footerScrollBtn.style.color = '#0033FF';
    });
    
    // Setup alphabetical arrows (they may not exist yet until alphabetical mode is loaded)
    setupAlphabeticalArrows();
}

function setupAlphabeticalArrows() {
    const leftArrow = document.getElementById('alphabeticalLeftArrow');
    const rightArrow = document.getElementById('alphabeticalRightArrow');
    const upArrow = document.getElementById('alphabeticalUpArrow');
    const downArrow = document.getElementById('alphabeticalDownArrow');
    
    if (!leftArrow || !rightArrow) return; // Not in alphabetical mode yet
    
    const horizontalScrollAmount = 100; // pixels to scroll per interval
    const verticalScrollAmount = 50; // pixels to scroll per interval
    const initialDelay = 500; // ms before continuous scroll starts
    const scrollInterval = 50; // ms between scroll events
    
    // Initially hide left and up arrows (can't scroll there from start)
    if (leftArrow) leftArrow.style.display = 'none';
    if (upArrow) upArrow.style.display = 'none';
    
    // Get the columns container - the actual scrollable element
    const columnsContainer = document.getElementById('columnsContainer');
    
    if (!columnsContainer) {
        console.log('❌ columnsContainer not found');
        return;
    }
    
    // Function to update arrow visibility based on scroll position
    const updateArrowVisibility = () => {
        // Left arrow visibility
        if (columnsContainer.scrollLeft > 0) {
            if (leftArrow) leftArrow.style.display = 'block';
        } else {
            if (leftArrow) leftArrow.style.display = 'none';
        }
        
        // Up arrow visibility
        if (columnsContainer.scrollTop > 0) {
            if (upArrow) upArrow.style.display = 'block';
        } else {
            if (upArrow) upArrow.style.display = 'none';
        }
        
        // Down arrow visibility
        const canScrollDown = columnsContainer.scrollTop + columnsContainer.clientHeight < columnsContainer.scrollHeight;
        if (downArrow) {
            downArrow.style.display = canScrollDown ? 'block' : 'none';
        }
    };
    
    // Monitor scroll events
    columnsContainer.addEventListener('scroll', updateArrowVisibility);
    
    // Helper function to create continuous scroll handler
    const createScrollHandler = (directionX, directionY) => {
        let scrollInterval_id = null;
        let holdTime = 0;
        
        const startScroll = () => {
            holdTime = 0;
            
            // Initial click scroll
            if (directionX !== 0) columnsContainer.scrollLeft += directionX * horizontalScrollAmount;
            if (directionY !== 0) columnsContainer.scrollTop += directionY * verticalScrollAmount;
            updateArrowVisibility();
            
            // Start continuous scroll after initial delay
            scrollInterval_id = setTimeout(() => {
                scrollInterval_id = setInterval(() => {
                    holdTime += scrollInterval;
                    const acceleration = Math.min(3, 1 + holdTime / 1000); // Max 3x speed after 1 second
                    
                    if (directionX !== 0) {
                        const scrollAmount = horizontalScrollAmount * acceleration;
                        columnsContainer.scrollLeft += directionX * scrollAmount;
                    }
                    if (directionY !== 0) {
                        const scrollAmount = verticalScrollAmount * acceleration;
                        columnsContainer.scrollTop += directionY * scrollAmount;
                    }
                    updateArrowVisibility();
                }, scrollInterval);
            }, initialDelay);
        };
        
        const stopScroll = () => {
            if (scrollInterval_id !== null) {
                clearTimeout(scrollInterval_id);
                clearInterval(scrollInterval_id);
                scrollInterval_id = null;
            }
        };
        
        return { startScroll, stopScroll };
    };
    
    // Left arrow handlers (scroll left, directionX = -1)
    const leftHandler = createScrollHandler(-1, 0);
    leftArrow.addEventListener('mousedown', leftHandler.startScroll);
    leftArrow.addEventListener('mouseup', leftHandler.stopScroll);
    leftArrow.addEventListener('mouseleave', leftHandler.stopScroll);
    
    leftArrow.addEventListener('mouseenter', () => {
        leftArrow.style.color = '#0022cc';
    });
    
    leftArrow.addEventListener('mouseleave', () => {
        leftArrow.style.color = '#0033FF';
    });
    
    // Right arrow handlers (scroll right, directionX = 1)
    const rightHandler = createScrollHandler(1, 0);
    rightArrow.addEventListener('mousedown', rightHandler.startScroll);
    rightArrow.addEventListener('mouseup', rightHandler.stopScroll);
    rightArrow.addEventListener('mouseleave', rightHandler.stopScroll);
    
    rightArrow.addEventListener('mouseenter', () => {
        rightArrow.style.color = '#0022cc';
    });
    
    rightArrow.addEventListener('mouseleave', () => {
        rightArrow.style.color = '#0033FF';
    });
    
    // Up arrow handlers (scroll up, directionY = -1)
    if (upArrow) {
        const upHandler = createScrollHandler(0, -1);
        upArrow.addEventListener('mousedown', upHandler.startScroll);
        upArrow.addEventListener('mouseup', upHandler.stopScroll);
        upArrow.addEventListener('mouseleave', upHandler.stopScroll);
        
        upArrow.addEventListener('mouseenter', () => {
            upArrow.style.color = '#0022cc';
        });
        
        upArrow.addEventListener('mouseleave', () => {
            upArrow.style.color = '#0033FF';
        });
    }
    
    // Down arrow handlers (scroll down, directionY = 1)
    if (downArrow) {
        const downHandler = createScrollHandler(0, 1);
        downArrow.addEventListener('mousedown', downHandler.startScroll);
        downArrow.addEventListener('mouseup', downHandler.stopScroll);
        downArrow.addEventListener('mouseleave', downHandler.stopScroll);
        
        downArrow.addEventListener('mouseenter', () => {
            downArrow.style.color = '#0022cc';
        });
        
        downArrow.addEventListener('mouseleave', () => {
            downArrow.style.color = '#0033FF';
        });
    }
}
