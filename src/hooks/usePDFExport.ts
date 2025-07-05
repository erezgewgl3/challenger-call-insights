
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
      toast.info('🚀 Preparing comprehensive PDF export...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('❌ Unable to find content to export')
        return
      }

      console.log('🎯 Starting comprehensive PDF export for element:', {
        elementId,
        scrollHeight: element.scrollHeight,
        offsetHeight: element.offsetHeight,
        clientHeight: element.clientHeight,
        hasScrollableContent: element.scrollHeight > element.clientHeight
      })

      // Phase 1: Expand user-controlled sections
      if (options?.sectionsOpen && options?.toggleSection) {
        console.log('📂 Phase 1: Expanding user-controlled sections')
        Object.entries(options.sectionsOpen).forEach(([sectionKey, isOpen]) => {
          if (!isOpen) {
            sectionsToRestore.push(sectionKey)
            options.toggleSection!(sectionKey)
            console.log(`📂 Expanding user section: ${sectionKey}`)
          }
        })
        if (sectionsToRestore.length > 0) {
          console.log(`📂 Waiting for ${sectionsToRestore.length} sections to expand...`)
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // Phase 2: Comprehensive content expansion
      console.log('📏 Phase 2: Comprehensive content expansion')
      const sectionModifiedElements = expandCollapsedSections(element)
      modifiedElements.push(...sectionModifiedElements)
      
      console.log('📜 Phase 3: Additional scrollable content expansion')
      expandScrollableContent(element, modifiedElements)
      
      // Wait for DOM changes to settle and fonts to load
      await document.fonts.ready
      console.log('⏳ Allowing DOM changes to settle...')
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Phase 4: Optimize for PDF rendering
      console.log('🎨 Phase 4: Optimizing element styles for PDF capture')
      const originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Phase 5: Validate content expansion
      console.log('🔍 Phase 5: Validating content expansion')
      const emailElements = element.querySelectorAll('.font-mono, .whitespace-pre-wrap, [data-testid*="email"]')
      console.log('📧 Email content validation:', {
        emailElementsFound: emailElements.length,
        totalModifiedElements: modifiedElements.length,
        elementDimensions: {
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          isFullyExpanded: element.scrollHeight <= element.clientHeight + 10
        }
      })
      
      emailElements.forEach((emailEl, index) => {
        if (emailEl instanceof HTMLElement) {
          const isExpanded = emailEl.scrollHeight <= emailEl.clientHeight + 5
          console.log(`📧 Email element ${index + 1} status:`, {
            scrollHeight: emailEl.scrollHeight,
            clientHeight: emailEl.clientHeight,
            isFullyExpanded: isExpanded,
            classes: emailEl.className,
            hasMaxHeightClass: Array.from(emailEl.classList).some(cls => cls.startsWith('max-h-') && cls !== 'max-h-none'),
            textPreview: emailEl.textContent?.substring(0, 50) + '...'
          })
        }
      })
      
      toast.info('📸 Generating high-quality canvas...', { duration: 2000 })
      
      // Phase 6: Generate canvas with improved sizing
      const canvas = await generateCanvas(element)
      restoreElementStyles(element, originalStyles)

      // Phase 7: Create PDF
      const pdf = createPDFDocument()
      const contentHeightMM = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeightFirstPage = 297 - 45 - 10 // A4 height - header - margin
      
      console.log('📄 PDF layout decision:', {
        contentHeightMM,
        availableHeightFirstPage,
        needsMultiPage: contentHeightMM > availableHeightFirstPage,
        canvasDimensions: {
          width: canvas.width,
          height: canvas.height
        },
        modifiedElementsCount: modifiedElements.length
      })

      toast.info('📋 Creating professional PDF document...', { duration: 2000 })

      if (contentHeightMM <= availableHeightFirstPage) {
        console.log('📄 Using single-page layout')
        addCanvasToPDF(pdf, canvas, title)
      } else {
        console.log('📄 Using multi-page layout')
        addMultiPageContent(pdf, canvas, title)
      }
      
      const pdfFilename = generateCleanFilename(title)
      pdf.save(pdfFilename)
      toast.success('✅ Professional PDF exported successfully!', { 
        duration: 4000,
        description: `${modifiedElements.length} content areas expanded for complete capture`
      })
      
    } catch (error) {
      console.error('❌ PDF export failed:', error)
      toast.error('❌ Failed to generate PDF. Please try again.', {
        description: 'Check console for detailed error information'
      })
    } finally {
      // Phase 8: Comprehensive cleanup
      console.log('🔄 Restoring all modified elements and states')
      restoreElementStates(modifiedElements)
      
      if (options?.toggleSection && sectionsToRestore.length > 0) {
        console.log(`🔄 Restoring ${sectionsToRestore.length} user-controlled sections`)
        setTimeout(() => {
          sectionsToRestore.forEach(sectionKey => {
            options.toggleSection!(sectionKey)
            console.log(`🔄 Restored user section: ${sectionKey}`)
          })
        }, 500)
      }
      
      console.log('✅ PDF export process complete')
    }
  }, [filename])
  
  return { exportToPDF }
}
