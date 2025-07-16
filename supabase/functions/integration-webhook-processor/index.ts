import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { WebhookHandler, IntegrationHandler } from '../_shared/integrations/webhook-handler.ts';
import { SignatureValidator } from '../_shared/integrations/signature-validator.ts';
import { EventProcessor } from '../_shared/integrations/event-processor.ts';

// CORS headers following existing patterns
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Request interface
interface WebhookRequest {
  connectionId: string;
  integrationType: string;
  eventType?: string;
  payload: Record<string, unknown>;
}

// Generic integration handler implementation
class GenericIntegrationHandler implements IntegrationHandler {
  private eventProcessor: EventProcessor;
  private integrationType: string;

  constructor(integrationType: string) {
    this.integrationType = integrationType;
    this.eventProcessor = new EventProcessor();
    this.eventProcessor.initializeDefaultRules();
  }

  canHandle(event: any): boolean {
    // Generic handler can handle any event type
    return true;
  }

  async process(event: any): Promise<any> {
    try {
      console.log(`Processing ${this.integrationType} webhook:`, event.event);

      // Process the event using the event processor
      const processedEvents = await this.eventProcessor.processEvent(
        this.integrationType,
        event.event,
        event.payload
      );

      // If no specific rules matched, create a generic event
      if (processedEvents.length === 0) {
        const genericEvent = EventProcessor.createGenericEvent(
          event.event,
          event.payload,
          this.integrationType
        );
        processedEvents.push(genericEvent);
      }

      // Store processed events
      await this.eventProcessor.storeProcessedEvents(event.connectionId, processedEvents);

      return {
        success: true,
        processedData: {
          eventsProcessed: processedEvents.length,
          events: processedEvents
        }
      };
    } catch (error) {
      console.error(`Error processing ${this.integrationType} webhook:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateSignature(headers: Record<string, string>, payload: string): Promise<boolean> {
    // Get webhook secret from connection configuration
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
      // For this generic handler, we'll skip signature validation
      // In a real implementation, you'd fetch the webhook secret from the connection config
      console.log(`Signature validation for ${this.integrationType} - using generic validation`);
      return true; // Allow for development, should be implemented per integration
    } catch (error) {
      console.error('Error validating signature:', error);
      return false;
    }
  }
}

// Main webhook processor handler
const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log('Processing webhook request...');

    // Parse request body
    const body = await req.text();
    let webhookData: WebhookRequest;

    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required fields
    if (!webhookData.connectionId || !webhookData.integrationType || !webhookData.payload) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: connectionId, integrationType, payload' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract headers
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Initialize webhook handler
    const webhookHandler = new WebhookHandler();

    // Register generic handler for the integration type
    const integrationHandler = new GenericIntegrationHandler(webhookData.integrationType);
    webhookHandler.registerHandler(webhookData.integrationType, integrationHandler);

    // Process the webhook
    const result = await webhookHandler.processWebhook(
      webhookData.connectionId,
      webhookData.integrationType,
      webhookData.eventType || 'generic_event',
      webhookData.payload,
      headers
    );

    const statusCode = result.success ? 200 : 400;
    
    console.log('Webhook processing completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in webhook processor:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

// Serve the function
serve(handler);

// Log function startup
console.log('Integration Webhook Processor function started successfully');
console.log('Supports generic webhook processing for any integration type');
console.log('Example request format:');
console.log(JSON.stringify({
  connectionId: 'uuid-here',
  integrationType: 'github',
  eventType: 'push',
  payload: {
    // webhook payload data
  }
}, null, 2));