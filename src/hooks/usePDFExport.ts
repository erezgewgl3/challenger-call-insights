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
  
  // Surgical text preservation function - targets only problematic elements
  const injectSurgicalTextFixes = () => {
    const styleId = 'pdf-surgical-text-fixes'
    
    // Remove existing style if present
    const existingStyle = document.getElementById(styleId)
    if (existingStyle) {
      existingStyle.remove()
    }
    
    // Create surgical CSS fixes for specific text elements that break incorrectly
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      /* Only target bullet points and list items that tend to break */
      .pdf-export-lock ul li,
      .pdf-export-lock ol li {
        white-space: normal !important;
        word-break: normal !important;
        min-width: max-content;
      }
      
      /* Prevent badge containers from shrinking */
      .pdf-export-lock .inline-flex {
        white-space: nowrap !important;
        flex-shrink: 0 !important;
      }
      
      /* Keep text containers at their natural width */
      .pdf-export-lock [class*="text-"],
      .pdf-export-lock p,
      .pdf-export-lock span {
        word-break: normal !important;
      }
    `
    document.head.appendChild(style)
    return styleId
  }
  
  const removePDFStyles = (styleId: string) => {
    const style = document.getElementById(styleId)
    if (style) {
      style.remove()
    }
  }

  const exportToPDF = useCallback(async (elementId: string, title: string, reactControls?: any) => {
    let modifiedElements: ElementState[] = []
    let injectedStyleId: string | null = null
    
    try {
      toast.info('Generating professional PDF with full visual design...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Ensure we're at the top and everything is loaded
      window.scrollTo(0, 0)
      await new Promise(resolve => setTimeout(resolve, 500))

      // PHASE 1: PRE-PDF PREPARATION - Expand collapsed sections and scrollable content
      
      // 🔧 SURGICAL REACT STATE FIX: Only click triggers for CLOSED sections
      const closedSections = element.querySelectorAll('[data-state="closed"]')
      closedSections.forEach(section => {
        // Find the trigger within this specific closed section
        const trigger = section.querySelector('[data-radix-collapsible-trigger]')
        if (trigger instanceof HTMLElement) {
          trigger.click() // Only click triggers for closed sections
        }
      })
      
      // Wait for React re-render to complete
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
            // Store original state if not already stored
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

      // PHASE 2: SURGICAL TEXT PRESERVATION - Apply minimal targeted fixes
      injectedStyleId = injectSurgicalTextFixes()
      element.classList.add('pdf-export-lock')

      // STAGE 1 RECOVERY: Use element's natural dimensions without forcing width
      const naturalWidth = element.scrollWidth
      const naturalHeight = element.scrollHeight

      // Wait for layout reflow
      await new Promise(resolve => setTimeout(resolve, 300))

      // Enhanced html2canvas configuration for FULL VISUAL CAPTURE
      const canvas = await html2canvas(element, {
        scale: 3, // Maximum quality for crisp output
        useCORS: true,
        allowTaint: true,
        backgroundColor: null, // Preserve all backgrounds and gradients
        foreignObjectRendering: true, // Better CSS support
        imageTimeout: 15000,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: naturalWidth,
        height: naturalHeight,
        windowWidth: naturalWidth,
        windowHeight: naturalHeight,
        ignoreElements: (element) => {
          // Only skip elements explicitly marked for PDF exclusion
          return element.classList?.contains('no-pdf') || false
        },
        onclone: (clonedDoc, clonedElement) => {
          if (clonedElement) {
            // Ensure typography lock is applied in clone
            clonedElement.classList.add('pdf-export-lock')
            
            // Force render all gradients and backgrounds
            const allElements = clonedElement.querySelectorAll('*')
            Array.from(allElements).forEach(el => {
              if (el instanceof HTMLElement) {
                // Preserve all computed styles for visual fidelity
                const computedStyle = getComputedStyle(el)
                
                // STAGE 2: SURGICAL text protection - preserve natural text width
                const isTextContainer = el.tagName.match(/^(P|SPAN|DIV|LI|H[1-6])$/)
                if (isTextContainer) {
                  // Use clientWidth to maintain natural text container width
                  const containerWidth = el.clientWidth
                  if (containerWidth > 0) {
                    el.style.width = `${containerWidth}px`
                    el.style.minWidth = `${containerWidth}px`
                  }
                  el.style.whiteSpace = computedStyle.whiteSpace || 'normal'
                  el.style.wordBreak = computedStyle.wordBreak || 'normal'
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
                
                // CRITICAL: Force all previously scrollable content to be fully visible
                if (computedStyle.overflow === 'scroll' || computedStyle.overflow === 'auto' ||
                    computedStyle.overflowY === 'scroll' || computedStyle.overflowY === 'auto') {
                  el.style.overflow = 'visible'
                  el.style.overflowY = 'visible'
                  el.style.height = 'auto'
                  el.style.maxHeight = 'none'
                }
                
                // Enhanced font smoothing for crisp text (TypeScript-safe)
                el.style.setProperty('-webkit-font-smoothing', 'antialiased')
                el.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
                el.style.textRendering = 'optimizeLegibility'
              }
            })

            // SPECIAL HANDLING: Fix gradients specifically
            const gradientElements = clonedElement.querySelectorAll('[class*="gradient"], [style*="gradient"]')
            Array.from(gradientElements).forEach(el => {
              if (el instanceof HTMLElement) {
                const computedStyle = getComputedStyle(el)
                // Force gradient rendering
                el.style.backgroundImage = computedStyle.backgroundImage
                el.style.background = computedStyle.background
                // Ensure gradient attachment
                el.style.backgroundAttachment = 'local'
              }
            })

            // SPECIAL HANDLING: Fix card backgrounds and styling
            const cards = clonedElement.querySelectorAll('[class*="card"], [class*="Card"], .bg-gradient-to-r, .bg-gradient-to-br')
            Array.from(cards).forEach(card => {
              if (card instanceof HTMLElement) {
                const computedStyle = getComputedStyle(card)
                // Force all card styling
                card.style.background = computedStyle.background
                card.style.backgroundColor = computedStyle.backgroundColor
                card.style.backgroundImage = computedStyle.backgroundImage
                card.style.border = computedStyle.border
                card.style.borderRadius = computedStyle.borderRadius
                card.style.boxShadow = computedStyle.boxShadow
                card.style.padding = computedStyle.padding
                card.style.overflow = 'visible'
                card.style.height = 'auto'
                card.style.minHeight = 'auto'
                card.style.maxHeight = 'none'
              }
            })

            // SPECIAL HANDLING: Fix badges and inline elements
            const badges = clonedElement.querySelectorAll('[class*="badge"], [class*="Badge"], .inline-flex')
            Array.from(badges).forEach(badge => {
              if (badge instanceof HTMLElement) {
                const computedStyle = getComputedStyle(badge)
                badge.style.display = 'inline-flex'
                badge.style.alignItems = 'center'
                badge.style.justifyContent = 'center'
                badge.style.whiteSpace = 'nowrap'
                badge.style.verticalAlign = 'middle'
                badge.style.flexShrink = '0'
                badge.style.background = computedStyle.background
                badge.style.backgroundColor = computedStyle.backgroundColor
                badge.style.color = computedStyle.color
                badge.style.padding = computedStyle.padding || '0.25rem 0.5rem'
                badge.style.borderRadius = computedStyle.borderRadius || '0.375rem'
                badge.style.fontSize = computedStyle.fontSize || '0.75rem'
                badge.style.fontWeight = computedStyle.fontWeight || '500'
              }
            })

            // SPECIAL HANDLING: Fix flex containers
            const flexContainers = clonedElement.querySelectorAll('[class*="flex"], .grid')
            Array.from(flexContainers).forEach(container => {
              if (container instanceof HTMLElement) {
                const computedStyle = getComputedStyle(container)
                if (computedStyle.display.includes('flex')) {
                  container.style.display = 'flex'
                  container.style.flexDirection = computedStyle.flexDirection || 'row'
                  container.style.flexWrap = computedStyle.flexWrap || 'wrap'
                  container.style.alignItems = computedStyle.alignItems || 'center'
                  container.style.justifyContent = computedStyle.justifyContent || 'flex-start'
                  container.style.gap = computedStyle.gap || '0.5rem'
                } else if (computedStyle.display.includes('grid')) {
                  container.style.display = 'grid'
                  container.style.gridTemplateColumns = computedStyle.gridTemplateColumns
                  container.style.gap = computedStyle.gap
                }
              }
            })

            // SPECIAL HANDLING: Ensure expanded sections stay expanded in clone
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

            // 🔧 SURGICAL COLLAPSIBLE SECTIONS FIX: Force Radix UI CollapsibleContent to expand
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

      // PHASE 3: POST-PDF RESTORATION - Restore all original states
      
      // Remove typography lock and clean up styles
      element.classList.remove('pdf-export-lock')
      if (injectedStyleId) {
        removePDFStyles(injectedStyleId)
      }

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
      
      // Professional Portrait A4 PDF Configuration - STAGE 1 RECOVERY: Back to Portrait
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false // Maintain visual quality
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
      pdf.setTextColor(30, 41, 59) // slate-800
      const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf.text(cleanTitle, 10, 20)
      
      pdf.setFontSize(11)
      pdf.setTextColor(100, 116, 139) // slate-500
      pdf.text('Sales Intelligence Report', 10, 28)
      pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 10, 35)
      
      // Professional separator
      pdf.setDrawColor(203, 213, 225) // slate-300
      pdf.setLineWidth(0.5)
      pdf.line(10, 40, pdfWidth - 10, 40)
      
      // Content positioning
      const contentStartY = 45
      const availableHeight = pdfHeight - contentStartY - 10 // Bottom margin
      
      // Check if content fits on one page
      if (scaledHeight <= availableHeight) {
        // Single page layout
        const xOffset = (pdfWidth - contentWidth) / 2
        pdf.addImage(imgData, 'PNG', xOffset, contentStartY, contentWidth, scaledHeight, '', 'FAST')
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
              
              // Add to PDF
              const xOffset = (pdfWidth - contentWidth) / 2
              const pageScaledHeight = (sourceHeight * 0.264583) * scale
              pdf.addImage(pageImgData, 'PNG', xOffset, currentPageStartY, contentWidth, pageScaledHeight, '', 'FAST')
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
      
      toast.success('Professional PDF exported successfully in portrait format!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      
      // CRITICAL: Always restore states even if PDF generation fails
      if (injectedStyleId) {
        removePDFStyles(injectedStyleId)
      }
      
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
      
      toast.error('Failed to generate professional PDF. Please try again.')
    }
  }, [filename])
  
  return { exportToPDF }
}
