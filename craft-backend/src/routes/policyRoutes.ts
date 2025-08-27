import express from 'express';
import { PolicyController } from '@/controllers/PolicyController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Policy management routes - view access for all, edit/delete for admins only
router.get('/', auth, PolicyController.getPolicies);
router.get('/stats', auth, PolicyController.getPolicyStats);
router.get('/:id', auth, PolicyController.getPolicyById);
router.post('/', auth, requireAdminOrSuperAdmin, PolicyController.createPolicy);
router.put('/:id', auth, requireAdminOrSuperAdmin, PolicyController.updatePolicy);
router.delete('/:id', auth, requireAdminOrSuperAdmin, PolicyController.deletePolicy);

// Policy evaluation - allow all authenticated users
router.post('/evaluate', auth, PolicyController.evaluatePolicy);

// Filter routes
router.get('/effect/:effect', PolicyController.getPoliciesByEffect);
router.get('/status/:status', PolicyController.getPoliciesByStatus);

// Bulk operations - admins only
router.put('/bulk/update', auth, requireAdminOrSuperAdmin, PolicyController.bulkUpdatePolicies);
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, PolicyController.bulkDeletePolicies);

export default router;