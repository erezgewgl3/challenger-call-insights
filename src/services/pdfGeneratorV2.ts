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
    // Only remove control characters and zero-width spaces
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Normalize smart quotes to straight quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Normalize em/en dashes to hyphens
    .replace(/[\u2013\u2014]/g, '-')
    // Keep everything else (emojis, currency, letters, numbers)
}

/**
 * PDF-safe text that removes emojis and unsupported characters
 */
function sanitizePDF(text: string): string {
  if (!text) return ''
  return sanitizeText(text)
    .replace(/\p{Extended_Pictographic}/gu, '') // Remove emojis
    .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
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
  currentY = renderWinStrategy(pdf, contentData.dealCommandCenter, currentY)
  
  // Call Summary
  currentY = checkPageBreak(pdf, currentY, 70, contentData.header.title)
  currentY = renderCallSummary(pdf, contentData.callSummary, currentY)
  
  // Strategic Intelligence
  currentY = checkPageBreak(pdf, currentY, 90, contentData.header.title)
  currentY = renderStrategicIntelligence(pdf, contentData.strategicIntelligence, currentY)
  
  // Strategic Assessment
  currentY = checkPageBreak(pdf, currentY, 40, contentData.header.title)
  currentY = renderStrategicAssessment(pdf, contentData.strategicAssessment, currentY)
  
  // Stakeholder Navigation Map
  currentY = checkPageBreak(pdf, currentY, 50, contentData.header.title)
  currentY = renderStakeholderNavigation(pdf, contentData.stakeholderNavigation, currentY)
  
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
  pdf.text(sanitizePDF(header.title), PDF_CONFIG.page.margin, 22)
  
  // Subtitle
  pdf.setFontSize(13)
  pdf.setTextColor(...PDF_CONFIG.colors.gray)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Sales Intelligence Report', PDF_CONFIG.page.margin, 32)
  pdf.text(`Generated on ${sanitizePDF(header.date)}`, PDF_CONFIG.page.margin, 40)
  
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
  pdf.text(`${sanitizePDF(title)} - Page ${pageNum}`, PDF_CONFIG.page.margin, 12)
  
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
  // Check if all data is empty
  const hasAnyData = data.dealHeat.description || data.powerCenter.name || data.momentum.score || data.competitiveEdge.strategy
  
  if (!hasAnyData) {
    return startY // Skip entire section if no data
  }
  
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Deal Command Center', PDF_CONFIG.page.margin, startY)
  
  // Add underline to header
  const headerWidth = pdf.getTextWidth('Deal Command Center')
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, startY + 1, PDF_CONFIG.page.margin + headerWidth, startY + 1)
  
  // Build table data, filtering out empty cells
  const dealHeatText = data.dealHeat.description ? `[${data.dealHeat.level}] ${data.dealHeat.description}` : ''
  const powerCenterText = [data.powerCenter.name, data.powerCenter.title, data.powerCenter.influence].filter(Boolean).join('\n')
  const momentumText = [data.momentum.score, data.momentum.strength].filter(Boolean).join('\n')
  const competitiveEdgeText = [data.competitiveEdge.strategy, data.competitiveEdge.driver].filter(Boolean).join('\n')
  
  const tableData = [
    ['Deal Heat', 'Power Center', 'Momentum', 'Competitive Edge'],
    [
      dealHeatText,
      powerCenterText,
      momentumText,
      competitiveEdgeText
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
 * Render Win Strategy section (emerald box below Deal Command Center)
 */
function renderWinStrategy(pdf: jsPDF, data: any, startY: number): number {
  const winStrategy = data.winStrategy
  
  if (!winStrategy) return startY
  
  let currentY = startY + 4
  
  // Draw emerald gradient box
  pdf.setFillColor(16, 185, 129) // emerald-500
  pdf.setDrawColor(52, 211, 153) // emerald-400
  pdf.setLineWidth(0.5)
  pdf.roundedRect(PDF_CONFIG.page.margin, currentY, PDF_CONFIG.page.contentWidth, 20, 3, 3, 'FD')
  
  // "Win Strategy" label
  pdf.setFontSize(11)
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Win Strategy', PDF_CONFIG.page.margin + 4, currentY + 6)
  
  // "Competitive Advantage" badge
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  const badgeText = 'COMPETITIVE ADVANTAGE'
  const badgeWidth = pdf.getTextWidth(badgeText) + 4
  const badgeX = PDF_CONFIG.page.contentWidth + PDF_CONFIG.page.margin - badgeWidth - 2
  
  pdf.setFillColor(5, 150, 105) // emerald-600
  pdf.roundedRect(badgeX, currentY + 3, badgeWidth, 5, 1, 1, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.text(badgeText, badgeX + 2, currentY + 6.5)
  
  // Strategy text
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(255, 255, 255)
  const strategyLines = pdf.splitTextToSize(sanitizePDF(winStrategy), PDF_CONFIG.page.contentWidth - 8)
  pdf.text(strategyLines, PDF_CONFIG.page.margin + 4, currentY + 12)
  
  return currentY + 24
}

/**
 * Render Call Summary section
 */
function renderCallSummary(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  // Check if we have any data to render
  if (!data.overview && !data.clientSituation && data.mainTopics.length === 0 && !data.clientPriority && !data.urgencyDriver) {
    return currentY // Skip entire section if no data
  }
  
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
  
  // Overview (only if exists)
  if (data.overview) {
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    const overviewLines = pdf.splitTextToSize(sanitizePDF(data.overview), PDF_CONFIG.page.contentWidth)
    pdf.text(overviewLines, PDF_CONFIG.page.margin, currentY)
    currentY += overviewLines.length * 5 + 6
  }
  
  // Two-column grid (only if we have client situation or main topics)
  if (data.clientSituation || data.mainTopics.length > 0) {
    const colWidth = (PDF_CONFIG.page.contentWidth - 5) / 2
    
    // Client Situation (left column, only if exists)
    if (data.clientSituation) {
      pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
      pdf.setTextColor(...PDF_CONFIG.colors.primary)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Client Situation', PDF_CONFIG.page.margin, currentY)
      currentY += 6
      
      pdf.setFontSize(PDF_CONFIG.fonts.body.size)
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      pdf.setFont('helvetica', 'normal')
      const situationLines = pdf.splitTextToSize(sanitizePDF(data.clientSituation), colWidth)
      pdf.text(situationLines, PDF_CONFIG.page.margin, currentY)
    }
    
    // Main Topics (right column, only if exists)
    if (data.mainTopics.length > 0) {
      const rightColX = PDF_CONFIG.page.margin + colWidth + 5
      pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
      pdf.setTextColor(...PDF_CONFIG.colors.primary)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Main Topics', rightColX, currentY - (data.clientSituation ? 6 : 0))
      
      pdf.setFontSize(PDF_CONFIG.fonts.body.size)
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      pdf.setFont('helvetica', 'normal')
      let topicY = currentY
      data.mainTopics.forEach((topic: string) => {
        const topicLines = pdf.splitTextToSize(sanitizePDF(`• ${topic}`), colWidth - 5)
        pdf.text(topicLines, rightColX, topicY)
        topicY += topicLines.length * 5
      })
      
      if (data.clientSituation) {
        const situationLines = pdf.splitTextToSize(sanitizePDF(data.clientSituation), colWidth)
        currentY = Math.max(currentY + situationLines.length * 5, topicY)
      } else {
        currentY = topicY
      }
    } else if (data.clientSituation) {
      const situationLines = pdf.splitTextToSize(sanitizePDF(data.clientSituation), colWidth)
      currentY += situationLines.length * 5
    }
    
    currentY += PDF_CONFIG.spacing.sectionGap
  }
  
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
      const itemLines = pdf.splitTextToSize(sanitizePDF(`• ${item}`), colWidth - 4)
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
      const itemLines = pdf.splitTextToSize(sanitizePDF(`• ${item}`), colWidth - 4)
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
        const itemLines = pdf.splitTextToSize(sanitizePDF(`• ${item}`), colWidth - 4)
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
    const lines = pdf.splitTextToSize(sanitizePDF(strategy.value), PDF_CONFIG.page.contentWidth)
    pdf.text(lines, PDF_CONFIG.page.margin, currentY)
    currentY += lines.length * 5 + 4
  })
  
  return currentY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Stakeholder Navigation Map section
 */
function renderStakeholderNavigation(pdf: jsPDF, data: any, startY: number): number {
  // Skip if no stakeholder data
  if ((!data.economicBuyers || data.economicBuyers.length === 0) && 
      (!data.keyInfluencers || data.keyInfluencers.length === 0) && 
      !data.navigationStrategy) {
    return startY
  }
  
  let currentY = checkPageBreak(pdf, startY, 70, 'Stakeholder Navigation Map')
  
  // Section Title
  pdf.setFillColor(241, 245, 249) // slate-100
  pdf.rect(PDF_CONFIG.page.margin, currentY, PDF_CONFIG.page.contentWidth, 12, 'F')
  
  pdf.setTextColor(30, 41, 59) // slate-800
  pdf.setFontSize(PDF_CONFIG.fonts.subtitle.size)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Stakeholder Navigation Map', PDF_CONFIG.page.margin + 5, currentY + 8)
  
  currentY += 18
  
  // Calculate column widths (3 columns with gaps)
  const gapWidth = 5
  const columnWidth = (PDF_CONFIG.page.contentWidth - (2 * gapWidth)) / 3
  const leftX = PDF_CONFIG.page.margin
  const middleX = leftX + columnWidth + gapWidth
  const rightX = middleX + columnWidth + gapWidth
  
  // Calculate dynamic heights for each column based on content
  let economicBuyersHeight = 10 // Base padding
  if (data.economicBuyers && data.economicBuyers.length > 0) {
    data.economicBuyers.slice(0, 2).forEach((buyer: any) => {
      economicBuyersHeight += 4 // Name
      if (buyer.title) {
        const titleLines = pdf.splitTextToSize(sanitizePDF(buyer.title), columnWidth - 6)
        economicBuyersHeight += titleLines.length * 3
      }
      if (buyer.evidence) {
        const evidenceText = `VERBATIM: "${sanitizePDF(buyer.evidence)}"`
        const evidenceLines = pdf.splitTextToSize(evidenceText, columnWidth - 6)
        economicBuyersHeight += Math.min(evidenceLines.length, 2) * 2.5
      }
      if (buyer.isPrimaryContact) {
        economicBuyersHeight += 5
      }
      economicBuyersHeight += 2 // Spacing
    })
  }
  economicBuyersHeight += 10 // Bottom padding

  let keyInfluencersHeight = 10 // Base padding
  if (data.keyInfluencers && data.keyInfluencers.length > 0) {
    data.keyInfluencers.slice(0, 2).forEach((influencer: any) => {
      keyInfluencersHeight += 4 // Name
      if (influencer.title) {
        const titleLines = pdf.splitTextToSize(sanitizePDF(influencer.title), columnWidth - 6)
        keyInfluencersHeight += titleLines.length * 3
      }
      if (influencer.evidence) {
        const evidenceText = `VERBATIM: "${sanitizePDF(influencer.evidence)}"`
        const evidenceLines = pdf.splitTextToSize(evidenceText, columnWidth - 6)
        keyInfluencersHeight += Math.min(evidenceLines.length, 2) * 2.5
      }
      keyInfluencersHeight += 2 // Spacing
    })
  }
  keyInfluencersHeight += 10 // Bottom padding

  let navigationStrategyHeight = 10 // Base padding
  if (data.navigationStrategy) {
    const strategyLines = pdf.splitTextToSize(sanitizePDF(data.navigationStrategy), columnWidth - 6)
    navigationStrategyHeight += strategyLines.length * 3.5
    navigationStrategyHeight += 12 // Bullets
  }
  navigationStrategyHeight += 6 // Bottom padding

  const maxHeight = Math.max(economicBuyersHeight, keyInfluencersHeight, navigationStrategyHeight, 40)

  // Update page break check with actual calculated height
  currentY = checkPageBreak(pdf, currentY - 18, maxHeight + 30, 'Stakeholder Navigation Map') + 18

  // Economic Buyers (Left Column - Red theme)
  if (data.economicBuyers && data.economicBuyers.length > 0) {
    pdf.setFillColor(254, 242, 242) // red-50
    pdf.setDrawColor(254, 202, 202) // red-200
    pdf.setLineWidth(0.5)
    pdf.roundedRect(leftX, currentY, columnWidth, economicBuyersHeight, 2, 2, 'FD')
    
    pdf.setTextColor(153, 27, 27) // red-900
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Economic Buyers', leftX + 3, currentY + 5)
    
    pdf.setTextColor(55, 65, 81) // gray-700
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    
    let buyerY = currentY + 10
    data.economicBuyers.slice(0, 2).forEach((buyer: any) => {
      if (buyer.name) {
        // Name (bold)
        pdf.setFont('helvetica', 'bold')
        pdf.text(sanitizePDF(buyer.name), leftX + 3, buyerY)
        buyerY += 4
        
        // Title
        if (buyer.title) {
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(107, 114, 128) // gray-500
          const titleLines = pdf.splitTextToSize(sanitizePDF(buyer.title), columnWidth - 6)
          titleLines.forEach((line: string) => {
            pdf.text(line, leftX + 3, buyerY)
            buyerY += 3
          })
        }
        
        // Evidence quote - VERBATIM
        if (buyer.evidence) {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7)
          pdf.setTextColor(107, 114, 128) // gray-500
          const evidenceText = `VERBATIM: "${sanitizePDF(buyer.evidence)}"`
          const evidenceLines = pdf.splitTextToSize(evidenceText, columnWidth - 6)
          evidenceLines.slice(0, 2).forEach((line: string) => {
            pdf.text(line, leftX + 3, buyerY)
            buyerY += 2.5
          })
        }
        
        // Primary Contact badge
        if (buyer.isPrimaryContact) {
          pdf.setFontSize(6)
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(107, 114, 128) // gray-500
          pdf.text('Primary Contact', leftX + 3, buyerY)
          buyerY += 4
        }
        
        buyerY += 2
      }
    })
  }
  
  // Key Influencers (Middle Column - Yellow theme)
  if (data.keyInfluencers && data.keyInfluencers.length > 0) {
    pdf.setFillColor(254, 252, 232) // yellow-50
    pdf.setDrawColor(254, 240, 138) // yellow-200
    pdf.setLineWidth(0.5)
    pdf.roundedRect(middleX, currentY, columnWidth, keyInfluencersHeight, 2, 2, 'FD')
    
    pdf.setTextColor(120, 53, 15) // yellow-900
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Key Influencers', middleX + 3, currentY + 5)
    
    pdf.setTextColor(55, 65, 81) // gray-700
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    
    let influencerY = currentY + 10
    data.keyInfluencers.slice(0, 2).forEach((influencer: any) => {
      if (influencer.name) {
        // Name (bold)
        pdf.setFont('helvetica', 'bold')
        pdf.text(sanitizePDF(influencer.name), middleX + 3, influencerY)
        influencerY += 4
        
        // Title
        if (influencer.title) {
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor(107, 114, 128) // gray-500
          const titleLines = pdf.splitTextToSize(sanitizePDF(influencer.title), columnWidth - 6)
          titleLines.forEach((line: string) => {
            pdf.text(line, middleX + 3, influencerY)
            influencerY += 3
          })
        }
        
        // Evidence quote - VERBATIM
        if (influencer.evidence) {
          pdf.setFont('helvetica', 'normal')
          pdf.setFontSize(7)
          pdf.setTextColor(107, 114, 128) // gray-500
          const evidenceText = `VERBATIM: "${sanitizePDF(influencer.evidence)}"`
          const evidenceLines = pdf.splitTextToSize(evidenceText, columnWidth - 6)
          evidenceLines.slice(0, 2).forEach((line: string) => {
            pdf.text(line, middleX + 3, influencerY)
            influencerY += 2.5
          })
        }
        
        influencerY += 2
      }
    })
  }
  
  // Navigation Strategy (Right Column - Blue theme)
  if (data.navigationStrategy) {
    pdf.setFillColor(239, 246, 255) // blue-50
    pdf.setDrawColor(191, 219, 254) // blue-200
    pdf.setLineWidth(0.5)
    pdf.roundedRect(rightX, currentY, columnWidth, navigationStrategyHeight, 2, 2, 'FD')
    
    pdf.setTextColor(30, 58, 138) // blue-900
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Navigation Strategy', rightX + 3, currentY + 5)
    
    pdf.setTextColor(30, 58, 138) // blue-900
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    
    const strategyLines = pdf.splitTextToSize(sanitizePDF(data.navigationStrategy), columnWidth - 6)
    let strategyY = currentY + 10
    strategyLines.forEach((line: string) => {
      pdf.text(line, rightX + 3, strategyY)
      strategyY += 3.5
    })
    
    strategyY += 2
    
    // Bullet points
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(55, 65, 81) // gray-700
    
    // Red bullet
    pdf.setFillColor(239, 68, 68) // red-500
    pdf.circle(rightX + 4, strategyY - 1, 0.8, 'F')
    pdf.text('Lead with economic buyers', rightX + 7, strategyY)
    strategyY += 3.5
    
    // Yellow bullet
    pdf.setFillColor(234, 179, 8) // yellow-500
    pdf.circle(rightX + 4, strategyY - 1, 0.8, 'F')
    pdf.text('Coordinate with influencers', rightX + 7, strategyY)
    strategyY += 3.5
    
    // Green bullet
    pdf.setFillColor(21, 128, 61) // green-600
    pdf.circle(rightX + 4, strategyY - 1, 0.8, 'F')
    pdf.text('Validate with end users', rightX + 7, strategyY)
  }
  
  currentY += maxHeight + 8
  
  return currentY
}

/**
 * Render Why These Actions section
 */
function renderWhyTheseActions(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  // Skip section if no rationale and no supporting evidence
  if (!data.rationale && data.supportingEvidence.length === 0) {
    return currentY
  }
  
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
  
  // Rationale (only if exists)
  if (data.rationale) {
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    const rationaleLines = pdf.splitTextToSize(sanitizePDF(data.rationale), PDF_CONFIG.page.contentWidth)
    pdf.text(rationaleLines, PDF_CONFIG.page.margin, currentY)
    currentY += rationaleLines.length * 5 + 6
  }
  
  // Supporting evidence (only if exists)
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
      const evidenceLines = pdf.splitTextToSize(sanitizePDF(`• ${evidence}`), PDF_CONFIG.page.contentWidth - 5)
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
  
  // Skip entire section if no actions
  if (!actions || actions.length === 0) {
    return currentY
  }
  
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
    // Skip action if empty
    if (!action.action) return
    // Calculate required space for this action (including email template)
    const estimatedSpace = action.emailTemplate ? 60 : 35
    currentY = checkPageBreak(pdf, currentY, estimatedSpace, 'Battle Plan')
    
    // Action number and title
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...PDF_CONFIG.colors.primary)
    pdf.setFont('helvetica', 'bold')
    const actionTitle = sanitizePDF(`${index + 1}. ${action.action}`)
    const titleLines = pdf.splitTextToSize(actionTitle, PDF_CONFIG.page.contentWidth)
    pdf.text(titleLines, PDF_CONFIG.page.margin, currentY)
    currentY += titleLines.length * 5 + 3
    
    // Rationale
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    const rationaleLines = pdf.splitTextToSize(sanitizePDF(action.rationale), PDF_CONFIG.page.contentWidth)
    pdf.text(rationaleLines, PDF_CONFIG.page.margin, currentY)
    currentY += rationaleLines.length * 5 + 3
    
    // Timeline and channels
    pdf.setFontSize(PDF_CONFIG.fonts.small.size)
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    pdf.text(sanitizePDF(`Timeline: ${action.timeline} | Channels: ${action.channels.join(', ')}`), PDF_CONFIG.page.margin, currentY)
    currentY += 6
    
    // Email template if present
    if (action.emailTemplate && action.emailTemplate.body) {
      // Calculate email template space with extra buffer
      const emailBodyLines = pdf.splitTextToSize(
        sanitizePDF(action.emailTemplate.body), 
        PDF_CONFIG.page.contentWidth - 18
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
      
      // Email Template header
      pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
      pdf.setTextColor(...PDF_CONFIG.colors.blue)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Email Template:', PDF_CONFIG.page.margin + 6, currentY)
      currentY += 7
      
      // Subject line
      pdf.setFontSize(PDF_CONFIG.fonts.body.size)
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      pdf.setFont('helvetica', 'bold')
      pdf.text(sanitizePDF(`Subject: ${action.emailTemplate.subject}`), PDF_CONFIG.page.margin + 6, currentY)
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
  
  // Skip section if no insights
  if (!insights || insights.length === 0) {
    return currentY
  }
  
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
    const insightText = sanitizePDF(`${index + 1}. ${insight}`)
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
  
  // Build sections array, filtering empty categories
  const sections = [
    data.buyingSignals.length > 0 && { title: 'Buying Signals Detected', items: data.buyingSignals, color: PDF_CONFIG.colors.green },
    data.painIndicators.length > 0 && { title: 'Pain Indicators', items: data.painIndicators, color: PDF_CONFIG.colors.red },
    data.concerns.length > 0 && { title: 'Concerns to Address', items: data.concerns, color: PDF_CONFIG.colors.orange },
    data.competitiveIntel.length > 0 && { title: 'Competitive Intelligence', items: data.competitiveIntel, color: PDF_CONFIG.colors.purple }
  ].filter((section): section is { title: string; items: string[]; color: [number, number, number] } => Boolean(section))
  
  // Skip entire section if no data in any category
  if (sections.length === 0) {
    return currentY
  }
  
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
  
  sections.forEach((section) => {
    // Pre-calculate space needed for entire section
    let sectionHeight = 10 // Header + padding
    section.items.forEach((item: string) => {
      const itemLines = pdf.splitTextToSize(sanitizePDF(`• ${item}`), PDF_CONFIG.page.contentWidth - 5)
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
      const itemLines = pdf.splitTextToSize(sanitizePDF(`• ${item}`), PDF_CONFIG.page.contentWidth - 5)
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
