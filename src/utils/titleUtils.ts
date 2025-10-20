/**
 * Centralized title prioritization logic for transcripts
 * Single source of truth for display title determination
 */

export interface TitleData {
  title: string;
  extracted_company_name?: string;
  deal_context?: {
    company_name?: string;
  };
}

/**
 * Detects if a title is generic/placeholder and should be replaced
 */
export const isGenericTitle = (title?: string): boolean => {
  if (!title) return true;
  
  const t = title.trim();
  const genericPatterns = [
    /^the (client|prospect|customer|company)$/i,
    /^(call|meeting|conversation|discussion)$/i,
    /^compliance risks?$/i,
    /^transcript\.?(txt|docx|vtt)?$/i,
    /^unnamed/i,
    /^untitled/i
  ];
  
  return genericPatterns.some((p) => p.test(t));
};

/**
 * Returns the best display title with prioritization:
 * 1. Manual title (if not generic)
 * 2. Extracted company name
 * 3. Deal context company name
 * 4. Manual title (even if generic)
 * 5. Fallback: 'Untitled'
 */
export const getDisplayTitle = (data: TitleData): string => {
  const manualTitle = (data.title || '').trim();
  
  // Priority 1: Use manual title if it's not generic
  if (manualTitle && !isGenericTitle(manualTitle)) {
    return manualTitle;
  }
  
  // Priority 2: Extracted company name from metadata
  if (data.extracted_company_name) {
    return data.extracted_company_name;
  }
  
  // Priority 3: Deal context company name
  if (data.deal_context?.company_name) {
    return data.deal_context.company_name;
  }
  
  // Priority 4: Use manual title even if generic (better than nothing)
  if (manualTitle) {
    return manualTitle;
  }
  
  // Last resort
  return 'Untitled';
};
