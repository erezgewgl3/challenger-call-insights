import { supabase } from "@/integrations/supabase/client";

// Types for contact matching
export interface ContactMatch {
  contact_id: string;
  confidence: number;
  match_method: string;
  reasoning: string;
  contact_data?: any;
}

export interface ParticipantMatchResult {
  participant: string;
  suggested_matches: ContactMatch[];
  requires_review: boolean;
  confidence_threshold: number;
}

export interface CRMContact {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  domain?: string;
}

// Configuration for matching thresholds
const CONFIDENCE_THRESHOLDS = {
  EMAIL_EXACT: { min: 95, max: 100 },
  EMAIL_DOMAIN_COMPANY: { min: 80, max: 95 },
  NAME_COMPANY: { min: 70, max: 84 },
  COMPANY_ONLY: { min: 60, max: 75 },
  REVIEW_THRESHOLD: 85 // Above this threshold, auto-approve
};

// Company suffixes to normalize
const COMPANY_SUFFIXES = [
  'inc', 'corp', 'corporation', 'company', 'co', 'ltd', 'limited', 
  'llc', 'llp', 'lp', 'pllc', 'pc', 'group', 'holdings', 'international',
  'intl', 'enterprises', 'solutions', 'technologies', 'tech', 'systems'
];

// Common name variations and nicknames
const NAME_VARIATIONS: Record<string, string[]> = {
  'robert': ['rob', 'bob', 'bobby'],
  'william': ['will', 'bill', 'billy'],
  'michael': ['mike', 'mick'],
  'david': ['dave', 'davy'],
  'richard': ['rick', 'dick', 'rich'],
  'thomas': ['tom', 'tommy'],
  'christopher': ['chris'],
  'matthew': ['matt'],
  'anthony': ['tony'],
  'elizabeth': ['liz', 'beth', 'betty'],
  'jennifer': ['jen', 'jenny'],
  'patricia': ['pat', 'patty'],
  'margaret': ['meg', 'maggie'],
  'catherine': ['cathy', 'kate'],
  'stephanie': ['steph'],
  'nicholas': ['nick'],
  'alexander': ['alex'],
  'jonathan': ['jon'],
  'benjamin': ['ben'],
  'gregory': ['greg']
};

export class ContactMatcher {
  private crmContacts: CRMContact[] = [];

  constructor(crmContacts: CRMContact[] = []) {
    this.crmContacts = crmContacts;
  }

  // Main matching function
  async matchParticipant(
    participant: string, 
    userId: string,
    analysisId?: string
  ): Promise<ParticipantMatchResult> {
    const parsedParticipant = this.parseParticipant(participant);
    const matches: ContactMatch[] = [];

    // Strategy 1: Email exact match
    if (parsedParticipant.email) {
      const emailMatches = this.findEmailExactMatches(parsedParticipant.email);
      matches.push(...emailMatches);
    }

    // Strategy 2: Email domain + company fuzzy match
    if (parsedParticipant.email && parsedParticipant.company) {
      const domainCompanyMatches = this.findEmailDomainCompanyMatches(
        parsedParticipant.email, 
        parsedParticipant.company
      );
      matches.push(...domainCompanyMatches);
    }

    // Strategy 3: Name + company fuzzy match
    if (parsedParticipant.name && parsedParticipant.company) {
      const nameCompanyMatches = this.findNameCompanyMatches(
        parsedParticipant.name, 
        parsedParticipant.company
      );
      matches.push(...nameCompanyMatches);
    }

    // Strategy 4: Company name only match
    if (parsedParticipant.company) {
      const companyMatches = this.findCompanyOnlyMatches(parsedParticipant.company);
      matches.push(...companyMatches);
    }

    // Remove duplicates and sort by confidence
    const uniqueMatches = this.deduplicateMatches(matches);
    uniqueMatches.sort((a, b) => b.confidence - a.confidence);

    // Determine if review is required
    const requiresReview = uniqueMatches.length === 0 || 
      uniqueMatches[0].confidence < CONFIDENCE_THRESHOLDS.REVIEW_THRESHOLD;

    const result: ParticipantMatchResult = {
      participant,
      suggested_matches: uniqueMatches.slice(0, 5), // Top 5 matches
      requires_review: requiresReview,
      confidence_threshold: CONFIDENCE_THRESHOLDS.REVIEW_THRESHOLD
    };

    // Store match review in database if needed
    if (analysisId && uniqueMatches.length > 0) {
      await this.storeMatchReview(userId, analysisId, parsedParticipant, result);
    }

    return result;
  }

  // Parse participant string to extract name, email, company
  private parseParticipant(participant: string): {
    name?: string;
    email?: string;
    company?: string;
  } {
    const result: any = {};

    // Extract email
    const emailMatch = participant.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      result.email = emailMatch[0].toLowerCase();
    }

    // Extract company (usually after "from" or "@" or parentheses)
    const companyPatterns = [
      /from\s+(.+?)$/i,
      /\(([^)]+)\)$/,
      /@\s*([^@\s]+)$/,
      /\-\s*([^-]+)$/
    ];

    for (const pattern of companyPatterns) {
      const match = participant.match(pattern);
      if (match) {
        result.company = match[1].trim();
        break;
      }
    }

    // Extract name (usually at the beginning)
    let name = participant;
    if (result.email) {
      name = name.replace(result.email, '').trim();
    }
    if (result.company) {
      name = name.replace(new RegExp(`(from\\s+|@\\s*|\\(|\\-\\s*)${result.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'i'), '').trim();
    }
    
    name = name.replace(/[()<>@-]/g, '').trim();
    if (name) {
      result.name = name;
    }

    return result;
  }

  // Strategy 1: Email exact match
  private findEmailExactMatches(email: string): ContactMatch[] {
    return this.crmContacts
      .filter(contact => contact.email?.toLowerCase() === email.toLowerCase())
      .map(contact => ({
        contact_id: contact.id,
        confidence: 98,
        match_method: 'email_exact',
        reasoning: `Exact email match: ${email}`,
        contact_data: contact
      }));
  }

  // Strategy 2: Email domain + company fuzzy match
  private findEmailDomainCompanyMatches(email: string, company: string): ContactMatch[] {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return [];

    const normalizedCompany = this.normalizeCompanyName(company);
    const matches: ContactMatch[] = [];

    for (const contact of this.crmContacts) {
      if (!contact.company) continue;

      const contactDomain = contact.email?.split('@')[1]?.toLowerCase();
      const normalizedContactCompany = this.normalizeCompanyName(contact.company);

      // Check domain match + company similarity
      if (contactDomain === domain) {
        const companySimilarity = this.calculateStringSimilarity(normalizedCompany, normalizedContactCompany);
        if (companySimilarity > 0.7) {
          const confidence = Math.min(
            CONFIDENCE_THRESHOLDS.EMAIL_DOMAIN_COMPANY.max,
            CONFIDENCE_THRESHOLDS.EMAIL_DOMAIN_COMPANY.min + (companySimilarity * 15)
          );

          matches.push({
            contact_id: contact.id,
            confidence: Math.round(confidence),
            match_method: 'email_domain_company',
            reasoning: `Email domain ${domain} matches company ${contact.company} (${Math.round(companySimilarity * 100)}% similarity)`,
            contact_data: contact
          });
        }
      }
    }

    return matches;
  }

  // Strategy 3: Name + company fuzzy match
  private findNameCompanyMatches(name: string, company: string): ContactMatch[] {
    const normalizedName = this.normalizeName(name);
    const normalizedCompany = this.normalizeCompanyName(company);
    const matches: ContactMatch[] = [];

    for (const contact of this.crmContacts) {
      if (!contact.name || !contact.company) continue;

      const normalizedContactName = this.normalizeName(contact.name);
      const normalizedContactCompany = this.normalizeCompanyName(contact.company);

      const nameSimilarity = this.calculateNameSimilarity(normalizedName, normalizedContactName);
      const companySimilarity = this.calculateStringSimilarity(normalizedCompany, normalizedContactCompany);

      if (nameSimilarity > 0.6 && companySimilarity > 0.7) {
        const combinedScore = (nameSimilarity * 0.6) + (companySimilarity * 0.4);
        const confidence = Math.min(
          CONFIDENCE_THRESHOLDS.NAME_COMPANY.max,
          CONFIDENCE_THRESHOLDS.NAME_COMPANY.min + (combinedScore * 14)
        );

        matches.push({
          contact_id: contact.id,
          confidence: Math.round(confidence),
          match_method: 'name_company',
          reasoning: `Name similarity ${Math.round(nameSimilarity * 100)}%, company similarity ${Math.round(companySimilarity * 100)}%`,
          contact_data: contact
        });
      }
    }

    return matches;
  }

  // Strategy 4: Company name only match
  private findCompanyOnlyMatches(company: string): ContactMatch[] {
    const normalizedCompany = this.normalizeCompanyName(company);
    const matches: ContactMatch[] = [];

    for (const contact of this.crmContacts) {
      if (!contact.company) continue;

      const normalizedContactCompany = this.normalizeCompanyName(contact.company);
      const similarity = this.calculateStringSimilarity(normalizedCompany, normalizedContactCompany);

      if (similarity > 0.8) {
        const confidence = Math.min(
          CONFIDENCE_THRESHOLDS.COMPANY_ONLY.max,
          CONFIDENCE_THRESHOLDS.COMPANY_ONLY.min + (similarity * 15)
        );

        matches.push({
          contact_id: contact.id,
          confidence: Math.round(confidence),
          match_method: 'company_only',
          reasoning: `Company name similarity ${Math.round(similarity * 100)}%`,
          contact_data: contact
        });
      }
    }

    return matches;
  }

  // Normalize company name for better matching
  private normalizeCompanyName(company: string): string {
    let normalized = company.toLowerCase().trim();
    
    // Remove common suffixes
    for (const suffix of COMPANY_SUFFIXES) {
      const regex = new RegExp(`\\b${suffix}\\b\\.?$`, 'i');
      normalized = normalized.replace(regex, '');
    }

    // Remove extra whitespace, punctuation
    normalized = normalized.replace(/[.,\-&]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized;
  }

  // Normalize name for better matching
  private normalizeName(name: string): string {
    return name.toLowerCase()
      .replace(/[.,\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Calculate name similarity with nickname support
  private calculateNameSimilarity(name1: string, name2: string): number {
    const parts1 = name1.split(' ');
    const parts2 = name2.split(' ');

    let maxSimilarity = 0;

    // Check all combinations including nicknames
    for (const part1 of parts1) {
      for (const part2 of parts2) {
        let similarity = this.calculateStringSimilarity(part1, part2);

        // Check for nickname matches
        const variations1 = this.getNameVariations(part1);
        const variations2 = this.getNameVariations(part2);

        for (const var1 of variations1) {
          for (const var2 of variations2) {
            const varSimilarity = this.calculateStringSimilarity(var1, var2);
            similarity = Math.max(similarity, varSimilarity);
          }
        }

        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    return maxSimilarity;
  }

  // Get name variations including nicknames
  private getNameVariations(name: string): string[] {
    const variations = [name];
    const lowerName = name.toLowerCase();

    // Add known variations
    if (NAME_VARIATIONS[lowerName]) {
      variations.push(...NAME_VARIATIONS[lowerName]);
    }

    // Check if current name is a variation of a full name
    for (const [fullName, nicknames] of Object.entries(NAME_VARIATIONS)) {
      if (nicknames.includes(lowerName)) {
        variations.push(fullName);
        variations.push(...nicknames);
      }
    }

    // Add initials
    if (name.length > 1) {
      variations.push(name.charAt(0));
    }

    return [...new Set(variations)];
  }

  // Calculate string similarity using Levenshtein distance
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    return 1 - (distance / maxLength);
  }

  // Levenshtein distance algorithm
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Remove duplicate matches
  private deduplicateMatches(matches: ContactMatch[]): ContactMatch[] {
    const seen = new Set<string>();
    return matches.filter(match => {
      const key = match.contact_id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Store match review in database
  private async storeMatchReview(
    userId: string, 
    analysisId: string, 
    participantData: any, 
    matchResult: ParticipantMatchResult
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('zapier_match_reviews')
        .insert({
          user_id: userId,
          analysis_id: analysisId,
          participant_data: participantData as any,
          suggested_matches: matchResult.suggested_matches as any,
          status: matchResult.requires_review ? 'pending' : 'auto_approved'
        });

      if (error) {
        console.error('Failed to store match review:', error);
      }
    } catch (error) {
      console.error('Error storing match review:', error);
    }
  }

  // Update CRM contacts for matching
  updateCRMContacts(contacts: CRMContact[]): void {
    this.crmContacts = contacts;
  }

  // Get confidence threshold configuration
  static getConfidenceThresholds() {
    return CONFIDENCE_THRESHOLDS;
  }
}

// Helper function to create matcher with CRM data
export async function createContactMatcher(crmContacts: CRMContact[] = []): Promise<ContactMatcher> {
  return new ContactMatcher(crmContacts);
}

// Batch process multiple participants
export async function matchMultipleParticipants(
  participants: string[],
  userId: string,
  analysisId: string,
  crmContacts: CRMContact[] = []
): Promise<ParticipantMatchResult[]> {
  const matcher = new ContactMatcher(crmContacts);
  const results: ParticipantMatchResult[] = [];

  for (const participant of participants) {
    try {
      const result = await matcher.matchParticipant(participant, userId, analysisId);
      results.push(result);
    } catch (error) {
      console.error(`Error matching participant ${participant}:`, error);
      results.push({
        participant,
        suggested_matches: [],
        requires_review: true,
        confidence_threshold: CONFIDENCE_THRESHOLDS.REVIEW_THRESHOLD
      });
    }
  }

  return results;
}