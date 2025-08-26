import express from 'express';
import { UserController } from '@/controllers/UserController';
import { auth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// User management routes
router.get('/', UserController.getUsers);
router.get('/stats', UserController.getUserStats);
router.get('/:id', UserController.getUserById);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

// Password management
router.put('/:id/change-password', UserController.changePassword);
router.put('/:id/toggle-status', UserController.toggleUserStatus);
router.put('/:id/change-role', UserController.changeUserRole);

// Bulk operations
router.put('/bulk/update', UserController.bulkUpdateUsers);
router.delete('/bulk/delete', UserController.bulkDeleteUsers);

export default router;