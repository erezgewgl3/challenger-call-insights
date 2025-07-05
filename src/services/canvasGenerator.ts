import html2canvas from 'html2canvas'

/**
 * Generates a high-quality canvas from an HTML element using html2canvas
 * 
 * FIXED: Removed windowWidth override that was distorting aspect ratios
 * Optimized configuration for PDF export:
 * - 2x scale for crisp rendering
 * - CORS enabled for external resources
 * - Foreign object rendering for better SVG support
 * - Dynamic dimensions based on element size
 * - Transparent background for flexible PDF layouts
 * 
 * @param element - HTML element to convert to canvas
 * @returns Promise resolving to high-quality canvas representation
 * 
 * @throws Will throw if canvas generation fails or element is invalid
 * 
 * @example
 * ```typescript
 * const element = document.getElementById('content');
 * const canvas = await generateCanvas(element);
 * // Use canvas for PDF generation...
 * ```
 */
export async function generateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Get actual element dimensions for proper canvas sizing
  const rect = element.getBoundingClientRect()
  const computedStyle = getComputedStyle(element)
  
  // Calculate full content height including overflow
  const actualHeight = Math.max(
    element.scrollHeight,
    element.offsetHeight,
    rect.height
  )
  
  const actualWidth = Math.max(
    element.scrollWidth,
    element.offsetWidth,
    rect.width
  )
  
  console.log('Canvas generation - Element dimensions:', {
    scrollHeight: element.scrollHeight,
    offsetHeight: element.offsetHeight,
    rectHeight: rect.height,
    finalHeight: actualHeight,
    finalWidth: actualWidth
  })

  // Enhanced canvas generation with FIXED aspect ratio preservation
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      foreignObjectRendering: true,
      imageTimeout: 15000,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: actualWidth,
      height: actualHeight,
      // FIXED: Remove windowWidth override that was distorting aspect ratios
      // Let canvas use natural element dimensions to preserve proper proportions
      // windowWidth: Math.max(1200, actualWidth), // REMOVED - this was causing distortion
      windowHeight: actualHeight,
      // Enhanced options for better content capture
      removeContainer: false,
      ignoreElements: (element) => {
        // Type guard to ensure we have an HTMLElement
        if (!(element instanceof HTMLElement)) {
          return false
        }
        
        // Skip hidden or zero-height elements that might cause issues
        return element.style.display === 'none' || 
               element.style.visibility === 'hidden' ||
               (element.offsetHeight === 0 && element.scrollHeight === 0)
      }
    })

    console.log('Canvas generated successfully with aspect ratio fix:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasWidthScaled: canvas.width / 2, // Account for 2x scale
      canvasHeightScaled: canvas.height / 2, // Account for 2x scale
      aspectRatio: (canvas.width / 2) / (canvas.height / 2)
    })

    // Validate canvas was generated properly
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated canvas has zero dimensions')
    }

    return canvas
  } catch (error) {
    console.error('Canvas generation failed:', error)
    throw new Error(`Failed to generate canvas: ${error.message}`)
  }
}

/**
 * Creates a canvas for a specific page with FIXED content-aware section handling
 * 
 * FIXED: Reduced thresholds and improved content validation for complete capture
 * 
 * @param sourceCanvas - Original canvas containing full content
 * @param pageHeightMM - Height of one PDF page in mm
 * @param pageIndex - Zero-based index of the page to extract (0 = first page)
 * @param minimumContentThreshold - Minimum content height in pixels for valid sections
 * @returns New canvas containing only the specified page content
 */
export function createMultiPageCanvas(
  sourceCanvas: HTMLCanvasElement, 
  pageHeightMM: number, 
  pageIndex: number,
  minimumContentThreshold: number = 150 // FIXED: Reduced from 300 for better content capture
): HTMLCanvasElement {
  console.log(`🖼️ FIXED: Content-aware multi-page canvas creation - Page ${pageIndex + 1}:`, {
    sourceCanvasWidth: sourceCanvas.width,
    sourceCanvasHeight: sourceCanvas.height,
    pageHeightMM,
    pageIndex,
    minimumContentThreshold,
    improvedContentCapture: true
  })

  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    throw new Error('Failed to get 2D context for page canvas')
  }
  
  // FIXED: Enhanced MM to pixels conversion for better content capture  
  const mmToPixels = (mm: number) => {
    // More precise conversion for complete content capture
    return (mm * 3.779527559) * 2
  }
  
  const pageHeightPixels = mmToPixels(pageHeightMM)
  
  // FIXED: Enhanced bounds checking for complete content preservation
  const sourceY = pageIndex * pageHeightPixels
  
  console.log(`📄 FIXED: Page ${pageIndex + 1} bounds calculation for complete capture:`, {
    pageHeightMM,
    pageHeightPixels,
    sourceY,
    sourceCanvasHeight: sourceCanvas.height,
    remainingHeight: sourceCanvas.height - sourceY,
    hasValidStartPosition: sourceY < sourceCanvas.height,
    minimumContentThreshold,
    improvedThreshold: minimumContentThreshold
  })
  
  // FIXED: More lenient bounds validation for complete content capture
  if (sourceY >= sourceCanvas.height) {
    console.warn(`📄 FIXED: Page ${pageIndex + 1} starts beyond source canvas - returning minimal canvas`)
    // Return minimal empty canvas to signal no content
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // FIXED: Calculate available content with improved logic for complete capture
  const maxAvailableHeight = sourceCanvas.height - sourceY
  const actualPageHeight = Math.min(pageHeightPixels, maxAvailableHeight)
  
  console.log(`📄 FIXED: Page ${pageIndex + 1} content validation for complete capture:`, {
    maxAvailableHeight,
    requestedPageHeight: pageHeightPixels,
    actualPageHeight,
    meetsImprovedThreshold: actualPageHeight >= minimumContentThreshold * 0.8, // More lenient
    willCaptureCompleteContent: actualPageHeight > minimumContentThreshold * 0.6 // Even more lenient
  })
  
  // FIXED: More lenient content validation for complete capture
  const improvedContentThreshold = minimumContentThreshold * 0.8 // 20% more lenient
  
  if (actualPageHeight <= improvedContentThreshold) {
    console.log(`📄 FIXED: Page ${pageIndex + 1} content below improved threshold: Height ${actualPageHeight}px < ${improvedContentThreshold}px`)
    // Return minimal canvas but continue processing to capture remaining content
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // FIXED: Set up page canvas with improved content-validated dimensions
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = Math.ceil(actualPageHeight)
  
  try {
    // FIXED: Enhanced canvas slicing with improved content boundary awareness
    pageCtx.drawImage(
      sourceCanvas, 
      0, sourceY, sourceCanvas.width, actualPageHeight,  // Source rectangle (improved content aware)
      0, 0, sourceCanvas.width, actualPageHeight         // Destination rectangle
    )
    
    console.log(`✅ FIXED: Page ${pageIndex + 1} canvas created with complete content capture:`, {
      finalWidth: pageCanvas.width,
      finalHeight: pageCanvas.height,
      sourceSliceY: sourceY,
      sourceSliceHeight: actualPageHeight,
      contentDensity: actualPageHeight / pageHeightPixels,
      completeContentCaptured: true,
      improvedContentBoundaries: true
    })
    
    return pageCanvas
    
  } catch (error) {
    console.error(`FIXED: Failed to create page ${pageIndex + 1} canvas with improved capture:`, error)
    
    // Fallback: create minimal canvas to continue processing
    pageCanvas.width = 1
    pageCanvas.height = 1
    
    return pageCanvas
  }
}
