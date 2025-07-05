
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
    
    try {
      toast.info('🎯 Preparing Battle Plan PDF export...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('❌ Unable to find content to export')
        return
      }

      console.log('🎯 ENHANCED Battle Plan PDF Export - Phase 3 Process')
      console.log('📊 Initial element state:', {
        elementId,
        scrollHeight: element.scrollHeight,
        offsetHeight: element.offsetHeight,
        clientHeight: element.clientHeight,
        battlePlanContainers: element.querySelectorAll('.border-l-4.border-red-500').length
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

      // Phase 2: ENHANCED Battle Plan content expansion
      console.log('⚔️ Phase 2: ENHANCED Battle Plan expansion with timing fix')
      const sectionModifiedElements = expandCollapsedSections(element)
      modifiedElements.push(...sectionModifiedElements)
      
      console.log('📜 Phase 3: Final scrollable content check')
      expandScrollableContent(element, modifiedElements)
      
      // CRITICAL TIMING FIX: Extended wait for DOM updates
      await document.fonts.ready
      console.log('⏳ CRITICAL: Extended DOM update wait for expansion to take effect...')
      await new Promise(resolve => setTimeout(resolve, 5000)) // Increased from 3s to 5s

      // Phase 4: ENHANCED validation with element bounds checking
      console.log('🔍 Phase 4: ENHANCED expansion validation with bounds checking')
      const battlePlanContainers = element.querySelectorAll('.border-l-4.border-red-500')
      
      let totalContentCaptured = 0
      let expandedElementsValidation = []
      
      battlePlanContainers.forEach((container, index) => {
        if (container instanceof HTMLElement) {
          const containerRect = container.getBoundingClientRect()
          console.log(`📊 Battle Plan ${index + 1} validation with bounds:`, {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            offsetHeight: container.offsetHeight,
            boundingRect: {
              top: containerRect.top,
              height: containerRect.height,
              width: containerRect.width
            },
            isFullyExpanded: container.scrollHeight <= Math.max(container.clientHeight, container.offsetHeight) + 10,
            isVisible: containerRect.height > 0 && containerRect.width > 0
          })
          
          totalContentCaptured += container.scrollHeight
          
          // ENHANCED: Validate specific critical sections
          const strategicSections = container.querySelectorAll('.bg-gradient-to-r.from-indigo-50.via-blue-50.to-purple-50, .bg-gradient-to-r.from-blue-50.to-indigo-50')
          const whyActionsSections = container.querySelectorAll('.bg-emerald-50')
          const emailBodies = container.querySelectorAll('.font-mono.whitespace-pre-wrap')
          
          strategicSections.forEach((section, sIndex) => {
            if (section instanceof HTMLElement) {
              const sectionRect = section.getBoundingClientRect()
              const isExpanded = section.scrollHeight <= Math.max(section.clientHeight, section.offsetHeight) + 5
              expandedElementsValidation.push({
                type: 'Strategic Section',
                index: sIndex + 1,
                expanded: isExpanded,
                visible: sectionRect.height > 0,
                scrollHeight: section.scrollHeight,
                clientHeight: section.clientHeight
              })
            }
          })
          
          emailBodies.forEach((email, eIndex) => {
            if (email instanceof HTMLElement) {
              const emailRect = email.getBoundingClientRect()
              const isExpanded = email.scrollHeight <= Math.max(email.clientHeight, email.offsetHeight) + 5
              expandedElementsValidation.push({
                type: 'Email Body',
                index: eIndex + 1,
                expanded: isExpanded,
                visible: emailRect.height > 0,
                scrollHeight: email.scrollHeight,
                clientHeight: email.clientHeight,
                textLength: email.textContent?.length || 0
              })
            }
          })
        }
      })

      console.log('📊 Element expansion validation results:', expandedElementsValidation)

      // Phase 5: Optimize for PDF rendering with timing
      toast.info('🎨 Optimizing for PDF capture...', { duration: 2000 })
      originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Phase 6: Generate canvas with enhanced timing and validation
      toast.info('📸 Generating high-quality canvas with enhanced timing...', { duration: 3000 })
      console.log('📸 Pre-canvas generation - Final element state:', {
        totalScrollHeight: element.scrollHeight,
        totalClientHeight: element.clientHeight,
        totalOffsetHeight: element.offsetHeight,
        modifiedElementsCount: modifiedElements.length
      })
      
      const canvas = await generateCanvas(element)
      
      console.log('📸 Canvas generated successfully:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        canvasHeightMM: canvas.height * 0.264583
      })

      // Phase 7: Create PDF with FIXED multi-page logic
      const pdf = createPDFDocument()
      const contentHeightMM = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeightFirstPage = 297 - 45 - 10

      console.log('📄 PDF creation with FIXED multi-page logic:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        contentHeightMM,
        availableHeightFirstPage,
        willUseMultiPage: contentHeightMM > availableHeightFirstPage,
        totalModifiedElements: modifiedElements.length
      })

      toast.info('📋 Creating comprehensive PDF with fixed page logic...', { duration: 2000 })

      if (contentHeightMM <= availableHeightFirstPage) {
        addCanvasToPDF(pdf, canvas, title)
      } else {
        addMultiPageContent(pdf, canvas, title)
      }
      
      const pdfFilename = generateCleanFilename(title)
      
      // CRITICAL FIX: Restore styles BEFORE saving PDF (but after canvas generation)
      if (originalStyles) {
        restoreElementStyles(element, originalStyles)
      }
      
      pdf.save(pdfFilename)
      
      toast.success('✅ Battle Plan PDF exported successfully!', { 
        duration: 4000,
        description: `Complete content captured: ${modifiedElements.length} sections expanded, ${totalContentCaptured}px content height`
      })
      
    } catch (error) {
      console.error('❌ PDF export failed:', error)
      toast.error('❌ Failed to generate PDF. Please try again.', {
        description: 'Check console for detailed error information'
      })
    } finally {
      // Phase 8: DELAYED Comprehensive cleanup and restoration
      console.log('🔄 DELAYED Comprehensive cleanup and restoration')
      
      // CRITICAL: Delay the element restoration to ensure PDF generation is complete
      setTimeout(() => {
        restoreElementStates(modifiedElements)
        
        if (options?.toggleSection && sectionsToRestore.length > 0) {
          sectionsToRestore.forEach(sectionKey => {
            options.toggleSection!(sectionKey)
            console.log(`🔄 Restored user section: ${sectionKey}`)
          })
        }
        
        console.log('✅ Battle Plan PDF export process complete with delayed cleanup')
      }, 1000) // 1 second delay to ensure PDF save is complete
    }
  }, [filename])
  
  return { exportToPDF }
}
