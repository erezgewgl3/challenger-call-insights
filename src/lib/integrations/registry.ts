import { IntegrationConfig, IntegrationConnection, IntegrationError } from './types';
import { IntegrationUtils } from './utils';

export class IntegrationRegistry {
  private integrations: Map<string, IntegrationConfig> = new Map();
  private connections: Map<string, IntegrationConnection> = new Map();
  private utils: IntegrationUtils;

  constructor() {
    this.utils = new IntegrationUtils();
  }

  // Integration Management
  registerIntegration(config: IntegrationConfig): void {
    if (this.integrations.has(config.id)) {
      throw new IntegrationError({
        code: 'INTEGRATION_ALREADY_EXISTS',
        message: `Integration with ID ${config.id} already exists`,
        timestamp: new Date()
      });
    }

    this.validateIntegrationConfig(config);
    this.integrations.set(config.id, config);
  }

  unregisterIntegration(integrationId: string): void {
    if (!this.integrations.has(integrationId)) {
      throw new IntegrationError({
        code: 'INTEGRATION_NOT_FOUND',
        message: `Integration with ID ${integrationId} not found`,
        timestamp: new Date()
      });
    }

    // Remove all connections for this integration
    const connectionsToRemove = Array.from(this.connections.values())
      .filter(conn => conn.integrationId === integrationId);
    
    connectionsToRemove.forEach(conn => {
      this.connections.delete(conn.id);
    });

    this.integrations.delete(integrationId);
  }

  getIntegration(integrationId: string): IntegrationConfig | null {
    return this.integrations.get(integrationId) || null;
  }

  getAllIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values());
  }

  getIntegrationsByCategory(category: IntegrationConfig['category']): IntegrationConfig[] {
    return Array.from(this.integrations.values())
      .filter(integration => integration.category === category);
  }

  getActiveIntegrations(): IntegrationConfig[] {
    return Array.from(this.integrations.values())
      .filter(integration => integration.isActive && !integration.isDeprecated);
  }

  // Connection Management
  addConnection(connection: IntegrationConnection): void {
    if (!this.integrations.has(connection.integrationId)) {
      throw new IntegrationError({
        code: 'INTEGRATION_NOT_FOUND',
        message: `Integration with ID ${connection.integrationId} not found`,
        timestamp: new Date()
      });
    }

    this.validateConnection(connection);
    this.connections.set(connection.id, connection);
  }

  removeConnection(connectionId: string): void {
    if (!this.connections.has(connectionId)) {
      throw new IntegrationError({
        code: 'CONNECTION_NOT_FOUND',
        message: `Connection with ID ${connectionId} not found`,
        timestamp: new Date()
      });
    }

    this.connections.delete(connectionId);
  }

  getConnection(connectionId: string): IntegrationConnection | null {
    return this.connections.get(connectionId) || null;
  }

  getConnectionsByUser(userId: string): IntegrationConnection[] {
    return Array.from(this.connections.values())
      .filter(connection => connection.userId === userId);
  }

  getConnectionsByIntegration(integrationId: string): IntegrationConnection[] {
    return Array.from(this.connections.values())
      .filter(connection => connection.integrationId === integrationId);
  }

  getActiveConnections(): IntegrationConnection[] {
    return Array.from(this.connections.values())
      .filter(connection => connection.connectionStatus === 'active');
  }

  // Validation Methods
  private validateIntegrationConfig(config: IntegrationConfig): void {
    if (!config.id || typeof config.id !== 'string') {
      throw new IntegrationError({
        code: 'INVALID_INTEGRATION_ID',
        message: 'Integration ID must be a non-empty string',
        timestamp: new Date()
      });
    }

    if (!config.name || typeof config.name !== 'string') {
      throw new IntegrationError({
        code: 'INVALID_INTEGRATION_NAME',
        message: 'Integration name must be a non-empty string',
        timestamp: new Date()
      });
    }

    if (!config.version || typeof config.version !== 'string') {
      throw new IntegrationError({
        code: 'INVALID_INTEGRATION_VERSION',
        message: 'Integration version must be a non-empty string',
        timestamp: new Date()
      });
    }

    if (!Array.isArray(config.requiredFields)) {
      throw new IntegrationError({
        code: 'INVALID_REQUIRED_FIELDS',
        message: 'Required fields must be an array',
        timestamp: new Date()
      });
    }

    if (!Array.isArray(config.capabilities)) {
      throw new IntegrationError({
        code: 'INVALID_CAPABILITIES',
        message: 'Capabilities must be an array',
        timestamp: new Date()
      });
    }
  }

  private validateConnection(connection: IntegrationConnection): void {
    if (!connection.id || typeof connection.id !== 'string') {
      throw new IntegrationError({
        code: 'INVALID_CONNECTION_ID',
        message: 'Connection ID must be a non-empty string',
        timestamp: new Date()
      });
    }

    if (!connection.userId || typeof connection.userId !== 'string') {
      throw new IntegrationError({
        code: 'INVALID_USER_ID',
        message: 'User ID must be a non-empty string',
        timestamp: new Date()
      });
    }

    if (!connection.connectionName || typeof connection.connectionName !== 'string') {
      throw new IntegrationError({
        code: 'INVALID_CONNECTION_NAME',
        message: 'Connection name must be a non-empty string',
        timestamp: new Date()
      });
    }

    const validStatuses = ['active', 'inactive', 'error', 'pending'];
    if (!validStatuses.includes(connection.connectionStatus)) {
      throw new IntegrationError({
        code: 'INVALID_CONNECTION_STATUS',
        message: `Connection status must be one of: ${validStatuses.join(', ')}`,
        timestamp: new Date()
      });
    }
  }

  // Utility Methods
  isIntegrationSupported(integrationId: string): boolean {
    const integration = this.integrations.get(integrationId);
    return integration ? integration.isActive && !integration.isDeprecated : false;
  }

  getIntegrationCapabilities(integrationId: string): string[] {
    const integration = this.integrations.get(integrationId);
    return integration ? integration.capabilities.map(cap => cap.type) : [];
  }

  hasCapability(integrationId: string, capability: string): boolean {
    const capabilities = this.getIntegrationCapabilities(integrationId);
    return capabilities.includes(capability);
  }

  getConnectionHealth(connectionId: string): 'healthy' | 'warning' | 'critical' | 'unknown' {
    const connection = this.connections.get(connectionId);
    if (!connection) return 'unknown';

    if (connection.connectionStatus === 'active' && connection.errorCount === 0) {
      return 'healthy';
    }

    if (connection.connectionStatus === 'active' && connection.errorCount < 5) {
      return 'warning';
    }

    return 'critical';
  }

  // Search and Filter Methods
  searchIntegrations(query: string): IntegrationConfig[] {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.integrations.values())
      .filter(integration => 
        integration.name.toLowerCase().includes(lowercaseQuery) ||
        integration.description.toLowerCase().includes(lowercaseQuery) ||
        integration.category.toLowerCase().includes(lowercaseQuery)
      );
  }

  getStats() {
    return {
      totalIntegrations: this.integrations.size,
      activeIntegrations: this.getActiveIntegrations().length,
      totalConnections: this.connections.size,
      activeConnections: this.getActiveConnections().length,
      integrationsPerCategory: this.getIntegrationCategoryStats()
    };
  }

  private getIntegrationCategoryStats() {
    const stats: Record<string, number> = {};
    Array.from(this.integrations.values()).forEach(integration => {
      stats[integration.category] = (stats[integration.category] || 0) + 1;
    });
    return stats;
  }
}