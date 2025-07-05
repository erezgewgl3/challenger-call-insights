
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
      toast.info('Preparing content for professional PDF export...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      console.log('Starting PDF export for element:', {
        elementId,
        scrollHeight: element.scrollHeight,
        offsetHeight: element.offsetHeight,
        clientHeight: element.clientHeight
      })

      // Expand sections for complete content capture
      if (options?.sectionsOpen && options?.toggleSection) {
        Object.entries(options.sectionsOpen).forEach(([sectionKey, isOpen]) => {
          if (!isOpen) {
            sectionsToRestore.push(sectionKey)
            options.toggleSection!(sectionKey)
          }
        })
        if (sectionsToRestore.length > 0) {
          console.log('Expanding sections for PDF:', sectionsToRestore)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // Enhanced: Comprehensive content expansion with better targeting
      console.log('Phase 1: Expanding collapsed UI sections')
      const sectionModifiedElements = expandCollapsedSections(element)
      modifiedElements.push(...sectionModifiedElements)
      
      console.log('Phase 2: Expanding scrollable content areas')
      expandScrollableContent(element, modifiedElements)
      
      // Wait for fonts and DOM changes to settle
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('Phase 3: Optimizing element styles for PDF capture')
      const originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Enhanced validation: Check if critical content is now visible
      const emailElements = element.querySelectorAll('.font-mono, .whitespace-pre-wrap')
      console.log('Email content validation:', {
        emailElementsFound: emailElements.length,
        totalModifiedElements: modifiedElements.length
      })
      
      emailElements.forEach((emailEl, index) => {
        if (emailEl instanceof HTMLElement) {
          console.log(`Email element ${index + 1} dimensions:`, {
            scrollHeight: emailEl.scrollHeight,
            clientHeight: emailEl.clientHeight,
            isFullyVisible: emailEl.scrollHeight <= emailEl.clientHeight + 5, // 5px tolerance
            classes: emailEl.className
          })
        }
      })
      
      toast.info('Generating high-quality canvas...', { duration: 2000 })
      
      // Generate canvas with improved sizing
      const canvas = await generateCanvas(element)
      restoreElementStyles(element, originalStyles)

      // Determine if we need multi-page layout
      const pdf = createPDFDocument()
      const contentHeightMM = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeightFirstPage = 297 - 45 - 10 // A4 height - header - margin
      
      console.log('PDF layout decision:', {
        contentHeightMM,
        availableHeightFirstPage,
        needsMultiPage: contentHeightMM > availableHeightFirstPage,
        canvasHeight: canvas.height,
        canvasWidth: canvas.width
      })

      toast.info('Creating professional PDF document...', { duration: 2000 })

      if (contentHeightMM <= availableHeightFirstPage) {
        console.log('Using single-page layout')
        addCanvasToPDF(pdf, canvas, title)
      } else {
        console.log('Using multi-page layout')
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
      console.log('Restoring all modified elements and states')
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
