
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

  console.log('Expanding collapsed sections for PDF capture')

  // Find and expand accordion/collapsible sections
  const collapsibleTriggers = element.querySelectorAll('[data-state="closed"]')
  console.log('Found closed sections:', collapsibleTriggers.length)
  
  Array.from(collapsibleTriggers).forEach((trigger, index) => {
    if (trigger instanceof HTMLElement) {
      console.log(`Expanding section ${index + 1}:`, trigger)
      
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

  // Enhanced: Handle Tailwind CSS class-based height constraints
  const constrainedElements = element.querySelectorAll('*')
  Array.from(constrainedElements).forEach((el) => {
    if (el instanceof HTMLElement) {
      const computedStyle = getComputedStyle(el)
      const classList = el.classList
      
      // Check for Tailwind max-height classes that create scrollable content
      const hasMaxHeightClass = Array.from(classList).some(cls => 
        cls.startsWith('max-h-') && cls !== 'max-h-none'
      )
      const hasOverflowClass = classList.contains('overflow-y-auto') || 
                               classList.contains('overflow-auto')
      
      // Check for inline max-height restrictions
      const hasInlineMaxHeight = computedStyle.maxHeight && 
                                 computedStyle.maxHeight !== 'none' && 
                                 el.scrollHeight > el.clientHeight
      
      // Target email content specifically
      const isEmailContent = el.closest('[data-testid*="email"]') ||
                             el.querySelector('.font-mono') ||
                             (el.textContent && el.textContent.includes('Subject:')) ||
                             el.classList.contains('whitespace-pre-wrap')
      
      if ((hasMaxHeightClass && hasOverflowClass) || hasInlineMaxHeight || 
          (isEmailContent && (hasMaxHeightClass || hasOverflowClass))) {
        
        console.log('Found constrained element for PDF expansion:', el, {
          hasMaxHeightClass,
          hasOverflowClass,
          hasInlineMaxHeight,
          isEmailContent,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          classes: el.className
        })
        
        const originalClasses = el.className
        const originalStyles = storeOriginalStyles(el)
        
        modifiedElements.push({
          element: el,
          originalClasses,
          originalStyles
        })
        
        // Remove Tailwind height constraints by replacing classes
        if (hasMaxHeightClass) {
          const newClasses = Array.from(classList)
            .filter(cls => !cls.startsWith('max-h-') || cls === 'max-h-none')
            .concat(['max-h-none'])
            .join(' ')
          el.className = newClasses
        }
        
        // Remove overflow constraints
        if (hasOverflowClass) {
          el.classList.remove('overflow-y-auto', 'overflow-auto')
          el.classList.add('overflow-visible')
        }
        
        // Remove inline height constraints
        if (hasInlineMaxHeight) {
          el.style.maxHeight = 'none'
          el.style.height = 'auto'
        }
        
        // Ensure content is fully visible
        el.style.overflow = 'visible'
        el.style.overflowY = 'visible'
      }
    }
  })

  console.log('Total elements modified for expansion:', modifiedElements.length)
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
  console.log('Expanding scrollable content areas')
  
  // Enhanced: Find elements with any height constraints (inline styles OR CSS classes)
  const allElements = element.querySelectorAll('*')
  
  Array.from(allElements).forEach((el) => {
    if (el instanceof HTMLElement) {
      const computedStyle = getComputedStyle(el)
      const classList = el.classList
      
      // Check for various constraint types
      const hasInlineMaxHeight = el.style.maxHeight && el.style.maxHeight !== 'none'
      const hasComputedMaxHeight = computedStyle.maxHeight && computedStyle.maxHeight !== 'none'
      const hasTailwindMaxHeight = Array.from(classList).some(cls => 
        cls.startsWith('max-h-') && cls !== 'max-h-none'
      )
      const hasScrollableOverflow = classList.contains('overflow-y-auto') || 
                                   classList.contains('overflow-auto') ||
                                   computedStyle.overflowY === 'auto' ||
                                   computedStyle.overflowY === 'scroll'
      
      // Special targeting for email content areas
      const isLikelyEmailContent = el.textContent && (
        el.textContent.includes('Subject:') ||
        el.textContent.includes('@') ||
        el.classList.contains('font-mono') ||
        el.classList.contains('whitespace-pre-wrap')
      )
      
      if ((hasInlineMaxHeight || hasComputedMaxHeight || hasTailwindMaxHeight) && 
          (hasScrollableOverflow || isLikelyEmailContent || el.scrollHeight > el.clientHeight)) {
        
        console.log('Expanding scrollable element:', el, {
          hasInlineMaxHeight,
          hasComputedMaxHeight,
          hasTailwindMaxHeight,
          hasScrollableOverflow,
          isLikelyEmailContent,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          classes: el.className
        })
        
        const originalClasses = el.className
        const originalStyles = storeOriginalStyles(el)
        
        modifiedElements.push({
          element: el,
          originalClasses,
          originalStyles
        })
        
        // Remove all height constraints
        if (hasInlineMaxHeight) {
          el.style.maxHeight = 'none'
        }
        
        if (hasTailwindMaxHeight) {
          const newClasses = Array.from(classList)
            .filter(cls => !cls.startsWith('max-h-') || cls === 'max-h-none')
            .concat(['max-h-none'])
            .join(' ')
          el.className = newClasses
        }
        
        // Remove overflow constraints
        el.classList.remove('overflow-y-auto', 'overflow-auto', 'overflow-hidden')
        el.classList.add('overflow-visible')
        
        // Set expansive styles
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
  console.log('Restoring element states:', modifiedElements.length, 'elements')
  
  modifiedElements.forEach(({ element, originalClasses, originalStyles }, index) => {
    console.log(`Restoring element ${index + 1}:`, element)
    
    // Restore classes completely
    element.className = originalClasses
    
    // Restore styles completely
    Object.entries(originalStyles).forEach(([property, value]) => {
      if (value) {
        element.style[property as any] = value
      } else {
        element.style.removeProperty(property)
      }
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
    minHeight: element.style.minHeight,
    overflow: element.style.overflow,
    overflowX: element.style.overflowX,
    overflowY: element.style.overflowY,
    transform: element.style.transform,
    backgroundColor: element.style.backgroundColor,
    flex: element.style.flex,
    wordBreak: element.style.wordBreak,
    hyphens: element.style.hyphens,
    whiteSpace: element.style.whiteSpace,
    flexWrap: element.style.flexWrap,
    display: element.style.display
  }
}
