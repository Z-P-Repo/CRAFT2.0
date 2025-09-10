import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Environment, IEnvironment } from '../models/Environment';
import { Workspace } from '../models/Workspace';
import { Application } from '../models/Application';
import { requireAuth } from '../middleware/auth';
import { ApiResponse, PaginatedResponse } from '../types';

const router = Router({ mergeParams: true });

// Validation middleware
const validateEnvironment = [
  body('name')
    .matches(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)
    .withMessage('Name must be lowercase alphanumeric with hyphens'),
  body('displayName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be 2-100 characters'),
  body('type')
    .isIn(['development', 'testing', 'staging', 'production', 'preview', 'hotfix'])
    .withMessage('Invalid environment type')
];

const validateIds = [
  param('workspaceId').isMongoId().withMessage('Invalid workspace ID'),
  param('applicationId').isMongoId().withMessage('Invalid application ID'),
  param('environmentId').optional().isMongoId().withMessage('Invalid environment ID')
];

// GET /api/workspaces/:workspaceId/applications/:applicationId/environments
router.get('/', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId } = req.params;
    const { page = 1, limit = 10, search, type, status = 'active' } = req.query;
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

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    });

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const query: any = { workspaceId, applicationId, active: true };

    if (status !== 'all') {
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
    const environments = await Environment.find(query)
      .populate(['policiesCount', 'subjectsCount', 'resourcesCount'])
      .populate('metadata.createdBy', 'firstName lastName email')
      .populate('metadata.lastModifiedBy', 'firstName lastName email')
      .populate('metadata.owner', 'firstName lastName email')
      .sort({ 'metadata.isDefault': -1, updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Environment.countDocuments(query);

    const response: PaginatedResponse<IEnvironment> = {
      success: true,
      data: environments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching environments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environments'
    });
  }
});

// POST /api/workspaces/:workspaceId/applications/:applicationId/environments
router.post('/', requireAuth, validateIds, validateEnvironment, async (req: Request, res: Response): Promise<void> => {
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
    const { name, displayName, description, type, configuration, isDefault = false } = req.body;

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

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    });

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if environment name exists in application
    const existingEnv = await Environment.findOne({ workspaceId, applicationId, name });
    if (existingEnv) {
      return void res.status(409).json({
        success: false,
        error: 'Environment name already exists in this application'
      });
    }

    const environment = new Environment({
      workspaceId,
      applicationId,
      name,
      displayName,
      description,
      type,
      configuration: configuration || {
        variables: new Map(),
        endpoints: new Map(),
        features: new Map()
      },
      metadata: {
        owner: userId,
        createdBy: userId,
        lastModifiedBy: userId,
        tags: [],
        isDefault: isDefault || false
      }
    });

    await environment.save();

    const response: ApiResponse<IEnvironment> = {
      success: true,
      data: environment,
      message: 'Environment created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create environment'
    });
  }
});

// GET /api/workspaces/:workspaceId/applications/:applicationId/environments/:environmentId
router.get('/:environmentId', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId, environmentId } = req.params;
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

    const environment = await Environment.findOne({
      _id: environmentId,
      workspaceId,
      applicationId,
      active: true
    }).populate(['policiesCount', 'subjectsCount', 'resourcesCount']);

    if (!environment) {
      return void res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }

    const response: ApiResponse<IEnvironment> = {
      success: true,
      data: environment
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch environment'
    });
  }
});

// PUT /api/workspaces/:workspaceId/applications/:applicationId/environments/:environmentId
router.put('/:environmentId', requireAuth, validateIds, validateEnvironment, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { workspaceId, applicationId, environmentId } = req.params;
    const userId = (req as any).user._id;
    const { name, displayName, description, type, configuration, isDefault = false } = req.body;

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

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    });

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if environment name exists in application (exclude current env)
    const existingEnv = await Environment.findOne({ 
      workspaceId, 
      applicationId, 
      name, 
      _id: { $ne: environmentId },
      active: true
    });
    
    if (existingEnv) {
      return void res.status(409).json({
        success: false,
        error: 'Environment name already exists in this application'
      });
    }

    const environment = await Environment.findOneAndUpdate(
      { _id: environmentId, workspaceId, applicationId, active: true },
      {
        name,
        displayName,
        description,
        type,
        configuration,
        'metadata.lastModifiedBy': userId,
        'metadata.isDefault': isDefault,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!environment) {
      return void res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }

    const response: ApiResponse<IEnvironment> = {
      success: true,
      data: environment,
      message: 'Environment updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update environment'
    });
  }
});

// DELETE /api/workspaces/:workspaceId/applications/:applicationId/environments/:environmentId
router.delete('/:environmentId', requireAuth, validateIds, async (req: Request, res: Response): Promise<void> => {
  try {
    const { workspaceId, applicationId, environmentId } = req.params;
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

    const application = await Application.findOne({
      _id: applicationId,
      workspaceId,
      active: true
    });

    if (!application) {
      return void res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check if environment has policies, subjects, or resources
    const [policyCount, subjectCount, resourceCount] = await Promise.all([
      mongoose.model('Policy').countDocuments({ environmentId, active: true }),
      mongoose.model('Subject').countDocuments({ environmentId, active: true }),
      mongoose.model('Resource').countDocuments({ environmentId, active: true })
    ]);

    const totalDependencies = policyCount + subjectCount + resourceCount;
    
    if (totalDependencies > 0) {
      const dependencies = [];
      if (policyCount > 0) dependencies.push(`${policyCount} policy(ies)`);
      if (subjectCount > 0) dependencies.push(`${subjectCount} subject(s)`);
      if (resourceCount > 0) dependencies.push(`${resourceCount} resource(s)`);
      
      return void res.status(409).json({
        success: false,
        error: `Cannot delete environment. ${dependencies.join(', ')} must be deleted first.`,
        details: {
          dependentCount: totalDependencies,
          dependentTypes: ['policies', 'subjects', 'resources'].filter((type, index) => {
            const counts = [policyCount, subjectCount, resourceCount];
            return counts[index] && counts[index] > 0;
          })
        }
      });
    }

    // Soft delete the environment
    const environment = await Environment.findOneAndUpdate(
      { _id: environmentId, workspaceId, applicationId, active: true },
      {
        active: false,
        'metadata.lastModifiedBy': userId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!environment) {
      return void res.status(404).json({
        success: false,
        error: 'Environment not found'
      });
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Environment deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting environment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete environment'
    });
  }
});

export default router;