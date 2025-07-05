
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
 * Automatically splits long content across multiple pages while maintaining:
 * - Consistent headers on each page
 * - Proper page numbering
 * - Optimal content distribution
 * - Professional formatting throughout
 * 
 * @param pdf - The jsPDF instance to add content to
 * @param canvas - HTML canvas element containing the full content
 * @param title - Base title for headers (page numbers will be appended)
 * 
 * @throws Will log warnings for pages that fail to render but continue processing
 * 
 * @example
 * ```typescript
 * const pdf = createPDFDocument();
 * const canvas = await generateCanvas(longElement);
 * addMultiPageContent(pdf, canvas, 'Comprehensive Sales Report');
 * ```
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // Calculate available heights more accurately
  const firstPageAvailableHeight = pdfHeight - contentStartY - 10 // 10mm bottom margin
  const subsequentPageAvailableHeight = pdfHeight - 35 // 25mm for header + 10mm bottom margin
  
  console.log('Multi-page PDF setup:', {
    totalContentHeight: scaledHeight,
    firstPageAvailableHeight,
    subsequentPageAvailableHeight,
    canvasHeight: canvas.height,
    scale
  })
  
  // Calculate how much content fits on first page
  let remainingHeight = scaledHeight
  let currentPage = 0
  let contentY = contentStartY
  
  while (remainingHeight > 0) {
    const availableHeight = currentPage === 0 ? firstPageAvailableHeight : subsequentPageAvailableHeight
    const contentHeightForThisPage = Math.min(remainingHeight, availableHeight)
    
    if (currentPage > 0) {
      pdf.addPage()
      
      // Add header for subsequent pages
      pdf.setFontSize(14)
      pdf.setTextColor(100, 116, 139)
      const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const totalPages = Math.ceil(scaledHeight / subsequentPageAvailableHeight) + (scaledHeight > firstPageAvailableHeight ? 0 : -1)
      pdf.text(`${cleanTitle} - Page ${currentPage + 1} of ${totalPages + 1}`, 10, 15)
      pdf.setDrawColor(203, 213, 225)
      pdf.line(10, 20, pdfWidth - 10, 20)
      contentY = 25
    }
    
    try {
      // Create canvas for this page content
      const pageCanvas = createMultiPageCanvas(canvas, contentHeightForThisPage / scale, currentPage)
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      
      const actualPageHeight = (pageCanvas.height * 0.264583) * scale
      
      console.log(`Adding page ${currentPage + 1}:`, {
        pageCanvasHeight: pageCanvas.height,
        actualPageHeight,
        contentY,
        availableHeight
      })
      
      pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, actualPageHeight, '', 'FAST')
      
      remainingHeight -= contentHeightForThisPage
      currentPage++
      
    } catch (error) {
      console.warn(`Failed to create page ${currentPage + 1}, skipping:`, error)
      break
    }
  }
}
