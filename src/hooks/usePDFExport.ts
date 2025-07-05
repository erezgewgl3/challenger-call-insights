
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

interface PDFExportOptions {
  sectionsOpen?: Record<string, boolean>
  toggleSection?: (section: string) => void
}

// 🛡️ GUARDRAILS: Validation utilities
const validateElementExists = (elementId: string): HTMLElement | null => {
  const element = document.getElementById(elementId)
  if (!element) {
    console.error(`PDF Export: Element with ID "${elementId}" not found`)
    toast.error('Unable to find content to export')
    return null
  }
  return element
}

const safeElementOperation = <T>(
  operation: () => T,
  errorMessage: string,
  fallback: T
): T => {
  try {
    return operation()
  } catch (error) {
    console.error(`PDF Export: ${errorMessage}`, error)
    return fallback
  }
}

// 🎯 NEW: Typography Preservation System
const PDF_STYLES_ID = 'pdf-export-typography-lock'

const injectPDFStyles = (): void => {
  // Remove existing styles if any
  const existingStyles = document.getElementById(PDF_STYLES_ID)
  if (existingStyles) {
    existingStyles.remove()
  }

  const styleElement = document.createElement('style')
  styleElement.id = PDF_STYLES_ID
  styleElement.textContent = `
    .pdf-export-lock,
    .pdf-export-lock * {
      white-space: normal !important;
      word-break: keep-all !important;
      hyphens: none !important;
      line-height: 1.5 !important;
      text-align: inherit !important;
      word-wrap: normal !important;
      overflow-wrap: normal !important;
      text-overflow: visible !important;
    }
    
    .pdf-export-lock .text-left {
      text-align: left !important;
    }
    
    .pdf-export-lock .text-center {
      text-align: center !important;
    }
    
    .pdf-export-lock .text-right {
      text-align: right !important;
    }
    
    .pdf-export-lock .text-justify {
      text-align: justify !important;
    }
  `
  
  document.head.appendChild(styleElement)
  console.log('PDF Export: Typography lock styles injected')
}

const removePDFStyles = (): void => {
  const styleElement = document.getElementById(PDF_STYLES_ID)
  if (styleElement) {
    styleElement.remove()
    console.log('PDF Export: Typography lock styles removed')
  }
}

// 🎯 NEW: Staged Section Expansion
const expandSectionGently = async (section: HTMLElement, index: number): Promise<void> => {
  console.log(`PDF Export: Starting gentle expansion for element ${index + 1}`)
  
  // Stage 1: Allow natural expansion
  section.style.maxHeight = '9999px'
  section.style.minHeight = 'auto'
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Stage 2: Set height to auto
  section.style.height = 'auto'
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Stage 3: Make fully visible
  section.style.overflow = 'visible'
  section.style.overflowY = 'visible'
  section.style.display = 'block'
  section.style.visibility = 'visible'
  
  console.log(`PDF Export: Gentle expansion complete for element ${index + 1}`)
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (
    elementId: string, 
    title: string, 
    options: PDFExportOptions = {}
  ) => {
    let modifiedElements: ElementState[] = []
    let originalElementStyles: Record<string, string> = {}
    let originalSectionsState: Record<string, boolean> = {}
    
    try {
      toast.info('Generating professional PDF with enhanced typography...', { duration: 3000 })
      
      // 🛡️ GUARDRAIL: Validate element exists
      const element = validateElementExists(elementId)
      if (!element) return

      // 🛡️ GUARDRAIL: Prevent user interactions during export
      document.body.style.pointerEvents = 'none'
      
      // 🎯 NEW: Inject typography preservation styles
      injectPDFStyles()
      
      // Ensure we're at the top and everything is loaded
      window.scrollTo(0, 0)
      await new Promise(resolve => setTimeout(resolve, 500))

      // 🚀 NEW: React State Control for Collapsible Sections
      if (options.sectionsOpen && options.toggleSection) {
        console.log('PDF Export: Managing React state for collapsible sections')
        
        // Backup original state
        originalSectionsState = { ...options.sectionsOpen }
        
        // Expand all collapsed sections via React state
        Object.keys(options.sectionsOpen).forEach(sectionKey => {
          if (!options.sectionsOpen![sectionKey]) {
            console.log(`PDF Export: Expanding section: ${sectionKey}`)
            options.toggleSection!(sectionKey)
          }
        })
        
        // Wait for React state updates and re-renders
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // 🛡️ GUARDRAIL: Safe backup of original element styles
      originalElementStyles = safeElementOperation(
        () => ({
          position: element.style.position || '',
          width: element.style.width || '',
          maxWidth: element.style.maxWidth || '',
          minWidth: element.style.minWidth || '',
          transform: element.style.transform || '',
          overflow: element.style.overflow || '',
          backgroundColor: element.style.backgroundColor || ''
        }),
        'Failed to backup element styles',
        {
          position: '',
          width: '',
          maxWidth: '',
          minWidth: '',
          transform: '',
          overflow: '',
          backgroundColor: ''
        }
      )

      // 🎯 NEW: Apply typography lock to main element
      element.classList.add('pdf-export-lock')

      // PHASE 1: Enhanced Collapsible Section Expansion with Gentle Approach
      const expandCollapsibleSections = async () => {
        try {
          console.log('PDF Export: Starting enhanced gentle collapsible section expansion')
          
          // Target Radix UI Collapsible components specifically
          const collapsibleRoots = element.querySelectorAll('[data-radix-collapsible-root][data-state="closed"]')
          console.log(`PDF Export: Found ${collapsibleRoots.length} closed collapsible roots`)
          
          for (let i = 0; i < collapsibleRoots.length; i++) {
            const root = collapsibleRoots[i]
            const trigger = root.querySelector('[data-radix-collapsible-trigger]')
            if (trigger instanceof HTMLElement) {
              console.log(`PDF Export: Clicking trigger ${i + 1} for collapsible section`)
              trigger.click()
            }
          }
          
          // Also find any standalone triggers that might be separate from roots
          const standaloneTriggers = element.querySelectorAll('[data-radix-collapsible-trigger][aria-expanded="false"]')
          console.log(`PDF Export: Found ${standaloneTriggers.length} standalone closed triggers`)
          
          for (let i = 0; i < standaloneTriggers.length; i++) {
            const trigger = standaloneTriggers[i]
            if (trigger instanceof HTMLElement) {
              console.log(`PDF Export: Clicking standalone trigger ${i + 1}`)
              trigger.click()
            }
          }
          
        } catch (error) {
          console.warn('PDF Export: Failed to expand some collapsible sections', error)
        }
      }

      await expandCollapsibleSections()
      
      // 🛡️ GUARDRAIL: Extended wait for React re-render
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 🎯 NEW: Enhanced fallback expansion with gentle approach
      const expandFallbackSections = async () => {
        try {
          console.log('PDF Export: Starting gentle fallback section expansion')
          
          // Target all remaining closed elements with better selectors
          const closedElements = element.querySelectorAll(`
            [data-state="closed"],
            [aria-expanded="false"],
            [data-radix-collapsible-content][data-state="closed"],
            .collapsed
          `)
          
          console.log(`PDF Export: Found ${closedElements.length} elements needing gentle fallback expansion`)
          
          for (let i = 0; i < closedElements.length; i++) {
            const section = closedElements[i]
            if (section instanceof HTMLElement) {
              console.log(`PDF Export: Processing gentle fallback element ${i + 1}`)
              
              const stateAttr = section.hasAttribute('data-state') ? 'data-state' : 
                               section.hasAttribute('aria-expanded') ? 'aria-expanded' : 'class'
              
              // 🛡️ GUARDRAIL: Safe state backup
              const stateBackup = safeElementOperation(
                () => ({
                  element: section,
                  originalState: stateAttr === 'data-state' ? section.getAttribute('data-state') || '' :
                                stateAttr === 'aria-expanded' ? section.getAttribute('aria-expanded') || '' :
                                section.className,
                  originalHeight: section.style.height,
                  originalMaxHeight: section.style.maxHeight,
                  originalOverflow: section.style.overflow,
                  originalOverflowY: section.style.overflowY,
                  stateAttribute: stateAttr
                }),
                'Failed to backup section state',
                null
              )

              if (stateBackup) {
                modifiedElements.push(stateBackup)
                
                // Expand the section
                if (stateAttr === 'data-state') {
                  section.setAttribute('data-state', 'open')
                } else if (stateAttr === 'aria-expanded') {
                  section.setAttribute('aria-expanded', 'true')
                } else {
                  section.className = section.className.replace(/\bcollapsed\b/g, '')
                }
                
                // 🎯 NEW: Use gentle expansion
                await expandSectionGently(section, i)
              }
            }
          }
        } catch (error) {
          console.warn('PDF Export: Failed to expand fallback sections', error)
        }
      }

      await expandFallbackSections()

      // Find and expand all scrollable content areas with gentle approach
      const expandScrollableContent = async () => {
        try {
          const scrollableElements = element.querySelectorAll('*')
          let expandedCount = 0
          
          for (const el of Array.from(scrollableElements)) {
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
                
                // 🎯 NEW: Gentle expansion for scrollable content
                await expandSectionGently(el, expandedCount)
                expandedCount++
              }
            }
          }
          
          console.log(`PDF Export: Gently expanded ${expandedCount} scrollable content areas`)
        } catch (error) {
          console.warn('PDF Export: Failed to expand scrollable content', error)
        }
      }

      await expandScrollableContent()

      // 🛡️ GUARDRAIL: Final wait for all expansions
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Temporarily optimize for PDF capture
      element.style.position = 'static'
      element.style.width = '1200px'
      element.style.maxWidth = '1200px'
      element.style.minWidth = '1200px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'

      // Wait for layout reflow
      await new Promise(resolve => setTimeout(resolve, 300))

      // 🎯 NEW: Enhanced html2canvas with typography preservation
      const canvas = await html2canvas(element, {
        scale: 2, // Reduced from 3 to prevent text reflow issues
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
        letterRendering: true, // Better text handling
        ignoreElements: (element) => {
          return element.classList?.contains('no-pdf') || false
        },
        onclone: (clonedDoc, clonedElement) => {
          if (clonedElement) {
            // 🎯 NEW: Enhanced typography preservation in clone
            console.log('PDF Export: Applying enhanced typography preservation to clone')
            
            // Apply typography lock to cloned element
            clonedElement.classList.add('pdf-export-lock')
            
            // CRITICAL: Force all visual elements to render properly
            clonedElement.style.position = 'static'
            clonedElement.style.width = '1200px'
            clonedElement.style.maxWidth = '1200px'
            clonedElement.style.minWidth = '1200px'
            clonedElement.style.transform = 'none'
            clonedElement.style.overflow = 'visible'
            
            // Force render all gradients and backgrounds
            const allElements = clonedElement.querySelectorAll('*')
            Array.from(allElements).forEach(el => {
              if (el instanceof HTMLElement) {
                // Preserve all computed styles for visual fidelity
                const computedStyle = getComputedStyle(el)
                
                // 🎯 NEW: Enhanced typography preservation
                el.style.whiteSpace = 'normal'
                el.style.wordBreak = 'keep-all'
                el.style.hyphens = 'none'
                el.style.lineHeight = computedStyle.lineHeight || '1.5'
                el.style.textAlign = computedStyle.textAlign || 'left'
                el.style.wordWrap = 'normal'
                el.style.overflowWrap = 'normal'
                el.style.textOverflow = 'visible'
                
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
                
                // Force border and spacing
                el.style.border = computedStyle.border
                el.style.borderRadius = computedStyle.borderRadius
                el.style.padding = computedStyle.padding
                el.style.margin = computedStyle.margin
                
                // Force positioning and sizing
                el.style.width = computedStyle.width
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

            // 🔧 CRITICAL: Force all collapsible content to be visible in the clone
            const collapsibleContent = clonedElement.querySelectorAll(`
              [data-radix-collapsible-content],
              [data-state="closed"],
              [aria-expanded="false"]
            `)
            collapsibleContent.forEach(content => {
              if (content instanceof HTMLElement) {
                content.setAttribute('data-state', 'open')
                content.setAttribute('aria-expanded', 'true')
                content.style.height = 'auto'
                content.style.maxHeight = 'none'
                content.style.overflow = 'visible'
                content.style.transform = 'none'
                content.style.display = 'block'
                content.style.visibility = 'visible'
                
                // 🎯 NEW: Apply typography preservation to collapsible content
                content.style.whiteSpace = 'normal'
                content.style.wordBreak = 'keep-all'
                content.style.lineHeight = '1.5'
                content.style.textAlign = 'inherit'
              }
            })
          }
        }
      })

      // Convert to high-quality image data
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Professional Portrait A4 PDF Configuration
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
      
      toast.success('Professional PDF with perfect typography exported successfully!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate professional PDF. Please try again.')
    } finally {
      // 🛡️ GUARDRAIL: Always restore states, even if PDF generation fails
      try {
        // Re-enable user interactions
        document.body.style.pointerEvents = ''
        
        // 🎯 NEW: Remove typography lock styles
        removePDFStyles()
        
        // 🚀 CRITICAL: Restore React state first
        if (Object.keys(originalSectionsState).length > 0 && options.toggleSection) {
          console.log('PDF Export: Restoring original React state')
          Object.entries(originalSectionsState).forEach(([sectionKey, originalValue]) => {
            if (options.sectionsOpen![sectionKey] !== originalValue) {
              console.log(`PDF Export: Restoring section ${sectionKey} to ${originalValue}`)
              options.toggleSection!(sectionKey)
            }
          })
          
          // Wait for React state restoration
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // Restore main element styles and remove typography lock
        const element = document.getElementById(elementId)
        if (element) {
          element.classList.remove('pdf-export-lock')
          
          if (originalElementStyles) {
            Object.entries(originalElementStyles).forEach(([property, value]) => {
              (element.style as any)[property] = value || ''
            })
          }
        }

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
          } catch (restoreError) {
            console.warn('PDF Export: Failed to restore element state:', restoreError)
          }
        })
        
        console.log('PDF Export: All states restored successfully with enhanced typography')
      } catch (finalError) {
        console.error('PDF Export: Failed during cleanup:', finalError)
      }
    }
  }, [filename])
  
  return { exportToPDF }
}
