
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
 * Calculates PDF dimensions and scaling for optimal layout
 * 
 * Computes scaling factors to fit canvas content within A4 page boundaries
 * while maintaining aspect ratio. Accounts for page margins and ensures
 * professional document layout.
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
  
  // Calculate scaling with margins
  const contentWidth = pdfWidth - 20 // 10mm margins on each side
  const scale = contentWidth / (canvas.width * 0.264583)
  const scaledHeight = (canvas.height * 0.264583) * scale
  
  return {
    /** Scaling factor to fit content within page width */
    scale,
    /** Height of scaled content in mm */
    scaledHeight,
    /** Available content width in mm (with margins) */
    contentWidth,
    /** Full PDF page width in mm */
    pdfWidth,
    /** Full PDF page height in mm */
    pdfHeight
  }
}

/**
 * Creates a professional PDF header with title and metadata
 * 
 * Adds formatted header section containing:
 * - Document title (formatted and styled)
 * - Document type indicator
 * - Generation timestamp
 * - Professional separator line
 * 
 * @param pdf - jsPDF instance to add header to
 * @param title - Document title to display in header
 * @returns Y-coordinate where main content should start (below header)
 * 
 * @example
 * ```typescript
 * const pdf = createPDFDocument();
 * const contentStartY = createPDFHeader(pdf, 'sales_analysis_report');
 * // Add main content starting at contentStartY...
 * ```
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
