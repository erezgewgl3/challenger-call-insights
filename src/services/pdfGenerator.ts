
import jsPDF from 'jspdf'
import { calculatePDFDimensions, createPDFHeader } from '@/utils/pdfUtils'
import { createMultiPageCanvas } from './canvasGenerator'

/**
 * Creates and initializes a new PDF document with standard configuration
 */
export function createPDFDocument(): jsPDF {
  return new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false
  })
}

/**
 * Adds a single canvas to PDF as one page
 */
export function addCanvasToPDF(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const imgData = canvas.toDataURL('image/png', 1.0)
  const { scale, scaledHeight, contentWidth } = calculatePDFDimensions(canvas)
  
  // Create header
  const contentStartY = createPDFHeader(pdf, title)
  
  // Add the image
  pdf.addImage(imgData, 'PNG', 10, contentStartY, contentWidth, scaledHeight, '', 'FAST')
}

/**
 * Handles multi-page PDF content with proper headers and pagination
 */
export function addMultiPageContent(pdf: jsPDF, canvas: HTMLCanvasElement, title: string): void {
  const imgData = canvas.toDataURL('image/png', 1.0)
  const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
  
  // Create header for first page
  const contentStartY = createPDFHeader(pdf, title)
  
  // Calculate available heights
  const availableHeight = pdfHeight - contentStartY - 10
  const pageContentHeight = availableHeight
  const totalPages = Math.ceil(scaledHeight / pageContentHeight)
  
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      pdf.addPage()
      
      // Add header for subsequent pages
      pdf.setFontSize(14)
      pdf.setTextColor(100, 116, 139)
      const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      pdf.text(`${cleanTitle} - Page ${page + 1} of ${totalPages}`, 10, 15)
      pdf.setDrawColor(203, 213, 225)
      pdf.line(10, 20, pdfWidth - 10, 20)
    }
    
    const currentPageStartY = page === 0 ? contentStartY : 25
    const currentAvailableHeight = page === 0 ? availableHeight : (pdfHeight - 25 - 10)
    
    try {
      // Create page-specific canvas
      const pageCanvas = createMultiPageCanvas(canvas, currentAvailableHeight, page)
      const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
      
      const pageScaledHeight = (pageCanvas.height * 0.264583) * scale
      pdf.addImage(pageImgData, 'PNG', 10, currentPageStartY, contentWidth, pageScaledHeight, '', 'FAST')
    } catch (error) {
      console.warn(`Failed to create page ${page + 1}, skipping:`, error)
    }
  }
}
