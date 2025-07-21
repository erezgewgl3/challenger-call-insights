
import React from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

interface PDFReportWrapperProps {
  children: React.ReactNode
  isForPDF?: boolean
}

/**
 * PDF-ONLY rendering wrapper that preserves beautiful app design
 * This component creates a separate rendering path for PDF exports only
 */
export function PDFReportWrapper({ children, isForPDF = false }: PDFReportWrapperProps) {
  if (!isForPDF) {
    // Normal app rendering - NO CHANGES to existing beautiful design
    return <>{children}</>
  }

  // PDF-only rendering with fixed positioning and dimensions
  return (
    <TooltipProvider>
      <div 
        className="pdf-only-container"
        style={{
          width: '210mm',
          minHeight: '297mm',
          maxWidth: '210mm',
          margin: '0 auto',
          padding: '20mm',
          backgroundColor: 'white',
          transform: 'translateX(0)',
          position: 'relative',
          left: '0',
          right: '0',
          boxSizing: 'border-box',
          overflow: 'visible',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.4',
          color: '#333333'
        }}
      >
        <div style={{ 
          width: '100%', 
          margin: '0', 
          padding: '0',
          boxSizing: 'border-box'
        }}>
          {children}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default PDFReportWrapper
