import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '@/controllers/AuthController';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';

const router = Router();
const authController = new AuthController();

// Login validation
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
];

// Register validation
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'basic'])
    .withMessage('Invalid role'),
  body('department')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Department cannot exceed 50 characters'),
];

// Change password validation
const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

// Refresh token validation
const refreshTokenValidation = [
  body('refreshToken')
    .isLength({ min: 1 })
    .withMessage('Refresh token is required'),
];

// Routes
router.post('/login', loginValidation, validateRequest, authController.login);
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/refresh-token', refreshTokenValidation, validateRequest, authController.refreshToken);
router.post('/change-password', requireAuth, changePasswordValidation, validateRequest, authController.changePassword);
router.post('/validate-token', authController.validateToken);
router.get('/profile', requireAuth, authController.getProfile);
router.post('/logout', requireAuth, authController.logout);

export default router;