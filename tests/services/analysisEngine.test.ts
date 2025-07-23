import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { analysisEngine } from '../../src/server/services/analysisEngine';

// Mock the database module
jest.mock('../../src/server/services/database', () => ({
  db: {
    getClient: jest.fn(() => ({
      usageData: {
        findMany: jest.fn(),
      },
      license: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      application: {
        findMany: jest.fn(),
      },
    })),
  },
}));

// Mock logger
jest.mock('../../src/server/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Get the mocked database
const { db: mockDb } = require('../../src/server/services/database');

describe('AnalysisEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeCostTrends', () => {
    it('should analyze cost trends over time', async () => {
      const organizationId = 'org-123';
      const months = 6;
      
      const mockUsageData = [
        {
          date: new Date('2024-01-15'),
          activeUsers: 10,
          application: {
            organizationId,
          },
          license: {
            costPerSeat: 50,
          },
        },
        {
          date: new Date('2024-02-15'),
          activeUsers: 12,
          application: {
            organizationId,
          },
          license: {
            costPerSeat: 50,
          },
        },
      ];

      mockDb.getClient().usageData.findMany.mockResolvedValue(mockUsageData);

      const result = await analysisEngine.analyzeCostTrends(organizationId, months);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('date');
        expect(result[0]).toHaveProperty('totalCost');
        expect(result[0]).toHaveProperty('growthRate');
      }
    });

    it('should handle cost trend analysis errors', async () => {
      const organizationId = 'org-123';
      
      mockDb.getClient().usageData.findMany.mockRejectedValue(new Error('Database error'));

      await expect(analysisEngine.analyzeCostTrends(organizationId)).rejects.toThrow('Database error');
    });
  });

  describe('analyzeLicenseUtilization', () => {
    it('should analyze license utilization across applications', async () => {
      const organizationId = 'org-123';
      
      const mockLicenses = [
        {
          applicationId: 'app-1',
          totalSeats: 10,
          application: {
            name: 'Adobe Creative Suite',
          },
          usageData: [
            { date: new Date('2024-01-20'), activeUsers: 8 },
            { date: new Date('2024-01-19'), activeUsers: 7 },
          ],
        },
        {
          applicationId: 'app-2',
          totalSeats: 20,
          application: {
            name: 'Microsoft Office',
          },
          usageData: [
            { date: new Date('2024-01-20'), activeUsers: 18 },
            { date: new Date('2024-01-19'), activeUsers: 19 },
          ],
        },
      ];

      mockDb.getClient().license.findMany.mockResolvedValue(mockLicenses);

      const result = await analysisEngine.analyzeLicenseUtilization(organizationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('applicationId');
      expect(result[0]).toHaveProperty('applicationName');
      expect(result[0]).toHaveProperty('totalLicenses');
      expect(result[0]).toHaveProperty('usedLicenses');
      expect(result[0]).toHaveProperty('utilizationRate');
      expect(mockDb.getClient().license.findMany).toHaveBeenCalledWith({
        where: {
          organizationId,
          status: 'ACTIVE',
        },
        include: {
          application: true,
          usageData: {
            where: {
              date: {
                gte: expect.any(Date),
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
        },
      });
    });

    it('should handle license utilization analysis errors', async () => {
      const organizationId = 'org-123';
      
      mockDb.getClient().license.findMany.mockRejectedValue(new Error('Database error'));

      await expect(analysisEngine.analyzeLicenseUtilization(organizationId)).rejects.toThrow('Database error');
    });
  });

  describe('identifySavingsOpportunities', () => {
    it('should identify savings opportunities', async () => {
      const organizationId = 'org-123';

      // Mock license utilization data
      const mockLicenses = [
        {
          applicationId: 'app-1',
          totalSeats: 10,
          application: {
            name: 'Adobe Creative Suite',
          },
          usageData: [
            { date: new Date('2024-01-20'), activeUsers: 1 }, // Very low usage
          ],
        },
      ];

      const mockLicenseForSavings = {
        costPerSeat: 100,
        billingCycle: 'MONTHLY',
      };

      const mockApplications = [
        {
          id: 'app-1',
          name: 'Adobe Creative Suite',
          category: 'Design',
          licenses: [mockLicenseForSavings],
        },
      ];

      mockDb.getClient().license.findMany.mockResolvedValue(mockLicenses);
      mockDb.getClient().license.findFirst.mockResolvedValue(mockLicenseForSavings);
      mockDb.getClient().application.findMany.mockResolvedValue(mockApplications);

      const result = await analysisEngine.identifySavingsOpportunities(organizationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('type');
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).toHaveProperty('potentialSavings');
        expect(result[0]).toHaveProperty('priority');
        expect(result[0]).toHaveProperty('confidence');
      }
    });

    it('should handle savings opportunities analysis errors', async () => {
      const organizationId = 'org-123';

      mockDb.getClient().license.findMany.mockRejectedValue(new Error('Database error'));

      await expect(analysisEngine.identifySavingsOpportunities(organizationId)).rejects.toThrow('Database error');
    });
  });

  describe('analyzeUsagePatterns', () => {
    it('should analyze usage patterns', async () => {
      const organizationId = 'org-123';

      const mockApplications = [
        {
          id: 'app-1',
          name: 'Adobe Creative Suite',
          usageData: [
            { date: new Date('2024-01-01'), activeUsers: 10 },
            { date: new Date('2024-01-02'), activeUsers: 12 },
            { date: new Date('2024-01-03'), activeUsers: 8 },
            { date: new Date('2024-01-04'), activeUsers: 15 },
            { date: new Date('2024-01-05'), activeUsers: 11 },
            { date: new Date('2024-01-06'), activeUsers: 9 },
            { date: new Date('2024-01-07'), activeUsers: 13 },
          ],
        },
      ];

      mockDb.getClient().application.findMany.mockResolvedValue(mockApplications);

      const result = await analysisEngine.analyzeUsagePatterns(organizationId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('applicationId');
      expect(result[0]).toHaveProperty('applicationName');
      expect(result[0]).toHaveProperty('averageDailyUsers');
      expect(result[0]).toHaveProperty('peakUsage');
      expect(result[0]).toHaveProperty('userGrowthRate');
      expect(mockDb.getClient().application.findMany).toHaveBeenCalledWith({
        where: { organizationId },
        include: {
          usageData: {
            where: {
              date: {
                gte: expect.any(Date),
              },
            },
            orderBy: { date: 'asc' },
          },
        },
      });
    });

    it('should handle usage patterns analysis errors', async () => {
      const organizationId = 'org-123';

      mockDb.getClient().application.findMany.mockRejectedValue(new Error('Database error'));

      await expect(analysisEngine.analyzeUsagePatterns(organizationId)).rejects.toThrow('Database error');
    });
  });

  describe('generateCostForecast', () => {
    it('should generate cost forecast', async () => {
      const organizationId = 'org-123';
      const months = 6;

      // Mock cost trends data
      const mockUsageData = [
        {
          date: new Date('2024-01-15'),
          activeUsers: 10,
          application: { organizationId },
          license: { costPerSeat: 50 },
        },
        {
          date: new Date('2024-02-15'),
          activeUsers: 12,
          application: { organizationId },
          license: { costPerSeat: 50 },
        },
        {
          date: new Date('2024-03-15'),
          activeUsers: 11,
          application: { organizationId },
          license: { costPerSeat: 50 },
        },
      ];

      // Mock usage patterns data
      const mockApplications = [
        {
          id: 'app-1',
          name: 'Test App',
          usageData: [
            { date: new Date('2024-01-01'), activeUsers: 10 },
            { date: new Date('2024-01-02'), activeUsers: 12 },
          ],
        },
      ];

      mockDb.getClient().usageData.findMany.mockResolvedValue(mockUsageData);
      mockDb.getClient().application.findMany.mockResolvedValue(mockApplications);

      const result = await analysisEngine.generateCostForecast(organizationId, months);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('period');
        expect(result[0]).toHaveProperty('predictedCost');
        expect(result[0]).toHaveProperty('confidence');
        expect(result[0]).toHaveProperty('factors');
        expect(result[0]).toHaveProperty('recommendations');
      }
    });

    it('should handle insufficient data for forecast', async () => {
      const organizationId = 'org-123';
      const months = 6;

      // Mock insufficient data
      mockDb.getClient().usageData.findMany.mockResolvedValue([]);
      mockDb.getClient().application.findMany.mockResolvedValue([]);

      const result = await analysisEngine.generateCostForecast(organizationId, months);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].period).toBe('Insufficient Data');
      expect(result[0].confidence).toBe(0);
    });

    it('should handle cost forecast errors', async () => {
      const organizationId = 'org-123';

      mockDb.getClient().usageData.findMany.mockRejectedValue(new Error('Database error'));

      await expect(analysisEngine.generateCostForecast(organizationId)).rejects.toThrow('Database error');
    });
  });

  describe('generateAnalysisReport', () => {
    it('should generate comprehensive analysis report', async () => {
      const organizationId = 'org-123';

      // Mock all required data
      const mockUsageData = [
        {
          date: new Date('2024-01-15'),
          activeUsers: 10,
          application: { organizationId },
          license: { costPerSeat: 50 },
        },
      ];

      const mockLicenses = [
        {
          applicationId: 'app-1',
          totalSeats: 10,
          application: { name: 'Test App' },
          usageData: [{ date: new Date(), activeUsers: 8 }],
        },
      ];

      const mockApplications = [
        {
          id: 'app-1',
          name: 'Test App',
          category: 'Productivity',
          licenses: [{ costPerSeat: 50, billingCycle: 'MONTHLY' }],
          usageData: [{ date: new Date(), activeUsers: 8 }],
        },
      ];

      mockDb.getClient().usageData.findMany.mockResolvedValue(mockUsageData);
      mockDb.getClient().license.findMany.mockResolvedValue(mockLicenses);
      mockDb.getClient().license.findFirst.mockResolvedValue({ costPerSeat: 50, billingCycle: 'MONTHLY' });
      mockDb.getClient().application.findMany.mockResolvedValue(mockApplications);

      const result = await analysisEngine.generateAnalysisReport(organizationId);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('costTrends');
      expect(result).toHaveProperty('utilization');
      expect(result).toHaveProperty('savingsOpportunities');
      expect(result).toHaveProperty('usagePatterns');
      expect(result).toHaveProperty('costForecast');
      
      expect(result.summary).toHaveProperty('totalPotentialSavings');
      expect(result.summary).toHaveProperty('averageUtilization');
      expect(result.summary).toHaveProperty('totalApplications');
      expect(result.summary).toHaveProperty('generatedAt');
    });

    it('should handle analysis report generation errors', async () => {
      const organizationId = 'org-123';

      mockDb.getClient().usageData.findMany.mockRejectedValue(new Error('Database error'));

      await expect(analysisEngine.generateAnalysisReport(organizationId)).rejects.toThrow('Database error');
    });
  });
});