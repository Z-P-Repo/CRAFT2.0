import express from 'express';
import { PolicyController } from '@/controllers/PolicyController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Policy management routes
router.get('/', PolicyController.getPolicies);
router.get('/stats', PolicyController.getPolicyStats);
router.get('/:id', PolicyController.getPolicyById);
router.post('/', auth, PolicyController.createPolicy);
router.put('/:id', auth, PolicyController.updatePolicy);
router.delete('/:id', auth, PolicyController.deletePolicy);

// Policy evaluation
router.post('/evaluate', auth, PolicyController.evaluatePolicy);

// Filter routes
router.get('/effect/:effect', PolicyController.getPoliciesByEffect);
router.get('/status/:status', PolicyController.getPoliciesByStatus);

// Bulk operations
router.put('/bulk/update', auth, PolicyController.bulkUpdatePolicies);
router.delete('/bulk/delete', auth, PolicyController.bulkDeletePolicies);

export default router;