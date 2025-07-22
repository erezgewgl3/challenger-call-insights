
import { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { storeElementStyles, restoreElementStyles, optimizeElementForPDF, enablePDFExportMode, disablePDFExportMode } from '@/utils/elementStyleUtils'
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

/**
 * Enhanced font loading detection for production environments
 */
async function ensureAllFontsLoaded(): Promise<void> {
  console.log('🔤 Enhanced font loading detection for production')
  
  // Wait for document fonts ready
  await document.fonts.ready
  
  // Additional font loading checks
  const fontLoadPromises: Promise<void>[] = []
  
  // Check for common web fonts that might not be detected by document.fonts.ready
  const commonFonts = [
    'Inter',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial'
  ]
  
  commonFonts.forEach(fontFamily => {
    const fontPromise = new Promise<void>((resolve) => {
      const testElement = document.createElement('div')
      testElement.style.fontFamily = fontFamily
      testElement.style.position = 'absolute'
      testElement.style.left = '-9999px'
      testElement.style.top = '-9999px'
      testElement.style.fontSize = '16px'
      testElement.textContent = 'Font loading test'
      
      document.body.appendChild(testElement)
      
      setTimeout(() => {
        document.body.removeChild(testElement)
        resolve()
      }, 100)
    })
    
    fontLoadPromises.push(fontPromise)
  })
  
  await Promise.all(fontLoadPromises)
  
  // Additional delay to ensure all fonts are fully applied
  await new Promise(resolve => setTimeout(resolve, 500))
  
  console.log('🔤 All fonts loaded and ready for PDF generation')
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let sectionsToRestore: string[] = []
    let modifiedElements: ElementState[] = []
    let originalStyles: any = null
    let textElementsWithStyles: Array<{ element: HTMLElement, originalStyles: Record<string, string> }> = []
    
    try {
      toast.info('Preparing PDF export...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
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
      
      // Phase 3: Enable PDF export mode for scoped CSS positioning fixes
      enablePDFExportMode(element)
      
      // CRITICAL: Allow time for CSS changes to take effect
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Phase 4: Text optimization with positioning fixes for PDF
      const allContentSections = element.querySelectorAll('.space-y-4, .border-l-4, .p-4, .p-6')
      allContentSections.forEach((section) => {
        if (section instanceof HTMLElement) {
          const textElements = section.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6')
          textElements.forEach((textEl) => {
            if (textEl instanceof HTMLElement && textEl.textContent && textEl.textContent.length > 20) {
              const originalTextStyles = storeElementStyles(textEl)
              optimizeElementForPDF(textEl, 'text', true) // true = apply positioning fixes
              textElementsWithStyles.push({ element: textEl, originalStyles: originalTextStyles })
            }
          })
          
          const originalSectionStyles = storeElementStyles(section)
          optimizeElementForPDF(section, 'container', true) // true = apply positioning fixes
          textElementsWithStyles.push({ element: section, originalStyles: originalSectionStyles })
        }
      })

      // Phase 5: Enhanced font loading
      await ensureAllFontsLoaded()
      
      // Phase 6: Optimize main element for PDF rendering with positioning fixes
      toast.info('Optimizing for PDF capture...', { duration: 2000 })
      originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main', true) // true = apply positioning fixes
      
      // CRITICAL: Extended delay to ensure all CSS changes are fully applied
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Phase 7: Generate canvas
      toast.info('Generating high-quality canvas...', { duration: 3000 })
      const canvas = await generateCanvas(element)

      // Phase 8: Create PDF
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
      
      // CRITICAL: Restore styles BEFORE saving PDF
      if (originalStyles) {
        restoreElementStyles(element, originalStyles)
      }
      
      // Restore text element styles
      textElementsWithStyles.forEach(({ element, originalStyles }) => {
        restoreElementStyles(element, originalStyles)
      })
      
      // Disable PDF export mode to restore normal layout
      disablePDFExportMode(element)
      
      pdf.save(pdfFilename)
      
      toast.success('PDF exported successfully!', { 
        duration: 4000,
        description: `Content captured: ${modifiedElements.length} sections expanded`
      })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      // Phase 9: Cleanup and restoration
      setTimeout(() => {
        restoreElementStates(modifiedElements)
        
        // Restore text elements
        textElementsWithStyles.forEach(({ element, originalStyles }) => {
          restoreElementStyles(element, originalStyles)
        })
        
        // Ensure PDF export mode is disabled
        const element = document.getElementById(elementId)
        if (element) {
          disablePDFExportMode(element)
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
