/**
 * PDF Section Markers - Continuation indicators and visual cues
 */

import jsPDF from 'jspdf'

/**
 * Adds a subtle continuation marker at top of page
 */
export function addContinuationMarker(
  pdf: jsPDF,
  sectionName: string,
  y: number = 20
): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  // Light gray continuation indicator
  pdf.setFontSize(9)
  pdf.setTextColor(148, 163, 184) // slate-400
  pdf.text(`↓ ${sectionName} (continued)`, pageWidth / 2, y, { align: 'center' })
}

/**
 * Adds section end marker (subtle horizontal line)
 */
export function addSectionEndMarker(
  pdf: jsPDF,
  y: number
): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  pdf.setDrawColor(226, 232, 240) // slate-200
  pdf.setLineWidth(0.3)
  pdf.line(10, y, pageWidth - 10, y)
}

/**
 * Creates an enhanced header for continuation pages
 */
export function createContinuationHeader(
  pdf: jsPDF,
  title: string,
  pageNumber: number,
  sectionName?: string
): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  // Compact header for continuation pages
  pdf.setFontSize(12)
  pdf.setTextColor(71, 85, 105) // slate-600
  const cleanTitle = title.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  pdf.text(`${cleanTitle} - Page ${pageNumber}`, 10, 12)
  
  // Add page number on right
  pdf.setFontSize(10)
  pdf.setTextColor(148, 163, 184) // slate-400
  pdf.text(`Page ${pageNumber}`, pageWidth - 10, 12, { align: 'right' })
  
  // Section indicator if continuing
  if (sectionName) {
    pdf.setFontSize(9)
    pdf.setTextColor(100, 116, 139) // slate-500
    pdf.text(`↓ ${sectionName}`, 10, 18)
  }
  
  // Separator line
  pdf.setDrawColor(203, 213, 225) // slate-300
  pdf.setLineWidth(0.5)
  pdf.line(10, 22, pageWidth - 10, 22)
  
  return 28 // Content starts at 28mm
}

/**
 * Formats section name for display
 */
export function formatSectionName(type: string): string {
  const sectionNames: Record<string, string> = {
    'hero': 'Analysis Overview',
    'battle-plan': 'Battle Plan',
    'action-item': 'Action Items',
    'stakeholder': 'Stakeholder Map',
    'expandable': 'Detailed Insights',
    'card': 'Details',
    'section': 'Analysis'
  }
  
  return sectionNames[type] || 'Content'
}
