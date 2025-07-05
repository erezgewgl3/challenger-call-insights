
import { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename, calculatePDFDimensions } from '@/utils/pdfUtils'
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
    let sectionModifiedElements: ElementState[] = []
    let contentModifiedElements: ElementState[] = []
    
    try {
      toast.info('Generating professional PDF...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('Unable to find content to export')
        return
      }

      // Open closed sections for PDF using existing options
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

      // Expand any remaining collapsed sections using utility
      sectionModifiedElements = expandCollapsedSections(element)

      // Expand scrollable content areas using utility
      expandScrollableContent(element, contentModifiedElements)

      await document.fonts.ready

      // DIRECT DOM MODIFICATION APPROACH
      console.log('🔧 Starting direct DOM modification for PDF optimization...')
      
      // Find and modify elements directly in the actual DOM
      const allElements = element.querySelectorAll('*')
      Array.from(allElements).forEach((el) => {
        if (el instanceof HTMLElement) {
          const computedStyle = getComputedStyle(el)
          
          // Check if this is an email content container
          const isEmailContainer = 
            el.classList.contains('max-h-32') ||
            (computedStyle.fontFamily.includes('mono') && el.textContent && el.textContent.length > 50) ||
            computedStyle.maxHeight === '128px' ||
            computedStyle.maxHeight === '8rem'

          // Check if this is a Deal Acceleration Insights text container
          const isDealInsightsText = 
            el.tagName === 'P' &&
            el.classList.contains('text-gray-800') &&
            el.classList.contains('leading-relaxed') &&
            el.parentElement?.classList.contains('flex') &&
            el.parentElement?.classList.contains('items-start') &&
            el.parentElement?.classList.contains('gap-3')

          // Check if this is a Competitive Positioning Arsenal text container
          const isCompetitivePositioningText = 
            el.tagName === 'SPAN' &&
            el.classList.contains('text-gray-800') &&
            (el.classList.contains('text-sm') / el.classList.contains('lg:text-base')) &&
            el.parentElement?.classList.contains('flex') &&
            el.parentElement?.classList.contains('items-center') &&
            el.parentElement?.classList.contains('gap-3')

          if (isEmailContainer) {
            console.log(`📧 Directly modifying email container: ${el.className}`)
            
            // Store original state for restoration using utility
            const originalClasses = el.className
            const originalStyles = storeElementStyles(el)
            
            contentModifiedElements.push({
              element: el,
              originalClasses,
              originalStyles
            })
            
            // Remove problematic classes directly from the actual DOM
            el.classList.remove('max-h-32')
            el.classList.remove('overflow-y-auto')
            el.classList.remove('overflow-hidden')
            
            // Apply PDF optimization using utility
            optimizeElementForPDF(el, 'email')
          }

          if (isDealInsightsText || isCompetitivePositioningText) {
            const sectionType = isDealInsightsText ? 'Deal Insights' : 'Competitive Positioning'
            console.log(`📝 Optimizing ${sectionType} text for PDF: ${el.textContent?.substring(0, 50)}...`)
            
            // Store original state for restoration using utility
            const originalClasses = el.className
            const originalStyles = storeElementStyles(el)
            
            contentModifiedElements.push({
              element: el,
              originalClasses,
              originalStyles
            })
            
            // Apply PDF-optimized text styles using utility
            optimizeElementForPDF(el, 'text')
            
            // Also optimize the parent container if it's the flex container
            const parentContainer = el.parentElement
            if (parentContainer && parentContainer.classList.contains('flex')) {
              const parentOriginalStyles = storeElementStyles(parentContainer)
              
              contentModifiedElements.push({
                element: parentContainer,
                originalClasses: parentContainer.className,
                originalStyles: parentOriginalStyles
              })
              
              optimizeElementForPDF(parentContainer, 'container')
            }
          }
        }
      })

      console.log(`✅ Modified ${contentModifiedElements.length} elements for PDF optimization`)

      // Wait for DOM changes to take effect
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store original styles for main element restoration using utility
      const originalStyles = storeElementStyles(element)

      // Optimize main element for PDF capture using utility
      optimizeElementForPDF(element, 'main')

      await new Promise(resolve => setTimeout(resolve, 500))

      // Generate canvas using utility
      const canvas = await generateCanvas(element)

      // Restore original styles immediately using utility
      restoreElementStyles(element, originalStyles)

      // Restore modified elements using utilities
      restoreElementStates(contentModifiedElements)
      restoreElementStates(sectionModifiedElements)

      console.log('✅ Restored all modified elements')

      // Create PDF using new service
      const pdf = createPDFDocument()
      
      // Calculate dimensions to determine single or multi-page layout
      const { scaledHeight, pdfHeight } = calculatePDFDimensions(canvas)
      const contentStartY = 45
      const availableHeight = pdfHeight - contentStartY - 10
      
      if (scaledHeight <= availableHeight) {
        // Single page
        addCanvasToPDF(pdf, canvas, title)
      } else {
        // Multi-page layout
        addMultiPageContent(pdf, canvas, title)
      }
      
      // Generate filename and save using utility
      const pdfFilename = generateCleanFilename(title)
      pdf.save(pdfFilename)
      
      toast.success('Professional PDF exported successfully!', { duration: 4000 })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      // Restore section states using original options logic
      if (options?.toggleSection && sectionsToRestore.length > 0) {
        setTimeout(() => {
          sectionsToRestore.forEach(sectionKey => {
            options.toggleSection!(sectionKey)
          })
        }, 500)
      }
      
      // Ensure all element states are restored using utilities
      restoreElementStates(contentModifiedElements)
      restoreElementStates(sectionModifiedElements)
    }
  }, [filename])
  
  return { exportToPDF }
}
