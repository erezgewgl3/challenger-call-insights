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

  console.log('🔍 Starting comprehensive section expansion for PDF capture')

  // Phase 1: Expand accordion/collapsible sections
  const collapsibleTriggers = element.querySelectorAll('[data-state="closed"]')
  console.log('📂 Found closed sections:', collapsibleTriggers.length)
  
  Array.from(collapsibleTriggers).forEach((trigger, index) => {
    if (trigger instanceof HTMLElement) {
      console.log(`📂 Expanding section ${index + 1}:`, trigger)
      
      const originalClasses = trigger.className
      const originalStyles = storeOriginalStyles(trigger)
      
      modifiedElements.push({
        element: trigger,
        originalClasses,
        originalStyles
      })
      
      trigger.click()
    }
  })

  // Phase 2: Comprehensive height constraint removal
  console.log('📏 Phase 2: Removing all height constraints for PDF capture')
  
  // Target all elements that might have height constraints
  const allElements = element.querySelectorAll('*')
  
  Array.from(allElements).forEach((el, index) => {
    if (el instanceof HTMLElement) {
      const computedStyle = getComputedStyle(el)
      const classList = el.classList
      
      // Detect various constraint types
      const hasMaxHeightClass = Array.from(classList).some(cls => 
        cls.startsWith('max-h-') && cls !== 'max-h-none' && cls !== 'max-h-full' && cls !== 'max-h-screen'
      )
      const hasOverflowClass = classList.contains('overflow-y-auto') || 
                               classList.contains('overflow-auto') ||
                               classList.contains('overflow-y-scroll')
      const hasInlineMaxHeight = el.style.maxHeight && 
                                 el.style.maxHeight !== 'none' && 
                                 el.style.maxHeight !== 'unset'
      const hasComputedMaxHeight = computedStyle.maxHeight && 
                                   computedStyle.maxHeight !== 'none' && 
                                   computedStyle.maxHeight !== 'unset' &&
                                   !computedStyle.maxHeight.includes('px') // Skip computed pixel values
      
      // Check if element has scrollable content
      const hasScrollableContent = el.scrollHeight > el.clientHeight + 5 // 5px tolerance
      
      // Special targeting for email content and other key areas
      const isEmailContent = el.closest('[data-testid*="email"]') ||
                             el.querySelector('.font-mono') ||
                             el.classList.contains('whitespace-pre-wrap') ||
                             (el.textContent && (
                               el.textContent.includes('Subject:') ||
                               el.textContent.includes('From:') ||
                               el.textContent.includes('To:')
                             ))
      
      const isBattlePlanContent = el.closest('[class*="battle"]') ||
                                  el.closest('[class*="strategic"]') ||
                                  el.closest('[class*="assessment"]')
      
      const isKeyContent = isEmailContent || isBattlePlanContent
      
      // Determine if element needs expansion
      const needsExpansion = (hasMaxHeightClass && (hasOverflowClass || hasScrollableContent || isKeyContent)) ||
                             (hasInlineMaxHeight && hasScrollableContent) ||
                             (hasOverflowClass && hasScrollableContent) ||
                             (isKeyContent && (hasMaxHeightClass || hasOverflowClass || hasScrollableContent))
      
      if (needsExpansion) {
        console.log(`📏 Expanding constrained element ${index + 1}:`, {
          element: el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''),
          hasMaxHeightClass,
          hasOverflowClass,
          hasInlineMaxHeight,
          hasScrollableContent,
          isEmailContent,
          isBattlePlanContent,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          textPreview: el.textContent?.substring(0, 100) + '...'
        })
        
        const originalClasses = el.className
        const originalStyles = storeOriginalStyles(el)
        
        modifiedElements.push({
          element: el,
          originalClasses,
          originalStyles
        })
        
        // Remove Tailwind height constraints
        if (hasMaxHeightClass) {
          const newClasses = Array.from(classList)
            .filter(cls => !cls.startsWith('max-h-') || cls === 'max-h-none' || cls === 'max-h-full')
            .concat(['max-h-none'])
            .join(' ')
          el.className = newClasses
          console.log(`📏 Updated classes: ${originalClasses} → ${newClasses}`)
        }
        
        // Remove overflow constraints
        if (hasOverflowClass) {
          el.classList.remove('overflow-y-auto', 'overflow-auto', 'overflow-y-scroll', 'overflow-hidden')
          el.classList.add('overflow-visible')
          console.log(`📏 Removed overflow constraints, added overflow-visible`)
        }
        
        // Remove inline height constraints
        if (hasInlineMaxHeight) {
          el.style.maxHeight = 'none'
          el.style.height = 'auto'
          console.log(`📏 Removed inline maxHeight: ${originalStyles.maxHeight} → none`)
        }
        
        // Ensure full content visibility
        el.style.overflow = 'visible'
        el.style.overflowY = 'visible'
        el.style.overflowX = 'visible'
        
        // For email content, ensure proper text wrapping
        if (isEmailContent) {
          el.style.whiteSpace = 'pre-wrap'
          el.style.wordBreak = 'break-word'
          console.log(`📧 Applied email-specific styling`)
        }
      }
    }
  })

  // Phase 3: Specific email template expansion
  console.log('📧 Phase 3: Targeting email templates specifically')
  
  const emailSelectors = [
    '[data-testid*="email"]',
    '.font-mono',
    '.whitespace-pre-wrap',
    '[class*="email"]',
    'div:has(> p:contains("Subject:"))',
    'div:has(> p:contains("From:"))'
  ]
  
  emailSelectors.forEach(selector => {
    try {
      const emailElements = element.querySelectorAll(selector)
      Array.from(emailElements).forEach((emailEl, index) => {
        if (emailEl instanceof HTMLElement && emailEl.scrollHeight > emailEl.clientHeight) {
          console.log(`📧 Found email element needing expansion (${selector}):`, {
            scrollHeight: emailEl.scrollHeight,
            clientHeight: emailEl.clientHeight,
            className: emailEl.className
          })
          
          // Check if already processed
          const alreadyProcessed = modifiedElements.some(item => item.element === emailEl)
          if (!alreadyProcessed) {
            const originalClasses = emailEl.className
            const originalStyles = storeOriginalStyles(emailEl)
            
            modifiedElements.push({
              element: emailEl,
              originalClasses,
              originalStyles
            })
            
            // Force expansion
            emailEl.style.maxHeight = 'none'
            emailEl.style.height = 'auto'
            emailEl.style.overflow = 'visible'
            emailEl.style.overflowY = 'visible'
            emailEl.classList.remove('overflow-y-auto', 'overflow-auto')
            emailEl.classList.add('overflow-visible')
            
            // Remove any max-height classes
            const newClasses = Array.from(emailEl.classList)
              .filter(cls => !cls.startsWith('max-h-') || cls === 'max-h-none')
              .concat(['max-h-none'])
              .join(' ')
            emailEl.className = newClasses
            
            console.log(`📧 Expanded email element: ${originalClasses} → ${newClasses}`)
          }
        }
      })
    } catch (error) {
      console.log(`📧 Selector ${selector} failed:`, error)
    }
  })

  console.log(`✅ Total elements modified for PDF expansion: ${modifiedElements.length}`)
  
  // Log summary of what was expanded
  const emailCount = modifiedElements.filter(item => 
    item.element.textContent?.includes('Subject:') || 
    item.element.classList.contains('font-mono')
  ).length
  const constrainedCount = modifiedElements.filter(item => 
    item.originalClasses.includes('max-h-') || 
    item.originalClasses.includes('overflow-y-auto')
  ).length
  
  console.log(`📊 Expansion summary: ${emailCount} email elements, ${constrainedCount} height-constrained elements`)
  
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
  console.log('🔍 Expanding remaining scrollable content areas')
  
  // This function is now primarily handled by expandCollapsedSections
  // but we keep it for any edge cases that might be missed
  
  const remainingScrollable = element.querySelectorAll('*')
  let additionalExpansions = 0
  
  Array.from(remainingScrollable).forEach((el) => {
    if (el instanceof HTMLElement) {
      const isAlreadyProcessed = modifiedElements.some(item => item.element === el)
      
      if (!isAlreadyProcessed && el.scrollHeight > el.clientHeight + 10) { // 10px tolerance
        console.log('🔍 Found additional scrollable content:', {
          element: el.tagName,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          className: el.className
        })
        
        const originalClasses = el.className
        const originalStyles = storeOriginalStyles(el)
        
        modifiedElements.push({
          element: el,
          originalClasses,
          originalStyles
        })
        
        // Apply expansion
        el.style.maxHeight = 'none'
        el.style.height = 'auto'
        el.style.overflow = 'visible'
        el.style.overflowY = 'visible'
        
        additionalExpansions++
      }
    }
  })
  
  console.log(`🔍 Additional scrollable content expanded: ${additionalExpansions} elements`)
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
  console.log('🔄 Restoring element states:', modifiedElements.length, 'elements')
  
  modifiedElements.forEach(({ element, originalClasses, originalStyles }, index) => {
    try {
      console.log(`🔄 Restoring element ${index + 1}:`, {
        element: element.tagName,
        originalClasses: originalClasses.substring(0, 50) + (originalClasses.length > 50 ? '...' : ''),
        currentClasses: element.className.substring(0, 50) + (element.className.length > 50 ? '...' : '')
      })
      
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
    } catch (error) {
      console.warn(`🔄 Failed to restore element ${index + 1}:`, error)
    }
  })
  
  console.log('✅ Element state restoration complete')
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
