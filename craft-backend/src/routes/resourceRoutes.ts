import express from 'express';
import { ResourceController } from '@/controllers/ResourceController';
import { auth, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Resource management routes (public for demo with optional auth for tracking)
router.get('/', optionalAuth, ResourceController.getResources);
router.get('/:id', optionalAuth, ResourceController.getResourceById);
router.post('/', optionalAuth, ResourceController.createResource);
router.put('/:id', optionalAuth, ResourceController.updateResource);
router.delete('/:id', optionalAuth, ResourceController.deleteResource);

// Bulk operations (public for demo with optional auth for tracking)
router.put('/bulk/update', optionalAuth, ResourceController.bulkUpdateResources);
router.delete('/bulk/delete', optionalAuth, ResourceController.bulkDeleteResources);

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', ResourceController.getResourceStats);

// Tree and hierarchy routes
router.get('/tree/:rootId?', ResourceController.getResourceTree);

// Filter routes
router.get('/type/:type', ResourceController.getResourcesByType);
router.get('/classification/:classification', ResourceController.getResourcesByClassification);

export default router;