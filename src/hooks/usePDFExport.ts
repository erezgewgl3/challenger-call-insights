
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
      toast.info('Generating professional PDF...', { duration: 2000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Ensure we're at the top and allow settling
      window.scrollTo(0, 0)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Store original styles
      const originalWidth = element.style.width
      const originalMaxWidth = element.style.maxWidth
      const originalMinWidth = element.style.minWidth

      // Temporarily set optimal width for capture
      element.style.width = '1400px'
      element.style.maxWidth = '1400px'
      element.style.minWidth = '1400px'

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100))

      // High-quality capture with optimal settings
      const canvas = await html2canvas(element, {
        scale: 2, // Good balance of quality vs file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        scrollX: 0,
        scrollY: 0,
        width: 1400, // Fixed optimal width
        height: element.scrollHeight,
        windowWidth: 1400,
        windowHeight: element.scrollHeight,
        ignoreElements: (element) => {
          return element.classList?.contains('no-pdf') || false
        },
        onclone: (clonedDoc, clonedElement) => {
          if (clonedElement) {
            // Ensure proper layout in clone
            clonedElement.style.width = '1400px'
            clonedElement.style.maxWidth = '1400px'
            clonedElement.style.minWidth = '1400px'
            clonedElement.style.transform = 'none'
            clonedElement.style.overflow = 'visible'
            clonedElement.style.position = 'static'
            
            // Fix all text rendering with proper CSS properties
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach(el => {
              if (el instanceof HTMLElement) {
                // Use proper CSS properties that exist on CSSStyleDeclaration
                el.style.setProperty('-webkit-font-smoothing', 'antialiased')
                el.style.setProperty('-moz-osx-font-smoothing', 'grayscale')
                el.style.textRendering = 'optimizeLegibility'
                el.style.fontSize = getComputedStyle(el).fontSize
                el.style.lineHeight = getComputedStyle(el).lineHeight
                el.style.fontWeight = getComputedStyle(el).fontWeight
              }
            })

            // Specifically fix badge containers
            const badgeContainers = clonedElement.querySelectorAll('.flex, [class*="flex"]')
            badgeContainers.forEach(container => {
              if (container instanceof HTMLElement) {
                container.style.display = 'flex'
                container.style.flexWrap = 'wrap'
                container.style.alignItems = 'center'
                container.style.gap = '0.5rem'
                container.style.width = 'auto'
              }
            })

            // Fix badges specifically
            const badges = clonedElement.querySelectorAll('[class*="badge"], [class*="Badge"]')
            badges.forEach(badge => {
              if (badge instanceof HTMLElement) {
                badge.style.display = 'inline-flex'
                badge.style.alignItems = 'center'
                badge.style.whiteSpace = 'nowrap'
                badge.style.flexShrink = '0'
                badge.style.padding = '0.25rem 0.5rem'
                badge.style.borderRadius = '0.375rem'
                badge.style.fontSize = '0.75rem'
                badge.style.fontWeight = '500'
              }
            })
          }
        }
      })

      // Restore original styles
      element.style.width = originalWidth
      element.style.maxWidth = originalMaxWidth
      element.style.minWidth = originalMinWidth

      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate proper PDF dimensions for readability
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      
      // Use A4 landscape for better width utilization
      const pdfWidth = 297 // A4 landscape width
      const pdfHeight = 210 // A4 landscape height
      
      // Calculate scale to fit width properly (leaving margins)
      const contentWidth = pdfWidth - 20 // 10mm margins on each side
      const scale = contentWidth / (canvasWidth * 0.264583) // Convert px to mm
      const scaledHeight = (canvasHeight * 0.264583) * scale
      
      // Determine if we need multiple pages
      const maxContentHeight = pdfHeight - 30 // Account for header
      const needsMultiplePages = scaledHeight > maxContentHeight
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      })

      // Add professional header
      pdf.setFontSize(20)
      pdf.setTextColor(30, 41, 59)
      pdf.text(title.replace(/_/g, ' '), 15, 20)
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 116, 139)
      pdf.text(`Sales Analysis Report • Generated ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 15, 28)
      
      // Add separator
      pdf.setDrawColor(203, 213, 225)
      pdf.setLineWidth(0.5)
      pdf.line(15, 32, pdfWidth - 15, 32)

      if (needsMultiplePages) {
        // Multi-page layout for long content
        const pageHeight = maxContentHeight
        const totalPages = Math.ceil(scaledHeight / pageHeight)
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
            // Add header to subsequent pages
            pdf.setFontSize(14)
            pdf.setTextColor(100, 116, 139)
            pdf.text(`${title.replace(/_/g, ' ')} - Page ${page + 1}`, 15, 15)
            pdf.line(15, 20, pdfWidth - 15, 20)
          }
          
          const yOffset = page === 0 ? 35 : 25
          const sourceY = page * (pageHeight / scale) / 0.264583
          const sourceHeight = Math.min((pageHeight / scale) / 0.264583, canvasHeight - sourceY)
          
          if (sourceHeight > 0) {
            // Create a canvas for this page section
            const pageCanvas = document.createElement('canvas')
            const pageCtx = pageCanvas.getContext('2d')
            
            pageCanvas.width = canvasWidth
            pageCanvas.height = sourceHeight
            
            if (pageCtx) {
              pageCtx.drawImage(canvas, 0, sourceY, canvasWidth, sourceHeight, 0, 0, canvasWidth, sourceHeight)
              const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
              
              pdf.addImage(pageImgData, 'PNG', 10, yOffset, contentWidth, (sourceHeight * 0.264583) * scale, '', 'FAST')
            }
          }
        }
      } else {
        // Single page layout
        pdf.addImage(imgData, 'PNG', 10, 35, contentWidth, scaledHeight, '', 'FAST')
      }
      
      // Generate clean filename
      const cleanTitle = title
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase()
      
      const timestamp = new Date().toISOString().slice(0, 10)
      const pdfFilename = `${cleanTitle}_analysis_${timestamp}.pdf`
      
      pdf.save(pdfFilename)
      
      toast.success('Professional PDF exported successfully!')
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('PDF export failed. Please try again.')
    }
  }, [filename])
  
  return { exportToPDF }
}
