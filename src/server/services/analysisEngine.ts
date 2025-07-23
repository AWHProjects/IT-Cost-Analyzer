import { db } from './database';
import { logger } from '../utils/logger';

export interface CostTrend {
  date: Date;
  totalCost: number;
  newLicenses: number;
  cancelledLicenses: number;
  growthRate: number;
}

export interface LicenseUtilization {
  applicationId: string;
  applicationName: string;
  totalLicenses: number;
  usedLicenses: number;
  utilizationRate: number;
  inactiveUsers: number;
  lastActiveDate?: Date;
}

export interface SavingsOpportunity {
  type: 'unused_license' | 'underutilized_app' | 'duplicate_functionality' | 'plan_downgrade' | 'bulk_discount';
  title: string;
  description: string;
  applicationId?: string;
  applicationName?: string;
  potentialSavings: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  actionRequired: string;
  metadata?: any;
}

export interface UsagePattern {
  applicationId: string;
  applicationName: string;
  averageDailyUsers: number;
  peakUsage: number;
  lowUsagePeriods: string[];
  seasonalTrends: any[];
  userGrowthRate: number;
}

export interface CostForecast {
  period: string;
  predictedCost: number;
  confidence: number;
  factors: string[];
  recommendations: string[];
}

class AnalysisEngine {
  private static instance: AnalysisEngine;

  private constructor() {}

  public static getInstance(): AnalysisEngine {
    if (!AnalysisEngine.instance) {
      AnalysisEngine.instance = new AnalysisEngine();
    }
    return AnalysisEngine.instance;
  }

  /**
   * Analyze cost trends over time
   */
  async analyzeCostTrends(organizationId: string, months: number = 6): Promise<CostTrend[]> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get usage data grouped by month
      const usageData = await db.getClient().usageData.findMany({
        where: {
          application: {
            organizationId
          },
          date: {
            gte: startDate
          }
        },
        include: {
          application: true,
          license: true
        },
        orderBy: {
          date: 'asc'
        }
      });

      // Group by month and calculate trends
      const monthlyData = new Map<string, {
        totalCost: number;
        newLicenses: number;
        cancelledLicenses: number;
        date: Date;
      }>();

      usageData.forEach((usage: any) => {
        const monthKey = usage.date.toISOString().substring(0, 7); // YYYY-MM
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            totalCost: 0,
            newLicenses: 0,
            cancelledLicenses: 0,
            date: new Date(monthKey + '-01')
          });
        }

        const monthData = monthlyData.get(monthKey)!;
        
        if (usage.license) {
          const dailyCost = usage.license.costPerSeat * usage.activeUsers;
          monthData.totalCost += dailyCost;
        }
      });

      // Calculate growth rates
      const trends: CostTrend[] = [];
      const sortedMonths = Array.from(monthlyData.entries()).sort(([a], [b]) => a.localeCompare(b));

      sortedMonths.forEach(([monthKey, data], index) => {
        let growthRate = 0;
        if (index > 0) {
          const previousCost = trends[index - 1].totalCost;
          growthRate = previousCost > 0 ? ((data.totalCost - previousCost) / previousCost) * 100 : 0;
        }

        trends.push({
          date: data.date,
          totalCost: Math.round(data.totalCost),
          newLicenses: data.newLicenses,
          cancelledLicenses: data.cancelledLicenses,
          growthRate: Math.round(growthRate * 100) / 100
        });
      });

      return trends;
    } catch (error) {
      logger.error('Error analyzing cost trends:', error);
      throw error;
    }
  }

  /**
   * Analyze license utilization across applications
   */
  async analyzeLicenseUtilization(organizationId: string): Promise<LicenseUtilization[]> {
    try {
      const licenses = await db.getClient().license.findMany({
        where: {
          organizationId,
          status: 'ACTIVE'
        },
        include: {
          application: true,
          usageData: {
            where: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            orderBy: {
              date: 'desc'
            }
          }
        }
      });

      const utilization: LicenseUtilization[] = [];

      for (const license of licenses) {
        const recentUsage = license.usageData.slice(0, 30); // Last 30 days
        const averageActiveUsers = recentUsage.length > 0 
          ? recentUsage.reduce((sum: number, usage: any) => sum + usage.activeUsers, 0) / recentUsage.length
          : 0;

        const utilizationRate = license.totalSeats > 0 
          ? (averageActiveUsers / license.totalSeats) * 100 
          : 0;

        const lastActiveDate = recentUsage.length > 0 ? recentUsage[0].date : undefined;

        utilization.push({
          applicationId: license.applicationId,
          applicationName: license.application.name,
          totalLicenses: license.totalSeats,
          usedLicenses: Math.round(averageActiveUsers),
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          inactiveUsers: license.totalSeats - Math.round(averageActiveUsers),
          lastActiveDate
        });
      }

      return utilization.sort((a, b) => b.utilizationRate - a.utilizationRate);
    } catch (error) {
      logger.error('Error analyzing license utilization:', error);
      throw error;
    }
  }

  /**
   * Identify savings opportunities
   */
  async identifySavingsOpportunities(organizationId: string): Promise<SavingsOpportunity[]> {
    try {
      const opportunities: SavingsOpportunity[] = [];
      
      // Get utilization data
      const utilization = await this.analyzeLicenseUtilization(organizationId);
      
      // Identify unused licenses
      for (const app of utilization) {
        if (app.utilizationRate < 10) {
          const license = await db.getClient().license.findFirst({
            where: {
              applicationId: app.applicationId,
              organizationId
            }
          });

          if (license) {
            const monthlySavings = license.costPerSeat * app.inactiveUsers;
            const annualSavings = monthlySavings * (license.billingCycle === 'MONTHLY' ? 12 : 1);

            opportunities.push({
              type: 'unused_license',
              title: `Remove ${app.inactiveUsers} unused ${app.applicationName} licenses`,
              description: `These licenses have less than 10% utilization over the past 30 days`,
              applicationId: app.applicationId,
              applicationName: app.applicationName,
              potentialSavings: Math.round(annualSavings),
              priority: annualSavings > 5000 ? 'high' : annualSavings > 1000 ? 'medium' : 'low',
              confidence: 85,
              actionRequired: 'Review inactive users and cancel unused licenses',
              metadata: {
                inactiveUsers: app.inactiveUsers,
                utilizationRate: app.utilizationRate,
                monthlyCost: monthlySavings
              }
            });
          }
        }
      }

      // Identify underutilized applications
      for (const app of utilization) {
        if (app.utilizationRate > 10 && app.utilizationRate < 50) {
          const license = await db.getClient().license.findFirst({
            where: {
              applicationId: app.applicationId,
              organizationId
            }
          });

          if (license) {
            const potentialReduction = Math.floor(app.inactiveUsers * 0.7); // Conservative estimate
            const monthlySavings = license.costPerSeat * potentialReduction;
            const annualSavings = monthlySavings * (license.billingCycle === 'MONTHLY' ? 12 : 1);

            opportunities.push({
              type: 'underutilized_app',
              title: `Optimize ${app.applicationName} license allocation`,
              description: `Application is only ${app.utilizationRate}% utilized, consider reducing licenses`,
              applicationId: app.applicationId,
              applicationName: app.applicationName,
              potentialSavings: Math.round(annualSavings),
              priority: 'medium',
              confidence: 70,
              actionRequired: 'Analyze user needs and consider reducing license count',
              metadata: {
                currentUtilization: app.utilizationRate,
                suggestedReduction: potentialReduction
              }
            });
          }
        }
      }

      // Check for duplicate functionality
      const applications = await db.getClient().application.findMany({
        where: { organizationId },
        include: { licenses: true }
      });

      const categoryGroups = new Map<string, typeof applications>();
      applications.forEach((app: any) => {
        const category = app.category;
        if (!categoryGroups.has(category)) {
          categoryGroups.set(category, []);
        }
        categoryGroups.get(category)!.push(app);
      });

      for (const [category, apps] of categoryGroups) {
        if (apps.length > 1 && category !== 'OTHER') {
          const totalCost = apps.reduce((sum: number, app: any) => {
            return sum + app.licenses.reduce((licSum: number, lic: any) => {
              return licSum + (lic.costPerSeat * lic.totalSeats * (lic.billingCycle === 'MONTHLY' ? 12 : 1));
            }, 0);
          }, 0);

          if (totalCost > 10000) { // Only flag if significant cost
            opportunities.push({
              type: 'duplicate_functionality',
              title: `Consolidate ${category.toLowerCase()} tools`,
              description: `Multiple applications in ${category} category may have overlapping functionality`,
              potentialSavings: Math.round(totalCost * 0.3), // Estimate 30% savings
              priority: 'medium',
              confidence: 60,
              actionRequired: 'Review applications for overlapping features and consolidate',
              metadata: {
                category,
                applications: apps.map((app: any) => app.name),
                totalCost
              }
            });
          }
        }
      }

      return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
    } catch (error) {
      logger.error('Error identifying savings opportunities:', error);
      throw error;
    }
  }

  /**
   * Analyze usage patterns
   */
  async analyzeUsagePatterns(organizationId: string): Promise<UsagePattern[]> {
    try {
      const applications = await db.getClient().application.findMany({
        where: { organizationId },
        include: {
          usageData: {
            where: {
              date: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
              }
            },
            orderBy: { date: 'asc' }
          }
        }
      });

      const patterns: UsagePattern[] = [];

      for (const app of applications) {
        if (app.usageData.length === 0) continue;

        const dailyUsers = app.usageData.map((usage: any) => usage.activeUsers);
        const averageDailyUsers = dailyUsers.reduce((sum: number, users: number) => sum + users, 0) / dailyUsers.length;
        const peakUsage = Math.max(...dailyUsers);

        // Identify low usage periods (days with <50% of average usage)
        const lowUsagePeriods: string[] = [];
        app.usageData.forEach((usage: any) => {
          if (usage.activeUsers < averageDailyUsers * 0.5) {
            lowUsagePeriods.push(usage.date.toLocaleDateString());
          }
        });

        // Calculate growth rate
        const firstWeekAvg = app.usageData.slice(0, 7).reduce((sum: number, usage: any) => sum + usage.activeUsers, 0) / 7;
        const lastWeekAvg = app.usageData.slice(-7).reduce((sum: number, usage: any) => sum + usage.activeUsers, 0) / 7;
        const userGrowthRate = firstWeekAvg > 0 ? ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100 : 0;

        patterns.push({
          applicationId: app.id,
          applicationName: app.name,
          averageDailyUsers: Math.round(averageDailyUsers),
          peakUsage,
          lowUsagePeriods: lowUsagePeriods.slice(0, 10), // Limit to 10 examples
          seasonalTrends: [], // TODO: Implement seasonal analysis
          userGrowthRate: Math.round(userGrowthRate * 100) / 100
        });
      }

      return patterns.sort((a, b) => b.averageDailyUsers - a.averageDailyUsers);
    } catch (error) {
      logger.error('Error analyzing usage patterns:', error);
      throw error;
    }
  }

  /**
   * Generate cost forecast
   */
  async generateCostForecast(organizationId: string, months: number = 6): Promise<CostForecast[]> {
    try {
      const trends = await this.analyzeCostTrends(organizationId, 12);
      const patterns = await this.analyzeUsagePatterns(organizationId);
      
      const forecasts: CostForecast[] = [];
      
      if (trends.length < 3) {
        // Not enough data for reliable forecast
        return [{
          period: 'Insufficient Data',
          predictedCost: 0,
          confidence: 0,
          factors: ['Not enough historical data for accurate forecasting'],
          recommendations: ['Collect more usage data over time for better predictions']
        }];
      }

      // Calculate average growth rate
      const growthRates = trends.slice(1).map(trend => trend.growthRate);
      const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      
      const lastCost = trends[trends.length - 1].totalCost;
      
      // Generate forecasts for next N months
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        
        // Apply growth rate with some variance
        const predictedCost = lastCost * Math.pow(1 + (avgGrowthRate / 100), i);
        
        // Calculate confidence based on data consistency
        const growthVariance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowthRate, 2), 0) / growthRates.length;
        const confidence = Math.max(20, 90 - (growthVariance * 2));

        const factors = [];
        const recommendations = [];

        if (avgGrowthRate > 5) {
          factors.push('High growth rate detected');
          recommendations.push('Monitor for cost spikes and optimize license allocation');
        }
        
        if (avgGrowthRate < -2) {
          factors.push('Declining usage trend');
          recommendations.push('Consider downsizing licenses or renegotiating contracts');
        }

        forecasts.push({
          period: futureDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          predictedCost: Math.round(predictedCost),
          confidence: Math.round(confidence),
          factors: factors.length > 0 ? factors : ['Based on historical growth patterns'],
          recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring usage trends']
        });
      }

      return forecasts;
    } catch (error) {
      logger.error('Error generating cost forecast:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive analysis report
   */
  async generateAnalysisReport(organizationId: string) {
    try {
      const [
        costTrends,
        utilization,
        savingsOpportunities,
        usagePatterns,
        costForecast
      ] = await Promise.all([
        this.analyzeCostTrends(organizationId),
        this.analyzeLicenseUtilization(organizationId),
        this.identifySavingsOpportunities(organizationId),
        this.analyzeUsagePatterns(organizationId),
        this.generateCostForecast(organizationId)
      ]);

      const totalPotentialSavings = savingsOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
      const averageUtilization = utilization.length > 0 
        ? utilization.reduce((sum, app) => sum + app.utilizationRate, 0) / utilization.length 
        : 0;

      return {
        summary: {
          totalPotentialSavings,
          averageUtilization: Math.round(averageUtilization * 100) / 100,
          totalApplications: utilization.length,
          highPriorityOpportunities: savingsOpportunities.filter(opp => opp.priority === 'high').length,
          generatedAt: new Date()
        },
        costTrends,
        utilization,
        savingsOpportunities,
        usagePatterns,
        costForecast
      };
    } catch (error) {
      logger.error('Error generating analysis report:', error);
      throw error;
    }
  }
}

export const analysisEngine = AnalysisEngine.getInstance();
export default AnalysisEngine;