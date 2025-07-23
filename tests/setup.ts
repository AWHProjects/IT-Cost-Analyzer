import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock environment variables
Object.assign(process.env, {
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret',
  ENCRYPTION_KEY: 'test-encryption-key-32-characters-long',
  DATABASE_URL: 'file:./test.db',
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for API tests
(global as any).fetch = jest.fn();

// Mock WebSocket for socket tests
(global as any).WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Setup test database
beforeAll(async () => {
  // Initialize test database if needed
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  // Cleanup test database if needed
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidEmail(): R;
      toBeValidUUID(): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid Date`,
      pass,
    };
  },
  
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email address`,
      pass,
    };
  },
  
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass,
    };
  },
});

// Test data factories
export const createMockUser = (overrides: any = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  organizationId: 'org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockOrganization = (overrides: any = {}) => ({
  id: 'org-123',
  name: 'Test Organization',
  domain: 'test.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockApplication = (overrides: any = {}) => ({
  id: 'app-123',
  name: 'Test Application',
  category: 'productivity',
  vendor: 'Test Vendor',
  organizationId: 'org-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockLicense = (overrides: any = {}) => ({
  id: 'license-123',
  applicationId: 'app-123',
  organizationId: 'org-123',
  type: 'subscription',
  totalCount: 100,
  usedCount: 75,
  costPerLicense: 10.00,
  billingCycle: 'monthly',
  renewalDate: new Date('2024-12-31'),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockNotification = (overrides: any = {}) => ({
  id: 'notif-123',
  type: 'cost-alert',
  title: 'Test Notification',
  message: 'This is a test notification',
  severity: 'medium',
  userId: 'user-123',
  organizationId: 'org-123',
  createdAt: new Date(),
  ...overrides,
});

// HTTP response helpers
export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: createMockUser(),
  ip: '127.0.0.1',
  get: jest.fn(),
  ...overrides,
});

// Database mocking helpers
export const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  application: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  license: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Export commonly used test utilities
export {
  jest,
};