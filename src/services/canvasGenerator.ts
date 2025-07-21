
import html2canvas from 'html2canvas'

/**
 * ENHANCED: Validates element dimensions against viewport to prevent cutoff
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
  
  // ENHANCED: Check for Tailwind constraints that might cause issues
  const computedStyle = window.getComputedStyle(element)
  if (computedStyle.maxWidth && computedStyle.maxWidth !== 'none') {
    const maxWidthValue = parseInt(computedStyle.maxWidth)
    if (maxWidthValue < rect.width) {
      warnings.push(`Element has max-width constraint (${computedStyle.maxWidth}) smaller than actual width (${Math.round(rect.width)}px)`)
    }
  }
  
  return { isValid, warnings }
}

/**
 * ENHANCED canvas generation with PDF export support
 */
export async function generateCanvas(element: HTMLElement, forPDF: boolean = false): Promise<HTMLCanvasElement> {
  // ENHANCED: Validate element dimensions before canvas generation
  const validation = validateElementDimensions(element)
  
  if (validation.warnings.length > 0) {
    console.warn('Element dimension warnings:', validation.warnings)
  }
  
  // Get actual element dimensions
  const rect = element.getBoundingClientRect()
  
  // ENHANCED: Use full element dimensions for PDF, viewport-safe for regular use
  const actualHeight = Math.max(element.scrollHeight, rect.height)
  const actualWidth = forPDF ? 
    Math.max(element.scrollWidth, rect.width) : // Full width for PDF
    Math.min(element.scrollWidth, window.innerWidth) // Viewport-safe for regular use
  
  console.log('ENHANCED Canvas generation with PDF support:', {
    forPDF,
    scrollHeight: element.scrollHeight,
    rectHeight: rect.height,
    scrollWidth: element.scrollWidth,
    rectWidth: rect.width,
    finalHeight: actualHeight,
    finalWidth: actualWidth,
    viewportWidth: window.innerWidth,
    validationWarnings: validation.warnings,
    hasMaxWidthConstraint: window.getComputedStyle(element).maxWidth !== 'none'
  })

  // Add nuclear debug for PDF generation library
  if (forPDF) {
    console.log('🔍 PDF Generation Debug:', {
      library: typeof html2canvas !== 'undefined' ? 'html2canvas' : 'unknown',
      elementBounds: rect,
      documentBody: document.body.getBoundingClientRect(),
      scrollPosition: { x: window.scrollX, y: window.scrollY }
    });
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      foreignObjectRendering: true,
      imageTimeout: 15000,
      logging: true, // Enable logging to debug
      scrollX: 0,
      scrollY: 0,
      x: forPDF ? 0 : undefined, // Force capture from left edge for PDF
      y: forPDF ? 0 : undefined, // Force capture from top edge for PDF  
      width: forPDF ? 794 : actualWidth, // Force A4 width for PDF
      height: actualHeight,
      windowWidth: forPDF ? 794 : window.innerWidth, // Set window width for PDF
      windowHeight: actualHeight,
      // ENHANCED: Improved element filtering
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false
        }
        // Skip hidden elements and elements that might cause issues
        const style = window.getComputedStyle(element)
        return style.display === 'none' || 
               style.visibility === 'hidden' ||
               style.opacity === '0'
      }
    })

    console.log('ENHANCED Canvas generated with PDF support:', {
      forPDF,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      wasValidDimensions: validation.isValid,
      capturedFullWidth: canvas.width >= (actualWidth * 2), // Account for 2x scale
      noHorizontalCutoff: forPDF || validation.isValid
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
