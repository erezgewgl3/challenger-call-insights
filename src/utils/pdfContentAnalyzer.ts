/**
 * PDF Content Analyzer - Smart page break detection
 * Analyzes DOM structure to find logical content boundaries
 */

export interface ContentSection {
  element: HTMLElement
  startY: number
  height: number
  priority: 'must-keep-together' | 'prefer-together' | 'splittable'
  type: 'hero' | 'battle-plan' | 'action-item' | 'stakeholder' | 'expandable' | 'card' | 'section'
  id: string
}

/**
 * Analyzes HTML content to identify logical sections and their boundaries
 */
export function analyzeContentForPDF(element: HTMLElement): ContentSection[] {
  const sections: ContentSection[] = []
  let currentY = 0

  // Recursively scan all children looking for semantic boundaries
  function scanElement(el: HTMLElement, depth: number = 0) {
    const rect = el.getBoundingClientRect()
    const parentRect = element.getBoundingClientRect()
    const relativeY = rect.top - parentRect.top + element.scrollTop
    
    // Detect section type and priority based on classes and structure
    const classList = Array.from(el.classList)
    
    // Check for explicit PDF boundary markers
    if (classList.includes('pdf-keep-together') || classList.includes('pdf-section-boundary')) {
      sections.push({
        element: el,
        startY: pixelsToMM(relativeY, 1), // No scale factor for DOM measurements
        height: pixelsToMM(rect.height, 1),
        priority: 'must-keep-together',
        type: detectSectionType(el),
        id: el.id || `section-${sections.length}`
      })
      return // Don't scan children of boundary-marked elements
    }
    
    // Auto-detect important sections
    if (
      el.tagName === 'SECTION' ||
      classList.some(c => c.includes('section')) ||
      classList.some(c => c.includes('card') || c.includes('Card'))
    ) {
      const priority = determinePriority(el)
      sections.push({
        element: el,
        startY: pixelsToMM(relativeY, 1), // No scale factor for DOM measurements
        height: pixelsToMM(rect.height, 1),
        priority,
        type: detectSectionType(el),
        id: el.id || `auto-section-${sections.length}`
      })
      
      // For splittable sections, scan children
      if (priority === 'splittable') {
        Array.from(el.children).forEach(child => {
          if (child instanceof HTMLElement) {
            scanElement(child, depth + 1)
          }
        })
      }
      return
    }
    
    // Continue scanning children for non-section elements
    Array.from(el.children).forEach(child => {
      if (child instanceof HTMLElement) {
        scanElement(child, depth + 1)
      }
    })
  }

  scanElement(element)
  
  console.log('PDF Content Analysis:', {
    totalSections: sections.length,
    mustKeepTogether: sections.filter(s => s.priority === 'must-keep-together').length,
    preferTogether: sections.filter(s => s.priority === 'prefer-together').length,
    splittable: sections.filter(s => s.priority === 'splittable').length
  })
  
  return sections.sort((a, b) => a.startY - b.startY)
}

/**
 * Detects section type based on content and structure
 */
function detectSectionType(el: HTMLElement): ContentSection['type'] {
  const classList = Array.from(el.classList).join(' ').toLowerCase()
  const id = (el.id || '').toLowerCase()
  
  if (classList.includes('hero') || id.includes('hero')) return 'hero'
  if (classList.includes('battle') || classList.includes('action')) return 'battle-plan'
  if (classList.includes('stakeholder')) return 'stakeholder'
  if (classList.includes('expandable') || classList.includes('collapsible')) return 'expandable'
  if (classList.includes('card')) return 'card'
  
  return 'section'
}

/**
 * Determines content priority for page break decisions
 */
function determinePriority(el: HTMLElement): ContentSection['priority'] {
  const height = el.getBoundingClientRect().height
  const classList = Array.from(el.classList).join(' ').toLowerCase()
  
  // Small elements should always stay together
  if (height < 150) return 'must-keep-together'
  
  // Action items, email templates, and small cards must stay together
  if (
    classList.includes('action-item') ||
    classList.includes('email-template') ||
    classList.includes('stakeholder') ||
    (classList.includes('card') && height < 300)
  ) {
    return 'must-keep-together'
  }
  
  // Medium sections prefer to stay together but can split if needed
  if (height < 500 && (
    classList.includes('card') ||
    classList.includes('section')
  )) {
    return 'prefer-together'
  }
  
  // Large expandable sections can be split
  return 'splittable'
}

/**
 * Calculates optimal page break positions using greedy algorithm
 * Respects content boundaries and priorities
 */
export function calculateOptimalPageBreaks(
  sections: ContentSection[],
  pageHeightMM: number,
  headerHeightMM: number = 60
): number[] {
  const breakPoints: number[] = []
  const firstPageAvailable = pageHeightMM - headerHeightMM
  const subsequentPageAvailable = pageHeightMM - 30 // Smaller header for continuation pages
  
  let currentPageStart = 0
  let currentPageAvailable = firstPageAvailable
  let isFirstPage = true
  
  console.log('Calculating optimal page breaks:', {
    totalSections: sections.length,
    firstPageAvailable,
    subsequentPageAvailable,
    pageHeightMM
  })
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    // Section dimensions are already in MM from DOM scanning
    const sectionHeightMM = section.height
    const sectionStartMM = section.startY
    const relativeStartMM = sectionStartMM - currentPageStart
    const sectionEndMM = relativeStartMM + sectionHeightMM
    
    // Check if section fits in current page
    if (sectionEndMM <= currentPageAvailable) {
      // Section fits, continue
      continue
    }
    
    // Section doesn't fit - decide on break strategy based on priority
    if (section.priority === 'must-keep-together') {
      // Force page break before this section if it's not too large
      if (sectionHeightMM < currentPageAvailable * 0.9) {
        // Add break before this section
        breakPoints.push(sectionStartMM)
        currentPageStart = sectionStartMM
        currentPageAvailable = isFirstPage ? subsequentPageAvailable : subsequentPageAvailable
        isFirstPage = false
        
        console.log(`Page break before ${section.type} (must-keep-together):`, {
          breakAtMM: sectionStartMM,
          sectionHeight: sectionHeightMM
        })
      } else {
        // Section too large, will span pages anyway
        console.log(`Large section spans pages: ${section.type}`, { sectionHeightMM })
      }
    } else if (section.priority === 'prefer-together' && sectionHeightMM < currentPageAvailable * 0.75) {
      // Prefer to keep together if reasonable
      breakPoints.push(sectionStartMM)
      currentPageStart = sectionStartMM
      currentPageAvailable = subsequentPageAvailable
      isFirstPage = false
      
      console.log(`Page break before ${section.type} (prefer-together):`, {
        breakAtMM: sectionStartMM
      })
    } else {
      // Splittable or too large - let it span pages
      // Calculate next natural break point
      const overhang = sectionEndMM - currentPageAvailable
      if (overhang > subsequentPageAvailable * 0.5) {
        // Need multiple pages for this section
        const naturalBreak = sectionStartMM + currentPageAvailable
        breakPoints.push(naturalBreak)
        currentPageStart = naturalBreak
        currentPageAvailable = subsequentPageAvailable
        isFirstPage = false
        
        console.log(`Mid-section break for large ${section.type}:`, {
          breakAtMM: naturalBreak
        })
      }
    }
  }
  
  console.log('Final break points:', breakPoints)
  return breakPoints
}

/**
 * Converts pixels to millimeters accounting for canvas scale factor
 * @param pixels - Pixel value from canvas
 * @param scale - Canvas scale factor (default 3 for html2canvas)
 */
function pixelsToMM(pixels: number, scale: number = 3): number {
  return (pixels / scale) * 0.264583
}

/**
 * Identifies section by its position for continuation labels
 */
export function identifySectionAtPosition(
  sections: ContentSection[],
  positionMM: number
): ContentSection | null {
  const positionPx = positionMM / 0.264583
  
  for (const section of sections) {
    if (positionPx >= section.startY && positionPx < section.startY + section.height) {
      return section
    }
  }
  
  return null
}
