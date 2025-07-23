import { Router, Request, Response } from 'express';
import { ReportingService, ReportConfig } from '../services/reportingService';
import { authenticateToken } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';
import { promises as fs } from 'fs';
import path from 'path';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    organizationId: string;
    role: string;
  };
}

const router = Router();
const reportingService = new ReportingService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/reports/templates
 * Get available report templates
 */
router.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = reportingService.getReportTemplates();
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    logger.error('Error fetching report templates', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report templates',
    });
  }
});

/**
 * POST /api/reports/generate
 * Generate a new report
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const {
      type,
      format,
      dateRange,
      filters,
      includeCharts,
      customFields,
    } = req.body;

    // Validate required fields
    if (!type || !format || !dateRange) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, format, dateRange',
      });
    }

    // Validate date range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format in dateRange',
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date must be before end date',
      });
    }

    const config: ReportConfig = {
      type,
      format,
      dateRange: { startDate, endDate },
      organizationId,
      filters,
      includeCharts,
      customFields,
    };

    const result = await reportingService.generateReport(config);

    if (result.success) {
      res.json({
        success: true,
        data: {
          fileName: result.fileName,
          size: result.size,
          downloadUrl: `/api/reports/download/${result.fileName}`,
        },
        message: 'Report generated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    logger.error('Error generating report', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
    });
  }
});

/**
 * GET /api/reports/download/:fileName
 * Download a generated report
 */
router.get('/download/:fileName', async (req: Request, res: Response) => {
  try {
    const { fileName } = req.params;
    const { organizationId } = (req as AuthenticatedRequest).user;

    // Security: Validate file name to prevent directory traversal
    if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file name',
      });
    }

    const reportsDir = path.join(process.cwd(), 'reports');
    const filePath = path.join(reportsDir, fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Report file not found',
      });
    }

    // Get file stats
    const stats = await fs.stat(filePath);
    
    // Set appropriate headers based on file type
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    let disposition = 'attachment';

    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.csv':
        contentType = 'text/csv';
        break;
      case '.json':
        contentType = 'application/json';
        disposition = 'inline';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream the file
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error: Error) => {
      logger.error('Error streaming report file', { error, fileName });
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to download report',
        });
      }
    });

    logger.info('Report downloaded', { fileName, organizationId });
  } catch (error) {
    logger.error('Error downloading report', { error, fileName: req.params.fileName });
    res.status(500).json({
      success: false,
      error: 'Failed to download report',
    });
  }
});

/**
 * POST /api/reports/schedule
 * Schedule a recurring report
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const {
      name,
      config,
      schedule, // cron expression
      recipients,
      isActive = true,
    } = req.body;

    if (!name || !config || !schedule || !recipients) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, config, schedule, recipients',
      });
    }

    // TODO: Implement scheduled report storage in database
    // For now, return success response
    const scheduledReport = {
      id: `scheduled-${Date.now()}`,
      name,
      config: { ...config, organizationId },
      schedule,
      recipients,
      isActive,
      createdAt: new Date(),
      nextRun: new Date(), // Calculate based on cron expression
    };

    res.status(201).json({
      success: true,
      data: scheduledReport,
      message: 'Report scheduled successfully',
    });

    logger.info('Report scheduled', { 
      scheduledReportId: scheduledReport.id, 
      organizationId 
    });
  } catch (error) {
    logger.error('Error scheduling report', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to schedule report',
    });
  }
});

/**
 * GET /api/reports/scheduled
 * Get scheduled reports for the organization
 */
router.get('/scheduled', async (req: Request, res: Response) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;

    // TODO: Fetch from database
    // For now, return empty array
    const scheduledReports: any[] = [];

    res.json({
      success: true,
      data: scheduledReports,
    });
  } catch (error) {
    logger.error('Error fetching scheduled reports', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scheduled reports',
    });
  }
});

/**
 * DELETE /api/reports/scheduled/:id
 * Delete a scheduled report
 */
router.delete('/scheduled/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = (req as AuthenticatedRequest).user;

    // TODO: Delete from database
    // For now, return success
    
    res.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });

    logger.info('Scheduled report deleted', { scheduledReportId: id, organizationId });
  } catch (error) {
    logger.error('Error deleting scheduled report', { error, reportId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to delete scheduled report',
    });
  }
});

/**
 * GET /api/reports/history
 * Get report generation history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const { page = 1, limit = 20, type } = req.query;

    // TODO: Fetch from database
    // For now, return mock data
    const history = [
      {
        id: '1',
        type: 'cost-analysis',
        format: 'pdf',
        fileName: 'cost-analysis-report-1640995200000.pdf',
        generatedAt: new Date('2024-01-01T10:00:00Z'),
        generatedBy: 'John Doe',
        size: 2048576,
        status: 'completed',
      },
      {
        id: '2',
        type: 'usage-summary',
        format: 'excel',
        fileName: 'usage-summary-report-1640995200000.xlsx',
        generatedAt: new Date('2024-01-02T14:30:00Z'),
        generatedBy: 'Jane Smith',
        size: 1536000,
        status: 'completed',
      },
    ];

    res.json({
      success: true,
      data: {
        reports: history,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: history.length,
          pages: Math.ceil(history.length / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching report history', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report history',
    });
  }
});

/**
 * POST /api/reports/cleanup
 * Clean up old report files
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const { maxAgeHours = 24 } = req.body;

    await reportingService.cleanupOldReports(maxAgeHours);

    res.json({
      success: true,
      message: 'Report cleanup completed successfully',
    });

    logger.info('Report cleanup completed', { maxAgeHours });
  } catch (error) {
    logger.error('Error during report cleanup', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup reports',
    });
  }
});

export default router;