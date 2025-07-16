import { crypto } from 'https://deno.land/std@0.190.0/crypto/mod.ts';

// Webhook signature validation utilities
export class SignatureValidator {
  
  // Validate HMAC SHA256 signature (common for many webhooks)
  static async validateHmacSha256(
    payload: string,
    signature: string,
    secret: string,
    headerPrefix: string = 'sha256='
  ): Promise<boolean> {
    try {
      // Remove prefix if present
      const cleanSignature = signature.startsWith(headerPrefix) 
        ? signature.substring(headerPrefix.length)
        : signature;

      // Create HMAC
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature_bytes = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payload)
      );

      // Convert to hex string
      const expectedSignature = Array.from(new Uint8Array(signature_bytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return this.timingSafeEqual(cleanSignature, expectedSignature);
    } catch (error) {
      console.error('Error validating HMAC SHA256 signature:', error);
      return false;
    }
  }

  // Validate HMAC SHA1 signature (used by some legacy services)
  static async validateHmacSha1(
    payload: string,
    signature: string,
    secret: string,
    headerPrefix: string = 'sha1='
  ): Promise<boolean> {
    try {
      const cleanSignature = signature.startsWith(headerPrefix) 
        ? signature.substring(headerPrefix.length)
        : signature;

      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );

      const signature_bytes = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payload)
      );

      const expectedSignature = Array.from(new Uint8Array(signature_bytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return this.timingSafeEqual(cleanSignature, expectedSignature);
    } catch (error) {
      console.error('Error validating HMAC SHA1 signature:', error);
      return false;
    }
  }

  // GitHub webhook signature validation
  static async validateGitHubSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    return this.validateHmacSha256(payload, signature, secret, 'sha256=');
  }

  // Stripe webhook signature validation
  static async validateStripeSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp?: string
  ): Promise<boolean> {
    try {
      // Stripe signatures are in format: t=timestamp,v1=signature
      const parts = signature.split(',');
      const timestampPart = parts.find(part => part.startsWith('t='));
      const signaturePart = parts.find(part => part.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        console.error('Invalid Stripe signature format');
        return false;
      }

      const extractedTimestamp = timestampPart.substring(2);
      const extractedSignature = signaturePart.substring(3);

      // Check timestamp tolerance (5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(extractedTimestamp);
      const timeDiff = Math.abs(currentTime - webhookTime);
      
      if (timeDiff > 300) { // 5 minutes
        console.error('Stripe webhook timestamp too old');
        return false;
      }

      // Create payload for signature verification
      const signedPayload = `${extractedTimestamp}.${payload}`;
      
      return this.validateHmacSha256(signedPayload, extractedSignature, secret, '');
    } catch (error) {
      console.error('Error validating Stripe signature:', error);
      return false;
    }
  }

  // Slack webhook signature validation
  static async validateSlackSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp: string
  ): Promise<boolean> {
    try {
      // Check timestamp (5 minutes tolerance)
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(timestamp);
      const timeDiff = Math.abs(currentTime - webhookTime);
      
      if (timeDiff > 300) {
        console.error('Slack webhook timestamp too old');
        return false;
      }

      // Create signature base string
      const signatureBaseString = `v0:${timestamp}:${payload}`;
      
      return this.validateHmacSha256(signatureBaseString, signature, secret, 'v0=');
    } catch (error) {
      console.error('Error validating Slack signature:', error);
      return false;
    }
  }

  // Discord webhook signature validation (if using secret)
  static async validateDiscordSignature(
    payload: string,
    signature: string,
    secret: string,
    timestamp: string
  ): Promise<boolean> {
    try {
      const signaturePayload = `${timestamp}${payload}`;
      return this.validateHmacSha256(signaturePayload, signature, secret, '');
    } catch (error) {
      console.error('Error validating Discord signature:', error);
      return false;
    }
  }

  // Generic HMAC validation with custom algorithm
  static async validateHmac(
    payload: string,
    signature: string,
    secret: string,
    algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512' = 'SHA-256',
    prefix: string = ''
  ): Promise<boolean> {
    try {
      const cleanSignature = prefix ? signature.substring(prefix.length) : signature;

      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
      );

      const signature_bytes = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(payload)
      );

      const expectedSignature = Array.from(new Uint8Array(signature_bytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return this.timingSafeEqual(cleanSignature, expectedSignature);
    } catch (error) {
      console.error('Error validating HMAC signature:', error);
      return false;
    }
  }

  // Validate JWT signature (for webhooks that use JWT)
  static async validateJwtSignature(
    token: string,
    secret: string
  ): Promise<boolean> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [header, payload, signature] = parts;
      const message = `${header}.${payload}`;

      // Decode signature from base64url
      const decodedSignature = this.base64urlDecode(signature);
      
      return this.validateHmacSha256(message, decodedSignature, secret, '');
    } catch (error) {
      console.error('Error validating JWT signature:', error);
      return false;
    }
  }

  // Timing-safe string comparison to prevent timing attacks
  private static timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Base64URL decode utility
  private static base64urlDecode(str: string): string {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }

    try {
      return atob(base64);
    } catch (error) {
      console.error('Error decoding base64url:', error);
      return '';
    }
  }

  // Validate signature based on integration type
  static async validateByIntegrationType(
    integrationType: string,
    payload: string,
    headers: Record<string, string>,
    secret: string
  ): Promise<boolean> {
    const normalizedType = integrationType.toLowerCase();

    switch (normalizedType) {
      case 'github':
        const githubSig = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'];
        return githubSig ? this.validateGitHubSignature(payload, githubSig, secret) : false;

      case 'stripe':
        const stripeSig = headers['stripe-signature'] || headers['Stripe-Signature'];
        return stripeSig ? this.validateStripeSignature(payload, stripeSig, secret) : false;

      case 'slack':
        const slackSig = headers['x-slack-signature'] || headers['X-Slack-Signature'];
        const slackTimestamp = headers['x-slack-request-timestamp'] || headers['X-Slack-Request-Timestamp'];
        return (slackSig && slackTimestamp) ? 
          this.validateSlackSignature(payload, slackSig, secret, slackTimestamp) : false;

      case 'discord':
        const discordSig = headers['x-signature-ed25519'] || headers['X-Signature-Ed25519'];
        const discordTimestamp = headers['x-signature-timestamp'] || headers['X-Signature-Timestamp'];
        return (discordSig && discordTimestamp) ? 
          this.validateDiscordSignature(payload, discordSig, secret, discordTimestamp) : false;

      default:
        // Try common signature headers
        const genericSig = headers['x-signature'] || headers['X-Signature'] || 
                          headers['signature'] || headers['Signature'];
        return genericSig ? this.validateHmacSha256(payload, genericSig, secret) : false;
    }
  }
}