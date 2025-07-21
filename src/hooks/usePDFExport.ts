
import { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { 
  storeElementStyles, 
  restoreElementStyles,
  storeElementClasses,
  restoreElementClasses
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

/**
 * Removes conflicting Tailwind classes that interfere with PDF export
 */
function removePDFConflictingClasses(element: HTMLElement): string[] {
  const conflictingPatterns = [
    'max-w-',     // Remove max-width constraints
    'mx-auto',    // Remove auto margins (we'll apply them via inline styles)
    'container'   // Remove container classes
  ]
  
  const currentClasses = element.className.split(' ')
  const removedClasses: string[] = []
  
  const filteredClasses = currentClasses.filter(className => {
    const shouldRemove = conflictingPatterns.some(pattern => className.includes(pattern))
    if (shouldRemove) {
      removedClasses.push(className)
      return false
    }
    return true
  })
  
  element.className = filteredClasses.join(' ')
  
  console.log('Removed conflicting Tailwind classes for PDF:', {
    original: currentClasses.length,
    filtered: filteredClasses.length,
    removed: removedClasses
  })
  
  return removedClasses
}

/**
 * Restores previously removed Tailwind classes
 */
function restorePDFConflictingClasses(element: HTMLElement, removedClasses: string[]): void {
  const currentClasses = element.className.split(' ').filter(c => c.trim())
  const restoredClasses = [...currentClasses, ...removedClasses].join(' ')
  element.className = restoredClasses
  
  console.log('Restored Tailwind classes after PDF:', {
    currentCount: currentClasses.length,
    restoredCount: removedClasses.length
  })
}

export function usePDFExport({ filename = 'sales-analysis' }: UsePDFExportProps = {}) {
  const exportToPDF = useCallback(async (elementId: string, title: string, options?: PDFExportOptions) => {
    let sectionsToRestore: string[] = []
    let modifiedElements: ElementState[] = []
    let originalStyles: any = null
    let originalClasses: string = ''
    let removedClasses: string[] = []
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

      // Phase 4: Store original state and remove conflicting classes
      toast.info('Optimizing for PDF capture...', { duration: 2000 })
      originalStyles = storeElementStyles(element)
      originalClasses = storeElementClasses(element)
      
      // Remove conflicting Tailwind classes first
      removedClasses = removePDFConflictingClasses(element)
      
      // Apply simple, clean PDF optimization with proper centering
      element.style.position = 'static'
      element.style.width = '1400px'
      element.style.maxWidth = '1400px'
      element.style.minWidth = '1400px'
      element.style.transform = 'none'
      element.style.overflow = 'visible'
      element.style.backgroundColor = 'transparent'
      element.style.left = 'auto'
      element.style.right = 'auto'
      // Use auto margins for proper centering (this works when Tailwind classes are removed)
      element.style.marginLeft = 'auto'
      element.style.marginRight = 'auto'
      element.style.paddingLeft = '16px'
      element.style.paddingRight = '16px'
      element.style.boxSizing = 'border-box'
      
      console.log('Applied simple PDF optimization with centering:', {
        width: '1400px',
        removedClasses: removedClasses.length,
        elementWidth: element.offsetWidth,
        marginStrategy: 'auto-centered'
      })
      
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
        if (element) {
          // Restore original styles first
          if (originalStyles) {
            restoreElementStyles(element, originalStyles)
          }
          
          // Restore original classes completely (this will include the removed conflicting classes)
          if (originalClasses) {
            restoreElementClasses(element, originalClasses)
          }
        }
        
        // Restore modified elements
        restoreElementStates(modifiedElements)
        
        // Restore user-controlled sections
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
