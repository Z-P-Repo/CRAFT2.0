import express from 'express';
import { PolicyController } from '@/controllers/PolicyController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Apply optional authentication middleware to all routes (for demo purposes)
// router.use(auth);

// Policy management routes
router.get('/', PolicyController.getPolicies);
router.get('/stats', PolicyController.getPolicyStats);
router.get('/:id', PolicyController.getPolicyById);
router.post('/', PolicyController.createPolicy);
router.put('/:id', PolicyController.updatePolicy);
router.delete('/:id', PolicyController.deletePolicy);

// Policy evaluation
router.post('/evaluate', PolicyController.evaluatePolicy);

// Filter routes
router.get('/effect/:effect', PolicyController.getPoliciesByEffect);
router.get('/status/:status', PolicyController.getPoliciesByStatus);

// Bulk operations
router.put('/bulk/update', PolicyController.bulkUpdatePolicies);
router.delete('/bulk/delete', PolicyController.bulkDeletePolicies);

export default router;