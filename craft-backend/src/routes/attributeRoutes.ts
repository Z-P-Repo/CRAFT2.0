import express from 'express';
import { AttributeController } from '@/controllers/AttributeController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Attribute management routes (public for demo)
router.get('/', AttributeController.getAttributes);
router.get('/:id', AttributeController.getAttributeById);
router.post('/', AttributeController.createAttribute);
router.put('/:id', AttributeController.updateAttribute);
router.delete('/:id', AttributeController.deleteAttribute);

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', AttributeController.getAttributeStats);

// Validation routes
router.post('/:id/validate', AttributeController.validateAttributeValue);

// Filter routes
router.get('/category/:category', AttributeController.getAttributesByCategory);
router.get('/schema/:category', AttributeController.getAttributeSchema);

// Bulk operations
router.put('/bulk/update', AttributeController.bulkUpdateAttributes);
router.delete('/bulk/delete', AttributeController.bulkDeleteAttributes);

export default router;