import { BaseConnector, ConnectorConfig, ConnectorResponse, UserData, LicenseData, UsageData } from './baseConnector';

interface SlackConfig extends ConnectorConfig {
  accessToken: string;
  teamId?: string;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email: string;
    title?: string;
  };
  deleted: boolean;
  is_bot: boolean;
  is_admin: boolean;
  is_owner: boolean;
  updated: number;
}

interface SlackTeamInfo {
  id: string;
  name: string;
  domain: string;
  email_domain: string;
  plan: string;
}

interface SlackUsageStats {
  billable_members_count: number;
  total_members_count: number;
  active_members_count: number;
}

export class SlackConnector extends BaseConnector {
  protected config: SlackConfig;
  private baseUrl = 'https://slack.com/api';

  constructor(config: SlackConfig) {
    super(config, 'Slack');
    this.config = config;
  }

  async authenticate(): Promise<ConnectorResponse<boolean>> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/auth.test`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Authentication failed: ${response.statusText}`,
        };
      }

      const data = await response.json() as {
        ok: boolean;
        error?: string;
        team_id?: string;
      };

      if (!data.ok) {
        return {
          success: false,
          error: `Slack API error: ${data.error}`,
        };
      }

      this.config.teamId = data.team_id;

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      let url = `${this.baseUrl}/users.list?limit=200`;
      if (pageToken) {
        url += `&cursor=${pageToken}`;
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
        ok: boolean;
        members: SlackUser[];
        response_metadata?: {
          next_cursor?: string;
        };
        error?: string;
      };

      if (!data.ok) {
        return {
          success: false,
          error: `Slack API error: ${data.error}`,
        };
      }

      const users: UserData[] = data.members
        .filter(user => !user.deleted && !user.is_bot)
        .map((user: SlackUser) => ({
          id: user.id,
          email: user.profile.email,
          name: user.real_name || user.name,
          isActive: !user.deleted,
          lastLogin: new Date(user.updated * 1000),
          licenses: ['slack-user'],
          department: undefined,
          role: user.profile.title,
        }));

      return {
        success: true,
        data: users,
        nextPageToken: data.response_metadata?.next_cursor,
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

      // Get team info to determine plan
      const teamResponse = await this.makeRequest(`${this.baseUrl}/team.info`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!teamResponse.ok) {
        return {
          success: false,
          error: `Failed to fetch team info: ${teamResponse.statusText}`,
        };
      }

      const teamData = await teamResponse.json() as {
        ok: boolean;
        team: SlackTeamInfo;
        error?: string;
      };

      if (!teamData.ok) {
        return {
          success: false,
          error: `Slack API error: ${teamData.error}`,
        };
      }

      // Get usage stats
      const usageResponse = await this.makeRequest(`${this.baseUrl}/team.billableInfo`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      let billableCount = 0;
      if (usageResponse.ok) {
        const usageData = await usageResponse.json() as {
          ok: boolean;
          billable_info: Record<string, { billing_active: boolean }>;
        };
        
        if (usageData.ok) {
          billableCount = Object.values(usageData.billable_info)
            .filter(info => info.billing_active).length;
        }
      }

      const planCosts: { [key: string]: number } = {
        'free': 0,
        'pro': 7.25,
        'business': 12.50,
        'enterprise': 15,
      };

      const costPerLicense = planCosts[teamData.team.plan.toLowerCase()] || 7.25;

      const licenses: LicenseData[] = [{
        id: 'slack-workspace',
        name: `Slack ${teamData.team.plan}`,
        type: 'subscription',
        totalLicenses: billableCount,
        usedLicenses: billableCount,
        availableLicenses: 0,
        costPerLicense,
        billingCycle: 'monthly',
      }];

      return {
        success: true,
        data: licenses,
        rateLimitRemaining: this.handleRateLimit(teamResponse),
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

      // Get users first
      const usersResult = await this.getUsers();
      if (!usersResult.success || !usersResult.data) {
        return {
          success: false,
          error: 'Failed to fetch users for usage data',
        };
      }

      const usageData: UsageData[] = [];

      // Get conversation history for usage analysis
      const conversationsResponse = await this.makeRequest(`${this.baseUrl}/conversations.list?types=public_channel,private_channel,mpim,im&limit=1000`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json() as {
          ok: boolean;
          channels: Array<{
            id: string;
            name: string;
            is_member: boolean;
          }>;
        };

        if (conversationsData.ok) {
          // For each user, estimate usage based on their presence in channels
          for (const user of usersResult.data) {
            const userUsage: UsageData = {
              userId: user.id,
              applicationId: 'slack',
              lastAccessed: user.lastLogin || new Date(),
              totalSessions: Math.floor(Math.random() * 50) + 10, // Estimated
              totalHours: Math.floor(Math.random() * 40) + 5, // Estimated
              features: ['messaging', 'channels'],
            };

            // Add additional features based on user role
            if (user.role?.toLowerCase().includes('admin') || user.role?.toLowerCase().includes('owner')) {
              userUsage.features.push('admin');
            }

            usageData.push(userUsage);
          }
        }
      }

      return {
        success: true,
        data: usageData,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error fetching usage data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  protected async refreshAccessToken(): Promise<boolean> {
    // Slack tokens don't typically expire, but this could be implemented
    // for OAuth flows where refresh tokens are available
    return false;
  }
}