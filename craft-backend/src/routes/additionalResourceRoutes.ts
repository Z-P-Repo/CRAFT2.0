import express from 'express';
import { AdditionalResourceController } from '@/controllers/AdditionalResourceController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Additional Resource management routes - view access for all, edit/delete for admins only
router.get('/', auth, AdditionalResourceController.getAdditionalResources);

// Specific routes must come before parameterized routes
router.get('/stats', auth, AdditionalResourceController.getAdditionalResourceStats);
router.post('/:id/evaluate', auth, AdditionalResourceController.evaluateAdditionalResource);

// Attribute management for additional resources
router.patch('/:id/attributes', auth, requireAdminOrSuperAdmin, AdditionalResourceController.updateAdditionalResourceAttributes);

router.get('/:id', auth, AdditionalResourceController.getAdditionalResourceById);
router.post('/', auth, requireAdminOrSuperAdmin, AdditionalResourceController.createAdditionalResource);
router.put('/:id', auth, requireAdminOrSuperAdmin, AdditionalResourceController.updateAdditionalResource);
router.delete('/:id', auth, requireAdminOrSuperAdmin, AdditionalResourceController.deleteAdditionalResource);

// Bulk operations - admins only
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, AdditionalResourceController.bulkDeleteAdditionalResources);

// Filter routes
router.get('/type/:type', auth, AdditionalResourceController.getAdditionalResourcesByType);

export default router;