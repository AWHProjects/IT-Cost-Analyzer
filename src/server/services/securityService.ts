import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';
import DatabaseService from './database';

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'data_access' | 'data_export' | 'config_change' | 'failed_login' | 'suspicious_activity';
  userId?: string;
  organizationId: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  action: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'sox' | 'hipaa' | 'iso27001' | 'custom';
  organizationId: string;
  generatedAt: Date;
  period: {
    startDate: Date;
    endDate: Date;
  };
  findings: ComplianceFinding[];
  status: 'compliant' | 'non_compliant' | 'partial_compliance';
  score: number; // 0-100
  recommendations: string[];
}

export interface ComplianceFinding {
  id: string;
  category: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'not_applicable';
  evidence?: string;
  remediation?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  accessControls: string[];
}

export class SecurityService {
  private db: DatabaseService;
  private encryptionKey: string;
  private auditLog: SecurityEvent[] = [];

  constructor() {
    this.db = DatabaseService.getInstance();
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
  }

  /**
   * Generate a secure encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string, classification: DataClassification): string {
    if (!classification.encryptionRequired) {
      return data;
    }

    try {
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, this.encryptionKey);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Data encryption failed', { error });
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const algorithm = 'aes-256-gcm';
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, this.encryptionKey);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Data decryption failed', { error });
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  async hashData(data: string): Promise<string> {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(data, saltRounds);
    } catch (error) {
      logger.error('Data hashing failed', { error });
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Verify hashed data
   */
  async verifyHash(data: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(data, hash);
    } catch (error) {
      logger.error('Hash verification failed', { error });
      return false;
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<string> {
    const eventId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const securityEvent: SecurityEvent = {
      ...event,
      id: eventId,
      timestamp: new Date(),
    };

    this.auditLog.push(securityEvent);

    // Store in database (mock implementation)
    await this.storeSecurityEvent(securityEvent);

    // Check for suspicious patterns
    await this.analyzeSuspiciousActivity(securityEvent);

    logger.info('Security event logged', {
      eventId,
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      organizationId: event.organizationId,
    });

    return eventId;
  }

  /**
   * Get security events for analysis
   */
  async getSecurityEvents(
    organizationId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      types?: string[];
      severity?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    events: SecurityEvent[];
    total: number;
  }> {
    // Mock implementation - would query database
    let filteredEvents = this.auditLog.filter(event => 
      event.organizationId === organizationId
    );

    if (options.startDate) {
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp >= options.startDate!
      );
    }

    if (options.endDate) {
      filteredEvents = filteredEvents.filter(event => 
        event.timestamp <= options.endDate!
      );
    }

    if (options.types && options.types.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        options.types!.includes(event.type)
      );
    }

    if (options.severity && options.severity.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        options.severity!.includes(event.severity)
      );
    }

    const total = filteredEvents.length;
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    
    const events = filteredEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);

    return { events, total };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    type: ComplianceReport['type'],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const reportId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get compliance requirements based on type
    const requirements = this.getComplianceRequirements(type);
    
    // Assess compliance for each requirement
    const findings: ComplianceFinding[] = [];
    let compliantCount = 0;

    for (const requirement of requirements) {
      const finding = await this.assessCompliance(organizationId, requirement, startDate, endDate);
      findings.push(finding);
      
      if (finding.status === 'compliant') {
        compliantCount++;
      }
    }

    const score = Math.round((compliantCount / requirements.length) * 100);
    const status: ComplianceReport['status'] = 
      score >= 95 ? 'compliant' : 
      score >= 70 ? 'partial_compliance' : 
      'non_compliant';

    const recommendations = this.generateComplianceRecommendations(findings);

    const report: ComplianceReport = {
      id: reportId,
      type,
      organizationId,
      generatedAt: new Date(),
      period: { startDate, endDate },
      findings,
      status,
      score,
      recommendations,
    };

    // Store report (mock implementation)
    await this.storeComplianceReport(report);

    logger.info('Compliance report generated', {
      reportId,
      type,
      organizationId,
      score,
      status,
    });

    return report;
  }

  /**
   * Perform security scan
   */
  async performSecurityScan(organizationId: string): Promise<{
    vulnerabilities: Array<{
      id: string;
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
      affected: string[];
    }>;
    score: number;
    lastScan: Date;
  }> {
    const vulnerabilities = [];
    
    // Check for common security issues
    const checks = [
      this.checkPasswordPolicies(organizationId),
      this.checkDataEncryption(organizationId),
      this.checkAccessControls(organizationId),
      this.checkAuditLogging(organizationId),
      this.checkNetworkSecurity(organizationId),
    ];

    const results = await Promise.all(checks);
    vulnerabilities.push(...results.flat());

    // Calculate security score
    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

    const score = Math.max(0, 100 - (criticalCount * 25 + highCount * 10 + mediumCount * 5 + lowCount * 1));

    return {
      vulnerabilities,
      score,
      lastScan: new Date(),
    };
  }

  /**
   * Classify data based on content and context
   */
  classifyData(data: any, context: string): DataClassification {
    // Simple classification logic - would be more sophisticated in production
    const dataString = JSON.stringify(data).toLowerCase();
    
    // Check for sensitive patterns
    const hasPII = /email|phone|ssn|credit|card|passport|license/.test(dataString);
    const hasFinancial = /cost|price|salary|revenue|budget|invoice/.test(dataString);
    const hasConfidential = /password|secret|key|token|private/.test(dataString);

    if (hasConfidential) {
      return {
        level: 'restricted',
        categories: ['authentication', 'secrets'],
        retentionPeriod: 90,
        encryptionRequired: true,
        accessControls: ['admin', 'security_officer'],
      };
    }

    if (hasPII || hasFinancial) {
      return {
        level: 'confidential',
        categories: hasPII ? ['pii'] : ['financial'],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ['admin', 'manager', 'authorized_user'],
      };
    }

    if (context.includes('internal') || context.includes('organization')) {
      return {
        level: 'internal',
        categories: ['business'],
        retentionPeriod: 1095, // 3 years
        encryptionRequired: false,
        accessControls: ['employee'],
      };
    }

    return {
      level: 'public',
      categories: ['general'],
      retentionPeriod: 365, // 1 year
      encryptionRequired: false,
      accessControls: ['public'],
    };
  }

  // Private helper methods

  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    // Mock implementation - would store in database
    logger.debug('Storing security event', { eventId: event.id });
  }

  private async analyzeSuspiciousActivity(event: SecurityEvent): Promise<void> {
    // Check for patterns that might indicate suspicious activity
    const recentEvents = this.auditLog
      .filter(e => 
        e.organizationId === event.organizationId &&
        e.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // Last hour
      );

    // Multiple failed logins
    if (event.type === 'failed_login') {
      const failedLogins = recentEvents.filter(e => 
        e.type === 'failed_login' && 
        e.details.email === event.details.email
      );

      if (failedLogins.length >= 5) {
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          organizationId: event.organizationId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          action: 'multiple_failed_logins',
          details: {
            email: event.details.email,
            attemptCount: failedLogins.length,
          },
          severity: 'high',
        });
      }
    }

    // Unusual data access patterns
    if (event.type === 'data_access') {
      const dataAccess = recentEvents.filter(e => e.type === 'data_access');
      
      if (dataAccess.length > 100) { // Unusually high access rate
        await this.logSecurityEvent({
          type: 'suspicious_activity',
          userId: event.userId,
          organizationId: event.organizationId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          action: 'unusual_data_access_pattern',
          details: {
            accessCount: dataAccess.length,
            timeWindow: '1 hour',
          },
          severity: 'medium',
        });
      }
    }
  }

  private getComplianceRequirements(type: ComplianceReport['type']): Array<{
    id: string;
    category: string;
    requirement: string;
    description: string;
  }> {
    const requirements = {
      gdpr: [
        {
          id: 'gdpr_1',
          category: 'Data Protection',
          requirement: 'Data Processing Lawfulness',
          description: 'Ensure all personal data processing has a lawful basis',
        },
        {
          id: 'gdpr_2',
          category: 'Data Protection',
          requirement: 'Data Subject Rights',
          description: 'Implement mechanisms for data subject rights (access, rectification, erasure)',
        },
        {
          id: 'gdpr_3',
          category: 'Security',
          requirement: 'Data Security Measures',
          description: 'Implement appropriate technical and organizational security measures',
        },
      ],
      sox: [
        {
          id: 'sox_1',
          category: 'Financial Controls',
          requirement: 'Internal Controls',
          description: 'Maintain adequate internal controls over financial reporting',
        },
        {
          id: 'sox_2',
          category: 'Audit Trail',
          requirement: 'Audit Documentation',
          description: 'Maintain comprehensive audit trails for financial transactions',
        },
      ],
      iso27001: [
        {
          id: 'iso_1',
          category: 'Information Security',
          requirement: 'Security Policy',
          description: 'Establish and maintain information security policies',
        },
        {
          id: 'iso_2',
          category: 'Access Control',
          requirement: 'Access Management',
          description: 'Implement proper access control mechanisms',
        },
      ],
    };

    return (requirements as any)[type] || [];
  }

  private async assessCompliance(
    organizationId: string,
    requirement: any,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceFinding> {
    // Mock compliance assessment - would be more sophisticated in production
    const isCompliant = Math.random() > 0.3; // 70% compliance rate for demo

    return {
      id: `finding_${requirement.id}`,
      category: requirement.category,
      requirement: requirement.requirement,
      status: isCompliant ? 'compliant' : 'non_compliant',
      evidence: isCompliant ? 'Automated assessment passed' : 'Issues detected in automated assessment',
      remediation: isCompliant ? undefined : 'Review and update implementation',
      priority: isCompliant ? 'low' : 'medium',
    };
  }

  private generateComplianceRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations = [];
    
    const nonCompliantFindings = findings.filter(f => f.status === 'non_compliant');
    
    if (nonCompliantFindings.length > 0) {
      recommendations.push('Address non-compliant findings to improve overall compliance score');
      recommendations.push('Implement regular compliance monitoring and assessment procedures');
      recommendations.push('Provide compliance training to relevant staff members');
    }

    const criticalFindings = findings.filter(f => f.priority === 'critical');
    if (criticalFindings.length > 0) {
      recommendations.push('Prioritize resolution of critical compliance findings');
    }

    return recommendations;
  }

  private async storeComplianceReport(report: ComplianceReport): Promise<void> {
    // Mock implementation - would store in database
    logger.debug('Storing compliance report', { reportId: report.id });
  }

  private async checkPasswordPolicies(organizationId: string): Promise<any[]> {
    // Mock security check
    return [
      {
        id: 'pwd_1',
        type: 'password_policy',
        severity: 'medium' as const,
        description: 'Password policy could be strengthened',
        recommendation: 'Implement stronger password requirements (minimum 12 characters, complexity rules)',
        affected: ['user_authentication'],
      },
    ];
  }

  private async checkDataEncryption(organizationId: string): Promise<any[]> {
    return [
      {
        id: 'enc_1',
        type: 'data_encryption',
        severity: 'low' as const,
        description: 'Some data fields are not encrypted at rest',
        recommendation: 'Enable encryption for all sensitive data fields',
        affected: ['database', 'file_storage'],
      },
    ];
  }

  private async checkAccessControls(organizationId: string): Promise<any[]> {
    return [];
  }

  private async checkAuditLogging(organizationId: string): Promise<any[]> {
    return [];
  }

  private async checkNetworkSecurity(organizationId: string): Promise<any[]> {
    return [
      {
        id: 'net_1',
        type: 'network_security',
        severity: 'medium' as const,
        description: 'API endpoints should implement rate limiting',
        recommendation: 'Implement comprehensive rate limiting on all API endpoints',
        affected: ['api_endpoints'],
      },
    ];
  }
}