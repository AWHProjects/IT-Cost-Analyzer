import { Application } from 'express';
import authRoutes from './auth';
import analysisRoutes from './analysis';
import connectorsRoutes from './connectors';
import reportsRoutes from './reports';
import notificationsRoutes from './notifications';
import securityRoutes from './security';

export const setupRoutes = (app: Application): void => {
  // API base path
  const API_PREFIX = '/api';

  // Health check (already defined in main server file)
  
  // Authentication routes
  app.use(`${API_PREFIX}/auth`, authRoutes);
  
  // Advanced analysis routes
  app.use(`${API_PREFIX}/analysis`, analysisRoutes);
  
  // SaaS connectors routes
  app.use(`${API_PREFIX}/connectors`, connectorsRoutes);
  
  // Reporting and export routes
  app.use(`${API_PREFIX}/reports`, reportsRoutes);
  
  // Notifications and alerts routes
  app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
  
  // Security and compliance routes
  app.use(`${API_PREFIX}/security`, securityRoutes);
};