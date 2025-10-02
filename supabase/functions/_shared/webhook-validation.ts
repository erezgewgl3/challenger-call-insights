export interface WebhookValidationConfig {
  requireSignature?: boolean;
  allowedSources?: string[];
  rateLimitPerHour?: number;
}

export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    // Extract algorithm and signature
    const parts = signature.split('=');
    if (parts.length !== 2) return false;
    
    const [algorithm, receivedSignature] = parts;
    if (algorithm !== 'sha256') return false;

    // Compute HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_buffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );
    
    const computedSignature = Array.from(new Uint8Array(signature_buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Timing-safe comparison to prevent timing attacks
    return timingSafeEqual(computedSignature, receivedSignature);
  } catch (error) {
    console.error('Signature validation failed:', error);
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function rateLimitCheck(
  clientId: string,
  limitPerHour: number = 1000
): boolean {
  // Implement rate limiting logic using Supabase or Redis
  // For now, return true to allow all requests
  return true;
}

export function logWebhookRequest(
  source: string,
  payload: any,
  success: boolean,
  error?: string
): void {
  console.log('📊 [WEBHOOK LOG]', {
    source,
    success,
    timestamp: new Date().toISOString(),
    payload_size: JSON.stringify(payload).length,
    error: error || null
  });
}