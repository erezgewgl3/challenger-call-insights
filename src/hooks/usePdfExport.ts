
import { useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface UsePdfExportOptions {
  filename?: string
  quality?: number
}

export const usePdfExport = (options: UsePdfExportOptions = {}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportToPdf = async (elementId: string, transcriptTitle?: string) => {
    try {
      setIsExporting(true)
      setError(null)

      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Element not found for PDF export')
      }

      // Temporarily expand all collapsible sections for complete capture
      const collapsibleElements = element.querySelectorAll('[data-state="closed"]')
      const originalStates: { element: Element; originalState: string }[] = []
      
      collapsibleElements.forEach((el) => {
        const originalState = el.getAttribute('data-state') || ''
        originalStates.push({ element: el, originalState })
        el.setAttribute('data-state', 'open')
      })

      // Wait for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth
      })

      // Restore original states
      originalStates.forEach(({ element, originalState }) => {
        element.setAttribute('data-state', originalState)
      })

      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0

      // Add content to PDF with proper scaling
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

      // Generate filename
      const defaultFilename = transcriptTitle 
        ? `${transcriptTitle.replace(/[^a-z0-9]/gi, '_')}_Analysis.pdf`
        : 'Sales_Analysis.pdf'
      
      const filename = options.filename || defaultFilename

      // Download PDF
      pdf.save(filename)

    } catch (err) {
      console.error('PDF export failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportToPdf,
    isExporting,
    error
  }
}
