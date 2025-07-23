import { BaseConnector, ConnectorConfig, ConnectorResponse, UserData, LicenseData, UsageData } from './baseConnector';

interface Microsoft365Config extends ConnectorConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
}

interface Microsoft365User {
  id: string;
  userPrincipalName: string;
  displayName: string;
  accountEnabled: boolean;
  lastSignInDateTime?: string;
  assignedLicenses: Array<{
    skuId: string;
  }>;
  department?: string;
  jobTitle?: string;
}

interface Microsoft365License {
  skuId: string;
  skuPartNumber: string;
  consumedUnits: number;
  prepaidUnits: {
    enabled: number;
    suspended: number;
    warning: number;
  };
  servicePlans: Array<{
    servicePlanId: string;
    servicePlanName: string;
    provisioningStatus: string;
  }>;
}

interface Microsoft365Usage {
  userPrincipalName: string;
  lastActivityDate: string;
  reportRefreshDate: string;
  [key: string]: any; // Various usage metrics depending on the service
}

export class Microsoft365Connector extends BaseConnector {
  protected config: Microsoft365Config;
  private baseUrl = 'https://graph.microsoft.com/v1.0';
  private authUrl = 'https://login.microsoftonline.com';

  constructor(config: Microsoft365Config) {
    super(config, 'Microsoft 365');
    this.config = config;
  }

  async authenticate(): Promise<ConnectorResponse<boolean>> {
    try {
      if (!this.config.accessToken) {
        const tokenResponse = await this.getAccessToken();
        if (!tokenResponse.success) {
          return tokenResponse;
        }
      }

      // Test the token by making a simple request
      const response = await this.makeRequest(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Try to refresh token
        const refreshResult = await this.refreshAccessToken();
        if (!refreshResult) {
          return {
            success: false,
            error: 'Authentication failed and token refresh unsuccessful',
          };
        }
      }

      return {
        success: response.ok,
        data: response.ok,
        error: response.ok ? undefined : `Authentication failed: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async getAccessToken(): Promise<ConnectorResponse<boolean>> {
    try {
      const tokenUrl = `${this.authUrl}/${this.config.tenantId}/oauth2/v2.0/token`;
      const body = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Token request failed: ${response.statusText}`,
        };
      }

      const tokenData = await response.json() as {
        access_token: string;
        refresh_token?: string;
      };
      this.config.accessToken = tokenData.access_token;
      this.config.refreshToken = tokenData.refresh_token;

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Token request error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getUsers(pageToken?: string): Promise<ConnectorResponse<UserData[]>> {
    try {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      let url = `${this.baseUrl}/users?$select=id,userPrincipalName,displayName,accountEnabled,lastSignInDateTime,assignedLicenses,department,jobTitle&$top=100`;
      if (pageToken) {
        url += `&$skiptoken=${pageToken}`;
      }

      const response = await this.makeRequest(url, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch users: ${response.statusText}`,
        };
      }

      const data = await response.json() as {
        value: Microsoft365User[];
        '@odata.nextLink'?: string;
      };
      const users: UserData[] = data.value.map((user: Microsoft365User) => ({
        id: user.id,
        email: user.userPrincipalName,
        name: user.displayName,
        isActive: user.accountEnabled,
        lastLogin: user.lastSignInDateTime ? new Date(user.lastSignInDateTime) : undefined,
        licenses: user.assignedLicenses.map(license => license.skuId),
        department: user.department,
        role: user.jobTitle,
      }));

      return {
        success: true,
        data: users,
        nextPageToken: data['@odata.nextLink'] ? this.extractSkipToken(data['@odata.nextLink']) : undefined,
        rateLimitRemaining: this.handleRateLimit(response),
      };
    } catch (error) {
      return {
        success: false,
        error: `Error fetching users: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getLicenses(): Promise<ConnectorResponse<LicenseData[]>> {
    try {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      const response = await this.makeRequest(`${this.baseUrl}/subscribedSkus`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch licenses: ${response.statusText}`,
        };
      }

      const data = await response.json() as {
        value: Microsoft365License[];
      };
      const licenses: LicenseData[] = data.value.map((license: Microsoft365License) => ({
        id: license.skuId,
        name: license.skuPartNumber,
        type: 'subscription',
        totalLicenses: license.prepaidUnits.enabled + license.prepaidUnits.suspended + license.prepaidUnits.warning,
        usedLicenses: license.consumedUnits,
        availableLicenses: license.prepaidUnits.enabled - license.consumedUnits,
        costPerLicense: this.estimateCostPerLicense(license.skuPartNumber),
        billingCycle: 'monthly',
      }));

      return {
        success: true,
        data: licenses,
        rateLimitRemaining: this.handleRateLimit(response),
      };
    } catch (error) {
      return {
        success: false,
        error: `Error fetching licenses: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getUsageData(startDate: Date, endDate: Date): Promise<ConnectorResponse<UsageData[]>> {
    try {
      const authResult = await this.authenticate();
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      // Get usage data for various Microsoft 365 services
      const services = ['getOffice365ActiveUserDetail', 'getTeamsUserActivityUserDetail', 'getSharePointActivityUserDetail'];
      const allUsageData: UsageData[] = [];

      for (const service of services) {
        const period = this.calculatePeriod(startDate, endDate);
        const response = await this.makeRequest(
          `${this.baseUrl}/reports/${service}(period='${period}')`,
          {
            headers: {
              'Authorization': `Bearer ${this.config.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const csvData = await response.text();
          const usageData = this.parseUsageCSV(csvData, service);
          allUsageData.push(...usageData);
        }
      }

      return {
        success: true,
        data: allUsageData,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error fetching usage data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  protected async refreshAccessToken(): Promise<boolean> {
    if (!this.config.refreshToken) {
      return false;
    }

    try {
      const tokenUrl = `${this.authUrl}/${this.config.tenantId}/oauth2/v2.0/token`;
      const body = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (response.ok) {
        const tokenData = await response.json() as {
          access_token: string;
          refresh_token?: string;
        };
        this.config.accessToken = tokenData.access_token;
        if (tokenData.refresh_token) {
          this.config.refreshToken = tokenData.refresh_token;
        }
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  private extractSkipToken(nextLink: string): string | undefined {
    const url = new URL(nextLink);
    return url.searchParams.get('$skiptoken') || undefined;
  }

  private estimateCostPerLicense(skuPartNumber: string): number {
    // Rough estimates for common Microsoft 365 licenses
    const costMap: { [key: string]: number } = {
      'ENTERPRISEPACK': 22, // Office 365 E3
      'ENTERPRISEPREMIUM': 35, // Office 365 E5
      'SPB': 12.50, // Microsoft 365 Business Premium
      'SPE_E3': 32, // Microsoft 365 E3
      'SPE_E5': 57, // Microsoft 365 E5
      'EXCHANGESTANDARD': 4, // Exchange Online Plan 1
      'EXCHANGEENTERPRISE': 8, // Exchange Online Plan 2
    };

    return costMap[skuPartNumber] || 10; // Default estimate
  }

  private calculatePeriod(startDate: Date, endDate: Date): string {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) return 'D7';
    if (diffDays <= 30) return 'D30';
    if (diffDays <= 90) return 'D90';
    return 'D180';
  }

  private parseUsageCSV(csvData: string, service: string): UsageData[] {
    const lines = csvData.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const usageData: UsageData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const userPrincipalName = values[headers.indexOf('User Principal Name')] || values[0];
      const lastActivityDate = values[headers.indexOf('Last Activity Date')] || values[1];

      if (userPrincipalName && lastActivityDate) {
        usageData.push({
          userId: userPrincipalName,
          applicationId: service,
          lastAccessed: new Date(lastActivityDate),
          totalSessions: parseInt(values[headers.indexOf('Total Sessions')] || '0', 10),
          totalHours: parseFloat(values[headers.indexOf('Total Hours')] || '0'),
          features: this.extractFeatures(values, headers, service),
        });
      }
    }

    return usageData;
  }

  private extractFeatures(values: string[], headers: string[], service: string): string[] {
    const features: string[] = [];
    
    // Extract relevant features based on the service
    if (service.includes('Teams')) {
      if (values[headers.indexOf('Has Other Action')] === 'Yes') features.push('Teams Chat');
      if (values[headers.indexOf('Meeting Count')] && parseInt(values[headers.indexOf('Meeting Count')], 10) > 0) features.push('Teams Meetings');
      if (values[headers.indexOf('Call Count')] && parseInt(values[headers.indexOf('Call Count')], 10) > 0) features.push('Teams Calls');
    } else if (service.includes('SharePoint')) {
      if (values[headers.indexOf('Viewed Or Edited File Count')] && parseInt(values[headers.indexOf('Viewed Or Edited File Count')], 10) > 0) features.push('SharePoint Files');
      if (values[headers.indexOf('Synced File Count')] && parseInt(values[headers.indexOf('Synced File Count')], 10) > 0) features.push('OneDrive Sync');
    }

    return features;
  }
}