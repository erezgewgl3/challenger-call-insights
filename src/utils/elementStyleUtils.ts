
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
    marginBottom: element.style.marginBottom
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
 * Enhanced element optimization for PDF rendering - ONLY applies positioning fixes when forPDF is true
 */
export function optimizeElementForPDF(element: HTMLElement, type: 'main' | 'container' | 'text', forPDF: boolean = true): void {
  console.log(`🎨 Optimizing element for PDF (${type}):`, {
    element: element.tagName,
    classes: element.className.substring(0, 50),
    applyingPositionFixes: forPDF
  })

  // Add PDF optimization class for font rendering
  element.classList.add('pdf-optimized')

  if (type === 'main') {
    // Font rendering optimizations
    element.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
    element.style.setProperty('-moz-osx-font-smoothing', 'grayscale', 'important')
    element.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
    element.style.setProperty('background-color', 'white', 'important')
    
    // Only apply positioning fixes if forPDF is true
    if (forPDF) {
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
    // Print color optimizations
    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
    element.style.setProperty('print-color-adjust', 'exact', 'important')
    element.style.setProperty('overflow', 'visible', 'important')
    element.style.setProperty('height', 'auto', 'important')
    element.style.setProperty('max-height', 'none', 'important')
    
    // Only apply positioning fixes if forPDF is true
    if (forPDF) {
      element.style.setProperty('position', 'relative', 'important')
      element.style.setProperty('left', '0px', 'important')
      element.style.setProperty('margin-left', '0px', 'important')
      element.style.setProperty('width', '100%', 'important')
      element.style.setProperty('max-width', 'none', 'important')
    }
    
  } else if (type === 'text') {
    // Text rendering optimizations
    element.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
    element.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
    element.style.setProperty('white-space', 'normal', 'important')
    element.style.setProperty('word-wrap', 'break-word', 'important')
    element.style.setProperty('overflow-wrap', 'break-word', 'important')
    element.style.setProperty('hyphens', 'auto', 'important')
    element.style.setProperty('line-height', '1.5', 'important')
    element.style.setProperty('overflow', 'visible', 'important')
    element.style.setProperty('height', 'auto', 'important')
    element.style.setProperty('max-height', 'none', 'important')
    
    // Only apply positioning fixes if forPDF is true
    if (forPDF) {
      element.style.setProperty('position', 'relative', 'important')
      element.style.setProperty('left', '0px', 'important')
      element.style.setProperty('margin-left', '0px', 'important')
    }
  }

  console.log(`✅ PDF optimization complete for ${type} element`)
}

/**
 * Adds PDF export mode class to enable scoped CSS positioning fixes
 */
export function enablePDFExportMode(element: HTMLElement): void {
  console.log('🔄 Enabling PDF export mode with scoped positioning fixes')
  element.classList.add('pdf-export-mode')
}

/**
 * Removes PDF export mode class to restore normal layout
 */
export function disablePDFExportMode(element: HTMLElement): void {
  console.log('🔄 Disabling PDF export mode, restoring normal layout')
  element.classList.remove('pdf-export-mode')
}
