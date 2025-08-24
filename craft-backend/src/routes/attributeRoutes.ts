import express from 'express';
import { AttributeController } from '@/controllers/AttributeController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Attribute management routes (public for demo)
router.get('/', asyncHandler(AttributeController.getAttributes));
router.get('/:id', asyncHandler(AttributeController.getAttributeById));
router.post('/', asyncHandler(AttributeController.createAttribute));
router.put('/:id', asyncHandler(AttributeController.updateAttribute));
router.delete('/:id', asyncHandler(AttributeController.deleteAttribute));

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', asyncHandler(AttributeController.getAttributeStats));

// Validation routes
router.post('/:id/validate', asyncHandler(AttributeController.validateAttributeValue));

// Filter routes
router.get('/category/:category', asyncHandler(AttributeController.getAttributesByCategory));
router.get('/schema/:category', asyncHandler(AttributeController.getAttributeSchema));

// Bulk operations
router.put('/bulk/update', asyncHandler(AttributeController.bulkUpdateAttributes));
router.delete('/bulk/delete', asyncHandler(AttributeController.bulkDeleteAttributes));

export default router;