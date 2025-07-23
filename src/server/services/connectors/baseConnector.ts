import { logger } from '../../utils/logger';

export interface ConnectorConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
  organizationId?: string;
  tenantId?: string;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLogin?: Date;
  licenses: string[];
  department?: string;
  role?: string;
}

export interface LicenseData {
  id: string;
  name: string;
  type: string;
  totalLicenses: number;
  usedLicenses: number;
  availableLicenses: number;
  costPerLicense: number;
  billingCycle: 'monthly' | 'yearly';
  renewalDate?: Date;
}

export interface UsageData {
  userId: string;
  applicationId: string;
  lastAccessed: Date;
  totalSessions: number;
  totalHours: number;
  features: string[];
}

export interface ConnectorResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rateLimitRemaining?: number;
  nextPageToken?: string;
}

export abstract class BaseConnector {
  protected config: ConnectorConfig;
  protected platformName: string;

  constructor(config: ConnectorConfig, platformName: string) {
    this.config = config;
    this.platformName = platformName;
  }

  abstract authenticate(): Promise<ConnectorResponse<boolean>>;
  abstract getUsers(pageToken?: string): Promise<ConnectorResponse<UserData[]>>;
  abstract getLicenses(): Promise<ConnectorResponse<LicenseData[]>>;
  abstract getUsageData(startDate: Date, endDate: Date): Promise<ConnectorResponse<UsageData[]>>;

  protected async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        logger.error(`${this.platformName} API request failed`, {
          status: response.status,
          statusText: response.statusText,
          url,
        });
      }

      return response;
    } catch (error) {
      logger.error(`${this.platformName} API request error`, { error, url });
      throw error;
    }
  }

  protected handleRateLimit(response: Response): number | undefined {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    return remaining ? parseInt(remaining, 10) : undefined;
  }

  protected async refreshAccessToken(): Promise<boolean> {
    // Override in specific connectors that support token refresh
    return false;
  }

  public async testConnection(): Promise<ConnectorResponse<boolean>> {
    try {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: `Authentication failed: ${authResult.error}`,
        };
      }

      // Try to fetch a small amount of data to verify connection
      const usersResult = await this.getUsers();
      return {
        success: usersResult.success,
        data: usersResult.success,
        error: usersResult.error,
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}