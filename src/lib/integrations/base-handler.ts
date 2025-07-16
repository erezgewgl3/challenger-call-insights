import { 
  IntegrationConnection, 
  IntegrationSyncOperation, 
  IntegrationWebhookLog, 
  IntegrationError,
  IntegrationMetrics 
} from './types';

export abstract class BaseIntegrationHandler {
  protected connection: IntegrationConnection;

  constructor(connection: IntegrationConnection) {
    this.connection = connection;
  }

  // Abstract methods that must be implemented by specific integrations
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract authenticate(): Promise<boolean>;
  abstract refreshCredentials(): Promise<void>;

  // Sync operations
  abstract syncData(operation: IntegrationSyncOperation): Promise<void>;
  abstract getAvailableDataTypes(): string[];
  abstract validateSyncConfiguration(config: Record<string, unknown>): boolean;

  // Webhook handling
  abstract processWebhook(webhookLog: IntegrationWebhookLog): Promise<void>;
  abstract validateWebhookSignature(headers: Record<string, string>, payload: string): boolean;

  // Data transformation
  abstract transformIncomingData(data: unknown): unknown;
  abstract transformOutgoingData(data: unknown): unknown;

  // Base implementation methods
  protected async updateConnectionStatus(status: IntegrationConnection['connectionStatus'], error?: string): Promise<void> {
    this.connection.connectionStatus = status;
    this.connection.updatedAt = new Date();
    
    if (error) {
      this.connection.lastError = error;
      this.connection.errorCount += 1;
    } else {
      this.connection.lastError = undefined;
      if (status === 'active') {
        this.connection.errorCount = 0;
      }
    }
  }

  protected async recordSyncOperation(operation: Partial<IntegrationSyncOperation>): Promise<string> {
    const syncOperation: IntegrationSyncOperation = {
      id: this.generateId(),
      connectionId: this.connection.id,
      operationType: operation.operationType || 'full_sync',
      operationStatus: 'queued',
      progress: 0,
      operationData: operation.operationData || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...operation
    };

    // In a real implementation, this would save to database
    console.log('Recording sync operation:', syncOperation);
    
    return syncOperation.id;
  }

  protected async updateSyncOperation(
    operationId: string, 
    updates: Partial<IntegrationSyncOperation>
  ): Promise<void> {
    // In a real implementation, this would update the database record
    console.log('Updating sync operation:', operationId, updates);
  }

  protected async recordWebhookLog(
    event: string, 
    headers: Record<string, string>, 
    payload: Record<string, unknown>
  ): Promise<string> {
    const webhookLog: IntegrationWebhookLog = {
      id: this.generateId(),
      connectionId: this.connection.id,
      webhookEvent: event,
      headers,
      payload,
      processingStatus: 'pending',
      retryCount: 0,
      receivedAt: new Date()
    };

    // In a real implementation, this would save to database
    console.log('Recording webhook log:', webhookLog);
    
    return webhookLog.id;
  }

  protected async updateWebhookLog(
    logId: string, 
    status: IntegrationWebhookLog['processingStatus'], 
    error?: string
  ): Promise<void> {
    const updates = {
      processingStatus: status,
      processedAt: new Date(),
      errorMessage: error
    };

    // In a real implementation, this would update the database record
    console.log('Updating webhook log:', logId, updates);
  }

  protected async handleError(error: unknown, context: string): Promise<void> {
    const integrationError = new IntegrationError({
      code: 'INTEGRATION_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: { context, connectionId: this.connection.id }
    });

    console.error('Integration error:', integrationError);
    
    await this.updateConnectionStatus('error', integrationError.message);
  }

  protected validateCredentials(): boolean {
    if (!this.connection.credentials || typeof this.connection.credentials !== 'object') {
      return false;
    }

    // Basic validation - specific integrations should override this
    return Object.keys(this.connection.credentials).length > 0;
  }

  protected getCredential(key: string): unknown {
    return this.connection.credentials[key];
  }

  protected setCredential(key: string, value: unknown): void {
    this.connection.credentials[key] = value;
    this.connection.updatedAt = new Date();
  }

  protected getConfiguration(key: string): unknown {
    return this.connection.configuration[key];
  }

  protected setConfiguration(key: string, value: unknown): void {
    this.connection.configuration[key] = value;
    this.connection.updatedAt = new Date();
  }

  protected async updateLastSync(timestamp?: Date): Promise<void> {
    this.connection.lastSyncAt = timestamp || new Date();
    this.connection.updatedAt = new Date();
    
    // Calculate next sync time if frequency is set
    if (this.connection.syncFrequencyMinutes) {
      this.connection.nextSyncAt = new Date(
        this.connection.lastSyncAt.getTime() + 
        (this.connection.syncFrequencyMinutes * 60 * 1000)
      );
    }
  }

  protected async scheduleNextSync(): Promise<void> {
    if (this.connection.syncFrequencyMinutes) {
      this.connection.nextSyncAt = new Date(
        Date.now() + (this.connection.syncFrequencyMinutes * 60 * 1000)
      );
    }
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async retry<T>(
    operation: () => Promise<T>, 
    maxAttempts: number = 3, 
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxAttempts) {
          await this.sleep(delayMs * attempt); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  // Utility methods for common operations
  protected isConnectionActive(): boolean {
    return this.connection.connectionStatus === 'active';
  }

  protected isConnectionExpired(): boolean {
    // Check if connection needs credential refresh
    // This is a basic implementation - specific integrations should override
    return false;
  }

  protected async getMetrics(): Promise<IntegrationMetrics> {
    // In a real implementation, this would fetch from database
    return {
      connectionId: this.connection.id,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageProcessingTime: 0,
      lastOperationAt: this.connection.lastSyncAt,
      uptimePercentage: this.connection.connectionStatus === 'active' ? 100 : 0
    };
  }

  // Lifecycle methods
  async initialize(): Promise<void> {
    if (!this.validateCredentials()) {
      throw new IntegrationError({
        code: 'INVALID_CREDENTIALS',
        message: 'Connection credentials are invalid or missing'
      });
    }

    await this.connect();
  }

  async destroy(): Promise<void> {
    try {
      await this.disconnect();
    } catch (error) {
      console.warn('Error during connection cleanup:', error);
    }
  }
}