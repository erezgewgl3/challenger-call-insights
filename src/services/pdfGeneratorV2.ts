/**
 * PDF Generator V2 - Text-Based Rendering
 * Uses jsPDF and jspdf-autotable for native text rendering
 * Produces crisp, searchable PDFs with 80% smaller file sizes
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PDFContentData } from '@/types/pdfExport'
import { capitalizeSentences } from '@/lib/utils'
import { RUBIK_REGULAR_BASE64, RUBIK_BOLD_BASE64 } from '@/lib/fonts/rubik-fonts'
import { containsHebrew, processBiDiText, shouldUseRTL, reverseText } from '@/lib/fonts/hebrew-utils'

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
 * Registers Hebrew fonts (Rubik) with jsPDF
 * Only registers if base64 strings are provided
 */
function registerHebrewFonts(pdf: jsPDF): boolean {
  try {
    // Check if fonts are actually provided (not placeholder text)
    if (RUBIK_REGULAR_BASE64.includes('PASTE_YOUR') || RUBIK_REGULAR_BASE64.length < 1000) {
      console.log('⚠️ Hebrew fonts not configured - using default fonts only')
      return false
    }

    console.log('🔤 Registering Hebrew fonts...')
    
    // Register Rubik Regular
    pdf.addFileToVFS('Rubik-Regular.ttf', RUBIK_REGULAR_BASE64)
    pdf.addFont('Rubik-Regular.ttf', 'Rubik', 'normal')
    
    // Register Rubik Bold
    pdf.addFileToVFS('Rubik-Bold.ttf', RUBIK_BOLD_BASE64)
    pdf.addFont('Rubik-Bold.ttf', 'Rubik', 'bold')
    
    console.log('✅ Hebrew fonts registered successfully')
    return true
  } catch (error) {
    console.error('❌ Failed to register Hebrew fonts:', error)
    return false
  }
}

/**
 * Calculate precise line height in MM based on font size
 */
function getLineHeightMM(pdf: jsPDF, fontSize: number): number {
  const PT_TO_MM = 25.4 / 72
  return pdf.getLineHeightFactor() * fontSize * PT_TO_MM
}

/**
 * Measure wrapped lines with exact font that will be used for rendering
 * CRITICAL: Uses ORIGINAL text for splitting to avoid BiDi control character width issues
 */
function measureWrappedLines(
  pdf: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontStyle: 'normal' | 'bold' = 'normal'
): { lines: string[], heightMM: number } {
  const hasHebrew = containsHebrew(text)
  const fontName = (hasHebrew && pdf.getFontList()['Rubik']) ? 'Rubik' : 'helvetica'
  
  // Temporarily set font for measurement
  const prevFont = pdf.getFont()
  const prevSize = pdf.getFontSize()
  
  pdf.setFont(fontName, fontStyle)
  pdf.setFontSize(fontSize)
  
  // CRITICAL: Split using ORIGINAL text - jsPDF needs clean text for accurate width calculation
  // BiDi control characters break splitTextToSize width calculations
  const lines = pdf.splitTextToSize(text, maxWidth)
  const lineHeightMM = getLineHeightMM(pdf, fontSize)
  const heightMM = lines.length * lineHeightMM
  
  // Restore previous font
  pdf.setFont(prevFont.fontName, prevFont.fontStyle)
  pdf.setFontSize(prevSize)
  
  return { lines, heightMM }
}

/**
 * Smart text rendering with automatic Hebrew/RTL support
 * Detects Hebrew and switches font/direction automatically
 * CRITICAL: Splits on ORIGINAL text first, then processes each line for BiDi
 */
function renderSmartText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number
    fontStyle?: 'normal' | 'bold'
    align?: 'left' | 'center' | 'right'
    maxWidth?: number
    lineHeight?: number
  } = {}
): number {
  if (!text) return y

  const fontSize = options.fontSize || PDF_CONFIG.fonts.body.size
  const fontStyle = options.fontStyle || 'normal'
  const hasHebrew = containsHebrew(text)
  const isRTL = hasHebrew && shouldUseRTL(text)
  
  // Choose font
  const fontName = (hasHebrew && pdf.getFontList()['Rubik']) ? 'Rubik' : 'helvetica'
  pdf.setFont(fontName, fontStyle)
  pdf.setFontSize(fontSize)
  
  const lineHeight = options.lineHeight || getLineHeightMM(pdf, fontSize)

  // Handle text wrapping if maxWidth provided
  if (options.maxWidth) {
    // CRITICAL: Split using ORIGINAL text for accurate width calculation
    const lines = pdf.splitTextToSize(text, options.maxWidth)
    
    lines.forEach((line: string, index: number) => {
      const lineY = y + (index * lineHeight)
      
      // Process each line individually for BiDi/RTL after splitting
      const needsBiDi = hasHebrew && /[A-Za-z0-9]/.test(line) && /[\u0590-\u05FF]/.test(line)
      const processedLine = needsBiDi ? processBiDiText(line) : hasHebrew ? reverseText(line) : line
      
      if (isRTL) {
        pdf.text(processedLine, x + options.maxWidth, lineY, { align: 'right' })
      } else {
        if (options.align === 'right') {
          pdf.text(processedLine, x + options.maxWidth, lineY, { align: 'right' })
        } else if (options.align === 'center') {
          pdf.text(processedLine, x + (options.maxWidth / 2), lineY, { align: 'center' })
        } else {
          pdf.text(processedLine, x, lineY, { align: 'left' })
        }
      }
    })
    return y + (lines.length * lineHeight)
  }

  // Single line rendering (no wrapping)
  const needsBiDi = hasHebrew && /[A-Za-z0-9]/.test(text) && /[\u0590-\u05FF]/.test(text)
  const processedText = needsBiDi ? processBiDiText(text) : hasHebrew ? reverseText(text) : text
  
  if (isRTL) {
    const anchorX = options.maxWidth ? x + options.maxWidth : x
    pdf.text(processedText, anchorX, y, { align: 'right' })
  } else {
    pdf.text(processedText, x, y, { align: options.align || 'left' })
  }

  return y + lineHeight
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

  // Register Hebrew fonts at the start
  const hasHebrew = registerHebrewFonts(pdf)
  
  // Debug: Log font list to verify Rubik registration
  console.log('📋 Registered fonts:', Object.keys(pdf.getFontList()))
  console.log('🔤 Hebrew support:', hasHebrew ? 'enabled' : 'disabled')

  let currentY = PDF_CONFIG.page.margin

  // Page 1: Header and Deal Command Center
  currentY = renderHeader(pdf, contentData.header)
  currentY = renderDealCommandCenter(pdf, contentData.dealCommandCenter, currentY)
  currentY = renderWinStrategy(pdf, contentData.dealCommandCenter, currentY)
  
  // Deal Blockers - CRITICAL: Display immediately after Win Strategy
  currentY = checkPageBreak(pdf, currentY, 40, contentData.header.title)
  currentY = renderDealBlockers(pdf, contentData.dealBlockers, currentY)
  
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
  
  // Coaching Insights (only if real insights exist)
  if (contentData.coachingInsights) {
    currentY = checkPageBreak(pdf, currentY, 80, contentData.header.title)
    currentY = renderCoachingInsights(pdf, contentData.coachingInsights, currentY)
  }

  return pdf
}

/**
 * Render header section (first page only)
 */
function renderHeader(pdf: jsPDF, header: any): number {
  // Title
  renderSmartText(pdf, sanitizePDF(header.title), PDF_CONFIG.page.margin, 22, {
    fontSize: PDF_CONFIG.fonts.title.size,
    fontStyle: 'bold'
  })
  
  // Subtitle
  pdf.setFontSize(13)
  pdf.setTextColor(...PDF_CONFIG.colors.gray)
  renderSmartText(pdf, 'Sales Intelligence Report', PDF_CONFIG.page.margin, 32, {
    fontSize: 13,
    fontStyle: 'normal'
  })
  
  // Date and duration on same line (matching screen format)
  const dateText = sanitizePDF(header.date)
  const durationText = header.duration ? ` • Duration: ${sanitizePDF(header.duration)}` : ''
  renderSmartText(pdf, `Analyzed ${dateText}${durationText}`, PDF_CONFIG.page.margin, 40, {
    fontSize: 13,
    fontStyle: 'normal'
  })
  
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
  
  renderSmartText(pdf, `${sanitizePDF(title)} - Page ${pageNum}`, PDF_CONFIG.page.margin, 12, {
    fontSize: 12,
    fontStyle: 'normal'
  })
  
  // Page number on right
  renderSmartText(pdf, `Page ${pageNum}`, pageWidth - PDF_CONFIG.page.margin, 12, {
    fontSize: 10,
    fontStyle: 'normal',
    align: 'right'
  })
  
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
  
  renderSmartText(pdf, 'Deal Command Center', PDF_CONFIG.page.margin, startY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Deal Command Center'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
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
  
  // Determine if Rubik font is available for Hebrew
  const isRubikAvailable = Boolean(pdf.getFontList()['Rubik'])
  
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
      cellPadding: 4,
      font: isRubikAvailable ? 'Rubik' : 'helvetica'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: PDF_CONFIG.colors.darkText,
      font: isRubikAvailable ? 'Rubik' : 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 42.5 },
      1: { cellWidth: 42.5 },
      2: { cellWidth: 42.5 },
      3: { cellWidth: 42.5 }
    },
    margin: { left: PDF_CONFIG.page.margin, right: PDF_CONFIG.page.margin },
    didParseCell: (data) => {
      // Process Hebrew text in cells
      if (data.cell.text && Array.isArray(data.cell.text)) {
        data.cell.text = data.cell.text.map((line: string) => {
          const sanitized = sanitizePDF(line)
          if (containsHebrew(sanitized)) {
            data.cell.styles.halign = 'right'
            return processBiDiText(sanitized)
          }
          return sanitized
        })
      }
    }
  })
  
  return (pdf as any).lastAutoTable.finalY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Win Strategy section (emerald box below Deal Command Center)
 */
function renderWinStrategy(pdf: jsPDF, data: any, startY: number): number {
  const winStrategy = data.winStrategy
  
  if (!winStrategy) return startY
  
  // Minimal spacing before Win Strategy box
  let currentY = startY - 2
  
  // Measure text with exact font/size that will be used
  const measured = measureWrappedLines(
    pdf,
    sanitizePDF(winStrategy),
    PDF_CONFIG.page.contentWidth - 16,
    9,
    'normal'
  )
  const textHeight = measured.heightMM
  const boxHeight = Math.max(20, textHeight + 12)
  
  // Draw emerald box
  pdf.setFillColor(209, 250, 229) // emerald-100
  pdf.setDrawColor(167, 243, 208) // emerald-200
  pdf.setLineWidth(0.5)
  pdf.roundedRect(PDF_CONFIG.page.margin, currentY, PDF_CONFIG.page.contentWidth, boxHeight, 3, 3, 'FD')
  
  // "Win Strategy" label
  pdf.setTextColor(5, 150, 105) // emerald-700
  renderSmartText(pdf, 'Win Strategy', PDF_CONFIG.page.margin + 5, currentY + 6, {
    fontSize: 11,
    fontStyle: 'bold'
  })
  
  // "Competitive Advantage" badge
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  const badgeText = 'COMPETITIVE ADVANTAGE'
  const badgeWidth = pdf.getTextWidth(badgeText) + 4
  const badgeX = PDF_CONFIG.page.contentWidth + PDF_CONFIG.page.margin - badgeWidth - 5
  
  pdf.setFillColor(16, 185, 129) // emerald-500
  pdf.roundedRect(badgeX, currentY + 3.5, badgeWidth, 5, 1, 1, 'F')
  pdf.setTextColor(255, 255, 255)
  renderSmartText(pdf, badgeText, badgeX + 2, currentY + 6.8, {
    fontSize: 7,
    fontStyle: 'bold'
  })
  
  // Strategy text with consistent line height
  pdf.setTextColor(31, 41, 55) // gray-800
  const contentStartY = currentY + 12
  renderSmartText(pdf, sanitizePDF(winStrategy), PDF_CONFIG.page.margin + 5, contentStartY, {
    fontSize: 9,
    fontStyle: 'normal',
    maxWidth: PDF_CONFIG.page.contentWidth - 16
  })
  
  return currentY + boxHeight + 8
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
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Call Summary', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Call Summary'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 8
  
  // Overview (only if exists)
  if (data.overview) {
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    currentY = renderSmartText(pdf, sanitizePDF(data.overview), PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.body.size,
      fontStyle: 'normal',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
    currentY += 6
  }
  
  // Two-column grid (only if we have client situation or main topics)
  if (data.clientSituation || data.mainTopics.length > 0) {
    const colWidth = (PDF_CONFIG.page.contentWidth - 5) / 2
    
    // Client Situation (left column, only if exists)
    let situationEndY = currentY
    if (data.clientSituation) {
      pdf.setTextColor(...PDF_CONFIG.colors.primary)
      renderSmartText(pdf, 'Client Situation', PDF_CONFIG.page.margin, currentY, {
        fontSize: PDF_CONFIG.fonts.subheading.size,
        fontStyle: 'bold'
      })
      currentY += 6
      
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      situationEndY = renderSmartText(pdf, sanitizePDF(data.clientSituation), PDF_CONFIG.page.margin, currentY, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontStyle: 'normal',
        maxWidth: colWidth
      })
    }
    
    // Main Topics (right column, only if exists)
    let topicEndY = currentY
    if (data.mainTopics.length > 0) {
      const rightColX = PDF_CONFIG.page.margin + colWidth + 5
      const topicStartY = data.clientSituation ? currentY - 6 : currentY
      pdf.setTextColor(...PDF_CONFIG.colors.primary)
      renderSmartText(pdf, 'Main Topics', rightColX, topicStartY, {
        fontSize: PDF_CONFIG.fonts.subheading.size,
        fontStyle: 'bold'
      })
      
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      let topicY = currentY
      data.mainTopics.forEach((topic: string) => {
        topicY = renderSmartText(pdf, sanitizePDF(`• ${topic}`), rightColX, topicY, {
          fontSize: PDF_CONFIG.fonts.body.size,
          fontStyle: 'normal',
          maxWidth: colWidth - 5
        })
      })
      topicEndY = topicY
    }
    
    // Set currentY to the max of both columns
    currentY = Math.max(situationEndY, topicEndY) + PDF_CONFIG.spacing.sectionGap
  }
  
  return currentY
}

/**
 * Render Coaching Insights section
 */
function renderCoachingInsights(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Coaching Insights', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
    
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Coaching Insights'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const coachingHeaderWidth = pdf.getTextWidth(headerText)
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + coachingHeaderWidth, currentY + 1)
    
  currentY += 8
  
  // What Worked Well
  if (data.whatWorkedWell.length > 0) {
    pdf.setTextColor(...PDF_CONFIG.colors.green)
    renderSmartText(pdf, 'What You Did Well', PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.subheading.size,
      fontStyle: 'bold'
    })
    currentY += 6
    
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    
    data.whatWorkedWell.forEach((item: string) => {
      currentY = renderSmartText(pdf, sanitizePDF(`• ${item}`), PDF_CONFIG.page.margin + 3, currentY, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontStyle: 'normal',
        maxWidth: PDF_CONFIG.page.contentWidth - 5
      })
    })
    currentY += 4
  }
  
  // Opportunities
  pdf.setTextColor(...PDF_CONFIG.colors.orange)
  renderSmartText(pdf, 'Opportunities for Improvement', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.subheading.size,
    fontStyle: 'bold'
  })
  currentY += 6
  
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  
  if (Array.isArray(data.missedOpportunities)) {
    data.missedOpportunities.forEach((item: string) => {
      currentY = renderSmartText(pdf, sanitizePDF(`• ${item}`), PDF_CONFIG.page.margin + 3, currentY, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontStyle: 'normal',
        maxWidth: PDF_CONFIG.page.contentWidth - 5
      })
    })
  } else {
    currentY = renderSmartText(pdf, sanitizePDF(data.missedOpportunities), PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.body.size,
      fontStyle: 'normal',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
  }
  currentY += 4
  
  // Focus Area
  pdf.setTextColor(...PDF_CONFIG.colors.blue)
  renderSmartText(pdf, 'Focus Area for Next Call', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.subheading.size,
    fontStyle: 'bold'
  })
  currentY += 6
  
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  currentY = renderSmartText(pdf, sanitizePDF(capitalizeSentences(data.focusArea)), PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.body.size,
    fontStyle: 'normal',
    maxWidth: PDF_CONFIG.page.contentWidth
  })
  
  return currentY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Deal Blockers section
 */
function renderDealBlockers(pdf: jsPDF, data: any, startY: number): number {
  if (!data.hasBlockers) return startY
  
  let currentY = startY
  
  pdf.setTextColor(...PDF_CONFIG.colors.red)
  renderSmartText(pdf, 'Deal Blockers', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  currentY += 8
  
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  currentY = renderSmartText(pdf, sanitizePDF(data.blockers!), PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.body.size,
    fontStyle: 'normal',
    maxWidth: PDF_CONFIG.page.contentWidth
  })
  
  return currentY + PDF_CONFIG.spacing.sectionGap
}

/**
 * Render Strategic Intelligence section
 */
function renderStrategicIntelligence(pdf: jsPDF, data: any, startY: number): number {
  let currentY = startY
  
  // Section heading
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Strategic Intelligence & Approach', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Strategic Intelligence & Approach'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
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
      const measured = measureWrappedLines(
        pdf,
        sanitizePDF(`• ${item}`),
        colWidth - 4,
        PDF_CONFIG.fonts.small.size,
        'normal'
      )
      contentHeight += measured.heightMM
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
    
    pdf.setTextColor(...leftBox.color)
    renderSmartText(pdf, leftBox.title, leftX + 2, rowY + 5, {
      fontSize: PDF_CONFIG.fonts.subheading.size,
      fontStyle: 'bold'
    })
    
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    let itemY = rowY + 10
    leftBox.items.forEach((item: string) => {
      itemY = renderSmartText(pdf, sanitizePDF(`• ${item}`), leftX + 2, itemY, {
        fontSize: PDF_CONFIG.fonts.small.size,
        fontStyle: 'normal',
        maxWidth: colWidth - 4
      })
    })
    
    // Render right box if exists
    if (rightBox) {
      const rightX = PDF_CONFIG.page.margin + colWidth + 5
      pdf.setFillColor(...PDF_CONFIG.colors.lightGray)
      pdf.rect(rightX, rowY, colWidth, rowHeight, 'F')
      
      pdf.setTextColor(...rightBox.color)
      renderSmartText(pdf, rightBox.title, rightX + 2, rowY + 5, {
        fontSize: PDF_CONFIG.fonts.subheading.size,
        fontStyle: 'bold'
      })
      
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      let rightItemY = rowY + 10
      rightBox.items.forEach((item: string) => {
        rightItemY = renderSmartText(pdf, sanitizePDF(`• ${item}`), rightX + 2, rightItemY, {
          fontSize: PDF_CONFIG.fonts.small.size,
          fontStyle: 'normal',
          maxWidth: colWidth - 4
        })
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
  
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Strategic Assessment', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Strategic Assessment'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
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
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    renderSmartText(pdf, strategy.label, PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.subheading.size,
      fontStyle: 'bold'
    })
    currentY += 5
    
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    currentY = renderSmartText(pdf, sanitizePDF(strategy.value), PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.body.size,
      fontStyle: 'normal',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
    currentY += 4
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
  renderSmartText(pdf, 'Stakeholder Navigation Map', PDF_CONFIG.page.margin + 5, currentY + 8, {
    fontSize: PDF_CONFIG.fonts.subtitle.size,
    fontStyle: 'bold'
  })
  
  currentY += 18
  
  // Calculate column widths (3 columns with gaps)
  const gapWidth = 5
  const columnWidth = (PDF_CONFIG.page.contentWidth - (2 * gapWidth)) / 3
  const leftX = PDF_CONFIG.page.margin
  const middleX = leftX + columnWidth + gapWidth
  const rightX = middleX + columnWidth + gapWidth
  
  // Calculate precise line heights based on font metrics
  const LH8 = getLineHeightMM(pdf, 8)  // For main text (bold)
  const LH7 = getLineHeightMM(pdf, 7)  // For evidence and bullets
  const GAP_AFTER_TEXT = Math.round(LH8 * 0.5) // Small gap before bullets
  
  // Store measured lines to reuse during rendering (prevents drift)
  const econBuyersMeasured: Array<{titleLines: string[], evidenceLines: string[]}> = []
  const keyInfluencersMeasured: Array<{titleLines: string[], evidenceLines: string[]}> = []
  let navStrategyLines: string[] = []
  
  // Calculate dynamic heights for each column based on content
  let economicBuyersHeight = 10 // Base padding
  if (data.economicBuyers && data.economicBuyers.length > 0) {
    data.economicBuyers.slice(0, 2).forEach((buyer: any) => {
      economicBuyersHeight += LH8 // Name
      
      // Measure title lines
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const titleLines = buyer.title ? pdf.splitTextToSize(sanitizePDF(buyer.title), columnWidth - 6) : []
      const evidenceLines = buyer.evidence ? pdf.splitTextToSize(sanitizePDF(buyer.evidence), columnWidth - 6) : []
      econBuyersMeasured.push({ titleLines, evidenceLines })
      
      economicBuyersHeight += titleLines.length * LH8
      economicBuyersHeight += Math.min(evidenceLines.length, 2) * LH7
      if (buyer.isPrimaryContact) {
        economicBuyersHeight += LH7
      }
      economicBuyersHeight += LH7 * 0.5 // Spacing between buyers
    })
  }
  economicBuyersHeight += LH7 // Bottom padding

  let keyInfluencersHeight = 10 // Base padding
  if (data.keyInfluencers && data.keyInfluencers.length > 0) {
    data.keyInfluencers.slice(0, 2).forEach((influencer: any) => {
      keyInfluencersHeight += LH8 // Name
      
      // Measure title lines
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      const titleLines = influencer.title ? pdf.splitTextToSize(sanitizePDF(influencer.title), columnWidth - 6) : []
      const evidenceLines = influencer.evidence ? pdf.splitTextToSize(sanitizePDF(influencer.evidence), columnWidth - 6) : []
      keyInfluencersMeasured.push({ titleLines, evidenceLines })
      
      keyInfluencersHeight += titleLines.length * LH8
      keyInfluencersHeight += Math.min(evidenceLines.length, 2) * LH7
      keyInfluencersHeight += LH7 * 0.5 // Spacing between influencers
    })
  }
  keyInfluencersHeight += LH7 // Bottom padding

  // Normalize navigation strategy text to remove hidden whitespace
  const navRaw = sanitizePDF(data.navigationStrategy || '')
  const navText = navRaw
    .replace(/\r\n/g, '\n')             // normalize CRLF
    .replace(/\s+\n/g, '\n')            // trim spaces before newlines
    .replace(/\n{2,}/g, '\n')           // collapse multiple blank lines
    .replace(/[ \t]{2,}/g, ' ')         // collapse runs of spaces/tabs
    .trim()
  
  let navigationStrategyHeight = 10
  if (navText) {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    navStrategyLines = pdf.splitTextToSize(navText, columnWidth - 6)
    navigationStrategyHeight += navStrategyLines.length * LH8 // text lines
    navigationStrategyHeight += GAP_AFTER_TEXT                // gap after text
    navigationStrategyHeight += 3 * LH7                       // 3 bullets
    navigationStrategyHeight += LH7                           // bottom padding
  } else {
    navigationStrategyHeight += 6
  }

  // Debug logging for height verification
  console.log('Stakeholder Navigation metrics:', {
    fontForTitleMeasure: '8-normal',
    fontForEvidenceMeasure: '7-normal',
    fontForNavMeasure: '8-bold',
    LH8: LH8.toFixed(2),
    LH7: LH7.toFixed(2),
    GAP_AFTER_TEXT,
    navTextLength: navText.length,
    navLines: navStrategyLines.length,
    economicBuyersHeight: economicBuyersHeight.toFixed(2),
    keyInfluencersHeight: keyInfluencersHeight.toFixed(2),
    navigationStrategyHeight: navigationStrategyHeight.toFixed(2)
  })

  const maxHeight = Math.max(economicBuyersHeight, keyInfluencersHeight, navigationStrategyHeight, 28)

  // Update page break check with actual calculated height
  currentY = checkPageBreak(pdf, currentY - 18, maxHeight + 30, 'Stakeholder Navigation Map') + 18

  // Economic Buyers (Left Column - Red theme)
  if (data.economicBuyers && data.economicBuyers.length > 0) {
    pdf.setFillColor(254, 242, 242) // red-50
    pdf.setDrawColor(254, 202, 202) // red-200
    pdf.setLineWidth(0.5)
    pdf.roundedRect(leftX, currentY, columnWidth, maxHeight, 2, 2, 'FD')
    
    pdf.setTextColor(153, 27, 27) // red-900
    renderSmartText(pdf, 'Economic Buyers', leftX + 3, currentY + 5, {
      fontSize: 9,
      fontStyle: 'bold'
    })
    
    pdf.setTextColor(55, 65, 81) // gray-700
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    
    const LH8 = getLineHeightMM(pdf, 8)
    const LH7 = getLineHeightMM(pdf, 7)
    
    let buyerY = currentY + 10
    data.economicBuyers.slice(0, 2).forEach((buyer: any, idx: number) => {
      if (buyer.name) {
        // Name (bold)
        pdf.setTextColor(55, 65, 81) // gray-700
        buyerY = renderSmartText(pdf, sanitizePDF(buyer.name), leftX + 3, buyerY, {
          fontSize: 8,
          fontStyle: 'bold'
        })
        
        // Title - use pre-measured lines
        if (econBuyersMeasured[idx]?.titleLines.length > 0) {
          pdf.setTextColor(107, 114, 128) // gray-500
          econBuyersMeasured[idx].titleLines.forEach((line: string) => {
            buyerY = renderSmartText(pdf, line, leftX + 3, buyerY, {
              fontSize: 8,
              fontStyle: 'normal',
              maxWidth: columnWidth - 6
            })
          })
        }
        
        // Evidence quote - use pre-measured lines
        if (econBuyersMeasured[idx]?.evidenceLines.length > 0) {
          pdf.setTextColor(107, 114, 128) // gray-500
          econBuyersMeasured[idx].evidenceLines.slice(0, 2).forEach((line: string) => {
            buyerY = renderSmartText(pdf, line, leftX + 3, buyerY, {
              fontSize: 7,
              fontStyle: 'normal',
              maxWidth: columnWidth - 6
            })
          })
        }
        
        // Primary Contact badge
        if (buyer.isPrimaryContact) {
          pdf.setTextColor(107, 114, 128) // gray-500
          buyerY = renderSmartText(pdf, 'Primary Contact', leftX + 3, buyerY, {
            fontSize: 6,
            fontStyle: 'normal'
          })
        }
        
        buyerY += LH7 * 0.5
      }
    })
  }
  
  // Key Influencers (Middle Column - Yellow theme)
  if (data.keyInfluencers && data.keyInfluencers.length > 0) {
    pdf.setFillColor(254, 252, 232) // yellow-50
    pdf.setDrawColor(254, 240, 138) // yellow-200
    pdf.setLineWidth(0.5)
    pdf.roundedRect(middleX, currentY, columnWidth, maxHeight, 2, 2, 'FD')
    
    pdf.setTextColor(120, 53, 15) // yellow-900
    renderSmartText(pdf, 'Key Influencers', middleX + 3, currentY + 5, {
      fontSize: 9,
      fontStyle: 'bold'
    })
    
    pdf.setTextColor(55, 65, 81) // gray-700
    
    const LH8 = getLineHeightMM(pdf, 8)
    const LH7 = getLineHeightMM(pdf, 7)
    
    let influencerY = currentY + 10
    data.keyInfluencers.slice(0, 2).forEach((influencer: any, idx: number) => {
      if (influencer.name) {
        pdf.setTextColor(55, 65, 81)
        influencerY = renderSmartText(pdf, sanitizePDF(influencer.name), middleX + 3, influencerY, {
          fontSize: 8,
          fontStyle: 'bold'
        })
        
        if (keyInfluencersMeasured[idx]?.titleLines.length > 0) {
          pdf.setTextColor(107, 114, 128)
          keyInfluencersMeasured[idx].titleLines.forEach((line: string) => {
            influencerY = renderSmartText(pdf, line, middleX + 3, influencerY, {
              fontSize: 8,
              fontStyle: 'normal',
              maxWidth: columnWidth - 6
            })
          })
        }
        
        if (keyInfluencersMeasured[idx]?.evidenceLines.length > 0) {
          pdf.setTextColor(107, 114, 128)
          keyInfluencersMeasured[idx].evidenceLines.slice(0, 2).forEach((line: string) => {
            influencerY = renderSmartText(pdf, line, middleX + 3, influencerY, {
              fontSize: 7,
              fontStyle: 'normal',
              maxWidth: columnWidth - 6
            })
          })
        }
        
        influencerY += LH7 * 0.5
      }
    })
  }
  
  // Navigation Strategy (Right Column - Blue theme)
  if (navText) {
    pdf.setFillColor(239, 246, 255) // blue-50
    pdf.setDrawColor(191, 219, 254) // blue-200
    pdf.setLineWidth(0.5)
    pdf.roundedRect(rightX, currentY, columnWidth, maxHeight, 2, 2, 'FD')
    
    pdf.setTextColor(30, 58, 138) // blue-900
    renderSmartText(pdf, 'Navigation Strategy', rightX + 3, currentY + 5, {
      fontSize: 9,
      fontStyle: 'bold'
    })
    
    pdf.setTextColor(30, 58, 138) // blue-900
    
    // Use pre-measured lines (no re-splitting)
    let strategyY = currentY + 10
    navStrategyLines.forEach((line: string) => {
      strategyY = renderSmartText(pdf, line, rightX + 3, strategyY, {
        fontSize: 8,
        fontStyle: 'bold'
      })
    })
    
    strategyY += GAP_AFTER_TEXT
    
    // Bullet points
    pdf.setTextColor(55, 65, 81) // gray-700
    
    // Red bullet
    pdf.setFillColor(239, 68, 68) // red-500
    pdf.circle(rightX + 4, strategyY - 1, 0.8, 'F')
    renderSmartText(pdf, 'Lead with economic buyers', rightX + 7, strategyY, {
      fontSize: 7,
      fontStyle: 'normal'
    })
    strategyY += LH7
    
    // Yellow bullet
    pdf.setFillColor(234, 179, 8) // yellow-500
    pdf.circle(rightX + 4, strategyY - 1, 0.8, 'F')
    renderSmartText(pdf, 'Coordinate with influencers', rightX + 7, strategyY, {
      fontSize: 7,
      fontStyle: 'normal'
    })
    strategyY += LH7
    
    // Green bullet
    pdf.setFillColor(21, 128, 61) // green-600
    pdf.circle(rightX + 4, strategyY - 1, 0.8, 'F')
    renderSmartText(pdf, 'Validate with end users', rightX + 7, strategyY, {
      fontSize: 7,
      fontStyle: 'normal'
    })
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
  
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Why These Actions?', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Why These Actions?'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 8
  
  // Rationale (only if exists)
  if (data.rationale) {
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    currentY = renderSmartText(pdf, sanitizePDF(data.rationale), PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.body.size,
      fontStyle: 'normal',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
    currentY += 6
  }
  
  // Supporting evidence (only if exists)
  if (data.supportingEvidence.length > 0) {
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    renderSmartText(pdf, 'Supporting Evidence:', PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.subheading.size,
      fontStyle: 'bold'
    })
    currentY += 6
    
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    data.supportingEvidence.forEach((evidence: string) => {
      currentY = renderSmartText(pdf, sanitizePDF(`• ${evidence}`), PDF_CONFIG.page.margin + 5, currentY, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontStyle: 'normal',
        maxWidth: PDF_CONFIG.page.contentWidth - 5
      })
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
  
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Battle Plan Execution Timeline', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Battle Plan Execution Timeline'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
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
    pdf.setTextColor(...PDF_CONFIG.colors.primary)
    const actionTitle = sanitizePDF(`${index + 1}. ${action.action}`)
    currentY = renderSmartText(pdf, actionTitle, PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.subheading.size,
      fontStyle: 'bold',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
    currentY += 3
    
    // Rationale
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    currentY = renderSmartText(pdf, sanitizePDF(action.rationale), PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.body.size,
      fontStyle: 'normal',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
    currentY += 3
    
    // Timeline and channels
    pdf.setTextColor(...PDF_CONFIG.colors.gray)
    currentY = renderSmartText(pdf, sanitizePDF(`Timeline: ${action.timeline} | Channels: ${action.channels.join(', ')}`), PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.small.size,
      fontStyle: 'normal',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
    currentY += 6
    
    // Email template if present
    if (action.emailTemplate && action.emailTemplate.body) {
      // Calculate exact dimensions
      const textWidth = PDF_CONFIG.page.contentWidth - 12
      const wrapWidth = textWidth - 0.5

      // Ensure measurement font matches rendering
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(PDF_CONFIG.fonts.body.size)
      const subjectLines = pdf.splitTextToSize(
        sanitizePDF(`Subject: ${action.emailTemplate.subject || ''}`),
        wrapWidth
      )

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(PDF_CONFIG.fonts.body.size)
      const bodyLines = pdf.splitTextToSize(
        sanitizePDF(action.emailTemplate.body || ''),
        wrapWidth
      )
      
      // Precise spacing
      const lhBody = getLineHeightMM(pdf, PDF_CONFIG.fonts.body.size)
      const lhSub = getLineHeightMM(pdf, PDF_CONFIG.fonts.subheading.size)
      const paddingTop = 4
      const labelGap = 2.5
      const subjectGap = 2
      const paddingBottom = 6
      
      // Calculate exact box height
      const boxHeight = paddingTop + lhSub + labelGap + 
                       (subjectLines.length * lhBody) + subjectGap + 
                       (bodyLines.length * lhBody) + paddingBottom
      
      // Check page break with precise height
      currentY = checkPageBreak(pdf, currentY, boxHeight + 4, 'Email Template')
      
      // Draw box
      const boxX = PDF_CONFIG.page.margin + 3
      const boxY = currentY - paddingTop
      const boxW = PDF_CONFIG.page.contentWidth - 6
      pdf.setDrawColor(...PDF_CONFIG.colors.gray)
      pdf.setLineWidth(0.3)
      pdf.setFillColor(250, 251, 255)
      pdf.rect(boxX, boxY, boxW, boxHeight, 'FD')
      
      // Render text with precise spacing using renderSmartText
      let y = currentY
      
      // Label
      pdf.setTextColor(...PDF_CONFIG.colors.blue)
      y = renderSmartText(pdf, 'Email Template:', PDF_CONFIG.page.margin + 6, y, {
        fontSize: PDF_CONFIG.fonts.subheading.size,
        fontStyle: 'bold'
      })
      y += labelGap
      
      // Subject
      pdf.setTextColor(...PDF_CONFIG.colors.darkText)
      const subjectText = sanitizePDF(`Subject: ${action.emailTemplate.subject || ''}`)
      y = renderSmartText(pdf, subjectText, PDF_CONFIG.page.margin + 6, y, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontStyle: 'bold',
        maxWidth: wrapWidth
      })
      y += subjectGap
      
      // Body
      const bodyText = sanitizePDF(action.emailTemplate.body || '')
      y = renderSmartText(pdf, bodyText, PDF_CONFIG.page.margin + 6, y, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontStyle: 'normal',
        maxWidth: wrapWidth
      })
      
      // Move to after box
      currentY = boxY + boxHeight + 5
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
  
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Deal Acceleration Insights', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Deal Acceleration Insights'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 8
  
  pdf.setTextColor(...PDF_CONFIG.colors.darkText)
  
  insights.forEach((insight, index) => {
    currentY = checkPageBreak(pdf, currentY, 15, 'Deal Insights')
    const insightText = sanitizePDF(`${index + 1}. ${insight}`)
    currentY = renderSmartText(pdf, insightText, PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.body.size,
      fontStyle: 'normal',
      maxWidth: PDF_CONFIG.page.contentWidth
    })
    currentY += 3
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
  
  pdf.setTextColor(...PDF_CONFIG.colors.primary)
  renderSmartText(pdf, 'Competitive Positioning Arsenal', PDF_CONFIG.page.margin, currentY, {
    fontSize: PDF_CONFIG.fonts.heading.size,
    fontStyle: 'bold'
  })
  
  // Add underline to header - measure with correct font for Hebrew
  const headerText = 'Competitive Positioning Arsenal'
  const hasHeaderHebrew = containsHebrew(headerText)
  if (hasHeaderHebrew && pdf.getFontList()['Rubik']) {
    pdf.setFont('Rubik', 'bold')
  } else {
    pdf.setFont('helvetica', 'bold')
  }
  pdf.setFontSize(PDF_CONFIG.fonts.heading.size)
  const headerWidth = pdf.getTextWidth(headerText)
  pdf.setDrawColor(...PDF_CONFIG.colors.primary)
  pdf.setLineWidth(0.5)
  pdf.line(PDF_CONFIG.page.margin, currentY + 1, PDF_CONFIG.page.margin + headerWidth, currentY + 1)
  
  currentY += 10
  
  sections.forEach((section) => {
    // Pre-calculate space needed for entire section
    let sectionHeight = 10 // Header + padding
    section.items.forEach((item: string) => {
      // Calculate height using renderSmartText logic
      sectionHeight += 10 // Approximate per item
    })
    
    // Check if we need a page break for the entire section
    currentY = checkPageBreak(pdf, currentY, sectionHeight, section.title)
    
    // Render section header with count
    pdf.setTextColor(...section.color)
    currentY = renderSmartText(pdf, `${section.title} (${section.items.length})`, PDF_CONFIG.page.margin, currentY, {
      fontSize: PDF_CONFIG.fonts.subheading.size,
      fontStyle: 'bold'
    })
    currentY += 6
    
    // Render all items
    pdf.setTextColor(...PDF_CONFIG.colors.darkText)
    section.items.forEach((item: string) => {
      currentY = renderSmartText(pdf, sanitizePDF(`• ${item}`), PDF_CONFIG.page.margin + 5, currentY, {
        fontSize: PDF_CONFIG.fonts.body.size,
        fontStyle: 'normal',
        maxWidth: PDF_CONFIG.page.contentWidth - 10
      })
      currentY += 2
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
