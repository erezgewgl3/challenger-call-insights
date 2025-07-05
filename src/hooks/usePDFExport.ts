
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
      toast.info('🎯 Preparing Battle Plan PDF export...', { duration: 3000 })
      
      const element = document.getElementById(elementId)
      if (!element) {
        toast.error('❌ Unable to find content to export')
        return
      }

      console.log('🎯 Battle Plan PDF Export - Starting comprehensive expansion')
      console.log('📊 Initial element state:', {
        elementId,
        scrollHeight: element.scrollHeight,
        offsetHeight: element.offsetHeight,
        clientHeight: element.clientHeight,
        battlePlanContainers: element.querySelectorAll('.border-l-4.border-red-500').length,
        strategicSections: element.querySelectorAll('.bg-gradient-to-r.from-indigo-50').length,
        whyActionsSections: element.querySelectorAll('.bg-emerald-50').length,
        emailSections: element.querySelectorAll('.bg-gradient-to-r.from-blue-50.to-indigo-50').length
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

      // Phase 2: Comprehensive Battle Plan content expansion
      console.log('⚔️ Phase 2: Comprehensive Battle Plan expansion')
      const sectionModifiedElements = expandCollapsedSections(element)
      modifiedElements.push(...sectionModifiedElements)
      
      console.log('📜 Phase 3: Final scrollable content check')
      expandScrollableContent(element, modifiedElements)
      
      // Extended wait for DOM stabilization
      await document.fonts.ready
      console.log('⏳ Extended DOM stabilization wait...')
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Phase 4: Validate expansion success
      console.log('🔍 Phase 4: Expansion validation')
      const battlePlanContainers = element.querySelectorAll('.border-l-4.border-red-500')
      battlePlanContainers.forEach((container, index) => {
        if (container instanceof HTMLElement) {
          console.log(`📊 Battle Plan ${index + 1} validation:`, {
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight,
            isFullyExpanded: container.scrollHeight <= container.clientHeight + 10,
            strategicSections: container.querySelectorAll('.bg-gradient-to-r.from-indigo-50').length,
            whyActionsSections: container.querySelectorAll('.bg-emerald-50').length,
            emailBodies: container.querySelectorAll('.font-mono.whitespace-pre-wrap').length
          })
          
          // Validate specific sections
          const strategicSections = container.querySelectorAll('.bg-gradient-to-r.from-indigo-50')
          strategicSections.forEach((section, sIndex) => {
            if (section instanceof HTMLElement) {
              console.log(`📊 Strategic Assessment ${sIndex + 1}:`, {
                expanded: section.scrollHeight <= section.clientHeight + 5,
                hasMaxHeightNone: section.classList.contains('max-h-none'),
                overflowVisible: section.classList.contains('overflow-visible')
              })
            }
          })
          
          const whyActionsSections = container.querySelectorAll('.bg-emerald-50')
          whyActionsSections.forEach((section, wIndex) => {
            if (section instanceof HTMLElement) {
              console.log(`💡 Why Actions ${wIndex + 1}:`, {
                expanded: section.scrollHeight <= section.clientHeight + 5,
                hasMaxHeightNone: section.classList.contains('max-h-none'),
                overflowVisible: section.classList.contains('overflow-visible')
              })
            }
          })
          
          const emailBodies = container.querySelectorAll('.font-mono.whitespace-pre-wrap')
          emailBodies.forEach((email, eIndex) => {
            if (email instanceof HTMLElement) {
              console.log(`📧 Email Body ${eIndex + 1}:`, {
                expanded: email.scrollHeight <= email.clientHeight + 5,
                hasMaxHeightNone: email.classList.contains('max-h-none'),
                overflowVisible: email.classList.contains('overflow-visible'),
                textLength: email.textContent?.length || 0
              })
            }
          })
        }
      })

      // Phase 5: Optimize for PDF rendering
      toast.info('🎨 Optimizing for PDF capture...', { duration: 2000 })
      const originalStyles = storeElementStyles(element)
      optimizeElementForPDF(element, 'main')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Phase 6: Generate canvas
      toast.info('📸 Generating high-quality canvas...', { duration: 3000 })
      const canvas = await generateCanvas(element)
      restoreElementStyles(element, originalStyles)

      // Phase 7: Create PDF
      const pdf = createPDFDocument()
      const contentHeightMM = canvas.height * 0.264583 * (190 / (canvas.width * 0.264583))
      const availableHeightFirstPage = 297 - 45 - 10

      console.log('📄 PDF creation:', {
        canvasHeight: canvas.height,
        contentHeightMM,
        availableHeightFirstPage,
        willUseMultiPage: contentHeightMM > availableHeightFirstPage,
        totalModifiedElements: modifiedElements.length
      })

      toast.info('📋 Creating comprehensive PDF...', { duration: 2000 })

      if (contentHeightMM <= availableHeightFirstPage) {
        addCanvasToPDF(pdf, canvas, title)
      } else {
        addMultiPageContent(pdf, canvas, title)
      }
      
      const pdfFilename = generateCleanFilename(title)
      pdf.save(pdfFilename)
      
      toast.success('✅ Battle Plan PDF exported successfully!', { 
        duration: 4000,
        description: `Complete content captured: ${modifiedElements.length} sections expanded`
      })
      
    } catch (error) {
      console.error('❌ PDF export failed:', error)
      toast.error('❌ Failed to generate PDF. Please try again.', {
        description: 'Check console for detailed error information'
      })
    } finally {
      // Phase 8: Comprehensive cleanup
      console.log('🔄 Comprehensive cleanup and restoration')
      restoreElementStates(modifiedElements)
      
      if (options?.toggleSection && sectionsToRestore.length > 0) {
        setTimeout(() => {
          sectionsToRestore.forEach(sectionKey => {
            options.toggleSection!(sectionKey)
            console.log(`🔄 Restored user section: ${sectionKey}`)
          })
        }, 500)
      }
      
      console.log('✅ Battle Plan PDF export process complete')
    }
  }, [filename])
  
  return { exportToPDF }
}
