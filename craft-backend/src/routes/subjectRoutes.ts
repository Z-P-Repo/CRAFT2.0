import express from 'express';
import { SubjectController } from '@/controllers/SubjectController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Subject management routes
router.get('/', asyncHandler(SubjectController.getSubjects));
router.get('/stats', asyncHandler(SubjectController.getSubjectStats));
router.get('/:id', asyncHandler(SubjectController.getSubjectById));
router.post('/', asyncHandler(SubjectController.createSubject));
router.put('/:id', asyncHandler(SubjectController.updateSubject));
router.delete('/:id', asyncHandler(SubjectController.deleteSubject));

// Hierarchy and relationship routes
router.get('/:id/hierarchy', asyncHandler(SubjectController.getSubjectHierarchy));

// Filter routes
router.get('/type/:type', asyncHandler(SubjectController.getSubjectsByType));

// Bulk operations
router.put('/bulk/update', asyncHandler(SubjectController.bulkUpdateSubjects));
router.delete('/bulk/delete', asyncHandler(SubjectController.bulkDeleteSubjects));

export default router;