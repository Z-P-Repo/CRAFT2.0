import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Application, IApplication } from '../models/Application';
import { Workspace } from '../models/Workspace';
import { Environment } from '../models/Environment';
import { requireAuth } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router({ mergeParams: true });

// Validation middleware
const validateApplication = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z0-9][a-zA-Z0-9\s\-_\.]*[a-zA-Z0-9]$/)
    .withMessage('Name must be 2-50 characters, start/end with alphanumeric, and contain only letters, numbers, spaces, hyphens, underscores, and dots'),
  body('displayName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2-100 characters'),
  body('type')
    .isIn(['web', 'api', 'mobile', 'desktop', 'service', 'microservice'])
    .withMessage('Invalid application type')
];

const validateIds = [
  param('workspaceId').isMongoId().withMessage('Invalid workspace ID'),
  param('applicationId').optional().isMongoId().withMessage('Invalid application ID')
];

// GET /api/workspaces/:workspaceId/applications - List applications in workspace
router.get('/', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const { page = 1, limit = 10, search, type, status = 'all' } = req.query;
    const userId = (req as any).user._id;
    const userRole = (req as any).user.role;
    const user = (req as any).user;

    // Verify workspace access - include basic users with assigned workspaces
    let workspaceQuery: any = {
      _id: workspaceId,
      active: true
    };

    if (userRole === 'basic' || userRole === 'admin') {
      // Admin and basic users can only access workspaces they're assigned to
      const assignedWorkspaces = user.assignedWorkspaces || [];
      if (assignedWorkspaces.length > 0) {
        workspaceQuery.$or = [
          { 'metadata.owner': userId },
          { 'metadata.admins': userId },
          { _id: { $in: assignedWorkspaces } }
        ];
      } else {
        // User with no assigned workspaces - no access
        workspaceQuery._id = null;
      }
    } else {
      // Super admin users - only owner/admin access
      workspaceQuery.$or = [
        { 'metadata.owner': userId },
        { 'metadata.admins': userId }
      ];
    }

    const workspace = await Workspace.findOne(workspaceQuery);

    if (!workspace) {
      return void res.status(404).json({
        success: false,
        error: 'Workspace not found'
      });
    }

    const query: any = { workspaceId, active: true };

    // Apply application filtering for admin and basic users
    if (userRole === 'basic' || userRole === 'admin') {
      const assignedApplications = user.assignedApplications || [];
      if (assignedApplications.length > 0) {
        query._id = { $in: assignedApplications };
      } else {
        // User with no assigned applications - no access
        query._id = null; // This will return no results
      }
    }

    // Note: We filter by active field, not status field
    // The status field is for application lifecycle, active field is for soft delete
    if (status !== 'all' && status !== 'active') {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const applications = await Application.find(query)
      .populate('environmentsCount')
      .populate('metadata.createdBy', 'firstName lastName email')
      .populate('metadata.lastModifiedBy', 'firstName lastName email')
      .populate('metadata.owner', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Application.countDocuments(query);

    const response: PaginatedResponse<IApplication> = {
      success: true,
      data: applications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications'
    });
  }
});

// POST /api/workspaces/:workspaceId/applications - Create application
router.post('/', requireAuth, validateIds, validateApplication, async (req: Request, res: Response): Promise<void> => {
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
    const { name, displayName, description, type, configuration } = req.body;

    // Verify workspace access
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

    // Check if application name exists in workspace (only active applications)
    const existingApp = await Application.findOne({ workspaceId, name, active: true });
    if (existingApp) {
      return void res.status(409).json({
        success: false,
        error: 'Application name already exists in this workspace'
      });
    }

    const application = new Application({
      workspaceId,
      name,
      displayName,
      description,
      type,
      configuration: configuration || {},
      metadata: {
        owner: userId,
        maintainers: [],
        createdBy: userId,
        lastModifiedBy: userId,
        tags: [],
        version: '1.0.0'
      }
    });

    await application.save();

    const response: ApiResponse<IApplication> = {
      success: true,
      data: application,
      message: 'Application created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create application'
    });
  }
});

// GET /api/workspaces/:workspaceId/applications/:applicationId - Get application
router.get('/:applicationId', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId } = req.params;
    const userId = (req as any).user._id;

    // Verify workspace access
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

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    }).populate('environmentsCount')
      .populate('metadata.createdBy', 'firstName lastName email')
      .populate('metadata.lastModifiedBy', 'firstName lastName email')
      .populate('metadata.owner', 'firstName lastName email');

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const response: ApiResponse<IApplication> = {
      success: true,
      data: application
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application'
    });
  }
});

// PUT /api/workspaces/:workspaceId/applications/:applicationId - Update application
router.put('/:applicationId', requireAuth, validateIds, validateApplication, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workspaceId, applicationId } = req.params;
    const userId = (req as any).user._id;
    const { name, displayName, description, type, configuration } = req.body;

    // Verify workspace access
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

    // Check if application name exists in workspace (exclude current app)
    const existingApp = await Application.findOne({ 
      workspaceId, 
      name, 
      _id: { $ne: applicationId },
      active: true
    });
    
    if (existingApp) {
      return void res.status(409).json({
        success: false,
        error: 'Application name already exists in this workspace'
      });
    }

    const application = await Application.findOneAndUpdate(
      { _id: applicationId, workspaceId, active: true },
      {
        name,
        displayName,
        description,
        type,
        configuration,
        'metadata.lastModifiedBy': userId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const response: ApiResponse<IApplication> = {
      success: true,
      data: application,
      message: 'Application updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update application'
    });
  }
});

// DELETE /api/workspaces/:workspaceId/applications/:applicationId - Delete application
router.delete('/:applicationId', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId } = req.params;
    const userId = (req as any).user._id;

    // Verify workspace access
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

    // Check if application has active environments
    const environmentCount = await Environment.countDocuments({
      applicationId,
      active: true
    });

    if (environmentCount > 0) {
      return void res.status(409).json({
        success: false,
        error: `Cannot delete application. ${environmentCount} environment(s) must be deleted first.`,
        details: {
          dependentCount: environmentCount,
          dependentType: 'environments'
        }
      });
    }

    // Soft delete the application
    const application = await Application.findOneAndUpdate(
      { _id: applicationId, workspaceId, active: true },
      {
        active: false,
        'metadata.lastModifiedBy': userId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Application deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete application'
    });
  }
});

export default router;