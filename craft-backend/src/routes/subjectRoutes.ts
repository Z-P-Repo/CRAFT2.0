import express from 'express';
import { SubjectController } from '@/controllers/SubjectController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Subject management routes - view access for all, edit/delete for admins only
router.get('/', auth, SubjectController.getSubjects);
router.get('/:id', auth, SubjectController.getSubjectById);
router.post('/', auth, requireAdminOrSuperAdmin, SubjectController.createSubject);
router.put('/:id', auth, requireAdminOrSuperAdmin, SubjectController.updateSubject);
router.delete('/:id', auth, requireAdminOrSuperAdmin, SubjectController.deleteSubject);

// Bulk operations - admins only
router.put('/bulk/update', auth, requireAdminOrSuperAdmin, SubjectController.bulkUpdateSubjects);
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, SubjectController.bulkDeleteSubjects);

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', SubjectController.getSubjectStats);

// Hierarchy and relationship routes
router.get('/:id/hierarchy', SubjectController.getSubjectHierarchy);

// Filter routes
router.get('/type/:type', SubjectController.getSubjectsByType);

export default router;