
/**
 * Represents the stored state of a modified DOM element for restoration
 */
export interface ElementState {
  /** The HTML element that was modified */
  element: HTMLElement
  /** Original CSS classes before modification */
  originalClasses: string
  /** Original inline styles before modification */
  originalStyles: Record<string, string>
}

/**
 * Finds and expands collapsed sections for PDF generation
 * 
 * Searches for accordion/collapsible elements with closed state and simulates
 * user interaction to expand them. This ensures all content is visible for
 * PDF capture, including hidden sections.
 * 
 * @param element - Root element to search for collapsible sections
 * @returns Array of modified elements that need restoration
 * 
 * @example
 * ```typescript
 * const modifiedElements = expandCollapsedSections(document.getElementById('content'));
 * // ... perform PDF generation ...
 * restoreElementStates(modifiedElements);
 * ```
 */
export function expandCollapsedSections(element: HTMLElement): ElementState[] {
  const modifiedElements: ElementState[] = []

  // Find and expand accordion/collapsible sections
  const collapsibleTriggers = element.querySelectorAll('[data-state="closed"]')
  Array.from(collapsibleTriggers).forEach((trigger) => {
    if (trigger instanceof HTMLElement) {
      // Store original state
      const originalClasses = trigger.className
      const originalStyles = storeOriginalStyles(trigger)
      
      modifiedElements.push({
        element: trigger,
        originalClasses,
        originalStyles
      })
      
      // Simulate click to expand
      trigger.click()
    }
  })

  return modifiedElements
}

/**
 * Expands scrollable content areas for complete PDF capture
 * 
 * Identifies elements with height constraints that would prevent full content
 * visibility and removes those constraints. This ensures scrollable areas
 * are fully expanded in the PDF output.
 * 
 * @param element - Root element to search for scrollable content
 * @param modifiedElements - Array to append modified elements to for restoration
 * 
 * @example
 * ```typescript
 * const modifiedElements: ElementState[] = [];
 * expandScrollableContent(contentElement, modifiedElements);
 * // All scrollable areas are now fully expanded
 * ```
 */
export function expandScrollableContent(element: HTMLElement, modifiedElements: ElementState[]): void {
  // Find elements with max-height constraints
  const constrainedElements = element.querySelectorAll('[style*="max-height"]')
  
  Array.from(constrainedElements).forEach((el) => {
    if (el instanceof HTMLElement) {
      const computedStyle = getComputedStyle(el)
      
      // Check if this is a constrained scrollable area
      if (computedStyle.maxHeight && computedStyle.maxHeight !== 'none') {
        const originalClasses = el.className
        const originalStyles = storeOriginalStyles(el)
        
        modifiedElements.push({
          element: el,
          originalClasses,
          originalStyles
        })
        
        // Remove height constraints
        el.style.maxHeight = 'none'
        el.style.height = 'auto'
        el.style.overflow = 'visible'
        el.style.overflowY = 'visible'
      }
    }
  })
}

/**
 * Restores all modified elements to their original state
 * 
 * Reverts all changes made during PDF preparation, including:
 * - CSS classes
 * - Inline styles
 * - Element visibility states
 * 
 * Essential for maintaining UI integrity after PDF generation.
 * 
 * @param modifiedElements - Array of elements to restore from expandCollapsedSections/expandScrollableContent
 * 
 * @example
 * ```typescript
 * const modifiedElements = expandCollapsedSections(element);
 * try {
 *   // ... PDF generation ...
 * } finally {
 *   restoreElementStates(modifiedElements); // Always restore
 * }
 * ```
 */
export function restoreElementStates(modifiedElements: ElementState[]): void {
  modifiedElements.forEach(({ element, originalClasses, originalStyles }) => {
    // Restore classes
    element.className = originalClasses
    
    // Restore styles
    Object.entries(originalStyles).forEach(([property, value]) => {
      element.style[property as any] = value || ''
    })
  })
}

/**
 * Helper function to store original element styles for later restoration
 * 
 * Captures all CSS properties that might be modified during PDF preparation.
 * Used internally by expansion functions to enable proper cleanup.
 * 
 * @param element - HTML element to capture styles from
 * @returns Object mapping CSS property names to their current values
 * 
 * @internal
 */
function storeOriginalStyles(element: HTMLElement): Record<string, string> {
  return {
    position: element.style.position,
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minWidth: element.style.minWidth,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
    overflow: element.style.overflow,
    overflowY: element.style.overflowY,
    transform: element.style.transform,
    backgroundColor: element.style.backgroundColor,
    flex: element.style.flex,
    wordBreak: element.style.wordBreak,
    hyphens: element.style.hyphens,
    whiteSpace: element.style.whiteSpace,
    flexWrap: element.style.flexWrap
  }
}
