
import html2canvas from 'html2canvas'

/**
 * Enhanced canvas generation with production positioning fixes
 */
export async function generateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // PRODUCTION FIX: Store current scroll position for restoration
  const originalScrollY = window.scrollY
  const originalScrollX = window.scrollX
  
  // PRODUCTION FIX: Scroll element to top of viewport for consistent capture
  element.scrollIntoView({ behavior: 'instant', block: 'start' })
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  
  // Wait for scroll and layout to stabilize
  await new Promise(resolve => setTimeout(resolve, 100))
  
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
      scale: 2.5, // Phase 4: Reduced from 3x to 2.5x for balanced quality/performance
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      foreignObjectRendering: true,
      imageTimeout: 15000,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: actualWidth,
      height: actualHeight,
      windowHeight: actualHeight,
      windowWidth: actualWidth,
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false
        }
        return element.style.display === 'none' || 
               element.style.visibility === 'hidden' ||
               element.classList.contains('pdf-ignore')
      },
      removeContainer: true,
      // Enhanced font smoothing and Hebrew font loading through onclone
      onclone: async (clonedDoc) => {
        // Wait for all fonts to be loaded
        await clonedDoc.fonts.ready
        
        const clonedElement = clonedDoc.getElementById(element.id)
        if (clonedElement) {
          // Apply Hebrew-compatible fonts to all text elements
          const allElements = clonedElement.querySelectorAll('*')
          allElements.forEach(el => {
            if (el instanceof HTMLElement) {
              const computedStyle = window.getComputedStyle(el)
              const currentFont = computedStyle.fontFamily
              
              // Apply Rubik for Hebrew support, fallback to Arial
              el.style.fontFamily = 'Rubik, Arial, sans-serif'
              
              // Force crisp text rendering
              const style = el.style as any
              style.webkitFontSmoothing = 'antialiased'
              style.mozOsxFontSmoothing = 'grayscale'
              style.textRendering = 'optimizeLegibility'
            }
          })
        }
      }
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
    
    // PRODUCTION FIX: Restore original scroll position
    window.scrollTo({ top: originalScrollY, left: originalScrollX, behavior: 'instant' })
  }
}
