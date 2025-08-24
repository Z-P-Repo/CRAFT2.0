import express from 'express';
import { SubjectController } from '@/controllers/SubjectController';
import { auth, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Subject management routes (public for demo with optional auth for tracking)
router.get('/', optionalAuth, asyncHandler(SubjectController.getSubjects));
router.get('/:id', optionalAuth, asyncHandler(SubjectController.getSubjectById));
router.post('/', optionalAuth, asyncHandler(SubjectController.createSubject));
router.put('/:id', optionalAuth, asyncHandler(SubjectController.updateSubject));
router.delete('/:id', optionalAuth, asyncHandler(SubjectController.deleteSubject));

// Bulk operations (public for demo with optional auth for tracking)
router.put('/bulk/update', optionalAuth, asyncHandler(SubjectController.bulkUpdateSubjects));
router.delete('/bulk/delete', optionalAuth, asyncHandler(SubjectController.bulkDeleteSubjects));

// Apply authentication middleware to remaining routes
router.use(auth);
router.get('/stats', asyncHandler(SubjectController.getSubjectStats));

// Hierarchy and relationship routes
router.get('/:id/hierarchy', asyncHandler(SubjectController.getSubjectHierarchy));

// Filter routes
router.get('/type/:type', asyncHandler(SubjectController.getSubjectsByType));

export default router;