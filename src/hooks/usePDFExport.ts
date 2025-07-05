
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
    let modifiedElements: Array<{ element: HTMLElement; originalClasses: string; originalStyles: { [key: string]: string } }> = []
    
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
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      await document.fonts.ready

      // DIRECT DOM MODIFICATION APPROACH
      console.log('🔧 Starting direct DOM modification for PDF optimization...')
      
      // Find and modify elements directly in the actual DOM
      const allElements = element.querySelectorAll('*')
      Array.from(allElements).forEach((el) => {
        if (el instanceof HTMLElement) {
          const computedStyle = getComputedStyle(el)
          
          // Check if this is an email content container
          const isEmailContainer = 
            el.classList.contains('max-h-32') ||
            (computedStyle.fontFamily.includes('mono') && el.textContent && el.textContent.length > 50) ||
            computedStyle.maxHeight === '128px' ||
            computedStyle.maxHeight === '8rem'

          // Check if this is a Deal Acceleration Insights text container
          const isDealInsightsText = 
            el.tagName === 'P' &&
            el.classList.contains('text-gray-800') &&
            el.classList.contains('leading-relaxed') &&
            el.parentElement?.classList.contains('flex') &&
            el.parentElement?.classList.contains('items-start') &&
            el.parentElement?.classList.contains('gap-3')

          if (isEmailContainer) {
            console.log(`📧 Directly modifying email container: ${el.className}`)
            
            // Store original state for restoration
            const originalClasses = el.className
            const originalStyles = {
              maxHeight: el.style.maxHeight,
              height: el.style.height,
              overflow: el.style.overflow,
              overflowY: el.style.overflowY
            }
            
            modifiedElements.push({
              element: el,
              originalClasses,
              originalStyles
            })
            
            // Remove problematic classes directly from the actual DOM
            el.classList.remove('max-h-32')
            el.classList.remove('overflow-y-auto')
            el.classList.remove('overflow-hidden')
            
            // Apply styles directly to the actual DOM element
            el.style.maxHeight = 'none'
            el.style.height = 'auto'
            el.style.overflow = 'visible'
            el.style.overflowY = 'visible'
            el.style.whiteSpace = 'pre-wrap'
          }

          if (isDealInsightsText) {
            console.log(`📝 Optimizing Deal Insights text for PDF: ${el.textContent?.substring(0, 50)}...`)
            
            // Store original state for restoration
            const originalClasses = el.className
            const originalStyles = {
              flex: el.style.flex,
              minWidth: el.style.minWidth,
              wordBreak: el.style.wordBreak,
              hyphens: el.style.hyphens,
              width: el.style.width,
              maxWidth: el.style.maxWidth
            }
            
            modifiedElements.push({
              element: el,
              originalClasses,
              originalStyles
            })
            
            // Apply PDF-optimized text styles
            el.style.flex = '1'
            el.style.minWidth = '0'
            el.style.wordBreak = 'normal'
            el.style.hyphens = 'auto'
            el.style.width = 'auto'
            el.style.maxWidth = 'none'
            
            // Also optimize the parent container if it's the flex container
            const parentContainer = el.parentElement
            if (parentContainer && parentContainer.classList.contains('flex')) {
              const parentOriginalStyles = {
                width: parentContainer.style.width,
                maxWidth: parentContainer.style.maxWidth,
                minWidth: parentContainer.style.minWidth
              }
              
              modifiedElements.push({
                element: parentContainer,
                originalClasses: parentContainer.className,
                originalStyles: parentOriginalStyles
              })
              
              parentContainer.style.width = '100%'
              parentContainer.style.maxWidth = 'none'
              parentContainer.style.minWidth = '0'
            }
          }
        }
      })

      console.log(`✅ Modified ${modifiedElements.length} elements for PDF optimization`)

      // Wait for DOM changes to take effect
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store original styles for main element restoration
      const originalStyles = {
        position: element.style.position,
        width: element.style.width,
        maxWidth: element.style.maxWidth,
        minWidth: element.style.minWidth,
        transform: element.style.transform,
        overflow: element.style.overflow,
        backgroundColor: element.style.backgroundColor
      }

      // Optimize main element for PDF capture
      element.style.position = 'static'
      element.style.width = '1200px'
      element.style.maxWidth = '1200px'
      element.style.minWidth = '1200px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'

      await new Promise(resolve => setTimeout(resolve, 500))

      // Generate canvas with simplified configuration
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
        windowHeight: element.scrollHeight
      })

      // Restore original styles immediately
      Object.entries(originalStyles).forEach(([property, value]) => {
        element.style[property as any] = value
      })

      // Restore modified elements
      modifiedElements.forEach(({ element: el, originalClasses, originalStyles }) => {
        el.className = originalClasses
        Object.entries(originalStyles).forEach(([property, value]) => {
          el.style[property as any] = value
        })
      })

      console.log('✅ Restored all modified elements')

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
