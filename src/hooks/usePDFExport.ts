
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
      toast.info('Generating PDF...', { duration: 2000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Configure html2canvas for high quality
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc', // Match your background
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure all styles are preserved
          const clonedElement = clonedDoc.getElementById(elementId)
          if (clonedElement) {
            clonedElement.style.transform = 'none'
            clonedElement.style.overflow = 'visible'
          }
        }
      })

      const imgData = canvas.toDataURL('image/png', 1.0)
      
      // Calculate PDF dimensions
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = imgHeight / imgWidth
      
      // A4 dimensions in mm
      const pdfWidth = 210
      const pdfHeight = pdfWidth * ratio
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: pdfHeight > 297 ? 'portrait' : 'portrait',
        unit: 'mm',
        format: pdfHeight > 297 ? [pdfWidth, pdfHeight] : 'a4'
      })
      
      // Add title page info
      pdf.setFontSize(16)
      pdf.setTextColor(51, 65, 85) // slate-700
      pdf.text(title, 20, 20)
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 116, 139) // slate-500
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 30)
      
      // Add the main content
      if (pdfHeight > 297) {
        // Multi-page for long content
        pdf.addImage(imgData, 'PNG', 0, 40, pdfWidth, pdfHeight - 40, '', 'FAST')
      } else {
        // Single page
        const scaleFactor = Math.min((297 - 50) / (pdfHeight - 40), 1)
        const scaledWidth = pdfWidth * scaleFactor
        const scaledHeight = (pdfHeight - 40) * scaleFactor
        
        pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, 40, scaledWidth, scaledHeight, '', 'FAST')
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 10)
      const pdfFilename = `${filename}-${timestamp}.pdf`
      
      // Save the PDF
      pdf.save(pdfFilename)
      
      toast.success('PDF exported successfully!')
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to export PDF. Please try again.')
    }
  }, [filename])
  
  return { exportToPDF }
}
