// User and Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// SaaS and License Types
export interface SaaSApplication {
  id: string;
  name: string;
  vendor: string;
  category: ApplicationCategory;
  description?: string;
  website?: string;
  logoUrl?: string;
}

export enum ApplicationCategory {
  COMMUNICATION = 'communication',
  PRODUCTIVITY = 'productivity',
  PROJECT_MANAGEMENT = 'project_management',
  DESIGN = 'design',
  DEVELOPMENT = 'development',
  SECURITY = 'security',
  ANALYTICS = 'analytics',
  STORAGE = 'storage',
  OTHER = 'other'
}

export interface License {
  id: string;
  applicationId: string;
  userId?: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  purchaseDate: Date;
  expiryDate?: Date;
  lastUsed?: Date;
  features: string[];
}

export enum LicenseType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
  TRIAL = 'trial'
}

export enum LicenseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ONE_TIME = 'one_time'
}

// Usage and Analytics Types
export interface UsageMetrics {
  userId: string;
  applicationId: string;
  date: Date;
  sessionCount: number;
  totalDuration: number; // in minutes
  featuresUsed: string[];
  lastActivity: Date;
}

export interface CostAnalysis {
  totalCost: number;
  activeLicenses: number;
  inactiveLicenses: number;
  underutilizedLicenses: number;
  potentialSavings: number;
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  potentialSavings: number;
  priority: Priority;
  applicationId?: string;
  userId?: string;
  actionRequired: string;
}

export enum RecommendationType {
  REMOVE_INACTIVE_LICENSE = 'remove_inactive_license',
  DOWNGRADE_LICENSE = 'downgrade_license',
  CONSOLIDATE_TOOLS = 'consolidate_tools',
  NEGOTIATE_DISCOUNT = 'negotiate_discount',
  SWITCH_BILLING_CYCLE = 'switch_billing_cycle'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// File Upload Types
export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: FileProcessingStatus;
  type: FileType;
  metadata?: Record<string, any>;
}

export enum FileType {
  INVOICE = 'invoice',
  USAGE_REPORT = 'usage_report',
  LICENSE_EXPORT = 'license_export',
  VENDOR_DATA = 'vendor_data'
}

export enum FileProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Dashboard and Reporting Types
export interface DashboardData {
  totalCost: number;
  monthlyCost: number;
  totalLicenses: number;
  activeLicenses: number;
  inactiveLicenses: number;
  potentialSavings: number;
  topApplications: ApplicationUsage[];
  costTrends: CostTrend[];
  utilizationByDepartment: DepartmentUtilization[];
  recentAlerts: Alert[];
}

export interface ApplicationUsage {
  applicationId: string;
  applicationName: string;
  totalCost: number;
  licenseCount: number;
  activeUsers: number;
  utilizationRate: number;
}

export interface CostTrend {
  date: Date;
  totalCost: number;
  newLicenses: number;
  cancelledLicenses: number;
}

export interface DepartmentUtilization {
  department: string;
  totalCost: number;
  licenseCount: number;
  utilizationRate: number;
  topApplications: string[];
}

// Alert and Notification Types
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  applicationId?: string;
  userId?: string;
  createdAt: Date;
  readAt?: Date;
  resolvedAt?: Date;
}

export enum AlertType {
  UNUSED_LICENSE = 'unused_license',
  COST_SPIKE = 'cost_spike',
  LICENSE_EXPIRY = 'license_expiry',
  DUPLICATE_TOOLS = 'duplicate_tools',
  BUDGET_EXCEEDED = 'budget_exceeded'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Integration Types
export interface SaaSIntegration {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  credentials: Record<string, string>;
  lastSync?: Date;
  syncFrequency: SyncFrequency;
  config: Record<string, any>;
}

export enum IntegrationProvider {
  MICROSOFT_365 = 'microsoft_365',
  GOOGLE_WORKSPACE = 'google_workspace',
  SLACK = 'slack',
  SALESFORCE = 'salesforce',
  ATLASSIAN = 'atlassian',
  ADOBE = 'adobe',
  ZOOM = 'zoom',
  AWS = 'aws',
  AZURE = 'azure'
}

export enum IntegrationStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  SYNCING = 'syncing'
}

export enum SyncFrequency {
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}