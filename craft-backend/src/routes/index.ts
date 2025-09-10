import { Router } from 'express';
import { Request, Response } from 'express';
import authRoutes from './auth';
import azureAdRoutes from './azureAdRoutes';
import userRoutes from './userRoutes';
import subjectRoutes from './subjectRoutes';
import resourceRoutes from './resourceRoutes';
import actionRoutes from './actionRoutes';
import attributeRoutes from './attributeRoutes';
import policyRoutes from './policyRoutes';
import activityRoutes from './activityRoutes';

// New hierarchical routes
import workspaceRoutes from './workspaces';
import applicationRoutes from './applications';
import environmentRoutes from './environments';
import settingsRoutes from './settings';
import { databaseConnection } from '@/config/database';
import { config } from '@/config/environment';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  const dbHealth = await databaseConnection.healthCheck();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: '1.0.0',
    database: dbHealth,
  });
});

// API info endpoint
router.get('/info', (req: Request, res: Response) => {
  res.status(200).json({
    name: 'CRAFT ABAC Permission System API',
    version: '1.0.0',
    description: 'Attribute-Based Access Control (ABAC) system backend API',
    documentation: `${req.protocol}://${req.get('host')}${config.apiPrefix}/docs`,
    endpoints: {
      auth: `${config.apiPrefix}/auth`,
      azureAd: `${config.apiPrefix}/azure-ad`,
      users: `${config.apiPrefix}/users`,
      settings: `${config.apiPrefix}/settings`,
      workspaces: `${config.apiPrefix}/workspaces`,
      subjects: `${config.apiPrefix}/subjects`,
      resources: `${config.apiPrefix}/resources`,
      actions: `${config.apiPrefix}/actions`,
      attributes: `${config.apiPrefix}/attributes`,
      policies: `${config.apiPrefix}/policies`,
      activities: `${config.apiPrefix}/activities`,
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/azure-ad', azureAdRoutes);
router.use('/users', userRoutes);

// New hierarchical settings and management routes
router.use('/settings', settingsRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/applications', applicationRoutes);
router.use('/workspaces/:workspaceId/applications/:applicationId/environments', environmentRoutes);

// Legacy flat routes (for backward compatibility)
router.use('/subjects', subjectRoutes);
router.use('/resources', resourceRoutes);
router.use('/actions', actionRoutes);
router.use('/attributes', attributeRoutes);
router.use('/policies', policyRoutes);
router.use('/activities', activityRoutes);

export default router;