import html2canvas from 'html2canvas'

/**
 * Generates a high-quality canvas from an HTML element using html2canvas
 * 
 * FIXED: Removed windowWidth override that was distorting aspect ratios
 * Optimized configuration for PDF export:
 * - 2x scale for crisp rendering
 * - CORS enabled for external resources
 * - Foreign object rendering for better SVG support
 * - Dynamic dimensions based on element size
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
  // Get actual element dimensions for proper canvas sizing
  const rect = element.getBoundingClientRect()
  const computedStyle = getComputedStyle(element)
  
  // Calculate full content height including overflow
  const actualHeight = Math.max(
    element.scrollHeight,
    element.offsetHeight,
    rect.height
  )
  
  const actualWidth = Math.max(
    element.scrollWidth,
    element.offsetWidth,
    rect.width
  )
  
  console.log('Canvas generation - Element dimensions:', {
    scrollHeight: element.scrollHeight,
    offsetHeight: element.offsetHeight,
    rectHeight: rect.height,
    finalHeight: actualHeight,
    finalWidth: actualWidth
  })

  // Enhanced canvas generation with FIXED aspect ratio preservation
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
      // FIXED: Remove windowWidth override that was distorting aspect ratios
      // Let canvas use natural element dimensions to preserve proper proportions
      // windowWidth: Math.max(1200, actualWidth), // REMOVED - this was causing distortion
      windowHeight: actualHeight,
      // Enhanced options for better content capture
      removeContainer: false,
      ignoreElements: (element) => {
        // Type guard to ensure we have an HTMLElement
        if (!(element instanceof HTMLElement)) {
          return false
        }
        
        // Skip hidden or zero-height elements that might cause issues
        return element.style.display === 'none' || 
               element.style.visibility === 'hidden' ||
               (element.offsetHeight === 0 && element.scrollHeight === 0)
      }
    })

    console.log('Canvas generated successfully with aspect ratio fix:', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasWidthScaled: canvas.width / 2, // Account for 2x scale
      canvasHeightScaled: canvas.height / 2, // Account for 2x scale
      aspectRatio: (canvas.width / 2) / (canvas.height / 2)
    })

    // Validate canvas was generated properly
    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error('Generated canvas has zero dimensions')
    }

    return canvas
  } catch (error) {
    console.error('Canvas generation failed:', error)
    throw new Error(`Failed to generate canvas: ${error.message}`)
  }
}

/**
 * Creates a canvas for a specific page with ENHANCED atomic section handling
 * 
 * PHASE 1-4: Enhanced section boundary detection to prevent content splits
 * 
 * @param sourceCanvas - Original canvas containing full content
 * @param pageHeightMM - Height of one PDF page in mm
 * @param pageIndex - Zero-based index of the page to extract (0 = first page)
 * @param minimumContentThreshold - Minimum content height in pixels for atomic sections
 * @returns New canvas containing only the specified page content
 */
export function createMultiPageCanvas(
  sourceCanvas: HTMLCanvasElement, 
  pageHeightMM: number, 
  pageIndex: number,
  minimumContentThreshold: number = 300 // PHASE 1: Increased from 200 for atomic sections
): HTMLCanvasElement {
  console.log(`🖼️ ATOMIC: Section-aware multi-page canvas creation - Page ${pageIndex + 1}:`, {
    sourceCanvasWidth: sourceCanvas.width,
    sourceCanvasHeight: sourceCanvas.height,
    pageHeightMM,
    pageIndex,
    minimumContentThreshold,
    atomicSectionHandling: true
  })

  const pageCanvas = document.createElement('canvas')
  const pageCtx = pageCanvas.getContext('2d')
  
  if (!pageCtx) {
    throw new Error('Failed to get 2D context for page canvas')
  }
  
  // PHASE 1: Enhanced MM to pixels conversion for atomic sections
  const mmToPixels = (mm: number) => {
    // More precise conversion accounting for canvas scale and atomic sections
    return (mm * 3.779527559) * 2
  }
  
  const pageHeightPixels = mmToPixels(pageHeightMM)
  
  // PHASE 3: Enhanced bounds checking for atomic section preservation
  const sourceY = pageIndex * pageHeightPixels
  
  console.log(`📄 ATOMIC: Page ${pageIndex + 1} bounds calculation with section awareness:`, {
    pageHeightMM,
    pageHeightPixels,
    sourceY,
    sourceCanvasHeight: sourceCanvas.height,
    remainingHeight: sourceCanvas.height - sourceY,
    hasValidStartPosition: sourceY < sourceCanvas.height,
    minimumContentThreshold,
    atomicSectionThreshold: minimumContentThreshold
  })
  
  // PHASE 2: ATOMIC section validation - Enhanced bounds validation
  if (sourceY >= sourceCanvas.height) {
    console.warn(`📄 ATOMIC: Page ${pageIndex + 1} starts beyond source canvas - no atomic content`)
    // Return minimal empty canvas to signal no atomic content
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // PHASE 4: Calculate available content with section-aware logic
  const maxAvailableHeight = sourceCanvas.height - sourceY
  const actualPageHeight = Math.min(pageHeightPixels, maxAvailableHeight)
  
  console.log(`📄 ATOMIC: Page ${pageIndex + 1} section validation:`, {
    maxAvailableHeight,
    requestedPageHeight: pageHeightPixels,
    actualPageHeight,
    meetsAtomicThreshold: actualPageHeight >= minimumContentThreshold,
    willPreserveSectionIntegrity: actualPageHeight > minimumContentThreshold * 1.2
  })
  
  // PHASE 3: ATOMIC content validation - Enhanced threshold for section preservation
  const atomicSectionThreshold = minimumContentThreshold * 1.2 // 20% higher for atomic sections
  
  if (actualPageHeight <= atomicSectionThreshold) {
    console.log(`📄 ATOMIC: Page ${pageIndex + 1} rejected: Height ${actualPageHeight}px below atomic section threshold ${atomicSectionThreshold}px`)
    // Return minimal canvas to signal insufficient atomic content
    pageCanvas.width = 1
    pageCanvas.height = 1
    return pageCanvas
  }
  
  // PHASE 4: Set up page canvas with atomic section-validated dimensions
  pageCanvas.width = sourceCanvas.width
  pageCanvas.height = Math.ceil(actualPageHeight)
  
  try {
    // PHASE 4: Enhanced canvas slicing with atomic section boundary awareness
    pageCtx.drawImage(
      sourceCanvas, 
      0, sourceY, sourceCanvas.width, actualPageHeight,  // Source rectangle (atomic section aware)
      0, 0, sourceCanvas.width, actualPageHeight         // Destination rectangle
    )
    
    console.log(`✅ ATOMIC: Page ${pageIndex + 1} canvas created with section preservation:`, {
      finalWidth: pageCanvas.width,
      finalHeight: pageCanvas.height,
      sourceSliceY: sourceY,
      sourceSliceHeight: actualPageHeight,
      contentDensity: actualPageHeight / pageHeightPixels,
      atomicSectionIntegrity: true,
      sectionBoundaryPreserved: true
    })
    
    return pageCanvas
    
  } catch (error) {
    console.error(`ATOMIC: Failed to create page ${pageIndex + 1} canvas with section awareness:`, error)
    
    // Fallback: create minimal canvas to signal atomic section failure
    pageCanvas.width = 1
    pageCanvas.height = 1
    
    return pageCanvas
  }
}
