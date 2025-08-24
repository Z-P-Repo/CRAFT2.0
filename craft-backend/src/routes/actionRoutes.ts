import express from 'express';
import { ActionController } from '@/controllers/ActionController';
import { auth, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Action management routes (public for demo with optional auth for tracking)
router.get('/', optionalAuth, asyncHandler(ActionController.getActions));
router.get('/:id', optionalAuth, asyncHandler(ActionController.getActionById));
router.post('/', optionalAuth, asyncHandler(ActionController.createAction));
router.put('/:id', optionalAuth, asyncHandler(ActionController.updateAction));
router.delete('/:id', optionalAuth, asyncHandler(ActionController.deleteAction));

// Bulk operations (public for demo with optional auth for tracking)
router.put('/bulk/update', optionalAuth, asyncHandler(ActionController.bulkUpdateActions));
router.delete('/bulk/delete', optionalAuth, asyncHandler(ActionController.bulkDeleteActions));

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', asyncHandler(ActionController.getActionStats));

// Hierarchy and relationship routes
router.get('/:id/hierarchy', asyncHandler(ActionController.getActionHierarchy));

// Filter routes
router.get('/resource/:resourceType', asyncHandler(ActionController.getActionsByResourceType));
router.get('/category/:category', asyncHandler(ActionController.getActionsByCategory));
router.get('/risk/:riskLevel', asyncHandler(ActionController.getActionsByRiskLevel));

export default router;