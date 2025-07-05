
import html2canvas from 'html2canvas'

/**
 * SIMPLIFIED canvas generation - removed complex aspect ratio and sizing logic
 */
export async function generateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Get actual element dimensions
  const rect = element.getBoundingClientRect()
  
  // SIMPLE: Use the larger of scroll dimensions or bounding rect
  const actualHeight = Math.max(element.scrollHeight, rect.height)
  const actualWidth = Math.max(element.scrollWidth, rect.width)
  
  console.log('SIMPLIFIED Canvas generation:', {
    scrollHeight: element.scrollHeight,
    rectHeight: rect.height,
    finalHeight: actualHeight,
    finalWidth: actualWidth
  })

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
      windowHeight: actualHeight,
      // SIMPLIFIED: Remove complex element filtering
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false
        }
        return element.style.display === 'none' || element.style.visibility === 'hidden'
      }
    })

    console.log('SIMPLIFIED Canvas generated:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      aspectRatio: canvas.width / canvas.height
    })

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated canvas has zero dimensions')
    }

    return canvas
  } catch (error) {
    console.error('Canvas generation failed:', error)
    throw new Error(`Failed to generate canvas: ${error.message}`)
  }
}

// REMOVED: Complex createMultiPageCanvas function - now handled in pdfGenerator with simple slicing
