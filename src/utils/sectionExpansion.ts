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

  console.log('🎯 Starting Battle Plan PDF expansion - Enhanced Phase 3')

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
      
      // Target specific Battle Plan sub-sections with CORRECTED selectors
      expandBattlePlanSubSections(container, modifiedElements)
      
      // RECURSIVE BRUTE FORCE: Expand ALL child elements regardless of selectors
      forceExpandAllChildren(container, modifiedElements)
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

  // Phase 3: Global height constraint removal with enhanced detection
  console.log('📏 Phase 3: Global height constraint removal')
  removeAllHeightConstraints(element, modifiedElements)

  console.log(`✅ Total elements modified for PDF: ${modifiedElements.length}`)
  return modifiedElements
}

/**
 * RECURSIVE BRUTE FORCE: Expands ALL child elements within a container
 * This ensures nothing is missed regardless of CSS selector matching
 */
function forceExpandAllChildren(container: HTMLElement, modifiedElements: ElementState[]): void {
  console.log('🔥 BRUTE FORCE: Expanding all children in Battle Plan container')
  
  const allChildren = container.querySelectorAll('*')
  let childExpansions = 0
  
  Array.from(allChildren).forEach((child, index) => {
    if (child instanceof HTMLElement) {
      // Skip if already processed
      const alreadyProcessed = modifiedElements.some(item => item.element === child)
      if (alreadyProcessed) return
      
      // Force expand ANY element with potential height constraints
      if (hasAnyHeightConstraint(child)) {
        console.log(`🔥 Brute force expanding child ${index + 1}:`, {
          element: child.tagName,
          classes: child.className.substring(0, 50),
          scrollHeight: child.scrollHeight,
          clientHeight: child.clientHeight
        })
        
        const childState = forceExpandElement(child, modifiedElements, `Brute Force Child ${index + 1}`)
        if (childState) {
          modifiedElements.push(childState)
          childExpansions++
        }
      }
    }
  })
  
  console.log(`🔥 Brute force expanded ${childExpansions} additional elements`)
}

/**
 * Enhanced detection for ANY height constraint
 */
function hasAnyHeightConstraint(element: HTMLElement): boolean {
  const classList = element.classList
  const computedStyle = getComputedStyle(element)
  
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
  
  // Check computed styles
  const hasComputedMaxHeight = computedStyle.maxHeight && 
                               !['none', 'unset', 'auto'].includes(computedStyle.maxHeight)
  
  // Check if content is actually constrained (more lenient detection)
  const hasScrollableContent = element.scrollHeight > Math.max(element.clientHeight, element.offsetHeight) + 1
  
  // Special detection for empty or zero-height elements that might expand
  const mightHaveHiddenContent = element.children.length > 0 && element.clientHeight < 50
  
  return hasMaxHeightClass || hasOverflowClass || hasInlineConstraints || 
         hasComputedMaxHeight || hasScrollableContent || mightHaveHiddenContent
}

/**
 * PHASE 2: Enhanced Battle Plan sub-sections expansion with aggressive text optimization
 */
function expandBattlePlanSubSections(battlePlanContainer: HTMLElement, modifiedElements: ElementState[]): void {
  console.log('🎯 PHASE 2: Enhanced Battle Plan expansion with aggressive text optimization')

  // 1. Strategic Intelligence & Approach Section - CORRECTED SELECTOR
  const strategicIntelligenceSections = battlePlanContainer.querySelectorAll('.bg-gradient-to-r.from-indigo-50.via-blue-50.to-purple-50')
  console.log('📊 Strategic Intelligence sections found:', strategicIntelligenceSections.length)
  
  strategicIntelligenceSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`📊 Expanding Strategic Intelligence ${index + 1}`)
      const sectionState = forceExpandElement(section, modifiedElements, `Strategic Intelligence ${index + 1}`)
      if (sectionState) modifiedElements.push(sectionState)
      
      // Expand all nested content including Strategic Assessment
      expandNestedContent(section, modifiedElements, 'Strategic Intelligence Child')
      
      // SPECIFIC: Target Strategic Assessment nested inside
      const strategicAssessmentSections = section.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50')
      console.log(`📊 Strategic Assessment sections found in container ${index + 1}:`, strategicAssessmentSections.length)
      strategicAssessmentSections.forEach((assessment, aIndex) => {
        if (assessment instanceof HTMLElement) {
          console.log(`📊 Expanding Strategic Assessment ${aIndex + 1}`)
          const assessmentState = forceExpandElement(assessment, modifiedElements, `Strategic Assessment ${aIndex + 1}`)
          if (assessmentState) modifiedElements.push(assessmentState)
        }
      })
    }
  })

  // 2. "Why These Specific Actions" Section - EXACT MATCH
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

  // 3. Email Template Sections - CORRECTED SELECTORS
  const emailTemplateSections = battlePlanContainer.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50')
  console.log('📧 Email template sections found:', emailTemplateSections.length)
  
  emailTemplateSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`📧 Expanding email template section ${index + 1}`)
      const sectionState = forceExpandElement(section, modifiedElements, `Email Template Section ${index + 1}`)
      if (sectionState) modifiedElements.push(sectionState)
      
      // Specifically target email content areas
      expandEmailContent(section, modifiedElements)
    }
  })

  // 4. Action Details Sections - NEW
  const actionDetailsSections = battlePlanContainer.querySelectorAll('.bg-gradient-to-r.from-slate-50.to-gray-50')
  console.log('📋 Action details sections found:', actionDetailsSections.length)
  
  actionDetailsSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      console.log(`📋 Expanding action details section ${index + 1}`)
      const sectionState = forceExpandElement(section, modifiedElements, `Action Details Section ${index + 1}`)
      if (sectionState) modifiedElements.push(sectionState)
      
      expandNestedContent(section, modifiedElements, 'Action Details Child')
    }
  })

  // 5. Timeline sections
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

  // PHASE 2: CRITICAL - Enhanced email bodies and text containers with aggressive optimization
  const textContainerSelectors = [
    '.font-mono.whitespace-pre-wrap',
    '.max-h-32',
    '.max-h-40', 
    '.overflow-y-auto',
    '[class*="max-h-"]',
    '[class*="overflow-"]',
    // PHASE 2: Additional selectors for concern/signal containers
    '.border-l-4 .space-y-4',
    '.space-y-4 > div',
    '.flex.flex-col.space-y-2'
  ]
  
  textContainerSelectors.forEach(selector => {
    const elements = battlePlanContainer.querySelectorAll(selector)
    console.log(`📧 PHASE 2: Text containers found with selector "${selector}":`, elements.length)
    
    elements.forEach((element, index) => {
      if (element instanceof HTMLElement) {
        console.log(`📧 PHASE 2: Aggressively optimizing text container ${index + 1}:`, {
          selector,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          textContent: element.textContent?.substring(0, 50) + '...'
        })
        
        const containerState = forceExpandElementWithTextOptimization(element, modifiedElements, `Text Container ${selector} ${index + 1}`)
        if (containerState) modifiedElements.push(containerState)
      }
    })
  })

  // PHASE 2: Specific targeting for "Concerns to Address" and similar sections
  const concernSections = battlePlanContainer.querySelectorAll('[class*="border-l-4"]')
  console.log('🎯 PHASE 2: Concern/Signal sections found:', concernSections.length)
  
  concernSections.forEach((section, index) => {
    if (section instanceof HTMLElement) {
      // Look for text content that suggests this is a concerns section
      const textContent = section.textContent || ''
      if (textContent.includes('Concerns to Address') || 
          textContent.includes('Buying Signals') || 
          textContent.includes('Pain Points')) {
        
        console.log(`🎯 PHASE 2: Processing section with concerns/signals ${index + 1}`)
        
        // Aggressively expand the section container
        const sectionState = forceExpandElementWithTextOptimization(section, modifiedElements, `Concerns Section ${index + 1}`)
        if (sectionState) modifiedElements.push(sectionState)
        
        // Target all child text elements within this section
        const childTextElements = section.querySelectorAll('div, p, span')
        childTextElements.forEach((child, cIndex) => {
          if (child instanceof HTMLElement && child.textContent && child.textContent.trim().length > 0) {
            const childState = forceExpandElementWithTextOptimization(child, modifiedElements, `Concerns Child ${index + 1}-${cIndex + 1}`)
            if (childState) modifiedElements.push(childState)
          }
        })
      }
    }
  })

  // Fallback: Find elements by text content when CSS selectors fail
  console.log('🔍 Running content-based fallback detection')
  findElementsByContent(battlePlanContainer, modifiedElements)
}

/**
 * PHASE 2: Enhanced element expansion with aggressive text optimization for section preservation
 */
function forceExpandElementWithTextOptimization(element: HTMLElement, existingModified: ElementState[], logPrefix: string): ElementState | null {
  // Check if already processed
  const alreadyProcessed = existingModified.some(item => item.element === element)
  if (alreadyProcessed) {
    console.log(`⚠️ ${logPrefix}: Already processed, skipping`)
    return null
  }
  
  console.log(`🔧 PHASE 2: Force expanding with text optimization`, {
    element: element.tagName,
    classes: element.className.substring(0, 100),
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    offsetHeight: element.offsetHeight,
    hasTextContent: (element.textContent?.length || 0) > 0
  })
  
  const originalClasses = element.className
  const originalStyles = storeOriginalStyles(element)
  
  // PHASE 1: Remove ALL height constraining classes (comprehensive list)
  const heightClasses = [
    'max-h-0', 'max-h-1', 'max-h-2', 'max-h-3', 'max-h-4', 'max-h-5', 'max-h-6', 'max-h-7', 'max-h-8', 'max-h-9',
    'max-h-10', 'max-h-11', 'max-h-12', 'max-h-14', 'max-h-16', 'max-h-20', 'max-h-24', 'max-h-28', 'max-h-32',
    'max-h-36', 'max-h-40', 'max-h-44', 'max-h-48', 'max-h-52', 'max-h-56', 'max-h-60', 'max-h-64', 'max-h-72',
    'max-h-80', 'max-h-96', 'max-h-px'
  ]
  const overflowClasses = ['overflow-y-auto', 'overflow-auto', 'overflow-y-scroll', 'overflow-hidden', 'overflow-y-hidden', 'overflow-x-hidden']
  
  heightClasses.forEach(cls => element.classList.remove(cls))
  overflowClasses.forEach(cls => element.classList.remove(cls))
  
  // Add expansion classes
  element.classList.add('max-h-none', 'overflow-visible')
  
  // PHASE 2: AGGRESSIVE text optimization with enhanced CSS properties
  element.style.setProperty('max-height', 'none', 'important')
  element.style.setProperty('height', 'auto', 'important')
  element.style.setProperty('overflow', 'visible', 'important')
  element.style.setProperty('overflow-y', 'visible', 'important')
  element.style.setProperty('overflow-x', 'visible', 'important')
  
  // PHASE 2: Aggressive text wrapping and spacing optimization
  element.style.setProperty('white-space', 'normal', 'important')
  element.style.setProperty('word-wrap', 'break-word', 'important')
  element.style.setProperty('overflow-wrap', 'break-word', 'important')
  element.style.setProperty('hyphens', 'auto', 'important')
  element.style.setProperty('line-height', '1.5', 'important')
  
  // PHASE 2: Enhanced width management for text containers
  if (element.textContent && element.textContent.length > 50) {
    element.style.setProperty('max-width', '100%', 'important')
    element.style.setProperty('width', 'auto', 'important')
    element.style.setProperty('min-width', '0', 'important')
  }
  
  // Special handling for different display types
  const computedStyle = getComputedStyle(element)
  if (element.classList.contains('grid') || computedStyle.display.includes('grid')) {
    element.style.setProperty('grid-auto-rows', 'auto', 'important')
    element.style.setProperty('align-content', 'start', 'important')
  }
  
  if (computedStyle.display.includes('flex')) {
    element.style.setProperty('flex-shrink', '0', 'important')
    element.style.setProperty('align-items', 'start', 'important')
    element.style.setProperty('flex-wrap', 'wrap', 'important')
  }
  
  // PHASE 2: Force visibility and proper display
  element.style.setProperty('visibility', 'visible', 'important')
  element.style.setProperty('display', element.style.display || computedStyle.display, 'important')
  
  console.log(`✅ PHASE 2: Text-optimized expansion complete`, {
    newScrollHeight: element.scrollHeight,
    newClientHeight: element.clientHeight,
    newOffsetHeight: element.offsetHeight,
    textOptimizationApplied: true
  })
  
  return {
    element,
    originalClasses,
    originalStyles
  }
}

/**
 * Fallback: Find elements by text content when CSS selectors fail
 */
function findElementsByContent(container: HTMLElement, modifiedElements: ElementState[]): void {
  const targetTexts = [
    'Strategic Intelligence',
    'Strategic Assessment', 
    'Why These Specific Actions',
    'Email Template',
    'Subject Line',
    'Email Content'
  ]
  
  targetTexts.forEach(targetText => {
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
    )
    
    let node
    while (node = walker.nextNode()) {
      if (node.textContent?.includes(targetText)) {
        let parentElement = node.parentElement
        while (parentElement && parentElement !== container) {
          if (parentElement instanceof HTMLElement && hasAnyHeightConstraint(parentElement)) {
            const fallbackState = forceExpandElement(parentElement, modifiedElements, `Content Fallback: ${targetText}`)
            if (fallbackState) {
              modifiedElements.push(fallbackState)
              console.log(`🔍 Found by content: ${targetText}`)
              break
            }
          }
          parentElement = parentElement.parentElement
        }
      }
    }
  })
}

/**
 * Force expands email content with enhanced targeting
 */
function expandEmailContent(container: HTMLElement, modifiedElements: ElementState[]): void {
  // Target email bodies with ALL possible selectors
  const emailSelectors = [
    '.font-mono.whitespace-pre-wrap',
    '.max-h-32',
    '.max-h-40', 
    '.overflow-y-auto',
    '[class*="max-h-"]',
    '[class*="overflow-"]'
  ]
  
  emailSelectors.forEach(selector => {
    const emailElements = container.querySelectorAll(selector)
    console.log(`📧 Email elements found with selector "${selector}":`, emailElements.length)
    
    emailElements.forEach((emailEl, index) => {
      if (emailEl instanceof HTMLElement) {
        const emailState = forceExpandElement(emailEl, modifiedElements, `Email Content ${selector} ${index + 1}`)
        if (emailState) modifiedElements.push(emailState)
      }
    })
  })
}

/**
 * Expands nested content within a container
 */
function expandNestedContent(container: HTMLElement, modifiedElements: ElementState[], prefix: string): void {
  const nestedElements = container.querySelectorAll('*')
  
  Array.from(nestedElements).forEach((el, index) => {
    if (el instanceof HTMLElement && hasAnyHeightConstraint(el)) {
      const nestedState = forceExpandElement(el, modifiedElements, `${prefix} ${index + 1}`)
      if (nestedState) modifiedElements.push(nestedState)
    }
  })
}

/**
 * Force expands a single element by removing all height constraints
 * SIMPLIFIED: Focus only on height/overflow expansion, not text styling
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
  
  // Remove ALL height constraining classes (comprehensive list)
  const heightClasses = [
    'max-h-0', 'max-h-1', 'max-h-2', 'max-h-3', 'max-h-4', 'max-h-5', 'max-h-6', 'max-h-7', 'max-h-8', 'max-h-9',
    'max-h-10', 'max-h-11', 'max-h-12', 'max-h-14', 'max-h-16', 'max-h-20', 'max-h-24', 'max-h-28', 'max-h-32',
    'max-h-36', 'max-h-40', 'max-h-44', 'max-h-48', 'max-h-52', 'max-h-56', 'max-h-60', 'max-h-64', 'max-h-72',
    'max-h-80', 'max-h-96', 'max-h-px'
  ]
  const overflowClasses = ['overflow-y-auto', 'overflow-auto', 'overflow-y-scroll', 'overflow-hidden', 'overflow-y-hidden', 'overflow-x-hidden']
  
  heightClasses.forEach(cls => element.classList.remove(cls))
  overflowClasses.forEach(cls => element.classList.remove(cls))
  
  // Add expansion classes
  element.classList.add('max-h-none', 'overflow-visible')
  
  // Force inline styles with !important - SIMPLIFIED VERSION
  element.style.setProperty('max-height', 'none', 'important')
  element.style.setProperty('height', 'auto', 'important')
  element.style.setProperty('overflow', 'visible', 'important')
  element.style.setProperty('overflow-y', 'visible', 'important')
  element.style.setProperty('overflow-x', 'visible', 'important')
  
  // Special handling for different display types
  const computedStyle = getComputedStyle(element)
  if (element.classList.contains('grid') || computedStyle.display.includes('grid')) {
    element.style.setProperty('grid-auto-rows', 'auto', 'important')
    element.style.setProperty('align-content', 'start', 'important')
  }
  
  if (computedStyle.display.includes('flex')) {
    element.style.setProperty('flex-shrink', '0', 'important')
    element.style.setProperty('align-items', 'start', 'important')
  }
  
  // Force visibility
  element.style.setProperty('visibility', 'visible', 'important')
  element.style.setProperty('display', element.style.display || computedStyle.display, 'important')
  
  console.log(`✅ ${logPrefix}: Expansion complete`, {
    newScrollHeight: element.scrollHeight,
    newClientHeight: element.clientHeight,
    newOffsetHeight: element.offsetHeight
  })
  
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
    if (el instanceof HTMLElement && hasAnyHeightConstraint(el)) {
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
  console.log('🔍 Final scrollable content check with enhanced detection')
  
  const remainingScrollable = element.querySelectorAll('*')
  let additionalExpansions = 0
  
  Array.from(remainingScrollable).forEach((el) => {
    if (el instanceof HTMLElement) {
      const isAlreadyProcessed = modifiedElements.some(item => item.element === el)
      
      if (!isAlreadyProcessed && (el.scrollHeight > el.clientHeight + 1 || hasAnyHeightConstraint(el))) {
        console.log('🔍 Found missed scrollable content:', {
          element: el.tagName,
          classes: el.className.substring(0, 50),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          offsetHeight: el.offsetHeight
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
    gridAutoRows: element.style.gridAutoRows,
    visibility: element.style.visibility,
    alignContent: element.style.alignContent,
    alignItems: element.style.alignItems,
    overflowWrap: element.style.overflowWrap,
    lineHeight: element.style.lineHeight,
    boxSizing: element.style.boxSizing
  }
}
