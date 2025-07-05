
export interface ElementState {
  element: HTMLElement
  originalClasses: string
  originalStyles: Record<string, string>
}

/**
 * Finds and expands collapsed sections for PDF generation
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
 * Helper function to store original element styles
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
