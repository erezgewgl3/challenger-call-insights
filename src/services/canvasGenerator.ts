
import html2canvas from 'html2canvas'

/**
 * Generates a high-quality canvas from an HTML element using html2canvas
 * 
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

  // Enhanced canvas generation with better error handling
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
      windowWidth: Math.max(1200, actualWidth),
      windowHeight: actualHeight,
      // Enhanced options for better content capture
      removeContainer: false,
      ignoreElements: (element) => {
        // Skip hidden or zero-height elements that might cause issues
        return element.style.display === 'none' || 
               element.style.visibility === 'hidden' ||
               (element.offsetHeight === 0 && element.scrollHeight === 0)
      }
    })

    console.log('Canvas generated - Final dimensions:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasHeightMM: canvas.height * 0.264583
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
 * FIXED: Enhanced error handling and proper dimension calculations
 * 
 * @param sourceCanvas - Original canvas containing full content
 * @param pageHeightMM - Height of one PDF page in mm
 * @param pageIndex - Zero-based index of the page to extract (0 = first page)
 * @returns New canvas containing only the specified page content
 */
export function createMultiPageCanvas(
  sourceCanvas: HTMLCanvasElement, 
  pageHeightMM: number, 
  pageIndex: number
): HTMLCanvasElement {
  console.log(`🖼️ Creating multi-page canvas - Page ${pageIndex + 1}:`, {
    sourceCanvasWidth: sourceCanvas.width,
    sourceCanvasHeight: sourceCanvas.height,
    pageHeightMM,
    pageIndex
  })

  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    throw new Error('Failed to get 2D context for page canvas')
  }
  
  // FIXED: More precise MM to pixels conversion
  const mmToPixels = (mm: number) => {
    // 1mm = 3.779527559 pixels at 96 DPI, account for 2x scale
    return (mm * 3.779527559) * 2
  }
  
  const pageHeightPixels = mmToPixels(pageHeightMM)
  
  // Calculate source Y position and height for this page
  const sourceY = pageIndex * pageHeightPixels
  
  // FIXED: Ensure we never exceed source canvas bounds
  const maxAvailableHeight = sourceCanvas.height - sourceY
  const sourceHeight = Math.min(pageHeightPixels, maxAvailableHeight)
  
  // FIXED: Enhanced validation
  if (sourceY >= sourceCanvas.height) {
    console.warn(`Page ${pageIndex + 1} starts beyond source canvas height`)
    // Return a minimal canvas instead of throwing
    pageCanvas.width = sourceCanvas.width
    pageCanvas.height = 1
    return pageCanvas
  }
  
  if (sourceHeight <= 0) {
    console.warn(`Invalid source height for page ${pageIndex + 1}: ${sourceHeight}`)
    // Return a minimal canvas instead of throwing
    pageCanvas.width = sourceCanvas.width
    pageCanvas.height = 1
    return pageCanvas
  }
  
  console.log(`📄 Page ${pageIndex + 1} canvas dimensions:`, {
    pageHeightMM,
    pageHeightPixels,
    sourceY,
    sourceHeight,
    maxAvailableHeight,
    remainingContent: sourceCanvas.height - sourceY
  })
  
  // Set up page canvas
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = Math.ceil(sourceHeight) // Ensure integer height
  
  try {
    // Draw the specific page section
    pageCtx.drawImage(
      sourceCanvas, 
      0, sourceY, sourceCanvas.width, sourceHeight,
      0, 0, sourceCanvas.width, sourceHeight
    )
    
    console.log(`✅ Page ${pageIndex + 1} canvas created successfully`)
    return pageCanvas
    
  } catch (error) {
    console.error(`Failed to create page ${pageIndex + 1} canvas:`, error)
    console.log('Fallback: Creating minimal canvas')
    
    // Fallback: create a minimal canvas
    pageCanvas.width = sourceCanvas.width
    pageCanvas.height = 1
    return pageCanvas
  }
}
