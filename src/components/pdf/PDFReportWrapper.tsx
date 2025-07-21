
import React from 'react'

interface PDFReportWrapperProps {
  children: React.ReactNode
  isForPDF?: boolean
}

/**
 * Enhanced PDF rendering wrapper that creates a clean, print-optimized layout
 */
export function PDFReportWrapper({ children, isForPDF = false }: PDFReportWrapperProps) {
  if (!isForPDF) {
    // Normal app rendering - preserve existing design
    return <>{children}</>
  }

  // PDF-only rendering with optimized structure
  return (
    <div 
      className="pdf-container"
      style={{
        width: '210mm',
        minHeight: '297mm',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '20mm',
        backgroundColor: 'white',
        position: 'relative',
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
  )
}

