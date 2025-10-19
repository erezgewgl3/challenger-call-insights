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
 * Handles word-level reversal with proper BiDi algorithm
 */
export function processBiDiText(text: string): string {
  if (!text) return text;
  
  // Quick check: if no Hebrew, return as-is (no processing needed)
  if (!containsHebrew(text)) return text;
  
  // Count Hebrew vs Latin/numeric characters to determine if truly mixed
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latinNumericChars = (text.match(/[A-Za-z0-9]/g) || []).length;
  
  // If pure Hebrew (no Latin/numeric), just reverse characters
  if (latinNumericChars === 0) {
    return text.split('').reverse().join('');
  }

  // Only for truly mixed content, apply full BiDi processing with isolates
  const LRI = '\u2066'; // Left-to-Right isolate
  const PDI = '\u2069'; // Pop directional isolate

  // Tokenize into Hebrew runs, Latin/number runs, brackets/punctuation, and whitespace
  const tokens = text.match(/[\u0590-\u05FF]+|[A-Za-z0-9@#%&+\/\-_.:]+|[()\[\]{}<>]+|[\p{P}]+|\s+/gu) || [text];

  let rtlCount = 0;
  let ltrCount = 0;

  const mapped = tokens.map((tok) => {
    if (/^\s+$/.test(tok)) return tok; // keep whitespace

    // Pure Hebrew run
    if (/^[\u0590-\u05FF]+$/.test(tok)) {
      rtlCount++;
      return tok.split('').reverse().join('');
    }

    // Pure Latin/number run -> wrap with LRI/PDI to preserve LTR inside RTL context
    if (/^[A-Za-z0-9@#%&+\/\-_.:]+$/.test(tok)) {
      ltrCount++;
      return `${LRI}${tok}${PDI}`;
    }

    // Mixed or punctuation: if contains Hebrew, treat as RTL and reverse chars, else keep
    if (containsHebrew(tok)) {
      rtlCount++;
      return tok.split('').reverse().join('');
    }

    return tok;
  });

  const pureHebrewLine = ltrCount === 0 && rtlCount > 0;
  const rtlDominant = rtlCount > 0 && (rtlCount / (rtlCount + ltrCount)) > 0.9;

  // For pure (or near-pure) Hebrew, reverse token order so the sentence reads RTL.
  // For mixed lines, keep original token order so English stays readable.
  const ordered = (pureHebrewLine || rtlDominant) ? mapped.reverse() : mapped;

  return ordered.join('');
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
