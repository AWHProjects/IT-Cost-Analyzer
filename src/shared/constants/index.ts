// Application Constants
export const APP_NAME = 'IT Cost Analyzer';
export const APP_VERSION = '1.0.0';

// API Configuration
export const API_BASE_URL = '/api';
export const DEV_API_BASE_URL = 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile'
  },
  
  // File Upload
  UPLOAD: {
    INVOICE: '/upload/invoice',
    USAGE_REPORT: '/upload/usage-report',
    LICENSE_EXPORT: '/upload/license-export',
    VENDOR_DATA: '/upload/vendor-data'
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    COST_TRENDS: '/analytics/cost-trends',
    LICENSE_UTILIZATION: '/analytics/license-utilization',
    DEPARTMENT_BREAKDOWN: '/analytics/department-breakdown',
    RECOMMENDATIONS: '/analytics/recommendations'
  },
  
  // Applications and Licenses
  APPLICATIONS: '/applications',
  LICENSES: '/licenses',
  USERS: '/users',
  
  // Integrations
  INTEGRATIONS: {
    LIST: '/integrations',
    MICROSOFT: '/integrations/microsoft',
    GOOGLE: '/integrations/google',
    SLACK: '/integrations/slack',
    SALESFORCE: '/integrations/salesforce',
    ATLASSIAN: '/integrations/atlassian'
  },
  
  // Alerts and Notifications
  ALERTS: '/alerts',
  NOTIFICATIONS: '/notifications'
} as const;

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_TYPES: {
    INVOICE: ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    USAGE_REPORT: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    LICENSE_EXPORT: ['text/csv', 'application/json', 'application/vnd.ms-excel'],
    VENDOR_DATA: ['text/csv', 'application/json', 'application/pdf']
  }
} as const;

// Analysis Thresholds
export const ANALYSIS_THRESHOLDS = {
  INACTIVE_DAYS: 30,
  UNDERUTILIZED_PERCENTAGE: 25,
  HIGH_COST_THRESHOLD: 1000,
  CRITICAL_SAVINGS_THRESHOLD: 5000
} as const;

// Dashboard Configuration
export const DASHBOARD_CONFIG = {
  REFRESH_INTERVAL: 300000, // 5 minutes
  CHART_COLORS: {
    PRIMARY: '#3B82F6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    DANGER: '#EF4444',
    INFO: '#6366F1',
    SECONDARY: '#6B7280'
  },
  DATE_RANGES: {
    LAST_7_DAYS: 7,
    LAST_30_DAYS: 30,
    LAST_90_DAYS: 90,
    LAST_YEAR: 365
  }
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  },
  UPLOAD: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10
  }
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256'
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  COST_ALERT: 'cost-alert',
  WEEKLY_REPORT: 'weekly-report',
  LICENSE_EXPIRY: 'license-expiry'
} as const;

// Application Categories with Display Names
export const APPLICATION_CATEGORIES = {
  communication: 'Communication',
  productivity: 'Productivity',
  project_management: 'Project Management',
  design: 'Design & Creative',
  development: 'Development',
  security: 'Security',
  analytics: 'Analytics',
  storage: 'Storage & Backup',
  other: 'Other'
} as const;

// Currency Codes
export const CURRENCIES = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
  JPY: 'JPY'
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  DATETIME: 'MMM DD, YYYY HH:mm',
  API: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true
  },
  EMAIL: {
    MAX_LENGTH: 254
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  }
} as const;

// Socket Events
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  NEW_ALERT: 'new_alert',
  COST_UPDATE: 'cost_update',
  SYNC_COMPLETE: 'sync_complete',
  FILE_PROCESSED: 'file_processed'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  DUPLICATE_EMAIL: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  INTEGRATION_ERROR: 'Integration connection failed'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  FILE_UPLOADED: 'File uploaded successfully',
  DATA_UPDATED: 'Data updated successfully',
  INTEGRATION_CONNECTED: 'Integration connected successfully',
  ALERT_DISMISSED: 'Alert dismissed',
  SETTINGS_SAVED: 'Settings saved successfully'
} as const;