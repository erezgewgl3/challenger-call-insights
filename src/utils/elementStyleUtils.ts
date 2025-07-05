
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
    flexWrap: element.style.flexWrap
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
 * Applies PDF-optimized styles to an element
 * 
 * Modifies element styling to ensure optimal rendering in PDF format:
 * - Removes transforms that can cause positioning issues
 * - Sets fixed dimensions for consistent layout
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
      // Main container optimization for consistent PDF layout
      element.style.position = 'static'
      element.style.width = '1200px'
      element.style.maxWidth = '1200px'
      element.style.minWidth = '1200px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'
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
