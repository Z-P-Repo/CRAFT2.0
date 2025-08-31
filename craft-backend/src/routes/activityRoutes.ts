import { Router } from 'express';
import { ActivityController } from '../controllers/ActivityController';
import { auth } from '../middleware/auth';

const router = Router();
const activityController = new ActivityController();

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route GET /api/v1/activities
 * @desc Get all activities with optional filtering
 * @access Private
 */
router.get('/', activityController.getActivities);

/**
 * @route GET /api/v1/activities/stats
 * @desc Get activity statistics
 * @access Private
 */
router.get('/stats', activityController.getActivityStats);

/**
 * @route GET /api/v1/activities/:id
 * @desc Get a specific activity by ID
 * @access Private
 */
router.get('/:id', activityController.getActivity);

/**
 * @route POST /api/v1/activities
 * @desc Create a new activity
 * @access Private
 */
router.post('/', activityController.createActivity);

/**
 * @route POST /api/v1/activities/export
 * @desc Export activities to CSV/JSON
 * @access Private
 */
router.post('/export', activityController.exportActivities);

export default router;