import { Router, Request, Response } from 'express';
import { SecurityService } from '../services/securityService';
import { authenticateToken } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    organizationId: string;
    role: string;
  };
}

const router = Router();
const securityService = new SecurityService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/security/events
 * Get security events for the organization
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { organizationId, role } = (req as AuthenticatedRequest).user;
    
    // Only admins can view security events
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view security events',
      });
    }

    const {
      startDate,
      endDate,
      types,
      severity,
      page = 1,
      limit = 50,
    } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      types: types ? (types as string).split(',') : undefined,
      severity: severity ? (severity as string).split(',') : undefined,
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
    };

    const result = await securityService.getSecurityEvents(organizationId, options);

    res.json({
      success: true,
      data: {
        events: result.events,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching security events', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security events',
    });
  }
});

/**
 * POST /api/security/events
 * Log a security event
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const { id: userId, organizationId } = (req as AuthenticatedRequest).user;
    const {
      type,
      action,
      resource,
      details = {},
      severity = 'medium',
    } = req.body;

    if (!type || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, action',
      });
    }

    const eventId = await securityService.logSecurityEvent({
      type,
      userId,
      organizationId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      resource,
      action,
      details,
      severity,
    });

    res.status(201).json({
      success: true,
      data: { eventId },
      message: 'Security event logged successfully',
    });
  } catch (error) {
    logger.error('Error logging security event', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to log security event',
    });
  }
});

/**
 * GET /api/security/scan
 * Perform security scan
 */
router.get('/scan', async (req: Request, res: Response) => {
  try {
    const { organizationId, role } = (req as AuthenticatedRequest).user;
    
    // Only admins can perform security scans
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to perform security scan',
      });
    }

    const scanResult = await securityService.performSecurityScan(organizationId);

    res.json({
      success: true,
      data: scanResult,
    });
  } catch (error) {
    logger.error('Error performing security scan', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to perform security scan',
    });
  }
});

/**
 * POST /api/security/encrypt
 * Encrypt sensitive data
 */
router.post('/encrypt', async (req: Request, res: Response) => {
  try {
    const { data, context = 'general' } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: data',
      });
    }

    // Classify the data
    const classification = securityService.classifyData(data, context);
    
    // Encrypt if required
    const encryptedData = securityService.encryptData(
      typeof data === 'string' ? data : JSON.stringify(data),
      classification
    );

    res.json({
      success: true,
      data: {
        encryptedData,
        classification,
      },
    });
  } catch (error) {
    logger.error('Error encrypting data', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to encrypt data',
    });
  }
});

/**
 * POST /api/security/decrypt
 * Decrypt sensitive data
 */
router.post('/decrypt', async (req: Request, res: Response) => {
  try {
    const { role } = (req as AuthenticatedRequest).user;
    const { encryptedData } = req.body;

    // Only admins can decrypt data
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to decrypt data',
      });
    }

    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: encryptedData',
      });
    }

    const decryptedData = securityService.decryptData(encryptedData);

    res.json({
      success: true,
      data: { decryptedData },
    });
  } catch (error) {
    logger.error('Error decrypting data', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to decrypt data',
    });
  }
});

/**
 * POST /api/security/hash
 * Hash sensitive data
 */
router.post('/hash', async (req: Request, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: data',
      });
    }

    const hashedData = await securityService.hashData(data);

    res.json({
      success: true,
      data: { hashedData },
    });
  } catch (error) {
    logger.error('Error hashing data', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to hash data',
    });
  }
});

/**
 * POST /api/security/verify-hash
 * Verify hashed data
 */
router.post('/verify-hash', async (req: Request, res: Response) => {
  try {
    const { data, hash } = req.body;

    if (!data || !hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: data, hash',
      });
    }

    const isValid = await securityService.verifyHash(data, hash);

    res.json({
      success: true,
      data: { isValid },
    });
  } catch (error) {
    logger.error('Error verifying hash', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to verify hash',
    });
  }
});

/**
 * POST /api/security/classify
 * Classify data sensitivity
 */
router.post('/classify', async (req: Request, res: Response) => {
  try {
    const { data, context = 'general' } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: data',
      });
    }

    const classification = securityService.classifyData(data, context);

    res.json({
      success: true,
      data: { classification },
    });
  } catch (error) {
    logger.error('Error classifying data', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to classify data',
    });
  }
});

/**
 * GET /api/security/compliance/reports
 * Get compliance reports
 */
router.get('/compliance/reports', async (req: Request, res: Response) => {
  try {
    const { organizationId, role } = (req as AuthenticatedRequest).user;
    
    // Only admins can view compliance reports
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to view compliance reports',
      });
    }

    // Mock implementation - would fetch from database
    const reports = [
      {
        id: 'comp_1',
        type: 'gdpr',
        generatedAt: new Date('2024-01-01'),
        status: 'compliant',
        score: 95,
      },
      {
        id: 'comp_2',
        type: 'sox',
        generatedAt: new Date('2024-01-15'),
        status: 'partial_compliance',
        score: 78,
      },
    ];

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    logger.error('Error fetching compliance reports', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch compliance reports',
    });
  }
});

/**
 * POST /api/security/compliance/reports
 * Generate compliance report
 */
router.post('/compliance/reports', async (req: Request, res: Response) => {
  try {
    const { organizationId, role } = (req as AuthenticatedRequest).user;
    
    // Only admins can generate compliance reports
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to generate compliance reports',
      });
    }

    const {
      type,
      startDate,
      endDate,
    } = req.body;

    if (!type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, startDate, endDate',
      });
    }

    const report = await securityService.generateComplianceReport(
      organizationId,
      type,
      new Date(startDate),
      new Date(endDate)
    );

    res.status(201).json({
      success: true,
      data: report,
      message: 'Compliance report generated successfully',
    });
  } catch (error) {
    logger.error('Error generating compliance report', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report',
    });
  }
});

/**
 * GET /api/security/compliance/types
 * Get available compliance types
 */
router.get('/compliance/types', (req: Request, res: Response) => {
  const complianceTypes = [
    {
      type: 'gdpr',
      name: 'General Data Protection Regulation',
      description: 'EU data protection and privacy regulation',
      categories: ['Data Protection', 'Privacy', 'Security'],
    },
    {
      type: 'sox',
      name: 'Sarbanes-Oxley Act',
      description: 'US federal law for financial reporting accuracy',
      categories: ['Financial Controls', 'Audit Trail', 'Internal Controls'],
    },
    {
      type: 'hipaa',
      name: 'Health Insurance Portability and Accountability Act',
      description: 'US healthcare data protection regulation',
      categories: ['Healthcare Data', 'Privacy', 'Security'],
    },
    {
      type: 'iso27001',
      name: 'ISO/IEC 27001',
      description: 'International information security management standard',
      categories: ['Information Security', 'Risk Management', 'Access Control'],
    },
  ];

  res.json({
    success: true,
    data: complianceTypes,
  });
});

export default router;