
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
 * Comprehensively targets Battle Plan sections with height constraints
 * to ensure complete content visibility in PDF output.
 * 
 * @param element - Root element to search for collapsible sections
 * @returns Array of modified elements that need restoration
 */
export function expandCollapsedSections(element: HTMLElement): ElementState[] {
  const modifiedElements: ElementState[] = []

  console.log('🎯 Starting Battle Plan PDF expansion - comprehensive approach')

  // Phase 1: Force expand ALL Battle Plan containers
  console.log('⚔️ Phase 1: Force expanding Battle Plan containers')
  
  const battlePlanContainers = element.querySelectorAll('.border-l-4.border-red-500')
  console.log('⚔️ Found Battle Plan containers:', battlePlanContainers.length)
  
  battlePlanContainers.forEach((container, index) => {
    if (container instanceof HTMLElement) {
      console.log(`⚔️ Processing Battle Plan container ${index + 1}`)
      
      // Force expand the main Battle Plan container
      const containerState = forceExpandElement(container, modifiedElements, 'Battle Plan Container')
      if (containerState) modifiedElements.push(containerState)
      
      // Target specific Battle Plan sub-sections
      expandBattlePlanSubSections(container, modifiedElements)
    }
  })

  // Phase 2: Standard collapsible triggers
  const collapsibleTriggers = element.querySelectorAll('[data-state="closed"]')
  if (collapsibleTriggers.length > 0) {
    console.log('📂 Phase 2: Standard accordion sections:', collapsibleTriggers.length)
    Array.from(collapsibleTriggers).forEach((trigger, index) => {
      if (trigger instanceof HTMLElement) {
        console.log(`📂 Expanding accordion ${index + 1}`)
        trigger.click()
      }
    })
  }

  // Phase 3: Comprehensive height constraint removal
  console.log('📏 Phase 3: Comprehensive height constraint removal')
  removeAllHeightConstraints(element, modifiedElements)

  console.log(`✅ Total elements modified for PDF: ${modifiedElements.length}`)
  return modifiedElements
}

/**
 * Expands specific Battle Plan sub-sections with targeted logic
 */
function expandBattlePlanSubSections(battlePlanContainer: HTMLElement, modifiedElements: ElementState[]): void {
  console.log('🎯 Expanding Battle Plan sub-sections')

  // 1. Strategic Assessment Section (gradient background)
  const strategicSections = battlePlanContainer.querySelectorAll('.bg-gradient-to-r.from-indigo-50')
  console.log('📊 Strategic Assessment sections found:', strategicSections.length)
  
  strategicSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`📊 Expanding Strategic Assessment ${index + 1}`)
      const sectionState = forceExpandElement(section, modifiedElements, `Strategic Assessment ${index + 1}`)
      if (sectionState) modifiedElements.push(sectionState)
      
      // Expand all nested grid items and content
      expandNestedContent(section, modifiedElements, 'Strategic Assessment Child')
    }
  })

  // 2. "Why These Specific Actions" Section (emerald background)
  const whyActionsSections = battlePlanContainer.querySelectorAll('.bg-emerald-50')
  console.log('💡 Why These Actions sections found:', whyActionsSections.length)
  
  whyActionsSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`💡 Expanding Why These Actions ${index + 1}`)
      const sectionState = forceExpandElement(section, modifiedElements, `Why These Actions ${index + 1}`)
      if (sectionState) modifiedElements.push(sectionState)
      
      // Expand nested content
      expandNestedContent(section, modifiedElements, 'Why Actions Child')
    }
  })

  // 3. Email Template Sections (specific targeting)
  const emailSections = battlePlanContainer.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50')
  console.log('📧 Email template sections found:', emailSections.length)
  
  emailSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`📧 Expanding email section ${index + 1}`)
      const sectionState = forceExpandElement(section, modifiedElements, `Email Section ${index + 1}`)
      if (sectionState) modifiedElements.push(sectionState)
      
      // Specifically target email content areas
      expandEmailContent(section, modifiedElements)
    }
  })

  // 4. Timeline sections (red background)
  const timelineSections = battlePlanContainer.querySelectorAll('.bg-red-50')
  console.log('⏰ Timeline sections found:', timelineSections.length)
  
  timelineSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`⏰ Expanding timeline section ${index + 1}`)
      const sectionState = forceExpandElement(section, modifiedElements, `Timeline Section ${index + 1}`)
      if (sectionState) modifiedElements.push(sectionState)
      
      expandNestedContent(section, modifiedElements, 'Timeline Child')
    }
  })
}

/**
 * Force expands email content with specific height constraints 
 */
function expandEmailContent(container: HTMLElement, modifiedElements: ElementState[]): void {
  // Target email bodies with specific classes
  const emailBodies = container.querySelectorAll('.font-mono.whitespace-pre-wrap, .max-h-32, .max-h-40, .overflow-y-auto')
  
  console.log('📧 Email body elements found:', emailBodies.length)
  
  emailBodies.forEach((emailEl, index) => {
    if (emailEl instanceof HTMLElement) {
      console.log(`📧 Force expanding email body ${index + 1}:`, {
        classes: emailEl.className,
        scrollHeight: emailEl.scrollHeight,
        clientHeight: emailEl.clientHeight,
        offsetHeight: emailEl.offsetHeight
      })
      
      const emailState = forceExpandElement(emailEl, modifiedElements, `Email Body ${index + 1}`)
      if (emailState) modifiedElements.push(emailState)
    }
  })
}

/**
 * Expands nested content within a container
 */
function expandNestedContent(container: HTMLElement, modifiedElements: ElementState[], prefix: string): void {
  const nestedElements = container.querySelectorAll('*')
  
  Array.from(nestedElements).forEach((el, index) => {
    if (el instanceof HTMLElement && needsExpansion(el)) {
      const nestedState = forceExpandElement(el, modifiedElements, `${prefix} ${index + 1}`)
      if (nestedState) modifiedElements.push(nestedState)
    }
  })
}

/**
 * Determines if an element needs expansion based on height constraints
 */
function needsExpansion(element: HTMLElement): boolean {
  const classList = element.classList
  
  // Check for constraining classes
  const hasMaxHeightClass = Array.from(classList).some(cls => 
    cls.startsWith('max-h-') && !['max-h-none', 'max-h-full', 'max-h-screen'].includes(cls)
  )
  
  const hasOverflowClass = classList.contains('overflow-y-auto') || 
                           classList.contains('overflow-auto') ||
                           classList.contains('overflow-y-scroll') ||
                           classList.contains('overflow-hidden')
  
  const hasInlineConstraints = element.style.maxHeight && 
                               !['none', 'unset', 'auto'].includes(element.style.maxHeight)
  
  // Check if content is actually constrained
  const rect = element.getBoundingClientRect()
  const hasScrollableContent = element.scrollHeight > Math.max(element.clientHeight, element.offsetHeight, rect.height) + 2
  
  return hasMaxHeightClass || hasOverflowClass || hasInlineConstraints || hasScrollableContent
}

/**
 * Force expands a single element by removing all height constraints
 */
function forceExpandElement(element: HTMLElement, existingModified: ElementState[], logPrefix: string): ElementState | null {
  // Check if already processed
  const alreadyProcessed = existingModified.some(item => item.element === element)
  if (alreadyProcessed) {
    console.log(`⚠️ ${logPrefix}: Already processed, skipping`)
    return null
  }
  
  console.log(`🔧 ${logPrefix}: Force expanding`, {
    element: element.tagName,
    classes: element.className.substring(0, 100),
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    offsetHeight: element.offsetHeight
  })
  
  const originalClasses = element.className
  const originalStyles = storeOriginalStyles(element)
  
  // Remove ALL height constraining classes
  const heightClasses = ['max-h-32', 'max-h-40', 'max-h-20', 'max-h-24', 'max-h-48', 'max-h-16', 'max-h-12', 'max-h-64', 'max-h-96']
  const overflowClasses = ['overflow-y-auto', 'overflow-auto', 'overflow-y-scroll', 'overflow-hidden', 'overflow-y-hidden']
  
  heightClasses.forEach(cls => element.classList.remove(cls))
  overflowClasses.forEach(cls => element.classList.remove(cls))
  
  // Add expansion classes
  element.classList.add('max-h-none', 'overflow-visible')
  
  // Force inline styles
  element.style.maxHeight = 'none'
  element.style.height = 'auto'
  element.style.overflow = 'visible'
  element.style.overflowY = 'visible'
  element.style.overflowX = 'visible'
  
  // Special handling for grid containers
  if (element.classList.contains('grid')) {
    element.style.gridAutoRows = 'auto'
  }
  
  // Special handling for flex containers
  if (getComputedStyle(element).display.includes('flex')) {
    element.style.flexShrink = '0'
  }
  
  console.log(`✅ ${logPrefix}: Expansion complete`)
  
  return {
    element,
    originalClasses,
    originalStyles
  }
}

/**
 * Removes height constraints from all elements in the container
 */
function removeAllHeightConstraints(element: HTMLElement, modifiedElements: ElementState[]): void {
  const allElements = element.querySelectorAll('*')
  let additionalExpansions = 0
  
  Array.from(allElements).forEach((el) => {
    if (el instanceof HTMLElement && needsExpansion(el)) {
      const expandState = forceExpandElement(el, modifiedElements, 'Global Constraint Removal')
      if (expandState) {
        modifiedElements.push(expandState)
        additionalExpansions++
      }
    }
  })
  
  console.log(`📏 Additional height constraints removed: ${additionalExpansions} elements`)
}

/**
 * Expands scrollable content areas for complete PDF capture
 */
export function expandScrollableContent(element: HTMLElement, modifiedElements: ElementState[]): void {
  console.log('🔍 Final scrollable content check')
  
  const remainingScrollable = element.querySelectorAll('*')
  let additionalExpansions = 0
  
  Array.from(remainingScrollable).forEach((el) => {
    if (el instanceof HTMLElement) {
      const isAlreadyProcessed = modifiedElements.some(item => item.element === el)
      
      if (!isAlreadyProcessed && el.scrollHeight > el.clientHeight + 10) {
        console.log('🔍 Found missed scrollable content:', {
          element: el.tagName,
          classes: el.className.substring(0, 50),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight
        })
        
        const scrollState = forceExpandElement(el, modifiedElements, 'Final Scrollable Check')
        if (scrollState) {
          modifiedElements.push(scrollState)
          additionalExpansions++
        }
      }
    }
  })
  
  console.log(`🔍 Final scrollable expansion: ${additionalExpansions} elements`)
}

/**
 * Restores all modified elements to their original state
 */
export function restoreElementStates(modifiedElements: ElementState[]): void {
  console.log('🔄 Restoring element states:', modifiedElements.length, 'elements')
  
  modifiedElements.forEach(({ element, originalClasses, originalStyles }, index) => {
    try {
      console.log(`🔄 Restoring element ${index + 1}:`, {
        element: element.tagName,
        from: element.className.substring(0, 30) + '...',
        to: originalClasses.substring(0, 30) + '...'
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
 * Stores original styles for restoration
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
    flexShrink: element.style.flexShrink,
    wordBreak: element.style.wordBreak,
    hyphens: element.style.hyphens,
    whiteSpace: element.style.whiteSpace,
    flexWrap: element.style.flexWrap,
    display: element.style.display,
    gridAutoRows: element.style.gridAutoRows
  }
}
