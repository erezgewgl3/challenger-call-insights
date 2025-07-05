
import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface UsePDFExportProps {
  filename?: string
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

  const exportToPDF = useCallback(async (elementId: string, title: string, reactControls?: any) => {
    let modifiedElements: ElementState[] = []
    
    try {
      toast.info('Generating PDF...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Ensure we're at the top and everything is loaded
      window.scrollTo(0, 0)
      await new Promise(resolve => setTimeout(resolve, 500))

      // PHASE 1: PRE-PDF PREPARATION - Expand collapsed sections and scrollable content
      
      // Click triggers for CLOSED sections only
      const closedSections = element.querySelectorAll('[data-state="closed"]')
      closedSections.forEach(section => {
        const trigger = section.querySelector('[data-radix-collapsible-trigger]')
        if (trigger instanceof HTMLElement) {
          trigger.click()
        }
      })
      
      // Wait for React re-render
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Find and expand all collapsed sections
      const collapsedSections = element.querySelectorAll('[data-state="closed"], [aria-expanded="false"], .collapsed')
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
          
          // Expand the section
          if (stateAttr === 'data-state') {
            section.setAttribute('data-state', 'open')
          } else if (stateAttr === 'aria-expanded') {
            section.setAttribute('aria-expanded', 'true')
          } else {
            section.className = section.className.replace(/\bcollapsed\b/g, '')
          }
        }
      })

      // Find and expand all scrollable content areas
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
            
            // Make content fully visible
            el.style.overflow = 'visible'
            el.style.overflowY = 'visible'
            el.style.height = 'auto'
            el.style.maxHeight = 'none'
          }
        }
      })

      // Wait for all expansions and layout changes to complete
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Use element's natural dimensions
      const naturalWidth = element.scrollWidth
      const naturalHeight = element.scrollHeight

      // Wait for layout reflow
      await new Promise(resolve => setTimeout(resolve, 300))

      // Enhanced html2canvas configuration
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        foreignObjectRendering: true,
        imageTimeout: 15000,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: naturalWidth,
        height: naturalHeight,
        windowWidth: naturalWidth,
        windowHeight: naturalHeight,
        ignoreElements: (element) => {
          return element.classList?.contains('no-pdf') || false
        },
        onclone: (clonedDoc, clonedElement) => {
          if (clonedElement) {
            const allElements = clonedElement.querySelectorAll('*')
            Array.from(allElements).forEach(el => {
              if (el instanceof HTMLElement) {
                const computedStyle = getComputedStyle(el)
                
                // Target numbered list items and bullet points specifically
                const isNumberedListItem = el.textContent?.match(/^\d+\./) || 
                                         el.classList.contains('list-item') ||
                                         el.querySelector('.list-item')
                
                if (isNumberedListItem) {
                  // Use scrollWidth to prevent shrinking and apply nowrap
                  const containerWidth = el.scrollWidth
                  if (containerWidth > 0) {
                    el.style.width = `${containerWidth}px`
                    el.style.minWidth = `${containerWidth}px`
                    el.style.whiteSpace = 'nowrap'
                    el.style.flexShrink = '0'
                  }
                }
                
                // Force background rendering
                if (computedStyle.background || computedStyle.backgroundColor || computedStyle.backgroundImage) {
                  el.style.background = computedStyle.background
                  el.style.backgroundColor = computedStyle.backgroundColor
                  el.style.backgroundImage = computedStyle.backgroundImage
                  el.style.backgroundSize = computedStyle.backgroundSize
                  el.style.backgroundPosition = computedStyle.backgroundPosition
                  el.style.backgroundRepeat = computedStyle.backgroundRepeat
                }
                
                // Force text and typography rendering
                el.style.color = computedStyle.color
                el.style.fontSize = computedStyle.fontSize
                el.style.fontWeight = computedStyle.fontWeight
                el.style.fontFamily = computedStyle.fontFamily
                el.style.lineHeight = computedStyle.lineHeight
                el.style.textAlign = computedStyle.textAlign
                
                // Force border and spacing
                el.style.border = computedStyle.border
                el.style.borderRadius = computedStyle.borderRadius
                el.style.padding = computedStyle.padding
                el.style.margin = computedStyle.margin
                
                // Force positioning and sizing
                el.style.height = computedStyle.height
                el.style.display = computedStyle.display
                el.style.flexDirection = computedStyle.flexDirection
                el.style.alignItems = computedStyle.alignItems
                el.style.justifyContent = computedStyle.justifyContent
                el.style.gap = computedStyle.gap
                
                // Force all previously scrollable content to be fully visible
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

            // Force Radix UI CollapsibleContent to expand
            const collapsibleContent = clonedElement.querySelectorAll('[data-radix-collapsible-content]')
            collapsibleContent.forEach(content => {
              if (content instanceof HTMLElement) {
                content.setAttribute('data-state', 'open')
                content.style.height = 'auto'
                content.style.maxHeight = 'none'
                content.style.overflow = 'visible'
                content.style.transform = 'none'
                content.style.display = 'block'
              }
            })
          }
        }
      })

      // PHASE 2: POST-PDF RESTORATION - Restore all original states
      
      // Restore all modified elements to their original states
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
          
          // Restore overflow and sizing properties
          element.style.height = originalHeight
          element.style.maxHeight = originalMaxHeight
          element.style.overflow = originalOverflow
          element.style.overflowY = originalOverflowY
        } catch (error) {
          console.warn('Failed to restore element state:', error)
        }
      })

      // Convert to high-quality image data
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // PDF Configuration - FIXED LEFT MARGIN
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false
      })

      // A4 Portrait dimensions
      const pdfWidth = 210
      const pdfHeight = 297
      
      // Calculate optimal scaling for portrait layout with margins
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      
      const contentWidth = pdfWidth - 20 // 10mm margins on each side
      const scale = contentWidth / (canvasWidth * 0.264583) // Convert pixels to mm
      const scaledHeight = (canvasHeight * 0.264583) * scale
      
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
      
      // Professional separator
      pdf.setDrawColor(203, 213, 225)
      pdf.setLineWidth(0.5)
      pdf.line(10, 40, pdfWidth - 10, 40)
      
      // Content positioning - FIXED: Use left alignment instead of centering
      const contentStartY = 45
      const availableHeight = pdfHeight - contentStartY - 10
      
      // Check if content fits on one page
      if (scaledHeight <= availableHeight) {
        // Single page layout - FIXED: Use left margin instead of centering
        pdf.addImage(imgData, 'PNG', 10, contentStartY, contentWidth, scaledHeight, '', 'FAST')
      } else {
        // Multi-page layout for long content
        const pageContentHeight = availableHeight
        const totalPages = Math.ceil(scaledHeight / pageContentHeight)
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
            
            // Header for continuation pages
            pdf.setFontSize(14)
            pdf.setTextColor(100, 116, 139)
            pdf.text(`${cleanTitle} - Page ${page + 1} of ${totalPages}`, 10, 15)
            pdf.setDrawColor(203, 213, 225)
            pdf.line(10, 20, pdfWidth - 10, 20)
          }
          
          const currentPageStartY = page === 0 ? contentStartY : 25
          const currentAvailableHeight = page === 0 ? availableHeight : (pdfHeight - 25 - 10)
          
          // Calculate source coordinates for this page
          const sourceY = page * (pageContentHeight / scale) / 0.264583
          const sourceHeight = Math.min((currentAvailableHeight / scale) / 0.264583, canvasHeight - sourceY)
          
          if (sourceHeight > 0) {
            // Create canvas for this page section
            const pageCanvas = document.createElement('canvas')
            const pageCtx = pageCanvas.getContext('2d')
            
            if (pageCtx) {
              pageCanvas.width = canvasWidth
              pageCanvas.height = sourceHeight
              
              // Draw the section of the main canvas onto the page canvas
              pageCtx.drawImage(canvas, 0, sourceY, canvasWidth, sourceHeight, 0, 0, canvasWidth, sourceHeight)
              const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
              
              // Add to PDF - FIXED: Use left alignment
              pdf.addImage(pageImgData, 'PNG', 10, currentPageStartY, contentWidth, (sourceHeight * 0.264583) * scale, '', 'FAST')
            }
          }
        }
      }
      
      // Generate professional filename
      const timestamp = new Date().toISOString().slice(0, 10)
      const cleanFilename = title
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
      
      const pdfFilename = `${cleanFilename}_sales_analysis_${timestamp}.pdf`
      
      // Save the PDF
      pdf.save(pdfFilename)
      
      toast.success('PDF exported successfully!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      
      // CRITICAL: Always restore states even if PDF generation fails
      const element = document.getElementById(elementId)
      if (element) {
        element.classList.remove('pdf-export-lock')
      }
      
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
