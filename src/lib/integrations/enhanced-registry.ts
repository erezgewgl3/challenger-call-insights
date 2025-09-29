import { IntegrationConfig, IntegrationConnection } from './types';
import { IntegrationRegistry } from './registry';
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedIntegrationConfig extends IntegrationConfig {
  health?: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastSync?: Date;
  errorRate?: number;
  webhookEndpoint?: string;
  processorFunction?: string;
}

export interface SystemHealthMetrics {
  overall_health: 'healthy' | 'warning' | 'critical';
  total_connections: number;
  active_connections: number;
  error_rate_24h: number;
  avg_processing_time: number;
  integrations: Record<string, IntegrationHealthMetrics>;
}

export interface IntegrationHealthMetrics {
  connection_count: number;
  success_rate_24h: number;
  avg_response_time: number;
  last_successful_sync?: Date;
  recent_errors: string[];
}

export class EnhancedIntegrationRegistry extends IntegrationRegistry {
  private healthMetrics: Map<string, IntegrationHealthMetrics> = new Map();
  private systemHealth: SystemHealthMetrics | null = null;

  constructor() {
    super();
    this.initializeBuiltInIntegrations();
  }

  /**
   * Initialize built-in integrations with enhanced configurations
   */
  private initializeBuiltInIntegrations() {
    // Zoom Integration
    this.registerIntegration({
      id: 'zoom',
      name: 'Zoom',
      description: 'Video conferencing platform with automatic transcript processing',
      version: '1.0.0',
      category: 'communication',
      authType: 'oauth2',
      requiredFields: ['account_id', 'access_token'],
      optionalFields: ['refresh_token', 'webhook_secret'],
      capabilities: [
        {
          type: 'webhook',
          name: 'Webhook Processing',
          description: 'Receive real-time webhook events from Zoom',
          dataTypes: ['meeting_events', 'recording_events', 'transcript_events']
        },
        {
          type: 'sync',
          name: 'Meeting Sync',
          description: 'Synchronize meeting data and recordings',
          dataTypes: ['meetings', 'recordings', 'transcripts']
        },
        {
          type: 'export',
          name: 'Data Export',
          description: 'Export meeting data and analytics',
          dataTypes: ['meetings', 'participants', 'analytics']
        }
      ],
      webhookSupport: true,
      syncFrequencyMinutes: 15,
      iconUrl: '/integrations/zoom-icon.svg',
      documentationUrl: 'https://docs.zoom.us/docs/api/',
      supportUrl: 'https://support.zoom.us/',
      isActive: true,
      isDeprecated: false
    });

    // Zapier Integration
    this.registerIntegration({
      id: 'zapier',
      name: 'Zapier',
      description: 'Workflow automation platform connecting 5,000+ apps',
      version: '1.0.0',
      category: 'other',
      authType: 'api_key',
      requiredFields: ['api_key'],
      optionalFields: ['webhook_secret', 'rate_limit'],
      capabilities: [
        {
          type: 'webhook',
          name: 'Webhook Integration',
          description: 'Receive data from Zapier workflows',
          dataTypes: ['transcript_data', 'meeting_metadata']
        },
        {
          type: 'bidirectional',
          name: 'Two-way Sync',
          description: 'Send analysis results back to connected apps',
          dataTypes: ['analysis_results', 'coaching_insights']
        },
        {
          type: 'export',
          name: 'Data Export',
          description: 'Export data to connected applications',
          dataTypes: ['transcripts', 'analysis', 'reports']
        }
      ],
      webhookSupport: true,
      syncFrequencyMinutes: 5,
      iconUrl: '/integrations/zapier-icon.svg',
      documentationUrl: 'https://zapier.com/apps/sales-whisperer',
      supportUrl: 'https://zapier.com/help',
      isActive: true,
      isDeprecated: false
    });
  }

  /**
   * Get enhanced integration configuration with health metrics
   */
  async getEnhancedIntegration(integrationId: string): Promise<EnhancedIntegrationConfig | null> {
    const baseConfig = this.getIntegration(integrationId);
    if (!baseConfig) return null;

    const healthMetrics = await this.getIntegrationHealthMetrics(integrationId);
    
    return {
      ...baseConfig,
      health: this.calculateHealthStatus(healthMetrics),
      lastSync: healthMetrics?.last_successful_sync,
      errorRate: healthMetrics ? (100 - healthMetrics.success_rate_24h) : 0,
      webhookEndpoint: this.getWebhookEndpoint(integrationId),
      processorFunction: this.getProcessorFunction(integrationId)
    };
  }

  /**
   * Get webhook endpoint for integration
   */
  private getWebhookEndpoint(integrationId: string): string {
    const baseUrl = window.location.origin;
    
    switch (integrationId) {
      case 'zoom':
        return `${baseUrl}/functions/v1/zoom-webhook-processor`;
      case 'zapier':
        return `${baseUrl}/functions/v1/zapier-webhook-processor`;
      default:
        return `${baseUrl}/functions/v1/generic-webhook-processor`;
    }
  }

  /**
   * Get processor function name for integration
   */
  private getProcessorFunction(integrationId: string): string {
    switch (integrationId) {
      case 'zoom':
        return 'zoom-webhook-processor';
      case 'zapier':
        return 'zapier-webhook-processor';
      default:
        return 'generic-webhook-processor';
    }
  }

  /**
   * Get integration health metrics from Supabase
   */
  async getIntegrationHealthMetrics(integrationId: string): Promise<IntegrationHealthMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('integration_framework_get_system_stats');
      
      if (error) {
        console.error('Failed to fetch health metrics:', error);
        return null;
      }

      // Process the data to extract integration-specific metrics
      return this.processHealthMetrics(data, integrationId);
    } catch (error) {
      console.error('Health metrics error:', error);
      return null;
    }
  }

  /**
   * Process raw health data into structured metrics
   */
  private processHealthMetrics(data: any, integrationId: string): IntegrationHealthMetrics {
    // Default metrics structure
    const defaultMetrics: IntegrationHealthMetrics = {
      connection_count: 0,
      success_rate_24h: 100,
      avg_response_time: 0,
      recent_errors: []
    };

    if (!data) return defaultMetrics;

    // Extract integration-specific data from system stats
    return {
      connection_count: data.total_connections || 0,
      success_rate_24h: data.webhook_success_rate || 100,
      avg_response_time: data.avg_processing_time || 0,
      last_successful_sync: data.last_sync ? new Date(data.last_sync) : undefined,
      recent_errors: data.recent_errors || []
    };
  }

  /**
   * Calculate overall health status based on metrics
   */
  private calculateHealthStatus(metrics: IntegrationHealthMetrics | null): 'healthy' | 'warning' | 'critical' | 'unknown' {
    if (!metrics) return 'unknown';

    const { success_rate_24h, avg_response_time, recent_errors } = metrics;

    // Critical: Very low success rate or many recent errors
    if (success_rate_24h < 50 || recent_errors.length > 10) {
      return 'critical';
    }

    // Warning: Moderate success rate or some errors or slow response
    if (success_rate_24h < 90 || recent_errors.length > 0 || avg_response_time > 5000) {
      return 'warning';
    }

    // Healthy: Good performance metrics
    return 'healthy';
  }

  /**
   * Get system-wide health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      const { data, error } = await supabase.rpc('integration_framework_get_system_stats');
      
      if (error) throw error;

      const dataTyped = data as any;
      const overallHealth = this.calculateOverallHealth(dataTyped);
      
      return {
        overall_health: overallHealth,
        total_connections: dataTyped.total_connections || 0,
        active_connections: dataTyped.active_connections || 0,
        error_rate_24h: 100 - (dataTyped.webhook_success_rate || 100),
        avg_processing_time: dataTyped.avg_processing_time || 0,
        integrations: {
          zoom: await this.getIntegrationHealthMetrics('zoom') || this.getDefaultMetrics(),
          zapier: await this.getIntegrationHealthMetrics('zapier') || this.getDefaultMetrics()
        }
      };
    } catch (error) {
      console.error('System health check failed:', error);
      return this.getDefaultSystemHealth();
    }
  }

  /**
   * Calculate overall system health
   */
  private calculateOverallHealth(systemData: any): 'healthy' | 'warning' | 'critical' {
    const successRate = systemData.webhook_success_rate || 100;
    const activeConnections = systemData.active_connections || 0;
    const totalConnections = systemData.total_connections || 0;
    
    // Critical: Very low success rate or no active connections when there should be
    if (successRate < 50 || (totalConnections > 0 && activeConnections === 0)) {
      return 'critical';
    }
    
    // Warning: Moderate success rate or low connection ratio
    if (successRate < 90 || (totalConnections > 0 && activeConnections / totalConnections < 0.5)) {
      return 'warning';
    }
    
    return 'healthy';
  }

  /**
   * Get default metrics for fallback
   */
  private getDefaultMetrics(): IntegrationHealthMetrics {
    return {
      connection_count: 0,
      success_rate_24h: 100,
      avg_response_time: 0,
      recent_errors: []
    };
  }

  /**
   * Get default system health for fallback
   */
  private getDefaultSystemHealth(): SystemHealthMetrics {
    return {
      overall_health: 'healthy',
      total_connections: 0,
      active_connections: 0,
      error_rate_24h: 0,
      avg_processing_time: 0,
      integrations: {
        zoom: this.getDefaultMetrics(),
        zapier: this.getDefaultMetrics()
      }
    };
  }

  /**
   * Test integration connectivity
   */
  async testIntegrationConnection(connectionId: string): Promise<{
    success: boolean;
    response_time: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.rpc('integration_framework_get_connection_health', {
        connection_id: connectionId
      });
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          success: false,
          response_time: responseTime,
          error: error.message
        };
      }
      
      return {
        success: true,
        response_time: responseTime
      };
    } catch (error) {
      return {
        success: false,
        response_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get integration discovery data for auto-setup
   */
  async discoverAvailableIntegrations(): Promise<IntegrationConfig[]> {
    // Return built-in integrations plus any dynamically discovered ones
    const builtInIntegrations = this.getActiveIntegrations();
    
    // In the future, this could discover integrations from a registry API
    // const discoveredIntegrations = await this.fetchFromDiscoveryAPI();
    
    return builtInIntegrations;
  }
}

// Export singleton instance
export const enhancedRegistry = new EnhancedIntegrationRegistry();