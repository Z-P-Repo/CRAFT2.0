import express from 'express';
import { ActionController } from '@/controllers/ActionController';
import { auth, optionalAuth } from '@/middleware/auth';

const router = express.Router();

// Action management routes (public for demo with optional auth for tracking)
router.get('/', optionalAuth, ActionController.getActions);
router.get('/:id', optionalAuth, ActionController.getActionById);
router.post('/', optionalAuth, ActionController.createAction);
router.put('/:id', optionalAuth, ActionController.updateAction);
router.delete('/:id', optionalAuth, ActionController.deleteAction);

// Bulk operations (public for demo with optional auth for tracking)
router.put('/bulk/update', optionalAuth, ActionController.bulkUpdateActions);
router.delete('/bulk/delete', optionalAuth, ActionController.bulkDeleteActions);

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', ActionController.getActionStats);

// Hierarchy and relationship routes
router.get('/:id/hierarchy', ActionController.getActionHierarchy);

// Filter routes
router.get('/resource/:resourceType', ActionController.getActionsByResourceType);
router.get('/category/:category', ActionController.getActionsByCategory);
router.get('/risk/:riskLevel', ActionController.getActionsByRiskLevel);

export default router;