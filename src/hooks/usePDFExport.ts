
import { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { storeElementStyles, restoreElementStyles, optimizeElementForPDF } from '@/utils/elementStyleUtils'
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
    
    try {
      toast.info('Generating professional PDF...', { duration: 3000 })
      
      // 1. Get target element
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // 2. Expand sections using options
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

      // 3. Expand collapsed content using utilities
      const sectionModifiedElements = expandCollapsedSections(element)
      expandScrollableContent(element, modifiedElements)
      modifiedElements.push(...sectionModifiedElements)

      await document.fonts.ready

      // 4. Optimize element for PDF capture
      const originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 500))

      // 5. Generate canvas using service
      const canvas = await generateCanvas(element)

      // 6. Restore element styles immediately
      restoreElementStyles(element, originalStyles)

      // 7. Create PDF using service
      const pdf = createPDFDocument()
      
      // 8. Determine layout strategy and add content
      const canvasHeight = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeight = 297 - 45 - 10 // A4 height - header - margin
      
      if (canvasHeight <= availableHeight) {
        addCanvasToPDF(pdf, canvas, title)
      } else {
        addMultiPageContent(pdf, canvas, title)
      }
      
      // 9. Save PDF with clean filename
      const pdfFilename = generateCleanFilename(title)
      pdf.save(pdfFilename)
      
      toast.success('Professional PDF exported successfully!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      // Restore all modified states
      restoreElementStates(modifiedElements)
      
      // Restore section states
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
