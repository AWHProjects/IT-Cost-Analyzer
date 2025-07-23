import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../utils/logger';

// General rate limiter
const generalLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 900, // Per 15 minutes (900 seconds)
  blockDuration: 900, // Block for 15 minutes if limit exceeded
});

// Auth rate limiter (more restrictive)
const authLimiter = new RateLimiterMemory({
  points: 5, // Number of requests
  duration: 900, // Per 15 minutes
  blockDuration: 1800, // Block for 30 minutes if limit exceeded
});

// Upload rate limiter
const uploadLimiter = new RateLimiterMemory({
  points: 10, // Number of requests
  duration: 3600, // Per 1 hour
  blockDuration: 3600, // Block for 1 hour if limit exceeded
});

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.ip || 'unknown';
    await generalLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      remainingPoints: rejRes.remainingPoints,
      msBeforeNext: rejRes.msBeforeNext
    });

    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: secs
    });
  }
};

export const authRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.ip || 'unknown';
    await authLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: secs
    });
  }
};

export const uploadRateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const key = req.ip || 'unknown';
    await uploadLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    
    logger.warn(`Upload rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent')
    });

    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many upload attempts, please try again later.',
      retryAfter: secs
    });
  }
};

// Rate limiter for specific user (requires authentication)
export const createUserRateLimiter = (points: number = 50, duration: number = 3600) => {
  const userLimiter = new RateLimiterMemory({
    points,
    duration,
    blockDuration: duration,
  });

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = (req as any).user?.id || req.ip || 'unknown';
      await userLimiter.consume(key);
      next();
    } catch (rejRes: any) {
      const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
      
      logger.warn(`User rate limit exceeded`, {
        userId: (req as any).user?.id,
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      res.set('Retry-After', String(secs));
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for this user, please try again later.',
        retryAfter: secs
      });
    }
  };
};