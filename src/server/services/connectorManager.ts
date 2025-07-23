import { BaseConnector, ConnectorConfig, ConnectorResponse, UserData, LicenseData, UsageData } from './connectors/baseConnector';
import { Microsoft365Connector } from './connectors/microsoft365Connector';
import { SlackConnector } from './connectors/slackConnector';
import { GitHubConnector } from './connectors/githubConnector';
import { logger } from '../utils/logger';
import DatabaseService from './database';

export interface ConnectorConfiguration {
  id: string;
  name: string;
  type: 'microsoft365' | 'slack' | 'github' | 'google-workspace' | 'zoom' | 'atlassian';
  config: ConnectorConfig;
  isActive: boolean;
  lastSync?: Date;
  organizationId: string;
}

export interface SyncResult {
  connectorId: string;
  success: boolean;
  usersCount: number;
  licensesCount: number;
  usageDataCount: number;
  error?: string;
  syncedAt: Date;
}

export class ConnectorManager {
  private connectors: Map<string, BaseConnector> = new Map();
  private db: DatabaseService;

  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * Register a new connector configuration
   */
  async registerConnector(config: ConnectorConfiguration): Promise<boolean> {
    try {
      const connector = this.createConnector(config.type, config.config);
      if (!connector) {
        logger.error('Failed to create connector', { type: config.type });
        return false;
      }

      // Test the connection
      const testResult = await connector.testConnection();
      if (!testResult.success) {
        logger.error('Connector connection test failed', { 
          connectorId: config.id, 
          error: testResult.error 
        });
        return false;
      }

      this.connectors.set(config.id, connector);
      
      // Store configuration in database
      await this.saveConnectorConfig(config);
      
      logger.info('Connector registered successfully', { connectorId: config.id });
      return true;
    } catch (error) {
      logger.error('Error registering connector', { 
        connectorId: config.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Remove a connector
   */
  async removeConnector(connectorId: string): Promise<boolean> {
    try {
      this.connectors.delete(connectorId);
      await this.deleteConnectorConfig(connectorId);
      logger.info('Connector removed successfully', { connectorId });
      return true;
    } catch (error) {
      logger.error('Error removing connector', { 
        connectorId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Sync data from a specific connector
   */
  async syncConnector(connectorId: string): Promise<SyncResult> {
    const startTime = new Date();
    const result: SyncResult = {
      connectorId,
      success: false,
      usersCount: 0,
      licensesCount: 0,
      usageDataCount: 0,
      syncedAt: startTime,
    };

    try {
      const connector = this.connectors.get(connectorId);
      if (!connector) {
        result.error = 'Connector not found';
        return result;
      }

      logger.info('Starting connector sync', { connectorId });

      // Sync users
      const usersResult = await this.syncUsers(connector, connectorId);
      result.usersCount = usersResult.count;

      // Sync licenses
      const licensesResult = await this.syncLicenses(connector, connectorId);
      result.licensesCount = licensesResult.count;

      // Sync usage data (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const usageResult = await this.syncUsageData(connector, connectorId, startDate, endDate);
      result.usageDataCount = usageResult.count;

      result.success = usersResult.success && licensesResult.success && usageResult.success;
      
      if (!result.success) {
        result.error = [usersResult.error, licensesResult.error, usageResult.error]
          .filter(Boolean)
          .join('; ');
      }

      // Update last sync time
      await this.updateLastSyncTime(connectorId, startTime);

      logger.info('Connector sync completed', { 
        connectorId, 
        success: result.success,
        usersCount: result.usersCount,
        licensesCount: result.licensesCount,
        usageDataCount: result.usageDataCount
      });

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error during connector sync', { connectorId, error: result.error });
    }

    return result;
  }

  /**
   * Sync all active connectors
   */
  async syncAllConnectors(organizationId?: string): Promise<SyncResult[]> {
    const configs = await this.getActiveConnectorConfigs(organizationId);
    const results: SyncResult[] = [];

    for (const config of configs) {
      if (!this.connectors.has(config.id)) {
        // Initialize connector if not already loaded
        const connector = this.createConnector(config.type, config.config);
        if (connector) {
          this.connectors.set(config.id, connector);
        }
      }

      const result = await this.syncConnector(config.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Get connector status
   */
  async getConnectorStatus(connectorId: string): Promise<{
    isConnected: boolean;
    lastSync?: Date;
    error?: string;
  }> {
    try {
      const connector = this.connectors.get(connectorId);
      if (!connector) {
        return { isConnected: false, error: 'Connector not found' };
      }

      const testResult = await connector.testConnection();
      const config = await this.getConnectorConfig(connectorId);

      return {
        isConnected: testResult.success,
        lastSync: config?.lastSync,
        error: testResult.error,
      };
    } catch (error) {
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all registered connectors for an organization
   */
  async listConnectors(organizationId: string): Promise<ConnectorConfiguration[]> {
    return this.getConnectorConfigs(organizationId);
  }

  private createConnector(type: string, config: ConnectorConfig): BaseConnector | null {
    switch (type) {
      case 'microsoft365':
        return new Microsoft365Connector(config as any);
      case 'slack':
        return new SlackConnector(config as any);
      case 'github':
        return new GitHubConnector(config as any);
      default:
        logger.warn('Unknown connector type', { type });
        return null;
    }
  }

  private async syncUsers(connector: BaseConnector, connectorId: string): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    try {
      let allUsers: UserData[] = [];
      let pageToken: string | undefined;

      do {
        const result = await connector.getUsers(pageToken);
        if (!result.success) {
          return { success: false, count: 0, error: result.error };
        }

        if (result.data) {
          allUsers = allUsers.concat(result.data);
        }

        pageToken = result.nextPageToken;
      } while (pageToken);

      // Store users in database
      await this.storeUsers(connectorId, allUsers);

      return { success: true, count: allUsers.length };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncLicenses(connector: BaseConnector, connectorId: string): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    try {
      const result = await connector.getLicenses();
      if (!result.success) {
        return { success: false, count: 0, error: result.error };
      }

      const licenses = result.data || [];
      
      // Store licenses in database
      await this.storeLicenses(connectorId, licenses);

      return { success: true, count: licenses.length };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncUsageData(
    connector: BaseConnector,
    connectorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> {
    try {
      const result = await connector.getUsageData(startDate, endDate);
      if (!result.success) {
        return { success: false, count: 0, error: result.error };
      }

      const usageData = result.data || [];
      
      // Store usage data in database
      await this.storeUsageData(connectorId, usageData);

      return { success: true, count: usageData.length };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Database operations (simplified - would use actual Prisma queries)
  private async saveConnectorConfig(config: ConnectorConfiguration): Promise<void> {
    // Implementation would save to database
    logger.info('Saving connector config', { connectorId: config.id });
  }

  private async deleteConnectorConfig(connectorId: string): Promise<void> {
    // Implementation would delete from database
    logger.info('Deleting connector config', { connectorId });
  }

  private async getConnectorConfig(connectorId: string): Promise<ConnectorConfiguration | null> {
    // Implementation would fetch from database
    return null;
  }

  private async getConnectorConfigs(organizationId: string): Promise<ConnectorConfiguration[]> {
    // Implementation would fetch from database
    return [];
  }

  private async getActiveConnectorConfigs(organizationId?: string): Promise<ConnectorConfiguration[]> {
    // Implementation would fetch active connectors from database
    return [];
  }

  private async updateLastSyncTime(connectorId: string, syncTime: Date): Promise<void> {
    // Implementation would update database
    logger.info('Updating last sync time', { connectorId, syncTime });
  }

  private async storeUsers(connectorId: string, users: UserData[]): Promise<void> {
    // Implementation would store users in database
    logger.info('Storing users', { connectorId, count: users.length });
  }

  private async storeLicenses(connectorId: string, licenses: LicenseData[]): Promise<void> {
    // Implementation would store licenses in database
    logger.info('Storing licenses', { connectorId, count: licenses.length });
  }

  private async storeUsageData(connectorId: string, usageData: UsageData[]): Promise<void> {
    // Implementation would store usage data in database
    logger.info('Storing usage data', { connectorId, count: usageData.length });
  }
}