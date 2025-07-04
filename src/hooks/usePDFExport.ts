
import { useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

interface UsePDFExportProps {
  filename?: string
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string) => {
    try {
      toast.info('Generating professional PDF report...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Scroll to top and allow all animations to complete
      window.scrollTo(0, 0)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Store original styles for restoration
      const originalStyles = {
        width: element.style.width,
        maxWidth: element.style.maxWidth,
        minWidth: element.style.minWidth,
        transform: element.style.transform,
        overflow: element.style.overflow
      }

      // Apply PDF-optimized styling temporarily
      element.style.width = '1200px'
      element.style.maxWidth = '1200px'
      element.style.minWidth = '1200px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'

      // Wait for layout reflow
      await new Promise(resolve => setTimeout(resolve, 200))

      // Enhanced html2canvas configuration for maximum quality
      const canvas = await html2canvas(element, {
        scale: 3, // High resolution for crisp text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        scrollX: 0,
        scrollY: 0,
        width: 1200,
        height: element.scrollHeight,
        windowWidth: 1200, 
        windowHeight: element.scrollHeight,
        removeContainer: true,
        ignoreElements: (element) => {
          // Skip elements that shouldn't appear in PDF
          return element.classList?.contains('no-pdf') || 
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'STYLE'
        },
        onclone: (clonedDoc, clonedElement) => {
          if (clonedElement) {
            // Apply PDF-specific optimizations to the cloned element
            clonedElement.style.width = '1200px'
            clonedElement.style.maxWidth = '1200px'
            clonedElement.style.minWidth = '1200px'
            clonedElement.style.transform = 'none'
            clonedElement.style.overflow = 'visible'
            clonedElement.style.position = 'static'
            
            // Fix text rendering for all elements
            const allElements = clonedElement.querySelectorAll('*')
            Array.from(allElements).forEach(el => {
              if (el instanceof HTMLElement) {
                // Enhance text rendering
                el.style.setProperty('-webkit-font-smoothing', 'antialiased', 'important')
                el.style.setProperty('-moz-osx-font-smoothing', 'grayscale', 'important')
                el.style.setProperty('text-rendering', 'optimizeLegibility', 'important')
                el.style.setProperty('font-feature-settings', '"liga", "kern"', 'important')
                
                // Ensure computed styles are applied
                const computedStyle = getComputedStyle(el)
                el.style.fontSize = computedStyle.fontSize
                el.style.fontWeight = computedStyle.fontWeight
                el.style.lineHeight = computedStyle.lineHeight
                el.style.color = computedStyle.color
              }
            })

            // Fix badge alignment and styling
            const badges = clonedElement.querySelectorAll('[class*="badge"], [class*="Badge"], .inline-flex')
            Array.from(badges).forEach(badge => {
              if (badge instanceof HTMLElement) {
                badge.style.display = 'inline-flex'
                badge.style.alignItems = 'center'
                badge.style.justifyContent = 'center'
                badge.style.whiteSpace = 'nowrap'
                badge.style.flexShrink = '0'
                badge.style.verticalAlign = 'middle'
                badge.style.textAlign = 'center'
                
                // Ensure badge content is properly sized
                badge.style.padding = badge.style.padding || '0.25rem 0.5rem'
                badge.style.borderRadius = badge.style.borderRadius || '0.375rem'
                badge.style.fontSize = badge.style.fontSize || '0.75rem'
                badge.style.fontWeight = badge.style.fontWeight || '500'
              }
            })

            // Fix flex containers and card layouts
            const flexContainers = clonedElement.querySelectorAll('[class*="flex"], .grid')
            Array.from(flexContainers).forEach(container => {
              if (container instanceof HTMLElement) {
                // Preserve flex/grid layouts
                const computedDisplay = getComputedStyle(container).display
                if (computedDisplay.includes('flex')) {
                  container.style.display = 'flex'
                  container.style.flexWrap = container.style.flexWrap || 'wrap'
                  container.style.alignItems = container.style.alignItems || 'center'
                  container.style.gap = container.style.gap || '0.5rem'
                } else if (computedDisplay.includes('grid')) {
                  container.style.display = 'grid'
                }
              }
            })

            // Ensure all card content is visible
            const cards = clonedElement.querySelectorAll('[class*="card"], [class*="Card"]')
            Array.from(cards).forEach(card => {
              if (card instanceof HTMLElement) {
                card.style.overflow = 'visible'
                card.style.height = 'auto'
                card.style.minHeight = 'auto'
                card.style.maxHeight = 'none'
                
                // Make sure card content isn't clipped
                const cardContent = card.querySelectorAll('*')
                Array.from(cardContent).forEach(content => {
                  if (content instanceof HTMLElement) {
                    content.style.overflow = 'visible'
                    content.style.textOverflow = 'clip'
                    content.style.whiteSpace = content.style.whiteSpace === 'nowrap' ? 'normal' : content.style.whiteSpace
                  }
                })
              }
            })

            // Fix gradient backgrounds and colors
            const gradientElements = clonedElement.querySelectorAll('[class*="gradient"], [style*="gradient"]')
            Array.from(gradientElements).forEach(el => {
              if (el instanceof HTMLElement) {
                // Ensure gradients render properly
                const computedStyle = getComputedStyle(el)
                el.style.background = computedStyle.background
                el.style.backgroundImage = computedStyle.backgroundImage
              }
            })
          }
        }
      })

      // Restore original styles
      Object.entries(originalStyles).forEach(([property, value]) => {
        element.style[property as any] = value
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Professional Portrait A4 PDF Configuration
      const pdf = new jsPDF({
        orientation: 'portrait', // Changed to portrait for professional business reports
        unit: 'mm',
        format: 'a4',
        compress: false // Maintain quality
      })

      // A4 Portrait dimensions
      const pdfWidth = 210
      const pdfHeight = 297
      
      // Calculate optimal scaling for portrait layout
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      
      // Calculate scale to fit width with proper margins
      const contentWidth = pdfWidth - 30 // 15mm margins on each side
      const scale = contentWidth / (canvasWidth * 0.264583) // Convert pixels to mm
      const scaledHeight = (canvasHeight * 0.264583) * scale
      
      // Professional header
      pdf.setFontSize(22)
      pdf.setTextColor(30, 41, 59) // slate-800
      const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf.text(cleanTitle, 15, 25)
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 116, 139) // slate-500
      pdf.text(`Sales Intelligence Report`, 15, 33)
      pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 15, 40)
      
      // Professional separator
      pdf.setDrawColor(203, 213, 225) // slate-300
      pdf.setLineWidth(0.8)
      pdf.line(15, 45, pdfWidth - 15, 45)
      
      // Content positioning
      const contentStartY = 50
      const availableHeight = pdfHeight - contentStartY - 15 // Bottom margin
      
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
            pdf.setFontSize(16)
            pdf.setTextColor(100, 116, 139)
            pdf.text(`${cleanTitle} - Page ${page + 1} of ${totalPages}`, 15, 20)
            pdf.setDrawColor(203, 213, 225)
            pdf.line(15, 25, pdfWidth - 15, 25)
          }
          
          const currentPageStartY = page === 0 ? contentStartY : 30
          const currentAvailableHeight = page === 0 ? availableHeight : (pdfHeight - 30 - 15)
          
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
      
      toast.success('Professional PDF report generated successfully!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF report. Please try again.')
    }
  }, [filename])
  
  return { exportToPDF }
}
