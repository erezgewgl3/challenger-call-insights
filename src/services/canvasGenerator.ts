
import html2canvas from 'html2canvas'

/**
 * ENHANCED: Validates element dimensions and ensures proper measurement
 */
function validateAndMeasureElement(element: HTMLElement): { isValid: boolean; dimensions: { width: number; height: number }; warnings: string[] } {
  const rect = element.getBoundingClientRect()
  const warnings: string[] = []
  let isValid = true
  
  // Get computed dimensions
  const computedStyle = window.getComputedStyle(element)
  const scrollWidth = element.scrollWidth
  const scrollHeight = element.scrollHeight
  
  // Use the largest available dimension
  const finalWidth = Math.max(rect.width, scrollWidth, 794) // 794px = 210mm
  const finalHeight = Math.max(rect.height, scrollHeight, 1123) // 1123px = 297mm
  
  console.log('Element measurement:', {
    rectWidth: rect.width,
    rectHeight: rect.height,
    scrollWidth,
    scrollHeight,
    finalWidth,
    finalHeight,
    computedWidth: computedStyle.width,
    computedHeight: computedStyle.height
  })
  
  // Validate dimensions
  if (finalWidth < 100 || finalHeight < 100) {
    warnings.push(`Element dimensions too small: ${finalWidth}x${finalHeight}`)
    isValid = false
  }
  
  return { 
    isValid, 
    dimensions: { width: finalWidth, height: finalHeight },
    warnings 
  }
}

/**
 * ENHANCED canvas generation with PDF export support and proper error handling
 */
export async function generateCanvas(element: HTMLElement, forPDF: boolean = false): Promise<HTMLCanvasElement> {
  console.log('Starting canvas generation...', { forPDF })
  
  // Wait for fonts and images to load
  if (document.fonts) {
    await document.fonts.ready
  }
  
  // Additional wait for content to settle
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Validate and measure element
  const validation = validateAndMeasureElement(element)
  
  if (validation.warnings.length > 0) {
    console.warn('Element measurement warnings:', validation.warnings)
  }
  
  if (!validation.isValid) {
    throw new Error(`Invalid element dimensions: ${validation.warnings.join(', ')}`)
  }
  
  const { width: finalWidth, height: finalHeight } = validation.dimensions
  
  console.log('Canvas generation config:', {
    forPDF,
    finalWidth,
    finalHeight,
    scale: 2,
    backgroundColor: 'white'
  })

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white',
      foreignObjectRendering: true,
      imageTimeout: 15000,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: finalWidth,
      height: finalHeight,
      windowWidth: forPDF ? 794 : window.innerWidth,
      windowHeight: finalHeight,
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false
        }
        const style = window.getComputedStyle(element)
        return style.display === 'none' || 
               style.visibility === 'hidden' ||
               style.opacity === '0'
      }
    })

    console.log('Canvas generated successfully:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      aspectRatio: canvas.width / canvas.height,
      nonZeroDimensions: canvas.width > 0 && canvas.height > 0
    })

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(`Generated canvas has zero dimensions: ${canvas.width}x${canvas.height}`)
    }

    return canvas
  } catch (error) {
    console.error('Canvas generation failed:', error)
    throw new Error(`Failed to generate canvas: ${error.message}`)
  }
}
