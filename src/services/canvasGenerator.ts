
import html2canvas from 'html2canvas'

/**
 * Generates a high-quality canvas from an HTML element using html2canvas
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
  
  // Calculate source dimensions
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
