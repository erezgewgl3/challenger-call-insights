
import React, { useCallback } from 'react'
import { toast } from 'sonner'
import { createRoot } from 'react-dom/client'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { generateCanvas } from '@/services/canvasGenerator'
import { createPDFDocument, addCanvasToPDF, addMultiPageContent } from '@/services/pdfGenerator'
import { PDFReportWrapper } from '@/components/pdf/PDFReportWrapper'
import { TooltipProvider } from '@/components/ui/tooltip'

interface UsePDFExportSurgicalProps {
  filename?: string
}

export function usePDFExportSurgical(props: UsePDFExportSurgicalProps = {}) {
  const filename = props.filename || 'sales-analysis'
  
  const exportToPDF = useCallback(async (
    componentToRender: React.ReactElement, 
    title: string
  ) => {
    let tempContainer: HTMLDivElement | null = null
    let root: any = null
    
    try {
      toast.info('Preparing PDF export...', { duration: 3000 })
      
      // Wait for fonts to be ready
      if (document.fonts) {
        await document.fonts.ready
      }
      
      // Create optimized container for PDF rendering
      tempContainer = document.createElement('div')
      tempContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: 0;
        width: 794px;
        height: auto;
        background-color: white;
        overflow: visible;
        z-index: -1000;
        visibility: hidden;
        transform: none;
        filter: none;
        opacity: 1;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        color: #333333;
      `
      
      document.body.appendChild(tempContainer)

      // Create React root and render PDF content with proper providers
      root = createRoot(tempContainer)
      
      const pdfComponent = React.createElement(
        TooltipProvider,
        null,
        React.createElement(PDFReportWrapper, { isForPDF: true, children: componentToRender })
      )
      
      root.render(pdfComponent)
      
      // Wait for React to render and settle
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Additional wait for any async content
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Log what's actually in the container
      console.log('PDF Container content check:', {
        innerHTML: tempContainer.innerHTML.substring(0, 500),
        textContent: tempContainer.textContent?.substring(0, 200),
        hasReactContent: tempContainer.querySelector('[data-reactroot]') !== null,
        allElements: tempContainer.querySelectorAll('*').length
      })
      
      // Verify container has content before proceeding
      if (!tempContainer.firstChild || tempContainer.children.length === 0) {
        throw new Error('PDF container is empty after rendering')
      }
      
      console.log('PDF Container ready:', {
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        childCount: tempContainer.children.length,
        hasContent: tempContainer.innerHTML.length > 0
      })

      toast.info('Generating PDF canvas...', { duration: 3000 })
      
      // Generate canvas with error handling
      const canvas = await generateCanvas(tempContainer, true)

      // Create PDF document
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
        description: 'Document generated with optimized layout'
      })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error(`Failed to generate PDF: ${error.message}`, {
        duration: 6000,
        description: 'Please try again or contact support if the issue persists.'
      })
    } finally {
      // Cleanup with proper error handling
      setTimeout(() => {
        try {
          if (root) {
            root.unmount()
          }
        } catch (unmountError) {
          console.warn('Error unmounting PDF root:', unmountError)
        }
        
        try {
          if (tempContainer && document.body.contains(tempContainer)) {
            document.body.removeChild(tempContainer)
          }
        } catch (removeError) {
          console.warn('Error removing PDF container:', removeError)
        }
      }, 100)
    }
  }, [filename])
  
  return { exportToPDF }
}
