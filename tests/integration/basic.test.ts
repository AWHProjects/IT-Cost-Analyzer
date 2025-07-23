import { describe, it, expect } from '@jest/globals';

describe('Basic Integration Tests', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should have access to environment variables', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBe('test-jwt-secret');
  });

  it('should be able to test basic JavaScript functionality', () => {
    const testObject = {
      name: 'IT Cost Analyzer',
      version: '1.0.0',
      features: ['cost-analysis', 'license-tracking', 'reporting'],
    };

    expect(testObject.name).toBe('IT Cost Analyzer');
    expect(testObject.features).toHaveLength(3);
    expect(testObject.features).toContain('cost-analysis');
  });

  it('should be able to test async functionality', async () => {
    const asyncFunction = async (value: string): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`processed: ${value}`), 10);
      });
    };

    const result = await asyncFunction('test-data');
    expect(result).toBe('processed: test-data');
  });

  it('should be able to test error handling', () => {
    const errorFunction = () => {
      throw new Error('Test error');
    };

    expect(errorFunction).toThrow('Test error');
  });

  it('should be able to test custom matchers', () => {
    const testDate = new Date();
    expect(testDate).toBeValidDate();

    const testEmail = 'test@example.com';
    expect(testEmail).toBeValidEmail();

    const testUUID = '123e4567-e89b-12d3-a456-426614174000';
    expect(testUUID).toBeValidUUID();
  });

  it('should be able to test mathematical operations', () => {
    const calculateCostSavings = (totalCost: number, unusedLicenses: number, costPerLicense: number): number => {
      return unusedLicenses * costPerLicense;
    };

    const totalCost = 10000;
    const unusedLicenses = 5;
    const costPerLicense = 100;
    
    const savings = calculateCostSavings(totalCost, unusedLicenses, costPerLicense);
    expect(savings).toBe(500);
    expect(savings).toBeGreaterThanOrEqual(400);
    expect(savings).toBeLessThanOrEqual(600);
  });

  it('should be able to test array operations', () => {
    const applications = [
      { name: 'Microsoft Office', cost: 1000, utilization: 85 },
      { name: 'Adobe Creative Suite', cost: 800, utilization: 45 },
      { name: 'Slack', cost: 300, utilization: 95 },
    ];

    const underutilized = applications.filter(app => app.utilization < 50);
    expect(underutilized).toHaveLength(1);
    expect(underutilized[0].name).toBe('Adobe Creative Suite');

    const totalCost = applications.reduce((sum, app) => sum + app.cost, 0);
    expect(totalCost).toBe(2100);
  });

  it('should be able to test string operations', () => {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    const formatted = formatCurrency(1234.56);
    expect(formatted).toBe('$1,234.56');
  });

  it('should be able to test date operations', () => {
    const getMonthsAgo = (months: number): Date => {
      const date = new Date();
      date.setMonth(date.getMonth() - months);
      return date;
    };

    const sixMonthsAgo = getMonthsAgo(6);
    const now = new Date();
    
    expect(sixMonthsAgo.getTime()).toBeLessThan(now.getTime());
    expect(sixMonthsAgo instanceof Date).toBe(true);
    expect(isNaN(sixMonthsAgo.getTime())).toBe(false);
  });
});