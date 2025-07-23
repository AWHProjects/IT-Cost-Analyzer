import { Router, Request, Response } from 'express';
import { ConnectorManager, ConnectorConfiguration } from '../services/connectorManager';
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
const connectorManager = new ConnectorManager();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/connectors
 * List all connectors for the user's organization
 */
router.get('/', async (req, res) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const connectors = await connectorManager.listConnectors(organizationId);
    
    res.json({
      success: true,
      data: connectors,
    });
  } catch (error) {
    logger.error('Error listing connectors', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list connectors',
    });
  }
});

/**
 * POST /api/connectors
 * Register a new connector
 */
router.post('/', async (req, res) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const { name, type, config } = req.body;

    if (!name || !type || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, config',
      });
    }

    const connectorConfig: ConnectorConfiguration = {
      id: `${type}-${Date.now()}`,
      name,
      type,
      config,
      isActive: true,
      organizationId,
    };

    const success = await connectorManager.registerConnector(connectorConfig);

    if (success) {
      res.status(201).json({
        success: true,
        data: { connectorId: connectorConfig.id },
        message: 'Connector registered successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to register connector',
      });
    }
  } catch (error) {
    logger.error('Error registering connector', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/connectors/:id/status
 * Get connector status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await connectorManager.getConnectorStatus(id);
    
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error getting connector status', { error, connectorId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to get connector status',
    });
  }
});

/**
 * POST /api/connectors/:id/sync
 * Trigger sync for a specific connector
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await connectorManager.syncConnector(id);
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Connector sync completed successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        data: result,
        error: result.error || 'Sync failed',
      });
    }
  } catch (error) {
    logger.error('Error syncing connector', { error, connectorId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to sync connector',
    });
  }
});

/**
 * POST /api/connectors/sync-all
 * Trigger sync for all active connectors in the organization
 */
router.post('/sync-all', async (req, res) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    const results = await connectorManager.syncAllConnectors(organizationId);
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: totalCount,
          successful: successCount,
          failed: totalCount - successCount,
        },
      },
      message: `Sync completed for ${successCount}/${totalCount} connectors`,
    });
  } catch (error) {
    logger.error('Error syncing all connectors', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to sync connectors',
    });
  }
});

/**
 * DELETE /api/connectors/:id
 * Remove a connector
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await connectorManager.removeConnector(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Connector removed successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to remove connector',
      });
    }
  } catch (error) {
    logger.error('Error removing connector', { error, connectorId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to remove connector',
    });
  }
});

/**
 * GET /api/connectors/supported-types
 * Get list of supported connector types
 */
router.get('/supported-types', (req, res) => {
  const supportedTypes = [
    {
      type: 'microsoft365',
      name: 'Microsoft 365',
      description: 'Connect to Microsoft 365 for user, license, and usage data',
      requiredFields: ['tenantId', 'clientId', 'clientSecret'],
      optionalFields: ['accessToken', 'refreshToken'],
    },
    {
      type: 'slack',
      name: 'Slack',
      description: 'Connect to Slack workspace for user and usage data',
      requiredFields: ['accessToken'],
      optionalFields: ['teamId'],
    },
    {
      type: 'github',
      name: 'GitHub',
      description: 'Connect to GitHub organization for user and repository data',
      requiredFields: ['accessToken', 'organizationName'],
      optionalFields: [],
    },
    {
      type: 'google-workspace',
      name: 'Google Workspace',
      description: 'Connect to Google Workspace for user, license, and usage data',
      requiredFields: ['serviceAccountKey', 'domain'],
      optionalFields: ['impersonateUser'],
    },
    {
      type: 'zoom',
      name: 'Zoom',
      description: 'Connect to Zoom for user and meeting usage data',
      requiredFields: ['apiKey', 'apiSecret'],
      optionalFields: ['accountId'],
    },
    {
      type: 'atlassian',
      name: 'Atlassian (Jira/Confluence)',
      description: 'Connect to Atlassian products for user and usage data',
      requiredFields: ['apiToken', 'email', 'domain'],
      optionalFields: [],
    },
  ];

  res.json({
    success: true,
    data: supportedTypes,
  });
});

/**
 * POST /api/connectors/test-connection
 * Test connection with provided configuration without saving
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { type, config } = req.body;

    if (!type || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, config',
      });
    }

    // Create a temporary connector for testing
    const tempConfig: ConnectorConfiguration = {
      id: 'temp-test',
      name: 'Test Connection',
      type,
      config,
      isActive: false,
      organizationId: (req as AuthenticatedRequest).user.organizationId,
    };

    const tempManager = new ConnectorManager();
    const success = await tempManager.registerConnector(tempConfig);

    if (success) {
      const status = await tempManager.getConnectorStatus('temp-test');
      
      res.json({
        success: true,
        data: {
          isConnected: status.isConnected,
          error: status.error,
        },
        message: status.isConnected ? 'Connection successful' : 'Connection failed',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to test connection',
      });
    }
  } catch (error) {
    logger.error('Error testing connection', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to test connection',
    });
  }
});

export default router;