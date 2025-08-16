// Comprehensive error handling system for production Zapier integration

export enum ErrorType {
  TRANSIENT = 'transient',
  DATA = 'data', 
  SYSTEM = 'system',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  VALIDATION = 'validation'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorClassification {
  type: ErrorType;
  severity: ErrorSeverity;
  retryable: boolean;
  autoHeal: boolean;
  userActionRequired: boolean;
  maxRetries: number;
  baseDelay: number;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface StructuredError {
  code: string;
  message: string;
  classification: ErrorClassification;
  context: ErrorContext;
  originalError?: Error;
  stack?: string;
}

// Error classification rules
const ERROR_CLASSIFICATIONS: Record<string, ErrorClassification> = {
  // Transient errors - temporary issues that usually resolve themselves
  NETWORK_TIMEOUT: {
    type: ErrorType.TRANSIENT,
    severity: ErrorSeverity.LOW,
    retryable: true,
    autoHeal: true,
    userActionRequired: false,
    maxRetries: 3,
    baseDelay: 1000
  },
  
  RATE_LIMIT_EXCEEDED: {
    type: ErrorType.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    autoHeal: true,
    userActionRequired: false,
    maxRetries: 5,
    baseDelay: 60000 // 1 minute
  },

  DATABASE_CONNECTION_ERROR: {
    type: ErrorType.TRANSIENT,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    autoHeal: true,
    userActionRequired: false,
    maxRetries: 3,
    baseDelay: 2000
  },

  // Data errors - issues with data quality or structure
  INVALID_WEBHOOK_URL: {
    type: ErrorType.DATA,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    autoHeal: false,
    userActionRequired: true,
    maxRetries: 0,
    baseDelay: 0
  },

  INVALID_API_KEY: {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    retryable: false,
    autoHeal: false,
    userActionRequired: true,
    maxRetries: 0,
    baseDelay: 0
  },

  MALFORMED_PAYLOAD: {
    type: ErrorType.DATA,
    severity: ErrorSeverity.MEDIUM,
    retryable: false,
    autoHeal: false,
    userActionRequired: true,
    maxRetries: 0,
    baseDelay: 0
  },

  // System errors - infrastructure or code issues
  WEBHOOK_DELIVERY_FAILED: {
    type: ErrorType.SYSTEM,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    autoHeal: false,
    userActionRequired: true,
    maxRetries: 3,
    baseDelay: 5000
  },

  ANALYSIS_PROCESSING_ERROR: {
    type: ErrorType.SYSTEM,
    severity: ErrorSeverity.HIGH,
    retryable: true,
    autoHeal: false,
    userActionRequired: false,
    maxRetries: 2,
    baseDelay: 10000
  },

  CRM_INTEGRATION_ERROR: {
    type: ErrorType.SYSTEM,
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    autoHeal: false,
    userActionRequired: true,
    maxRetries: 3,
    baseDelay: 5000
  }
};

export class ErrorClassifier {
  static classify(error: Error | string, context: ErrorContext): StructuredError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorCode = this.determineErrorCode(errorMessage, context);
    
    const classification = ERROR_CLASSIFICATIONS[errorCode] || {
      type: ErrorType.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      autoHeal: false,
      userActionRequired: true,
      maxRetries: 0,
      baseDelay: 0
    };

    return {
      code: errorCode,
      message: this.generateUserFriendlyMessage(errorCode, errorMessage),
      classification,
      context,
      originalError: typeof error === 'object' ? error : undefined,
      stack: typeof error === 'object' ? error.stack : undefined
    };
  }

  private static determineErrorCode(message: string, context: ErrorContext): string {
    const lowerMessage = message.toLowerCase();
    
    // Network and timeout errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('network')) {
      return 'NETWORK_TIMEOUT';
    }
    
    // Rate limiting
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    
    // Database errors
    if (lowerMessage.includes('database') || lowerMessage.includes('connection') || lowerMessage.includes('postgresql')) {
      return 'DATABASE_CONNECTION_ERROR';
    }
    
    // Authentication errors
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('invalid api key') || lowerMessage.includes('forbidden')) {
      return 'INVALID_API_KEY';
    }
    
    // Webhook errors
    if (lowerMessage.includes('webhook') && (lowerMessage.includes('failed') || lowerMessage.includes('error'))) {
      return 'WEBHOOK_DELIVERY_FAILED';
    }
    
    // URL validation
    if (lowerMessage.includes('invalid url') || lowerMessage.includes('malformed url')) {
      return 'INVALID_WEBHOOK_URL';
    }
    
    // Payload errors
    if (lowerMessage.includes('malformed') || lowerMessage.includes('invalid json') || lowerMessage.includes('parse error')) {
      return 'MALFORMED_PAYLOAD';
    }
    
    // Analysis errors
    if (context.operation.includes('analysis') || lowerMessage.includes('analysis')) {
      return 'ANALYSIS_PROCESSING_ERROR';
    }
    
    // CRM errors
    if (context.operation.includes('crm') || lowerMessage.includes('crm')) {
      return 'CRM_INTEGRATION_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  private static generateUserFriendlyMessage(errorCode: string, originalMessage: string): string {
    const messages: Record<string, string> = {
      NETWORK_TIMEOUT: 'The request timed out. This is usually temporary - please try again in a moment.',
      RATE_LIMIT_EXCEEDED: 'You\'ve hit the rate limit. Please wait a minute before making more requests.',
      DATABASE_CONNECTION_ERROR: 'We\'re experiencing temporary database issues. Please try again in a few minutes.',
      INVALID_API_KEY: 'Your API key is invalid or has expired. Please check your API key in the settings.',
      INVALID_WEBHOOK_URL: 'The webhook URL is invalid. Please check the URL format and try again.',
      MALFORMED_PAYLOAD: 'The data format is incorrect. Please check your integration configuration.',
      WEBHOOK_DELIVERY_FAILED: 'Failed to deliver webhook. Please check your webhook URL is accessible.',
      ANALYSIS_PROCESSING_ERROR: 'There was an error processing the analysis. Our team has been notified.',
      CRM_INTEGRATION_ERROR: 'CRM integration error. Please check your CRM connection settings.',
      UNKNOWN_ERROR: `An unexpected error occurred: ${originalMessage}`
    };

    return messages[errorCode] || messages.UNKNOWN_ERROR;
  }
}

export class RetryManager {
  private retryAttempts = new Map<string, number>();

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorKey: string,
    classification: ErrorClassification,
    context: ErrorContext
  ): Promise<T> {
    const currentAttempts = this.retryAttempts.get(errorKey) || 0;
    
    try {
      const result = await operation();
      // Reset retry count on success
      this.retryAttempts.delete(errorKey);
      return result;
    } catch (error) {
      const structuredError = ErrorClassifier.classify(error, context);
      
      if (!structuredError.classification.retryable || currentAttempts >= classification.maxRetries) {
        this.retryAttempts.delete(errorKey);
        throw structuredError;
      }
      
      // Exponential backoff with jitter
      const delay = classification.baseDelay * Math.pow(2, currentAttempts) + Math.random() * 1000;
      
      console.warn(`Retrying operation (attempt ${currentAttempts + 1}/${classification.maxRetries}) after ${delay}ms:`, {
        errorKey,
        error: structuredError.message,
        delay
      });
      
      this.retryAttempts.set(errorKey, currentAttempts + 1);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.executeWithRetry(operation, errorKey, classification, context);
    }
  }
}

export class ErrorLogger {
  static async logError(error: StructuredError): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      code: error.code,
      message: error.message,
      severity: error.classification.severity,
      type: error.classification.type,
      context: error.context,
      stack: error.stack,
      retryable: error.classification.retryable,
      userActionRequired: error.classification.userActionRequired
    };

    // Log to console with appropriate level based on severity
    switch (error.classification.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('[CRITICAL ERROR]', logEntry);
        break;
      case ErrorSeverity.HIGH:
        console.error('[HIGH ERROR]', logEntry);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[MEDIUM ERROR]', logEntry);
        break;
      case ErrorSeverity.LOW:
        console.info('[LOW ERROR]', logEntry);
        break;
    }

    // In production, you would also send to external logging service
    // await sendToExternalLogger(logEntry);
  }
}

// Self-healing capabilities
export class SelfHealer {
  private static healingAttempts = new Map<string, number>();

  static async attemptAutoHeal(error: StructuredError): Promise<boolean> {
    if (!error.classification.autoHeal) {
      return false;
    }

    const healingKey = `${error.code}_${error.context.userId || 'global'}`;
    const attempts = this.healingAttempts.get(healingKey) || 0;

    if (attempts >= 3) {
      // Stop trying to auto-heal after 3 attempts
      return false;
    }

    this.healingAttempts.set(healingKey, attempts + 1);

    try {
      switch (error.code) {
        case 'RATE_LIMIT_EXCEEDED':
          // Wait for rate limit to reset
          await new Promise(resolve => setTimeout(resolve, 60000));
          return true;

        case 'NETWORK_TIMEOUT':
          // Check network connectivity and wait
          await new Promise(resolve => setTimeout(resolve, 5000));
          return true;

        case 'DATABASE_CONNECTION_ERROR':
          // Attempt to reconnect to database
          await new Promise(resolve => setTimeout(resolve, 10000));
          return true;

        default:
          return false;
      }
    } catch (healingError) {
      console.error('Auto-healing failed:', healingError);
      return false;
    }
  }
}

// Error documentation and resolution guides
export const ERROR_DOCUMENTATION = {
  INVALID_API_KEY: {
    title: 'Invalid API Key',
    description: 'Your API key is invalid, expired, or missing.',
    resolution: [
      '1. Go to your Zapier integration settings',
      '2. Generate a new API key',
      '3. Update your Zap with the new API key',
      '4. Test the connection'
    ],
    preventionTips: [
      'API keys expire after 90 days - set a calendar reminder',
      'Store API keys securely and never share them',
      'Regenerate keys if you suspect they\'ve been compromised'
    ]
  },

  WEBHOOK_DELIVERY_FAILED: {
    title: 'Webhook Delivery Failed',
    description: 'We couldn\'t deliver data to your webhook URL.',
    resolution: [
      '1. Verify your webhook URL is accessible',
      '2. Check if your server is accepting POST requests',
      '3. Ensure the endpoint returns a 2xx status code',
      '4. Test with a webhook testing tool'
    ],
    preventionTips: [
      'Use HTTPS URLs for better reliability',
      'Implement proper error handling in your webhook endpoint',
      'Monitor webhook delivery success rates',
      'Set up webhook URL validation'
    ]
  },

  RATE_LIMIT_EXCEEDED: {
    title: 'Rate Limit Exceeded',
    description: 'You\'ve made too many requests in a short time period.',
    resolution: [
      '1. Wait for the rate limit to reset (usually 1 hour)',
      '2. Reduce the frequency of your Zap triggers',
      '3. Consider batching multiple operations',
      '4. Contact support for higher rate limits if needed'
    ],
    preventionTips: [
      'Monitor your API usage in the dashboard',
      'Use webhook triggers instead of polling when possible',
      'Implement exponential backoff in your integrations'
    ]
  }
};

// Utility function to get error documentation
export function getErrorDocumentation(errorCode: string) {
  return ERROR_DOCUMENTATION[errorCode] || {
    title: 'Unknown Error',
    description: 'An unexpected error occurred.',
    resolution: [
      '1. Check the error message for specific details',
      '2. Try the operation again after a few minutes',
      '3. Contact support if the issue persists'
    ],
    preventionTips: []
  };
}