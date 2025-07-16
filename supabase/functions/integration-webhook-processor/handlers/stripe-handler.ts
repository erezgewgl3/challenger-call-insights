import { IntegrationHandler, WebhookEvent, WebhookProcessingResult } from '../../_shared/integrations/webhook-handler.ts';
import { SignatureValidator } from '../../_shared/integrations/signature-validator.ts';
import { EventProcessor } from '../../_shared/integrations/event-processor.ts';

// Stripe-specific webhook handler
export class StripeWebhookHandler implements IntegrationHandler {
  private eventProcessor: EventProcessor;

  constructor() {
    this.eventProcessor = new EventProcessor();
    this.initializeStripeRules();
  }

  canHandle(event: WebhookEvent): boolean {
    // Stripe events we can process
    const supportedEvents = [
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'customer.created',
      'customer.updated',
      'customer.deleted',
      'invoice.created',
      'invoice.paid',
      'invoice.payment_failed',
      'subscription.created',
      'subscription.updated',
      'subscription.deleted'
    ];

    return supportedEvents.some(eventType => event.event.startsWith(eventType.split('.')[0]));
  }

  async process(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      console.log(`Processing Stripe webhook: ${event.event}`);

      // Process the event using Stripe-specific rules
      const processedEvents = await this.eventProcessor.processEvent(
        'stripe',
        event.event,
        event.payload
      );

      if (processedEvents.length === 0) {
        // Create generic event for unsupported Stripe events
        const genericEvent = EventProcessor.createGenericEvent(
          event.event,
          event.payload,
          'stripe'
        );
        processedEvents.push(genericEvent);
      }

      // Store processed events
      await this.eventProcessor.storeProcessedEvents(event.connectionId, processedEvents);

      // Perform Stripe-specific actions based on event type
      const actionResults = await this.performStripeActions(event.event, processedEvents);

      return {
        success: true,
        processedData: {
          eventsProcessed: processedEvents.length,
          events: processedEvents,
          actions: actionResults
        }
      };

    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateSignature(headers: Record<string, string>, payload: string): Promise<boolean> {
    const signature = headers['stripe-signature'] || headers['Stripe-Signature'];
    
    if (!signature) {
      console.warn('Stripe webhook signature not found in headers');
      return false;
    }

    // In a real implementation, you'd fetch the webhook secret from connection config
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
    
    if (!webhookSecret) {
      console.warn('Stripe webhook secret not configured');
      return false;
    }

    return await SignatureValidator.validateStripeSignature(payload, signature, webhookSecret);
  }

  private initializeStripeRules(): void {
    const rules = EventProcessor.createStripeRules();
    rules.forEach(rule => {
      this.eventProcessor.registerRule('stripe', rule);
    });
  }

  private async performStripeActions(eventType: string, processedEvents: any[]): Promise<any[]> {
    const actions = [];

    for (const event of processedEvents) {
      if (eventType.startsWith('payment_intent.')) {
        actions.push(await this.handlePaymentIntentEvent(eventType, event));
      } else if (eventType.startsWith('customer.')) {
        actions.push(await this.handleCustomerEvent(eventType, event));
      } else if (eventType.startsWith('invoice.')) {
        actions.push(await this.handleInvoiceEvent(eventType, event));
      } else if (eventType.startsWith('subscription.')) {
        actions.push(await this.handleSubscriptionEvent(eventType, event));
      } else {
        actions.push({ action: 'logged', eventType });
      }
    }

    return actions;
  }

  private async handlePaymentIntentEvent(eventType: string, event: any): Promise<any> {
    try {
      const paymentIntent = event.data.data?.object;
      
      console.log(`Processing payment intent ${eventType}: ${paymentIntent?.id}`);

      switch (eventType) {
        case 'payment_intent.succeeded':
          return {
            action: 'payment_succeeded',
            paymentIntentId: paymentIntent?.id,
            amount: paymentIntent?.amount,
            currency: paymentIntent?.currency,
            customerId: paymentIntent?.customer
          };

        case 'payment_intent.payment_failed':
          return {
            action: 'payment_failed',
            paymentIntentId: paymentIntent?.id,
            amount: paymentIntent?.amount,
            currency: paymentIntent?.currency,
            lastPaymentError: paymentIntent?.last_payment_error
          };

        default:
          return {
            action: 'payment_intent_updated',
            paymentIntentId: paymentIntent?.id,
            status: paymentIntent?.status
          };
      }
    } catch (error) {
      console.error('Error handling payment intent event:', error);
      return { action: 'payment_intent_failed', error: error.message };
    }
  }

  private async handleCustomerEvent(eventType: string, event: any): Promise<any> {
    try {
      const customer = event.data.data?.object;
      
      console.log(`Processing customer ${eventType}: ${customer?.id}`);

      switch (eventType) {
        case 'customer.created':
          return {
            action: 'customer_created',
            customerId: customer?.id,
            email: customer?.email,
            name: customer?.name
          };

        case 'customer.updated':
          return {
            action: 'customer_updated',
            customerId: customer?.id,
            email: customer?.email,
            name: customer?.name
          };

        case 'customer.deleted':
          return {
            action: 'customer_deleted',
            customerId: customer?.id
          };

        default:
          return {
            action: 'customer_event',
            customerId: customer?.id,
            eventType
          };
      }
    } catch (error) {
      console.error('Error handling customer event:', error);
      return { action: 'customer_failed', error: error.message };
    }
  }

  private async handleInvoiceEvent(eventType: string, event: any): Promise<any> {
    try {
      const invoice = event.data.data?.object;
      
      console.log(`Processing invoice ${eventType}: ${invoice?.id}`);

      switch (eventType) {
        case 'invoice.created':
          return {
            action: 'invoice_created',
            invoiceId: invoice?.id,
            customerId: invoice?.customer,
            amount: invoice?.total,
            status: invoice?.status
          };

        case 'invoice.paid':
          return {
            action: 'invoice_paid',
            invoiceId: invoice?.id,
            customerId: invoice?.customer,
            amount: invoice?.amount_paid
          };

        case 'invoice.payment_failed':
          return {
            action: 'invoice_payment_failed',
            invoiceId: invoice?.id,
            customerId: invoice?.customer,
            amount: invoice?.total
          };

        default:
          return {
            action: 'invoice_event',
            invoiceId: invoice?.id,
            eventType
          };
      }
    } catch (error) {
      console.error('Error handling invoice event:', error);
      return { action: 'invoice_failed', error: error.message };
    }
  }

  private async handleSubscriptionEvent(eventType: string, event: any): Promise<any> {
    try {
      const subscription = event.data.data?.object;
      
      console.log(`Processing subscription ${eventType}: ${subscription?.id}`);

      switch (eventType) {
        case 'subscription.created':
          return {
            action: 'subscription_created',
            subscriptionId: subscription?.id,
            customerId: subscription?.customer,
            status: subscription?.status,
            priceId: subscription?.items?.data?.[0]?.price?.id
          };

        case 'subscription.updated':
          return {
            action: 'subscription_updated',
            subscriptionId: subscription?.id,
            customerId: subscription?.customer,
            status: subscription?.status
          };

        case 'subscription.deleted':
          return {
            action: 'subscription_deleted',
            subscriptionId: subscription?.id,
            customerId: subscription?.customer
          };

        default:
          return {
            action: 'subscription_event',
            subscriptionId: subscription?.id,
            eventType
          };
      }
    } catch (error) {
      console.error('Error handling subscription event:', error);
      return { action: 'subscription_failed', error: error.message };
    }
  }
}