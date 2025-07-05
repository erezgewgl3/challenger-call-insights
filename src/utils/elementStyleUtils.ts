
/**
 * Stores the current styles of an element for later restoration
 */
export function storeElementStyles(element: HTMLElement): Record<string, string> {
  return {
    position: element.style.position,
    width: element.style.width,
    maxWidth: element.style.maxWidth,
    minWidth: element.style.minWidth,
    transform: element.style.transform,
    overflow: element.style.overflow,
    overflowY: element.style.overflowY,
    backgroundColor: element.style.backgroundColor,
    flex: element.style.flex,
    wordBreak: element.style.wordBreak,
    hyphens: element.style.hyphens,
    whiteSpace: element.style.whiteSpace,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
    flexWrap: element.style.flexWrap
  }
}

/**
 * Restores previously stored styles to an element
 */
export function restoreElementStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property as any] = value || ''
  })
}

/**
 * Applies PDF-optimized styles to an element
 */
export function optimizeElementForPDF(element: HTMLElement, type: 'main' | 'email' | 'text' | 'container' = 'main'): void {
  switch (type) {
    case 'main':
      element.style.position = 'static'
      element.style.width = '1200px'
      element.style.maxWidth = '1200px'
      element.style.minWidth = '1200px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'
      break
      
    case 'email':
      element.style.maxHeight = 'none'
      element.style.height = 'auto'
      element.style.overflow = 'visible'
      element.style.overflowY = 'visible'
      element.style.whiteSpace = 'pre-wrap'
      break
      
    case 'text':
      element.style.flex = '1'
      element.style.minWidth = '0'
      element.style.wordBreak = 'normal'
      element.style.hyphens = 'auto'
      element.style.width = 'auto'
      element.style.maxWidth = 'none'
      element.style.whiteSpace = 'normal'
      break
      
    case 'container':
      element.style.width = '100%'
      element.style.maxWidth = 'none'
      element.style.minWidth = '0'
      element.style.flexWrap = 'wrap'
      break
  }
}
