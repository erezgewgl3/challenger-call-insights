
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
    let originalStyles: any = null
    let textElementsWithStyles: Array<{ element: HTMLElement, originalStyles: Record<string, string> }> = []
    
    try {
      toast.info('🎯 Preparing Complete PDF Export...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('❌ Unable to find content to export')
        return
      }

      console.log('🎯 FIXED: Complete PDF Export - Enhanced Content Capture')
      console.log('📊 Initial element state:', {
        elementId,
        scrollHeight: element.scrollHeight,
        offsetHeight: element.offsetHeight,
        clientHeight: element.clientHeight,
        completeContentSections: element.querySelectorAll('.border-l-4').length
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
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      // Phase 2: ENHANCED content expansion for complete capture
      console.log('⚔️ Phase 2: ENHANCED Complete Content Expansion')
      const sectionModifiedElements = expandCollapsedSections(element)
      modifiedElements.push(...sectionModifiedElements)
      
      console.log('📜 Phase 3: Final scrollable content expansion')
      expandScrollableContent(element, modifiedElements)
      
      // Phase 4: ENHANCED text optimization for complete sections
      console.log('📝 Phase 4: ENHANCED text optimization for complete content capture')
      
      // Target ALL sections that might contain text content
      const allContentSections = element.querySelectorAll('.space-y-4, .border-l-4, .p-4, .p-6')
      allContentSections.forEach((section, index) => {
        if (section instanceof HTMLElement) {
          // Look for text elements within these sections
          const textElements = section.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6')
          textElements.forEach((textEl, tIndex) => {
            if (textEl instanceof HTMLElement && textEl.textContent && textEl.textContent.length > 20) {
              console.log(`📝 Optimizing text element ${tIndex + 1} in section ${index + 1}`)
              const originalTextStyles = storeElementStyles(textEl)
              optimizeElementForPDF(textEl, 'text')
              textElementsWithStyles.push({ element: textEl, originalStyles: originalTextStyles })
            }
          })
          
          // Also optimize parent containers
          const originalSectionStyles = storeElementStyles(section)
          optimizeElementForPDF(section, 'container')
          textElementsWithStyles.push({ element: section, originalStyles: originalSectionStyles })
        }
      })
      
      console.log(`📝 Optimized ${textElementsWithStyles.length} elements for complete PDF capture`)

      // ENHANCED TIMING: Extended wait for complete DOM updates
      await document.fonts.ready
      console.log('⏳ ENHANCED: Extended DOM update wait for complete expansion...')
      await new Promise(resolve => setTimeout(resolve, 6000)) // Increased from 5000

      // Phase 5: ENHANCED validation for complete content capture
      console.log('🔍 Phase 5: ENHANCED validation for complete content capture')
      const allContentContainers = element.querySelectorAll('.border-l-4, .space-y-4, .p-4')
      
      let totalContentCaptured = 0
      
      allContentContainers.forEach((container, index) => {
        if (container instanceof HTMLElement) {
          const containerRect = container.getBoundingClientRect()
          console.log(`📊 Content Container ${index + 1} validation:`, {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            offsetHeight: container.offsetHeight,
            boundingRect: {
              height: containerRect.height,
              width: containerRect.width
            },
            isFullyExpanded: container.scrollHeight <= Math.max(container.clientHeight, container.offsetHeight) + 10
          })
          
          totalContentCaptured += container.scrollHeight
        }
      })

      // Phase 6: Optimize main element for PDF rendering
      toast.info('🎨 Optimizing for complete PDF capture...', { duration: 2000 })
      originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Phase 7: Generate canvas with complete content
      toast.info('📸 Generating complete high-quality canvas...', { duration: 3000 })
      console.log('📸 Pre-canvas generation - Complete element state:', {
        totalScrollHeight: element.scrollHeight,
        totalClientHeight: element.clientHeight,
        totalOffsetHeight: element.offsetHeight,
        modifiedElementsCount: modifiedElements.length,
        textOptimizedElements: textElementsWithStyles.length,
        totalContentCaptured
      })
      
      const canvas = await generateCanvas(element)
      
      console.log('📸 Canvas generated successfully for complete content:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasHeightMM: canvas.height * 0.264583,
        completeContentCaptured: true
      })

      // Phase 8: Create PDF with enhanced multi-page handling
      const pdf = createPDFDocument()
      const contentHeightMM = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeightFirstPage = 297 - 45 - 10

      console.log('📄 PDF creation for complete content:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        contentHeightMM,
        availableHeightFirstPage,
        willUseEnhancedMultiPage: contentHeightMM > availableHeightFirstPage,
        completeContentCapture: true
      })

      toast.info('📋 Creating comprehensive PDF with complete content...', { duration: 2000 })

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
      
      pdf.save(pdfFilename)
      
      toast.success('✅ Complete PDF exported successfully!', { 
        duration: 4000,
        description: `Complete content captured: ${modifiedElements.length} sections expanded, ${textElementsWithStyles.length} elements optimized`
      })
      
    } catch (error) {
      console.error('❌ PDF export failed:', error)
      toast.error('❌ Failed to generate PDF. Please try again.', {
        description: 'Check console for detailed error information'
      })
    } finally {
      // Phase 9: DELAYED Comprehensive cleanup and restoration
      console.log('🔄 DELAYED Comprehensive cleanup and restoration')
      
      setTimeout(() => {
        restoreElementStates(modifiedElements)
        
        // Restore text elements
        textElementsWithStyles.forEach(({ element, originalStyles }) => {
          restoreElementStyles(element, originalStyles)
        })
        
        if (options?.toggleSection && sectionsToRestore.length > 0) {
          sectionsToRestore.forEach(sectionKey => {
            options.toggleSection!(sectionKey)
            console.log(`🔄 Restored user section: ${sectionKey}`)
          })
        }
        
        console.log('✅ Complete PDF export process finished with enhanced cleanup')
      }, 1000)
    }
  }, [filename])
  
  return { exportToPDF }
}
