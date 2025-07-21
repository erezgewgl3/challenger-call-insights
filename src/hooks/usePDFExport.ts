
import { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { 
  storeElementStyles, 
  restoreElementStyles, 
  optimizeElementForPDF,
  restoreElementCompletely 
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

interface TextElementWithStyles {
  element: HTMLElement
  originalStyles: Record<string, string>
  removedClasses?: string[]
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let sectionsToRestore: string[] = []
    let modifiedElements: ElementState[] = []
    let originalStyles: any = null
    let removedTailwindClasses: string[] = []
    let textElementsWithStyles: TextElementWithStyles[] = []
    let heroSectionStyles: any = null
    let heroSectionRemovedClasses: string[] = []
    
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
      
      // Phase 3: Text optimization (excluding hero section for now)
      const heroSection = element.querySelector('.bg-gradient-to-br.from-slate-900')
      
      const allContentSections = element.querySelectorAll('.space-y-4, .border-l-4, .p-4, .p-6')
      allContentSections.forEach((section) => {
        if (section instanceof HTMLElement) {
          // Skip if this section is inside the hero section - we'll handle hero separately
          if (heroSection && heroSection.contains(section)) {
            return
          }
          
          const textElements = section.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6')
          textElements.forEach((textEl) => {
            if (textEl instanceof HTMLElement && textEl.textContent && textEl.textContent.length > 20) {
              const originalTextStyles = storeElementStyles(textEl)
              const { removedClasses } = optimizeElementForPDF(textEl, 'text')
              textElementsWithStyles.push({ 
                element: textEl, 
                originalStyles: originalTextStyles,
                removedClasses 
              })
            }
          })
          
          const originalSectionStyles = storeElementStyles(section)
          const { removedClasses } = optimizeElementForPDF(section, 'container')
          textElementsWithStyles.push({ 
            element: section, 
            originalStyles: originalSectionStyles,
            removedClasses 
          })
        }
      })

      // Phase 4: Wait for DOM updates
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Phase 5: Optimize main element with Tailwind constraint handling
      toast.info('Optimizing for PDF capture...', { duration: 2000 })
      originalStyles = storeElementStyles(element)
      const mainOptimization = optimizeElementForPDF(element, 'main')
      removedTailwindClasses = mainOptimization.removedClasses
      
      // Phase 5.5: CRITICAL - Optimize hero section for width
      if (heroSection && heroSection instanceof HTMLElement) {
        console.log('Optimizing hero section for PDF width...')
        heroSectionStyles = storeElementStyles(heroSection)
        const heroOptimization = optimizeElementForPDF(heroSection, 'main')
        heroSectionRemovedClasses = heroOptimization.removedClasses
      }
      
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Phase 6: Generate canvas with enhanced validation
      toast.info('Generating high-quality canvas...', { duration: 3000 })
      const canvas = await generateCanvas(element)

      // Phase 7: Create PDF
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
      
      // CRITICAL: ENHANCED restoration with Tailwind classes
      if (originalStyles) {
        restoreElementCompletely(element, originalStyles, removedTailwindClasses)
      }
      
      // CRITICAL: Restore hero section
      if (heroSection && heroSection instanceof HTMLElement && heroSectionStyles) {
        restoreElementCompletely(heroSection, heroSectionStyles, heroSectionRemovedClasses)
      }
      
      // Restore text element styles with classes
      textElementsWithStyles.forEach(({ element, originalStyles, removedClasses }) => {
        restoreElementCompletely(element, originalStyles, removedClasses || [])
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
      // Phase 8: Cleanup and restoration
      setTimeout(() => {
        restoreElementStates(modifiedElements)
        
        // Restore text elements with enhanced restoration
        textElementsWithStyles.forEach(({ element, originalStyles, removedClasses }) => {
          restoreElementCompletely(element, originalStyles, removedClasses || [])
        })
        
        // Final hero section restoration
        if (heroSection && heroSection instanceof HTMLElement && heroSectionStyles) {
          restoreElementCompletely(heroSection, heroSectionStyles, heroSectionRemovedClasses)
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
