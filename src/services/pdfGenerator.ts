
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
 * SIMPLIFIED Multi-page PDF with basic sequential slicing - NO COMPLEX LOGIC
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // SIMPLE: Calculate available heights without complex logic
  const firstPageAvailableHeight = pdfHeight - contentStartY - 10
  const subsequentPageAvailableHeight = pdfHeight - 30
  
  console.log('SIMPLIFIED Multi-page PDF - Basic Sequential Slicing:', {
    totalContentHeight: scaledHeight,
    firstPageAvailableHeight,
    subsequentPageAvailableHeight,
    canvasHeight: canvas.height,
    scale
  })
  
  // SIMPLE: Calculate exact number of pages needed
  let totalPagesNeeded = 1
  let remainingAfterFirstPage = Math.max(0, scaledHeight - firstPageAvailableHeight)
  
  if (remainingAfterFirstPage > 0) {
    totalPagesNeeded += Math.ceil(remainingAfterFirstPage / subsequentPageAvailableHeight)
  }
  
  console.log(`SIMPLIFIED: Will create exactly ${totalPagesNeeded} pages for all content`)
  
  // SIMPLE: Process each page with basic sequential slicing
  let contentProcessed = 0
  
  for (let pageIndex = 0; pageIndex < totalPagesNeeded; pageIndex++) {
    const isFirstPage = pageIndex === 0
    const availableHeight = isFirstPage ? firstPageAvailableHeight : subsequentPageAvailableHeight
    const contentY = isFirstPage ? contentStartY : 25
    
    // SIMPLE: Calculate how much content to put on this page
    const remainingContent = scaledHeight - contentProcessed
    const contentForThisPage = Math.min(remainingContent, availableHeight)
    
    console.log(`SIMPLIFIED: Page ${pageIndex + 1}/${totalPagesNeeded}:`, {
      contentProcessed,
      remainingContent,
      availableHeight,
      contentForThisPage
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
    
    // SIMPLE: Create page canvas with basic slicing - NO COMPLEX LOGIC
    const pageCanvas = createSimplePageCanvas(canvas, contentProcessed, contentForThisPage, scale)
    
    if (pageCanvas.width > 1 && pageCanvas.height > 1) {
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      
      console.log(`SIMPLIFIED: Adding page ${pageIndex + 1} content:`, {
        pageCanvasWidth: pageCanvas.width,
        pageCanvasHeight: pageCanvas.height,
        contentY,
        contentForThisPage
      })
      
      pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, contentForThisPage, '', 'FAST')
    }
    
    contentProcessed += contentForThisPage
    
    // SIMPLE: Stop when all content is processed
    if (contentProcessed >= scaledHeight) {
      console.log(`SIMPLIFIED: All content processed after ${pageIndex + 1} pages`)
      break
    }
  }
  
  console.log(`SIMPLIFIED: Multi-page PDF complete - ${totalPagesNeeded} pages created`)
}

/**
 * SIMPLIFIED canvas slicing - NO COMPLEX THRESHOLDS OR BOUNDARIES
 */
function createSimplePageCanvas(
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
  
  // SIMPLE: Convert MM to pixels using the same scale as the source
  const startPixels = (startHeightMM / scale)
  const heightPixels = (pageHeightMM / scale)
  
  // SIMPLE: Basic bounds checking
  if (startPixels >= sourceCanvas.height) {
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // SIMPLE: Calculate actual slice dimensions
  const actualHeight = Math.min(heightPixels, sourceCanvas.height - startPixels)
  
  console.log(`SIMPLIFIED Canvas Slice:`, {
    startHeightMM,
    pageHeightMM,
    startPixels,
    heightPixels,
    actualHeight,
    sourceHeight: sourceCanvas.height
  })
  
  // SIMPLE: Set canvas size and slice
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = actualHeight
  
  // SIMPLE: Draw the slice - NO COMPLEX LOGIC
  pageCtx.drawImage(
    sourceCanvas,
    0, startPixels, sourceCanvas.width, actualHeight,  // Source rectangle
    0, 0, sourceCanvas.width, actualHeight             // Destination rectangle
  )
  
  return pageCanvas
}
