import express from 'express';
import { ActionController } from '@/controllers/ActionController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';

const router = express.Router();

// Action management routes - view access for all, edit/delete for admins only
router.get('/', auth, ActionController.getActions);
router.get('/:id', auth, ActionController.getActionById);
router.post('/', auth, requireAdminOrSuperAdmin, ActionController.createAction);
router.put('/:id', auth, requireAdminOrSuperAdmin, ActionController.updateAction);
router.delete('/:id', auth, requireAdminOrSuperAdmin, ActionController.deleteAction);

// Bulk operations - admins only
router.put('/bulk/update', auth, requireAdminOrSuperAdmin, ActionController.bulkUpdateActions);
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, ActionController.bulkDeleteActions);

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