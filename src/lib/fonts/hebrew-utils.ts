/**
 * Hebrew and RTL Text Utilities for PDF Generation
 * Handles detection, reversal, and BiDi (bidirectional) text processing
 */

/**
 * Detects if text contains Hebrew characters
 * Hebrew Unicode range: U+0590 to U+05FF
 */
export function containsHebrew(text: string): boolean {
  if (!text) return false;
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Detects if text contains any RTL (right-to-left) characters
 * Includes Hebrew, Arabic, and other RTL scripts
 */
export function containsRTL(text: string): boolean {
  if (!text) return false;
  return /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F]/.test(text);
}

/**
 * Reverses text for proper RTL display in jsPDF
 * jsPDF doesn't natively support RTL, so we reverse the character order
 */
export function reverseText(text: string): string {
  if (!text) return text;
  return text.split('').reverse().join('');
}

/**
 * Processes bidirectional text (mixed Hebrew/English)
 * Reverses Hebrew segments while preserving English segments and spaces
 */
export function processBiDiText(text: string): string {
  if (!text) return text;
  
  // Split into words while preserving spaces
  const segments = text.split(/(\s+)/);
  
  return segments.map(segment => {
    // Preserve whitespace
    if (/^\s+$/.test(segment)) return segment;
    
    // Reverse Hebrew segments
    if (containsHebrew(segment)) {
      return reverseText(segment);
    }
    
    // Keep English/numbers as-is
    return segment;
  }).join('');
}

/**
 * Determines if text should be rendered right-to-left
 * Returns true if majority of characters are RTL
 */
export function shouldUseRTL(text: string): boolean {
  if (!text) return false;
  
  const rtlChars = (text.match(/[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  // If more than 30% of characters are RTL, treat as RTL text
  return totalChars > 0 && (rtlChars / totalChars) > 0.3;
}
