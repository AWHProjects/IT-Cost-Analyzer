import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { analysisEngine } from '../services/analysisEngine';

const router = Router();

// GET /api/analysis/cost-trends
router.get('/cost-trends', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId = 'default', months = 6 } = req.query;
  
  logger.info('Cost trends analysis requested', { organizationId, months });

  const trends = await analysisEngine.analyzeCostTrends(
    organizationId as string, 
    parseInt(months as string)
  );

  res.json({
    success: true,
    data: trends
  });
}));

// GET /api/analysis/license-utilization
router.get('/license-utilization', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId = 'default' } = req.query;
  
  logger.info('License utilization analysis requested', { organizationId });

  const utilization = await analysisEngine.analyzeLicenseUtilization(organizationId as string);

  res.json({
    success: true,
    data: utilization
  });
}));

// GET /api/analysis/savings-opportunities
router.get('/savings-opportunities', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId = 'default' } = req.query;
  
  logger.info('Savings opportunities analysis requested', { organizationId });

  const opportunities = await analysisEngine.identifySavingsOpportunities(organizationId as string);

  res.json({
    success: true,
    data: opportunities
  });
}));

// GET /api/analysis/usage-patterns
router.get('/usage-patterns', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId = 'default' } = req.query;
  
  logger.info('Usage patterns analysis requested', { organizationId });

  const patterns = await analysisEngine.analyzeUsagePatterns(organizationId as string);

  res.json({
    success: true,
    data: patterns
  });
}));

// GET /api/analysis/cost-forecast
router.get('/cost-forecast', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId = 'default', months = 6 } = req.query;
  
  logger.info('Cost forecast analysis requested', { organizationId, months });

  const forecast = await analysisEngine.generateCostForecast(
    organizationId as string,
    parseInt(months as string)
  );

  res.json({
    success: true,
    data: forecast
  });
}));

// GET /api/analysis/comprehensive-report
router.get('/comprehensive-report', asyncHandler(async (req: Request, res: Response) => {
  const { organizationId = 'default' } = req.query;
  
  logger.info('Comprehensive analysis report requested', { organizationId });

  const report = await analysisEngine.generateAnalysisReport(organizationId as string);

  res.json({
    success: true,
    data: report
  });
}));

export default router;