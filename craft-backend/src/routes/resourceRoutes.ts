import express from 'express';
import { ResourceController } from '@/controllers/ResourceController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Resource management routes - view access for all, edit/delete for admins only
router.get('/', auth, ResourceController.getResources);

// Specific routes must come before parameterized routes
router.get('/dependency-graph', auth, ResourceController.getResourceDependencyGraph);

router.get('/:id', auth, ResourceController.getResourceById);
router.post('/', auth, requireAdminOrSuperAdmin, ResourceController.createResource);
router.put('/:id', auth, requireAdminOrSuperAdmin, ResourceController.updateResource);
router.delete('/:id', auth, requireAdminOrSuperAdmin, ResourceController.deleteResource);

// Bulk operations - admins only
router.put('/bulk/update', auth, requireAdminOrSuperAdmin, ResourceController.bulkUpdateResources);
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, ResourceController.bulkDeleteResources);

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', ResourceController.getResourceStats);

// Tree and hierarchy routes
router.get('/tree/:rootId?', ResourceController.getResourceTree);

// Filter routes
router.get('/type/:type', ResourceController.getResourcesByType);
router.get('/classification/:classification', ResourceController.getResourcesByClassification);

// Resource Dependency Management routes
router.post('/:resourceId/evaluate-access', auth, ResourceController.evaluateResourceAccess);
router.get('/accessible-resources', auth, ResourceController.getAccessibleResources);
router.put('/:resourceId/dependencies', auth, requireAdminOrSuperAdmin, ResourceController.updateResourceDependencies);
router.post('/validate-dependencies', auth, ResourceController.validateResourceDependencies);
router.get('/:resourceId/dependencies', auth, ResourceController.getResourceDependencies);

export default router;