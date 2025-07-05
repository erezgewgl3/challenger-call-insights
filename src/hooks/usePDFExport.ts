
import { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { storeElementStyles, restoreElementStyles, optimizeElementForPDF } from '@/utils/elementStyleUtils'
import { expandCollapsedSections, expandScrollableContent, restoreElementStates, ElementState } from '@/utils/sectionExpansion'
import { generateCanvas } from '@/services/canvasGenerator'
import { createPDFDocument, addCanvasToPDF, addMultiPageContent } from '@/services/pdfGenerator'

/**
 * Configuration options for PDF export functionality
 */
interface UsePDFExportProps {
  /** Base filename for the exported PDF (without extension) */
  filename?: string
}

/**
 * Additional options for PDF export behavior
 */
interface PDFExportOptions {
  /** Current state of collapsible sections (section key -> is open) */
  sectionsOpen?: Record<string, boolean>
  /** Function to toggle section visibility */
  toggleSection?: (section: string) => void
}

/**
 * Custom hook for exporting HTML elements to professional PDF documents
 * 
 * Features:
 * - High-quality canvas rendering with html2canvas
 * - Multi-page support for long content
 * - Section expansion for complete content capture
 * - Professional PDF headers and formatting
 * - Automatic cleanup and state restoration
 * 
 * @param props - Configuration options for the PDF export
 * @returns Object containing the exportToPDF function
 * 
 * @example
 * ```typescript
 * const { exportToPDF } = usePDFExport({ filename: 'sales-analysis' });
 * 
 * await exportToPDF('content-element-id', 'Analysis Report', {
 *   sectionsOpen: { insights: true, recommendations: false },
 *   toggleSection: (section) => setSectionState(prev => ({ ...prev, [section]: !prev[section] }))
 * });
 * ```
 */
export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  /**
   * Exports an HTML element to a professional PDF document
   * 
   * Process:
   * 1. Expands collapsed sections for complete content capture
   * 2. Optimizes element styles for PDF rendering
   * 3. Generates high-quality canvas representation
   * 4. Creates PDF with professional formatting
   * 5. Handles multi-page content automatically
   * 6. Restores original element state
   * 
   * @param elementId - DOM ID of the element to export
   * @param title - Title for the PDF document header
   * @param options - Additional export configuration options
   * 
   * @throws Will show error toast if element not found or export fails
   * 
   * @example
   * ```typescript
   * await exportToPDF('analysis-results', 'Sales Analysis Report', {
   *   sectionsOpen: sectionsState,
   *   toggleSection: handleToggleSection
   * });
   * ```
   */
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let sectionsToRestore: string[] = []
    let modifiedElements: ElementState[] = []
    
    try {
      toast.info('Generating professional PDF...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Expand sections for complete content capture
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

      // Expand UI elements and prepare for capture
      const sectionModifiedElements = expandCollapsedSections(element)
      expandScrollableContent(element, modifiedElements)
      modifiedElements.push(...sectionModifiedElements)
      await document.fonts.ready

      // Optimize and capture element
      const originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 500))
      const canvas = await generateCanvas(element)
      restoreElementStyles(element, originalStyles)

      // Generate and save PDF
      const pdf = createPDFDocument()
      const canvasHeight = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeight = 297 - 45 - 10

      if (canvasHeight <= availableHeight) {
        addCanvasToPDF(pdf, canvas, title)
      } else {
        addMultiPageContent(pdf, canvas, title)
      }
      
      const pdfFilename = generateCleanFilename(title)
      pdf.save(pdfFilename)
      toast.success('Professional PDF exported successfully!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      // Restore all modified states
      restoreElementStates(modifiedElements)
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
