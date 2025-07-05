
import html2canvas from 'html2canvas'

/**
 * FIXED canvas generation with proper dimensions
 */
export async function generateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Get actual element dimensions
  const rect = element.getBoundingClientRect()
  
  // FIXED: Use the element's actual rendered dimensions
  const actualHeight = Math.max(element.scrollHeight, rect.height)
  const actualWidth = Math.max(element.scrollWidth, rect.width)
  
  console.log('FIXED Canvas generation with proper dimensions:', {
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
      // FIXED: Simple element filtering
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false
        }
        return element.style.display === 'none' || element.style.visibility === 'hidden'
      }
    })

    console.log('FIXED Canvas generated with proper pixel dimensions:', {
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
