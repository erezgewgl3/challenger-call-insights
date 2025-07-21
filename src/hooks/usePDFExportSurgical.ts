
import React, { useCallback } from 'react'
import { toast } from 'sonner'
import { generateCleanFilename } from '@/utils/pdfUtils'
import { generateCanvas } from '@/services/canvasGenerator'
import { createPDFDocument, addCanvasToPDF, addMultiPageContent } from '@/services/pdfGenerator'

interface UsePDFExportSurgicalProps {
  filename?: string
}

export function usePDFExportSurgical(props: UsePDFExportSurgicalProps = {}) {
  const filename = props.filename || 'sales-analysis'
  
  const exportToPDF = useCallback(async (
    elementSelector: string, 
    title: string
  ) => {
    let tempContainer: HTMLDivElement | null = null
    
    try {
      toast.info('Preparing PDF export...', { duration: 3000 })
      
      // Wait for fonts to be ready
      if (document.fonts) {
        await document.fonts.ready
      }
      
      // Find the actual rendered content on the page
      const sourceElement = document.querySelector(elementSelector) as HTMLElement
      if (!sourceElement) {
        throw new Error(`Could not find element with selector: ${elementSelector}`)
      }
      
      console.log('Found source element:', {
        selector: elementSelector,
        tagName: sourceElement.tagName,
        className: sourceElement.className,
        hasContent: sourceElement.innerHTML.length > 0,
        childCount: sourceElement.children.length,
        textContent: sourceElement.textContent?.substring(0, 200)
      })
      
      // Clone the source element for PDF processing
      const clonedElement = sourceElement.cloneNode(true) as HTMLElement
      
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
      
      // Clean up the cloned element for PDF
      cleanElementForPDF(clonedElement)
      
      // Apply PDF-specific styling to the cloned element
      applyPDFStyling(clonedElement)
      
      // Append the cleaned and styled clone to the temporary container
      tempContainer.appendChild(clonedElement)
      
      // Wait for any layout calculations to complete
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('PDF Container after processing:', {
        innerHTML: tempContainer.innerHTML.substring(0, 500),
        textContent: tempContainer.textContent?.substring(0, 200),
        childCount: tempContainer.children.length,
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight
      })
      
      // Verify container has content before proceeding
      if (!tempContainer.firstChild || tempContainer.children.length === 0) {
        throw new Error('PDF container is empty after processing')
      }

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
        description: 'Document generated from actual page content'
      })
      
    } catch (error) {
      console.error('PDF export failed:', error)
      toast.error(`Failed to generate PDF: ${error.message}`, {
        duration: 6000,
        description: 'Please try again or contact support if the issue persists.'
      })
    } finally {
      // Cleanup
      setTimeout(() => {
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

/**
 * Removes interactive elements and problematic content from the cloned element
 */
function cleanElementForPDF(element: HTMLElement) {
  // Remove interactive elements that don't belong in PDF
  const interactiveSelectors = [
    'button[aria-label*="Export"]',
    'button[aria-label*="Download"]', 
    'button[aria-label*="Copy"]',
    '[role="tooltip"]',
    '[data-radix-tooltip-content]',
    '[data-radix-popover-content]',
    '[data-radix-dialog-content]',
    '.hover\\:',
    '[class*="hover:"]'
  ]
  
  interactiveSelectors.forEach(selector => {
    try {
      const elements = element.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    } catch (e) {
      // Ignore selector errors, some might be invalid
    }
  })
  
  // Remove or replace specific interactive buttons
  const buttons = element.querySelectorAll('button')
  buttons.forEach(button => {
    const buttonText = button.textContent?.toLowerCase() || ''
    if (buttonText.includes('export') || 
        buttonText.includes('download') || 
        buttonText.includes('copy') ||
        buttonText.includes('back to dashboard')) {
      button.remove()
    }
  })
  
  // Remove hover states and interactive classes
  const allElements = element.querySelectorAll('*')
  allElements.forEach(el => {
    if (el instanceof HTMLElement) {
      // Remove hover classes
      const classList = Array.from(el.classList)
      classList.forEach(className => {
        if (className.includes('hover:') || className.includes('focus:')) {
          el.classList.remove(className)
        }
      })
    }
  })
}

/**
 * Applies PDF-specific styling to ensure proper layout
 */
function applyPDFStyling(element: HTMLElement) {
  // Apply PDF-optimized styles to the root element
  element.style.cssText = `
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 20px !important;
    background: white !important;
    color: #333 !important;
    font-family: Arial, sans-serif !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    box-sizing: border-box !important;
  `
  
  // Apply styles to all child elements for better PDF rendering
  const allElements = element.querySelectorAll('*')
  allElements.forEach(el => {
    if (el instanceof HTMLElement) {
      // Fix width constraints
      if (el.style.maxWidth && el.style.maxWidth !== 'none') {
        el.style.maxWidth = 'none'
      }
      
      // Ensure text is visible
      if (el.style.color === 'transparent' || el.style.opacity === '0') {
        el.style.color = '#333'
        el.style.opacity = '1'
      }
      
      // Fix flex layouts for PDF
      if (el.style.display === 'flex') {
        el.style.display = 'block'
      }
    }
  })
}
