/**
 * Hebrew Detection Service
 * Scans analysis and transcript data for Hebrew characters
 */

const HEBREW_UNICODE_RANGE = /[\u0590-\u05FF]/

interface HebrewAnalysisReport {
  hasHebrew: boolean
  hebrewFieldCount: number
  totalFieldCount: number
  hebrewFields: string[]
}

/**
 * Detects if a string contains Hebrew characters
 */
function hasHebrewChars(text: any): boolean {
  if (!text) return false
  const str = typeof text === 'string' ? text : JSON.stringify(text)
  return HEBREW_UNICODE_RANGE.test(str)
}

/**
 * Recursively scans an object for Hebrew content
 */
function scanObject(obj: any, path: string = '', hebrewFields: string[] = []): boolean {
  if (!obj) return false
  
  let foundHebrew = false
  
  if (typeof obj === 'string') {
    if (hasHebrewChars(obj)) {
      console.log('🔍 Hebrew detected at:', path)
      hebrewFields.push(path)
      return true
    }
    return false
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      if (scanObject(item, `${path}[${i}]`, hebrewFields)) {
        foundHebrew = true
      }
    })
    return foundHebrew
  }
  
  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldPath = path ? `${path}.${key}` : key
      if (scanObject(value, fieldPath, hebrewFields)) {
        foundHebrew = true
      }
    })
    return foundHebrew
  }
  
  return false
}

/**
 * Detects if any Hebrew content exists in transcript or analysis
 */
export function detectHebrewInAnalysis(transcript: any, analysis: any): boolean {
  const hebrewFields: string[] = []
  
  const transcriptHasHebrew = scanObject(transcript, 'transcript', hebrewFields)
  const analysisHasHebrew = scanObject(analysis, 'analysis', hebrewFields)
  
  const hasHebrew = transcriptHasHebrew || analysisHasHebrew
  
  if (hasHebrew) {
    console.log('🔍 Hebrew content detected in:', {
      totalFields: hebrewFields.length,
      fields: hebrewFields
    })
  }
  
  return hasHebrew
}

/**
 * Provides detailed Hebrew analysis report for debugging
 */
export function getHebrewAnalysisReport(transcript: any, analysis: any): HebrewAnalysisReport {
  const hebrewFields: string[] = []
  let totalFieldCount = 0
  
  const countFields = (obj: any): void => {
    if (!obj) return
    
    if (typeof obj === 'string') {
      totalFieldCount++
      return
    }
    
    if (Array.isArray(obj)) {
      obj.forEach(item => countFields(item))
      return
    }
    
    if (typeof obj === 'object') {
      Object.values(obj).forEach(value => countFields(value))
    }
  }
  
  countFields(transcript)
  countFields(analysis)
  
  const hasHebrew = scanObject(transcript, 'transcript', hebrewFields) || 
                    scanObject(analysis, 'analysis', hebrewFields)
  
  return {
    hasHebrew,
    hebrewFieldCount: hebrewFields.length,
    totalFieldCount,
    hebrewFields
  }
}
