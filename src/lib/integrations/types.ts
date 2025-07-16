export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'crm' | 'email' | 'calendar' | 'storage' | 'communication' | 'analytics' | 'other';
  
  // Connection requirements
  authType: 'oauth2' | 'api_key' | 'basic_auth' | 'custom';
  requiredFields: string[];
  optionalFields: string[];
  
  // Capabilities
  capabilities: IntegrationCapability[];
  
  // Configuration
  webhookSupport: boolean;
  syncFrequencyMinutes?: number;
  
  // Metadata
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  
  // Status
  isActive: boolean;
  isDeprecated: boolean;
}

export interface IntegrationConnection {
  id: string;
  integrationId: string;
  userId: string;
  connectionName: string;
  
  // Connection details
  connectionStatus: 'active' | 'inactive' | 'error' | 'pending';
  credentials: Record<string, unknown>;
  configuration: Record<string, unknown>;
  
  // Sync information
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  syncFrequencyMinutes?: number;
  
  // Error tracking
  lastError?: string;
  errorCount: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationCapability {
  type: 'sync' | 'webhook' | 'export' | 'import' | 'bidirectional';
  name: string;
  description: string;
  dataTypes: string[];
}

export interface IntegrationSyncOperation {
  id: string;
  connectionId: string;
  operationType: 'full_sync' | 'incremental_sync' | 'export' | 'import';
  
  // Status tracking
  operationStatus: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  
  // Data tracking
  recordsTotal?: number;
  recordsProcessed?: number;
  recordsSkipped?: number;
  recordsErrored?: number;
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  
  // Error details
  errorDetails?: Record<string, unknown>;
  
  // Operation data
  operationData: Record<string, unknown>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationWebhookLog {
  id: string;
  connectionId: string;
  webhookEvent: string;
  
  // Request details
  headers: Record<string, string>;
  payload: Record<string, unknown>;
  
  // Processing details
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  
  // Error tracking
  errorMessage?: string;
  
  // Timing
  receivedAt: Date;
  processedAt?: Date;
}

export class IntegrationError extends Error {
  code: string;
  details?: Record<string, unknown>;
  timestamp: Date;

  constructor(params: { code: string; message: string; details?: Record<string, unknown>; timestamp?: Date }) {
    super(params.message);
    this.name = 'IntegrationError';
    this.code = params.code;
    this.details = params.details;
    this.timestamp = params.timestamp || new Date();
  }
}

export interface IntegrationMetrics {
  connectionId: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageProcessingTime: number;
  lastOperationAt?: Date;
  uptimePercentage: number;
}