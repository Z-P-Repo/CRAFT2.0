import express from 'express';
import { ResourceController } from '@/controllers/ResourceController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Resource management routes
router.get('/', asyncHandler(ResourceController.getResources));
router.get('/stats', asyncHandler(ResourceController.getResourceStats));
router.get('/:id', asyncHandler(ResourceController.getResourceById));
router.post('/', asyncHandler(ResourceController.createResource));
router.put('/:id', asyncHandler(ResourceController.updateResource));
router.delete('/:id', asyncHandler(ResourceController.deleteResource));

// Tree and hierarchy routes
router.get('/tree/:rootId?', asyncHandler(ResourceController.getResourceTree));

// Filter routes
router.get('/type/:type', asyncHandler(ResourceController.getResourcesByType));
router.get('/classification/:classification', asyncHandler(ResourceController.getResourcesByClassification));

// Bulk operations
router.put('/bulk/update', asyncHandler(ResourceController.bulkUpdateResources));
router.delete('/bulk/delete', asyncHandler(ResourceController.bulkDeleteResources));

export default router;