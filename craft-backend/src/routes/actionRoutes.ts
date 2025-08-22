import express from 'express';
import { ActionController } from '@/controllers/ActionController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Action management routes
router.get('/', asyncHandler(ActionController.getActions));
router.get('/stats', asyncHandler(ActionController.getActionStats));
router.get('/:id', asyncHandler(ActionController.getActionById));
router.post('/', asyncHandler(ActionController.createAction));
router.put('/:id', asyncHandler(ActionController.updateAction));
router.delete('/:id', asyncHandler(ActionController.deleteAction));

// Hierarchy and relationship routes
router.get('/:id/hierarchy', asyncHandler(ActionController.getActionHierarchy));

// Filter routes
router.get('/resource/:resourceType', asyncHandler(ActionController.getActionsByResourceType));
router.get('/category/:category', asyncHandler(ActionController.getActionsByCategory));
router.get('/risk/:riskLevel', asyncHandler(ActionController.getActionsByRiskLevel));

// Bulk operations
router.put('/bulk/update', asyncHandler(ActionController.bulkUpdateActions));
router.delete('/bulk/delete', asyncHandler(ActionController.bulkDeleteActions));

export default router;