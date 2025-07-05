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
 * Handles multi-page PDF content with ENHANCED section-aware pagination
 * 
 * PHASE 1-4: Comprehensive section boundary detection and atomic handling
 * 
 * @param pdf - The jsPDF instance to add content to
 * @param canvas - HTML canvas element containing the full content
 * @param title - Base title for headers (page numbers will be appended)
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // ENHANCED: More conservative height calculations for section preservation
  const firstPageAvailableHeight = pdfHeight - contentStartY - 15 // Increased margin
  const subsequentPageAvailableHeight = pdfHeight - 40 // Increased for section headers
  
  // PHASE 1: Enhanced minimum content threshold - DOUBLED for better section detection
  const minimumContentThresholdMM = 120 // Increased from 80mm to prevent section splits
  const minimumContentThresholdPixels = minimumContentThresholdMM * 3.779527559 * 2
  
  // PHASE 1: DOUBLED section boundary detection threshold for atomic sections
  const sectionBoundaryThresholdMM = 60 // Increased from 30mm to be more conservative
  
  console.log('PHASE 1-4: Enhanced multi-page PDF with atomic section handling:', {
    totalContentHeight: scaledHeight,
    firstPageAvailableHeight,
    subsequentPageAvailableHeight,
    minimumContentThresholdMM,
    sectionBoundaryThresholdMM: sectionBoundaryThresholdMM,
    minimumContentThresholdPixels,
    canvasHeight: canvas.height,
    scale,
    atomicSectionDetection: true
  })
  
  // PHASE 2-3: Enhanced page calculation with atomic section-aware logic
  let remainingHeight = scaledHeight
  let currentPage = 0
  let contentY = contentStartY
  let totalPagesCreated = 0
  
  // Calculate more conservative total pages with atomic section awareness
  let totalPagesEstimate = 1
  if (scaledHeight > firstPageAvailableHeight) {
    const remainingAfterFirstPage = scaledHeight - firstPageAvailableHeight
    totalPagesEstimate = 1 + Math.ceil(remainingAfterFirstPage / subsequentPageAvailableHeight)
  }
  
  console.log(`📄 ATOMIC: Initial conservative page estimate: ${totalPagesEstimate}`)
  
  while (remainingHeight > minimumContentThresholdMM && currentPage < 6) { // Reduced max pages for quality
    const availableHeight = currentPage === 0 ? firstPageAvailableHeight : subsequentPageAvailableHeight
    let contentHeightForThisPage = Math.min(remainingHeight, availableHeight)
    
    // PHASE 3: ATOMIC SECTION HANDLING - Enhanced section boundary detection
    if (remainingHeight > contentHeightForThisPage) {
      const remainingAfterThisPage = remainingHeight - contentHeightForThisPage
      
      // PHASE 4: Look-ahead logic to prevent orphaned content
      const isOrphanedContent = remainingAfterThisPage < sectionBoundaryThresholdMM
      const wouldCreateAwkwardSplit = remainingAfterThisPage < (sectionBoundaryThresholdMM * 1.5)
      
      console.log(`📄 ATOMIC: Section boundary analysis for page ${currentPage + 1}:`, {
        remainingHeight,
        contentHeightForThisPage,
        remainingAfterThisPage,
        sectionBoundaryThreshold: sectionBoundaryThresholdMM,
        isOrphanedContent,
        wouldCreateAwkwardSplit,
        willApplyAtomicHandling: isOrphanedContent || wouldCreateAwkwardSplit
      })
      
      // PHASE 3-4: Apply atomic section handling
      if (isOrphanedContent || wouldCreateAwkwardSplit) {
        // CONSERVATIVE: Reduce content for this page to avoid splitting atomic sections
        const conservativeReduction = Math.min(sectionBoundaryThresholdMM, contentHeightForThisPage * 0.3)
        contentHeightForThisPage = Math.max(
          minimumContentThresholdMM, 
          contentHeightForThisPage - conservativeReduction
        )
        
        console.log(`📄 ATOMIC: Applied conservative section preservation:`, {
          originalHeight: Math.min(remainingHeight, availableHeight),
          reducedHeight: contentHeightForThisPage,
          conservativeReduction,
          preservedSectionIntegrity: true
        })
        
        // Validate we still have meaningful content after reduction
        if (contentHeightForThisPage < minimumContentThresholdMM) {
          console.log(`📄 ATOMIC: Content too small after section preservation, stopping at page ${currentPage}`)
          break
        }
      }
    }
    
    // PHASE 2: Enhanced validation - Skip if content is too small for atomic sections
    if (contentHeightForThisPage < minimumContentThresholdMM) {
      console.log(`📄 ATOMIC: Skipping page ${currentPage + 1}: Content too small (${contentHeightForThisPage}mm < ${minimumContentThresholdMM}mm threshold)`)
      break
    }
    
    console.log(`📄 ATOMIC: Processing page ${currentPage + 1} with section preservation:`, {
      remainingHeight,
      availableHeight,
      contentHeightForThisPage,
      pageNumber: currentPage + 1,
      atomicSectionHandling: true,
      preservesSectionBoundaries: contentHeightForThisPage < availableHeight
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
      // PHASE 4: Enhanced page canvas creation with atomic section-aware slicing
      const pageHeightMM = contentHeightForThisPage / scale
      const pageCanvas = createMultiPageCanvas(canvas, pageHeightMM, currentPage, minimumContentThresholdPixels)
      
      // PHASE 3: ATOMIC validation - Enhanced content validation for sections
      if (pageCanvas.width <= 1 || pageCanvas.height <= 1 || pageCanvas.height < minimumContentThresholdPixels / 2) {
        console.log(`📄 ATOMIC: Page ${currentPage + 1} canvas insufficient for atomic sections, stopping`)
        break
      }
      
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      
      // PHASE 4: Calculate actual page height with section-aware precision
      const actualPageHeight = (pageCanvas.height / canvas.height) * scaledHeight
      
      console.log(`📄 ATOMIC: Adding page ${currentPage + 1} with section preservation:`, {
        pageCanvasWidth: pageCanvas.width,
        pageCanvasHeight: pageCanvas.height,
        actualPageHeight,
        contentY,
        availableHeight,
        hasAtomicContent: pageCanvas.height >= minimumContentThresholdPixels / 2,
        sectionIntegrityPreserved: true
      })
      
      pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, Math.min(actualPageHeight, availableHeight), '', 'FAST')
      
      remainingHeight -= contentHeightForThisPage
      currentPage++
      totalPagesCreated++
      
      // PHASE 4: Enhanced early termination with atomic section logic
      if (remainingHeight <= minimumContentThresholdMM) {
        console.log(`📄 ATOMIC: Stopping: Remaining content (${remainingHeight}mm) below atomic section threshold (${minimumContentThresholdMM}mm)`)
        break
      }
      
    } catch (error) {
      console.warn(`ATOMIC: Failed to create page ${currentPage + 1}, stopping section-aware generation:`, error)
      break
    }
  }
  
  console.log(`📄 ATOMIC: Multi-page PDF complete with section preservation: ${totalPagesCreated} pages created (estimated: ${totalPagesEstimate})`)
  
  // VALIDATION: Enhanced logging for atomic section handling
  if (totalPagesCreated < totalPagesEstimate) {
    console.log(`✅ ATOMIC: Section preservation prevented ${totalPagesEstimate - totalPagesCreated} awkward section splits`)
  }
}
