
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
 * FIXED Multi-page PDF with direct pixel slicing - NO MM/PIXEL MIXING
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // FIXED: Calculate available heights in MM (for PDF layout)
  const firstPageAvailableHeightMM = pdfHeight - contentStartY - 10
  const subsequentPageAvailableHeightMM = pdfHeight - 30
  
  // FIXED: Calculate how many pages we need based on MM measurements
  let totalPagesNeeded = 1
  let remainingContentMM = Math.max(0, scaledHeight - firstPageAvailableHeightMM)
  
  if (remainingContentMM > 0) {
    totalPagesNeeded += Math.ceil(remainingContentMM / subsequentPageAvailableHeightMM)
  }
  
  console.log('FIXED Multi-page PDF - Direct Pixel Slicing:', {
    totalContentHeightMM: scaledHeight,
    firstPageAvailableHeightMM,
    subsequentPageAvailableHeightMM,
    totalPagesNeeded,
    canvasPixelHeight: canvas.height,
    canvasPixelWidth: canvas.width
  })
  
  // FIXED: Process each page with direct pixel coordinates
  let contentProcessedMM = 0
  
  for (let pageIndex = 0; pageIndex < totalPagesNeeded; pageIndex++) {
    const isFirstPage = pageIndex === 0
    const availableHeightMM = isFirstPage ? firstPageAvailableHeightMM : subsequentPageAvailableHeightMM
    const contentY = isFirstPage ? contentStartY : 25
    
    // Calculate how much content (in MM) to put on this page
    const remainingContentMM = scaledHeight - contentProcessedMM
    const contentForThisPageMM = Math.min(remainingContentMM, availableHeightMM)
    
    console.log(`FIXED: Page ${pageIndex + 1}/${totalPagesNeeded}:`, {
      contentProcessedMM,
      remainingContentMM,
      availableHeightMM,
      contentForThisPageMM
    })
    
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
    
    // FIXED: Create page canvas with direct pixel calculations
    const pageCanvas = createFixedPageCanvas(canvas, contentProcessedMM, contentForThisPageMM, scale)
    
    if (pageCanvas.width > 1 && pageCanvas.height > 1) {
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      
      console.log(`FIXED: Adding page ${pageIndex + 1} content:`, {
        pageCanvasWidth: pageCanvas.width,
        pageCanvasHeight: pageCanvas.height,
        contentY,
        contentForThisPageMM
      })
      
      pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, contentForThisPageMM, '', 'FAST')
    }
    
    contentProcessedMM += contentForThisPageMM
    
    // Stop when all content is processed
    if (contentProcessedMM >= scaledHeight) {
      console.log(`FIXED: All content processed after ${pageIndex + 1} pages`)
      break
    }
  }
  
  console.log(`FIXED: Multi-page PDF complete - ${totalPagesNeeded} pages created`)
}

/**
 * FIXED canvas slicing - Direct pixel coordinates, no MM conversion mixing
 */
function createFixedPageCanvas(
  sourceCanvas: HTMLCanvasElement,
  startHeightMM: number,
  pageHeightMM: number,
  scale: number
): HTMLCanvasElement {
  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    throw new Error('Failed to get 2D context for page canvas')
  }
  
  // FIXED: Convert MM to pixels using the correct scale relationship
  // The scale is already calculated as (190 / (canvas.width * 0.264583))
  // So to convert MM back to pixels: pixels = MM / 0.264583 / scale
  const mmToPixelFactor = 1 / (0.264583 * scale)
  
  const startPixels = Math.round(startHeightMM * mmToPixelFactor)
  const heightPixels = Math.round(pageHeightMM * mmToPixelFactor)
  
  // FIXED: Bounds checking with proper pixel coordinates
  if (startPixels >= sourceCanvas.height) {
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // FIXED: Calculate actual slice dimensions in pixels
  const actualHeightPixels = Math.min(heightPixels, sourceCanvas.height - startPixels)
  
  console.log(`FIXED Canvas Slice - Direct Pixel Math:`, {
    startHeightMM,
    pageHeightMM,
    mmToPixelFactor,
    startPixels,
    heightPixels,
    actualHeightPixels,
    sourceCanvasHeight: sourceCanvas.height,
    sourceCanvasWidth: sourceCanvas.width
  })
  
  // FIXED: Set canvas size to actual pixel dimensions
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = actualHeightPixels
  
  // FIXED: Draw the slice using direct pixel coordinates
  pageCtx.drawImage(
    sourceCanvas,
    0, startPixels, sourceCanvas.width, actualHeightPixels,  // Source rectangle (pixels)
    0, 0, sourceCanvas.width, actualHeightPixels             // Destination rectangle (pixels)
  )
  
  return pageCanvas
}
