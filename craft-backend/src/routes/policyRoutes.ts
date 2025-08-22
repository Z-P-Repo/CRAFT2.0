import express from 'express';
import { PolicyController } from '@/controllers/PolicyController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Policy management routes
router.get('/', asyncHandler(PolicyController.getPolicies));
router.get('/stats', asyncHandler(PolicyController.getPolicyStats));
router.get('/:id', asyncHandler(PolicyController.getPolicyById));
router.post('/', asyncHandler(PolicyController.createPolicy));
router.put('/:id', asyncHandler(PolicyController.updatePolicy));
router.delete('/:id', asyncHandler(PolicyController.deletePolicy));

// Policy evaluation
router.post('/evaluate', asyncHandler(PolicyController.evaluatePolicy));

// Filter routes
router.get('/effect/:effect', asyncHandler(PolicyController.getPoliciesByEffect));
router.get('/status/:status', asyncHandler(PolicyController.getPoliciesByStatus));

// Bulk operations
router.put('/bulk/update', asyncHandler(PolicyController.bulkUpdatePolicies));
router.delete('/bulk/delete', asyncHandler(PolicyController.bulkDeletePolicies));

export default router;