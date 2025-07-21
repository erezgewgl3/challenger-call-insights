
import React from 'react'

interface PDFReportWrapperProps {
  children: React.ReactNode
  isForPDF?: boolean
}

/**
 * DEPRECATED: This wrapper is no longer used since we switched to DOM cloning for PDF export.
 * Keeping for backward compatibility, but it now just passes through children.
 */
export function PDFReportWrapper({ children, isForPDF = false }: PDFReportWrapperProps) {
  // Simply return children without any processing
  // PDF export now uses DOM cloning instead of React component rendering
  return <>{children}</>
}
