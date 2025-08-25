import express from 'express';
import { SubjectController } from '@/controllers/SubjectController';
import { auth, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Subject management routes (public for demo with optional auth for tracking)
router.get('/', optionalAuth, SubjectController.getSubjects);
router.get('/:id', optionalAuth, SubjectController.getSubjectById);
router.post('/', optionalAuth, SubjectController.createSubject);
router.put('/:id', optionalAuth, SubjectController.updateSubject);
router.delete('/:id', optionalAuth, SubjectController.deleteSubject);

// Bulk operations (public for demo with optional auth for tracking)
router.put('/bulk/update', optionalAuth, SubjectController.bulkUpdateSubjects);
router.delete('/bulk/delete', optionalAuth, SubjectController.bulkDeleteSubjects);

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', SubjectController.getSubjectStats);

// Hierarchy and relationship routes
router.get('/:id/hierarchy', SubjectController.getSubjectHierarchy);

// Filter routes
router.get('/type/:type', SubjectController.getSubjectsByType);

export default router;