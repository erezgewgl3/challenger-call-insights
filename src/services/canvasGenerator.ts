
import html2canvas from 'html2canvas'

/**
 * Enhanced canvas generation with production positioning fixes
 */
export async function generateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Get actual element dimensions
  const rect = element.getBoundingClientRect()
  
  // PRODUCTION FIX: Ensure proper positioning and dimensions
  const actualHeight = Math.max(element.scrollHeight, rect.height)
  const actualWidth = Math.max(element.scrollWidth, rect.width)
  
  // PRODUCTION FIX: Force element to top-left position before capture
  const originalPosition = element.style.position
  const originalLeft = element.style.left
  const originalTop = element.style.top
  const originalTransform = element.style.transform
  
  // Temporarily position element for consistent capture
  element.style.position = 'relative'
  element.style.left = '0px'
  element.style.top = '0px'
  element.style.transform = 'none'
  
  console.log('Enhanced canvas generation with production positioning fixes:', {
    scrollHeight: element.scrollHeight,
    rectHeight: rect.height,
    finalHeight: actualHeight,
    finalWidth: actualWidth,
    positioningApplied: true
  })

  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Increased from 2 to 3 for crisper text rendering
      useCORS: true,
      allowTaint: false, // Changed to false for better text quality
      backgroundColor: '#ffffff', // Changed to white for better contrast
      foreignObjectRendering: true,
      imageTimeout: 15000,
      logging: false,
      // PRODUCTION FIX: Force scroll positions to zero for consistent positioning
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: actualWidth,
      height: actualHeight,
      windowHeight: actualHeight,
      windowWidth: actualWidth,
      // PRODUCTION FIX: Enhanced element filtering
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false
        }
        return element.style.display === 'none' || 
               element.style.visibility === 'hidden' ||
               element.classList.contains('pdf-ignore')
      },
      // Enhanced options for crisp text rendering
      removeContainer: true // Changed to true for better quality
    })

    console.log('Enhanced canvas generated with production fixes:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      positioningFixed: true
    })

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated canvas has zero dimensions')
    }

    return canvas
  } catch (error) {
    console.error('Canvas generation failed:', error)
    throw new Error(`Failed to generate canvas: ${error.message}`)
  } finally {
    // PRODUCTION FIX: Restore original positioning
    element.style.position = originalPosition
    element.style.left = originalLeft
    element.style.top = originalTop
    element.style.transform = originalTransform
  }
}
