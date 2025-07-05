import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface UsePDFExportProps {
  filename?: string
}

interface PDFExportOptions {
  sectionsOpen?: Record<string, boolean>
  toggleSection?: (section: string) => void
}

interface ElementState {
  element: HTMLElement
  originalState: string
  originalHeight: string
  originalMaxHeight: string
  originalOverflow: string
  originalOverflowY: string
  stateAttribute: string
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let modifiedElements: ElementState[] = []
    
    try {
      toast.info('Generating professional PDF...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Ensure fonts are loaded
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 500))

      // Enhanced section expansion with React state integration
      const collapsedSections = element.querySelectorAll(
        '[data-state="closed"], [aria-expanded="false"], .collapsed, details:not([open])'
      )
      
      collapsedSections.forEach(section => {
        if (section instanceof HTMLElement) {
          const stateAttr = section.hasAttribute('data-state') ? 'data-state' : 
                           section.hasAttribute('aria-expanded') ? 'aria-expanded' : 'class'
          
          modifiedElements.push({
            element: section,
            originalState: stateAttr === 'data-state' ? section.getAttribute('data-state') || '' :
                          stateAttr === 'aria-expanded' ? section.getAttribute('aria-expanded') || '' :
                          section.className,
            originalHeight: section.style.height,
            originalMaxHeight: section.style.maxHeight,
            originalOverflow: section.style.overflow,
            originalOverflowY: section.style.overflowY,
            stateAttribute: stateAttr
          })
          
          // Use React state management if available, otherwise fallback to DOM manipulation
          if (options?.toggleSection && options?.sectionsOpen) {
            // Try to identify section key and open it via React state
            const sectionKey = section.getAttribute('data-section-key')
            if (sectionKey && !options.sectionsOpen[sectionKey]) {
              options.toggleSection(sectionKey)
            }
          }
          
          // Always ensure DOM state is expanded for PDF capture
          if (stateAttr === 'data-state') {
            section.setAttribute('data-state', 'open')
          } else if (stateAttr === 'aria-expanded') {
            section.setAttribute('aria-expanded', 'true')
          } else {
            section.className = section.className.replace(/\bcollapsed\b/g, '')
          }
          
          section.style.display = 'block'
          section.style.visibility = 'visible'
          section.style.height = 'auto'
          section.style.maxHeight = 'none'
          section.style.overflow = 'visible'
        }
      })

      // Expand scrollable content areas
      const scrollableElements = element.querySelectorAll('*')
      Array.from(scrollableElements).forEach(el => {
        if (el instanceof HTMLElement) {
          const computedStyle = getComputedStyle(el)
          const hasScrollableContent = (
            computedStyle.overflow === 'scroll' || 
            computedStyle.overflow === 'auto' ||
            computedStyle.overflowY === 'scroll' || 
            computedStyle.overflowY === 'auto'
          ) && (
            el.scrollHeight > el.clientHeight ||
            computedStyle.maxHeight !== 'none'
          )
          
          if (hasScrollableContent) {
            const alreadyStored = modifiedElements.some(item => item.element === el)
            if (!alreadyStored) {
              modifiedElements.push({
                element: el,
                originalState: '',
                originalHeight: el.style.height,
                originalMaxHeight: el.style.maxHeight,
                originalOverflow: el.style.overflow,
                originalOverflowY: el.style.overflowY,
                stateAttribute: 'overflow'
              })
            }
            
            el.style.overflow = 'visible'
            el.style.overflowY = 'visible'
            el.style.height = 'auto'
            el.style.maxHeight = 'none'
          }
        }
      })

      // Wait for layout changes
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store original styles for restoration
      const originalStyles = {
        position: element.style.position,
        width: element.style.width,
        maxWidth: element.style.maxWidth,
        minWidth: element.style.minWidth,
        transform: element.style.transform,
        overflow: element.style.overflow,
        backgroundColor: element.style.backgroundColor
      }

      // Optimize for PDF capture
      element.style.position = 'static'
      element.style.width = '1200px'
      element.style.maxWidth = '1200px'
      element.style.minWidth = '1200px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'

      await new Promise(resolve => setTimeout(resolve, 300))

      // Generate canvas with improved configuration
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
        width: 1200,
        height: element.scrollHeight,
        windowWidth: 1200,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc, clonedElement) => {
          if (clonedElement) {
            // Force static positioning and proper sizing
            clonedElement.style.position = 'static'
            clonedElement.style.width = '1200px'
            clonedElement.style.maxWidth = '1200px'
            clonedElement.style.minWidth = '1200px'
            clonedElement.style.transform = 'none'
            clonedElement.style.overflow = 'visible'
            
            // Process all elements for consistent rendering
            const allElements = clonedElement.querySelectorAll('*')
            Array.from(allElements).forEach(el => {
              if (el instanceof HTMLElement) {
                const computedStyle = getComputedStyle(el)
                
                // Force font consistency
                el.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
                el.style.color = computedStyle.color
                el.style.fontSize = computedStyle.fontSize
                el.style.fontWeight = computedStyle.fontWeight
                el.style.lineHeight = computedStyle.lineHeight
                
                // Target numbered list items specifically to prevent line breaks
                const isNumberedListItem = el.closest('[class*="space-y"] li, [class*="gap"] li') ||
                                         (el.tagName === 'LI' && el.textContent && el.textContent.match(/^\d+\./))
                
                if (isNumberedListItem) {
                  // Use scrollWidth to prevent content shrinking
                  const naturalWidth = el.scrollWidth
                  if (naturalWidth > el.clientWidth) {
                    el.style.width = naturalWidth + 'px'
                    el.style.minWidth = naturalWidth + 'px'
                  }
                  
                  // Prevent text wrapping in list items
                  const textElements = el.querySelectorAll('p, span, div')
                  textElements.forEach(textEl => {
                    if (textEl instanceof HTMLElement && textEl.textContent && textEl.textContent.trim().length > 20) {
                      textEl.style.whiteSpace = 'nowrap'
                      textEl.style.overflow = 'visible'
                    }
                  })
                }
                
                // Preserve backgrounds and styling
                el.style.background = computedStyle.background
                el.style.backgroundColor = computedStyle.backgroundColor
                el.style.backgroundImage = computedStyle.backgroundImage
                el.style.border = computedStyle.border
                el.style.borderRadius = computedStyle.borderRadius
                el.style.padding = computedStyle.padding
                el.style.margin = computedStyle.margin
                
                // Ensure scrollable content remains visible
                if (computedStyle.overflow === 'scroll' || computedStyle.overflow === 'auto' ||
                    computedStyle.overflowY === 'scroll' || computedStyle.overflowY === 'auto') {
                  el.style.overflow = 'visible'
                  el.style.overflowY = 'visible'
                  el.style.height = 'auto'
                  el.style.maxHeight = 'none'
                }
                
                // Enhanced font smoothing
                el.style.setProperty('-webkit-font-smoothing', 'antialiased')
                el.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
                el.style.textRendering = 'optimizeLegibility'
              }
            })

            // Ensure expanded sections stay expanded in clone
            const expandedSections = clonedElement.querySelectorAll('[data-state="open"], [aria-expanded="true"]')
            Array.from(expandedSections).forEach(section => {
              if (section instanceof HTMLElement) {
                section.style.display = 'block'
                section.style.visibility = 'visible'
                section.style.height = 'auto'
                section.style.maxHeight = 'none'
                section.style.overflow = 'visible'
              }
            })
          }
        }
      })

      // Restore original styles immediately
      Object.entries(originalStyles).forEach(([property, value]) => {
        element.style[property as any] = value
      })

      // Restore all modified elements
      modifiedElements.forEach(({ element, originalState, originalHeight, originalMaxHeight, originalOverflow, originalOverflowY, stateAttribute }) => {
        try {
          if (stateAttribute === 'data-state') {
            if (originalState) {
              element.setAttribute('data-state', originalState)
            } else {
              element.removeAttribute('data-state')
            }
          } else if (stateAttribute === 'aria-expanded') {
            if (originalState) {
              element.setAttribute('aria-expanded', originalState)
            } else {
              element.removeAttribute('aria-expanded')
            }
          } else if (stateAttribute === 'class') {
            element.className = originalState
          }
          
          element.style.height = originalHeight
          element.style.maxHeight = originalMaxHeight
          element.style.overflow = originalOverflow
          element.style.overflowY = originalOverflowY
        } catch (error) {
          console.warn('Failed to restore element state:', error)
        }
      })

      // If using React state management, restore original section states
      if (options?.toggleSection && options?.sectionsOpen) {
        // Note: In a real implementation, you might want to restore the original states
        // For now, we rely on the DOM restoration above
      }

      // Convert to PDF
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false
      })

      // A4 dimensions
      const pdfWidth = 210
      const pdfHeight = 297
      
      // Calculate scaling - FIXED: Use simple left alignment
      const contentWidth = pdfWidth - 20 // 10mm margins on each side
      const scale = contentWidth / (canvas.width * 0.264583)
      const scaledHeight = (canvas.height * 0.264583) * scale
      
      // Professional header
      pdf.setFontSize(20)
      pdf.setTextColor(30, 41, 59)
      const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf.text(cleanTitle, 10, 20)
      
      pdf.setFontSize(11)
      pdf.setTextColor(100, 116, 139)
      pdf.text('Sales Intelligence Report', 10, 28)
      pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 10, 35)
      
      // Separator line
      pdf.setDrawColor(203, 213, 225)
      pdf.setLineWidth(0.5)
      pdf.line(10, 40, pdfWidth - 10, 40)
      
      // Content positioning - FIXED: Use fixed left margin
      const contentStartY = 45
      const availableHeight = pdfHeight - contentStartY - 10
      
      if (scaledHeight <= availableHeight) {
        // Single page - FIXED: Use 10mm left margin instead of centering
        pdf.addImage(imgData, 'PNG', 10, contentStartY, contentWidth, scaledHeight, '', 'FAST')
      } else {
        // Multi-page layout
        const pageContentHeight = availableHeight
        const totalPages = Math.ceil(scaledHeight / pageContentHeight)
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
            pdf.setFontSize(14)
            pdf.setTextColor(100, 116, 139)
            pdf.text(`${cleanTitle} - Page ${page + 1} of ${totalPages}`, 10, 15)
            pdf.setDrawColor(203, 213, 225)
            pdf.line(10, 20, pdfWidth - 10, 20)
          }
          
          const currentPageStartY = page === 0 ? contentStartY : 25
          const currentAvailableHeight = page === 0 ? availableHeight : (pdfHeight - 25 - 10)
          
          const sourceY = page * (pageContentHeight / scale) / 0.264583
          const sourceHeight = Math.min((currentAvailableHeight / scale) / 0.264583, canvas.height - sourceY)
          
          if (sourceHeight > 0) {
            const pageCanvas = document.createElement('canvas')
            const pageCtx = pageCanvas.getContext('2d')
            
            if (pageCtx) {
              pageCanvas.width = canvas.width
              pageCanvas.height = sourceHeight
              
              pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight)
              const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
              
              const pageScaledHeight = (sourceHeight * 0.264583) * scale
              pdf.addImage(pageImgData, 'PNG', 10, currentPageStartY, contentWidth, pageScaledHeight, '', 'FAST')
            }
          }
        }
      }
      
      // Generate filename and save
      const timestamp = new Date().toISOString().slice(0, 10)
      const cleanFilename = title
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
      
      const pdfFilename = `${cleanFilename}_sales_analysis_${timestamp}.pdf`
      pdf.save(pdfFilename)
      
      toast.success('Professional PDF exported successfully!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      
      // Always restore states even on error
      modifiedElements.forEach(({ element, originalState, originalHeight, originalMaxHeight, originalOverflow, originalOverflowY, stateAttribute }) => {
        try {
          if (stateAttribute === 'data-state') {
            if (originalState) {
              element.setAttribute('data-state', originalState)
            } else {
              element.removeAttribute('data-state')
            }
          } else if (stateAttribute === 'aria-expanded') {
            if (originalState) {
              element.setAttribute('aria-expanded', originalState)
            } else {
              element.removeAttribute('aria-expanded')
            }
          } else if (stateAttribute === 'class') {
            element.className = originalState
          }
          
          element.style.height = originalHeight
          element.style.maxHeight = originalMaxHeight
          element.style.overflow = originalOverflow
          element.style.overflowY = originalOverflowY
        } catch (restoreError) {
          console.warn('Failed to restore element state after error:', restoreError)
        }
      })
      
      toast.error('Failed to generate PDF. Please try again.')
    }
  }, [filename])
  
  return { exportToPDF }
}
