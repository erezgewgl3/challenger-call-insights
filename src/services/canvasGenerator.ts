
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
 * Creates a canvas for a specific page from a larger canvas for multi-page PDF generation
 * 
 * ENHANCED: Improved content validation and bounds checking to prevent meaningless pages
 * 
 * @param sourceCanvas - Original canvas containing full content
 * @param pageHeightMM - Height of one PDF page in mm
 * @param pageIndex - Zero-based index of the page to extract (0 = first page)
 * @param minimumContentThreshold - Minimum content height in pixels to create a valid page
 * @returns New canvas containing only the specified page content
 */
export function createMultiPageCanvas(
  sourceCanvas: HTMLCanvasElement, 
  pageHeightMM: number, 
  pageIndex: number,
  minimumContentThreshold: number = 100
): HTMLCanvasElement {
  console.log(`🖼️ Enhanced multi-page canvas creation - Page ${pageIndex + 1}:`, {
    sourceCanvasWidth: sourceCanvas.width,
    sourceCanvasHeight: sourceCanvas.height,
    pageHeightMM,
    pageIndex,
    minimumContentThreshold
  })

  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    throw new Error('Failed to get 2D context for page canvas')
  }
  
  // ENHANCED: More precise MM to pixels conversion accounting for canvas scale
  const mmToPixels = (mm: number) => {
    // 1mm = 3.779527559 pixels at 96 DPI, account for 2x scale from html2canvas
    return (mm * 3.779527559) * 2
  }
  
  const pageHeightPixels = mmToPixels(pageHeightMM)
  
  // ENHANCED: Better bounds checking and content validation
  const sourceY = pageIndex * pageHeightPixels
  
  console.log(`📄 Page ${pageIndex + 1} enhanced bounds calculation:`, {
    pageHeightMM,
    pageHeightPixels,
    sourceY,
    sourceCanvasHeight: sourceCanvas.height,
    remainingHeight: sourceCanvas.height - sourceY,
    hasValidStartPosition: sourceY < sourceCanvas.height,
    minimumContentThreshold
  })
  
  // CRITICAL: Enhanced bounds validation with content awareness
  if (sourceY >= sourceCanvas.height) {
    console.warn(`📄 Page ${pageIndex + 1} starts beyond source canvas height - no meaningful content`)
    // Return minimal empty canvas to signal no content
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // Calculate how much content is actually available for this page
  const maxAvailableHeight = sourceCanvas.height - sourceY
  const actualPageHeight = Math.min(pageHeightPixels, maxAvailableHeight)
  
  console.log(`📄 Page ${pageIndex + 1} content validation:`, {
    maxAvailableHeight,
    requestedPageHeight: pageHeightPixels,
    actualPageHeight,
    meetsMinimumThreshold: actualPageHeight >= minimumContentThreshold,
    contentWillBeMeaningful: actualPageHeight > minimumContentThreshold
  })
  
  // CRITICAL: Enhanced content validation - reject pages with insufficient content
  if (actualPageHeight <= minimumContentThreshold) {
    console.log(`📄 Page ${pageIndex + 1} rejected: Content height ${actualPageHeight}px below threshold ${minimumContentThreshold}px`)
    // Return minimal canvas to signal insufficient content
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // Set up page canvas with validated dimensions
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = Math.ceil(actualPageHeight)
  
  try {
    // ENHANCED: Canvas slicing with content validation
    pageCtx.drawImage(
      sourceCanvas, 
      0, sourceY, sourceCanvas.width, actualPageHeight,  // Source rectangle
      0, 0, sourceCanvas.width, actualPageHeight         // Destination rectangle
    )
    
    console.log(`✅ Page ${pageIndex + 1} canvas created with validated content:`, {
      finalWidth: pageCanvas.width,
      finalHeight: pageCanvas.height,
      sourceSliceY: sourceY,
      sourceSliceHeight: actualPageHeight,
      contentDensity: actualPageHeight / pageHeightPixels
    })
    
    return pageCanvas
    
  } catch (error) {
    console.error(`Failed to create page ${pageIndex + 1} canvas:`, error)
    console.log('Creating minimal fallback canvas')
    
    // Fallback: create a minimal canvas to signal failure
    pageCanvas.width = 1
    pageCanvas.height = 1
    
    return pageCanvas
  }
}
