
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
      toast.info('Generating high-quality PDF...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Scroll to top and wait for animations
      window.scrollTo(0, 0)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Configure html2canvas for maximum quality
      const canvas = await html2canvas(element, {
        scale: 3, // Increased from 2 to 3 for ultra-crisp text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200, // Fixed width for consistent layout
        windowHeight: window.innerHeight,
        width: element.scrollWidth,
        height: element.scrollHeight,
        ignoreElements: (element) => {
          // Skip any problematic elements
          return element.classList?.contains('no-pdf') || false
        },
        onclone: (clonedDoc, clonedElement) => {
          // Fix layout issues in cloned document
          if (clonedElement) {
            // Ensure proper width
            clonedElement.style.width = '1200px'
            clonedElement.style.minWidth = '1200px'
            clonedElement.style.maxWidth = '1200px'
            clonedElement.style.transform = 'none'
            clonedElement.style.overflow = 'visible'
            
            // Fix badge alignment specifically
            const badges = clonedElement.querySelectorAll('[class*="badge"], [class*="Badge"]')
            badges.forEach(badge => {
              if (badge instanceof HTMLElement) {
                badge.style.display = 'inline-flex'
                badge.style.alignItems = 'center'
                badge.style.whiteSpace = 'nowrap'
                badge.style.flexShrink = '0'
              }
            })
            
            // Fix flex containers
            const flexContainers = clonedElement.querySelectorAll('[class*="flex"]')
            flexContainers.forEach(container => {
              if (container instanceof HTMLElement) {
                container.style.display = 'flex'
                container.style.flexWrap = 'wrap'
                container.style.gap = '0.5rem'
              }
            })
            
            // Ensure text is crisp
            const allText = clonedElement.querySelectorAll('*')
            allText.forEach(el => {
              if (el instanceof HTMLElement) {
                el.style.fontSmooth = 'always'
                el.style.webkitFontSmoothing = 'antialiased'
                el.style.textRendering = 'optimizeLegibility'
              }
            })
          }
        }
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate PDF dimensions for better layout
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      // A4 dimensions in mm
      const pdfWidth = 210
      const pdfHeight = 297
      
      // Calculate scaling to fit content properly
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264583), pdfHeight / (imgHeight * 0.264583))
      const scaledWidth = (imgWidth * 0.264583) * ratio * 0.95 // 5% margin
      const scaledHeight = (imgHeight * 0.264583) * ratio * 0.95
      
      // Create PDF with proper orientation
      const orientation = scaledHeight > scaledWidth ? 'portrait' : 'landscape'
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4',
        compress: false // Better quality
      })
      
      // Add title with better formatting
      pdf.setFontSize(18)
      pdf.setTextColor(30, 41, 59) // slate-800
      pdf.text(title.replace(/_/g, ' '), 15, 20)
      
      pdf.setFontSize(11)
      pdf.setTextColor(100, 116, 139) // slate-500
      pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, 15, 28)
      
      // Add separator line
      pdf.setDrawColor(203, 213, 225) // slate-300
      pdf.line(15, 32, pdfWidth - 15, 32)
      
      // Add the main content with better positioning
      const xOffset = (pdfWidth - scaledWidth) / 2
      const yOffset = 40
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, scaledWidth, scaledHeight, '', 'FAST')
      
      // Generate filename with proper formatting
      const cleanTitle = title
        .replace(/[^a-zA-Z0-9_\-\s]/g, '') // Remove special chars
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .toLowerCase()
      
      const timestamp = new Date().toISOString().slice(0, 10)
      const pdfFilename = `${cleanTitle}_analysis_${timestamp}.pdf`
      
      // Save the PDF
      pdf.save(pdfFilename)
      
      toast.success('High-quality PDF exported successfully!')
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('PDF export failed. Please try again.')
    }
  }, [filename])
  
  return { exportToPDF }
}
