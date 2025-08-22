import { Router } from 'express';
import { Request, Response } from 'express';
import authRoutes from './auth';
// import subjectRoutes from './subjects';
// import objectRoutes from './objects';
// import actionRoutes from './actions';
// import attributeRoutes from './attributes';
// import policyRoutes from './policies';
import { databaseConnection } from '@/config/database';
import { config } from '@/config/environment';

const router = Router();

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
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
      subjects: `${config.apiPrefix}/subjects`,
      objects: `${config.apiPrefix}/objects`,
      actions: `${config.apiPrefix}/actions`,
      attributes: `${config.apiPrefix}/attributes`,
      policies: `${config.apiPrefix}/policies`,
    },
  });
});

// Mount route modules
router.use('/auth', authRoutes);
// router.use('/subjects', subjectRoutes);
// router.use('/objects', objectRoutes);
// router.use('/actions', actionRoutes);
// router.use('/attributes', attributeRoutes);
// router.use('/policies', policyRoutes);

export default router;