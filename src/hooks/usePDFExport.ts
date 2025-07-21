
import { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { 
  storeElementStyles, 
  restoreElementStyles
} from '@/utils/elementStyleUtils'
import { expandCollapsedSections, expandScrollableContent, restoreElementStates, ElementState } from '@/utils/sectionExpansion'
import { generateCanvas } from '@/services/canvasGenerator'
import { createPDFDocument, addCanvasToPDF, addMultiPageContent } from '@/services/pdfGenerator'

interface UsePDFExportProps {
  filename?: string
}

interface PDFExportOptions {
  sectionsOpen?: Record<string, boolean>
  toggleSection?: (section: string) => void
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let sectionsToRestore: string[] = []
    let modifiedElements: ElementState[] = []
    let originalStyles: any = null
    let element: HTMLElement | null = null
    
    try {
      toast.info('Preparing PDF export...', { duration: 3000 })
      
      element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Phase 1: Expand user-controlled sections
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

      // Phase 2: Content expansion
      const sectionModifiedElements = expandCollapsedSections(element)
      modifiedElements.push(...sectionModifiedElements)
      expandScrollableContent(element, modifiedElements)
      
      // Phase 3: Wait for DOM updates
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Phase 4: SIMPLIFIED - Only optimize main container with fixed wide width
      toast.info('Optimizing for PDF capture...', { duration: 2000 })
      originalStyles = storeElementStyles(element)
      
      // Apply single, clean optimization with fixed wide width
      element.style.position = 'static'
      element.style.width = '1400px'
      element.style.maxWidth = '1400px'
      element.style.minWidth = '1400px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'
      element.style.left = 'auto'
      element.style.right = 'auto'
      element.style.marginLeft = 'auto'
      element.style.marginRight = 'auto'
      element.style.paddingLeft = '16px'
      element.style.paddingRight = '16px'
      element.style.boxSizing = 'border-box'
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Phase 5: Generate canvas with PDF flag
      toast.info('Generating high-quality canvas...', { duration: 3000 })
      const canvas = await generateCanvas(element, true) // Pass forPDF=true

      // Phase 6: Create PDF
      const pdf = createPDFDocument()
      const contentHeightMM = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeightFirstPage = 297 - 45 - 10

      toast.info('Creating PDF document...', { duration: 2000 })

      if (contentHeightMM <= availableHeightFirstPage) {
        addCanvasToPDF(pdf, canvas, title)
      } else {
        addMultiPageContent(pdf, canvas, title)
      }
      
      const pdfFilename = generateCleanFilename(title)
      
      // Restore original styles
      if (originalStyles) {
        restoreElementStyles(element, originalStyles)
      }
      
      pdf.save(pdfFilename)
      
      toast.success('PDF exported successfully!', { 
        duration: 4000,
        description: `Content captured: ${modifiedElements.length} sections expanded`
      })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      // Phase 7: Cleanup and restoration
      setTimeout(() => {
        restoreElementStates(modifiedElements)
        
        // Restore main element styles
        if (originalStyles && element) {
          restoreElementStyles(element, originalStyles)
        }
        
        if (options?.toggleSection && sectionsToRestore.length > 0) {
          sectionsToRestore.forEach(sectionKey => {
            options.toggleSection!(sectionKey)
          })
        }
      }, 1000)
    }
  }, [filename])
  
  return { exportToPDF }
}
