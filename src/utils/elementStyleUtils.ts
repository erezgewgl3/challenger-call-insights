
/**
 * Stores the current styles of an element for later restoration
 * 
 * Captures all CSS properties that may be modified during PDF optimization.
 * Essential for maintaining original UI state after PDF generation completes.
 * 
 * @param element - HTML element to capture styles from
 * @returns Object mapping CSS property names to their current values
 * 
 * @example
 * ```typescript
 * const originalStyles = storeElementStyles(element);
 * // ... modify element for PDF capture ...
 * restoreElementStyles(element, originalStyles);
 * ```
 */
export function storeElementStyles(element: HTMLElement): Record<string, string> {
  return {
    position: element.style.position,
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minWidth: element.style.minWidth,
    transform: element.style.transform,
    overflow: element.style.overflow,
    overflowY: element.style.overflowY,
    backgroundColor: element.style.backgroundColor,
    flex: element.style.flex,
    wordBreak: element.style.wordBreak,
    hyphens: element.style.hyphens,
    whiteSpace: element.style.whiteSpace,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
    flexWrap: element.style.flexWrap,
    left: element.style.left,
    right: element.style.right,
    marginLeft: element.style.marginLeft,
    marginRight: element.style.marginRight
  }
}

/**
 * Restores previously stored styles to an element
 * 
 * Reverts all style modifications made during PDF preparation.
 * Handles empty/null values properly to avoid CSS conflicts.
 * 
 * @param element - HTML element to restore styles to
 * @param styles - Previously stored styles from storeElementStyles()
 * 
 * @example
 * ```typescript
 * const originalStyles = storeElementStyles(element);
 * optimizeElementForPDF(element, 'main');
 * // ... PDF generation ...
 * restoreElementStyles(element, originalStyles);
 * ```
 */
export function restoreElementStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property as any] = value || ''
  })
}

/**
 * PDF optimization type for different element categories
 */
type PDFOptimizationType = 'main' | 'email' | 'text' | 'container'

/**
 * Calculates optimal width for PDF export based on viewport
 * Ensures content never exceeds available space while maintaining quality
 */
function calculateOptimalPDFWidth(): string {
  try {
    // Use viewport width with safety margins, max 1200px for quality
    const viewportWidth = window.innerWidth
    const safetyMargin = 40 // 20px margin on each side
    const optimalWidth = Math.min(1200, viewportWidth - safetyMargin)
    
    // Ensure minimum width for readability
    const finalWidth = Math.max(320, optimalWidth)
    
    console.log('PDF width calculation:', {
      viewportWidth,
      safetyMargin,
      optimalWidth,
      finalWidth: `${finalWidth}px`
    })
    
    return `${finalWidth}px`
  } catch (error) {
    console.warn('Failed to calculate optimal PDF width, using fallback:', error)
    return '1200px' // Safe fallback
  }
}

/**
 * Applies PDF-optimized styles to an element
 * 
 * Modifies element styling to ensure optimal rendering in PDF format:
 * - Uses dynamic width calculation to prevent horizontal cutoff
 * - Removes transforms that can cause positioning issues
 * - Sets appropriate dimensions for consistent layout
 * - Optimizes text wrapping and overflow behavior
 * - Ensures backgrounds render properly
 * 
 * @param element - HTML element to optimize for PDF capture
 * @param type - Type of optimization to apply based on element purpose
 * 
 * @example
 * ```typescript
 * optimizeElementForPDF(mainElement, 'main');
 * optimizeElementForPDF(textElement, 'text');
 * optimizeElementForPDF(emailElement, 'email');
 * ```
 */
export function optimizeElementForPDF(element: HTMLElement, type: PDFOptimizationType = 'main'): void {
  switch (type) {
    case 'main':
      // Main container optimization with dynamic width calculation
      const optimalWidth = calculateOptimalPDFWidth()
      element.style.position = 'static'
      element.style.width = optimalWidth
      element.style.maxWidth = optimalWidth
      element.style.minWidth = optimalWidth
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'
      element.style.left = 'auto'
      element.style.right = 'auto'
      element.style.marginLeft = 'auto'
      element.style.marginRight = 'auto'
      break
      
    case 'email':
      // Email content optimization for full text visibility
      element.style.maxHeight = 'none'
      element.style.height = 'auto'
      element.style.overflow = 'visible'
      element.style.overflowY = 'visible'
      element.style.whiteSpace = 'pre-wrap'
      break
      
    case 'text':
      // General text content optimization
      element.style.flex = '1'
      element.style.minWidth = '0'
      element.style.wordBreak = 'normal'
      element.style.hyphens = 'auto'
      element.style.width = 'auto'
      element.style.maxWidth = 'none'
      element.style.whiteSpace = 'normal'
      break
      
    case 'container':
      // Container optimization for flexible layout
      element.style.width = '100%'
      element.style.maxWidth = 'none'
      element.style.minWidth = '0'
      element.style.flexWrap = 'wrap'
      break
  }
}
