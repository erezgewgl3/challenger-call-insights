
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
    marginRight: element.style.marginRight,
    // Enhanced: Store padding and margins that might affect layout
    paddingLeft: element.style.paddingLeft,
    paddingRight: element.style.paddingRight,
    boxSizing: element.style.boxSizing
  }
}

/**
 * Stores the current CSS classes of an element for later restoration
 */
export function storeElementClasses(element: HTMLElement): string {
  return element.className
}

/**
 * Restores previously stored CSS classes to an element
 */
export function restoreElementClasses(element: HTMLElement, originalClasses: string): void {
  element.className = originalClasses
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
 * Removes Tailwind CSS constraints that interfere with PDF export
 * 
 * Temporarily removes classes that can cause layout conflicts during PDF generation:
 * - max-w-* classes that constrain width
 * - mx-auto that centers content (can cause positioning issues)
 * - Container constraints that might clip content
 * 
 * @param element - HTML element to remove constraints from
 * @returns Array of removed class names for restoration
 */
function removeTailwindConstraints(element: HTMLElement): string[] {
  const constraintPatterns = [
    'max-w-',     // Remove max-width constraints
    'mx-auto',    // Remove auto margins that can interfere
    'container'   // Remove container classes
  ]
  
  const currentClasses = element.className.split(' ')
  const removedClasses: string[] = []
  
  const filteredClasses = currentClasses.filter(className => {
    const shouldRemove = constraintPatterns.some(pattern => className.includes(pattern))
    if (shouldRemove) {
      removedClasses.push(className)
      return false
    }
    return true
  })
  
  element.className = filteredClasses.join(' ')
  
  console.log('Removed Tailwind constraints for PDF:', {
    original: currentClasses.length,
    filtered: filteredClasses.length,
    removed: removedClasses
  })
  
  return removedClasses
}

/**
 * Restores previously removed Tailwind CSS constraints
 * 
 * @param element - HTML element to restore constraints to
 * @param removedClasses - Array of class names to restore
 */
function restoreTailwindConstraints(element: HTMLElement, removedClasses: string[]): void {
  const currentClasses = element.className.split(' ').filter(c => c.trim())
  const restoredClasses = [...currentClasses, ...removedClasses].join(' ')
  element.className = restoredClasses
  
  console.log('Restored Tailwind constraints after PDF:', {
    currentCount: currentClasses.length,
    restoredCount: removedClasses.length,
    finalClassName: restoredClasses
  })
}

/**
 * Applies PDF-optimized styles to an element
 * 
 * ENHANCED: Now properly handles Tailwind CSS constraints and applies clean width settings
 * Removes conflicting Tailwind classes temporarily and applies unconstrained width for PDF capture
 * 
 * @param element - HTML element to optimize for PDF capture
 * @param type - Type of optimization to apply based on element purpose
 * @returns Object containing removed classes for restoration
 * 
 * @example
 * ```typescript
 * const constraints = optimizeElementForPDF(mainElement, 'main');
 * // ... PDF generation ...
 * restoreTailwindConstraints(mainElement, constraints.removedClasses);
 * ```
 */
export function optimizeElementForPDF(element: HTMLElement, type: PDFOptimizationType = 'main'): { removedClasses: string[] } {
  let removedClasses: string[] = []
  
  switch (type) {
    case 'main':
      // ENHANCED: Remove conflicting Tailwind constraints first
      removedClasses = removeTailwindConstraints(element)
      
      // Apply clean, unconstrained width optimization
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
      element.style.paddingLeft = '16px'  // Maintain some padding
      element.style.paddingRight = '16px'
      element.style.boxSizing = 'border-box'
      
      console.log('Applied main PDF optimization:', {
        optimalWidth,
        removedConstraints: removedClasses.length,
        elementWidth: element.offsetWidth
      })
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
  
  return { removedClasses }
}

/**
 * ENHANCED: Restores element to original state including Tailwind classes
 * 
 * @param element - HTML element to restore
 * @param styles - Original inline styles
 * @param removedClasses - Tailwind classes that were removed
 */
export function restoreElementCompletely(element: HTMLElement, styles: Record<string, string>, removedClasses: string[]): void {
  // Restore inline styles first
  restoreElementStyles(element, styles)
  
  // Restore Tailwind classes
  restoreTailwindConstraints(element, removedClasses)
  
  console.log('Complete element restoration completed:', {
    stylesRestored: Object.keys(styles).length,
    classesRestored: removedClasses.length
  })
}
