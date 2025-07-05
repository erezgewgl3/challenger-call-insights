
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

  // Phase 2: Target Battle Plan specific sections
  console.log('⚔️ Phase 2: Expanding Battle Plan sections specifically')
  
  // Strategic Assessment section
  const strategicAssessments = element.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50, [class*="strategic"], [class*="assessment"]')
  Array.from(strategicAssessments).forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`⚔️ Found Strategic Assessment section ${index + 1}:`, {
        tagName: section.tagName,
        className: section.className.substring(0, 100) + '...',
        scrollHeight: section.scrollHeight,
        clientHeight: section.clientHeight
      })
      
      if (section.scrollHeight > section.clientHeight + 5) {
        const originalClasses = section.className
        const originalStyles = storeOriginalStyles(section)
        
        modifiedElements.push({
          element: section,
          originalClasses,
          originalStyles
        })
        
        // Remove height constraints
        section.style.maxHeight = 'none'
        section.style.height = 'auto'
        section.style.overflow = 'visible'
        section.style.overflowY = 'visible'
        
        // Update classes
        const newClasses = Array.from(section.classList)
          .filter(cls => !cls.startsWith('max-h-') || cls === 'max-h-none')
          .concat(['max-h-none', 'overflow-visible'])
          .join(' ')
        section.className = newClasses
        
        console.log(`⚔️ Expanded Strategic Assessment: ${originalClasses.substring(0, 50)}... → ${newClasses.substring(0, 50)}...`)
      }
    }
  })

  // "Why These Specific Actions" section
  const whyActionsSection = element.querySelector('.bg-emerald-50')
  if (whyActionsSection instanceof HTMLElement) {
    console.log('💡 Found "Why These Specific Actions" section:', {
      scrollHeight: whyActionsSection.scrollHeight,
      clientHeight: whyActionsSection.clientHeight,
      className: whyActionsSection.className
    })
    
    if (whyActionsSection.scrollHeight > whyActionsSection.clientHeight + 5) {
      const originalClasses = whyActionsSection.className
      const originalStyles = storeOriginalStyles(whyActionsSection)
      
      modifiedElements.push({
        element: whyActionsSection,
        originalClasses,
        originalStyles
      })
      
      // Expand the section
      whyActionsSection.style.maxHeight = 'none'
      whyActionsSection.style.height = 'auto'
      whyActionsSection.style.overflow = 'visible'
      whyActionsSection.style.overflowY = 'visible'
      
      console.log('💡 Expanded "Why These Specific Actions" section')
    }
  }

  // Phase 3: Email Template sections specifically
  console.log('📧 Phase 3: Targeting email templates in Battle Plan')
  
  // Look for email template containers in Battle Plan
  const emailContainers = element.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50, .bg-blue-50, [class*="email"]')
  Array.from(emailContainers).forEach((container, index) => {
    if (container instanceof HTMLElement) {
      // Find email content within containers
      const emailElements = container.querySelectorAll('.font-mono, .whitespace-pre-wrap, .max-h-32, .max-h-40, .overflow-y-auto')
      
      Array.from(emailElements).forEach((emailEl, emailIndex) => {
        if (emailEl instanceof HTMLElement && emailEl.scrollHeight > emailEl.clientHeight + 5) {
          console.log(`📧 Found constrained email element ${index + 1}.${emailIndex + 1}:`, {
            tagName: emailEl.tagName,
            className: emailEl.className.substring(0, 80) + '...',
            scrollHeight: emailEl.scrollHeight,
            clientHeight: emailEl.clientHeight,
            textPreview: emailEl.textContent?.substring(0, 50) + '...'
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
            
            // Remove all height and overflow constraints
            emailEl.style.maxHeight = 'none'
            emailEl.style.height = 'auto'
            emailEl.style.overflow = 'visible'
            emailEl.style.overflowY = 'visible'
            emailEl.style.overflowX = 'visible'
            
            // Remove constraining classes and add expansion classes
            emailEl.classList.remove('max-h-32', 'max-h-40', 'max-h-20', 'max-h-24', 'max-h-48')
            emailEl.classList.remove('overflow-y-auto', 'overflow-auto', 'overflow-hidden')
            emailEl.classList.add('max-h-none', 'overflow-visible')
            
            // Ensure proper text display for email content
            if (emailEl.classList.contains('font-mono') || emailEl.classList.contains('whitespace-pre-wrap')) {
              emailEl.style.whiteSpace = 'pre-wrap'
              emailEl.style.wordBreak = 'break-word'
            }
            
            console.log(`📧 Expanded email element: removed height constraints`)
          }
        }
      })
    }
  })

  // Phase 4: Comprehensive height constraint removal for remaining elements
  console.log('📏 Phase 4: Comprehensive height constraint removal')
  
  const allElements = element.querySelectorAll('*')
  
  Array.from(allElements).forEach((el) => {
    if (el instanceof HTMLElement) {
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
      
      // Check if element has scrollable content
      const hasScrollableContent = el.scrollHeight > el.clientHeight + 5 // 5px tolerance
      
      // Special targeting for Battle Plan content
      const isBattlePlanContent = el.closest('.border-l-4.border-red-500') ||
                                  el.closest('[class*="battle"]') ||
                                  el.closest('[class*="strategic"]') ||
                                  el.closest('[class*="assessment"]') ||
                                  el.closest('.bg-emerald-50')
      
      // Determine if element needs expansion
      const needsExpansion = (hasMaxHeightClass && (hasOverflowClass || hasScrollableContent || isBattlePlanContent)) ||
                             (hasInlineMaxHeight && hasScrollableContent) ||
                             (hasOverflowClass && hasScrollableContent && isBattlePlanContent)
      
      if (needsExpansion) {
        // Check if already processed
        const alreadyProcessed = modifiedElements.some(item => item.element === el)
        if (!alreadyProcessed) {
          console.log(`📏 Expanding constrained Battle Plan element:`, {
            element: el.tagName + (el.className ? '.' + el.className.split(' ').slice(0, 3).join('.') : ''),
            hasMaxHeightClass,
            hasOverflowClass,
            hasInlineMaxHeight,
            hasScrollableContent,
            isBattlePlanContent,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight
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
            el.classList.remove('max-h-32', 'max-h-40', 'max-h-20', 'max-h-24', 'max-h-48', 'max-h-16', 'max-h-12')
            el.classList.add('max-h-none')
          }
          
          // Remove overflow constraints
          if (hasOverflowClass) {
            el.classList.remove('overflow-y-auto', 'overflow-auto', 'overflow-y-scroll', 'overflow-hidden')
            el.classList.add('overflow-visible')
          }
          
          // Remove inline height constraints
          if (hasInlineMaxHeight) {
            el.style.maxHeight = 'none'
            el.style.height = 'auto'
          }
          
          // Ensure full content visibility
          el.style.overflow = 'visible'
          el.style.overflowY = 'visible'
          el.style.overflowX = 'visible'
        }
      }
    }
  })

  console.log(`✅ Total elements modified for PDF expansion: ${modifiedElements.length}`)
  
  // Log summary of what was expanded
  const battlePlanCount = modifiedElements.filter(item => 
    item.element.closest('.border-l-4.border-red-500') ||
    item.originalClasses.includes('bg-emerald-50') ||
    item.originalClasses.includes('bg-gradient-to-r')
  ).length
  const emailCount = modifiedElements.filter(item => 
    item.element.classList.contains('font-mono') ||
    item.originalClasses.includes('font-mono')
  ).length
  
  console.log(`📊 Expansion summary: ${battlePlanCount} Battle Plan elements, ${emailCount} email elements`)
  
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
