import express from 'express';
import { PolicyController } from '@/controllers/PolicyController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Policy management routes - view access for all, edit/delete for admins only
// IMPORTANT: Specific routes MUST come before /:id to avoid route matching issues
router.get('/', auth, PolicyController.getPolicies);
router.get('/stats', auth, PolicyController.getPolicyStats);

// Filter routes - must come before /:id
router.get('/effect/:effect', auth, PolicyController.getPoliciesByEffect);
router.get('/status/:status', auth, PolicyController.getPoliciesByStatus);

// Policy evaluation - allow all authenticated users
router.post('/evaluate', auth, PolicyController.evaluatePolicy);

// Bulk operations - admins only - must come before /:id
router.put('/bulk/update', auth, requireAdminOrSuperAdmin, PolicyController.bulkUpdatePolicies);
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, PolicyController.bulkDeletePolicies);

// Generic ID routes - MUST come last to avoid catching specific routes
router.get('/:id', auth, PolicyController.getPolicyById);
router.post('/', auth, requireAdminOrSuperAdmin, PolicyController.createPolicy);
router.put('/:id', auth, requireAdminOrSuperAdmin, PolicyController.updatePolicy);
router.delete('/:id', auth, requireAdminOrSuperAdmin, PolicyController.deletePolicy);

export default router;