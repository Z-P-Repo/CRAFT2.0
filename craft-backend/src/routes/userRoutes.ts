import express from 'express';
import { UserController } from '@/controllers/UserController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// User management routes
router.get('/', asyncHandler(UserController.getUsers));
router.get('/stats', asyncHandler(UserController.getUserStats));
router.get('/:id', asyncHandler(UserController.getUserById));
router.post('/', asyncHandler(UserController.createUser));
router.put('/:id', asyncHandler(UserController.updateUser));
router.delete('/:id', asyncHandler(UserController.deleteUser));

// Password management
router.put('/:id/change-password', asyncHandler(UserController.changePassword));
router.put('/:id/toggle-status', asyncHandler(UserController.toggleUserStatus));

// Bulk operations
router.put('/bulk/update', asyncHandler(UserController.bulkUpdateUsers));
router.delete('/bulk/delete', asyncHandler(UserController.bulkDeleteUsers));

export default router;