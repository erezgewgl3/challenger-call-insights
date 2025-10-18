
import jsPDF from 'jspdf'
import { calculatePDFDimensions, createPDFHeader } from '@/utils/pdfUtils'
import { identifySectionAtPosition, type ContentSection } from '@/utils/pdfContentAnalyzer'
import { formatSectionName } from '@/utils/pdfSectionMarkers'

/**
 * Creates and initializes a new PDF document with standard configuration
 */
export function createPDFDocument(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false,        // Don't compress for better text quality
    precision: 3,           // Higher precision for sharp rendering
    userUnit: 1.0,          // Standard unit for sharp rendering
    hotfixes: []            // No compression hotfixes
  })
}

/**
 * Adds a single canvas to PDF as one page with professional header
 */
export function addCanvasToPDF(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const imgData = canvas.toDataURL('image/png', 1.0) // Maximum quality PNG
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
  
  // Add the image with SLOW compression for better text quality
  pdf.addImage(imgData, 'PNG', 10, contentStartY, contentWidth, scaledHeight, '', 'SLOW')
}

/**
 * Smart multi-page PDF with content-aware page breaks
 * Uses semantic analysis to avoid breaking sections awkwardly
 */
export function addMultiPageContentWithSmartBreaks(
  pdf: jsPDF, 
  canvas: HTMLCanvasElement, 
  title: string,
  breakPoints: number[], // MM positions where pages should break
  sections: ContentSection[] = [] // Optional: for continuation markers
): void {
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // If no break points provided, treat as single page
  if (breakPoints.length === 0) {
    console.log('No break points - generating single page PDF')
    const contentStartY = createPDFHeader(pdf, title)
    pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', 10, contentStartY, contentWidth, scaledHeight, '', 'SLOW')
    return
  }
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  const firstPageAvailableHeightMM = pdfHeight - contentStartY - 10
  const subsequentPageAvailableHeightMM = pdfHeight - 30
  
  // Convert break points (MM) to pixel positions in canvas
  // Phase 3: Add 10mm buffer zone around breaks for visual polish
  // Phase 4: Updated scale factor from 3x to 2.5x
  // Formula: MM → screen pixels (÷0.264583) → canvas pixels (×2.5 for html2canvas scale)
  const breakPixels = breakPoints.map(breakMM => {
    const bufferedBreakMM = breakMM + 10 // Add 10mm buffer zone
    const screenPixels = bufferedBreakMM / 0.264583 // MM to screen pixels at 96 DPI
    const canvasPixels = screenPixels * 2.5 // Phase 4: Updated from 3x to 2.5x canvas scale
    return Math.round(canvasPixels)
  })
  
  // Add implicit break at start and end
  const allBreakPixels = [0, ...breakPixels, canvas.height].sort((a, b) => a - b)
  const totalPagesNeeded = allBreakPixels.length - 1
  
  console.log('Smart Multi-page PDF with content-aware breaks:', {
    canvasHeight: canvas.height,
    canvasScale: 2.5, // Phase 4: Updated from 3x to 2.5x
    scaledHeight,
    breakPointsMM: breakPoints,
    breakPixels,
    conversionFormula: 'MM → screen px (÷0.264583) → canvas px (×2.5)',
    totalPagesNeeded
  })
  
  // Process each page based on break points
  for (let pageIndex = 0; pageIndex < totalPagesNeeded; pageIndex++) {
    const isFirstPage = pageIndex === 0
    const startPixel = allBreakPixels[pageIndex]
    const endPixel = allBreakPixels[pageIndex + 1]
    const pagePixels = endPixel - startPixel
    
    console.log(`Smart page ${pageIndex + 1}/${totalPagesNeeded}:`, {
      startPixel,
      endPixel,
      pagePixels
    })
    
    // Skip empty pages
    if (pagePixels <= 0) {
      console.log(`Skipping empty page ${pageIndex + 1}`)
      continue
    }
    
    // Add new page (except for first)
    if (pageIndex > 0) {
      pdf.addPage()
      
      // Determine section name for continuation marker
      // Phase 4: Convert canvas pixels back to MM (accounting for 2.5x scale)
      const startMM = (startPixel / 2.5) * 0.264583
      const currentSection = identifySectionAtPosition(sections, startMM)
      const sectionName = currentSection ? formatSectionName(currentSection.type) : undefined
      
      console.log(`Page ${pageIndex + 1} continuation marker:`, {
        startPixel,
        startMM: startMM.toFixed(2),
        currentSection: currentSection?.type,
        sectionName
      })
      
      // Add continuation header
      const contentY = createPDFHeader(pdf, title, pageIndex + 1, sectionName)
    }
    
    const contentY = isFirstPage ? contentStartY : 28
    
    // Create page canvas slice
    const pageCanvas = createPageCanvas(canvas, startPixel, pagePixels)
    
    if (pageCanvas && pageCanvas.width > 1 && pageCanvas.height > 1) {
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      const pageHeightMM = (pagePixels / canvas.height) * scaledHeight
      
      console.log(`Adding page ${pageIndex + 1} content:`, {
        startPixel,
        pagePixels,
        pageHeightMM,
        contentY
      })
      
      pdf.addImage(pageImgData, 'PNG', 10, contentY, contentWidth, pageHeightMM, '', 'SLOW')
    }
  }
  
  console.log(`Smart multi-page PDF complete - ${totalPagesNeeded} pages generated`)
}

/**
 * Creates a canvas slice for a single PDF page
 */
function createPageCanvas(
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
  
  // Bounds checking
  if (startPixel >= sourceCanvas.height || heightPixels <= 0) {
    console.log('No valid content to slice, skipping page')
    return null
  }
  
  // Calculate actual slice dimensions
  const actualHeightPixels = Math.min(heightPixels, sourceCanvas.height - startPixel)
  
  console.log(`Canvas Slice:`, {
    startPixel,
    requestedHeight: heightPixels,
    actualHeightPixels,
    sourceCanvasHeight: sourceCanvas.height
  })
  
  // Set canvas size
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = actualHeightPixels
  
  // Draw the slice
  pageCtx.drawImage(
    sourceCanvas,
    0, startPixel, sourceCanvas.width, actualHeightPixels,
    0, 0, sourceCanvas.width, actualHeightPixels
  )
  
  return pageCanvas
}
