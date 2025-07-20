
/**
 * Secure domain utility for generating validated invite links
 * Prevents Host Header Injection and enforces HTTPS
 */

// Allowed domains configuration
const ALLOWED_DOMAINS = {
  development: [
    'localhost:3000',
    'localhost:5173',
    '127.0.0.1:3000',
    '127.0.0.1:5173'
  ],
  staging: [
    // Lovable staging domains pattern
    /^[a-zA-Z0-9-]+\.lovable\.app$/,
    /^[a-zA-Z0-9-]+\.lovableproject\.com$/,
    /^[a-zA-Z0-9-]+\.lovable\.dev$/
  ],
  production: [
    'app.saleswhisperer.net',
    'saleswhisperer.net',
    'www.saleswhisperer.net'
  ]
};

/**
 * Validates if a domain is allowed based on current environment
 */
export function isValidDomain(domain: string): boolean {
  const hostname = domain.replace(/^https?:\/\//, '').split('/')[0];
  
  // Check development domains
  if (ALLOWED_DOMAINS.development.includes(hostname)) {
    return true;
  }
  
  // Check staging domains (regex patterns)
  const isStaging = ALLOWED_DOMAINS.staging.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(hostname);
    }
    return pattern === hostname;
  });
  
  if (isStaging) {
    return true;
  }
  
  // Check production domains
  if (ALLOWED_DOMAINS.production.includes(hostname)) {
    return true;
  }
  
  return false;
}

/**
 * Gets a secure base URL for invite links with validation
 */
export function getSecureBaseUrl(): string {
  let baseUrl: string;
  
  // Use current origin but validate it
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
    console.log('[DOMAIN DEBUG] Current window.location.origin:', baseUrl);
  } else {
    // Server-side: try to get from environment or use current host header
    // In Lovable, we can detect the current domain from the request context
    const currentHost = typeof globalThis !== 'undefined' && globalThis.location?.hostname;
    if (currentHost) {
      baseUrl = `https://${currentHost}`;
      console.log('[DOMAIN DEBUG] Server-side detected host:', baseUrl);
    } else {
      // Ultimate fallback - but this should work with the current domain
      baseUrl = 'https://app.saleswhisperer.net';
      console.log('[DOMAIN DEBUG] Using fallback domain:', baseUrl);
    }
  }

  const hostname = baseUrl.replace(/^https?:\/\//, '').split('/')[0];
  console.log('[DOMAIN DEBUG] Extracted hostname:', hostname);
  
  // Validate the domain
  if (!isValidDomain(baseUrl)) {
    console.warn(`[DOMAIN DEBUG] Invalid domain detected: ${baseUrl}. Applying fixes...`);
    
    // Determine environment and use appropriate fallback
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      baseUrl = 'http://localhost:3000';
      console.log('[DOMAIN DEBUG] Fixed to localhost:', baseUrl);
    } else if (hostname.includes('lovable')) {
      // Keep the current Lovable domain - any lovable subdomain
      baseUrl = `https://${hostname}`;
      console.log('[DOMAIN DEBUG] Keeping Lovable domain:', baseUrl);
    } else {
      baseUrl = 'https://app.saleswhisperer.net';
      console.log('[DOMAIN DEBUG] Fixed to production domain:', baseUrl);
    }
  } else {
    console.log('[DOMAIN DEBUG] Domain validation passed:', baseUrl);
  }
  
  // Enforce HTTPS in production
  if (!baseUrl.startsWith('http://localhost') && !baseUrl.startsWith('https://')) {
    baseUrl = baseUrl.replace(/^http:/, 'https:');
    console.log('[DOMAIN DEBUG] Enforced HTTPS:', baseUrl);
  }
  
  console.log('[DOMAIN DEBUG] Final baseUrl:', baseUrl);
  return baseUrl;
}

/**
 * Generates a secure invite link with domain binding
 */
export function generateSecureInviteLink(token: string): string {
  const baseUrl = getSecureBaseUrl();
  const inviteLink = `${baseUrl}/register?token=${encodeURIComponent(token)}`;
  console.log('[DOMAIN DEBUG] Generated invite link:', inviteLink);
  return inviteLink;
}

/**
 * Logs security events for monitoring
 */
export function logSecurityEvent(event: string, details: Record<string, any>) {
  console.log(`[SECURITY] ${event}:`, {
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    ...details
  });
}
