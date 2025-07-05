
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

  // Generate canvas with dynamic sizing based on actual content
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
    windowHeight: actualHeight
  })

  console.log('Canvas generated - Final dimensions:', {
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    canvasHeightMM: canvas.height * 0.264583
  })

  return canvas
}

/**
 * Creates a canvas for a specific page from a larger canvas for multi-page PDF generation
 * 
 * Extracts a vertical slice of the source canvas corresponding to one PDF page.
 * Handles coordinate conversion between PDF measurements and canvas pixels.
 * 
 * @param sourceCanvas - Original canvas containing full content
 * @param pageHeightMM - Height of one PDF page in mm
 * @param pageIndex - Zero-based index of the page to extract (0 = first page)
 * @returns New canvas containing only the specified page content
 * 
 * @throws Will throw if:
 * - Canvas context cannot be created
 * - Page dimensions are invalid
 * - Source canvas is insufficient for requested page
 * 
 * @example
 * ```typescript
 * const fullCanvas = await generateCanvas(longElement);
 * const page1Canvas = createMultiPageCanvas(fullCanvas, 250, 0); // First page
 * const page2Canvas = createMultiPageCanvas(fullCanvas, 250, 1); // Second page
 * ```
 */
export function createMultiPageCanvas(
  sourceCanvas: HTMLCanvasElement, 
  pageHeightMM: number, 
  pageIndex: number
): HTMLCanvasElement {
  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    throw new Error('Failed to get 2D context for page canvas')
  }
  
  // Convert MM to pixels (more precise conversion)
  const mmToPixels = (mm: number) => (mm / 25.4) * 96 * 2 // Account for 2x scale
  const pageHeightPixels = mmToPixels(pageHeightMM)
  
  // Calculate source Y position and height for this page
  const sourceY = pageIndex * pageHeightPixels
  const sourceHeight = Math.min(pageHeightPixels, sourceCanvas.height - sourceY)
  
  if (sourceHeight <= 0) {
    throw new Error(`Invalid source height for page ${pageIndex + 1}: ${sourceHeight}`)
  }
  
  console.log(`Page ${pageIndex + 1} canvas creation:`, {
    pageHeightMM,
    pageHeightPixels,
    sourceY,
    sourceHeight,
    remainingContent: sourceCanvas.height - sourceY
  })
  
  // Set up page canvas
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = sourceHeight
  
  // Draw the specific page section
  pageCtx.drawImage(
    sourceCanvas, 
    0, sourceY, sourceCanvas.width, sourceHeight,
    0, 0, sourceCanvas.width, sourceHeight
  )
  
  return pageCanvas
}
