import { logger } from '../utils/logger';
import DatabaseService from './database';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import { promises as fs } from 'fs';
import path from 'path';

export interface ReportConfig {
  type: 'cost-analysis' | 'usage-summary' | 'license-optimization' | 'security-audit' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  organizationId: string;
  filters?: {
    applications?: string[];
    departments?: string[];
    users?: string[];
    licenseTypes?: string[];
  };
  includeCharts?: boolean;
  customFields?: string[];
}

export interface ReportData {
  summary: {
    totalCost: number;
    totalUsers: number;
    totalApplications: number;
    totalLicenses: number;
    costSavingsOpportunity: number;
    utilizationRate: number;
  };
  applications: Array<{
    id: string;
    name: string;
    totalCost: number;
    licensesTotal: number;
    licensesUsed: number;
    utilizationRate: number;
    lastUsed: Date;
    department: string;
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    totalLicenses: number;
    activeLicenses: number;
    lastActivity: Date;
    costPerUser: number;
  }>;
  licenses: Array<{
    id: string;
    name: string;
    type: string;
    totalCount: number;
    usedCount: number;
    availableCount: number;
    costPerLicense: number;
    totalCost: number;
    renewalDate: Date;
    utilizationRate: number;
  }>;
  costBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  recommendations: Array<{
    type: 'cost-saving' | 'optimization' | 'security' | 'compliance';
    title: string;
    description: string;
    potentialSavings: number;
    priority: 'high' | 'medium' | 'low';
    actionItems: string[];
  }>;
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
  size?: number;
}

export class ReportingService {
  private db: DatabaseService;
  private reportsDir: string;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.ensureReportsDirectory();
  }

  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create reports directory', { error });
    }
  }

  /**
   * Generate a comprehensive report based on configuration
   */
  async generateReport(config: ReportConfig): Promise<ExportResult> {
    try {
      logger.info('Starting report generation', { 
        type: config.type, 
        format: config.format,
        organizationId: config.organizationId 
      });

      // Gather report data
      const reportData = await this.gatherReportData(config);

      // Generate report in requested format
      switch (config.format) {
        case 'pdf':
          return await this.generatePDFReport(config, reportData);
        case 'excel':
          return await this.generateExcelReport(config, reportData);
        case 'csv':
          return await this.generateCSVReport(config, reportData);
        case 'json':
          return await this.generateJSONReport(config, reportData);
        default:
          throw new Error(`Unsupported report format: ${config.format}`);
      }
    } catch (error) {
      logger.error('Report generation failed', { error, config });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gather all necessary data for the report
   */
  private async gatherReportData(config: ReportConfig): Promise<ReportData> {
    // This would typically query the database using Prisma
    // For now, we'll return mock data structure
    
    const mockData: ReportData = {
      summary: {
        totalCost: 125000,
        totalUsers: 250,
        totalApplications: 45,
        totalLicenses: 320,
        costSavingsOpportunity: 18500,
        utilizationRate: 0.72,
      },
      applications: [
        {
          id: '1',
          name: 'Microsoft 365',
          totalCost: 45000,
          licensesTotal: 250,
          licensesUsed: 180,
          utilizationRate: 0.72,
          lastUsed: new Date(),
          department: 'IT',
        },
        {
          id: '2',
          name: 'Slack',
          totalCost: 12000,
          licensesTotal: 200,
          licensesUsed: 150,
          utilizationRate: 0.75,
          lastUsed: new Date(),
          department: 'Communications',
        },
      ],
      users: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@company.com',
          department: 'Engineering',
          totalLicenses: 5,
          activeLicenses: 3,
          lastActivity: new Date(),
          costPerUser: 180,
        },
      ],
      licenses: [
        {
          id: '1',
          name: 'Office 365 E3',
          type: 'subscription',
          totalCount: 250,
          usedCount: 180,
          availableCount: 70,
          costPerLicense: 22,
          totalCost: 5500,
          renewalDate: new Date('2024-12-31'),
          utilizationRate: 0.72,
        },
      ],
      costBreakdown: [
        { category: 'Productivity Software', amount: 65000, percentage: 52 },
        { category: 'Communication Tools', amount: 25000, percentage: 20 },
        { category: 'Development Tools', amount: 20000, percentage: 16 },
        { category: 'Security Software', amount: 15000, percentage: 12 },
      ],
      recommendations: [
        {
          type: 'cost-saving',
          title: 'Optimize Microsoft 365 Licenses',
          description: 'Remove unused licenses and downgrade overprovisioned users',
          potentialSavings: 8500,
          priority: 'high',
          actionItems: [
            'Identify users with no activity in last 90 days',
            'Review license assignments for part-time employees',
            'Consider downgrading from E5 to E3 for basic users',
          ],
        },
        {
          type: 'optimization',
          title: 'Consolidate Communication Tools',
          description: 'Multiple overlapping communication platforms detected',
          potentialSavings: 5000,
          priority: 'medium',
          actionItems: [
            'Standardize on primary communication platform',
            'Migrate users from redundant tools',
            'Cancel unused subscriptions',
          ],
        },
      ],
    };

    return mockData;
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(config: ReportConfig, data: ReportData): Promise<ExportResult> {
    const fileName = `${config.type}-report-${Date.now()}.pdf`;
    const filePath = path.join(this.reportsDir, fileName);

    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = require('fs').createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('IT Cost Analysis Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`);
      doc.text(`Period: ${config.dateRange.startDate.toLocaleDateString()} - ${config.dateRange.endDate.toLocaleDateString()}`);
      doc.moveDown();

      // Executive Summary
      doc.fontSize(16).text('Executive Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Total Cost: $${data.summary.totalCost.toLocaleString()}`);
      doc.text(`Total Users: ${data.summary.totalUsers}`);
      doc.text(`Total Applications: ${data.summary.totalApplications}`);
      doc.text(`Utilization Rate: ${(data.summary.utilizationRate * 100).toFixed(1)}%`);
      doc.text(`Cost Savings Opportunity: $${data.summary.costSavingsOpportunity.toLocaleString()}`);
      doc.moveDown();

      // Cost Breakdown
      doc.fontSize(16).text('Cost Breakdown', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      data.costBreakdown.forEach(item => {
        doc.text(`${item.category}: $${item.amount.toLocaleString()} (${item.percentage}%)`);
      });
      doc.moveDown();

      // Applications
      doc.fontSize(16).text('Application Analysis', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      data.applications.forEach(app => {
        doc.text(`${app.name}:`);
        doc.text(`  Cost: $${app.totalCost.toLocaleString()}`);
        doc.text(`  Utilization: ${(app.utilizationRate * 100).toFixed(1)}%`);
        doc.text(`  Licenses: ${app.licensesUsed}/${app.licensesTotal}`);
        doc.moveDown(0.5);
      });

      // Recommendations
      doc.addPage();
      doc.fontSize(16).text('Recommendations', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      data.recommendations.forEach((rec, index) => {
        doc.text(`${index + 1}. ${rec.title} (${rec.priority.toUpperCase()} PRIORITY)`);
        doc.text(`   ${rec.description}`);
        doc.text(`   Potential Savings: $${rec.potentialSavings.toLocaleString()}`);
        doc.text('   Action Items:');
        rec.actionItems.forEach(item => {
          doc.text(`   • ${item}`);
        });
        doc.moveDown();
      });

      doc.end();

      return new Promise((resolve) => {
        stream.on('finish', async () => {
          const stats = await fs.stat(filePath);
          resolve({
            success: true,
            filePath,
            fileName,
            size: stats.size,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF generation failed',
      };
    }
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(config: ReportConfig, data: ReportData): Promise<ExportResult> {
    const fileName = `${config.type}-report-${Date.now()}.xlsx`;
    const filePath = path.join(this.reportsDir, fileName);

    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Cost', `$${data.summary.totalCost.toLocaleString()}`],
        ['Total Users', data.summary.totalUsers],
        ['Total Applications', data.summary.totalApplications],
        ['Total Licenses', data.summary.totalLicenses],
        ['Utilization Rate', `${(data.summary.utilizationRate * 100).toFixed(1)}%`],
        ['Cost Savings Opportunity', `$${data.summary.costSavingsOpportunity.toLocaleString()}`],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Applications sheet
      const appsData = [
        ['Name', 'Total Cost', 'Licenses Total', 'Licenses Used', 'Utilization Rate', 'Department'],
        ...data.applications.map(app => [
          app.name,
          app.totalCost,
          app.licensesTotal,
          app.licensesUsed,
          `${(app.utilizationRate * 100).toFixed(1)}%`,
          app.department,
        ]),
      ];
      const appsSheet = XLSX.utils.aoa_to_sheet(appsData);
      XLSX.utils.book_append_sheet(workbook, appsSheet, 'Applications');

      // Licenses sheet
      const licensesData = [
        ['Name', 'Type', 'Total Count', 'Used Count', 'Available', 'Cost Per License', 'Total Cost', 'Utilization'],
        ...data.licenses.map(license => [
          license.name,
          license.type,
          license.totalCount,
          license.usedCount,
          license.availableCount,
          license.costPerLicense,
          license.totalCost,
          `${(license.utilizationRate * 100).toFixed(1)}%`,
        ]),
      ];
      const licensesSheet = XLSX.utils.aoa_to_sheet(licensesData);
      XLSX.utils.book_append_sheet(workbook, licensesSheet, 'Licenses');

      // Recommendations sheet
      const recsData = [
        ['Title', 'Type', 'Priority', 'Potential Savings', 'Description'],
        ...data.recommendations.map(rec => [
          rec.title,
          rec.type,
          rec.priority,
          rec.potentialSavings,
          rec.description,
        ]),
      ];
      const recsSheet = XLSX.utils.aoa_to_sheet(recsData);
      XLSX.utils.book_append_sheet(workbook, recsSheet, 'Recommendations');

      XLSX.writeFile(workbook, filePath);

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileName,
        size: stats.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Excel generation failed',
      };
    }
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(config: ReportConfig, data: ReportData): Promise<ExportResult> {
    const fileName = `${config.type}-report-${Date.now()}.csv`;
    const filePath = path.join(this.reportsDir, fileName);

    try {
      const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'name', title: 'Application Name' },
          { id: 'totalCost', title: 'Total Cost' },
          { id: 'licensesTotal', title: 'Total Licenses' },
          { id: 'licensesUsed', title: 'Used Licenses' },
          { id: 'utilizationRate', title: 'Utilization Rate' },
          { id: 'department', title: 'Department' },
        ],
      });

      const records = data.applications.map(app => ({
        name: app.name,
        totalCost: app.totalCost,
        licensesTotal: app.licensesTotal,
        licensesUsed: app.licensesUsed,
        utilizationRate: `${(app.utilizationRate * 100).toFixed(1)}%`,
        department: app.department,
      }));

      await csvWriter.writeRecords(records);

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileName,
        size: stats.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'CSV generation failed',
      };
    }
  }

  /**
   * Generate JSON report
   */
  private async generateJSONReport(config: ReportConfig, data: ReportData): Promise<ExportResult> {
    const fileName = `${config.type}-report-${Date.now()}.json`;
    const filePath = path.join(this.reportsDir, fileName);

    try {
      const reportContent = {
        metadata: {
          generatedAt: new Date().toISOString(),
          reportType: config.type,
          dateRange: config.dateRange,
          organizationId: config.organizationId,
        },
        data,
      };

      await fs.writeFile(filePath, JSON.stringify(reportContent, null, 2));

      const stats = await fs.stat(filePath);
      return {
        success: true,
        filePath,
        fileName,
        size: stats.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'JSON generation failed',
      };
    }
  }

  /**
   * Get available report templates
   */
  getReportTemplates(): Array<{
    type: string;
    name: string;
    description: string;
    supportedFormats: string[];
  }> {
    return [
      {
        type: 'cost-analysis',
        name: 'Cost Analysis Report',
        description: 'Comprehensive analysis of software costs and spending patterns',
        supportedFormats: ['pdf', 'excel', 'csv', 'json'],
      },
      {
        type: 'usage-summary',
        name: 'Usage Summary Report',
        description: 'Overview of software usage and user activity patterns',
        supportedFormats: ['pdf', 'excel', 'csv', 'json'],
      },
      {
        type: 'license-optimization',
        name: 'License Optimization Report',
        description: 'Recommendations for optimizing license allocation and costs',
        supportedFormats: ['pdf', 'excel', 'json'],
      },
      {
        type: 'security-audit',
        name: 'Security Audit Report',
        description: 'Security compliance and risk assessment report',
        supportedFormats: ['pdf', 'json'],
      },
    ];
  }

  /**
   * Clean up old report files
   */
  async cleanupOldReports(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = await fs.readdir(this.reportsDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = path.join(this.reportsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filePath);
          logger.info('Cleaned up old report file', { file });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old reports', { error });
    }
  }
}