
import React, { useCallback } from 'react'
import { toast } from 'sonner'
import { createRoot } from 'react-dom/client'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { generateCanvas } from '@/services/canvasGenerator'
import { createPDFDocument, addCanvasToPDF, addMultiPageContent } from '@/services/pdfGenerator'
import { PDFReportWrapper } from '@/components/pdf/PDFReportWrapper'

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
      
      // Create hidden container for PDF rendering
      tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.top = '-9999px'
      tempContainer.style.left = '0'
      tempContainer.style.width = '794px' // A4 width in pixels
      tempContainer.style.height = 'auto'
      tempContainer.style.backgroundColor = 'white'
      tempContainer.style.overflow = 'visible'
      tempContainer.style.zIndex = '-1000'
      tempContainer.style.visibility = 'hidden'
      
      document.body.appendChild(tempContainer)

      // Create React root and render PDF content
      root = createRoot(tempContainer)
      
      const pdfComponent = React.createElement(
        PDFReportWrapper,
        { isForPDF: true, children: componentToRender }
      )
      
      root.render(pdfComponent)
      
      // Wait for React to render and DOM to settle
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Additional wait for any async content
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Verify container has content before proceeding
      if (!tempContainer.firstChild) {
        throw new Error('PDF container is empty after rendering')
      }
      
      const containerRect = tempContainer.getBoundingClientRect()
      console.log('Container dimensions before canvas:', {
        width: containerRect.width,
        height: containerRect.height,
        scrollWidth: tempContainer.scrollWidth,
        scrollHeight: tempContainer.scrollHeight,
        hasContent: !!tempContainer.innerHTML,
        childCount: tempContainer.children.length,
        firstChildType: tempContainer.firstChild?.nodeName
      })

      toast.info('Generating high-quality canvas...', { duration: 3000 })
      
      // Try to find the actual content element
      const contentElement = tempContainer.querySelector('.pdf-only-container') || tempContainer
      console.log('Using element for canvas:', {
        element: contentElement.tagName,
        className: contentElement.className,
        hasContent: contentElement.innerHTML.length > 0
      })
      
      // Generate canvas with error handling
      const canvas = await generateCanvas(contentElement as HTMLElement, true)

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
        description: 'Content rendered using PDF-optimized layout'
      })
      
    } catch (error) {
      console.error('Surgical PDF export failed:', error)
      toast.error(`Failed to generate PDF: ${error.message}`, {
        duration: 6000,
        description: 'Please try again or contact support if the issue persists'
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
