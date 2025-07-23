import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { authService } from '../../src/server/services/authService';
import type { RegisterData, LoginCredentials } from '../../src/server/services/authService';

// Mock the database module
jest.mock('../../src/server/services/database', () => ({
  db: {
    findUserByEmail: jest.fn(),
    createUser: jest.fn(),
    createOrganization: jest.fn(),
    addUserToOrganization: jest.fn(),
    getClient: jest.fn(() => ({
      user: {
        findUnique: jest.fn(),
      },
      organizationMember: {
        findUnique: jest.fn(),
      },
    })),
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Mock logger
jest.mock('../../src/server/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Get the mocked database
const { db: mockDb } = require('../../src/server/services/database');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
    process.env.BCRYPT_ROUNDS = '12';
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerData: RegisterData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        organizationName: 'Test Org',
      };

      const mockUser = {
        id: 'user-123',
        email: registerData.email,
        name: registerData.name,
        role: 'USER',
      };

      const mockOrganization = {
        id: 'org-123',
        name: registerData.organizationName,
      };

      // Mock database calls
      mockDb.findUserByEmail.mockResolvedValue(null);
      mockDb.createUser.mockResolvedValue(mockUser);
      mockDb.createOrganization.mockResolvedValue(mockOrganization);
      mockDb.addUserToOrganization.mockResolvedValue(undefined);

      // Mock bcrypt and jwt
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('mock-token');

      const result = await authService.register(registerData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        organizations: [{
          id: mockOrganization.id,
          name: mockOrganization.name,
          role: 'OWNER',
        }],
      });
      expect(result.token).toBe('mock-token');
      expect(mockDb.findUserByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockDb.createUser).toHaveBeenCalledWith({
        email: registerData.email,
        name: registerData.name,
        role: 'USER',
      });
    });

    it('should fail if user already exists', async () => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        name: 'Test User',
        password: 'password123',
      };

      const existingUser = {
        id: 'user-123',
        email: registerData.email,
      };

      mockDb.findUserByEmail.mockResolvedValue(existingUser);

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('User with this email already exists');
      expect(mockDb.createUser).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      const registerData: RegisterData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockDb.findUserByEmail.mockResolvedValue(null);
      mockDb.createUser.mockRejectedValue(new Error('Database error'));

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Registration failed. Please try again.');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'validpassword',
      };

      const mockUser = {
        id: 'user-123',
        email: credentials.email,
        name: 'Test User',
        role: 'USER',
        organizations: [{
          organization: {
            id: 'org-123',
            name: 'Test Org',
          },
          role: 'OWNER',
        }],
      };

      mockDb.findUserByEmail.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock-token');

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        organizations: [{
          id: 'org-123',
          name: 'Test Org',
          role: 'OWNER',
        }],
      });
      expect(result.token).toBe('mock-token');
    });

    it('should fail with invalid email', async () => {
      const credentials: LoginCredentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockDb.findUserByEmail.mockResolvedValue(null);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    it('should fail with short password', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: '123', // Too short
      };

      const mockUser = {
        id: 'user-123',
        email: credentials.email,
        organizations: [],
      };

      mockDb.findUserByEmail.mockResolvedValue(mockUser);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email or password');
    });

    it('should handle login errors', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockDb.findUserByEmail.mockRejectedValue(new Error('Database error'));

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Login failed. Please try again.');
    });
  });

  describe('verifyToken', () => {
    it('should successfully verify valid token', () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      jwt.verify.mockReturnValue(mockPayload);

      const result = authService.verifyToken('valid-token');

      expect(result).toEqual({
        userId: mockPayload.userId,
        email: mockPayload.email,
      });
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('should return null for invalid token', () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.verifyToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh valid token', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        organizations: [],
      };

      jwt.verify.mockReturnValue(mockPayload);
      mockDb.getClient().user.findUnique.mockResolvedValue({
        ...mockUser,
        organizations: [],
      });
      jwt.sign.mockReturnValue('new-token');

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.success).toBe(true);
      expect(result.token).toBe('new-token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        organizations: [],
      });
    });

    it('should fail with invalid refresh token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.refreshToken('invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token refresh failed');
    });
  });

  describe('getUserById', () => {
    it('should successfully get user by ID', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        organizations: [{
          organization: {
            id: 'org-123',
            name: 'Test Org',
          },
          role: 'OWNER',
        }],
      };

      mockDb.getClient().user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getUserById('user-123');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        organizations: [{
          id: 'org-123',
          name: 'Test Org',
          role: 'OWNER',
        }],
      });
    });

    it('should return null if user not found', async () => {
      mockDb.getClient().user.findUnique.mockResolvedValue(null);

      const result = await authService.getUserById('nonexistent-user');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      mockDb.getClient().user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await authService.getUserById('user-123');

      expect(result).toBeNull();
    });
  });

  describe('validateOrganizationAccess', () => {
    it('should return true for valid access', async () => {
      const mockMembership = {
        role: 'ADMIN',
      };

      mockDb.getClient().organizationMember.findUnique.mockResolvedValue(mockMembership);

      const result = await authService.validateOrganizationAccess('user-123', 'org-123', 'MEMBER');

      expect(result).toBe(true);
    });

    it('should return false for insufficient role', async () => {
      const mockMembership = {
        role: 'VIEWER',
      };

      mockDb.getClient().organizationMember.findUnique.mockResolvedValue(mockMembership);

      const result = await authService.validateOrganizationAccess('user-123', 'org-123', 'ADMIN');

      expect(result).toBe(false);
    });

    it('should return false if membership not found', async () => {
      mockDb.getClient().organizationMember.findUnique.mockResolvedValue(null);

      const result = await authService.validateOrganizationAccess('user-123', 'org-123');

      expect(result).toBe(false);
    });

    it('should handle errors', async () => {
      mockDb.getClient().organizationMember.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await authService.validateOrganizationAccess('user-123', 'org-123');

      expect(result).toBe(false);
    });
  });
});