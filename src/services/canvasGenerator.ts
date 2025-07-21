
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
 * FIXED: Canvas generation with simplified options to avoid iframe cloning issues
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
    // FIXED: Simplified html2canvas options to avoid iframe cloning issues
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: 'white',
      // REMOVED: foreignObjectRendering - causes iframe cloning issues
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
      // SIMPLIFIED: Remove complex element filtering that can cause issues
      ignoreElements: (element) => {
        if (!(element instanceof HTMLElement)) {
          return false
        }
        // Only ignore clearly hidden elements
        const style = window.getComputedStyle(element)
        return style.display === 'none' || style.visibility === 'hidden'
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
    console.error('Canvas generation failed:', {
      error: error.message,
      stack: error.stack,
      elementInfo: {
        tagName: element.tagName,
        className: element.className,
        hasContent: element.innerHTML.length > 0,
        isVisible: element.offsetWidth > 0 && element.offsetHeight > 0
      }
    })
    
    // FALLBACK: Try with even more simplified options
    try {
      console.log('Attempting fallback canvas generation with minimal options...')
      const fallbackCanvas = await html2canvas(element, {
        scale: 1,
        backgroundColor: 'white',
        logging: false,
        useCORS: true,
        allowTaint: true
      })
      
      console.log('Fallback canvas generated:', {
        width: fallbackCanvas.width,
        height: fallbackCanvas.height
      })
      
      return fallbackCanvas
    } catch (fallbackError) {
      console.error('Fallback canvas generation also failed:', fallbackError)
      throw new Error(`Both primary and fallback canvas generation failed: ${error.message}`)
    }
  }
}
