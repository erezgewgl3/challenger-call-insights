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
 * Calculates simple fixed-height page break points
 */
function calculateSimpleBreakPoints(canvasHeightPx: number): number[] {
  const PAGE_HEIGHT_PX = 3400 // ~270mm at 2.5x scale
  const totalPages = Math.ceil(canvasHeightPx / PAGE_HEIGHT_PX)
  const breakPoints: number[] = []
  
  for (let i = 1; i < totalPages; i++) {
    breakPoints.push(i * PAGE_HEIGHT_PX)
  }
  
  console.log('📄 Calculated fixed-height page breaks:', {
    canvasHeight: canvasHeightPx,
    pageHeight: PAGE_HEIGHT_PX,
    totalPages,
    breakPoints
  })
  
  return breakPoints
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
    
    // Calculate simple fixed-height page breaks
    const breakPoints = calculateSimpleBreakPoints(canvas.height)
    const sections: ContentSection[] = [] // Empty sections array for compatibility
    
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
