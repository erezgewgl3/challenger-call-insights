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

/**
 * Enhanced font loading detection for production environments
 */
async function ensureAllFontsLoaded(): Promise<void> {
  console.log('🔤 Enhanced font loading detection for production')
  
  // Wait for document fonts ready
  await document.fonts.ready
  
  // PRODUCTION FIX: Additional font loading checks
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
      
      // Check if font is loaded by measuring text width
      const initialWidth = testElement.offsetWidth
      
      setTimeout(() => {
        const finalWidth = testElement.offsetWidth
        document.body.removeChild(testElement)
        
        console.log(`🔤 Font ${fontFamily} check:`, {
          initialWidth,
          finalWidth,
          loaded: initialWidth === finalWidth || finalWidth > 0
        })
        
        resolve()
      }, 100)
    })
    
    fontLoadPromises.push(fontPromise)
  })
  
  await Promise.all(fontLoadPromises)
  
  // PRODUCTION FIX: Additional delay to ensure all fonts are fully applied
  await new Promise(resolve => setTimeout(resolve, 500))
  
  console.log('🔤 All fonts loaded and ready for PDF generation')
}

/**
 * Production-specific positioning correction
 */
function applyProductionPositioningFixes(element: HTMLElement): Record<string, string> {
  console.log('🔧 Applying production positioning fixes')
  
  const originalStyles = {
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    marginLeft: element.style.marginLeft,
    marginTop: element.style.marginTop,
    transform: element.style.transform,
    width: element.style.width,
    maxWidth: element.style.maxWidth
  }
  
  // PRODUCTION FIX: Force consistent positioning
  element.style.setProperty('position', 'relative', 'important')
  element.style.setProperty('left', '0px', 'important')
  element.style.setProperty('top', '0px', 'important')
  element.style.setProperty('margin-left', '0px', 'important')
  element.style.setProperty('margin-top', '0px', 'important')
  element.style.setProperty('transform', 'none', 'important')
  element.style.setProperty('width', '100%', 'important')
  element.style.setProperty('max-width', 'none', 'important')
  
  return originalStyles
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let sectionsToRestore: string[] = []
    let modifiedElements: ElementState[] = []
    let originalStyles: any = null
    let productionPositionStyles: Record<string, string> = {}
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
      
      // Phase 3: Text optimization
      const allContentSections = element.querySelectorAll('.space-y-4, .border-l-4, .p-4, .p-6')
      allContentSections.forEach((section) => {
        if (section instanceof HTMLElement) {
          const textElements = section.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6')
          textElements.forEach((textEl) => {
            if (textEl instanceof HTMLElement && textEl.textContent && textEl.textContent.length > 20) {
              const originalTextStyles = storeElementStyles(textEl)
              optimizeElementForPDF(textEl, 'text')
              textElementsWithStyles.push({ element: textEl, originalStyles: originalTextStyles })
            }
          })
          
          const originalSectionStyles = storeElementStyles(section)
          optimizeElementForPDF(section, 'container')
          textElementsWithStyles.push({ element: section, originalStyles: originalSectionStyles })
        }
      })

      // Phase 4: PRODUCTION FIX - Enhanced font loading
      await ensureAllFontsLoaded()

      // Phase 5: PRODUCTION FIX - Apply positioning fixes
      productionPositionStyles = applyProductionPositioningFixes(element)
      
      // Phase 6: Optimize main element for PDF rendering
      toast.info('Optimizing for PDF capture...', { duration: 2000 })
      originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Phase 7: Generate canvas with enhanced positioning
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
      
      // PRODUCTION FIX: Restore positioning styles
      Object.entries(productionPositionStyles).forEach(([property, value]) => {
        if (value) {
          ;(element.style as any)[property] = value
        } else {
          element.style.removeProperty(property.replace(/([A-Z])/g, '-$1').toLowerCase())
        }
      })
      
      // Restore text element styles
      textElementsWithStyles.forEach(({ element, originalStyles }) => {
        restoreElementStyles(element, originalStyles)
      })
      
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
