
import { useCallback } from 'react'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { generateCleanFilename, calculatePDFDimensions, createPDFHeader } from '@/utils/pdfUtils'
import { storeElementStyles, restoreElementStyles, optimizeElementForPDF } from '@/utils/elementStyleUtils'
import { expandCollapsedSections, expandScrollableContent, restoreElementStates, ElementState } from '@/utils/sectionExpansion'
import { generateCanvas, createMultiPageCanvas } from '@/services/canvasGenerator'

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
            (el.classList.contains('text-sm') || el.classList.contains('lg:text-base')) &&
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

      // Convert to PDF using extracted utilities
      const imgData = canvas.toDataURL('image/png', 1.0)
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false
      })

      // Calculate dimensions using utility
      const { scale, scaledHeight, contentWidth, pdfWidth, pdfHeight } = calculatePDFDimensions(canvas)
      
      // Create header using utility
      createPDFHeader(pdf, title)
      
      // Content positioning
      const contentStartY = 45
      const availableHeight = pdfHeight - contentStartY - 10
      
      if (scaledHeight <= availableHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', 10, contentStartY, contentWidth, scaledHeight, '', 'FAST')
      } else {
        // Multi-page layout
        const pageContentHeight = availableHeight
        const totalPages = Math.ceil(scaledHeight / pageContentHeight)
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
            pdf.setFontSize(14)
            pdf.setTextColor(100, 116, 139)
            const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            pdf.text(`${cleanTitle} - Page ${page + 1} of ${totalPages}`, 10, 15)
            pdf.setDrawColor(203, 213, 225)
            pdf.line(10, 20, pdfWidth - 10, 20)
          }
          
          const currentPageStartY = page === 0 ? contentStartY : 25
          const currentAvailableHeight = page === 0 ? availableHeight : (pdfHeight - 25 - 10)
          
          try {
            // Use utility for multi-page canvas creation
            const pageCanvas = createMultiPageCanvas(canvas, currentAvailableHeight, page)
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
            
            const pageScaledHeight = (pageCanvas.height * 0.264583) * scale
            pdf.addImage(pageImgData, 'PNG', 10, currentPageStartY, contentWidth, pageScaledHeight, '', 'FAST')
          } catch (error) {
            console.warn(`Failed to create page ${page + 1}, skipping:`, error)
          }
        }
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
