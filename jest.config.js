module.exports = {
  // Projects configuration for different test environments
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/**/*.test.ts'
      ],
      transform: {
        '^.+\\.ts$': 'ts-jest'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@server/(.*)$': '<rootDir>/src/server/$1',
      },
      collectCoverageFrom: [
        'src/server/**/*.{ts}',
        'src/shared/**/*.{ts}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
      ],
    },
    {
      displayName: 'client',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/components/**/*.test.tsx',
        '<rootDir>/src/client/**/*.test.tsx'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@client/(.*)$': '<rootDir>/src/client/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      collectCoverageFrom: [
        'src/client/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
      ],
    }
  ],
  
  // Coverage configuration
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ]
};