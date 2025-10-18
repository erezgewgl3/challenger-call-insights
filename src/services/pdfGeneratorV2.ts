/**
 * PDF Generator V2 - Text-Based Rendering
 * Uses jsPDF and jspdf-autotable for native text rendering
 * Produces crisp, searchable PDFs with 80% smaller file sizes
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PDFContentData } from '@/types/pdfExport'

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
  pdf.text(header.title, PDF_CONFIG.page.margin, 22)
  
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
  
  const tableData = [
    ['Deal Heat', 'Power Center', 'Momentum', 'Competitive Edge'],
    [
      `${data.dealHeat.emoji} ${data.dealHeat.level}\n${data.dealHeat.description}`,
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
  currentY += 8
  
  // Overview
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  const overviewLines = pdf.splitTextToSize(data.overview, PDF_CONFIG.page.contentWidth)
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
  const situationLines = pdf.splitTextToSize(data.clientSituation, colWidth)
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
    pdf.text(`• ${topic}`, rightColX, topicY)
    topicY += 5
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
  currentY += 10
  
  // Define grid: 2 columns x 3 rows
  const colWidth = (PDF_CONFIG.page.contentWidth - 5) / 2
  const boxHeight = 22
  
  const boxes = [
    { title: 'Critical Pain', items: data.criticalPain, color: PDF_CONFIG.colors.red },
    { title: 'Decision Criteria', items: data.decisionCriteria, color: PDF_CONFIG.colors.blue },
    { title: 'Timeline Driver', items: [data.timelineDriver], color: PDF_CONFIG.colors.orange },
    { title: 'Buying Signals', items: data.buyingSignals, color: PDF_CONFIG.colors.green },
    { title: 'Competitive Landscape', items: data.competitiveLandscape, color: PDF_CONFIG.colors.purple },
  ]
  
  boxes.forEach((box, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = PDF_CONFIG.page.margin + (col * (colWidth + 5))
    const y = currentY + (row * (boxHeight + 3))
    
    // Box background
    pdf.setFillColor(...PDF_CONFIG.colors.lightGray)
    pdf.rect(x, y, colWidth, boxHeight, 'F')
    
    // Box title with color accent
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...box.color)
    pdf.setFont('helvetica', 'bold')
    pdf.text(box.title, x + 2, y + 5)
    
    // Box items
    pdf.setFontSize(PDF_CONFIG.fonts.small.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    let itemY = y + 10
    box.items.slice(0, 2).forEach((item: string) => {
      const itemLines = pdf.splitTextToSize(`• ${item}`, colWidth - 4)
      pdf.text(itemLines, x + 2, itemY)
      itemY += itemLines.length * 4
    })
  })
  
  currentY += Math.ceil(boxes.length / 2) * (boxHeight + 3) + PDF_CONFIG.spacing.sectionGap
  
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
    const lines = pdf.splitTextToSize(strategy.value, PDF_CONFIG.page.contentWidth)
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
  currentY += 8
  
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  const rationaleLines = pdf.splitTextToSize(data.rationale, PDF_CONFIG.page.contentWidth)
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
      const evidenceLines = pdf.splitTextToSize(`• ${evidence}`, PDF_CONFIG.page.contentWidth - 5)
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
  currentY += 10
  
  actions.forEach((action, index) => {
    currentY = checkPageBreak(pdf, currentY, 35, 'Battle Plan')
    
    // Action number and title
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...PDF_CONFIG.colors.primary)
    pdf.setFont('helvetica', 'bold')
    const actionTitle = `${index + 1}. ${action.action}`
    const titleLines = pdf.splitTextToSize(actionTitle, PDF_CONFIG.page.contentWidth)
    pdf.text(titleLines, PDF_CONFIG.page.margin, currentY)
    currentY += titleLines.length * 5 + 3
    
    // Rationale
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    const rationaleLines = pdf.splitTextToSize(action.rationale, PDF_CONFIG.page.contentWidth)
    pdf.text(rationaleLines, PDF_CONFIG.page.margin, currentY)
    currentY += rationaleLines.length * 5 + 3
    
    // Timeline and channels
    pdf.setFontSize(PDF_CONFIG.fonts.small.size)
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    pdf.text(`Timeline: ${action.timeline} | Channels: ${action.channels.join(', ')}`, PDF_CONFIG.page.margin, currentY)
    currentY += 6
    
    // Email template if present
    if (action.emailTemplate) {
      currentY = checkPageBreak(pdf, currentY, 25, 'Email Template')
      
      pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
      pdf.setTextColor(...PDF_CONFIG.colors.blue)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Email Template:', PDF_CONFIG.page.margin + 5, currentY)
      currentY += 6
      
      pdf.setFontSize(PDF_CONFIG.fonts.body.size)
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Subject: ${action.emailTemplate.subject}`, PDF_CONFIG.page.margin + 5, currentY)
      currentY += 5
      
      pdf.setFont('helvetica', 'normal')
      const bodyLines = pdf.splitTextToSize(action.emailTemplate.body, PDF_CONFIG.page.contentWidth - 10)
      pdf.text(bodyLines, PDF_CONFIG.page.margin + 5, currentY)
      currentY += bodyLines.length * 5 + 3
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
  currentY += 8
  
  pdf.setFontSize(PDF_CONFIG.fonts.body.size)
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  pdf.setFont('helvetica', 'normal')
  
  insights.forEach((insight, index) => {
    const insightText = `${index + 1}. ${insight}`
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
  currentY += 10
  
  const sections = [
    { title: 'Buying Signals Detected', items: data.buyingSignals, color: PDF_CONFIG.colors.green },
    { title: 'Pain Indicators', items: data.painIndicators, color: PDF_CONFIG.colors.red },
    { title: 'Concerns to Address', items: data.concerns, color: PDF_CONFIG.colors.orange },
    { title: 'Competitive Intelligence', items: data.competitiveIntel, color: PDF_CONFIG.colors.purple }
  ]
  
  sections.forEach(section => {
    currentY = checkPageBreak(pdf, currentY, 20, section.title)
    
    pdf.setFontSize(PDF_CONFIG.fonts.subheading.size)
    pdf.setTextColor(...section.color)
    pdf.setFont('helvetica', 'bold')
    pdf.text(section.title, PDF_CONFIG.page.margin, currentY)
    currentY += 6
    
    pdf.setFontSize(PDF_CONFIG.fonts.body.size)
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    pdf.setFont('helvetica', 'normal')
    section.items.forEach((item: string) => {
      const itemLines = pdf.splitTextToSize(`• ${item}`, PDF_CONFIG.page.contentWidth - 5)
      pdf.text(itemLines, PDF_CONFIG.page.margin + 5, currentY)
      currentY += itemLines.length * 5
    })
    currentY += 5
  })
  
  return currentY
}

/**
 * Smart page break management
 */
function checkPageBreak(pdf: jsPDF, currentY: number, requiredSpace: number, sectionName?: string): number {
  if (currentY + requiredSpace > PDF_CONFIG.page.height - PDF_CONFIG.page.margin) {
    pdf.addPage()
    const pageNum = pdf.getNumberOfPages()
    return addPageHeader(pdf, sectionName || 'Sales Analysis', pageNum)
  }
  return currentY
}
