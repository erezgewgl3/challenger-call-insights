
import html2canvas from 'html2canvas'

/**
 * Validates element dimensions against viewport to prevent cutoff
 */
function validateElementDimensions(element: HTMLElement): { isValid: boolean; warnings: string[] } {
  const rect = element.getBoundingClientRect()
  const warnings: string[] = []
  let isValid = true
  
  // Check if element exceeds viewport width
  if (rect.width > window.innerWidth) {
    warnings.push(`Element width (${Math.round(rect.width)}px) exceeds viewport width (${window.innerWidth}px)`)
    isValid = false
  }
  
  // Check if element is positioned outside viewport
  if (rect.left < 0) {
    warnings.push(`Element positioned ${Math.abs(Math.round(rect.left))}px to the left of viewport`)
  }
  
  if (rect.right > window.innerWidth) {
    warnings.push(`Element extends ${Math.round(rect.right - window.innerWidth)}px beyond right edge of viewport`)
  }
  
  return { isValid, warnings }
}

/**
 * FIXED canvas generation with proper dimensions and validation
 */
export async function generateCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Validate element dimensions before canvas generation
  const validation = validateElementDimensions(element)
  
  if (validation.warnings.length > 0) {
    console.warn('Element dimension warnings:', validation.warnings)
  }
  
  // Get actual element dimensions
  const rect = element.getBoundingClientRect()
  
  // FIXED: Use the element's actual rendered dimensions
  const actualHeight = Math.max(element.scrollHeight, rect.height)
  const actualWidth = Math.max(element.scrollWidth, rect.width)
  
  console.log('FIXED Canvas generation with validation:', {
    scrollHeight: element.scrollHeight,
    rectHeight: rect.height,
    finalHeight: actualHeight,
    finalWidth: actualWidth,
    viewportWidth: window.innerWidth,
    validationWarnings: validation.warnings
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

    console.log('FIXED Canvas generated with proper validation:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      wasValidDimensions: validation.isValid
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
