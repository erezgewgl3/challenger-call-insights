import { IntegrationHandler, WebhookEvent, WebhookProcessingResult } from '../../_shared/integrations/webhook-handler.ts';
import { SignatureValidator } from '../../_shared/integrations/signature-validator.ts';
import { EventProcessor } from '../../_shared/integrations/event-processor.ts';

// GitHub-specific webhook handler
export class GitHubWebhookHandler implements IntegrationHandler {
  private eventProcessor: EventProcessor;

  constructor() {
    this.eventProcessor = new EventProcessor();
    this.initializeGitHubRules();
  }

  canHandle(event: WebhookEvent): boolean {
    // GitHub events we can process
    const supportedEvents = [
      'push',
      'pull_request',
      'issues',
      'issue_comment',
      'pull_request_review',
      'release',
      'star',
      'fork',
      'watch',
      'commit_comment'
    ];

    return supportedEvents.includes(event.event);
  }

  async process(event: WebhookEvent): Promise<WebhookProcessingResult> {
    try {
      console.log(`Processing GitHub webhook: ${event.event}`);

      // Process the event using GitHub-specific rules
      const processedEvents = await this.eventProcessor.processEvent(
        'github',
        event.event,
        event.payload
      );

      if (processedEvents.length === 0) {
        return {
          success: false,
          error: `No processing rules found for GitHub event: ${event.event}`
        };
      }

      // Store processed events
      await this.eventProcessor.storeProcessedEvents(event.connectionId, processedEvents);

      // Perform GitHub-specific actions based on event type
      const actionResults = await this.performGitHubActions(event.event, processedEvents);

      return {
        success: true,
        processedData: {
          eventsProcessed: processedEvents.length,
          events: processedEvents,
          actions: actionResults
        }
      };

    } catch (error) {
      console.error('Error processing GitHub webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateSignature(headers: Record<string, string>, payload: string): Promise<boolean> {
    const signature = headers['x-hub-signature-256'] || headers['X-Hub-Signature-256'];
    
    if (!signature) {
      console.warn('GitHub webhook signature not found in headers');
      return false;
    }

    // In a real implementation, you'd fetch the webhook secret from connection config
    const webhookSecret = Deno.env.get('GITHUB_WEBHOOK_SECRET') || '';
    
    if (!webhookSecret) {
      console.warn('GitHub webhook secret not configured');
      return false;
    }

    return await SignatureValidator.validateGitHubSignature(payload, signature, webhookSecret);
  }

  private initializeGitHubRules(): void {
    const rules = EventProcessor.createGitHubRules();
    rules.forEach(rule => {
      this.eventProcessor.registerRule('github', rule);
    });
  }

  private async performGitHubActions(eventType: string, processedEvents: any[]): Promise<any[]> {
    const actions = [];

    for (const event of processedEvents) {
      switch (eventType) {
        case 'push':
          actions.push(await this.handlePushEvent(event));
          break;
        case 'pull_request':
          actions.push(await this.handlePullRequestEvent(event));
          break;
        case 'issues':
          actions.push(await this.handleIssueEvent(event));
          break;
        default:
          actions.push({ action: 'logged', eventType });
      }
    }

    return actions;
  }

  private async handlePushEvent(event: any): Promise<any> {
    try {
      const commits = event.data.commits || [];
      const repository = event.data.repository;

      console.log(`Processing push to ${repository?.full_name} with ${commits.length} commits`);

      // Example: Log commit information
      for (const commit of commits) {
        console.log(`Commit ${commit.id}: ${commit.message}`);
      }

      return {
        action: 'push_processed',
        repository: repository?.full_name,
        commitCount: commits.length,
        branch: event.data.ref
      };
    } catch (error) {
      console.error('Error handling push event:', error);
      return { action: 'push_failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async handlePullRequestEvent(event: any): Promise<any> {
    try {
      const pullRequest = event.data.pull_request;
      const action = event.action;

      console.log(`Pull request ${action}: #${pullRequest.number} - ${pullRequest.title}`);

      // Example: Different actions based on PR state
      switch (action) {
        case 'opened':
          return { action: 'pr_opened', prNumber: pullRequest.number };
        case 'closed':
          const merged = pullRequest.merged;
          return { 
            action: merged ? 'pr_merged' : 'pr_closed', 
            prNumber: pullRequest.number 
          };
        case 'review_requested':
          return { action: 'review_requested', prNumber: pullRequest.number };
        default:
          return { action: 'pr_updated', prNumber: pullRequest.number };
      }
    } catch (error) {
      console.error('Error handling pull request event:', error);
      return { action: 'pr_failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async handleIssueEvent(event: any): Promise<any> {
    try {
      const issue = event.data.issue;
      const action = event.action;

      console.log(`Issue ${action}: #${issue.number} - ${issue.title}`);

      return {
        action: `issue_${action}`,
        issueNumber: issue.number,
        issueState: issue.state
      };
    } catch (error) {
      console.error('Error handling issue event:', error);
      return { action: 'issue_failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}