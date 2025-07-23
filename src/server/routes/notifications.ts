import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
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
const notificationService = new NotificationService();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      types,
    } = req.query;

    const options = {
      limit: parseInt(limit as string),
      offset: (parseInt(page as string) - 1) * parseInt(limit as string),
      unreadOnly: unreadOnly === 'true',
      types: types ? (types as string).split(',') : undefined,
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit as string)),
        },
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 */
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id: notificationId } = req.params;
    const { id: userId } = (req as AuthenticatedRequest).user;

    const success = await notificationService.markAsRead(notificationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to mark notification as read',
      });
    }
  } catch (error) {
    logger.error('Error marking notification as read', { error, notificationId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
});

/**
 * POST /api/notifications/:id/dismiss
 * Dismiss a notification
 */
router.post('/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const { id: notificationId } = req.params;
    const { id: userId } = (req as AuthenticatedRequest).user;

    const success = await notificationService.dismissNotification(notificationId, userId);

    if (success) {
      res.json({
        success: true,
        message: 'Notification dismissed',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to dismiss notification',
      });
    }
  } catch (error) {
    logger.error('Error dismissing notification', { error, notificationId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to dismiss notification',
    });
  }
});

/**
 * POST /api/notifications/send
 * Send a notification (admin only)
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { role, organizationId } = (req as AuthenticatedRequest).user;
    
    // Check if user has admin privileges
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to send notifications',
      });
    }

    const {
      type,
      title,
      message,
      severity = 'medium',
      userId,
      metadata,
      actionUrl,
      actionText,
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, title, message',
      });
    }

    const notificationId = await notificationService.sendNotification({
      type,
      title,
      message,
      severity,
      userId,
      organizationId,
      metadata,
      actionUrl,
      actionText,
    });

    res.status(201).json({
      success: true,
      data: { notificationId },
      message: 'Notification sent successfully',
    });
  } catch (error) {
    logger.error('Error sending notification', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
    });
  }
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the user
 */
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as AuthenticatedRequest).user;
    
    const preferences = await notificationService.getNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    logger.error('Error fetching notification preferences', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
    });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const preferences = req.body;

    const success = await notificationService.updateNotificationPreferences(userId, preferences);

    if (success) {
      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to update notification preferences',
      });
    }
  } catch (error) {
    logger.error('Error updating notification preferences', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
    });
  }
});

/**
 * GET /api/notifications/alerts/rules
 * Get alert rules for the organization
 */
router.get('/alerts/rules', async (req: Request, res: Response) => {
  try {
    const { organizationId } = (req as AuthenticatedRequest).user;
    
    const rules = await notificationService.getAlertRules(organizationId);

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    logger.error('Error fetching alert rules', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert rules',
    });
  }
});

/**
 * POST /api/notifications/alerts/rules
 * Create a new alert rule
 */
router.post('/alerts/rules', async (req: Request, res: Response) => {
  try {
    const { organizationId, role } = (req as AuthenticatedRequest).user;
    
    // Check if user has admin privileges
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to create alert rules',
      });
    }

    const {
      name,
      type,
      conditions,
      actions,
      isActive = true,
    } = req.body;

    if (!name || !type || !conditions || !actions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, type, conditions, actions',
      });
    }

    const ruleId = await notificationService.createAlertRule({
      name,
      type,
      organizationId,
      isActive,
      conditions,
      actions,
    });

    res.status(201).json({
      success: true,
      data: { ruleId },
      message: 'Alert rule created successfully',
    });
  } catch (error) {
    logger.error('Error creating alert rule', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create alert rule',
    });
  }
});

/**
 * PUT /api/notifications/alerts/rules/:id
 * Update an alert rule
 */
router.put('/alerts/rules/:id', async (req: Request, res: Response) => {
  try {
    const { role } = (req as AuthenticatedRequest).user;
    const { id: ruleId } = req.params;
    
    // Check if user has admin privileges
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update alert rules',
      });
    }

    const updates = req.body;
    const success = await notificationService.updateAlertRule(ruleId, updates);

    if (success) {
      res.json({
        success: true,
        message: 'Alert rule updated successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }
  } catch (error) {
    logger.error('Error updating alert rule', { error, ruleId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to update alert rule',
    });
  }
});

/**
 * DELETE /api/notifications/alerts/rules/:id
 * Delete an alert rule
 */
router.delete('/alerts/rules/:id', async (req: Request, res: Response) => {
  try {
    const { role } = (req as AuthenticatedRequest).user;
    const { id: ruleId } = req.params;
    
    // Check if user has admin privileges
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to delete alert rules',
      });
    }

    const success = await notificationService.deleteAlertRule(ruleId);

    if (success) {
      res.json({
        success: true,
        message: 'Alert rule deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }
  } catch (error) {
    logger.error('Error deleting alert rule', { error, ruleId: req.params.id });
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert rule',
    });
  }
});

/**
 * POST /api/notifications/alerts/check
 * Manually trigger alert checking (admin only)
 */
router.post('/alerts/check', async (req: Request, res: Response) => {
  try {
    const { organizationId, role } = (req as AuthenticatedRequest).user;
    
    // Check if user has admin privileges
    if (role !== 'admin' && role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to trigger alert checks',
      });
    }

    const { metrics } = req.body;

    if (!metrics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: metrics',
      });
    }

    await notificationService.checkAlerts(organizationId, metrics);

    res.json({
      success: true,
      message: 'Alert check completed successfully',
    });
  } catch (error) {
    logger.error('Error checking alerts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to check alerts',
    });
  }
});

export default router;