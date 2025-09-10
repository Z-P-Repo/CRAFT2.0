import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { Workspace, IWorkspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { Environment } from '../models/Environment';
import { requireAuth } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router();

// Validation middleware
const validateWorkspace = [
  body('name')
    .matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .withMessage('Name must be lowercase alphanumeric with hyphens'),
  body('displayName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2-100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const validateWorkspaceId = [
  param('workspaceId')
    .isMongoId()
    .withMessage('Invalid workspace ID format')
];

// GET /api/workspaces - List workspaces user has access to
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, search, status = 'active' } = req.query;
    const userId = (req as any).user._id.toString();

    // Build query for workspaces user has access to
    const query: any = {
      $or: [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ],
      active: true
    };

    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { displayName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const workspaces = await Workspace.find(query)
      .populate('applicationsCount')
      .populate('metadata.createdBy', 'firstName lastName email')
      .populate('metadata.lastModifiedBy', 'firstName lastName email')
      .populate('metadata.owner', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Workspace.countDocuments(query);

    const response: PaginatedResponse<IWorkspace> = {
      success: true,
      data: workspaces,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspaces'
    });
  }
});

// POST /api/workspaces - Create new workspace
router.post('/', requireAuth, validateWorkspace, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = (req as any).user._id;
    const { name, displayName, description, settings, limits } = req.body;

    // Check if workspace name already exists
    const existingWorkspace = await Workspace.findOne({ name });
    if (existingWorkspace) {
      return void res.status(409).json({
        success: false,
        error: 'Workspace name already exists'
      });
    }

    const workspace = new Workspace({
      name,
      displayName,
      description,
      settings: settings || {},
      limits: limits || {},
      metadata: {
        owner: userId,
        admins: [],
        createdBy: userId,
        lastModifiedBy: userId,
        tags: [],
        isSystem: false,
        plan: 'free'
      }
    });

    await workspace.save();

    const response: ApiResponse<IWorkspace> = {
      success: true,
      data: workspace,
      message: 'Workspace created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create workspace'
    });
  }
});

// GET /api/workspaces/:workspaceId - Get workspace details
router.get('/:workspaceId', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Invalid workspace ID',
        details: errors.array()
      });
    }

    const { workspaceId } = req.params;
    const userId = (req as any).user._id;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ],
      active: true
    }).populate('applicationsCount');

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const response: ApiResponse<IWorkspace> = {
      success: true,
      data: workspace
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace'
    });
  }
});

// PUT /api/workspaces/:workspaceId - Update workspace
router.put('/:workspaceId', requireAuth, validateWorkspaceId, validateWorkspace, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workspaceId } = req.params;
    const userId = (req as any).user._id;
    const { displayName, description, settings, limits } = req.body;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ],
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Check if user has permission to update
    if (!workspace.isOwner(userId) && !workspace.isAdmin(userId)) {
      return void res.status(403).json({
        success: false,
        error: 'Insufficient permissions to update workspace'
      });
    }

    // Update fields
    if (displayName) workspace.displayName = displayName;
    if (description !== undefined) workspace.description = description;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };
    if (limits) workspace.limits = { ...workspace.limits, ...limits };
    
    workspace.metadata.lastModifiedBy = userId;

    await workspace.save();

    const response: ApiResponse<IWorkspace> = {
      success: true,
      data: workspace,
      message: 'Workspace updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workspace'
    });
  }
});

// DELETE /api/workspaces/:workspaceId - Delete workspace (soft delete)
router.delete('/:workspaceId', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Invalid workspace ID',
        details: errors.array()
      });
    }

    const { workspaceId } = req.params;
    const userId = (req as any).user._id;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'metadata.owner': userId,
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found or insufficient permissions'
      });
    }

    // Check for applications and environments
    const applicationCount = await Application.countDocuments({ workspaceId, active: true });
    if (applicationCount > 0) {
      return void res.status(400).json({
        success: false,
        error: 'Cannot delete workspace with existing applications'
      });
    }

    // Soft delete
    workspace.active = false;
    workspace.status = 'deleted';
    workspace.metadata.lastModifiedBy = userId;
    await workspace.save();

    const response: ApiResponse = {
      success: true,
      message: 'Workspace deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete workspace'
    });
  }
});

// GET /api/workspaces/:workspaceId/stats - Get workspace statistics
router.get('/:workspaceId/stats', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const userId = (req as any).user._id;

    // Verify access
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ],
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    // Get statistics
    const [applications, environments] = await Promise.all([
      Application.countDocuments({ workspaceId, active: true }),
      Environment.countDocuments({ workspaceId, active: true })
    ]);

    const stats = {
      applications,
      environments,
      limits: workspace.limits,
      usage: {
        applications: applications,
        environments: environments,
        storageUsed: 0, // TODO: Calculate actual storage usage
        apiCallsThisMonth: 0 // TODO: Get from activity logs
      }
    };

    const response: ApiResponse<any> = {
      success: true,
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching workspace stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch workspace statistics'
    });
  }
});

// POST /api/workspaces/:workspaceId/admins - Add admin to workspace
router.post('/:workspaceId/admins', requireAuth, validateWorkspaceId, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { userId: newAdminId } = req.body;
    const currentUserId = (req as any).user.id;

    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'metadata.owner': currentUserId,
      active: true
    });

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found or insufficient permissions'
      });
    }

    workspace.addAdmin(newAdminId);
    workspace.metadata.lastModifiedBy = currentUserId;
    await workspace.save();

    const response: ApiResponse = {
      success: true,
      message: 'Admin added successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add admin'
    });
  }
});

export default router;