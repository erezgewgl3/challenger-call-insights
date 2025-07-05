
import jsPDF from 'jspdf'

/**
 * Generates a clean filename for PDF export with timestamp
 */
export function generateCleanFilename(title: string): string {
  const timestamp = new Date().toISOString().slice(0, 10)
  const cleanFilename = title
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
  
  return `${cleanFilename}_sales_analysis_${timestamp}.pdf`
}

/**
 * Calculates PDF dimensions and scaling for optimal layout
 */
export function calculatePDFDimensions(canvas: HTMLCanvasElement) {
  // A4 dimensions in mm
  const pdfWidth = 210
  const pdfHeight = 297
  
  // Calculate scaling with margins
  const contentWidth = pdfWidth - 20 // 10mm margins on each side
  const scale = contentWidth / (canvas.width * 0.264583)
  const scaledHeight = (canvas.height * 0.264583) * scale
  
  return {
    scale,
    scaledHeight,
    contentWidth,
    pdfWidth,
    pdfHeight
  }
}

/**
 * Creates a professional PDF header with title and metadata
 */
export function createPDFHeader(pdf: jsPDF, title: string): number {
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
  
  // Separator line - get page width from PDF
  const pageWidth = pdf.internal.pageSize.getWidth()
  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.5)
  pdf.line(10, 40, pageWidth - 10, 40)
  
  return 45 // Return the Y position where content should start
}
