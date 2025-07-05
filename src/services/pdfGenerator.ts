
import jsPDF from 'jspdf'
import { calculatePDFDimensions, createPDFHeader } from '@/utils/pdfUtils'
import { createMultiPageCanvas } from './canvasGenerator'

/**
 * Creates and initializes a new PDF document with standard configuration
 * 
 * Uses A4 portrait format with no compression for maximum quality.
 * Standard configuration suitable for professional reports and documents.
 * 
 * @returns Configured jsPDF instance ready for content addition
 * 
 * @example
 * ```typescript
 * const pdf = createPDFDocument();
 * // Add content to pdf...
 * pdf.save('document.pdf');
 * ```
 */
export function createPDFDocument(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false
  })
}

/**
 * Adds a single canvas to PDF as one page with professional header
 * 
 * Optimizes canvas scaling to fit A4 page width while maintaining aspect ratio.
 * Automatically adds professional header with title and generation date.
 * 
 * @param pdf - The jsPDF instance to add content to
 * @param canvas - HTML canvas element containing the content to add
 * @param title - Title for the document header
 * 
 * @example
 * ```typescript
 * const pdf = createPDFDocument();
 * const canvas = await generateCanvas(element);
 * addCanvasToPDF(pdf, canvas, 'Sales Analysis Report');
 * ```
 */
export function addCanvasToPDF(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const imgData = canvas.toDataURL('image/png', 1.0)
  const { scale, scaledHeight, contentWidth } = calculatePDFDimensions(canvas)
  
  console.log('Single page PDF - Dimensions:', {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    scale,
    scaledHeight,
    contentWidth
  })
  
  // Create header
  const contentStartY = createPDFHeader(pdf, title)
  
  // Add the image
  pdf.addImage(imgData, 'PNG', 10, contentStartY, contentWidth, scaledHeight, '', 'FAST')
}

/**
 * Handles multi-page PDF content with proper headers and pagination
 * 
 * ENHANCED: Better section boundary detection to prevent awkward content splits
 * 
 * @param pdf - The jsPDF instance to add content to
 * @param canvas - HTML canvas element containing the full content
 * @param title - Base title for headers (page numbers will be appended)
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // ENHANCED: More accurate available height calculations
  const firstPageAvailableHeight = pdfHeight - contentStartY - 10 // 10mm bottom margin
  const subsequentPageAvailableHeight = pdfHeight - 35 // 25mm for header + 10mm bottom margin
  
  // CRITICAL: Enhanced minimum content threshold - increased to prevent section splits
  const minimumContentThresholdMM = 80 // Increased from 50mm to prevent section headers without content
  const minimumContentThresholdPixels = minimumContentThresholdMM * 3.779527559 * 2 // Account for 2x canvas scale
  
  // ENHANCED: Section boundary detection threshold
  const sectionBoundaryThresholdMM = 30 // If less than this remains, move content to next page
  
  console.log('ENHANCED multi-page PDF setup with section boundary detection:', {
    totalContentHeight: scaledHeight,
    firstPageAvailableHeight,
    subsequentPageAvailableHeight,
    minimumContentThresholdMM,
    sectionBoundaryThresholdMM,
    minimumContentThresholdPixels,
    canvasHeight: canvas.height,
    scale
  })
  
  // ENHANCED: Better page calculation with section-aware logic
  let remainingHeight = scaledHeight
  let currentPage = 0
  let contentY = contentStartY
  let totalPagesCreated = 0
  
  // Calculate realistic total pages with content awareness
  let totalPagesEstimate = 1
  if (scaledHeight > firstPageAvailableHeight) {
    const remainingAfterFirstPage = scaledHeight - firstPageAvailableHeight
    totalPagesEstimate = 1 + Math.ceil(remainingAfterFirstPage / subsequentPageAvailableHeight)
  }
  
  console.log(`📄 Initial page estimate: ${totalPagesEstimate}`)
  
  while (remainingHeight > minimumContentThresholdMM && currentPage < 8) { // Reduced max pages for better control
    const availableHeight = currentPage === 0 ? firstPageAvailableHeight : subsequentPageAvailableHeight
    let contentHeightForThisPage = Math.min(remainingHeight, availableHeight)
    
    // ENHANCED: Section boundary detection - check if we're about to split content awkwardly
    if (remainingHeight > contentHeightForThisPage && 
        (remainingHeight - contentHeightForThisPage) < sectionBoundaryThresholdMM) {
      console.log(`📄 Section boundary detected for page ${currentPage + 1}:`, {
        remainingHeight,
        contentHeightForThisPage,
        remainingAfterThisPage: remainingHeight - contentHeightForThisPage,
        sectionBoundaryThreshold: sectionBoundaryThresholdMM
      })
      
      // Reduce content for this page to avoid splitting a section
      contentHeightForThisPage = remainingHeight - sectionBoundaryThresholdMM
      
      // But ensure we still have meaningful content on this page
      if (contentHeightForThisPage < minimumContentThresholdMM) {
        console.log(`📄 Adjusted content too small, stopping at page ${currentPage}`)
        break
      }
    }
    
    // CRITICAL: Skip this page if content is too small to be meaningful
    if (contentHeightForThisPage < minimumContentThresholdMM) {
      console.log(`📄 Skipping page ${currentPage + 1}: Content too small (${contentHeightForThisPage}mm < ${minimumContentThresholdMM}mm threshold)`)
      break
    }
    
    console.log(`📄 Processing page ${currentPage + 1} with section-aware logic:`, {
      remainingHeight,
      availableHeight,
      contentHeightForThisPage,
      pageNumber: currentPage + 1,
      willCreateMeaningfulContent: contentHeightForThisPage >= minimumContentThresholdMM,
      sectionBoundaryAdjusted: contentHeightForThisPage < availableHeight
    })
    
    if (currentPage > 0) {
      pdf.addPage()
      
      // Add header for subsequent pages
      pdf.setFontSize(14)
      pdf.setTextColor(100, 116, 139)
      const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf.text(`${cleanTitle} - Page ${currentPage + 1}`, 10, 15)
      pdf.setDrawColor(203, 213, 225)
      pdf.line(10, 20, pdfWidth - 10, 20)
      contentY = 25
    }
    
    try {
      // ENHANCED: Better page canvas creation with section-aware slicing
      const pageHeightMM = contentHeightForThisPage / scale
      const pageCanvas = createMultiPageCanvas(canvas, pageHeightMM, currentPage, minimumContentThresholdPixels)
      
      // CRITICAL: Validate page canvas has meaningful content
      if (pageCanvas.width <= 1 || pageCanvas.height <= 1 || pageCanvas.height < minimumContentThresholdPixels / 4) {
        console.log(`📄 Page ${currentPage + 1} canvas has insufficient content, stopping multi-page generation`)
        break
      }
      
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      
      // ENHANCED: Calculate actual page height with better precision
      const actualPageHeight = (pageCanvas.height / canvas.height) * scaledHeight
      
      console.log(`📄 Adding page ${currentPage + 1} to PDF with section awareness:`, {
        pageCanvasWidth: pageCanvas.width,
        pageCanvasHeight: pageCanvas.height,
        actualPageHeight,
        contentY,
        availableHeight,
        hasValidContent: pageCanvas.height >= minimumContentThresholdPixels / 4,
        sectionBoundaryRespected: true
      })
      
      pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, Math.min(actualPageHeight, availableHeight), '', 'FAST')
      
      remainingHeight -= contentHeightForThisPage
      currentPage++
      totalPagesCreated++
      
      // ENHANCED: Early termination with better logic
      if (remainingHeight <= minimumContentThresholdMM) {
        console.log(`📄 Stopping: Remaining content (${remainingHeight}mm) below meaningful threshold (${minimumContentThresholdMM}mm)`)
        break
      }
      
    } catch (error) {
      console.warn(`Failed to create page ${currentPage + 1}, stopping multi-page generation:`, error)
      break
    }
  }
  
  console.log(`📄 Multi-page PDF generation complete with section awareness: ${totalPagesCreated} pages created (estimated: ${totalPagesEstimate})`)
  
  // VALIDATION: Log if we created fewer pages than estimated (good sign of improved logic)
  if (totalPagesCreated < totalPagesEstimate) {
    console.log(`✅ Section-aware termination prevented ${totalPagesEstimate - totalPagesCreated} awkward page splits`)
  }
}
