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
      
      if (document.fonts) {
        await document.fonts.ready
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.top = '-9999px'
      tempContainer.style.left = '0'
      tempContainer.style.width = '210mm'
      tempContainer.style.height = 'auto'
      tempContainer.style.backgroundColor = 'white'
      tempContainer.style.overflow = 'visible'
      tempContainer.style.zIndex = '-1000'
      
      document.body.appendChild(tempContainer)

      root = createRoot(tempContainer)
      
      const pdfComponent = React.createElement(
        PDFReportWrapper,
        { isForPDF: true, children: componentToRender }
      )
      
      root.render(pdfComponent)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast.info('Generating high-quality canvas...', { duration: 3000 })
      const canvas = await generateCanvas(tempContainer, true)

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
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setTimeout(() => {
        if (root) {
          root.unmount()
        }
        if (tempContainer && document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer)
        }
      }, 100)
    }
  }, [filename])
  
  return { exportToPDF }
}