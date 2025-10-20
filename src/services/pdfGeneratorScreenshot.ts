/**
 * Screenshot-Based PDF Generator
 * Uses html2canvas to capture UI for perfect Hebrew rendering
 */

import { generateCanvas } from '@/services/canvasGenerator'
import { addMultiPageContentWithSmartBreaks, createPDFDocument } from '@/services/pdfGenerator'
import { generateCleanFilename } from '@/utils/pdfUtils'
import type { ContentSection } from '@/utils/pdfContentAnalyzer'
import { analyzeContentForPDF, calculateOptimalPageBreaks } from '@/utils/pdfContentAnalyzer'
import { expandCollapsedSections, restoreElementStates } from '@/utils/sectionExpansion'

/**
 * Analyzes content structure and calculates intelligent page breaks
 */
function calculateSmartBreakPoints(element: HTMLElement, canvasHeightPx: number): {
  breakPoints: number[]
  sections: ContentSection[]
} {
  console.log('🧠 Starting smart content analysis...')
  
  // Step 1: Analyze DOM structure to identify logical sections
  const sections = analyzeContentForPDF(element)
  
  console.log('📊 Found content sections:', {
    totalSections: sections.length,
    mustKeepTogether: sections.filter(s => s.priority === 'must-keep-together').length,
    preferTogether: sections.filter(s => s.priority === 'prefer-together').length,
    splittable: sections.filter(s => s.priority === 'splittable').length
  })
  
  // Step 2: Calculate optimal break points (in MM)
  const PAGE_HEIGHT_MM = 270 // A4 page content area
  const breakPoints = calculateOptimalPageBreaks(sections, PAGE_HEIGHT_MM)
  
  console.log('✨ Smart page breaks calculated:', {
    breakPointsMM: breakPoints,
    totalPages: breakPoints.length + 1,
    method: 'content-aware'
  })
  
  return { breakPoints, sections }
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
    
    // Calculate smart content-aware page breaks
    const { breakPoints, sections } = calculateSmartBreakPoints(element, canvas.height)
    
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
