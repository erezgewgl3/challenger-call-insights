
import jsPDF from 'jspdf'

/**
 * Generates a clean filename for PDF export with timestamp
 * 
 * Creates SEO-friendly filenames by:
 * - Removing special characters and symbols
 * - Converting spaces to underscores
 * - Converting to lowercase
 * - Adding current date stamp
 * - Appending descriptive suffix
 * 
 * @param title - Original title/name for the document
 * @returns Clean filename with .pdf extension ready for download
 * 
 * @example
 * ```typescript
 * const filename = generateCleanFilename('Sales Analysis Report!');
 * // Returns: "sales_analysis_report_sales_analysis_2024-01-15.pdf"
 * ```
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
 * Enhanced PDF dimensions calculation with improved scaling for better readability
 * 
 * UPDATED: Less aggressive scaling for larger, more readable fonts
 * Computes scaling factors to fit canvas content within A4 page boundaries
 * while maintaining aspect ratio and ensuring better typography.
 * 
 * @param canvas - HTML canvas containing the content to be placed in PDF
 * @returns Object containing calculated dimensions and scaling factors
 * 
 * @example
 * ```typescript
 * const canvas = await generateCanvas(element);
 * const { scale, scaledHeight, contentWidth } = calculatePDFDimensions(canvas);
 * // Use dimensions for PDF layout...
 * ```
 */
export function calculatePDFDimensions(canvas: HTMLCanvasElement) {
  // A4 dimensions in mm
  const pdfWidth = 210
  const pdfHeight = 297
  
  // Account for html2canvas 3x scale factor (updated from 2x)
  const actualCanvasWidth = canvas.width / 3
  const actualCanvasHeight = canvas.height / 3
  
  console.log('Enhanced PDF dimension calculation with improved scaling:', {
    originalCanvasWidth: canvas.width,
    originalCanvasHeight: canvas.height,
    actualCanvasWidth,
    actualCanvasHeight,
    scaleFactorAccountedFor: 2
  })
  
  // ENHANCED: Less aggressive scaling with more generous content width for better readability
  const contentWidth = pdfWidth - 15 // Reduced margins: 7.5mm on each side instead of 10mm
  const pixelsToMM = actualCanvasWidth * 0.264583 // Pixels to mm conversion
  
  // ENHANCED: Improved scaling calculation for larger content
  const baseScale = contentWidth / pixelsToMM
  const enhancedScale = baseScale * 1.15 // 15% larger for better readability
  
  const scaledHeight = (actualCanvasHeight * 0.264583) * enhancedScale
  
  console.log('Enhanced PDF scaling calculations:', {
    contentWidth,
    pixelsToMM,
    baseScale,
    enhancedScale,
    scaledHeight,
    improvementFactor: 1.15
  })
  
  return {
    /** Enhanced scaling factor for better readability */
    scale: enhancedScale,
    /** Height of scaled content in mm */
    scaledHeight,
    /** Available content width in mm (with reduced margins) */
    contentWidth,
    /** Full PDF page width in mm */
    pdfWidth,
    /** Full PDF page height in mm */
    pdfHeight
  }
}

/**
 * Creates a professional PDF header with enhanced typography
 * 
 * @param pdf - jsPDF instance to add header to
 * @param title - Document title to display in header
 * @param pageNumber - Optional page number for continuation pages
 * @param sectionName - Optional section name for continuation indicator
 * @returns Y-coordinate where main content should start
 */
export function createPDFHeader(
  pdf: jsPDF, 
  title: string,
  pageNumber?: number,
  sectionName?: string
): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  // First page gets full header, continuation pages get compact version
  if (pageNumber && pageNumber > 1) {
    // Compact header for continuation pages
    pdf.setFontSize(12)
    pdf.setTextColor(71, 85, 105)
    const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    pdf.text(`${cleanTitle} - Page ${pageNumber}`, 10, 12)
    
    // Page number on right
    pdf.setFontSize(10)
    pdf.setTextColor(148, 163, 184)
    pdf.text(`Page ${pageNumber}`, pageWidth - 10, 12, { align: 'right' })
    
    // Section continuation indicator
    if (sectionName) {
      pdf.setFontSize(9)
      pdf.setTextColor(100, 116, 139)
      pdf.text(`↓ ${sectionName}`, 10, 18)
    }
    
    // Separator line
    pdf.setDrawColor(203, 213, 225)
    pdf.setLineWidth(0.5)
    pdf.line(10, 22, pageWidth - 10, 22)
    
    return 28 // Content starts lower on continuation pages
  }
  
  // Full header for first page
  pdf.setFontSize(24)
  pdf.setTextColor(30, 41, 59)
  const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  pdf.text(cleanTitle, 10, 22)
  
  pdf.setFontSize(13)
  pdf.setTextColor(100, 116, 139)
  pdf.text('Sales Intelligence Report', 10, 32)
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 10, 40)
  
  // Enhanced separator line
  pdf.setDrawColor(203, 213, 225)
  pdf.setLineWidth(0.75)
  pdf.line(10, 46, pageWidth - 10, 46)
  
  return 52
}
