
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
    // PRODUCTION FIX: Store positioning properties
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
 * PRODUCTION ENHANCED element optimization for PDF rendering
 */
export function optimizeElementForPDF(element: HTMLElement, type: 'main' | 'container' | 'text'): void {
  console.log(`🎨 PRODUCTION optimizing element for PDF (${type}):`, {
    element: element.tagName,
    classes: element.className.substring(0, 50)
  })

  // Add PDF optimization class
  element.classList.add('pdf-optimized')

  if (type === 'main') {
    // PRODUCTION FIX: Main container optimizations with positioning
    element.style.setProperty('position', 'relative', 'important')
    element.style.setProperty('left', '0px', 'important')
    element.style.setProperty('top', '0px', 'important')
    element.style.setProperty('margin-left', '0px', 'important')
    element.style.setProperty('margin-top', '0px', 'important')
    element.style.setProperty('transform', 'none', 'important')
    element.style.setProperty('width', '100%', 'important')
    element.style.setProperty('max-width', 'none', 'important')
    element.style.setProperty('overflow', 'visible', 'important')
    element.style.setProperty('background-color', 'white', 'important')
    element.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
    element.style.setProperty('-moz-osx-font-smoothing', 'grayscale', 'important')
    element.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
    
  } else if (type === 'container') {
    // PRODUCTION FIX: Container optimizations with positioning
    element.style.setProperty('position', 'relative', 'important')
    element.style.setProperty('left', '0px', 'important')
    element.style.setProperty('margin-left', '0px', 'important')
    element.style.setProperty('width', '100%', 'important')
    element.style.setProperty('max-width', 'none', 'important')
    element.style.setProperty('overflow', 'visible', 'important')
    element.style.setProperty('height', 'auto', 'important')
    element.style.setProperty('max-height', 'none', 'important')
    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
    element.style.setProperty('print-color-adjust', 'exact', 'important')
    
  } else if (type === 'text') {
    // PRODUCTION FIX: Text optimizations with positioning
    element.style.setProperty('position', 'relative', 'important')
    element.style.setProperty('left', '0px', 'important')
    element.style.setProperty('margin-left', '0px', 'important')
    element.style.setProperty('white-space', 'normal', 'important')
    element.style.setProperty('word-wrap', 'break-word', 'important')
    element.style.setProperty('overflow-wrap', 'break-word', 'important')
    element.style.setProperty('hyphens', 'auto', 'important')
    element.style.setProperty('line-height', '1.5', 'important')
    element.style.setProperty('overflow', 'visible', 'important')
    element.style.setProperty('height', 'auto', 'important')
    element.style.setProperty('max-height', 'none', 'important')
    element.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
    element.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
  }

  // PRODUCTION FIX: Apply specific positioning fixes for Battle Plan sections
  if (element.classList.contains('border-l-4') && element.classList.contains('border-red-500')) {
    console.log('🎯 Applying Battle Plan section positioning fixes')
    element.style.setProperty('position', 'relative', 'important')
    element.style.setProperty('left', '0px', 'important')
    element.style.setProperty('margin-left', '0px', 'important')
    element.style.setProperty('width', '100%', 'important')
    element.style.setProperty('transform', 'none', 'important')
  }

  // PRODUCTION FIX: Apply positioning fixes for gradient backgrounds
  if (element.className.includes('bg-gradient-to-r')) {
    console.log('🌈 Applying gradient background positioning fixes')
    element.style.setProperty('position', 'relative', 'important')
    element.style.setProperty('left', '0px', 'important')
    element.style.setProperty('margin-left', '0px', 'important')
    element.style.setProperty('background-attachment', 'local', 'important')
    element.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
    element.style.setProperty('print-color-adjust', 'exact', 'important')
  }

  console.log(`✅ PRODUCTION PDF optimization complete for ${type} element`)
}
