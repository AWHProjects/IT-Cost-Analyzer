import { logger } from '../utils/logger';
import { getSocketService, SocketService } from './socketService';
import DatabaseService from './database';

export interface NotificationData {
  id: string;
  type: 'cost-alert' | 'usage-warning' | 'license-expiry' | 'security-alert' | 'system-update' | 'report-ready';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  organizationId: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
  createdAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'cost-threshold' | 'usage-anomaly' | 'license-utilization' | 'security-compliance';
  organizationId: string;
  isActive: boolean;
  conditions: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    timeWindow?: string; // e.g., '24h', '7d', '30d'
  }[];
  actions: {
    type: 'notification' | 'email' | 'webhook';
    config: Record<string, any>;
  }[];
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    costAlerts: boolean;
    usageWarnings: boolean;
    licenseExpiry: boolean;
    securityAlerts: boolean;
    systemUpdates: boolean;
    reportReady: boolean;
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    timezone: string;
  };
}

export class NotificationService {
  private db: DatabaseService;
  private socketService: SocketService;
  private alertRules: Map<string, AlertRule> = new Map();

  constructor() {
    this.db = DatabaseService.getInstance();
    this.socketService = getSocketService();
    this.initializeAlertRules();
  }

  /**
   * Initialize default alert rules
   */
  private async initializeAlertRules(): Promise<void> {
    // This would typically load from database
    // For now, we'll create some default rules
    const defaultRules: AlertRule[] = [
      {
        id: 'cost-spike-alert',
        name: 'Monthly Cost Spike Alert',
        type: 'cost-threshold',
        organizationId: 'default',
        isActive: true,
        conditions: [
          {
            metric: 'monthly_cost_increase',
            operator: 'gt',
            threshold: 20, // 20% increase
            timeWindow: '30d',
          },
        ],
        actions: [
          {
            type: 'notification',
            config: { severity: 'high' },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'license-expiry-warning',
        name: 'License Expiry Warning',
        type: 'license-utilization',
        organizationId: 'default',
        isActive: true,
        conditions: [
          {
            metric: 'days_until_expiry',
            operator: 'lte',
            threshold: 30, // 30 days
          },
        ],
        actions: [
          {
            type: 'notification',
            config: { severity: 'medium' },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Send a notification to specific user or organization
   */
  async sendNotification(notification: Omit<NotificationData, 'id' | 'createdAt'>): Promise<string> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullNotification: NotificationData = {
      ...notification,
      id: notificationId,
      createdAt: new Date(),
    };

    try {
      // Store notification in database (mock implementation)
      await this.storeNotification(fullNotification);

      // Send real-time notification via WebSocket
      if (notification.userId) {
        this.socketService.emitToUser(notification.userId, 'notification', fullNotification);
      } else {
        this.socketService.emitToRoom(`org_${notification.organizationId}`, 'notification', fullNotification);
      }

      // Check if email notification should be sent
      if (notification.severity === 'high' || notification.severity === 'critical') {
        await this.sendEmailNotification(fullNotification);
      }

      logger.info('Notification sent successfully', {
        notificationId,
        type: notification.type,
        severity: notification.severity,
        userId: notification.userId,
        organizationId: notification.organizationId,
      });

      return notificationId;
    } catch (error) {
      logger.error('Failed to send notification', {
        error,
        notification: fullNotification,
      });
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: string[];
    } = {}
  ): Promise<{
    notifications: NotificationData[];
    total: number;
    unreadCount: number;
  }> {
    // Mock implementation - would query database
    const mockNotifications: NotificationData[] = [
      {
        id: 'notif_1',
        type: 'cost-alert',
        title: 'Monthly Cost Increase Detected',
        message: 'Your organization\'s software costs have increased by 25% this month compared to last month.',
        severity: 'high',
        userId,
        organizationId: 'org_1',
        metadata: {
          currentCost: 15000,
          previousCost: 12000,
          increase: 25,
        },
        actionUrl: '/dashboard/cost-analysis',
        actionText: 'View Details',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 'notif_2',
        type: 'license-expiry',
        title: 'Microsoft 365 Licenses Expiring Soon',
        message: '15 Microsoft 365 licenses will expire in 20 days. Renew now to avoid service interruption.',
        severity: 'medium',
        userId,
        organizationId: 'org_1',
        metadata: {
          licenseName: 'Microsoft 365 E3',
          expiringCount: 15,
          daysUntilExpiry: 20,
        },
        actionUrl: '/licenses/microsoft-365',
        actionText: 'Manage Licenses',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        readAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Read 12 hours ago
      },
      {
        id: 'notif_3',
        type: 'report-ready',
        title: 'Monthly Cost Report Ready',
        message: 'Your monthly cost analysis report has been generated and is ready for download.',
        severity: 'low',
        userId,
        organizationId: 'org_1',
        metadata: {
          reportType: 'cost-analysis',
          fileName: 'cost-analysis-report-2024-01.pdf',
        },
        actionUrl: '/reports/download/cost-analysis-report-2024-01.pdf',
        actionText: 'Download Report',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Read 2 days ago
      },
    ];

    const filteredNotifications = mockNotifications.filter(notif => {
      if (options.unreadOnly && notif.readAt) return false;
      if (options.types && !options.types.includes(notif.type)) return false;
      return true;
    });

    const total = filteredNotifications.length;
    const unreadCount = mockNotifications.filter(notif => !notif.readAt).length;
    
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    const notifications = filteredNotifications.slice(offset, offset + limit);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Mock implementation - would update database
      logger.info('Notification marked as read', { notificationId, userId });
      
      // Send real-time update
      this.socketService.emitToUser(userId, 'notification_read', { notificationId });
      
      return true;
    } catch (error) {
      logger.error('Failed to mark notification as read', { error, notificationId, userId });
      return false;
    }
  }

  /**
   * Mark notification as dismissed
   */
  async dismissNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      // Mock implementation - would update database
      logger.info('Notification dismissed', { notificationId, userId });
      
      // Send real-time update
      this.socketService.emitToUser(userId, 'notification_dismissed', { notificationId });
      
      return true;
    } catch (error) {
      logger.error('Failed to dismiss notification', { error, notificationId, userId });
      return false;
    }
  }

  /**
   * Create or update alert rule
   */
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullRule: AlertRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alertRules.set(ruleId, fullRule);
    
    // Store in database (mock)
    logger.info('Alert rule created', { ruleId, name: rule.name, type: rule.type });
    
    return ruleId;
  }

  /**
   * Get alert rules for organization
   */
  async getAlertRules(organizationId: string): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values())
      .filter(rule => rule.organizationId === organizationId || rule.organizationId === 'default');
  }

  /**
   * Update alert rule
   */
  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<boolean> {
    const existingRule = this.alertRules.get(ruleId);
    if (!existingRule) {
      return false;
    }

    const updatedRule: AlertRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date(),
    };

    this.alertRules.set(ruleId, updatedRule);
    
    logger.info('Alert rule updated', { ruleId, updates });
    return true;
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<boolean> {
    const deleted = this.alertRules.delete(ruleId);
    
    if (deleted) {
      logger.info('Alert rule deleted', { ruleId });
    }
    
    return deleted;
  }

  /**
   * Check and trigger alerts based on current data
   */
  async checkAlerts(organizationId: string, metrics: Record<string, number>): Promise<void> {
    const rules = await this.getAlertRules(organizationId);
    
    for (const rule of rules) {
      if (!rule.isActive) continue;
      
      const shouldTrigger = this.evaluateAlertConditions(rule, metrics);
      
      if (shouldTrigger) {
        await this.triggerAlert(rule, metrics);
      }
    }
  }

  /**
   * Get notification preferences for user
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    // Mock implementation - would fetch from database
    return {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      categories: {
        costAlerts: true,
        usageWarnings: true,
        licenseExpiry: true,
        securityAlerts: true,
        systemUpdates: false,
        reportReady: true,
      },
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'America/New_York',
      },
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      // Mock implementation - would update database
      logger.info('Notification preferences updated', { userId, preferences });
      return true;
    } catch (error) {
      logger.error('Failed to update notification preferences', { error, userId });
      return false;
    }
  }

  // Private helper methods

  private async storeNotification(notification: NotificationData): Promise<void> {
    // Mock implementation - would store in database
    logger.debug('Storing notification', { notificationId: notification.id });
  }

  private async sendEmailNotification(notification: NotificationData): Promise<void> {
    // Mock implementation - would send email via email service
    logger.info('Email notification sent', {
      notificationId: notification.id,
      type: notification.type,
      severity: notification.severity,
    });
  }

  private evaluateAlertConditions(rule: AlertRule, metrics: Record<string, number>): boolean {
    return rule.conditions.every(condition => {
      const value = metrics[condition.metric];
      if (value === undefined) return false;

      switch (condition.operator) {
        case 'gt': return value > condition.threshold;
        case 'gte': return value >= condition.threshold;
        case 'lt': return value < condition.threshold;
        case 'lte': return value <= condition.threshold;
        case 'eq': return value === condition.threshold;
        default: return false;
      }
    });
  }

  private async triggerAlert(rule: AlertRule, metrics: Record<string, number>): Promise<void> {
    // Check if rule was recently triggered to avoid spam
    const now = new Date();
    const cooldownPeriod = 60 * 60 * 1000; // 1 hour cooldown
    
    if (rule.lastTriggered && (now.getTime() - rule.lastTriggered.getTime()) < cooldownPeriod) {
      return;
    }

    // Update last triggered time
    rule.lastTriggered = now;
    this.alertRules.set(rule.id, rule);

    // Execute alert actions
    for (const action of rule.actions) {
      if (action.type === 'notification') {
        await this.sendNotification({
          type: this.mapRuleTypeToNotificationType(rule.type),
          title: `Alert: ${rule.name}`,
          message: this.generateAlertMessage(rule, metrics),
          severity: (action.config.severity as any) || 'medium',
          organizationId: rule.organizationId,
          metadata: {
            ruleId: rule.id,
            ruleName: rule.name,
            triggeredMetrics: metrics,
          },
        });
      }
    }

    logger.info('Alert triggered', {
      ruleId: rule.id,
      ruleName: rule.name,
      organizationId: rule.organizationId,
      metrics,
    });
  }

  private mapRuleTypeToNotificationType(ruleType: string): NotificationData['type'] {
    switch (ruleType) {
      case 'cost-threshold': return 'cost-alert';
      case 'usage-anomaly': return 'usage-warning';
      case 'license-utilization': return 'license-expiry';
      case 'security-compliance': return 'security-alert';
      default: return 'system-update';
    }
  }

  private generateAlertMessage(rule: AlertRule, metrics: Record<string, number>): string {
    const condition = rule.conditions[0]; // Use first condition for message
    const value = metrics[condition.metric];
    
    return `${rule.name} has been triggered. Current value: ${value}, threshold: ${condition.threshold}`;
  }
}