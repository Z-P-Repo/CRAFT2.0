import express from 'express';
import { ResourceController } from '@/controllers/ResourceController';
import { auth, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Resource management routes (public for demo with optional auth for tracking)
router.get('/', optionalAuth, asyncHandler(ResourceController.getResources));
router.get('/:id', optionalAuth, asyncHandler(ResourceController.getResourceById));
router.post('/', optionalAuth, asyncHandler(ResourceController.createResource));
router.put('/:id', optionalAuth, asyncHandler(ResourceController.updateResource));
router.delete('/:id', optionalAuth, asyncHandler(ResourceController.deleteResource));

// Bulk operations (public for demo with optional auth for tracking)
router.put('/bulk/update', optionalAuth, asyncHandler(ResourceController.bulkUpdateResources));
router.delete('/bulk/delete', optionalAuth, asyncHandler(ResourceController.bulkDeleteResources));

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', asyncHandler(ResourceController.getResourceStats));

// Tree and hierarchy routes
router.get('/tree/:rootId?', asyncHandler(ResourceController.getResourceTree));

// Filter routes
router.get('/type/:type', asyncHandler(ResourceController.getResourcesByType));
router.get('/classification/:classification', asyncHandler(ResourceController.getResourcesByClassification));

export default router;