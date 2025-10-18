/**
 * PDF Generator V2 - Text-Based Rendering
 * Uses jsPDF and jspdf-autotable for native text rendering
 * Produces crisp, searchable PDFs with 80% smaller file sizes
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PDFContentData } from '@/types/pdfExport'

/**
 * Sanitize text to handle special characters while preserving important symbols
 */
function sanitizeText(text: string): string {
  if (!text) return ''
  return text
    // Remove control characters and zero-width spaces
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '')
    // Normalize quotes (but keep apostrophes in contractions)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Normalize dashes
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    // Non-breaking space to regular space
    .replace(/[\u00A0]/g, ' ')
    // Keep everything else (currency symbols, numbers, punctuation, accented chars)
}

// PDF Configuration Constants
const PDF_CONFIG = {
  page: {
    width: 210, // A4 width in mm
    height: 297, // A4 height in mm
    margin: 20,
    contentWidth: 170 // 210 - (20*2)
  },
  
  spacing: {
    lineHeight: 7,
    sectionGap: 10,
    paragraphGap: 5,
    itemGap: 3
  },
  
  fonts: {
    title: { size: 24, style: 'bold' },
    subtitle: { size: 16, style: 'bold' },
    heading: { size: 14, style: 'bold' },
    subheading: { size: 12, style: 'bold' },
    body: { size: 10, style: 'normal' },
    small: { size: 9, style: 'normal' }
  },
  
  colors: {
    primary: [30, 58, 138] as [number, number, number],
    red: [220, 38, 38] as [number, number, number],
    orange: [234, 88, 12] as [number, number, number],
    green: [22, 163, 74] as [number, number, number],
    blue: [59, 130, 246] as [number, number, number],
    purple: [147, 51, 234] as [number, number, number],
    gray: [107, 114, 128] as [number, number, number],
    lightGray: [249, 250, 251] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    darkText: [30, 41, 59] as [number, number, number]
  }
}

/**
 * Main PDF generation function - creates complete PDF from structured data
 */
export function generateTextBasedPDF(contentData: PDFContentData, filename: string): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  })

  let currentY = PDF_CONFIG.page.margin

  // Page 1: Header and Deal Command Center
  currentY = renderHeader(pdf, contentData.header)
  currentY = renderDealCommandCenter(pdf, contentData.dealCommandCenter, currentY)
  
  // Call Summary
  currentY = checkPageBreak(pdf, currentY, 70, contentData.header.title)
  currentY = renderCallSummary(pdf, contentData.callSummary, currentY)
  
  // Strategic Intelligence
  currentY = checkPageBreak(pdf, currentY, 90, contentData.header.title)
  currentY = renderStrategicIntelligence(pdf, contentData.strategicIntelligence, currentY)
  
  // Strategic Assessment
  currentY = checkPageBreak(pdf, currentY, 40, contentData.header.title)
  currentY = renderStrategicAssessment(pdf, contentData.strategicAssessment, currentY)
  
  // Why These Actions
  currentY = checkPageBreak(pdf, currentY, 50, contentData.header.title)
  currentY = renderWhyTheseActions(pdf, contentData.whyTheseActions, currentY)
  
  // Battle Plan Timeline (Action Items)
  currentY = checkPageBreak(pdf, currentY, 60, contentData.header.title)
  currentY = renderActionItems(pdf, contentData.actionItems, currentY)
  
  // Deal Insights
  if (contentData.dealInsights.length > 0) {
    currentY = checkPageBreak(pdf, currentY, 50, contentData.header.title)
    currentY = renderDealInsights(pdf, contentData.dealInsights, currentY)
  }
  
  // Competitive Positioning
  currentY = checkPageBreak(pdf, currentY, 60, contentData.header.title)
  currentY = renderCompetitivePositioning(pdf, contentData.competitivePositioning, currentY)

  return pdf
}

/**
 * Render header section (first page only)
 */
function renderHeader(pdf: jsPDF, header: any): number {
  // Title
  pdf.setFontSize(PDF_CONFIG.fonts.title.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'bold')
  pdf.text(sanitizeText(header.title), PDF_CONFIG.page.margin, 22)
  
  // Subtitle
  pdf.setFontSize(13)
  pdf.setTextColor(...PDF_CONFIG.colors.gray)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Sales Intelligence Report', PDF_CONFIG.page.margin, 32)
  pdf.text(`Generated on ${header.date}`, PDF_CONFIG.page.margin, 40)
  
  // Separator line
  pdf.setDrawColor(...PDF_CONFIG.colors.gray)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, 46, PDF_CONFIG.page.width - PDF_CONFIG.page.margin, 46)
  
  return 52
}

/**
 * Render compact header for continuation pages
 */
function addPageHeader(pdf: jsPDF, title: string, pageNum: number): number {
  const pageWidth = pdf.internal.pageSize.getWidth()
  
  pdf.setFontSize(12)
  pdf.setTextColor(...PDF_CONFIG.colors.gray)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`${title} - Page ${pageNum}`, PDF_CONFIG.page.margin, 12)
  
  // Page number on right
  pdf.setFontSize(10)
  pdf.text(`Page ${pageNum}`, pageWidth - PDF_CONFIG.page.margin, 12, { align: 'right' })
  
  // Separator
  pdf.setDrawColor(...PDF_CONFIG.colors.lightGray)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, 18, pageWidth - PDF_CONFIG.page.margin, 18)
  
  return 24
}

/**
 * Render Deal Command Center as table
 */
function renderDealCommandCenter(pdf: jsPDF, data: any, startY: number): number {
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Deal Command Center', PDF_CONFIG.page.margin, startY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Deal Command Center')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, startY + 1, PDF_CONFIG.page.margin + headerWidth, startY + 1)
  
  const tableData = [
    ['Deal Heat', 'Power Center', 'Momentum', 'Competitive Edge'],
    [
      `${data.dealHeat.emoji} ${data.dealHeat.description}`,
      `${data.powerCenter.name}\n${data.powerCenter.title}\n${data.powerCenter.influence}`,
      `${data.momentum.score}\n${data.momentum.strength}`,
      `${data.competitiveEdge.strategy}\n${data.competitiveEdge.driver}`
    ]
  ]
  
  autoTable(pdf, {
    startY: startY + 6,
    head: [tableData[0]],
    body: [tableData[1]],
    theme: 'grid',
    headStyles: {
      fillColor: PDF_CONFIG.colors.primary,
      textColor: PDF_CONFIG.colors.white,
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 4
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: PDF_CONFIG.colors.darkText
    },
    columnStyles: {
      0: { cellWidth: 42.5 },
      1: { cellWidth: 42.5 },
      2: { cellWidth: 42.5 },
      3: { cellWidth: 42.5 }
    },
    margin: { left: PDF_CONFIG.page.margin, right: PDF_CONFIG.page.margin }
  })
  
  return (pdf as any).lastAutoTable.finalY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Call Summary section
 */
function renderCallSummary(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  // Section heading
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Call Summary', PDF_CONFIG.page.margin, currentY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Call Summary')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 8
  
  // Overview
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  const overviewLines = pdf.splitTextToSize(sanitizeText(data.overview), PDF_CONFIG.page.contentWidth)
  pdf.text(overviewLines, PDF_CONFIG.page.margin, currentY)
  currentY += overviewLines.length * 5 + 6
  
  // Two-column grid
  const colWidth = (PDF_CONFIG.page.contentWidth - 5) / 2
  
  // Client Situation (left column)
  pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Client Situation', PDF_CONFIG.page.margin, currentY)
  currentY += 6
  
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  const situationLines = pdf.splitTextToSize(sanitizeText(data.clientSituation), colWidth)
  pdf.text(situationLines, PDF_CONFIG.page.margin, currentY)
  
  // Main Topics (right column)
  const rightColX = PDF_CONFIG.page.margin + colWidth + 5
  pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Main Topics', rightColX, currentY - 6)
  
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  let topicY = currentY
  data.mainTopics.forEach((topic: string) => {
    const topicLines = pdf.splitTextToSize(sanitizeText(`• ${topic}`), colWidth - 5)
    pdf.text(topicLines, rightColX, topicY)
    topicY += topicLines.length * 5
  })
  
  currentY = Math.max(currentY + situationLines.length * 5, topicY) + PDF_CONFIG.spacing.sectionGap
  
  return currentY
}

/**
 * Render Strategic Intelligence section
 */
function renderStrategicIntelligence(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  // Section heading
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Strategic Intelligence & Approach', PDF_CONFIG.page.margin, currentY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Strategic Intelligence & Approach')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 10
  
  // Define grid: 2 columns with dynamic row heights
  const colWidth = (PDF_CONFIG.page.contentWidth - 5) / 2
  const minBoxHeight = 20
  
  const boxes = [
    { title: 'Critical Pain', items: data.criticalPain, color: PDF_CONFIG.colors.red },
    { title: 'Decision Criteria', items: data.decisionCriteria, color: PDF_CONFIG.colors.blue },
    { title: 'Timeline Driver', items: [data.timelineDriver], color: PDF_CONFIG.colors.orange },
    { title: 'Buying Signals', items: data.buyingSignals, color: PDF_CONFIG.colors.green },
    { title: 'Competitive Landscape', items: data.competitiveLandscape, color: PDF_CONFIG.colors.purple },
  ]
  
  // Calculate box heights dynamically based on content
  const boxHeights = boxes.map(box => {
    let contentHeight = 10 // Title + padding
    box.items.forEach((item: string) => {
      const itemLines = pdf.splitTextToSize(sanitizeText(`• ${item}`), colWidth - 4)
      contentHeight += itemLines.length * 4
    })
    return Math.max(minBoxHeight, contentHeight + 2)
  })
  
  // Render boxes in pairs (left and right columns)
  let rowY = currentY
  for (let i = 0; i < boxes.length; i += 2) {
    const leftBox = boxes[i]
    const rightBox = boxes[i + 1]
    const leftHeight = boxHeights[i]
    const rightHeight = rightBox ? boxHeights[i + 1] : 0
    const rowHeight = Math.max(leftHeight, rightHeight)
    
    // Check if we need a page break for this row
    currentY = checkPageBreak(pdf, rowY, rowHeight + 5, 'Strategic Intelligence')
    if (currentY !== rowY) {
      rowY = currentY // Page break occurred, update row position
    }
    
    // Render left box
    const leftX = PDF_CONFIG.page.margin
    pdf.setFillColor(...PDF_CONFIG.colors.lightGray)
    pdf.rect(leftX, rowY, colWidth, rowHeight, 'F')
    
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...leftBox.color)
    pdf.setFont('helvetica', 'bold')
    pdf.text(leftBox.title, leftX + 2, rowY + 5)
    
    pdf.setFontSize(PDF_CONFIG.fonts.small.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    let itemY = rowY + 10
    leftBox.items.forEach((item: string) => {
      const itemLines = pdf.splitTextToSize(sanitizeText(`• ${item}`), colWidth - 4)
      pdf.text(itemLines, leftX + 2, itemY)
      itemY += itemLines.length * 4
    })
    
    // Render right box if exists
    if (rightBox) {
      const rightX = PDF_CONFIG.page.margin + colWidth + 5
      pdf.setFillColor(...PDF_CONFIG.colors.lightGray)
      pdf.rect(rightX, rowY, colWidth, rowHeight, 'F')
      
      pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
      pdf.setTextColor(...rightBox.color)
      pdf.setFont('helvetica', 'bold')
      pdf.text(rightBox.title, rightX + 2, rowY + 5)
      
      pdf.setFontSize(PDF_CONFIG.fonts.small.size)
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      pdf.setFont('helvetica', 'normal')
      let rightItemY = rowY + 10
      rightBox.items.forEach((item: string) => {
        const itemLines = pdf.splitTextToSize(sanitizeText(`• ${item}`), colWidth - 4)
        pdf.text(itemLines, rightX + 2, rightItemY)
        rightItemY += itemLines.length * 4
      })
    }
    
    rowY += rowHeight + 3
  }
  
  currentY = rowY + PDF_CONFIG.spacing.sectionGap
  
  return currentY
}

/**
 * Render Strategic Assessment section
 */
function renderStrategicAssessment(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Strategic Assessment', PDF_CONFIG.page.margin, currentY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Strategic Assessment')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 8
  
  const strategies = [
    { label: 'Primary Strategy', value: data.primaryStrategy },
    { label: 'Competitive Strategy', value: data.competitiveStrategy },
    { label: 'Stakeholder Plan', value: data.stakeholderPlan }
  ]
  
  strategies.forEach(strategy => {
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    pdf.setFont('helvetica', 'bold')
    pdf.text(strategy.label, PDF_CONFIG.page.margin, currentY)
    currentY += 5
    
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    const lines = pdf.splitTextToSize(sanitizeText(strategy.value), PDF_CONFIG.page.contentWidth)
    pdf.text(lines, PDF_CONFIG.page.margin, currentY)
    currentY += lines.length * 5 + 4
  })
  
  return currentY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Why These Actions section
 */
function renderWhyTheseActions(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Why These Actions?', PDF_CONFIG.page.margin, currentY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Why These Actions?')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 8
  
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  const rationaleLines = pdf.splitTextToSize(sanitizeText(data.rationale), PDF_CONFIG.page.contentWidth)
  pdf.text(rationaleLines, PDF_CONFIG.page.margin, currentY)
  currentY += rationaleLines.length * 5 + 6
  
  if (data.supportingEvidence.length > 0) {
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Supporting Evidence:', PDF_CONFIG.page.margin, currentY)
    currentY += 6
    
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    data.supportingEvidence.forEach((evidence: string) => {
      const evidenceLines = pdf.splitTextToSize(sanitizeText(`• ${evidence}`), PDF_CONFIG.page.contentWidth - 5)
      pdf.text(evidenceLines, PDF_CONFIG.page.margin + 5, currentY)
      currentY += evidenceLines.length * 5
    })
  }
  
  return currentY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Action Items (Battle Plan Timeline)
 */
function renderActionItems(pdf: jsPDF, actions: any[], startY: number): number {
  let currentY = startY
  
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Battle Plan Execution Timeline', PDF_CONFIG.page.margin, currentY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Battle Plan Execution Timeline')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 10
  
  actions.forEach((action, index) => {
    // Calculate required space for this action (including email template)
    const estimatedSpace = action.emailTemplate ? 60 : 35
    currentY = checkPageBreak(pdf, currentY, estimatedSpace, 'Battle Plan')
    
    // Action number and title
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...PDF_CONFIG.colors.primary)
    pdf.setFont('helvetica', 'bold')
    const actionTitle = sanitizeText(`${index + 1}. ${action.action}`)
    const titleLines = pdf.splitTextToSize(actionTitle, PDF_CONFIG.page.contentWidth)
    pdf.text(titleLines, PDF_CONFIG.page.margin, currentY)
    currentY += titleLines.length * 5 + 3
    
    // Rationale
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    const rationaleLines = pdf.splitTextToSize(sanitizeText(action.rationale), PDF_CONFIG.page.contentWidth)
    pdf.text(rationaleLines, PDF_CONFIG.page.margin, currentY)
    currentY += rationaleLines.length * 5 + 3
    
    // Timeline and channels
    pdf.setFontSize(PDF_CONFIG.fonts.small.size)
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    pdf.text(sanitizeText(`Timeline: ${action.timeline} | Channels: ${action.channels.join(', ')}`), PDF_CONFIG.page.margin, currentY)
    currentY += 6
    
    // Email template if present
    if (action.emailTemplate && action.emailTemplate.body) {
      // Calculate email template space with extra buffer
      const emailBodyLines = pdf.splitTextToSize(
        sanitizeText(action.emailTemplate.body), 
        PDF_CONFIG.page.contentWidth - 15
      )
      const emailSpace = 25 + (emailBodyLines.length * 5)
      currentY = checkPageBreak(pdf, currentY, emailSpace, 'Email Template')
      
      // Add visual separator box
      pdf.setDrawColor(...PDF_CONFIG.colors.gray)
      pdf.setLineWidth(0.3)
      pdf.setFillColor(250, 251, 255) // Very light blue background
      const boxHeight = 20 + (emailBodyLines.length * 5)
      pdf.rect(
        PDF_CONFIG.page.margin + 3, 
        currentY - 2, 
        PDF_CONFIG.page.contentWidth - 6, 
        boxHeight,
        'FD'
      )
      
      currentY += 2
      
      // Email Template header with emoji
      pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
      pdf.setTextColor(...PDF_CONFIG.colors.blue)
      pdf.setFont('helvetica', 'bold')
      pdf.text('📧 Email Template:', PDF_CONFIG.page.margin + 6, currentY)
      currentY += 7
      
      // Subject line
      pdf.setFontSize(PDF_CONFIG.fonts.body.size)
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      pdf.setFont('helvetica', 'bold')
      pdf.text(sanitizeText(`Subject: ${action.emailTemplate.subject}`), PDF_CONFIG.page.margin + 6, currentY)
      currentY += 6
      
      // Email body
      pdf.setFont('helvetica', 'normal')
      pdf.text(emailBodyLines, PDF_CONFIG.page.margin + 6, currentY)
      currentY += emailBodyLines.length * 5 + 5
    }
    
    currentY += 5 // Space between actions
  })
  
  return currentY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Deal Insights section
 */
function renderDealInsights(pdf: jsPDF, insights: string[], startY: number): number {
  let currentY = startY
  
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Deal Acceleration Insights', PDF_CONFIG.page.margin, currentY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Deal Acceleration Insights')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 8
  
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  
  insights.forEach((insight, index) => {
    currentY = checkPageBreak(pdf, currentY, 15, 'Deal Insights')
    const insightText = sanitizeText(`${index + 1}. ${insight}`)
    const insightLines = pdf.splitTextToSize(insightText, PDF_CONFIG.page.contentWidth)
    pdf.text(insightLines, PDF_CONFIG.page.margin, currentY)
    currentY += insightLines.length * 5 + 3
  })
  
  return currentY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Competitive Positioning section
 */
function renderCompetitivePositioning(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Competitive Positioning Arsenal', PDF_CONFIG.page.margin, currentY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Competitive Positioning Arsenal')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 10
  
  const sections = [
    { title: 'Buying Signals Detected', items: data.buyingSignals, color: PDF_CONFIG.colors.green },
    { title: 'Pain Indicators', items: data.painIndicators, color: PDF_CONFIG.colors.red },
    { title: 'Concerns to Address', items: data.concerns, color: PDF_CONFIG.colors.orange },
    { title: 'Competitive Intelligence', items: data.competitiveIntel, color: PDF_CONFIG.colors.purple }
  ]
  
  sections.forEach(section => {
    // Pre-calculate space needed for entire section
    let sectionHeight = 10 // Header + padding
    section.items.forEach((item: string) => {
      const itemLines = pdf.splitTextToSize(sanitizeText(`• ${item}`), PDF_CONFIG.page.contentWidth - 5)
      sectionHeight += itemLines.length * 5 + 2
    })
    
    // Check if we need a page break for the entire section
    currentY = checkPageBreak(pdf, currentY, sectionHeight, section.title)
    
    // Render section header with count
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...section.color)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${section.title} (${section.items.length})`, PDF_CONFIG.page.margin, currentY)
    currentY += 6
    
    // Render all items
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    section.items.forEach((item: string) => {
      const itemLines = pdf.splitTextToSize(sanitizeText(`• ${item}`), PDF_CONFIG.page.contentWidth - 5)
      pdf.text(itemLines, PDF_CONFIG.page.margin + 5, currentY)
      currentY += itemLines.length * 5 + 2
    })
    currentY += 5
  })
  
  return currentY
}

/**
 * Smart page break management with improved space estimation
 */
function checkPageBreak(pdf: jsPDF, currentY: number, requiredSpace: number, sectionName?: string): number {
  const pageBottom = PDF_CONFIG.page.height - PDF_CONFIG.page.margin
  const bufferSpace = 10 // Add 10mm buffer to prevent tight fits
  
  if (currentY + requiredSpace + bufferSpace > pageBottom) {
    pdf.addPage()
    const pageNum = pdf.getNumberOfPages()
    return addPageHeader(pdf, sectionName || 'Sales Analysis', pageNum)
  }
  return currentY
}
