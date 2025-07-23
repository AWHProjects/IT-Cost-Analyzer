import { BaseConnector, ConnectorConfig, ConnectorResponse, UserData, LicenseData, UsageData } from './baseConnector';

interface GitHubConfig extends ConnectorConfig {
  accessToken: string;
  organizationName: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  company: string;
  location: string;
  created_at: string;
  updated_at: string;
  type: string;
  site_admin: boolean;
}

interface GitHubOrganization {
  id: number;
  login: string;
  name: string;
  company: string;
  plan: {
    name: string;
    space: number;
    private_repos: number;
    filled_seats: number;
    seats: number;
  };
  owned_private_repos: number;
  total_private_repos: number;
  public_repos: number;
}

interface GitHubMember {
  id: number;
  login: string;
  name: string;
  email: string;
  role: string;
  state: string;
}

export class GitHubConnector extends BaseConnector {
  protected config: GitHubConfig;
  private baseUrl = 'https://api.github.com';

  constructor(config: GitHubConfig) {
    super(config, 'GitHub');
    this.config = config;
  }

  async authenticate(): Promise<ConnectorResponse<boolean>> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/user`, {
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Authentication failed: ${response.statusText}`,
        };
      }

      const userData = await response.json() as GitHubUser;

      // Verify organization access
      const orgResponse = await this.makeRequest(`${this.baseUrl}/orgs/${this.config.organizationName}`, {
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!orgResponse.ok) {
        return {
          success: false,
          error: `Cannot access organization ${this.config.organizationName}: ${orgResponse.statusText}`,
        };
      }

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

      const page = pageToken ? parseInt(pageToken, 10) : 1;
      const response = await this.makeRequest(
        `${this.baseUrl}/orgs/${this.config.organizationName}/members?per_page=100&page=${page}`,
        {
          headers: {
            'Authorization': `token ${this.config.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch users: ${response.statusText}`,
        };
      }

      const members = await response.json() as GitHubMember[];
      const users: UserData[] = [];

      // Get detailed info for each member
      for (const member of members) {
        try {
          const userResponse = await this.makeRequest(`${this.baseUrl}/users/${member.login}`, {
            headers: {
              'Authorization': `token ${this.config.accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });

          if (userResponse.ok) {
            const userDetail = await userResponse.json() as GitHubUser;
            users.push({
              id: userDetail.id.toString(),
              email: userDetail.email || `${userDetail.login}@github.local`,
              name: userDetail.name || userDetail.login,
              isActive: true,
              lastLogin: new Date(userDetail.updated_at),
              licenses: ['github-user'],
              department: userDetail.company,
              role: member.role || 'member',
            });
          }
        } catch (error) {
          // Continue with next user if one fails
          console.warn(`Failed to fetch details for user ${member.login}:`, error);
        }
      }

      // Check if there are more pages
      const linkHeader = response.headers.get('Link');
      const hasNextPage = linkHeader && linkHeader.includes('rel="next"');

      return {
        success: true,
        data: users,
        nextPageToken: hasNextPage ? (page + 1).toString() : undefined,
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

      const response = await this.makeRequest(`${this.baseUrl}/orgs/${this.config.organizationName}`, {
        headers: {
          'Authorization': `token ${this.config.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch organization info: ${response.statusText}`,
        };
      }

      const orgData = await response.json() as GitHubOrganization;

      const planCosts: { [key: string]: number } = {
        'free': 0,
        'team': 4,
        'business': 21,
        'enterprise': 21,
      };

      const planName = orgData.plan.name.toLowerCase();
      const costPerLicense = planCosts[planName] || 4;

      const licenses: LicenseData[] = [{
        id: 'github-organization',
        name: `GitHub ${orgData.plan.name}`,
        type: 'subscription',
        totalLicenses: orgData.plan.seats,
        usedLicenses: orgData.plan.filled_seats,
        availableLicenses: orgData.plan.seats - orgData.plan.filled_seats,
        costPerLicense,
        billingCycle: 'monthly',
      }];

      // Add additional license for private repositories if applicable
      if (orgData.plan.private_repos > 0) {
        licenses.push({
          id: 'github-private-repos',
          name: 'GitHub Private Repositories',
          type: 'usage-based',
          totalLicenses: orgData.plan.private_repos,
          usedLicenses: orgData.total_private_repos,
          availableLicenses: orgData.plan.private_repos - orgData.total_private_repos,
          costPerLicense: 0, // Usually included in plan
          billingCycle: 'monthly',
        });
      }

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

      // Get users first
      const usersResult = await this.getUsers();
      if (!usersResult.success || !usersResult.data) {
        return {
          success: false,
          error: 'Failed to fetch users for usage data',
        };
      }

      const usageData: UsageData[] = [];

      // Get repository activity for usage analysis
      const reposResponse = await this.makeRequest(
        `${this.baseUrl}/orgs/${this.config.organizationName}/repos?per_page=100&sort=updated`,
        {
          headers: {
            'Authorization': `token ${this.config.accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (reposResponse.ok) {
        const repos = await reposResponse.json() as Array<{
          id: number;
          name: string;
          updated_at: string;
          pushed_at: string;
        }>;

        // For each user, get their activity
        for (const user of usersResult.data) {
          try {
            // Get user's recent activity
            const eventsResponse = await this.makeRequest(
              `${this.baseUrl}/users/${user.name}/events?per_page=100`,
              {
                headers: {
                  'Authorization': `token ${this.config.accessToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                },
              }
            );

            let totalSessions = 0;
            let lastAccessed = new Date(0);
            const features: string[] = ['repositories'];

            if (eventsResponse.ok) {
              const events = await eventsResponse.json() as Array<{
                type: string;
                created_at: string;
                repo?: { name: string };
              }>;

              // Filter events within date range
              const filteredEvents = events.filter(event => {
                const eventDate = new Date(event.created_at);
                return eventDate >= startDate && eventDate <= endDate;
              });

              totalSessions = filteredEvents.length;
              
              if (filteredEvents.length > 0) {
                lastAccessed = new Date(filteredEvents[0].created_at);
              }

              // Determine features used based on event types
              const eventTypes = new Set(filteredEvents.map(e => e.type));
              if (eventTypes.has('PushEvent')) features.push('code-commits');
              if (eventTypes.has('PullRequestEvent')) features.push('pull-requests');
              if (eventTypes.has('IssuesEvent')) features.push('issues');
              if (eventTypes.has('CreateEvent')) features.push('repository-creation');
            }

            usageData.push({
              userId: user.id,
              applicationId: 'github',
              lastAccessed: lastAccessed > new Date(0) ? lastAccessed : user.lastLogin || new Date(),
              totalSessions,
              totalHours: Math.ceil(totalSessions * 0.5), // Estimate 30 minutes per session
              features,
            });

            // Rate limiting - small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.warn(`Failed to fetch usage data for user ${user.name}:`, error);
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
    // GitHub personal access tokens don't expire automatically
    // OAuth apps would need refresh token implementation
    return false;
  }
}