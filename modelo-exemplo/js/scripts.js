/**
 * MoveMais + Multipark — Apresentação de Integração
 * Scripts da Apresentação
 * 
 * Organização:
 * 1. Utilities
 * 2. Smooth Scroll Navigation
 * 3. Scroll Animations (Intersection Observer)
 * 4. Modal Functions
 * 5. FAQ Collapsible
 * 6. Timeline Progress Animation
 * 7. Fullscreen Diagram Modal
 * 8. Initialization
 */

/* =====================================================
   1. UTILITIES
   ===================================================== */

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 10) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/* =====================================================
   2. SMOOTH SCROLL NAVIGATION
   ===================================================== */

/**
 * Initialize smooth scroll for navigation links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* =====================================================
   3. SCROLL ANIMATIONS (INTERSECTION OBSERVER)
   ===================================================== */

/**
 * Initialize scroll animations using Intersection Observer
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optionally unobserve after animation
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        observer.observe(el);
    });
}

/* =====================================================
   4. MODAL FUNCTIONS
   ===================================================== */

/**
 * Open a modal by ID
 * @param {string} modalId - The modal element ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close a modal by ID
 * @param {string} modalId - The modal element ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Open integradora modal (alias for openModal)
 * @param {string} modalId - The modal element ID
 */
function openIntegradoraModal(modalId) {
    openModal(modalId);
}

/**
 * Close integradora modal (alias for closeModal)
 * @param {string} modalId - The modal element ID
 */
function closeIntegradoraModal(modalId) {
    closeModal(modalId);
}

/**
 * Open a flow diagram in fullscreen from a clickable element
 * @param {HTMLElement} element - The clickable flow diagram element
 */
function openFlowFullscreen(element) {
    const title = element.dataset.title || 'Fluxo';
    
    // Clone the element content for fullscreen display
    const modal = document.getElementById('fullscreenModal');
    const container = document.getElementById('fullscreenContent');
    const titleEl = document.querySelector('.fullscreen-modal-title');
    
    if (!modal || !container) return;
    
    // Clone the inner content (excluding the title)
    const clone = element.cloneNode(true);
    // Remove the title h4 from clone
    const titleH4 = clone.querySelector('h4');
    if (titleH4) titleH4.remove();
    
    // Style the clone for fullscreen
    clone.style.cursor = 'grab';
    clone.style.transform = 'scale(1)';
    clone.style.background = 'white';
    clone.style.borderRadius = '16px';
    clone.style.padding = '30px';
    clone.style.minWidth = '800px';
    clone.onclick = null; // Remove onclick to prevent reopening
    
    // Clear previous content and add clone
    container.innerHTML = '';
    container.appendChild(clone);
    
    // Set title
    if (titleEl) {
        titleEl.textContent = title;
    }
    
    // Reset state
    fullscreenState.scale = 1;
    fullscreenState.translateX = 0;
    fullscreenState.translateY = 0;
    fullscreenState.currentSvg = clone;
    
    updateTransform();
    updateZoomLevel();
    
    // Add event listeners
    setupFullscreenEventListeners(container, clone);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Initialize modal event listeners
 */
function initModals() {
    // Close modals when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
            document.body.style.overflow = '';
            
            // Also close fullscreen modal
            closeFullscreenModal();
        }
    });
}

/* =====================================================
   5. FAQ COLLAPSIBLE
   ===================================================== */

/**
 * Toggle FAQ item visibility
 * @param {HTMLElement} element - The FAQ question element clicked
 * @param {Event} event - The click event
 */
function toggleFaqItem(element, event) {
    if (event) event.stopPropagation();
    
    const faqItem = element.closest('.faq-item');
    if (!faqItem) return;
    
    const isNested = faqItem.classList.contains('faq-subitem') || 
                     faqItem.classList.contains('faq-nested');
    
    if (isNested) {
        // For nested items, just toggle this one
        faqItem.classList.toggle('active');
    } else {
        // For top-level items, close others and toggle this one
        const wasActive = faqItem.classList.contains('active');
        
        // Close all top-level FAQ items
        document.querySelectorAll('.faq-item:not(.faq-subitem):not(.faq-nested)').forEach(item => {
            item.classList.remove('active');
        });
        
        // Toggle the clicked item
        if (!wasActive) {
            faqItem.classList.add('active');
        }
    }
}

/**
 * Initialize FAQ event listeners
 */
function initFaq() {
    // Initialize nested FAQ toggles
    document.querySelectorAll('.faq-nested > .faq-question, .faq-subitem > .faq-question').forEach(question => {
        question.addEventListener('click', function(e) {
            toggleFaqItem(this, e);
        });
    });
}

/* =====================================================
   6. TIMELINE PROGRESS ANIMATION
   ===================================================== */

/**
 * Initialize timeline progress animation
 */
function initTimelineProgress() {
    const timelineContainer = document.querySelector('.flow-steps');
    if (!timelineContainer) return;
    
    // Add progress line container
    const progressContainer = document.createElement('div');
    progressContainer.className = 'timeline-progress-container';
    progressContainer.innerHTML = '<div class="timeline-progress-bar"></div>';
    
    // Insert progress bar styles dynamically if not already present
    if (!document.getElementById('timeline-progress-styles')) {
        const style = document.createElement('style');
        style.id = 'timeline-progress-styles';
        style.textContent = `
            .flow-section {
                position: relative;
            }
            .timeline-progress-container {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: var(--gray-200);
                border-radius: 4px;
                overflow: hidden;
                z-index: 10;
            }
            .timeline-progress-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, var(--primary), var(--movemais), var(--multipark));
                background-size: 200% 100%;
                animation: gradientShift 3s ease infinite;
                transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }
    
    const flowSection = document.querySelector('.flow-section');
    if (flowSection) {
        flowSection.style.position = 'relative';
        flowSection.insertBefore(progressContainer, flowSection.firstChild);
    }
    
    const progressBar = progressContainer.querySelector('.timeline-progress-bar');
    const flowSteps = document.querySelectorAll('.flow-step');
    
    if (flowSteps.length === 0) return;
    
    // Observer for flow steps
    const stepObserver = new IntersectionObserver((entries) => {
        let maxVisibleIndex = -1;
        
        flowSteps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.7 && rect.bottom > 0;
            
            if (isVisible && index > maxVisibleIndex) {
                maxVisibleIndex = index;
            }
        });
        
        if (maxVisibleIndex >= 0) {
            const progress = ((maxVisibleIndex + 1) / flowSteps.length) * 100;
            progressBar.style.width = progress + '%';
        }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    
    flowSteps.forEach(step => stepObserver.observe(step));
    
    // Also update on scroll
    window.addEventListener('scroll', debounce(() => {
        let maxVisibleIndex = -1;
        
        flowSteps.forEach((step, index) => {
            const rect = step.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight * 0.7 && rect.bottom > 0;
            
            if (isVisible && index > maxVisibleIndex) {
                maxVisibleIndex = index;
            }
        });
        
        if (maxVisibleIndex >= 0) {
            const progress = ((maxVisibleIndex + 1) / flowSteps.length) * 100;
            progressBar.style.width = progress + '%';
        }
    }, 50));
}

/* =====================================================
   7. FULLSCREEN DIAGRAM MODAL
   ===================================================== */

// Fullscreen modal state
const fullscreenState = {
    scale: 1,
    minScale: 0.5,
    maxScale: 4,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    currentSvg: null
};

/**
 * Open fullscreen diagram modal
 * @param {HTMLElement} svgElement - The SVG element to display fullscreen
 * @param {string} title - The title to display
 */
function openFullscreenModal(svgElement, title) {
    const modal = document.getElementById('fullscreenModal');
    const container = document.getElementById('fullscreenContent');
    const titleEl = document.querySelector('.fullscreen-modal-title');
    
    if (!modal || !container) return;
    
    // Clone the SVG
    const clonedSvg = svgElement.cloneNode(true);
    clonedSvg.style.cursor = 'grab';
    
    // Clear previous content and add cloned SVG
    container.innerHTML = '';
    container.appendChild(clonedSvg);
    
    // Set title
    if (titleEl) {
        titleEl.textContent = title || 'Diagrama';
    }
    
    // Reset state
    fullscreenState.scale = 1;
    fullscreenState.translateX = 0;
    fullscreenState.translateY = 0;
    fullscreenState.currentSvg = clonedSvg;
    
    updateTransform();
    updateZoomLevel();
    
    // Add event listeners
    setupFullscreenEventListeners(container, clonedSvg);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close fullscreen modal
 */
function closeFullscreenModal() {
    const modal = document.getElementById('fullscreenModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Reset state
    fullscreenState.scale = 1;
    fullscreenState.translateX = 0;
    fullscreenState.translateY = 0;
    fullscreenState.currentSvg = null;
}

/**
 * Setup event listeners for fullscreen modal interactions
 * @param {HTMLElement} container - The container element
 * @param {SVGElement} svg - The SVG element
 */
function setupFullscreenEventListeners(container, svg) {
    // Mouse events
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
}

/**
 * Handle mouse down event for panning
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    
    fullscreenState.isDragging = true;
    fullscreenState.startX = e.clientX - fullscreenState.translateX;
    fullscreenState.startY = e.clientY - fullscreenState.translateY;
    
    if (fullscreenState.currentSvg) {
        fullscreenState.currentSvg.style.cursor = 'grabbing';
    }
}

/**
 * Handle mouse move event for panning
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseMove(e) {
    if (!fullscreenState.isDragging) return;
    
    e.preventDefault();
    fullscreenState.translateX = e.clientX - fullscreenState.startX;
    fullscreenState.translateY = e.clientY - fullscreenState.startY;
    
    updateTransform();
}

/**
 * Handle mouse up event
 */
function handleMouseUp() {
    fullscreenState.isDragging = false;
    
    if (fullscreenState.currentSvg) {
        fullscreenState.currentSvg.style.cursor = 'grab';
    }
}

/**
 * Handle mouse wheel event for zooming
 * @param {WheelEvent} e - Wheel event
 */
function handleWheel(e) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(
        fullscreenState.minScale, 
        Math.min(fullscreenState.maxScale, fullscreenState.scale * delta)
    );
    
    // Zoom towards mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    fullscreenState.translateX -= x * (newScale / fullscreenState.scale - 1);
    fullscreenState.translateY -= y * (newScale / fullscreenState.scale - 1);
    fullscreenState.scale = newScale;
    
    updateTransform();
    updateZoomLevel();
}

/**
 * Handle touch start event
 * @param {TouchEvent} e - Touch event
 */
function handleTouchStart(e) {
    if (e.touches.length === 1) {
        // Single touch - start panning
        fullscreenState.isDragging = true;
        fullscreenState.startX = e.touches[0].clientX - fullscreenState.translateX;
        fullscreenState.startY = e.touches[0].clientY - fullscreenState.translateY;
    } else if (e.touches.length === 2) {
        // Two touches - start pinch zoom
        fullscreenState.isDragging = false;
        fullscreenState.initialDistance = getDistance(e.touches[0], e.touches[1]);
    }
}

/**
 * Handle touch move event
 * @param {TouchEvent} e - Touch event
 */
function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && fullscreenState.isDragging) {
        // Single touch - pan
        fullscreenState.translateX = e.touches[0].clientX - fullscreenState.startX;
        fullscreenState.translateY = e.touches[0].clientY - fullscreenState.startY;
        updateTransform();
    } else if (e.touches.length === 2) {
        // Two touches - pinch zoom
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const delta = currentDistance / fullscreenState.initialDistance;
        
        const newScale = Math.max(
            fullscreenState.minScale, 
            Math.min(fullscreenState.maxScale, fullscreenState.scale * delta)
        );
        
        fullscreenState.scale = newScale;
        fullscreenState.initialDistance = currentDistance;
        
        updateTransform();
        updateZoomLevel();
    }
}

/**
 * Handle touch end event
 */
function handleTouchEnd() {
    fullscreenState.isDragging = false;
}

/**
 * Calculate distance between two touch points
 * @param {Touch} touch1 - First touch point
 * @param {Touch} touch2 - Second touch point
 * @returns {number} Distance between points
 */
function getDistance(touch1, touch2) {
    return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
}

/**
 * Update SVG transform based on current state
 */
function updateTransform() {
    if (fullscreenState.currentSvg) {
        fullscreenState.currentSvg.style.transform = 
            `translate(${fullscreenState.translateX}px, ${fullscreenState.translateY}px) scale(${fullscreenState.scale})`;
    }
}

/**
 * Update zoom level display
 */
function updateZoomLevel() {
    const zoomLevelEl = document.getElementById('zoomLevel');
    if (zoomLevelEl) {
        zoomLevelEl.textContent = Math.round(fullscreenState.scale * 100) + '%';
    }
}

/**
 * Zoom in the fullscreen diagram
 */
function zoomIn() {
    fullscreenState.scale = Math.min(fullscreenState.maxScale, fullscreenState.scale * 1.2);
    updateTransform();
    updateZoomLevel();
}

/**
 * Zoom out the fullscreen diagram
 */
function zoomOut() {
    fullscreenState.scale = Math.max(fullscreenState.minScale, fullscreenState.scale / 1.2);
    updateTransform();
    updateZoomLevel();
}

/**
 * Reset zoom and position
 */
function resetZoom() {
    fullscreenState.scale = 1;
    fullscreenState.translateX = 0;
    fullscreenState.translateY = 0;
    updateTransform();
    updateZoomLevel();
}

/**
 * Initialize zoomable diagrams
 */
function initZoomableDiagrams() {
    document.querySelectorAll('.diagram-zoomable').forEach(diagram => {
        diagram.style.cursor = 'zoom-in';
        
        diagram.addEventListener('click', function() {
            const svg = this.querySelector('svg');
            if (svg) {
                const title = this.dataset.title || 
                             this.closest('.section')?.querySelector('h2')?.textContent || 
                             'Diagrama';
                openFullscreenModal(svg, title);
            }
        });
    });
    
    // Setup zoom control buttons (by ID)
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);
    
    // Setup close button for fullscreen modal
    const closeBtn = document.querySelector('.fullscreen-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeFullscreenModal);
}

/* =====================================================
   8. INITIALIZATION
   ===================================================== */

/**
 * Initialize all presentation functionality
 */
function initPresentation() {
    initSmoothScroll();
    initScrollAnimations();
    initModals();
    initFaq();
    initTimelineProgress();
    initZoomableDiagrams();
    
    // Add scroll indicator for horizontal scrollable elements
    document.querySelectorAll('.comparison-table-wrapper').forEach(wrapper => {
        wrapper.addEventListener('scroll', function() {
            if (this.scrollLeft > 10) {
                this.classList.add('scrolled');
            } else {
                this.classList.remove('scrolled');
            }
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPresentation);
