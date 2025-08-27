import express from 'express';
import { AttributeController } from '@/controllers/AttributeController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Attribute management routes - view access for all, edit/delete for admins only
router.get('/', auth, AttributeController.getAttributes);
router.get('/:id', auth, AttributeController.getAttributeById);
router.post('/', auth, requireAdminOrSuperAdmin, AttributeController.createAttribute);
router.put('/:id', auth, requireAdminOrSuperAdmin, AttributeController.updateAttribute);
router.delete('/:id', auth, requireAdminOrSuperAdmin, AttributeController.deleteAttribute);

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', AttributeController.getAttributeStats);

// Validation routes
router.post('/:id/validate', AttributeController.validateAttributeValue);

// Filter routes
router.get('/category/:category', AttributeController.getAttributesByCategory);
router.get('/schema/:category', AttributeController.getAttributeSchema);

// Bulk operations - admins only
router.put('/bulk/update', auth, requireAdminOrSuperAdmin, AttributeController.bulkUpdateAttributes);
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, AttributeController.bulkDeleteAttributes);

export default router;