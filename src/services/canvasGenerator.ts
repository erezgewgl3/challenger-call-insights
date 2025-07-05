
import html2canvas from 'html2canvas'

/**
 * Generates a high-quality canvas from an HTML element using html2canvas
 * 
 * Optimized configuration for PDF export:
 * - 2x scale for crisp rendering
 * - CORS enabled for external resources
 * - Foreign object rendering for better SVG support
 * - Fixed dimensions for consistent output
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
  // Generate canvas with simplified configuration
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
    width: 1200,
    height: element.scrollHeight,
    windowWidth: 1200,
    windowHeight: element.scrollHeight
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
 * @param pageHeight - Height of one PDF page in mm
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
  pageHeight: number, 
  pageIndex: number
): HTMLCanvasElement {
  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    throw new Error('Failed to get 2D context for page canvas')
  }
  
  // Calculate source dimensions - convert PDF mm to canvas pixels
  const sourceY = pageIndex * (pageHeight / 0.264583) // Convert back to canvas pixels
  const sourceHeight = Math.min((pageHeight / 0.264583), sourceCanvas.height - sourceY)
  
  if (sourceHeight <= 0) {
    throw new Error('Invalid source height for page canvas')
  }
  
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
