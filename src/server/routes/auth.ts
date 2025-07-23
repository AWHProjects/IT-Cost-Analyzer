import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/authMiddleware';
import { authService, LoginCredentials, RegisterData } from '../services/authService';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, organizationName }: RegisterData = req.body;

  // Basic validation
  if (!email || !name || !password) {
    res.status(400).json({
      success: false,
      message: 'Email, name, and password are required'
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
    return;
  }

  logger.info('User registration attempt', { email, organizationName });

  const result = await authService.register({
    email,
    name,
    password,
    organizationName
  });

  if (result.success) {
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        token: result.token
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: result.message
    });
  }
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: LoginCredentials = req.body;

  // Basic validation
  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
    return;
  }

  logger.info('User login attempt', { email });

  const result = await authService.login({ email, password });

  if (result.success) {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: result.message
    });
  }
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
    return;
  }

  const result = await authService.refreshToken(token);

  if (result.success) {
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        token: result.token
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: result.message
    });
  }
}));

// GET /api/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
}));

// POST /api/auth/logout
router.post('/logout', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // In a real implementation, you might want to blacklist the token
  // For now, we'll just return success since JWT tokens are stateless
  
  logger.info('User logout', { userId: req.user?.id });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// GET /api/auth/organizations
router.get('/organizations', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  res.json({
    success: true,
    data: {
      organizations: req.user.organizations
    }
  });
}));

export default router;