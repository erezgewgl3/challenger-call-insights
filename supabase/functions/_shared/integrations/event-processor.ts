import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

// Event processing utilities for webhook data
export interface ProcessedEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  action: string;
  data: Record<string, unknown>;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

// Type definitions for common webhook payloads
interface GitHubPayload {
  repository?: { id?: number | string };
  pull_request?: { id?: number | string };
  action?: string;
  ref?: string;
  commits?: unknown[];
  pusher?: unknown;
  sender?: unknown;
}

interface StripePayload {
  type?: string;
  data?: {
    object?: { id?: string };
  };
}

interface SlackPayload {
  event?: {
    ts?: string;
    text?: string;
    user?: string;
    channel?: string;
  };
}

type WebhookPayload = GitHubPayload | StripePayload | SlackPayload | Record<string, unknown>;

export interface EventProcessingRule {
  eventPattern: RegExp;
  transformer: (payload: WebhookPayload) => ProcessedEvent;
  validator?: (event: ProcessedEvent) => boolean;
}

export class EventProcessor {
  private supabase;
  private rules: Map<string, EventProcessingRule[]> = new Map();

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  // Register processing rules for specific integration types
  registerRule(integrationType: string, rule: EventProcessingRule): void {
    if (!this.rules.has(integrationType)) {
      this.rules.set(integrationType, []);
    }
    this.rules.get(integrationType)!.push(rule);
    console.log(`Registered processing rule for ${integrationType}`);
  }

  // Process webhook event data
  async processEvent(
    integrationType: string,
    eventType: string,
    payload: WebhookPayload
  ): Promise<ProcessedEvent[]> {
    const rules = this.rules.get(integrationType) || [];
    const processedEvents: ProcessedEvent[] = [];

    for (const rule of rules) {
      if (rule.eventPattern.test(eventType)) {
        try {
          const processedEvent = rule.transformer(payload);
          
          // Validate if validator is provided
          if (rule.validator && !rule.validator(processedEvent)) {
            console.warn(`Event validation failed for ${eventType}`, processedEvent);
            continue;
          }

          processedEvents.push(processedEvent);
          console.log(`Successfully processed event: ${eventType}`, processedEvent);
        } catch (error) {
          console.error(`Error processing event ${eventType}:`, error);
        }
      }
    }

    return processedEvents;
  }

  // Store processed events in sync operations table
  async storeProcessedEvents(
    connectionId: string,
    events: ProcessedEvent[]
  ): Promise<void> {
    try {
      for (const event of events) {
        const { error } = await this.supabase
          .from('integration_sync_operations')
          .insert({
            connection_id: connectionId,
            operation_type: 'import',
            operation_status: 'completed',
            records_processed: 1,
            records_total: 1,
            progress_percentage: 100,
            operation_data: {
              event_type: event.eventType,
              entity_type: event.entityType,
              entity_id: event.entityId,
              action: event.action,
              data: event.data,
              metadata: event.metadata,
              processed_at: event.timestamp.toISOString()
            }
          });

        if (error) {
          console.error('Error storing processed event:', error);
        }
      }
    } catch (error) {
      console.error('Error in storeProcessedEvents:', error);
    }
  }

  // Extract common event patterns
  static extractCommonPatterns(payload: Record<string, unknown>): Partial<ProcessedEvent> {
    const extracted: Partial<ProcessedEvent> = {
      timestamp: new Date(),
      metadata: {}
    };

    // Try to extract common fields
    if (payload.id) {
      extracted.entityId = String(payload.id);
    }

    if (payload.type) {
      extracted.eventType = String(payload.type);
    }

    if (payload.action) {
      extracted.action = String(payload.action);
    }

    if (payload.object) {
      extracted.entityType = String(payload.object);
    }

    if (payload.data) {
      extracted.data = payload.data as Record<string, unknown>;
    }

    // Store original payload in metadata
    extracted.metadata!.originalPayload = payload;

    return extracted;
  }

  // GitHub-specific event processing
  static createGitHubRules(): EventProcessingRule[] {
    return [
      {
        eventPattern: /^push$/,
        transformer: (payload: WebhookPayload) => ({
          eventType: 'push',
          entityType: 'repository',
          entityId: String((payload as GitHubPayload).repository?.id || ''),
          action: 'push',
          data: {
            ref: (payload as GitHubPayload).ref,
            commits: (payload as GitHubPayload).commits,
            repository: (payload as GitHubPayload).repository,
            pusher: (payload as GitHubPayload).pusher
          },
          metadata: {
            source: 'github',
            originalPayload: payload
          },
          timestamp: new Date()
        })
      },
      {
        eventPattern: /^pull_request$/,
        transformer: (payload: WebhookPayload) => ({
          eventType: 'pull_request',
          entityType: 'pull_request',
          entityId: String((payload as GitHubPayload).pull_request?.id || ''),
          action: String((payload as GitHubPayload).action || ''),
          data: {
            pull_request: (payload as GitHubPayload).pull_request,
            repository: (payload as GitHubPayload).repository,
            sender: (payload as GitHubPayload).sender
          },
          metadata: {
            source: 'github',
            originalPayload: payload
          },
          timestamp: new Date()
        })
      }
    ];
  }

  // Stripe-specific event processing
  static createStripeRules(): EventProcessingRule[] {
    return [
      {
        eventPattern: /^payment_intent\./,
        transformer: (payload: WebhookPayload) => ({
          eventType: String((payload as StripePayload).type || ''),
          entityType: 'payment_intent',
          entityId: String((payload as StripePayload).data?.object?.id || ''),
          action: String((payload as StripePayload).type?.split('.')[1] || ''),
          data: (payload as StripePayload).data as Record<string, unknown>,
          metadata: {
            source: 'stripe',
            originalPayload: payload
          },
          timestamp: new Date(Number((payload as StripePayload & { created?: number }).created) * 1000)
        })
      },
      {
        eventPattern: /^customer\./,
        transformer: (payload: WebhookPayload) => ({
          eventType: String((payload as StripePayload).type || ''),
          entityType: 'customer',
          entityId: String((payload as StripePayload).data?.object?.id || ''),
          action: String((payload as StripePayload).type?.split('.')[1] || ''),
          data: (payload as StripePayload).data as Record<string, unknown>,
          metadata: {
            source: 'stripe',
            originalPayload: payload
          },
          timestamp: new Date(Number((payload as StripePayload & { created?: number }).created) * 1000)
        })
      }
    ];
  }

  // Slack-specific event processing
  static createSlackRules(): EventProcessingRule[] {
    return [
      {
        eventPattern: /^message$/,
        transformer: (payload: WebhookPayload) => ({
          eventType: 'message',
          entityType: 'message',
          entityId: String((payload as SlackPayload).event?.ts || Date.now()),
          action: 'sent',
          data: {
            text: (payload as SlackPayload).event?.text,
            user: (payload as SlackPayload).event?.user,
            channel: (payload as SlackPayload).event?.channel,
            timestamp: (payload as SlackPayload).event?.ts
          },
          metadata: {
            source: 'slack',
            originalPayload: payload
          },
          timestamp: new Date()
        })
      },
      {
        eventPattern: /^app_mention$/,
        transformer: (payload: WebhookPayload) => ({
          eventType: 'app_mention',
          entityType: 'message',
          entityId: String((payload as SlackPayload).event?.ts || Date.now()),
          action: 'mentioned',
          data: {
            text: (payload as SlackPayload).event?.text,
            user: (payload as SlackPayload).event?.user,
            channel: (payload as SlackPayload).event?.channel,
            timestamp: (payload as SlackPayload).event?.ts
          },
          metadata: {
            source: 'slack',
            originalPayload: payload
          },
          timestamp: new Date()
        })
      }
    ];
  }

  // Initialize default rules for common integrations
  initializeDefaultRules(): void {
    // GitHub rules
    EventProcessor.createGitHubRules().forEach((rule: EventProcessingRule) => {
      this.registerRule('github', rule);
    });

    // Stripe rules
    EventProcessor.createStripeRules().forEach((rule: EventProcessingRule) => {
      this.registerRule('stripe', rule);
    });

    // Slack rules
    EventProcessor.createSlackRules().forEach((rule: EventProcessingRule) => {
      this.registerRule('slack', rule);
    });

    console.log('Default event processing rules initialized');
  }

  // Generic event transformation for unknown integrations
  static createGenericEvent(
    eventType: string,
    payload: WebhookPayload,
    integrationType: string
  ): ProcessedEvent {
    const commonPatterns = this.extractCommonPatterns(payload as Record<string, unknown>);
    
    return {
      eventType: commonPatterns.eventType || eventType,
      entityType: commonPatterns.entityType || 'unknown',
      entityId: commonPatterns.entityId || `${Date.now()}`,
      action: commonPatterns.action || 'unknown',
      data: commonPatterns.data || (payload as Record<string, unknown>),
      metadata: {
        source: integrationType,
        originalPayload: payload,
        ...commonPatterns.metadata
      },
      timestamp: commonPatterns.timestamp || new Date()
    };
  }

  // Validate processed event
  static validateProcessedEvent(event: ProcessedEvent): boolean {
    return !!(
      event.eventType &&
      event.entityType &&
      event.entityId &&
      event.action &&
      event.data &&
      event.timestamp
    );
  }

  // Get event statistics
  async getEventStats(connectionId?: string): Promise<Record<string, number>> {
    try {
      let query = this.supabase
        .from('integration_sync_operations')
        .select('operation_data');

      if (connectionId) {
        query = query.eq('connection_id', connectionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching event stats:', error);
        return {};
      }

      const stats = data.reduce((acc: Record<string, number>, op: any) => {
        const eventType = op.operation_data?.event_type || 'unknown';
        acc[eventType] = (acc[eventType] || 0) + 1;
        return acc;
      }, {});

      return stats;
    } catch (error) {
      console.error('Error in getEventStats:', error);
      return {};
    }
  }
}