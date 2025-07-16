import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

// Generic webhook handler types
export interface WebhookEvent {
  id: string;
  connectionId: string;
  event: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  timestamp: Date;
}

export interface WebhookProcessingResult {
  success: boolean;
  processedData?: Record<string, unknown>;
  error?: string;
  retryAfter?: number;
}

export interface IntegrationHandler {
  canHandle(event: WebhookEvent): boolean;
  process(event: WebhookEvent): Promise<WebhookProcessingResult>;
  validateSignature?(headers: Record<string, string>, payload: string): Promise<boolean>;
}

// Generic webhook handler class
export class WebhookHandler {
  private supabase;
  private handlers: Map<string, IntegrationHandler> = new Map();

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  // Register integration-specific handlers
  registerHandler(integrationType: string, handler: IntegrationHandler): void {
    this.handlers.set(integrationType, handler);
    console.log(`Registered webhook handler for integration: ${integrationType}`);
  }

  // Process incoming webhook
  async processWebhook(
    connectionId: string,
    integrationType: string,
    eventType: string,
    payload: Record<string, unknown>,
    headers: Record<string, string>
  ): Promise<WebhookProcessingResult> {
    const webhookEvent: WebhookEvent = {
      id: this.generateEventId(),
      connectionId,
      event: eventType,
      payload,
      headers,
      timestamp: new Date()
    };

    try {
      // Log the incoming webhook
      const logId = await this.logWebhookEvent(webhookEvent, 'pending');
      
      // Find appropriate handler
      const handler = this.handlers.get(integrationType);
      if (!handler) {
        const error = `No handler found for integration type: ${integrationType}`;
        await this.updateWebhookLog(logId, 'failed', error);
        return { success: false, error };
      }

      // Validate the handler can process this event
      if (!handler.canHandle(webhookEvent)) {
        const error = `Handler cannot process event type: ${eventType}`;
        await this.updateWebhookLog(logId, 'failed', error);
        return { success: false, error };
      }

      // Validate webhook signature if handler supports it
      if (handler.validateSignature) {
        const payloadString = JSON.stringify(payload);
        const isValidSignature = await handler.validateSignature(headers, payloadString);
        if (!isValidSignature) {
          const error = 'Invalid webhook signature';
          await this.updateWebhookLog(logId, 'failed', error);
          return { success: false, error };
        }
      }

      // Update status to processing
      await this.updateWebhookLog(logId, 'processing');

      // Process the webhook
      const result = await handler.process(webhookEvent);

      // Update final status
      const finalStatus = result.success ? 'completed' : 'failed';
      await this.updateWebhookLog(logId, finalStatus, result.error);

      console.log(`Webhook processed successfully: ${logId}`, result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error processing webhook:', errorMessage, error);
      
      // Try to log the error
      try {
        await this.logWebhookEvent(webhookEvent, 'failed', errorMessage);
      } catch (logError) {
        console.error('Failed to log webhook error:', logError);
      }

      return { success: false, error: errorMessage };
    }
  }

  // Get connection details for validation
  async getConnection(connectionId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('integration_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) {
        console.error('Error fetching connection:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getConnection:', error);
      return null;
    }
  }

  // Log webhook event to database
  private async logWebhookEvent(
    event: WebhookEvent,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('integration_webhook_logs')
        .insert({
          connection_id: event.connectionId,
          webhook_event: event.event,
          payload: event.payload,
          headers: event.headers,
          processing_status: status,
          error_message: errorMessage,
          retry_count: 0
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error logging webhook event:', error);
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Failed to log webhook event:', error);
      throw error;
    }
  }

  // Update webhook log status
  private async updateWebhookLog(
    logId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        processing_status: status,
        processed_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      const { error } = await this.supabase
        .from('integration_webhook_logs')
        .update(updateData)
        .eq('id', logId);

      if (error) {
        console.error('Error updating webhook log:', error);
      }
    } catch (error) {
      console.error('Failed to update webhook log:', error);
    }
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get webhook statistics
  async getWebhookStats(connectionId?: string): Promise<Record<string, number>> {
    try {
      let query = this.supabase
        .from('integration_webhook_logs')
        .select('processing_status');

      if (connectionId) {
        query = query.eq('connection_id', connectionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching webhook stats:', error);
        return {};
      }

      const stats = data.reduce((acc: Record<string, number>, log: any) => {
        acc[log.processing_status] = (acc[log.processing_status] || 0) + 1;
        return acc;
      }, {});

      return stats;
    } catch (error) {
      console.error('Error in getWebhookStats:', error);
      return {};
    }
  }

  // Retry failed webhooks
  async retryFailedWebhooks(maxRetries: number = 3): Promise<void> {
    try {
      const { data: failedLogs, error } = await this.supabase
        .from('integration_webhook_logs')
        .select('*')
        .eq('processing_status', 'failed')
        .lt('retry_count', maxRetries);

      if (error) {
        console.error('Error fetching failed webhooks:', error);
        return;
      }

      for (const log of failedLogs || []) {
        try {
          console.log(`Retrying webhook: ${log.id}`);
          
          // Increment retry count
          await this.supabase
            .from('integration_webhook_logs')
            .update({ retry_count: log.retry_count + 1 })
            .eq('id', log.id);

          // Get connection to determine integration type
          const connection = await this.getConnection(log.connection_id);
          if (!connection) {
            console.error(`Connection not found for webhook: ${log.id}`);
            continue;
          }

          // Retry processing
          await this.processWebhook(
            log.connection_id,
            connection.integration_type,
            log.webhook_event,
            log.payload,
            log.headers
          );

        } catch (retryError) {
          console.error(`Failed to retry webhook ${log.id}:`, retryError);
        }
      }
    } catch (error) {
      console.error('Error in retryFailedWebhooks:', error);
    }
  }
}