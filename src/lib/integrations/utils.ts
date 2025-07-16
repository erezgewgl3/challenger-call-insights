import { IntegrationConfig, IntegrationConnection, IntegrationError } from './types';

export class IntegrationUtils {
  
  // Configuration Utilities
  static validateConnectionConfig(
    config: Record<string, unknown>, 
    integration: IntegrationConfig
  ): boolean {
    // Check required fields
    for (const field of integration.requiredFields) {
      if (!(field in config) || config[field] === null || config[field] === undefined) {
        return false;
      }
    }

    return true;
  }

  static sanitizeCredentials(credentials: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...credentials };
    
    // Remove sensitive fields from logs/responses
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'auth'];
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  static generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validation Utilities
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidApiKey(apiKey: string): boolean {
    return typeof apiKey === 'string' && apiKey.length >= 10;
  }

  // Data Transformation Utilities
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }

    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  static mergeDeep(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === 'object' && 
          source[key] !== null && 
          !Array.isArray(source[key]) &&
          typeof result[key] === 'object' && 
          result[key] !== null && 
          !Array.isArray(result[key])
        ) {
          result[key] = this.mergeDeep(
            result[key] as Record<string, unknown>, 
            source[key] as Record<string, unknown>
          );
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  // Error Handling Utilities
  static createIntegrationError(
    code: string, 
    message: string, 
    details?: Record<string, unknown>
  ): IntegrationError {
    return new IntegrationError({
      code,
      message,
      details
    });
  }

  static isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const retryableMessages = [
        'network error',
        'timeout',
        'rate limit',
        'service unavailable',
        'internal server error'
      ];

      const message = error.message.toLowerCase();
      return retryableMessages.some(retryable => message.includes(retryable));
    }

    return false;
  }

  // Rate Limiting Utilities
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests: number[] = [];

    return {
      canMakeRequest(): boolean {
        const now = Date.now();
        const cutoff = now - windowMs;
        
        // Remove old requests
        while (requests.length > 0 && requests[0] < cutoff) {
          requests.shift();
        }

        return requests.length < maxRequests;
      },

      recordRequest(): void {
        requests.push(Date.now());
      },

      getTimeUntilReset(): number {
        if (requests.length === 0) return 0;
        
        const oldestRequest = requests[0];
        const resetTime = oldestRequest + windowMs;
        
        return Math.max(0, resetTime - Date.now());
      }
    };
  }

  // Connection Health Utilities
  static calculateUptimePercentage(
    successfulOperations: number, 
    totalOperations: number
  ): number {
    if (totalOperations === 0) return 100;
    return Math.round((successfulOperations / totalOperations) * 100);
  }

  static getConnectionHealthStatus(
    connection: IntegrationConnection
  ): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (connection.connectionStatus !== 'active') {
      return 'critical';
    }

    if (connection.errorCount === 0) {
      return 'healthy';
    }

    if (connection.errorCount < 5) {
      return 'warning';
    }

    return 'critical';
  }

  // Sync Utilities
  static shouldSync(connection: IntegrationConnection): boolean {
    if (!connection.nextSyncAt) return true;
    return new Date() >= connection.nextSyncAt;
  }

  static calculateNextSyncTime(
    lastSync: Date, 
    frequencyMinutes: number
  ): Date {
    return new Date(lastSync.getTime() + (frequencyMinutes * 60 * 1000));
  }

  // Data Processing Utilities
  static chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    errorMessage = 'Operation timed out'
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // Configuration Utilities
  static maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...data };
    const sensitiveKeys = ['password', 'secret', 'token', 'key', 'auth', 'credential'];

    for (const key of Object.keys(masked)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        const value = masked[key];
        if (typeof value === 'string' && value.length > 4) {
          masked[key] = `${value.substring(0, 4)}${'*'.repeat(value.length - 4)}`;
        } else {
          masked[key] = '[MASKED]';
        }
      }
    }

    return masked;
  }

  static extractDomainFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  // Webhook Utilities
  static validateWebhookPayload(
    payload: unknown, 
    requiredFields: string[]
  ): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const payloadObj = payload as Record<string, unknown>;
    return requiredFields.every(field => field in payloadObj);
  }

  static parseWebhookHeaders(headers: Record<string, string>): Record<string, string> {
    const parsed: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(headers)) {
      // Normalize header names to lowercase
      parsed[key.toLowerCase()] = value;
    }

    return parsed;
  }

  // Logging Utilities
  static createLogContext(
    connectionId: string, 
    operationType?: string, 
    additionalContext?: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      connectionId,
      operationType,
      timestamp: new Date().toISOString(),
      ...additionalContext
    };
  }

  static formatLogMessage(
    level: 'info' | 'warn' | 'error', 
    message: string, 
    context?: Record<string, unknown>
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }
}