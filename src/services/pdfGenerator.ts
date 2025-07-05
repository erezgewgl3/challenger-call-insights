
import jsPDF from 'jspdf'
import { calculatePDFDimensions, createPDFHeader } from '@/utils/pdfUtils'

/**
 * Creates and initializes a new PDF document with standard configuration
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
 * SIMPLIFIED Multi-page PDF with direct pixel calculations - NO MM/PIXEL MIXING
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // SIMPLIFIED: Calculate available heights in MM (for PDF layout)
  const firstPageAvailableHeightMM = pdfHeight - contentStartY - 10
  const subsequentPageAvailableHeightMM = pdfHeight - 30
  
  // SIMPLIFIED: Calculate total pages needed with direct division
  let totalPagesNeeded = 1
  let remainingContentMM = Math.max(0, scaledHeight - firstPageAvailableHeightMM)
  
  if (remainingContentMM > 0) {
    totalPagesNeeded += Math.ceil(remainingContentMM / subsequentPageAvailableHeightMM)
  }
  
  // SIMPLIFIED: Calculate pixels per page directly from canvas
  const firstPagePixels = Math.round((firstPageAvailableHeightMM / scaledHeight) * canvas.height)
  const subsequentPagePixels = Math.round((subsequentPageAvailableHeightMM / scaledHeight) * canvas.height)
  
  console.log('SIMPLIFIED Multi-page PDF - Direct Pixel Division:', {
    canvasHeight: canvas.height,
    totalPagesNeeded,
    firstPagePixels,
    subsequentPagePixels,
    scaledHeight,
    firstPageAvailableHeightMM,
    subsequentPageAvailableHeightMM
  })
  
  // SIMPLIFIED: Process each page with direct pixel coordinates
  let pixelsProcessed = 0
  
  for (let pageIndex = 0; pageIndex < totalPagesNeeded; pageIndex++) {
    const isFirstPage = pageIndex === 0
    const availableHeightMM = isFirstPage ? firstPageAvailableHeightMM : subsequentPageAvailableHeightMM
    const pagePixelHeight = isFirstPage ? firstPagePixels : subsequentPagePixels
    const contentY = isFirstPage ? contentStartY : 25
    
    // SIMPLIFIED: Stop if we've processed all pixels
    if (pixelsProcessed >= canvas.height) {
      console.log(`SIMPLIFIED: All content processed, stopping at page ${pageIndex}`)
      break
    }
    
    // SIMPLIFIED: Calculate actual pixels to process for this page
    const remainingPixels = canvas.height - pixelsProcessed
    const actualPagePixels = Math.min(pagePixelHeight, remainingPixels)
    
    console.log(`SIMPLIFIED: Page ${pageIndex + 1}/${totalPagesNeeded}:`, {
      pixelsProcessed,
      remainingPixels,
      pagePixelHeight,
      actualPagePixels
    })
    
    // Skip if no content left
    if (actualPagePixels <= 0) {
      console.log(`SIMPLIFIED: No content left for page ${pageIndex + 1}, skipping`)
      break
    }
    
    // Add new page (except for first page)
    if (pageIndex > 0) {
      pdf.addPage()
      
      // Add simple header for subsequent pages
      pdf.setFontSize(14)
      pdf.setTextColor(100, 116, 139)
      const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf.text(`${cleanTitle} - Page ${pageIndex + 1}`, 10, 15)
      pdf.setDrawColor(203, 213, 225)
      pdf.line(10, 20, pdfWidth - 10, 20)
    }
    
    // SIMPLIFIED: Create page canvas with direct pixel calculations
    const pageCanvas = createSimplifiedPageCanvas(canvas, pixelsProcessed, actualPagePixels)
    
    if (pageCanvas && pageCanvas.width > 1 && pageCanvas.height > 1) {
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      
      // Calculate MM height for this page slice
      const pageHeightMM = (actualPagePixels / canvas.height) * scaledHeight
      
      console.log(`SIMPLIFIED: Adding page ${pageIndex + 1} content:`, {
        startPixel: pixelsProcessed,
        actualPagePixels,
        pageHeightMM,
        contentY
      })
      
      pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, pageHeightMM, '', 'FAST')
    }
    
    pixelsProcessed += actualPagePixels
  }
  
  console.log(`SIMPLIFIED: Multi-page PDF complete - processed ${pixelsProcessed}/${canvas.height} pixels`)
}

/**
 * SIMPLIFIED canvas slicing - Direct pixel coordinates only
 */
function createSimplifiedPageCanvas(
  sourceCanvas: HTMLCanvasElement,
  startPixel: number,
  heightPixels: number
): HTMLCanvasElement | null {
  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    console.error('Failed to get 2D context for page canvas')
    return null
  }
  
  // SIMPLIFIED: Bounds checking with direct pixel coordinates
  if (startPixel >= sourceCanvas.height || heightPixels <= 0) {
    console.log('SIMPLIFIED: No valid content to slice, skipping page')
    return null
  }
  
  // SIMPLIFIED: Calculate actual slice dimensions in pixels
  const actualHeightPixels = Math.min(heightPixels, sourceCanvas.height - startPixel)
  
  console.log(`SIMPLIFIED Canvas Slice:`, {
    startPixel,
    requestedHeight: heightPixels,
    actualHeightPixels,
    sourceCanvasHeight: sourceCanvas.height,
    sourceCanvasWidth: sourceCanvas.width
  })
  
  // SIMPLIFIED: Set canvas size to actual pixel dimensions
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = actualHeightPixels
  
  // SIMPLIFIED: Draw the slice using direct pixel coordinates
  pageCtx.drawImage(
    sourceCanvas,
    0, startPixel, sourceCanvas.width, actualHeightPixels,  // Source rectangle (pixels)
    0, 0, sourceCanvas.width, actualHeightPixels             // Destination rectangle (pixels)
  )
  
  return pageCanvas
}
