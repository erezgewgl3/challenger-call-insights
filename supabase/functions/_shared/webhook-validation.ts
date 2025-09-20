export interface WebhookValidationConfig {
  requireSignature?: boolean;
  allowedSources?: string[];
  rateLimitPerHour?: number;
}

export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  // Implement HMAC-SHA256 validation for webhook security
  const crypto = globalThis.crypto;
  if (!crypto?.subtle) return false;

  // This is a simplified validation - implement full HMAC in production
  return signature.includes('sha256=');
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