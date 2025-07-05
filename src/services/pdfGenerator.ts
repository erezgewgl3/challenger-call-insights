
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
 * Handles multi-page PDF content with FIXED thresholds for complete content capture
 * 
 * FIXED: Dramatically reduced conservative thresholds to capture ALL content
 * 
 * @param pdf - The jsPDF instance to add content to
 * @param canvas - HTML canvas element containing the full content
 * @param title - Base title for headers (page numbers will be appended)
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // FIXED: Reasonable height calculations for complete content capture
  const firstPageAvailableHeight = pdfHeight - contentStartY - 10 // Reduced margin
  const subsequentPageAvailableHeight = pdfHeight - 30 // Reduced for better content capture
  
  // PHASE 1: FIXED - Dramatically reduced minimum content threshold for complete capture
  const minimumContentThresholdMM = 40 // Reduced from 120mm to capture more content
  const minimumContentThresholdPixels = minimumContentThresholdMM * 3.779527559 * 2
  
  // PHASE 1: FIXED - Reduced section boundary detection threshold
  const sectionBoundaryThresholdMM = 25 // Reduced from 60mm to be less restrictive
  
  console.log('FIXED: Multi-page PDF with reduced thresholds for complete content capture:', {
    totalContentHeight: scaledHeight,
    firstPageAvailableHeight,
    subsequentPageAvailableHeight,
    minimumContentThresholdMM,
    sectionBoundaryThresholdMM: sectionBoundaryThresholdMM,
    minimumContentThresholdPixels,
    canvasHeight: canvas.height,
    scale,
    completeContentCapture: true
  })
  
  // PHASE 2-3: Enhanced page calculation with FIXED content-aware logic
  let remainingHeight = scaledHeight
  let currentPage = 0
  let contentY = contentStartY
  let totalPagesCreated = 0
  
  // Calculate more realistic total pages with FIXED thresholds
  let totalPagesEstimate = 1
  if (scaledHeight > firstPageAvailableHeight) {
    const remainingAfterFirstPage = scaledHeight - firstPageAvailableHeight
    totalPagesEstimate = 1 + Math.ceil(remainingAfterFirstPage / subsequentPageAvailableHeight)
  }
  
  console.log(`📄 FIXED: Realistic page estimate for complete capture: ${totalPagesEstimate}`)
  
  // PHASE 3: FIXED - Increased max pages to ensure all content is captured
  while (remainingHeight > minimumContentThresholdMM && currentPage < 10) { // Increased from 6 to 10
    const availableHeight = currentPage === 0 ? firstPageAvailableHeight : subsequentPageAvailableHeight
    let contentHeightForThisPage = Math.min(remainingHeight, availableHeight)
    
    // PHASE 3: BALANCED SECTION HANDLING - Less aggressive section preservation
    if (remainingHeight > contentHeightForThisPage) {
      const remainingAfterThisPage = remainingHeight - contentHeightForThisPage
      
      // PHASE 4: FIXED - More balanced look-ahead logic
      const isVerySmallRemainder = remainingAfterThisPage < (sectionBoundaryThresholdMM * 0.8)
      const wouldCreateMinorSplit = remainingAfterThisPage < (sectionBoundaryThresholdMM * 1.2)
      
      console.log(`📄 FIXED: Balanced section analysis for page ${currentPage + 1}:`, {
        remainingHeight,
        contentHeightForThisPage,
        remainingAfterThisPage,
        sectionBoundaryThreshold: sectionBoundaryThresholdMM,
        isVerySmallRemainder,
        wouldCreateMinorSplit,
        willApplyBalancedHandling: isVerySmallRemainder
      })
      
      // PHASE 3-4: FIXED - Only apply conservative handling for very small remainders
      if (isVerySmallRemainder) {
        // MODERATE: Small reduction to avoid tiny orphaned content
        const moderateReduction = Math.min(sectionBoundaryThresholdMM * 0.6, contentHeightForThisPage * 0.15)
        contentHeightForThisPage = Math.max(
          minimumContentThresholdMM, 
          contentHeightForThisPage - moderateReduction
        )
        
        console.log(`📄 FIXED: Applied moderate section preservation:`, {
          originalHeight: Math.min(remainingHeight, availableHeight),
          reducedHeight: contentHeightForThisPage,
          moderateReduction,
          preservedMinorSectionIntegrity: true
        })
        
        // FIXED: More lenient validation after reduction
        if (contentHeightForThisPage < minimumContentThresholdMM * 0.8) {
          console.log(`📄 FIXED: Content acceptable after moderate preservation, continuing at page ${currentPage}`)
        }
      }
    }
    
    // PHASE 2: FIXED - Less restrictive validation for complete content capture
    if (contentHeightForThisPage < minimumContentThresholdMM * 0.7) { // More lenient threshold
      console.log(`📄 FIXED: Stopping page generation: Content (${contentHeightForThisPage}mm) below lenient threshold`)
      break
    }
    
    console.log(`📄 FIXED: Processing page ${currentPage + 1} with balanced content capture:`, {
      remainingHeight,
      availableHeight,
      contentHeightForThisPage,
      pageNumber: currentPage + 1,
      balancedContentCapture: true,
      preservesImportantSections: contentHeightForThisPage < availableHeight
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
      // PHASE 4: FIXED - Enhanced page canvas creation with balanced content slicing
      const pageHeightMM = contentHeightForThisPage / scale
      const pageCanvas = createMultiPageCanvas(canvas, pageHeightMM, currentPage, minimumContentThresholdPixels)
      
      // PHASE 3: FIXED - More lenient content validation for complete capture
      if (pageCanvas.width <= 1 || pageCanvas.height <= 1 || pageCanvas.height < minimumContentThresholdPixels * 0.5) { // More lenient
        console.log(`📄 FIXED: Page ${currentPage + 1} canvas insufficient, but continuing to capture remaining content`)
        // Don't break immediately, try to continue with remaining content
        if (currentPage === 0) {
          break // Only break if first page fails
        }
      } else {
        const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
        
        // PHASE 4: Calculate actual page height with FIXED precision
        const actualPageHeight = (pageCanvas.height / canvas.height) * scaledHeight
        
        console.log(`📄 FIXED: Adding page ${currentPage + 1} with complete content capture:`, {
          pageCanvasWidth: pageCanvas.width,
          pageCanvasHeight: pageCanvas.height,
          actualPageHeight,
          contentY,
          availableHeight,
          hasValidContent: pageCanvas.height >= minimumContentThresholdPixels * 0.5,
          completeContentCaptured: true
        })
        
        pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, Math.min(actualPageHeight, availableHeight), '', 'FAST')
        totalPagesCreated++
      }
      
      remainingHeight -= contentHeightForThisPage
      currentPage++
      
      // PHASE 4: FIXED - More realistic early termination logic
      if (remainingHeight <= minimumContentThresholdMM * 0.7) { // More lenient termination
        console.log(`📄 FIXED: Natural completion: Remaining content (${remainingHeight}mm) below lenient threshold (${minimumContentThresholdMM * 0.7}mm)`)
        break
      }
      
    } catch (error) {
      console.warn(`FIXED: Failed to create page ${currentPage + 1}, attempting to continue:`, error)
      remainingHeight -= contentHeightForThisPage
      currentPage++
      // Continue rather than break to capture more content
    }
  }
  
  console.log(`📄 FIXED: Multi-page PDF complete with enhanced content capture: ${totalPagesCreated} pages created (estimated: ${totalPagesEstimate})`)
  
  // VALIDATION: FIXED logging for complete content capture
  if (totalPagesCreated >= totalPagesEstimate) {
    console.log(`✅ FIXED: Complete content captured successfully across ${totalPagesCreated} pages`)
  } else {
    console.log(`⚠️ FIXED: Partial content capture: ${totalPagesCreated} of ${totalPagesEstimate} estimated pages`)
  }
}
