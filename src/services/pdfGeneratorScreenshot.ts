/**
 * Screenshot-Based PDF Generator
 * Uses html2canvas to capture UI for perfect Hebrew rendering
 */

import { generateCanvas } from '@/services/canvasGenerator'
import { addMultiPageContentWithSmartBreaks, createPDFDocument } from '@/services/pdfGenerator'
import { generateCleanFilename } from '@/utils/pdfUtils'
import type { ContentSection } from '@/utils/pdfContentAnalyzer'
import { expandCollapsedSections, restoreElementStates } from '@/utils/sectionExpansion'

/**
 * Detects content sections in the DOM for smart page breaks
 */
function detectSections(element: HTMLElement): ContentSection[] {
  const sections: ContentSection[] = []
  
  // Find all section headers
  const sectionElements = element.querySelectorAll('[data-section], h2, h3, section, [class*="section"]')
  
  sectionElements.forEach((sectionEl, index) => {
    if (!(sectionEl instanceof HTMLElement)) return
    
    const rect = sectionEl.getBoundingClientRect()
    const containerRect = element.getBoundingClientRect()
    
    // Calculate position relative to container
    const relativeTop = rect.top - containerRect.top + element.scrollTop
    const positionMM = (relativeTop * 0.264583) // Convert pixels to MM at 96 DPI
    const heightMM = (rect.height * 0.264583)
    
    // Determine section type
    let sectionType: ContentSection['type'] = 'section'
    const classList = Array.from(sectionEl.classList).join(' ').toLowerCase()
    const dataSection = sectionEl.getAttribute('data-section')
    
    if (dataSection) {
      sectionType = 'section'
    } else if (classList.includes('hero')) {
      sectionType = 'hero'
    } else if (classList.includes('battle') || classList.includes('action')) {
      sectionType = 'battle-plan'
    } else if (classList.includes('stakeholder')) {
      sectionType = 'stakeholder'
    } else if (classList.includes('expandable') || classList.includes('collapsible')) {
      sectionType = 'expandable'
    } else if (classList.includes('card')) {
      sectionType = 'card'
    }
    
    sections.push({
      element: sectionEl,
      startY: positionMM,
      height: heightMM,
      priority: heightMM < 100 ? 'must-keep-together' : 'prefer-together',
      type: sectionType,
      id: sectionEl.id || `section-${index}`
    })
  })
  
  console.log('📍 Detected sections for page breaks:', {
    count: sections.length,
    sections: sections.map(s => ({ type: s.type, startY: s.startY.toFixed(1), height: s.height.toFixed(1) }))
  })
  
  return sections
}

/**
 * Calculates optimal page break points based on detected sections
 */
function calculateBreakPoints(sections: ContentSection[]): number[] {
  const PAGE_HEIGHT_MM = 270 // A4 page height minus margins
  const breakPoints: number[] = []
  
  sections.forEach((section) => {
    // If section starts beyond a page boundary, add break point
    const pageNumber = Math.floor(section.startY / PAGE_HEIGHT_MM)
    const breakPointMM = pageNumber * PAGE_HEIGHT_MM
    
    if (breakPointMM > 0 && !breakPoints.includes(breakPointMM)) {
      breakPoints.push(breakPointMM)
    }
  })
  
  console.log('📄 Calculated page break points:', {
    breakPointsMM: breakPoints,
    estimatedPages: breakPoints.length + 1
  })
  
  return breakPoints.sort((a, b) => a - b)
}

/**
 * Generates PDF using screenshot method (perfect for Hebrew)
 */
export async function generateScreenshotPDF(title: string): Promise<void> {
  console.log('🚀 Starting screenshot-based PDF generation')
  
  // Find the analysis view element
  const element = document.querySelector('[data-pdf-content]') as HTMLElement
  
  if (!element) {
    throw new Error('Analysis content not found. Please ensure data-pdf-content marker exists.')
  }
  
  console.log('📍 Found PDF content element:', {
    width: element.scrollWidth,
    height: element.scrollHeight,
    id: element.id
  })
  
  // Expand all collapsed sections for complete capture
  console.log('📂 Expanding collapsed sections for complete PDF capture...')
  const modifiedElements = expandCollapsedSections(element)
  
  try {
    // Generate canvas from UI (captures perfect Hebrew rendering)
    console.log('📸 Capturing UI with html2canvas...')
    const canvas = await generateCanvas(element)
    
    console.log('✅ Canvas generated:', {
      width: canvas.width,
      height: canvas.height,
      aspectRatio: (canvas.width / canvas.height).toFixed(2)
    })
    
    // Detect sections for smart page breaks
    const sections = detectSections(element)
    const breakPoints = calculateBreakPoints(sections)
    
    // Create PDF document
    console.log('📄 Creating multi-page PDF with smart breaks...')
    const pdf = createPDFDocument()
    
    // Add multi-page content with smart breaks
    addMultiPageContentWithSmartBreaks(pdf, canvas, title, breakPoints, sections)
    
    // Save PDF
    const filename = generateCleanFilename(title)
    console.log('💾 Saving PDF as:', filename)
    pdf.save(filename)
    
    console.log('✅ Screenshot-based PDF generated successfully with all sections expanded:', {
      method: 'html2canvas',
      pages: breakPoints.length + 1,
      filename
    })
  } finally {
    // Restore UI to original state
    restoreElementStates(modifiedElements)
    console.log('🔄 UI restored to original state')
  }
}
