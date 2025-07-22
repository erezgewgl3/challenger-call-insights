
/**
 * Stores the original styles of an element for later restoration
 */
export function storeElementStyles(element: HTMLElement): Record<string, string> {
  return {
    position: element.style.position,
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minWidth: element.style.minWidth,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
    minHeight: element.style.minHeight,
    overflow: element.style.overflow,
    overflowX: element.style.overflowX,
    overflowY: element.style.overflowY,
    transform: element.style.transform,
    backgroundColor: element.style.backgroundColor,
    flex: element.style.flex,
    flexShrink: element.style.flexShrink,
    wordBreak: element.style.wordBreak,
    hyphens: element.style.hyphens,
    whiteSpace: element.style.whiteSpace,
    flexWrap: element.style.flexWrap,
    display: element.style.display,
    gridAutoRows: element.style.gridAutoRows,
    visibility: element.style.visibility,
    alignContent: element.style.alignContent,
    alignItems: element.style.alignItems,
    overflowWrap: element.style.overflowWrap,
    lineHeight: element.style.lineHeight,
    boxSizing: element.style.boxSizing,
    left: element.style.left,
    top: element.style.top,
    marginLeft: element.style.marginLeft,
    marginTop: element.style.marginTop,
    marginRight: element.style.marginRight,
    marginBottom: element.style.marginBottom,
    fontSize: element.style.fontSize,
    fontWeight: element.style.fontWeight,
    padding: element.style.padding,
    paddingTop: element.style.paddingTop,
    paddingBottom: element.style.paddingBottom,
    paddingLeft: element.style.paddingLeft,
    paddingRight: element.style.paddingRight
  }
}

/**
 * Restores the original styles to an element
 */
export function restoreElementStyles(element: HTMLElement, originalStyles: Record<string, string>): void {
  Object.entries(originalStyles).forEach(([property, value]) => {
    if (value) {
      ;(element.style as any)[property] = value
    } else {
      element.style.removeProperty(property.replace(/([A-Z])/g, '-$1').toLowerCase())
    }
  })
}

/**
 * Enhanced element optimization for PDF rendering with improved typography and spacing
 * 
 * ENHANCED: Better font sizing, spacing, and visual hierarchy for PDF generation
 * Only applies positioning fixes when forPDF is true to preserve normal screen layout
 */
export function optimizeElementForPDF(element: HTMLElement, type: 'main' | 'container' | 'text', forPDF: boolean = true): void {
  console.log(`🎨 Enhanced PDF optimization (${type}):`, {
    element: element.tagName,
    classes: element.className.substring(0, 50),
    applyingEnhancements: forPDF
  })

  // Add PDF optimization class for enhanced rendering
  element.classList.add('pdf-optimized')

  if (type === 'main') {
    // Enhanced font rendering optimizations
    element.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
    element.style.setProperty('-moz-osx-font-smoothing', 'grayscale', 'important')
    element.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
    element.style.setProperty('background-color', 'white', 'important')
    
    // Enhanced typography for main container
    if (forPDF) {
      element.style.setProperty('font-size', '115%', 'important')
      element.style.setProperty('line-height', '1.7', 'important')
      element.style.setProperty('font-weight', '500', 'important')
      
      // Positioning fixes only for PDF
      element.style.setProperty('position', 'relative', 'important')
      element.style.setProperty('left', '0px', 'important')
      element.style.setProperty('top', '0px', 'important')
      element.style.setProperty('margin-left', '0px', 'important')
      element.style.setProperty('margin-top', '0px', 'important')
      element.style.setProperty('transform', 'none', 'important')
      element.style.setProperty('width', '100%', 'important')
      element.style.setProperty('max-width', 'none', 'important')
      element.style.setProperty('overflow', 'visible', 'important')
    }
    
  } else if (type === 'container') {
    // Enhanced print color optimizations
    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
    element.style.setProperty('print-color-adjust', 'exact', 'important')
    element.style.setProperty('overflow', 'visible', 'important')
    element.style.setProperty('height', 'auto', 'important')
    element.style.setProperty('max-height', 'none', 'important')
    
    // Enhanced spacing for containers
    if (forPDF) {
      element.style.setProperty('padding', '1.5rem', 'important')
      element.style.setProperty('margin-bottom', '1.5rem', 'important')
      
      // Positioning fixes only for PDF
      element.style.setProperty('position', 'relative', 'important')
      element.style.setProperty('left', '0px', 'important')
      element.style.setProperty('margin-left', '0px', 'important')
      element.style.setProperty('width', '100%', 'important')
      element.style.setProperty('max-width', 'none', 'important')
    }
    
  } else if (type === 'text') {
    // Enhanced text rendering optimizations
    element.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
    element.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
    element.style.setProperty('white-space', 'normal', 'important')
    element.style.setProperty('word-wrap', 'break-word', 'important')
    element.style.setProperty('overflow-wrap', 'break-word', 'important')
    element.style.setProperty('hyphens', 'auto', 'important')
    element.style.setProperty('overflow', 'visible', 'important')
    element.style.setProperty('height', 'auto', 'important')
    element.style.setProperty('max-height', 'none', 'important')
    
    // Enhanced typography for text elements
    if (forPDF) {
      element.style.setProperty('line-height', '1.7', 'important')
      element.style.setProperty('font-weight', '500', 'important')
      element.style.setProperty('margin-bottom', '1rem', 'important')
      
      // Enhanced font sizes based on element type
      const tagName = element.tagName.toLowerCase()
      if (tagName === 'h1') {
        element.style.setProperty('font-size', '140%', 'important')
        element.style.setProperty('font-weight', '700', 'important')
        element.style.setProperty('margin-bottom', '1.5rem', 'important')
      } else if (tagName === 'h2') {
        element.style.setProperty('font-size', '130%', 'important')
        element.style.setProperty('font-weight', '600', 'important')
        element.style.setProperty('margin-bottom', '1.25rem', 'important')
      } else if (tagName === 'h3') {
        element.style.setProperty('font-size', '120%', 'important')
        element.style.setProperty('font-weight', '600', 'important')
        element.style.setProperty('margin-bottom', '1rem', 'important')
      } else if (tagName === 'p') {
        element.style.setProperty('font-size', '110%', 'important')
      }
      
      // Positioning fixes only for PDF
      element.style.setProperty('position', 'relative', 'important')
      element.style.setProperty('left', '0px', 'important')
      element.style.setProperty('margin-left', '0px', 'important')
    }
  }

  console.log(`✅ Enhanced PDF optimization complete for ${type} element`)
}

/**
 * Adds PDF export mode class to enable enhanced typography and spacing
 */
export function enablePDFExportMode(element: HTMLElement): void {
  console.log('🔄 Enabling enhanced PDF export mode with improved typography')
  element.classList.add('pdf-export-mode')
  
  // DEBUG: Log the element and check if class is applied
  console.log('PDF Export Mode Applied to:', {
    element: element.tagName,
    classList: element.classList.toString(),
    hasPdfExportMode: element.classList.contains('pdf-export-mode')
  })
  
  // DEBUG: Force styles directly as a test
  element.style.setProperty('background-color', 'yellow', 'important')
  console.log('🔍 DEBUG: Applied yellow background to verify targeting works')
}

/**
 * Removes PDF export mode class to restore normal layout
 */
export function disablePDFExportMode(element: HTMLElement): void {
  console.log('🔄 Disabling PDF export mode, restoring normal layout')
  element.classList.remove('pdf-export-mode')
  element.classList.remove('pdf-optimized')
}
