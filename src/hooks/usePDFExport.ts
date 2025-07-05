
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

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let sectionsToRestore: string[] = []
    
    try {
      toast.info('Generating professional PDF...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Open closed sections for PDF
      if (options?.sectionsOpen && options?.toggleSection) {
        Object.entries(options.sectionsOpen).forEach(([sectionKey, isOpen]) => {
          if (!isOpen) {
            sectionsToRestore.push(sectionKey)
            options.toggleSection!(sectionKey)
          }
        })

        if (sectionsToRestore.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // Increased delay
        }
      }

      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 1000)) // Increased delay

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

      await new Promise(resolve => setTimeout(resolve, 500))

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
            
            console.log('🔧 Starting targeted email content fix...')
            
            // FOCUSED EMAIL CONTENT FIX
            const allElements = clonedElement.querySelectorAll('*')
            Array.from(allElements).forEach((el) => {
              if (el instanceof HTMLElement) {
                const computedStyle = getComputedStyle(el)
                
                // Force font consistency for all elements
                el.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
                
                // TARGETED EMAIL DETECTION - Look for the specific patterns
                const isEmailContainer = 
                  // Has max-h-32 class (the main culprit)
                  el.classList.contains('max-h-32') ||
                  // Has monospace font (email content)
                  computedStyle.fontFamily.includes('mono') ||
                  // Has computed maxHeight of 128px (8rem = max-h-32)
                  computedStyle.maxHeight === '128px' ||
                  computedStyle.maxHeight === '8rem' ||
                  // Text patterns for email content
                  (el.textContent && (
                    el.textContent.includes('Subject:') ||
                    el.textContent.includes('Hi ') ||
                    el.textContent.includes('Dear ') ||
                    el.textContent.includes('Best regards') ||
                    el.textContent.includes('Thank you for')
                  ) && el.textContent.length > 50)

                if (isEmailContainer) {
                  console.log(`📧 Fixing email container: ${el.className}`)
                  
                  // AGGRESSIVE HEIGHT REMOVAL
                  el.classList.remove('max-h-32')
                  el.classList.remove('overflow-y-auto')
                  el.classList.remove('overflow-hidden')
                  
                  // DIRECT STYLE OVERRIDES WITH !important
                  el.style.setProperty('max-height', 'none', 'important')
                  el.style.setProperty('height', 'auto', 'important')
                  el.style.setProperty('overflow', 'visible', 'important')
                  el.style.setProperty('overflow-y', 'visible', 'important')
                  el.style.setProperty('overflow-x', 'visible', 'important')
                  el.style.setProperty('white-space', 'pre-wrap', 'important')
                  
                  // Fix child elements too
                  const childElements = el.querySelectorAll('*')
                  childElements.forEach(childEl => {
                    if (childEl instanceof HTMLElement) {
                      childEl.classList.remove('max-h-32')
                      childEl.classList.remove('overflow-y-auto')
                      childEl.style.setProperty('max-height', 'none', 'important')
                      childEl.style.setProperty('height', 'auto', 'important')
                      childEl.style.setProperty('overflow', 'visible', 'important')
                    }
                  })
                }
                
                // FALLBACK: Fix any element with 128px max-height
                if (computedStyle.maxHeight === '128px' || computedStyle.maxHeight === '8rem') {
                  console.log(`🎯 Fallback fix for 128px height element`)
                  el.style.setProperty('max-height', 'none', 'important')
                  el.style.setProperty('height', 'auto', 'important')
                  el.style.setProperty('overflow', 'visible', 'important')
                }
                
                // Preserve other styling
                el.style.color = computedStyle.color
                el.style.fontSize = computedStyle.fontSize
                el.style.fontWeight = computedStyle.fontWeight
                el.style.lineHeight = computedStyle.lineHeight
                el.style.background = computedStyle.background
                el.style.backgroundColor = computedStyle.backgroundColor
                el.style.border = computedStyle.border
                el.style.borderRadius = computedStyle.borderRadius
                el.style.padding = computedStyle.padding
                el.style.margin = computedStyle.margin
                
                // Enhanced font rendering
                el.style.setProperty('-webkit-font-smoothing', 'antialiased')
                el.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
                el.style.textRendering = 'optimizeLegibility'
              }
            })
            
            console.log('✅ Email content expansion complete')
          }
        }
      })

      // Restore original styles immediately
      Object.entries(originalStyles).forEach(([property, value]) => {
        element.style[property as any] = value
      })

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
      
      // Calculate scaling
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
      
      // Content positioning
      const contentStartY = 45
      const availableHeight = pdfHeight - contentStartY - 10
      
      if (scaledHeight <= availableHeight) {
        // Single page
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
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      // Restore section states
      if (options?.toggleSection && sectionsToRestore.length > 0) {
        setTimeout(() => {
          sectionsToRestore.forEach(sectionKey => {
            options.toggleSection!(sectionKey)
          })
        }, 500)
      }
    }
  }, [filename])
  
  return { exportToPDF }
}
