import express from 'express';
import { UserController } from '@/controllers/UserController';
import { auth, requireAdminOrSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();

// User management routes - view access for all, edit/delete for admins only
router.get('/', auth, UserController.getUsers);
router.get('/stats', auth, UserController.getUserStats);
router.get('/:id', auth, UserController.getUserById);
router.post('/', auth, requireAdminOrSuperAdmin, UserController.createUser);
router.put('/:id', auth, requireAdminOrSuperAdmin, UserController.updateUser);
router.delete('/:id', auth, requireAdminOrSuperAdmin, UserController.deleteUser);

// Password management - admins only
router.put('/:id/change-password', auth, requireAdminOrSuperAdmin, UserController.changePassword);
router.put('/:id/toggle-status', auth, requireAdminOrSuperAdmin, UserController.toggleUserStatus);
router.put('/:id/change-role', auth, requireAdminOrSuperAdmin, UserController.changeUserRole);

// Bulk operations - admins only
router.put('/bulk/update', auth, requireAdminOrSuperAdmin, UserController.bulkUpdateUsers);
router.delete('/bulk/delete', auth, requireAdminOrSuperAdmin, UserController.bulkDeleteUsers);

export default router;